"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Prism core must load before its language components.
import "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-bash";

import type { SupportedLanguages } from "@/app/types";
import { createSnippet, deleteSnippet, updateSnippet } from "@/app/actions/snippet";
import {
  DashboardSidebar,
  type Collection,
} from "@/components/dashboard/DashboardSidebar";
import { languageLabel } from "@/components/dashboard/types";
import { CodeEditor } from "@/components/playground/CodeEditor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  LANGUAGES,
  LIMITS,
  detectLanguage,
  mergeTags,
  validateSnippet,
  type FieldErrors,
  type SnippetDraft,
} from "@/lib/snippet";

type SnippetFormProps = {
  workspaceName: string;
  collections: Collection[];
} & (
  | { mode: "create" }
  | { mode: "edit"; snippet: SnippetDraft & { id: string } }
);

const EMPTY: SnippetDraft = {
  title: "",
  description: "",
  language: "typescript",
  code: "",
  tags: [],
  isPublic: false,
};

const FIELD_ORDER: (keyof FieldErrors)[] = [
  "title",
  "description",
  "language",
  "code",
  "tags",
];

/** Counters stay hidden until you are close to a limit, so the form stays clean. */
const nearLimit = (length: number, max: number) => length > max * 0.8;

const labelClass = "text-xs font-semibold leading-none";
const hintClass = "text-xs text-muted-foreground";
const errorClass = "text-xs text-destructive";
const selectClass =
  "h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";

export function SnippetForm(props: SnippetFormProps) {
  const { workspaceName, collections } = props;
  const editing = props.mode === "edit" ? props.snippet : null;

  const uid = useId();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const codeRef = useRef<HTMLDivElement>(null);

  const initial = useMemo<SnippetDraft>(() => {
    if (!editing) return EMPTY;
    const { id: _id, ...draft } = editing;
    void _id;
    return draft;
  }, [editing]);

  const [values, setValues] = useState<SnippetDraft>(initial);
  const [tagDraft, setTagDraft] = useState("");
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [languageLocked, setLanguageLocked] = useState(Boolean(editing));
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const id = (key: string) => `${uid}-${key}`;
  const errors = useMemo(() => validateSnippet(values), [values]);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || tagDraft.length > 0;
  const lines = values.code ? values.code.split("\n").length : 0;

  const errorFor = (key: keyof FieldErrors): string | undefined =>
    (touched[key] || submitted ? errors[key] : undefined) ?? serverErrors[key];
  const touch = (key: keyof FieldErrors) =>
    setTouched((current) => ({ ...current, [key]: true }));

  function set<K extends keyof SnippetDraft>(key: K, value: SnippetDraft[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setServerErrors((current) => ({ ...current, [key]: undefined }));
    setBanner(null);
  }

  function onTitleChange(title: string) {
    set("title", title);
    if (!languageLocked) {
      const detected = detectLanguage(title);
      if (detected) set("language", detected);
    }
  }

  function commitDraft() {
    if (!tagDraft) return;
    set("tags", mergeTags(values.tags, tagDraft));
    setTagDraft("");
  }

  // Collections are tags: the dropdown manages the "primary" collection tag.
  const collectionNames = collections.map((collection) => collection.name);
  const primaryCollection =
    values.tags.find((tag) => collectionNames.includes(tag)) ?? "";

  function onCollectionChange(next: string) {
    const rest = values.tags.filter((tag) => tag !== primaryCollection);
    set("tags", next ? [next, ...rest].slice(0, LIMITS.tags) : rest);
  }

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function focusField(key: keyof FieldErrors) {
    const element =
      key === "code"
        ? codeRef.current?.querySelector("textarea")
        : document.getElementById(id(key));
    element?.focus();
  }

  async function copyCode() {
    if (!values.code) return;
    await navigator.clipboard.writeText(values.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleCancel() {
    if (dirty && !window.confirm("Discard your changes?")) return;
    router.push("/dashboard");
  }

  function handleDelete() {
    if (!editing) return;
    if (!window.confirm(`Delete "${editing.title}"? This can't be undone.`)) return;

    startTransition(async () => {
      const result = await deleteSnippet(editing.id);
      if (!result.success) {
        setBanner(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setBanner(null);

    // A half-typed tag still counts.
    const tags = mergeTags(values.tags, tagDraft);
    const found = validateSnippet({ ...values, tags });
    const firstInvalid = FIELD_ORDER.find((key) => found[key]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      code: values.code,
      language: values.language,
      tags,
      isPublic: values.isPublic,
    };

    startTransition(async () => {
      const result = editing
        ? await updateSnippet({ id: editing.id, ...payload })
        : await createSnippet({
            ...payload,
            description: payload.description || undefined,
          });

      if (!result.success) {
        setServerErrors(result.fieldErrors ?? {});
        setBanner(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  const steps = [
    { label: "Name the problem it solves", done: values.title.trim().length > 0 },
    {
      label: "Choose a language",
      done: languageLocked || detectLanguage(values.title) !== null,
    },
    {
      label: "Tag it for your future self",
      done: values.tags.length > 0 || tagDraft.trim().length > 0,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      <DashboardSidebar
        active="library"
        workspaceName={workspaceName}
        collections={collections}
      />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-5 md:px-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <Link href="/dashboard" className="hover:text-foreground">
                Workspace / All snippets
              </Link>{" "}
              / {editing ? "Edit snippet" : "Create snippet"}
            </span>
            <span>Personal workspace</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {editing ? "Give it a little polish." : "Keep a good idea close."}
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {editing
                ? "Tweak it, retag it, or retire it."
                : "Create a snippet now. Thank yourself later."}
            </p>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <form
              onSubmit={handleSubmit}
              noValidate
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.currentTarget.requestSubmit();
                }
              }}
              className="space-y-5 rounded-xl border border-border bg-card p-6"
            >
              <div>
                <h2 className="text-[13px] font-semibold">
                  {editing ? "Edit snippet" : "Create snippet"}
                </h2>
                <p className={cn(hintClass, "mt-1")}>
                  Add your code and a few details to make it easy to find.
                </p>
              </div>

              {banner && (
                <div
                  role="alert"
                  className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive"
                >
                  {banner}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={id("title")} className={labelClass}>
                    Title
                  </label>
                  {nearLimit(values.title.length, LIMITS.title) && (
                    <span className={hintClass}>
                      {values.title.length}/{LIMITS.title}
                    </span>
                  )}
                </div>
                <Input
                  id={id("title")}
                  value={values.title}
                  placeholder="e.g. A reusable debounce hook"
                  autoComplete="off"
                  aria-invalid={Boolean(errorFor("title"))}
                  className={cn(errorFor("title") && "border-destructive")}
                  onChange={(event) => onTitleChange(event.target.value)}
                  onBlur={() => touch("title")}
                />
                {errorFor("title") && (
                  <p role="alert" className={errorClass}>{errorFor("title")}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={id("description")} className={labelClass}>
                    Description
                  </label>
                  {nearLimit(values.description.length, LIMITS.description) && (
                    <span className={hintClass}>
                      {values.description.length}/{LIMITS.description}
                    </span>
                  )}
                </div>
                <Textarea
                  id={id("description")}
                  rows={2}
                  value={values.description}
                  placeholder="What does this snippet do, and when would you use it?"
                  aria-invalid={Boolean(errorFor("description"))}
                  className={cn(errorFor("description") && "border-destructive")}
                  onChange={(event) => set("description", event.target.value)}
                  onBlur={() => touch("description")}
                />
                {errorFor("description") && (
                  <p role="alert" className={errorClass}>{errorFor("description")}</p>
                )}
              </div>

              {/* Language + visibility */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor={id("language")} className={labelClass}>
                    Language
                  </label>
                  <select
                    id={id("language")}
                    value={values.language}
                    className={selectClass}
                    onChange={(event) => {
                      setLanguageLocked(true);
                      set("language", event.target.value as SupportedLanguages);
                    }}
                  >
                    {LANGUAGES.map((language) => (
                      <option key={language.id} value={language.id}>
                        {languageLabel(language.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor={id("collection")} className={labelClass}>
                    Collection
                  </label>
                  <select
                    id={id("collection")}
                    value={primaryCollection}
                    disabled={collections.length === 0}
                    title={
                      collections.length === 0
                        ? "Tag your snippets to build collections"
                        : undefined
                    }
                    className={selectClass}
                    onChange={(event) => onCollectionChange(event.target.value)}
                  >
                    <option value="">No collection</option>
                    {collections.map((collection) => (
                      <option key={collection.name} value={collection.name}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={labelClass}>Code</span>
                  <span className={cn(hintClass, "flex items-center gap-3")}>
                    {languageLabel(values.language)}
                    <button
                      type="button"
                      onClick={copyCode}
                      disabled={!values.code}
                      className="font-medium text-foreground hover:underline disabled:text-muted-foreground disabled:no-underline"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </span>
                </div>

                <div
                  ref={codeRef}
                  onBlur={() => touch("code")}
                  className={cn(
                    "relative h-56 max-h-160 min-h-40 resize-y overflow-hidden rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
                    errorFor("code") && "border-destructive",
                  )}
                >
                  <CodeEditor
                    value={values.code}
                    grammar={values.language}
                    onChange={(code) => set("code", code)}
                  />
                  {!values.code && (
                    <p
                      aria-hidden
                      className="pointer-events-none absolute left-16 top-4 font-mono text-[12px] leading-6 text-muted-foreground/60"
                    >
                      {"// Paste or write your snippet here"}
                    </p>
                  )}
                </div>

                <div className="flex justify-between gap-3">
                  {errorFor("code") ? (
                    <p role="alert" className={errorClass}>{errorFor("code")}</p>
                  ) : (
                    <span className={hintClass}>
                      {lines} {lines === 1 ? "line" : "lines"} ·{" "}
                      {values.code.length.toLocaleString("en-US")} chars
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={id("tags")} className={labelClass}>
                    Tags
                  </label>
                  {values.tags.length >= LIMITS.tags - 1 && (
                    <span className={hintClass}>
                      {values.tags.length}/{LIMITS.tags}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
                  {values.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
                    >
                      #{tag}
                      <button
                        type="button"
                        aria-label={`Remove tag ${tag}`}
                        onClick={() =>
                          set("tags", values.tags.filter((existing) => existing !== tag))
                        }
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  <input
                    id={id("tags")}
                    value={tagDraft}
                    placeholder={values.tags.length ? "" : "e.g. hooks, performance, utilities"}
                    className="min-w-36 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                    onChange={(event) => setTagDraft(event.target.value)}
                    onBlur={commitDraft}
                    onPaste={(event) => {
                      const text = event.clipboardData.getData("text");
                      if (text.includes(",")) {
                        event.preventDefault();
                        set("tags", mergeTags(values.tags, text));
                        setTagDraft("");
                      }
                    }}
                    onKeyDown={(event) => {
                      // Ctrl/⌘+Enter falls through to the form and submits.
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) return;
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        commitDraft();
                      } else if (event.key === "Backspace" && !tagDraft && values.tags.length) {
                        set("tags", values.tags.slice(0, -1));
                      }
                    }}
                  />
                </div>

                {errorFor("tags") && (
                  <p role="alert" className={errorClass}>{errorFor("tags")}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={values.isPublic}
                    onChange={(event) => set("isPublic", event.target.checked)}
                    className="size-3.5 accent-primary"
                  />
                  {values.isPublic ? "Public: shown in Explore" : "Make public"}
                </label>

                <div className="ml-auto flex gap-3">
                  {editing && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="lg"
                      onClick={handleDelete}
                      disabled={isPending}
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleCancel}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isPending || (Boolean(editing) && !dirty)}
                  >
                    {isPending ? "Saving..." : editing ? "Save changes" : "Create snippet"}
                  </Button>
                </div>
              </div>
            </form>

            <aside className="space-y-4 lg:sticky lg:top-5">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[13px] font-semibold">A little context goes a long way.</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Use a clear title, add a helpful description, and group related
                  snippets into collections.
                </p>
                <ol className="mt-3 space-y-1.5">
                  {steps.map((step, index) => (
                    <li
                      key={step.label}
                      className={cn(
                        "flex gap-2.5 text-xs transition-colors",
                        step.done ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <span className="tabular-nums">{`0${index + 1}`}</span>
                      {step.label}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[13px] font-semibold">Still working it out?</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Try your idea in the playground before adding it to your stack.
                </p>
                <Link
                  href="/playground"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "mt-3 w-full")}
                >
                  Open playground
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
