const http = require("http");

const BASE_URL = process.env.SITE_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";
const INTERVAL_MINUTES = parseInt(process.env.CRON_INTERVAL_MINUTES || "360", 10); // ডিফল্ট: প্রতি ৬ ঘণ্টা (৩৬০ মিনিট)

console.log("==================================================");
console.log(" খবরাখবর ব্যাকগ্রাউন্ড ক্রলার ওয়ার্কার (Cron Worker)");
console.log(` লক্ষ্য: ${BASE_URL}/api/cron/spider`);
console.log(` ব্যবধান: প্রতি ${INTERVAL_MINUTES} মিনিট পরপর`);
console.log("==================================================");

function triggerCron() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] স্বয়ংক্রিয় শিডিউলড ক্রলিং ট্রিগার করা হচ্ছে...`);

  const url = `${BASE_URL}/api/cron/spider${CRON_SECRET ? `?secret=${CRON_SECRET}` : ""}`;

  http
    .get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
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
      console.error("সার্ভারে সংযোগ ব্যর্থ (নিশ্চিত করুন নেক্সটজেএস সার্ভার চালু রয়েছে):", err.message);
    });
}

// স্ক্রিপ্ট চালুর সাথে সাথে একবার রান হবে
triggerCron();

// নির্ধারিত ব্যবধানে পুনরাবৃত্তি হবে
setInterval(triggerCron, INTERVAL_MINUTES * 60 * 1000);
