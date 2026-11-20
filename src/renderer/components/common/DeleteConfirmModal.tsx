import { useState } from 'react';
import { AlertTriangle, Key, Clock, Info, X, Trash2 } from 'lucide-react';
import type { VaultEntry, PasswordEntry, TOTPEntry } from '../../../shared/types';

interface DeleteConfirmModalProps {
  entry: VaultEntry;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  entry,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const isPassword = entry.type === 'password';
  const pw = entry as PasswordEntry;
  const totp = entry as TOTPEntry;

  const subtitle = isPassword
    ? pw.username || pw.email || pw.url || 'Aucun identifiant associé'
    : totp.account || totp.issuer || 'Aucun compte associé';

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm select-none animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#101014] border border-zinc-200 dark:border-[#27272A]/80 rounded-2xl shadow-2xl dark:shadow-black/90 overflow-hidden flex flex-col animate-modal-pop transition-colors">
        {/* Halo d'ambiance d'avertissement */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* En-tête Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-[#27272A]/60 bg-zinc-50 dark:bg-[#141418]/80 relative z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3
              id="delete-modal-title"
              className="text-base font-bold text-zinc-900 dark:text-white tracking-tight"
            >
              Supprimer cet élément ?
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-200/60 dark:bg-zinc-800/60 rounded border border-zinc-300/60 dark:border-zinc-700/60 select-none">
              Esc
            </kbd>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A]/60 text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Fermer (Échap)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4 relative z-10">
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Êtes-vous sûr de vouloir supprimer définitivement l'élément{' '}
            <strong className="text-zinc-900 dark:text-white font-semibold">
              « {entry.title} »
            </strong>{' '}
            ? Cette action est irréversible et effacera également les données et clés associées du coffre-fort local.
          </p>

          {/* Carte d'aperçu de l'élément à supprimer */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181B]/80 border border-zinc-200 dark:border-[#27272A]/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-[#202025] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center shrink-0 text-[#0891B2] dark:text-[#06B6D4]">
                {isPassword ? (
                  <Key className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                  {entry.title}
                </span>
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                  {subtitle}
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-100 dark:bg-[#27272A] border border-zinc-200 dark:border-[#3F3F46] text-zinc-600 dark:text-zinc-300 shrink-0">
              {isPassword ? 'Mot de passe' : 'Clé 2FA'}
            </span>
          </div>

          {/* Note d'information */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A]/40 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              Les copies chiffrées dans les sauvegardes antérieures (exports) ne seront pas affectées.
            </p>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-[#27272A]/60 bg-zinc-50 dark:bg-[#141418]/90 relative z-10 transition-colors">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A]/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition cursor-pointer"
          >
            <span>Annuler</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-200/60 dark:bg-zinc-800/60 rounded border border-zinc-300/60 dark:border-zinc-700/60">
              Esc
            </kbd>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs border border-rose-500/50 shadow-lg shadow-rose-950/40 flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
            )}
            <span>{isDeleting ? 'Suppression...' : 'Supprimer définitivement'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
