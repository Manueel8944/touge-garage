// api.js — conexión con el backend PHP
import { API_URL, HTTP_METHODS } from "../constants/api.js";

export { API_URL };

// api("users", { method: "POST", query: { action: "login" }, body: {...} })
// Devuelve el JSON, o lanza un Error con el "message" del backend.
export async function api(
  path,
  { method = HTTP_METHODS.GET, query, body } = {},
) {
  const qs = query ? "?" + new URLSearchParams(query) : "";
  let res;
  try {
    res = await fetch(`${API_URL}/${path}${qs}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Respuesta no válida del servidor (HTTP ${res.status})`);
  }
  if (!res.ok) {
    const message = typeof data?.message === "string" && data.message;
    throw new Error(message || `Error del servidor (HTTP ${res.status})`);
  }
  return data;
}

// MongoDB devuelve el id como { "$oid": "..." }
export const idOf = (doc) => doc?._id?.$oid ?? doc?._id ?? "";
