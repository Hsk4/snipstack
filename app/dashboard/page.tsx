import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";

import { getUserSnippets } from "@/app/actions/snippet";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { SnippetView } from "@/components/dashboard/types";

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

function timeAgo(date: Date): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

async function DashboardData() {
  const [snippets, user] = await Promise.all([getUserSnippets(), currentUser()]);

  const views: SnippetView[] = snippets.map((snippet) => {
    const updated = new Date(snippet.updatedAt ?? snippet.createdAt);
    return {
      ...snippet,
      updatedAt: updated.toISOString(),
      updatedLabel: timeAgo(updated),
    };
  });

  const workspaceName = user?.firstName ? `${user.firstName}'s workspace` : "My workspace";

  return <DashboardShell snippets={views} workspaceName={workspaceName} />;
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-theme fixed inset-0 z-50 grid place-items-center bg-background text-sm text-muted-foreground">
      Loading your snippets...
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="dashboard-theme">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}
