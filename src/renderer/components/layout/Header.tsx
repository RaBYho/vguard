import {
  Search,
  Plus,
  QrCode,
  Lock,
  Clock,
  X,
} from 'lucide-react';
import { useVaultStore } from '../../stores/vault-store';
import { VGuardLogo } from '../common/VGuardLogo';
import { ThemeToggle } from '../common/ThemeToggle';

export function Header() {
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);
  const openNewEntryModal = useVaultStore((state) => state.openNewEntryModal);
  const setQRScannerOpen = useVaultStore((state) => state.setQRScannerOpen);
  const lock = useVaultStore((state) => state.lock);
  const selectedCategoryId = useVaultStore((state) => state.selectedCategoryId);
  const setSelectedCategory = useVaultStore((state) => state.setSelectedCategory);
  const categories = useVaultStore((state) => state.categories);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <header className="h-16 px-4 sm:px-8 bg-white dark:bg-[#121215] border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-4 flex-shrink-0 z-20 select-none transition-colors">
      {/* Logo mobile */}
      <div className="md:hidden flex items-center">
        <VGuardLogo size={28} variant="icon" />
      </div>

      {/* Omnibox de recherche Stitch */}
      <div className="flex items-center gap-3 flex-1 max-w-lg bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] px-3.5 h-10 rounded-xl focus-within:border-[#06B6D4] focus-within:ring-1 focus-within:ring-[#06B6D4] transition">
        <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un identifiant ou code TOTP..."
          className="bg-transparent text-xs text-zinc-900 dark:text-[#F8FAFC] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none w-full font-sans"
        />
        <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-[#27272A] text-zinc-600 dark:text-zinc-400 flex-shrink-0 hidden sm:inline">
          Ctrl+F
        </kbd>
      </div>

      {/* Badge filtre catégorie active */}
      {selectedCategory && (
        <div className="hidden lg:flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#0891B2] dark:text-[#06B6D4] px-3 h-10 rounded-xl text-xs font-medium">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: selectedCategory.color || '#06B6D4' }}
            />
            <span>{selectedCategory.name}</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="hover:text-zinc-900 dark:hover:text-white ml-1 text-sm font-bold leading-none cursor-pointer text-zinc-400 transition"
              title="Retirer le filtre"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Boutons d'actions droits (Stitch) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Scanner QR */}
        <button
          onClick={() => setQRScannerOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3.5 h-10 rounded-xl bg-zinc-100 dark:bg-[#18181B] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer shadow-sm"
        >
          <QrCode className="w-4 h-4 text-[#06B6D4]" />
          <span>Scanner QR</span>
        </button>

        {/* Bouton rapide TOTP */}
        <button
          onClick={() => openNewEntryModal('totp')}
          className="hidden sm:flex items-center gap-2 px-3.5 h-10 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-xs font-semibold text-[#059669] dark:text-[#10B981] transition cursor-pointer shadow-sm"
        >
          <Clock className="w-4 h-4" />
          <span>+ 2FA</span>
        </button>

        {/* Bouton Nouveau Mot de passe principal (Dégradé cyan -> émeraude) */}
        <button
          onClick={() => openNewEntryModal('password')}
          className="flex items-center gap-2 px-4 h-10 rounded-xl brand-gradient hover:opacity-90 text-xs font-semibold text-[#09090B] transition cursor-pointer shadow-md shadow-[#06B6D4]/10"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden xs:inline">Nouveau mot de passe</span>
        </button>

        {/* ThemeToggle sur mobile */}
        <div className="md:hidden">
          <ThemeToggle />
        </div>

        {/* Verrouillage rapide mobile */}
        <button
          onClick={() => lock()}
          title="Verrouiller"
          className="md:hidden p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 transition"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
