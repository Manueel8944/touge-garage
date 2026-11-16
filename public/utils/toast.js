// toast.js — avisos pequeños que aparecen abajo a la derecha
// showToast("Añadido al carrito")              → verde
// showToast("No hay stock suficiente", "danger") → rojo
import { escapeHtml } from "./escapeHtml.js";
import { APP_CONFIG, TOAST_TYPES } from "../constants/app.js";

export function showToast(message, type = TOAST_TYPES.SUCCESS) {
  if (!message) return;

  // Contenedor único para todos los avisos
  let box = document.getElementById("toast-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast-box";
    box.className = "toast-container position-fixed bottom-0 end-0 p-3";
    document.body.append(box);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", type === TOAST_TYPES.DANGER ? "alert" : "status");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>`;
  box.append(toast);

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
  window.bootstrap.Toast.getOrCreateInstance(toast, {
    delay: APP_CONFIG.TOAST_DELAY_MS,
  }).show();
}
