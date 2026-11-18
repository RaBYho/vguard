import { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useVaultStore } from '../../stores/vault-store';

export function SetupWizard() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createVault = useVaultStore((state) => state.createVault);

  const isLengthValid = password.length >= 8;
  const isMatch = password === confirmPassword && confirmPassword.length > 0;

  // Estimation locale de la force
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [isLengthValid, hasUpper && hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLengthValid) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (!isMatch) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createVault(password);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création du coffre.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden select-none">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 shadow-lg shadow-emerald-500/25 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Création de votre Coffre-fort</h1>
          <p className="text-sm text-slate-400 mt-1">
            Bienvenue sur VGuard. Définissez votre mot de passe maître principal.
          </p>
        </div>

        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-300 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-200">Avertissement de Sécurité Zéro-Connaissance</p>
            <p className="mt-1">
              Ce mot de passe sert de clé de chiffrement (Argon2id + AES-256-GCM). Il n'est jamais stocké en clair et ne peut pas être réinitialisé en cas d'oubli.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Nouveau Mot de passe maître
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 8 caractères (recommandé 14+)"
                autoFocus
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Jauge de force */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1.5 w-full">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        score >= step
                          ? score <= 1
                            ? 'bg-red-500'
                            : score === 2
                            ? 'bg-amber-500'
                            : score === 3
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Force du mot de passe</span>
                  <span className="font-medium text-slate-300">
                    {score <= 1 ? 'Trop court ou simple' : score === 2 ? 'Moyen' : score === 3 ? 'Robuste' : 'Excellent'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Confirmez le mot de passe maître
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Répétez exactement le même mot de passe"
              disabled={isLoading}
              className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-sm ${
                confirmPassword.length > 0
                  ? isMatch
                    ? 'border-emerald-500/50 focus:ring-emerald-500'
                    : 'border-red-500/50 focus:ring-red-500'
                  : 'border-slate-700 focus:ring-blue-500'
              }`}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isLengthValid || !isMatch}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Initialisation du coffre-fort...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Créer mon coffre-fort VGuard</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
