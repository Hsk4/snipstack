import { currentUser } from "@clerk/nextjs/server";
import { getUserSnippets } from "@/app/actions/snippet";
import { getCollections } from "@/components/dashboard/collections";
import type { Collection } from "@/components/dashboard/DashboardSidebar";

export interface WorkspaceContext {
  userId: string | null;
  workspaceName: string;
  snippets: Awaited<ReturnType<typeof getUserSnippets>>;
  collections: Collection[];
}

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const [user, snippets] = await Promise.all([
    currentUser(),
    getUserSnippets(),
  ]);

  const workspaceName = user?.firstName
    ? `${user.firstName}'s workspace`
    : "My workspace";

  const collections = getCollections(snippets.map((snippet) => snippet.tags));

  return {
    userId: user?.id ?? null,
    workspaceName,
    snippets,
    collections,
  };
}
