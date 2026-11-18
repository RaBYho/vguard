import { useState } from 'react';
import { X, Clock, QrCode, Save, AlertCircle } from 'lucide-react';
import type { TOTPEntry } from '../../../shared/types';
import { useVaultStore } from '../../stores/vault-store';

interface Props {
  initialData?: Partial<TOTPEntry>;
  onClose: () => void;
  onOpenScanner?: () => void;
}

export function TOTPForm({ initialData, onClose, onOpenScanner }: Props) {
  const isEditing = Boolean(initialData?.id);
  const saveEntry = useVaultStore((state) => state.saveEntry);
  const updateEntry = useVaultStore((state) => state.updateEntry);
  const categories = useVaultStore((state) => state.categories);

  const [title, setTitle] = useState(initialData?.title || '');
  const [issuer, setIssuer] = useState(initialData?.issuer || '');
  const [account, setAccount] = useState(initialData?.account || '');
  const [secret, setSecret] = useState(initialData?.secret || '');
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>(
    initialData?.algorithm || 'SHA1'
  );
  const [digits, setDigits] = useState<6 | 8>(initialData?.digits || 6);
  const [period, setPeriod] = useState<number>(initialData?.period || 30);
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId || categories[0]?.id || ''
  );
  const [favorite, setFavorite] = useState(initialData?.favorite || false);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [pasteUri, setPasteUri] = useState('');
  const [error, setError] = useState('');

  const handleParseUri = async (uri: string) => {
    if (!uri.trim()) return;
    try {
      setError('');
      const parsed = await window.vaultAPI.parseTOTPUri(uri.trim());
      setIssuer(parsed.issuer);
      setAccount(parsed.account);
      setSecret(parsed.secret);
      setTitle(parsed.title);
      setAlgorithm(parsed.algorithm);
      setDigits(parsed.digits);
      setPeriod(parsed.period);
      setPasteUri('');
    } catch (e: any) {
      setError("Format d'URI otpauth invalide. Exemple: otpauth://totp/GitHub:user?secret=JBSWY3DPEHPK3PXP");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim() || !account.trim()) {
      setError("L'identifiant de compte et la clé secrète Base32 sont obligatoires.");
      return;
    }

    try {
      if (isEditing && initialData?.id) {
        await updateEntry(initialData.id, {
          title: title || issuer || account,
          issuer: issuer || title,
          account,
          secret: secret.trim(),
          algorithm,
          digits,
          period,
          categoryId,
          favorite,
          notes,
        });
      } else {
        await saveEntry({
          type: 'totp',
          title: title || issuer || account,
          issuer: issuer || title,
          account,
          secret: secret.trim(),
          algorithm,
          digits,
          period,
          categoryId,
          favorite,
          notes,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white">
              {isEditing ? 'Modifier le compte 2FA' : 'Ajouter un compte 2FA (TOTP)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Quick paste otpauth URI or scan QR */}
          {!isEditing && (
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Importation rapide (QR Code ou URL)
                </span>
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-medium transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scanner QR</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pasteUri}
                  onChange={(e) => setPasteUri(e.target.value)}
                  placeholder="Collez une URI otpauth://totp/..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleParseUri(pasteUri)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-medium transition"
                >
                  Extraire
                </button>
              </div>
            </div>
          )}

          {/* Issuer & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Fournisseur / Service <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="Ex: Google, GitHub, Discord..."
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Compte / Email <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Ex: hoby@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Clé secrète Base32 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value.toUpperCase())}
              placeholder="Ex: JBSWY3DPEHPK3PXP"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>

          {/* Advanced TOTP settings (Digits, Period, Algorithm) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Chiffres
              </label>
              <select
                value={digits}
                onChange={(e) => setDigits(Number(e.target.value) as 6 | 8)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value={6}>6 chiffres (Standard)</option>
                <option value={8}>8 chiffres</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Période
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value={30}>30 secondes</option>
                <option value={60}>60 secondes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Algorithme
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="SHA1">SHA-1</option>
                <option value="SHA256">SHA-256</option>
                <option value="SHA512">SHA-512</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Catégorie
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Mettre à jour' : 'Enregistrer le 2FA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
