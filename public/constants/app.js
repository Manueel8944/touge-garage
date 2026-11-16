export const APP_EVENTS = Object.freeze({
  AUTH_CHANGE: "auth:change",
  AUTH_REQUIRED: "auth:required",
  CART_CHANGE: "cart:change",
  PRODUCTS_CHANGE: "products:change",
});

export const TOAST_TYPES = Object.freeze({
  SUCCESS: "success",
  DANGER: "danger",
});

export const APP_CONFIG = Object.freeze({
  FILTER_DEBOUNCE_MS: 200,
  PRICE_LOCALE: "es-ES",
  CURRENCY: "EUR",
  TOAST_DELAY_MS: 3000,
  USER_STORAGE_KEY: "tg-user",
  PRODUCTS_CHANGE_STORAGE_KEY: "tg-products-change",
  LOW_STOCK_THRESHOLD: 3,
});
