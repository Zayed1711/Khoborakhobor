/**
 * KhoboraKhobor (খবরাখবর) - Production Database Seed Engine
 * Seeds standard categories, initial student test profiles, and runs real news setup.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "জাতীয় পরিক্রমা", slug: "national", color: "red" },
  { name: "আন্তর্জাতিক সম্পর্ক", slug: "world", color: "indigo" },
  { name: "অর্থনীতি ও বাণিজ্য", slug: "economy", color: "emerald" },
  { name: "বিজ্ঞান ও প্রযুক্তি", slug: "tech", color: "violet" },
  { name: "শিল্প, সাহিত্য ও সংস্কৃতি", slug: "entertainment", color: "purple" },
  { name: "খেলাধুলা", slug: "sports", color: "orange" },
  { name: "রাজনীতি ও সুশাসন", slug: "politics", color: "blue" },
  { name: "সম্পাদকীয় ও কলাম", slug: "opinion", color: "rose" },
  { name: "জীবনযাপন ও শিক্ষা", slug: "lifestyle", color: "teal" },
  { name: "বিসিএস ও সাধারণ জ্ঞান", slug: "exam-prep", color: "amber" },
];

async function main() {
  console.log("🌱 Initializing KhoboraKhobor Database Standard Categories...");

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color },
      create: { name: cat.name, slug: cat.slug, color: cat.color },
    });
  }

  console.log("✅ Categories initialized successfully. (Zero dummy accounts created)");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
