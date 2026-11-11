import type { MetadataRoute } from "next";

// Makes the site installable as an app (home-screen icon, full screen, no browser bar).
// The Android APK is a thin shell around this same manifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "খবরাখবর — KhoboraKhobor",
    short_name: "খবরাখবর",
    description: "চাকরি ও ভর্তি পরীক্ষার্থীদের জন্য প্রতিদিনের খবর, কুইজ ও নোট।",
    lang: "bn",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf9f5",
    theme_color: "#842323",
    categories: ["education", "news"],
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "৫ মিনিটের ক্যাপসুল", url: "/capsule?source=app" },
      { name: "সাপ্তাহিক পরীক্ষা", url: "/exam?source=app" },
      { name: "নোটবুক", url: "/saved?source=app" },
    ],
  };
}
