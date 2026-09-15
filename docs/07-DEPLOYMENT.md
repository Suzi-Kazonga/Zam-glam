# 7. Deployment

> **Read this first.** Docker is not installed on the machine this project was built on, so
> the compose stack below has **not been run end to end**. The definitions were corrected
> against the code — see [What was wrong](#what-was-wrong-with-the-docker-setup) — but treat
> a first `docker compose up` as something to watch, not something proven. The supported,
> tested way to run Zamglam is [01-SETUP.md](01-SETUP.md).

## What is in the stack

`docker-compose.yml` defines five services on one network:

| Service | Image / build | Port | What it is |
| --- | --- | --- | --- |
| `database` | `mysql:8.0` | 3307 → 3306 | The data. Persisted in the `mysql_data` volume |
| `backend` | `backend/Dockerfile` | 5000 | The Express API |
| `frontend` | `frontend/Dockerfile` | 80 | The built React bundle, served by nginx |
| `courier_service` | `courier-service/Dockerfile` | 5001 | Optional Flask delivery service |
| `phpmyadmin` | `phpmyadmin:latest` | 8080 | Optional database browser |

The backend waits for the database's health check before starting, and creates its own
schema on first boot.

## Running it

```bash
docker compose up --build       # first time, or after changing a Dockerfile
docker compose up -d            # afterwards
docker compose logs -f backend  # watch one service
docker compose down             # stop; add -v to also delete the data
```

Then open **http://localhost** (the frontend is on port 80, not 3000, in this setup).

To load the demo data once the stack is up:

```bash
docker compose exec backend npm run seed
```

## Configuration

Compose reads these from a `.env` file beside `docker-compose.yml`, with the defaults shown:

| Variable | Default | Notes |
| --- | --- | --- |
| `DB_ROOT_PASSWORD` | `root` | |
| `DB_NAME` | `zamglam_db` | |
| `DB_USER` / `DB_PASSWORD` | `zamglam_user` / `zamglam_pass` | |
| `DB_HOST_PORT` | 3307 | Host port, kept off 3306 so it does not clash with XAMPP |
| `BACKEND_PORT` | 5000 | |
| `FRONTEND_PORT` | 80 | |
| `JWT_SECRET` | *(an obvious placeholder)* | **Set this.** See below |
| `CORS_ORIGIN` | | One origin, or several separated by commas |

### Before putting this anywhere real

1. **Set `JWT_SECRET` to a long random string.** The default in compose is a placeholder;
   anyone who knows it can mint a token for any account, including an administrator.
2. **Change `DB_PASSWORD` and `DB_ROOT_PASSWORD`.**
3. **Drop phpMyAdmin**, or do not publish its port. It is a database console on the
   internet.
4. **Terminate TLS in front of nginx.** Sign-ins and tokens cross the wire in plain text
   otherwise. `trust proxy` is already set, so the rate limiter will see real client
   addresses rather than counting every visitor as the proxy.
5. **Back up the `mysql_data` volume.** `docker compose down -v` deletes it.

## How the pieces find each other

The browser only ever talks to **nginx on port 80**. `nginx.conf` proxies `/api/` to
`http://backend:5000` inside the compose network. The React bundle calls a relative `/api`,
so it does not need to know where the backend is — which is the same reason the development
setup works from a phone.

## What was wrong with the Docker setup

These were corrected while writing this document, so the definitions match the code:

- **The backend image could never build.** Its Dockerfile copied `backend/config`,
  `backend/controllers`, `backend/middleware`, `backend/models`, `backend/routes` and
  `backend/services`. None of those exist — the application lives under `backend/src/` — and
  Docker fails a `COPY` whose source is missing, so the build stopped at the first one.
- **The database was seeded with an outdated schema.** Compose mounted
  `database/schema.sql` as an init script. That file describes the older account layout and
  has no `shipments` or `reports` tables, so a container built from it came up missing
  parcels and complaints entirely. The mount is gone; the backend builds its own schema,
  which is the only definition kept current.
- **`CORS_ORIGIN` did nothing.** Compose set it, and the app called `cors()` with no
  arguments. It is now honoured when set, and stays permissive when it is not.
- **`VITE_API_URL` did nothing either.** Vite inlines its variables at build time, so
  setting one on a running container has no effect — and had it worked, an absolute URL
  would have broken the nginx proxy. It has been removed.

## Deploying without Docker

Also viable, and closer to how it was developed:

1. Install Node 18+ and MySQL on the server.
2. `npm ci --omit=dev` in `backend/`.
3. Set `backend/.env` — real `JWT_SECRET`, database credentials, `NODE_ENV=production`.
4. Run the backend under a process manager (`pm2`, or a systemd unit) with
   `node server.js`.
5. `npm ci && npm run build` in `frontend/`, and serve `frontend/dist` with nginx, proxying
   `/api/` to the backend. `nginx.conf` in this repository is a working starting point.
6. Put TLS in front of it.

## The courier service

`courier-service/` is a small Flask app the HTTP courier adapter can call. It is **not
required** — the platform prices delivery in-process by default, and only uses an outside
provider when `COURIER_SERVICE_URL` (or both Yango variables) are set. Leave the container
out if you do not need it.
