#!/usr/bin/env bash
# Export local MongoDB (myeasyhand) and import to live VPS Docker MongoDB.
# Requires: mongodump, sshpass, doc/deployment/secrets/server.access
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ACCESS_FILE="${ROOT}/doc/deployment/secrets/server.access"
API_DIR="${ROOT}/myeasyhand-api"
DB_NAME="${DB_NAME:-myeasyhand}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
EXPORT_DIR="${API_DIR}/backups/mongodb-export-${TIMESTAMP}"
ARCHIVE="/tmp/myeasyhand-mongodb-${TIMESTAMP}.tar.gz"

if [[ ! -f "${ACCESS_FILE}" ]]; then
  echo "Missing ${ACCESS_FILE}. Copy server.access.example and fill in credentials."
  exit 1
fi

# shellcheck disable=SC1090
source "${ACCESS_FILE}"

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${VPS_IP:?VPS_IP required in server.access}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/myeasyhand}"
REMOTE_DUMP="/tmp/myeasyhand-mongodb-import-${TIMESTAMP}"

if [[ -z "${SSH_PASSWORD:-}" ]]; then
  echo "SSH_PASSWORD is empty in server.access. Set it or configure SSH keys."
  exit 1
fi

ssh_cmd() {
  sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=accept-new -p "${SSH_PORT:-22}" "${SSH_USER}@${SSH_HOST}" "$@"
}

scp_cmd() {
  sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=accept-new -P "${SSH_PORT:-22}" "$@"
}

echo "==> [1/5] Export local database: ${DB_NAME}"
mkdir -p "${EXPORT_DIR}"
mongodump --db "${DB_NAME}" --out "${EXPORT_DIR}"

echo "==> [2/5] Archive export"
COPYFILE_DISABLE=1 tar -czf "${ARCHIVE}" -C "${EXPORT_DIR}" "${DB_NAME}"

echo "==> [3/5] Backup live database before import"
ssh_cmd "docker exec myeasyhand-mongodb mongodump --db ${DB_NAME} --out /tmp/myeasyhand-live-backup-${TIMESTAMP} || true"

echo "==> [4/5] Upload dump to live server"
scp_cmd "${ARCHIVE}" "${SSH_USER}@${SSH_HOST}:${ARCHIVE}"
ssh_cmd "mkdir -p ${REMOTE_DUMP} && tar -xzf ${ARCHIVE} -C ${REMOTE_DUMP} && rm -f ${ARCHIVE}"

echo "==> [5/5] Import into live MongoDB (replaces ${DB_NAME})"
ssh_cmd "docker cp ${REMOTE_DUMP}/${DB_NAME} myeasyhand-mongodb:/tmp/myeasyhand-import-${TIMESTAMP}"
ssh_cmd "docker exec myeasyhand-mongodb mongorestore --drop --db ${DB_NAME} /tmp/myeasyhand-import-${TIMESTAMP}"
ssh_cmd "docker exec myeasyhand-mongodb rm -rf /tmp/myeasyhand-import-${TIMESTAMP}"
ssh_cmd "rm -rf ${REMOTE_DUMP}"

echo "==> Verify live counts"
ssh_cmd "docker exec myeasyhand-mongodb mongosh ${DB_NAME} --quiet --eval \"JSON.stringify({users: db.users.countDocuments(), businesses: db.businesses.countDocuments(), services: db.services.countDocuments()})\""

echo "Done. Local export kept at: ${EXPORT_DIR}"
