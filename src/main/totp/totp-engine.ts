import * as OTPAuth from 'otpauth';
import type { TOTPEntry, TOTPCodeResult, ParsedTOTPUri } from '../../shared/types';

/**
 * Normalise un secret Base32 (supprime les espaces, tirets et convertit en majuscules)
 */
export function normalizeBase32Secret(secret: string): string {
  return secret.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Génère le code TOTP actuel avec le décompte des secondes restantes
 */
export function generateCode(entry: TOTPEntry): TOTPCodeResult {
  const period = entry.period || 30;
  const digits = entry.digits || 6;
  const algorithm = entry.algorithm || 'SHA1';

  const cleanSecret = normalizeBase32Secret(entry.secret);

  const totp = new OTPAuth.TOTP({
    issuer: entry.issuer,
    label: entry.account,
    algorithm,
    digits,
    period,
    secret: OTPAuth.Secret.fromBase32(cleanSecret),
  });

  const code = totp.generate();
  const now = Math.floor(Date.now() / 1000);
  const remainingSeconds = period - (now % period);

  return {
    code,
    remainingSeconds,
    period,
  };
}

/**
 * Décode une URL de standard otpauth:// (format QR Code Authenticator)
 */
export function parseUri(uri: string): ParsedTOTPUri {
  const parsed = OTPAuth.URI.parse(uri);

  if (!(parsed instanceof OTPAuth.TOTP)) {
    throw new Error("Seul l'algorithme TOTP (Time-Based) est pris en charge (pas HOTP).");
  }

  const rawIssuer = parsed.issuer || '';
  const rawLabel = parsed.label || '';

  let issuer = rawIssuer;
  let account = rawLabel;

  if (rawLabel.includes(':')) {
    const parts = rawLabel.split(':');
    if (!issuer) issuer = parts[0].trim();
    account = parts.slice(1).join(':').trim();
  }

  return {
    type: 'totp',
    issuer: issuer || 'Service Inconnu',
    account: account || 'Compte',
    secret: parsed.secret.base32,
    algorithm: (parsed.algorithm || 'SHA1') as 'SHA1' | 'SHA256' | 'SHA512',
    digits: (parsed.digits || 6) as 6 | 8,
    period: parsed.period || 30,
    title: issuer || account || 'Authentification 2FA',
  };
}

/**
 * Vérifie un code saisi par l'utilisateur
 */
export function verifyCode(entry: TOTPEntry, token: string): boolean {
  const cleanSecret = normalizeBase32Secret(entry.secret);

  const totp = new OTPAuth.TOTP({
    issuer: entry.issuer,
    label: entry.account,
    algorithm: entry.algorithm || 'SHA1',
    digits: entry.digits || 6,
    period: entry.period || 30,
    secret: OTPAuth.Secret.fromBase32(cleanSecret),
  });

  // Tolérance d'un intervalle avant/après pour la dérive d'horloge
  return totp.validate({ token: token.replace(/\s/g, ''), window: 1 }) !== null;
}
