#!/usr/bin/env bash
# Weekly proof that the latest backup can actually be restored (runs on the server).
#
# Restores the newest backup into a temporary file (never touches the live database),
# checks it, and compares row counts with the live database. Exits non-zero on any
# problem, so cron mail or the log shows a failure.
#
# Cron (crontab -e):  30 4 * * 0 /var/www/khoborakhobor/scripts/ops/restore-test.sh >> /var/log/kkhobor-backup.log 2>&1
set -euo pipefail

DB="${DB_PATH:-/var/www/kkhobor-data/kkhobor.db}"
DIR="${BACKUP_DIR:-/var/backups/kkhobor}"

LATEST="$(ls -t "$DIR"/kkhobor-*.db.gz 2>/dev/null | head -n 1 || true)"
[ -n "$LATEST" ] || { echo "$(date -Is) ERROR no backups found in $DIR"; exit 1; }

TMP="$(mktemp /tmp/kkhobor-restore-XXXXXX.db)"
trap 'rm -f "$TMP"' EXIT
gunzip -c "$LATEST" > "$TMP"

[ "$(sqlite3 "$TMP" 'PRAGMA integrity_check;')" = "ok" ] || { echo "$(date -Is) ERROR restored copy is corrupt: $LATEST"; exit 1; }

for table in Article Student QuizQuestion; do
  restored=$(sqlite3 "$TMP" "SELECT COUNT(*) FROM \"$table\";")
  live=$(sqlite3 "$DB" "SELECT COUNT(*) FROM \"$table\";")
  # A backup is at most a day old; it should hold at least 80% of today's rows.
  if [ "$live" -gt 0 ] && [ $((restored * 100 / live)) -lt 80 ]; then
    echo "$(date -Is) ERROR $table: backup has $restored rows, live has $live"
    exit 1
  fi
  echo "$(date -Is) $table: backup $restored / live $live"
done
echo "$(date -Is) restore test ok: $LATEST"
