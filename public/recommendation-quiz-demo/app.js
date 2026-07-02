// View switching. No page reload — we just toggle which <main> is visible
// and re-render that view from localStorage.

(() => {
  const views = {
    quiz: document.getElementById("view-quiz"),
    admin: document.getElementById("view-admin"),
  };
  const links = document.querySelectorAll(".nav__link");

  function show(name) {
    Object.entries(views).forEach(([key, el]) =>
      el.classList.toggle("is-active", key === name)
    );
    links.forEach((l) =>
      l.classList.toggle("is-active", l.dataset.view === name)
    );

    // Re-render so each view reflects the latest saved data.
    if (name === "quiz") Quiz.start();
    if (name === "admin") Admin.render();
  }

  links.forEach((l) => l.addEventListener("click", () => show(l.dataset.view)));

  Admin.init();
  show("quiz");
})();
