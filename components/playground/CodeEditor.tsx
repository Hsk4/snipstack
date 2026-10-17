"use client";

import { useLayoutEffect, useRef } from "react";
import Prism from "prismjs";

import type { Grammar } from "@/components/playground/runner";

interface CodeEditorProps {
  value: string;
  grammar: Grammar;
  onChange: (value: string) => void;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const TAB = "  ";

// The textarea and the highlighted <pre> must share identical metrics.
const textMetrics =
  "m-0 whitespace-pre p-4 font-mono text-[12px] leading-6 [tab-size:2]";

/**
 * A lightweight editor: a transparent <textarea> typed into, layered over a
 * syntax-highlighted <pre> that mirrors its content and scroll position.
 */
export function CodeEditor({ value, grammar, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const pendingCaret = useRef<number | null>(null);

  // Restore the caret after a programmatic edit (Tab) re-renders the textarea.
  useLayoutEffect(() => {
    if (pendingCaret.current !== null && textareaRef.current) {
      textareaRef.current.setSelectionRange(
        pendingCaret.current,
        pendingCaret.current,
      );
      pendingCaret.current = null;
    }
  }, [value]);

  const highlighted = Prism.languages[grammar]
    ? Prism.highlight(value, Prism.languages[grammar], grammar)
    : escapeHtml(value);

  const lineCount = value.split("\n").length;

  function syncScroll() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (preRef.current) {
      preRef.current.scrollTop = textarea.scrollTop;
      preRef.current.scrollLeft = textarea.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = textarea.scrollTop;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    pendingCaret.current = selectionStart + TAB.length;
    onChange(
      value.slice(0, selectionStart) + TAB + value.slice(selectionEnd),
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div
        ref={gutterRef}
        aria-hidden
        className="w-12 shrink-0 select-none overflow-hidden py-4 pr-3 text-right font-mono text-[12px] leading-6 text-muted-foreground/60"
      >
        {Array.from({ length: lineCount }, (_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <pre
          ref={preRef}
          aria-hidden
          className={`pointer-events-none absolute inset-0 overflow-hidden text-foreground/90 ${textMetrics}`}
        >
          <code dangerouslySetInnerHTML={{ __html: `${highlighted}\n` }} />
        </pre>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          aria-label="Code editor"
          className={`absolute inset-0 size-full resize-none overflow-auto bg-transparent text-transparent caret-primary outline-none selection:bg-primary/25 ${textMetrics}`}
        />
      </div>
    </div>
  );
}
