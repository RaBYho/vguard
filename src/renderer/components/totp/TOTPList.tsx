import { Clock, Plus, QrCode } from 'lucide-react';
import { TOTPCard } from './TOTPCard';
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-300">
          {searchQuery ? 'Aucun code 2FA correspondant' : 'Aucun compte 2FA enregistré'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          {searchQuery
            ? 'Essayez une autre recherche.'
            : 'Ajoutez vos clés de sécurité TOTP (Google Authenticator, GitHub, Discord...) pour générer vos codes temporaires à 6 chiffres.'}
        </p>
        {!searchQuery && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setQRScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium border border-slate-700 transition"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Scanner QR</span>
            </button>
            <button
              onClick={() => openNewEntryModal('totp')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter manuellement</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((item) => (
        <TOTPCard key={item.id} entry={item} />
      ))}
    </div>
  );
}
