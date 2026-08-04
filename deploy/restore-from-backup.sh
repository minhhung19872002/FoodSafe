#!/usr/bin/env bash
# Restores a FoodSafe backup (PostgreSQL dump + MinIO objects) into the stack
# running in /opt/foodsafe on THIS machine.
#
#   sudo -u deploy bash restore-from-backup.sh ~/migration-backup
#
# The directory must contain foodsafe-db.dump and minio-data.tar.gz as produced
# by the migration backup step. Existing data is replaced, so the script refuses
# to run unless RESTORE_CONFIRM=yes is set.
set -euo pipefail

BACKUP_DIR="${1:-}"
APP_DIR="${APP_DIR:-/opt/foodsafe}"
MINIO_VOLUME="${MINIO_VOLUME:-foodsafe_minio_data}"

if [[ -z "$BACKUP_DIR" || ! -d "$BACKUP_DIR" ]]; then
  echo "Usage: restore-from-backup.sh <backup-directory>" >&2
  exit 1
fi
for f in foodsafe-db.dump minio-data.tar.gz; do
  [[ -f "$BACKUP_DIR/$f" ]] || { echo "Missing $BACKUP_DIR/$f" >&2; exit 1; }
done
if [[ "${RESTORE_CONFIRM:-}" != "yes" ]]; then
  echo "This REPLACES the database and object store in $APP_DIR." >&2
  echo "Re-run with RESTORE_CONFIRM=yes to proceed." >&2
  exit 1
fi

cd "$APP_DIR"
set -a; source .env; set +a
DB_USER="${POSTGRES_USER:-foodsafe}"
DB_NAME="${POSTGRES_DB:-FoodSafe}"

echo "==> Stopping the application so nothing writes while we restore"
docker compose stop api frontend caddy >/dev/null 2>&1 || true
docker compose up -d postgres minio
# Wait for PostgreSQL to accept connections before restoring.
for _ in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Restoring the database"
# --clean --if-exists drops the old objects first, so a re-run is idempotent.
docker compose exec -T postgres pg_restore \
  -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner --no-privileges \
  <"$BACKUP_DIR/foodsafe-db.dump"

echo "==> Restoring the object store"
docker compose stop minio >/dev/null
docker run --rm -v "${MINIO_VOLUME}:/data" -v "$BACKUP_DIR:/backup:ro" alpine \
  sh -c 'rm -rf /data/* /data/..?* 2>/dev/null; tar -xzf /backup/minio-data.tar.gz -C /data'
docker compose up -d minio

# Carrying the DataProtection keys over keeps existing sessions and any
# outstanding password-reset tokens valid across the move.
if [[ -f "$BACKUP_DIR/data-protection-keys.tar.gz" ]]; then
  echo "==> Restoring the DataProtection keys"
  docker compose stop api >/dev/null 2>&1 || true
  docker run --rm -v "foodsafe_data_protection_keys:/dpk" -v "$BACKUP_DIR:/backup:ro" alpine     sh -c 'tar -xzf /backup/data-protection-keys.tar.gz -C /dpk'
fi

echo "==> Bringing the stack back up (the migrator applies any new migrations)"
docker compose up -d --remove-orphans

echo "==> Restore complete. Verify with:"
echo "    docker compose ps && docker compose logs --tail=50 migrator api"
