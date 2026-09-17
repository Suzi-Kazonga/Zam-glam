# 6. Testing

## Running them

```powershell
cd backend
npm.cmd test              # 235 tests
npm.cmd run test:unit     # the unit tests only
npm.cmd run test:coverage # with a coverage report
```

```powershell
cd frontend
npm.cmd test              # 31 tests
```

The backend tests use **their own database**, `zamglam_db_test`, created automatically on
the first run. `tests/setup.js` sets `DB_NAME` before anything imports the database config,
and dotenv does not overwrite a variable that is already set — so the development database
is never touched.

They run serially (`--runInBand`) because they share that one database, and take about six
minutes. That is real work against real SQL, not a slow test suite.

## What they cover

| Suite | Tests | Covers |
| --- | --- | --- |
| `integration/auth.test.js` | 18 | Registration, sign-in, password hashing, duplicate emails, forged tokens, a deleted account being refused and then restored, consent to the terms being required and recorded, and that nobody can sign themselves up as an administrator |
| `integration/catalogue.test.js` | 20 | Listing with photos, the ownership rules on editing and deleting, filtering, MariaDB's JSON columns coming back as arrays, verification, a suspended shop showing as unavailable |
| `integration/orders.test.js` | 40 | Quoting, splitting into one parcel per shop, distance-based fees, stock, who may see an order, moving a parcel along, cancelling and its stock return, the saved basket |
| `integration/handover.test.js` | 39 | The pool, shifts and approval, requesting and racing for a parcel, the shop confirming and denying, contact gating, escalation, delivery |
| `integration/moderation.test.js` | 29 | Reporting only people you dealt with, the three-report threshold, suspension and what it blocks, ordering from a suspended or removed shop |
| `integration/adminConsole.test.js` | 28 | The figures, listing each group, courier approval, editing, soft delete, restore, the purge and what it must not destroy |
| `integration/rateLimit.test.js` | 8 | The sign-in, sign-up and general limiters, and that a success is not counted as a failure |
| `unit/delivery.test.js` | 13 | Place lookup, distance, pricing, and the estimate flag on an unrecognised address |
| `unit/comments.test.js` | 40 | Every backend file parses, and every comment in it is really a comment — a guard against a comment landing inside SQL and changing what it does |
| `frontend/api/session.test.js` | 6 | A dead token ending the session rather than showing "Invalid token" |
| `frontend/components/components.test.jsx` | 12 | Prices, the star rating, the tracking timeline |
| `frontend/pages/shopping.test.jsx` | 7 | A product page loading without crashing, the quantity capped at the stock, and the basket's own stock limits |
| `frontend/pages/signup.test.jsx` | 6 | The sign-up checks, and that no account is asked for until the terms are agreed to |

## How they are written

**They drive the real application.** The backend tests import `src/app.js` — the same
Express app the server runs — and call it through supertest. The frontend tests render the
real components. Nothing is re-implemented inside a test.

That matters because the two test files this project started with did the opposite: a
"product validation" test wrote a literal object, validated it inside the test, and
asserted the result. It passed whatever the application did, and would have passed with the
application deleted.

**Every test says what should be true in plain words**, so a failure names a behaviour
rather than a line number:

```
✓ a courier asks for the parcel rather than simply taking it
✓ a second courier cannot ask for a parcel already spoken for
✓ "not picked up" puts the parcel back in the pool
✓ the courier's details stay hidden until the handover is confirmed
✓ a deleted shop's products leave the catalogue
✓ once the window closes the account is removed for good
```

**`tests/helpers/harness.js`** holds the setup: resetting the database, and factories that
build a seller with a storefront, an approved courier on duty, a customer, an admin, a
product, an order. A test that is about pickups is not also about registration.

Ids come back through the same resolvers the application uses, so the tests work on either
account layout rather than assuming column names.

## What they found

Running these on an empty database surfaced bugs that would have met anyone cloning the
repository:

- `initializeDatabase` opened an admin connection but never issued `CREATE DATABASE`, so
  the first query failed with *Unknown database* — and the connection leaked.
- New databases were built with the older account layout, where `customers` and `sellers`
  have no email column. Every admin query reads `s.email` directly, so on a fresh install
  the admin console, complaints queue and verification list all answered 500.
- The `users` role column had no `courier` value: a courier sign-up was stored with no role
  at all, and an admin sign-up landed in the customers table.
- A new courier was stored active, and a backfill then promoted it to approved a minute
  later — skipping the administrator's review entirely.
- `GET` and `POST /api/cart` joined `customers.user_id`, a column that only exists on the
  older layout, so both answered 500 on any current database.
- The product page put two React hooks below its "Loading…" return, so every real product
  threw *Rendered more hooks than during the previous render* once it had loaded.
- `POST /api/auth/register` accepted `role: "admin"`. The helper that makes an admin builds
  it through the model, so no test had ever asked the endpoint for one.

## A trap worth knowing

The database reset originally ran `SET FOREIGN_KEY_CHECKS = 0` and its `TRUNCATE`s across a
connection **pool**, so the setting could land on a different connection than the truncates.
MySQL's `lock_wait_timeout` defaults to a year, so a blocked `TRUNCATE` did not fail — it
waited. One run sat on a single test for **931 seconds**.

It now takes one connection and sets `lock_wait_timeout = 30` on it, so a block becomes a
quick, readable error. That suite went from 1030 seconds to 125.

## What is not covered

Honestly: **the React pages**. The components with logic worth testing are covered, but the
dashboards are large components that mix fetching, state and layout, and are verified by
using them rather than by tests. The API they depend on is covered thoroughly, so what is
untested is the rendering, not the rules.

## End-to-end browser tests

`frontend/cypress/e2e/userFlows.cy.js` clicks through the real site in a real browser:
signing in, refusing a wrong password, refusing a sign-up that has not agreed to the terms,
browsing and searching, and one whole purchase — add to basket, checkout, order placed,
track it.

They drive the running site, so they need the stack up, and they **write real data**
(an account, an order). Point them at a test database, never at one you care about:

```bash
# 1. a backend on its own database, seeded
cd backend
node src/seed.js                     # with DB_NAME set to a throwaway database
PORT=5091 DB_NAME=zamglam_cypress node src/server.js

# 2. a copy of the site pointed at it
cd frontend
ZAMGLAM_API_URL=http://localhost:5091 npx vite --port 3100

# 3. the tests
npx cypress run --config baseUrl=http://localhost:3100
```

Against the ordinary stack on port 3000, `npm run test:e2e` opens Cypress interactively and
`npm run test:e2e:headless` runs it — but that writes to whatever database the backend on
port 5000 is using.

If Cypress refuses to start with `bad option: --smoke-test`, the terminal has
`ELECTRON_RUN_AS_NODE` set (VS Code does this). Clear it for the command:
`env -u ELECTRON_RUN_AS_NODE npx cypress run`.
