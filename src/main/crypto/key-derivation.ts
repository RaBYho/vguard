import argon2 from 'argon2';
import crypto from 'node:crypto';

export interface DerivedKeyResult {
  key: Buffer; // 32 bytes (256 bits)
  salt: Buffer; // 16 bytes
}

/**
 * Dérive une clé AES-256 à partir du mot de passe maître en utilisant Argon2id.
 * Paramètres optimisés : memoryCost: 64MB, timeCost: 3, parallelism: 4.
 */
export async function deriveKey(
  masterPassword: string,
  existingSalt?: Buffer
): Promise<DerivedKeyResult> {
  const salt = existingSalt ?? crypto.randomBytes(16);

  const rawKey = await argon2.hash(masterPassword, {
    type: argon2.argon2id,
    salt,
    timeCost: 3,
    memoryCost: 65536, // 64 MB
    parallelism: 4,
    hashLength: 32, // 256 bits
    raw: true,
  });

  return {
    key: Buffer.from(rawKey),
    salt,
  };
}

/**
 * Calcule l'empreinte de vérification (verifier) d'une clé dérivée.
 * Permet de vérifier la validité du mot de passe maître sans tenter de déchiffrer.
 */
export function computeVerifier(key: Buffer): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}
