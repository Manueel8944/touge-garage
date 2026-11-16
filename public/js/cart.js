// Muestra el carrito lateral; cartApi.js gestiona sus datos.
import { getUser } from "../utils/session.js";
import {
  getCart,
  cartCount,
  refreshCart,
  addToCart,
  checkoutCart,
  removeFromCart,
} from "../utils/cartApi.js";
import { escapeHtml } from "../utils/escapeHtml.js";
import { formatPrice } from "../utils/formatPrice.js";
import { emptyStateHtml } from "../utils/feedback.js";
import { showToast } from "../utils/toast.js";
import { APP_EVENTS, TOAST_TYPES } from "../constants/app.js";
import { CART_ACTIONS } from "../constants/cart.js";
import { ICONS } from "../constants/ui.js";

const CART_OFFCANVAS_HTML = `
<div class="offcanvas offcanvas-end cart-offcanvas" tabindex="-1" id="cart-offcanvas" aria-labelledby="cart-title">
  <div class="offcanvas-header">
    <h2 class="offcanvas-title fs-4" id="cart-title">Tu carrito</h2>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
  </div>
  <div class="offcanvas-body" id="cart-items-list"></div>
  <div class="cart-summary" id="cart-summary" hidden></div>
</div>`;

function init() {
  const cartButton = document.getElementById("cart-btn");
  if (!cartButton) return; // esta página no tiene botón de carrito

  const cartCountBadge = document.getElementById("cart-count");
  document.body.insertAdjacentHTML("beforeend", CART_OFFCANVAS_HTML);
  const cartOffcanvasElement = document.getElementById("cart-offcanvas");
  const cartOffcanvas = window.bootstrap.Offcanvas.getOrCreateInstance(
    cartOffcanvasElement,
  );
  const cartItemsList = document.getElementById("cart-items-list");
  const cartSummary = document.getElementById("cart-summary");

  // DIBUJAR
  function renderCart() {
    const totalCartQuantity = cartCount();
    cartCountBadge.textContent = totalCartQuantity;
    cartCountBadge.hidden = totalCartQuantity === 0;
    cartButton.setAttribute(
      "aria-label",
      `Carrito, ${totalCartQuantity} ${totalCartQuantity === 1 ? "artículo" : "artículos"}`,
    );

    cartSummary.hidden = true;

    // Sin sesión
    if (!getUser()) {
      cartItemsList.innerHTML = `
        ${emptyStateHtml(ICONS.PERSON, "Inicia sesión para guardar productos en tu carrito.")}
        <button class="btn btn-primary w-100 mt-3" type="button" data-action="${CART_ACTIONS.LOGIN}">Iniciar sesión</button>`;
      return;
    }

    // Carrito vacío
    const { products: cartProducts, total: cartTotal } = getCart();
    if (!cartProducts.length) {
      cartItemsList.innerHTML = `
        ${emptyStateHtml(ICONS.BAG, "Añade piezas desde el catálogo.", "Tu carrito está vacío")}
        <a class="btn btn-primary w-100 mt-3" href="catalog.html">Ver catálogo</a>`;
      return;
    }

    // Con productos
    cartItemsList.innerHTML = cartProducts.map(cartItemHtml).join("");
    cartSummary.hidden = false;
    cartSummary.innerHTML = `
      <div class="cart-total">
        <span>Total</span>
        <strong>${formatPrice(cartTotal)}</strong>
      </div>
      <button class="btn btn-primary w-100" type="button" data-action="${CART_ACTIONS.CHECKOUT}">Finalizar compra</button>
    `;
  }

  // ACCIONES
  cartOffcanvasElement.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const { action: cartAction, id: productId } = actionButton.dataset;

    if (cartAction === CART_ACTIONS.LOGIN) {
      cartOffcanvas.hide();
      document.dispatchEvent(new CustomEvent(APP_EVENTS.AUTH_REQUIRED));
      return;
    }

    if (cartAction === CART_ACTIONS.CHECKOUT) {
      actionButton.disabled = true;

      try {
        await checkoutCart();

        cartOffcanvas.hide();
        showToast("¡Pedido realizado correctamente!", TOAST_TYPES.SUCCESS);
      } catch (error) {
        showToast(error.message, TOAST_TYPES.DANGER);
      } finally {
        actionButton.disabled = false;
      }

      return;
    }

    actionButton.disabled = true;
    try {
      if (cartAction === CART_ACTIONS.ADD) await addToCart(productId);
      if (cartAction === CART_ACTIONS.REMOVE) await removeFromCart(productId);
    } catch (error) {
      showToast(error.message, TOAST_TYPES.DANGER);
    } finally {
      actionButton.disabled = false;
    }
  });

  document.addEventListener(APP_EVENTS.CART_CHANGE, renderCart);

  // Recargar el carrito cuando cambie la sesión.
  document.addEventListener(APP_EVENTS.AUTH_CHANGE, () =>
    refreshCart().catch(() => renderCart()),
  );

  // Recargarlo también al abrir el panel.
  cartButton.addEventListener("click", () => {
    renderCart();
    cartOffcanvas.show();
    if (getUser())
      refreshCart().catch((error) =>
        showToast(error.message, TOAST_TYPES.DANGER),
      );
  });

  renderCart();
  if (getUser()) refreshCart().catch(() => {}); // al cargar la página
}

// HTML de un producto dentro del carrito
function cartItemHtml(cartItem) {
  const escapedProductId = escapeHtml(cartItem.product_id);
  const productImage = cartItem.image
    ? `<img src="${escapeHtml(cartItem.image)}" alt="" onerror="this.remove()">`
    : "";

  return `
    <article class="cart-item">
      <div class="cart-thumb"><i class="bi bi-${ICONS.IMAGE}"></i>${productImage}</div>
      <div class="cart-info">
        <strong>${escapeHtml(cartItem.name)}</strong>
        <span>${formatPrice(cartItem.price)} × ${Number(cartItem.quantity)}</span>
      </div>
      <div class="cart-actions">
        <button class="btn btn-ghost btn-sm" type="button" data-action="${CART_ACTIONS.ADD}" data-id="${escapedProductId}" aria-label="Añadir una unidad más">
          <i class="bi bi-${ICONS.PLUS}"></i>
        </button>
        <button class="btn btn-ghost btn-sm" type="button" data-action="${CART_ACTIONS.REMOVE}" data-id="${escapedProductId}" aria-label="Quitar del carrito">
          <i class="bi bi-${ICONS.TRASH}"></i>
        </button>
      </div>
    </article>`;
}

init();
