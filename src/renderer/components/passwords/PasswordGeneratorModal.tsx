import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useVaultStore } from '../../stores/vault-store';

export function PasswordGeneratorModal() {
  const isGeneratorModalOpen = useVaultStore((state) => state.isGeneratorModalOpen);
  const setGeneratorModalOpen = useVaultStore((state) => state.setGeneratorModalOpen);

  const [password, setPassword] = useState('');
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [copied, setCopied] = useState(false);
  const [strengthLabel, setStrengthLabel] = useState('Très fort');

  const generate = async () => {
    try {
      const pwd = await window.vaultAPI.generatePassword({
        length,
        uppercase,
        lowercase,
        numbers,
        symbols,
        excludeAmbiguous,
      });
      setPassword(pwd);

      const evalResult = await window.vaultAPI.evaluateStrength(pwd);
      setStrengthLabel(evalResult.label);
    } catch (e) {
      console.error('Password generation error:', e);
    }
  };

  useEffect(() => {
    if (isGeneratorModalOpen) {
      generate();
    }
  }, [isGeneratorModalOpen, length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]);

  const copyPassword = async () => {
    if (!password) return;
    await window.vaultAPI.copyToClipboard(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isGeneratorModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* En-tête Modal Stitch */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-[#121215] transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#06B6D4]" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              Générateur Cryptographique
            </h3>
          </div>
          <button
            onClick={() => setGeneratorModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-5">
          {/* Bloc d'affichage mot de passe généré */}
          <div className="space-y-2">
            <div className="relative bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl p-4 flex items-center justify-between gap-3 transition-colors">
              <span className="font-mono text-sm sm:text-base text-zinc-900 dark:text-white tracking-wider break-all select-all font-semibold">
                {password || '...'}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={generate}
                  className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-lg transition cursor-pointer shadow-sm"
                  title="Générer un autre"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="p-2 text-[#0891B2] dark:text-[#06B6D4] hover:opacity-80 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-lg transition cursor-pointer"
                  title="Copier le mot de passe"
                >
                  {copied ? <Check className="w-4 h-4 text-[#059669] dark:text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Jauge de force */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">Robustesse estimée :</span>
              <span className="text-[11px] font-mono text-[#059669] dark:text-[#10B981] font-semibold">
                {strengthLabel}
              </span>
            </div>
            <div className="w-full h-1 bg-zinc-200 dark:bg-[#27272A] rounded-full overflow-hidden">
              <div className="h-full bg-[#10B981] w-full rounded-full" />
            </div>
          </div>

          {/* Curseur de Longueur */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Longueur :</span>
              <span className="font-mono text-[#0891B2] dark:text-[#06B6D4] font-bold text-sm bg-zinc-100 dark:bg-[#18181B] px-2 py-0.5 rounded border border-zinc-200 dark:border-[#27272A]">
                {length} caractères
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 dark:bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
            />
          </div>

          {/* Options de caractères (Pills Stitch) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">Composition</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#27272A]/50 transition">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-[#27272A] text-[#06B6D4] focus:ring-0"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">Majuscules (A-Z)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#27272A]/50 transition">
                <input
                  type="checkbox"
                  checked={lowercase}
                  onChange={(e) => setLowercase(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-[#27272A] text-[#06B6D4] focus:ring-0"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">Minuscules (a-z)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#27272A]/50 transition">
                <input
                  type="checkbox"
                  checked={numbers}
                  onChange={(e) => setNumbers(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-[#27272A] text-[#06B6D4] focus:ring-0"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">Chiffres (0-9)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#27272A]/50 transition">
                <input
                  type="checkbox"
                  checked={symbols}
                  onChange={(e) => setSymbols(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-[#27272A] text-[#06B6D4] focus:ring-0"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">Symboles (!@#$)</span>
              </label>
            </div>

            <label className="flex items-center gap-2.5 p-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#27272A]/50 transition text-xs mt-2">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                className="rounded border-zinc-300 dark:border-[#27272A] text-[#06B6D4] focus:ring-0"
              />
              <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                Exclure caractères ambigus (0, O, l, 1, I)
              </span>
            </label>
          </div>

          {/* Footer Bouton */}
          <div className="pt-2">
            <button
              type="button"
              onClick={copyPassword}
              className="w-full h-11 rounded-xl brand-gradient hover:opacity-90 text-[#09090B] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-[#06B6D4]/15"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Copié dans le presse-papier !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.5]" />
                  <span>Copier et utiliser</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
