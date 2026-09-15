# 1. Setup

Everything needed to get Zamglam running on a machine that has never seen it. This
replaces the six overlapping guides that used to sit in the project root.

## What you need

| | Version | Notes |
| --- | --- | --- |
| Node.js | 18 or newer | `node --version` |
| MySQL or MariaDB | 5.7+ / 10.4+ | XAMPP is the easiest route on Windows and is what this was developed against |

Nothing else. **You do not need to run any SQL by hand** — the backend creates its schema
and applies its own migrations on startup. You do not need Python either; the optional
Flask courier service is not required for anything.

## Running it

### 1. Start MySQL

From the XAMPP Control Panel, press **Start** next to MySQL. It must be listening on 3306
before the backend starts.

### 2. Install

From the project root, once:

```powershell
npm.cmd run install:all
```

That installs the root, `backend/` and `frontend/` dependencies in turn.

### 3. Create the demo data

```powershell
npm.cmd run seed
```

This creates the database if it does not exist, builds every table, and fills it with six
shops, their products, three couriers, an administrator and a customer. It is safe to run
again — existing accounts are left alone.

### 4. Start both halves

```powershell
npm.cmd run dev
```

Backend on **http://localhost:5000**, frontend on **http://localhost:3000**, both in one
terminal with output prefixed `[backend]` and `[frontend]`. Ctrl+C stops both.

Open http://localhost:3000 and sign in with any account from
[02-USER_MANUAL.md](02-USER_MANUAL.md#demo-accounts).

## Other ways to start it

| Command | Where | What it does |
| --- | --- | --- |
| `npm.cmd run dev:backend` | root | Backend only |
| `npm.cmd run dev:frontend` | root | Frontend only |
| `npm run dev` | `backend/` | Backend with auto-reload on changes under `src/` |
| `node server.js` | `backend/` | Backend, no auto-reload |
| `npm start` | `backend/` | The same, the conventional name |
| `.\start.bat` | root | Each in its own window; checks MySQL first and prints the phone address |

## Using it from a phone

The phone must be on the **same Wi-Fi** as the computer running Zamglam.

1. Find the computer's address — `start.bat` prints it, or run `ipconfig` and take the
   IPv4 address (something like `192.168.1.104`).
2. On the phone, open `http://192.168.1.104:3000`.

Everything works as it does on the computer; the menu collapses into the ☰ button.

This works because the frontend calls the API through a **relative** `/api`, which Vite
proxies to the backend. An absolute `http://localhost:5000` would mean *the phone itself*,
which is why the phone used to show pages with no data.

## Configuration

`backend/.env`. Only the first block matters to get started:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=zamglam_db
JWT_SECRET=<a long random string>
```

`JWT_SECRET` signs every sign-in token. Changing it signs everybody out: their stored
tokens no longer verify, and the app asks them to sign in again.

Everything else has a working default:

| Variable | Default | Effect |
| --- | --- | --- |
| `ACCOUNT_DELETE_GRACE_DAYS` | 30 | Days a deleted account can still be restored |
| `PICKUP_ESCALATION_MINUTES` | 60 | How long a parcel sits unclaimed before it is assigned |
| `PICKUP_ESCALATION_SWEEP_MS` | 300000 | How often that check runs |
| `LOGIN_MAX_ATTEMPTS` | 10 | Failed sign-ins allowed per address |
| `LOGIN_WINDOW_MS` | 900000 | Over this long (15 minutes) |
| `SIGNUP_MAX` | 10 | Accounts one address may create |
| `SIGNUP_WINDOW_MS` | 3600000 | Over this long (1 hour) |
| `API_MAX_PER_MINUTE` | 600 | Overall request ceiling per address |
| `DELIVERY_BASE_PRICE` | 20 | ZMW charged before distance |
| `DELIVERY_PRICE_PER_KM` | 5 | ZMW per kilometre |
| `CORS_ORIGIN` | *(any)* | Pin the browser origins allowed to call the API |
| `YANGO_API_URL`, `YANGO_API_KEY` | *(unset)* | Both must be set before the Yango adapter is used at all |

## When it will not start

### `npm.ps1 cannot be loaded because running scripts is disabled on this system`

PowerShell is blocking npm's script wrapper. Use **`npm.cmd`** instead of `npm`, or allow
it once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### `Unknown database` or `ECONNREFUSED 127.0.0.1:3306`

MySQL is not running, or the credentials in `backend/.env` are wrong. Start MySQL from
XAMPP. The database itself does not need creating — the backend does that.

### MySQL will not start from XAMPP

Usually a corrupt Aria recovery log after an unclean shutdown. Back up
`C:\xampp\mysql\data` first, then delete `aria_log.*` and `aria_log_control` from it and
start MySQL again.

### `Port 3000 is in use, trying another one`

**Stop and look.** Something is already serving on 3000 — often an older copy of this
project — and the page you open will not be the code you just started. Find it:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess
Get-Process -Id <that id>
```

### The page loads but has no data

Check the backend is up: open http://localhost:5000/health, which should answer
`{"status":"ok","database":"zamglam_db"}`. On a phone, check you used the computer's IP
rather than `localhost`.

### "Your session has ended. Please sign in again."

The stored sign-in token expired (they last 7 days) or `JWT_SECRET` changed. Sign in
again; nothing is lost.

### A courier cannot go on duty

New courier accounts wait for approval. Sign in as the administrator, open **Couriers**,
and approve them.

## Running the tests

See [06-TESTING.md](06-TESTING.md).

```powershell
cd backend;  npm.cmd test
cd frontend; npm.cmd test
```

The backend tests use their own database, `zamglam_db_test`, created automatically. Your
development data is never touched.
