import { app, BrowserWindow, ipcMain, clipboard } from 'electron';
import path from 'node:path';
import { VaultManager } from './vault/vault-manager';
import { VGuardIPCServer } from './ipc-server';
import { generatePassword, evaluateStrength } from './crypto/password-generator';
import { parseUri } from './totp/totp-engine';

// Désactive le sandbox SUID Linux strict en mode développement
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

let mainWindow: BrowserWindow | null = null;
const vaultManager = new VaultManager();
const ipcServer = new VGuardIPCServer(vaultManager);
let clipboardTimer: NodeJS.Timeout | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 860,
    minHeight: 600,
    backgroundColor: '#0f172a',
    title: 'VGuard — Mots de Passe & 2FA',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Liaison de l'événement d'auto-verrouillage avec le Renderer
  vaultManager.setOnAutoLock(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('vault:autoLocked');
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ================= IPC HANDLERS =================

// Vault Lifecycle & Auth
ipcMain.handle('vault:exists', async () => vaultManager.exists());
ipcMain.handle('vault:create', async (_, password) => vaultManager.create(password));
ipcMain.handle('vault:unlock', async (_, password) => vaultManager.unlock(password));
ipcMain.handle('vault:lock', async () => vaultManager.lock());
ipcMain.handle('vault:isLocked', async () => vaultManager.isLocked());
ipcMain.handle('vault:changePassword', async (_, oldPw, newPw) =>
  vaultManager.changeMasterPassword(oldPw, newPw)
);

// Entries CRUD
ipcMain.handle('vault:addEntry', async (_, entry) => vaultManager.addEntry(entry));
ipcMain.handle('vault:updateEntry', async (_, id, entry) => vaultManager.updateEntry(id, entry));
ipcMain.handle('vault:deleteEntry', async (_, id) => vaultManager.deleteEntry(id));

// Categories CRUD
ipcMain.handle('vault:addCategory', async (_, cat) => vaultManager.addCategory(cat));
ipcMain.handle('vault:updateCategory', async (_, id, cat) => vaultManager.updateCategory(id, cat));
ipcMain.handle('vault:deleteCategory', async (_, id) => vaultManager.deleteCategory(id));

// Settings
ipcMain.handle('vault:updateSettings', async (_, settings) => vaultManager.updateSettings(settings));

// Crypto
ipcMain.handle('crypto:generatePassword', (_, opts) => generatePassword(opts));
ipcMain.handle('crypto:evaluateStrength', (_, pw) => evaluateStrength(pw));

// TOTP
ipcMain.handle('totp:generateCode', (_, entryId) => vaultManager.generateTOTPCode(entryId));
ipcMain.handle('totp:getAllCodes', () => vaultManager.getAllTOTPCodes());
ipcMain.handle('totp:parseUri', (_, uri) => parseUri(uri));

// Clipboard sécurisé avec minuterie d'effacement automatique
ipcMain.handle('system:copyToClipboard', (_, text: string, clearSeconds = 30) => {
  clipboard.writeText(text);

  if (clipboardTimer) {
    clearTimeout(clipboardTimer);
  }

  if (clearSeconds > 0) {
    clipboardTimer = setTimeout(async () => {
      // Efface le presse-papier seulement si le texte n'a pas changé entre-temps
      const current = await clipboard.readText();
      if (current === text) {
        clipboard.clear();
      }
    }, clearSeconds * 1000);
  }
});

// Export / Import
ipcMain.handle('vault:export', (_, format) => vaultManager.exportVault(format));
ipcMain.handle('vault:import', (_, content, format) => vaultManager.importVault(content, format));

// ================= APP LIFECYCLE =================

app.whenReady().then(() => {
  ipcServer.start();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  vaultManager.lock();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  vaultManager.lock();
  ipcServer.stop();
});
