import { useEffect } from 'react';
import { LockScreen } from './components/auth/LockScreen';
import { SetupWizard } from './components/auth/SetupWizard';
import { MainLayout } from './components/layout/MainLayout';
import { VGuardLogo } from './components/common/VGuardLogo';
import { useVaultStore } from './stores/vault-store';
import { useThemeStore } from './hooks/useTheme';

export function App() {
  const isInitialized = useVaultStore((state) => state.isInitialized);
  const isUnlocked = useVaultStore((state) => state.isUnlocked);
  const checkVaultExists = useVaultStore((state) => state.checkVaultExists);
  const lock = useVaultStore((state) => state.lock);

  // Initialise l'écoute du store de thème
  useThemeStore();

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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--color-bg-root)] text-zinc-500 dark:text-zinc-400 gap-4 relative overflow-hidden select-none">
        {/* Halos ambiants */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <VGuardLogo size={56} variant="icon" animate={true} />
          <div className="flex flex-col items-center gap-1 mt-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
              VGuard
            </span>
            <span className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
              Initialisation sécurisée du coffre...
            </span>
          </div>
        </div>
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
