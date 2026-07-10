#!/usr/bin/env bash
# MyEasyHand VPS first-time bootstrap — Ubuntu 24.04
# Usage: DEPLOY_USER=myeasyhand-deploy ./vps-bootstrap.sh
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-myeasyhand-deploy}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/myeasyhand}"

echo "==> Updating system"
apt-get update -qq && apt-get upgrade -y -qq

echo "==> Installing essentials"
apt-get install -y -qq curl git ufw fail2ban nginx certbot python3-certbot-nginx

echo "==> Configuring firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Installing Docker"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Installing Node.js 20"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo "==> Installing PM2"
npm install -g pm2

echo "==> Creating deploy user: ${DEPLOY_USER}"
if ! id "${DEPLOY_USER}" &>/dev/null; then
  useradd -m -s /bin/bash "${DEPLOY_USER}"
  usermod -aG docker "${DEPLOY_USER}"
fi

echo "==> Creating deploy directory: ${DEPLOY_PATH}"
mkdir -p "${DEPLOY_PATH}"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_PATH}"

echo "==> Sudoers for deploy user (docker + pm2 restart)"
cat > "/etc/sudoers.d/${DEPLOY_USER}" <<EOF
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /usr/local/bin/docker-compose, /usr/bin/systemctl reload nginx
EOF
chmod 440 "/etc/sudoers.d/${DEPLOY_USER}"

echo ""
echo "Bootstrap complete."
echo "Next steps:"
echo "  1. Add your SSH public key: ssh-copy-id -i ~/.ssh/myeasyhand_deploy.pub ${DEPLOY_USER}@\$(hostname -I | awk '{print \$1}')"
echo "  2. Clone repos into ${DEPLOY_PATH}"
echo "  3. Configure .env files and run docker compose + pm2"
echo "  4. Set GitHub Secrets: SSH_HOST, SSH_USER, SSH_KEY, DEPLOY_PATH"
