import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, description?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', description, duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = { id, type, message, description, duration };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),
}));

// Raccourcis pratiques
export const toast = {
  success: (message: string, description?: string, duration = 3500) =>
    useToastStore.getState().addToast(message, 'success', description, duration),
  error: (message: string, description?: string, duration = 4000) =>
    useToastStore.getState().addToast(message, 'error', description, duration),
  info: (message: string, description?: string, duration = 3000) =>
    useToastStore.getState().addToast(message, 'info', description, duration),
};
