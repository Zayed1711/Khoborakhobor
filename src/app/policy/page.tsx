import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getCurrentSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, BookOpen, CheckCircle2, Lock, HelpCircle, FileText, Scale } from "lucide-react";

export const metadata = {
  title: "নীতিমালা, তথ্য যাচাই ও পাঠক সুরক্ষা | খবরাখবর",
  description: "খবরাখবর প্ল্যাটফর্মের সম্পাদকীয় নীতিমালা, তথ্য যাচাইকরণ প্রক্রিয়া, পাঠক তথ্য গোপনীয়তা ও শিক্ষার্থী সহায়তা নির্দেশিকা।",
};

export const dynamic = "force-dynamic";

export default async function PolicyPage() {
  const [session, categories] = await Promise.all([
    getCurrentSession(),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans text-[#1c1d21] pb-16 md:pb-0">
      <Header categories={categories} session={session} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-12">
        {/* Header Hero */}
        <header className="border-b border-[#ded8cb] pb-6 space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5ebeb] text-[#842323] text-xs font-bold uppercase tracking-wider border border-[#ecd9d9]">
            <Scale className="w-3.5 h-3.5 text-[#842323]" />
            <span>আইনগত ও প্রাতিষ্ঠানিক নির্দেশিকা</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#17191d] font-serif leading-tight">
            খবরাখবর নীতিমালা ও পাঠক সুরক্ষা সনদ
          </h1>
          <p className="text-xs sm:text-sm text-[#505764] leading-relaxed max-w-2xl">
            উচ্চশিক্ষা, বিসিএস প্রস্তুতি ও গবেষণার জন্য বস্তুনিষ্ঠ তথ্য পরিবেশন, ডেটা প্রাইভেসি সুরক্ষা এবং শিক্ষামূলক ফেয়ার-ইউজ নির্দেশিকা।
          </p>
        </header>

        {/* 1. EDITORIAL POLICY */}
        <section id="editorial" className="p-6 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#f4efe4]">
            <div className="w-8 h-8 rounded-xl bg-[#faf8f4] border border-[#ded8cb] flex items-center justify-center text-[#842323]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1c1d21] font-serif">১. সম্পাদকীয় নীতিমালা (Editorial Policy)</h2>
              <span className="text-[11px] text-[#717887]">বস্তুনিষ্ঠতা, স্বাধীনতা ও রেফারেন্স নির্দেশিকা</span>
            </div>
          </div>
          <div className="text-xs text-[#404652] leading-relaxed space-y-2.5">
            <p>
              খবরাখবর একটি স্বাধীন এডটেক এবং সংবাদ বিশ্লেষণ প্ল্যাটফর্ম। আমাদের মূল লক্ষ্য শিক্ষার্থী, বিসিএস ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার্থীদের পাঠ্যক্রমভিত্তিক তথ্য ও সাম্প্রতিক ঘটনাবলির নির্ভরযোগ্য বিশ্লেষণ প্রদান করা।
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-[#343a46]">
              <li><strong>উৎস নির্দেশ (Attribution):</strong> প্রতিটি প্রতিবেদনের শিরোনাম, মূল তথ্যসূত্র এবং সরাসরি মূল পত্রিকার বিস্তারিত লিংক স্পষ্টভাবে উল্লেখ করা হয়।</li>
              <li><strong>নিরপেক্ষতা:</strong> কোনো রাজনৈতিক বা দলীয় মতাদর্শ প্রচার না করে কেবল পরীক্ষার্থীকেন্দ্রিক জাতীয় ও আন্তর্জাতিক তথ্য পরিবেশন করা হয়।</li>
              <li><strong>পেশাদারিত্ব:</strong> সংবাদ বিশ্লেষণের ক্ষেত্রে জাতীয় স্বার্থ, সংবিধানের মূলনীতি ও দায়িত্বশীল সাংবাদিকতার মর্যাদা অক্ষুণ্ণ রাখা হয়।</li>
            </ul>
          </div>
        </section>

        {/* 2. FACT-CHECKING PROCESS */}
        <section id="fact-check" className="p-6 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#f4efe4]">
            <div className="w-8 h-8 rounded-xl bg-[#faf8f4] border border-[#ded8cb] flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1c1d21] font-serif">২. তথ্য যাচাইকরণ প্রক্রিয়া (Fact-Checking Protocol)</h2>
              <span className="text-[11px] text-[#717887]">ক্রস-রেফারেন্সিং ও মাল্টি-সোর্স সত্যতা নিরূপণ</span>
            </div>
          </div>
          <div className="text-xs text-[#404652] leading-relaxed space-y-2.5">
            <p>
              তথ্য নির্ভুল রাখতে আমাদের স্বয়ংক্রিয় স্পাইডার এবং সম্পাদকীয় টিম ৩-স্তরবিশিষ্ট যাচাইকরণ মডেল অনুসরণ করে:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[#faf8f4] border border-[#ded8cb] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#842323] uppercase">স্তর ১: উৎস স্ক্রিনিং</span>
                <p className="text-[11px] text-[#555d6b]">কেবল বাংলাদেশ সরকার অনুমোদিত শীর্ষ জাতীয় ও আন্তর্জাতিক স্বীকৃত গণমাধ্যম থেকে তথ্য সংকলন।</p>
              </div>
              <div className="p-3 bg-[#faf8f4] border border-[#ded8cb] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#842323] uppercase">স্তর ২: নয়েজ ফিল্টারিং</span>
                <p className="text-[11px] text-[#555d6b]">পারিবারিক বিরোধ, ভিত্তিহীন গুজব বা লঘু বিনোদন সংবাদ পরীক্ষার সিলেবাসের স্বার্থে বাদ দেওয়া হয়।</p>
              </div>
              <div className="p-3 bg-[#faf8f4] border border-[#ded8cb] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#842323] uppercase">স্তর ৩: উপাত্ত ছক বিন্যাস</span>
                <p className="text-[11px] text-[#555d6b]">অর্থনৈতিক ডেটা, জিডিপি বা সাংবিধানিক ধারা সংশ্লিষ্ট সরকারি প্রকাশনার সাথে মিলিয়ে ছকভুক্ত করা।</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. STUDENT & RESEARCHER SUPPORT */}
        <section id="support" className="p-6 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#f4efe4]">
            <div className="w-8 h-8 rounded-xl bg-[#faf8f4] border border-[#ded8cb] flex items-center justify-center text-blue-700">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1c1d21] font-serif">৩. শিক্ষার্থী ও গবেষক সহায়তা (Academic Support)</h2>
              <span className="text-[11px] text-[#717887]">পরীক্ষার সিলেবাস ম্যাপিং ও স্টাডি নোটবুক গাইড</span>
            </div>
          </div>
          <div className="text-xs text-[#404652] leading-relaxed space-y-2.5">
            <p>
              শিক্ষার্থীদের পড়াশোনার গতি বাড়াতে খবরাখবর দিচ্ছে ক্লাউড নোটবুক, শব্দভাণ্ডার ডেক এবং দৈনিক কারেন্ট অ্যাফেয়ার্স ক্যাপসুল।
            </p>
            <p>
              যেকোনো অ্যাকাডেমিক সহায়তা, তথ্যগত সংশোধন বা প্ল্যাটফর্মের ত্রুটির জন্য আমাদের সাথে সরাসরি যোগাযোগ করতে পারেন:
            </p>
            <div className="p-3 bg-[#f8f6f0] border border-[#e5dec9] rounded-xl text-xs space-y-1 font-mono">
              <p><strong>ইমেইল:</strong> support@kkhobor.com</p>
              <p><strong>সম্পাদকীয় ডেস্ক:</strong> editorial@kkhobor.com</p>
              <p><strong>অ্যাকাডেমিক সহায়তা সময়:</strong> শনিবার – বৃহস্পতিবার, সকাল ৯:০০ – রাত ৯:০০ (বাংলাদেশ সময়)</p>
            </div>
          </div>
        </section>

        {/* 4. PRIVACY & DATA PROTECTION */}
        <section id="privacy" className="p-6 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#f4efe4]">
            <div className="w-8 h-8 rounded-xl bg-[#faf8f4] border border-[#ded8cb] flex items-center justify-center text-amber-700">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1c1d21] font-serif">৪. গোপনীয়তা ও পাঠক সুরক্ষা নীতি (Privacy & Reader Protection)</h2>
              <span className="text-[11px] text-[#717887]">ব্যক্তিগত তথ্যের নিরাপত্তা ও ডেটা অধিকার</span>
            </div>
          </div>
          <div className="text-xs text-[#404652] leading-relaxed space-y-2.5">
            <p>
              খবরাখবর আপনার গোপনীয়তাকে সর্বোচ্চ অগ্রাধিকার দেয়। আমরা কোনো তৃতীয় পক্ষের কাছে শিক্ষার্থীদের ব্যক্তিগত তথ্য বা পড়ার ইতিহাস বিক্রি করি না।
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-[#343a46]">
              <li><strong>ন্যূনতম ডেটা সংগ্রহ:</strong> আমরা কেবল শিক্ষার্থীর নাম, জিমেইল ঠিকানা এবং পরীক্ষার লক্ষ্য (যেমন: বিসিএস/ভর্তি) সংরক্ষণ করি।</li>
              <li><strong>পাসওয়ার্ড নিরাপত্তা:</strong> পাসওয়ার্ডগুলো শক্তিশালী ওয়ান-ওয়ে ক্রিপ্টোগ্রাফিক অ্যালগরিদম (PBKDF2/SHA256) দ্বারা সুরক্ষিত।</li>
              <li><strong>অ্যাকাউন্ট ডিলিট অধিকার:</strong> শিক্ষার্থী যেকোনো সময় তার স্টাডি নোট, ব্যক্তিগত ওয়ার্ড ব্যাংক এবং সম্পূর্ণ অ্যাকাউন্ট মুছে ফেলার অধিকার রাখেন।</li>
            </ul>
          </div>
        </section>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
}

