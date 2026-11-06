/* eslint-disable @next/next/no-img-element */
import { STUDY_PARTNER } from "@/lib/links";

/**
 * Our study partner, The English Care: the logo links to their Facebook page.
 *   panel  - left sidebar card (desktop)
 *   menu   - row in the phone menu
 *   footer - one line in the footer
 */
export default function StudyPartner({ variant = "panel", english = false }: { variant?: "panel" | "menu" | "footer"; english?: boolean }) {
  const label = english ? "Study Partner" : "স্টাডি পার্টনার";
  const common = { href: STUDY_PARTNER.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `${label}: ${STUDY_PARTNER.name} (Facebook)` };

  if (variant === "footer") {
    return (
      <a {...common} className="inline-flex items-center gap-3 rounded-full border border-[#3b4352] bg-[#1e232c] pl-1.5 pr-4 py-1.5 text-sm text-[#cbd3de] hover:border-[#f5c66b] hover:text-white transition">
        <img src={STUDY_PARTNER.logo} alt="" width={40} height={40} className="w-10 h-10 rounded-full bg-white shrink-0" />
        <span className="leading-tight">
          <span className="block text-[11px] uppercase tracking-wider text-[#9aa4b2]">{label}</span>
          <strong className="block text-white">{STUDY_PARTNER.name}</strong>
        </span>
      </a>
    );
  }

  if (variant === "menu") {
    return (
      <a {...common} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-[#ded8cb] hover:bg-[#ede7da]">
        <img src={STUDY_PARTNER.logo} alt={STUDY_PARTNER.name} width={44} height={44} className="w-11 h-11 rounded-full" />
        <span className="leading-tight">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-[#842323]">{label}</span>
          <span className="block text-sm font-semibold text-[#17191d]">{STUDY_PARTNER.name}</span>
        </span>
      </a>
    );
  }

  return (
    <a {...common} className="group flex items-center gap-3 rounded-xl border border-[#ded8cb] bg-white p-2.5 shadow-2xs hover:border-[#1e3a8a] transition">
      <img
        src={STUDY_PARTNER.logo}
        alt={STUDY_PARTNER.name}
        width={64}
        height={64}
        className="w-16 h-16 rounded-full shrink-0 group-hover:scale-[1.04] transition-transform"
      />
      <span className="min-w-0 leading-tight">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-[#842323]">{label}</span>
        <span className="block mt-0.5 text-sm font-semibold text-[#17191d]">{STUDY_PARTNER.name}</span>
        <span className="block mt-0.5 text-[11px] text-[#68707f]">{english ? "Facebook page →" : "ফেসবুক পেজ →"}</span>
      </span>
    </a>
  );
}
