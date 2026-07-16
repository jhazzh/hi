import Link from 'next/link';
import { cards } from '../Cards/Cards.config';
import { websites } from '../Cards/Websites.config';
import './Home.css';

// Home page — implements the imported Portfolio.dc design: dark canvas, lime
// accent, hero, and a projects list. Hover is pure CSS (no JS state), so this
// stays a server component. Card data is the shared Cards.config.
const Home = () => {
  return (
    <div className="pf">
      <div className="pf__inner">

        <header className="pf__head">
          <span className="pf__brand">
            <span className="pf__brand-dot" />
            jhazzh
          </span>
          <span className="pf__status">
            <span className="pf__status-dot" />
            available
          </span>
        </header>

        <section className="pf__hero">
          <p className="pf__eyebrow">Building for the web</p>
          <h1 className="pf__title">Website designs and small, self-contained web apps.</h1>
          <p className="pf__lead">
            Full-page site designs built from scratch, plus finished app ideas — from
            the Web Audio API to live datasets. Pick one and open it.
          </p>
        </section>

        <section>
          <div className="pf__projects-head">
            <span className="pf__label">Websites</span>
            <span className="pf__count">designed &amp; built from scratch</span>
          </div>

          {websites.map((w, i) => {
            // Destination: the live site if hosted, else a screenshot of the
            // real build, else the in-portfolio demo page. Live builds and
            // screenshots are external/static files, so they open in a new tab.
            const external = w.live || w.shot;
            const row = (
              <>
                <span className="pf__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="pf__name">{w.text}</span>
                <span className="pf__desc">
                  {w.desc}
                  {w.livePassword && (
                    <span className="pf__pwrow">
                      Password: <mark className="pf__pw">{w.livePassword}</mark>
                    </span>
                  )}
                  {w.figma && (
                    <span className="pf__pwrow">
                      <a
                        href={w.figma}
                        target="_blank"
                        rel="noreferrer"
                        className="pf__figma"
                      >
                        Figma
                      </a>
                    </span>
                  )}
                </span>
                <span className="pf__tags">
                  {w.tags.map((t) => (
                    <span key={t} className="pf__tag">{t}</span>
                  ))}
                  {w.platform && (
                    <span className="pf__tag pf__tag--platform">{w.platform}</span>
                  )}
                </span>
                <span className="pf__arrow">→</span>
              </>
            );
            // Split row: the Figma link can't nest inside a row-wide anchor, so
            // the row is a div with an absolutely-positioned hit area instead.
            return (
              <div key={w.label} className="pf__row pf__row--split">
                {external ? (
                  <a
                    href={external}
                    target="_blank"
                    rel="noreferrer"
                    className="pf__row-hit"
                    aria-label={`Open ${w.text}`}
                  />
                ) : (
                  <Link
                    href={`/${w.label}`}
                    className="pf__row-hit"
                    aria-label={`Open ${w.text}`}
                  />
                )}
                {row}
              </div>
            );
          })}
        </section>

        <section className="pf__section-gap">
          <div className="pf__projects-head">
            <span className="pf__label">Projects</span>
            <span className="pf__count">{cards.length} total</span>
          </div>

          {cards.map((c, i) => (
            <Link key={c.label} href={`/${c.label}`} className="pf__row">
              <span className="pf__index">{String(i + 1).padStart(2, '0')}</span>
              <span className="pf__name">{c.text}</span>
              <span className="pf__desc">{c.desc}</span>
              <span className="pf__tags">
                {c.tags.map((t) => (
                  <span key={t} className="pf__tag">{t}</span>
                ))}
              </span>
              <span className="pf__arrow">→</span>
            </Link>
          ))}
        </section>

        <footer className="pf__footer">
          <span>jhazzh © {new Date().getFullYear()} — built to learn.</span>
          <a href="https://github.com/jhazzh" className="pf__footer-link">github.com/jhazzh →</a>
        </footer>

      </div>
    </div>
  );
};

export default Home;
