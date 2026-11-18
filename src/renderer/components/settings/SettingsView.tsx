import { useState } from 'react';
import {
  KeyRound,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Moon,
  Sun,
} from 'lucide-react';
import { useVaultStore } from '../../stores/vault-store';
import { useThemeStore } from '../../hooks/useTheme';

export function SettingsView() {
  const settings = useVaultStore((state) => state.settings);
  const updateSettings = useVaultStore((state) => state.updateSettings);

  const themeMode = useThemeStore((state) => state.mode);
  const setTheme = useThemeStore((state) => state.setTheme);

  // Modification mot de passe maître
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Export / Import
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);

    if (newPassword.length < 8) {
      setPwMessage({
        type: 'error',
        text: 'Le nouveau mot de passe maître doit comporter au moins 8 caractères.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setIsChangingPw(true);
    try {
      await window.vaultAPI.changeMasterPassword(oldPassword, newPassword);
      setPwMessage({ type: 'success', text: 'Mot de passe maître modifié avec succès !' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwMessage({ type: 'error', text: err?.message || 'Mot de passe actuel incorrect.' });
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await window.vaultAPI.exportVault(format);
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vguard_backup_${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMessage(`Sauvegarde ${format.toUpperCase()} exportée avec succès.`);
      setTimeout(() => setExportMessage(null), 3000);
    } catch (e: any) {
      alert(`Erreur d'export: ${e.message}`);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await window.vaultAPI.importVault(content, 'json');
        alert(`${res.importedCount} entrées importées avec succès !`);
        window.location.reload();
      } catch (err: any) {
        alert(`Erreur d'importation : ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none custom-scrollbar pb-12 transition-colors">
      {/* En-tête Paramètres Stitch */}
      <div className="border-b border-zinc-200 dark:border-[#27272A] pb-5 transition-colors">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Préférences & Sécurité
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Gérez votre mot de passe maître, vos délais d'auto-verrouillage et sauvegardez votre coffre-fort.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1 : Thème d'interface (2 thèmes stricts : Sombre et Clair) */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl p-6 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#0891B2] dark:text-[#06B6D4] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Thème d'affichage</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Palette Cybersécurité Obsidian ou Mode Clair FinTech
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                updateSettings({ theme: 'dark' });
              }}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer text-xs font-medium ${
                themeMode === 'dark'
                  ? 'bg-[#06B6D4]/10 border-[#06B6D4] text-[#0891B2] dark:text-[#06B6D4] shadow-sm font-semibold'
                  : 'bg-zinc-50 dark:bg-[#18181B]/50 border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B]'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span>Sombre</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('light');
                updateSettings({ theme: 'light' });
              }}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer text-xs font-medium ${
                themeMode === 'light'
                  ? 'bg-[#06B6D4]/10 border-[#06B6D4] text-[#0891B2] dark:text-[#06B6D4] shadow-sm font-semibold'
                  : 'bg-zinc-50 dark:bg-[#18181B]/50 border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B]'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span>Clair</span>
            </button>
          </div>
        </div>

        {/* Section 2 : Minuteries de sécurité */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl p-6 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[#059669] dark:text-[#10B981] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Minuteries & Auto-verrouillage</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Délais avant verrouillage automatique en cas d'inactivité
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Auto-verrouillage :</label>
              <select
                value={settings?.autoLockMinutes ?? 5}
                onChange={(e) => updateSettings({ autoLockMinutes: Number(e.target.value) })}
                className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 h-9 text-xs text-zinc-900 dark:text-white outline-none font-mono focus:border-[#06B6D4] transition-colors cursor-pointer"
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 heure</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Effacement presse-papier :</label>
              <select
                value={settings?.clipboardClearSeconds ?? 30}
                onChange={(e) => updateSettings({ clipboardClearSeconds: Number(e.target.value) })}
                className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 h-9 text-xs text-zinc-900 dark:text-white outline-none font-mono focus:border-[#06B6D4] transition-colors cursor-pointer"
              >
                <option value={15}>15 secondes</option>
                <option value={30}>30 secondes</option>
                <option value={60}>60 secondes</option>
                <option value={120}>2 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3 : Modifier le mot de passe maître */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl p-6 space-y-4 md:col-span-2 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[#0891B2] dark:text-[#06B6D4] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Modifier le mot de passe maître</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Le coffre sera rechiffré immédiatement avec votre nouvelle clé dérivée Argon2id.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3 max-w-lg pt-1">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Votre mot de passe actuel"
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 h-10 text-xs text-zinc-900 dark:text-white outline-none font-mono focus:border-[#06B6D4] placeholder:text-zinc-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 h-10 text-xs text-zinc-900 dark:text-white outline-none font-mono focus:border-[#06B6D4] placeholder:text-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 h-10 text-xs text-zinc-900 dark:text-white outline-none font-mono focus:border-[#06B6D4] placeholder:text-zinc-400 transition-colors"
                />
              </div>
            </div>

            {pwMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                  pwMessage.type === 'success'
                    ? 'bg-[#10B981]/15 text-[#059669] dark:text-[#10B981] border border-[#10B981]/30'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}
              >
                {pwMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{pwMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isChangingPw || !oldPassword || !newPassword}
              className="px-4 py-2 brand-gradient hover:opacity-90 text-[#09090B] font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 shadow-md shadow-[#06B6D4]/10"
            >
              {isChangingPw ? 'Rechiffrement en cours...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </div>

        {/* Section 4 : Export & Sauvegarde */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl p-6 space-y-4 md:col-span-2 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Sauvegarde & Importation</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Exportez vos données pour les stocker en lieu sûr ou importez une sauvegarde existante.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-xs font-medium text-zinc-800 dark:text-zinc-200 rounded-xl transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-[#0891B2] dark:text-[#06B6D4]" />
              <span>Exporter en JSON</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-xs font-medium text-zinc-800 dark:text-zinc-200 rounded-xl transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
              <span>Exporter en CSV</span>
            </button>

            <label className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-xs font-medium text-zinc-800 dark:text-zinc-200 rounded-xl transition cursor-pointer shadow-sm">
              <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Importer une sauvegarde</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {exportMessage && (
            <div className="flex items-center gap-2 text-xs text-[#059669] dark:text-[#10B981] font-mono pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{exportMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}