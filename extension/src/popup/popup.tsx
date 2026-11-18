import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Shield,
  Key,
  Clock,
  Copy,
  Check,
  Search,
  Sparkles,
  Lock,
  ExternalLink,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface LoginItem {
  id: string;
  title: string;
  username: string;
  password?: string;
  url?: string;
  totpCode?: string;
  totpRemaining?: number;
}

export function Popup() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'locked' | 'app_not_running'>(
    'loading'
  );
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [siteLogins, setSiteLogins] = useState<LoginItem[]>([]);
  const [allLogins, setAllLogins] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick generator
  const [generatedPw, setGeneratedPw] = useState('');
  const [copiedGen, setCopiedGen] = useState(false);

  useEffect(() => {
    // 1. Détecter l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.url && activeTab.url.startsWith('http')) {
        try {
          const u = new URL(activeTab.url);
          setCurrentDomain(u.hostname);
          setCurrentUrl(activeTab.url);
          loadLogins(activeTab.url, u.hostname);
        } catch {
          checkStatus();
        }
      } else {
        checkStatus();
      }
    });
  }, []);

  const checkStatus = () => {
    chrome.runtime.sendMessage({ action: 'CHECK_STATUS' }, (res) => {
      if (res?.status === 'app_not_running') {
        setStatus('app_not_running');
      } else if (res?.isLocked) {
        setStatus('locked');
      } else {
        setStatus('connected');
        loadAllLogins();
      }
    });
  };

  const loadLogins = (url: string, domain: string) => {
    chrome.runtime.sendMessage({ action: 'GET_LOGINS_FOR_URL', url, domain }, (res) => {
      if (res?.status === 'app_not_running') {
        setStatus('app_not_running');
      } else if (res?.status === 'locked' || res?.isLocked) {
        setStatus('locked');
      } else if (res?.status === 'ok') {
        setStatus('connected');
        setSiteLogins(res.logins || []);
        loadAllLogins();
      }
    });
  };

  const loadAllLogins = () => {
    chrome.runtime.sendMessage({ action: 'GET_ALL_LOGINS' }, (res) => {
      if (res?.status === 'ok') {
        setAllLogins(res.entries || []);
      }
    });
  };

  const handleFill = (login: LoginItem) => {
    chrome.runtime.sendMessage({
      action: 'TRIGGER_FILL_TAB',
      username: login.username,
      password: login.password,
      totpCode: login.totpCode,
    });
    window.close();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = () => {
    chrome.runtime.sendMessage(
      {
        action: 'GENERATE_PASSWORD',
        options: {
          length: 18,
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: true,
          excludeAmbiguous: true,
        },
      },
      (res) => {
        if (res?.password) {
          setGeneratedPw(res.password);
          navigator.clipboard.writeText(res.password);
          setCopiedGen(true);
          setTimeout(() => setCopiedGen(false), 2000);
        }
      }
    );
  };

  const filteredAll = allLogins.filter((item) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.username?.toLowerCase().includes(q) ||
      item.url?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-[520px] bg-[#09090B] text-[#FAFAFA] font-sans antialiased text-xs">
      {/* Header */}
      <header className="px-4 py-3 bg-[#121215] border-b border-[#27272A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-wide text-white">VGuard</span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {status === 'connected' && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connecté</span>
            </span>
          )}
          {status === 'locked' && (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Lock className="w-3 h-3" />
              <span>Verrouillé</span>
            </span>
          )}
          {status === 'app_not_running' && (
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>Hors ligne</span>
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Offline / App Closed Warning */}
        {status === 'app_not_running' && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h4 className="font-semibold text-white">Application VGuard fermée</h4>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Pour des raisons de sécurité, le coffre-fort réside dans votre application de bureau.
              Veuillez démarrer VGuard sur votre machine.
            </p>
          </div>
        )}

        {/* Locked Warning */}
        {status === 'locked' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-2">
            <Lock className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="font-semibold text-white">Coffre-fort verrouillé</h4>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Déverrouillez votre coffre dans la fenêtre principale de VGuard pour activer le remplissage.
            </p>
          </div>
        )}

        {/* Search Input */}
        {status === 'connected' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un identifiant..."
              className="w-full pl-9 pr-3 py-2 bg-[#18181B] border border-[#27272A] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        )}

        {/* Matching Logins for Current Domain */}
        {status === 'connected' && !searchQuery && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Ce site : <span className="text-cyan-400 font-mono">{currentDomain || 'Aucun'}</span>
              </span>
              <span className="text-[10px] text-zinc-500">{siteLogins.length} trouvé(s)</span>
            </div>

            {siteLogins.length === 0 ? (
              <div className="p-4 bg-[#121215] border border-[#27272A] rounded-2xl text-center text-zinc-400 text-xs">
                Aucun compte enregistré pour ce domaine.
              </div>
            ) : (
              siteLogins.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#121215] border border-[#27272A] hover:border-zinc-700 rounded-2xl p-3 space-y-2.5 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-xs">{item.title}</h4>
                      <p className="text-zinc-400 font-mono text-[11px]">{item.username}</p>
                    </div>

                    <button
                      onClick={() => handleFill(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium transition shadow-sm"
                    >
                      <span>Remplir</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* TOTP 2FA Code if available */}
                  {item.totpCode && (
                    <div className="flex items-center justify-between pt-2 border-t border-[#1C1C20] text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-bold tracking-wider">{item.totpCode}</span>
                        <span className="text-zinc-500 text-[10px]">({item.totpRemaining}s)</span>
                      </div>
                      <button
                        onClick={() => handleCopy(item.totpCode!, `totp-${item.id}`)}
                        className="text-zinc-400 hover:text-white transition"
                        title="Copier le code 2FA"
                      >
                        {copiedId === `totp-${item.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Résultats ({filteredAll.length})
            </span>
            {filteredAll.map((item) => (
              <div
                key={item.id}
                className="bg-[#121215] border border-[#27272A] rounded-xl p-2.5 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-white text-xs">{item.title}</h4>
                  <p className="text-zinc-400 text-[11px] font-mono">{item.username}</p>
                </div>
                <button
                  onClick={() => handleCopy(item.username, `user-${item.id}`)}
                  className="p-1.5 text-zinc-400 hover:text-white"
                  title="Copier l'identifiant"
                >
                  {copiedId === `user-${item.id}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Quick Password Generator Box */}
        {status === 'connected' && (
          <div className="p-3 bg-[#121215] border border-[#27272A] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Générateur Instantané</span>
              </span>
              <button
                onClick={handleGenerate}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {copiedGen ? 'Copié !' : 'Générer & Copier'}
              </button>
            </div>
            {generatedPw && (
              <div className="font-mono text-xs text-white bg-[#18181B] px-2.5 py-1.5 rounded-lg break-all select-all border border-zinc-800">
                {generatedPw}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-4 py-2.5 bg-[#121215] border-t border-[#27272A] flex items-center justify-between text-[11px] text-zinc-500">
        <span>VGuard Auto-Fill v0.1.0</span>
        <span className="text-cyan-400 font-medium">AES-256 + 2FA</span>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('popup-root') as HTMLElement);
root.render(<Popup />);
