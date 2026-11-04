import * as cheerio from "cheerio";

/**
 * Server-side HTML sanitizer for article bodies that are rendered with
 * dangerouslySetInnerHTML. Only a small set of formatting tags survives, every
 * attribute is dropped except a safe http(s) `href` on links, and dangerous
 * elements are removed together with their contents.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup",
  "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote",
  "a", "span", "table", "thead", "tbody", "tr", "th", "td", "hr",
]);

const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "frame", "frameset", "object", "embed", "applet",
  "noscript", "template", "form", "input", "button", "textarea", "select", "option",
  "svg", "math", "link", "meta", "base", "head", "title", "video", "audio", "source", "track",
  "img", "picture", "canvas",
]);

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Wrap plain text as escaped <p> paragraphs (split on blank lines). */
export function textToParagraphHtml(text: string): string {
  if (!text) return "";
  return text
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para)}</p>`)
    .join("\n");
}

function isSafeHref(href: string | undefined): boolean {
  if (!href) return false;
  try {
    const url = new URL(href.trim(), "https://www.kkhobor.com");
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return "";

  const $ = cheerio.load(html, null, false);

  // Remove comments and processing instructions at every level, including the root
  const stripNonContent = (nodes: ReturnType<typeof $>) => {
    nodes.contents().each((_, node) => {
      if (node.type === "comment" || node.type === "directive" || node.type === "cdata") {
        $(node).remove();
      } else if ("children" in node) {
        stripNonContent($(node));
      }
    });
  };
  stripNonContent($.root());

  // Process deepest elements first so unwrapping parents keeps sanitized children.
  // domhandler types <script> and <style> as "script"/"style", not "tag".
  const elements = $.root().find("*").toArray().reverse();
  for (const el of elements) {
    if (el.type !== "tag" && el.type !== "script" && el.type !== "style") continue;
    const tag = el.tagName.toLowerCase();
    const $el = $(el);

    if (DROP_WITH_CONTENT.has(tag)) {
      $el.remove();
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      $el.replaceWith($el.contents());
      continue;
    }

    const href = tag === "a" ? $el.attr("href") : undefined;
    for (const name of Object.keys(el.attribs || {})) {
      $el.removeAttr(name);
    }
    if (tag === "a" && isSafeHref(href)) {
      $el.attr("href", href!.trim());
      $el.attr("rel", "noopener noreferrer nofollow");
      $el.attr("target", "_blank");
    }
  }

  return $.html();
}
