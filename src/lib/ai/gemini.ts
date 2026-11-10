/**
 * Minimal Google Gemini client (REST, no SDK). Used only at crawl time.
 * The key comes from GEMINI_API_KEY in .env and is never logged.
 */

export type GeminiResult =
  | { ok: true; text: string; tokensIn: number; tokensOut: number }
  | { ok: false; error: string; retryable: boolean };

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export const geminiReady = () => Boolean(process.env.GEMINI_API_KEY);

/** One JSON-only call. `schema` is Gemini's responseSchema (OpenAPI subset). */
export async function callGeminiJson(opts: {
  model: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
  /** Tokens the model may spend "thinking" before answering; 0 = none (cheaper, and the answer is never cut off by it) */
  thinkingBudget?: number;
  timeoutMs?: number;
}): Promise<GeminiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "GEMINI_API_KEY is not set", retryable: false };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 30_000);
  try {
    const send = (withThinking: boolean) =>
      fetch(`${ENDPOINT}/${encodeURIComponent(opts.model)}:generateContent`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: [{ role: "user", parts: [{ text: opts.user }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: opts.maxOutputTokens ?? 600,
            responseMimeType: "application/json",
            responseSchema: opts.schema,
            ...(withThinking ? { thinkingConfig: { thinkingBudget: opts.thinkingBudget ?? 0 } } : {}),
          },
        }),
      });
    // Models that do not think reject the thinking setting (HTTP 400): send again without it
    let res = await send(true);
    if (res.status === 400) res = await send(false);
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}: ${(body.error?.message || "").slice(0, 160)}`,
        retryable: res.status === 429 || res.status >= 500,
      };
    }
    const cand = body.candidates?.[0];
    const text = (cand?.content?.parts || []).map((p) => p.text || "").join("");
    if (!text) return { ok: false, error: `empty answer (${cand?.finishReason || "no candidate"})`, retryable: true };
    if (cand?.finishReason === "MAX_TOKENS") return { ok: false, error: "answer cut off (token limit)", retryable: true };
    return {
      ok: true,
      text,
      tokensIn: body.usageMetadata?.promptTokenCount ?? 0,
      tokensOut: body.usageMetadata?.candidatesTokenCount ?? 0,
    };
  } catch (err) {
    const aborted = (err as Error)?.name === "AbortError";
    return { ok: false, error: aborted ? "timeout" : `network: ${(err as Error)?.message || err}`, retryable: true };
  } finally {
    clearTimeout(timer);
  }
}
