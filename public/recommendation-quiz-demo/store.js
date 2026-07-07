// Tiny persistence layer over localStorage. Acts as the "database"
// for questions, products, and saved quiz results.

const KEYS = {
  questions: "quiz.questions",
  products: "quiz.products",
  results: "quiz.results",
};

/**
 * Read a JSON value from localStorage, falling back to a default.
 * @param {string} key storage key
 * @param {*} fallback value returned when nothing is stored
 * @return {*} parsed value or the fallback
 */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a JSON value to localStorage.
 * @param {string} key storage key
 * @param {*} value serializable value to store
 * @return {void}
 */
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const Store = {
  getQuestions: () => read(KEYS.questions, DEFAULT_QUESTIONS),
  setQuestions: (q) => write(KEYS.questions, q),

  getProducts: () => read(KEYS.products, DEFAULT_PRODUCTS),
  setProducts: (p) => write(KEYS.products, p),

  getResults: () => read(KEYS.results, []),
  addResult: (r) => write(KEYS.results, [...read(KEYS.results, []), r]),
  clearResults: () => localStorage.removeItem(KEYS.results),
};

window.Store = Store;
