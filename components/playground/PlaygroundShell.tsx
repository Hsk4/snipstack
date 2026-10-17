"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createSnippet } from "@/app/actions/snippet";
import { Button } from "@/components/ui/button";
import {
  DashboardSidebar,
  type Collection,
} from "@/components/dashboard/DashboardSidebar";
import { CodeEditor } from "@/components/playground/CodeEditor";
import {
  LANGUAGES,
  buildDocument,
  toSnippetCode,
  type ConsoleEntry,
  type PlaygroundFile,
  type PlaygroundLanguage,
} from "@/components/playground/runner";

interface PlaygroundShellProps {
  userId: string | null;
  workspaceName: string;
  collections: Collection[];
}

interface Run {
  id: number;
  language: PlaygroundLanguage;
  files: PlaygroundFile[];
}

type SaveState = "idle" | "saving" | "error";

const MAX_LOG_ENTRIES = 500;

const levelStyles: Record<ConsoleEntry["level"], string> = {
  log: "text-foreground/90",
  info: "text-[#7cc4ff]",
  warn: "text-[#f0b072]",
  error: "text-[#f47c9a]",
};

function cloneFiles(files: PlaygroundFile[]): PlaygroundFile[] {
  return files.map((file) => ({ ...file }));
}

function LogList({ logs, empty }: { logs: ConsoleEntry[]; empty: string }) {
  if (logs.length === 0) {
    return <p className="text-xs text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="space-y-1 font-mono text-xs leading-5">
      {logs.map((entry) => (
        <li
          key={entry.id}
          className={`whitespace-pre-wrap break-words ${levelStyles[entry.level]}`}
        >
          {entry.text}
        </li>
      ))}
    </ul>
  );
}

export function PlaygroundShell({
  userId,
  workspaceName,
  collections,
}: PlaygroundShellProps) {
  const router = useRouter();

  const [language, setLanguage] = useState<PlaygroundLanguage>("html");
  const [files, setFiles] = useState<PlaygroundFile[]>(() =>
    cloneFiles(LANGUAGES.html.files),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // The first run happens on load so the preview is never empty.
  const [run, setRun] = useState<Run>(() => ({
    id: 1,
    language: "html",
    files: cloneFiles(LANGUAGES.html.files),
  }));

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const logId = useRef(0);

  const config = LANGUAGES[language];
  const runConfig = LANGUAGES[run.language];
  const activeFile = files[activeIndex] ?? files[0];

  const srcDoc = useMemo(
    () => buildDocument(run.language, run.files, { bridge: true }),
    [run],
  );

  // Collect console output from the sandboxed iframe.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { __playground?: boolean; level?: string; text?: string };
      if (!data?.__playground) return;
      const level = (["log", "info", "warn", "error"] as const).find(
        (value) => value === data.level,
      );
      setLogs((current) =>
        [
          ...current,
          { id: logId.current++, level: level ?? "log", text: String(data.text ?? "") },
        ].slice(-MAX_LOG_ENTRIES),
      );
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const execute = useCallback(() => {
    setLogs([]);
    setRun((previous) => ({
      id: previous.id + 1,
      language,
      files: cloneFiles(files),
    }));
  }, [language, files]);

  // ⌘/Ctrl + Enter runs the code.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        execute();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [execute]);

  function changeLanguage(next: PlaygroundLanguage) {
    if (next === language) return;
    const edited = files.some(
      (file, index) => file.content !== config.files[index]?.content,
    );
    if (edited && !confirm("Switching language replaces your current code. Continue?")) {
      return;
    }
    const nextFiles = cloneFiles(LANGUAGES[next].files);
    setLanguage(next);
    setFiles(nextFiles);
    setActiveIndex(0);
    setLogs([]);
    setRun((previous) => ({ id: previous.id + 1, language: next, files: cloneFiles(nextFiles) }));
  }

  function updateActiveFile(content: string) {
    setFiles((current) =>
      current.map((file, index) => (index === activeIndex ? { ...file, content } : file)),
    );
  }

  async function handleSave() {
    if (!userId) {
      setSaveError("Sign in to save snippets.");
      setSaveState("error");
      return;
    }
    setSaveState("saving");
    setSaveError(null);
    const result = await createSnippet({
      userId,
      title: title.trim() || "Untitled playground",
      description: "",
      code: toSnippetCode(language, files),
      language,
      tags: [],
      isPublic: false,
    });
    if (result.success) {
      router.push("/dashboard");
    } else {
      setSaveError(result.error ?? "Could not save snippet.");
      setSaveState("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      <DashboardSidebar
        active="playground"
        workspaceName={workspaceName}
        collections={collections}
      />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-5 md:px-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Workspace / Playground</span>
            <span>Personal workspace</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                A little space for big ideas.
              </h1>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Experiment, break things, and save the good parts.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button size="lg" onClick={handleSave} disabled={saveState === "saving"}>
                {saveState === "saving" ? "Saving..." : "Save snippet"}
              </Button>
              {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Untitled playground"
              aria-label="Snippet title"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-foreground"
            />
            <select
              value={language}
              onChange={(event) => changeLanguage(event.target.value as PlaygroundLanguage)}
              aria-label="Language"
              className="cursor-pointer appearance-none bg-transparent text-xs text-muted-foreground outline-none hover:text-foreground"
            >
              {Object.values(LANGUAGES).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <Button size="lg" onClick={execute} title="Run (Ctrl/⌘ + Enter)">
              {config.runLabel}
            </Button>
          </div>

          {/* Editor + right panel */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="flex h-[26rem] flex-col overflow-hidden rounded-xl border border-border bg-card">
              <div
                role="tablist"
                className="flex items-center gap-5 border-b border-border px-4 py-2.5 text-xs"
              >
                {files.map((file, index) => (
                  <button
                    key={file.name}
                    type="button"
                    role="tab"
                    aria-selected={index === activeIndex}
                    onClick={() => setActiveIndex(index)}
                    className={`transition-colors ${
                      index === activeIndex
                        ? "font-semibold text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1">
                <CodeEditor
                  key={`${language}-${activeFile.name}`}
                  value={activeFile.content}
                  grammar={activeFile.grammar}
                  onChange={updateActiveFile}
                />
              </div>
            </section>

            <section className="flex h-[26rem] flex-col overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs">
                <span className="font-semibold">
                  {runConfig.runner === "preview" ? "Preview" : "Output"}
                </span>
                <span className="text-muted-foreground">
                  {runConfig.runner === "preview" ? "sandboxed" : "console"}
                </span>
              </div>

              {/* The iframe stays mounted for both runners; the console runner just hides it. */}
              <iframe
                key={run.id}
                ref={iframeRef}
                title="Playground preview"
                sandbox="allow-scripts"
                srcDoc={srcDoc}
                className={`min-h-0 flex-1 border-0 bg-white ${
                  runConfig.runner === "preview" ? "" : "hidden"
                }`}
              />
              {runConfig.runner === "console" && (
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <LogList
                    logs={logs}
                    empty="Nothing logged yet. Hit Run to see your output."
                  />
                </div>
              )}

              {runConfig.runner === "preview" && (
                <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                  Runs in a sandboxed frame · Ctrl/⌘ + Enter to re-run
                </p>
              )}
            </section>
          </div>

          {/* Console strip (UI languages only; JS shows output in the right panel) */}
          {runConfig.runner === "preview" && (
            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between px-4 py-3 text-xs">
                <span className="font-semibold">Console / Output</span>
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto px-4 pb-4">
                <LogList
                  logs={logs}
                  empty="Ready for your next experiment. console.log output and errors appear here."
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
