import { Clock, Plus, QrCode } from 'lucide-react';
import { TOTPCard } from './TOTPCard';
import { EmptyState } from '../common/EmptyState';
import { useVaultStore } from '../../stores/vault-store';
import type { TOTPEntry } from '../../../shared/types';

export function TOTPList() {
  const entries = useVaultStore((state) => state.entries);
  const activeTab = useVaultStore((state) => state.activeTab);
  const selectedCategoryId = useVaultStore((state) => state.selectedCategoryId);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const openNewEntryModal = useVaultStore((state) => state.openNewEntryModal);
  const setQRScannerOpen = useVaultStore((state) => state.setQRScannerOpen);

  const totpEntries = entries.filter((e): e is TOTPEntry => e.type === 'totp');

  const filtered = totpEntries.filter((item) => {
    if (activeTab === 'favorites' && !item.favorite) return false;
    if (selectedCategoryId && item.categoryId !== selectedCategoryId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchIssuer = item.issuer?.toLowerCase().includes(q);
      const matchAccount = item.account?.toLowerCase().includes(q);
      return matchTitle || matchIssuer || matchAccount;
    }

    return true;
  });

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-8 h-8 text-[#10B981]" />}
        title={searchQuery ? 'Aucun code 2FA correspondant' : 'Aucun compte 2FA enregistré'}
        description={
          searchQuery
            ? 'Essayez une autre recherche.'
            : 'Ajoutez vos clés de sécurité TOTP (Google Authenticator, GitHub...) pour générer vos codes temporaires à 6 chiffres.'
        }
        actions={
          !searchQuery ? (
            <div className="flex gap-2">
              <button
                onClick={() => setQRScannerOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] text-zinc-900 dark:text-white rounded-xl text-xs font-medium border border-zinc-200 dark:border-[#27272A] transition cursor-pointer shadow-sm"
              >
                <QrCode className="w-4 h-4 text-[#0891B2] dark:text-[#06B6D4]" />
                <span>Scanner QR</span>
              </button>
              <button
                onClick={() => openNewEntryModal('totp')}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#059669] dark:text-[#10B981] border border-[#10B981]/30 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter clé TOTP</span>
              </button>
            </div>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filtered.map((item) => (
        <TOTPCard key={item.id} entry={item} />
      ))}
    </div>
  );
}
