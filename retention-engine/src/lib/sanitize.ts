// Doc 2, "Problem 1": smart quotes, em-dashes, and hidden line breaks copied from
// spreadsheets/CSVs break downstream JSON and read oddly in emails. Strip them at
// the import boundary -- the one place untrusted text enters the system.
const REPLACEMENTS: [RegExp, string][] = [
  [/[‘’‚‛]/g, "'"], // curly single quotes
  [/[“”„‟]/g, '"'], // curly double quotes
  [/[–—]/g, "-"], // en/em dash
  [/…/g, "..."], // ellipsis
  [/ /g, " "], // non-breaking space
  [/\r\n/g, "\n"], // CRLF -> LF
  [/[\u2028\u2029]/g, "\n"], // hidden line/paragraph separators
];

export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  let out = input;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out.trim();
}

export function sanitizeRecord<T extends object>(record: T): T {
  const out = { ...record } as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    const value = out[key];
    if (typeof value === "string") {
      out[key] = sanitizeText(value);
    }
  }
  return out as T;
}
