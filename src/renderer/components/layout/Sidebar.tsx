import {
  Shield,
  Key,
  Clock,
  Star,
  Sparkles,
  Settings,
  Lock,
  Layers,
  Folder,
  Plus,
  Trash2,
} from 'lucide-react';
import { useVaultStore, ActiveTab } from '../../stores/vault-store';

export function Sidebar() {
  const activeTab = useVaultStore((state) => state.activeTab);
  const setActiveTab = useVaultStore((state) => state.setActiveTab);
  const selectedCategoryId = useVaultStore((state) => state.selectedCategoryId);
  const setSelectedCategory = useVaultStore((state) => state.setSelectedCategory);
  const entries = useVaultStore((state) => state.entries);
  const categories = useVaultStore((state) => state.categories);
  const lock = useVaultStore((state) => state.lock);
  const setGeneratorModalOpen = useVaultStore((state) => state.setGeneratorModalOpen);

  const passwordCount = entries.filter((e) => e.type === 'password').length;
  const totpCount = entries.filter((e) => e.type === 'totp').length;
  const favoriteCount = entries.filter((e) => e.favorite).length;

  const navItems = [
    { id: 'all' as ActiveTab, label: 'Tout le coffre', icon: Layers, count: entries.length },
    { id: 'passwords' as ActiveTab, label: 'Mots de passe', icon: Key, count: passwordCount },
    { id: 'totp' as ActiveTab, label: 'Codes 2FA (TOTP)', icon: Clock, count: totpCount },
    { id: 'favorites' as ActiveTab, label: 'Favoris', icon: Star, count: favoriteCount },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none shrink-0 h-screen">
      {/* Top section */}
      <div className="flex flex-col overflow-y-auto p-4 space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-wide text-lg">VGuard</span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Chiffré AES-256</span>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          <span className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Coffre-fort
          </span>
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-500/50 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setGeneratorModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Générateur de mot de passe</span>
          </button>
        </div>

        {/* Categories Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Catégories
            </span>
          </div>

          {categories.map((cat) => {
            const isCatActive = selectedCategoryId === cat.id;
            const count = entries.filter((e) => e.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  isCatActive
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="text-[11px] text-slate-500">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Paramètres</span>
        </button>

        <button
          onClick={() => lock()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
        >
          <Lock className="w-4 h-4" />
          <span>Verrouiller</span>
        </button>
      </div>
    </aside>
  );
}
