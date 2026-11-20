import { useState } from 'react';
import {
  X,
  Key,
  Sparkles,
  Eye,
  EyeOff,
  Link,
  Mail,
  Globe,
  AlertCircle,
  Save,
} from 'lucide-react';
import type { PasswordEntry } from '../../../shared/types';
import { useVaultStore } from '../../stores/vault-store';

interface Props {
  entry: Partial<PasswordEntry>;
  onClose: () => void;
}

export function PasswordForm({ entry, onClose }: Props) {
  const isEditing = Boolean(entry.id);

  const [title, setTitle] = useState(entry.title || '');
  const [username, setUsername] = useState(entry.username || '');
  const [password, setPassword] = useState(entry.password || '');
  const [email, setEmail] = useState(entry.email || '');
  const [url, setUrl] = useState(entry.url || '');
  const [categoryId, setCategoryId] = useState(entry.categoryId || '');
  const [notes, setNotes] = useState(entry.notes || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const saveEntry = useVaultStore((state) => state.saveEntry);
  const updateEntry = useVaultStore((state) => state.updateEntry);
  const categories = useVaultStore((state) => state.categories);
  const openPasswordGenerator = useVaultStore((state) => state.openPasswordGenerator);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Le titre est requis.');
      return;
    }
    if (!password) {
      setError('Le mot de passe est requis.');
      return;
    }

    try {
      if (isEditing && entry.id) {
        await updateEntry(entry.id, {
          title: title.trim(),
          username: username.trim(),
          password,
          email: email.trim() || undefined,
          url: url.trim() || undefined,
          categoryId: categoryId || categories[0]?.id || '',
          notes: notes.trim() || undefined,
        });
      } else {
        await saveEntry({
          type: 'password',
          title: title.trim(),
          username: username.trim(),
          password,
          email: email.trim() || undefined,
          url: url.trim() || undefined,
          categoryId: categoryId || categories[0]?.id || '',
          notes: notes.trim() || undefined,
          favorite: false,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* En-tête Modal */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-[#121215] transition-colors">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            {isEditing ? 'Modifier le mot de passe' : 'Nouveau mot de passe'}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps du Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Titre / Service */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">
              Titre / Service <span className="text-[#06B6D4]">*</span>
            </label>
            <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
              <Globe className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: GitHub, Google, Netflix"
                className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
              />
            </div>
          </div>

          {/* Identifiant */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">
              Identifiant ou nom d'utilisateur
            </label>
            <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
              <Key className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_dev"
                className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">
              Adresse e-mail liée
            </label>
            <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
              <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@domaine.com"
                className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
              />
            </div>
          </div>

          {/* URL du site web */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">URL du site</label>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] px-1.5 py-0.5 rounded">
                Auto-remplissage
              </span>
            </div>
            <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
              <Link className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/login"
                className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">
                Mot de passe <span className="text-[#06B6D4]">*</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  openPasswordGenerator((newPw) => {
                    setPassword(newPw);
                  })
                }
                className="flex items-center gap-1 text-[11px] font-mono text-[#0891B2] dark:text-[#06B6D4] hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Générer</span>
              </button>
            </div>
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
              <Key className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] font-mono outline-none w-full tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const isSelected = (categoryId || categories[0]?.id) === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#0891B2] dark:text-[#06B6D4]'
                        : 'bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: c.color || '#06B6D4' }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes chiffrées */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">Notes chiffrées</label>
              <span className="text-[10px] font-mono text-[#059669] dark:text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30 px-1.5 py-0.5 rounded font-medium">
                Chiffré E2EE
              </span>
            </div>
            <div className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl p-2.5 focus-within:border-[#06B6D4] transition">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes privées, codes de secours..."
                rows={3}
                className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans resize-none custom-scrollbar"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Boutons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-zinc-200 dark:border-[#27272A]/70">
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl brand-gradient hover:opacity-90 text-[#09090B] text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-md shadow-[#06B6D4]/10"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Mettre à jour' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
