'use client';
import { useEffect } from "react";

// The quiz is a small standalone vanilla-JS app. We host it as a normal Next
// route (same as every other page) by rendering its markup and loading its
// scripts from /public. Scripts define top-level `const Quiz/Store/Admin`, so
// they must load exactly once; per-mount wiring (nav + initial render) is done
// here so it also works after client-side navigation.

// basePath is not auto-applied to raw <script>/<link> URLs, so prefix it.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/hi";
const BASE = `${BASE_PATH}/recommendation-quiz-demo`;
const SCRIPTS = ["data.js", "store.js", "quiz.js", "admin.js"]; // app.js is inlined below

declare global {
  interface Window {
    Quiz?: { start: () => void };
    Admin?: { init: () => void; render: () => void };
    __quizLoaded?: boolean;
  }
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-quiz="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = `${BASE}/${src}`;
    s.dataset.quiz = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

export default function QuizPage() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Load the logic scripts once (const globals can't be redeclared).
      for (const src of SCRIPTS) {
        // eslint-disable-next-line no-await-in-loop
        await loadScriptOnce(src);
      }
      if (cancelled) return;

      // Per-mount wiring (what app.js does), so it re-runs on navigation.
      const views: Record<string, HTMLElement | null> = {
        quiz: document.getElementById("view-quiz"),
        admin: document.getElementById("view-admin"),
      };
      const links = Array.from(document.querySelectorAll<HTMLButtonElement>(".nav__link"));

      const show = (name: string) => {
        Object.entries(views).forEach(([key, el]) =>
          el?.classList.toggle("is-active", key === name)
        );
        links.forEach((l) => l.classList.toggle("is-active", l.dataset.view === name));
        if (name === "quiz") window.Quiz?.start();
        if (name === "admin") window.Admin?.render();
      };

      links.forEach((l) => l.addEventListener("click", () => show(l.dataset.view || "quiz")));
      window.Admin?.init();
      show("quiz");
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {/* Quiz's own stylesheet; shared theme tokens come from the global theme.css. */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`${BASE}/styles.css`} />

      <nav className="nav">
        <button className="nav__link is-active" data-view="quiz">Quiz</button>
        <button className="nav__link" data-view="admin">Admin</button>
      </nav>

      <main className="quiz view is-active" id="view-quiz">
        <header className="quiz__header">
          <h1>Find your match</h1>
          <div className="quiz__progress"><span id="bar" /></div>
        </header>
        <section className="quiz__body" id="body" />
      </main>

      <main className="admin view" id="view-admin">
        <h1>Admin</h1>

        <section className="panel">
          <h2>Questions</h2>
          <div id="admin-questions" />
          <button className="btn" id="add-question">+ Add question</button>
        </section>

        <section className="panel">
          <h2>Products</h2>
          <div id="admin-products" />
          <button className="btn" id="add-product">+ Add product</button>
        </section>

        <section className="panel">
          <div className="panel__row">
            <h2>Saved results</h2>
            <button className="btn btn--ghost" id="clear-results">Clear</button>
          </div>
          <div id="admin-results" />
        </section>
      </main>
    </>
  );
}
