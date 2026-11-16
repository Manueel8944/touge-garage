// escapeHtml.js — evita XSS al meter texto en el HTML
// se usa siempre que se pongan datos de la base de datos
const ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text = "") {
  return String(text).replace(/[&<>"']/g, (char) => ENTITIES[char]);
}
