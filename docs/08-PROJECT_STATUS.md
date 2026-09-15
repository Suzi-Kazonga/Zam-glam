# 8. Project status

An honest account of what exists, what does not, and what is weak. This replaces
`COMPLETION_REPORT.md`, `COMPLETION_SUMMARY.md` and `VALIDATION_CHECKLIST.md`, which were
written in August, declared the project complete, and described a version without couriers,
complaints, an admin console or real tests.

Last reviewed: **15 September 2026**.

## Built and working

Each of these is covered by tests that drive the real application — see
[06-TESTING.md](06-TESTING.md).

### Accounts and access

- Four roles: customer, seller, courier, administrator.
- Registration and sign-in, bcrypt-hashed passwords, JWT sessions with a 7-day expiry.
- Sign-in attempts and sign-ups capped per address; a successful sign-in is never counted
  as a failure.
- A dead token ends the session cleanly instead of leaving the browser looking signed in.

### Selling

- A shop registers, creates a storefront, uploads registration documents and is verified by
  an administrator. Verified shops carry a badge.
- Listing a product requires at least one real photograph; up to six.
- A shop can only edit or delete its own products, checked in the controller and again in
  the model.

### Buying

- A basket can hold items from several shops, kept server-side as well as in the browser.
- Checkout quotes the basket before it is placed, split into one parcel per shop, each with
  its own delivery fee measured from that shop's town to the delivery address.
- The order is written in a transaction: stock, order, items and parcels together or not at
  all. Prices are read server-side, never taken from the request.
- Tracking shows every parcel's own progress, and the order sits at whichever is least far
  along.

### Delivery

- A shop packs, then releases a parcel into a pool every on-duty courier can see.
- A courier requests a parcel; a conditional update means two couriers cannot both claim it.
- The shop confirms the handover — only then is it collected, and only then does the
  customer get the courier's number.
- A shop can report a no-show: the parcel returns to the pool, the reason reaches the
  customer's tracking, and the courier is told.
- Couriers go on and off duty, and cannot clock off while answerable for a parcel.
- A parcel nobody claims within an hour is assigned to the least-loaded courier on duty.
- New couriers wait for an administrator's approval before they can work.

### Trust and moderation

- Customers rate shops after delivery; shops can reply. Ratings are in the database, so
  everyone sees the same score.
- Any party to an order can report another party on it — only somebody they dealt with,
  once per order.
- Three open complaints flag a party for an administrator.
- Suspension stops an account ordering, listing or delivering, takes a courier off duty,
  and shows the account a notice with the reason. Suspended shops read *Unavailable* and
  cannot be ordered from.

### Administration

- Real figures: subscribers, pending approvals, activity, all read from the database.
- Every group of accounts can be listed, filtered and opened.
- Editing writes to whitelisted columns only.
- Deleting is a soft delete with a 30-day restore window; a scheduled sweep then removes
  it permanently, keeping anything order history still refers to.

### Quality

- 192 backend tests and 18 frontend tests, all passing.
- A fresh clone seeds and runs with no SQL run by hand.
- The interface works on a phone, including the dashboards.

## Deliberately not built

These are limitations to write up, not gaps to apologise for.

### Payment is simulated

The chosen method is recorded on the order and a `payments` row is written, but **nothing
is charged**. Airtel Money and MTN MoMo integrations are commercial arrangements requiring
a registered business, a signed agreement and issued credentials. Everything else about an
order — stock, parcels, delivery, tracking — is real.

*What it would take:* a merchant account with either provider, then an adapter alongside
`services/courierProvider.js`, plus a callback endpoint for their asynchronous
confirmation.

### Distances come from a town lookup, not a geocoder

`services/places.js` matches free-text addresses against a table of Zambian towns and
Lusaka neighbourhoods, and measures the straight line between the two points. An address
nobody recognises falls back to central Lusaka, and the quote is flagged as an estimate.

This is enough to price a delivery sensibly, and it is honest about when it is guessing.
A geocoding service, or a courier company that does its own routing, would replace it.

### Deliveries are carried by Zamglam's own couriers

`services/courierProvider.js` defines the adapter an outside company would fill in, and the
Yango stub documents exactly what such an integration must return. No commercial agreement
exists, so the platform runs on its own riders.

## Known weaknesses

Stated plainly rather than buried.

- **The React pages are not directly tested.** Components with logic are covered, but the
  dashboards mix fetching, state and layout and are verified by use. The API they rely on
  is covered thoroughly, so what is untested is rendering, not rules.
- **No end-to-end browser tests.** Cypress is installed; no specs were written.
- **The Docker stack is unverified.** Its definitions were corrected against the code (see
  [07-DEPLOYMENT.md](07-DEPLOYMENT.md)) but Docker is not installed on the development
  machine, so it has not been run end to end.
- **Two account layouts still exist.** New databases put the login on the account row;
  older ones use a central `users` table. Both work, through `utils/accounts.js`, but it is
  a seam that has caused real bugs and would be worth collapsing.
- **A legacy `courier` table** is maintained alongside `shipments` so older code keeps
  working. It is redundant.
- **Some dashboard components are long.** `SellerDashboard.jsx` and `AdminUsers.jsx` would
  read better split up.
- **Uploaded photos are stored on the server's disk.** Fine for one machine; a second
  instance would not see them.

## What is left

The report. The software side is complete, the documentation is current, and the
limitations above are the ones to write up.
