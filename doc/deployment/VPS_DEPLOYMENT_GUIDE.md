# VPS Deployment Guide — MyEasyHand Platform

**OS:** Ubuntu 24.04 LTS  
**Stack:** Docker, PM2, Nginx, MongoDB, Redis, Cloudflare

---

## 1. Server Provisioning

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl git ufw fail2ban

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt install -y docker-compose-plugin
```

## 3. Install Node.js & PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 4. Install Nginx & Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 5. Directory Layout on VPS

```
/opt/myeasyhand/
├── api/          # myeasyhand-api
├── web/          # myeasyhand-web
├── admin/        # myeasyhand-admin
├── nginx/
│   └── conf.d/
├── ssl/
├── uploads/
└── docker-compose.yml
```

## 6. Clone Repositories

```bash
sudo mkdir -p /opt/myeasyhand && cd /opt/myeasyhand

git clone git@github.com:myeasyhand-platform/myeasyhand-api.git api
git clone git@github.com:myeasyhand-platform/myeasyhand-web.git web
git clone git@github.com:myeasyhand-platform/myeasyhand-admin.git admin
```

## 7. Environment Setup

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env
cp admin/.env.example admin/.env
# Edit each .env with production values
```

## 8. Docker Compose (API + MongoDB + Redis)

```bash
cd /opt/myeasyhand/api
docker compose up -d
```

Services:
- API → `:5050`
- MongoDB → `:27017`
- Redis → `:6379`

## 9. PM2 for Next.js Apps

```bash
# Customer Web (port 3030)
cd /opt/myeasyhand/web
npm ci && npm run build
pm2 start npm --name "myeasyhand-web" -- start

# Admin Panel (port 8080)
cd /opt/myeasyhand/admin
npm ci && npm run build
PORT=8080 pm2 start npm --name "myeasyhand-admin" -- start

pm2 save
pm2 startup
```

## 10. Nginx Configuration

See `myeasyhand-api/nginx/` for full configs. Summary:

| Domain | Upstream | Port |
|---|---|---|
| myeasyhand.in | myeasyhand-web | 3030 |
| admin.myeasyhand.in | myeasyhand-admin | 8080 |
| api.myeasyhand.in | myeasyhand-api | 5050 |

```bash
sudo cp /opt/myeasyhand/api/nginx/*.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/myeasyhand.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 11. SSL with Certbot

```bash
sudo certbot --nginx -d myeasyhand.in -d www.myeasyhand.in
sudo certbot --nginx -d admin.myeasyhand.in
sudo certbot --nginx -d api.myeasyhand.in
```

## 12. Cloudflare Setup

1. Add `myeasyhand.in` to Cloudflare
2. Point A records to VPS IP
3. Enable SSL: Full (strict)
4. Enable proxy (orange cloud)
5. Configure Page Rules for caching static assets

See also: [SERVER_ACCESS.md](./SERVER_ACCESS.md), [CI_CD_GUIDE.md](./CI_CD_GUIDE.md), [SONARQUBE_SETUP.md](./SONARQUBE_SETUP.md)

## 13. CI/CD Auto Deploy

GitHub Actions deploy on push:

| Branch | Environment | Action |
|---|---|---|
| `development` | Dev VPS | SSH deploy + restart |
| `staging` | Staging VPS | SSH deploy + restart |
| `main` | Production VPS | SSH deploy + restart |

Required GitHub Secrets per repo:
- `SSH_HOST`, `SSH_USER`, `SSH_KEY`
- `DEPLOY_PATH`
- Environment-specific `.env` secrets

## 14. Monitoring

```bash
# PM2 monitoring
pm2 monit
pm2 logs

# Docker logs
docker compose logs -f api

# Health checks
curl https://api.myeasyhand.in/api/v1/health
```

## 15. Backup Strategy

```bash
# MongoDB daily backup (cron)
0 2 * * * docker exec myeasyhand-mongodb mongodump --out /backup/$(date +\%Y\%m\%d)
```

---

## Contact

- Support: info@myeasyhand.in
- Phone: +91 8818907445
