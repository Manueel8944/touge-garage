export const CART_REASONS = Object.freeze({
  LOAD: "load",
  ADD: "add",
  REMOVE: "remove",
  CHECKOUT: "checkout",
});

export const STOCK_CHANGE_REASONS = Object.freeze([
  CART_REASONS.ADD,
  CART_REASONS.REMOVE,
]);

export const CART_ACTIONS = Object.freeze({
  LOGIN: "login",
  CHECKOUT: "checkout",
  ADD: "add",
  REMOVE: "remove",
});

export const DEFAULT_CART_QUANTITY = 1;
export const CHECKOUT_QUERY_VALUE = "1";

export const createEmptyCart = () => ({ products: [], total: 0 });
