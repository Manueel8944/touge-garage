// avatar.js — contenido del círculo de avatar del usuario
// Siempre pone la inicial; si hay foto, se coloca encima.
// Si la foto no carga, se elimina y se ve la inicial.
import { escapeHtml } from "./escapeHtml.js";

export function avatarHtml(user) {
  const initial = escapeHtml((user.name || "?").trim().charAt(0).toUpperCase());
  const photo = user.image
    ? `<img src="${escapeHtml(user.image)}" alt="" onerror="this.remove()">`
    : "";
  return initial + photo;
}
