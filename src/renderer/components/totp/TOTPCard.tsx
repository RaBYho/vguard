import { useState } from 'react';
import { Copy, Check, Star, Edit2, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { TOTPEntry } from '../../../shared/types';
import { useVaultStore } from '../../stores/vault-store';

interface Props {
  entry: TOTPEntry;
}

export function TOTPCard({ entry }: Props) {
  const [copied, setCopied] = useState(false);

  const totpCodes = useVaultStore((state) => state.totpCodes);
  const toggleFavorite = useVaultStore((state) => state.toggleFavorite);
  const openEdit = useVaultStore((state) => state.openEditEntryModal);
  const deleteEntry = useVaultStore((state) => state.deleteEntry);
  const categories = useVaultStore((state) => state.categories);

  const category = categories.find((c) => c.id === entry.categoryId);
  const codeData = totpCodes[entry.id];

  const code = codeData?.code || '------';
  const remaining = codeData?.remainingSeconds ?? (entry.period || 30);
  const period = entry.period || 30;

  const progress = Math.max(0, Math.min(100, (remaining / period) * 100));
  const isExpiring = remaining <= 5;

  // Format code (e.g. "123 456")
  const formattedCode =
    code.length === 6
      ? `${code.slice(0, 3)} ${code.slice(3)}`
      : code.length === 8
      ? `${code.slice(0, 4)} ${code.slice(4)}`
      : code;

  const handleCopy = async () => {
    if (!code || code === '------') return;
    await window.vaultAPI.copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/30 group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-sm">
            {entry.issuer ? entry.issuer.slice(0, 2).toUpperCase() : '2F'}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate flex items-center gap-2">
              <span>{entry.title || entry.issuer}</span>
              {category && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                  title={category.name}
                />
              )}
            </h3>
            <p className="text-xs text-slate-400 truncate">{entry.account}</p>
          </div>
        </div>

        {/* Favorite & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => toggleFavorite(entry.id)}
            className={`p-1.5 rounded-lg transition ${
              entry.favorite
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
            title={entry.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={() => openEdit(entry)}
            className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Supprimer le code 2FA pour "${entry.title || entry.issuer}" ?`)) {
                deleteEntry(entry.id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code Display + Circular Timer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="cursor-pointer group/code" onClick={handleCopy} title="Cliquez pour copier">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            Code temporaire (TOTP)
          </span>
          <span
            className={`text-2xl font-mono font-bold tracking-widest transition-colors ${
              isExpiring ? 'text-red-400 animate-pulse' : 'text-indigo-300 group-hover/code:text-white'
            }`}
          >
            {formattedCode}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Circular Countdown Progress */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#1e293b"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={isExpiring ? '#ef4444' : '#6366f1'}
                strokeWidth="3"
                strokeDasharray="94.2"
                strokeDashoffset={94.2 * (1 - progress / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span
              className={`absolute text-xs font-mono font-bold ${
                isExpiring ? 'text-red-400' : 'text-slate-300'
              }`}
            >
              {remaining}
            </span>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ${
              copied
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
