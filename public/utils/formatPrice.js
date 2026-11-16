// formatPrice.js — muestra los precios siempre igual
// formatPrice(649)  →  "649,00 €"
import { APP_CONFIG } from "../constants/app.js";

export function formatPrice(amount) {
  return Number(amount || 0).toLocaleString(APP_CONFIG.PRICE_LOCALE, {
    style: "currency",
    currency: APP_CONFIG.CURRENCY,
  });
}
