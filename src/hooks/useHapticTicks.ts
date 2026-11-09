import { useCallback, useRef } from 'react';
import { Vibration } from 'react-native';
import { HAPTIC_TICK_DEG } from '../constants/config';

/**
 * One short tick every HAPTIC_TICK_DEG degrees of bezel rotation.
 * The last ticked bucket lives in a ref so the throttle survives
 * the per-frame rotation updates without re-rendering anything.
 */
export function useHapticTicks(enabled: boolean) {
  const lastBucket = useRef<number | null>(null);

  const tick = useCallback(
    (degrees: number) => {
      const bucket = Math.round(degrees / HAPTIC_TICK_DEG);
      if (lastBucket.current === bucket) {
        return;
      }
      lastBucket.current = bucket;
      if (enabled) {
        try {
          Vibration.vibrate(8);
        } catch (e) {
          // A device without a vibrator must never take the screen down with it.
        }
      }
    },
    [enabled],
  );

  const reset = useCallback(() => {
    lastBucket.current = null;
  }, []);

  return { tick, reset };
}

export default useHapticTicks;
