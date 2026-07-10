# SonarQube setup — MyEasyHand Platform

## Option A: Self-hosted (recommended for VPS)

### 1. Start SonarQube

```bash
cd infra/sonarqube
docker compose -f docker-compose.sonar.yml up -d
```

Wait ~2 minutes, then open `http://164.68.108.126:9000`.

### 2. First login

- Default: `admin` / `admin` — you will be prompted to change the password.
- Create a project for each service repo (or use monorepo keys below).

### 3. Generate CI token

**My Account → Security → Generate Tokens** → name: `github-ci` → copy token.

Add to GitHub Secrets in **every** service repo:

| Secret | Value |
|--------|-------|
| `SONAR_TOKEN` | Token from SonarQube |
| `SONAR_HOST_URL` | `http://164.68.108.126:9000` or `https://sonar.myeasyhand.in` |

Set repository variable **`ENABLE_SONAR`** = `true` under **Settings → Secrets and variables → Actions → Variables** to activate scans in CI.

### 4. Create projects in SonarQube

| Project key | Display name |
|-------------|--------------|
| `myeasyhand-api` | MyEasyHand API |
| `myeasyhand-web` | MyEasyHand Web |
| `myeasyhand-admin` | MyEasyHand Admin |
| `myeasyhand-customer-app` | MyEasyHand Customer App |
| `myeasyhand-employee-app` | MyEasyHand Employee App |

### 5. DNS (optional)

Add A record `sonar` → `164.68.108.126`, then:

```bash
sudo certbot --nginx -d sonar.myeasyhand.in
```

Update `SONAR_HOST_URL` to `https://sonar.myeasyhand.in`.

---

## Option B: SonarCloud

1. Sign up at [sonarcloud.io](https://sonarcloud.io)
2. Create organization `myeasyhand` (or use existing)
3. Import each GitHub repo
4. Set secrets:
   - `SONAR_TOKEN` — SonarCloud token
   - `SONAR_HOST_URL` — `https://sonarcloud.io`
5. Update `sonar-project.properties` `sonar.organization` in each repo

---

## Quality gate (recommended)

In SonarQube → **Quality Gates**:

- Coverage on new code ≥ 70%
- No blocker/critical issues on new code
- Duplications on new code ≤ 3%

Assign the gate to each project under **Project Settings → Quality Gate**.

---

## CI integration

Each service runs SonarQube scan in `.github/workflows/ci.yml` after tests.  
Scans run on `development`, `staging`, `main`, and pull requests.

If `SONAR_TOKEN` is not set, the scan step is skipped (CI still passes).
