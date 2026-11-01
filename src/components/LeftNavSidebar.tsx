"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, Zap, Bookmark, Layers, Award, UserCheck, 
  Shield, LogOut, Flame, Sparkles, ShieldCheck, Compass 
} from "lucide-react";
import { logoutAction, UserSession } from "@/actions/auth";

interface LeftNavSidebarProps {
  session: UserSession;
}

export default function LeftNavSidebar({ session }: LeftNavSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  const NAV_ITEMS = [
    { label: "হোম ফিড", href: "/", icon: Home },
    { label: "৫-মিনিট ক্যাপসুল", href: "/capsule", icon: Zap, badge: "দ্রুত" },
    { label: "স্টাডি নোটবুক", href: "/saved", icon: Bookmark },
    { label: "ভোকাবুলারি ডেক", href: "/saved?tab=flashcards", icon: Layers },
    { label: "কুইজ ও অ্যানালিটিক্স", href: "/saved?tab=analytics", icon: Award },
  ];

  return (
    <aside
      data-digital-signature="KK-SIDEBAR-AUTH-2026"
      className="w-64 shrink-0 hidden lg:flex flex-col justify-between sticky top-20 h-[calc(100vh-6rem)] py-2 select-none"
    >
      {/* Top Section: Navigation Links */}
      <div className="space-y-4">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#842323] text-white shadow-xs"
                    : "text-[#343a46] hover:bg-[#ece7dc] hover:text-[#17191d]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#717887]"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-[#f5ebeb] text-[#842323]"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin console link if authorized */}
          {session.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>অ্যাডমিন কমান্ড কনসোল</span>
            </Link>
          )}
        </nav>

        {/* Replay Onboarding Walkthrough Tour Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("khobor_restart_tour"));
              }
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#525a68] hover:bg-[#ece7dc] hover:text-[#17191d] transition border border-[#ded8cb] bg-white shadow-2xs group"
            title="প্ল্যাটফর্মের ফিচারগুলো পুনরায় পরিচিত হতে টিউটোরিয়াল দেখুন"
          >
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-[#842323] group-hover:rotate-45 transition-transform duration-300" />
              <span>টিউটোরিয়াল গাইড</span>
            </div>
            <span className="text-[10px] bg-[#f5ebeb] text-[#842323] px-1.5 py-0.5 rounded font-bold">
              পুনরায় দেখুন
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Section: Active Profile Card & Logout */}
      <div className="pt-3 border-t border-[#ded8cb]">
        {session.student ? (
          <div className="p-3 bg-white border border-[#ded8cb] rounded-xl shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#f5ebeb] text-[#842323] font-bold text-xs flex items-center justify-center border border-red-100">
                  {session.student.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-[#1c1d21] block truncate max-w-[120px]">
                    {session.student.name}
                  </span>
                  <span className="text-[10px] text-[#717887] block truncate max-w-[120px]">
                    {session.student.targetTrack === "BCS_GOVT"
                      ? "বিসিএস ক্যাডার"
                      : session.student.targetTrack === "ADMISSION"
                      ? "ভর্তি পরীক্ষা"
                      : "গবেষক ও পাঠক"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-[#842323] bg-[#fdf2f2] px-1.5 py-0.5 rounded">
                <Flame className="w-3 h-3 text-[#f97316]" />
                <span>{session.student.streakDays} দিন</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#f4efe4] text-[11px]">
              <Link
                href="/saved"
                className="text-[#842323] font-semibold hover:underline"
              >
                স্টাডি হাব
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="text-[#788191] hover:text-red-700 flex items-center gap-1 transition"
                title="লগআউট করুন"
              >
                <LogOut className="w-3 h-3" />
                <span>লগআউট</span>
              </button>
            </div>
          </div>
        ) : session.role === "admin" ? (
          <div className="p-3 bg-white border border-[#ded8cb] rounded-xl text-center space-y-2">
            <p className="text-xs text-[#525964]">আপনি অ্যাডমিন হিসেবে লগইন করেছেন</p>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition"
            >
              অ্যাডমিন লগআউট
            </button>
          </div>
        ) : (
          <div className="p-3.5 bg-white border border-[#ded8cb] rounded-xl shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1c1d21]">
              <UserCheck className="w-4 h-4 text-[#842323]" />
              <span>শিক্ষার্থী প্রোফাইল</span>
            </div>
            <p className="text-[11px] text-[#646c7a] leading-relaxed">
              নোটবুক, বুকমার্ক ও দৈনিক স্ট্রিক ট্র্যাক করতে অ্যাকাউন্টে যুক্ত হোন।
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Link
                href="/login"
                className="flex-1 py-1.5 bg-[#842323] hover:bg-[#6c1c1c] text-white text-xs font-bold rounded-lg text-center transition shadow-2xs"
              >
                লগইন
              </Link>
              <Link
                href="/login?tab=signup"
                className="flex-1 py-1.5 bg-[#fbf9f5] hover:bg-[#ede7da] text-[#1c1d21] border border-[#ded8cb] text-xs font-bold rounded-lg text-center transition shadow-2xs"
              >
                নিবন্ধন
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

