import { Key, Plus, Search } from 'lucide-react';
import { PasswordCard } from './PasswordCard';
import { useVaultStore } from '../../stores/vault-store';
import type { PasswordEntry } from '../../../shared/types';

export function PasswordList() {
  const entries = useVaultStore((state) => state.entries);
  const activeTab = useVaultStore((state) => state.activeTab);
  const selectedCategoryId = useVaultStore((state) => state.selectedCategoryId);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const openNewEntryModal = useVaultStore((state) => state.openNewEntryModal);

  const passwords = entries.filter((e): e is PasswordEntry => e.type === 'password');

  const filtered = passwords.filter((item) => {
    if (activeTab === 'favorites' && !item.favorite) return false;
    if (selectedCategoryId && item.categoryId !== selectedCategoryId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      return matchTitle || matchUser || matchEmail || matchUrl || matchNotes;
    }

    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
          <Key className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-300">
          {searchQuery ? 'Aucun mot de passe correspondant' : 'Aucun mot de passe enregistré'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          {searchQuery
            ? 'Essayez une autre recherche ou réinitialisez le filtre.'
            : 'Commencez à sécuriser vos identifiants en créant votre première entrée.'}
        </p>
        {!searchQuery && (
          <button
            onClick={() => openNewEntryModal('password')}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un mot de passe</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((item) => (
        <PasswordCard key={item.id} entry={item} />
      ))}
    </div>
  );
}
