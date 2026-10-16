import { JSX, Suspense } from 'react';
import { getPublicSnippets } from '@/app/actions/snippet';
import { SnippetCard } from '@/components/SnippetCard';
import type { Snippet } from '@/app/types';



// Separate the async data-fetching list into its own sub-component
async function PublicSnippetList() {
  const snippets: Snippet[] = await getPublicSnippets();

  if (snippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
        <h3 className="font-semibold text-lg">No public snippets yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Be the first to share a snippet publicly from your dashboard!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} />
      ))}
    </div>
  );
}

export default function ExplorePage(): JSX.Element {
  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Discovery Feed</h1>
        <p className="text-muted-foreground mt-1">
          Explore code snippets shared by developers across the globe.
        </p>
      </div>

      {/* Suspense handles the dynamic database streaming gracefully */}
      <Suspense fallback={<div className="text-muted-foreground">Loading public snippets...</div>}>
        <PublicSnippetList />
      </Suspense>
    </div>
  );
}