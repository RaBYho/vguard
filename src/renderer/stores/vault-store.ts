import { create } from 'zustand';
import type {
  VaultEntry,
  PasswordEntry,
  TOTPEntry,
  Category,
  VaultData,
  TOTPCodeResult,
} from '../../shared/types';
import { useThemeStore } from '../hooks/useTheme';
import { toast } from './toast-store';
import { formatErrorMessage } from '../utils/format-error';

export type ActiveTab = 'all' | 'passwords' | 'totp' | 'favorites' | 'generator' | 'settings';

interface VaultState {
  isInitialized: boolean | null; // null = verification en cours
  isUnlocked: boolean;
  activeTab: ActiveTab;
  selectedCategoryId: string | null;
  searchQuery: string;
  entries: VaultEntry[];
  categories: Category[];
  settings: VaultData['settings'];
  totpCodes: Record<string, TOTPCodeResult>;
  editingEntry: VaultEntry | null;
  deletingEntry: VaultEntry | null;
  isEntryModalOpen: boolean;
  isQRScannerOpen: boolean;
  isGeneratorModalOpen: boolean;

  // Actions
  checkVaultExists: () => Promise<void>;
  unlock: (password: string) => Promise<void>;
  createVault: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  refreshTOTPCodes: () => Promise<void>;

  setActiveTab: (tab: ActiveTab) => void;
  setSelectedCategory: (id: string | null) => void;
  setSearchQuery: (query: string) => void;

  openNewEntryModal: (type?: 'password' | 'totp') => void;
  openEditEntryModal: (entry: VaultEntry) => void;
  closeEntryModal: () => void;
  requestDeleteEntry: (entry: VaultEntry) => void;
  cancelDeleteEntry: () => void;
  confirmDeleteEntry: () => Promise<void>;
  setQRScannerOpen: (open: boolean) => void;
  setGeneratorModalOpen: (open: boolean) => void;

  saveEntry: (entryData: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, entryData: Partial<VaultEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  addCategory: (name: string, icon: string, color: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<VaultData['settings']>) => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isInitialized: null,
  isUnlocked: false,
  activeTab: 'all',
  selectedCategoryId: null,
  searchQuery: '',
  entries: [],
  categories: [],
  settings: {
    autoLockMinutes: 5,
    clipboardClearSeconds: 30,
    theme: 'dark',
  },
  totpCodes: {},
  editingEntry: null,
  deletingEntry: null,
  isEntryModalOpen: false,
  isQRScannerOpen: false,
  isGeneratorModalOpen: false,

  checkVaultExists: async () => {
    try {
      const exists = await window.vaultAPI.vaultExists();
      set({ isInitialized: exists });
    } catch (e) {
      console.error('Erreur vérification vault:', e);
      set({ isInitialized: false });
    }
  },

  unlock: async (password: string) => {
    const data = await window.vaultAPI.unlockVault(password);
    set({
      isUnlocked: true,
      entries: data.entries || [],
      categories: data.categories || [],
      settings: data.settings || {
        autoLockMinutes: 5,
        clipboardClearSeconds: 30,
        theme: 'dark',
      },
    });
    if (data.settings?.theme) {
      useThemeStore.getState().syncFromVault(data.settings.theme);
    }
    if (data.settings?.userName && typeof localStorage !== 'undefined') {
      localStorage.setItem('vguard-user-name', data.settings.userName);
    }
    get().refreshTOTPCodes();
  },

  createVault: async (password: string) => {
    await window.vaultAPI.createVault(password);
    const data = await window.vaultAPI.unlockVault(password);
    set({
      isInitialized: true,
      isUnlocked: true,
      entries: data.entries || [],
      categories: data.categories || [],
      settings: data.settings,
    });
  },

  lock: async () => {
    await window.vaultAPI.lockVault();
    set({
      isUnlocked: false,
      entries: [],
      totpCodes: {},
      editingEntry: null,
      isEntryModalOpen: false,
    });
  },

  refreshTOTPCodes: async () => {
    if (!get().isUnlocked) return;
    try {
      const codes = await window.vaultAPI.getAllTOTPCodes();
      set({ totpCodes: codes });
    } catch (e) {
      console.error('Erreur refresh TOTP:', e);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab, selectedCategoryId: null }),
  setSelectedCategory: (id) => set({ selectedCategoryId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  openNewEntryModal: (type = 'password') => {
    const defaultCategoryId = get().categories[0]?.id || '';
    const newEntryTemplate: Partial<VaultEntry> =
      type === 'password'
        ? {
            type: 'password',
            title: '',
            username: '',
            password: '',
            email: '',
            url: '',
            categoryId: get().selectedCategoryId || defaultCategoryId,
            favorite: false,
            notes: '',
          }
        : {
            type: 'totp',
            title: '',
            issuer: '',
            account: '',
            secret: '',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            categoryId: get().selectedCategoryId || defaultCategoryId,
            favorite: false,
            notes: '',
          };

    set({ editingEntry: newEntryTemplate as VaultEntry, isEntryModalOpen: true });
  },

  openEditEntryModal: (entry) => set({ editingEntry: entry, isEntryModalOpen: true }),
  closeEntryModal: () => set({ isEntryModalOpen: false, editingEntry: null }),
  requestDeleteEntry: (entry) => set({ deletingEntry: entry }),
  cancelDeleteEntry: () => set({ deletingEntry: null }),
  confirmDeleteEntry: async () => {
    const entry = get().deletingEntry;
    if (!entry) return;
    try {
      await get().deleteEntry(entry.id);
      set({ deletingEntry: null });
      toast.success(
        entry.type === 'password'
          ? 'Mot de passe supprimé avec succès.'
          : 'Code 2FA supprimé avec succès.'
      );
    } catch (err: any) {
      toast.error(formatErrorMessage(err, "Erreur lors de la suppression de l'élément."));
    }
  },
  setQRScannerOpen: (open) => set({ isQRScannerOpen: open }),
  setGeneratorModalOpen: (open) => set({ isGeneratorModalOpen: open }),

  saveEntry: async (entryData) => {
    const saved = await window.vaultAPI.addEntry(entryData);
    set((state) => ({
      entries: [saved, ...state.entries],
      isEntryModalOpen: false,
      editingEntry: null,
    }));
    if (saved.type === 'totp') {
      get().refreshTOTPCodes();
    }
  },

  updateEntry: async (id, entryData) => {
    const updated = await window.vaultAPI.updateEntry(id, entryData);
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? updated : e)),
      isEntryModalOpen: false,
      editingEntry: null,
    }));
    if (updated.type === 'totp') {
      get().refreshTOTPCodes();
    }
  },

  deleteEntry: async (id) => {
    const ok = await window.vaultAPI.deleteEntry(id);
    if (ok) {
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }));
    }
  },

  toggleFavorite: async (id) => {
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return;
    const updated = await window.vaultAPI.updateEntry(id, { favorite: !entry.favorite });
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? updated : e)),
    }));
  },

  addCategory: async (name, icon, color) => {
    const newCat = await window.vaultAPI.addCategory({ name, icon, color });
    set((state) => ({ categories: [...state.categories, newCat] }));
  },

  deleteCategory: async (id) => {
    const ok = await window.vaultAPI.deleteCategory(id);
    if (ok) {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        selectedCategoryId: state.selectedCategoryId === id ? null : state.selectedCategoryId,
      }));
    }
  },

  updateSettings: async (newSettings) => {
    const updated = await window.vaultAPI.updateSettings(newSettings);
    set({ settings: updated });
    if (newSettings.theme) {
      useThemeStore.getState().setTheme(newSettings.theme);
    }
    if (newSettings.userName && typeof localStorage !== 'undefined') {
      localStorage.setItem('vguard-user-name', newSettings.userName);
    }
  },
}));
