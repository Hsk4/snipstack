"use client";

import { useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";

import { deleteSnippet } from "@/app/actions/snippet";
import { CodePreview } from "@/components/dashboard/CodePreview";
import { languageLabel, type SnippetView } from "@/components/dashboard/types";

export function SnippetTile({ snippet }: { snippet: SnippetView }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error: unknown) {
      console.error("Failed to copy snippet:", error);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${snippet.title}"? This can't be undone.`)) return;
    setDeleting(true);
    const result = await deleteSnippet(snippet.id);
    if (!result.success) setDeleting(false);
  }

  return (
    <article
      className={`group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 ${
        deleting ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {snippet.title}
        </h3>
        <span className="shrink-0 text-xs font-medium text-primary">
          {languageLabel(snippet.language)}
        </span>
      </header>

      <p className="line-clamp-1 min-h-4 text-xs text-muted-foreground">
        {snippet.description}
      </p>

      <div className="relative">
        <CodePreview code={snippet.code} language={snippet.language} />
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy snippet"}
            className="grid size-7 place-items-center rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent"
          >
            {copied ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete snippet"
            className="grid size-7 place-items-center rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <footer className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>Updated {snippet.updatedLabel}</span>
        <span aria-hidden>·</span>
        <span>{snippet.isPublic ? "Public" : "Personal"}</span>
      </footer>
    </article>
  );
}
