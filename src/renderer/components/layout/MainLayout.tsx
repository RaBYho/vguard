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
import { EmptyState } from '../common/EmptyState';
import { useVaultStore } from '../../stores/vault-store';
import type { PasswordEntry, TOTPEntry } from '../../../shared/types';
import { ShieldCheck, Clock, Key, Star, Search, Plus } from 'lucide-react';

export function MainLayout() {
  const activeTab = useVaultStore((state) => state.activeTab);
  const selectedCategoryId = useVaultStore((state) => state.selectedCategoryId);
  const setSelectedCategory = useVaultStore((state) => state.setSelectedCategory);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const categories = useVaultStore((state) => state.categories);
  const openNewEntryModal = useVaultStore((state) => state.openNewEntryModal);
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
  }, [activeTab, selectedCategoryId, searchQuery]);

  // Intervalle de rafraîchissement des codes TOTP chaque seconde
  useEffect(() => {
    refreshTOTPCodes();
    const interval = setInterval(() => {
      refreshTOTPCodes();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const q = searchQuery.toLowerCase().trim();

  // Filtrage fin des mots de passe
  const filteredPasswords = entries.filter((e): e is PasswordEntry => {
    if (e.type !== 'password') return false;
    if (activeTab === 'favorites' && !e.favorite) return false;
    if (selectedCategoryId && e.categoryId !== selectedCategoryId) return false;
    if (q) {
      const matchTitle = e.title?.toLowerCase().includes(q);
      const matchUser = e.username?.toLowerCase().includes(q);
      const matchEmail = e.email?.toLowerCase().includes(q);
      const matchUrl = e.url?.toLowerCase().includes(q);
      const matchNotes = e.notes?.toLowerCase().includes(q);
      return Boolean(matchTitle || matchUser || matchEmail || matchUrl || matchNotes);
    }
    return true;
  });

  // Filtrage fin des codes TOTP
  const filteredTOTP = entries.filter((e): e is TOTPEntry => {
    if (e.type !== 'totp') return false;
    if (activeTab === 'favorites' && !e.favorite) return false;
    if (selectedCategoryId && e.categoryId !== selectedCategoryId) return false;
    if (q) {
      const matchTitle = e.title?.toLowerCase().includes(q);
      const matchIssuer = e.issuer?.toLowerCase().includes(q);
      const matchAccount = e.account?.toLowerCase().includes(q);
      return Boolean(matchTitle || matchIssuer || matchAccount);
    }
    return true;
  });

  const totalFilteredCount =
    activeTab === 'passwords'
      ? filteredPasswords.length
      : activeTab === 'totp'
      ? filteredTOTP.length
      : filteredPasswords.length + filteredTOTP.length;

  // Calcul du titre et de l'icône dynamiques de la bannière
  let bannerTitle = "Vue d'ensemble du Coffre";
  let bannerIcon = <ShieldCheck className="w-5 h-5 text-[#0891B2] dark:text-[#06B6D4]" />;

  if (searchQuery.trim()) {
    bannerTitle = `Résultats de recherche`;
    bannerIcon = <Search className="w-5 h-5 text-[#0891B2] dark:text-[#06B6D4]" />;
  } else if (selectedCategory) {
    bannerTitle = `Catégorie : ${selectedCategory.name}`;
    bannerIcon = (
      <span
        className="w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-xs"
        style={{ backgroundColor: selectedCategory.color || '#06B6D4' }}
      />
    );
  } else if (activeTab === 'passwords') {
    bannerTitle = 'Mots de passe';
    bannerIcon = <Key className="w-5 h-5 text-[#0891B2] dark:text-[#06B6D4]" />;
  } else if (activeTab === 'totp') {
    bannerTitle = 'Codes 2FA (TOTP)';
    bannerIcon = <Clock className="w-5 h-5 text-[#059669] dark:text-[#10B981]" />;
  } else if (activeTab === 'favorites') {
    bannerTitle = 'Mes Favoris';
    bannerIcon = <Star className="w-5 h-5 text-[#D97706] dark:text-[#F59E0B]" />;
  }

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
                {/* Bannière de résumé Stitch dynamique */}
                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm dark:shadow-lg transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center flex-shrink-0">
                      {bannerIcon}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                        {bannerTitle}
                      </h1>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#059669] dark:text-[#10B981] border border-[#10B981]/30 font-medium">
                        {totalFilteredCount} élément{totalFilteredCount > 1 ? 's' : ''} {selectedCategory || activeTab !== 'all' || searchQuery ? 'trouvé' : 'sécurisé'}{totalFilteredCount > 1 ? 's' : ''}
                      </span>
                      {selectedCategory && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(null)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                          title="Désélectionner le filtre de catégorie"
                        >
                          <span>Filtre actif</span>
                          <span className="text-xs font-bold leading-none">&times;</span>
                        </button>
                      )}
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

                {/* Contenu principal : affichage adaptatif et anti-redondance */}
                {totalFilteredCount === 0 ? (
                  <EmptyState
                    icon={
                      searchQuery ? (
                        <Search className="w-8 h-8 text-[#06B6D4]" />
                      ) : selectedCategory ? (
                        <span
                          className="w-8 h-8 rounded-full inline-block"
                          style={{ backgroundColor: selectedCategory.color || '#06B6D4' }}
                        />
                      ) : activeTab === 'favorites' ? (
                        <Star className="w-8 h-8 text-[#F59E0B]" />
                      ) : activeTab === 'totp' ? (
                        <Clock className="w-8 h-8 text-[#10B981]" />
                      ) : (
                        <Key className="w-8 h-8 text-[#06B6D4]" />
                      )
                    }
                    title={
                      searchQuery
                        ? 'Aucun résultat correspondant'
                        : selectedCategory
                        ? `Aucun élément dans "${selectedCategory.name}"`
                        : activeTab === 'favorites'
                        ? 'Aucun élément favori'
                        : activeTab === 'totp'
                        ? 'Aucun code 2FA enregistré'
                        : 'Aucun mot de passe enregistré'
                    }
                    description={
                      searchQuery
                        ? `Aucun mot de passe ou code 2FA ne correspond à votre recherche "${searchQuery}".`
                        : selectedCategory
                        ? `Vous n'avez pas encore d'élément classé dans la catégorie ${selectedCategory.name}.`
                        : activeTab === 'favorites'
                        ? 'Marquez vos identifiants ou codes 2FA avec l’étoile pour les retrouver ici rapidement.'
                        : activeTab === 'totp'
                        ? 'Ajoutez vos clés de sécurité TOTP pour générer vos codes de vérification à 6 chiffres.'
                        : 'Commencez à sécuriser vos identifiants en créant votre première entrée chiffrée.'
                    }
                    actions={
                      !searchQuery ? (
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => openNewEntryModal('password')}
                            className="flex items-center gap-1.5 px-3.5 py-2 brand-gradient hover:opacity-90 text-[#09090B] rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-[#06B6D4]/10"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Nouveau mot de passe</span>
                          </button>
                          <button
                            onClick={() => openNewEntryModal('totp')}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] text-zinc-900 dark:text-white rounded-xl text-xs font-medium border border-zinc-200 dark:border-[#27272A] transition cursor-pointer shadow-sm"
                          >
                            <Plus className="w-4 h-4 text-[#10B981]" />
                            <span>Nouveau code 2FA</span>
                          </button>
                        </div>
                      ) : undefined
                    }
                  />
                ) : activeTab === 'totp' ? (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Codes 2FA (TOTP)
                      </h2>
                      <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                        {filteredTOTP.length} code{filteredTOTP.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <TOTPList />
                  </section>
                ) : activeTab === 'passwords' ? (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Mots de passe
                      </h2>
                      <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                        {filteredPasswords.length} compte{filteredPasswords.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <PasswordList />
                  </section>
                ) : (
                  <div className="space-y-8">
                    {filteredPasswords.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Mots de passe
                          </h2>
                          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                            {filteredPasswords.length} compte{filteredPasswords.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <PasswordList />
                      </section>
                    )}

                    {filteredTOTP.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Codes 2FA (TOTP)
                          </h2>
                          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                            {filteredTOTP.length} code{filteredTOTP.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <TOTPList />
                      </section>
                    )}
                  </div>
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
