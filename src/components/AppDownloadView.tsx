"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Download, Bell, WifiOff, Flame, Check, Share, PlusSquare, ShieldCheck, MoreVertical, Smartphone } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { isInstalledApp } from "@/lib/pwa-client";
import { canPromptInstall, promptInstall } from "@/components/PwaRegister";
import type { ApkInfo } from "@/lib/app-download";

type Platform = "android" | "ios" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  // iPads report themselves as Macs but have a touch screen
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

function Steps({ items, en }: { items: { icon: React.ReactNode; text: string }[]; en: boolean }) {
  return (
    <ol className="mt-3 space-y-2.5">
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#842323] text-xs font-bold text-white">{en ? i + 1 : "১২৩৪৫"[i]}</span>
          <span className="flex-1 pt-0.5 text-sm leading-relaxed text-[#2a2e35]">{s.text}</span>
          <span className="shrink-0 pt-0.5 text-[#8a8f99]">{s.icon}</span>
        </li>
      ))}
    </ol>
  );
}

export default function AppDownloadView({ apk }: { apk: ApkInfo | null }) {
  const { isEnglishMode: en } = useAppMode();
  // Until the page has loaded in the browser we do not know the device: show all guides
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const sync = () => {
      setPlatform(detectPlatform());
      setInstalled(isInstalledApp());
      setInstallable(canPromptInstall());
    };
    const t = setTimeout(sync, 0);
    window.addEventListener("kk-installable", sync);
    return () => {
      clearTimeout(t);
      window.removeEventListener("kk-installable", sync);
    };
  }, []);

  const install = async () => {
    if (await promptInstall()) setInstalled(true);
    setInstallable(canPromptInstall());
  };

  const card = "rounded-2xl border border-[#e5e0d6] bg-white p-4 sm:p-5";
  const h2 = "text-base font-bold text-[#17191d]";
  const showAndroid = platform === null || platform === "android" || platform === "desktop";
  const showIos = platform === null || platform === "ios";
  const icon = "w-4.5 h-4.5";

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="text-center">
        <Image src="/icon-512.png" alt="" width={84} height={84} className="mx-auto rounded-[22px] shadow-md border border-[#e5e0d6]" priority />
        <h1 className="mt-3 text-2xl font-black text-[#17191d]">{en ? "KhoboraKhobor app" : "খবরাখবর মোবাইল অ্যাপ"}</h1>
        <p className="mt-1 text-sm text-[#5b616d]">{en ? "Free. Light. No Play Store needed." : "সম্পূর্ণ ফ্রি, হালকা — প্লে স্টোর লাগবে না।"}</p>
      </section>

      {installed ? (
        <section className={`${card} flex items-center gap-3 border-emerald-200 bg-emerald-50`}>
          <Check className="w-6 h-6 text-emerald-700 shrink-0" strokeWidth={3} />
          <p className="text-sm font-semibold text-emerald-900">
            {en ? "The app is already installed on this device. You are using it now." : "এই ডিভাইসে অ্যাপ ইনস্টল করা আছে — আপনি এখন অ্যাপেই আছেন।"}
          </p>
        </section>
      ) : (
        <>
          {/* Main buttons */}
          {(apk || installable) && platform !== "ios" && (
            <section className={`${card} space-y-2.5`}>
              {apk && (
                <a
                  href={apk.url}
                  download="khoborakhobor.apk"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#842323] px-4 py-3.5 text-base font-bold text-white active:bg-[#6e1c1c]"
                >
                  <Download className="w-5 h-5" />
                  {en ? `Download APK (${apk.sizeMb} MB)` : `APK ডাউনলোড করুন (${apk.sizeMb} MB)`}
                </a>
              )}
              {installable && (
                <button
                  type="button"
                  onClick={install}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-bold ${
                    apk ? "border border-[#842323] text-[#842323] bg-white" : "bg-[#842323] text-white"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  {en ? "Install in one tap" : "এক ট্যাপে ইনস্টল করুন"}
                </button>
              )}
              {apk && installable && (
                <p className="text-center text-xs text-[#717887]">
                  {en ? "Both give you the same app. One tap is the easier way." : "দুটোই একই অ্যাপ। এক ট্যাপে ইনস্টল করা সবচেয়ে সহজ।"}
                </p>
              )}
            </section>
          )}

          {/* Android: APK steps */}
          {showAndroid && apk && (
            <section className={card}>
              <h2 className={h2}>{en ? "Android: install the APK" : "অ্যান্ড্রয়েড: APK ইনস্টল করার নিয়ম"}</h2>
              <Steps
                en={en}
                items={[
                  { icon: <Download className={icon} />, text: en ? "Tap “Download APK”, then open the downloaded file." : "“APK ডাউনলোড করুন” চাপুন, ডাউনলোড শেষে ফাইলটি খুলুন।" },
                  {
                    icon: <ShieldCheck className={icon} />,
                    text: en
                      ? "Android will ask about apps from this source. Tap Settings and turn on “Allow from this source”."
                      : "ফোন “এই উৎস থেকে অ্যাপ” নিয়ে জিজ্ঞেস করবে। Settings-এ গিয়ে “Allow from this source” চালু করুন।",
                  },
                  { icon: <Check className={icon} />, text: en ? "Go back and tap Install. Done!" : "ফিরে এসে Install চাপুন। ব্যস, হয়ে গেল!" },
                ]}
              />
              <p className="mt-3 rounded-lg bg-[#faf8f4] border border-[#ece7dc] px-3 py-2 text-xs leading-relaxed text-[#5b616d]">
                {en
                  ? "The warning appears because the app comes from our own website, not the Play Store. The app asks for no special permissions."
                  : "অ্যাপটি প্লে স্টোর নয়, আমাদের নিজস্ব ওয়েবসাইট থেকে আসে বলে ফোন সতর্ক করে। অ্যাপটি কোনো বাড়তি অনুমতি চায় না।"}
              </p>
            </section>
          )}

          {/* Android: no APK and no install offer -> menu steps */}
          {showAndroid && !installable && (
            <section className={card}>
              <h2 className={h2}>{apk ? (en ? "Or add it from the browser" : "অথবা ব্রাউজার থেকে যোগ করুন") : en ? "Android: add to Home screen" : "অ্যান্ড্রয়েড: হোম স্ক্রিনে যোগ করুন"}</h2>
              <Steps
                en={en}
                items={[
                  { icon: <MoreVertical className={icon} />, text: en ? "Open this page in Chrome and tap the ⋮ menu (top right)." : "এই পাতাটি Chrome-এ খুলে ওপরে ডানের ⋮ মেনু চাপুন।" },
                  { icon: <PlusSquare className={icon} />, text: en ? "Tap “Add to Home screen” or “Install app”." : "“Add to Home screen” বা “Install app” চাপুন।" },
                  { icon: <Check className={icon} />, text: en ? "Tap Install. The app icon appears on your phone." : "Install চাপুন। ফোনে অ্যাপের আইকন চলে আসবে।" },
                ]}
              />
            </section>
          )}

          {/* iPhone */}
          {showIos && (
            <section className={card}>
              <h2 className={h2}>{en ? "iPhone: add to Home Screen" : "আইফোন: হোম স্ক্রিনে যোগ করুন"}</h2>
              <Steps
                en={en}
                items={[
                  { icon: <Share className={icon} />, text: en ? "Open this page in Safari and tap the Share button." : "এই পাতাটি Safari-তে খুলে Share বাটন চাপুন।" },
                  { icon: <PlusSquare className={icon} />, text: en ? "Scroll down and tap “Add to Home Screen”." : "নিচে স্ক্রল করে “Add to Home Screen” চাপুন।" },
                  { icon: <Bell className={icon} />, text: en ? "Open the app from the Home Screen, then turn on reminders in “Me”." : "হোম স্ক্রিন থেকে অ্যাপ খুলুন, তারপর “আমি” পাতা থেকে রিমাইন্ডার চালু করুন।" },
                ]}
              />
            </section>
          )}

          {platform === "desktop" && (
            <p className="text-center text-sm text-[#5b616d]">
              {en ? "On your phone, open " : "ফোনে খুলুন: "}
              <span className="font-bold text-[#17191d]">kkhobor.com/app</span>
            </p>
          )}
        </>
      )}

      {/* Why */}
      <section className={card}>
        <h2 className={h2}>{en ? "Why use the app?" : "অ্যাপে কী সুবিধা?"}</h2>
        <ul className="mt-3 space-y-3">
          {[
            [Flame, "প্রতিদিনের লক্ষ্যের রিং", "স্ট্রিক, XP ও ব্যাজ — পড়াশোনা হোক খেলার মতো।", "Daily goal ring", "Streak, XP and badges make study feel like a game."],
            [Bell, "স্মার্ট রিমাইন্ডার", "আপনার পছন্দের সময়ে, দিনে সর্বোচ্চ ২টি।", "Smart reminders", "At the time you choose, at most 2 a day."],
            [WifiOff, "অফলাইনে পড়ুন", "একবার খোলা খবর ইন্টারনেট ছাড়াও খুলবে।", "Read offline", "Stories you opened still open without internet."],
          ].map(([Icon, tBn, dBn, tEn, dEn]) => {
            const I = Icon as typeof Flame;
            return (
              <li key={tEn as string} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5ebeb] text-[#842323]">
                  <I className="w-4.5 h-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#17191d]">{(en ? tEn : tBn) as string}</span>
                  <span className="block text-sm text-[#5b616d]">{(en ? dEn : dBn) as string}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
