// Gestiona el carrito en memoria y emite cart:change cuando se actualiza.
import { api } from "./api.js";
import { getUser } from "./session.js";
import { API_PATHS, HTTP_METHODS } from "../constants/api.js";
import { APP_EVENTS } from "../constants/app.js";
import {
  CART_REASONS,
  CHECKOUT_QUERY_VALUE,
  DEFAULT_CART_QUANTITY,
  createEmptyCart,
} from "../constants/cart.js";

let cart = createEmptyCart();

export const getCart = () => cart;

// Total de unidades del carrito.
export const cartCount = () =>
  cart.products.reduce((sum, item) => sum + Number(item.quantity), 0);

function emit(reason) {
  document.dispatchEvent(
    new CustomEvent(APP_EVENTS.CART_CHANGE, { detail: { cart, reason } }),
  );
}

// Recarga el carrito o lo vacía si no hay sesión.
export async function refreshCart(reason = CART_REASONS.LOAD) {
  const user = getUser();
  if (user) {
    cart = await api(API_PATHS.ORDERS, { query: { userId: user.id } });
  } else {
    cart = createEmptyCart();
  }
  emit(reason);
}

// Añade unidades; devuelve false si hace falta iniciar sesión.
export async function addToCart(productId, quantity = DEFAULT_CART_QUANTITY) {
  const user = getUser();
  if (!user) {
    document.dispatchEvent(
      new CustomEvent(APP_EVENTS.AUTH_REQUIRED, {
        detail: "Inicia sesión para añadir productos al carrito.",
      }),
    );
    return false;
  }
  await api(API_PATHS.ORDERS, {
    method: HTTP_METHODS.POST,
    body: { userId: user.id, product_id: productId, quantity },
  });
  await refreshCart(CART_REASONS.ADD);
  return true;
}

// Quita el producto entero del carrito.
export async function removeFromCart(productId) {
  const user = getUser();
  await api(API_PATHS.ORDERS, {
    method: HTTP_METHODS.DELETE,
    query: { productId },
    body: { userId: user.id },
  });
  await refreshCart(CART_REASONS.REMOVE);
}

export async function checkoutCart() {
  const user = getUser();

  if (!user) {
    document.dispatchEvent(new CustomEvent(APP_EVENTS.AUTH_REQUIRED));
    return false;
  }

  await api(API_PATHS.ORDERS, {
    method: HTTP_METHODS.PUT,
    query: { checkout: CHECKOUT_QUERY_VALUE },
    body: { userId: user.id },
  });

  await refreshCart(CART_REASONS.CHECKOUT);

  return true;
}
