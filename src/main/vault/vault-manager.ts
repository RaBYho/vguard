import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { deriveKey, computeVerifier } from '../crypto/key-derivation';
import { encryptData, decryptData } from '../crypto/vault-crypto';
import { generateCode } from '../totp/totp-engine';
import type {
  VaultData,
  VaultFile,
  VaultEntry,
  PasswordEntry,
  TOTPEntry,
  Category,
  TOTPCodeResult,
} from '../../shared/types';

export class VaultManager {
  private vaultPath: string;
  private masterKey: Buffer | null = null;
  private vaultData: VaultData | null = null;
  private autoLockTimer: NodeJS.Timeout | null = null;
  private onAutoLockCallback: (() => void) | null = null;

  constructor(customVaultPath?: string) {
    if (customVaultPath) {
      this.vaultPath = customVaultPath;
    } else {
      let baseDir: string;
      try {
        // En environnement Electron
        if (process.versions && (process.versions as any).electron) {
          const { app } = require('electron');
          baseDir = app.getPath('userData');
        } else {
          baseDir = path.join(os.homedir(), '.vguard');
        }
      } catch {
        baseDir = path.join(os.homedir(), '.vguard');
      }
      this.vaultPath = path.join(baseDir, 'vault.vguard');
    }
  }

  public setOnAutoLock(cb: () => void) {
    this.onAutoLockCallback = cb;
  }

  /**
   * Vérifie si le fichier de coffre-fort existe sur le disque
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.vaultPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si le coffre est actuellement verrouillé
   */
  isLocked(): boolean {
    return this.masterKey === null || this.vaultData === null;
  }

  /**
   * Crée un nouveau coffre-fort avec le mot de passe maître fourni
   */
  async create(masterPassword: string): Promise<boolean> {
    if (await this.exists()) {
      throw new Error('Un coffre-fort existe déjà sur cet appareil.');
    }

    if (!masterPassword || masterPassword.length < 8) {
      throw new Error('Le mot de passe maître doit comporter au moins 8 caractères.');
    }

    const { key, salt } = await deriveKey(masterPassword);
    const verifier = computeVerifier(key);

    const initialCategories: Category[] = [
      { id: crypto.randomUUID(), name: 'Personnel', icon: 'User', color: '#3b82f6' },
      { id: crypto.randomUUID(), name: 'Travail', icon: 'Briefcase', color: '#10b981' },
      { id: crypto.randomUUID(), name: 'Finance', icon: 'Landmark', color: '#f59e0b' },
      { id: crypto.randomUUID(), name: 'Réseaux Sociaux', icon: 'Share2', color: '#ec4899' },
    ];

    const initialData: VaultData = {
      version: 1,
      categories: initialCategories,
      entries: [],
      settings: {
        autoLockMinutes: 5,
        clipboardClearSeconds: 30,
        theme: 'dark',
      },
    };

    const payload = encryptData(JSON.stringify(initialData), key);

    const vaultFile: VaultFile = {
      meta: {
        salt: salt.toString('hex'),
        verifier,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      },
      payload,
    };

    await fs.mkdir(path.dirname(this.vaultPath), { recursive: true });
    await fs.writeFile(this.vaultPath, JSON.stringify(vaultFile, null, 2), {
      mode: 0o600, // Lecture/écriture propriétaire uniquement
    });

    this.masterKey = key;
    this.vaultData = initialData;
    this.restartAutoLockTimer();

    return true;
  }

  /**
   * Déverrouille le coffre-fort existant
   */
  async unlock(masterPassword: string): Promise<VaultData> {
    if (!this.isLocked() && this.vaultData) {
      this.restartAutoLockTimer();
      return this.vaultData;
    }

    const rawContent = await fs.readFile(this.vaultPath, 'utf8');
    const vaultFile: VaultFile = JSON.parse(rawContent);

    const salt = Buffer.from(vaultFile.meta.salt, 'hex');
    const { key } = await deriveKey(masterPassword, salt);
    const verifier = computeVerifier(key);

    if (verifier !== vaultFile.meta.verifier) {
      throw new Error('Mot de passe maître incorrect.');
    }

    try {
      const decryptedJson = decryptData(vaultFile.payload, key);
      const data: VaultData = JSON.parse(decryptedJson);

      this.masterKey = key;
      this.vaultData = data;
      this.restartAutoLockTimer();

      return this.vaultData;
    } catch {
      throw new Error('Échec du déchiffrement. Les données sont peut-être corrompues.');
    }
  }

  /**
   * Verrouille le coffre et purge les données en mémoire vive
   */
  lock(): void {
    if (this.masterKey) {
      this.masterKey.fill(0);
      this.masterKey = null;
    }
    this.vaultData = null;

    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
  }

  /**
   * Modifie le mot de passe maître
   */
  async changeMasterPassword(oldPw: string, newPw: string): Promise<boolean> {
    if (this.isLocked() || !this.vaultData) {
      await this.unlock(oldPw);
    }

    if (newPw.length < 8) {
      throw new Error('Le nouveau mot de passe maître doit comporter au moins 8 caractères.');
    }

    const { key: newKey, salt: newSalt } = await deriveKey(newPw);
    const newVerifier = computeVerifier(newKey);

    const payload = encryptData(JSON.stringify(this.vaultData), newKey);

    const vaultFile: VaultFile = {
      meta: {
        salt: newSalt.toString('hex'),
        verifier: newVerifier,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      },
      payload,
    };

    await fs.writeFile(this.vaultPath, JSON.stringify(vaultFile, null, 2), { mode: 0o600 });

    if (this.masterKey) this.masterKey.fill(0);
    this.masterKey = newKey;
    this.restartAutoLockTimer();

    return true;
  }

  // ================= DOMAIN MATCHING & EXTENSION HELPERS =================

  getEntries(): VaultEntry[] {
    this.ensureUnlocked();
    return this.vaultData!.entries;
  }

  getLoginsForDomain(targetDomain: string): Array<{
    id: string;
    title: string;
    username: string;
    password: string;
    url?: string;
    totpCode?: string;
    totpRemaining?: number;
  }> {
    this.ensureUnlocked();
    if (!targetDomain) return [];

    const cleanTarget = targetDomain.toLowerCase().replace(/^www\./, '');
    const results: Array<any> = [];

    // Récupérer les mots de passe correspondants
    for (const entry of this.vaultData!.entries) {
      if (entry.type !== 'password') continue;

      const p = entry as PasswordEntry;
      let matches = false;

      if (p.url) {
        try {
          const entryUrl = new URL(p.url.startsWith('http') ? p.url : `https://${p.url}`);
          const entryDomain = entryUrl.hostname.toLowerCase().replace(/^www\./, '');
          if (entryDomain === cleanTarget || cleanTarget.endsWith(`.${entryDomain}`) || entryDomain.endsWith(`.${cleanTarget}`)) {
            matches = true;
          }
        } catch {
          if (p.url.toLowerCase().includes(cleanTarget)) matches = true;
        }
      }

      if (!matches && p.title) {
        const cleanTitle = p.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanDomainPart = cleanTarget.split('.')[0];
        if (cleanTitle.includes(cleanDomainPart) || cleanDomainPart.includes(cleanTitle)) {
          matches = true;
        }
      }

      if (matches) {
        // Chercher s'il existe une entrée TOTP associée (même titre/domaine)
        let totpCode: string | undefined;
        let totpRemaining: number | undefined;

        const matchingTotp = this.vaultData!.entries.find(
          (t) =>
            t.type === 'totp' &&
            (t.title?.toLowerCase().includes(cleanTarget.split('.')[0]) ||
              (t as TOTPEntry).issuer?.toLowerCase().includes(cleanTarget.split('.')[0]))
        ) as TOTPEntry | undefined;

        if (matchingTotp) {
          try {
            const totpResult = generateCode(matchingTotp);
            totpCode = totpResult.code;
            totpRemaining = totpResult.remainingSeconds;
          } catch {
            // Ignorer si échec
          }
        }

        results.push({
          id: p.id,
          title: p.title,
          username: p.username || p.email || '',
          password: p.password,
          url: p.url,
          totpCode,
          totpRemaining,
        });
      }
    }

    return results;
  }

  // ================= CRUD ENTRÉES =================

  async addEntry(entryData: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<VaultEntry> {
    this.ensureUnlocked();

    const now = new Date().toISOString();
    const newEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as VaultEntry;

    this.vaultData!.entries.push(newEntry);
    await this.persist();
    return newEntry;
  }

  async updateEntry(id: string, updates: Partial<VaultEntry>): Promise<VaultEntry> {
    this.ensureUnlocked();

    const index = this.vaultData!.entries.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error('Entrée introuvable');
    }

    const existing = this.vaultData!.entries[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    } as VaultEntry;

    this.vaultData!.entries[index] = updated;
    await this.persist();
    return updated;
  }

  async deleteEntry(id: string): Promise<boolean> {
    this.ensureUnlocked();

    const initialLen = this.vaultData!.entries.length;
    this.vaultData!.entries = this.vaultData!.entries.filter((e) => e.id !== id);

    if (this.vaultData!.entries.length !== initialLen) {
      await this.persist();
      return true;
    }
    return false;
  }

  // ================= CRUD CATÉGORIES =================

  async addCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    this.ensureUnlocked();

    const newCat: Category = {
      ...cat,
      id: crypto.randomUUID(),
    };

    this.vaultData!.categories.push(newCat);
    await this.persist();
    return newCat;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    this.ensureUnlocked();

    const cat = this.vaultData!.categories.find((c) => c.id === id);
    if (!cat) throw new Error('Catégorie introuvable');

    Object.assign(cat, updates);
    await this.persist();
    return cat;
  }

  async deleteCategory(id: string): Promise<boolean> {
    this.ensureUnlocked();

    this.vaultData!.categories = this.vaultData!.categories.filter((c) => c.id !== id);
    // Réassigner les entrées de cette catégorie à la première restante ou vide
    const fallbackId = this.vaultData!.categories[0]?.id || '';
    this.vaultData!.entries.forEach((e) => {
      if (e.categoryId === id) {
        e.categoryId = fallbackId;
      }
    });

    await this.persist();
    return true;
  }

  // ================= TOTP CODES =================

  generateTOTPCode(entryId: string): TOTPCodeResult {
    this.ensureUnlocked();

    const entry = this.vaultData!.entries.find((e) => e.id === entryId);
    if (!entry || entry.type !== 'totp') {
      throw new Error('Entrée 2FA/TOTP introuvable');
    }

    return generateCode(entry as TOTPEntry);
  }

  getAllTOTPCodes(): Record<string, TOTPCodeResult> {
    this.ensureUnlocked();

    const results: Record<string, TOTPCodeResult> = {};
    for (const entry of this.vaultData!.entries) {
      if (entry.type === 'totp') {
        try {
          results[entry.id] = generateCode(entry as TOTPEntry);
        } catch {
          // Ignorer les entrées au secret invalide
        }
      }
    }
    return results;
  }

  // ================= PARAMÈTRES =================

  async updateSettings(settings: Partial<VaultData['settings']>): Promise<VaultData['settings']> {
    this.ensureUnlocked();
    Object.assign(this.vaultData!.settings, settings);
    await this.persist();
    this.restartAutoLockTimer();
    return this.vaultData!.settings;
  }

  // ================= EXPORT & IMPORT =================

  exportVault(format: 'json' | 'csv'): string {
    this.ensureUnlocked();

    if (format === 'json') {
      return JSON.stringify(this.vaultData, null, 2);
    }

    // Export CSV simple
    const headers = ['Type', 'Titre', 'Identifiant / Compte', 'Mot de passe / Secret', 'URL', 'Notes'];
    const rows = this.vaultData!.entries.map((e) => {
      if (e.type === 'password') {
        const p = e as PasswordEntry;
        return [
          'password',
          `"${(p.title || '').replace(/"/g, '""')}"`,
          `"${(p.username || '').replace(/"/g, '""')}"`,
          `"${(p.password || '').replace(/"/g, '""')}"`,
          `"${(p.url || '').replace(/"/g, '""')}"`,
          `"${(p.notes || '').replace(/"/g, '""')}"`,
        ].join(',');
      } else {
        const t = e as TOTPEntry;
        return [
          'totp',
          `"${(t.title || '').replace(/"/g, '""')}"`,
          `"${(t.account || '').replace(/"/g, '""')}"`,
          `"${(t.secret || '').replace(/"/g, '""')}"`,
          `"${(t.issuer || '').replace(/"/g, '""')}"`,
          `"${(t.notes || '').replace(/"/g, '""')}"`,
        ].join(',');
      }
    });

    return [headers.join(','), ...rows].join('\n');
  }

  async importVault(content: string, format: 'json' | 'csv' | 'bitwarden'): Promise<{ importedCount: number }> {
    this.ensureUnlocked();

    let count = 0;
    const now = new Date().toISOString();
    const defaultCatId = this.vaultData!.categories[0]?.id || '';

    if (format === 'json') {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.entries)) {
        for (const item of parsed.entries) {
          this.vaultData!.entries.push({
            ...item,
            id: crypto.randomUUID(),
            categoryId: item.categoryId || defaultCatId,
            createdAt: now,
            updatedAt: now,
          });
          count++;
        }
      }
    }

    await this.persist();
    return { importedCount: count };
  }

  // ================= PRIVÉ =================

  private ensureUnlocked() {
    if (this.isLocked() || !this.masterKey || !this.vaultData) {
      throw new Error('Le coffre-fort est verrouillé.');
    }
  }

  private async persist(): Promise<void> {
    this.ensureUnlocked();

    const raw = await fs.readFile(this.vaultPath, 'utf8');
    const vaultFile: VaultFile = JSON.parse(raw);

    vaultFile.payload = encryptData(JSON.stringify(this.vaultData), this.masterKey!);
    vaultFile.meta.lastModifiedAt = new Date().toISOString();

    await fs.writeFile(this.vaultPath, JSON.stringify(vaultFile, null, 2), { mode: 0o600 });
    this.restartAutoLockTimer();
  }

  public restartAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }

    const minutes = this.vaultData?.settings?.autoLockMinutes ?? 5;
    if (minutes > 0) {
      this.autoLockTimer = setTimeout(() => {
        this.lock();
        if (this.onAutoLockCallback) {
          this.onAutoLockCallback();
        }
      }, minutes * 60 * 1000);
    }
  }
}
