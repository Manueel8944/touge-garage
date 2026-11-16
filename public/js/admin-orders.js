// Gestión de pedidos pendientes desde el panel de administración.
import { api } from "../utils/api.js";
import { escapeHtml } from "../utils/escapeHtml.js";
import { formatPrice } from "../utils/formatPrice.js";
import { emptyStateHtml } from "../utils/feedback.js";
import { API_PATHS, HTTP_METHODS } from "../constants/api.js";
import { TOAST_TYPES } from "../constants/app.js";
import { DEFAULT_ORDER_QUANTITY, ORDER_STATUS } from "../constants/orders.js";
import { ICONS } from "../constants/ui.js";

export async function renderOrders(body, user, notify) {
  body.innerHTML = `<div class="loading-state">Cargando pedidos...</div>`;

  async function loadOrders() {
    try {
      const result = await api(API_PATHS.ORDERS, {
        query: { adminId: user.id },
      });
      const orders = Array.isArray(result) ? result : (result.orders ?? []);

      body.innerHTML = orders.length
        ? `<div class="admin-orders-list">${orders.map(orderHtml).join("")}</div>`
        : emptyStateHtml(
            ICONS.RECEIPT,
            "Cuando un cliente realice una compra, aparecerá aquí.",
            "No hay pedidos pendientes",
          );
    } catch (error) {
      body.innerHTML = emptyStateHtml(ICONS.ERROR, error.message);
    }
  }

  async function changeStatus(id, status) {
    const buttons = body.querySelectorAll("[data-status]");
    buttons.forEach((b) => (b.disabled = true)); // evita doble clic mientras espera

    try {
      await api(API_PATHS.ORDERS, {
        method: HTTP_METHODS.PUT,
        query: { id },
        body: { status, adminId: user.id },
      });
      await loadOrders();
      if (status === ORDER_STATUS.ACCEPTED) {
        notify("Pedido aceptado correctamente.");
      } else {
        notify("Pedido rechazado correctamente.");
      }
    } catch (error) {
      buttons.forEach((b) => (b.disabled = false));
      notify(error.message, TOAST_TYPES.DANGER);
    }
  }

  // Gestiona los botones de la lista con un único listener.
  body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-status]");
    if (!button) return;

    const status = button.dataset.status;
    changeStatus(button.dataset.id, status);
  });

  await loadOrders();
}

// HTML de una tarjeta de pedido
function orderHtml(order) {
  const id = String(order.id ?? "");
  const customer = order.user ?? {};

  const items = (order.products ?? [])
    .map(
      (item) => `
      <div class="admin-order-item">
        <span>${escapeHtml(item.name || "Producto")}</span>
        <strong>× ${Number(item.quantity || DEFAULT_ORDER_QUANTITY)}</strong>
      </div>`,
    )
    .join("");

  return `
    <article class="admin-order-card">
      <div class="admin-order-top">
        <div>
          <span class="admin-order-reference">PEDIDO</span>
          <strong>${escapeHtml(customer.name || "Cliente")}</strong>
          <span class="admin-order-email">${escapeHtml(customer.email || "")}</span>
        </div>
        <span class="admin-order-status"><span></span> Pendiente</span>
      </div>

      <div class="admin-order-items">${items}</div>

      <div class="admin-order-bottom">
        <div>
          <span>Total del pedido</span>
          <strong>${formatPrice(order.total)}</strong>
        </div>
        <div class="admin-order-actions">
          <button class="btn btn-ghost btn-sm" type="button" data-status="${ORDER_STATUS.CANCELLED}" data-id="${escapeHtml(id)}">Rechazar</button>
          <button class="btn btn-primary btn-sm" type="button" data-status="${ORDER_STATUS.ACCEPTED}" data-id="${escapeHtml(id)}">
            <i class="bi bi-${ICONS.CHECK}"></i> Aceptar pedido
          </button>
        </div>
      </div>
    </article>`;
}
