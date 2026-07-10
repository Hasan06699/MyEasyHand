# Server Access & Bootstrap — MyEasyHand Platform

**Production VPS:** `164.68.108.126`  
**Domain:** `myeasyhand.in`

---

## 1. Local credentials file

Copy the template and fill in your values:

```bash
cp doc/deployment/secrets/server.access.example doc/deployment/secrets/server.access
```

Edit `server.access` with your SSH key path, domains, and tokens. This file is **gitignored**.

---

## 2. First-time VPS bootstrap

SSH into the server as root, then run the bootstrap script:

```bash
# From your machine — copy script to server
scp scripts/vps-bootstrap.sh root@164.68.108.126:/tmp/

# On the server
ssh root@164.68.108.126
chmod +x /tmp/vps-bootstrap.sh
DEPLOY_USER=myeasyhand-deploy /tmp/vps-bootstrap.sh
```

The script installs Docker, Node.js 20, PM2, Nginx, Certbot, creates the deploy user, and prepares `/opt/myeasyhand`.

---

## 3. Deploy user SSH key

On your **local machine**:

```bash
ssh-keygen -t ed25519 -C "myeasyhand-deploy" -f ~/.ssh/myeasyhand_deploy -N ""
```

Add the **public** key to the server:

```bash
ssh-copy-id -i ~/.ssh/myeasyhand_deploy.pub myeasyhand-deploy@164.68.108.126
```

Store the **private** key contents in GitHub secret `SSH_KEY` for each service repo.

---

## 4. GitHub Secrets (per repository)

| Secret | Value | Used by |
|--------|-------|---------|
| `SSH_HOST` | `164.68.108.126` | api, web, admin |
| `SSH_USER` | `myeasyhand-deploy` | api, web, admin |
| `SSH_KEY` | Private key (full PEM) | api, web, admin |
| `DEPLOY_PATH` | `/opt/myeasyhand` | api, web, admin |
| `SONAR_TOKEN` | SonarQube user token | all repos (CI) |
| `SONAR_HOST_URL` | `https://sonar.myeasyhand.in` | all repos (CI) |
| `EXPO_TOKEN` | Expo access token | customer-app, employee-app |

Create GitHub **Environments**: `development`, `staging`, `production`.  
Production deploys require the `production` environment approval.

---

## 5. Clone repos on VPS

```bash
sudo mkdir -p /opt/myeasyhand && sudo chown myeasyhand-deploy:myeasyhand-deploy /opt/myeasyhand
cd /opt/myeasyhand

git clone git@github.com:myeasyhand-platform/myeasyhand-api.git api
git clone git@github.com:myeasyhand-platform/myeasyhand-web.git web
git clone git@github.com:myeasyhand-platform/myeasyhand-admin.git admin

cp api/.env.example api/.env
cp web/.env.example web/.env
cp admin/.env.example admin/.env
# Edit .env files with production values
```

---

## 6. Start services

```bash
# API + MongoDB + Redis + Nginx (Docker)
cd /opt/myeasyhand/api && docker compose up -d

# Next.js apps (PM2)
cd /opt/myeasyhand/web && npm ci && npm run build
pm2 start npm --name myeasyhand-web -- start

cd /opt/myeasyhand/admin && npm ci && npm run build
PORT=8080 pm2 start npm --name myeasyhand-admin -- start

pm2 save && pm2 startup
```

See [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md) for Nginx, SSL, and Cloudflare.

---

## 7. Post-deploy health checks

```bash
curl -sf https://api.myeasyhand.in/api/v1/health
curl -sf -o /dev/null -w "%{http_code}" https://myeasyhand.in
curl -sf -o /dev/null -w "%{http_code}" https://admin.myeasyhand.in
```

---

## 8. Rollback

```bash
cd /opt/myeasyhand/api && git checkout <previous-sha> && docker compose up -d --build
cd /opt/myeasyhand/web && git checkout <previous-sha> && npm ci && npm run build && pm2 restart myeasyhand-web
cd /opt/myeasyhand/admin && git checkout <previous-sha> && npm ci && npm run build && pm2 restart myeasyhand-admin
```
