import { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNavBar } from './BottomNavBar';
import { PasswordList } from '../passwords/PasswordList';
import { TOTPList } from '../totp/TOTPList';
import { EntryModal } from '../common/EntryModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { QRScanner } from '../totp/QRScanner';
import { PasswordGeneratorModal } from '../passwords/PasswordGeneratorModal';
import { SettingsView } from '../settings/SettingsView';
import { useVaultStore } from '../../stores/vault-store';
import { ShieldCheck, Clock } from 'lucide-react';

export function MainLayout() {
  const activeTab = useVaultStore((state) => state.activeTab);
  const selectedCategoryId = useVaultStore((state) => state.selectedCategoryId);
  const editingEntry = useVaultStore((state) => state.editingEntry);
  const deletingEntry = useVaultStore((state) => state.deletingEntry);
  const isEntryModalOpen = useVaultStore((state) => state.isEntryModalOpen);
  const closeEntryModal = useVaultStore((state) => state.closeEntryModal);
  const cancelDeleteEntry = useVaultStore((state) => state.cancelDeleteEntry);
  const confirmDeleteEntry = useVaultStore((state) => state.confirmDeleteEntry);
  const isQRScannerOpen = useVaultStore((state) => state.isQRScannerOpen);
  const isGeneratorModalOpen = useVaultStore((state) => state.isGeneratorModalOpen);
  const refreshTOTPCodes = useVaultStore((state) => state.refreshTOTPCodes);
  const entries = useVaultStore((state) => state.entries);
  const settings = useVaultStore((state) => state.settings);

  const mainScrollRef = useRef<HTMLElement>(null);

  // Remise à zéro fluide du défilement lors du changement d'onglet ou de catégorie
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, selectedCategoryId]);

  // Intervalle de rafraîchissement des codes TOTP chaque seconde
  useEffect(() => {
    refreshTOTPCodes();
    const interval = setInterval(() => {
      refreshTOTPCodes();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F4F6] dark:bg-[#09090B] text-zinc-900 dark:text-[#F8FAFC] transition-colors">
      {/* Sidebar latérale : cachée sur compact (< 800px / md) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />

        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar space-y-6"
        >
          <div
            key={`${activeTab}-${selectedCategoryId || 'all'}`}
            className="animate-page-enter space-y-6 max-w-7xl mx-auto"
          >
            {activeTab === 'settings' ? (
              <SettingsView />
            ) : (
              <div className="space-y-6">
                {/* Bannière de résumé Stitch */}
                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm dark:shadow-lg transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center text-[#0891B2] dark:text-[#06B6D4] flex-shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                        Vue d'ensemble du Coffre
                      </h1>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#059669] dark:text-[#10B981] border border-[#10B981]/30 font-medium">
                        {entries.length} élément{entries.length > 1 ? 's' : ''} sécurisé{entries.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs font-mono">
                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                      <span>Chiffré AES-256</span>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#06B6D4]" />
                      <span>Auto-lock: {settings?.autoLockMinutes ?? 5}m</span>
                    </div>
                  </div>
                </div>

                {activeTab === 'totp' ? (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Codes 2FA (TOTP)
                      </h2>
                    </div>
                    <TOTPList />
                  </section>
                ) : activeTab === 'passwords' ? (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Mots de passe
                      </h2>
                    </div>
                    <PasswordList />
                  </section>
                ) : (
                  <>
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Mots de passe
                        </h2>
                      </div>
                      <PasswordList />
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Codes 2FA (TOTP)
                        </h2>
                      </div>
                      <TOTPList />
                    </section>
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Bottom Nav Bar pour mobile (< 800px / md) */}
        <BottomNavBar />
      </div>

      {/* Modale globale unifiée Stitch (Mot de passe & 2FA) */}
      {isEntryModalOpen && editingEntry && (
        <EntryModal entry={editingEntry} onClose={closeEntryModal} />
      )}

      {/* Modale de confirmation de suppression Stitch */}
      {deletingEntry && (
        <DeleteConfirmModal
          entry={deletingEntry}
          onConfirm={confirmDeleteEntry}
          onCancel={cancelDeleteEntry}
        />
      )}

      {isQRScannerOpen && <QRScanner />}
      {isGeneratorModalOpen && <PasswordGeneratorModal />}
    </div>
  );
}
