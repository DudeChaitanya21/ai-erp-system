// salesService.ts
import api from "./api";

export const salesService = {
  listOrders: async (params?: any) =>
    (await api.get("/sales/orders/", { params })).data,
  getOrder: async (id: number) =>
    (await api.get(`/sales/orders/${id}/`)).data,
  createOrder: async (payload: any) =>
    (await api.post("/sales/orders/", payload)).data,
  updateOrder: async (id: number, payload: any) =>
    (await api.put(`/sales/orders/${id}/`, payload)).data,
  confirmOrder: async (id: number) =>
    (await api.post(`/sales/orders/${id}/confirm/`)).data,
  cancelOrder: async (id: number) =>
    (await api.post(`/sales/orders/${id}/cancel/`)).data,
  getDispatchSummary: async (id: number) =>
    (await api.get(`/sales/orders/${id}/dispatch-summary/`)).data,
  createDispatch: async (payload: any) =>
    (await api.post("/sales/dispatches/", payload)).data,
};