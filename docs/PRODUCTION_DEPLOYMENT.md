# 🚀 খবরাখবর (KhoboraKhobor) - Production Deployment & Operations Guide

> **লক্ষ্য**: শিক্ষার্থী ও গবেষক কেন্দ্রিক ডিজিটাল পত্রিকা ও একটিভ রিকল লার্নিং প্ল্যাটফর্ম খবরাখবর-এর নিরবচ্ছিন্ন প্রোডাকশন ডেপ্লয়মেন্ট, ক্লাউড ডাটাবেজ কনফিগারেশন, স্বয়ংক্রিয় ক্রন শিডিউলার এবং ডেটা ব্যাকআপ গাইড।

---

## ১. আর্কিটেকচার ওভারভিউ (Architecture Overview)

* **ফ্রন্টএন্ড ও সার্ভার ফ্রেমওয়ার্ক**: Next.js 16 (React 19, Server Components & Server Actions, App Router)
* **স্টাইলিং**: Tailwind CSS v4 + Eye-Care Dynamic Theme System (`parchment`, `sepia`, `dark`)
* **ডাটাবেজ ও ওআরএম**: Prisma ORM v5
  * *লোকাল ডেভেলপমেন্ট*: SQLite (`prisma/dev.db`)
  * *প্রোডাকশন সুপারিশ*: PostgreSQL (Neon, Supabase, Railway Postgres, বা Vercel Postgres)
* **অডিও ইঞ্জিন**: Web Speech API Text-to-Speech (সেন্টেন্স চাঙ্কিং ও সিঙ্ক্রোনাইজড হাইলাইটিং)
* **অটোমেটেড স্ক্র্যাপার ও ক্রন**: Vercel Cron / Node.js Background Worker + Cheerio / Multi-Portal Engine

---

## ২. ডাটাবেজ মাইগ্রেশন গাইড (SQLite থেকে PostgreSQL)

সার্ভারলেস (যেমন Vercel) প্ল্যাটফর্মে ফাইল-ভিত্তিক SQLite স্থায়ী থাকে না। প্রোডাকশন চালুর জন্য একটি ক্লাউড PostgreSQL ডাটাবেজ প্রয়োজন:

### ধাপ ১: ক্লাউড ডাটাবেজ তৈরি
1. **Neon (neon.tech)** অথবা **Supabase (supabase.com)**-এ একটি ফ্রি PostgreSQL ডাটাবেজ খুলুন।
2. আপনার ডাটাবেজের `DATABASE_URL` কানেকশন স্ট্রিংটি সংগ্রহ করুন:
   ```env
   DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-1.aws.neon.tech/khoborakhobor?sslmode=require"
   ```

### ধাপ ২: Prisma স্কিমা আপডেট (`prisma/schema.prisma`)
`prisma/schema.prisma` ফাইলের শুরুতে `provider`-টি পরিবর্তন করুন:

```prisma
datasource db {
  provider = "postgresql" // লোকাল ছিল "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### ধাপ ৩: মাইগ্রেশন ও স্কিমা পুশ
টার্মিনালে কমান্ডটি চালান:
```bash
npx prisma generate
npx prisma db push
```

### ধাপ ৪: প্রাথমিক সিড ডাটা ও ব্যাকআপ ইমপোর্ট
যদি আপনার পূর্বের ডেটা ব্যাকআপ ফাইল (`backups/backup_*.json`) থাকে, তা সহজেই নতুন ক্লাউড ডাটাবেজে রিস্টোর করুন:
```bash
node scripts/backup_db.js --restore backups/backup_YYYY-MM-DD_HH-mm-ss.json
```

---

## ৩. প্রোডাকশন এনভায়রনমেন্ট ভেরিয়েবল চেকলিস্ট (Environment Variables)

হোস্টিং প্রোভাইডারের এনভায়রনমেন্ট সেটিংস ট্যাবে নিম্নোক্ত ভেরিয়েবলগুলো কনফিগার করুন:

| ভেরিয়েবল নাম | প্রয়োজনীয়তা | বিবরণ ও উদাহরণ |
| :--- | :--- | :--- |
| `DATABASE_URL` | **আবশ্যক** | PostgreSQL বা ডেডিকেটেড ডাটাবেজের কানেকশন স্ট্রিং |
| `CRON_SECRET` | **আবশ্যক** | অটোমেটেড স্ক্র্যাপার ক্রন সিক্রেট টোকেন (যেমন: `khobor_cron_secure_tok_842323`) |
| `NEXT_PUBLIC_APP_URL` | **আবশ্যক** | প্রোডাকশন ডোমেইন URL (যেমন: `https://khoborakhobor.com`) |
| `GEMINI_API_KEY` | ঐচ্ছিক (AI ফিচার) | স্বয়ংক্রিয় বুলেটিন সারাংশ, শব্দভাণ্ডার বিশ্লেষণ ও কুইজ তৈরির জন্য |

---

## ৪. অটোমেটেড ক্রন শিডিউলার কনফিগারেশন (Automated Crawler Engine)

খবরাখবর-এ প্রতিদিন জাতীয় ও আন্তর্জাতিক শীর্ষ পোর্টাল থেকে স্বয়ংক্রিয়ভাবে সংবাদ সংগ্রহ ও শিক্ষা উপযোগীকরণ হয়:

### অপশন ক: Vercel Crons (সুপারিশকৃত)
প্রকল্পের রুটে `vercel.json` ইতিমধ্যে কনফিগার করা আছে:
```json
{
  "crons": [
    {
      "path": "/api/cron/spider?limit=6&lang=bn",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/spider?limit=6&lang=bn",
      "schedule": "0 8 * * *"
    }
  ]
}
```
* **সকাল ৬:০০ BST (00:00 UTC)**: প্রাতঃকালীন শীর্ষ সংবাদ ও ক্যাপসুল ব্রিফিং সংগ্রহ।
* **দুপুর ২:০০ BST (08:00 UTC)**: মধ্যাহ্নকালীন আপডেট।
* Vercel স্বয়ংক্রিয়ভাবে `Authorization: Bearer <CRON_SECRET>` হেডার পাস করে।

### অপশন খ: এক্সটার্নাল ক্রন মনিটর (cron-job.org / GitHub Actions)
যেকোনো ফ্রি ক্রন সেবা দিয়ে নিচের এন্ডপয়েন্টে শিডিউল কল করুন:
* **URL**: `https://khoborakhobor.com/api/cron/spider?limit=8&lang=bn`
* **Method**: `GET`
* **HTTP Header**:
  ```http
  Authorization: Bearer <আপনার_CRON_SECRET>
  ```

### অপশন গ: সেলফ-হোস্টেড নোড ওয়ার্কার (VPS / PM2)
একটি লিনাক্স সার্ভার বা উবুন্টু VPS-এ সরাসরি ব্যাকগ্রাউন্ড ওয়ার্কার চালু রাখুন:
```bash
npm run cron
```

---

## ৫. Vercel-এ এক ক্লিকে ডেপ্লয়মেন্ট নির্দেশিকা

1. আপনার কোডবেসটি GitHub / GitLab-এ পুশ করুন:
   ```bash
   git add .
   git commit -m "feat: complete production ready KhoboraKhobor"
   git push origin main
   ```
2. [Vercel Dashboard](https://vercel.com)-এ যান এবং **Add New Project** সিলেক্ট করুন।
3. রিপোজিটরিটি ইমপোর্ট করুন।
4. **Environment Variables** সেকশনে `DATABASE_URL`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` যোগ করুন।
5. **Deploy** বাটনে ক্লিক করুন। ২ মিনিটের মধ্যে সাইট লাইভ হয়ে যাবে।

---

## ৬. ডেটাবেজ ব্যাকআপ ও ডিজাস্টার রিকভারি (Backup & Restore)

খবরাখবর সিস্টেমে একটি ডেডিকেটেড ব্যাকআপ স্ক্রিপ্ট অন্তর্ভুক্ত রয়েছে:

### ১. লাইভ ডাটাবেজ ব্যাকআপ নেয়া
```bash
npm run backup
```
* আউটপুট ফাইল: `backups/backup_YYYY-MM-DDTHH-mm-ss-msZ.json`
* এতে স্টুডেন্ট প্রোফাইল, সমস্ত কিউরেটেড আর্টিকেল, ফ্ল্যাশকার্ড, শব্দভাণ্ডার ও কুইজ ফলাফল সংরক্ষিত থাকে।

### ২. ডাটাবেজ স্ট্যাটাস নিরীক্ষা
```bash
npm run backup:stats
```

### ৩. ব্যাকআপ থেকে ডেটা রিস্টোর করা
```bash
node scripts/backup_db.js --restore backups/backup_2026-10-28T14-20-58-669Z.json
```

---

## ৭. আই-কেয়ার থিম ও ক্লায়েন্ট পারফরম্যান্স টিপস

1. **আই-কেয়ার রিডিং থিমস**:
   - `Parchment` (ডিফল্ট ক্লাসিক উষ্ণ সম্পাদকীয় কাগজ)
   - `Sepia` (চোখের সুরক্ষায় মৃদু অ্যাম্বার আই-কেয়ার মোড)
   - `Dark` (রাতকালীন ও ওলেড স্লেট মোড)
   - থিম সিলেকশন `localStorage` এ সংরক্ষিত হয় এবং `src/app/layout.tsx` এর ইনলাইন প্রি-হাইড্রেশন স্ক্রিপ্ট দ্বারা ফ্লাশ-ফ্রি লোড হয়।
2. **বাংলা ফন্ট রেন্ডারিং**:
   - সিস্টেমের `Noto Serif Bengali`, `Noto Sans Bengali` এবং অপ্টিমাইজড ওয়েব-সেফ ফন্ট স্ট্যাক ব্যবহার করা হয়েছে।
3. **ওয়েব স্পিচ এপিআই (Text-to-Speech)**:
   - ক্রোমিয়াম ও মোবাইল ব্রাউজারে দীর্ঘ পাঠ্যের অডিও যাতে বাফার না কাটে, সেজন্য প্রতিটি প্যারাগ্রাফ স্বয়ংক্রিয়ভাবে যতিচিহ্ন (`।`, `.`, `\n`) অনুসারে চাঙ্ক করে ক্রমান্বয়ে চালানো হয়।

---
**খবরাখবর ইঞ্জিন প্রস্তুত ও সফলভাবে প্রোডাকশন রেডি!** 🇧🇩

