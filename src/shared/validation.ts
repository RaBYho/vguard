/**
 * Module de validation et d'assainissement centralisé (Defense in Depth)
 * Protection contre :
 * - Dépassement de capacité mémoire / Buffer overflow / Payload bombing
 * - Injection d'octets nuls (\0) et caractères de contrôle dangereux
 * - Attaques par protocoles URL malveillants (javascript:, data:, vbscript:, file:)
 * - ReDoS (déni de service par regex)
 */

export const LIMITS = {
  MASTER_PASSWORD_MIN: 8,
  MASTER_PASSWORD_MAX: 128,
  TITLE_MIN: 1,
  TITLE_MAX: 100,
  USERNAME_MAX: 150,
  EMAIL_MAX: 254, // RFC 5321
  PASSWORD_MAX: 256,
  URL_MAX: 2048,
  NOTES_MAX: 5000,
  TOTP_SECRET_MIN: 8,
  TOTP_SECRET_MAX: 128,
  ISSUER_MAX: 100,
  ACCOUNT_MAX: 100,
  CATEGORY_NAME_MAX: 50,
  SEARCH_QUERY_MAX: 100,
  USER_NAME_MAX: 100,
  RECOVERY_EMAIL_MAX: 254,
  MAX_IMPORT_SIZE_BYTES: 25 * 1024 * 1024, // 25 Mo max pour import JSON/CSV
  MAX_IPC_BUFFER_BYTES: 2 * 1024 * 1024, // 2 Mo max pour buffer socket IPC
} as const;

/**
 * Supprime les octets nuls (\0) et caractères de contrôle non imprimables
 * Si allowNewlines est true, préserve \n, \r et \t
 */
export function stripControlChars(input: string, allowNewlines = false): string {
  if (typeof input !== 'string') return '';

  // Supprime tous les octets nuls immédiatement
  let clean = input.replace(/\0/g, '');

  if (allowNewlines) {
    // Supprime les caractères de contrôle ASCII hors \t (0x09), \n (0x0A), \r (0x0D)
    clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    // Supprime tous les caractères de contrôle ASCII (0x00 - 0x1F et 0x7F)
    clean = clean.replace(/[\x00-\x1F\x7F]/g, '');
  }

  return clean;
}

/**
 * Assainit une chaîne mono-ligne (titre, nom d'utilisateur, email, etc.)
 */
export function sanitizeSingleLine(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  const clean = stripControlChars(input, false).trim();
  return clean.slice(0, maxLength);
}

/**
 * Assainit un mot de passe (préserve les espaces exacts, mais bloque octets nuls et contrôle)
 */
export function sanitizePassword(input: unknown, maxLength = LIMITS.PASSWORD_MAX): string {
  if (typeof input !== 'string') return '';
  // Pas de trim() sur les mots de passe afin de ne pas altérer les espaces intentionnels
  const clean = stripControlChars(input, false);
  return clean.slice(0, maxLength);
}

/**
 * Assainit une chaîne multi-lignes (notes chiffrées)
 */
export function sanitizeMultiline(input: unknown, maxLength = LIMITS.NOTES_MAX): string {
  if (typeof input !== 'string') return '';
  const clean = stripControlChars(input, true).trim();
  return clean.slice(0, maxLength);
}

/**
 * Validation stricte d'URL
 * N'autorise strictement que http: et https: (bloque javascript:, data:, file:, etc.)
 */
export function validateAndSanitizeUrl(input: unknown): {
  valid: boolean;
  url?: string;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return { valid: true, url: undefined };
  }

  const clean = stripControlChars(input, false).trim();
  if (!clean) {
    return { valid: true, url: undefined };
  }

  if (clean.length > LIMITS.URL_MAX) {
    return {
      valid: false,
      error: `L'URL dépasse la limite maximale autorisée (${LIMITS.URL_MAX} caractères).`,
    };
  }

  // Détection explicite des protocoles dangereux
  const lower = clean.toLowerCase();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'blob:', 'about:'];
  for (const proto of dangerousProtocols) {
    if (lower.startsWith(proto) || lower.includes(proto)) {
      return {
        valid: false,
        error: `Protocole d'URL non autorisé : ${proto} est interdit pour des raisons de sécurité.`,
      };
    }
  }

  try {
    let candidate = clean;
    // Si l'utilisateur n'a pas tapé de protocole (ex: github.com/login)
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = `https://${candidate}`;
    }

    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: "Seuls les protocoles 'http://' et 'https://' sont acceptés.",
      };
    }

    // Valider que le nom d'hôte est valide et non vide
    if (!parsed.hostname || parsed.hostname.length > 253) {
      return {
        valid: false,
        error: "Le nom d'hôte de l'URL est invalide.",
      };
    }

    return { valid: true, url: candidate };
  } catch {
    return {
      valid: false,
      error: "Format d'URL de connexion invalide.",
    };
  }
}

/**
 * Validation et normalisation d'une clé secrète TOTP (RFC 6238 / RFC 4648 Base32)
 */
export function validateAndSanitizeTotpSecret(input: unknown): {
  valid: boolean;
  secret?: string;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'La clé secrète TOTP est requise.' };
  }

  const clean = stripControlChars(input, false).replace(/[\s-]/g, '').toUpperCase();

  if (clean.length < LIMITS.TOTP_SECRET_MIN) {
    return {
      valid: false,
      error: `La clé secrète TOTP est trop courte (minimum ${LIMITS.TOTP_SECRET_MIN} caractères).`,
    };
  }

  if (clean.length > LIMITS.TOTP_SECRET_MAX) {
    return {
      valid: false,
      error: `La clé secrète TOTP est trop longue (maximum ${LIMITS.TOTP_SECRET_MAX} caractères).`,
    };
  }

  // Base32 charset : A-Z et 2-7, avec padding '=' optionnel
  const base32Regex = /^[A-Z2-7=]+$/;
  if (!base32Regex.test(clean)) {
    return {
      valid: false,
      error: 'La clé secrète doit être encodée en Base32 valide (lettres A-Z et chiffres 2-7 uniquement).',
    };
  }

  return { valid: true, secret: clean };
}

/**
 * Validation de mot de passe maître
 */
export function validateMasterPassword(
  input: unknown,
  isNew = false
): { valid: boolean; password?: string; error?: string } {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Mot de passe invalide.' };
  }

  // Vérifier la présence d'octets nuls
  if (input.includes('\0')) {
    return { valid: false, error: 'Le mot de passe contient des caractères interdits.' };
  }

  if (input.length > LIMITS.MASTER_PASSWORD_MAX) {
    return {
      valid: false,
      error: `Le mot de passe maître ne peut pas dépasser ${LIMITS.MASTER_PASSWORD_MAX} caractères.`,
    };
  }

  if (isNew && input.length < LIMITS.MASTER_PASSWORD_MIN) {
    return {
      valid: false,
      error: `Le mot de passe maître doit comporter au moins ${LIMITS.MASTER_PASSWORD_MIN} caractères.`,
    };
  }

  return { valid: true, password: input };
}

/**
 * Échappement sûr pour recherche textuelle (évite ReDoS si une regex est un jour utilisée)
 */
export function sanitizeSearchQuery(input: unknown): string {
  if (typeof input !== 'string') return '';
  return stripControlChars(input, false).trim().slice(0, LIMITS.SEARCH_QUERY_MAX);
}
