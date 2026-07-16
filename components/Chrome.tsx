'use client';
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import ScrollToTop from "./ScrollToTop";
import BackToTop from "./BackToTop/BackToTop";
import ThemeToggle from "./ThemeToggle/ThemeToggle";
import NeonCircuit from "./NeonCircuit/NeonCircuit";
import ProjectFrame from "./ProjectFrame/ProjectFrame";
import { cards } from "./Cards/Cards.config";
import type { ReactNode } from "react";

type ProjectMeta = {
  index: string;
  label: string;
  title: string;
  desc: string;
  tags: string[];
};

// Project metadata keyed by route path, derived from the Projects cards.
const PROJECTS = cards.reduce<Record<string, ProjectMeta>>((acc, card, i) => {
  acc['/' + card.label] = {
    index: String(i + 1).padStart(2, '0'),
    label: card.label,
    title: card.text,
    desc: card.desc,
    tags: card.tags || [],
  };
  return acc;
}, {});

// Global chrome shared across all routes.
export default function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isHome = pathname === "/";
  // Website design demos are full-bleed pages with their own branding.
  const isWebsite = pathname.startsWith("/websites/");
  // Match the current route to a project (e.g. /records, /posts/the-sun).
  const projectKey = Object.keys(PROJECTS).find((p) => pathname.startsWith(p));
  const project = !isHome && projectKey ? PROJECTS[projectKey] : null;

  // Keep :active working on mobile after a tap (empty touchstart listener).
  useEffect(() => {
    const isMobile = /Mobile/.test(window.navigator.userAgent);
    if (!isMobile) return;
    const noop = () => {};
    document.body.addEventListener('touchstart', noop, false);
    return () => document.body.removeEventListener('touchstart', noop, false);
  }, []);

  let content;
  if (isHome || isWebsite) {
    content = children;                         // full-bleed designs
  } else if (project) {
    // The drum machine's step grid needs extra horizontal room.
    const wide = projectKey === "/drum-machine";
    content = <ProjectFrame {...project} wide={wide}>{children}</ProjectFrame>;
  } else {
    content = <div className="page">{children}</div>; // fallback (e.g. 404)
  }

  return (
    <>
      <NeonCircuit />
      {content}
      <ScrollToTop />
      <BackToTop />
      <ThemeToggle />
    </>
  );
}
