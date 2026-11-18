import { Search, Plus, Key, Clock, QrCode, X } from 'lucide-react';
import { useVaultStore } from '../../stores/vault-store';

export function Header() {
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);
  const selectedCategoryId = useVaultStore((state) => state.selectedCategoryId);
  const setSelectedCategory = useVaultStore((state) => state.setSelectedCategory);
  const categories = useVaultStore((state) => state.categories);
  const openNewEntryModal = useVaultStore((state) => state.openNewEntryModal);
  const setQRScannerOpen = useVaultStore((state) => state.setQRScannerOpen);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between gap-4 select-none shrink-0">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par titre, identifiant ou URL..."
          className="w-full pl-10 pr-9 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Category Tag if any */}
      {activeCategory && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: activeCategory.color }}
          />
          <span>{activeCategory.name}</span>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-slate-400 hover:text-white ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setQRScannerOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition shadow-sm"
          title="Scanner un QR code 2FA"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Scanner QR</span>
        </button>

        <button
          onClick={() => openNewEntryModal('totp')}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition shadow-sm"
        >
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="hidden md:inline">+ 2FA</span>
        </button>

        <button
          onClick={() => openNewEntryModal('password')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Mot de passe</span>
        </button>
      </div>
    </header>
  );
}
