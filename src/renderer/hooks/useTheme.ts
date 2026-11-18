import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  syncFromVault: (vaultTheme: ThemeMode) => void;
}

function applyTheme(mode: ThemeMode) {
  if (typeof document !== 'undefined') {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('vguard-theme') : null;
const initialMode: ThemeMode = saved === 'light' ? 'light' : 'dark';

if (typeof document !== 'undefined') {
  applyTheme(initialMode);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,

  setTheme: (mode) => {
    const validMode: ThemeMode = mode === 'light' ? 'light' : 'dark';
    try {
      localStorage.setItem('vguard-theme', validMode);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
    applyTheme(validMode);
    set({ mode: validMode });
  },

  toggleTheme: () => {
    const nextMode: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    get().setTheme(nextMode);
  },

  syncFromVault: (vaultTheme) => {
    const validMode: ThemeMode = vaultTheme === 'light' ? 'light' : 'dark';
    try {
      const currentLocal = localStorage.getItem('vguard-theme');
      if (currentLocal !== validMode) {
        localStorage.setItem('vguard-theme', validMode);
        applyTheme(validMode);
        set({ mode: validMode });
      }
    } catch (e) {
      console.warn('Could not sync theme from vault', e);
    }
  },
}));
