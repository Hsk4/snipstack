import { Suspense } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";

import { getUserSnippets } from "@/app/actions/snippet";
import { getCollections } from "@/components/dashboard/collections";
import { PlaygroundShell } from "@/components/playground/PlaygroundShell";

async function PlaygroundData() {
  const [{ userId }, user, snippets] = await Promise.all([
    auth(),
    currentUser(),
    getUserSnippets(),
  ]);

  return (
    <PlaygroundShell
      userId={userId}
      workspaceName={user?.firstName ? `${user.firstName}'s workspace` : "My workspace"}
      collections={getCollections(snippets.map((snippet) => snippet.tags))}
    />
  );
}

export default function PlaygroundPage() {
  return (
    <div className="dashboard-theme">
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 grid place-items-center bg-background text-sm text-muted-foreground">
            Loading the playground...
          </div>
        }
      >
        <PlaygroundData />
      </Suspense>
    </div>
  );
}
