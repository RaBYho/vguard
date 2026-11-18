import { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, Copy, Check, ShieldCheck } from 'lucide-react';
import { useVaultStore } from '../../stores/vault-store';

export function PasswordGeneratorModal() {
  const isGeneratorModalOpen = useVaultStore((state) => state.isGeneratorModalOpen);
  const setGeneratorModalOpen = useVaultStore((state) => state.setGeneratorModalOpen);

  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);

  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [strength, setStrength] = useState({ score: 4, entropy: 120, label: 'Très robuste' });

  const generate = async () => {
    const pwd = await window.vaultAPI.generatePassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeAmbiguous,
    });
    setPassword(pwd);
    setHistory((prev) => [pwd, ...prev.slice(0, 4)]);
    const evalResult = await window.vaultAPI.evaluateStrength(pwd);
    setStrength(evalResult);
  };

  useEffect(() => {
    if (isGeneratorModalOpen) {
      generate();
    }
  }, [isGeneratorModalOpen, length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]);

  const handleCopy = async () => {
    if (!password) return;
    await window.vaultAPI.copyToClipboard(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isGeneratorModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white">Générateur de Mots de Passe</h2>
          </div>
          <button
            onClick={() => setGeneratorModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Password Display Box */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-lg font-bold text-white tracking-wider break-all select-all">
                {password}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={generate}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition"
                  title="Régénérer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                  title="Copier"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Strength Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full flex-1 rounded-full ${
                      strength.score >= step
                        ? strength.score <= 1
                          ? 'bg-red-500'
                          : strength.score === 2
                          ? 'bg-amber-500'
                          : strength.score === 3
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>Entropie : {strength.entropy} bits</span>
                <span className="text-emerald-400">{strength.label}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Length slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span>Longueur du mot de passe</span>
                <span className="text-white font-mono text-sm">{length}</span>
              </div>
              <input
                type="range"
                min={8}
                max={48}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-medium text-slate-300">
              <label className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Majuscules (A-Z)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={lowercase}
                  onChange={(e) => setLowercase(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Minuscules (a-z)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={numbers}
                  onChange={(e) => setNumbers(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Chiffres (0-9)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={symbols}
                  onChange={(e) => setSymbols(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Symboles (!@#$)</span>
              </label>

              <label className="col-span-2 flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={excludeAmbiguous}
                  onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Exclure caractères ambigus (0, O, l, 1, I)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
