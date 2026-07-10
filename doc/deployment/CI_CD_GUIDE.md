# CI/CD Pipeline — MyEasyHand Platform

## Overview

Each service is an **independent Git repository** with its own GitHub Actions workflows.

| Service | CI | Deploy | Test framework |
|---------|----|--------|----------------|
| myeasyhand-api | lint, typecheck, test, build, sonar | Docker on VPS | Jest + Supertest |
| myeasyhand-web | lint, typecheck, test, build, sonar | PM2 on VPS | Vitest |
| myeasyhand-admin | lint, typecheck, test, build, sonar | PM2 on VPS | Vitest |
| myeasyhand-customer-app | lint, typecheck, test, sonar | EAS Build | Jest (jest-expo) |
| myeasyhand-employee-app | lint, typecheck, test, sonar | EAS Build | Jest (jest-expo) |

---

## Branch → Environment

```
feature/*, bugfix/*  →  CI only (no deploy)
development          →  development VPS / EAS preview
staging              →  staging VPS / EAS preview
main                 →  production VPS / EAS production
```

---

## Workflows per repo

```
.github/workflows/
├── ci.yml                  # Every push & PR
├── deploy-development.yml  # Push to development
├── deploy-staging.yml      # Push to staging
└── deploy-production.yml   # Push to main
```

### CI pipeline (`ci.yml`)

1. Checkout (full history for SonarQube)
2. `npm ci`
3. `npm run typecheck` (where available)
4. `npm run lint`
5. `npm run test:coverage`
6. `npm run build` (api, web, admin)
7. SonarQube scan (when `ENABLE_SONAR=true` repo variable is set)

### Deploy pipeline (api)

```bash
cd $DEPLOY_PATH/api
git pull origin <branch>
docker compose up -d --build
curl -sf http://localhost:5050/api/v1/health
```

### Deploy pipeline (web / admin)

```bash
cd $DEPLOY_PATH/web   # or admin
git pull origin <branch>
npm ci && npm run build
pm2 restart myeasyhand-web   # or myeasyhand-admin
```

### Deploy pipeline (mobile)

Uses **Expo EAS Build** with `EXPO_TOKEN` secret.

---

## Required GitHub configuration

### Secrets (per repo)

| Secret | Required for |
|--------|--------------|
| `SSH_HOST` | api, web, admin deploy |
| `SSH_USER` | api, web, admin deploy |
| `SSH_KEY` | api, web, admin deploy |
| `DEPLOY_PATH` | api, web, admin deploy |
| `SONAR_TOKEN` | SonarQube CI |
| `SONAR_HOST_URL` | SonarQube CI |
| `EXPO_TOKEN` | mobile deploy |

### Repository variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `ENABLE_SONAR` | `true` | Enable SonarQube scan in CI |

Set under **Settings → Secrets and variables → Actions → Variables**.

### Environments

Create `development`, `staging`, `production` with optional approval rules for production.

---

## Local commands

```bash
# API
cd myeasyhand-api && npm test && npm run test:coverage

# Web / Admin
cd myeasyhand-web && npm test && npm run test:coverage

# Mobile
cd myeasyhand-customer-app && npm test
```

---

## SonarQube

See [SONARQUBE_SETUP.md](./SONARQUBE_SETUP.md).

---

## Server access

See [SERVER_ACCESS.md](./SERVER_ACCESS.md) and `doc/deployment/secrets/server.access.example`.

---

## First-time setup checklist

- [ ] Run `scripts/vps-bootstrap.sh` on VPS `164.68.108.126`
- [ ] Copy `server.access.example` → `server.access` and fill credentials
- [ ] Clone repos to `/opt/myeasyhand`
- [ ] Configure `.env` files on server
- [ ] Start Docker (api) and PM2 (web, admin)
- [ ] Configure Cloudflare DNS (see VPS_DEPLOYMENT_GUIDE.md)
- [ ] Add GitHub Secrets to all 5 repos
- [ ] Set `ENABLE_SONAR=true` after SonarQube is running
- [ ] Enable branch protection on `main` and `staging`
