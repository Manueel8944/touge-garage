// Gestión del inventario desde el panel de administración.
import { api, idOf } from "../utils/api.js";
import { escapeHtml } from "../utils/escapeHtml.js";
import { formatPrice } from "../utils/formatPrice.js";
import {
  CATEGORIES,
  categoryLabel,
  categoryValue,
} from "../utils/categories.js";
import { fillForm, submitForm } from "../utils/forms.js";
import { emptyStateHtml } from "../utils/feedback.js";
import { API_PATHS, HTTP_METHODS } from "../constants/api.js";
import {
  APP_CONFIG,
  APP_EVENTS,
  TOAST_TYPES,
} from "../constants/app.js";
import { ICONS } from "../constants/ui.js";
import { PRODUCT_ACTIONS, PRODUCT_FORM_LIMITS } from "../constants/products.js";

export async function renderProducts(body, user, notify) {
  let products = []; // productos cargados del backend
  let editingId = null; // id del producto que se está editando (null = creando uno nuevo)

  // Formulario y lista de productos.
  body.innerHTML = `
    <div class="admin-editor mb-4">
      <div class="admin-editor-heading">
        <div>
          <span class="account-eyebrow">INVENTARIO</span>
          <h4 id="product-form-title">Nuevo producto</h4>
        </div>
      </div>

      <form id="product-form" novalidate>
        <div class="row g-3">
          <div class="col-8">
            <label class="form-label" for="p-name">Nombre</label>
            <input class="form-control" id="p-name" name="name" type="text" required>
          </div>
          <div class="col-4">
            <label class="form-label" for="p-category">Categoría</label>
            <select class="form-select" id="p-category" name="category" required>
              <option value="" selected disabled>Elige una categoría</option>
              ${CATEGORIES.map((c) => `<option value="${c.value}">${c.label}</option>`).join("")}
            </select>
          </div>
          <div class="col-3">
            <label class="form-label" for="p-price">Precio (€)</label>
            <input class="form-control" id="p-price" name="price" type="number" min="${PRODUCT_FORM_LIMITS.MIN_PRICE}" step="${PRODUCT_FORM_LIMITS.PRICE_STEP}" required>
          </div>
          <div class="col-3">
            <label class="form-label" for="p-stock">Stock</label>
            <input class="form-control" id="p-stock" name="stock" type="number" min="${PRODUCT_FORM_LIMITS.MIN_STOCK}" step="${PRODUCT_FORM_LIMITS.STOCK_STEP}" required>
          </div>
          <div class="col-6">
            <label class="form-label" for="p-image">Imagen (URL o ruta)</label>
            <input class="form-control" id="p-image" name="image" type="text">
          </div>
          <div class="col-12">
            <label class="form-label" for="p-description">Descripción</label>
            <textarea class="form-control" id="p-description" name="description" rows="2"></textarea>
          </div>
        </div>
        <div class="admin-editor-actions">
          <button class="btn btn-primary" id="product-submit" type="submit">Añadir producto</button>
          <button class="btn btn-ghost d-none" id="product-cancel" type="button">Cancelar edición</button>
        </div>
      </form>
    </div>

    <div id="product-list"><div class="loading-state">Cargando productos...</div></div>`;

  const form = body.querySelector("#product-form");
  const list = body.querySelector("#product-list");
  const formTitle = body.querySelector("#product-form-title");
  const submitBtn = body.querySelector("#product-submit");
  const cancelBtn = body.querySelector("#product-cancel");

  // Prepara el formulario para crear o editar un producto.
  function showForm(product = null) {
    editingId = product ? idOf(product) : null;

    form.reset();
    form.classList.remove("was-validated");
    fillForm(form, {
      name: product?.name,
      category: categoryValue(product?.category),
      price: product?.price,
      stock: product?.stock,
      image: product?.image,
      description: product?.description,
    });

    formTitle.textContent = product ? "Editar producto" : "Nuevo producto";
    submitBtn.textContent = product ? "Guardar cambios" : "Añadir producto";
    cancelBtn.classList.toggle("d-none", !product);

    form.elements.name.focus();
    if (product) form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadList() {
    try {
      products = await api(API_PATHS.PRODUCTS);
      list.innerHTML = products.length
        ? `<div class="admin-products-list">${products.map(productRowHtml).join("")}</div>`
        : emptyStateHtml(
            ICONS.BOX_SEAM,
            "Aún no has añadido ningún producto.",
            "No hay productos",
          );
    } catch (error) {
      list.innerHTML = emptyStateHtml(ICONS.ERROR, error.message);
    }
  }

  // Guarda el producto nuevo o los cambios.
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(form, notify, async (data) => {
      const product = {
        userId: user.id,
        name: data.get("name").trim(),
        category: data.get("category"),
        price: Number(data.get("price")),
        stock: Number(data.get("stock")),
        image: data.get("image").trim(),
        description: data.get("description").trim(),
      };
      const wasEditing = editingId !== null;

      if (wasEditing) {
        await api(API_PATHS.PRODUCTS, {
          method: HTTP_METHODS.PUT,
          query: { id: editingId },
          body: product,
        });
      } else {
        await api(API_PATHS.PRODUCTS, {
          method: HTTP_METHODS.POST,
          body: product,
        });
      }

      announceProductChange();

      showForm(); // vuelve a "Nuevo producto" con el formulario limpio
      await loadList();
      notify(
        wasEditing
          ? "Producto actualizado correctamente."
          : "Producto añadido correctamente.",
      );
    });
  });

  cancelBtn.addEventListener("click", () => showForm());

  // Gestiona las acciones de la lista con un único listener.
  list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const id = button.dataset.id;

    if (button.dataset.action === PRODUCT_ACTIONS.EDIT) {
      showForm(products.find((p) => idOf(p) === id));
      return;
    }

    button.disabled = true;
    try {
      await api(API_PATHS.PRODUCTS, {
        method: HTTP_METHODS.DELETE,
        query: { id },
        body: { userId: user.id },
      });
      announceProductChange();
      await loadList();
      notify("Producto eliminado correctamente.");
    } catch (error) {
      button.disabled = false;
      notify(error.message, TOAST_TYPES.DANGER);
    }
  });

  await loadList();
}

function announceProductChange() {
  document.dispatchEvent(new Event(APP_EVENTS.PRODUCTS_CHANGE));
  localStorage.setItem(
    APP_CONFIG.PRODUCTS_CHANGE_STORAGE_KEY,
    `${Date.now()}-${Math.random()}`,
  );
}

// HTML de una fila de la lista
function productRowHtml(product) {
  const id = escapeHtml(idOf(product));
  const inStock = Number(product.stock) > 0;

  const thumb = product.image
    ? `<img class="admin-thumb" src="${escapeHtml(product.image)}" alt="" loading="lazy">`
    : `<div class="admin-thumb admin-thumb-empty"><i class="bi bi-${ICONS.IMAGE}"></i></div>`;

  return `
    <article class="admin-product-row">
      <div class="admin-product-info">
        ${thumb}
        <div class="min-w-0">
          <strong>${escapeHtml(product.name || "Sin nombre")}</strong>
          <span>${escapeHtml(categoryLabel(product.category))}</span>
        </div>
      </div>

      <div class="admin-product-data">
        <span class="admin-data-label">Precio</span>
        <strong>${formatPrice(product.price)}</strong>
      </div>

      <div class="admin-product-data">
        <span class="admin-data-label">Stock</span>
        <strong class="${inStock ? "" : "text-danger"}">${inStock ? product.stock : "Agotado"}</strong>
      </div>

      <div class="admin-product-actions">
        <button class="btn btn-ghost btn-sm" type="button" data-action="${PRODUCT_ACTIONS.EDIT}" data-id="${id}">
          <i class="bi bi-${ICONS.PENCIL}"></i><span>Editar</span>
        </button>
        <button class="btn btn-ghost btn-sm" type="button" data-action="${PRODUCT_ACTIONS.DELETE}" data-id="${id}">
          <i class="bi bi-${ICONS.TRASH}"></i><span>Eliminar</span>
        </button>
      </div>
    </article>`;
}
