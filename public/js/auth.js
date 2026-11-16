// Gestiona el botón de usuario y los modales de acceso y cuenta.
import { api } from "../utils/api.js";
import { getUser, saveUser, normalizeUser } from "../utils/session.js";
import { submitForm } from "../utils/forms.js";
import { showToast } from "../utils/toast.js";
import { avatarHtml } from "../utils/avatar.js";
import { openAccount } from "./account.js";
import { API_ACTIONS, API_PATHS, HTTP_METHODS } from "../constants/api.js";
import { APP_EVENTS } from "../constants/app.js";

const AUTH_MODAL_HTML = `
<div class="modal fade" id="auth-modal" tabindex="-1" aria-label="Acceso a tu cuenta" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">

      <!-- Pestañas: iniciar sesión / crear cuenta -->
      <div class="modal-header border-0 pb-0">
        <ul class="nav nav-pills nav-fill flex-grow-1 me-3" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#auth-login" type="button" role="tab">Iniciar sesión</button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#auth-register" type="button" role="tab">Crear cuenta</button>
          </li>
        </ul>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>

      <div class="modal-body pt-4">
        <div class="tab-content">
          <!-- Login -->
          <form class="tab-pane fade show active" id="auth-login" novalidate>
            <div class="mb-3">
              <label class="form-label" for="login-email">Email</label>
              <input class="form-control" id="login-email" name="email" type="email" autocomplete="email" required>
            </div>
            <div class="mb-4">
              <label class="form-label" for="login-password">Contraseña</label>
              <input class="form-control" id="login-password" name="password" type="password" autocomplete="current-password" required>
            </div>
            <button class="btn btn-primary w-100" type="submit">Entrar</button>
          </form>

          <!-- Registro -->
          <form class="tab-pane fade" id="auth-register" novalidate>
            <div class="mb-3">
              <label class="form-label" for="reg-name">Nombre</label>
              <input class="form-control" id="reg-name" name="name" type="text" autocomplete="name" required>
            </div>
            <div class="mb-3">
              <label class="form-label" for="reg-email">Email</label>
              <input class="form-control" id="reg-email" name="email" type="email" autocomplete="email" required>
            </div>
            <div class="mb-4">
              <label class="form-label" for="reg-password">Contraseña</label>
              <input class="form-control" id="reg-password" name="password" type="password" autocomplete="new-password" required>
            </div>
            <button class="btn btn-primary w-100" type="submit">Crear cuenta</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>`;

function init() {
  const userBtn = document.getElementById("user-btn");
  if (!userBtn) return; // esta página no tiene botón de usuario

  const guestIcon = userBtn.innerHTML; // icono original (persona), para cuando no hay sesión

  // Crear el modal y obtener sus elementos.
  document.body.insertAdjacentHTML("beforeend", AUTH_MODAL_HTML);
  const modalEl = document.getElementById("auth-modal");
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  const loginForm = document.getElementById("auth-login");
  const registerForm = document.getElementById("auth-register");
  const notify = showToast;

  // Permitir que otras partes de la web soliciten el acceso.
  document.addEventListener(APP_EVENTS.AUTH_REQUIRED, () => {
    modal.show();
  });

  // BOTÓN DEL HEADER
  // Muestra el avatar del usuario o el icono de invitado.
  function renderUserButton() {
    const user = getUser();
    userBtn.innerHTML = user
      ? `<span class="user-avatar">${avatarHtml(user)}</span>`
      : guestIcon;
    userBtn.setAttribute(
      "aria-label",
      user ? `Cuenta de ${user.name}` : "Iniciar sesión",
    );
  }

  renderUserButton();
  document.addEventListener(APP_EVENTS.AUTH_CHANGE, renderUserButton);

  userBtn.addEventListener("click", () => {
    if (getUser()) openAccount();
    else modal.show();
  });

  // LOGIN Y REGISTRO
  // Inicia sesión y guarda al usuario.
  async function login(
    email,
    password,
    successMessage = "Sesión iniciada correctamente.",
  ) {
    const { user } = await api(API_PATHS.USERS, {
      method: HTTP_METHODS.POST,
      query: { action: API_ACTIONS.LOGIN },
      body: { email, password },
    });
    saveUser(normalizeUser(user));
    modal.hide();
    showToast(successMessage);
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(loginForm, notify, async (data) => {
      await login(data.get("email").trim(), data.get("password"));
      loginForm.reset();
    });
  });

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(registerForm, notify, async (data) => {
      const email = data.get("email").trim();
      const password = data.get("password");
      await api(API_PATHS.USERS, {
        method: HTTP_METHODS.POST,
        query: { action: API_ACTIONS.REGISTER },
        body: { name: data.get("name").trim(), email, password },
      });
      await login(email, password, "Cuenta creada correctamente.");
      registerForm.reset();
    });
  });

  // Enfocar el primer campo al abrir el modal.
  modalEl.addEventListener("shown.bs.modal", () =>
    modalEl.querySelector(".tab-pane.active input")?.focus(),
  );
}

init();
