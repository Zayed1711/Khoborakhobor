import Link from "next/link";
import { Download, Copy, CheckCircle2, Palette, Shield, Sparkles, BookOpen, Layers } from "lucide-react";
import KhoborLogo from "@/components/KhoborLogo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "ব্র্যান্ড আইডেন্টিটি ও লোগো স্পেসিফিকেশন | খবরাখবর",
  description: "খবরাখবর (KhoboraKhobor) এর অফিসিয়াল লোগো, মনোগ্রাম প্রতীক, রঙের সংমিশ্রণ ও টাইপোগ্রাফি ব্র্যান্ড গাইড।",
};

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1c1d21]">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>অফিসিয়াল ব্র্যান্ড গাইডলাইন ও ডিজাইন সিস্টেম</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-serif text-[#14171d] tracking-tight">
            খবরাখবর ব্র্যান্ড ও লোগো আইডেন্টিটি
          </h1>
          <p className="text-sm sm:text-base text-[#575e6d] leading-relaxed">
            সত্য, বস্তুনিষ্ঠ বিশ্লেষণ ও উচ্চশিক্ষার অ্যাকাডেমিক গভীরতার প্রতীক। ঐতিহ্যবাহী বাংলা বর্ণমালা, ক্লাসিক সংবাদপত্রের ভাঁজ ও জ্ঞানের স্বর্ণাভ আলোকবর্তিকার সমন্বয়ে নির্মিত মনোগ্রাম।
          </p>
        </div>

        {/* 1. PRIMARY LOGO VARIANTS GRID */}
        <section className="space-y-6">
          <div className="border-b border-[#e2ddd3] pb-3 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#17191d]">
              ১. মূল লোগো বিন্যাস (Official Logo Variants)
            </h2>
            <span className="text-xs font-semibold text-[#842323] bg-[#f5ebeb] px-2.5 py-1 rounded border border-[#ecd9d9]">
              SVG ভেক্টর ফাইলসমূহ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Horizontal Brandmark */}
            <div className="bg-white p-8 rounded-2xl border border-[#ded8cb] shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#842323] uppercase tracking-wider">
                  প্রাইমারি অনুভূমিক রূপ (Primary Horizontal)
                </span>
                <h3 className="text-lg font-bold text-[#14171d]">অনুভূমিক ব্র্যান্ডমার্ক</h3>
                <p className="text-xs text-[#636c7c]">
                  ওয়েবসাইট নেভিগেশন, অফিসিয়াল নথি, প্রেস কার্ড ও বিজ্ঞাপনের জন্য আদর্শ।
                </p>
              </div>

              <div className="py-8 px-4 bg-[#fcfbfa] border border-[#eee9de] rounded-xl flex items-center justify-center">
                <KhoborLogo variant="horizontal" size="lg" showTagline={true} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#f0ebd5]">
                <span className="text-xs font-mono text-[#777e8b]">public/logo.svg</span>
                <a
                  href="/logo.svg"
                  download="khoborakhobor-logo.svg"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#842323] text-white text-xs font-medium hover:bg-[#6e1c1c] transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>SVG ডাউনলোড</span>
                </a>
              </div>
            </div>

            {/* Vertical / Masthead */}
            <div className="bg-white p-8 rounded-2xl border border-[#ded8cb] shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#842323] uppercase tracking-wider">
                  মাস্টহেড রূপ (Broadsheet Masthead)
                </span>
                <h3 className="text-lg font-bold text-[#14171d]">ভার্টিকাল ও ব্রডশিট মাস্টহেড</h3>
                <p className="text-xs text-[#636c7c]">
                  পত্রিকার প্রথম পাতা, প্রকাশনা কভার, সার্টিফিকেট ও ল্যান্ডিং পেজ মাস্টহেডের জন্য তৈরি।
                </p>
              </div>

              <div className="py-6 px-4 bg-[#fcfbfa] border border-[#eee9de] rounded-xl flex items-center justify-center">
                <KhoborLogo variant="masthead" size="md" showTagline={true} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#f0ebd5]">
                <span className="text-xs font-mono text-[#777e8b]">public/logo-vertical.svg</span>
                <a
                  href="/logo-vertical.svg"
                  download="khoborakhobor-masthead.svg"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#842323] text-white text-xs font-medium hover:bg-[#6e1c1c] transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>SVG ডাউনলোড</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 2. EMBLEM SEAL & APP ICONS */}
        <section className="space-y-6">
          <div className="border-b border-[#e2ddd3] pb-3">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#17191d]">
              ২. প্রতীক ও অ্যাপ আইকন (Emblem Seal & Icons)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Standalone Emblem */}
            <div className="bg-white p-6 rounded-2xl border border-[#ded8cb] text-center space-y-4">
              <span className="text-[11px] font-bold text-[#842323] uppercase tracking-wider block">
                অফিসিয়াল সিল (Official Seal)
              </span>
              <div className="py-6 flex justify-center">
                <KhoborLogo variant="icon" size="xl" />
              </div>
              <p className="text-xs text-[#636c7c]">
                সোশ্যাল মিডিয়া প্রোফাইল, ওয়াটারমার্ক ও মনোগ্রাম প্রতীক (৫১২×৫১২)।
              </p>
              <a
                href="/logo-icon.svg"
                download="khoborakhobor-seal.svg"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d6cfc0] hover:bg-[#f5f1e8] text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5 text-[#842323]" />
                <span>logo-icon.svg</span>
              </a>
            </div>

            {/* Mobile Compact Navbar */}
            <div className="bg-white p-6 rounded-2xl border border-[#ded8cb] text-center space-y-4">
              <span className="text-[11px] font-bold text-[#842323] uppercase tracking-wider block">
                মোবাইল অ্যাপ বার (Mobile Compact)
              </span>
              <div className="py-8 flex justify-center">
                <div className="px-4 py-2 bg-[#faf8f4] border border-[#e2ddd3] rounded-xl inline-block">
                  <KhoborLogo variant="compact" size="sm" showTagline={true} />
                </div>
              </div>
              <p className="text-xs text-[#636c7c]">
                মোবাইল স্ক্রিনে স্পেস সাশ্রয়ী এক-লাইনের আধুনিক উপস্থাপন।
              </p>
              <span className="text-[11px] font-mono text-[#88909d] block pt-2">
                variant=&quot;compact&quot;
              </span>
            </div>

            {/* Browser Tab Favicon */}
            <div className="bg-white p-6 rounded-2xl border border-[#ded8cb] text-center space-y-4">
              <span className="text-[11px] font-bold text-[#842323] uppercase tracking-wider block">
                ফেভআইকন (Browser Tab 16/32px)
              </span>
              <div className="py-8 flex justify-center items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#ece7dc] rounded-lg">
                  <img src="/favicon.svg" alt="Favicon 32" className="w-6 h-6" />
                  <span className="text-xs font-medium text-[#2d333f]">খবরাখবর...</span>
                </div>
              </div>
              <p className="text-xs text-[#636c7c]">
                ব্রাউজারের ট্যাব ও বুকমার্কে অতি-উচ্চ রেজোলিউশন নিশ্চিতকারী ভেক্টর।
              </p>
              <a
                href="/favicon.svg"
                download="favicon.svg"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d6cfc0] hover:bg-[#f5f1e8] text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5 text-[#842323]" />
                <span>favicon.svg</span>
              </a>
            </div>
          </div>
        </section>

        {/* 3. DARK BACKGROUND / FOOTER CONTRAST */}
        <section className="space-y-6">
          <div className="border-b border-[#e2ddd3] pb-3">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#17191d]">
              ৩. ডার্ক মোড ও কনট্রাস্ট এডিশন (Dark Theme & Footer)
            </h2>
          </div>

          <div className="bg-[#1f2733] text-white p-8 sm:p-12 rounded-3xl border border-[#303c4f] shadow-lg space-y-8">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">
                ডার্ক প্যালেট অপ্টিমাইজেশন
              </span>
              <h3 className="text-xl font-bold text-white">গভীর ব্যাকগ্রাউন্ডে শতভাগ উজ্জ্বলতা</h3>
              <p className="text-xs text-[#9aa4b2] max-w-2xl leading-relaxed">
                রাতের চোখের আরামদায়ক মোড (Eye-Care), ডার্ক ন্যাভবার ও ফুটারের জন্য আইভরি সাদা টাইপোগ্রাফি এবং ২৪ ক্যারেট খাঁটি গোল্ডেন বর্ডার ও অ্যাকসেন্ট সমন্বিত।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
              <div className="p-6 bg-[#171d26] border border-[#2d3748] rounded-2xl flex justify-center">
                <KhoborLogo variant="horizontal" size="lg" theme="dark" showTagline={true} />
              </div>
              <div className="p-6 bg-[#171d26] border border-[#2d3748] rounded-2xl flex justify-center">
                <KhoborLogo variant="masthead" size="md" theme="dark" showTagline={true} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <a
                href="/logo-white.svg"
                download="khoborakhobor-white.svg"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d4af37] text-[#1a1712] text-xs font-bold hover:bg-[#e4be42] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>লোগো (ডার্ক ভার্সন) ডাউনলোড</span>
              </a>
            </div>
          </div>
        </section>

        {/* 4. ANATOMY & SYMBOLISM */}
        <section className="space-y-6">
          <div className="border-b border-[#e2ddd3] pb-3">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#17191d]">
              ৪. লোগো অ্যানাটমি ও প্রতীকী তাৎপর্য (Symbolism & Anatomy)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#ded8cb] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5ebeb] text-[#842323] flex items-center justify-center font-bold font-serif text-lg">
                খ
              </div>
              <h3 className="text-sm font-bold text-[#14171d]">খাঁটি বাংলা বর্ণ 'খ'</h3>
              <p className="text-xs text-[#5f6775] leading-relaxed">
                খবরাখবর-এর আদ্যক্ষর। কুঁড়ি, অর্ধমাত্রা ও স্তম্ভের নিখুঁত ক্যালিগ্রাফিক অনুপাত।
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#ded8cb] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#14171d]">সংবাদপত্রের উন্মুক্ত পাতা</h3>
              <p className="text-xs text-[#5f6775] leading-relaxed">
                ব্রডশিট সংবাদপত্রের ভাজ করা কলাম ও গতিশীল তথ্য প্রবাহের স্মারক।
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#ded8cb] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                ✦
              </div>
              <h3 className="text-sm font-bold text-[#14171d]">সোনার নিব (কলম)</h3>
              <p className="text-xs text-[#5f6775] leading-relaxed">
                অ্যাকাডেমিক বিশ্লেষণ, বিসিএস ও উচ্চশিক্ষার লেখার মান ও গভীরতার প্রতীক।
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#ded8cb] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#14171d]">সত্যের আলোকবর্তিকা</h3>
              <p className="text-xs text-[#5f6775] leading-relaxed">
                নিরপেক্ষ সাংবাদিকতা ও দিকনির্দেশক ধ্রুবতারা (North Star of Knowledge)।
              </p>
            </div>
          </div>
        </section>

        {/* 5. BRAND COLOR PALETTE */}
        <section className="space-y-6">
          <div className="border-b border-[#e2ddd3] pb-3">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#17191d]">
              ৫. অফিসিয়াল ব্র্যান্ড কালার প্যালেট (Color Swatches)
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Crimson */}
            <div className="bg-white rounded-xl border border-[#ded8cb] overflow-hidden shadow-2xs">
              <div className="h-20 bg-[#842323]" />
              <div className="p-3.5 space-y-1">
                <span className="text-xs font-bold text-[#14171d] block">রয়্যাল ক্রিমসন (Heritage)</span>
                <span className="text-[11px] font-mono text-[#777e8b] block">HEX: #842323</span>
                <span className="text-[10px] text-[#939aa5] block">মূল ব্র্যান্ড ও সাংবাদিক মর্যাদা</span>
              </div>
            </div>

            {/* Antique Gold */}
            <div className="bg-white rounded-xl border border-[#ded8cb] overflow-hidden shadow-2xs">
              <div className="h-20 bg-[#c29547]" />
              <div className="p-3.5 space-y-1">
                <span className="text-xs font-bold text-[#14171d] block">সম্পাদকীয় সোনা (Gold)</span>
                <span className="text-[11px] font-mono text-[#777e8b] block">HEX: #C29547</span>
                <span className="text-[10px] text-[#939aa5] block">জ্ঞান ও উৎকর্ষের অ্যাকসেন্ট</span>
              </div>
            </div>

            {/* Obsidian Charcoal */}
            <div className="bg-white rounded-xl border border-[#ded8cb] overflow-hidden shadow-2xs">
              <div className="h-20 bg-[#17191d]" />
              <div className="p-3.5 space-y-1">
                <span className="text-xs font-bold text-[#14171d] block">মুদ্রণ কালি (Obsidian Ink)</span>
                <span className="text-[11px] font-mono text-[#777e8b] block">HEX: #17191D</span>
                <span className="text-[10px] text-[#939aa5] block">টাইটেল ও মূল টাইপোগ্রাফি</span>
              </div>
            </div>

            {/* Academic Blue */}
            <div className="bg-white rounded-xl border border-[#ded8cb] overflow-hidden shadow-2xs">
              <div className="h-20 bg-[#1e40af]" />
              <div className="p-3.5 space-y-1">
                <span className="text-xs font-bold text-[#14171d] block">অ্যাকাডেমিক নেভি (English)</span>
                <span className="text-[11px] font-mono text-[#777e8b] block">HEX: #1E40AF</span>
                <span className="text-[10px] text-[#939aa5] block">English Studies Track</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. USAGE IN CODE */}
        <section className="space-y-4">
          <div className="border-b border-[#e2ddd3] pb-3">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#17191d]">
              ৬. কোডে লোগো ব্যবহারের নিয়ম (Developer Reference)
            </h2>
          </div>

          <div className="bg-[#1e2430] rounded-2xl p-6 text-slate-200 text-xs font-mono space-y-3 overflow-x-auto border border-[#323d4f]">
            <p className="text-slate-400 font-sans">
              // React এ যেকোনো জায়গায় KhoborLogo ইমপোর্ট করে এক লাইনে ব্যবহার করুন:
            </p>
            <pre className="text-emerald-300">
{`import KhoborLogo from "@/components/KhoborLogo";

// ১. অনুভূমিক স্ট্যান্ডার্ড লোগো (Header/Navbar):
<KhoborLogo variant="horizontal" size="md" />

// ২. মোবাইল বারে কম্প্যাক্ট রূপ:
<KhoborLogo variant="compact" size="sm" showTagline={false} />

// ৩. ব্রডশিট মাস্টহেড (Centered Big Title):
<KhoborLogo variant="masthead" size="responsive" />

// ৪. ফুটার ও ডার্ক মোডে:
<KhoborLogo variant="horizontal" size="sm" theme="dark" />

// ৫. শুধুমাত্র প্রতীক সিল (Icon only):
<KhoborLogo variant="icon" size="lg" />`}
            </pre>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
