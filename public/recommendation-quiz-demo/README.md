# Product Recommendation Quiz

A small, dependency-free demo of a guided product-recommendation quiz with an
admin page — the kind used on e-commerce storefronts to help shoppers pick a
product. No build step, no server, no database to set up.

## What it shows

- **Quiz**: multi-step flow with a progress bar; answers collect tags and a
  scoring function maps them to the best-matching product.
- **Admin**: edit the questions and products, and review every saved result.
- **Persistence**: questions, products, and results are stored in the browser
  with `localStorage` — acting as a lightweight client-side "database".
- **Single page**: switching between Quiz and Admin does **not** reload the page.

## Run it

Open `index.html` in any browser. That's it.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Markup, nav, and the two views |
| `styles.css` | Styling |
| `data.js`    | Default questions/products (first run) |
| `store.js`   | `localStorage` persistence layer |
| `quiz.js`    | Quiz flow + recommendation logic |
| `admin.js`   | Admin: edit content, view results |
| `app.js`     | View switching (no reload) |

## How it works

- Each answer adds a **tag** (e.g. `soft`, `firm`, `cooling`).
- After the last question, `recommend()` scores every product by how many tags
  match and returns the highest scorer.
- The result is saved via `Store.addResult()`; the admin page reads it back.
- Editing questions/products in the admin page writes to `localStorage`, so the
  quiz picks up the changes the next time it runs.

> Note: `localStorage` is per-browser and per-user — fine for a demo, but not a
> shared server-side database.
