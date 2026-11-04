import Link from "next/link";
import { Bell } from "lucide-react";

export default function BreakingTicker({ text, link }: { text: string; link: string }) {
  return (
    <div className="bg-[#2a303c] text-[#e8ecf1] text-xs sm:text-sm py-2 px-4 border-b border-[#20252e]">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider bg-[#3c4454] px-2.5 py-0.5 rounded text-xs shrink-0 text-[#f5c66b]">
          <Bell className="w-3.5 h-3.5 text-[#f5c66b]" />
          জরুরি সংবাদ
        </span>
        <div className="truncate flex-1">
          <Link href={link} className="hover:text-white hover:underline font-normal text-[#dbe1ea]">
            {text}
          </Link>
        </div>
      </div>
    </div>
  );
}
