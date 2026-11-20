import { useState } from 'react';
import {
  Star,
  Copy,
  Check,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { TOTPEntry } from '../../../shared/types';
import { useVaultStore } from '../../stores/vault-store';
import { toast } from '../../stores/toast-store';

interface Props {
  entry: TOTPEntry;
}

export function TOTPCard({ entry }: Props) {
  const [copied, setCopied] = useState(false);

  const totpCodes = useVaultStore((state) => state.totpCodes);
  const toggleFavorite = useVaultStore((state) => state.toggleFavorite);
  const openEdit = useVaultStore((state) => state.openEditEntryModal);
  const requestDeleteEntry = useVaultStore((state) => state.requestDeleteEntry);
  const categories = useVaultStore((state) => state.categories);

  const category = categories.find((c) => c.id === entry.categoryId);
  const codeData = totpCodes[entry.id];
  const code = codeData?.code || '------';
  const remainingSeconds = codeData?.remainingSeconds ?? 30;
  const period = codeData?.period ?? 30;

  // Calcul du cercle SVG de progression
  const radius = 18;
  const circumference = 2 * Math.PI * radius; // ~113.1
  const strokeDashoffset = circumference - (remainingSeconds / period) * circumference;

  // Couleurs dynamiques selon urgence (< 5s = rouge critique, < 10s = orange, sinon émeraude)
  const isExpiring = remainingSeconds <= 5;
  const isWarning = remainingSeconds > 5 && remainingSeconds <= 10;
  const timerColor = isExpiring ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';

  // Formatage aéré du code 6 chiffres : "123 456"
  const formattedCode =
    code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

  // Nom d'affichage robuste (priorise le titre si l'émetteur est manquant ou tronqué à 1 caractère)
  const displayName =
    entry.issuer && entry.issuer.trim().length === 1 && entry.title && entry.title.trim().length > 1
      ? entry.title.trim()
      : entry.issuer?.trim() || entry.title?.trim() || 'Compte 2FA';

  const copyCode = async () => {
    if (!code || code === '------') return;
    await window.vaultAPI.copyToClipboard(code);
    setCopied(true);
    toast.info(`Code 2FA pour ${displayName} copié !`);
    setTimeout(() => setCopied(false), 2000);
  };

  const initial = (displayName || '2F').slice(0, 2).toUpperCase();

  return (
    <div
      className={`bg-white dark:bg-[#121215] border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm dark:shadow-md group min-h-[220px] relative overflow-hidden ${
        isExpiring
          ? 'border-[#EF4444]/40 hover:border-[#EF4444]'
          : 'border-zinc-200 dark:border-[#27272A] hover:border-[#06B6D4]/40'
      }`}
    >
      {isExpiring && (
        <div className="absolute inset-0 bg-[#EF4444]/5 pointer-events-none" />
      )}

      <div className="relative z-10">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${
                isExpiring
                  ? 'bg-red-500/10 dark:bg-[#EF4444]/15 border-red-500/20 dark:border-[#EF4444]/30 text-red-600 dark:text-[#EF4444]'
                  : 'bg-zinc-100 dark:bg-[#18181B] border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white'
              }`}
            >
              {initial}
            </div>

            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2 truncate">
                <span className="truncate">{displayName}</span>
                {category && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color || '#10B981' }}
                    title={category.name}
                  />
                )}
              </div>
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                {entry.account || (entry.issuer && entry.issuer !== displayName ? entry.issuer : 'Code 2FA')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isExpiring && (
              <span className="text-[10px] font-mono uppercase bg-red-500/10 dark:bg-[#EF4444]/20 text-red-600 dark:text-[#EF4444] border border-red-500/20 dark:border-[#EF4444]/30 px-2 py-0.5 rounded font-bold animate-pulse">
                Expire
              </span>
            )}
            <button
              onClick={() => toggleFavorite(entry.id)}
              className={`transition cursor-pointer p-1 rounded-lg ${
                entry.favorite
                  ? 'text-[#F59E0B]'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400'
              }`}
              title={entry.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Star className={`w-4 h-4 ${entry.favorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bloc d'affichage du Code TOTP + Anneau SVG 30s Stitch */}
        <div
          className={`bg-zinc-50 dark:bg-[#18181B] border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${
            isExpiring ? 'border-red-500/30 dark:border-[#EF4444]/30' : 'border-zinc-200 dark:border-[#27272A]'
          }`}
        >
          <div>
            <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Code TOTP
            </div>
            <div
              className={`text-2xl font-mono font-bold tracking-widest tabular-nums mt-0.5 ${
                isExpiring
                  ? 'text-red-600 dark:text-[#EF4444] animate-pulse'
                  : 'text-[#059669] dark:text-[#10B981]'
              }`}
            >
              {formattedCode}
            </div>
          </div>

          {/* Anneau SVG Stitch */}
          <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
            <svg className="w-11 h-11 transform -rotate-90">
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="transparent"
                className="stroke-zinc-200 dark:stroke-[#27272A]"
                strokeWidth="3.5"
              />
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="transparent"
                stroke={timerColor}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span
              className="absolute text-[11px] font-mono font-bold"
              style={{ color: timerColor }}
            >
              {remainingSeconds < 10 ? `0${remainingSeconds}s` : `${remainingSeconds}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer de la carte */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#27272A]/70 flex items-center justify-between text-xs relative z-10">
        <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">2FA TOTP</span>

        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className={`flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg border cursor-pointer transition ${
              isExpiring
                ? 'text-red-600 dark:text-[#EF4444] hover:bg-red-500/10 dark:hover:bg-[#EF4444]/20 bg-red-500/5 dark:bg-[#EF4444]/15 border-red-500/20 dark:border-[#EF4444]/30'
                : 'text-[#0891B2] dark:text-[#06B6D4] hover:bg-[#06B6D4]/10 bg-[#06B6D4]/5 dark:bg-[#06B6D4]/10 border-[#06B6D4]/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>

          <button
            onClick={() => openEdit(entry)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition p-1"
            title="Modifier"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => requestDeleteEntry(entry)}
            className="text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 transition p-1 cursor-pointer"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
