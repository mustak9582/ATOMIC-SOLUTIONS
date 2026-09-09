import { Service } from '../types';

const STORAGE_KEY = 'atomic_custom_services';

export const getLocalCustomServices = (): Record<string, Partial<Service>> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveLocalCustomService = (serviceId: string, updates: Partial<Service>): void => {
  try {
    const all = getLocalCustomServices();
    all[serviceId] = { ...(all[serviceId] || {}), ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('atomic_services_updated', { detail: { serviceId, updates } }));
    }
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

export const fetchServerServices = async (): Promise<Record<string, Partial<Service>>> => {
  try {
    const res = await fetch('/api/services');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const current = getLocalCustomServices();
        const merged = { ...current, ...data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    // Fallback to local
  }
  return getLocalCustomServices();
};

export const saveServerService = async (serviceId: string, updates: Partial<Service>): Promise<void> => {
  try {
    await fetch(`/api/services/${encodeURIComponent(serviceId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch (e) {
    console.warn('Failed to save service to server:', e);
  }
};

export const mergeServicesWithOverrides = (
  baseServices: Service[], 
  overrides: Record<string, Partial<Service>> = getLocalCustomServices()
): Service[] => {
  if (!Array.isArray(baseServices)) return [];
  return baseServices.map(s => {
    const override = overrides[s.id];
    if (!override) return s;
    return { ...s, ...override };
  });
};
