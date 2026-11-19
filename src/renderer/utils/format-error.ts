/**
 * Nettoie et formate les messages d'erreur techniques (notamment les préfixes IPC Electron)
 * pour afficher des messages clairs, conviviaux et professionnels à l'utilisateur.
 */
export function formatErrorMessage(error: unknown, fallback = 'Une erreur inattendue est survenue.'): string {
  if (!error) return fallback;

  let msg = typeof error === 'string' ? error : (error as any)?.message || String(error);

  // Supprime récursivement les préfixes techniques d'Electron IPC
  // Exemple: "Error occurred in handler for 'vault:unlock': Error: Mot de passe maître incorrect."
  msg = msg.replace(/^Error:\s*/i, '');
  msg = msg.replace(/Error occurred in handler for '[^']+':\s*(Error:\s*)?/gi, '');
  msg = msg.replace(/^Error:\s*/i, '');
  msg = msg.trim();

  // Détections et normalisations spécifiques en français
  if (
    /mot de passe.*incorrect/i.test(msg) ||
    /invalid.*password/i.test(msg) ||
    /authentification.*(échouée|invalide)/i.test(msg) ||
    /argon2.*failed/i.test(msg)
  ) {
    return 'Mot de passe incorrect.';
  }

  if (/mot de passe.*(au moins 8|trop court)/i.test(msg)) {
    return 'Le mot de passe maître doit comporter au moins 8 caractères.';
  }

  if (/coffre.*(verrouill|absent|introuvable)/i.test(msg)) {
    return 'Le coffre-fort est actuellement verrouillé.';
  }

  if (/fichier.*introuvable|no such file/i.test(msg)) {
    return 'Fichier de données introuvable.';
  }

  if (/intégrité.*altérée|auth tag mismatch|bad auth/i.test(msg)) {
    return 'Intégrité du coffre compromise ou mot de passe erroné.';
  }

  return msg || fallback;
}
