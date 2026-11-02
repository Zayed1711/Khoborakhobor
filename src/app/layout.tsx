import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import PomodoroWidget from "@/components/PomodoroWidget";
import GamifiedOnboardingTour from "@/components/GamifiedOnboardingTour";

export const metadata: Metadata = {
  title: "খবরাখবর | KhoboraKhobor - বস্তুনিষ্ঠ সংবাদ ও বিশ্লেষণ",
  description: "শিক্ষার্থী ও চিন্তাশীল পাঠকদের জন্য পরিচ্ছন্ন ও মননশীল ডিজিটাল পত্রিকা।",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo-icon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "খবরাখবর | KhoboraKhobor",
    description: "সত্য, বিশ্লেষণ ও শিক্ষণীয় তথ্যের আধার — শিক্ষার্থী ও গবেষক কেন্দ্রিক ডিজিটাল পত্রিকা।",
    siteName: "খবরাখবর (KhoboraKhobor)",
    images: [
      {
        url: "/logo.svg",
        width: 480,
        height: 96,
        alt: "খবরাখবর (KhoboraKhobor)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="h-full antialiased" suppressHydrationWarning>
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
      <body className="min-h-full flex flex-col bg-[#f9f8f5] text-[#1f2328] relative">
        <LanguageProvider>
          {children}
          <PomodoroWidget />
          <GamifiedOnboardingTour />
        </LanguageProvider>
      </body>
    </html>
  );
}
