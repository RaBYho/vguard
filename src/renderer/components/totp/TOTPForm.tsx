import { useState } from 'react';
import {
  X,
  Clock,
  QrCode,
  AlertCircle,
  Save,
  Tag,
  KeyRound,
} from 'lucide-react';
import type { TOTPEntry } from '../../../shared/types';
import { useVaultStore } from '../../stores/vault-store';

interface Props {
  entry: Partial<TOTPEntry>;
  onClose: () => void;
}

export function TOTPForm({ entry, onClose }: Props) {
  const isEditing = Boolean(entry.id);

  const [title, setTitle] = useState(entry.title || '');
  const [issuer, setIssuer] = useState(entry.issuer || '');
  const [account, setAccount] = useState(entry.account || '');
  const [secret, setSecret] = useState(entry.secret || '');
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>(
    entry.algorithm || 'SHA1'
  );
  const [digits, setDigits] = useState<6 | 8>(entry.digits || 6);
  const [period, setPeriod] = useState<number>(entry.period || 30);
  const [categoryId, setCategoryId] = useState(entry.categoryId || '');
  const [error, setError] = useState('');

  const saveEntry = useVaultStore((state) => state.saveEntry);
  const updateEntry = useVaultStore((state) => state.updateEntry);
  const categories = useVaultStore((state) => state.categories);
  const setQRScannerOpen = useVaultStore((state) => state.setQRScannerOpen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !issuer.trim()) {
      setError("Le nom de l'émetteur ou le titre est requis.");
      return;
    }
    if (!secret.trim()) {
      setError('La clé secrète TOTP est requise.');
      return;
    }

    // Nettoyer la clé secrète (retirer les espaces et tirets)
    const cleanSecret = secret.replace(/[\s-]/g, '').toUpperCase();

    try {
      if (isEditing && entry.id) {
        await updateEntry(entry.id, {
          title: title.trim() || issuer.trim(),
          issuer: issuer.trim() || title.trim(),
          account: account.trim(),
          secret: cleanSecret,
          algorithm,
          digits,
          period,
          categoryId: categoryId || categories[0]?.id || '',
        });
      } else {
        await saveEntry({
          type: 'totp',
          title: title.trim() || issuer.trim(),
          issuer: issuer.trim() || title.trim(),
          account: account.trim(),
          secret: cleanSecret,
          algorithm,
          digits,
          period,
          categoryId: categoryId || categories[0]?.id || '',
          favorite: false,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement du compte 2FA.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* En-tête Modal */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-[#121215] transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              {isEditing ? 'Modifier la clé 2FA' : 'Ajouter un compte 2FA (TOTP)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Raccourci Scanner QR */}
          {!isEditing && (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-[#0891B2] dark:text-[#06B6D4]" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Vous avez un QR Code ?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setQRScannerOpen(true);
                }}
                className="text-xs font-mono text-[#0891B2] dark:text-[#06B6D4] hover:underline cursor-pointer"
              >
                Ouvrir le scanner
              </button>
            </div>
          )}

          {/* Émetteur / Service */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">
              Service / Émetteur <span className="text-[#06B6D4]">*</span>
            </label>
            <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
              <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                required
                value={issuer}
                onChange={(e) => {
                  setIssuer(e.target.value);
                  if (!title) setTitle(e.target.value);
                }}
                placeholder="ex: GitHub, Google, Discord"
                className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
              />
            </div>
          </div>

          {/* Compte / Email */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">
              Nom du compte / Email
            </label>
            <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
              <Tag className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="alex@domaine.com ou pseudo"
                className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
              />
            </div>
          </div>

          {/* Clé secrète Base32 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">
                Clé secrète (Base32) <span className="text-[#06B6D4]">*</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-500">A-Z, 2-7</span>
            </div>
            <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
              <KeyRound className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                required
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="JBSWY3DPEHPK3PXP"
                className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-mono uppercase tracking-wider"
              />
            </div>
          </div>

          {/* Paramètres avancés TOTP */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-400 mb-1">Chiffres</label>
              <select
                value={digits}
                onChange={(e) => setDigits(Number(e.target.value) as 6 | 8)}
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-2 h-9 text-xs text-zinc-800 dark:text-zinc-300 outline-none font-mono"
              >
                <option value={6}>6 chiffres</option>
                <option value={8}>8 chiffres</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-400 mb-1">Période</label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-2 h-9 text-xs text-zinc-800 dark:text-zinc-300 outline-none font-mono"
              >
                <option value={30}>30s (Std)</option>
                <option value={60}>60s</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-400 mb-1">Algo</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as any)}
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-2 h-9 text-xs text-zinc-800 dark:text-zinc-300 outline-none font-mono"
              >
                <option value="SHA1">SHA-1</option>
                <option value="SHA256">SHA-256</option>
                <option value="SHA512">SHA-512</option>
              </select>
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
                        ? 'bg-[#10B981]/15 border border-[#10B981]/30 text-[#059669] dark:text-[#10B981]'
                        : 'bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: c.color || '#10B981' }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
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
              className="px-4 py-2 rounded-xl brand-gradient hover:opacity-90 text-[#09090B] text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-md shadow-[#10B981]/10"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Mettre à jour' : 'Enregistrer le 2FA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
