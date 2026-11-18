import { useState } from 'react';
import {
  Shield,
  KeyRound,
  Clock,
  Clipboard,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useVaultStore } from '../../stores/vault-store';

export function SettingsView() {
  const settings = useVaultStore((state) => state.settings);
  const updateSettings = useVaultStore((state) => state.updateSettings);

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Export/Import state
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
        window.location.reload(); // Recharger le store
      } catch (err: any) {
        alert(`Erreur d'importation : ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 overflow-y-auto h-full">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres de Sécurité</h1>
        <p className="text-sm text-slate-400 mt-1">
          Gérez votre mot de passe maître, les délais d'auto-verrouillage et vos sauvegardes.
        </p>
      </div>

      {/* 1. Mot de passe maître */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Modifier le mot de passe maître</h2>
            <p className="text-xs text-slate-400">
              Le coffre sera rechiffré immédiatement avec votre nouvelle clé dérivée Argon2id.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Mot de passe maître actuel
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Confirmer</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
              />
            </div>
          </div>

          {pwMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                pwMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
            disabled={isChangingPw}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-sm"
          >
            {isChangingPw ? 'Rechiffrement en cours...' : 'Mettre à jour le mot de passe maître'}
          </button>
        </form>
      </div>

      {/* 2. Préférences de session */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Verrouillage & Confidentialité</h2>
            <p className="text-xs text-slate-400">Minuteries de sécurité automatique</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl pt-1">
          {/* Auto lock */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Verrouillage automatique
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Verrouille le coffre après une période d'inactivité
            </p>
            <select
              value={settings.autoLockMinutes}
              onChange={(e) => updateSettings({ autoLockMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes (Recommandé)</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={0}>Jamais (Déconseillé)</option>
            </select>
          </div>

          {/* Clipboard clear */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Effacement du presse-papier
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Purge automatiquement les mots de passe copiés
            </p>
            <select
              value={settings.clipboardClearSeconds}
              onChange={(e) => updateSettings({ clipboardClearSeconds: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value={15}>15 secondes</option>
              <option value={30}>30 secondes (Recommandé)</option>
              <option value={60}>60 secondes</option>
              <option value={0}>Jamais</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Sauvegarde & Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Sauvegarde & Restauration</h2>
            <p className="text-xs text-slate-400">Exportez vos identifiants ou importez un backup</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium border border-slate-700 transition"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Exporter en JSON</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium border border-slate-700 transition"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Exporter en CSV</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium border border-slate-700 cursor-pointer transition">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Importer un backup JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {exportMessage && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{exportMessage}</span>
          </p>
        )}
      </div>

      {/* 4. Architecture Info */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
        <span>VGuard v0.1.0 • Chiffrement local AES-256-GCM + Argon2id</span>
        <span className="font-mono text-[11px]">Zero-Knowledge Architecture</span>
      </div>
    </div>
  );
}
