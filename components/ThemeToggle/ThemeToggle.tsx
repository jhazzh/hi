'use client';
import { useState, useEffect, useRef } from "react";
import "./ThemeToggle.css";

type Theme = "light" | "dark" | "neon";

const THEMES: { id: Theme; icon: string; label: string }[] = [
  { id: "neon", icon: "⚡", label: "Neon" },
  { id: "light", icon: "☀", label: "Light" },
  { id: "dark", icon: "☾", label: "Dark" },
];

// Global theme picker. Persists to localStorage and sets data-theme on <html>
// so the CSS variables in theme.css flip. Browser APIs are read only after
// mount so it prerenders safely.
const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("neon"); // neon default; corrected on mount
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Read the saved choice once, on the client. Default is neon.
  useEffect(() => {
    let initial: Theme = "neon";
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark" || saved === "neon") initial = saved;
    } catch { /* ignore */ }
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch { /* ignore */ }
  }, [theme]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="theme-menu" ref={wrapRef}>
      <button
        className="theme-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Theme: ${current.label}`}
        title={`Theme: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {current.icon}
      </button>

      {open && (
        <div className="theme-menu__list" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="menuitemradio"
              aria-checked={t.id === theme}
              className={"theme-menu__item" + (t.id === theme ? " is-active" : "")}
              onClick={() => { setTheme(t.id); setOpen(false); }}
            >
              <span className="theme-menu__icon" aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
