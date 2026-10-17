"use client";

import { useLayoutEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-markdown";

import type { SupportedLanguages } from "@/app/types";

interface CodeEditorProps {
  value: string;
  /** Any Prism grammar name ("javascript", "markup", "python", ...). Unknown names render unhighlighted. */
  grammar: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Lets an external <label htmlFor> point at the textarea. */
  id?: string;
  invalid?: boolean;
  describedBy?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const TAB = "  ";
const MODIFIER_KEYS = ["Shift", "Control", "Alt", "Meta"];

// The textarea and the highlighted <pre> must share identical metrics.
const textMetrics =
  "m-0 whitespace-pre p-4 font-mono text-[12px] leading-6 [tab-size:2]";

/**
 * A lightweight editor: a transparent <textarea> typed into, layered over a
 * syntax-highlighted <pre> that mirrors its content and scroll position.
 */
export function CodeEditor({
  value,
  grammar,
  onChange,
  placeholder,
  id,
  invalid,
  describedBy,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const escapePressed = useRef(false);

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

  const highlighted = Prism.languages[grammar as any]
    ? Prism.highlight(value, Prism.languages[grammar as any], grammar)
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
    if (event.key === "Escape") {
      escapePressed.current = true;
      return;
    }
    if (MODIFIER_KEYS.includes(event.key)) return;
    if (event.key !== "Tab") {
      escapePressed.current = false;
      return;
    }
    if (event.shiftKey || escapePressed.current) {
      escapePressed.current = false;
      return; // let the browser move focus
    }

    event.preventDefault();
    const { selectionStart, selectionEnd } = event.currentTarget;
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
        {value === "" && placeholder && (
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 overflow-hidden text-muted-foreground/60 ${textMetrics}`}
          >
            {placeholder}
          </span>
        )}
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            escapePressed.current = false;
          }}
          onScroll={syncScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          aria-label={id ? undefined : "Code editor"}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`absolute inset-0 size-full resize-none overflow-auto bg-transparent text-transparent caret-primary outline-none selection:bg-primary/25 ${textMetrics}`}
        />
      </div>
    </div>
  );
}
