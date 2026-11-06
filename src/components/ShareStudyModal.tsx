"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, Copy, Check, Share2, MessageCircle, Send, 
  ExternalLink, Sparkles, BookOpen 
} from "lucide-react";

interface ShareStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    title: string;
    summary?: string;
    category?: { name: string };
    examTags?: string | null;
    keyTakeaways?: string[];
    slug: string;
  };
}

export default function ShareStudyModal({
  isOpen,
  onClose,
  article,
}: ShareStudyModalProps) {
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  // Generate public article URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://khoborakhobor.com";
  const articleUrl = `${baseUrl}/article/${article.slug}`;

  // Formatted Study Group Bulletin
  const examLabel = article.examTags || article.category?.name || "সাধারণ জ্ঞান ও সমসাময়িক বিষয়";
  
  const takeawaysList = article.keyTakeaways && article.keyTakeaways.length > 0
    ? article.keyTakeaways.map((point) => `• ${point}`).join("\n")
    : `• ${article.summary || article.title}`;

  const formattedBulletin = `[খবরাখবর স্টাডি বুলেটিন]\n` +
    `${article.title}\n` +
    `পরীক্ষার গুরুত্ব/ক্ষেত্র: ${examLabel}\n\n` +
    `মূল শিক্ষণীয় বিষয়বস্তু (Key Takeaways):\n` +
    `${takeawaysList}\n\n` +
    `সম্পূর্ণ প্রতিবেদন ও বিশ্লেষণ:\n` +
    `${articleUrl}`;

  const handleCopyNote = async () => {
    try {
      await navigator.clipboard.writeText(formattedBulletin);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedBulletin)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(
      `[খবরাখবর] ${article.title}\nপরীক্ষার গুরুত্ব: ${examLabel}\n\n${takeawaysList.substring(0, 300)}...`
    )}`;
    window.open(tgUrl, "_blank", "noopener,noreferrer");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white border border-[#ded8cb] rounded-xl shadow-2xl overflow-hidden text-[#1c1d21] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#ece7dc] bg-[#faf8f3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f5ebeb] text-[#842323] flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1c1d21]">স্টাডি গ্রুপ শেয়ারিং</h3>
              <p className="text-xs text-[#717887]">সহপাঠী বা স্টাডি গ্রুপের সাথে প্রস্তুত নোট শেয়ার করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1 rounded-md text-[#788191] hover:text-[#1c1d21] hover:bg-[#ede7da] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Pre-formatted Study Preview */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Quick Direct Social Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white font-medium text-xs shadow-xs transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপে শেয়ার</span>
            </button>
            <button
              onClick={handleShareTelegram}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#229ED9] hover:bg-[#1e8ec3] text-white font-medium text-xs shadow-xs transition"
            >
              <Send className="w-4 h-4" />
              <span>টেলিগ্রামে পাঠান</span>
            </button>
          </div>

          {/* Formatted Study Bulletin Card Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#68707f] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#c29547]" />
                <span>প্রস্তুত স্টাডি বুলেটিন প্রিভিউ:</span>
              </span>
              <button
                onClick={handleCopyNote}
                className="text-xs font-semibold text-[#842323] hover:underline flex items-center gap-1"
              >
                {copiedNote ? (
                  <>
                    <Check className="w-3 h-3 text-[#2e744a]" />
                    <span className="text-[#2e744a]">ক্লিপবোর্ডে কপি সম্পন্ন!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>সম্পূর্ণ নোট কপি করুন</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 bg-[#fbf9f5] border border-[#e5dfd4] rounded-lg text-xs font-mono leading-relaxed text-[#343a46] whitespace-pre-wrap select-all">
              {formattedBulletin}
            </div>
          </div>

          {/* Quick Link Only Row */}
          <div className="pt-2 border-t border-[#ece7dc] flex items-center justify-between gap-2">
            <div className="truncate text-xs text-[#717887] font-mono bg-[#f4f1ea] px-2.5 py-1.5 rounded flex-1">
              {articleUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="shrink-0 px-3 py-1.5 rounded bg-[#faf8f4] hover:bg-[#ede7da] border border-[#ded8cb] text-xs font-medium text-[#3b414d] flex items-center gap-1 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#2e744a]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "কপি হয়েছে" : "শুধু লিঙ্ক"}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#ece7dc] bg-[#faf8f3] flex items-center justify-between text-xs text-[#717887]">
          <span>নোট ও সারসংক্ষেপ সহপাঠীদের স্টাডি রিভিশনে সহায়ক</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#f0ebe0] hover:bg-[#e4ded2] text-[#1c1d21] font-medium transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

