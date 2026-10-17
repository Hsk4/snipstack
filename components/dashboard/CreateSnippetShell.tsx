"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { createSnippet } from "@/app/actions/snippet";
import { AppFrame } from "@/components/dashboard/AppFrame";
import type { Collection } from "@/components/dashboard/DashboardSidebar";
import { LANGUAGE_LABELS, languageLabel } from "@/components/dashboard/types";
import { CodeEditor } from "@/components/playground/CodeEditor";
import { Button, buttonVariants } from "@/components/ui/button";

interface CreateSnippetShellProps {
  workspaceName: string;
  collections: Collection[];
}

type FieldErrors = { title?: string; code?: string };

const fieldClass =
  "w-full rounded-lg border border-border bg-background/60 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 aria-[invalid=true]:border-destructive";

const TIPS = [
  "Name the problem it solves",
  "Choose a language",
  "Tag it for your future self",
];

function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/^#+/, "").replace(/\s+/g, " ");
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function Field({
  label,
  htmlFor,
  aside,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  aside?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-semibold">
          {label}
        </label>
        {aside && (
          <span className="text-[11px] text-muted-foreground">{aside}</span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function CreateSnippetShell({
  workspaceName,
  collections,
}: CreateSnippetShellProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [collection, setCollection] = useState("");
  const [code, setCode] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addTag(raw: string) {
    const tag = normalizeTag(raw);
    if (tag) setTags((current) => unique([...current, tag]));
    setTagInput("");
  }

  function handleTagChange(value: string) {
    if (!value.includes(",")) {
      setTagInput(value);
      return;
    }
    // Typing or pasting "a, b, c" commits everything before the last comma.
    const parts = value.split(",");
    const rest = parts.pop() ?? "";
    setTags((current) =>
      unique([...current, ...parts.map(normalizeTag).filter(Boolean)]),
    );
    setTagInput(rest);
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag(tagInput);
    } else if (event.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((current) => current.slice(0, -1));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = "Give your snippet a title.";
    if (!code.trim()) nextErrors.code = "Add some code to save.";
    setErrors(nextErrors);
    setServerError(null);
    if (nextErrors.title || nextErrors.code) {
      document
        .getElementById(nextErrors.title ? "snippet-title" : "snippet-code")
        ?.focus();
      return;
    }

    const pending = normalizeTag(tagInput);
    const allTags = unique([
      ...tags,
      ...(pending ? [pending] : []),
      ...(collection ? [collection] : []),
    ]);

    setSaving(true);
    const result = await createSnippet({
      title: title.trim(),
      description: description.trim(),
      code,
      language,
      tags: allTags,
      isPublic,
    });

    if (!result.success) {
      setServerError(result.error ?? "Something went wrong saving your snippet.");
      setSaving(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <AppFrame
      active="library"
      workspaceName={workspaceName}
      collections={collections}
      breadcrumb="Workspace / All snippets / Create snippet"
      contentClassName="max-w-5xl gap-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Keep a good idea close.
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Create a snippet now. Thank yourself later.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <form
          noValidate
          onSubmit={handleSubmit}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.requestSubmit();
            }
          }}
          className="space-y-5 rounded-xl border border-border bg-card p-6"
        >
          <div>
            <h2 className="text-[13px] font-semibold">Create snippet</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your code and a few details to make it easy to find.
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {serverError}
            </div>
          )}

          <Field label="Title" htmlFor="snippet-title" error={errors.title}>
            <input
              id="snippet-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
              }}
              placeholder="e.g. A reusable debounce hook"
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? "snippet-title-error" : undefined}
              className={`${fieldClass} h-10`}
            />
          </Field>

          <Field label="Description" htmlFor="snippet-description">
            <textarea
              id="snippet-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="What does this snippet do, and when would you use it?"
              className={`${fieldClass} resize-y py-2.5`}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Language" htmlFor="snippet-language">
              <div className="relative">
                <select
                  id="snippet-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className={`${fieldClass} h-10 cursor-pointer appearance-none pr-9`}
                >
                  {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>

            <Field label="Collection" htmlFor="snippet-collection">
              <div className="relative">
                <select
                  id="snippet-collection"
                  value={collection}
                  onChange={(event) => setCollection(event.target.value)}
                  className={`${fieldClass} h-10 cursor-pointer appearance-none pr-9`}
                >
                  <option value="">No collection</option>
                  {collections.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>
          </div>

          <Field
            label="Code"
            htmlFor="snippet-code"
            aside={languageLabel(language)}
            error={errors.code}
            hint="Tab indents. Press Esc, then Tab, to leave the editor."
          >
            <div
              className={`h-72 overflow-hidden rounded-lg border bg-background/60 transition-colors focus-within:border-primary/60 ${
                errors.code ? "border-destructive" : "border-border"
              }`}
            >
              <CodeEditor
                id="snippet-code"
                value={code}
                grammar={language}
                onChange={(value) => {
                  setCode(value);
                  if (errors.code) setErrors((current) => ({ ...current, code: undefined }));
                }}
                placeholder="// Paste or write your snippet here"
                invalid={Boolean(errors.code)}
                describedBy={
                  errors.code ? "snippet-code-error" : "snippet-code-hint"
                }
              />
            </div>
          </Field>

          <Field
            label="Tags"
            htmlFor="snippet-tags"
            hint="Press Enter or a comma to add a tag."
          >
            <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2 py-1.5 transition-colors focus-within:border-primary/60">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() =>
                      setTags((current) => current.filter((item) => item !== tag))
                    }
                    aria-label={`Remove tag ${tag}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="snippet-tags"
                value={tagInput}
                onChange={(event) => handleTagChange(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTag(tagInput)}
                placeholder={tags.length === 0 ? "e.g. hooks, performance, utilities" : ""}
                className="min-w-32 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                className="size-3.5 cursor-pointer accent-primary"
              />
              Make public
              <span className="text-muted-foreground/60">· shown on Explore</span>
            </label>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Cancel
              </Link>
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? "Creating..." : "Create snippet"}
              </Button>
            </div>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-[13px] font-semibold">A little context goes a long way.</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Use a clear title, add a helpful description, and group related
              snippets into collections.
            </p>
            <ol className="mt-4 space-y-2 text-xs text-muted-foreground">
              {TIPS.map((tip, index) => (
                <li key={tip} className="flex gap-3">
                  <span className="font-mono text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {tip}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-[13px] font-semibold">Still working it out?</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Try your idea in the playground before adding it to your stack.
            </p>
            <Link
              href="/playground"
              className={`${buttonVariants({ variant: "secondary", size: "lg" })} mt-4 w-full`}
            >
              Open playground
            </Link>
          </section>
        </aside>
      </div>
    </AppFrame>
  );
}
