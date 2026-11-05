"""
Deploy KhoboraKhobor to the production server over SSH, using a key (no passwords).

Run from your computer, in the project folder:
    python scripts/ops/deploy.py                 # deploy origin/main
    python scripts/ops/deploy.py --purge-bodies  # also delete stored publisher text

Settings come from the environment or the project's .env file:
    DEPLOY_HOST   server address (required)
    DEPLOY_USER   SSH user (default: root; switch to a deploy user when you create one)
    DEPLOY_KEY    private key file (default: ~/.ssh/id_ed25519)

Steps: backup -> pull main -> install deps if they changed -> migrations -> integrity
cleanup -> build -> restart -> health check. If the build or the health check fails,
the previous version is restored and restarted automatically.
"""
import os, re, sys, time

import paramiko

APP = "/var/www/khoborakhobor"
DB = "/var/www/kkhobor-data/kkhobor.db"
BACKUPS = "/var/backups/kkhobor"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def setting(name, default=None):
    if os.environ.get(name):
        return os.environ[name]
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        for line in open(env, encoding="utf-8"):
            m = re.match(rf'\s*{name}\s*=\s*"?([^"\n]+?)"?\s*$', line)
            if m:
                return m.group(1)
    return default


class Server:
    def __init__(self):
        host = setting("DEPLOY_HOST")
        if not host:
            sys.exit("Set DEPLOY_HOST in .env (the server address).")
        key = os.path.expanduser(setting("DEPLOY_KEY", "~/.ssh/id_ed25519"))
        if not os.path.exists(key):
            sys.exit(f"SSH key not found at {key}. Create it with: ssh-keygen -t ed25519")
        self.ssh = paramiko.SSHClient()
        self.ssh.load_system_host_keys()
        self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # Key-only login: no password is ever sent
        self.ssh.connect(host, username=setting("DEPLOY_USER", "root"), key_filename=key,
                         allow_agent=True, look_for_keys=False, timeout=20)

    def run(self, cmd, timeout=900, check=True, quiet=False):
        if not quiet:
            print(f"\n$ {cmd.splitlines()[0][:110]}")
        _, out, err = self.ssh.exec_command(f"cd {APP} && {cmd}", timeout=timeout)
        code = out.channel.recv_exit_status()
        o, e = out.read().decode("utf-8", "replace"), err.read().decode("utf-8", "replace")
        if not quiet:
            tail = (o + e).strip().splitlines()[-8:]
            for line in tail:
                print("  " + line)
        if check and code != 0:
            raise RuntimeError(f"failed ({code}): {cmd.splitlines()[0][:80]}")
        return code, o.strip()


def healthy(srv):
    for _ in range(15):
        code, out = srv.run("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/", check=False, quiet=True)
        if out == "200":
            return True
        time.sleep(4)
    return False


def restart(srv):
    srv.run("pm2 startOrReload ecosystem.config.js --update-env && pm2 save", timeout=120)


def main():
    purge = "--purge-bodies" in sys.argv
    srv = Server()
    print("Connected with SSH key.")

    # 0. Preconditions: the database lives outside the repository
    code, _ = srv.run(f"test -f {DB}", check=False, quiet=True)
    if code != 0:
        sys.exit(f"Database not found at {DB}. Do the one-time database move first (see docs/PRODUCTION_DEPLOYMENT.md).")

    # 1. Backup (works before the backup script exists on the server)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    srv.run(f"mkdir -p {BACKUPS} && sqlite3 {DB} \".backup '{BACKUPS}/predeploy-{stamp}.db'\" && gzip -9 {BACKUPS}/predeploy-{stamp}.db")

    # 2. Pull main, remembering the current version for rollback
    _, old = srv.run("git rev-parse HEAD", quiet=True)
    srv.run("git fetch origin && git reset --hard origin/main && git log -1 --oneline")
    _, new = srv.run("git rev-parse HEAD", quiet=True)
    if old == new:
        print("\nAlready on the latest version; rebuilding anyway.")

    try:
        # 3. Dependencies, only when the lockfile changed
        code, _ = srv.run(f"git diff --quiet {old} {new} -- package-lock.json", check=False, quiet=True)
        if code != 0:
            srv.run("npm ci --no-audit --no-fund", timeout=1200)

        # 4. Migrations. First run only: align the existing database with the schema
        #    (additive; refuses anything that would drop data) and mark the baseline applied.
        _, has = srv.run(f"sqlite3 {DB} \"SELECT count(*) FROM sqlite_master WHERE name='_prisma_migrations';\"", quiet=True)
        if has.strip() == "0":
            srv.run("npx prisma db push --skip-generate && npx prisma migrate resolve --applied 0_init")
        srv.run("npx prisma migrate deploy && npx prisma generate")

        # 5. Content integrity (backs up again, then cleans; --purge-bodies optional)
        srv.run(f"node scripts/content_integrity_cleanup.js --apply --db {DB}" + (" --purge-bodies" if purge else ""))

        # 6. Build and restart
        srv.run("npm run build", timeout=1200)
        restart(srv)
        if not healthy(srv):
            raise RuntimeError("site did not answer 200 after restart")
    except Exception as e:
        print(f"\nDEPLOY FAILED: {e}\nRolling back to {old[:8]} ...")
        srv.run(f"git reset --hard {old} && npx prisma generate && npm run build", timeout=1200, check=False)
        restart(srv)
        print("Rollback complete; site is " + ("UP" if healthy(srv) else "DOWN - check `pm2 logs kkhobor-web`"))
        sys.exit(1)

    # 7. Report content integrity (informational)
    srv.run(f"node scripts/check_content_integrity.js --db {DB}", check=False)
    print(f"\nDeploy OK: {old[:8]} -> {new[:8]}. Site answers 200.")


if __name__ == "__main__":
    main()
