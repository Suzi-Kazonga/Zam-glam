# Zamglam

A multi-vendor e-commerce platform for Zambian clothing and footwear retailers, with
delivery carried out by independent couriers on the platform.

Final-year project, Department of Computing and Informatics, University of Zambia, 2026.
Supervisor: Mr Alinani Simukonga. How it measures against the proposal’s objectives is in
[docs/08-PROJECT_STATUS.md](docs/08-PROJECT_STATUS.md).

Four kinds of account use it: **shoppers**, **shops**, **couriers** and **administrators**.

**[docs/](docs/README.md)** holds the rest, in reading order:

| | | |
| --- | --- | --- |
| 1 | [Setup](docs/01-SETUP.md) | Installing, running, and what to do when it will not start |
| 2 | [User manual](docs/02-USER_MANUAL.md) | Using it, one role at a time |
| 3 | [Architecture](docs/03-ARCHITECTURE.md) | How the code is put together |
| 4 | [Database](docs/04-DATABASE.md) | Every table and column |
| 5 | [API reference](docs/05-API_REFERENCE.md) | Every endpoint |
| 6 | [Testing](docs/06-TESTING.md) | What the tests cover |
| 7 | [Deployment](docs/07-DEPLOYMENT.md) | Docker, and going live |
| 8 | [Project status](docs/08-PROJECT_STATUS.md) | What is built, what is not, and what is weak |
| 9 | [Diagrams](docs/09-DIAGRAMS.md) | Use case, ER, schema, sequence, state, deployment |

---

## What it does

**A basket can span several shops.** An order is split into one **parcel** per shop, each
collected from that shop's own location, priced on its own distance, and delivered
separately. The order's status is a rollup of whichever parcel is least far along.

**Delivery is a two-party handover.** A shop releases a parcel into a pool that every
on-duty courier can see. A courier *requests* it — claiming it, so no two riders travel for
the same parcel — and the **shop confirms** they physically handed it over. Only then does
the parcel count as collected and the courier's contact details reach the customer. If the
courier never turns up, the shop presses *Not picked up*, the reason is recorded where the
customer can read it, and the parcel goes back into the pool. A parcel nobody claims within
an hour is assigned to the least-loaded courier on duty.

Parcel statuses: `placed → processing → shipped → pickup_requested → picked_up → delivered`.

**Shops are verified.** A shop uploads its registration documents, an administrator checks
them, and a verified shop carries a badge shoppers can see.

**Couriers are approved.** A new courier sign-up cannot take work until an administrator
lets it in.

**Complaints have consequences.** Any party to an order can report another party on it —
only somebody they actually dealt with, once per order. Three open complaints against the
same party flag them for an administrator, who can suspend the account. A suspended shop
shows as *Unavailable*, cannot be ordered from, and is told why.

**Admin actions change real accounts.** Editing, suspending and deleting write to the
database. Deleting is a soft delete: the account is greyed out for 30 days — unable to sign
in, its products out of the catalogue — and can be restored. After that a scheduled sweep
removes it permanently, keeping anything order history still refers to.

### Not implemented, deliberately

- **Payment is simulated.** The chosen method is recorded; nothing is charged. Airtel Money
  and MTN MoMo integrations are commercial arrangements needing credentials this project
  does not have.
- **Distances come from a town lookup, not a geocoder.** `backend/src/services/places.js`
  matches free-text addresses against Zambian towns and Lusaka neighbourhoods. An
  unrecognised address falls back to central Lusaka and the quote is flagged as an
  estimate.
- **Third-party couriers.** `courierProvider.js` defines the adapter a company such as
  Yango would fill in; the platform runs on its own riders.

---

## Running it

### Prerequisites

- Node.js 18+
- MySQL or MariaDB (XAMPP is the easiest route on Windows)

### Fastest start (Windows)

Start MySQL from the XAMPP Control Panel, then from the project root:

```powershell
npm.cmd run install:all   # first time only — root, backend and frontend
npm.cmd run seed          # creates the schema and demo data
npm.cmd run dev           # backend and frontend together
```

Backend on http://localhost:5000, frontend on http://localhost:3000, both in the one
terminal with their output prefixed `[backend]` and `[frontend]`. Ctrl+C stops both.

Separately, if you prefer two terminals:

```powershell
npm.cmd run dev:backend
npm.cmd run dev:frontend
```

Inside `backend/`, `node server.js`, `npm run dev` (auto-reload) and `npm start` all work.

`.\start.bat` opens each in its own window, checks MySQL first, and prints the address to
use from a phone.

**Use `npm.cmd`, not `npm`.** On a machine whose PowerShell execution policy blocks
unsigned scripts, plain `npm run dev` fails with *"npm.ps1 cannot be loaded because running
scripts is disabled on this system"*. `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
once, if you prefer plain `npm`.

**If Vite says "Port 3000 is in use, trying another one", stop and investigate.** Another
server is already running — possibly an old copy of the project — and the page you open
will not be the one you just started.

### From a phone

Open `http://<the computer's IP>:3000` on the same Wi-Fi; `start.bat` prints it. The
frontend calls the API through a relative `/api`, proxied by Vite, so the same build works
from any device on the network.

### Configuration

`backend/.env`:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=zamglam_db
JWT_SECRET=<a long random string>
```

Optional, with their defaults:

| Variable | Default | Effect |
| --- | --- | --- |
| `ACCOUNT_DELETE_GRACE_DAYS` | 30 | How long a deleted account can be restored |
| `PICKUP_ESCALATION_MINUTES` | 60 | Before an unclaimed parcel is assigned |
| `PICKUP_ESCALATION_SWEEP_MS` | 300000 | How often that sweep runs |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_WINDOW_MS` | 10 / 15 min | Failed sign-ins per address |
| `SIGNUP_MAX` / `SIGNUP_WINDOW_MS` | 10 / 1 hour | Accounts created per address |
| `API_MAX_PER_MINUTE` | 600 | Overall ceiling per address |
| `DELIVERY_BASE_PRICE` / `DELIVERY_PRICE_PER_KM` | 20 / 5 | Delivery pricing, ZMW |

The schema is created and migrated on startup — and by `npm run seed` — so a fresh clone
needs no SQL run by hand.

---

## Demo accounts

Created by `npm run seed`:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@zamglam.local | ADMIN123456 |
| Shop | mud@zamglam.local | MUD123456 |
| Shop | jets@zamglam.local | JETS123456 |
| Shop | bata@zamglam.local | BATA123456 |
| Shop | pep@zamglam.local | PEP123456 |
| Shop | mrprice@zamglam.local | MRPRICE123456 |
| Shop | fashionsgalore@zamglam.local | FASHION123456 |
| Courier | mwansa@zamglamcourier.local | COURIER123456 |
| Courier | thandiwe@zamglamcourier.local | COURIER123456 |
| Courier | joseph@zamglamcourier.local | COURIER123456 |
| Customer | customer@zamglam.local | CUSTOMER123456 |

Seeded couriers start **unapproved**: sign in as the administrator and approve one before
it can take parcels.

---

## Tests

```powershell
cd backend;  npm.cmd test     # 192 tests
cd frontend; npm.cmd test     # 18 tests
```

The backend tests drive the real Express app through supertest against a real database
(`zamglam_db_test`, created automatically — the development database is never touched).
They cover registration and sign-in, the catalogue and its ownership rules, orders
splitting into parcels, the whole handover including denial, complaints and suspension, the
admin console with soft delete and purge, and the rate limiters. They run serially
(`--runInBand`), since they share one database.

The frontend tests cover the real components and the session handling.

---

## Layout

```
Zam-glam/
├── backend/
│   ├── server.js            # entry point; `node server.js` works from here
│   ├── src/
│   │   ├── app.js           # the Express app, with nothing that binds a port
│   │   ├── server.js        # listens, and runs the escalation/purge sweep
│   │   ├── config/db.js     # connection, schema creation and migrations
│   │   ├── controllers/     # request handling
│   │   ├── models/          # SQL and the rules around it
│   │   ├── middleware/      # auth, roles, suspension, rate limits, errors
│   │   ├── routes/
│   │   ├── services/        # delivery pricing, place lookup
│   │   ├── utils/accounts.js# account-id resolution (see below)
│   │   └── seed.js
│   └── tests/               # integration and unit tests
├── frontend/
│   └── src/
│       ├── api/             # one module per area of the API
│       ├── components/
│       ├── context/         # auth and cart
│       ├── pages/
│       └── utils/
├── docs/USER_MANUAL.md
├── courier-service/         # optional Flask service the HTTP courier adapter can call
├── database/                # reference SQL (the app creates its own schema)
└── package.json             # runs both halves together
```

**One thing to know before reading the models.** Two account layouts exist. New databases
put the login on the account row itself (`sellers.email`, `customers.email`); older ones
have a central `users` table that those rows link to by `user_id`. `req.user.id` therefore
means different things on each, and every lookup that turns it into a profile id goes
through `src/utils/accounts.js`. Doing it inline is what once left product creation failing
with *"Unknown column 'user_id'"*.

---

## Built with

**Backend** — Node.js, Express 4, MySQL/MariaDB via mysql2, JWT, bcrypt, multer, helmet,
express-rate-limit, Jest and supertest.

**Frontend** — React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios, Jest and Testing
Library.

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| *"Your session has ended"* | The stored token expired, or `JWT_SECRET` changed. Sign in again. |
| *"Unknown database"* | MySQL is not running, or the credentials in `backend/.env` are wrong. The schema itself is created automatically. |
| Vite picked a different port | Another server is already running on 3000. Stop it — otherwise you are looking at a different copy of the app. |
| No data on a phone | The phone must be on the same Wi-Fi and use the computer's IP, not `localhost`. |
| `npm.ps1 cannot be loaded` | PowerShell execution policy. Use `npm.cmd`, or set `RemoteSigned` once. |
