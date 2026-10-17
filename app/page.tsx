import Link from "next/link";
import HeroScene from "@/components/HeroScene";

const steps = [
  {
    n: "01",
    title: "Capture it in a click",
    text: "Save a snippet the moment you write it, with its language, tags and notes.",
    code: "snippet.save(code)",
  },
  {
    n: "02",
    title: "Find it fast",
    text: "Search and filter across everything you've kept, so nothing gets buried.",
    code: "search('debounce')",
  },
  {
    n: "03",
    title: "Reuse it anywhere",
    text: "Copy it into any project, or open it in the playground and keep building.",
    code: "npx snip use hook",
  },
];

export default function Home() {
  return (
      <main>
        {/* HERO */}
        <section className="ss-hero">
          <div className="ss-copy">
            <span className="ss-badge">YOUR NEXT GOOD IDEA, SAVED.</span>
            <h1>
              Keep the code.
              <br />
              Build the idea.
            </h1>
            <p>
              A little space for the snippets you reach for, the experiments you
              get lost in, and everything you&apos;ll build next.
            </p>
            <div className="ss-cta">
              <Link href="/workspace" className="ss-btn ss-btn-lime">Open your workspace</Link>
              <Link href="/playground" className="ss-btn ss-btn-ghost">Try the playground</Link>
            </div>
            <small className="ss-muted">Less searching. More shipping.</small>
          </div>

          <div className="ss-visual">
            <div className="ss-canvas" aria-hidden>
              <HeroScene />
            </div>
            <div className="ss-cards">
              <div className="ss-card ss-card-1">
                <h3>useDebounce.ts</h3>
                <pre>{`export function useDebounce(value) {
  const [state, setState] = useState(value)
  return state
}`}</pre>
              </div>
              <div className="ss-card ss-card-2">
                <h3>a little idea.tsx</h3>
                <pre>{`const idea = await playground.create();
const next = save(idea);`}</pre>
              </div>
              <div className="ss-card ss-card-3">
                <h3>Your best code. Never lost.</h3>
                <code>SNIPPET SAVED / READY WHEN YOU ARE</code>
              </div>
            </div>
          </div>
        </section>

        <p className="ss-ticker">CAPTURE / ORGANIZE / EXPERIMENT / REUSE</p>

        {/* WHY */}
        <section className="ss-section">
          <div className="ss-section-head">
            <h2>
              Good code deserves more
              <br />
              than a forgotten tab.
            </h2>
            <p>
              Every useful little thing starts as a passing thought. Turn it into
              a snippet you can actually find again.
            </p>
          </div>
          <div className="ss-grid-3">
            {steps.map((s) => (
                <article key={s.n} className="ss-panel">
                  <span className="ss-num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <code className="ss-mini-code">{s.code}</code>
                </article>
            ))}
          </div>
        </section>

        {/* PLAYGROUND */}
        <section className="ss-section">
          <div className="ss-section-head ss-section-head-row">
            <div>
              <span className="ss-eyebrow">A LITTLE PLAYGROUND</span>
              <h2>Think it. Try it. Keep it.</h2>
              <p>
                A focused playground for the ideas that can&apos;t wait. Explore
                your code, then bring the good parts back to your stack.
              </p>
            </div>
            <Link href="/playground" className="ss-btn ss-btn-lime">Explore the playground</Link>
          </div>

          <div className="ss-playground">
            <div className="ss-pg-bar">
              <span>playground.tsx</span>
              <span>Next: ideas.ts</span>
            </div>
            <div className="ss-pg-body">
            <pre className="ss-editor">{`import { useState } from "react";

export function Idea() {
  const [saved, setSaved] = useState(false);
  return (
    <button onClick={() => setSaved(true)}>
      {saved ? "Kept." : "Keep it"}
    </button>
  );
}`}</pre>
              <div className="ss-pg-side">
                <small>THE FIRST SMALL STEP</small>
                <h3>Make it count.</h3>
                <Link href="/playground" className="ss-btn ss-btn-lime">Start playing</Link>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="ss-final">
          <h2>Your next project starts with a little snippet.</h2>
          <p>Keep what you learn. Build what comes next.</p>
          <Link href="/workspace" className="ss-btn ss-btn-lime">Start your stack</Link>
        </section>
      </main>
  );
}