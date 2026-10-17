import { Suspense } from "react";

import { CreateSnippetShell } from "@/components/dashboard/CreateSnippetShell";
import { getWorkspaceContext } from "@/lib/workspace";

async function NewSnippetData() {
  const { workspaceName, collections } = await getWorkspaceContext();
  return (
    <CreateSnippetShell workspaceName={workspaceName} collections={collections} />
  );
}

export default function NewSnippetPage() {
  return (
    <div className="dashboard-theme">
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 grid place-items-center bg-background text-sm text-muted-foreground">
            Loading...
          </div>
        }
      >
        <NewSnippetData />
      </Suspense>
    </div>
  );
}
