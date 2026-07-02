// Default quiz content. Used the first time, before anything is saved
// to localStorage by the admin page.

const DEFAULT_QUESTIONS = [
  {
    q: "How firm do you like it?",
    options: [
      { text: "Soft",   tag: "soft" },
      { text: "Medium", tag: "medium" },
      { text: "Firm",   tag: "firm" },
    ],
  },
  {
    q: "How do you sleep?",
    options: [
      { text: "On my side",  tag: "soft" },
      { text: "On my back",  tag: "medium" },
      { text: "On my front", tag: "firm" },
    ],
  },
  {
    q: "Do you sleep hot?",
    options: [
      { text: "Yes, I run hot", tag: "cooling" },
      { text: "No, I'm fine",   tag: "medium" },
    ],
  },
];

const DEFAULT_PRODUCTS = [
  { name: "Cloud Soft",  desc: "Plush comfort for side sleepers.", tags: ["soft"] },
  { name: "Balance Mid", desc: "All-round medium support.",        tags: ["medium"] },
  { name: "Solid Firm",  desc: "Firm support for back/front.",     tags: ["firm"] },
  { name: "Cool Breeze", desc: "Temperature-regulating comfort.",  tags: ["cooling", "medium"] },
];

window.DEFAULT_QUESTIONS = DEFAULT_QUESTIONS;
window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;
