"use client";

import { useState } from "react";
import Link from "next/link";
import KhoborLogo from "./KhoborLogo";
import { subscribeNewsletterAction } from "@/actions/newsletter";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const FOOTER_CATEGORIES = [
  { name: "জাতীয় পরিক্রমা", slug: "national" },
  { name: "আন্তর্জাতিক সম্পর্ক", slug: "world" },
  { name: "অর্থনীতি ও ব্যাংকিং", slug: "economy" },
  { name: "বিজ্ঞান ও প্রযুক্তি", slug: "tech" },
  { name: "বিসিএস ও সাধারণ জ্ঞান", slug: "exam-prep" },
  { name: "সম্পাদকীয় ও কলাম", slug: "opinion" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setFeedback("");

    try {
      const res = await subscribeNewsletterAction(email);
      if (res.success) {
        setStatus("success");
        setFeedback(res.message || "ধন্যবাদ! সাপ্তাহিক সারসংক্ষেপ তালিকায় আপনি যুক্ত হয়েছেন।");
        setEmail("");
      } else {
        setStatus("error");
        setFeedback(res.error || "সারসংক্ষেপে যুক্ত হতে সমস্যা হয়েছে।");
      }
    } catch {
      setStatus("error");
      setFeedback("সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    }
  };

  return (
    <footer className="mt-20 border-t border-[#d8d2c4] bg-[#2a303c] text-[#cbd3de]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="mb-3">
              <KhoborLogo variant="horizontal" size="sm" theme="dark" showTagline={true} />
            </div>

            <p className="mt-2 text-xs text-[#9aa4b2] leading-relaxed">
              শিক্ষার্থী, গবেষক ও চিন্তাশীল পাঠকদের জন্য নিরপেক্ষ তথ্য ও বিশ্লেষণের ডিজিটাল প্ল্যাটফর্ম।
            </p>
            <p className="mt-4 text-xs text-[#7d8896]">
              সংস্করণ ১.০.০ &bull; সর্বস্বত্ব সংরক্ষিত &copy; ২০২৬ খবরাখবর
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d0d7e0] mb-3">
              বিভাগসমূহ
            </h3>
            <ul className="space-y-1.5 text-xs text-[#9aa4b2]">
              {FOOTER_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className="hover:text-white transition">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d0d7e0] mb-3">
              নীতিমালা ও তথ্যাবলি
            </h3>
            <ul className="space-y-1.5 text-xs text-[#9aa4b2]">
              <li>
                <Link href="/policy#editorial" className="hover:text-white transition">
                  সম্পাদকীয় নীতিমালা
                </Link>
              </li>
              <li>
                <Link href="/policy#fact-check" className="hover:text-white transition">
                  তথ্য যাচাইকরণ প্রক্রিয়া
                </Link>
              </li>
              <li>
                <Link href="/policy#support" className="hover:text-white transition">
                  শিক্ষার্থী ও গবেষক সহায়তা
                </Link>
              </li>
              <li>
                <Link href="/policy#privacy" className="hover:text-white transition">
                  গোপনীয়তা ও পাঠক সুরক্ষা নীতি
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d0d7e0] mb-3">
              সাপ্তাহিক সারসংক্ষেপ
            </h3>
            <p className="text-xs text-[#9aa4b2] mb-3">
              গুরুত্বপূর্ণ শিক্ষণীয় সংবাদ ও বিশ্লেষণমূলক সারাংশ সরাসরি আপনার ইনবক্সে গ্রহণ করুন।
            </p>
            <form className="space-y-2" onSubmit={handleSubscribe}>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ইমেইল ঠিকানা..."
                  className="bg-[#1e232c] border border-[#3b4352] text-xs text-white px-3 py-2 rounded focus:outline-none focus:border-[#7a2020] flex-1"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-[#7a2020] hover:bg-[#631818] disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded transition flex items-center gap-1 cursor-pointer"
                >
                  {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>যুক্ত হোন</span>
                </button>
              </div>

              {feedback && (
                <div className={`p-2 rounded text-[11px] flex items-start gap-1.5 leading-snug animate-fade-in ${
                  status === "success" ? "bg-emerald-950/60 border border-emerald-700/60 text-emerald-300" : "bg-rose-950/60 border border-rose-700/60 text-rose-300"
                }`}>
                  {status === "success" ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                  <span>{feedback}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Legal, Trademark & Fair-Use Educational Disclaimer */}
        <div className="mt-10 p-4 sm:p-5 bg-[#1e232c] border border-[#3b4352] rounded-xl text-[11px] text-[#9aa4b2] leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-[#f5c66b]" />
            <span className="font-serif text-xs">আইনগত বিজ্ঞপ্তি, ট্রেডমার্ক ও শিক্ষামূলক ফেয়ার-ইউজ নীতি (Legal, Trademark & Fair-Use Policy)</span>
          </div>
          <p>
            খবরাখবর (KhoboraKhobor) একটি স্বাধীন এডটেক ও বিসিএস/বিশ্ববিদ্যালয় ভর্তি পরীক্ষা প্রস্তুতিমূলক সংবাদ বিশ্লেষণ প্ল্যাটফর্ম। প্ল্যাটফর্মে ব্যবহৃত সকল সংবাদপত্রের নাম, সংক্ষিপ্ত মনোগ্রাম ও তথ্যসূত্র সংশ্লিষ্ট প্রকাশনা প্রতিষ্ঠানের রেজিস্টার্ড স্বত্ব ও ট্রেডমার্ক। বাংলাদেশ কপিরাইট আইন ২০২৩ এবং আন্তর্জাতিক ফেয়ার-ইউজ (Fair Dealing) নীতিমালার আওতায় কেবল উৎস নির্দেশ ও রেফারেন্সের জন্য এগুলো ব্যবহৃত হচ্ছে। খবরাখবর সংশ্লিষ্ট কোনো সংবাদমাধ্যমের সাথে আনুষ্ঠানিক অংশীদারিত্ব বা অনুমোদন দাবি করে না। পাঠকদের সুবিধার্থে প্রতিটি সংবাদের সঙ্গে সংশ্লিষ্ট সংবাদপত্রের মূল বিস্তারিত প্রতিবেদনের রেফারেন্স লিংক সংযুক্ত রয়েছে।
          </p>
        </div>

        {/* Digital Signature & Copyright Claim */}
        <div 
          data-signature="SHA256:KK-2026-BD-NEWS-VERIFIED"
          className="mt-6 pt-6 border-t border-[#3b4352] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8e9aa8]"
        >
          <p className="text-[11px] text-[#9aa4b2]">
            &copy; ২০২৬ খবরাখবর (KhoboraKhobor) &bull; গণমাধ্যম ও তথ্যপ্রযুক্তি আইন অনুযায়ী সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="text-[11px] text-[#7d8896]">
            শিক্ষার্থী ও পাঠকদের নির্ভরযোগ্য সংবাদ ও শিক্ষামূলক প্ল্যাটফর্ম
          </p>
        </div>
      </div>
    </footer>
  );
}
