# 3. Architecture

How the code is arranged, and why. Read [02-USER_MANUAL.md](02-USER_MANUAL.md) first — this
assumes you know what the system does.

## The shape of it

```
Browser (React + Vite)
        │  relative /api, proxied by Vite in development
        ▼
Express (backend/src/app.js)
        │  middleware: helmet → cors → body parsing → rate limit
        │              → route → auth → role → suspension check
        ▼
Models (backend/src/models)   ← all SQL lives here
        ▼
MySQL / MariaDB
```

There is no ORM. Models hold parameterised SQL and the rules around it; controllers do
HTTP and nothing else.

## Backend layout

| Folder | Holds | Rule it follows |
| --- | --- | --- |
| `src/app.js` | The Express app — routes and middleware, nothing that binds a port | So tests can drive the real app through supertest |
| `src/server.js` | Listening, and the background sweep | The only file that starts anything |
| `src/config/db.js` | The pool, schema creation, migrations | The single definition of the schema |
| `src/routes/` | URL → handler, with the middleware each needs | No logic |
| `src/controllers/` | Read the request, call a model, choose a status code | No SQL |
| `src/models/` | SQL and the rules enforced around it | Where a rule belongs if it must always hold |
| `src/middleware/` | Auth, roles, suspension, rate limits, uploads, errors | Cross-cutting checks |
| `src/services/` | Delivery pricing and place lookup | No database |
| `src/utils/` | Account-id resolution, category lookup | Small, shared |
| `tests/` | Integration and unit tests | See [06-TESTING.md](06-TESTING.md) |

**Why `app.js` and `server.js` are separate.** `app.js` builds the application;
`server.js` imports it, listens, and starts the timer that escalates stale parcels and
purges expired accounts. Tests import `app.js` directly, so they exercise the same routes
and middleware the server does rather than a copy of the rules.

## Frontend layout

| Folder | Holds |
| --- | --- |
| `src/api/` | One module per area of the API; every call goes through `axios.js` |
| `src/pages/` | One per route |
| `src/components/` | Shared pieces — cards, forms, the notification bells, the sidebar |
| `src/context/` | Auth and cart, via React Context |
| `src/utils/` | Currency formatting, order status labels, role themes |

`src/api/axios.js` adds the stored token to every request and handles the response nobody
should have to think about: a **401 on a stored token** means the session is over, so it
clears the session, tells the app, and sends the user to sign in with an explanation. The
raw `Invalid token` used to leave the browser looking signed in while everything failed.

## Decisions worth knowing

### An order splits into parcels

`orders` is the customer's purchase. `shipments` is a **parcel**: one shop's items within
that order, collected from that shop and delivered on its own.

This matters because a marketplace basket can hold items from five shops in five towns.
One delivery fee and one status would be a fiction. So each parcel carries its own fee,
distance, courier and status, and the order's status is a **rollup** — whichever parcel is
least far along. An order is only `delivered` when every parcel is.

`Order.recomputeOrderStatus()` does that rollup after every parcel change.

### The handover takes two parties

A courier pressing "collected" is only their word for it. The flow is:

1. The shop marks the parcel **shipped** — it enters a pool every on-duty courier sees.
2. A courier **requests** it. A single conditional `UPDATE` claims it
   (`WHERE id = ? AND status = 'shipped' AND (courier_id IS NULL OR courier_id = ?)`), so
   two couriers racing for the same parcel cannot both win — the second sees zero rows
   changed and is told somebody got there first.
3. The **shop confirms** the handover. Only now is the parcel `picked_up`, and only now are
   the courier's contact details released to the customer.
4. If the courier never came, the shop denies it: the parcel returns to the pool, the
   reason is recorded where the customer can read it, and the courier is told.

### Courier contact details are gated

`Order.withCourierContactVisibility(order, viewer)` blanks `driver_name` and `driver_phone`
until the parcel is genuinely collected. One exception: the **shop being asked to confirm**
sees the requesting courier's name from `pickup_requested`, because it is being asked to
verify that this person took the parcel.

### Two account layouts

New databases put the login on the account row: `sellers.email`, `customers.email`. Older
ones have a central `users` table that those rows link to by `user_id`. `req.user.id`
therefore means different things depending on which database you are on.

**Every lookup that turns `req.user.id` into a profile id goes through
`src/utils/accounts.js`** — `resolveSellerId`, `resolveCustomerId`, `resolveCourierId`.
Doing it inline is what left product creation failing with *"Unknown column 'user_id'"*,
and the cart answering 500 on every call.

### MariaDB has no real JSON type

MariaDB aliases `JSON` to `LONGTEXT`, so the driver returns `sizes` and `images` as
strings. `Product.normalize()` parses them, so the API always answers with real arrays.
Without it, `product.images[0]` yields `"["`.

### Prices are never trusted from the client

`Order.quoteForItems()` reads every price from the products table and is used by both the
checkout quote and order creation — so what the customer is shown is what they are charged,
and a tampered request changes nothing.

### Creating an order is one transaction

Stock coming off, the order row, the line items and the parcels are written together and
roll back together. A failure half way cannot leave stock deducted for an order that does
not exist.

### Deleting an account is reversible

`deleted_at` marks it. For the grace period the row stays: the account cannot sign in, a
shop's products leave the catalogue and it cannot be ordered from, a courier comes off
duty. `Admin.restore()` undoes it. `Admin.purgeExpired()`, on the same sweep that escalates
parcels, removes anything past the window — but keeps rows that order history still
references, so an order never points at an account that is gone.

## Request lifecycle, end to end

Taking `POST /api/orders`:

1. `app.js` — helmet, CORS, JSON parsing, then `apiLimiter`.
2. `orderRoutes.js` — `authMiddleware` verifies the token onto `req.user`.
3. `blockIfSuspended` — refuses a suspended account with the reason.
4. `orderController.createOrder` — pulls the fields out and calls the model.
5. `Order.createForCustomer` — resolves the customer id, opens a transaction, prices the
   basket server-side, refuses a suspended or removed shop, writes the order, its items and
   one parcel per shop, takes the stock off, commits.
6. The controller answers **201** with the new order id, or the status the model threw.

## Background work

`server.js` runs one sweep every `PICKUP_ESCALATION_SWEEP_MS` (5 minutes):

- `Admin.purgeExpired()` — deletes accounts past their grace period.
- `Order.escalateStaleParcels()` — assigns any parcel unclaimed for
  `PICKUP_ESCALATION_MINUTES` to the on-duty courier with the fewest parcels. Assignment is
  not collection: that courier still requests it, and the shop still confirms.

The timer is `unref()`d so it never holds the process open.

## Security

| Concern | How it is handled |
| --- | --- |
| Passwords | bcrypt, cost 10. Never returned by any endpoint |
| Sessions | JWT, 7-day expiry, verified on every protected request |
| Brute force | Failed sign-ins capped per address; successful ones are not counted |
| Mass sign-up | Registration capped per address per hour |
| Injection | Parameterised queries everywhere; no string-built SQL with user input |
| Headers | helmet |
| Behind a proxy | `trust proxy` set, so the rate limiter sees the real client address rather than counting everyone as the proxy |
| Ownership | Checked in the controller *and* the model — a seller can only touch their own products and parcels, a courier only parcels they hold, a customer only their own orders |
| Admin writes | Whitelisted columns only, so a password can never be written through the account editor |
| Uploads | Stored on disk under `backend/uploads/`, served statically; only the path is kept in the database |
