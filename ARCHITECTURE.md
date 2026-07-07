# Architecture — hi-next

Next.js 16 (App Router) static export of 11 small web apps, deployed to GitHub Pages at `/hi`.

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Output | `output: 'export'` → static `out/` |
| Base path | `/hi` |
| Styling | CSS + Sass; shared tokens in `public/theme.css` |
| Data | Sanity (GROQ), fetched at build (SSG) |
| Theme | Dark default; light/dark via `data-theme` |
| Deploy | `npm run deploy` (`gh-pages -d out -t`) |

## Layout

- `app/layout.tsx` — links `theme.css`, pre-paint theme script, wraps pages in `Chrome`.
- `components/Chrome.js` — routes → shell: Home = full-bleed landing; project pages = `ProjectFrame`; renders `ThemeToggle`, `ScrollToTop`, `BackToTop`.
- `components/Home/` — landing design (Portfolio.dc).
- `components/ProjectFrame/` — shared shell for all project pages (ProjectFrame.dc).
- `components/Cards/Cards.config.js` — single source for project list (drives Home, frame, routes).

## Routes

`app/<name>/page.tsx` per app. Sanity pages are server components (SSG): `posts`, `posts/[slug]` (`generateStaticParams`), `planets`. Quiz is a route hosting vanilla scripts from `public/recommendation-quiz-demo/`.

## Deploy notes

- `.nojekyll` in `public/` so GitHub Pages serves `_next/`.
- `trailingSlash: false` → `route.html`.
