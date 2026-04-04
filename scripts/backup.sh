#!/usr/bin/env sh
# Backup PostgreSQL: pg_dump -> gzip em BACKUP_DIR, rotação >7 dias.
# Variáveis: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, PGHOST (default postgres), PGPORT (default 5432), BACKUP_DIR (default /backups)
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
PGHOST="${PGHOST:-postgres}"
PGPORT="${PGPORT:-5432}"
PGUSER="${POSTGRES_USER:?POSTGRES_USER obrigatório}"
PGDATABASE="${POSTGRES_DB:?POSTGRES_DB obrigatório}"
export PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD obrigatório}"

TS="$(date -u +"%Y-%m-%d_%H-%M")"
OUT="${BACKUP_DIR}/${TS}.sql.gz"

mkdir -p "${BACKUP_DIR}"

DUMP_TMP="${BACKUP_DIR}/.dump-${TS}.sql"
if ! pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" \
  -f "${DUMP_TMP}" 2>/tmp/backup.err; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] FALHA backup pg_dump"
  cat /tmp/backup.err >&2 || true
  rm -f "${DUMP_TMP}" 2>/dev/null || true
  exit 1
fi

if ! gzip -c "${DUMP_TMP}" >"${OUT}.tmp"; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] FALHA backup gzip"
  rm -f "${DUMP_TMP}" "${OUT}.tmp" 2>/dev/null || true
  exit 1
fi
rm -f "${DUMP_TMP}"
mv "${OUT}.tmp" "${OUT}"

# Remove dumps com mais de 7 dias
find "${BACKUP_DIR}" -maxdepth 1 -type f -name '*.sql.gz' -mtime +7 -delete 2>/dev/null || true

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] SUCESSO backup -> ${OUT}"
