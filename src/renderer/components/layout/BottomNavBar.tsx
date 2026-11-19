import {
  Shield,
  Key,
  Clock,
  Star,
  Settings,
} from 'lucide-react';
import { useVaultStore, ActiveTab } from '../../stores/vault-store';

export function BottomNavBar() {
  const activeTab = useVaultStore((state) => state.activeTab);
  const setActiveTab = useVaultStore((state) => state.setActiveTab);
  const setSelectedCategory = useVaultStore((state) => state.setSelectedCategory);
  const selectedCategoryId = useVaultStore((state) => state.selectedCategoryId);

  const items = [
    { id: 'all' as ActiveTab, label: 'Tout', icon: Shield },
    { id: 'passwords' as ActiveTab, label: 'Mots de passe', icon: Key },
    { id: 'totp' as ActiveTab, label: '2FA', icon: Clock },
    { id: 'favorites' as ActiveTab, label: 'Favoris', icon: Star },
    { id: 'settings' as ActiveTab, label: 'Réglages', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden shrink-0 h-16 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-lg border-t border-zinc-200 dark:border-[#27272A] flex items-center justify-around px-2 z-30 select-none shadow-sm transition-colors"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id && selectedCategoryId === null;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setSelectedCategory(null);
            }}
            className={`min-h-[44px] min-w-[44px] flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 ease-out cursor-pointer focus-ring ${
              isActive
                ? 'text-[#0891B2] dark:text-[#06B6D4] font-semibold scale-105'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] truncate max-w-[56px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
