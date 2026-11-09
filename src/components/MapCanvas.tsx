import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import ASSETS from '../assets';
import {
  BOARD_BORDER,
  BOARD_PAD,
  BOARD_W,
  HIT_SLOP,
  HIT_ZOOMED_IN,
  HIT_ZOOMED_OUT,
  PULSE_MS,
  SHEET_PX,
} from '../constants/config';
import { THEME } from '../constants/theme';
import { Pt, toPx } from '../game/geometry';
import { Sheet } from '../game/sheets';
import { useMapGestures } from '../hooks/useMapGestures';
import ContourSheet from './ContourSheet';

export type MapTarget = { id: string; p: Pt; label: string };

/**
 * The framed map plate. Width comes from the BOARD_FRAME formula, never a
 * percentage, so the 10x10 grid of cells can never spill past the border.
 */
function MapCanvasBase({
  sheet,
  targets = [],
  onTargetTap,
  blink,
  routePath,
  children,
}: {
  sheet: Sheet;
  targets?: MapTarget[];
  onTargetTap?: (id: string) => void;
  blink?: Pt | null;
  routePath?: Pt[] | null;
  children?: React.ReactNode;
}) {
  const { panHandlers, translate, scale, scaleRef } = useMapGestures();
  const [hit, setHit] = useState(HIT_ZOOMED_OUT);
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: PULSE_MS / 2, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: PULSE_MS / 2, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulse]);

  /** One measurement per touch end - never per frame. */
  const settleHit = useCallback(() => {
    const next = scaleRef.current < 1.3 ? HIT_ZOOMED_OUT : HIT_ZOOMED_IN;
    setHit(prev => (prev === next ? prev : next));
  }, [scaleRef]);

  const blinkPx = blink ? toPx(blink) : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.plate} onTouchEnd={settleHit} {...panHandlers}>
        <ImageBackground
          source={ASSETS.bgGame}
          style={StyleSheet.absoluteFill}
          imageStyle={styles.grain}
          resizeMode="cover"
        />
        {/* box-none: this animated wrapper holds the tappable targets, and an
            animated wrapper that claims touches eats their onPress on release. */}
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.sheetLayer,
            {
              transform: [
                { translateX: translate.x },
                { translateY: translate.y },
                { scale },
              ],
            },
          ]}
        >
          <ContourSheet sheet={sheet} routePath={routePath} />
          {children}

          {targets.map(t => {
            const a = toPx(t.p);
            return (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                accessibilityLabel={t.label}
                onPress={() => onTargetTap?.(t.id)}
                hitSlop={HIT_SLOP}
                style={{
                  position: 'absolute',
                  left: a.x - hit / 2,
                  top: a.y - hit / 2,
                  width: hit,
                  height: hit,
                }}
              />
            );
          })}

          {blinkPx ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.blink,
                { left: blinkPx.x - 13, top: blinkPx.y - 13, opacity: pulse },
              ]}
            />
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plate: {
    width: BOARD_W,
    height: BOARD_W,
    padding: BOARD_PAD,
    borderWidth: BOARD_BORDER,
    borderColor: THEME.colors.accent.brown,
    borderRadius: 8,
    backgroundColor: THEME.colors.bg.paper,
    overflow: 'hidden',
  },
  grain: { opacity: 0.16 },
  sheetLayer: {
    width: SHEET_PX,
    height: SHEET_PX,
  },
  blink: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: THEME.colors.accent.terracotta,
    backgroundColor: 'rgba(217,123,77,0.18)',
  },
});

export const MapCanvas = memo(MapCanvasBase);
export default MapCanvas;
