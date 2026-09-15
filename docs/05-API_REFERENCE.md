# Zamglam API Reference

Every endpoint the backend serves, as it is in the code. Base URL `http://localhost:5000/api`
(the frontend calls it through a relative `/api`, proxied by Vite, so the same build works
from a phone on the same network).

## Contents

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Catalogue](#catalogue)
- [Stores and verification](#stores-and-verification)
- [Basket](#basket)
- [Orders and parcels](#orders-and-parcels)
- [The pickup pool and the handover](#the-pickup-pool-and-the-handover)
- [Ratings](#ratings)
- [Complaints and account standing](#complaints-and-account-standing)
- [Admin console](#admin-console)
- [Delivery quotes](#delivery-quotes)
- [Deals](#deals)
- [Health](#health)

---

## Conventions

**Authentication.** A JWT in `Authorization: Bearer <token>`, valid for 7 days, issued by
`/auth/register` and `/auth/login`. The token carries `{ id, email, role }`.

**Roles.** `customer`, `seller`, `courier`, `admin`. Where a table below says a role, only
that role may call it; `any` means any signed-in account.

**Suspension.** Endpoints marked *(blocked if suspended)* answer `403 { suspended: true,
reason, suspended_at }` for an account an admin has suspended.

**Errors.** `{ "error": "..." }` with a matching status:

| Status | Meaning |
| --- | --- |
| 400 | The request is malformed or missing something |
| 401 | No token, or a token the server will not accept (expired, or signed with a rotated secret) |
| 403 | Signed in, but not allowed to do this |
| 404 | Not found |
| 409 | The request conflicts with the current state (stock, a parcel already claimed, a duplicate) |
| 429 | Rate limited |
| 500 | Unhandled server error |

**Rate limits.** Configurable by environment variable; defaults:

| Scope | Limit | Notes |
| --- | --- | --- |
| `POST /auth/login` | 10 failures / 15 min / IP | Successful sign-ins are not counted |
| `POST /auth/register` | 10 / hour / IP | |
| Everything under `/api` | 600 / minute / IP | |

**Money** is Zambian kwacha (ZMW) as a decimal number.

---

## Authentication

### `POST /auth/register` *(also `/auth/signup`)*

Public. Creates an account and signs it in.

```json
{
  "name": "Chanda Banda",
  "email": "chanda@example.com",
  "password": "CUSTOMER123456",
  "role": "customer",
  "phone": "+260 97 000 0000",
  "address": "Kabulonga, Lusaka",
  "location": "Lusaka",
  "shop_name": "Mud"
}
```

`name`, `email` and `password` are required. `role` defaults to `customer`; `shop_name`
applies to a seller, `address`/`location` to a customer.

**201** `{ message, token, user: { id, name, email, role, phone, address, location } }`
· **400** missing fields · **409** that email already has an account

A new **seller** can sign in and list immediately but starts `verification_status:
'pending'`. A new **courier** is stored `approval_status: 'pending'` and inactive: they
cannot go on duty until an admin approves them.

### `POST /auth/login`

Public.

```json
{ "email": "chanda@example.com", "password": "CUSTOMER123456" }
```

**200** `{ message, token, user: { id, name, email, role } }`
· **400** missing fields
· **401** `Invalid credentials` — the same answer whether the email is unknown or the
password is wrong, so the endpoint does not reveal which accounts exist
· **403** `This account has been removed. Contact Zamglam support.` — deleted, still inside
its restore window
· **429** too many failed attempts

### `GET /auth/me`

`any`. The signed-in account. **200** the user · **401** no or bad token · **404** gone.

---

## Catalogue

### `GET /products`

Public. Products from shops in good standing — a deleted shop's products are excluded.

Query: `store_id`, `audience`, `category_id`.

**200** an array of products:

```json
[{
  "id": 1, "name": "Classic Denim Pants", "description": "…",
  "price": 350, "stock": 29, "audience": "women",
  "sizes": ["S", "M", "L"], "images": ["/uploads/…png"], "image_url": "/uploads/…png",
  "store_id": 1, "store_name": "Mud", "category_name": "Pants",
  "store_verification": "verified", "store_status": "active",
  "store_rating": 4.5, "store_rating_count": 12
}]
```

`sizes` and `images` are always real arrays. (MariaDB aliases `JSON` to `LONGTEXT`, so the
driver hands them back as strings; the model parses them.) `store_status` is `suspended`
for a shop an admin has suspended — the UI shows **Unavailable** in place of the verified
badge, and orders from it are refused.

### `GET /products/:id`

Public. One product, same shape. **404** if there is no such product.

### `POST /products`

`seller` *(blocked if suspended)*. **`multipart/form-data`** — at least one image file is
required.

| Field | Notes |
| --- | --- |
| `images` | Up to 6 files. `image` (single) is also accepted |
| `name`, `price` | Required |
| `description`, `stock`, `audience`, `sizes`, `category` | Optional |

The seller and their store are taken from the token, never from the body. `category` is a
name; it is looked up case-insensitively and created if new.

**201** `{ message, product: { id, seller_id, name, price } }`
· **400** no image, or no name/price, or the seller has no store yet
· **403** not a seller, or suspended

### `PUT /products/:id`

`seller`, and only the seller who owns it. Same multipart form. Attaching no images keeps
the stored gallery, so editing a price never drops the photos.

**200** `{ message }` · **403** somebody else's product · **404** no such product

### `DELETE /products/:id`

`seller`, owner only. **200** · **403** · **404**

### `GET /products/seller/my-products`

`seller`. Every product belonging to the signed-in shop.

---

## Stores and verification

### `GET /stores`

Public. Every open storefront, with `verification_status`, `account_status`, `shop_name`,
`rating_average`, `rating_count`.

### `GET /stores/:id`

Public. One storefront, same fields. `account_status: "suspended"` means the shop cannot
currently take orders.

### `GET /stores/:id/products`

Public. That storefront's products, in the same shape as `GET /products`. Query:
`audience`, `category`.

### `GET /stores/mine`

`seller`. The signed-in shop's own storefront — the id the frontend needs to link to it.
Registered before `/:id`, so `mine` is never read as an id.

**200** the store · **404** `This seller has no store yet`

### `POST /stores`

`seller`. `{ name, description, logo_url, location, open_hours }`. `name` is required, and
`location` is what delivery is priced from.

**201** `{ message, store: { id, seller_id, name, description, location } }` · **400** no name

### `PUT /stores/:id`

`seller`. Updates the store.

### `POST /stores/documents/upload`

`seller`. `multipart/form-data` with `file` and a `type` field (`doc_number` optional) — a
registration document for verification. A rejected shop submitting fresh paperwork goes
back into the pending queue.

**201** `{ message, document: { id, type, url, status: "pending" } }` · **400** no file or
no type

### `GET /stores/documents/list`

`seller`. The documents this shop has uploaded, with its own verification state.

**200** `{ verification_status, verified_at, documents: [...] }`

### `GET /stores/verification/sellers`

`admin`. Every shop with its documents attached, pending first.

### `PATCH /stores/verification/sellers/:id`

`admin`. `{ status: "verified" | "rejected" | "pending", note }`.

**200** · **400** an unknown status · **403** not an admin

---

## Basket

A basket held server-side, so it survives changing device. The browser keeps its own copy
for speed.

### `GET /cart`

`customer`. **200** `[{ id, quantity, name, price, image_url, stock }]` — `id` is the
product id.

### `POST /cart`

`customer`. `{ product_id, quantity }`. Adding an item already in the basket adds to its
quantity rather than duplicating the row.

**201** `{ message, item }` · **400** no product or a quantity below 1 · **404** no such
product · **409** not enough stock

---

## Orders and parcels

An order from several shops is **split into one parcel (shipment) per shop**. Each parcel
is packed, collected and delivered on its own, with its own delivery fee and possibly a
different courier. The order's own status is a rollup: whichever parcel is least far along.

Parcel statuses, in order:

`placed` → `processing` → `shipped` → `pickup_requested` → `picked_up` → `delivered`

(`cancelled` is separate.) `delivered` is the end — the courier marking a parcel delivered
completes it.

### `POST /orders/quote`

`any`. Prices a basket without creating anything, using the same calculation as order
creation, so checkout shows what will be charged.

```json
{ "items": [{ "product_id": 1, "quantity": 2 }], "location": "Lusaka" }
```

**200**

```json
{
  "parcels": [{ "store_name": "Mud", "items_total": 700, "delivery_fee": 27.5,
                "distance": "1.5 km", "item_count": 2 }],
  "items_total": 700, "delivery_total": 27.5, "total": 727.5
}
```

· **400** empty basket · **404** unknown product · **409** not enough stock, or the shop is
suspended or removed

### `POST /orders`

`customer` *(blocked if suspended)*.

```json
{
  "items": [{ "product_id": 1, "quantity": 2 }],
  "address": "Kabulonga, Lusaka",
  "location": "Lusaka",
  "phone": "+260 97 000 0000",
  "paymentMethod": "Airtel Money"
}
```

Prices come from the products table, never from the request. Written in a transaction:
stock comes off, one parcel per shop is created, and the whole thing rolls back on failure.

**201** `{ id, status: "placed" }`
· **400** empty basket · **404** unknown product · **409** not enough stock / the shop is
suspended or removed

> Payment is recorded but never taken — no gateway is connected. See the limitations in
> [08-PROJECT_STATUS.md](08-PROJECT_STATUS.md).

### `GET /orders`

`any`. What the signed-in account has to do with orders:

- **customer** — their own orders
- **seller** — orders containing their products, carrying only their own parcel, items and
  courier
- **courier** — only the parcels assigned to them

### `GET /orders/:id`

`any`, but only if you were part of it: the owning customer, a seller with a line in it,
the assigned courier, or an admin. Everyone else gets **403**, and an order that does not
exist is **404**.

A seller sees only their own items and parcel; a courier only the parcels they hold.

**200**

```json
{
  "id": 60, "status": "picked_up", "total_price": 727.5,
  "items_total": 700, "delivery_total": 27.5,
  "address": "…", "location": "Lusaka", "phone": "…", "payment_method": "airtel_money",
  "customer_name": "…", "customer_email": "…",
  "items": [{ "product_id": 1, "name": "…", "quantity": 2, "price": 350, "store_name": "Mud" }],
  "shipments": [{
    "id": 68, "seller_id": 2, "store_name": "Mud", "status": "picked_up",
    "courier_id": 1, "driver_name": "Mwansa Phiri", "driver_phone": "+260…",
    "contact_available": true, "released_at": "…", "price": 27.5, "distance": "1.5 km"
  }],
  "tracking": [{ "status": "shipped", "note": "…", "created_at": "…" }]
}
```

**Courier contact details are gated.** `driver_name` and `driver_phone` are `null` until
the shop confirms the handover. The one exception: the shop being asked to confirm sees the
requesting courier's name from `pickup_requested`, because it is being asked to verify that
this person took the parcel.

### `PATCH /orders/:id/status`

`seller` (their own order) or `admin`; `delivered` only from the assigned courier or an
admin. `{ status }` from `placed | processing | shipped | delivered | cancelled`.

### `PATCH /orders/shipments/:id/status`

Moves **one shop's parcel**, leaving the others alone. *(blocked if suspended)*

- `processing`, `shipped`, `cancelled` — the owning seller, or an admin. `shipped` releases
  the parcel into the pickup pool and starts the clock escalation watches.
- `delivered` — only the courier who collected it, or an admin, and only from `picked_up`.

**200** `{ message, shipment_id, order_id, status, order_status }`
· **400** an unknown status · **403** not yours · **404** no such parcel
· **409** `delivered` before collection, or `cancelled` after it

Cancelling returns the parcel's items to stock and detaches any courier. Cancelling a
parcel already collected is refused.

---

## The pickup pool and the handover

A parcel a shop has released is open to **every** on-duty courier. Taking it is two-sided:
the courier asks, and the shop confirms they physically handed it over. Nothing is treated
as collected on the courier's word alone.

### `GET /orders/courier/shift`

`courier`. **200** `{ on_shift, shift_changed_at, carrying }` — `carrying` counts parcels
the courier is answerable for (requested or collected).

### `PATCH /orders/courier/shift`

`courier` *(blocked if suspended)*. `{ on_shift: true | false }`.

**200** `{ on_shift }`
· **403** the account is not approved yet
· **409** going off duty while still answerable for a parcel — deliver it, or have the shop
release it

### `GET /orders/shipments/available`

`courier` (or `admin`, who sees everything). Parcels released by shops and not yet claimed.
An **off-duty** courier gets an empty list rather than work they will not do.

**200** an array of parcels, each with `shipment_id`, `store_name`, the address, and the
delivery fee. · **403** for anyone else

### `PATCH /orders/shipments/:id/pickup-request`

`courier` *(blocked if suspended)*. Claims the parcel and asks the shop to confirm. First
to ask wins, so two couriers never travel for the same parcel.

**200** `{ message, shipment_id, courier_id, status: "pickup_requested" }`
· **403** not a courier
· **404** no such parcel
· **409** off duty, already spoken for, or not released by the shop yet

### `PATCH /orders/shipments/:id/pickup-confirm`

`seller`, the shop the parcel is from *(blocked if suspended)*. The handover actually
happened: the parcel becomes `picked_up`, and the courier's details are released to the
customer.

**200** `{ message, shipment_id, status: "picked_up" }`
· **403** not the owning shop · **409** nobody has asked to collect it

### `PATCH /orders/shipments/:id/pickup-deny`

`seller`, owner *(blocked if suspended)*. The courier never came. `{ reason }` is recorded
in the tracking so the customer can see why their parcel is still waiting.

The parcel returns to `shipped` with no courier, back in the pool for anybody else.

**200** `{ message, shipment_id, status: "shipped", returned_to_pool: true }`
· **403** not the owning shop · **409** no collection is pending

### `GET /orders/shipments/unclaimed`

`admin`. Everything released but not collected, with `waiting_minutes`.

**Escalation.** A parcel nobody claims within `PICKUP_ESCALATION_MINUTES` (default 60) is
assigned to the on-duty courier with the fewest parcels, swept every
`PICKUP_ESCALATION_SWEEP_MS` (default 5 minutes). Assignment is not collection: that courier
still requests the pickup, and the shop still confirms.

---

## Ratings

### `POST /reviews`

`customer`. `{ seller_id, order_id, rating, comment }`. One rating per customer per shop
per order; rating again updates it.

**201** `{ message, average, count }` · **403** not a customer

### `POST /reviews/:id/reply`

`seller`. `{ reply }` — the shop's public answer to a rating.

### `GET /reviews/seller/:sellerId`

Public. That shop's ratings and replies.

### `GET /reviews/mine`

`seller`. Ratings left about the signed-in shop.

### `GET /reviews/mine/customer`

`customer`. Ratings the signed-in shopper has left.

---

## Complaints and account standing

A complaint can only be made about somebody you actually dealt with, on an order you were
part of. **Three** open complaints against the same party flag them for an admin.

### `GET /reports/order/:orderId/parties`

`any`. Who was on this order, and so who could be reported.

**200** `{ customer: { id, name }, sellers: [{ id, name }], couriers: [{ id, name }] }`
· **404** no such order

### `POST /reports`

`any`.

```json
{ "order_id": 60, "reported_role": "seller", "reported_id": 2,
  "reason": "Wrong item", "details": "…" }
```

`reported_role` is `seller | customer | courier`.

**201** `{ reported_role, reported_id, reports, flagged }` — `flagged` is true at three or
more
· **400** no reason, reporting yourself, an unknown role, or a party who was not on the order
· **403** you were not on that order
· **409** you already reported that party for that order

### `GET /reports/me/standing`

`any`. The signed-in account's own standing, which drives the SUSPENDED notice.

**200** `{ suspended, suspended_at, reason }`

### `GET /reports/admin/summary`

`admin`. Every party with open complaints, worst first, with their name, email, current
`account_status` and whether they are `flagged`.

### `GET /reports/admin/:role/:id`

`admin`. The individual complaints against one party.

### `PATCH /reports/admin/:role/:id/status`

`admin`. `{ status: "suspended" | "active", reason }`.

Suspending stops that account ordering, listing or taking deliveries, and takes a courier
off duty. Reinstating clears the open complaints, so an old grudge does not immediately
re-flag somebody just cleared.

**200** · **400** an unknown status or role · **404** no such account

---

## Admin console

Everything here is admin-only (`authMiddleware` + `roleMiddleware('admin')` on the whole
router) and reads and writes real accounts.

### `GET /admin/stats`

```json
{
  "subscribers": { "customers": 4, "sellers": 7, "couriers": 3, "admins": 1, "total": 15 },
  "pending": { "shops": 1, "couriers": 3, "total": 4 },
  "activity": { "orders": 61, "products": 18, "stores": 6, "reviews": 2 },
  "grace_days": 30
}
```

`grace_days` is the restore window the purge job actually enforces, so the console never
quotes a different number from the one in force.

### `GET /admin/users/:role`

`role` is `customers`, `sellers` or `couriers` (plural). Each row carries
`account_status` and `deleted_at` alongside the group's own figures — orders and spend for
customers, products, parcels, rating and document count for shops, approval, duty state and
parcels carried for couriers.

**400** an unknown group.

### `GET /admin/pending`

Shops that have submitted documents and courier sign-ups awaiting a decision.
**200** `{ shops: [...], couriers: [...], total }`

### `PATCH /admin/couriers/:id/approval`

`{ status: "approved" | "rejected" | "pending" }`. Approving lets a courier work; rejecting
takes them off duty immediately. **400** an unknown status · **404** no such courier

### Account management

These take the role in the **singular**: `seller`, `customer`, `courier`.

#### `PATCH /admin/:role/:id`

Edits an account. Only whitelisted columns are written — `shop_name`, `email`, `phone` for
a shop; `name`, `email`, `phone`, `address`, `location` for a customer; `name`, `email`,
`phone` for a courier. Anything else in the body is ignored, so a password can never be
written through this endpoint.

**200** `{ message, role, id, updated }` · **400** nothing to update, or an unknown role
· **404** no such account

#### `DELETE /admin/:role/:id`

A **soft delete**. The row stays for a grace period (`ACCOUNT_DELETE_GRACE_DAYS`, default
30): the account cannot sign in, a shop's products leave the catalogue and it cannot be
ordered from, and a courier comes off duty and inactive.

**200** `{ message, role, id, deleted: true, grace_days }`
· **400** an unknown role · **404** no such account, or already deleted

#### `PATCH /admin/:role/:id/restore`

Undoes it within the window. An approved courier becomes active again.

**200** `{ message, role, id, deleted: false }` · **404** not deleted

**The purge.** The same sweep that escalates stale parcels removes anything past its grace
period, permanently. A row that order history still references is kept rather than
destroyed, so an order never points at an account that is gone.

---

## Delivery quotes

### `POST /delivery/quote`

Public. A raw coordinate-to-coordinate quote, separate from order pricing.

`{ pickup: { lat, lng }, dropoff: { lat, lng } }`

**200** `{ distance_km, total_price, currency: "ZMW", eta, provider }` · **400** missing
coordinates

Uses the Yango API when `YANGO_API_URL` and `YANGO_API_KEY` are both set; otherwise
Zamglam's own couriers, priced from the straight-line distance.

### `GET /delivery/status/:id`

Public. A placeholder; parcel state comes from the order endpoints.

---

## Deals

### `GET /deals`

Public. Up to 12 in-stock products from open shops, with a 20% `sale_price` and a
six-hour `expires_at`, for the home page's deals strip.

---

## Health

### `GET /health`

Public, and outside `/api`. **200** `{ status: "ok", database }` — useful for checking the
server is up and which database it is on.
