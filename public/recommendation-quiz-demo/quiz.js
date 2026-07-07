// Quiz flow. Reads questions/products from the Store (localStorage),
// and saves each completed result back to the Store.

const Quiz = (() => {
  const state = { step: 0, tags: [], questions: [], products: [] };

  let body, bar;

  /**
   * Pick the product whose tags best match the collected answer tags.
   * @param {string[]} tags answer tags collected from the user
   * @return {object} best-matching product
   */
  function recommend(tags) {
    let best = state.products[0];
    let bestScore = -1;
    for (const p of state.products) {
      const score = p.tags.filter((t) => tags.includes(t)).length;
      if (score > bestScore) {
        best = p;
        bestScore = score;
      }
    }
    return best;
  }

  function setProgress() {
    bar.style.width = `${(state.step / state.questions.length) * 100}%`;
  }

  function renderQuestion() {
    const { q, options } = state.questions[state.step];
    body.innerHTML = `
      <p class="question">${q}</p>
      <div class="options">
        ${options
          .map((o, i) => `<button class="option" data-i="${i}">${o.text}</button>`)
          .join("")}
      </div>`;

    body.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tags.push(options[btn.dataset.i].tag);
        state.step++;
        setProgress();
        state.step < state.questions.length ? renderQuestion() : renderResult();
      });
    });
  }

  function renderResult() {
    const p = recommend(state.tags);
    bar.style.width = "100%";

    Store.addResult({ product: p.name, tags: state.tags, at: new Date().toISOString() });

    body.innerHTML = `
      <div class="result">
        <p class="result__label">We recommend</p>
        <h2 class="result__name">${p.name}</h2>
        <p class="result__desc">${p.desc}</p>
        <button class="restart" id="restart">Start over</button>
      </div>`;

    document.getElementById("restart").addEventListener("click", start);
  }

  // (Re)start the quiz with the latest saved content.
  function start() {
    body = document.getElementById("body");
    bar = document.getElementById("bar");
    state.step = 0;
    state.tags = [];
    state.questions = Store.getQuestions();
    state.products = Store.getProducts();
    setProgress();
    renderQuestion();
  }

  return { start };
})();

window.Quiz = Quiz;
