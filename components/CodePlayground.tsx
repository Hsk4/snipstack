"use client";

import { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";

import { Play, RotateCcw, Copy, Check, Trash2, Code2, Terminal, Sparkles } from "lucide-react";

interface ConsoleLog {
    id: string;
    type: "log" | "warn" | "error" | "info";
    content: string;
    timestamp: string;
}

const TEMPLATES = {
    javascript: `// JavaScript Playground
const fetchUserData = async () => {
  console.time("Execution Time");
  console.log("Fetching simulated user payload...");
  
  const user = {
    id: "usr_101",
    name: "Alex Dev",
    role: "Fullstack Developer",
    skills: ["Next.js", "Supabase", "TypeScript"]
  };

  console.warn("Notice: Authentication session active.");
  console.log("User retrieved:", user);
  console.timeEnd("Execution Time");
};

fetchUserData();`,
    json: `{\n  "appName": "SnippetVault",\n  "status": "Active",\n  "database": "Supabase PostgreSQL",\n  "version": "1.0.0"\n}`,
    html: `<div style="padding: 30px; font-family: sans-serif; background: #0f172a; color: #f8fafc; border-radius: 12px; max-width: 500px;">\n  <h2 style="color: #38bdf8; margin-top: 0;">Hello from Live Preview!</h2>\n  <p>Render interactive HTML & Inline CSS right inside SnippetVault.</p>\n  <button onclick="alert('Playground Interactive!')" style="padding: 10px 20px; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Click Me</button>\n</div>`
};

const KEYWORDS = [
    "console.log",
    "console.warn",
    "console.error",
    "console.time",
    "console.timeEnd",
    "function",
    "const",
    "let",
    "return",
    "async",
    "await",
    "Promise",
    "Math.random",
    "Math.floor",
    "JSON.stringify",
    "JSON.parse",
    "Object.keys",
    "Array.from",
    "setTimeout",
    "setInterval"
];

export function CodePlayground() {
    const [mounted, setMounted] = useState(false);
    const [language, setLanguage] = useState<"javascript" | "json" | "html">("javascript");
    const [code, setCode] = useState(TEMPLATES.javascript);
    const [logs, setLogs] = useState<ConsoleLog[]>([]);
    const [copied, setCopied] = useState(false);
    const [executionTime, setExecutionTime] = useState<number | null>(null);

    // Suggestions state
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [suggestionCoords, setSuggestionCoords] = useState<{ top: number; left: number } | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            Prism.highlightAll();
        }
    }, [code, language, mounted]);

    const handleLanguageChange = (lang: "javascript" | "json" | "html") => {
        setLanguage(lang);
        setCode(TEMPLATES[lang]);
        setLogs([]);
        setExecutionTime(null);
        setSuggestions([]);
    };

    const handleRun = () => {
        if (language === "html") return;

        setLogs([]);
        const capturedLogs: ConsoleLog[] = [];
        const startTime = performance.now();

        const createLog = (type: ConsoleLog["type"], args: unknown[]) => {
            const formatted = args
                .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
                .join(" ");

            capturedLogs.push({
                id: Math.random().toString(36).substring(2, 9),
                type,
                content: formatted,
                timestamp: new Date().toLocaleTimeString(),
            });
        };

        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args: unknown[]) => createLog("log", args);
        console.warn = (...args: unknown[]) => createLog("warn", args);
        console.error = (...args: unknown[]) => createLog("error", args);

        try {
            if (language === "json") {
                const parsed = JSON.parse(code);
                createLog("info", ["Valid JSON structure:", parsed]);
            } else {
                new Function(code)();
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                createLog("error", [`Uncaught ${err.name}: ${err.message}`]);
            } else {
                createLog("error", ["Execution error occurred."]);
            }
        } finally {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
            const endTime = performance.now();
            setExecutionTime(Number((endTime - startTime).toFixed(2)));
            setLogs(capturedLogs);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setCode(val);

        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorPos);
        const lastWordMatch = textBeforeCursor.match(/[\w.]+$ /);
        const word = textBeforeCursor.split(/[\s,();{}]+/).pop() || "";

        if (word.length >= 2 && language === "javascript") {
            const matches = KEYWORDS.filter((kw) => kw.toLowerCase().startsWith(word.toLowerCase()));
            if (matches.length > 0) {
                setSuggestions(matches);
                setSelectedIndex(0);

                // Approximate floating position near cursor
                const lines = textBeforeCursor.split("\n");
                const currentLine = lines.length;
                const col = lines[lines.length - 1].length;
                setSuggestionCoords({ top: currentLine * 22 + 20, left: Math.min(col * 8 + 20, 300) });
                return;
            }
        }
        setSuggestions([]);
    };

    const applySuggestion = (suggestion: string) => {
        if (!textareaRef.current) return;
        const cursorPos = textareaRef.current.selectionStart;
        const textBeforeCursor = code.slice(0, cursorPos);
        const textAfterCursor = code.slice(cursorPos);

        const words = textBeforeCursor.split(/([\s,();{}]+)/);
        words[words.length - 1] = suggestion;

        const newText = words.join("") + textAfterCursor;
        setCode(newText);
        setSuggestions([]);

        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = words.join("").length;
                textareaRef.current.selectionStart = newPos;
                textareaRef.current.selectionEnd = newPos;
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (suggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                applySuggestion(suggestions[selectedIndex]);
            } else if (e.key === "Escape") {
                setSuggestions([]);
            }
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl shadow-md">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 rounded-lg border border-zinc-700/50 text-xs text-zinc-300 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Mode:</span>
                        <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value as "javascript" | "json" | "html")}
                            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                        >
                            <option value="javascript" className="bg-zinc-900">JavaScript Sandbox</option>
                            <option value="json" className="bg-zinc-900">JSON Inspector</option>
                            <option value="html" className="bg-zinc-900">HTML Live Preview</option>
                        </select>
                    </div>

                    {executionTime !== null && (
                        <span className="text-xs text-zinc-400 font-mono">
              Executed in <span className="text-emerald-400 font-semibold">{executionTime}ms</span>
            </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy Code"}
                    </button>

                    <button
                        onClick={() => {
                            setCode(TEMPLATES[language]);
                            setSuggestions([]);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </button>

                    {language !== "html" && (
                        <button
                            onClick={handleRun}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition shadow-lg shadow-sky-600/20 active:scale-95"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Run Code
                        </button>
                    )}
                </div>
            </div>

            {/* Main Large Workspace Grid (Increased to min-h-[650px]) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[650px]">
                {/* Editor Side */}
                <div className="relative flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              Source Editor ({language.toUpperCase()})
            </span>
                        <span className="text-[11px] text-zinc-500">Auto-suggestions enabled</span>
                    </div>

                    <div className="relative flex-1 font-mono text-sm">
            <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none font-mono text-sm leading-relaxed focus:outline-none z-10"
            />

                        {/* Suggestions Floating Popup */}
                        {suggestions.length > 0 && suggestionCoords && (
                            <div
                                style={{ top: `${suggestionCoords.top}px`, left: `${suggestionCoords.left}px` }}
                                className="absolute z-20 w-52 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden text-xs font-mono"
                            >
                                {suggestions.map((item, idx) => (
                                    <div
                                        key={item}
                                        onClick={() => applySuggestion(item)}
                                        className={`px-3 py-1.5 cursor-pointer flex items-center justify-between ${
                                            idx === selectedIndex ? "bg-sky-600 text-white font-bold" : "text-zinc-300 hover:bg-zinc-800"
                                        }`}
                                    >
                                        <span>{item}</span>
                                        <span className="text-[10px] opacity-60">KW</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {mounted ? (
                            <pre
                                suppressHydrationWarning
                                className="pointer-events-none absolute inset-0 w-full h-full p-4 m-0 overflow-auto font-mono text-sm leading-relaxed z-0 bg-transparent"
                            >
                <code className={`language-${language}`}>{code}</code>
              </pre>
                        ) : (
                            <pre className="pointer-events-none absolute inset-0 w-full h-full p-4 m-0 overflow-auto font-mono text-sm leading-relaxed z-0 bg-transparent text-zinc-300">
                <code>{code}</code>
              </pre>
                        )}
                    </div>
                </div>

                {/* Large Console / Preview Side */}
                <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
                {language === "html" ? "Live Render Preview" : "Console Output"}
            </span>
                        {logs.length > 0 && (
                            <button
                                onClick={() => setLogs([])}
                                className="hover:text-red-400 transition"
                                title="Clear console"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 p-4 font-mono text-xs overflow-y-auto">
                        {language === "html" ? (
                            <iframe
                                title="HTML Preview"
                                srcDoc={code}
                                className="w-full h-full min-h-[550px] bg-white rounded-md border-0"
                            />
                        ) : logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 select-none">
                                <Terminal className="w-10 h-10 stroke-[1.5]" />
                                <p>Click "Run Code" to inspect output logs...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className={`p-3 rounded-lg border font-mono whitespace-pre-wrap leading-relaxed ${
                                            log.type === "error"
                                                ? "bg-red-950/40 border-red-800/50 text-red-300"
                                                : log.type === "warn"
                                                    ? "bg-amber-950/40 border-amber-800/50 text-amber-300"
                                                    : log.type === "info"
                                                        ? "bg-sky-950/40 border-sky-800/50 text-sky-300"
                                                        : "bg-zinc-900/80 border-zinc-800 text-zinc-200"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                                            <span>[{log.type.toUpperCase()}]</span>
                                            <span>{log.timestamp}</span>
                                        </div>
                                        <div>{log.content}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}