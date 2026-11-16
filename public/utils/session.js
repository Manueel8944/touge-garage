// session.js — quién ha iniciado sesión
// Guarda al usuario en localStorage y avisa al resto de la web
// con el evento "auth:change" cuando entra, sale o se edita.
import { idOf } from "./api.js";
import { APP_CONFIG, APP_EVENTS } from "../constants/app.js";

// Devuelve el usuario guardado, o null si no hay sesión.
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(APP_CONFIG.USER_STORAGE_KEY));
  } catch {
    return null;
  }
}

// Guarda al usuario (login o cambios en su perfil).
export function saveUser(user) {
  localStorage.setItem(APP_CONFIG.USER_STORAGE_KEY, JSON.stringify(user));
  document.dispatchEvent(
    new CustomEvent(APP_EVENTS.AUTH_CHANGE, { detail: user }),
  );
}

// Cierra la sesión.
export function clearUser() {
  localStorage.removeItem(APP_CONFIG.USER_STORAGE_KEY);
  document.dispatchEvent(
    new CustomEvent(APP_EVENTS.AUTH_CHANGE, { detail: null }),
  );
}

// Convierte el usuario del backend (con _id.$oid) en uno fácil de usar.
export function normalizeUser(raw) {
  return {
    id: idOf(raw),
    name: raw.name,
    email: raw.email,
    admin: !!raw.admin,
    image: raw.image || null,
  };
}
