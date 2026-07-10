# GitHub Organization Setup — myeasyhand-platform

## Prerequisites

1. GitHub account with org creation permissions
2. `gh` CLI installed and authenticated: `gh auth login`

## Create Organization

```bash
gh api -X POST user/orgs -f login=myeasyhand-platform
# Or create via: https://github.com/organizations/plan
```

## Create Repositories

```bash
ORG=myeasyhand-platform
REPOS=(
  myeasyhand-api
  myeasyhand-web
  myeasyhand-admin
  myeasyhand-customer-app
  myeasyhand-employee-app
)

for repo in "${REPOS[@]}"; do
  gh repo create "$ORG/$repo" --private --description "MyEasyHand Platform — $repo"
done
```

## Push Local Repos

From the MyEasyHand project root:

```bash
./scripts/setup-github-remotes.sh
```

Or manually per repo:

```bash
cd myeasyhand-api
git remote add origin git@github.com:myeasyhand-platform/myeasyhand-api.git
git push -u origin main staging development
```

## Branch Protection Rules

Configure on GitHub for `main` and `staging`:

- Require pull request reviews
- Require status checks (CI)
- No direct pushes to `main`

## Required GitHub Secrets (per repo)

| Secret | Description |
|---|---|
| `SSH_HOST` | VPS IP address (`164.68.108.126`) |
| `SSH_USER` | Deploy user (`myeasyhand-deploy`) |
| `SSH_KEY` | Private SSH key |
| `DEPLOY_PATH` | `/opt/myeasyhand` |
| `SONAR_TOKEN` | SonarQube user token |
| `SONAR_HOST_URL` | `https://sonar.myeasyhand.in` or SonarCloud URL |
| `EXPO_TOKEN` | Expo access token (mobile apps) |

## Repository Variables

| Variable | Value | Description |
|---|---|---|
| `ENABLE_SONAR` | `true` | Enables SonarQube scan in CI workflows |

## Environments

Create GitHub Environments: `development`, `staging`, `production`

Each environment can have its own secrets and protection rules.
