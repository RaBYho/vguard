export type EntryType = 'password' | 'totp';

export interface BaseEntry {
  id: string;
  type: EntryType;
  title: string;
  categoryId: string;
  favorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordEntry extends BaseEntry {
  type: 'password';
  username: string;
  password: string;
  email?: string;
  url?: string;
}

export interface TOTPEntry extends BaseEntry {
  type: 'totp';
  secret: string; // Base32
  issuer: string;
  account: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number; // typically 30s
}

export type VaultEntry = PasswordEntry | TOTPEntry;

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface VaultData {
  version: number;
  categories: Category[];
  entries: VaultEntry[];
  settings: {
    autoLockMinutes: number;
    clipboardClearSeconds: number;
    theme: 'dark' | 'light' | 'system';
  };
}

export interface VaultMeta {
  salt: string; // hex (16 bytes)
  verifier: string; // hex (SHA256 de masterKey pour vérification rapide)
  createdAt: string;
  lastModifiedAt: string;
}

export interface EncryptedPayload {
  iv: string; // hex (12 bytes)
  tag: string; // hex (16 bytes)
  data: string; // hex
}

export interface VaultFile {
  meta: VaultMeta;
  payload: EncryptedPayload;
}

export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  customSymbols?: string;
}

export interface PasswordEvaluation {
  score: number; // 0 à 4
  entropy: number;
  label: string;
}

export interface TOTPCodeResult {
  code: string;
  remainingSeconds: number;
  period: number;
}

export interface ParsedTOTPUri {
  type: 'totp';
  issuer: string;
  account: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;
  title: string;
}

export interface VaultAPI {
  // Vault lifecycle & auth
  vaultExists: () => Promise<boolean>;
  createVault: (masterPassword: string) => Promise<boolean>;
  unlockVault: (masterPassword: string) => Promise<VaultData>;
  lockVault: () => Promise<void>;
  isLocked: () => Promise<boolean>;
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;

  // Entries
  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VaultEntry>;
  updateEntry: (id: string, entry: Partial<VaultEntry>) => Promise<VaultEntry>;
  deleteEntry: (id: string) => Promise<boolean>;

  // Categories
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Settings
  updateSettings: (settings: Partial<VaultData['settings']>) => Promise<VaultData['settings']>;

  // Cryptographic utilities
  generatePassword: (options: PasswordGeneratorOptions) => Promise<string>;
  evaluateStrength: (password: string) => Promise<PasswordEvaluation>;

  // TOTP
  generateTOTPCode: (entryId: string) => Promise<TOTPCodeResult>;
  getAllTOTPCodes: () => Promise<Record<string, TOTPCodeResult>>;
  parseTOTPUri: (uri: string) => Promise<ParsedTOTPUri>;

  // Clipboard
  copyToClipboard: (text: string, clearAfterSeconds?: number) => Promise<void>;

  // Export / Import
  exportVault: (format: 'json' | 'csv') => Promise<string>;
  importVault: (content: string, format: 'json' | 'csv' | 'bitwarden') => Promise<{ importedCount: number }>;

  // Event listeners
  onAutoLocked: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    vaultAPI: VaultAPI;
  }
}
