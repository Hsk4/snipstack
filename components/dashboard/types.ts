import type { Snippet } from "@/app/types";

/** Serializable snippet shape handed from the server page to the client dashboard. */
export type SnippetView = Omit<Snippet, "createdAt" | "updatedAt"> & {
  /** ISO timestamp, used for sorting. */
  updatedAt: string;
  /** Pre-formatted on the server ("2 hours ago") so SSR and hydration agree. */
  updatedLabel: string;
};

export const LANGUAGE_LABELS: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  go: "Go",
  rust: "Rust",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  markdown: "Markdown",
  sql: "SQL",
};

export function languageLabel(language: string): string {
  return LANGUAGE_LABELS[language] ?? language;
}
