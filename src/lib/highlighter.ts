/**
 * Client-side HTML text highlighter for active study reader.
 * Safely wraps matched quotes inside `<mark>` elements without destroying
 * surrounding HTML tags (paragraphs, links, images, headings).
 */

import { StudyNote } from "@/types";

export function applyHighlightsToHtml(rawHtml: string, notes: StudyNote[]): string {
  if (typeof window === "undefined" || !rawHtml) return rawHtml;
  if (!notes || notes.length === 0) return rawHtml;

  // Filter notes that have a valid quote and are not pure summary reflections
  const highlightNotes = notes.filter(
    (n) =>
      n.quoteText &&
      n.quoteText.trim().length > 0 &&
      !n.memo?.includes("[সারসংক্ষেপ অনুশীলন]")
  );

  if (highlightNotes.length === 0) return rawHtml;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${rawHtml}</div>`, "text/html");
    const container = doc.body.firstElementChild;
    if (!container) return rawHtml;

    for (const note of highlightNotes) {
      const quote = note.quoteText.trim();
      if (!quote || quote.length < 2) continue;

      let colorClass = "kk-highlight kk-highlight-yellow bg-amber-200/90 text-neutral-900 border-b border-amber-400";
      if (note.memo?.includes("[সবুজ মার্কার]")) {
        colorClass = "kk-highlight kk-highlight-green bg-emerald-200/90 text-neutral-900 border-b border-emerald-400";
      } else if (note.memo?.includes("[বেগুনি মার্কার]")) {
        colorClass = "kk-highlight kk-highlight-purple bg-purple-200/90 text-neutral-900 border-b border-purple-400";
      }

      highlightInContainer(container, quote, colorClass, note.id, note.memo);
    }

    return container.innerHTML;
  } catch (err) {
    console.error("Highlighter error:", err);
    return rawHtml;
  }
}

function highlightInContainer(
  container: Element,
  quote: string,
  colorClass: string,
  noteId: string,
  memo?: string | null
) {
  // Normalize search text (condense multiple whitespace/newlines to single space)
  const normalizedQuote = quote.replace(/\s+/g, " ");

  // TreeWalker to traverse all text nodes that are not already highlighted
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Do not re-highlight inside an existing mark or script
      let p = node.parentElement;
      while (p && p !== container) {
        if (p.tagName.toLowerCase() === "mark") {
          return NodeFilter.FILTER_REJECT;
        }
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    textNodes.push(n as Text);
    n = walker.nextNode();
  }

  // 1. Direct single text-node matching
  for (const textNode of textNodes) {
    const originalText = textNode.nodeValue || "";
    if (!originalText) continue;

    // Check direct substring match
    const directIdx = originalText.indexOf(quote);
    if (directIdx !== -1) {
      wrapTextRange(textNode, directIdx, directIdx + quote.length, colorClass, noteId, memo);
      return;
    }

    // Check normalized whitespace match
    const normalizedNode = originalText.replace(/\s+/g, " ");
    const normIdx = normalizedNode.indexOf(normalizedQuote);
    if (normIdx !== -1) {
      // Find corresponding start in original text
      wrapTextRange(textNode, normIdx, Math.min(originalText.length, normIdx + normalizedQuote.length), colorClass, noteId, memo);
      return;
    }
  }

  // 2. Partial/prefix fallback: If selection was trimmed or spans boundary
  if (normalizedQuote.length > 20) {
    const snippetPrefix = normalizedQuote.slice(0, 20);
    for (const textNode of textNodes) {
      const originalText = textNode.nodeValue || "";
      const idx = originalText.indexOf(snippetPrefix);
      if (idx !== -1) {
        const end = Math.min(originalText.length, idx + normalizedQuote.length);
        wrapTextRange(textNode, idx, end, colorClass, noteId, memo);
        return;
      }
    }
  }
}

function wrapTextRange(
  textNode: Text,
  start: number,
  end: number,
  colorClass: string,
  noteId: string,
  memo?: string | null
) {
  const original = textNode.nodeValue || "";
  if (start < 0 || end > original.length || start >= end) return;

  const before = original.slice(0, start);
  const match = original.slice(start, end);
  const after = original.slice(end);

  const mark = document.createElement("mark");
  mark.className = `${colorClass} px-1 py-0.5 rounded cursor-pointer transition inline font-inherit shadow-2xs select-text`;
  mark.style.boxDecorationBreak = "clone";
  (mark.style as any).webkitBoxDecorationBreak = "clone";
  mark.setAttribute("data-note-id", noteId);
  if (memo) {
    mark.title = `নোট: ${memo}`;
  }
  mark.textContent = match;

  const parent = textNode.parentNode;
  if (!parent) return;

  if (before) parent.insertBefore(document.createTextNode(before), textNode);
  parent.insertBefore(mark, textNode);
  if (after) parent.insertBefore(document.createTextNode(after), textNode);
  parent.removeChild(textNode);
}

