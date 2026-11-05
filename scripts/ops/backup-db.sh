#!/usr/bin/env bash
# Nightly SQLite backup for KhoboraKhobor (runs on the server from cron).
#
#   - Uses SQLite's online .backup, so it is safe while the site is running.
#   - Verifies the copy with PRAGMA integrity_check before keeping it.
#   - Keeps KEEP_DAYS days of compressed backups locally.
#   - Optionally copies each backup off the server with rclone (set RCLONE_REMOTE,
#     e.g. "r2:kkhobor-backups" after `rclone config`). Local-only backups do not
#     survive losing the server, so set this up as soon as you have a storage account.
#
# Cron (crontab -e):  15 3 * * * /var/www/khoborakhobor/scripts/ops/backup-db.sh >> /var/log/kkhobor-backup.log 2>&1
set -euo pipefail

DB="${DB_PATH:-/var/www/kkhobor-data/kkhobor.db}"
DIR="${BACKUP_DIR:-/var/backups/kkhobor}"
KEEP_DAYS="${KEEP_DAYS:-14}"

[ -f "$DB" ] || { echo "$(date -Is) ERROR database not found: $DB"; exit 1; }
mkdir -p "$DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DIR/kkhobor-$STAMP.db"

sqlite3 "$DB" ".backup '$OUT'"
if [ "$(sqlite3 "$OUT" 'PRAGMA integrity_check;')" != "ok" ]; then
  echo "$(date -Is) ERROR backup failed integrity check: $OUT"
  rm -f "$OUT"
  exit 1
fi
gzip -9 "$OUT"

# Retention: remove only this script's own old backups
find "$DIR" -maxdepth 1 -name 'kkhobor-*.db.gz' -mtime +"$KEEP_DAYS" -delete

if [ -n "${RCLONE_REMOTE:-}" ]; then
  rclone copy "$OUT.gz" "$RCLONE_REMOTE" && echo "$(date -Is) copied off-server to $RCLONE_REMOTE"
fi
echo "$(date -Is) backup ok: $OUT.gz ($(du -h "$OUT.gz" | cut -f1))"
