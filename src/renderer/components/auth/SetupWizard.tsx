import { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  User,
  Mail,
  Check,
} from 'lucide-react';
import { useVaultStore } from '../../stores/vault-store';
import { ThemeToggle } from '../common/ThemeToggle';
import { formatErrorMessage } from '../../utils/format-error';
import { toast } from '../../stores/toast-store';
import {
  LIMITS,
  validateMasterPassword,
  sanitizeSingleLine,
} from '../../../shared/validation';

export function SetupWizard() {
  const [userName, setUserName] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createVault = useVaultStore((state) => state.createVault);
  const updateSettings = useVaultStore((state) => state.updateSettings);

  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Très faible', color: 'bg-red-500', width: 'w-1/5' };
    if (score === 2) return { label: 'Faible', color: 'bg-orange-500', width: 'w-2/5' };
    if (score === 3) return { label: 'Moyen', color: 'bg-amber-500', width: 'w-3/5' };
    if (score === 4) return { label: 'Fort', color: 'bg-[#10B981]', width: 'w-4/5' };
    return { label: 'Optimal', color: 'bg-[#10B981]', width: 'w-full' };
  };

  const strength = getPasswordStrength();
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { valid, error: pwError } = validateMasterPassword(password, true);
    if (!valid) {
      setError(pwError || 'Le mot de passe maître doit comporter au moins 8 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      await createVault(password);

      const cleanUserName = sanitizeSingleLine(userName, LIMITS.USER_NAME_MAX);
      const cleanEmail = sanitizeSingleLine(recoveryEmail, LIMITS.RECOVERY_EMAIL_MAX);

      if (cleanUserName || cleanEmail) {
        try {
          if (cleanUserName && typeof localStorage !== 'undefined') {
            localStorage.setItem('vguard-user-name', cleanUserName);
          }
          if (cleanEmail && typeof localStorage !== 'undefined') {
            localStorage.setItem('vguard-user-email', cleanEmail);
          }
          await updateSettings({
            userName: cleanUserName || undefined,
            recoveryEmail: cleanEmail || undefined,
          });
        } catch (e) {
          console.warn('Could not save user profile preferences', e);
        }
      }
      toast.success('Coffre-fort créé et configuré avec succès !');
    } catch (err: any) {
      setError(formatErrorMessage(err, 'Erreur lors de la création du coffre-fort.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full min-h-screen font-sans antialiased bg-[#F4F4F6] dark:bg-[#09090B] text-zinc-900 dark:text-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none relative overflow-x-hidden transition-colors">
      {/* Halos ambiants */}
      <div aria-hidden="true" className="bg-mesh-halo"></div>

      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <main className="relative z-10 w-full max-w-[1040px] bg-white dark:bg-[#121215]/90 backdrop-blur-2xl border border-zinc-200 dark:border-[#27272A]/80 rounded-[28px] shadow-xl dark:shadow-[0_32px_80px_rgba(0,0,0,0.85)] overflow-hidden transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Colonne gauche (Branding & Statut épuré) */}
          <section className="lg:col-span-5 p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-[#27272A]/60 bg-zinc-50/80 dark:bg-[#0E0E11]/40 transition-colors">
            {/* Centre : Grand Bouclier VGuard & Titre */}
            <div className="my-auto space-y-6">
              <div className="w-16 h-16 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[#06B6D4]/25 rounded-2xl blur-xl"></div>
                <img
                  src="./icons/vguard-icon.svg"
                  alt="VGuard Bouclier"
                  className="w-16 h-16 relative z-10 shrink-0 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)] select-none"
                />
              </div>

              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#0891B2] dark:text-[#06B6D4] text-[11px] font-mono font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse"></span>
                  Setup initial
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                  Créez votre coffre-fort chiffré
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-[#A1A1AA] leading-relaxed">
                  Votre mot de passe maître dérive une clé cryptographique unique. Aucune donnée n'est envoyée sur des serveurs distants.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-[#27272A]/60">
                <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-[#D4D4D8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                  <span>Chiffrement authentifié AES-256-GCM</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-[#D4D4D8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span>
                  <span>Dérivation de clé ultra-robuste Argon2id</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-[#D4D4D8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                  <span>Zéro-connaissance & 100% hors ligne</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-[#27272A]/40 text-[11px] font-mono text-zinc-500 dark:text-[#71717A]">
              VGuard Security Engine v1.0 • Local Vault
            </div>
          </section>

          {/* Colonne droite (Formulaire centré) */}
          <section className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            <div className="my-auto w-full max-w-lg mx-auto">
              <form onSubmit={handleCreate} className="space-y-5">
                {/* Profil utilisateur (Nom & Email) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Nom d'utilisateur <span className="text-zinc-400 font-normal">(optionnel)</span>
                    </label>
                    <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-11 focus-within:border-[#06B6D4] transition">
                      <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        maxLength={LIMITS.USER_NAME_MAX}
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Votre nom ou pseudonyme"
                        className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Email de contact <span className="text-zinc-400 font-normal">(optionnel)</span>
                    </label>
                    <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-11 focus-within:border-[#06B6D4] transition">
                      <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      <input
                        type="email"
                        maxLength={LIMITS.RECOVERY_EMAIL_MAX}
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="contact@exemple.com"
                        className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
                      />
                    </div>
                  </div>
                </div>

              {/* Mot de passe maître */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Mot de passe maître <span className="text-[#06B6D4]">*</span>
                  </label>
                  {password && (
                    <span className="text-[11px] font-mono text-[#059669] dark:text-[#10B981]">
                      Force : {strength.label}
                    </span>
                  )}
                </div>

                <div className="relative flex items-center bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-11 focus-within:border-[#06B6D4] transition">
                  <KeyRound className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={LIMITS.MASTER_PASSWORD_MAX}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 caractères, majuscule, chiffre..."
                    className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-mono tracking-wider pl-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Afficher/masquer"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Jauge de force fine */}
                {password && (
                  <div className="w-full h-1 bg-zinc-200 dark:bg-[#27272A] rounded-full overflow-hidden mt-2">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                  </div>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Confirmer le mot de passe maître <span className="text-[#06B6D4]">*</span>
                  </label>
                  {passwordsMatch && (
                    <span className="text-[10px] font-mono text-[#059669] dark:text-[#10B981] flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      Identique
                    </span>
                  )}
                </div>

                <div className="relative flex items-center bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] rounded-xl px-3 h-11 focus-within:border-[#06B6D4] transition">
                  <KeyRound className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={LIMITS.MASTER_PASSWORD_MAX}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe maître"
                    className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-mono tracking-wider pl-2"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Bouton CTA Primaire */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  className="w-full h-12 rounded-xl brand-gradient-btn text-[#09090B] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(6,182,212,0.25)] dark:shadow-[0_4px_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#09090B]/30 border-t-[#09090B] rounded-full animate-spin" />
                      <span>Initialisation Argon2id...</span>
                    </div>
                  ) : (
                    <>
                      <span>Initialiser mon coffre VGuard</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-[#27272A]/40 flex items-center justify-between text-xs text-zinc-500 dark:text-[#71717A]">
            <span>⚠️ Aucun kit en ligne : conservez votre mot de passe</span>
            <span className="text-zinc-400 dark:text-[#52525B] text-[11px] font-mono">100% Hors-ligne</span>
          </div>
        </section>

        </div>
      </main>
    </div>
  );
}
