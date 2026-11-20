import { useState, useEffect, useCallback } from 'react';

export const ZOOM_PRESETS = [
  { value: 0.8, label: '80%' },
  { value: 0.9, label: '90%' },
  { value: 1.0, label: '100% (Normal)' },
  { value: 1.1, label: '110%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
] as const;

export type ZoomPresetValue = typeof ZOOM_PRESETS[number]['value'];

const STORAGE_KEY = 'vguard-zoom-factor';

function getInitialZoom(): number {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
        return parsed;
      }
    }
  }
  return 1.0;
}

export function useZoom() {
  const [zoomFactor, setZoomState] = useState<number>(getInitialZoom);

  const applyZoom = useCallback((factor: number) => {
    // Normalise à 2 décimales
    const rounded = Math.round(factor * 100) / 100;
    setZoomState(rounded);

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(rounded));
      }
      if (window.vaultAPI?.setZoomFactor) {
        window.vaultAPI.setZoomFactor(rounded);
      }
    } catch (e) {
      console.error('Erreur application zoom:', e);
    }
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState((prev) => {
      // Trouver le preset supérieur le plus proche ou incrémenter de 0.1
      const nextPreset = ZOOM_PRESETS.find((p) => p.value > prev + 0.02);
      const nextVal = nextPreset ? nextPreset.value : Math.min(2.0, prev + 0.1);
      applyZoom(nextVal);
      return nextVal;
    });
  }, [applyZoom]);

  const zoomOut = useCallback(() => {
    setZoomState((prev) => {
      // Trouver le preset inférieur le plus proche ou décrémenter de 0.1
      const prevPresets = [...ZOOM_PRESETS].reverse();
      const prevPreset = prevPresets.find((p) => p.value < prev - 0.02);
      const prevVal = prevPreset ? prevPreset.value : Math.max(0.5, prev - 0.1);
      applyZoom(prevVal);
      return prevVal;
    });
  }, [applyZoom]);

  const resetZoom = useCallback(() => {
    applyZoom(1.0);
  }, [applyZoom]);

  // Initialisation au montage
  useEffect(() => {
    const initial = getInitialZoom();
    if (window.vaultAPI?.setZoomFactor) {
      window.vaultAPI.setZoomFactor(initial);
    }
  }, []);

  return {
    zoomFactor,
    setZoomFactor: applyZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    presets: ZOOM_PRESETS,
  };
}
