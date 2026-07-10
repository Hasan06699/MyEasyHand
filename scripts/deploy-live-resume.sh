#!/usr/bin/env bash
# Resume deploy from step 4 (after code upload)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "${ROOT}/doc/deployment/secrets/server.access"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -p "${SSH_PORT:-22}")
run_ssh() { sshpass -p "$SSH_PASSWORD" ssh "${SSH_OPTS[@]}" "${SSH_USER}@${VPS_IP}" "$@"; }
DEPLOY_PATH="${DEPLOY_PATH:-/opt/myeasyhand}"
DOMAIN="${DOMAIN:-myeasyhand.in}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.myeasyhand.in}"
API_DOMAIN="${API_DOMAIN:-api.myeasyhand.in}"

echo "==> Configure Nginx"
run_ssh "bash -s" <<REMOTE_NGINX
set -euo pipefail
apt-get install -y -qq nginx
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
grep -q 'sites-enabled' /etc/nginx/nginx.conf || sed -i '/http {/a\\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
cp "${DEPLOY_PATH}/api/nginx/conf.d/web.conf" /etc/nginx/sites-available/myeasyhand-web.conf
cp "${DEPLOY_PATH}/api/nginx/conf.d/admin.conf" /etc/nginx/sites-available/myeasyhand-admin.conf
cat > /etc/nginx/sites-available/myeasyhand-api.conf <<NGINX
upstream myeasyhand_api { server 127.0.0.1:5050; keepalive 32; }
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
}
NGINX
ln -sf /etc/nginx/sites-available/myeasyhand-api.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/myeasyhand-web.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/myeasyhand-admin.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable nginx && systemctl restart nginx
REMOTE_NGINX

echo "==> Start Docker API stack"
run_ssh "cd ${DEPLOY_PATH}/api && docker compose up -d api mongodb redis --build"

echo "==> Build Web"
run_ssh "cd ${DEPLOY_PATH}/web && npm ci && npm run build && (pm2 delete myeasyhand-web 2>/dev/null || true) && pm2 start npm --name myeasyhand-web -- start"

echo "==> Build Admin"
run_ssh "cd ${DEPLOY_PATH}/admin && npm ci && npm run build && (pm2 delete myeasyhand-admin 2>/dev/null || true) && PORT=8080 pm2 start npm --name myeasyhand-admin -- start && pm2 save"

echo "==> Health check"
sleep 20
run_ssh "curl -sf http://localhost:5050/api/v1/health; echo; curl -s -o /dev/null -w 'web:%{http_code} ' http://localhost:3030; curl -s -o /dev/null -w 'admin:%{http_code}\n' http://localhost:8080"
