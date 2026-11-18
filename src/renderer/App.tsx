import { useEffect } from 'react';
import { LockScreen } from './components/auth/LockScreen';
import { SetupWizard } from './components/auth/SetupWizard';
import { MainLayout } from './components/layout/MainLayout';
import { useVaultStore } from './stores/vault-store';
import { Shield } from 'lucide-react';

export function App() {
  const isInitialized = useVaultStore((state) => state.isInitialized);
  const isUnlocked = useVaultStore((state) => state.isUnlocked);
  const checkVaultExists = useVaultStore((state) => state.checkVaultExists);
  const lock = useVaultStore((state) => state.lock);

  useEffect(() => {
    checkVaultExists();

    // Abonnement à l'auto-verrouillage déclenché depuis le Main process
    const unsubscribe = window.vaultAPI?.onAutoLocked(() => {
      lock();
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  if (isInitialized === null) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium tracking-wide">Chargement sécurisé de VGuard...</span>
      </div>
    );
  }

  if (!isInitialized) {
    return <SetupWizard />;
  }

  if (!isUnlocked) {
    return <LockScreen />;
  }

  return <MainLayout />;
}
