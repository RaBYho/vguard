import { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useVaultStore } from '../../stores/vault-store';
import { ThemeToggle } from '../common/ThemeToggle';
import { formatErrorMessage } from '../../utils/format-error';
import { toast } from '../../stores/toast-store';
import { LIMITS, validateMasterPassword } from '../../../shared/validation';

export function LockScreen() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const unlock = useVaultStore((state) => state.unlock);
  const settings = useVaultStore((state) => state.settings);

  // Nom d'utilisateur et e-mail (depuis settings ou fallback local)
  const savedUserName =
    settings?.userName ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('vguard-user-name') : '') ||
    'Coffre Principal';

  const savedEmail =
    settings?.recoveryEmail ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('vguard-user-email') : '') ||
    '';

  const userInitials = savedUserName
    ? savedUserName.slice(0, 2).toUpperCase()
    : 'VG';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    const { valid, error: pwError } = validateMasterPassword(password, false);
    if (!valid) {
      setError(pwError || 'Mot de passe maître invalide.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await unlock(password);
      toast.success('Coffre-fort déverrouillé avec succès.');
    } catch (err: any) {
      setError(formatErrorMessage(err, 'Mot de passe incorrect.'));
    } finally {
      setIsLoading(false);
      setPassword('');
    }
  };

  return (
    <div className="h-full min-h-screen font-sans antialiased bg-[#F4F4F6] dark:bg-[#09090B] text-zinc-900 dark:text-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none relative overflow-x-hidden transition-colors">
      {/* Halos ambiants */}
      <div aria-hidden="true" className="bg-mesh-halo"></div>

      {/* ThemeToggle discret en haut à droite */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Conteneur modal d'authentification 2 colonnes */}
      <main className="relative z-10 w-full max-w-4xl" data-purpose="authentication-modal">
        <div className="w-full bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-3xl shadow-xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px] transition-colors">
          
          {/* Colonne gauche (Branding & Statut de sécurité) */}
          <section className="md:col-span-5 p-8 lg:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200 dark:border-[#27272A]/70 relative bg-zinc-50/80 dark:bg-gradient-to-b dark:from-[#141418] dark:to-[#101013] transition-colors">
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

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#06B6D4]">
                    VGuard Local Vault
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-[#F8FAFC]">
                  Déverrouiller
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-[#A1A1AA] leading-relaxed">
                  Saisissez votre mot de passe maître pour accéder à vos identifiants sécurisés.
                </p>
              </div>
            </div>

            {/* Bas : Indicateurs de sécurité */}
            <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-[#27272A]/50 text-xs">
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span className="font-medium text-zinc-700 dark:text-[#D4D4D8]">Chiffrement local 100% hors-ligne</span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-[#71717A] tracking-wider uppercase font-mono">
                Argon2id • AES-256-GCM
              </div>
            </div>
          </section>

          {/* Colonne droite (Formulaire centré & Profil actif) */}
          <section className="md:col-span-7 p-8 lg:p-10 flex flex-col justify-between">
            <div className="my-auto w-full max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Carte profil utilisateur actif */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-100/90 dark:bg-[#18181B]/80 border border-zinc-200 dark:border-[#27272A] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center font-bold text-[#09090B] text-xs shadow-sm font-mono">
                        {userInitials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-[#F8FAFC]">
                          {savedUserName}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-[#71717A] font-mono">
                          {savedEmail || 'Compte local'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-[#059669] dark:text-[#10B981] font-mono font-medium">Actif</span>
                  </div>
                </div>

                {/* Champ Mot de passe maître */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="master-password"
                      className="text-[11px] font-semibold tracking-wider text-zinc-600 dark:text-[#A1A1AA] uppercase"
                    >
                      Mot de passe maître
                    </label>
                    <span className="text-xs text-zinc-400 dark:text-[#71717A] font-mono">Coffre chiffré</span>
                  </div>

                  <div className="relative rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] focus-within:border-[#06B6D4] focus-within:ring-1 focus-within:ring-[#06B6D4] transition-all">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-[#71717A]">
                      <KeyRound className="w-4 h-4" />
                    </div>

                    <input
                      id="master-password"
                      type={showPassword ? 'text' : 'password'}
                      maxLength={LIMITS.MASTER_PASSWORD_MAX}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      required
                      autoFocus
                      disabled={isLoading}
                      className="block w-full pl-10 pr-10 py-3 bg-transparent text-sm text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-[#52525B] focus:outline-none border-none rounded-xl font-mono tracking-wider"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Afficher ou masquer le mot de passe"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:text-[#71717A] dark:hover:text-[#A1A1AA] focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                    disabled={isLoading || !password}
                    className="w-full h-12 rounded-xl brand-gradient hover:opacity-95 text-[#09090B] font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(6,182,212,0.25)] dark:shadow-[0_0_35px_-8px_rgba(16,185,129,0.35)] transition-all duration-150 transform active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-[#09090B]">
                        <div className="w-4 h-4 border-2 border-[#09090B]/30 border-t-[#09090B] rounded-full animate-spin" />
                        <span>Déchiffrement Argon2id...</span>
                      </div>
                    ) : (
                      <>
                        <span>Déverrouiller mon coffre</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer de la colonne */}
            <div className="pt-4 border-t border-zinc-200 dark:border-[#27272A]/40 flex items-center justify-between text-xs text-zinc-500 dark:text-[#71717A]">
              <span>Architecture Zero-Knowledge</span>
              <span className="text-zinc-400 dark:text-[#52525B] text-[11px] font-mono">100% Local</span>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
