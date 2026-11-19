import { useState, useEffect } from 'react';
import {
  X,
  Key,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  Link,
  Mail,
  Globe,
  AlertCircle,
  Save,
  QrCode,
  KeyRound,
  Sliders,
  Check,
} from 'lucide-react';
import * as OTPAuth from 'otpauth';
import type { VaultEntry, PasswordEntry, TOTPEntry } from '../../../shared/types';
import { useVaultStore } from '../../stores/vault-store';
import { toast } from '../../stores/toast-store';
import { formatErrorMessage } from '../../utils/format-error';

interface Props {
  entry: Partial<VaultEntry>;
  onClose: () => void;
}

export function EntryModal({ entry, onClose }: Props) {
  const isEditing = Boolean(entry.id);
  const activeTab = useVaultStore((state) => state.activeTab);

  // Déterminer le mode initial (si édition, verrouillé sur le type; si création, s'adapte à activeTab)
  const [activeType, setActiveType] = useState<'password' | 'totp'>(() => {
    if (entry.type) return entry.type;
    return activeTab === 'totp' ? 'totp' : 'password';
  });

  // États partagés
  const [title, setTitle] = useState(entry.title || '');
  const [categoryId, setCategoryId] = useState(entry.categoryId || '');
  const [notes, setNotes] = useState(entry.notes || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États spécifiques Mot de passe
  const pwEntry = entry as Partial<PasswordEntry>;
  const [username, setUsername] = useState(pwEntry.username || '');
  const [password, setPassword] = useState(pwEntry.password || '');
  const [email, setEmail] = useState(pwEntry.email || '');
  const [url, setUrl] = useState(pwEntry.url || '');
  const [showPassword, setShowPassword] = useState(false);

  // États spécifiques TOTP
  const totpEntry = entry as Partial<TOTPEntry>;
  const [issuer, setIssuer] = useState(totpEntry.issuer || entry.title || '');
  const [account, setAccount] = useState(totpEntry.account || pwEntry.email || pwEntry.username || '');
  const [secret, setSecret] = useState(totpEntry.secret || '');
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>(
    totpEntry.algorithm || 'SHA1'
  );
  const [digits, setDigits] = useState<6 | 8>(totpEntry.digits || 6);
  const [period, setPeriod] = useState<number>(totpEntry.period || 30);

  // Stores
  const saveEntry = useVaultStore((state) => state.saveEntry);
  const updateEntry = useVaultStore((state) => state.updateEntry);
  const categories = useVaultStore((state) => state.categories);
  const setGeneratorModalOpen = useVaultStore((state) => state.setGeneratorModalOpen);
  const setQRScannerOpen = useVaultStore((state) => state.setQRScannerOpen);

  // Décompte et calcul direct du code TOTP en temps réel
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [liveTOTPCode, setLiveTOTPCode] = useState<string | null>(null);

  useEffect(() => {
    if (activeType !== 'totp') return;

    const updateTOTP = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const rem = period - (nowSec % period);
      setRemainingSeconds(rem);

      const cleanSecret = secret.replace(/[\s-]/g, '').toUpperCase();
      if (!cleanSecret || cleanSecret.length < 8) {
        setLiveTOTPCode(null);
        return;
      }

      try {
        const totp = new OTPAuth.TOTP({
          issuer: issuer.trim() || 'VGuard',
          label: account.trim() || 'Account',
          algorithm,
          digits,
          period,
          secret: OTPAuth.Secret.fromBase32(cleanSecret),
        });
        const code = totp.generate();
        if (code && code.length >= 6) {
          // Formater par blocs de 3 chiffres : 482 910
          setLiveTOTPCode(code.slice(0, 3) + ' ' + code.slice(3));
        } else {
          setLiveTOTPCode(null);
        }
      } catch {
        setLiveTOTPCode(null);
      }
    };

    updateTOTP();
    const interval = setInterval(updateTOTP, 1000);
    return () => clearInterval(interval);
  }, [activeType, secret, algorithm, digits, period, issuer, account]);

  const handleSecretChange = async (val: string) => {
    if (val.trim().startsWith('otpauth://')) {
      try {
        const parsed = await window.vaultAPI.parseTOTPUri(val.trim());
        if (parsed.secret) setSecret(parsed.secret);
        if (parsed.issuer) setIssuer(parsed.issuer);
        if (parsed.account) setAccount(parsed.account);
        if (parsed.algorithm) setAlgorithm(parsed.algorithm);
        if (parsed.digits) setDigits(parsed.digits);
        if (parsed.period) setPeriod(parsed.period);
        if (parsed.title && !title) setTitle(parsed.title);
        return;
      } catch {
        // Fallback
      }
    }
    setSecret(val);
  };

  // Évaluation de la robustesse du mot de passe
  const getPasswordStrength = () => {
    if (!password) return { label: 'Vide', color: 'bg-zinc-300 dark:bg-zinc-700', width: 'w-0' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Faible', color: 'bg-red-500', width: 'w-1/4' };
    if (score === 2) return { label: 'Moyen', color: 'bg-amber-500', width: 'w-2/4' };
    if (score === 3) return { label: 'Robuste', color: 'bg-[#06B6D4]', width: 'w-3/4' };
    return { label: 'Optimal', color: 'bg-[#10B981]', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (activeType === 'password') {
        if (!title.trim()) {
          setError('Le titre ou nom du service est requis.');
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setError('Le mot de passe est requis.');
          setIsSubmitting(false);
          return;
        }

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
      } else {
        // Mode TOTP
        if (!title.trim() && !issuer.trim()) {
          setError("Le nom de l'émetteur ou le titre est requis.");
          setIsSubmitting(false);
          return;
        }
        if (!secret.trim()) {
          setError('La clé secrète TOTP est requise.');
          setIsSubmitting(false);
          return;
        }

        const cleanSecret = secret.replace(/[\s-]/g, '').toUpperCase();

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
            notes: notes.trim() || undefined,
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
            notes: notes.trim() || undefined,
            favorite: false,
          });
        }
      }
      if (isEditing) {
        toast.success('Modifications enregistrées avec succès.');
      } else if (activeType === 'password') {
        toast.success('Mot de passe créé avec succès.');
      } else {
        toast.success('Code 2FA ajouté avec succès.');
      }

      onClose();
    } catch (err: any) {
      setError(formatErrorMessage(err, "Erreur lors de l'enregistrement."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors animate-modal-pop">
        {/* Header Épuré */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-[#121215] transition-colors">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            {isEditing
              ? activeType === 'password'
                ? 'Modifier le mot de passe'
                : 'Modifier le code 2FA'
              : 'Nouvel élément'}
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
          {/* Segmented Control / Toggle Stitch (Désactivé en mode édition) */}
          {!isEditing ? (
            <div className="bg-zinc-100 dark:bg-[#18181B] p-1 rounded-xl border border-zinc-200 dark:border-[#27272A] flex gap-1 transition-colors">
              <button
                type="button"
                onClick={() => {
                  setActiveType('password');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeType === 'password'
                    ? 'bg-white dark:bg-[#27272A] text-zinc-900 dark:text-white shadow-sm font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#06B6D4]" />
                <span>Mot de passe</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveType('totp');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeType === 'totp'
                    ? 'bg-white dark:bg-[#27272A] text-zinc-900 dark:text-white shadow-sm font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#059669] dark:text-[#10B981]" />
                <span>Code 2FA</span>
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {activeType === 'password' ? (
                <>
                  <Key className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#06B6D4]" />
                  <span>Entrée Mot de passe</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-[#059669] dark:text-[#10B981]" />
                  <span>Clé TOTP 2FA</span>
                </>
              )}
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-3.5 pt-0.5">
            {/* Titre / Service */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">
                Titre / Service <span className="text-[#06B6D4]">*</span>
              </label>
              <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
                <Globe className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (activeType === 'totp' && !issuer) setIssuer(e.target.value);
                  }}
                  placeholder={activeType === 'password' ? 'ex: GitHub, Google, AWS' : 'ex: Google Workspace, GitHub'}
                  className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
                />
              </div>
            </div>

            {/* Identifiant ou email */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">
                {activeType === 'password' ? 'Identifiant ou email' : 'Identifiant ou compte associé'}
              </label>
              <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
                <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={activeType === 'password' ? (email || username) : account}
                  onChange={(e) => {
                    if (activeType === 'password') {
                      setEmail(e.target.value);
                      setUsername(e.target.value);
                    } else {
                      setAccount(e.target.value);
                    }
                  }}
                  placeholder="alex@domaine.com"
                  className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
                />
              </div>
            </div>

            {/* ═══ SECTION SPÉCIFIQUE MOT DE PASSE ═══ */}
            {activeType === 'password' && (
              <div key="pw-section" className="space-y-3.5 animate-fade-in">
                {/* URL de connexion */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">
                      URL de connexion
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] px-1.5 py-0.5 rounded">
                      Remplissage auto
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
                    <Link className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
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
                      onClick={() => setGeneratorModalOpen(true)}
                      className="flex items-center gap-1 text-[11px] font-mono text-[#0891B2] dark:text-[#06B6D4] hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Générer</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
                    <Key className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
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
                      title={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Minimalist Strength Bar Stitch */}
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex-1 h-1 bg-zinc-200 dark:bg-[#27272A] rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-300`} />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-medium">
                      {strength.label}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SECTION SPÉCIFIQUE CODE 2FA ═══ */}
            {activeType === 'totp' && (
              <div key="totp-section" className="space-y-3.5 animate-fade-in">
                {/* Clé secrète 2FA (Secret Key Base32) avec bouton Scanner QR */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">
                      Clé secrète (Secret Key) <span className="text-[#06B6D4]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setQRScannerOpen(true);
                      }}
                      className="flex items-center gap-1 text-[11px] font-mono text-[#0891B2] dark:text-[#06B6D4] hover:underline cursor-pointer"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Scanner QR</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-10 focus-within:border-[#06B6D4] transition">
                    <KeyRound className="w-4 h-4 text-[#059669] dark:text-[#10B981] shrink-0" />
                    <input
                      type="text"
                      required
                      value={secret}
                      onChange={(e) => handleSecretChange(e.target.value)}
                      placeholder="JBSWY3DPEHPK3PXP"
                      className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] font-mono outline-none w-full tracking-wider uppercase"
                    />
                  </div>
                </div>

                {/* Prévisualisation en direct du TOTP Stitch (Affiché UNIQUEMENT si le code est extrait) */}
                {liveTOTPCode && (
                  <div className="bg-zinc-50 dark:bg-[#18181B] border border-[#10B981]/30 rounded-xl p-3 flex items-center justify-between shadow-inner transition-colors animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Aperçu du code en direct
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                      </div>
                      <div className="text-xl font-mono font-bold text-[#059669] dark:text-[#10B981] tracking-widest tabular-nums mt-0.5">
                        {liveTOTPCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                        <svg className="w-9 h-9 transform -rotate-90">
                          <circle
                            cx="18"
                            cy="18"
                            fill="transparent"
                            r="14"
                            stroke="currentColor"
                            className="text-zinc-200 dark:text-[#27272A]"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            fill="transparent"
                            r="14"
                            stroke="#10B981"
                            strokeDasharray="88"
                            strokeDashoffset={88 - (88 * remainingSeconds) / period}
                            strokeLinecap="round"
                            strokeWidth="3"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-mono font-bold text-[#059669] dark:text-[#10B981]">
                          {remainingSeconds}s
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paramètres avancés / Algorithme TOTP modifiables */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-400">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span>Paramètres avancés TOTP</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                        Algorithme
                      </label>
                      <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value as any)}
                        className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-2.5 h-9 text-xs text-zinc-800 dark:text-zinc-200 outline-none font-mono focus:border-[#06B6D4] transition-colors cursor-pointer"
                      >
                        <option value="SHA1">SHA-1</option>
                        <option value="SHA256">SHA-256</option>
                        <option value="SHA512">SHA-512</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                        Chiffres
                      </label>
                      <select
                        value={digits}
                        onChange={(e) => setDigits(Number(e.target.value) as 6 | 8)}
                        className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-2.5 h-9 text-xs text-zinc-800 dark:text-zinc-200 outline-none font-mono focus:border-[#06B6D4] transition-colors cursor-pointer"
                      >
                        <option value={6}>6 chiffres</option>
                        <option value={8}>8 chiffres</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                        Période
                      </label>
                      <select
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-2.5 h-9 text-xs text-zinc-800 dark:text-zinc-200 outline-none font-mono focus:border-[#06B6D4] transition-colors cursor-pointer"
                      >
                        <option value={30}>30s (Std)</option>
                        <option value={60}>60s</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes chiffrées (Disponibles pour Mot de passe & TOTP) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">
                  Notes chiffrées
                </label>
                <span className="text-[10px] font-mono text-[#059669] dark:text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30 px-1.5 py-0.5 rounded font-medium">
                  Chiffré E2EE
                </span>
              </div>
              <div className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl p-2.5 focus-within:border-[#06B6D4] transition">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes privées, codes de secours ou questions de sécurité..."
                  rows={2}
                  className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans resize-none custom-scrollbar"
                />
              </div>
            </div>

            {/* Catégories Pills Stitch */}
            <div className="pt-0.5">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">
                Catégorie
              </label>
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
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="px-0 pt-3 border-t border-zinc-200 dark:border-[#27272A] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="brand-gradient hover:opacity-95 text-[#09090B] font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-md shadow-[#06B6D4]/15 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isEditing
                  ? 'Mettre à jour'
                  : activeType === 'password'
                  ? 'Enregistrer'
                  : 'Enregistrer le 2FA'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
