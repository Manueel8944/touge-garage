export const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  CANCELLED: "cancelled",
});

export const ORDER_STATUS_LABELS = Object.freeze({
  [ORDER_STATUS.PENDING]: "Pendiente",
  [ORDER_STATUS.ACCEPTED]: "Aceptado",
  [ORDER_STATUS.CANCELLED]: "Cancelado",
});

export const ORDER_HISTORY_TYPES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
});

export const DEFAULT_ORDER_QUANTITY = 1;
