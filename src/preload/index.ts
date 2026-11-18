import { contextBridge, ipcRenderer } from 'electron';
import type {
  VaultEntry,
  Category,
  PasswordGeneratorOptions,
  VaultData,
} from '../shared/types';

contextBridge.exposeInMainWorld('vaultAPI', {
  // Vault lifecycle & auth
  vaultExists: () => ipcRenderer.invoke('vault:exists'),
  createVault: (masterPassword: string) => ipcRenderer.invoke('vault:create', masterPassword),
  unlockVault: (masterPassword: string) => ipcRenderer.invoke('vault:unlock', masterPassword),
  lockVault: () => ipcRenderer.invoke('vault:lock'),
  isLocked: () => ipcRenderer.invoke('vault:isLocked'),
  changeMasterPassword: (oldPw: string, newPw: string) =>
    ipcRenderer.invoke('vault:changePassword', oldPw, newPw),

  // Entries
  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) =>
    ipcRenderer.invoke('vault:addEntry', entry),
  updateEntry: (id: string, entry: Partial<VaultEntry>) =>
    ipcRenderer.invoke('vault:updateEntry', id, entry),
  deleteEntry: (id: string) => ipcRenderer.invoke('vault:deleteEntry', id),

  // Categories
  addCategory: (category: Omit<Category, 'id'>) =>
    ipcRenderer.invoke('vault:addCategory', category),
  updateCategory: (id: string, category: Partial<Category>) =>
    ipcRenderer.invoke('vault:updateCategory', id, category),
  deleteCategory: (id: string) => ipcRenderer.invoke('vault:deleteCategory', id),

  // Settings
  updateSettings: (settings: Partial<VaultData['settings']>) =>
    ipcRenderer.invoke('vault:updateSettings', settings),

  // Cryptographic utilities
  generatePassword: (options: PasswordGeneratorOptions) =>
    ipcRenderer.invoke('crypto:generatePassword', options),
  evaluateStrength: (password: string) =>
    ipcRenderer.invoke('crypto:evaluateStrength', password),

  // TOTP
  generateTOTPCode: (entryId: string) => ipcRenderer.invoke('totp:generateCode', entryId),
  getAllTOTPCodes: () => ipcRenderer.invoke('totp:getAllCodes'),
  parseTOTPUri: (uri: string) => ipcRenderer.invoke('totp:parseUri', uri),

  // Clipboard
  copyToClipboard: (text: string, clearAfterSeconds?: number) =>
    ipcRenderer.invoke('system:copyToClipboard', text, clearAfterSeconds),

  // Export / Import
  exportVault: (format: 'json' | 'csv') => ipcRenderer.invoke('vault:export', format),
  importVault: (content: string, format: string) =>
    ipcRenderer.invoke('vault:import', content, format),

  // Auto lock event
  onAutoLocked: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('vault:autoLocked', listener);
    return () => {
      ipcRenderer.removeListener('vault:autoLocked', listener);
    };
  },
});
