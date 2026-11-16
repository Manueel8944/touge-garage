// categories.js — categorías de productos
// `value` es lo que se guarda en la base de datos y va en la URL
// (catalog.html?cat=escapes); `label` es el texto que se ve.
import { CATEGORIES } from "../constants/categories.js";

export { CATEGORIES };

// Busca una categoría por su value o por su label (sin mirar mayúsculas)
function find(text) {
  const wanted = String(text || "")
    .trim()
    .toLowerCase();
  return CATEGORIES.find(
    (c) => c.value === wanted || c.label.toLowerCase() === wanted,
  );
}

// "Frenos" o "frenos"  →  "frenos"  ("" si no existe)
export const categoryValue = (text) => find(text)?.value ?? "";

// "frenos"  →  "Frenos"  (si no existe, devuelve el texto tal cual)
export const categoryLabel = (text) =>
  find(text)?.label ?? (text || "Sin categoría");
