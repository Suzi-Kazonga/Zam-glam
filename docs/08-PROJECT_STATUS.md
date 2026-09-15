# 8. Project status

What was promised in the proposal, what was built, and where the two differ.

**Project:** Design and Implementation of a Multi-Vendor E-Commerce Platform with
Integrated Courier Delivery Service
**Department:** Computing and Informatics, University of Zambia
**Supervisor:** Mr Alinani Simukonga
**Proposal submitted:** 13 March 2026 · **This review:** 15 September 2026

This replaces `COMPLETION_REPORT.md`, `COMPLETION_SUMMARY.md` and
`VALIDATION_CHECKLIST.md`, which were written in August, declared the project complete, and
described a version without couriers, complaints, an admin console or working tests.

---

## The four objectives

| # | Objective (from the proposal) | State | Evidence |
| --- | --- | --- | --- |
| 1 | Build a secure multi-vendor e-commerce system | **Met** | Several shops sell in one marketplace; a basket can span shops and splits into one parcel each. See [Selling](#selling) and [Buying](#buying) |
| 2 | Integrate a courier management module supporting delivery **scheduling** and **tracking** | **Tracking met; scheduling partly** | Full parcel tracking and a dispatch model — pool, claim, handover, escalation. There is no *time-slot* scheduling: see [the note below](#objective-2-scheduling) |
| 3 | Provide user-friendly interfaces for customers and store owners | **Met, and exceeded** | Four dashboards, not two — courier and administrator as well. Works on a phone, which the literature review argued matters |
| 4 | Implement secure authentication and data protection | **Met in the application; TLS is a deployment step** | bcrypt, JWT, rate limiting, role and ownership checks, parameterised queries. HTTPS is configured at deployment, not in the local setup — see [07-DEPLOYMENT.md](07-DEPLOYMENT.md) |

### Objective 2: "scheduling"

Worth being precise about, because it is the one place the wording and the build do not
line up exactly.

**What exists** is *dispatch*: a shop releases a parcel into a pool every on-duty courier
can see, a courier claims it, the shop confirms the handover, and anything nobody claims
within an hour is assigned automatically to the least-loaded courier on duty. Couriers
control their own availability by going on and off duty.

**What does not exist** is a customer choosing a delivery window ("tomorrow, 2–4pm"). If
the proposal's "scheduling" meant time slots, that is not built, and the report should say
so plainly. If it meant organising and assigning deliveries — which the problem statement
suggests, complaining that "logistics are typically organized manually between sellers and
courier services" — then it is built, and rather more thoroughly than a manual arrangement.

Raise this with your supervisor before the report is finalised; it is the kind of thing
better clarified than argued afterwards.

---

## The four expected outcomes

| Deliverable | State |
| --- | --- |
| A functional e-commerce web platform for clothing and footwear | **Delivered** |
| Integrated courier management and delivery tracking system | **Delivered** |
| Vendor and customer dashboards | **Delivered** — four, including courier and admin |
| System documentation and user manual | **Delivered** — [docs/](README.md), manual at [02-USER_MANUAL.md](02-USER_MANUAL.md) |

## Scope, as stated in the proposal

**In scope, and built:** registered clothing and footwear businesses (with a verification
process, which is what "registered" required); courier services integrated into the
platform; an online catalogue and ordering system; customer accounts and vendor dashboards;
web-based and working in modern browsers.

**Out of scope, and correctly absent:** international shipping, physical warehouse
management. The catalogue is aimed at clothing and footwear and seeded that way, though
nothing in the code prevents a shop listing something else — a category restriction was
never required and is not enforced.

---

## Where the build departs from the proposal

Two departures, both of which the report must state rather than leave to be noticed.

### 1. The backend is Node.js and Express, not Python and Django

The proposal named:

> **Backend:** Python · **Frameworks:** Django REST Framework for building secure backend
> APIs; Express.js for handling server-side processes where necessary

What was built is **Express.js for the whole backend**, with no Python or Django. The
frontend is **React** (with Vite), where the proposal said "HTML CSS Javascript".

The honest framing, which is also the sound engineering one: the proposal named two server
technologies, and the team consolidated on one of them rather than splitting the system
across two stacks and two languages. Running Django and Express side by side would have
meant two deployment targets, two dependency sets and a boundary between them for no
functional gain. Choosing the JavaScript option meant one language across the whole system,
one package manager, and shared validation logic.

React is JavaScript, so it sits inside what the proposal described, but it is a library the
proposal did not name and should be mentioned for the same reason.

**What did not change:** MySQL as the database, Tailwind CSS for the interface, VS Code and
Git/GitHub — all exactly as proposed.

### 2. The payment risk in the proposal materialised

The risk register anticipated this:

> **Risk:** Payment gateway integration issues · **Mitigation:** Support multiple local
> payment options

The mitigation turned out not to be available. Airtel Money and MTN MoMo integrations are
commercial arrangements needing a registered business, a signed agreement and issued
credentials — none of which a student project can obtain. Supporting *several* providers
does not help when the obstacle applies equally to all of them.

**What was built instead:** the order records which method the customer chose, and a
`payments` row is written, but **no money moves**. Everything else about an order — stock,
parcels, delivery, tracking — is real.

This is the correct outcome to report: a risk that was identified in advance, whose
mitigation proved impossible for reasons outside the project's control, with the affected
feature stubbed cleanly rather than faked.

---

## Built and working, in detail

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
  an administrator. Verified shops carry a badge — which is the proposal's first stated
  problem, that customers cannot tell a checked seller from an unchecked one.
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

- 231 backend tests and 18 frontend tests, all passing.
- A fresh clone seeds and runs with no SQL run by hand.
- The interface works on a phone, including the dashboards — which the literature review
  identified as important, since most Zambian users reach the internet by smartphone.

---

## Deliberately not built

### Payment is simulated

See [the risk discussion above](#2-the-payment-risk-in-the-proposal-materialised).

### Distances come from a town lookup, not a geocoder

`services/places.js` matches free-text addresses against a table of Zambian towns and
Lusaka neighbourhoods, and measures the straight line between the two points. An address
nobody recognises falls back to central Lusaka, and the quote is flagged as an estimate.

This is enough to price a delivery sensibly, and it is honest about when it is guessing. A
geocoding service, or a courier company that does its own routing, would replace it.

### Third-party courier companies

`services/courierProvider.js` defines the adapter an outside company would fill in, and the
Yango stub documents exactly what such an integration must return. No commercial agreement
exists, so the platform runs on its own riders — which is what the proposal described
anyway ("an inbuilt courier service").

---

## Known weaknesses

Stated plainly rather than buried.

- **The React pages are not directly tested.** Components with logic are covered, but the
  dashboards mix fetching, state and layout and are verified by use. The API they rely on
  is covered thoroughly, so what is untested is rendering, not rules.
- **No end-to-end browser tests.** Cypress is installed; no specs were written.
- **The Docker stack is unverified.** Its definitions were corrected against the code (see
  [07-DEPLOYMENT.md](07-DEPLOYMENT.md)) but Docker is not installed on the development
  machine, so it has not been run end to end.
- **HTTPS is not part of the local setup.** The proposal's ethical section commits to HTTPS
  and SSL; that belongs to deployment, and the steps are in 07-DEPLOYMENT.md, but a marker
  running it locally will be on plain HTTP.
- **Two account layouts still exist.** New databases put the login on the account row;
  older ones use a central `users` table. Both work, through `utils/accounts.js`, but it is
  a seam that has caused real bugs and would be worth collapsing.
- **A legacy `courier` table** is maintained alongside `shipments` so older code keeps
  working. It is redundant.
- **Some dashboard components are long.** `SellerDashboard.jsx` and `AdminUsers.jsx` would
  read better split up.
- **Uploaded photos are stored on the server's disk.** Fine for one machine; a second
  instance would not see them.

---

## What is left

The report itself. The software is complete against the objectives, the documentation is
current, and the two departures from the proposal above are the ones to write up.

The proposal's own timeline put **Final Report Writing at weeks 14–15**, with submission
and presentation in week 16.
