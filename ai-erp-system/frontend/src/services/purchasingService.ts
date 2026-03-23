import api from "./api";

export const purchasingService = {
  listSuppliers: async () => (await api.get("/inventory/suppliers/")).data,
  createSupplier: async (payload: any) => (await api.post("/inventory/suppliers/", payload)).data,

  listWarehouses: async () => (await api.get("/inventory/warehouses/")).data,
  createWarehouse: async (payload: any) => (await api.post("/inventory/warehouses/", payload)).data,

  listUnits: async () => (await api.get("/inventory/units/")).data,

  listPOs: async (params?: any) => (await api.get("/inventory/purchase-orders/", { params })).data,
  getPO: async (id: number) => (await api.get(`/inventory/purchase-orders/${id}/`)).data,
  approvePO: async (id: number) => (await api.post(`/inventory/purchase-orders/${id}/approve/`)).data,
  cancelPO: async (id: number) => (await api.post(`/inventory/purchase-orders/${id}/cancel/`)).data,
  createPO: async (payload: any) => (await api.post("/inventory/purchase-orders/", payload)).data,
  updatePO: async (id: number, payload: any) =>
    (await api.put(`/inventory/purchase-orders/${id}/`, payload)).data,

  listGRN: async (params?: any) => (await api.get("/inventory/goods-receipts/", { params })).data,
  createGRN: async (payload: any) => (await api.post("/inventory/goods-receipts/", payload)).data,

  listMovements: async (params?: any) => (await api.get("/inventory/movements/", { params })).data,
};