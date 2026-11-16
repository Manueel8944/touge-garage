// Modal de cuenta y navegación entre sus secciones.
import { api } from "../utils/api.js";
import { getUser, saveUser, clearUser } from "../utils/session.js";
import { fillForm, submitForm } from "../utils/forms.js";
import { showToast } from "../utils/toast.js";
import { avatarHtml } from "../utils/avatar.js";
import { renderProducts } from "./admin-products.js";
import { renderOrders } from "./admin-orders.js";
import { renderAdminHistory, renderUserHistory } from "./order-history.js";
import { API_PATHS, HTTP_METHODS } from "../constants/api.js";
import { APP_EVENTS } from "../constants/app.js";
import { ICONS } from "../constants/ui.js";

// LISTA DE SECCIONES
const SECTIONS = {
  settings: {
    nav: "Configuración",
    icon: ICONS.GEAR,
    eyebrow: "CUENTA",
    title: "Configuración",
    text: "Actualiza los datos de tu perfil.",
    render: renderSettings,
  },
  history: {
    nav: "Historial",
    icon: ICONS.CLOCK_HISTORY,
    eyebrow: "CUENTA",
    title: "Historial de pedidos",
    text: "Consulta el estado y el importe de tus pedidos.",
    render: renderUserHistory,
  },
  products: {
    adminOnly: true, // solo la ven los administradores
    nav: "Productos",
    icon: ICONS.BOX_SEAM,
    eyebrow: "TOUGE GARAGE / ADMIN",
    title: "Gestión de productos",
    text: "Añade y gestiona el inventario.",
    render: renderProducts,
  },
  orders: {
    adminOnly: true,
    nav: "Pedidos",
    icon: ICONS.RECEIPT,
    eyebrow: "TOUGE GARAGE / ADMIN",
    title: "Gestión de pedidos",
    text: "Revisa los pedidos pendientes y acepta o rechaza las compras.",
    render: renderOrders,
  },
  adminHistory: {
    adminOnly: true,
    nav: "Historial",
    icon: ICONS.CLOCK_HISTORY,
    eyebrow: "TOUGE GARAGE / ADMIN",
    title: "Historial de pedidos",
    text: "Pedidos aceptados y cancelados.",
    render: renderAdminHistory,
  },
};

// HTML DEL MODAL
const ACCOUNT_MODAL_HTML = `
<div class="modal fade" id="account-modal" tabindex="-1" aria-labelledby="account-title" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered account-dialog">
    <div class="modal-content account-modal-content">

      <div class="modal-header account-header">
        <div>
          <span class="account-eyebrow">TOUGE GARAGE / CUENTA</span>
          <h2 class="modal-title fs-4" id="account-title">Mi cuenta</h2>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>

      <div class="modal-body p-0">
        <div class="account-layout">

          <!-- Menú lateral -->
          <aside class="account-sidebar">
            <div class="account-user">
              <div class="account-avatar" id="account-avatar"></div>
              <div class="min-w-0">
                <strong id="account-name"></strong>
                <span id="account-email"></span>
              </div>
            </div>
            <div id="account-nav"></div>
            <div class="account-sidebar-bottom">
              <button class="account-logout" id="account-logout" type="button">
                <i class="bi bi-${ICONS.ACCOUNT_LOGOUT}"></i><span>Cerrar sesión</span>
              </button>
            </div>
          </aside>

          <!-- Aquí se dibuja la sección activa -->
          <main class="account-main" id="account-main"></main>
        </div>
      </div>
    </div>
  </div>
</div>`;

// ESTADO DEL MODAL
// Se inicializan la primera vez que se abre el modal.
let modalEl, modal, navEl, mainEl;

function ensureModal() {
  if (modalEl) return; // ya está creado

  document.body.insertAdjacentHTML("beforeend", ACCOUNT_MODAL_HTML);
  modalEl = document.getElementById("account-modal");
  modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  navEl = document.getElementById("account-nav");
  mainEl = document.getElementById("account-main");

  // Cambiar de sección desde el menú.
  navEl.addEventListener("click", (event) => {
    const item = event.target.closest("[data-section]");
    if (item) showSection(item.dataset.section);
  });

  // Cerrar sesión
  document.getElementById("account-logout").addEventListener("click", () => {
    clearUser();
    modal.hide();
    showToast("Sesión cerrada correctamente.");
  });

  // Actualizar los datos del usuario cuando cambie la sesión.
  document.addEventListener(APP_EVENTS.AUTH_CHANGE, fillUserBlock);
}

// ABRIR EL MODAL
export function openAccount() {
  ensureModal();
  buildNav(getUser());
  fillUserBlock();
  showSection("settings");
  modal.show();
}

// BARRA LATERAL
function fillUserBlock() {
  const user = getUser();
  if (!user) return;
  document.getElementById("account-avatar").innerHTML = avatarHtml(user);
  document.getElementById("account-name").textContent = user.name || "";
  document.getElementById("account-email").textContent = user.email || "";
}

// Mostrar las secciones disponibles para cada tipo de usuario.
function buildNav(user) {
  const group = (label, adminOnly) => {
    const items = Object.entries(SECTIONS).filter(([, section]) => {
      if (adminOnly) return Boolean(section.adminOnly);
      return !section.adminOnly;
    });
    return `
      <span class="account-nav-label">${label}</span>
      <nav class="account-nav" aria-label="${label}">
        ${items
          .map(
            ([id, section]) => `
          <button class="account-nav-item" type="button" data-section="${id}">
            <i class="bi bi-${section.icon}"></i><span>${section.nav}</span>
          </button>`,
          )
          .join("")}
      </nav>`;
  };

  navEl.innerHTML =
    group("CUENTA", false) + (user.admin ? group("ADMIN", true) : "");
}

// MOSTRAR UNA SECCIÓN
async function showSection(id) {
  const user = getUser();
  const section = SECTIONS[id];
  if (!user || !section) return;
  if (section.adminOnly && !user.admin) return; // seguridad extra en el front

  navEl.querySelectorAll("[data-section]").forEach((item) => {
    item.classList.toggle("active", item.dataset.section === id);
  });

  mainEl.innerHTML = `
    <div class="account-section-heading">
      <span class="account-eyebrow">${section.eyebrow}</span>
      <h3>${section.title}</h3>
      <p>${section.text}</p>
    </div>
    <div class="account-body"></div>`;

  const body = mainEl.querySelector(".account-body");
  const notify = showToast;

  await section.render(body, user, notify);
}

// SECCIÓN: Configuración (editar el perfil)
function renderSettings(body, user, notify) {
  body.innerHTML = `
    <form id="settings-form" novalidate>
      <div class="account-form-grid">
        <div>
          <label class="form-label" for="set-name">Nombre</label>
          <input class="form-control" id="set-name" name="name" type="text" required>
        </div>
        <div>
          <label class="form-label" for="set-email">Email</label>
          <input class="form-control" id="set-email" name="email" type="email" required>
        </div>
        <div class="account-field-full">
          <label class="form-label" for="set-image">Imagen de perfil (URL)</label>
          <input class="form-control" id="set-image" name="image" type="url" placeholder="https://...">
        </div>
        <div class="account-field-full">
          <div class="account-form-divider"></div>
          <h4 class="account-password-heading">Cambiar contraseña</h4>
          <label class="form-label" for="set-password">Nueva contraseña</label>
          <input class="form-control" id="set-password" name="password" type="password"
            autocomplete="new-password" placeholder="Déjala vacía para no cambiarla">
        </div>
      </div>
      <div class="account-form-actions">
        <button class="btn btn-primary" type="submit">Guardar cambios</button>
      </div>
    </form>`;

  const form = body.querySelector("form");
  fillForm(form, { name: user.name, email: user.email, image: user.image });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(form, notify, async (data) => {
      // Solo se manda la contraseña si el usuario ha escrito una nueva
      const changes = {
        name: data.get("name").trim(),
        email: data.get("email").trim(),
        image: data.get("image").trim(),
      };
      if (data.get("password")) changes.password = data.get("password");

      await api(API_PATHS.USERS, {
        method: HTTP_METHODS.PUT,
        query: { id: user.id },
        body: changes,
      });

      // Guardar en la sesión (esto también actualiza el header y la barra lateral)
      saveUser({
        ...getUser(),
        name: changes.name,
        email: changes.email,
        image: changes.image || null,
      });
      form.elements.password.value = "";
      notify("Cambios guardados");
    });
  });
}
