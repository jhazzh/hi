import Link from "next/link";
import type { ReactNode } from "react";
import "./ProjectFrame.css";

type ProjectFrameProps = {
  index: string;
  label: string;
  title: string;
  desc?: string;
  tags?: string[];
  wide?: boolean;            // widen the inner container (e.g. drum machine grid)
  children: ReactNode;
};

// Shared shell for every project page — implements ProjectFrame.dc: back-to-home
// header, project index/label eyebrow, serif title, description, tags, and a
// bordered content region where the actual app (children) mounts. Fixed
// dark/lime theme to match the landing page.
export default function ProjectFrame({
  index, label, title, desc, tags = [], wide = false, children,
}: ProjectFrameProps) {
  return (
    <div className="pfr">
      <div className={"pfr__inner" + (wide ? " pfr__inner--wide" : "")}>

        <header className="pfr__head">
          <Link href="/" className="pfr__back back-link">
            <span className="pfr__back-arrow back-arrow">←</span>
            jhazzh
          </Link>
          <span className="pfr__kicker">
            <span className="pfr__kicker-dot" />
            project
          </span>
        </header>

        <section className="pfr__intro">
          <p className="pfr__eyebrow">{index} · {label}</p>
          <h1 className="pfr__title">{title}</h1>
          {desc && <p className="pfr__desc">{desc}</p>}
          {tags.length > 0 && (
            <div className="pfr__tags">
              {tags.map((t) => <span key={t} className="pfr__tag">{t}</span>)}
            </div>
          )}
        </section>

        <main className="pfr__stage">{children}</main>

        <footer className="pfr__footer">
          <Link href="/" className="pfr__back back-link">← all projects</Link>
          <span>jhazzh © {new Date().getFullYear()}</span>
        </footer>

      </div>
    </div>
  );
}
