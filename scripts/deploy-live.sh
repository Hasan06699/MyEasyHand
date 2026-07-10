#!/usr/bin/env bash
# Deploy MyEasyHand to production VPS (password or key SSH)
# Usage:
#   1. cp doc/deployment/secrets/server.access.example doc/deployment/secrets/server.access
#   2. Set SSH_PASSWORD=your-password in server.access
#   3. ./scripts/deploy-live.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ACCESS_FILE="${ROOT}/doc/deployment/secrets/server.access"

if [[ ! -f "$ACCESS_FILE" ]]; then
  echo "Missing ${ACCESS_FILE}"
  echo "Copy server.access.example and set SSH_PASSWORD."
  exit 1
fi

# shellcheck source=/dev/null
source "$ACCESS_FILE"

: "${VPS_IP:?Set VPS_IP in server.access}"
: "${SSH_USER:?Set SSH_USER in server.access}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/myeasyhand}"
DOMAIN="${DOMAIN:-myeasyhand.in}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.myeasyhand.in}"
API_DOMAIN="${API_DOMAIN:-api.myeasyhand.in}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -p "$SSH_PORT")

install_sshpass() {
  if command -v sshpass &>/dev/null; then return; fi
  if [[ "$(uname)" == "Darwin" ]] && command -v brew &>/dev/null; then
    brew install hudochenkov/sshpass/sshpass
  elif command -v apt-get &>/dev/null; then
    sudo apt-get install -y sshpass
  else
    echo "Install sshpass for password SSH, or use SSH_KEY_PATH."
    exit 1
  fi
}

run_ssh() {
  if [[ -n "${SSH_PASSWORD:-}" ]]; then
    install_sshpass
    sshpass -p "$SSH_PASSWORD" ssh "${SSH_OPTS[@]}" "${SSH_USER}@${VPS_IP}" "$@"
  elif [[ -n "${SSH_KEY_PATH:-}" ]]; then
    ssh -i "$SSH_KEY_PATH" "${SSH_OPTS[@]}" "${SSH_USER}@${VPS_IP}" "$@"
  else
    echo "Set SSH_PASSWORD or SSH_KEY_PATH in server.access"
    exit 1
  fi
}

run_rsync() {
  local src="$1" dest="$2"
  local excludes=(--exclude node_modules --exclude .next --exclude dist --exclude .git --exclude uploads --exclude coverage --exclude .env)
  if [[ -n "${SSH_PASSWORD:-}" ]]; then
    install_sshpass
    sshpass -p "$SSH_PASSWORD" rsync -az --delete "${excludes[@]}" -e "ssh ${SSH_OPTS[*]}" "${src}" "${SSH_USER}@${VPS_IP}:${dest}"
  else
    rsync -az --delete "${excludes[@]}" -e "ssh -i ${SSH_KEY_PATH} ${SSH_OPTS[*]}" "${src}" "${SSH_USER}@${VPS_IP}:${dest}"
  fi
}

echo "==> [1/8] Bootstrap server (Docker, Node 20, PM2, Apache modules)"
run_ssh "bash -s" <<'REMOTE_BOOT'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git rsync apache2 2>/dev/null || true
if ! command -v docker &>/dev/null; then curl -fsSL https://get.docker.com | sh; fi
NODE_MAJOR="$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/' || echo 0)"
if [[ "${NODE_MAJOR}" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
command -v pm2 &>/dev/null || npm install -g pm2
a2enmod proxy proxy_http headers rewrite ssl >/dev/null 2>&1 || true
mkdir -p /var/www/myeasyhand
REMOTE_BOOT

echo "==> [2/8] Upload application code → ${DEPLOY_PATH}"
run_ssh "mkdir -p ${DEPLOY_PATH}/{api,web,admin}"
run_rsync "${ROOT}/myeasyhand-api/" "${DEPLOY_PATH}/api/"
run_rsync "${ROOT}/myeasyhand-web/" "${DEPLOY_PATH}/web/"
run_rsync "${ROOT}/myeasyhand-admin/" "${DEPLOY_PATH}/admin/"

echo "==> [3/8] Write production environment files"
run_ssh "bash -s" <<REMOTE_ENV
set -euo pipefail
API_ENV="${DEPLOY_PATH}/api/.env"
WEB_ENV="${DEPLOY_PATH}/web/.env"
ADMIN_ENV="${DEPLOY_PATH}/admin/.env"

if [[ ! -f "\$API_ENV" ]]; then
  cp "${DEPLOY_PATH}/api/.env.example" "\$API_ENV"
fi

# Keep existing secrets; force production URLs / docker mongo+redis
sed -i 's|^NODE_ENV=.*|NODE_ENV=production|' "\$API_ENV" || true
grep -q '^NODE_ENV=' "\$API_ENV" || echo 'NODE_ENV=production' >> "\$API_ENV"
sed -i 's|^PORT=.*|PORT=5051|' "\$API_ENV" || true
grep -q '^PORT=' "\$API_ENV" || echo 'PORT=5051' >> "\$API_ENV"
sed -i 's|^APP_URL=.*|APP_URL=https://${API_DOMAIN}|' "\$API_ENV" || true
sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=https://${DOMAIN},https://${ADMIN_DOMAIN},https://www.${DOMAIN}|' "\$API_ENV" || true
# Docker network hosts (compose overrides these too)
if grep -q '^MONGODB_URI=' "\$API_ENV"; then
  sed -i 's|^MONGODB_URI=.*|MONGODB_URI=mongodb://mongodb:27017/myeasyhand|' "\$API_ENV"
else
  echo 'MONGODB_URI=mongodb://mongodb:27017/myeasyhand' >> "\$API_ENV"
fi
if grep -q '^REDIS_URL=' "\$API_ENV"; then
  sed -i 's|^REDIS_URL=.*|REDIS_URL=redis://redis:6379|' "\$API_ENV"
else
  echo 'REDIS_URL=redis://redis:6379' >> "\$API_ENV"
fi

cat > "\$WEB_ENV" <<EOF
NEXT_PUBLIC_API_URL=https://${API_DOMAIN}/api/v1
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_ONESIGNAL_APP_ID=5509abf7-7bcb-43b9-bc4f-583961d89c63
PORT=3031
EOF

cat > "\$ADMIN_ENV" <<EOF
NEXT_PUBLIC_APP_NAME=MyEasyHand Admin
NEXT_PUBLIC_APP_URL=https://${ADMIN_DOMAIN}
NEXT_PUBLIC_API_URL=https://${API_DOMAIN}/api/v1
NEXT_PUBLIC_WEBSITE_URL=https://${DOMAIN}
NEXT_PUBLIC_ONESIGNAL_APP_ID=5509abf7-7bcb-43b9-bc4f-583961d89c63
PORT=8081
EOF
REMOTE_ENV

echo "==> [4/8] Configure Apache reverse proxies (keep SSL certs)"
run_ssh "bash -s" <<REMOTE_APACHE
set -euo pipefail

cat > /etc/apache2/sites-available/api.myeasyhand.in-ssl.conf <<'EOF'
<VirtualHost *:443>
    ServerName ${API_DOMAIN}
    ProxyPreserveHost On
    ProxyRequests Off
    SSLEngine on
    SSLCertificateFile /etc/ssl/myeasyhand/cert.pem
    SSLCertificateKeyFile /etc/ssl/myeasyhand/key.pem
    ProxyPass / http://127.0.0.1:5051/
    ProxyPassReverse / http://127.0.0.1:5051/
    ErrorLog \${APACHE_LOG_DIR}/api_ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/api_ssl_access.log combined
</VirtualHost>
EOF

cat > /etc/apache2/sites-available/myeasyhand-ssl.conf <<'EOF'
<VirtualHost *:443>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}
    ProxyPreserveHost On
    ProxyRequests Off
    SSLEngine on
    SSLCertificateFile /etc/ssl/myeasyhand/cert.pem
    SSLCertificateKeyFile /etc/ssl/myeasyhand/key.pem
    ProxyPass / http://127.0.0.1:3031/
    ProxyPassReverse / http://127.0.0.1:3031/
    RequestHeader set X-Forwarded-Proto "https"
    ErrorLog \${APACHE_LOG_DIR}/myeasyhand_ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/myeasyhand_ssl_access.log combined
</VirtualHost>
EOF

cat > /etc/apache2/sites-available/admin.myeasyhand.in-ssl.conf <<'EOF'
<VirtualHost *:443>
    ServerName ${ADMIN_DOMAIN}
    ProxyPreserveHost On
    ProxyRequests Off
    SSLEngine on
    SSLCertificateFile /etc/ssl/myeasyhand/cert.pem
    SSLCertificateKeyFile /etc/ssl/myeasyhand/key.pem
    ProxyPass / http://127.0.0.1:8081/
    ProxyPassReverse / http://127.0.0.1:8081/
    RequestHeader set X-Forwarded-Proto "https"
    ErrorLog \${APACHE_LOG_DIR}/admin_ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/admin_ssl_access.log combined
</VirtualHost>
EOF

cat > /etc/apache2/sites-available/api.myeasyhand.in.conf <<'EOF'
<VirtualHost *:80>
    ServerName ${API_DOMAIN}
    Redirect permanent / https://${API_DOMAIN}/
</VirtualHost>
EOF
cat > /etc/apache2/sites-available/myeasyhand.in.conf <<'EOF'
<VirtualHost *:80>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}
    Redirect permanent / https://${DOMAIN}/
</VirtualHost>
EOF
cat > /etc/apache2/sites-available/admin.myeasyhand.in.conf <<'EOF'
<VirtualHost *:80>
    ServerName ${ADMIN_DOMAIN}
    Redirect permanent / https://${ADMIN_DOMAIN}/
</VirtualHost>
EOF

a2ensite api.myeasyhand.in.conf api.myeasyhand.in-ssl.conf myeasyhand.in.conf myeasyhand-ssl.conf admin.myeasyhand.in.conf admin.myeasyhand.in-ssl.conf >/dev/null
apache2ctl configtest
systemctl reload apache2
REMOTE_APACHE

echo "==> [5/8] Start API stack (Docker: api + mongo + redis)"
run_ssh "bash -s" <<REMOTE_DOCKER
set -euo pipefail
cd "${DEPLOY_PATH}/api"
# Do not start compose nginx — Apache owns :80/:443
docker compose up -d api mongodb redis --build
REMOTE_DOCKER

echo "==> [6/8] Build and start Web (PM2 :3031)"
run_ssh "bash -s" <<REMOTE_WEB
set -euo pipefail
cd "${DEPLOY_PATH}/web"
npm ci
npm run build
pm2 delete myeasyhand-web 2>/dev/null || true
pm2 start npm --name myeasyhand-web -- start
REMOTE_WEB

echo "==> [7/8] Build and start Admin (PM2 :8081)"
run_ssh "bash -s" <<REMOTE_ADMIN
set -euo pipefail
cd "${DEPLOY_PATH}/admin"
npm ci
npm run build
pm2 delete myeasyhand-admin 2>/dev/null || true
pm2 start npm --name myeasyhand-admin -- start
pm2 save
REMOTE_ADMIN

echo "==> [8/8] Health checks"
sleep 20
run_ssh "curl -sf http://127.0.0.1:5051/api/v1/health && echo && curl -s -o /dev/null -w 'web:%{http_code} ' http://127.0.0.1:3031 && curl -s -o /dev/null -w 'admin:%{http_code}\n' http://127.0.0.1:8081"

echo ""
echo "Deploy complete."
echo "  API:   https://${API_DOMAIN}/api/v1/health"
echo "  Web:   https://${DOMAIN}"
echo "  Admin: https://${ADMIN_DOMAIN}"
