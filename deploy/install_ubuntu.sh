#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/optical-power-monitor"
APP_USER="opticalmon"
NODE_MAJOR="${NODE_MAJOR:-22}"

if [[ $EUID -ne 0 ]]; then
  echo "Run this script as root: sudo ./deploy/install_ubuntu.sh" >&2
  exit 1
fi

if [[ ! -f "$APP_DIR/backend/.env" ]]; then
  echo "Missing $APP_DIR/backend/.env" >&2
  echo "Copy backend/.env.example to backend/.env, configure PostgreSQL and production secrets, then rerun." >&2
  exit 1
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl gnupg git nginx postgresql postgresql-contrib \
  python3 python3-pip python3-venv

node_ok=false
if command -v node >/dev/null 2>&1; then
  node_major="$(node -p 'process.versions.node.split(".")[0]')"
  if (( node_major >= 20 )); then
    node_ok=true
  fi
fi

if [[ "$node_ok" != true ]]; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --home /var/lib/opticalmon --create-home --shell /usr/sbin/nologin "$APP_USER"
fi

chown -R root:"$APP_USER" "$APP_DIR"
chmod 640 "$APP_DIR/backend/.env"

python3 -m venv "$APP_DIR/.venv"
"$APP_DIR/.venv/bin/pip" install --upgrade pip
"$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/requirements.txt"

cd "$APP_DIR/frontend"
npm ci
npm run build
mkdir -p "$APP_DIR/frontend/.next/cache"
chown -R "$APP_USER:$APP_USER" "$APP_DIR/frontend/.next/cache"

cd "$APP_DIR/backend"
"$APP_DIR/.venv/bin/alembic" upgrade head

install -m 0644 "$APP_DIR/deploy/systemd/optical-power-monitor-backend.service" /etc/systemd/system/
install -m 0644 "$APP_DIR/deploy/systemd/optical-power-monitor-frontend.service" /etc/systemd/system/
install -m 0644 "$APP_DIR/deploy/nginx/optical-power-monitor.conf" /etc/nginx/sites-available/optical-power-monitor
ln -sfn /etc/nginx/sites-available/optical-power-monitor /etc/nginx/sites-enabled/optical-power-monitor
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl daemon-reload
systemctl enable --now optical-power-monitor-backend optical-power-monitor-frontend nginx

echo
echo "Installation complete."
echo "Check: systemctl status optical-power-monitor-backend optical-power-monitor-frontend nginx"
echo "Health: curl -fsS http://127.0.0.1/health"
echo "Create the initial account (if needed):"
echo "  sudo -u $APP_USER bash -c \"cd '$APP_DIR/backend' && '$APP_DIR/.venv/bin/python' -m app.create_super_admin\""
