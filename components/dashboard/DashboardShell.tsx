"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCollections } from "@/components/dashboard/collections";
import { SnippetTile } from "@/components/dashboard/SnippetTile";
import { languageLabel, type SnippetView } from "@/components/dashboard/types";

type Tab = "all" | "public" | "private";
type Sort = "updated" | "title";

interface DashboardShellProps {
  snippets: SnippetView[];
  workspaceName: string;
}

const selectClass =
  "cursor-pointer appearance-none bg-transparent text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground";

export function DashboardShell({ snippets, workspaceName }: DashboardShellProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [sort, setSort] = useState<Sort>("updated");
  const [tab, setTab] = useState<Tab>("all");
  const [collection, setCollection] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focuses the search box.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const collections = useMemo(
    () => getCollections(snippets.map((snippet) => snippet.tags)),
    [snippets],
  );

  const languages = useMemo(
    () => [...new Set(snippets.map((snippet) => snippet.language))].sort(),
    [snippets],
  );

  const publicCount = snippets.filter((snippet) => snippet.isPublic).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = snippets.filter((snippet) => {
      if (tab === "public" && !snippet.isPublic) return false;
      if (tab === "private" && snippet.isPublic) return false;
      if (language !== "all" && snippet.language !== language) return false;
      if (
        collection &&
        !snippet.tags.some((tag) => tag.trim().toLowerCase() === collection)
      ) {
        return false;
      }
      if (!needle) return true;
      return (
        snippet.title.toLowerCase().includes(needle) ||
        (snippet.description ?? "").toLowerCase().includes(needle) ||
        snippet.code.toLowerCase().includes(needle) ||
        snippet.language.toLowerCase().includes(needle) ||
        snippet.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
    return result.sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  }, [snippets, query, language, sort, tab, collection]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All snippets", count: snippets.length },
    { id: "public", label: "Public", count: publicCount },
    { id: "private", label: "Private", count: snippets.length - publicCount },
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      <DashboardSidebar
        active="library"
        workspaceName={workspaceName}
        collections={collections}
        activeCollection={collection}
        onSelectCollection={(name) => {
          setCollection(name);
          setTab("all");
        }}
      />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-5 md:px-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Workspace / Library</span>
            <span>Personal workspace</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Your snippets, all in one place.
              </h1>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Save what works. Find it faster. Keep building.
              </p>
            </div>
            <Link href="/dashboard/new" className={buttonVariants({ size: "lg" })}>
              New snippet
            </Link>
          </div>

          <section className="relative overflow-hidden rounded-xl border border-border bg-card px-6 py-7">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              Your next idea starts here
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Less searching. More shipping.
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Turn a quick experiment into something worth keeping.
            </p>
            <Link
              href="/playground"
              className={`${buttonVariants({ size: "lg" })} mt-4`}
            >
              Explore the playground
            </Link>

            <div
              aria-hidden
              className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 -rotate-[8deg] flex-col gap-2.5 sm:flex"
            >
              <div className="h-4 w-44 rounded-md bg-secondary" />
              <div className="ml-6 h-4 w-44 rounded-md bg-primary" />
              <div className="h-4 w-44 rounded-md bg-secondary" />
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 text-muted-foreground focus-within:border-primary/50">
              <Search className="size-4 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your snippets..."
                aria-label="Search your snippets"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] sm:block">
                ⌘K
              </kbd>
            </label>

            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              aria-label="Filter by language"
              className={selectClass}
            >
              <option value="all">All languages</option>
              {languages.map((value) => (
                <option key={value} value={value}>
                  {languageLabel(value)}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              aria-label="Sort snippets"
              className={selectClass}
            >
              <option value="updated">Last updated</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>

          <div className="flex items-center gap-5 text-xs" role="tablist">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`transition-colors ${
                    active
                      ? "font-semibold text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}{" "}
                  <span className={active ? "text-primary" : "text-muted-foreground"}>
                    {item.count}
                  </span>
                </button>
              );
            })}
            {collection && (
              <button
                type="button"
                onClick={() => setCollection(null)}
                className="ml-auto rounded-full border border-border px-2.5 py-0.5 text-muted-foreground hover:text-foreground"
              >
                #{collection} ✕
              </button>
            )}
          </div>

          {snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
              <h3 className="text-lg font-semibold">No snippets yet</h3>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Save your first snippet and it will show up here.
              </p>
              <Link href="/dashboard/new" className={buttonVariants({ size: "lg" })}>
                New snippet
              </Link>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No snippets match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {visible.map((snippet) => (
                <SnippetTile key={snippet.id} snippet={snippet} />
              ))}
            </div>
          )}

          <p className="pb-4 text-[11px] text-muted-foreground">
            Showing {visible.length} of {snippets.length} snippets
          </p>
        </div>
      </main>
    </div>
  );
}
