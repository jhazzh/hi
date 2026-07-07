// Admin view: edit questions and products, and review saved results.
// Everything persists to localStorage via the Store.

const Admin = (() => {
  function render() {
    renderQuestions();
    renderProducts();
    renderResults();
  }

  // --- Questions ---
  function renderQuestions() {
    const wrap = document.getElementById("admin-questions");
    const questions = Store.getQuestions();

    wrap.innerHTML = questions
      .map(
        (q, i) => `
        <div class="question-edit">
          <div class="row">
            <input class="input" data-q="${i}" value="${escapeAttr(q.q)}" placeholder="Question" />
            <button class="btn btn--ghost" data-del-q="${i}">✕</button>
          </div>
          <div class="options-edit">
            ${q.options
              .map(
                (o, j) => `
              <div class="row row--indent">
                <input class="input" data-opt-text="${i}.${j}" value="${escapeAttr(o.text)}" placeholder="Option" />
                <input class="input input--tag" data-opt-tag="${i}.${j}" value="${escapeAttr(o.tag)}" placeholder="tag" />
                <button class="btn btn--ghost" data-del-opt="${i}.${j}">✕</button>
              </div>`
              )
              .join("")}
            <button class="btn btn--ghost btn--sm" data-add-opt="${i}">+ Add option</button>
          </div>
        </div>`
      )
      .join("");

    // Question text
    wrap.querySelectorAll("[data-q]").forEach((inp) => {
      inp.addEventListener("input", () => {
        questions[inp.dataset.q].q = inp.value;
        Store.setQuestions(questions);
      });
    });
    // Delete question
    wrap.querySelectorAll("[data-del-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        questions.splice(btn.dataset.delQ, 1);
        Store.setQuestions(questions);
        renderQuestions();
      });
    });
    // Option text
    wrap.querySelectorAll("[data-opt-text]").forEach((inp) => {
      inp.addEventListener("input", () => {
        const [q, o] = inp.dataset.optText.split(".");
        questions[q].options[o].text = inp.value;
        Store.setQuestions(questions);
      });
    });
    // Option tag
    wrap.querySelectorAll("[data-opt-tag]").forEach((inp) => {
      inp.addEventListener("input", () => {
        const [q, o] = inp.dataset.optTag.split(".");
        questions[q].options[o].tag = inp.value.trim();
        Store.setQuestions(questions);
      });
    });
    // Delete option
    wrap.querySelectorAll("[data-del-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [q, o] = btn.dataset.delOpt.split(".");
        questions[q].options.splice(o, 1);
        Store.setQuestions(questions);
        renderQuestions();
      });
    });
    // Add option
    wrap.querySelectorAll("[data-add-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        questions[btn.dataset.addOpt].options.push({ text: "Option", tag: "tag" });
        Store.setQuestions(questions);
        renderQuestions();
      });
    });
  }

  // --- Products ---
  function renderProducts() {
    const wrap = document.getElementById("admin-products");
    const products = Store.getProducts();

    wrap.innerHTML = products
      .map(
        (p, i) => `
        <div class="row">
          <input class="input" data-p-name="${i}" value="${escapeAttr(p.name)}" placeholder="Name" />
          <input class="input" data-p-tags="${i}" value="${escapeAttr(p.tags.join(", "))}" placeholder="tags" />
          <button class="btn btn--ghost" data-del-p="${i}">✕</button>
        </div>`
      )
      .join("");

    wrap.querySelectorAll("[data-p-name]").forEach((inp) => {
      inp.addEventListener("input", () => {
        products[inp.dataset.pName].name = inp.value;
        Store.setProducts(products);
      });
    });
    wrap.querySelectorAll("[data-p-tags]").forEach((inp) => {
      inp.addEventListener("input", () => {
        products[inp.dataset.pTags].tags = inp.value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        Store.setProducts(products);
      });
    });
    wrap.querySelectorAll("[data-del-p]").forEach((btn) => {
      btn.addEventListener("click", () => {
        products.splice(btn.dataset.delP, 1);
        Store.setProducts(products);
        renderProducts();
      });
    });
  }

  // --- Saved results ---
  function renderResults() {
    const wrap = document.getElementById("admin-results");
    const results = Store.getResults();

    if (!results.length) {
      wrap.innerHTML = `<p class="muted">No results saved yet.</p>`;
      return;
    }

    wrap.innerHTML = `
      <table class="table">
        <thead><tr><th>Product</th><th>Tags</th><th>When</th></tr></thead>
        <tbody>
          ${results
            .map(
              (r) => `<tr>
                <td>${r.product}</td>
                <td>${r.tags.join(", ")}</td>
                <td>${new Date(r.at).toLocaleString()}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
  }

  function init() {
    document.getElementById("add-question").addEventListener("click", () => {
      const questions = Store.getQuestions();
      questions.push({ q: "New question", options: [{ text: "Option", tag: "tag" }] });
      Store.setQuestions(questions);
      renderQuestions();
    });

    document.getElementById("add-product").addEventListener("click", () => {
      const products = Store.getProducts();
      products.push({ name: "New product", desc: "", tags: [] });
      Store.setProducts(products);
      renderProducts();
    });

    document.getElementById("clear-results").addEventListener("click", () => {
      Store.clearResults();
      renderResults();
    });
  }

  return { init, render };
})();

window.Admin = Admin;
