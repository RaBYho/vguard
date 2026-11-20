import { useEffect } from 'react';
import { useVaultStore } from '../stores/vault-store';
import { useZoom } from './useZoom';

export function useKeyboardShortcuts() {
  const { zoomIn, zoomOut, resetZoom } = useZoom();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      // 1. Ctrl + F / ⌘F : Focus omnibox search
      if (cmdOrCtrl && key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('omnibox-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // 2. Alt + G / ⌥G : Ouvrir le générateur de mot de passe
      if (e.altKey && key === 'g') {
        e.preventDefault();
        const store = useVaultStore.getState();
        if (store.isUnlocked) {
          store.openPasswordGenerator();
        }
        return;
      }

      // 3. Ctrl + L / ⌘L : Verrouiller immédiatement le coffre & zéroiser la mémoire
      if (cmdOrCtrl && key === 'l') {
        e.preventDefault();
        const store = useVaultStore.getState();
        if (store.isUnlocked) {
          store.lock();
        }
        return;
      }

      // 4. Ctrl + Plus / ⌘+ / Ctrl = : Agrandir l'interface (Zoom In)
      if (cmdOrCtrl && (e.key === '+' || e.key === '=' || e.key === 'Add')) {
        e.preventDefault();
        zoomIn();
        return;
      }

      // 5. Ctrl + Minus / ⌘- : Réduire l'interface (Zoom Out)
      if (cmdOrCtrl && (e.key === '-' || e.key === '_' || e.key === 'Subtract')) {
        e.preventDefault();
        zoomOut();
        return;
      }

      // 6. Ctrl + 0 / ⌘0 : Réinitialiser la mise à l'échelle (100%)
      if (cmdOrCtrl && (e.key === '0' || e.key === 'Insert')) {
        e.preventDefault();
        resetZoom();
        return;
      }

      // 7. Échap (Escape) : Fermeture en cascade des modales actives
      if (e.key === 'Escape') {
        const store = useVaultStore.getState();

        // Si une suppression est en attente de confirmation
        if (store.deletingEntry) {
          e.preventDefault();
          store.cancelDeleteEntry();
          return;
        }

        // Si le scanner QR est ouvert
        if (store.isQRScannerOpen) {
          e.preventDefault();
          store.closeQRScanner();
          return;
        }

        // Si le générateur de mot de passe est ouvert
        if (store.isGeneratorModalOpen) {
          e.preventDefault();
          store.closePasswordGenerator();
          return;
        }

        // Si la modale d'édition / création d'élément est ouverte
        if (store.isEntryModalOpen) {
          e.preventDefault();
          store.closeEntryModal();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomIn, zoomOut, resetZoom]);
}
