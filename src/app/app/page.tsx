import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import AppDownloadView from "@/components/AppDownloadView";
import { getCurrentSession } from "@/actions/auth";
import { apkInfo } from "@/lib/app-download";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "খবরাখবর মোবাইল অ্যাপ | ডাউনলোড",
  description: "খবরাখবর অ্যাপ নামান: প্রতিদিনের রিমাইন্ডার, অফলাইনে পড়া ও দৈনিক লক্ষ্যের রিং — সম্পূর্ণ ফ্রি।",
};

// Download page for the app: APK for Android (when one has been built), one-tap install
// for browsers that offer it, and "Add to Home Screen" steps for iPhone.
export default async function AppPage() {
  const session = await getCurrentSession();
  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans pb-16 md:pb-0">
      <Header session={session} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AppDownloadView apk={apkInfo()} />
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
