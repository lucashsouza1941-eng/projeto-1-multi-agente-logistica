#!/usr/bin/env sh
set -eu
mkdir -p /backups
PGHOST="${PGHOST:-postgres}"
PGPORT="${PGPORT:-5432}"
PGUSER="${POSTGRES_USER:?POSTGRES_USER obrigatório}"
export PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD obrigatório}"
i=0
while [ "$i" -lt 60 ]; do
  if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -q; then
    break
  fi
  i=$((i + 1))
  sleep 2
done
if ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -q; then
  echo "[backup-entrypoint] Postgres indisponível após espera"
  exit 1
fi
# Primeiro backup ao subir (healthcheck: backup com menos de 7h)
/usr/local/bin/backup.sh
exec crond -f -l 8
