// forms.js — ayudas para formularios

// Rellena los campos del formulario con los valores recibidos.
import { TOAST_TYPES } from "../constants/app.js";

export function fillForm(form, values) {
  for (const [field, value] of Object.entries(values)) {
    form.elements[field].value = value ?? "";
  }
}

// Valida el formulario, ejecuta la tarea y muestra sus errores.
export async function submitForm(form, notify, task) {
  form.classList.add("was-validated");
  if (!form.checkValidity()) return;

  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    await task(new FormData(form));
    form.classList.remove("was-validated");
  } catch (error) {
    notify(error.message, TOAST_TYPES.DANGER);
  } finally {
    button.disabled = false;
  }
}
