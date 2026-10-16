"use client";

import { useState, useMemo } from "react";
import type { Snippet } from "@/app/types";
import { SnippetCard } from "@/components/SnippetCard";
import { Input } from "@/components/ui/input";

export function SnippetFilter({ snippets }: { snippets: Snippet[] }) {
  const [query, setquery] = useState("");
  const [ActiveTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const s = new Set<string>();
    snippets.forEach((snip) =>
      snip.tags.forEach((t) => s.add(t.trim().toLowerCase())),
    );
    return Array.from(s).sort();
  }, [snippets]);
  const filtered = useMemo(() => {
    return snippets.filter((snip) => {
      const matchQuery =
        snip.title.toLowerCase().includes(query.toLowerCase()) ||
        snip.code.toLowerCase().includes(query.toLowerCase()) ||
        snip.language.toLowerCase().includes(query.toLowerCase());

      const matchTag = ActiveTag
        ? snip.tags.map((t) => t.toLowerCase()).includes(ActiveTag)
        : true;
      return matchQuery && matchTag;
    });
  }, [snippets, query, ActiveTag]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <Input
          placeholder="Search snippets..."
          value={query}
          onChange={(e) => setquery(e.target.value)}
          className="md:w-96"
        />
        <div className="flex gap-1.5 flex-wrap items-center">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2.5 py-1 text-xs rounded-full border ${!ActiveTag ? "bg-foreground text-background" : ""}`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === ActiveTag ? null : tag)}
              className={`px-2.5 py-1 text-xs rounded-full border ${ActiveTag === tag ? "bg-foreground text-background" : ""}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((snippet) => (
          <SnippetCard key={snippet.id} snippet={snippet} />
        ))}
      </div>
    </div>
  );
}
