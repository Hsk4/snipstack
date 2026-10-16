"use client";

import { useEffect, useState, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-okaidia.css";

import type { Snippet } from "@/app/types";
import { deleteSnippet } from "@/app/actions/snippet";

interface SnippetCardProps {
  snippet: Snippet;
}

export function SnippetCard({ snippet }: SnippetCardProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const codeRef = useRef<HTMLElement | null>(null);

  // Target this specific element directly instead of a global document sweep
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [snippet.code, snippet.language]);

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

  const langClass = `language-${snippet.language.toLowerCase()}`;

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

      {/* Code Container */}
      <div className="relative rounded-lg bg-[#272822] p-4 font-mono text-sm overflow-x-auto">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition z-10"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre className="bg-transparent! m-0! p-0!">
          <code ref={codeRef} className={`${langClass} text-zinc-50`}>
            {snippet.code}
          </code>
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