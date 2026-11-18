import { useState } from 'react';
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Star,
  Edit2,
  Trash2,
  Globe,
} from 'lucide-react';
import type { PasswordEntry } from '../../../shared/types';
import { useVaultStore } from '../../stores/vault-store';

interface Props {
  entry: PasswordEntry;
}

export function PasswordCard({ entry }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);

  const toggleFavorite = useVaultStore((state) => state.toggleFavorite);
  const openEdit = useVaultStore((state) => state.openEditEntryModal);
  const deleteEntry = useVaultStore((state) => state.deleteEntry);
  const categories = useVaultStore((state) => state.categories);

  const category = categories.find((c) => c.id === entry.categoryId);

  const copyToClipboard = async (text: string, field: 'username' | 'password') => {
    if (!text) return;
    await window.vaultAPI.copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const domain = entry.url
    ? entry.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/30 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Title & Icon */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
            {domain ? <Globe className="w-5 h-5" /> : <Key className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate flex items-center gap-2">
              <span>{entry.title}</span>
              {category && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                  title={category.name}
                />
              )}
            </h3>
            {domain && (
              <a
                href={entry.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 transition truncate"
              >
                <span>{domain}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
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
              if (confirm(`Supprimer définitivement "${entry.title}" ?`)) {
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

      {/* Credentials details */}
      <div className="space-y-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
        {/* Username */}
        <div className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-xl">
          <span className="text-slate-400 select-none">Identifiant :</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-200 truncate max-w-[180px]">
              {entry.username || entry.email || '—'}
            </span>
            <button
              onClick={() => copyToClipboard(entry.username || entry.email || '', 'username')}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Copier l'identifiant"
            >
              {copiedField === 'username' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-xl">
          <span className="text-slate-400 select-none">Mot de passe :</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-200 tracking-wider">
              {showPassword ? entry.password : '••••••••••••'}
            </span>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-slate-400 hover:text-white transition"
              title={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(entry.password, 'password')}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Copier le mot de passe"
            >
              {copiedField === 'password' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
