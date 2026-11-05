// PM2 process list for the production server. No secrets here: Next.js and the cron
// worker read them from /var/www/khoborakhobor/.env.
module.exports = {
  apps: [
    {
      name: "kkhobor-web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/var/www/khoborakhobor",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", PORT: 3000 },
    },
    {
      name: "kkhobor-cron",
      script: "scripts/cron-worker.js",
      cwd: "/var/www/khoborakhobor",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
    },
  ],
};
