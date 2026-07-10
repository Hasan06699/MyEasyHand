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
DEPLOY_PATH="${DEPLOY_PATH:-/opt/myeasyhand}"
DOMAIN="${DOMAIN:-myeasyhand.in}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.myeasyhand.in}"
API_DOMAIN="${API_DOMAIN:-api.myeasyhand.in}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -p "$SSH_PORT")

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
  local excludes=(--exclude node_modules --exclude .next --exclude dist --exclude .git --exclude uploads --exclude coverage)
  if [[ -n "${SSH_PASSWORD:-}" ]]; then
    install_sshpass
    sshpass -p "$SSH_PASSWORD" rsync -az --delete "${excludes[@]}" -e "ssh ${SSH_OPTS[*]}" "${src}" "${SSH_USER}@${VPS_IP}:${dest}"
  else
    rsync -az --delete "${excludes[@]}" -e "ssh -i ${SSH_KEY_PATH} ${SSH_OPTS[*]}" "${src}" "${SSH_USER}@${VPS_IP}:${dest}"
  fi
}

echo "==> [1/8] Bootstrap server (Docker, Node, PM2, Nginx)"
run_ssh "bash -s" <<'REMOTE_BOOT'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git ufw nginx certbot python3-certbot-nginx rsync 2>/dev/null || true
if ! command -v docker &>/dev/null; then curl -fsSL https://get.docker.com | sh; fi
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
command -v pm2 &>/dev/null || npm install -g pm2
ufw allow OpenSSH 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true
mkdir -p /opt/myeasyhand
REMOTE_BOOT

echo "==> [2/8] Upload application code"
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
if [[ ! -f "\$WEB_ENV" ]]; then
  cp "${DEPLOY_PATH}/web/.env.example" "\$WEB_ENV"
fi
if [[ ! -f "\$ADMIN_ENV" ]]; then
  cp "${DEPLOY_PATH}/admin/.env.example" "\$ADMIN_ENV"
fi

# Production URLs
sed -i 's|^NODE_ENV=.*|NODE_ENV=production|' "\$API_ENV"
sed -i 's|^APP_URL=.*|APP_URL=https://${API_DOMAIN}|' "\$API_ENV"
sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=https://${DOMAIN},https://${ADMIN_DOMAIN},https://www.${DOMAIN}|' "\$API_ENV"

cat > "\$WEB_ENV" <<EOF
NEXT_PUBLIC_API_URL=https://${API_DOMAIN}/api/v1
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_ONESIGNAL_APP_ID=5509abf7-7bcb-43b9-bc4f-583961d89c63
PORT=3030
EOF

cat > "\$ADMIN_ENV" <<EOF
NEXT_PUBLIC_APP_NAME=MyEasyHand Admin
NEXT_PUBLIC_APP_URL=https://${ADMIN_DOMAIN}
NEXT_PUBLIC_API_URL=https://${API_DOMAIN}/api/v1
NEXT_PUBLIC_WEBSITE_URL=https://${DOMAIN}
NEXT_PUBLIC_ONESIGNAL_APP_ID=5509abf7-7bcb-43b9-bc4f-583961d89c63
PORT=8080
EOF
REMOTE_ENV

echo "==> [4/8] Configure host Nginx"
run_ssh "bash -s" <<REMOTE_NGINX
set -euo pipefail
apt-get install -y -qq nginx 2>/dev/null || true
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
if ! grep -q 'sites-enabled' /etc/nginx/nginx.conf 2>/dev/null; then
  sed -i '/http {/a\\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf 2>/dev/null || true
fi
cp "${DEPLOY_PATH}/api/nginx/conf.d/web.conf" /etc/nginx/sites-available/myeasyhand-web.conf
cp "${DEPLOY_PATH}/api/nginx/conf.d/admin.conf" /etc/nginx/sites-available/myeasyhand-admin.conf
cat > /etc/nginx/sites-available/myeasyhand-api.conf <<NGINX
upstream myeasyhand_api {
    server 127.0.0.1:5050;
    keepalive 32;
}
server {
    listen 80;
    server_name ${API_DOMAIN};
    location / {
        proxy_pass http://myeasyhand_api;
        proxy_http_version 1.1;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }

    location /api/docs {
        proxy_pass http://myeasyhand_api;
        proxy_set_header Host \\\$host;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/myeasyhand-api.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/myeasyhand-web.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/myeasyhand-admin.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable nginx && systemctl restart nginx
REMOTE_NGINX

echo "==> [5/8] Start API stack (Docker: api + mongo + redis)"
run_ssh "bash -s" <<REMOTE_DOCKER
set -euo pipefail
cd "${DEPLOY_PATH}/api"
docker compose up -d api mongodb redis --build
REMOTE_DOCKER

echo "==> [6/8] Build and start Web (PM2)"
run_ssh "bash -s" <<REMOTE_WEB
set -euo pipefail
cd "${DEPLOY_PATH}/web"
npm ci
npm run build
pm2 delete myeasyhand-web 2>/dev/null || true
pm2 start npm --name myeasyhand-web -- start
REMOTE_WEB

echo "==> [7/8] Build and start Admin (PM2)"
run_ssh "bash -s" <<REMOTE_ADMIN
set -euo pipefail
cd "${DEPLOY_PATH}/admin"
npm ci
npm run build
pm2 delete myeasyhand-admin 2>/dev/null || true
PORT=8080 pm2 start npm --name myeasyhand-admin -- start
pm2 save
REMOTE_ADMIN

echo "==> [8/8] Health checks"
sleep 15
run_ssh "curl -sf http://localhost:5050/api/v1/health && echo && curl -sf -o /dev/null -w 'web:%{http_code} admin:%{http_code}\n' http://localhost:3030 http://localhost:8080"

echo ""
echo "Deploy complete."
echo "  API:   http://${API_DOMAIN}/api/v1/health"
echo "  Web:   http://${DOMAIN}"
echo "  Admin: http://${ADMIN_DOMAIN}"
echo ""
echo "Next: point Cloudflare A records to ${VPS_IP}, then run SSL:"
echo "  certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d ${ADMIN_DOMAIN} -d ${API_DOMAIN}"
