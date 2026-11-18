import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PasswordList } from '../passwords/PasswordList';
import { TOTPList } from '../totp/TOTPList';
import { PasswordForm } from '../passwords/PasswordForm';
import { TOTPForm } from '../totp/TOTPForm';
import { QRScanner } from '../totp/QRScanner';
import { PasswordGeneratorModal } from '../passwords/PasswordGeneratorModal';
import { SettingsView } from '../settings/SettingsView';
import { useVaultStore } from '../../stores/vault-store';

export function MainLayout() {
  const activeTab = useVaultStore((state) => state.activeTab);
  const editingEntry = useVaultStore((state) => state.editingEntry);
  const isEntryModalOpen = useVaultStore((state) => state.isEntryModalOpen);
  const closeEntryModal = useVaultStore((state) => state.closeEntryModal);
  const isQRScannerOpen = useVaultStore((state) => state.isQRScannerOpen);
  const setQRScannerOpen = useVaultStore((state) => state.setQRScannerOpen);
  const refreshTOTPCodes = useVaultStore((state) => state.refreshTOTPCodes);
  const openNewEntryModal = useVaultStore((state) => state.openNewEntryModal);

  // Intervalle de rafraîchissement des codes TOTP chaque seconde
  useEffect(() => {
    refreshTOTPCodes();
    const interval = setInterval(refreshTOTPCodes, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleQRScanned = async (uri: string) => {
    setQRScannerOpen(false);
    try {
      const parsed = await window.vaultAPI.parseTOTPUri(uri);
      // Ouvrir le formulaire pré-rempli
      useVaultStore.setState({
        editingEntry: {
          type: 'totp',
          title: parsed.title,
          issuer: parsed.issuer,
          account: parsed.account,
          secret: parsed.secret,
          algorithm: parsed.algorithm,
          digits: parsed.digits,
          period: parsed.period,
          categoryId: useVaultStore.getState().categories[0]?.id || '',
          favorite: false,
        } as any,
        isEntryModalOpen: true,
      });
    } catch (e: any) {
      alert(`Erreur lecture QR code : ${e.message}`);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'settings' ? (
            <SettingsView />
          ) : activeTab === 'passwords' ? (
            <PasswordList />
          ) : activeTab === 'totp' ? (
            <TOTPList />
          ) : activeTab === 'favorites' ? (
            <div className="space-y-8">
              <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Mots de passe favoris
                </h2>
                <PasswordList />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Codes 2FA favoris
                </h2>
                <TOTPList />
              </div>
            </div>
          ) : (
            /* 'all' */
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Codes 2FA (TOTP)
                  </h2>
                </div>
                <TOTPList />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Mots de passe
                  </h2>
                </div>
                <PasswordList />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Entry Modal (Password or TOTP) */}
      {isEntryModalOpen && editingEntry?.type === 'password' && (
        <PasswordForm initialData={editingEntry} onClose={closeEntryModal} />
      )}

      {isEntryModalOpen && editingEntry?.type === 'totp' && (
        <TOTPForm
          initialData={editingEntry}
          onClose={closeEntryModal}
          onOpenScanner={() => {
            closeEntryModal();
            setQRScannerOpen(true);
          }}
        />
      )}

      {/* QR Scanner Modal */}
      {isQRScannerOpen && (
        <QRScanner onScan={handleQRScanned} onClose={() => setQRScannerOpen(false)} />
      )}

      {/* Standalone Password Generator Modal */}
      <PasswordGeneratorModal />
    </div>
  );
}
