import type { SupportedLanguages } from "@/app/types";

export const LIMITS = { title: 80, description: 280, code: 20000, tags: 8, tag: 24 } as const;

/** Ids double as Prism grammar keys. Labels live in components/dashboard/types.ts. */
export const LANGUAGES: { id: SupportedLanguages; ext: string[] }[] = [
  { id: "typescript", ext: ["ts", "tsx"] },
  { id: "javascript", ext: ["js", "jsx", "mjs", "cjs"] },
  { id: "python", ext: ["py"] },
  { id: "go", ext: ["go"] },
  { id: "rust", ext: ["rs"] },
  { id: "html", ext: ["html"] },
  { id: "css", ext: ["css"] },
  { id: "json", ext: ["json"] },
  { id: "markdown", ext: ["md"] },
  { id: "sql", ext: ["sql"] },
  { id: "bash", ext: ["sh", "bash"] },
];

export type SnippetFields = {
  title: string;
  description: string;
  language: string;
  code: string;
  tags: string[];
};

/** What the form edits: the fields plus visibility. */
export type SnippetDraft = Omit<SnippetFields, "language"> & {
  language: SupportedLanguages;
  isPublic: boolean;
};

export type FieldErrors = Partial<Record<keyof SnippetFields, string>>;

export const isLanguage = (value: string): value is SupportedLanguages =>
  LANGUAGES.some((language) => language.id === value);

export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_+#.]/g, "")
    .slice(0, LIMITS.tag);
}

/** Merge comma-separated raw input into a tag list (normalized, deduped, capped). */
export function mergeTags(existing: string[], raw: string): string[] {
  const next = [...existing];
  for (const part of raw.split(",")) {
    const tag = normalizeTag(part);
    if (tag && !next.includes(tag) && next.length < LIMITS.tags) next.push(tag);
  }
  return next;
}

/** "useDebounce.ts" -> "typescript" */
export function detectLanguage(title: string): SupportedLanguages | null {
  const match = title.trim().match(/\.([a-z0-9]+)$/i);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  return LANGUAGES.find((language) => language.ext.includes(ext))?.id ?? null;
}

/**
 * partial = false: every field is checked (create, and the form).
 * partial = true: only fields that are present are checked (update).
 */
export function validateSnippet(
  value: Partial<SnippetFields>,
  partial = false,
): FieldErrors {
  const errors: FieldErrors = {};
  const check = (key: keyof SnippetFields): boolean =>
    !partial || value[key] !== undefined;

  if (check("title")) {
    const title = (value.title ?? "").trim();
    if (!title) errors.title = "Give your snippet a title.";
    else if (title.length > LIMITS.title)
      errors.title = `Keep it under ${LIMITS.title} characters.`;
  }
  if (check("description") && (value.description ?? "").length > LIMITS.description) {
    errors.description = `Keep it under ${LIMITS.description} characters.`;
  }
  if (check("language") && !isLanguage(value.language ?? "")) {
    errors.language = "Choose a language.";
  }
  if (check("code")) {
    const code = value.code ?? "";
    if (!code.trim()) errors.code = "Add some code to save.";
    else if (code.length > LIMITS.code)
      errors.code = `Snippets are limited to ${LIMITS.code.toLocaleString("en-US")} characters.`;
  }
  if (check("tags") && (value.tags ?? []).length > LIMITS.tags) {
    errors.tags = `Use at most ${LIMITS.tags} tags.`;
  }
  return errors;
}