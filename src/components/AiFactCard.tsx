import type { FactCard } from "@/lib/study/ai-facts-view";
import { Users, Zap, CalendarDays, MapPin, Hash, GraduationCap } from "lucide-react";

const CATEGORY_BN: Record<string, string> = {
  "Bangladesh Affairs": "বাংলাদেশ বিষয়াবলি",
  "Politics & Governance": "রাজনীতি ও শাসনব্যবস্থা",
  "Economy & Finance": "অর্থনীতি ও অর্থায়ন",
  "International Affairs": "আন্তর্জাতিক বিষয়াবলি",
  "Science & Technology": "বিজ্ঞান ও প্রযুক্তি",
  "Environment & Climate": "পরিবেশ ও জলবায়ু",
  Health: "স্বাস্থ্য",
  Education: "শিক্ষা",
  "Law & Justice": "আইন ও বিচার",
  "Appointments & Awards": "নিয়োগ ও পুরস্কার",
  Sports: "খেলাধুলা",
  "Culture & Literature": "সংস্কৃতি ও সাহিত্য",
  "History & Heritage": "ইতিহাস ও ঐতিহ্য",
  Other: "অন্যান্য",
};

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bnNum = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

/** "At a glance" card: who, what, when, where and key figures, checked against the story. */
export default function AiFactCard({ card, english }: { card: FactCard; english: boolean }) {
  const L = english
    ? { title: "At a glance", hint: "Arranged with AI; every name, date and figure checked against the report", who: "Who", what: "What", when: "When", where: "Where", nums: "Key figures", imp: "Exam importance" }
    : { title: "এক নজরে", hint: "AI দিয়ে সাজানো; প্রতিটি নাম, তারিখ ও সংখ্যা প্রতিবেদনের সঙ্গে মিলিয়ে যাচাই করা", who: "কে/কারা", what: "কী ঘটেছে", when: "কবে", where: "কোথায়", nums: "গুরুত্বপূর্ণ সংখ্যা", imp: "পরীক্ষায় গুরুত্ব" };

  const rows: { icon: typeof Users; label: string; value: string }[] = [];
  if (card.what) rows.push({ icon: Zap, label: L.what, value: card.what });
  if (card.who.length) rows.push({ icon: Users, label: L.who, value: card.who.join(english ? ", " : ", ") });
  if (card.when) rows.push({ icon: CalendarDays, label: L.when, value: card.when });
  if (card.where) rows.push({ icon: MapPin, label: L.where, value: card.where });

  const category = card.gkCategory && card.gkCategory !== "Other" ? (english ? card.gkCategory : CATEGORY_BN[card.gkCategory] || card.gkCategory) : null;

  return (
    <section className="space-y-3" data-ai-fact-card>
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#17191d]">{L.title}</h2>
        <p className="text-sm text-[#68707f] mt-0.5">{L.hint}</p>
      </div>
      <div className="rounded-xl bg-white border border-[#ece6db] divide-y divide-[#f1ece2]">
        {(category || card.examScore) && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            {category && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5ebeb] text-[#842323] px-3 py-1 text-xs font-semibold">
                <GraduationCap className="w-3.5 h-3.5" />
                {category}
              </span>
            )}
            {card.examScore ? (
              <span className="inline-flex items-center rounded-full bg-[#f3f1ec] text-[#2c323f] px-3 py-1 text-xs font-semibold">
                {L.imp}: {english ? `${card.examScore}/10` : `${bnNum(card.examScore)}/১০`}
              </span>
            ) : null}
          </div>
        )}
        {rows.map((r) => (
          <div key={r.label} className="flex gap-3 px-4 py-3">
            <r.icon className="w-4 h-4 text-[#842323] shrink-0 mt-1" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#68707f]">{r.label}</p>
              <p className="text-[15px] leading-relaxed text-[#2c323f] break-words">{r.value}</p>
            </div>
          </div>
        ))}
        {card.numbers.length > 0 && (
          <div className="flex gap-3 px-4 py-3">
            <Hash className="w-4 h-4 text-[#842323] shrink-0 mt-1" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#68707f]">{L.nums}</p>
              <ul className="mt-1 grid gap-2 sm:grid-cols-2">
                {card.numbers.map((n, i) => (
                  <li key={i} className="rounded-lg bg-[#faf8f4] border border-[#f1ece2] px-3 py-2">
                    <p className="text-[15px] font-semibold text-[#17191d] break-words">{n.value}</p>
                    <p className="text-xs text-[#68707f] break-words">{n.label}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
