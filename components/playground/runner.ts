export type PlaygroundLanguage = "html" | "javascript";

/** Prism grammar used to highlight a file. */
export type Grammar = "markup" | "css" | "javascript";

export interface PlaygroundFile {
  name: string;
  grammar: Grammar;
  content: string;
}

export interface LanguageConfig {
  id: PlaygroundLanguage;
  label: string;
  /** "preview" renders the page in the right panel; "console" shows logged output there. */
  runner: "preview" | "console";
  runLabel: string;
  files: PlaygroundFile[];
}

export interface ConsoleEntry {
  id: number;
  level: "log" | "info" | "warn" | "error";
  text: string;
}

const HTML_TEMPLATE: PlaygroundFile[] = [
  {
    name: "index.html",
    grammar: "markup",
    content: `<div class="counter-card">
  <span>THE LITTLE THINGS ADD UP</span>
  <h1>Make it count.</h1>
  <p>A small idea. A little momentum.</p>
  <button id="counter">Count is 0</button>
</div>`,
  },
  {
    name: "styles.css",
    grammar: "css",
    content: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0c0e11;
  color: #f1f3f5;
  font-family: system-ui, sans-serif;
}

.counter-card {
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 32px 48px;
  border: 1px solid #22262c;
  border-radius: 14px;
  background: #13161a;
  text-align: center;
}

.counter-card span {
  font-size: 11px;
  letter-spacing: 0.14em;
  color: #8a9099;
}

.counter-card h1 {
  margin: 0;
  font-size: 32px;
}

.counter-card p {
  margin: 0 0 8px;
  font-size: 13px;
  color: #8a9099;
}

button {
  padding: 8px 16px;
  border: 0;
  border-radius: 8px;
  background: #c5f26a;
  color: #0c0e11;
  font-weight: 600;
  cursor: pointer;
}
`,
  },
  {
    name: "script.js",
    grammar: "javascript",
    content: `let count = 0;
const button = document.getElementById("counter");

button.addEventListener("click", () => {
  count += 1;
  button.textContent = "Count is " + count;
  console.log("clicked", { count });
});
`,
  },
];

const JS_TEMPLATE: PlaygroundFile[] = [
  {
    name: "main.js",
    grammar: "javascript",
    content: `// Anything you log shows up in the output panel.
const user = { id: "usr_101", name: "Alex Dev", skills: ["Next.js", "Supabase"] };

console.log("User:", user);
console.info("Skills:", user.skills.length);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  await wait(300);
  console.warn("Heads up: this ran after a short delay");
  return user.skills.map((skill) => skill.toUpperCase());
}

main().then((result) => console.log("Done:", result));
`,
  },
];

export const LANGUAGES: Record<PlaygroundLanguage, LanguageConfig> = {
  html: {
    id: "html",
    label: "HTML + CSS + JS",
    runner: "preview",
    runLabel: "Run preview",
    files: HTML_TEMPLATE,
  },
  javascript: {
    id: "javascript",
    label: "JavaScript",
    runner: "console",
    runLabel: "Run code",
    files: JS_TEMPLATE,
  },
};

/** Forwards console output and uncaught errors to the parent window. */
const CONSOLE_BRIDGE = `<script>(function(){
  function fmt(v){
    if (typeof v === 'string') return v;
    if (v instanceof Error) return v.stack || v.message;
    if (typeof v === 'undefined') return 'undefined';
    if (typeof v === 'function') return v.toString();
    try { return JSON.stringify(v, null, 2); } catch (e) { return String(v); }
  }
  function send(level, args){
    try {
      parent.postMessage({ __playground: true, level: level, text: Array.prototype.map.call(args, fmt).join(' ') }, '*');
    } catch (e) {}
  }
  ['log','info','warn','error','debug'].forEach(function(name){
    var original = console[name];
    console[name] = function(){
      send(name === 'debug' ? 'log' : name, arguments);
      if (original) original.apply(console, arguments);
    };
  });
  window.addEventListener('error', function(e){
    send('error', [e.message]);
  });
  window.addEventListener('unhandledrejection', function(e){
    send('error', ['Unhandled promise rejection: ' + fmt(e.reason)]);
  });
})();</script>`;

function escapeScript(code: string): string {
  return code.replace(/<\/script/gi, "<\\/script");
}

function findFile(files: PlaygroundFile[], name: string): string {
  return files.find((file) => file.name === name)?.content ?? "";
}

function injectIntoDocument(html: string, head: string, body: string): string {
  let result = html;

  const headOpen = /<head[^>]*>/i.exec(result);
  const htmlOpen = /<html[^>]*>/i.exec(result);
  if (headOpen) {
    const at = headOpen.index + headOpen[0].length;
    result = result.slice(0, at) + head + result.slice(at);
  } else if (htmlOpen) {
    const at = htmlOpen.index + htmlOpen[0].length;
    result = `${result.slice(0, at)}<head>${head}</head>${result.slice(at)}`;
  } else {
    result = head + result;
  }

  const bodyClose = result.search(/<\/body>/i);
  return bodyClose === -1
    ? result + body
    : result.slice(0, bodyClose) + body + result.slice(bodyClose);
}

/**
 * Builds one self-contained HTML document from the playground files.
 * With `bridge`, console output is forwarded to the parent (used for the live
 * preview); without it the result is clean, portable HTML (used for saving).
 */
export function buildDocument(
  language: PlaygroundLanguage,
  files: PlaygroundFile[],
  { bridge }: { bridge: boolean },
): string {
  const bridgeHtml = bridge ? CONSOLE_BRIDGE : "";

  if (language === "javascript") {
    const script = `<script>${escapeScript(findFile(files, "main.js"))}</script>`;
    return `<!doctype html><html><head><meta charset="utf-8">${bridgeHtml}</head><body>${script}</body></html>`;
  }

  const markup = findFile(files, "index.html");
  const style = `<style>${findFile(files, "styles.css")}</style>`;
  const script = `<script>${escapeScript(findFile(files, "script.js"))}</script>`;
  const isFullDocument = /<html|<head|<!doctype/i.test(markup);

  if (isFullDocument) {
    return injectIntoDocument(markup, bridgeHtml + style, script);
  }
  return `<!doctype html><html><head><meta charset="utf-8">${bridgeHtml}${style}</head><body>${markup}${script}</body></html>`;
}

/** What gets stored when the user saves: a single string that fits the snippets table. */
export function toSnippetCode(
  language: PlaygroundLanguage,
  files: PlaygroundFile[],
): string {
  return language === "javascript"
    ? findFile(files, "main.js")
    : buildDocument("html", files, { bridge: false });
}
