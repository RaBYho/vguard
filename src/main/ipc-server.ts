import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { VaultManager } from './vault/vault-manager';
import { generatePassword } from './crypto/password-generator';
import { LIMITS } from '../shared/validation';

export const IPC_TCP_PORT = 48485;

export function getSocketPath(): string {
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\vguard-${process.env.USERNAME || 'user'}`;
  }
  return path.join(os.tmpdir(), `vguard-${process.env.USER || 'user'}.sock`);
}

export class VGuardIPCServer {
  private server: net.Server | null = null;
  private tcpServer: net.Server | null = null;
  private vaultManager: VaultManager;
  private socketPath: string;

  constructor(vaultManager: VaultManager) {
    this.vaultManager = vaultManager;
    this.socketPath = getSocketPath();
  }

  public start(): void {
    // Si un ancien fichier socket traîne sur Linux/macOS, on le nettoie
    if (process.platform !== 'win32') {
      try {
        if (fs.existsSync(this.socketPath)) {
          fs.unlinkSync(this.socketPath);
        }
      } catch (e) {
        console.error('Erreur nettoyage ancien socket:', e);
      }
    }

    // 1. Serveur Unix domain socket / named pipe
    this.server = net.createServer((socket) => this.handleConnection(socket));
    this.server.listen(this.socketPath, () => {
      // Sécuriser les permissions du socket sur Unix (lecture/écriture utilisateur uniquement)
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync(this.socketPath, 0o600);
        } catch {}
      }
      console.log(`[VGuard IPC] Serveur d'extension démarré sur : ${this.socketPath}`);
    });

    this.server.on('error', (err) => {
      console.error('[VGuard IPC] Erreur serveur socket :', err);
    });

    // 2. Serveur TCP local (127.0.0.1) pour compatibilité universelle (Snap, Flatpak, sandboxes)
    this.tcpServer = net.createServer((socket) => this.handleConnection(socket));
    this.tcpServer.listen(IPC_TCP_PORT, '127.0.0.1', () => {
      console.log(`[VGuard IPC] Serveur TCP local démarré sur 127.0.0.1:${IPC_TCP_PORT}`);
    });

    this.tcpServer.on('error', (err: any) => {
      console.warn('[VGuard IPC] Avertissement serveur TCP local :', err?.message || err);
    });
  }

  private handleConnection(socket: net.Socket): void {
    let buffer = '';

    socket.on('data', async (chunk) => {
      buffer += chunk.toString('utf8');

      // Protection contre Buffer Overflow / Bombing / Épuisement mémoire
      if (buffer.length > LIMITS.MAX_IPC_BUFFER_BYTES) {
        buffer = '';
        try {
          socket.write(
            JSON.stringify({
              status: 'error',
              message: 'Dépassement de capacité : charge utile trop volumineuse.',
            }) + '\n'
          );
          socket.destroy();
        } catch {}
        return;
      }

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Garde la ligne incomplète pour le prochain chunk

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const request = JSON.parse(line);
          const response = await this.handleRequest(request);
          socket.write(JSON.stringify(response) + '\n');
        } catch (err: any) {
          socket.write(
            JSON.stringify({
              status: 'error',
              message: err?.message || 'Requête invalide',
            }) + '\n'
          );
        }
      }
    });

    socket.on('error', () => {
      // Déconnexion normale ou erreur client
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    if (this.tcpServer) {
      this.tcpServer.close();
      this.tcpServer = null;
    }
    if (process.platform !== 'win32') {
      try {
        if (fs.existsSync(this.socketPath)) {
          fs.unlinkSync(this.socketPath);
        }
      } catch {}
    }
  }

  private async handleRequest(req: any): Promise<any> {
    const action = req.action || req.type;

    switch (action) {
      case 'PING':
        return { status: 'ok', type: 'PONG', version: '0.1.0' };

      case 'STATUS': {
        const exists = await this.vaultManager.exists();
        const isLocked = this.vaultManager.isLocked();
        return {
          status: 'ok',
          exists,
          isLocked,
          version: '0.1.0',
        };
      }

      case 'GET_LOGINS_FOR_URL': {
        if (this.vaultManager.isLocked()) {
          return { status: 'locked', message: 'Le coffre-fort VGuard est verrouillé.' };
        }

        let domain = req.domain || '';
        if (!domain && req.url) {
          try {
            const parsed = new URL(req.url.startsWith('http') ? req.url : `https://${req.url}`);
            domain = parsed.hostname;
          } catch {
            domain = req.url;
          }
        }

        const logins = this.vaultManager.getLoginsForDomain(domain);
        return {
          status: 'ok',
          domain,
          logins,
        };
      }

      case 'GET_ALL_LOGINS': {
        if (this.vaultManager.isLocked()) {
          return { status: 'locked' };
        }
        const entries = this.vaultManager.getEntries();
        const safeList = entries.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          favorite: e.favorite,
          username: (e as any).username || (e as any).account || '',
          url: (e as any).url,
        }));
        return { status: 'ok', entries: safeList };
      }

      case 'GET_TOTP': {
        if (this.vaultManager.isLocked()) {
          return { status: 'locked' };
        }
        try {
          const totpResult = this.vaultManager.generateTOTPCode(req.entryId);
          return { status: 'ok', ...totpResult };
        } catch (err: any) {
          return { status: 'error', message: err.message };
        }
      }

      case 'CHECK_CREDENTIALS_EXIST': {
        if (this.vaultManager.isLocked()) {
          return { status: 'locked' };
        }
        const domain = (req.domain || '').toLowerCase().replace(/^www\./, '');
        const username = (req.username || '').toLowerCase().trim();
        const password = req.password || '';

        const entries = this.vaultManager.getEntries();
        for (const e of entries) {
          if (e.type !== 'password') continue;
          const p = e as any;
          const entryUser = (p.username || p.email || '').toLowerCase().trim();

          let matchDomain = false;
          if (p.url && p.url.toLowerCase().includes(domain)) matchDomain = true;
          if (p.title && p.title.toLowerCase().includes(domain.split('.')[0])) matchDomain = true;

          if (matchDomain && (entryUser === username || !username)) {
            if (p.password === password) {
              return { status: 'identical' };
            } else {
              return { status: 'update_needed', entryId: p.id, title: p.title };
            }
          }
        }
        return { status: 'new' };
      }

      case 'SAVE_CREDENTIALS': {
        if (this.vaultManager.isLocked()) {
          return { status: 'locked', message: 'Veuillez déverrouiller VGuard pour enregistrer.' };
        }

        if (req.updateEntryId) {
          const updated = await this.vaultManager.updateEntry(req.updateEntryId, {
            password: req.password,
            username: req.username || undefined,
            updatedAt: new Date().toISOString(),
          });
          return { status: 'updated', id: updated.id };
        }

        const entry = await this.vaultManager.addEntry({
          type: 'password' as const,
          title: req.title || req.domain || 'Nouveau compte',
          username: req.username || '',
          password: req.password || '',
          url: req.url || '',
          categoryId: '',
          favorite: false,
          notes: 'Enregistré via extension VGuard',
        } as any);
        return { status: 'saved', id: entry.id };
      }

      case 'GENERATE_PASSWORD': {
        const pwd = generatePassword(
          req.options || {
            length: 18,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            excludeAmbiguous: true,
          }
        );
        return { status: 'ok', password: pwd };
      }

      default:
        return { status: 'error', message: `Action inconnue: ${action}` };
    }
  }
}
