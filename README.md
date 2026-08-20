# Optical Power Monitor

Production-ready repository for a multi-vendor optical power and router-capacity monitoring application. The application provides a FastAPI backend and a Next.js frontend for authenticated operators to query Huawei, ZTE, and Cisco routers using stored read-only SSH credentials.

## Features

- Authenticated operator access with JWT bearer tokens
- User roles: Super Admin, Admin, User
- Encrypted router credentials at rest
- Huawei, ZTE, and Cisco optical RX/TX checks
- Router inventory management
- Router port/capacity checks
- User and administrative log views
- SQLite support for local development/testing
- PostgreSQL support and enforcement for production
- Alembic database migrations
- Database-aware `/health` endpoint
- Nginx reverse-proxy configuration
- systemd services with automatic restart and boot startup
- Environment-based secrets and database configuration

## Technology stack

| Layer | Technology |
| --- | --- |
| Backend | Python 3.12, FastAPI, Uvicorn |
| ORM / migrations | SQLAlchemy 2, Alembic |
| Development DB | SQLite |
| Production DB | PostgreSQL via `psycopg` |
| Router access | Netmiko / Paramiko |
| Authentication | JWT (`python-jose`), bcrypt |
| Credential encryption | Fernet (`cryptography`) derived from `SECRET_KEY` |
| Frontend | Next.js 16, React 19, TypeScript |
| Reverse proxy | Nginx |
| Process management | systemd |

Node.js **20.9+** is required by the current Next.js version. The included Ubuntu installer uses Node.js 22.

## Project structure

```text
optical-power-monitor/
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   ├── capacity/
│   │   ├── inventory/
│   │   ├── optical/
│   │   ├── routers/
│   │   ├── users/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── migrations/
│   │   └── versions/
│   ├── .env.example
│   └── alembic.ini
├── frontend/
│   ├── app/
│   ├── .env.local.example
│   ├── next.config.ts
│   ├── package.json
│   └── package-lock.json
├── deploy/
│   ├── nginx/
│   ├── systemd/
│   └── install_ubuntu.sh
├── .gitignore
├── requirements.txt
└── README.md
```

Generated dependencies/builds, local databases, `.env` files, router import data, and operational notes are intentionally excluded from Git.

---

## Local development setup

### 1. Backend

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

cp backend/.env.example backend/.env
cd backend
alembic upgrade head
python -m app.create_super_admin
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be available at `http://127.0.0.1:8000`. Development API documentation is available at `/docs`.

### 2. Frontend

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`.

For normal local development, no frontend environment file is required: when the UI runs on `localhost` or `127.0.0.1`, it automatically calls the backend on port `8000`.

If the API is hosted somewhere else, create `frontend/.env.local`:

```bash
cp frontend/.env.local.example frontend/.env.local
```

Then set:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://your-api-host:8000
```

Restart/rebuild Next.js after changing a `NEXT_PUBLIC_*` variable because it is embedded at build time.

---

## SQLite setup (development/testing)

SQLite remains the default development database:

```dotenv
ENVIRONMENT=development
DATABASE_URL=sqlite:///./bahon_optical.db
```

The database file is resolved inside `backend/` and is ignored by Git.

Create/update the schema with Alembic:

```bash
cd backend
../.venv/bin/alembic upgrade head
```

Do not use the old one-off migration scripts as the normal migration workflow. They remain only as legacy compatibility helpers.

### Existing pre-Alembic SQLite database

If you have an older SQLite database whose schema already contains all current tables/columns, back it up first and inspect it before stamping it as migrated. If it exactly matches the initial schema:

```bash
cd backend
../.venv/bin/alembic stamp 20260820_0001
../.venv/bin/alembic current
```

Do **not** run `stamp` on a database whose schema does not already match the migration.

---

## PostgreSQL setup (production)

Production mode refuses to start if `DATABASE_URL` points to SQLite.

Install PostgreSQL on Ubuntu:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Create the application role with an interactive password prompt:

```bash
sudo -u postgres createuser --pwprompt optical_power_monitor
sudo -u postgres createdb --owner optical_power_monitor optical_power_monitor
```

Set `backend/.env` to a PostgreSQL URL using the psycopg 3 driver:

```dotenv
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://optical_power_monitor:URL_ENCODED_PASSWORD@127.0.0.1:5432/optical_power_monitor
```

If the password contains characters such as `@`, `:`, `/`, `#`, or `%`, URL-encode the password before placing it in the URL.

Apply migrations:

```bash
cd /opt/optical-power-monitor/backend
/opt/optical-power-monitor/.venv/bin/alembic upgrade head
```

---

## Environment variables

Backend configuration is read from `backend/.env` or the process environment. Never commit the real file.

| Variable | Development default | Production guidance |
| --- | --- | --- |
| `APP_NAME` | BAHON Optical Power Monitor | Optional display name |
| `APP_VERSION` | 1.0.0 | Set per release if desired |
| `ENVIRONMENT` | `development` | **Must be `production`** |
| `API_PREFIX` | `/api` | Usually keep `/api` |
| `DATABASE_URL` | SQLite | **PostgreSQL required** |
| `SECRET_KEY` | development placeholder | **Unique random value, 32+ chars** |
| `ALGORITHM` | `HS256` | Keep unless code is intentionally changed |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Consider a shorter period |
| `ROUTER_SSH_TIMEOUT` | `20` | Tune for network conditions |
| `FRONTEND_URL` | localhost | Public frontend origin |
| `HOST_FRONTEND_URL` | empty | Optional second origin |
| `CORS_ORIGINS` | local frontend origins | Comma-separated trusted origins only |
| `ALLOWED_HOSTS` | localhost/127.0.0.1 | Public domain/IP plus `127.0.0.1`; no `*` |

Generate a strong secret:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

**Important:** `SECRET_KEY` signs JWTs and is also used to derive the encryption key for stored router passwords. Back it up securely. Changing it later makes previously stored router credentials undecryptable and invalidates existing login tokens.

---

## Database migrations

Alembic is the authoritative schema-management mechanism.

Useful commands:

```bash
cd backend
../.venv/bin/alembic current
../.venv/bin/alembic history
../.venv/bin/alembic upgrade head
```

When creating a future migration after changing SQLAlchemy models:

```bash
../.venv/bin/alembic revision --autogenerate -m "describe change"
../.venv/bin/alembic upgrade head
```

Review generated migrations before applying them to production. Back up the production database before destructive schema changes.

---

# Fresh Ubuntu production installation

The recommended layout is:

```text
/opt/optical-power-monitor
```

The deployment files assume the service account is `opticalmon` and the repository is at that path.

## 1. Install Git and clone the repository

```bash
sudo apt update
sudo apt install -y git
sudo git clone https://github.com/YOUR-ACCOUNT/optical-power-monitor.git /opt/optical-power-monitor
cd /opt/optical-power-monitor
```

If the repository is private, authenticate GitHub using your normal GitHub CLI/credential method rather than putting a token in the clone URL.

## 2. Create PostgreSQL database/user

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres createuser --pwprompt optical_power_monitor
sudo -u postgres createdb --owner optical_power_monitor optical_power_monitor
```

## 3. Create production environment file

```bash
sudo cp backend/.env.example backend/.env
sudo nano backend/.env
```

At minimum, change these values:

```dotenv
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://optical_power_monitor:URL_ENCODED_PASSWORD@127.0.0.1:5432/optical_power_monitor
SECRET_KEY=GENERATE_A_LONG_RANDOM_SECRET
FRONTEND_URL=http://YOUR_SERVER_IP_OR_DOMAIN
CORS_ORIGINS=http://YOUR_SERVER_IP_OR_DOMAIN
ALLOWED_HOSTS=YOUR_SERVER_IP_OR_DOMAIN,127.0.0.1
```

For HTTPS, use the final `https://...` origin values after TLS is configured.

## 4. Run the included Ubuntu installer

```bash
cd /opt/optical-power-monitor
sudo ./deploy/install_ubuntu.sh
```

The script:

- installs Python, PostgreSQL, Nginx, and required OS packages;
- installs Node.js 22 when the server does not already have Node.js 20+;
- creates the non-login service user `opticalmon`;
- creates `/opt/optical-power-monitor/.venv`;
- installs pinned Python dependencies;
- runs `npm ci` and builds the frontend;
- runs `alembic upgrade head`;
- installs the backend/frontend systemd services;
- installs the Nginx reverse proxy;
- enables automatic startup after reboot.

## 5. Create the initial super-admin

```bash
sudo -u opticalmon bash -c \
  "cd /opt/optical-power-monitor/backend && /opt/optical-power-monitor/.venv/bin/python -m app.create_super_admin"
```

The password is entered interactively and is not stored in the repository or printed back to the terminal.

## 6. Verify deployment

```bash
sudo systemctl status optical-power-monitor-backend --no-pager
sudo systemctl status optical-power-monitor-frontend --no-pager
sudo systemctl status nginx --no-pager

curl -fsS http://127.0.0.1/health
```

Expected health response:

```json
{"status":"ok","service":"optical-power-monitor-backend","database":"ok"}
```

Then browse to the server IP/domain.

---

## Production deployment architecture

```text
Browser
   |
   v
Nginx :80/:443
   |----------------------|
   v                      v
Next.js 127.0.0.1:3000   FastAPI 127.0.0.1:8000
                              |
                              v
                    PostgreSQL 127.0.0.1:5432
```

Nginx sends `/api/*` and `/health` to FastAPI and all other paths to Next.js. This lets the production frontend use same-origin API calls and avoids exposing ports `3000` and `8000` publicly.

The included Nginx file is HTTP-only so it can work immediately by IP. For Internet-facing deployment, configure TLS (for example with your organization's certificate process or Certbot) and redirect HTTP to HTTPS.

---

## Service management

```bash
# Status
sudo systemctl status optical-power-monitor-backend
sudo systemctl status optical-power-monitor-frontend

# Restart
sudo systemctl restart optical-power-monitor-backend
sudo systemctl restart optical-power-monitor-frontend

# Stop/start
sudo systemctl stop optical-power-monitor-backend optical-power-monitor-frontend
sudo systemctl start optical-power-monitor-backend optical-power-monitor-frontend

# Logs
sudo journalctl -u optical-power-monitor-backend -f
sudo journalctl -u optical-power-monitor-frontend -f
sudo journalctl -u nginx -f
```

Both application services use `Restart=on-failure` and are enabled for boot startup.

---

## Updating the application

Before an update, back up PostgreSQL and the production `.env` file.

```bash
cd /opt/optical-power-monitor
sudo systemctl stop optical-power-monitor-backend optical-power-monitor-frontend

sudo git pull --ff-only

sudo /opt/optical-power-monitor/.venv/bin/pip install -r requirements.txt
sudo bash -c \
  "cd /opt/optical-power-monitor/frontend && npm ci && npm run build"
sudo mkdir -p /opt/optical-power-monitor/frontend/.next/cache
sudo chown -R opticalmon:opticalmon /opt/optical-power-monitor/frontend/.next/cache

sudo bash -c \
  "cd /opt/optical-power-monitor/backend && /opt/optical-power-monitor/.venv/bin/alembic upgrade head"

sudo systemctl start optical-power-monitor-backend optical-power-monitor-frontend
curl -fsS http://127.0.0.1/health
```

If deployment files changed:

```bash
sudo cp deploy/systemd/*.service /etc/systemd/system/
sudo cp deploy/nginx/optical-power-monitor.conf /etc/nginx/sites-available/optical-power-monitor
sudo systemctl daemon-reload
sudo nginx -t
sudo systemctl restart nginx optical-power-monitor-backend optical-power-monitor-frontend
```

---

## Backup and restore

### PostgreSQL backup

```bash
sudo -u postgres pg_dump -Fc optical_power_monitor \
  > /secure-backup-path/optical_power_monitor_$(date +%F).dump
```

Store backups outside the application directory and restrict their permissions. The database may contain encrypted router credentials, operational network inventory, and user data.

Also back up `backend/.env` in a separate protected secrets backup because `SECRET_KEY` is required to decrypt existing router credentials.

### PostgreSQL restore

Restore into an empty database owned by the application role:

```bash
sudo -u postgres pg_restore \
  --clean --if-exists \
  --dbname=optical_power_monitor \
  /secure-backup-path/optical_power_monitor_YYYY-MM-DD.dump
```

Validate the application and migration state after restoring:

```bash
cd /opt/optical-power-monitor/backend
sudo -u opticalmon /opt/optical-power-monitor/.venv/bin/alembic current
curl -fsS http://127.0.0.1/health
```

### SQLite development backup

For a stopped local development instance, copying `backend/bahon_optical.db` is sufficient. SQLite is not the recommended production backup/deployment path.

---

## Router inventory import

Operational inventory files are intentionally not committed. Create `backend/router_inventory_import.txt` locally when needed, then run:

```bash
cd backend
../.venv/bin/python -m app.import_router_inventory
```

The generated skipped-record report is also ignored by Git.

---

## Security notes

- Production rejects SQLite, the development `SECRET_KEY`, and wildcard trusted hosts.
- FastAPI Swagger/ReDoc/OpenAPI endpoints are disabled in production.
- Router passwords are encrypted before database storage.
- Nginx and Next.js send basic browser security headers.
- Backend and frontend services bind only to loopback in the provided systemd configuration.
- Nginx should be the only public web listener.
- Use read-only router accounts with the least permissions required for show/display commands.
- Do not reuse the application `SECRET_KEY` anywhere else.
- Protect `backend/.env` with restrictive permissions (the installer uses root ownership and mode `640` for the service group) and protect PostgreSQL backups.
- The current frontend stores the bearer token in browser `localStorage`, preserving the application's existing authentication design. This makes XSS prevention important. Moving authentication to secure HttpOnly cookies would be a larger application/authentication change and is not included in this production-packaging pass.
- CSRF protection is not currently required for API authentication because the API uses an explicit `Authorization: Bearer` header rather than browser authentication cookies.

---

## Troubleshooting

### Backend will not start in production

Check logs:

```bash
sudo journalctl -u optical-power-monitor-backend -n 100 --no-pager
```

Common causes:

- `ENVIRONMENT=production` while `DATABASE_URL` still points to SQLite;
- weak/default `SECRET_KEY`;
- `ALLOWED_HOSTS=*` or missing real host;
- PostgreSQL unavailable or incorrect credentials;
- pending/failed Alembic migration.

Test PostgreSQL independently:

```bash
sudo -u postgres psql -d optical_power_monitor -c 'SELECT 1;'
```

### Frontend cannot reach API

In the provided Nginx deployment, the frontend uses same-origin `/api/...` requests. Check:

```bash
curl -i http://127.0.0.1/health
curl -i http://127.0.0.1/api/auth/me
sudo nginx -t
sudo journalctl -u nginx -n 100 --no-pager
```

A `401` from `/api/auth/me` without a token is normal and confirms the request reached FastAPI.

### `npm ci` fails

Confirm:

```bash
node --version
npm --version
```

Node must be `20.9.0` or newer. Node 22 is recommended for this repository.

### Alembic migration fails

Check the active database URL and current migration state:

```bash
cd backend
../.venv/bin/alembic current
../.venv/bin/alembic history
```

Do not delete the Alembic version table to “fix” migration history. Restore a backup or correct the migration state deliberately.

### Router SSH checks time out

Verify server routing/firewall access to the router management network and confirm the configured router credential is active. Adjust `ROUTER_SSH_TIMEOUT` only after checking connectivity and SSH reachability.

---

## GitHub readiness checklist

Before pushing:

```bash
git status
git check-ignore backend/.env backend/bahon_optical.db backend/router_inventory_import.txt
```

The real `.env`, SQLite database, router import files, `node_modules`, `.next`, Python virtual environments, caches, and local notes must remain untracked.

Recommended first commit:

```bash
git init
git add .
git status
git commit -m "Prepare optical power monitor for production deployment"
```

Then add your GitHub remote and push using your preferred GitHub extension/CLI workflow.
