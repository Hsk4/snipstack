"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen, Folder, Layers, Sparkles, SquareTerminal, Star } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export type Collection = { name: string; count: number };

interface DashboardSidebarProps {
  /** Which top-level page is showing; drives the highlighted nav item. */
  active: "library" | "playground";
  workspaceName: string;
  collections: Collection[];
  /**
   * Library page only: filter in place. When omitted (e.g. on the playground),
   * "All snippets" and the collections link back to /dashboard instead.
   */
  activeCollection?: string | null;
  onSelectCollection?: (name: string | null) => void;
}

const itemBase =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors";
const itemActive = "bg-secondary font-medium text-foreground";
const itemIdle =
  "text-muted-foreground hover:bg-secondary/60 hover:text-foreground";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
      {children}
    </p>
  );
}

/** Renders a Link when given an href, otherwise a button. */
function NavItem({
  active,
  href,
  onClick,
  className = "",
  children,
}: {
  active: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = `${itemBase} ${active ? itemActive : itemIdle} ${className}`;
  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={classes}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={classes}
    >
      {children}
    </button>
  );
}

export function DashboardSidebar({
  active,
  workspaceName,
  collections,
  activeCollection = null,
  onSelectCollection,
}: DashboardSidebarProps) {
  const inPlace = Boolean(onSelectCollection);

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-sidebar-border bg-sidebar p-4 md:flex">
      <Link
        href="/"
        className="flex items-center gap-2 px-1 text-lg font-bold tracking-tight"
      >
        <Layers className="size-5 text-primary" />
        snipstack
      </Link>

      <div className="rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-foreground/90">
        {workspaceName}
      </div>

      <nav className="space-y-1.5" aria-label="Workspace">
        <SectionLabel>Workspace</SectionLabel>
        <NavItem
          active={active === "library" && activeCollection === null}
          href={inPlace ? undefined : "/dashboard"}
          onClick={() => onSelectCollection?.(null)}
        >
          <Layers className="size-4" />
          All snippets
        </NavItem>
        <NavItem active={active === "playground"} href="/playground">
          <SquareTerminal className="size-4" />
          Playground
        </NavItem>
        {/* Favorites / recents need data the snippets table doesn't track yet. */}
        <button
          type="button"
          disabled
          title="Coming soon"
          className={`${itemBase} cursor-not-allowed text-muted-foreground/50`}
        >
          <Star className="size-4" />
          Favorites
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          className={`${itemBase} cursor-not-allowed text-muted-foreground/50`}
        >
          <BookOpen className="size-4" />
          Recently opened
        </button>
      </nav>

      <div className="space-y-1.5">
        <SectionLabel>Collections</SectionLabel>
        {collections.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            Tag your snippets to group them into collections.
          </p>
        ) : (
          collections.map((collection) => {
            const selected = activeCollection === collection.name;
            return (
              <NavItem
                key={collection.name}
                active={selected}
                href={inPlace ? undefined : "/dashboard"}
                onClick={() =>
                  onSelectCollection?.(selected ? null : collection.name)
                }
                className="justify-between"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Folder className="size-4 shrink-0" />
                  <span className="truncate">{collection.name}</span>
                </span>
                <span className="text-xs tabular-nums">
                  {String(collection.count).padStart(2, "0")}
                </span>
              </NavItem>
            );
          })
        )}
      </div>

      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-border bg-card p-4">
            <Sparkles className="mb-2 size-4 text-primary" />
            <p className="text-[13px] font-semibold">Small snippets. Big ideas.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Your next good idea starts with a little practice.
            </p>
            <Link
              href="/playground"
              className={`${buttonVariants({ size: "lg" })} mt-3 w-full`}
            >
              Open playground
          </Link>
        </div>

        <div className="flex items-center px-1">
          <UserButton
            showName
            appearance={{
              elements: {
                userButtonOuterIdentifier: "text-foreground text-[13px]",
              },
            }}
          />
        </div>
      </div>
    </aside>
  );
}
