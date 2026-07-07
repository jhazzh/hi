'use client';
import { useState, useEffect } from "react";
import "./ThemeToggle.css";

type Theme = "light" | "dark";

// Global light/dark toggle. Persists to localStorage and sets
// data-theme on <html> so the CSS variables in index.css flip.
// Browser APIs are read only after mount so it prerenders safely.
const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("dark"); // dark default; corrected on mount

  // Read the saved choice once, on the client. Default is dark.
  useEffect(() => {
    let initial: Theme = "dark";
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") initial = saved;
    } catch { /* ignore */ }
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch { /* ignore */ }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
};

export default ThemeToggle;
