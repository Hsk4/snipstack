import Link from 'next/link';
import { getUserSnippets } from '@/app/actions/snippet';
import { SnippetCard } from '@/components/SnippetCard';
import { Button } from '@/components/ui/button';
import type { Snippet } from '@/app/types';
import { JSX } from 'react/jsx-runtime';

export default async function DashboardPage(): Promise<JSX.Element> {
  const snippets: Snippet[] = await getUserSnippets();

  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Snippets</h1>
          <p className="text-muted-foreground mt-1">
            Manage, organize, and quickly copy your stored code snippets.
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button>Create Snippet</Button>
        </Link>
      </div>

      {snippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="font-semibold text-lg">No snippets found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Get started by creating your first code snippet.
          </p>
          <Link href="/dashboard/new">
            <Button variant="outline">Create Snippet</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {snippets.map((snippet: Snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}
    </div>
  );
}