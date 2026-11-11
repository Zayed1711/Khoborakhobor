import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import PomodoroWidget from "@/components/PomodoroWidget";
import DictionaryHost from "@/components/DictionaryHost";
import StaleVersionReload from "@/components/StaleVersionReload";
import PwaRegister from "@/components/PwaRegister";
import TodayMissionSheet from "@/components/TodayMissionSheet";
import { EarlyBirdPopup } from "@/components/EarlyBird";
import AuthGateHost from "@/components/AuthGateHost";
import GamifiedOnboardingTour from "@/components/GamifiedOnboardingTour";

// Text and headlines use Nirmala UI, the Bengali font built into Windows (chosen by
// the team). Its licence does not allow hosting it, so devices without it (Android,
// iPhone, Mac) fall back to Noto Sans Bengali, self-hosted here by next/font; it is
// also Android's own Bengali font. See the font stacks in globals.css.
const bodyFont = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#842323",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kkhobor.com"),
  title: "খবরাখবর | KhoboraKhobor - বস্তুনিষ্ঠ সংবাদ ও বিশ্লেষণ",
  description: "শিক্ষার্থী ও চিন্তাশীল পাঠকদের জন্য পরিচ্ছন্ন ও মননশীল ডিজিটাল পত্রিকা।",
  icons: {
    icon: [
      // "?v=" makes browsers fetch a changed icon instead of keeping the old one;
      // raise it whenever the icon changes
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    ],
    // iPhones need a PNG for the home-screen icon (src/app/apple-icon.png)
    apple: "/apple-icon.png?v=2",
    shortcut: "/favicon.svg?v=2",
  },
  openGraph: {
    title: "খবরাখবর | KhoboraKhobor",
    description: "সত্য, বিশ্লেষণ ও শিক্ষণীয় তথ্যের আধার — শিক্ষার্থী ও গবেষক কেন্দ্রিক ডিজিটাল পত্রিকা।",
    siteName: "খবরাখবর (KhoboraKhobor)",
    images: [
      {
        // Facebook, WhatsApp and X show PNG/JPG share images, not SVG
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "খবরাখবর — KHOBORAKHOBOR DIGITAL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`h-full antialiased ${bodyFont.variable}`} suppressHydrationWarning>
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('khobor_theme');
              if(t==='sepia'){document.documentElement.setAttribute('data-theme',t);}
              var l=localStorage.getItem('khobor_lang');
              if(l){document.documentElement.setAttribute('lang',l);}
              var m=localStorage.getItem('khobor_mode');
              if(m){document.documentElement.setAttribute('data-mode',m);}
            }catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f9f8f5] text-[#1f2328] relative font-sans">
        <LanguageProvider>
          {children}
          <PomodoroWidget />
          <DictionaryHost />
          <StaleVersionReload />
          <PwaRegister />
          <TodayMissionSheet />
          <EarlyBirdPopup />
          <AuthGateHost />
          <GamifiedOnboardingTour />
        </LanguageProvider>
      </body>
    </html>
  );
}
