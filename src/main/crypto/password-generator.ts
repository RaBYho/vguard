import crypto from 'node:crypto';
import type { PasswordGeneratorOptions, PasswordEvaluation } from '../../shared/types';

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  uppercaseNoAmbiguous: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  lowercaseNoAmbiguous: 'abcdefghjkmnpqrstuvwxyz',
  numbers: '0123456789',
  numbersNoAmbiguous: '23456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?~',
};

/**
 * Générateur de mots de passe aléatoires hautement sécurisé via crypto.randomInt
 */
export function generatePassword(options: PasswordGeneratorOptions): string {
  let charset = '';
  const requiredChars: string[] = [];

  const useAmbiguous = !options.excludeAmbiguous;

  if (options.uppercase) {
    const chars = useAmbiguous ? CHAR_SETS.uppercase : CHAR_SETS.uppercaseNoAmbiguous;
    charset += chars;
    requiredChars.push(chars[crypto.randomInt(chars.length)]);
  }

  if (options.lowercase) {
    const chars = useAmbiguous ? CHAR_SETS.lowercase : CHAR_SETS.lowercaseNoAmbiguous;
    charset += chars;
    requiredChars.push(chars[crypto.randomInt(chars.length)]);
  }

  if (options.numbers) {
    const chars = useAmbiguous ? CHAR_SETS.numbers : CHAR_SETS.numbersNoAmbiguous;
    charset += chars;
    requiredChars.push(chars[crypto.randomInt(chars.length)]);
  }

  if (options.symbols) {
    const chars = options.customSymbols || CHAR_SETS.symbols;
    charset += chars;
    requiredChars.push(chars[crypto.randomInt(chars.length)]);
  }

  if (charset.length === 0) {
    charset = CHAR_SETS.lowercase;
    requiredChars.push(charset[crypto.randomInt(charset.length)]);
  }

  const length = Math.max(options.length, requiredChars.length);
  const passwordChars = [...requiredChars];

  for (let i = passwordChars.length; i < length; i++) {
    passwordChars.push(charset[crypto.randomInt(charset.length)]);
  }

  // Fisher-Yates shuffle sécurisé
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

/**
 * Évalue la force d'un mot de passe (entropie en bits de Shannon)
 */
export function evaluateStrength(password: string): PasswordEvaluation {
  if (!password) {
    return { score: 0, entropy: 0, label: 'Vide' };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  const entropy = Math.round(password.length * (poolSize > 0 ? Math.log2(poolSize) : 0));

  let score = 0;
  let label = 'Très faible';

  if (entropy >= 80 && password.length >= 14) {
    score = 4;
    label = 'Très robuste';
  } else if (entropy >= 60 && password.length >= 10) {
    score = 3;
    label = 'Robuste';
  } else if (entropy >= 45 && password.length >= 8) {
    score = 2;
    label = 'Moyen';
  } else if (entropy >= 28) {
    score = 1;
    label = 'Faible';
  }

  return { score, entropy, label };
}
