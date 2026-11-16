// Carga los productos y sincroniza los filtros del catálogo con la URL.
import { api, idOf } from "../utils/api.js";
import {
  CATEGORIES,
  categoryValue,
  categoryLabel,
} from "../utils/categories.js";
import { escapeHtml } from "../utils/escapeHtml.js";
import { formatPrice } from "../utils/formatPrice.js";
import { emptyStateHtml } from "../utils/feedback.js";
import { addToCart } from "../utils/cartApi.js";
import { showToast } from "../utils/toast.js";
import { API_PATHS } from "../constants/api.js";
import { APP_CONFIG, APP_EVENTS, TOAST_TYPES } from "../constants/app.js";
import {
  CATALOG_QUERY_PARAMS,
  CATALOG_QUERY_VALUES,
} from "../constants/catalog.js";
import { STOCK_CHANGE_REASONS } from "../constants/cart.js";
import { ICONS } from "../constants/ui.js";

// ELEMENTOS DE LA PÁGINA
const grid = document.getElementById("catalog-grid");
const countEl = document.getElementById("catalog-count");
const form = document.getElementById("filter-form");
const categoriesBox = document.getElementById("filter-categories");

// ESTADO
let products = []; // todos los productos del backend
const filters = readUrl(); // filtros activos: { cat, min, max, stock }

// FILTROS ↔ URL
function readUrl() {
  const params = new URLSearchParams(location.search);
  return {
    cat: categoryValue(params.get(CATALOG_QUERY_PARAMS.CATEGORY)),
    min: params.get(CATALOG_QUERY_PARAMS.MIN_PRICE) ?? "",
    max: params.get(CATALOG_QUERY_PARAMS.MAX_PRICE) ?? "",
    stock:
      params.get(CATALOG_QUERY_PARAMS.IN_STOCK) ===
      CATALOG_QUERY_VALUES.IN_STOCK,
  };
}

function writeUrl() {
  const params = new URLSearchParams();
  if (filters.cat) params.set(CATALOG_QUERY_PARAMS.CATEGORY, filters.cat);
  if (filters.min !== "")
    params.set(CATALOG_QUERY_PARAMS.MIN_PRICE, filters.min);
  if (filters.max !== "")
    params.set(CATALOG_QUERY_PARAMS.MAX_PRICE, filters.max);
  if (filters.stock)
    params.set(CATALOG_QUERY_PARAMS.IN_STOCK, CATALOG_QUERY_VALUES.IN_STOCK);
  const query = params.toString();
  history.replaceState(null, "", query ? `?${query}` : location.pathname);
}

// FILTRAR
function visibleProducts() {
  const list = products.filter((p) => {
    const price = Number(p.price);
    if (filters.cat && categoryValue(p.category) !== filters.cat) return false;
    if (filters.min !== "" && price < Number(filters.min)) return false;
    if (filters.max !== "" && price > Number(filters.max)) return false;
    if (filters.stock && !(Number(p.stock) > 0)) return false;
    return true;
  });
  return list;
}

// DIBUJAR
// Cuenta productos por categoría.
function buildCategories() {
  const countOf = (value) =>
    products.filter((p) => categoryValue(p.category) === value).length;
  const option = (value, label, count) => `
    <div class="form-check">
      <input class="form-check-input" type="radio" name="cat" id="cat-${value || "all"}" value="${value}">
      <label class="form-check-label d-flex justify-content-between" for="cat-${value || "all"}">
        <span>${label}</span><span class="filters-count">${count}</span>
      </label>
    </div>`;

  categoriesBox.innerHTML =
    option("", CATALOG_QUERY_VALUES.ALL_CATEGORIES_LABEL, products.length) +
    CATEGORIES.map((c) => option(c.value, c.label, countOf(c.value))).join("");
}

// Sincroniza el formulario con los filtros activos.
function syncForm() {
  form.querySelectorAll('input[name="cat"]').forEach((input) => {
    input.checked = input.value === filters.cat;
  });
  form.elements.min.value = filters.min;
  form.elements.max.value = filters.max;
  form.elements.stock.checked = filters.stock;
}

function draw() {
  const list = visibleProducts();
  let countLabel = "productos";
  if (list.length === 1) countLabel = "producto";
  countEl.textContent = `${list.length} ${countLabel}`;

  if (!list.length) {
    grid.innerHTML = emptyStateHtml(
      ICONS.SEARCH,
      "Prueba a cambiar o quitar algún filtro.",
      "No hay productos con estos filtros",
    );
    grid
      .querySelector(".empty-state")
      .insertAdjacentHTML(
        "beforeend",
        '<button class="btn btn-ghost" type="button" id="empty-reset">Limpiar filtros</button>',
      );
    return;
  }

  grid.innerHTML = `
    <div class="row row-cols-3 g-3">
      ${list.map(productCardHtml).join("")}
    </div>`;
}

function productCardHtml(product) {
  const stock = Number(product.stock) || 0;
  const name = escapeHtml(product.name || "Sin nombre");

  const badge =
    stock === 0
      ? '<span class="product-badge product-badge-soldout">Agotado</span>'
      : stock <= APP_CONFIG.LOW_STOCK_THRESHOLD
        ? `<span class="product-badge">Quedan ${stock}</span>`
        : "";

  // Si falla la imagen, queda visible el icono de fondo.
  const image = product.image
    ? `<img src="${escapeHtml(product.image)}" alt="${name}" loading="lazy" onerror="this.remove()">`
    : "";

  return `
    <div class="col">
      <article class="card product h-100 overflow-hidden ${stock === 0 ? "product-soldout" : ""}">
        <div class="product-media">
            <i class="bi bi-${ICONS.IMAGE}"></i>${image}${badge}
        </div>
        <div class="card-body d-flex flex-column gap-2">
          <span class="product-category">${escapeHtml(categoryLabel(product.category))}</span>
          <h3 class="product-name">${name}</h3>
          ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ""}
          <div class="d-flex align-items-center justify-content-between mt-auto pt-2">
            <span class="product-price">${formatPrice(product.price)}</span>
            <button class="product-add" type="button" data-id="${escapeHtml(idOf(product))}"
              ${stock === 0 ? "disabled" : ""} aria-label="Añadir ${name} al carrito">
              <i class="bi bi-${ICONS.CART_PLUS}"></i>
            </button>
          </div>
        </div>
      </article>
    </div>`;
}

// CARGAR PRODUCTOS
async function loadProducts({ quiet = false } = {}) {
  if (!quiet)
    grid.innerHTML = '<div class="loading-state">Cargando productos...</div>';
  try {
    products = await api(API_PATHS.PRODUCTS);
    buildCategories();
    syncForm();
    draw();
  } catch (error) {
    grid.innerHTML = emptyStateHtml(ICONS.ERROR, error.message);
  }
}

// EVENTOS
// Aplicar filtros después de una breve pausa al escribir.
let timer;
form.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const data = new FormData(form);
    filters.cat = data.get("cat") ?? "";
    filters.min = data.get("min") ?? "";
    filters.max = data.get("max") ?? "";
    filters.stock = data.get("stock") !== null;
    writeUrl();
    draw();
  }, APP_CONFIG.FILTER_DEBOUNCE_MS);
});
form.addEventListener("submit", (event) => event.preventDefault());

function resetFilters() {
  filters.cat = "";
  filters.min = "";
  filters.max = "";
  filters.stock = false;
  syncForm();
  writeUrl();
  draw();
}
document
  .getElementById("filters-reset")
  .addEventListener("click", resetFilters);

// Añadir productos al carrito y limpiar filtros desde el estado vacío.
grid.addEventListener("click", async (event) => {
  if (event.target.closest("#empty-reset")) {
    resetFilters();
    return;
  }

  const button = event.target.closest(".product-add");
  if (!button) return;

  const name = button
    .closest(".product")
    .querySelector(".product-name").textContent;
  button.disabled = true;
  try {
    if (await addToCart(button.dataset.id))
      showToast(`${name} añadido al carrito`);
  } catch (error) {
    showToast(error.message, TOAST_TYPES.DANGER);
  } finally {
    button.disabled = false;
  }
});

// El carrito modifica el stock disponible.
document.addEventListener(APP_EVENTS.CART_CHANGE, (event) => {
  if (STOCK_CHANGE_REASONS.includes(event.detail.reason))
    loadProducts({ quiet: true });
});

document.addEventListener(APP_EVENTS.PRODUCTS_CHANGE, () =>
  loadProducts({ quiet: true }),
);
window.addEventListener("storage", (event) => {
  if (event.key === APP_CONFIG.PRODUCTS_CHANGE_STORAGE_KEY)
    loadProducts({ quiet: true });
});

loadProducts();
