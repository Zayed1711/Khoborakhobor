"use client";

import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { isEarlyBirdWindow, trialDaysLeft } from "@/lib/early-bird";
import { getCurrentSession } from "@/actions/auth";

const bn = (n: number) => n.toLocaleString("bn-BD");
/** ?earlybird=preview shows the notice before 28 November, for checking it */
const preview = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("earlybird") === "preview";

/** Decided in the browser after loading, so the page never shows a stale date from a cached copy. */
function useEarlyBird() {
  const [state, setState] = useState<{ show: boolean; days: number }>({ show: false, days: 0 });
  useEffect(() => {
    const now = Date.now();
    const show = isEarlyBirdWindow(now) || preview();
    setState({ show, days: Math.max(1, trialDaysLeft(now) || 5) }); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  return state;
}

/** Banner on the homepage and the notebook, 28 Nov – 2 Dec. */
export function EarlyBirdBanner({ className = "" }: { className?: string }) {
  const { show, days } = useEarlyBird();
  if (!show) return null;
  return (
    <div className={`no-print rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 flex items-start gap-3 ${className}`} role="status">
      <Gift className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
      <div className="text-sm leading-relaxed text-[#3b2a10]">
        <p className="font-bold">আর্লি-বার্ড অফার: প্রো সাবস্ক্রিপশনে ৫০% ছাড়</p>
        <p>
          ২ ডিসেম্বর পর্যন্ত সব ফিচার ফ্রি — আর বাকি <strong>{bn(days)} দিন</strong>। পড়া, অভিধান ও দৈনিক মূল নোট সবসময় ফ্রি থাকবে।
        </p>
      </div>
    </div>
  );
}

/** Shown once per student after logging in, 28 Nov – 2 Dec. */
export function EarlyBirdPopup() {
  const { show, days } = useEarlyBird();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");

  useEffect(() => {
    if (!show) return;
    let live = true;
    getCurrentSession()
      .then((s) => {
        const id = s?.student?.id;
        if (!live || !id) return;
        const k = `khobor_earlybird_seen_${id}`;
        let seen = false;
        try {
          seen = localStorage.getItem(k) === "1";
        } catch {
          seen = false;
        }
        if (!seen || preview()) {
          setKey(k);
          setOpen(true);
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [show]);

  if (!open) return null;
  const close = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      // private browsing: it may show again next time, which is harmless
    }
    setOpen(false);
  };

  return (
    <div className="no-print fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="আর্লি-বার্ড অফার" onClick={close}>
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={close} className="absolute top-3 right-3 p-1 text-[#68707f] hover:text-black" aria-label="বন্ধ করুন">
          <X className="w-5 h-5" />
        </button>
        <Gift className="w-9 h-9 text-amber-600" />
        <h2 className="text-xl font-bold text-[#17191d]">আর্লি-বার্ড অফার: ৫০% ছাড়</h2>
        <p className="text-sm leading-relaxed text-[#404652]">
          ২ ডিসেম্বর পর্যন্ত খবরাখবরের সব ফিচার ফ্রি — আর বাকি <strong>{bn(days)} দিন</strong>। এরপর প্রো সাবস্ক্রিপশনে আর্লি-বার্ড সদস্যরা পাবেন ৫০% ছাড়।
        </p>
        <p className="text-sm leading-relaxed text-[#404652]">পড়া, অভিধান ও দৈনিক মূল নোট সবসময় ফ্রি থাকবে।</p>
        <button type="button" onClick={close} className="w-full py-2.5 rounded-lg bg-[#842323] text-white font-semibold">
          ঠিক আছে
        </button>
      </div>
    </div>
  );
}
