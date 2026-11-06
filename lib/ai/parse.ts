import { Extraction } from "./schema";

/** Remove the Markdown code fences Gemini sometimes wraps JSON in. */
export function stripFences(raw: string): string {
  return raw.replace(/```(?:json)?/gi, "").trim();
}

/** Grab the outermost JSON object from model text. */
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in model output");
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * Normalise model prose to plain punctuation: no em or en dashes, curly quotes or ellipsis
 * characters. Source quotes are left alone because they must match the client's message.
 */
export function plainText(s: string): string {
  return s
    .replace(/\s*[\u2014\u2013]\s*/g, (m) => (/\s/.test(m) ? ", " : "-"))
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2026/g, "...");
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Parse and validate model output. Items whose sourceQuote isn't in the client's message are
 * dropped as hallucinations. Throws with a readable message when the output is invalid.
 */
export function parseExtraction(raw: string, input: string): Extraction {
  const json = extractJsonObject(stripFences(raw));
  const result = Extraction.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Schema validation failed: ${issues}`);
  }
  const haystack = norm(input);
  return {
    ...result.data,
    summary: plainText(result.data.summary),
    clarifyingQuestions: result.data.clarifyingQuestions.map(plainText),
    items: result.data.items
      .filter((item) => item.sourceQuote.trim().length > 0 && haystack.includes(norm(item.sourceQuote)))
      .map((item) => ({ ...item, title: plainText(item.title), description: plainText(item.description) })),
  };
}
