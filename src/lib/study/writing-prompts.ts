import type { EnglishTopic } from "@/lib/study/topics";

/**
 * The writing task at the end of an English story: an IELTS Writing Task 2 style
 * question on the story's core theme (football → why football is so popular; gold
 * prices → gold as savings), written once by hand. The theme is found from the story's
 * own words; when none fits, the broad topic's prompts are used. A story always gets
 * the same prompt. No AI.
 */

interface Theme {
  label: string;
  /** Words or phrases, matched as whole words, any case */
  words: string[];
  /** Acronyms, matched as whole words, exact case ("AI", "COP29") */
  caps?: string[];
  prompts: string[];
}

// More specific themes first: on a tie, the earlier theme wins
const THEMES: Theme[] = [
  // ---- Sport & culture
  {
    label: "Football",
    words: ["football", "footballer", "footballers", "soccer", "league", "Premier League", "Champions League", "Europa League", "La Liga", "Serie A", "World Cup", "goal", "goals", "striker", "midfielder", "goalkeeper", "penalty", "Messi", "Ronaldo", "Real Madrid", "Barcelona", "Manchester United", "Liverpool", "Arsenal", "Milan"],
    caps: ["FIFA", "UEFA", "SAFF"],
    prompts: [
      "Football is the most popular sport in the world. Why do you think it attracts so many fans, and is this popularity a good thing?",
      "Some people say playing football helps young people stay healthy and learn teamwork. To what extent do you agree or disagree?",
      "Top footballers earn huge salaries. Do you think they deserve this money? Give your opinion.",
    ],
  },
  {
    label: "Cricket",
    words: ["cricket", "wicket", "wickets", "innings", "batter", "batters", "bowler", "bowlers", "Shanto", "Shakib", "run chase", "overs", "Test match", "Test series"],
    caps: ["BCB", "ICC", "BPL", "IPL", "ODI", "T20", "T20I", "Test", "Tigers"],
    prompts: [
      "Cricket is followed by millions of people in Bangladesh. Why is the sport so popular, and what could the country do to perform better internationally?",
      "Some people think children should spend more time playing sports like cricket instead of studying. Do you agree or disagree?",
      "Should a country spend public money to host international cricket tournaments? Give your opinion.",
    ],
  },
  {
    label: "Sport",
    words: ["Olympic", "Olympics", "medal", "medals", "athlete", "athletes", "tournament", "championship", "tennis", "hockey", "badminton", "chess", "kabaddi", "archery", "stadium", "coach", "sports", "sport"],
    prompts: [
      "Why do some countries win many international sports medals while others win very few? What could a country like Bangladesh do to improve?",
      "Some people believe sport should be a compulsory part of the school day. To what extent do you agree or disagree?",
      "Women's sports usually receive less attention and money than men's sports. Why is this, and how could it be changed?",
    ],
  },
  {
    label: "Film & culture",
    words: ["film", "films", "cinema", "movie", "movies", "actor", "actress", "drama", "music", "song", "singer", "concert", "theatre", "art", "artist", "exhibition", "book fair", "literature", "novel", "poet"],
    prompts: [
      "Some people think films and TV shows from abroad harm local culture. To what extent do you agree or disagree?",
      "Should governments support local artists, musicians and filmmakers with public money? Give your opinion.",
    ],
  },
  {
    label: "Festivals",
    words: ["festival", "festivals", "Eid", "Puja", "Durga Puja", "Pohela Boishakh", "Christmas", "celebration", "celebrations", "holiday", "holidays"],
    prompts: [
      "Festivals bring people together, but they also cause traffic, noise and waste. Do the benefits of large festivals outweigh the problems?",
      "How important is it for people of different religions to respect and join in each other's festivals? Give your opinion.",
    ],
  },
  {
    label: "Tourism",
    words: ["tourist", "tourists", "tourism", "Sajek", "Cox's Bazar", "Saint Martin", "resort", "hotel", "hotels", "travellers", "heritage"],
    prompts: [
      "Tourism brings money to a region but can damage nature and local life. Do the advantages outweigh the disadvantages?",
      "Should local people have a say before tourist areas near their homes are developed? Give your opinion.",
    ],
  },

  // ---- Economy
  {
    label: "Wages & workers",
    words: ["wage", "wages", "minimum wage", "salary", "salaries", "garment", "garments", "RMG", "factory workers", "workers", "labour", "labourers", "wage board"],
    caps: ["BGMEA", "BKMEA"],
    prompts: [
      "Some people believe governments should set a minimum wage for all workers. Others think wages should be decided by employers. Discuss both views and give your opinion.",
      "Is economic growth more important than fair wages for workers? Give your opinion.",
      "When workers protest for higher pay, factories close and the economy suffers. How should such disputes be settled?",
    ],
  },
  {
    label: "Gold & prices",
    words: ["gold", "silver", "bhori", "price", "prices", "inflation", "cost of living", "commodity", "commodities", "rice price", "onion", "fuel price"],
    prompts: [
      "Many people buy gold to protect their savings. Is this a wise way to save money? Give your opinion.",
      "The prices of everyday goods keep rising. Who is most affected, and what should the government do about it?",
    ],
  },
  {
    label: "Banking & loans",
    words: ["bank", "banks", "banking", "loan", "loans", "credit", "deposit", "deposits", "interest rate", "authorised capital", "paid-up capital", "defaulted", "default", "Bangladesh Bank", "Islami Bank", "SME", "SMEs", "entrepreneurs"],
    prompts: [
      "Small businesses often find it hard to get bank loans. What problems does this cause, and what could be done about it?",
      "Some people think banks should be strictly controlled by the government. Others think they should be free to run their own business. Discuss both views and give your opinion.",
    ],
  },
  {
    label: "Debt & development",
    words: ["debt", "reserves", "foreign exchange", "World Bank", "Asian Development Bank", "development project", "budget", "foreign aid", "lenders", "borrowing", "external debt"],
    caps: ["IMF", "ADB", "AIIB", "GDP"],
    prompts: [
      "Some people think developing countries should borrow from international lenders to build roads, water supply and power plants. Others say the debt is too risky. Discuss both views and give your opinion.",
      "Should a country spend more of its budget on paying back debt, or on schools and hospitals? Give your opinion.",
    ],
  },
  {
    label: "Stock markets",
    words: ["stock", "stocks", "shares", "share market", "stock market", "investors", "Wall Street", "Nasdaq", "tech stocks"],
    caps: ["DSE", "CSE", "BSEC"],
    prompts: [
      "Some people say investing in the stock market is a good way to build wealth; others say it is too risky for ordinary people. Discuss both views and give your opinion.",
    ],
  },
  {
    label: "Trade & exports",
    words: ["export", "exports", "exporters", "import", "imports", "tariff", "tariffs", "trade deal", "duty-free"],
    prompts: [
      "Should a country depend mainly on one industry, such as garments, for its exports? What are the risks?",
      "Some people think a country should buy local products instead of imported ones. To what extent do you agree or disagree?",
    ],
  },
  {
    label: "Migration & work abroad",
    words: ["remittance", "remittances", "migrant", "migrants", "migration", "expatriate", "expatriates", "overseas jobs", "manpower", "migrant workers"],
    prompts: [
      "Many young people leave Bangladesh to work abroad. Is this good or bad for the country? Give your opinion.",
      "What can be done to protect the rights of workers who go abroad for jobs?",
    ],
  },
  {
    label: "Corruption",
    words: ["corruption", "embezzle", "embezzled", "embezzlement", "bribe", "bribery", "fraud", "fake vouchers", "graft", "money laundering"],
    caps: ["ACC"],
    prompts: [
      "Corruption slows down a country's development. What are its main causes, and how can it be reduced?",
      "Should people found guilty of stealing public money be punished more severely than other criminals? Give your opinion.",
    ],
  },
  {
    label: "Farming & food",
    words: ["farm", "farms", "farmer", "farmers", "crop", "crops", "harvest", "agriculture", "agricultural", "paddy", "waterlogging", "irrigation", "fertiliser", "food security"],
    prompts: [
      "Farmers produce the food we eat but often earn very little. Why is this, and how could their lives be improved?",
      "Should the government spend more to protect farmland from floods and waterlogging? Give your opinion.",
    ],
  },
  {
    label: "Energy",
    words: ["electricity", "power plant", "load-shedding", "gas", "fuel", "energy", "solar", "renewable", "nuclear", "Rooppur", "uranium", "power cuts"],
    caps: ["LNG", "LPG"],
    prompts: [
      "Should countries like Bangladesh invest more in solar and other renewable energy, even if it costs more at first? Give your opinion.",
      "Is nuclear power a good solution to a country's growing need for electricity? Discuss both views and give your opinion.",
    ],
  },
  {
    label: "Jobs",
    words: ["unemployment", "unemployed", "jobs", "job seekers", "employment", "recruitment", "layoffs", "job market"],
    prompts: [
      "Many university graduates cannot find jobs. What are the causes, and what can be done about it?",
      "Is it better to work for a large company or to start your own business? Give your opinion.",
    ],
  },

  // ---- Education
  {
    label: "BCS & government jobs",
    words: ["BCS", "civil service", "cadre", "gazette", "government job", "government jobs", "public service"],
    caps: ["PSC", "BPSC"],
    prompts: [
      "Many young people in Bangladesh spend years preparing for government jobs. Is this a good use of their time? Give your opinion.",
      "Should government jobs be given only on merit, or should some posts be kept for special groups? Discuss both views and give your opinion.",
    ],
  },
  {
    label: "Exams & results",
    words: ["HSC", "SSC", "exam", "exams", "examination", "examinations", "pass rate", "GPA", "results", "re-scrutiny", "education board", "Alim", "Dakhil"],
    prompts: [
      "Some people think public examinations are the fairest way to judge students, while others believe they put too much pressure on young people. Discuss both views and give your opinion.",
      "Many students fail important exams every year. Is this mainly the fault of the students, or of the education system?",
      "Should students who fail one or two subjects get a quick chance to retake them? Give your opinion.",
    ],
  },
  {
    label: "Study abroad & universities",
    words: ["study abroad", "university", "universities", "scholarship", "scholarships", "higher education", "admission", "campus", "students abroad"],
    caps: ["IELTS", "UGC"],
    prompts: [
      "More students are choosing to study abroad. What are the advantages and disadvantages for them and for their country?",
      "Should university education be free for all students? Give your opinion.",
    ],
  },
  {
    label: "Schools & learning",
    words: ["school", "schools", "teacher", "teachers", "textbook", "textbooks", "curriculum", "classroom", "primary education", "madrasa"],
    prompts: [
      "Should governments spend more money on schools in villages than on schools in cities? Give your opinion.",
      "Some people think teachers are more important than technology for learning. To what extent do you agree or disagree?",
    ],
  },

  // ---- Health
  {
    label: "Dengue & disease",
    words: ["dengue", "malaria", "chikungunya", "virus", "outbreak", "infection", "infections", "cholera", "mosquito", "mosquitoes", "COVID", "vaccine", "vaccination"],
    prompts: [
      "What are the main causes of the spread of diseases like dengue in cities, and how can they be reduced?",
      "Should people be fined for leaving standing water where mosquitoes can breed? Give your opinion.",
    ],
  },
  {
    label: "Hospitals & healthcare",
    words: ["hospital", "hospitals", "doctor", "doctors", "patient", "patients", "healthcare", "health care", "treatment", "medicine", "medicines", "clinic", "nurses"],
    prompts: [
      "Some people believe healthcare should be free for everyone. Others think people should pay for their own treatment. Discuss both views and give your opinion.",
      "Many patients travel abroad for treatment. Why is this, and how can local hospitals win their trust?",
    ],
  },
  {
    label: "Drugs",
    words: ["yaba", "drug", "drugs", "narcotics", "heroin", "addiction", "phensedyl"],
    prompts: ["Drug abuse is rising among young people. What are the causes, and what can families and the government do about it?"],
  },
  {
    label: "Food safety",
    words: ["adulterated", "adulteration", "food safety", "formalin", "unsafe food", "expired"],
    prompts: ["Unsafe food is a serious problem in many cities. Who should be responsible for keeping food safe: sellers, the government or buyers?"],
  },

  // ---- Environment
  {
    label: "Climate change",
    words: ["climate", "climate change", "climate justice", "carbon", "emissions", "global warming", "sea level", "net zero", "loss and damage"],
    caps: ["COP", "COP28", "COP29", "COP30", "COP31", "UNFCCC"],
    prompts: [
      "Rich countries produced most of the pollution that causes climate change. Should they pay poorer countries to deal with its effects? Give your opinion.",
      "What can ordinary people do to reduce climate change? Is individual action enough?",
    ],
  },
  {
    label: "Floods & disasters",
    words: ["flood", "floods", "flooding", "cyclone", "storm", "landslide", "landslides", "disaster", "disasters", "earthquake", "river erosion", "flash flood"],
    prompts: [
      "Floods and cyclones hit Bangladesh every year. How can people and the government be better prepared?",
      "Should people be stopped from building homes in areas that flood often? Give your opinion.",
    ],
  },
  {
    label: "Rivers & fishing",
    words: ["hilsa", "fishing", "fishermen", "fish", "river", "rivers", "fishing ban", "Padma", "Meghna", "Jamuna", "Buriganga"],
    prompts: [
      "Temporary bans on fishing protect fish stocks but hurt fishermen's income. Are such bans worth it? Give your opinion.",
      "Who should be most responsible for protecting rivers: governments, companies or individuals?",
    ],
  },
  {
    label: "Pollution & waste",
    words: ["air pollution", "pollution", "polluted", "plastic", "plastics", "waste", "garbage", "smog", "air quality", "noise pollution"],
    caps: ["AQI"],
    prompts: [
      "Air pollution in cities is getting worse. What are the main causes, and what can be done to solve the problem?",
      "Should single-use plastic bags be banned completely? Give your opinion.",
    ],
  },
  {
    label: "Forests & wildlife",
    words: ["forest", "forests", "wildlife", "tiger", "tigers", "Sundarbans", "trees", "deforestation", "elephant", "elephants", "hill tracts"],
    prompts: ["Should the protection of forests and wildlife come before building new roads and factories? Give your opinion."],
  },

  // ---- Technology & science
  {
    label: "Artificial intelligence",
    words: ["artificial intelligence", "ChatGPT", "automation", "robot", "robots", "machine learning", "chatbot"],
    caps: ["AI"],
    prompts: [
      "Artificial intelligence may replace many jobs. Is this a reason to worry, or will it create new opportunities? Discuss both views and give your opinion.",
      "Should students be allowed to use AI tools for their homework? Give your opinion.",
    ],
  },
  {
    label: "Mobile payments",
    words: ["bKash", "Nagad", "mobile banking", "mobile financial", "digital payment", "digital payments", "cashless", "fintech"],
    caps: ["MFS"],
    prompts: ["Some people think cash will soon disappear because of mobile payments. Is a cashless society a good idea? Give your opinion."],
  },
  {
    label: "Internet & social media",
    words: ["internet", "social media", "Facebook", "YouTube", "TikTok", "online", "digital", "cyber", "smartphone", "smartphones", "broadband"],
    prompts: [
      "Social media connects people but also spreads false news. Do the advantages outweigh the disadvantages?",
      "Should mobile phone and internet services be cheaper even if the government earns less money from them? Give your opinion.",
    ],
  },
  {
    label: "Space & science",
    words: ["outer space", "space agency", "space mission", "satellite", "rocket", "NASA", "scientists", "research", "researchers", "discovery", "species", "planet"],
    prompts: [
      "Is space exploration a good use of public money? Give your opinion.",
      "Some people think governments should spend more on scientific research, while others think the money is better spent on everyday needs. Discuss both views and give your opinion.",
    ],
  },

  // ---- Law & governance
  {
    label: "Prisons",
    words: ["prison", "prisons", "jail", "jails", "prisoner", "prisoners", "inmate", "inmates", "Kashimpur", "undertrial"],
    prompts: [
      "Is prison the best way to reform criminals, or are there better alternatives? Give your opinion.",
      "Prisoners should have the same right to healthcare as everyone else. To what extent do you agree or disagree?",
    ],
  },
  {
    label: "Courts & justice",
    words: ["court", "courts", "trial", "verdict", "judge", "judges", "bail", "charge sheet", "evidence", "lawyer", "lawyers", "tribunal", "case filed", "murder charge", "acquitted", "sentenced"],
    prompts: [
      "Some people say it is better for a guilty person to go free than for an innocent person to be punished. To what extent do you agree or disagree?",
      "Should court cases be decided faster, even if this means less time to examine the evidence? Give your opinion.",
    ],
  },
  {
    label: "Police & crime",
    words: ["police", "arrest", "arrested", "crime", "crimes", "criminal", "murder", "murdered", "killed", "robbery", "detained", "Detective Branch", "officers"],
    caps: ["DMP", "RAB", "DB", "CID"],
    prompts: [
      "How important is it for people to trust the police and the courts? What can build that trust?",
      "Some people believe strict laws and punishment are the best way to reduce crime. Others think education is more effective. Discuss both views and give your opinion.",
    ],
  },
  {
    label: "Protests & public order",
    words: ["protest", "protests", "protesters", "rally", "rallies", "blockade", "blockades", "hartal", "strike", "demonstration", "demonstrations"],
    prompts: [
      "Is public protest an effective way for ordinary people to bring about change? Give your opinion.",
      "Should governments be allowed to ban protests near important buildings such as parliament? Give your opinion.",
    ],
  },
  {
    label: "Elections & politics",
    words: ["election", "elections", "by-election", "vote", "votes", "voters", "voting", "polls", "parliament", "parliamentary", "candidate", "candidates", "campaign", "constituency", "Awami League", "Jamaat", "caucus"],
    caps: ["BNP", "MP", "MPs", "EC"],
    prompts: [
      "Some people think voting should be compulsory for all adults. To what extent do you agree or disagree?",
      "How important is it for political rivals to work together after an election? Give your opinion.",
    ],
  },
  {
    label: "Housing & cities",
    words: ["housing", "rent", "rents", "tenant", "tenants", "flat", "flats", "apartment", "slum", "colony", "colonies", "landlord", "urban"],
    prompts: [
      "What problems do people face when finding affordable housing in big cities, and how could these problems be solved?",
      "Should the government build more low-cost housing in big cities? Give your opinion.",
    ],
  },
  {
    label: "Traffic & transport",
    words: ["traffic", "metro", "metro rail", "bus", "buses", "road accident", "road accidents", "transport", "highway", "railway", "train", "trains", "congestion", "flyover", "expressway"],
    prompts: [
      "Traffic jams waste millions of hours in Dhaka every year. What are the causes, and what are the best solutions?",
      "Should private cars be banned from city centres to reduce traffic? Give your opinion.",
    ],
  },

  // ---- International
  {
    label: "Visas, borders & refugees",
    words: ["visa", "visas", "border", "borders", "refugee", "refugees", "asylum", "Rohingya", "deport", "deported", "citizenship", "immigration", "minority groups"],
    prompts: [
      "Should countries make it easier for people to travel and work abroad, or are strict visa rules necessary? Discuss both views and give your opinion.",
      "Rich countries should do more to help refugees. To what extent do you agree or disagree?",
    ],
  },
  {
    label: "War & weapons",
    words: ["war", "missile", "missiles", "drone", "drones", "attack", "attacks", "military", "troops", "weapons", "ceasefire", "conflict", "airstrike", "Patriot", "Houthis"],
    caps: ["NATO"],
    prompts: [
      "Is selling weapons to other countries ever justified? Give your opinion.",
      "Do international organisations such as the United Nations do enough to prevent wars? Give your opinion.",
    ],
  },
  {
    label: "World politics",
    words: ["midterm", "midterms", "president", "prime minister", "coalition", "White House", "Congress", "Netanyahu", "Trump", "Modi", "regime"],
    caps: ["US", "UK", "EU"],
    prompts: [
      "Why do elections in powerful countries such as the United States matter to people in other countries?",
      "Some people think their country should focus on its own problems rather than on events abroad. To what extent do you agree or disagree?",
    ],
  },
  {
    label: "Diplomacy",
    words: ["bilateral", "diplomatic", "diplomacy", "ambassador", "foreign minister", "foreign adviser", "summit", "agreement", "memorandum", "state visit"],
    caps: ["UN", "SAARC", "BIMSTEC", "ASEAN", "MoU"],
    prompts: ["How important is it for a country to have good relations with its neighbours? Give your opinion."],
  },

  // ---- Society
  {
    label: "Women & equality",
    words: ["women", "woman", "gender", "dowry", "child marriage", "female", "girls", "harassment", "violence against women"],
    prompts: [
      "What can be done to give women equal opportunities at work and in public life?",
      "Child marriage is still common in some areas. What are its causes, and how can it be stopped?",
    ],
  },
  {
    label: "Poverty",
    words: ["poor", "poverty", "social safety", "allowance", "hunger", "food aid", "extreme poverty", "Employment Generation Programme"],
    caps: ["EGPP", "VGF"],
    prompts: ["What is the best way to reduce poverty: giving money directly to poor families, or creating more jobs? Give your opinion."],
  },
  {
    label: "Media & free speech",
    words: ["journalist", "journalists", "press freedom", "newspaper", "newspapers", "media", "censorship", "free speech"],
    prompts: ["How important is a free press in a democracy? Give your opinion."],
  },
];

/** Prompts for each broad topic, used when no theme fits the story. */
const TOPIC_PROMPTS: Record<EnglishTopic, string[]> = {
  Education: ["Some people think public examinations are the fairest way to judge students, while others believe they put too much pressure on young people. Discuss both views and give your opinion."],
  Economy: ["Is economic growth more important than fair wages for workers? Give your opinion."],
  Environment: ["Some people think protecting the environment should come before economic development. To what extent do you agree or disagree?"],
  Health: ["Is it better to spend money on preventing illness or on treating it? Give your opinion."],
  Technology: ["Technology has made life easier, but some people think it has also created new problems. Discuss both views and give your opinion."],
  Science: ["Should young people be encouraged to choose science subjects at school and university? Why or why not?"],
  Governance: ["How important is it for people to trust the police and the courts? What can build that trust?"],
  International: ["Some people think their country should focus on its own problems rather than on events abroad. To what extent do you agree or disagree?"],
  Society: ["Some people think city life is better than village life, while others disagree. Discuss both views and give your opinion."],
  "Sport & Culture": ["Do international sporting events bring countries closer together? Give your opinion."],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
// One pattern per listed word, so "stocks" and "tech stocks" both count
const COMPILED = THEMES.map((t) => ({
  theme: t,
  patterns: [
    ...t.words.map((w) => new RegExp(`\\b${escape(w)}\\b`, "i")),
    ...(t.caps || []).map((w) => new RegExp(`\\b${escape(w)}\\b`)),
  ],
}));

/** How many of a theme's words appear in the text. */
const hits = (text: string, c: (typeof COMPILED)[number]) => c.patterns.filter((re) => re.test(text)).length;

export interface WritingTask {
  /** What the task is about, shown to the student ("Football", "Gold & prices") */
  theme: string;
  prompt: string;
}

/**
 * The writing task for a story: the theme whose words appear most in the headline
 * (counted three times) and the summary and key points, then one of its prompts
 * (always the same one for that story). Falls back to the broad topic.
 */
export function writingTaskFor(story: { id: string; title: string; summary?: string; keyTakeaways?: string[] }, topic: EnglishTopic): WritingTask {
  const body = [story.summary || "", ...(story.keyTakeaways || [])].join(" ");
  let best: { theme: Theme; score: number } | null = null;
  for (const c of COMPILED) {
    const score = hits(story.title, c) * 3 + hits(body, c);
    if (score > 0 && (!best || score > best.score)) best = { theme: c.theme, score };
  }
  if (best) return { theme: best.theme.label, prompt: best.theme.prompts[hash(story.id) % best.theme.prompts.length] };
  const list = TOPIC_PROMPTS[topic] ?? TOPIC_PROMPTS.Society;
  return { theme: topic, prompt: list[hash(story.id) % list.length] };
}

/** Word limits for the short task: about 4–5 sentences. */
export const WRITING_MIN_WORDS = 30;
export const WRITING_MAX_WORDS = 250;

export function wordCount(text: string): number {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}
