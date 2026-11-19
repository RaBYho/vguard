import {
  FolderOpen,
  Key,
  Clock,
  Star,
  Settings,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useVaultStore, ActiveTab } from '../../stores/vault-store';
import { ThemeToggle } from '../common/ThemeToggle';

export function Sidebar() {
  const activeTab = useVaultStore((state) => state.activeTab);
  const setActiveTab = useVaultStore((state) => state.setActiveTab);
  const selectedCategoryId = useVaultStore((state) => state.selectedCategoryId);
  const setSelectedCategory = useVaultStore((state) => state.setSelectedCategory);
  const entries = useVaultStore((state) => state.entries);
  const categories = useVaultStore((state) => state.categories);
  const lock = useVaultStore((state) => state.lock);
  const setGeneratorModalOpen = useVaultStore((state) => state.setGeneratorModalOpen);
  const settings = useVaultStore((state) => state.settings);

  const passwordCount = entries.filter((e) => e.type === 'password').length;
  const totpCount = entries.filter((e) => e.type === 'totp').length;
  const favoriteCount = entries.filter((e) => e.favorite).length;

  const savedUserName =
    settings?.userName ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('vguard-user-name') : '') ||
    'Alexandre L.';

  const savedEmail =
    settings?.recoveryEmail ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('vguard-user-email') : '') ||
    'alex@domaine.com';

  const userInitials = savedUserName ? savedUserName.slice(0, 2).toUpperCase() : 'AL';

  const navItems = [
    {
      id: 'all' as ActiveTab,
      label: 'Tout le coffre',
      icon: FolderOpen,
      count: entries.length,
      badgeColor: 'bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#06B6D4]',
    },
    {
      id: 'passwords' as ActiveTab,
      label: 'Mots de passe',
      icon: Key,
      count: passwordCount,
      badgeColor: 'bg-zinc-100 dark:bg-[#18181B] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-[#27272A]/50',
    },
    {
      id: 'totp' as ActiveTab,
      label: 'Codes 2FA',
      icon: Clock,
      count: totpCount,
      iconColor: 'text-[#059669] dark:text-[#10B981]',
      badgeColor: 'bg-[#10B981]/15 text-[#059669] dark:text-[#10B981]',
    },
    {
      id: 'favorites' as ActiveTab,
      label: 'Favoris',
      icon: Star,
      count: favoriteCount,
      iconColor: 'text-[#F59E0B]',
      badgeColor: 'bg-[#F59E0B]/15 text-[#D97706] dark:text-[#F59E0B]',
    },
  ];

  return (
    <aside className="w-[260px] h-screen bg-white dark:bg-[#121215] border-r border-zinc-200 dark:border-[#27272A] flex flex-col justify-between flex-shrink-0 select-none transition-colors">
      {/* Partie haute */}
      <div className="p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        {/* Brand Header */}
        <div className="flex items-center gap-3 select-none">
          <img
            src="./icons/vguard-icon.svg"
            alt="VGuard Logo"
            className="w-9 h-9 shrink-0 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-[#F8FAFC] leading-none">
              VGuard
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#06B6D4] font-semibold mt-1">
              Local Vault
            </span>
          </div>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-100/80 dark:bg-[#18181B]/70 border border-zinc-200 dark:border-[#27272A]/70 hover:border-zinc-300 dark:hover:border-[#27272A] transition cursor-pointer">
          <div className="w-9 h-9 rounded-lg brand-gradient flex items-center justify-center font-bold text-xs text-[#09090B] font-mono shadow">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-zinc-900 dark:text-[#F8FAFC] truncate">
              {savedUserName}
            </div>
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
              {savedEmail}
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex flex-col gap-1.5">
          <div className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 px-2 py-1 font-semibold tracking-wider">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && selectedCategoryId === null;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedCategory(null);
                }}
                className={`flex items-center justify-between px-3 h-10 rounded-xl text-xs font-medium transition-all duration-200 ease-out cursor-pointer ${
                  isActive
                    ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#0891B2] dark:text-[#06B6D4] shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${item.iconColor || ''}`} />
                  <span>{item.label}</span>
                </div>
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Action rapide : Générateur */}
        <div className="pt-1">
          <button
            onClick={() => setGeneratorModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181B] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#06B6D4] group-hover:rotate-12 transition-transform" />
              <span className="font-medium">Générateur</span>
            </div>
          </button>
        </div>

        {/* Catégories */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 px-2 py-1 font-semibold tracking-wider">
            Catégories
          </div>

          {categories.map((cat) => {
            const isCatActive = selectedCategoryId === cat.id;
            const count = entries.filter((e) => e.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center justify-between px-3 py-1.5 text-xs transition-all duration-200 ease-out cursor-pointer rounded-lg ${
                  isCatActive
                    ? 'bg-zinc-100 dark:bg-[#18181B] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272A]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-[#18181B]/50'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#06B6D4' }}
                  />
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bas de page : Paramètres, Verrouiller, Thème */}
      <div className="p-4 border-t border-zinc-200 dark:border-[#27272A] flex flex-col gap-2 bg-zinc-50 dark:bg-[#121215] transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-between px-3 h-10 rounded-xl text-xs transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-zinc-200 dark:bg-[#18181B] text-zinc-900 dark:text-white border border-zinc-300 dark:border-[#27272A]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-[#18181B]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </div>
          </button>
          <ThemeToggle />
        </div>

        <button
          onClick={() => lock()}
          className="w-full flex items-center justify-between px-3 h-10 rounded-xl text-xs bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-[#EF4444] border border-red-500/20 transition font-medium cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4" />
            <span>Verrouiller</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
