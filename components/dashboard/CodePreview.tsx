import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-markdown";

const PREVIEW_LINES = 5;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightLine(line: string, language: string): string {
  const grammar = Prism.languages[language];
  if (!grammar) return escapeHtml(line);
  return Prism.highlight(line, grammar, language);
}

/**
 * Line-numbered, syntax-highlighted preview of the first few lines of a snippet.
 * Each line is highlighted on its own, which is fine for a preview but means a
 * token that spans several lines (block comments, template strings) is only
 * coloured correctly on the line where it starts.
 */
export function CodePreview({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const lines = code.replace(/\r\n/g, "\n").split("\n").slice(0, PREVIEW_LINES);

  return (
    <pre className="m-0 overflow-hidden rounded-lg border border-border bg-background/60 px-4 py-3 font-mono text-[12px] leading-6">
      <code className="block">
        {lines.map((line, index) => (
          <span key={index} className="flex gap-4">
            <span
              aria-hidden
              className="w-3 shrink-0 select-none text-right text-muted-foreground/60"
            >
              {index + 1}
            </span>
            <span
              className="min-w-0 flex-1 whitespace-pre text-foreground/90"
              dangerouslySetInnerHTML={{
                __html: highlightLine(line, language) || "&nbsp;",
              }}
            />
          </span>
        ))}
      </code>
    </pre>
  );
}
