"use client";

import { useEffect, useState } from "react";
import type { Snippet } from "@/app/types";
import { deleteSnippet } from "@/app/actions/snippet";
import { highlightCode } from "@/lib/higlight";
interface SnippetCardProps {
  snippet: Snippet;
}

export function SnippetCard({ snippet }: SnippetCardProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    highlightCode();
  }, [snippet.code]);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (): Promise<void> => {
    if (!confirm("Are you sure you want to delete this snippet?")) return;
    try {
      setIsDeleting(true);
      await deleteSnippet(snippet.id);
    } catch (error: unknown) {
      console.error("Failed to delete snippet:", error);
      setIsDeleting(false);
    }
  };

  // Map common language aliases for Prism
  const prismLanguageMap: Record<string, string> = {
    typescript: "language-typescript",
    javascript: "language-javascript",
    python: "language-python",
    sql: "language-sql",
    bash: "language-bash",
    json: "language-json",
    html: "language-html",
    css: "language-css",
  };

  const langClass =
    prismLanguageMap[snippet.language.toLowerCase()] || "language-typescript";

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{snippet.title}</h3>
          {snippet.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {snippet.description}
            </p>
          )}
        </div>
        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
          {snippet.language}
        </span>
      </div>

      <div className="relative rounded-lg bg-[#272822] p-4 font-mono text-sm overflow-x-auto">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition z-10"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre>
          <code>{snippet.code}</code>
        </pre>
      </div>

      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <div className="flex gap-1 flex-wrap">
          {snippet.tags.map((tag: string) => (
            <span key={tag} className="bg-muted px-2 py-0.5 rounded">
              #{tag.trim()}
            </span>
          ))}
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-destructive hover:underline font-medium disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
