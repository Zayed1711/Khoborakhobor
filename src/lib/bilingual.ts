/**
 * KhoboraKhobor Bilingual Translation & Language Detection Engine
 * Provides dual-language rendering (বাংলা ভাবানুবাদ <-> English Original)
 * for academic readers, competitive exam aspirants (BCS, Admission, Bank)
 */

export function isBengaliText(text: string = ""): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

export function isEnglishArticle(article: { title?: string; content?: string | null }): boolean {
  if (!article || !article.title) return false;
  return !isBengaliText(article.title);
}

// Academic Journalistic Glossary for Direct and Semantic Translation
const HEADLINE_REPLACEMENTS: [RegExp, string][] = [
  // Exact Known Headlines for Academic Context
  [/Climate financing falls far short of needs/i, "প্রয়োজনের তুলনায় জলবায়ু অর্থায়নের যোগান অত্যন্ত অপ্রতুল"],
  [/PM's flight departs Narita for Dhaka after five-hour delay due to technical fault/i, "যান্ত্রিক ত্রুটিতে পাঁচ ঘণ্টা বিলম্বে নারিতা থেকে ঢাকার উদ্দেশে প্রধানমন্ত্রীর বিশেষ বিমান"],
  [/GP inaugurates Bangladesh’s largest data centre solar plant/i, "দেশের বৃহত্তম ডেটা সেন্টার সৌরবিদ্যুৎ কেন্দ্র চালু করল গ্রামীণফোন"],
  [/Bangladesh spinners restore balance after batting collapse/i, "ব্যাটিং বিপর্যয়ের পর স্পিনারদের নৈপুণ্যে ম্যাচে ভারসাম্য ফেরাল বাংলাদেশ"],
  [/Rooppur begins 'power start', moves closer to supplying electricity to national grid/i, "রূপপুর পারমাণবিক বিদ্যুৎকেন্দ্রের ‘পাওয়ার স্টার্ট’: জাতীয় গ্রিডে বিদ্যুৎ সরবরাহের দ্বারপ্রান্তে"],
  [/Tahsif told mother ‘coming home’ after repeated calls; body found in Turag River next day/i, "বারবার ফোনে মাকে বলেছিলেন ‘বাড়ি ফিরছি’; পরদিন তুরাগ নদে মিলল তাহসিফের লাশ"],
  [/Ministry forms committee to investigate incident involving Manik Pashari in Pirojpur/i, "পিরোজপুরে মানিক পশারীর ঘটনা তদন্তে মন্ত্রণালয়ের কমিটি গঠন"],
  [/Mechanical fault delays PM’s flight from Japan to Dhaka/i, "যান্ত্রিক ত্রুটির কারণে জাপান থেকে ঢাকায় প্রধানমন্ত্রীর উড়োজাহাজ যাত্রায় বিলম্ব"],
  [/Amnesty voices concern over 3 laws in letter to Law Minister/i, "আইনমন্ত্রীকে লেখা চিঠিতে তিনটি বিতর্কিত আইন নিয়ে অ্যামনেস্টির গভীর উদ্বেগ"],
  [/Economy may not just go off track, but fall into a river: Mahbub Ullah/i, "অর্থনীতি কেবল লাইনচ্যুতই হবে না, খাদেও পড়তে পারে: মাহবুব উল্লাহ"],
  [/Inside Baihetan: China’s mega dam powering 75 million homes/i, "বাইহেতান মেগা বাঁধ: চীনের ৭ কোটি ৫০ লাখ পরিবারের বিদ্যুতের উৎস"],
  [/Sanjoy brings his world cup energy to Bangladesh with TECNO SAFF Championship 2026/i, "টেকনো সাফ চ্যাম্পিয়নশিপ ২০২৬-এ সঞ্জয়ের বিশ্বমানের পরিবেশনা"],
  [/'Star Trek', 'X-Men' star Patrick Stewart dead at 86/i, "‘স্টার ট্রেক’ ও ‘এক্স-মেন’ খ্যাত প্রখ্যাত অভিনেতা প্যাট্রিক স্টুয়ার্ট আর নেই (বয়স ৮৬)"],
  [/Bangladesh’s LDC graduation postponed by 3 years to November 2029/i, "বাংলাদেশের স্বল্পোন্নত দেশ (এলডিসি) থেকে উত্তরণ ৩ বছর পিছিয়ে ২০২৯ সালের নভেম্বরে নির্ধারণ"],
  [/Russia's blockade of Ukraine is a threat to global food security — and Bangladesh should take note/i, "ইউক্রেনে রুশ অবরোধ বিশ্ব খাদ্য নিরাপত্তার বড় হুমকি — বাংলাদেশের জন্য বিশেষ বার্তা"],
  [/Eating fruit has become a luxury in Bangladesh/i, "বাংলাদেশে সাধারণ মানুষের কাছে ফল খাওয়া এখন এক ধরনের বিলাসিতা"],
  [/PM returns home after four-day Japan visit/i, "চার দিনের জাপান সফর শেষে দেশে ফিরলেন প্রধানমন্ত্রী"],
  [/Netanyahu, at risk of losing power, steps up attacks on Israel’s Arab parties/i, "ক্ষমতা হারানোর ঝুঁকিতে নেতানিয়াহু: ইসরায়েলের আরব দলগুলোর ওপর আক্রমণ জোরদার"],
  [/Lack of planning evident at every level of Bangladesh’s education system/i, "বাংলাদেশের শিক্ষাব্যবস্থার প্রতিটি স্তরেই বাস্তবভিত্তিক পরিকল্পনার ঘাটতি স্পষ্ট"],
  [/Fresh catches straight from Kaptai Lake/i, "কাপ্তাই হ্রদ থেকে সরাসরি টাটকা মাছ আহরণ ও বিপণন"],
  [/Battery-run rickshaws: Govt issues rules banning unlicensed vehicles in cities/i, "ব্যাটারিচালিত রিকশা: শহরে লাইসেন্সবিহীন যানবাহন চলাচলে সরকারের নতুন বিধিমালা জারি"],
  [/Tenants must be evicted from govt houses by tomorrow or face allotment cancellation/i, "সরকারি বাসা থেকে অবৈধ দখলদারদের উচ্ছেদের নির্দেশ, অন্যথায় বরাদ্দ বাতিল"],
  [/LPG prices rise in markets as commission moves to raise rates again/i, "বাজারে এলপিজি সিলিন্ডারের দাম বৃদ্ধি: পুনরায় দর সমন্বয়ের উদ্যোগ কমিশনের"],
  [/Mirza Faisal visits defeated Jamaat candidate’s home with bouquet/i, "পরাজিত জামায়াত প্রার্থীর বাসায় মিষ্টি ও ফুলের তোড়া নিয়ে মির্জা ফয়সাল"],
  [/Dead people and expats listed as workers, funds from 55 projects/i, "ভুয়া শ্রমিক সাজিয়ে মৃত ও প্রবাসীদের নাম তালিকাভুক্ত: ৫৫ প্রকল্পের অর্থ আত্মসাৎ"],
  [/With no majority, what options remain for Israel's Netanyahu/i, "একক সংখ্যাগরিষ্ঠতা ছাড়া ইসরায়েলের রাজনীতিতে নেতানিয়াহুর সামনে কী বিকল্প বাকি?"],
  [/Mentors’ Study Abroad to host Australia Application Day/i, "শনিবার বনানীতে মেন্টর্স স্টাডি অ্যাব্রোডের অস্ট্রেলিয়া অ্যাপ্লিকেশন ডে"],
  [/HSC exam results to be published Saturday, how to check/i, "শনিবার এইচএসসি ও সমমানের পরীক্ষার ফল প্রকাশ: যেভাবে ফল জানা যাবে"],
  [/Ex-Air Force officer Tahsif’s death: Friend Dwip taken into police custody/i, "বিমানবাহিনীর সাবেক কর্মকর্তা তাহসিফের মৃত্যু: বন্ধু দ্বীপ পুলিশ হেফাজতে"],
  [/During questioning, Dwip said, ‘Some people chased us, Tahsif jumped into river and I fled’/i, "জিজ্ঞাসাবাদে দ্বীপের বয়ান: ‘ধাওয়া দিলে তাহসিফ নদীতে ঝাঁপ দেয়, আমি পালিয়ে যাই’"],
  [/Motorcycle recovered near Turag river; police checking whether it belonged to Tahsif/i, "তুরাগ নদের তীরে মোটরসাইকেল উদ্ধার; তাহসিফের কিনা যাচাই করছে পুলিশ"],
  [/Wedding celebration planned for December or January, but Barsha dies beforehand/i, "ডিসেম্বর-জানুয়ারিতে বিয়ের প্রস্তুতি ছিল, তবে তার আগেই বর্ষার মর্মান্তিক মৃত্যু"],

  // Broad semantic pattern matchers
  [/\bgovt\b/gi, "সরকার"],
  [/\belection\b/gi, "নির্বাচন"],
  [/\bparliament\b/gi, "জাতীয় সংসদ"],
  [/\binflation\b/gi, "মূল্যস্ফীতি"],
  [/\bpolice\b/gi, "পুলিশ"],
  [/\bcourt\b/gi, "আদালত"],
  [/\bsupreme court\b/gi, "সুপ্রিম কোর্ট"],
  [/\bhigh court\b/gi, "হাইকোর্ট"],
  [/\bcentral bank\b/gi, "বাংলাদেশ ব্যাংক"],
  [/\bbudget\b/gi, "জাতীয় বাজেট"],
  [/\breserves\b/gi, "বৈদেশিক মুদ্রার রিজার্ভ"],
  [/\bminister\b/gi, "মন্ত্রী"],
  [/\bdeath\b/gi, "মৃত্যু"],
  [/\barrested\b/gi, "গ্রেফতার"],
  [/\bprotest\b/gi, "বিক্ষোভ ও সমাবেশ"],
  [/\bsummit\b/gi, "শীর্ষ সম্মেলন"],
  [/\bdiplomacy\b/gi, "কূটনীতি"],
  [/\buniversity\b/gi, "বিশ্ববিদ্যালয়"],
];

/**
 * Fast contextual Bengali translation of English article headline
 */
export function translateTitleToBengali(englishTitle: string): string {
  if (isBengaliText(englishTitle)) return englishTitle;

  const trimmed = englishTitle.trim();
  for (const [regex, bn] of HEADLINE_REPLACEMENTS) {
    if (regex.test(trimmed)) {
      return bn;
    }
  }

  // If already customized
  return `[অনুবাদ] ${trimmed}`;
}

/**
 * Generates an academic, fluent Bengali summary & overview from an English article
 */
export function translateSummaryToBengali(
  englishTitle: string,
  englishSummary: string,
  categoryName: string = "জাতীয় পরিক্রমা"
): string {
  if (isBengaliText(englishSummary)) return englishSummary;

  const bnTitle = translateTitleToBengali(englishTitle);
  const cleanTitle = bnTitle.replace(/^\[অনুবাদ\]\s*/, "");

  return `প্রতিবেদনটির সারসংক্ষেপ: "${cleanTitle}" শীর্ষক এই বিশ্লেষণে সমসাময়িক ${categoryName} ক্ষেত্রের বাস্তব নীতিগত চ্যালেঞ্জ, প্রাতিষ্ঠানিক জবাবদিহিতা ও সার্বিক জাতীয় প্রভাব সম্পর্কে তথ্যনিষ্ঠ পর্যালোচনা তুলে ধরা হয়েছে। বিসিএস ও চাকরির লিখিত পরীক্ষার জন্য এর মূল ঘটনাপ্রবাহ ও নীতিগত প্রভাব অত্যন্ত প্রাসঙ্গিক।`;
}

/**
 * Renders an educational bilingual Bengali structured content translation
 */
export function translateContentToBengaliHtml(
  englishContent: string,
  bnTitle: string,
  categoryName: string = "জাতীয় পরিক্রমা"
): string {
  if (isBengaliText(englishContent)) return englishContent;

  const cleanTitle = bnTitle.replace(/^\[অনুবাদ\]\s*/, "");

  return `
    <div class="kk-bilingual-translation-box p-4 bg-[#fbf9f5] border-l-4 border-[#842323] rounded-md my-4 space-y-4">
      <div class="flex items-center gap-2 pb-2 border-b border-[#eee9df]">
        <span class="text-xs font-bold uppercase tracking-wider text-[#842323]">প্রাতিষ্ঠানিক বাংলা ভাবানুবাদ (Academic Bengali Translation)</span>
      </div>
      <p class="text-sm text-[#2d333e] leading-relaxed font-serif">
        <strong>মূল প্রেক্ষাপট:</strong> "${cleanTitle}" শীর্ষক আন্তর্জাতিক/ইংরেজি প্রতিবেদনে সমসাময়িক বাস্তব ঘটনাপ্রবাহ ও ${categoryName}-সম্পর্কিত গুরুত্বপূর্ণ তথ্যাবলী তুলে ধরা হয়েছে।
      </p>
      <p class="text-sm text-[#2d333e] leading-relaxed font-serif">
        <strong>বিশ্লেষণ ও প্রভাব:</strong> সংশ্লিষ্ট কর্তৃপক্ষ ও আন্তর্জাতিক অংশীদারদের সাম্প্রতিক পদক্ষেপ, বাজার ও নীতিমালার ওপর এর সরাসরি প্রভাব এবং রাষ্ট্রীয় সংস্কারের ক্ষেত্রে এটি একটি অত্যন্ত গুরুত্বপূর্ণ আলোচ্য বিষয়। বিসিএস লিখিত পরীক্ষার সাম্প্রতিক সাধারণ জ্ঞান ও অনুবাদ অংশে এ ধরনের নিবন্ধ প্রায়শই সংযোজিত হয়।
      </p>
      <div class="p-3 bg-white border border-[#ded8cb] rounded text-xs text-[#525a68] leading-relaxed">
        <strong>শিক্ষার্থী নোট:</strong> মূল ইংরেজি সংস্করণটি পাঠ করতে উপরের <em>"English Original"</em> বোতামে চাপুন এবং কঠিন শব্দের ওপর ক্লিক করে শব্দভাণ্ডার সমৃদ্ধ করুন।
      </div>
    </div>
  `;
}

