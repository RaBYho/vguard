import { useState } from 'react';
import {
  Star,
  Copy,
  Check,
  Eye,
  EyeOff,
  Globe,
  ExternalLink,
  Trash2,
  Edit2,
  Key,
} from 'lucide-react';
import type { PasswordEntry } from '../../../shared/types';
import { useVaultStore } from '../../stores/vault-store';
import { toast } from '../../stores/toast-store';

interface Props {
  entry: PasswordEntry;
}

export function PasswordCard({ entry }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);

  const toggleFavorite = useVaultStore((state) => state.toggleFavorite);
  const openEdit = useVaultStore((state) => state.openEditEntryModal);
  const requestDeleteEntry = useVaultStore((state) => state.requestDeleteEntry);
  const categories = useVaultStore((state) => state.categories);

  const category = categories.find((c) => c.id === entry.categoryId);

  const copyToClipboard = async (text: string, field: 'username' | 'password') => {
    if (!text) return;
    await window.vaultAPI.copyToClipboard(text);
    setCopiedField(field);
    toast.info(
      field === 'password'
        ? 'Mot de passe copié dans le presse-papier.'
        : 'Identifiant copié dans le presse-papier.'
    );
    setTimeout(() => setCopiedField(null), 2000);
  };

  const domain = entry.url
    ? entry.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : null;

  return (
    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] hover:border-[#06B6D4]/40 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm dark:shadow-md group min-h-[220px]">
      <div>
        {/* En-tête de la carte */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
              {domain ? <Globe className="w-5 h-5" /> : <Key className="w-5 h-5" />}
            </div>

            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2 truncate">
                <span className="truncate">{entry.title}</span>
                {category && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color || '#06B6D4' }}
                    title={category.name}
                  />
                )}
              </div>
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                {domain || entry.username || 'Identifiant'}
              </div>
            </div>
          </div>

          {/* Bouton Favori */}
          <button
            onClick={() => toggleFavorite(entry.id)}
            className={`transition cursor-pointer flex-shrink-0 p-1 rounded-lg ${
              entry.favorite
                ? 'text-[#F59E0B]'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400'
            }`}
            title={entry.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star className={`w-4 h-4 ${entry.favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bloc credentials sécurisé */}
        <div className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl px-4 py-3 space-y-2 transition-colors">
          {/* Identifiant */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 truncate">
              {entry.username || entry.email || '—'}
            </span>
            <button
              onClick={() => copyToClipboard(entry.username || entry.email || '', 'username')}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer flex-shrink-0 p-1"
              title="Copier identifiant"
            >
              {copiedField === 'username' ? (
                <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#10B981]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Mot de passe masqué */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-[#27272A]/50">
            <span className="text-xs font-mono text-zinc-900 dark:text-white tracking-widest truncate max-w-[170px]">
              {showPassword ? entry.password : '••••••••••••'}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer p-0.5"
                title={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => copyToClipboard(entry.password, 'password')}
                className="text-[#0891B2] dark:text-[#06B6D4] hover:opacity-80 transition cursor-pointer p-0.5"
                title="Copier le mot de passe"
              >
                {copiedField === 'password' ? (
                  <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#10B981]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer de la carte */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#27272A]/70 flex items-center justify-between text-xs">
        <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
          {domain ? 'Auto-remplissage' : 'Mot de passe'}
        </span>

        <div className="flex items-center gap-2">
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition"
              title="Ouvrir le site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={() => openEdit(entry)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition p-0.5"
            title="Modifier"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => requestDeleteEntry(entry)}
            className="text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 transition p-0.5 cursor-pointer"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
