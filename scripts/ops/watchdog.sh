#!/usr/bin/env bash
# KhoboraKhobor watchdog: checks the live site and messages you on Telegram only when
# something needs attention. Runs on the server from cron.
#
#   hourly:  /var/www/khoborakhobor/scripts/ops/watchdog.sh            (problems only)
#   weekly:  /var/www/khoborakhobor/scripts/ops/watchdog.sh --weekly   (a short report)
#
# Checks: the site and its database answer, news is fresh, both PM2 processes are up,
# last night's backup exists, the disk is not filling up, and (once a day) the content
# integrity check passes. On Thursday 9 pm (Dhaka) it reminds you if Friday's weekly exam
# is not scheduled, and on Friday 12 pm it tells you how much exam writing is waiting.
#
# Telegram settings are read from the app's .env:
#   TELEGRAM_BOT_TOKEN=...   (from @BotFather)
#   TELEGRAM_CHAT_ID=...     (your chat id)
# Without them, messages are only printed to the cron log.
#
# You are told once when a problem starts, reminded every 12 hours while it lasts,
# and told when it is fixed, so a long outage does not flood your phone.
set -uo pipefail

APP_DIR="${APP_DIR:-/var/www/khoborakhobor}"
DB="${DB_PATH:-/var/www/kkhobor-data/kkhobor.db}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/kkhobor}"
STATE_DIR="${STATE_DIR:-/var/lib/kkhobor-watchdog}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
MAX_NEWS_AGE_HOURS="${MAX_NEWS_AGE_HOURS:-18}"   # the crawler runs every 8 hours
MAX_BACKUP_AGE_HOURS="${MAX_BACKUP_AGE_HOURS:-26}"
MAX_DISK_PERCENT="${MAX_DISK_PERCENT:-85}"
REMIND_SECONDS=$((12 * 3600))

mkdir -p "$STATE_DIR"

# Read only the two Telegram values from .env; nothing in .env is executed
env_value() { grep -E "^$1=" "$APP_DIR/.env" 2>/dev/null | tail -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//'; }
TG_TOKEN="${TELEGRAM_BOT_TOKEN:-$(env_value TELEGRAM_BOT_TOKEN)}"
TG_CHAT="${TELEGRAM_CHAT_ID:-$(env_value TELEGRAM_CHAT_ID)}"

send() {
  echo "$(date -Is) $1"
  if [ -n "$TG_TOKEN" ] && [ -n "$TG_CHAT" ]; then
    curl -fsS -m 20 "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
      --data-urlencode "chat_id=${TG_CHAT}" --data-urlencode "text=$1" >/dev/null \
      || echo "$(date -Is) could not reach Telegram"
  fi
}

now=$(date +%s)
since_ms() { echo $(( ($(date +%s) - $1) * 1000 )); }
q() { sqlite3 -readonly "$DB" "$1" 2>/dev/null || echo "?"; }

# ---------------------------------------------------------------- weekly report
if [ "${1:-}" = "--weekly" ]; then
  week=$(since_ms $((7 * 86400)))
  stories=$(q "SELECT COUNT(*) FROM Article WHERE sourceUrl IS NOT NULL AND createdAt >= $week;")
  # Quiz questions have no date of their own; count those whose story arrived this week
  quizzes=$(q "SELECT COUNT(*) FROM QuizQuestion qq JOIN Article a ON a.id = qq.articleId WHERE a.createdAt >= $week;")
  signups=$(q "SELECT COUNT(*) FROM Student WHERE createdAt >= $week;")
  students=$(q "SELECT COUNT(*) FROM Student;")
  attempts=$(q "SELECT COUNT(*) FROM QuizAttempt WHERE createdAt >= $week;")
  active=$(q "SELECT COUNT(DISTINCT studentId) FROM QuizAttempt WHERE createdAt >= $week;")
  reads=$(q "SELECT COUNT(*) FROM ArticleRead WHERE createdAt >= $week;")
  backups=$(find "$BACKUP_DIR" -maxdepth 1 -name 'kkhobor-*.db.gz' -mtime -7 2>/dev/null | wc -l)
  disk=$(df -P "$APP_DIR" | awk 'NR==2 {print $5}')
  dbsize=$(du -h "$DB" 2>/dev/null | cut -f1)
  if (cd "$APP_DIR" && node scripts/check_content_integrity.js --db "$DB" >/dev/null 2>&1); then integrity="passed"; else integrity="FAILED (run npm run check:content)"; fi
  problems=$(ls "$STATE_DIR"/*.down 2>/dev/null | wc -l)
  send "KhoboraKhobor weekly report
News added: $stories stories, $quizzes quiz questions
Students: $students total, $signups new this week
Activity: $active students answered $attempts quizzes; $reads story reads
Backups this week: $backups of 7
Content check: $integrity
Disk used: $disk, database $dbsize
Open problems right now: $problems"
  exit 0
fi

# ---------------------------------------------------------------- weekly exam reminders
# Dhaka time (UTC+6). The hourly run that falls in 21:00-21:59 on Thursday checks that
# Friday's exam is scheduled; the one in 12:00-12:59 on Friday reports writing to mark.
dhaka_dow=$(TZ=Asia/Dhaka date +%u)   # 4 = Thursday, 5 = Friday
dhaka_hour=$(TZ=Asia/Dhaka date +%H)
if [ "$dhaka_dow" = "4" ] && [ "$dhaka_hour" = "21" ]; then
  tomorrow=$(TZ=Asia/Dhaka date -d tomorrow +%F)
  scheduled=$(q "SELECT COUNT(*) FROM WeeklyExam WHERE day = '$tomorrow' AND status = 'scheduled';")
  drafts=$(q "SELECT COUNT(*) FROM WeeklyExam WHERE day = '$tomorrow' AND status = 'draft';")
  if [ "$scheduled" = "0" ] && [ "$drafts" != "?" ]; then
    if [ "${drafts:-0}" -gt 0 ]; then
      send "REMINDER: tomorrow's weekly exam ($tomorrow) is still a draft. Finish it and press Schedule in Admin > Weekly exam before 7:00 am, or it will not open."
    else
      send "REMINDER: no weekly exam is set up for tomorrow ($tomorrow). Create and schedule it in Admin > Weekly exam before 7:00 am, or students will see 'No exam this week'."
    fi
  fi
fi
if [ "$dhaka_dow" = "5" ] && [ "$dhaka_hour" = "12" ]; then
  today=$(TZ=Asia/Dhaka date +%F)
  to_mark=$(q "SELECT COUNT(*) FROM WritingSubmission w JOIN WeeklyExam e ON e.id = w.examId WHERE e.day = '$today' AND w.status = 'pending';")
  sat=$(q "SELECT COUNT(*) FROM ExamAttempt a JOIN WeeklyExam e ON e.id = a.examId WHERE e.day = '$today';")
  if [ "$sat" != "?" ] && [ "${sat:-0}" -gt 0 ]; then
    send "Weekly exam closed: $sat students sat it. $to_mark writing answers are waiting for your marks so far (Admin > Weekly exam). Until they are marked, the merit list is provisional."
  fi
fi

# ---------------------------------------------------------------- hourly checks
# check <name> <ok:0|1> <message when failing>
check() {
  local name="$1" ok="$2" msg="$3" f="$STATE_DIR/$1.down"
  if [ "$ok" = "1" ]; then
    if [ -f "$f" ]; then rm -f "$f"; send "FIXED: $name is back to normal."; fi
  else
    if [ ! -f "$f" ]; then
      echo "$now" > "$f"; send "PROBLEM: $msg"
    elif [ $(( now - $(stat -c %Y "$f") )) -ge "$REMIND_SECONDS" ]; then
      touch "$f"; send "STILL A PROBLEM: $msg"
    fi
  fi
}

# 1. Site and database
health=$(curl -fsS -m 15 "$HEALTH_URL" 2>/dev/null || true)
if echo "$health" | grep -q '"ok":true'; then
  check site 1 ""
  age=$(echo "$health" | sed -n 's/.*"newestStoryAgeHours":\([0-9.]*\).*/\1/p')
  if [ -n "$age" ] && awk -v a="$age" -v m="$MAX_NEWS_AGE_HOURS" 'BEGIN{exit !(a <= m)}'; then
    check news 1 ""
  else
    check news 0 "No new stories for ${age:-?} hours. The crawler may be stuck: run 'pm2 logs kkhobor-cron'."
  fi
else
  check site 0 "The website or its database is not answering ($HEALTH_URL). Run 'pm2 status' and 'pm2 logs kkhobor-web'."
fi

# 2. Both PM2 processes running
for proc in kkhobor-web kkhobor-cron; do
  if pm2 describe "$proc" 2>/dev/null | grep -qE "status[^a-z]+online"; then
    check "$proc" 1 ""
  else
    check "$proc" 0 "PM2 process $proc is not running. Run 'pm2 restart $proc'."
  fi
done

# 3. Last night's backup
latest=$(ls -t "$BACKUP_DIR"/kkhobor-*.db.gz 2>/dev/null | head -1)
if [ -n "$latest" ] && [ $(( now - $(stat -c %Y "$latest") )) -le $(( MAX_BACKUP_AGE_HOURS * 3600 )) ]; then
  check backup 1 ""
else
  check backup 0 "No database backup in the last $MAX_BACKUP_AGE_HOURS hours. See /var/log/kkhobor-backup.log."
fi

# 4. Disk space
disk=$(df -P "$APP_DIR" | awk 'NR==2 {gsub("%",""); print $5}')
if [ "${disk:-0}" -lt "$MAX_DISK_PERCENT" ]; then
  check disk 1 ""
else
  check disk 0 "Disk is ${disk}% full. Old logs or backups may need clearing."
fi

# 5. Content integrity, once a day
stamp="$STATE_DIR/integrity.lastrun"
if [ ! -f "$stamp" ] || [ $(( now - $(stat -c %Y "$stamp") )) -ge 86400 ]; then
  touch "$stamp"
  if out=$(cd "$APP_DIR" && node scripts/check_content_integrity.js --db "$DB" 2>&1); then
    check content 1 ""
  else
    check content 0 "The content integrity check found problems. On the server run: cd $APP_DIR && npm run check:content -- --db $DB
$(echo "$out" | tail -5)"
  fi
fi

exit 0
