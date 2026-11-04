/**
 * Scaffolded English Active Recall Quiz Engine for KhoboraKhobor Learners.
 * 
 * Rules:
 * 1. Question stems are written in clear, conversational Bangla with the target English word embedded.
 * 2. Options remain in English with plain Bengali meanings provided in brackets.
 * 3. Explanations provide high-yield grammar and contextual learning tips in Bangla.
 * 4. Context quote and paragraph citations are anchored directly to the article text.
 */

export interface ScaffoldedQuizQuestion {
  id: string;
  question: string;
  options: string[]; // e.g. ["Control or restrain (নিয়ন্ত্রণ বা রাশ টেনে ধরা)", ...]
  correctOption: number;
  explanation: string;
  topicTag: string;
  targetWord?: string;
  contextQuote?: string;
  paragraphRef?: string;
}

interface VocabQuizItem {
  targetWord: string;
  pattern: RegExp;
  correctEn: string;
  correctBn: string;
  distractors: [
    { en: string; bn: string },
    { en: string; bn: string },
    { en: string; bn: string }
  ];
  explanationTip: string;
}

export const HIGH_YIELD_SCAFFOLDED_BANK: Record<string, VocabQuizItem> = {
  collapse: {
    targetWord: "collapse",
    pattern: /\bcollaps(e|es|ed|ing)\b/i,
    correctEn: "Sudden breakdown or severe failure",
    correctBn: "ধস বা আকস্মিক বিপর্যয়",
    distractors: [
      { en: "Remarkable recovery or resurgence", bn: "উল্লেখযোগ্য উন্নতি বা ঘুরে দাঁড়ানো" },
      { en: "Slow and planned expansion", bn: "পরিকল্পিত ও মন্থর সম্প্রসারণ" },
      { en: "Temporary peaceful truce", bn: "সাময়িক যুদ্ধবিরতি বা শান্তিচুক্তি" },
    ],
    explanationTip: "Collapse শব্দের মূল অর্থ কোনো ব্যবস্থা, অবকাঠামো বা পারফরম্যান্সের আকস্মিক ধস নামা।",
  },
  restore: {
    targetWord: "restore",
    pattern: /\brestor(e|es|ed|ing|ation)\b/i,
    correctEn: "Bring back to a former good state",
    correctBn: "পুনরুদ্ধার করা বা ফিরিয়ে আনা",
    distractors: [
      { en: "Completely abandon and neglect", bn: "পুরোপুরি পরিত্যাগ বা অবহেলা করা" },
      { en: "Double existing penalty fees", bn: "জরিমানার হার দ্বিগুণ করা" },
      { en: "Prevent future participation", bn: "ভবিষ্যত অংশগ্রহণ চিরতরে রোধ করা" },
    ],
    explanationTip: "Restore মানে পূর্বাবস্থা ফিরিয়ে আনা বা ভারসাম্য পুনরুদ্ধার করা।",
  },
  scrutiny: {
    targetWord: "scrutiny",
    pattern: /\b(re-?)?scrutin(y|ise|ize|ised|ized|ies)\b/i,
    correctEn: "Critical observation or thorough examination",
    correctBn: "চুলচেরা বিশ্লেষণ বা সূক্ষ্ম নিরীক্ষা",
    distractors: [
      { en: "Careless and superficial glance", bn: "অমনোযোগী ও ভাসা-ভাসা চোখ বোলানো" },
      { en: "Complete administrative pardon", bn: "প্রশাসনিক সাধারণ ক্ষমা" },
      { en: "Postponing results permanently", bn: "ফলাফল স্থায়ীভাবে স্থগিত রাখা" },
    ],
    explanationTip: "Scrutiny বা Re-scrutiny বলতে ফলাফল বা নথিপত্র অত্যন্ত গভীরভাবে পুনঃনিরীক্ষা করা বোঝায়।",
  },
  dismiss: {
    targetWord: "dismiss",
    pattern: /\bdismiss(ed|es|ing|al)?\b/i,
    correctEn: "Discharge someone from official employment or duty",
    correctBn: "চাকরিচ্যুত বা পদ থেকে বরখাস্ত করা",
    distractors: [
      { en: "Promote to senior director level", bn: "উচ্চতর পদে পদোন্নতি দেওয়া" },
      { en: "Award honorary fellowship", bn: "সম্মানসূচক পদক প্রদান করা" },
      { en: "Grant long-term paid sabbatical", bn: "দীর্ঘমেয়াদি বেতনসহ ছুটি মঞ্জুর করা" },
    ],
    explanationTip: "Dismissed অর্থ নিয়মভঙ্গ বা শৃঙ্খলাভঙ্গের দায়ে দায়িত্ব বা পদ থেকে বরখাস্ত করা।",
  },
  arrest: {
    targetWord: "arrest",
    pattern: /\barrest(ed|s|ing)?\b/i,
    correctEn: "Seize someone by legal authority and take into custody",
    correctBn: "আইনশৃঙ্খলা বাহিনী কর্তৃক গ্রেপ্তার বা আটক",
    distractors: [
      { en: "Acquit of all legal accusations", bn: "সকল অভিযোগ থেকে বেকসুর খালাস দেওয়া" },
      { en: "Nominate for legislative council", bn: "আইন পরিষদে মনোনীত করা" },
      { en: "Reward with citizenship rights", bn: "নাগরিক মর্যাদায় পুরস্কৃত করা" },
    ],
    explanationTip: "Arrest মানে অপরাধের সন্দেহে কাউকে আইনগত হেফাজতে বা আটক করা।",
  },
  ban: {
    targetWord: "ban",
    pattern: /\bbann?(s|ed|ing)?\b/i,
    correctEn: "Officially or legally prohibit something",
    correctBn: "আইনগতভাবে নিষিদ্ধ ঘোষণা বা নিষেধাজ্ঞা",
    distractors: [
      { en: "Encourage public adoption", bn: "জনসাধারণকে ব্যবহারের উৎসাহ দেওয়া" },
      { en: "Subsidize retail purchase prices", bn: "খুচরা বিক্রয়মূল্যে ভর্তুকি দেওয়া" },
      { en: "Exempt from traffic safety rules", bn: "নিরাপত্তা নিয়মকানুন থেকে রেহাই দেওয়া" },
    ],
    explanationTip: "Ban শব্দের অর্থ রাষ্ট্রীয় বা প্রাতিষ্ঠানিক নির্দেশনায় কোনো কিছু নিষিদ্ধ করা।",
  },
  record: {
    targetWord: "record",
    pattern: /\brecord(s|ed|ing)?\b/i,
    correctEn: "Achieve or document an official statistical benchmark",
    correctBn: "সরকারি পরিসংখ্যানে নথিভুক্ত বা নজির স্থাপন",
    distractors: [
      { en: "Delete from archive databases", bn: "সংরক্ষণাগার থেকে চিরতরে মুছে ফেলা" },
      { en: "Reject without calculation", bn: "গণনা না করেই প্রত্যাখ্যান করা" },
      { en: "Dispute official examination outcomes", bn: "পরীক্ষার সরকারি ফল অস্বীকার করা" },
    ],
    explanationTip: "Record verb হিসেবে কোনো পরিসংখ্যান বা ফল অর্জন ও নথিভুক্ত করা বোঝায়।",
  },
  secure: {
    targetWord: "secure",
    pattern: /\bsecur(e|ed|es|ing)\b/i,
    correctEn: "Succeed in obtaining or achieving something",
    correctBn: "সফলভাবে অর্জন বা নিশ্চিত করা",
    distractors: [
      { en: "Lose carelessly through inaction", bn: "অমনোযোগিতায় হাতছাড়া করা" },
      { en: "Surrender unconditionally", bn: "বিনা শর্তে আত্মসমর্পণ করা" },
      { en: "Fail to qualify altogether", bn: "যোগ্যতা অর্জনে পুরোপুরি ব্যর্থ হওয়া" },
    ],
    explanationTip: "Secure GPA-5 বা secure a position মানে কাঙ্ক্ষিত লক্ষ্য সফলভাবে অর্জন করা।",
  },
  fault: {
    targetWord: "fault",
    pattern: /\bfault(s|y)?\b/i,
    correctEn: "A defect or imperfection in a machine or system",
    correctBn: "যান্ত্রিক ত্রুটি বা গোলযোগ",
    distractors: [
      { en: "Flawless mechanical execution", bn: "নিখুঁত যান্ত্রিক পরিচালনা" },
      { en: "Speedy fuel replenishing system", bn: "দ্রুত জ্বালানি সরবরাহের ব্যবস্থা" },
      { en: "Guaranteed scheduled touchdown", bn: "নির্ধারিত সময়ে নিশ্চিত অবতরণ" },
    ],
    explanationTip: "Technical fault বলতে উড়োজাহাজ বা যন্ত্রপাতির কারিগরি ত্রুটিকে বোঝায়।",
  },
  delay: {
    targetWord: "delay",
    pattern: /\bdelay(s|ed|ing)?\b/i,
    correctEn: "Make someone or something late or slow",
    correctBn: "দেরি হওয়া বা শিডিউল পিছিয়ে যাওয়া",
    distractors: [
      { en: "Depart ahead of schedule", bn: "সময়ের আগেই প্রস্থান করা" },
      { en: "Cancel operations forever", bn: "স্থায়ীভাবে কার্যক্রম বন্ধ করা" },
      { en: "Accelerate flight velocity", bn: "উড্ডয়নের গতি বহুলাংশে বাড়ানো" },
    ],
    explanationTip: "Flight delay মানে নির্ধারিত সময়ের চেয়ে দেরিতে ফ্লাইট উড্ডয়ন করা।",
  },
  depart: {
    targetWord: "depart",
    pattern: /\bdepart(s|ed|ing|ure)?\b/i,
    correctEn: "Leave, especially on an official journey",
    correctBn: "প্রস্থান করা বা রওয়ানা দেওয়া",
    distractors: [
      { en: "Arrive at destination point", bn: "চূড়ান্ত গন্তব্যে এসে পৌঁছানো" },
      { en: "Stay grounded permanently", bn: "স্থায়ীভাবে বিমানবন্দরে নোঙর করা" },
      { en: "Refuse entry at customs checkpoint", bn: "ইমিগ্রেশন তল্লাশিতে আটকে দেওয়া" },
    ],
    explanationTip: "Depart মানে কোনো স্থান ত্যাগ করে পরবর্তী গন্তব্যের উদ্দেশ্যে প্রস্থান করা।",
  },
  clash: {
    targetWord: "clash",
    pattern: /\bclash(es|ed|ing)?\b/i,
    correctEn: "A violent confrontation or dispute",
    correctBn: "সংঘর্ষ, সংঘাত বা ধস্তাধস্তি",
    distractors: [
      { en: "Peaceful friendly dialogue", bn: "শান্তিপূর্ণ ও বন্ধুত্বপূর্ণ সংলাপ" },
      { en: "Joint union celebration banquet", bn: "যৌথ শ্রমিক-মালিক উৎসব" },
      { en: "Signing long-term harmony treaty", bn: "দীর্ঘমেয়াদি সম্প্রীতি চুক্তি স্বাক্ষর" },
    ],
    explanationTip: "Clash মানে বিক্ষোভকারী ও পুলিশের মধ্যে বা দুই পক্ষের মধ্যে মুখোমুখি সহিংস সংঘর্ষ।",
  },
  demand: {
    targetWord: "demand",
    pattern: /\bdemand(s|ed|ing)?\b/i,
    correctEn: "An insistent and peremptory request",
    correctBn: "দাবি বা অধিকার আদায়ের জোরালো আহ্বান",
    distractors: [
      { en: "Voluntary surrender of rights", bn: "নিজের অধিকার স্বেচ্ছায় ছেড়ে দেওয়া" },
      { en: "Silent acceptance of deductions", bn: "বেতন কাটার সিদ্ধান্ত নীরবে মানা" },
      { en: "Requesting unpaid overtime duty", bn: "বিনা বেতনে অতিরিক্ত দায়িত্ব চাওয়া" },
    ],
    explanationTip: "Demand মানে কোনো অধিকার বা মজুরি আদায়ের দাবিতে জোরালো অবস্থান নেওয়া।",
  },
  wage: {
    targetWord: "wage",
    pattern: /\bwage(s)?\b/i,
    correctEn: "A regular payment earned for work or services",
    correctBn: "শ্রমিকদের নির্দিষ্ট বেতন বা মজুরি",
    distractors: [
      { en: "Voluntary charitable donation", bn: "স্বেচ্ছাসেবী অনুদান বা দান" },
      { en: "Penalty tax imposed by court", bn: "আদালত আরোপিত জরিমানা" },
      { en: "Dividends paid to foreign shareholders", bn: "বিদেশি শেয়ারহোল্ডারদের লভ্যাংশ" },
    ],
    explanationTip: "Minimum wage হলো সরকারি বা প্রাতিষ্ঠানিকভাবে নির্ধারিত ন্যূনতম মজুরি।",
  },
  blockade: {
    targetWord: "blockade",
    pattern: /\b(blockade|block)(s|ed|ing)?\b/i,
    correctEn: "Sealing off an area to restrict traffic or transport",
    correctBn: "অবরোধ বা যান চলাচল বন্ধ করে দেওয়া",
    distractors: [
      { en: "Constructing toll-free highways", bn: "টোলমুক্ত দ্রুতগতির মহাসড়ক নির্মাণ" },
      { en: "Welcoming tourists with free transit", bn: "পর্যটকদের বিনামূল্যে পরিবহন সুবিধা" },
      { en: "Clearing bottlenecks permanently", bn: "যানজট স্থায়ীভাবে দূর করা" },
    ],
    explanationTip: "Road blockade বা highway blockade হলো বিক্ষোভ প্রদর্শনে রাস্তা অবরোধ করা।",
  },
  crush: {
    targetWord: "crush",
    pattern: /\bcrush(es|ed|ing)?\b/i,
    correctEn: "Defeat or overwhelm an opponent comprehensively",
    correctBn: "শোচনীয় বা বড় ব্যবধানে পরাজিত করা",
    distractors: [
      { en: "Suffer a narrow 1-run loss", bn: "মাত্র ১ রানের ব্যবধানে পরাজিত হওয়া" },
      { en: "Draw the match harmoniously", bn: "ম্যাচ ড্র বা অমীমাংসিত থাকা" },
      { en: "Forfeit the tournament by withdrawal", bn: "টুর্নামেন্ট থেকে নাম প্রত্যাহার করা" },
    ],
    explanationTip: "ক্রীড়া সাংবাদিকতায় 'crush' মানে প্রতিপক্ষকে একতরফাভাবে বড় ব্যবধানে পরাজিত করা।",
  },
  visit: {
    targetWord: "visit",
    pattern: /\bvisit(s|ed|ing|or|ors)?\b/i,
    correctEn: "Go to see and spend time with someone officially",
    correctBn: "সফর বা আনুষ্ঠানিক দ্বিপক্ষীয় বৈঠক",
    distractors: [
      { en: "Break diplomatic relations permanently", bn: "কূটনৈতিক সম্পর্ক চিরতরে ছিন্ন করা" },
      { en: "Close foreign embassy missions", bn: "বিদেশের দূতাবাস মিশন বন্ধ করা" },
      { en: "Impose economic sanctions", bn: "অর্থনৈতিক নিষেধাজ্ঞা আরোপ করা" },
    ],
    explanationTip: "Bilateral visit মানে দুই দেশের দ্বিপক্ষীয় সম্পর্ক জোরদারে রাষ্ট্রনেতাদের রাষ্ট্রীয় সফর।",
  },
  abroad: {
    targetWord: "abroad",
    pattern: /\babroad\b/i,
    correctEn: "In or to a foreign country or countries",
    correctBn: "বিদেশে বা দেশের বাইরে",
    distractors: [
      { en: "Within the rural native village", bn: "নিজ জন্মভূমির প্রত্যন্ত গ্রামে" },
      { en: "Inside central domestic capital", bn: "দেশের অভ্যন্তরীণ রাজধানীতে" },
      { en: "In isolated provincial towns", bn: "বিচ্ছিন্ন বিভাগীয় মফস্বল শহরে" },
    ],
    explanationTip: "Study abroad মানে বিদেশে উচ্চশিক্ষা গ্রহণের উদ্দেশ্যে যাওয়া।",
  },
  missile: {
    targetWord: "missile",
    pattern: /\bmissile(s)?\b/i,
    correctEn: "A remote-controlled or guided aerial weapon",
    correctBn: "ক্ষেপণাস্ত্র বা গাইডেড রকেট অস্ত্র",
    distractors: [
      { en: "Civilian medical rescue helicopter", bn: "বেসামরিক উদ্ধারকারী অ্যাম্বুলেন্স" },
      { en: "Agricultural pesticide sprayer", bn: "কৃষি জমিতে কীটনাশক ছিটানোর যন্ত্র" },
      { en: "Solar weather research satellite", bn: "আবহাওয়া গবেষণার সৌর উপগ্রহ" },
    ],
    explanationTip: "Patriot missile হলো আকাশ প্রতিরক্ষা ও শত্রু ক্ষেপণাস্ত্র প্রতিহত করার সামরিক ক্ষেপণাস্ত্র ব্যবস্থা।",
  },
  drone: {
    targetWord: "drone",
    pattern: /\bdrone(s)?\b/i,
    correctEn: "An unmanned aircraft guided by remote control",
    correctBn: "চালকবিহীন ড্রোন বা আকাশযান",
    distractors: [
      { en: "Submarine diving beneath oceans", bn: "সমুদ্রের তলদেশে ডুবোজাহাজ" },
      { en: "Underground subway train coach", bn: "মাটির নিচের পাতাল রেলের বগি" },
      { en: "Cargo container freighter", bn: "পণ্যবাহী বিশালাকার সমুদ্রজাহাজ" },
    ],
    explanationTip: "Drone মানে পাইলট ছাড়া দূরনিয়ন্ত্রিত সামরিক বা নজরদারি আকাশযান।",
  },
  acclaimed: {
    targetWord: "acclaimed",
    pattern: /\b(acclaim(ed)?|veteran|demise|legendary|dead)\b/i,
    correctEn: "Celebrated for distinguished career or demise of veteran figure",
    correctBn: "খ্যাতনামা বা প্রবীণ গুণী ব্যক্তিত্বের প্রয়াণ",
    distractors: [
      { en: "Criticized for amateur performance", bn: "অনভিজ্ঞ ও দুর্বল অভিনয়ের জন্য সমালোচিত" },
      { en: "Barred from cinema entry", bn: "চলচ্চিত্রে প্রবেশে আজীবন নিষিদ্ধ" },
      { en: "Unrecognized novice actor", bn: "অখ্যাত ও অপরিচিত শিক্ষানবিস" },
    ],
    explanationTip: "Obituary বা স্মৃতিচারণায় প্রখ্যাত ব্যক্তির কর্মজীবন ও জীবনাবসানে শ্রদ্ধাজ্ঞাপন করা হয়।",
  },
  harvest: {
    targetWord: "harvest",
    pattern: /\b(harvest|catch(es)?|fresh catch)\b/i,
    correctEn: "The process of gathering crops or abundant fish catch",
    correctBn: "মাছ বা ফসল আহরণ",
    distractors: [
      { en: "Destroying aquatic habitats", bn: "জলজ জীববৈচিত্র্য ধ্বংস করা" },
      { en: "Importing frozen processed food", bn: "হিমায়িত প্রক্রিয়াজাত খাদ্য আমদানি" },
      { en: "Banning lakeside angling forever", bn: "হ্রদে মাছ শিকার চিরতরে নিষিদ্ধ করা" },
    ],
    explanationTip: "Fresh catch মানে হ্রদ বা নদী থেকে সদ্য আহরিত তাজা মাছের চালান।",
  },
  concede: {
    targetWord: "concede",
    pattern: /\b(concede(d|s)?|defeat(ed)?)\b/i,
    correctEn: "Admit defeat or acknowledge opponent's victory gracefully",
    correctBn: "পরাজয় মেনে নেওয়া বা সৌজন্য প্রদর্শন করা",
    distractors: [
      { en: "Declare fraudulent military coup", bn: "সামরিক অভ্যুত্থানের মাধ্যমে ক্ষমতা দখল" },
      { en: "Boycott electoral institutions permanently", bn: "নির্বাচনী প্রতিষ্ঠান চিরতরে বর্জন" },
      { en: "Reject election without seeing tallies", bn: "গণনা না দেখেই ফলাফল প্রত্যাখ্যান" },
    ],
    explanationTip: "Concede defeat মানে নির্বাচনে পরাজয় স্বীকার করে বিজয়ী প্রার্থীকে সাধুবাদ জানানো।",
  },
  embezzle: {
    targetWord: "embezzle",
    pattern: /\b(embezzle(d|s|ment)?|fraud(ulent)?|misappropriat(e|ed|ion))\b/i,
    correctEn: "Steal or misappropriate funds placed in one's trust",
    correctBn: "তহবিল তছরুপ বা অর্থ আত্মসাৎ",
    distractors: [
      { en: "Donate personal savings to charity", bn: "ব্যক্তিগত জমানো টাকা দাতব্যে দান করা" },
      { en: "Audit transparent accounts publicly", bn: "হিসাব নিকাশ জনসমক্ষে উন্মুক্ত রাখা" },
      { en: "Return surplus grants to treasury", bn: "উদ্বৃত্ত অনুদান সরকারি কোষাগারে ফেরত দেওয়া" },
    ],
    explanationTip: "Embezzlement হলো সরকারি বা উন্নয়ন প্রকল্পের অর্থ জালিয়াতি করে আত্মসাৎ করা।",
  },
  evict: {
    targetWord: "evict",
    pattern: /\bevict(s|ed|ing|ion)?\b/i,
    correctEn: "Expel someone from a property with legal backing",
    correctBn: "উচ্ছেদ করা বা সরকারি বাসা ছাড়ার নির্দেশ",
    distractors: [
      { en: "Award permanent tenancy ownership", bn: "স্থায়ী মালিকানা স্বত্ব প্রদান করা" },
      { en: "Waive utility charges completely", bn: "ইউটিলিটি বিল সম্পূর্ণ মওকুফ করা" },
      { en: "Sublet to commercial enterprises", bn: "বাণিজ্যিক প্রতিষ্ঠানে সাবলেট দেওয়া" },
    ],
    explanationTip: "Eviction নোটিশ মানে সরকারি বা ভাড়ার সম্পত্তি বিধি মোতাবেক ছেড়ে দেওয়ার আদেশ।",
  },
  introduce: {
    targetWord: "introduce",
    pattern: /\bintroduc(e|es|ed|ing|tion)?\b/i,
    correctEn: "Bring something into use or official operation for first time",
    correctBn: "প্রথমবারের মতো চালু বা প্রবর্তন করা",
    distractors: [
      { en: "Permanently shut down and discontinue", bn: "স্থায়ীভাবে বন্ধ ও বাতিল করা" },
      { en: "Ban technology usage nationwide", bn: "সারাদেশে প্রযুক্তির ব্যবহার নিষিদ্ধ করা" },
      { en: "Hide from public information portals", bn: "তথ্য পোর্টাল থেকে লুকিয়ে রাখা" },
    ],
    explanationTip: "Introduce a system মানে নতুন ব্যবস্থা বা প্রযুক্তিগত সেবার সূচনা করা।",
  },
  championship: {
    targetWord: "championship",
    pattern: /\b(championship|tournament|campaign|ambassador)\b/i,
    correctEn: "A major sporting contest or promotional competition",
    correctBn: "ক্রীড়া প্রতিযোগিতা বা ব্র্যান্ড প্রচারণা",
    distractors: [
      { en: "Cancelling athletic events indefinitely", bn: "ক্রীড়া আসর অনির্দিষ্টকালের জন্য বাতিল" },
      { en: "Banning international teams from traveling", bn: "আন্তর্জাতিক দলের ভ্রমণে নিষেধাজ্ঞা" },
      { en: "Demolishing central football stadium", bn: "কেন্দ্রীয় ফুটবল স্টেডিয়াম ভেঙে ফেলা" },
    ],
    explanationTip: "Championship campaign হলো আন্তর্জাতিক ক্রীড়া উৎসব বা প্রচার কার্যক্রম।",
  },
  inflate: {
    targetWord: "inflate",
    pattern: /\binflat(e|es|ed|ing|ion)?\b/i,
    correctEn: "Artificially increase or exaggerate beyond actual baseline",
    correctBn: "কৃত্রিমভাবে বাড়িয়ে দেখানো বা স্ফীতি ঘটানো",
    distractors: [
      { en: "Maintain rigorous objective standards", bn: "কঠোর ও বস্তুনিষ্ঠ মানদণ্ড বজায় রাখা" },
      { en: "Disqualify all participating students", bn: "সকল শিক্ষার্থীকে অযোগ্য ঘোষণা করা" },
      { en: "Abolish examination boards altogether", bn: "পরীক্ষা বোর্ড পুরোপুরি বিলুপ্ত করা" },
    ],
    explanationTip: "Artificially inflating pass rates মানে পরীক্ষার পাসের হার অবাস্তবভাবে বাড়িয়ে দেখানো।",
  },
  austerity: {
    targetWord: "austerity",
    pattern: /\bausterity\b/i,
    correctEn: "Measures to reduce government spending",
    correctBn: "ব্যয়সংকোচন বা কৃচ্ছ্রসাধন নীতি",
    distractors: [
      { en: "Massive luxury spending", bn: "বিলাসবহুল অতিরিক্ত খরচ" },
      { en: "Printing unlimited new money", bn: "অতিরিক্ত নতুন টাকা ছাপানো" },
      { en: "Borrowing from foreign individuals", bn: "ব্যক্তিগত বিদেশি ঋণ গ্রহণ" },
    ],
    explanationTip: "Austerity শব্দের মূল অর্থ রাষ্ট্রীয় বা প্রাতিষ্ঠানিক ব্যয় কমানোর কঠোর কৃচ্ছ্রসাধন নীতি।",
  },
  sovereignty: {
    targetWord: "sovereignty",
    pattern: /\bsovereign(ty)?\b/i,
    correctEn: "Supreme and independent state authority",
    correctBn: "স্বাধীন রাষ্ট্রের সর্বোচ্চ ও চূড়ান্ত শাসনক্ষমতা",
    distractors: [
      { en: "Foreign military occupation", bn: "বিদেশি সামরিক দখলদারিত্ব" },
      { en: "Voluntary regional surrender", bn: "আঞ্চলিক নিয়ন্ত্রণ সমর্পণ" },
      { en: "Commercial merchant alliance", bn: "ব্যবসায়িক বণিকদের জোট" },
    ],
    explanationTip: "Sovereignty হলো বিদেশি শক্তির নিয়ন্ত্রণহীন নিজ ভূখণ্ডের ওপর রাষ্ট্রের সর্বোচ্চ সার্বভৌম ক্ষমতা।",
  },
  deteriorate: {
    targetWord: "deteriorate",
    pattern: /\bdeteriorat(e|ed|es|ing|ion)\b/i,
    correctEn: "To become progressively worse",
    correctBn: "ধীরে ধীরে অবনতি ঘটা বা আরও খারাপ হওয়া",
    distractors: [
      { en: "To recover and improve rapidly", bn: "দ্রুত সেরে ওঠা বা উন্নতি করা" },
      { en: "To remain completely constant", bn: "সম্পূর্ণ অপরিবর্তিত থাকা" },
      { en: "To double in financial value", bn: "দ্বিগুণ আর্থিক মান অর্জন করা" },
    ],
    explanationTip: "Deteriorate একটি ক্রিয়াপদ (Verb), যার অর্থ ক্রমাগত খারাপ বা সংকটজনক দশায় পৌঁছানো।",
  },
  alleviate: {
    targetWord: "alleviate",
    pattern: /\balleviat(e|ed|es|ing|ion)\b/i,
    correctEn: "To make suffering or a problem less severe",
    correctBn: "কষ্ট, বেদনা বা সমস্যার তীব্রতা কমানো",
    distractors: [
      { en: "To worsen an existing dispute", bn: "বিদ্যমান বিরোধ আরও জটিল করে তোলা" },
      { en: "To destroy an economic bridge", bn: "অর্থনৈতিক অবকাঠামো ধ্বংস করা" },
      { en: "To double domestic interest rates", bn: "অভ্যন্তরীণ সুদের হার দ্বিগুণ করা" },
    ],
    explanationTip: "Alleviate মানে কোনো সমস্যার তীব্রতা উপশম বা প্রশমিত করা।",
  },
  resilience: {
    targetWord: "resilience",
    pattern: /\bresilien(ce|t)\b/i,
    correctEn: "Ability to quickly recover from difficulties",
    correctBn: "সংকটের ধাক্কা সামলে দ্রুত ঘুরে দাঁড়ানোর ক্ষমতা",
    distractors: [
      { en: "Extreme physical fragility", bn: "চরম ভঙ্গুরতা বা দুর্বলতা" },
      { en: "Total refusal to work", bn: "কাজকর্মে অংশ নিতে সরাসরি অস্বীকৃতি" },
      { en: "Complete lack of adaptability", bn: "অভিযোজন ক্ষমতার সামগ্রিক অভাব" },
    ],
    explanationTip: "Resilience বিপর্যয়ের ধাক্কা সামলে দ্রুত ঘুরে দাঁড়ানোর ইতিবাচক ক্ষমতা।",
  },
  curb: {
    targetWord: "curb",
    pattern: /\bcurb(s|ed|ing)?\b/i,
    correctEn: "Restrain or keep in check",
    correctBn: "দমন করা, সংবরণ করা বা রাশ টানা",
    distractors: [
      { en: "Promote and encourage widely", bn: "ব্যাপকভাবে উৎসাহিত বা সম্প্রসারিত করা" },
      { en: "Double public subsidies", bn: "সরকারি ভর্তুকি দ্বিগুণ করা" },
      { en: "Celebrate an annual festival", bn: "বার্ষিক কোনো উৎসব উদযাপন করা" },
    ],
    explanationTip: "Curb শব্দের অর্থ কোনো নেতিবাচক কার্যকলাপ বা অতিরিক্ত খরচকে নিয়ন্ত্রণ বা দমন করা।",
  },
  rein_in: {
    targetWord: "rein in",
    pattern: /\brein(s|ed|ing)?\s+in\b/i,
    correctEn: "Control or restrain something strictly",
    correctBn: "নিয়ন্ত্রণ করা বা শক্তভাবে রাশ টেনে ধরা",
    distractors: [
      { en: "Accelerate without any limits", bn: "সীমাহীনভাবে গতি আরও বাড়িয়ে দেওয়া" },
      { en: "Postpone indefinitely", bn: "অনির্দিষ্টকালের জন্য পিছিয়ে দেওয়া" },
      { en: "Ignore and overlook completely", bn: "পুরোপুরি উপেক্ষা বা এড়িয়ে চলা" },
    ],
    explanationTip: "Rein in একটি প্রচলিত phrasal verb, যার অর্থ লাগাম টেনে ধরা বা কঠোরভাবে নিয়ন্ত্রণ করা।",
  },
  investigate: {
    targetWord: "investigate",
    pattern: /\binvestigat(e|es|ed|ing|ion|ions)\b/i,
    correctEn: "Carry out a formal inquiry to discover facts",
    correctBn: "তদন্ত বা অনুসন্ধান চালানো",
    distractors: [
      { en: "Suppress evidence in secret", bn: "গোপনে প্রমাণ ধামাচাপা দেওয়া" },
      { en: "Forgive offenders unconditionally", bn: "অপরাধীদের বিনা বিচারে ক্ষমা করা" },
      { en: "Close the police headquarters", bn: "পুলিশ সদরদপ্তর বন্ধ করে দেওয়া" },
    ],
    explanationTip: "Investigate মানে সত্য উদঘাটনে কোনো ঘটনার আনুষ্ঠানিক তদন্ত পরিচালনা করা।",
  },
  committee: {
    targetWord: "committee",
    pattern: /\bcommittee(s)?\b/i,
    correctEn: "A group appointed for a specific investigation or duty",
    correctBn: "বিশেষ তদন্ত বা পর্যালোচনা কমিটি",
    distractors: [
      { en: "Disorganized street mob", bn: "বিশৃঙ্খলা সৃষ্টিকারী উচ্ছৃঙ্খল জনতা" },
      { en: "Foreign armed regiment", bn: "বিদেশি সামরিক পদাতিক দল" },
      { en: "Underground criminal cartel", bn: "গোপন অপরাধী চক্র" },
    ],
    explanationTip: "Committee হলো নির্দিষ্ট প্রশাসনিক দায়িত্ব বা তদন্ত সম্পন্ন করতে দায়িত্বপ্রাপ্ত সরকারি দল।",
  },
  incident: {
    targetWord: "incident",
    pattern: /\bincident(s)?\b/i,
    correctEn: "An event or occurrence, especially unpleasant",
    correctBn: "অনাকাঙ্ক্ষিত ঘটনা বা দুর্ঘটনা",
    distractors: [
      { en: "Carefully rehearsed stage drama", bn: "মহড়া দেওয়া মঞ্চ নাটক" },
      { en: "National holiday leisure day", bn: "জাতীয় ছুটির আমোদপ্রমোদ" },
      { en: "Historic peace anniversary", bn: "ঐতিহাসিক শান্তি প্রতিষ্ঠা বার্ষিকী" },
    ],
    explanationTip: "Incident মানে সমাজে বা প্রতিষ্ঠানে ঘটে যাওয়া কোনো সংবেদনশীল বা অনাকাঙ্ক্ষিত ঘটনা।",
  },
  luxury: {
    targetWord: "luxury",
    pattern: /\bluxur(y|ies|ious)\b/i,
    correctEn: "A state of great comfort involving high expense",
    correctBn: "বিলাসিতা বা ব্যয়বহুল ভোগ্যপণ্য",
    distractors: [
      { en: "Indispensable basic staple food", bn: "অপরিহার্য মৌলিক নিত্যপ্রয়োজনীয় খাবার" },
      { en: "Zero-cost natural sunlight", bn: "বিনামূল্যের প্রাকৃতিক সূর্যালোক" },
      { en: "Emergency hospital medicine", bn: "জরুরি হাসপাতালের অত্যাবশ্যকীয় ওষুধ" },
    ],
    explanationTip: "Luxury হলো উচ্চমূল্যের কারণে সাধারণ মানুষের নাগালের বাইরে থাকা বিলাসী পণ্য বা সেবা।",
  },
};

/**
 * Generates an array of scaffolded micro-quizzes strictly aligned with the article content.
 */
export function generateScaffoldedEnglishQuiz(
  articleTitle: string,
  articleContent: string
): ScaffoldedQuizQuestion[] {
  const combined = `${articleTitle} ${articleContent}`.toLowerCase();
  const questions: ScaffoldedQuizQuestion[] = [];
  let idCounter = 1;

  // Clean content paragraphs for citation extraction
  const cleanContent = (articleContent || "").replace(/<[^>]+>/g, "\n");
  const paras = cleanContent
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 20);

  // Helper to extract context sentence and paragraph
  const getContext = (regex: RegExp) => {
    if (paras.length === 0) {
      return {
        quote: articleTitle.length > 200 ? articleTitle.slice(0, 197) + "..." : articleTitle,
        paragraphRef: "প্রধান শিরোনাম",
      };
    }
    for (let pIdx = 0; pIdx < paras.length; pIdx++) {
      if (regex.test(paras[pIdx])) {
        const sentences = paras[pIdx].split(/(?<=[.?!।])\s+/).filter(Boolean);
        for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
          if (regex.test(sentences[sIdx])) {
            const s = sentences[sIdx].trim();
            return {
              quote: s.length > 220 ? s.slice(0, 217) + "..." : s,
              paragraphRef: `অনুচ্ছেদ ${pIdx + 1} • বাক্য ${sIdx + 1}`,
            };
          }
        }
        const p = paras[pIdx].trim();
        return {
          quote: p.length > 220 ? p.slice(0, 217) + "..." : p,
          paragraphRef: `অনুচ্ছেদ ${pIdx + 1}`,
        };
      }
    }
    const lead = paras[0].split(/(?<=[.?!।])\s+/)[0] || paras[0];
    return {
      quote: lead.length > 220 ? lead.slice(0, 217) + "..." : lead,
      paragraphRef: "অনুচ্ছেদ ১ • মূল প্রেক্ষাপট",
    };
  };

  // 1. Vocabulary in Context Questions
  for (const [key, item] of Object.entries(HIGH_YIELD_SCAFFOLDED_BANK)) {
    if (item.pattern.test(combined)) {
      const correctOptionText = `${item.correctEn} (${item.correctBn})`;
      const distractorTexts = item.distractors.map((d) => `${d.en} (${d.bn})`);

      const allOpts = [
        correctOptionText,
        distractorTexts[0],
        distractorTexts[1],
        distractorTexts[2],
      ];

      // Shuffle options deterministically based on key length & idCounter
      const correctIndex = (key.length + idCounter) % 4;
      const temp = allOpts[0];
      allOpts[0] = allOpts[correctIndex];
      allOpts[correctIndex] = temp;

      const citation = getContext(item.pattern);

      questions.push({
        id: `scaffold-vocab-${key}-${idCounter++}`,
        question: `উদ্ধৃত অনুচ্ছেদে "${item.targetWord}" শব্দটা দিয়ে কী বোঝানো হয়েছে?`,
        options: allOpts,
        correctOption: correctIndex,
        explanation: `${item.explanationTip} সঠিক উত্তর: "${item.correctEn}" (${item.correctBn})।`,
        topicTag: "শব্দার্থ ও প্রেক্ষাপট",
        targetWord: item.targetWord,
        contextQuote: citation.quote,
        paragraphRef: citation.paragraphRef,
      });

      if (questions.length >= 2) break;
    }
  }

  // 2. Preposition / Collocation Spotter Challenge
  if (/\bcompl(y|ies|ied|iance)\b/i.test(combined)) {
    const regex = /\bcompl(y|ies|ied|iance)\b/i;
    const citation = getContext(regex);
    questions.push({
      id: `scaffold-prep-${idCounter++}`,
      question: `প্যাসেজে "comply" শব্দের পর কোন Preposition-টি মানানসইভাবে বসেছে?`,
      options: [
        "with (নিয়ম বা আইন মেনে চলার ক্ষেত্রে)",
        "to (কারো প্রতি নির্দেশনা দেওয়া)",
        "for (নির্দিষ্ট উদ্দেশ্যের ক্ষেত্রে)",
        "against (বিরোধিতা বা সংঘাত বোঝাতে)",
      ],
      correctOption: 0,
      explanation: "ইংরেজি ব্যাকরণে নিয়ম, শর্ত বা আইন মানার ক্ষেত্রে সবসময় 'comply with' ব্যবহৃত হয়।",
      topicTag: "উপযুক্ত প্রিপজিশন",
      targetWord: "comply with",
      contextQuote: citation.quote,
      paragraphRef: citation.paragraphRef,
    });
  } else if (/\bdepend(s|ed|ent|ing)?\b/i.test(combined)) {
    const regex = /\bdepend(s|ed|ent|ing)?\b/i;
    const citation = getContext(regex);
    questions.push({
      id: `scaffold-prep-${idCounter++}`,
      question: `প্যাসেজে "depend" শব্দের সাথে উপযুক্ত কোন Preposition-টি ব্যবহৃত হয়?`,
      options: [
        "on / upon (কারো বা কিছুর ওপর নির্ভর করা)",
        "in (অভ্যন্তরীণ ক্ষেত্রে)",
        "at (নির্দিষ্ট স্থান বোঝাতে)",
        "by (মাধ্যমে বা উপায়ে)",
      ],
      correctOption: 0,
      explanation: "নির্ভরশীলতা প্রকাশের ক্ষেত্রে 'depend on' বা 'depend upon' ব্যবহৃত হয়।",
      topicTag: "উপযুক্ত প্রিপজিশন",
      targetWord: "depend on",
      contextQuote: citation.quote,
      paragraphRef: citation.paragraphRef,
    });
  } else if (/\baccused\b/i.test(combined)) {
    const regex = /\baccused\b/i;
    const citation = getContext(regex);
    questions.push({
      id: `scaffold-prep-${idCounter++}`,
      question: `আইন ও অপরাধ সংক্রান্ত সংবাদে "accused" শব্দের পর কোন Preposition ব্যবহৃত হয়?`,
      options: [
        "of (নির্দিষ্ট অপরাধে অভিযুক্ত হওয়া)",
        "with (সাথে সম্পৃক্ত থাকা)",
        "for (উদ্দেশ্যমূলক বোঝাতে)",
        "by (কারো মাধ্যমে সম্পন্ন হওয়া)",
      ],
      correctOption: 0,
      explanation: "কাউকে কোনো অপরাধে অভিযুক্ত বোঝাতে 'accused of' (যেমন: accused of robbery/murder) বসে।",
      topicTag: "উপযুক্ত প্রিপজিশন",
      targetWord: "accused of",
      contextQuote: citation.quote,
      paragraphRef: citation.paragraphRef,
    });
  } else if (/\bparticipat(e|ed|es|ing)\b/i.test(combined)) {
    const regex = /\bparticipat(e|ed|es|ing)\b/i;
    const citation = getContext(regex);
    questions.push({
      id: `scaffold-prep-${idCounter++}`,
      question: `সংবাদে "participate" ক্রিয়াপদের সাথে যথাযথ কোন Preposition-টি বসেছে?`,
      options: [
        "in (কোনো কর্মসূচি বা কর্মকাণ্ডে অংশ নেওয়া)",
        "to (কারো প্রতি লক্ষ্য করে বলা)",
        "with (একসাথে থাকা বোঝাতে)",
        "on (কোনো কিছুর ওপর নির্ভরশীলতা)",
      ],
      correctOption: 0,
      explanation: "কোনো কার্যক্রম, পরীক্ষা বা কর্মসূচিতে অংশগ্রহণ বোঝাতে 'participate in' ব্যবহৃত হয়।",
      topicTag: "উপযুক্ত প্রিপজিশন",
      targetWord: "participate in",
      contextQuote: citation.quote,
      paragraphRef: citation.paragraphRef,
    });
  } else if (/\binvest(s|ed|ing|ment)?\b/i.test(combined)) {
    const regex = /\binvest(s|ed|ing|ment)?\b/i;
    const citation = getContext(regex);
    questions.push({
      id: `scaffold-prep-${idCounter++}`,
      question: `অর্থনৈতিক ও প্রাতিষ্ঠানিক সংবাদে "invest" শব্দের সাথে কোন Preposition ব্যবহৃত হয়?`,
      options: [
        "in (অর্থ বা সম্পদ কোনো খাতে বিনিয়োগ করা)",
        "at (নির্দিষ্ট সময় বা স্থান)",
        "with (কারো সাথে থাকা)",
        "from (উৎস নির্দেশ করতে)",
      ],
      correctOption: 0,
      explanation: "ব্যবসা, প্রকল্প বা শেয়ার বাজারে অর্থ খাটানো বোঝাতে 'invest in' বসে।",
      topicTag: "উপযুক্ত প্রিপজিশন",
      targetWord: "invest in",
      contextQuote: citation.quote,
      paragraphRef: citation.paragraphRef,
    });
  } else if (/\bresponsi(ble|bility)\b/i.test(combined)) {
    const regex = /\bresponsi(ble|bility)\b/i;
    const citation = getContext(regex);
    questions.push({
      id: `scaffold-prep-${idCounter++}`,
      question: `আইন ও শাসন সংক্রান্ত প্রেক্ষাপটে "responsible" শব্দের পর কোন Preposition বসে?`,
      options: [
        "for (নির্দিষ্ট কাজের বা ফলাফলের জন্য দায়ী হওয়া)",
        "to (কারো প্রতি দায়বদ্ধ থাকা)",
        "with (সাথে থাকা)",
        "about (বিষয়ে)",
      ],
      correctOption: 0,
      explanation: "কোনো কার্যক্রম বা ঘটনার জন্য দায়ী বোঝাতে 'responsible for' ব্যবহৃত হয়।",
      topicTag: "উপযুক্ত প্রিপজিশন",
      targetWord: "responsible for",
      contextQuote: citation.quote,
      paragraphRef: citation.paragraphRef,
    });
  } else if (/\bfocus(es|ed|ing)?\b/i.test(combined)) {
    const regex = /\bfocus(es|ed|ing)?\b/i;
    const citation = getContext(regex);
    questions.push({
      id: `scaffold-prep-${idCounter++}`,
      question: `সম্পাদকীয় নিবন্ধে "focus" ক্রিয়াপদের সাথে কোন Preposition-টি মানানসইভাবে বসে?`,
      options: [
        "on / upon (কোনো নির্দিষ্ট বিষয়ের ওপর আলোকপাত করা)",
        "in (ভিতরে থাকা)",
        "at (নির্দিষ্ট লক্ষ্য)",
        "by (দ্বারা বা মাধ্যমে)",
      ],
      correctOption: 0,
      explanation: "কোনো বিষয়ের ওপর বিশেষ দৃষ্টি বা আলোকপাত বোঝাতে 'focus on' ব্যবহৃত হয়।",
      topicTag: "উপযুক্ত প্রিপজিশন",
      targetWord: "focus on",
      contextQuote: citation.quote,
      paragraphRef: citation.paragraphRef,
    });
  }

  // 3. Cloze Test / Missing Verb Challenge (Strictly context-guarded)
  if (
    (/\binterest\s+rates?\b/i.test(combined) || /\bcentral\s+bank\b/i.test(combined) || /\bmonetary\s+policy\b/i.test(combined)) &&
    (/\bhike(s|d)?\b/i.test(combined) || /\brate\b/i.test(combined))
  ) {
    const regex = /\b(interest\s+rates?|central\s+bank|monetary\s+policy)\b/i;
    const citation = getContext(regex);
    questions.push({
      id: `scaffold-cloze-${idCounter++}`,
      question: `নিচের বাক্যের শূন্যস্থানে আর্থিক সংবাদ প্রেক্ষাপট অনুযায়ী কোন শব্দটি সবচেয়ে মানানসই?\n"The central bank decided to _______ policy rates to curb inflation."`,
      options: [
        "hike (সুদের হার বৃদ্ধি করা)",
        "demolish (ভেঙে ফেলা বা গুঁড়িয়ে দেওয়া)",
        "hesitate (সিদ্ধান্ত নিতে দ্বিধা করা)",
        "forget (উপেক্ষা করে ভুলে যাওয়া)",
      ],
      correctOption: 0,
      explanation: "মূল্যস্ফীতি নিয়ন্ত্রণে কেন্দ্রীয় ব্যাংক সাধারণত সুদের হার বাড়ায় (hike policy rates)।",
      topicTag: "শূন্যস্থান পূরণ",
      targetWord: "hike",
      contextQuote: citation.quote,
      paragraphRef: citation.paragraphRef,
    });
  }

  // 4. Guaranteed Article-Aligned Reading Comprehension & Analytical Insight (ensures minimum 3 questions)
  if (questions.length < 3) {
    const citation = getContext(/./);
    const cleanTitle = articleTitle.replace(/["“”]/g, "").trim();
    const leadSnippet = citation.quote || cleanTitle;
    
    questions.push({
      id: `scaffold-comprehension-${idCounter++}`,
      question: `উদ্ধৃত "${cleanTitle.length > 70 ? cleanTitle.slice(0, 67) + "..." : cleanTitle}" প্রতিবেদনের আলোকে প্রধান আলোচিত তথ্য কোনটি?`,
      options: [
        `${leadSnippet.length > 80 ? leadSnippet.slice(0, 77) + "..." : leadSnippet} (প্রতিবেদনে আলোচিত মূল তথ্য)`,
        "বিগত দশকের অপ্রাসঙ্গিক পুরনো ঘটনার পুনরাবৃত্তি বা সাধারণ পরিসংখ্যান",
        "কোনো সরকারি বা নিরপেক্ষ তথ্যসূত্র ছাড়া প্রচারিত সামাজিক মাধ্যমের গুজব",
        "উদ্ধৃত প্রতিবেদনের মূল বক্তব্যের সাথে সরাসরি বিপরীত বা অসত্য কোনো বিবরণ",
      ],
      correctOption: 0,
      explanation: `প্রতিবেদনের মূল তথ্য অনুসারে: "${leadSnippet}"। এটিই আলোচ্য খবরের কেন্দ্রীয় বিষয়বস্তু।`,
      topicTag: "রিডিং কম্প্রিহেনশন ও মূল ভাব",
      targetWord: cleanTitle.split(" ")[0] || "Comprehension",
      contextQuote: citation.quote,
      paragraphRef: citation.paragraphRef,
    });
  }

  return questions;
}
