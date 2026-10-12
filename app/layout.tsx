import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
} from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'SnippetVault',
  description: 'Developer Code Snippet Manager',
};

function AuthNavigation() {
  return (
    <Suspense
      fallback={
        <div className="h-10 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      }
    >
      <nav className="flex items-center gap-4">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition">
              Sign In
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
              Sign Up
            </button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          <UserButton showName />
        </Show>
      </nav>
    </Suspense>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
          <header className="border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="font-bold text-lg tracking-tight">SnippetVault</div>
            <AuthNavigation />
          </header>

          <main className="flex-1 flex flex-col">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}