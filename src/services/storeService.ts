import { dataService } from './firebaseService';
import { Product, StoreOrder, StoreSettings, OrderStatus } from '../types';

export const storeService = {
  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    return await dataService.getCollection<Product>('store_products');
  },
  
  getActiveProducts: async (): Promise<Product[]> => {
    const products = await dataService.getCollection<Product>('store_products');
    return products.filter(p => p.isActive && p.inStock);
  },

  getProduct: async (id: string): Promise<Product | null> => {
    return await dataService.getDoc<Product>('store_products', id);
  },

  addProduct: async (product: Omit<Product, 'id'>): Promise<string> => {
    return await dataService.addDoc('store_products', product);
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<void> => {
    return await dataService.updateDoc('store_products', id, product);
  },

  deleteProduct: async (id: string): Promise<void> => {
    return await dataService.deleteDoc('store_products', id);
  },

  // --- ORDERS ---
  getOrders: async (): Promise<StoreOrder[]> => {
    return await dataService.getCollection<StoreOrder>('store_orders');
  },

  getUserOrders: async (userId: string): Promise<StoreOrder[]> => {
    const allOrders = await dataService.getCollection<StoreOrder>('store_orders');
    return allOrders.filter(o => o.userId === userId);
  },

  placeOrder: async (order: Omit<StoreOrder, 'id'>): Promise<string> => {
    return await dataService.addDoc('store_orders', order);
  },

  updateOrderStatus: async (id: string, status: OrderStatus, note?: string): Promise<void> => {
    const order = await dataService.getDoc<StoreOrder>('store_orders', id);
    if (!order) throw new Error("Order not found");
    
    const trackingUpdates = order.trackingUpdates || [];
    trackingUpdates.push({
      status,
      timestamp: new Date().toISOString(),
      note
    });

    return await dataService.updateDoc('store_orders', id, { status, trackingUpdates });
  },

  updateOrder: async (id: string, updates: Partial<StoreOrder>): Promise<void> => {
    return await dataService.updateDoc('store_orders', id, updates);
  },

  // --- SETTINGS ---
  getSettings: async (): Promise<StoreSettings> => {
    const settings = await dataService.getDoc<StoreSettings>('store_settings', 'main');
    if (settings) return settings;
    // Defaults
    return {
      deliveryFee: 50,
      freeDeliveryThreshold: 500,
      isActive: true
    };
  },

  updateSettings: async (settings: Partial<StoreSettings>): Promise<void> => {
    return await dataService.setDoc('store_settings', 'main', settings);
  }
};
