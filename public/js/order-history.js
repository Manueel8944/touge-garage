// order-history.js — historial de pedidos de usuario y admin
import { api } from "../utils/api.js";
import { emptyStateHtml } from "../utils/feedback.js";
import { formatPrice } from "../utils/formatPrice.js";
import { escapeHtml } from "../utils/escapeHtml.js";
import { API_PATHS } from "../constants/api.js";
import {
  ORDER_HISTORY_TYPES,
  ORDER_STATUS_LABELS,
} from "../constants/orders.js";
import { ICONS } from "../constants/ui.js";

export async function renderUserHistory(body, user) {
  body.innerHTML = '<div class="loading-state">Cargando historial...</div>';

  try {
    const result = await api(API_PATHS.ORDERS, {
      query: { userId: user.id, history: ORDER_HISTORY_TYPES.USER },
    });
    const orders = Array.isArray(result.orders) ? result.orders : [];
    body.innerHTML = orders.length
      ? `<div class="admin-orders-list">${orders.map(orderCardHtml).join("")}</div>`
      : emptyStateHtml(
          ICONS.RECEIPT,
          "Tus pedidos aparecerán aquí.",
          "Sin pedidos",
        );
  } catch (error) {
    body.innerHTML = emptyStateHtml(ICONS.ERROR, error.message);
  }
}

export async function renderAdminHistory(body, user) {
  body.innerHTML = '<div class="loading-state">Cargando historial...</div>';

  try {
    const result = await api(API_PATHS.ORDERS, {
      query: { adminId: user.id, history: ORDER_HISTORY_TYPES.ADMIN },
    });
    const orders = Array.isArray(result.orders) ? result.orders : [];
    body.innerHTML = orders.length
      ? `<div class="admin-orders-list">${orders.map(orderCardHtml).join("")}</div>`
      : emptyStateHtml(
          ICONS.RECEIPT,
          "Los pedidos aceptados o cancelados aparecerán aquí.",
          "Sin pedidos en el historial",
        );
  } catch (error) {
    body.innerHTML = emptyStateHtml(ICONS.ERROR, error.message);
  }
}

function orderCardHtml(order) {
  const hasStatus = Object.prototype.hasOwnProperty.call(
    ORDER_STATUS_LABELS,
    order.status,
  );
  const status = hasStatus ? ORDER_STATUS_LABELS[order.status] : "Desconocido";
  const statusClass = hasStatus ? ` admin-order-status-${order.status}` : "";

  return `
    <article class="admin-order-card">
      <div class="admin-order-top">
        <div>
          <span class="admin-order-reference">PEDIDO</span>
          <strong>${escapeHtml(order.name || "Usuario")}</strong>
          <span class="admin-order-email">${escapeHtml(order.email || "")}</span>
        </div>
        <span class="admin-order-status${statusClass}"><span></span> ${status}</span>
      </div>
      <div class="admin-order-bottom">
        <div>
          <span>Total del pedido</span>
          <strong>${formatPrice(order.total)}</strong>
        </div>
      </div>
    </article>`;
}
