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

  // Single-word rules (e.g. arrested -> "গ্রেফতার") were removed: they replaced the whole
  // headline with one word. Only full, hand-written headline translations remain.
];

/**
 * Real Bengali headline for an English story, or null when none exists.
 * Sources, in order: a translation saved on the article (titleBn), then the
 * hand-written list above. Nothing is templated, so the UI offers a "বাংলা" view
 * only when a genuine translation exists.
 */
export function knownBengaliTitle(englishTitle: string, titleBn?: string | null): string | null {
  if (isBengaliText(englishTitle)) return englishTitle;
  if (titleBn && titleBn.trim()) return titleBn.trim();
  const trimmed = englishTitle.trim();
  for (const [regex, bn] of HEADLINE_REPLACEMENTS) {
    regex.lastIndex = 0;
    if (regex.test(trimmed)) return bn;
  }
  return null;
}

/** Bengali headline when one exists, otherwise the original English headline. */
export function translateTitleToBengali(englishTitle: string, titleBn?: string | null): string {
  return knownBengaliTitle(englishTitle, titleBn) ?? englishTitle;
}

/**
 * Bengali summary only when a real translation was saved; otherwise the original.
 * (This used to return a fixed template that pretended to summarise the story.)
 */
export function translateSummaryToBengali(
  _englishTitle: string,
  englishSummary: string,
  _categoryName?: string,
  summaryBn?: string | null
): string {
  return summaryBn && summaryBn.trim() ? summaryBn : englishSummary;
}

/**
 * Bengali body only when a real translation was saved; otherwise the original HTML.
 * (This used to return a template box labelled "Academic Bengali Translation".)
 */
export function translateContentToBengaliHtml(
  englishContent: string,
  _bnTitle?: string,
  _categoryName?: string,
  contentBn?: string | null
): string {
  return contentBn && contentBn.trim() ? contentBn : englishContent;
}
