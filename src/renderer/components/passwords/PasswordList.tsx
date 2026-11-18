import { Key, Plus, Search } from 'lucide-react';
import { PasswordCard } from './PasswordCard';
import { EmptyState } from '../common/EmptyState';
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
      <EmptyState
        icon={<Key className="w-8 h-8 text-[#06B6D4]" />}
        title={searchQuery ? 'Aucun mot de passe correspondant' : 'Aucun mot de passe enregistré'}
        description={
          searchQuery
            ? 'Essayez une autre recherche ou réinitialisez le filtre.'
            : 'Commencez à sécuriser vos identifiants en créant votre première entrée chiffrée.'
        }
        actions={
          !searchQuery ? (
            <button
              onClick={() => openNewEntryModal('password')}
              className="flex items-center gap-2 px-4 py-2 brand-gradient hover:opacity-90 text-[#09090B] rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-[#06B6D4]/10"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nouveau mot de passe</span>
            </button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filtered.map((item) => (
        <PasswordCard key={item.id} entry={item} />
      ))}
    </div>
  );
}
