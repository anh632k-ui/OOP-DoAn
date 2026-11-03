#!/bin/sh
set -eu
export PGHOST=db
export PGPORT=5432
export PGUSER="${POSTGRES_USER:-med06}"
export PGDATABASE="${POSTGRES_DB:-med06}"
export PGPASSWORD="${POSTGRES_PASSWORD:-med06_dev_password}"

psql -X -v ON_ERROR_STOP=1 -c "
  CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
"

for file in /sql/migrations/*.sql; do
  [ -f "$file" ] || continue
  name="$(basename "$file")"
  case "$name" in
    *[!a-zA-Z0-9._-]*) echo "Invalid migration name: $name" >&2; exit 1 ;;
  esac
  applied="$(psql -X -A -t -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM public.schema_migrations WHERE version='$name'")"
  if [ "$applied" = "1" ]; then
    echo "[MED06] migration already applied: $name"
  else
    echo "[MED06] applying migration: $name"
    psql -X -v ON_ERROR_STOP=1 --single-transaction -f "$file"
  fi
done
echo "[MED06] migrations complete"
