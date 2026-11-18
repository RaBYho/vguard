import crypto from 'node:crypto';
import type { EncryptedPayload } from '../../shared/types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommandé pour AES-GCM
const TAG_LENGTH = 16; // 128 bits

/**
 * Chiffre une chaîne de caractères en AES-256-GCM.
 * Génère un IV cryptographiquement aléatoire pour chaque opération.
 */
export function encryptData(plaintext: string, key: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    tag: authTag.toString('hex'),
    data: encrypted,
  };
}

/**
 * Déchiffre une charge utile AES-256-GCM et valide le tag d'authentification.
 * Lève une exception si le tag est invalide ou si les données ont été altérées.
 */
export function decryptData(payload: EncryptedPayload, key: Buffer): string {
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(payload.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
