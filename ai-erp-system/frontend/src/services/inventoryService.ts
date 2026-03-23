import api from './api';

export type Product = {
  id?: number;
  name: string;
  sku: string;
  price: number | string;
  stock: number | string;
};

export const inventoryService = {
  // Get all products
  getAllProducts: async (): Promise<Product[]> => {
    const response = await api.get('/inventory/products/');  // Changed from '/inventory/'
    return response.data.map((product: any) => ({
        ...product,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        stock: typeof product.stock === 'string' ? parseInt(product.stock) : product.stock,
    }));
  },

  // Create a new product
  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const response = await api.post('/inventory/products/', product);  // Changed from '/inventory/'
    return response.data;
  },

  // Get a single product
  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(`/inventory/products/${id}/`);  // Changed from '/inventory/${id}/'
    return response.data;
  },

  // Update a product
  updateProduct: async (id: number, product: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/inventory/products/${id}/`, product);  // Changed
    return response.data;
  },

  // Delete a product
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/inventory/products/${id}/`);  // Changed
  },
};