import type { Collection } from "@/components/dashboard/DashboardSidebar";

/** Collections are the user's most-used tags (lower-cased, top N). */
export function getCollections(tagLists: string[][], limit = 6): Collection[] {
  const counts = new Map<string, number>();
  for (const tags of tagLists) {
    for (const raw of tags) {
      const tag = raw.trim().toLowerCase();
      if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}
