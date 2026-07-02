import Link from 'next/link';
import { cards } from '../Cards/Cards.config';
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
          <h1 className="pf__title">A working set of small, self-contained web apps.</h1>
          <p className="pf__lead">
            Each one is a finished idea — built to learn a corner of the platform, from
            the Web Audio API to live datasets. Pick one and open it.
          </p>
        </section>

        <section>
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
