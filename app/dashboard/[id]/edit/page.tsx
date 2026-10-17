import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

import { getSnippetById, getUserSnippets } from "@/app/actions/snippet";
import { getCollections } from "@/components/dashboard/collections";
import { SnippetForm } from "@/components/SnippetForm";

// With cacheComponents on, reading params must happen inside <Suspense>.
async function EditSnippetData({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ userId }, user, snippet, snippets] = await Promise.all([
    auth(),
    currentUser(),
    getSnippetById(id),
    getUserSnippets(),
  ]);

  // Missing, private, or someone else's: all look the same.
  if (!snippet || snippet.userId !== userId) notFound();

  return (
    <SnippetForm
      mode="edit"
      snippet={{
        id: snippet.id,
        title: snippet.title,
        description: snippet.description ?? "",
        language: snippet.language,
        code: snippet.code,
        tags: snippet.tags,
        isPublic: snippet.isPublic,
      }}
      workspaceName={user?.firstName ? `${user.firstName}'s workspace` : "My workspace"}
      collections={getCollections(snippets.map((item) => item.tags))}
    />
  );
}

export default function EditSnippetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="dashboard-theme">
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 grid place-items-center bg-background text-sm text-muted-foreground">
            Loading...
          </div>
        }
      >
        <EditSnippetData params={params} />
      </Suspense>
    </div>
  );
}
