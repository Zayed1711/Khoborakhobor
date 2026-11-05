import fs from "fs";
import path from "path";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { isPublicHttpUrl, assertPublicHttpUrl } from "@/lib/url-safety";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { evaluateExamRelevance } from "@/lib/scraper/examFilter";
import { extractVocabularyTableRows } from "@/lib/vocabulary-table-engine";
import { cleanArticleBody, extractFacts, extractTakeaways, buildExtractiveQuiz, pickSummary } from "@/lib/study/extractive";

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KhoboraKhoborEdTechSpider/1.0 (+http://localhost:3000)",
  },
  timeout: 6000,
});

export interface NewspaperSource {
  name: string;
  feedUrl: string;
  categorySlug: string;
  examTrack: string;
  articleSelector?: string;
  dateFormat?: string;
  language?: "bn" | "en";
}

export interface CrawlLogEntry {
  id: string;
  timestamp: string;
  targetDate: string;
  language: string;
  category?: string;
  sourceName?: string;
  dryRun: boolean;
  sourcesProcessed: number;
  crawled: number;
  saved: number;
  skipped: number;
  dateMismatched: number;
  errors: number;
  durationMs: number;
  items: string[];
  status: "SUCCESS" | "WARNING" | "FAILED";
}

export interface SpiderOptions {
  targetDate?: string; // Format: "YYYY-MM-DD" (defaults to today)
  language?: "bn" | "en" | "all";
  categorySlug?: string;
  sourceName?: string;
  dryRun?: boolean;
  limitPerSource?: number;
}

const HISTORY_FILE = path.join(process.cwd(), "src/data/crawl_history.json");

/**
 * Retrieve crawl logs from JSON store
 */
export function getCrawlLogs(): CrawlLogEntry[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, "utf-8");
      return JSON.parse(data) as CrawlLogEntry[];
    }
  } catch (err) {
    console.error("Failed to read crawl history:", err);
  }
  return [];
}

/**
 * Persist a crawl log entry
 */
export function logCrawlRun(entry: CrawlLogEntry) {
  try {
    const logs = getCrawlLogs();
    logs.unshift(entry);
    const trimmed = logs.slice(0, 50); // Keep last 50 runs
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save crawl log:", err);
  }
}

/**
 * Parse CSV file into structured newspaper sources
 */
export function loadNewspaperRegistry(lang: "bn" | "en" | "all" = "all"): NewspaperSource[] {
  const sources: NewspaperSource[] = [];

  const filesToRead: { path: string; language: "bn" | "en" }[] = [];
  if (lang === "bn" || lang === "all") {
    filesToRead.push({
      path: path.join(process.cwd(), "src/data/sources/newspapers_bn.csv"),
      language: "bn",
    });
  }
  if (lang === "en" || lang === "all") {
    filesToRead.push({
      path: path.join(process.cwd(), "src/data/sources/newspapers_en.csv"),
      language: "en",
    });
  }

  for (const item of filesToRead) {
    if (fs.existsSync(item.path)) {
      const content = fs.readFileSync(item.path, "utf-8");
      const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

      // Skip header line (name,feed_url,...)
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts.length >= 4) {
          sources.push({
            name: parts[0].trim(),
            feedUrl: parts[1].trim(),
            categorySlug: parts[2].trim(),
            examTrack: parts[3].trim(),
            articleSelector: parts[4]?.trim() || "article",
            dateFormat: parts[5]?.trim() || "YYYY-MM-DD",
            language: item.language,
          });
        }
      }
    }
  }

  return sources;
}

/**
 * Add a new newspaper source to CSV registry
 */
export function addSourceToRegistry(source: {
  name: string;
  feedUrl: string;
  categorySlug: string;
  examTrack: string;
  language: "bn" | "en";
  articleSelector?: string;
  dateFormat?: string;
}): boolean {
  const fileName = source.language === "bn" ? "newspapers_bn.csv" : "newspapers_en.csv";
  const filePath = path.join(process.cwd(), "src/data/sources", fileName);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "name,feed_url,category_slug,exam_track,article_selector,date_format\n", "utf-8");
  }

  const existingContent = fs.readFileSync(filePath, "utf-8");
  if (existingContent.toLowerCase().includes(source.feedUrl.toLowerCase().trim())) {
    throw new Error("এই আরএসএস ফিড লিংকটি ইতিমধ্যেই তালিকায় বিদ্যমান রয়েছে।");
  }

  const cleanName = source.name.trim().replace(/,/g, " ");
  const cleanTrack = source.examTrack.trim().replace(/,/g, " ");
  const line = `${cleanName},${source.feedUrl.trim()},${source.categorySlug.trim()},${cleanTrack},${(source.articleSelector || "article").trim()},${(source.dateFormat || "YYYY-MM-DD").trim()}\n`;

  fs.appendFileSync(filePath, line, "utf-8");
  return true;
}

/**
 * Remove an existing newspaper source from CSV registry
 */
export function removeSourceFromRegistry(feedUrl: string, language: "bn" | "en"): boolean {
  const fileName = language === "bn" ? "newspapers_bn.csv" : "newspapers_en.csv";
  const filePath = path.join(process.cwd(), "src/data/sources", fileName);

  if (!fs.existsSync(filePath)) return false;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return false;

  const header = lines[0];
  const remaining = lines.slice(1).filter((l) => {
    const parts = l.split(",");
    return parts[1]?.trim() !== feedUrl.trim();
  });

  fs.writeFileSync(filePath, [header, ...remaining].join("\n") + "\n", "utf-8");
  return true;
}

/**
 * Robust Multi-Format RSS / Atom / REST JSON Feed Parser
 * Handles:
 * - Direct REST endpoints (Prothom Alo /api/v1/stories)
 * - Cheerio XML mode to strip inner HTML (solves The Daily Star <title><a> crashes)
 * - Fault-tolerant entity recovery (Financial Express unescaped &)
 * - Atom feeds with <entry> and <published>
 */
export async function parseRobustFeed(feedUrl: string, timeoutMs: number = 8000) {
  assertPublicHttpUrl(feedUrl);
  const res = await fetch(feedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KhoboraKhoborEdTechSpider/1.0 (+http://localhost:3000)",
      Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, application/json, */*",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const rawText = await res.text();

  // 1. JSON REST Endpoints (e.g. Prothom Alo /api/v1/stories)
  if (rawText.trim().startsWith("{") || feedUrl.includes("/api/v1/stories") || feedUrl.endsWith(".json")) {
    try {
      const json = JSON.parse(rawText);
      const stories = Array.isArray(json.stories) ? json.stories : (Array.isArray(json) ? json : []);
      const items = stories.map((s: any) => {
        const pubTime = s["published-at"] || s["last-published-at"];
        const pubDate = pubTime
          ? new Date(typeof pubTime === "number" ? pubTime : pubTime).toISOString()
          : new Date().toISOString();
        let link = s.url || "";
        if (!link && s.slug) {
          link = s.slug.startsWith("http")
            ? s.slug
            : (feedUrl.includes("en.prothomalo.com") ? `https://en.prothomalo.com/${s.slug}` : `https://www.prothomalo.com/${s.slug}`);
        }
        return {
          title: s.headline || s.title || "",
          link,
          pubDate,
          isoDate: pubDate,
          summary: s.subheadline || "",
          content: s.subheadline || "",
          categories: Array.isArray(s.sections)
            ? s.sections.map((sec: any) => sec.name || sec["display-name"] || sec.slug)
            : [],
        };
      });
      return {
        title: "Prothom Alo JSON Stories Feed",
        description: "REST Stories Feed",
        items,
      };
    } catch (e: any) {
      console.warn("JSON parse error:", e.message);
    }
  }

  // 2. Cheerio XML Parsing (Eliminates object-to-primitive error on The Daily Star)
  try {
    const $ = cheerio.load(rawText, { xmlMode: true });
    const feedTitle = $("channel > title, feed > title").first().text().trim() || "Unknown Feed";
    const feedDesc = $("channel > description, feed > subtitle").first().text().trim() || "";
    const channelDate =
      $("channel > lastBuildDate, channel > pubDate, feed > updated").first().text().trim() ||
      new Date().toISOString();

    const xmlItems: any[] = [];
    const elements = $("item, entry");

    if (elements.length > 0) {
      elements.each((_, el) => {
        const node = $(el);
        const title = node.find("title").text().trim();
        let link = node.find("link").text().trim();
        if (!link) {
          link = node.find("link").attr("href") || node.find("guid").text().trim() || "";
        }
        const rawDate =
          node.find("pubDate").text().trim() ||
          node.find("dc\\:date").text().trim() ||
          node.find("published").text().trim() ||
          node.find("updated").text().trim() ||
          channelDate;

        let isoDate: string | undefined;
        try {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            isoDate = parsed.toISOString();
          }
        } catch {}

        const summary = node.find("description").text().trim() || node.find("summary").text().trim();
        const contentEncoded = node.find("content\\:encoded").text().trim() || node.find("content").text().trim();
        const enclosureUrl =
          node.find("enclosure").attr("url") ||
          node.find("media\\:content").attr("url") ||
          node.find("media\\:thumbnail").attr("url");

        if (title && (link || summary)) {
          xmlItems.push({
            title,
            link,
            pubDate: rawDate,
            isoDate: isoDate || (rawDate ? new Date().toISOString() : undefined),
            summary,
            content: contentEncoded || summary,
            "content:encoded": contentEncoded,
            enclosure: enclosureUrl ? { url: enclosureUrl } : undefined,
          });
        }
      });

      if (xmlItems.length > 0) {
        return {
          title: feedTitle,
          description: feedDesc,
          items: xmlItems,
        };
      }
    }
  } catch (err: any) {
    console.warn(`Cheerio XML parsing failed for ${feedUrl}:`, err.message);
  }

  // 3. Fallback to rss-parser string parsing
  try {
    const feed = await parser.parseString(rawText);
    return {
      title: feed.title || "Feed",
      description: feed.description || "",
      items: feed.items || [],
    };
  } catch (err: any) {
    // 4. Final attempt: standard parser.parseURL
    const feed = await parser.parseURL(feedUrl);
    return {
      title: feed.title || "Feed",
      description: feed.description || "",
      items: feed.items || [],
    };
  }
}

/**
 * Test an RSS feed endpoint to verify live health and structure
 */
export async function testFeedSource(feedUrl: string) {
  try {
    const feed = await parseRobustFeed(feedUrl, 10000);
    return {
      success: true,
      title: feed.title || "Unknown Feed Title",
      description: feed.description || "",
      itemCount: feed.items?.length || 0,
      latestItemDate: feed.items?.[0]?.pubDate || feed.items?.[0]?.isoDate || "N/A",
      sampleTitles: (feed.items || []).slice(0, 3).map((it: any) => it.title || "Untitled"),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to reach or parse RSS feed.",
    };
  }
}

// Student Conceptual Dictionary for automatic vocabulary tagging
const VOCABULARY_DICTIONARY: Record<string, string> = {
  "মুদ্রানীতি": "দেশের অর্থ সরবরাহ, সুদের হার ও ঋণের প্রবাহ নিয়ন্ত্রণ করে মূল্যস্ফীতি নিয়ন্ত্রণের কৌশল।",
  "মুদ্রাস্ফীতি": "একটি নির্দিষ্ট সময় ধরে সাধারণ পণ্য ও সেবার মূল্যস্তর ক্রমাগত বৃদ্ধি পাওয়া।",
  "রেপো রেট": "যে সুদের হারে বাণিজ্যিক ব্যাংকগুলো কেন্দ্রীয় ব্যাংক থেকে সাময়িক ঋণ গ্রহণ করে।",
  "কৃত্রিম বুদ্ধিমত্তা": "কম্পিউটার সিস্টেম দ্বারা মানুষের মতো যুক্তি ও বিশ্লেষণ সম্পন্ন করার প্রযুক্তি।",
  "জলবায়ু পরিবর্তন": "দীর্ঘমেয়াদে পৃথিবীর তাপমাত্রা ও আবহাওয়া বিন্যাসের সামগ্রিক রূপান্তর।",
  "সার্বভৌম বন্ড": "কোনো সার্বভৌম সরকার কর্তৃক বিদেশি বা দেশি উৎস থেকে অর্থ সংগ্রহে ইস্যুকৃত ঋণপত্র।",
  "জিডিপি (GDP)": "একটি নির্দিষ্ট অর্থবছরে একটি দেশের ভৌগোলিক সীমানার মধ্যে উৎপাদিত চূড়ান্ত পণ্য ও সেবার মোট আর্থিক মূল্য।",
  "নবায়নযোগ্য শক্তি": "এমন শক্তির উৎস যা ব্যবহারের সাথে সাথে নিঃশেষ হয় না, যেমন সৌর ও বায়ুবিদ্যুৎ।",
  "অটোমেশন": "মানুষের প্রত্যক্ষ হস্তক্ষেপ ছাড়া স্বয়ংক্রিয় ব্যবস্থা বা সফটওয়্যারের সাহায্যে কার্যক্রম পরিচালনা।",
  "inflation": "A sustained increase in the general price level of goods and services in an economy.",
  "monetary policy": "Policy adopted by the central bank to control either the interest rate or money supply.",
  "gdp": "Gross Domestic Product: total monetary value of all finished goods and services produced within a country.",
  "artificial intelligence": "The simulation of human intelligence processes by machines and computer systems.",
};

// Explicit Document Traversal rules (Semantic Content Selectors for Top Bangladeshi & International Portals)
export const PORTAL_CONFIGS: Record<
  string,
  {
    title_selectors: string[];
    body_selectors: string[];
  }
> = {
  "prothomalo.com": {
    title_selectors: ["h1.title", "h1", ".story-title"],
    body_selectors: [".story-element-text", ".article-content", "article", ".story-contents"],
  },
  "thedailystar.net": {
    title_selectors: ["h1.article-title", "h1", "h1.page-title"],
    body_selectors: [".field-name-body", ".field--name-body", ".sb-story-text", ".article-content", "article .field-body", ".story-text", "article"],
  },
  "tbsnews.net": {
    title_selectors: ["h1.page-header", "h1"],
    body_selectors: [".field-name-body", ".section-content", ".article-content", "article"],
  },
  "bdnews24.com": {
    title_selectors: ["h1", ".customStoryHead"],
    body_selectors: [".story-body", "#article_body", ".article-details"],
  },
  "dhakatribune.com": {
    title_selectors: ["h1.title", "h1", "h1.headline"],
    body_selectors: [".story-element-text", ".article-content", ".report-content", ".content-details", "article"],
  },
  "jagonews24.com": {
    title_selectors: ["h1", ".news-details h1", ".details-title"],
    body_selectors: [".news-details-content", ".content-details", ".news-content", "article"],
  },
  "bd-pratidin.com": {
    title_selectors: ["h1", "h2.title"],
    body_selectors: ["#article-details", ".article-content", "article"],
  },
  "jugantor.com": {
    title_selectors: ["h1", ".news-title"],
    body_selectors: [".news-details-text", "#news-details", "article"],
  },
  "banglanews24.com": {
    title_selectors: ["h1", ".news-title"],
    body_selectors: [".news-details", "article", "#news-body"],
  },
  "thefinancialexpress.com.bd": {
    title_selectors: ["h1", ".story-title"],
    body_selectors: [".story-body", ".article-content", "article"],
  },
  "newagebd.net": {
    title_selectors: ["h1", ".article-title"],
    body_selectors: [".article-text", ".story-text", "article"],
  },
  "bbc.com": {
    title_selectors: ["h1", "#main-heading", ".bbc-1151fp7"],
    body_selectors: ["main[role='main']", "article", "[data-component='text-block']", ".bbc-1151fp7"],
  },
  "bbc.co.uk": {
    title_selectors: ["h1", "#main-heading", ".bbc-1151fp7"],
    body_selectors: ["main[role='main']", "article", "[data-component='text-block']", ".bbc-1151fp7"],
  },
  "ittefaq.com.bd": {
    title_selectors: ["h1", "h1.title", ".news-title"],
    body_selectors: [".jw_article_body", ".news-details-content", ".article-content", "article"],
  },
  "samakal.com": {
    title_selectors: ["h1", ".detail-title"],
    body_selectors: [".description", ".news-content", "article"],
  },
};

function identifyPortalConfig(url: string) {
  const lower = url.toLowerCase();
  for (const [domain, config] of Object.entries(PORTAL_CONFIGS)) {
    if (lower.includes(domain)) {
      return config;
    }
  }
  return null;
}

/**
 * Executes high-fidelity HTTP GET request with standard browser signature and domain-specific semantic selectors
 */
export async function fetchAndParseArticlePage(
  url?: string,
  fallbackRawHtml?: string
): Promise<{ cleanContent: string; headline?: string; imageUrl?: string }> {
  if (!url || !isPublicHttpUrl(url)) {
    return parseHtmlContent(fallbackRawHtml || "");
  }

  const config = identifyPortalConfig(url);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return parseHtmlContent(fallbackRawHtml || "");
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Scrub dynamic scripts, styles, frames, headers, footers, navs
    $("script, style, iframe, noscript, header, footer, nav, .ads, .social-share").remove();

    const firstImg =
      $("meta[property='og:image']").attr("content") ||
      $("article img").first().attr("src") ||
      $("img").first().attr("src");

    // 1. Headline Extraction Block
    let headline: string | undefined;
    if (config?.title_selectors) {
      for (const sel of config.title_selectors) {
        const text = $(sel).first().text().trim();
        if (text && text.length > 5) {
          headline = text;
          break;
        }
      }
    }

    // 2. Body Text Extraction & Boilerplate Filtering
    const paragraphs: string[] = [];
    const isBoilerplate = (text: string) =>
      text.startsWith("©") ||
      text.startsWith("Share") ||
      text.startsWith("Follow us") ||
      text.startsWith("jwARI.") ||
      text.includes("বিজ্ঞাপন") ||
      text.includes("Advertisement") ||
      text.includes("আরও পড়ুন") ||
      text.length < 20;

    let bodyFound = false;

    if (config?.body_selectors) {
      for (const sel of config.body_selectors) {
        const matching = $(sel);
        if (matching.length > 0) {
          const pElements = matching.find("p");
          if (pElements.length > 0) {
            pElements.each((_, el) => {
              const text = $(el).text().trim();
              if (!isBoilerplate(text)) {
                paragraphs.push(`<p>${text}</p>`);
              }
            });
            if (paragraphs.length > 0) {
              bodyFound = true;
              break;
            }
          } else {
            matching.each((_, el) => {
              const text = $(el).text().trim();
              if (!isBoilerplate(text)) {
                paragraphs.push(`<p>${text}</p>`);
              }
            });
            if (paragraphs.length > 0) {
              bodyFound = true;
              break;
            }
          }
        }
      }
    }

    // Universal Fallback if specialized classes missed the content
    if (!bodyFound || paragraphs.length === 0) {
      $("p").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 35 && !isBoilerplate(text)) {
          paragraphs.push(`<p>${text}</p>`);
        }
      });
    }

    if (paragraphs.length > 0) {
      return {
        cleanContent: paragraphs.join("\n"),
        headline,
        imageUrl: firstImg,
      };
    }
  } catch (err: any) {
    console.warn(`[Spider Page Parser] Failed to fetch article body from ${url}:`, err.message);
  }

  // Graceful fallback to RSS item content
  return parseHtmlContent(fallbackRawHtml || "");
}

function parseHtmlContent(rawHtml: string): { cleanContent: string; imageUrl?: string } {
  if (!rawHtml) return { cleanContent: "" };

  const $ = cheerio.load(rawHtml);
  const firstImg = $("img").first().attr("src");

  $("script, style, iframe, noscript, .ads, .social-share").remove();

  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20 && !text.includes("বিজ্ঞাপন") && !text.includes("Advertisement")) {
      paragraphs.push(`<p>${text}</p>`);
    }
  });

  const cleanContent =
    paragraphs.length > 0
      ? paragraphs.join("\n")
      : `<p>${$.text().trim().slice(0, 800)}</p>`;

  return { cleanContent, imageUrl: firstImg };
}

function isBengaliText(str: string): boolean {
  return /[\u0980-\u09FF]/.test(str);
}

function cleanJournalisticNoise(text: string): string {
  return text
    .replace(/(?:অর্থাৎ\s+)?(?:গতকাল|আজ|গত)\s+(?:সোমবার|মঙ্গলবার|বুধবার|বৃহস্পতিবার|শুক্রবার|শনিবার|রবিবার)(?:\s+থেকে\s+[^\s।]+)?/gi, "")
    .replace(/(?:সকাল|দুপুর|বিকাল|সন্ধ্যা|রাত)\s+(?:[০-৯0-9]+(?::[০-৯0-9]+)?(?:\s*টার)?(?:\s*দিকে)?)/gi, "")
    .replace(/(?:আমাদের\s+প্রতিনিধি|নিজস্ব\s+প্রতিবেদক|বিশেষ\s+সংবাদদাতা|অনলাইন\s+ডেস্ক|বার্তা\s+সংস্থা)[^।\n]*[।:]/gi, "")
    .replace(/(?:জানা\s+গেছে|জানা\s+যায়|সূত্র\s+জানায়|তিনি\s+বলেন|তিনি\s+আরো\s+বলেন|তিনি\s+দাবি\s+করেন|উল্লেখ\s+করেন|ঘোষণা\s+করেন)\s*[,:]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Intelligent Academic Overview & Key Takeaway Generator
 * Synthesizes 3 coherent analytical takeaways (Overview, Context & Driver, Exam Relevance)
 * instead of raw fragmented sentences chopped from the article body.
 */
export function extractStudentTakeaways(
  title: string,
  contentText: string,
  categoryName: string = "জাতীয় পরিক্রমা"
): string[] {
  const isBn = isBengaliText(title + " " + contentText);
  const plainText = contentText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  if (isBn) {
    const cleanedText = cleanJournalisticNoise(plainText);

    // Extract high-quality candidate statements
    const candidates = cleanedText
      .split(/[।!?\n]/)
      .map((s) => s.trim())
      .filter((s) => {
        if (s.length < 30 || s.length > 220) return false;
        if (/^(ছবি|ফাইল ছবি|ভিডিও|বিজ্ঞাপন|সূত্র|সম্পাদনা|বিজ্ঞপ্তি|প্রতিবেদন|এসব)/.test(s)) return false;
        return true;
      });

    const cleanTitle = title.replace(/\s*:\s*/g, " — ").trim();

    // 1. Executive Overview / সারসংক্ষেপ ও মূল চিত্র
    let coreSummary = "";
    if (candidates.length > 0) {
      const firstCandidate = candidates[0];
      if (firstCandidate.length > 35) {
        coreSummary = firstCandidate;
      }
    }
    const bullet1 = coreSummary && !coreSummary.includes(cleanTitle.slice(0, 15))
      ? `মূল সারসংক্ষেপ: ${cleanTitle}। এর মূল চিত্র হলো— ${coreSummary}।`
      : `মূল সারসংক্ষেপ: ${cleanTitle}— সংশ্লিষ্ট খাতের নীতি ও সামগ্রিক পরিস্থিতির ওপর এটি একটি তাৎপর্যপূর্ণ ঘটনা।`;

    // 2. Context & Driver / প্রেক্ষাপট ও মূল কার্যকারণ
    let contextPoint = "";
    for (let i = 1; i < candidates.length; i++) {
      const s = candidates[i];
      if (
        /(কারণ|ফলে|উদ্যোগ|সিদ্ধান্ত|চুক্তি|সংকট|ঘাটতি|উদ্বৃত্ত|বৃদ্ধি|হ্রাস|দাবি|অভিযোগ|পদক্ষেপ|সুপারিশ|পরিকল্পনা|প্রভাব|ব্যবস্থা|নির্দেশ)/.test(
          s
        )
      ) {
        contextPoint = s;
        break;
      }
    }
    if (!contextPoint && candidates.length > 1) {
      contextPoint = candidates[1];
    }
    const bullet2 = contextPoint
      ? `প্রেক্ষাপট ও কার্যকারণ: ${contextPoint}।`
      : `মূল প্রেক্ষিত: এই ঘটনাটি সংশ্লিষ্ট নীতি বাস্তবায়নে ও প্রাতিষ্ঠানিক প্রক্রিয়ায় নতুন আলোচনার সৃষ্টি করেছে।`;

    // 3. Exam & Academic Insight / পরীক্ষার প্রস্তুতি ও শিক্ষণীয় দৃষ্টিকোণ
    let bullet3 = "";
    const lowerCat = (categoryName || "").toLowerCase();

    if (lowerCat.includes("অর্থনীতি") || lowerCat.includes("বাণিজ্য")) {
      bullet3 = "পরীক্ষার প্রস্তুতিতে গুরুত্ব: সামষ্টিক অর্থনীতি, মুদ্রানীতি, মূল্যস্ফীতি ও রাজস্ব ব্যবস্থাপনা অংশে প্রশ্ন ও ফোকাস রাইটিংয়ের জন্য এই তথ্যটি বিশেষভাবে গুরুত্বপূর্ণ।";
    } else if (lowerCat.includes("আন্তর্জাতিক")) {
      bullet3 = "পরীক্ষার প্রস্তুতিতে গুরুত্ব: আন্তর্জাতিক সম্পর্ক, দ্বিপাক্ষিক কূটনীতি, বিশ্ব পরাশক্তি সমীকরণ ও বহুপাক্ষিক ফোরাম বিশ্লেষণে এ জাতীয় উন্নয়ন নিয়মিত আলোচনায় আসে।";
    } else if (lowerCat.includes("রাজনীতি") || lowerCat.includes("সুশাসন") || lowerCat.includes("জাতীয়")) {
      bullet3 = "পরীক্ষার প্রস্তুতিতে গুরুত্ব: শাসনব্যবস্থা, প্রাতিষ্ঠানিক জবাবদিহিতা, নির্বাচন ও সাংবিধানিক কাঠামো সংক্রান্ত সাধারণ জ্ঞান ও লিখিত পরীক্ষার জন্য তথ্যটি সহায়ক।";
    } else if (lowerCat.includes("বিজ্ঞান") || lowerCat.includes("প্রযুক্তি")) {
      bullet3 = "পরীক্ষার প্রস্তুতিতে গুরুত্ব: তথ্যপ্রযুক্তি, উদ্ভাবন, কৃত্রিম বুদ্ধিমত্তা ও আধুনিক বিজ্ঞানের সমসাময়িক আবিষ্কার বিষয়ক অংশে ধারণাটি অত্যন্ত সহায়ক।";
    } else if (lowerCat.includes("জীবনযাপন") || lowerCat.includes("শিক্ষা")) {
      bullet3 = "শিক্ষণীয় দৃষ্টিভঙ্গি: জনস্বাস্থ্য, পরিবেশগত সচেতনতা ও শিক্ষানীতির সমসাময়িক সংস্কার পর্যালোচনায় শিক্ষার্থীদের জন্য এই বিষয়বস্তু শিক্ষণীয়।";
    } else if (lowerCat.includes("খেলাধুলা")) {
      bullet3 = "সাধারণ জ্ঞান আপডেট: জাতীয় ও বৈশ্বিক ক্রীড়াঙ্গনের সাম্প্রতিক রেকর্ড, চ্যাম্পিয়নশিপ ও টুর্নামেন্ট ফলাফলের সমসাময়িক সাধারণ জ্ঞান আপডেট।";
    } else {
      bullet3 = "শিক্ষণীয় অন্তর্দৃষ্টি: সমসাময়িক ঘটনাবলি ও বিশ্লেষণধর্মী মতামত রচনার ক্ষেত্রে শিক্ষার্থীদের জন্য এই প্রতিবেদনটি সমৃদ্ধ রেফারেন্স হিসেবে উপযোগী।";
    }

    return [bullet1, bullet2, bullet3];
  } else {
    // English Synthesis
    const enCandidates = plainText
      .split(/[.!?\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 35 && s.length < 220);

    const cleanTitle = title.trim();
    const lead = enCandidates.length > 0 ? enCandidates[0] : "";

    const b1 = lead && !lead.includes(cleanTitle.slice(0, 15))
      ? `Executive Overview: ${cleanTitle}. Key context: ${lead}.`
      : `Executive Overview: ${cleanTitle} represents a significant ongoing development.`;

    let context = "";
    for (let i = 1; i < enCandidates.length; i++) {
      const s = enCandidates[i];
      if (/(because|due to|resulted|initiated|decision|agreement|crisis|deficit|growth|policy|impact)/i.test(s)) {
        context = s;
        break;
      }
    }
    if (!context && enCandidates.length > 1) {
      context = enCandidates[1];
    }
    const b2 = context
      ? `Key Driver & Context: ${context}.`
      : `Key Driver & Context: The reported events carry notable implications for the sector and ongoing policy planning.`;

    const b3 = "Exam & Analytical Relevance: Crucial reference for competitive examination essays, analytical comprehension, and contemporary global affairs.";

    return [b1, b2, b3];
  }
}

function extractVocabulary(text: string): { term: string; definition: string; context: string }[] {
  const matchedTerms: { term: string; definition: string; context: string }[] = [];
  const lower = text.toLowerCase();

  for (const [term, def] of Object.entries(VOCABULARY_DICTIONARY)) {
    if (lower.includes(term.toLowerCase())) {
      matchedTerms.push({
        term,
        definition: def,
        context: `প্রবন্ধের প্রাসঙ্গিক ধারণাগত শব্দ: "${term}"`,
      });
      if (matchedTerms.length >= 2) break;
    }
  }

  return matchedTerms;
}

const CATEGORY_EDITORIAL_IMAGES: Record<string, string> = {
  national: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
  world: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
  economy: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  tech: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  entertainment: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  opinion: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
  politics: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
  "exam-prep": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
  sports: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
  lifestyle: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
};

export function detectCategorySlug(item: any, fallbackSlug: string): string {
  const link = (item.link || "").toLowerCase();
  const cats = (item.categories || []).map((c: any) => String(c).toLowerCase()).join(" ");

  if (link.includes("/world/") || link.includes("/middle-east/") || link.includes("/international/") || cats.includes("আন্তর্জাতিক") || cats.includes("মধ্যপ্রাচ্য")) {
    return "world";
  }
  if (link.includes("/business/") || link.includes("/economy/") || link.includes("/banking/") || cats.includes("অর্থনীতি") || cats.includes("বাণিজ্য") || cats.includes("শেয়ার")) {
    return "economy";
  }
  if (link.includes("/technology/") || link.includes("/tech/") || link.includes("/science/") || cats.includes("প্রযুক্তি") || cats.includes("বিজ্ঞান")) {
    return "tech";
  }
  if (link.includes("/opinion/") || link.includes("/editorial/") || cats.includes("মতামত") || cats.includes("সম্পাদকীয়")) {
    return "opinion";
  }
  if (link.includes("/politics/") || cats.includes("রাজনীতি")) {
    return "politics";
  }
  if (link.includes("/sports/") || link.includes("/cricket/") || cats.includes("খেলা") || cats.includes("ক্রিকেট")) {
    return "sports";
  }
  if (link.includes("/entertainment/") || link.includes("/cinema/") || link.includes("/books/") || cats.includes("বিনোদন") || cats.includes("সাহিত্য") || cats.includes("চলচ্চিত্র")) {
    return "entertainment";
  }
  if (link.includes("/education/") || link.includes("/chakri/") || cats.includes("শিক্ষা") || cats.includes("চাকরি") || cats.includes("বিসিএস")) {
    return "exam-prep";
  }
  return fallbackSlug || "national";
}


function extractSafeFeedTitle(raw: any): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") {
    if (typeof raw._ === "string") return raw._.trim();
    if (Array.isArray(raw.a) && raw.a[0]) {
      const firstA = raw.a[0];
      if (typeof firstA === "string") return firstA.trim();
      if (typeof firstA?._ === "string") return firstA._.trim();
    }
    if (typeof raw.a === "string") return raw.a.trim();
    if (typeof (raw as any)?.a?._ === "string") return (raw as any).a._.trim();
  }
  return String(raw?.title || "").trim();
}

/**
 * Check if article pubDate matches target date (YYYY-MM-DD), 7days, or any date ("all")
 */
function isDateMatching(pubDateStr?: string, targetDateStr?: string): boolean {
  // If targetDate is "all" or omitted, match articles from any date without restriction
  if (!targetDateStr || targetDateStr === "all") return true;
  if (!pubDateStr) return true;

  try {
    const pubDate = new Date(pubDateStr);
    if (isNaN(pubDate.getTime())) return true;

    // Past 7-day range matching
    if (targetDateStr === "7days" || targetDateStr === "last7days") {
      const now = new Date();
      const diffDays = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= -1 && diffDays <= 7;
    }

    const targetDate = new Date(targetDateStr);
    if (isNaN(targetDate.getTime())) return true;

    const exactMatch =
      pubDate.getFullYear() === targetDate.getFullYear() &&
      pubDate.getMonth() === targetDate.getMonth() &&
      pubDate.getDate() === targetDate.getDate();

    if (exactMatch) return true;

    // Also match within 36 hours for timezone shifts
    const diffHours = Math.abs(pubDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60);
    return diffHours <= 36;
  } catch {
    return true;
  }
}

/**
 * Helper to fetch a single newspaper RSS/JSON feed with a strict 6-second timeout
 */
async function fetchFeedForSource(source: NewspaperSource): Promise<{ source: NewspaperSource; items: any[]; error?: string }> {
  try {
    console.log(`[FEED] Fetching: ${source.name} [${source.feedUrl}]`);
    const feed = await parseRobustFeed(source.feedUrl, 6000);
    return { source, items: feed.items || [] };
  } catch (err: any) {
    console.warn(`Could not crawl ${source.name}: ${err.message}`);
    return { source, items: [], error: err.message };
  }
}

/**
 * Run News Spider with Date Filter, Category Filter, and Dry-Run support
 */
export async function runNewsSpiderWithDateFilter(options?: SpiderOptions) {
  const startTime = Date.now();
  const targetDate = options?.targetDate || new Date().toISOString().split("T")[0];
  const language = options?.language || "all";
  const categorySlug = options?.categorySlug;
  const sourceName = options?.sourceName;
  const dryRun = Boolean(options?.dryRun);
  const limitPerSource = options?.limitPerSource || 15;

  console.log(`[SPIDER] Run: Date=${targetDate}, Lang=${language}, DryRun=${dryRun}`);

  let sources = loadNewspaperRegistry(language);

  if (categorySlug && categorySlug !== "all") {
    sources = sources.filter((s) => s.categorySlug === categorySlug);
  }

  if (sourceName && sourceName !== "all") {
    sources = sources.filter((s) => s.name.toLowerCase().includes(sourceName.toLowerCase()));
  }

  console.log(`Targeting ${sources.length} sources.`);

  const results = {
    targetDate,
    sourcesCount: sources.length,
    crawled: 0,
    saved: 0,
    skipped: 0,
    filteredExamNoise: 0,
    dateMismatched: 0,
    errors: 0,
    dryRun,
    items: [] as string[],
    durationMs: 0,
  };

  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  // Process sources in concurrent batches of 4 to maximize throughput and minimize latency
  const BATCH_SIZE = 4;
  for (let b = 0; b < sources.length; b += BATCH_SIZE) {
    if (Date.now() - startTime > 55000) {
      console.log(`[SPIDER] 55s execution safety threshold reached before batch ${b}.`);
      break;
    }

    const batchSources = sources.slice(b, b + BATCH_SIZE);
    const feedResults = await Promise.all(batchSources.map((s) => fetchFeedForSource(s)));

    for (const { source, items: feedItems, error } of feedResults) {
      if (error) {
        results.errors++;
        continue;
      }

      let countFromThisSource = 0;

      for (const item of feedItems) {
        if (Date.now() - startTime > 55000) {
          console.log(`[SPIDER] 55s hard deadline reached inside article loop.`);
          break;
        }

        if (countFromThisSource >= limitPerSource) break;

        results.crawled++;
        const title = extractSafeFeedTitle(item.title);
        if (!title) continue;
        // Link-out model: readers open the full story at the publisher, so a story
        // without its own link cannot be offered.
        if (!item.link || !isPublicHttpUrl(item.link)) {
          results.skipped++;
          continue;
        }

        // Check date match
        if (!isDateMatching(item.pubDate || item.isoDate, targetDate)) {
          results.dateMismatched++;
          continue;
        }

        const rawSlug = title
          .toLowerCase()
          .replace(/[^\w\u0980-\u09FF]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50);

        // Deduplication check
        const existing = await prisma.article.findFirst({
          where: {
            OR: [{ slug: { startsWith: rawSlug } }, { title }],
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        const targetCategorySlug = detectCategorySlug(item, source.categorySlug);
        const categoryId = catMap.get(targetCategorySlug) || catMap.get(source.categorySlug) || categories[0]?.id;
        if (!categoryId) continue;

        const currentCategory = categories.find((c) => c.id === categoryId);
        const categoryName = currentCategory?.name || "জাতীয় পরিক্রমা";

        const rawContent = item["content:encoded"] || item.content || item.summary || "";

        // Exam Relevance Gatekeeper: Filter out sensational crimes, petty domestic disputes, gossip
        // Prioritize written essay preparation: road safety surveys, macro reports, sports awards
        const relevance = evaluateExamRelevance(title, rawContent, targetCategorySlug);
        if (!relevance.isRelevant) {
          console.log(`[EXAM FILTER SKIPPED] "${title.slice(0, 48)}" -> ${relevance.reason}`);
          results.filteredExamNoise++;
          results.skipped++;
          continue;
        }
        
        // High-fidelity extraction: Always attempt to fetch full web page if item.link is available,
        // ensuring articles have complete 6-15 paragraphs rather than 2-line RSS teasers.
        let cleanContent = "";
        let imageUrl: string | undefined;

        if (item.link) {
          const pageParsed = await fetchAndParseArticlePage(item.link, rawContent);
          if (pageParsed.cleanContent && pageParsed.cleanContent.length > (rawContent.length || 0)) {
            cleanContent = pageParsed.cleanContent;
            imageUrl = pageParsed.imageUrl;
          } else if (pageParsed.cleanContent && pageParsed.cleanContent.length >= 400) {
            cleanContent = pageParsed.cleanContent;
            imageUrl = pageParsed.imageUrl;
          } else {
            const parsed = parseHtmlContent(rawContent);
            cleanContent = parsed.cleanContent;
            imageUrl = pageParsed.imageUrl || parsed.imageUrl;
          }
        } else {
          const parsed = parseHtmlContent(rawContent);
          cleanContent = parsed.cleanContent;
          imageUrl = parsed.imageUrl;
        }

        // Drop publisher chrome (share prompts, copyright lines) and repeated paragraphs.
        // Short stories are skipped below, never padded with invented text.
        const cleaned = cleanArticleBody(cleanContent);
        cleanContent = cleaned.html;
        const bodyText = cleaned.paragraphs.join(" ");

        // Quality Gate: Ensure article has sufficient analytical depth (> 250 characters of text)
        const pureText = bodyText;
        if (pureText.length < 250) {
          console.log(`[SQA GATEKEEPER] Skipped shallow news with only ${pureText.length} chars: "${title.slice(0, 45)}"`);
          results.skipped++;
          continue;
        }

        // Deep Exam Relevance Gatekeeper: re-check after extracting full article body
        const deepRelevance = evaluateExamRelevance(title, cleanContent, targetCategorySlug);
        if (!deepRelevance.isRelevant) {
          console.log(`[DEEP EXAM FILTER SKIPPED] "${title.slice(0, 48)}" -> ${deepRelevance.reason}`);
          results.filteredExamNoise++;
          results.skipped++;
          continue;
        }

        // Never publisher chrome such as "আরও পড়ুন..."; falls back to the story's first paragraph
        const summary = pickSummary(item.contentSnippet || "", cleaned.paragraphs);

        // Study material is quoted from the article itself (src/lib/study/extractive.ts)
        const takeaways = extractTakeaways(title, summary, bodyText);
        const factTable = extractFacts(title, bodyText);
        const extractiveQuiz = buildExtractiveQuiz(title, bodyText);
        const isEnglishNews = !isBengaliText(title);
        let vocabList: { term: string; definition: string; context?: string | null }[] = [];
        let quizList: { question: string; options: string[]; correctOption: number; explanation?: string; sourceSentence?: string }[] = [];

        if (isEnglishNews) {
          const vocabRows = extractVocabularyTableRows(title, cleanContent || summary);
          vocabList = vocabRows.map((r) => ({
            term: `${r.word} [${r.banglaPhonetic}]`,
            definition: `${r.banglaMeaning} | ${r.englishDefinition}`,
            context: r.freshExampleEn,
          }));
        } else {
          vocabList = extractVocabulary(title + " " + bodyText);
        }
        // No quiz is better than an unrelated one: only add it when a real sentence supports it
        quizList = extractiveQuiz ? [extractiveQuiz] : [];


        // Only the publisher's own image; no stock photo that looks like it shows this event.
        // An empty value makes the UI show a plain category placeholder instead.
        const featuredImg =
          imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
            ? imageUrl
            : item.enclosure?.url && /^https?:///.test(item.enclosure.url)
            ? item.enclosure.url
            : "";

        const finalSlug = `${rawSlug}-${Math.floor(Math.random() * 900 + 100)}`;

        if (!dryRun) {
          const existingLead = await prisma.article.findFirst({ where: { isLead: true } });
          const isLead = !existingLead && results.saved === 0;

          let articlePublishedDate = new Date();
          if (item.pubDate || item.isoDate) {
            const parsed = new Date(item.pubDate || item.isoDate);
            if (!isNaN(parsed.getTime())) {
              articlePublishedDate = parsed;
            }
          }

          const savedArticle = await prisma.article.create({
            data: {
              slug: finalSlug,
              title,
              summary,
              // Link-out model: the publisher's full text is read to build the study
              // material above but is not stored or republished.
              content: "",
              keyTakeaways: JSON.stringify(takeaways),
              factTable: JSON.stringify(factTable),
              sourceName: source.name,
              sourceUrl: item.link || null,
              // The old exam-track strings were the same on most stories, so they carried no information
              examTags: null,
              contentOrigin: "scraped",
              featuredImage: featuredImg,
              imageCaption: `উৎস: ${source.name} • বিভাগ: ${categoryName}`,
              publishedAt: articlePublishedDate.toLocaleDateString("bn-BD", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              createdAt: articlePublishedDate,
              readTime: `${Math.max(1, Math.round(bodyText.split(/\s+/).length / 180))} মিনিট`,
              isCapsule: true,
              isLead,
              categoryId,
            },
          });

          // Add vocabulary terms
          for (const v of vocabList) {
            await prisma.vocabularyTerm.create({
              data: {
                term: v.term,
                definition: v.definition,
                context: v.context,
                articleId: savedArticle.id,
              },
            });
          }

          // Add micro quiz
          for (const q of quizList) {
            await prisma.quizQuestion.create({
              data: {
                articleId: savedArticle.id,
                question: q.question,
                options: JSON.stringify(q.options),
                correctOption: q.correctOption,
                explanation: q.explanation || null,
                origin: "extracted",
                sourceSentence: q.sourceSentence || null,
              },
            });
          }


          results.saved++;
          countFromThisSource++;
          results.items.push(`[${categoryName}] ${title} (${source.name})`);
        } else {
          results.saved++;
          countFromThisSource++;
          results.items.push(`[টেস্ট প্রিভিউ: ${categoryName}] ${title} (${source.name})`);
        }
      }
    }
  }

  const durationMs = Date.now() - startTime;
  results.durationMs = durationMs;

  // Log to crawl history
  logCrawlRun({
    id: `crawl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    targetDate,
    language,
    category: categorySlug || "all",
    sourceName: sourceName || "all",
    dryRun,
    sourcesProcessed: sources.length,
    crawled: results.crawled,
    saved: results.saved,
    skipped: results.skipped,
    dateMismatched: results.dateMismatched,
    errors: results.errors,
    durationMs,
    items: results.items.slice(0, 10),
    status: results.errors > 0 ? (results.saved > 0 ? "WARNING" : "FAILED") : "SUCCESS",
  });

  if (!dryRun) {
    try {
      revalidatePath("/");
      revalidatePath("/capsule");
      revalidatePath("/admin");
    } catch {
      // Safe fallback when executed outside Next.js request context (e.g. cron-worker, standalone scripts)
    }
  }

  return results;
}
