const http = require("http");
const fs = require("fs");
const path = require("path");

// Automatically load .env configuration if not present in process.env
function loadEnvFile() {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch (e) {
      console.warn("[CRON_WORKER] Failed to read .env file:", e.message);
    }
  }
}

loadEnvFile();

const BASE_URL = process.env.SITE_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";
const INTERVAL_MINUTES = parseInt(process.env.CRON_INTERVAL_MINUTES || "480", 10); // Default: every 8 hours (480 mins), 3 crawls a day
const INITIAL_STARTUP_DELAY_SECONDS = parseInt(process.env.CRON_INITIAL_DELAY || "15", 10);

console.log("==================================================");
console.log(" খবরাখবর ব্যাকগ্রাউন্ড ক্রলার ওয়ার্কার (Cron Worker)");
console.log(` লক্ষ্য: ${BASE_URL}/api/cron/spider`);
console.log(` অথরাইজেশন কি: ${CRON_SECRET ? "কনফিগার করা আছে (সুরক্ষিত)" : "অনুপস্থিত"}`);
console.log(` সূচনার বিলম্ব: ${INITIAL_STARTUP_DELAY_SECONDS} সেকেন্ড (ওয়েব সার্ভার রেডি হওয়ার জন্য)`);
console.log(` ব্যবধান: প্রতি ${INTERVAL_MINUTES} মিনিট পরপর`);
console.log("==================================================");

let isExecuting = false;

function triggerCron(isRetry = false) {
  if (isExecuting) {
    console.log("[CRON] পূর্ববর্তী ক্রলিং এখনও চলমান, নতুন রিকোয়েস্ট স্থগিত রাখা হলো।");
    return;
  }

  const now = new Date().toISOString();
  console.log(`\n[${now}] ${isRetry ? "পুনরায় চেষ্টা (Retry)" : "স্বয়ংক্রিয় শিডিউলড ক্রলিং"} ট্রিগার করা হচ্ছে...`);
  isExecuting = true;

  const url = `${BASE_URL}/api/cron/spider`;
  // The secret goes in a header, so it never appears in access logs
  const options = CRON_SECRET ? { headers: { Authorization: `Bearer ${CRON_SECRET}` } } : {};

  const req = http
    .get(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        isExecuting = false;
        try {
          const json = JSON.parse(data);
          if (json.success) {
            console.log("✔ ক্রলিং সফল হয়েছে!");
            console.log(`- লক্ষ্য তারিখ: ${json.execution.targetDate}`);
            console.log(`- সংরক্ষিত নতুন আর্টিকেল: ${json.execution.savedArticles} টি`);
            console.log(`- ডুপ্লিকেট বাদ: ${json.execution.skippedDuplicates} টি`);
            console.log(`- সময়কাল: ${json.execution.durationSeconds}s`);
          } else {
            console.error("✖ ক্রলিং ব্যর্থ:", json.error || json.message);
          }
        } catch (e) {
          console.log("প্রতিক্রিয়া:", data.slice(0, 300));
        }
      });
    })
    .on("error", (err) => {
      isExecuting = false;
      console.error(`সার্ভারে সংযোগ ব্যর্থ (${err.message}). ওয়েব সার্ভার চালু হতে বিলম্ব হচ্ছে।`);
      // Retry in 30 seconds if connection refused on initial run
      if (!isRetry && err.code === "ECONNREFUSED") {
        console.log("[CRON] ৩০ সেকেন্ড পর পুনরায় সংযোগের চেষ্টা করা হবে...");
        setTimeout(() => triggerCron(true), 30000);
      }
    });

  // Set 60s timeout for network requests
  req.setTimeout(60000, () => {
    req.destroy();
    isExecuting = false;
    console.error("[CRON] ক্রলিং রিকোয়েস্ট টাইমআউট (৬০ সেকেন্ড অতিক্রম করেছে)।");
  });
}

// Initial run with startup grace delay so Next.js server is 100% bound to port 3000
setTimeout(() => {
  triggerCron();
}, INITIAL_STARTUP_DELAY_SECONDS * 1000);

// Recurring scheduled interval
setInterval(triggerCron, INTERVAL_MINUTES * 60 * 1000);
