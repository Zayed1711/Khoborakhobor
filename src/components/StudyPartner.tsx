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
      <a {...common} className="inline-flex items-center gap-2 text-xs text-[#9aa4b2] hover:text-white transition">
        <img src={STUDY_PARTNER.logo} alt="" width={28} height={28} className="w-7 h-7 rounded-full bg-white" />
        <span>
          {label}: <strong className="text-[#d0d7e0]">{STUDY_PARTNER.name}</strong>
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
    <a {...common} className="group block rounded-xl border border-[#ded8cb] bg-white p-3 text-center shadow-2xs hover:border-[#1e3a8a] transition">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-[#842323] mb-2">{label}</span>
      <img
        src={STUDY_PARTNER.logo}
        alt={STUDY_PARTNER.name}
        width={128}
        height={128}
        className="w-32 h-32 mx-auto rounded-full group-hover:scale-[1.03] transition-transform"
      />
      <span className="block mt-2 text-xs font-semibold text-[#17191d]">{STUDY_PARTNER.name}</span>
      <span className="block text-[11px] text-[#68707f]">{english ? "Visit their Facebook page" : "ফেসবুক পেজ দেখুন"}</span>
    </a>
  );
}
