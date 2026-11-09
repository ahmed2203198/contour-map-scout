import { useCallback, useEffect, useState } from 'react';

export type Units = 'KM' | 'MILES';
export type Sensitivity = 'FINE' | 'NORMAL' | 'COARSE';
export type TextSize = 'S' | 'M' | 'L';

export type Settings = {
  units: Units;
  sensitivity: Sensitivity;
  haptics: boolean;
  textSize: TextSize;
};

/**
 * Module-level store - the station settings outlive a screen unmount without
 * pulling in a native storage dependency.
 */
let current: Settings = {
  units: 'KM',
  sensitivity: 'NORMAL',
  haptics: true,
  textSize: 'M',
};

const listeners = new Set<(s: Settings) => void>();

export function getSettings() {
  return current;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  current = { ...current, [key]: value };
  listeners.forEach(fn => fn(current));
}

export const FONT_SCALE: Record<TextSize, number> = { S: 0.92, M: 1, L: 1.1 };
export const SENSITIVITY_FACTOR: Record<Sensitivity, number> = { FINE: 0.55, NORMAL: 1, COARSE: 1.8 };

export function useSettings() {
  const [settings, setLocal] = useState<Settings>(current);

  useEffect(() => {
    const fn = (s: Settings) => setLocal(s);
    listeners.add(fn);
    setLocal(current);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSetting(key, value);
  }, []);

  return { settings, update, fontScale: FONT_SCALE[settings.textSize] };
}

/** Distance formatted for the current unit setting - "3.2 KM" / "2.0 MI". */
export function formatDistance(km: number, units: Units) {
  if (units === 'MILES') {
    return `${(km * 0.6214).toFixed(1)} MI`;
  }
  return `${km.toFixed(1)} KM`;
}

export default useSettings;
