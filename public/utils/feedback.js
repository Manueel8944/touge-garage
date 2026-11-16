import { escapeHtml } from "./escapeHtml.js";

// Caja con icono para listas vacías o errores de carga.
export function emptyStateHtml(icon, text, title = "") {
  return `
    <div class="empty-state">
      <i class="bi bi-${icon}"></i>
      ${title ? `<h4>${escapeHtml(title)}</h4>` : ""}
      <p>${escapeHtml(text)}</p>
    </div>`;
}
