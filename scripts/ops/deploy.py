"""
Deploy KhoboraKhobor to the production server over SSH, using a key (no passwords).

Run from your computer, in the project folder:
    python scripts/ops/deploy.py                 # deploy origin/main
    python scripts/ops/deploy.py --purge-bodies  # also delete stored publisher text
    python scripts/ops/deploy.py --skip-ci       # emergency only: deploy even if CI failed

Settings come from the environment or the project's .env file:
    DEPLOY_HOST   server address (required)
    DEPLOY_USER   SSH user (default: root; switch to a deploy user when you create one)
    DEPLOY_KEY    private key file (default: ~/.ssh/id_ed25519)
    GITHUB_REPO   owner/name for the CI check (default: Zayed1711/Khoborakhobor)
    GITHUB_TOKEN  only needed once the repository is private (read-only token)

Steps: CI must have passed for the commit -> backup -> check out that exact commit -> install deps if they changed -> migrations -> integrity
cleanup -> build -> restart -> health check. If the build or the health check fails,
the previous version is restored and restarted automatically.
"""
import json, os, re, subprocess, sys, time, urllib.request

import paramiko

APP = "/var/www/khoborakhobor"
DB = "/var/www/kkhobor-data/kkhobor.db"
BACKUPS = "/var/backups/kkhobor"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Server output has Bengali text and box-drawing characters. On Windows, when the output is
# piped (not a console), Python's default encoding cannot print them and the deploy would
# crash halfway, after the server commands already ran. Never let printing fail.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


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


def ci_gate(skip):
    """Return the origin/main commit, refusing to continue unless GitHub CI passed for it."""
    line = subprocess.run(["git", "ls-remote", "origin", "refs/heads/main"], cwd=ROOT,
                          capture_output=True, text=True, check=True).stdout.split()
    if not line:
        sys.exit("Could not read origin/main. Is the code pushed?")
    sha = line[0]
    if skip:
        print(f"WARNING: --skip-ci given; deploying {sha[:8]} without checking CI.")
        return sha
    repo = setting("GITHUB_REPO", "Zayed1711/Khoborakhobor")
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}/commits/{sha}/check-runs",
                                 headers={"Accept": "application/vnd.github+json", "User-Agent": "kkhobor-deploy"})
    token = setting("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        runs = json.load(urllib.request.urlopen(req, timeout=20)).get("check_runs", [])
    except Exception as e:
        sys.exit(f"Could not ask GitHub whether CI passed ({e}). If the repository is private, set GITHUB_TOKEN in .env.")
    ci = [r for r in runs if r.get("name") == "check"]
    if not ci:
        sys.exit(f"No CI result for {sha[:8]} yet. Wait a minute after pushing and try again.")
    run = ci[0]
    if run["status"] != "completed":
        sys.exit(f"CI is still running for {sha[:8]}. Try again in a few minutes: {run.get('html_url', '')}")
    if run["conclusion"] != "success":
        sys.exit(f"CI FAILED for {sha[:8]}, so it will not be deployed. Details: {run.get('html_url', '')}")
    print(f"CI passed for {sha[:8]}.")
    return sha


def healthy(srv):
    for _ in range(15):
        # /api/health answers 200 only when the site AND its database work
        code, out = srv.run("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/health", check=False, quiet=True)
        if out == "200":
            return True
        time.sleep(4)
    return False


def restart(srv):
    srv.run("pm2 startOrReload ecosystem.config.js --update-env && pm2 save", timeout=120)


def main():
    purge = "--purge-bodies" in sys.argv
    target = ci_gate("--skip-ci" in sys.argv)
    srv = Server()
    print("Connected with SSH key.")

    # 0. Preconditions: the database lives outside the repository
    code, _ = srv.run(f"test -f {DB}", check=False, quiet=True)
    if code != 0:
        sys.exit(f"Database not found at {DB}. Do the one-time database move first (see docs/PRODUCTION_DEPLOYMENT.md).")

    # 1. Backup (works before the backup script exists on the server)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    srv.run(f"mkdir -p {BACKUPS} && sqlite3 {DB} \".backup '{BACKUPS}/predeploy-{stamp}.db'\" && gzip -9 {BACKUPS}/predeploy-{stamp}.db")

    # 2. Check out exactly the commit CI approved, remembering the current one for rollback
    _, old = srv.run("git rev-parse HEAD", quiet=True)
    srv.run(f"git fetch origin && git reset --hard {target} && git log -1 --oneline")
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
    print(f"\nDeploy OK: {old[:8]} -> {new[:8]}. Site and database answer.")


if __name__ == "__main__":
    main()
