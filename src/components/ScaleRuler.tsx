import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { RULER_GRIP, SHEET_PX } from '../constants/config';
import { THEME } from '../constants/theme';
import { Pt, clamp, pointAlong, polylineLength, svgPath, toKilometres, toPx } from '../game/geometry';

const SAMPLES = 72;

/**
 * The romer ruler dragged along the measured line. All drag bookkeeping lives in
 * refs; the reading is pushed out on a 90 ms throttle so the bar can show a live
 * number without a setState on every touch frame.
 */
function ScaleRulerBase({
  path,
  onReading,
  disabled = false,
}: {
  path: Pt[];
  onReading: (km: number) => void;
  disabled?: boolean;
}) {
  const samples = useMemo(() => {
    const out: { t: number; px: Pt }[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      out.push({ t, px: toPx(pointAlong(path, t)) });
    }
    return out;
  }, [path]);

  const totalKm = useMemo(() => toKilometres(polylineLength(path)), [path]);
  const start = samples[0].px;

  const pos = useRef(new Animated.ValueXY({ x: start.x, y: start.y })).current;
  const posRef = useRef({ x: start.x, y: start.y });
  const grantRef = useRef({ x: start.x, y: start.y });
  const lastPush = useRef(0);
  const onReadingRef = useRef(onReading);
  onReadingRef.current = onReading;

  useEffect(() => {
    posRef.current = { x: start.x, y: start.y };
    pos.setValue({ x: start.x, y: start.y });
    lastPush.current = 0;
    onReadingRef.current(0);
  }, [start.x, start.y, pos]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          grantRef.current = { ...posRef.current };
        },
        onPanResponderMove: (_evt, g) => {
          const wanted = {
            x: clamp(grantRef.current.x + g.dx, 0, SHEET_PX),
            y: clamp(grantRef.current.y + g.dy, 0, SHEET_PX),
          };
          // Snap onto the measured line - a ruler cannot leave the line it reads.
          let best = samples[0];
          let bestD = Infinity;
          for (const s of samples) {
            const dx = s.px.x - wanted.x;
            const dy = s.px.y - wanted.y;
            const d = dx * dx + dy * dy;
            if (d < bestD) {
              bestD = d;
              best = s;
            }
          }
          posRef.current = { x: best.px.x, y: best.px.y };
          pos.setValue(posRef.current);

          const now = Date.now();
          if (now - lastPush.current > 90) {
            lastPush.current = now;
            onReadingRef.current(totalKm * best.t);
          }
        },
        onPanResponderRelease: () => {
          let best = samples[0];
          let bestD = Infinity;
          for (const s of samples) {
            const dx = s.px.x - posRef.current.x;
            const dy = s.px.y - posRef.current.y;
            const d = dx * dx + dy * dy;
            if (d < bestD) {
              bestD = d;
              best = s;
            }
          }
          onReadingRef.current(totalKm * best.t);
        },
      }),
    [samples, totalKm, pos, disabled],
  );

  const end = samples[samples.length - 1].px;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Svg width={SHEET_PX} height={SHEET_PX} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path
          d={svgPath(path)}
          stroke={THEME.colors.accent.teal}
          strokeWidth={2.5}
          strokeDasharray="8,6"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={start.x} cy={start.y} r={5} fill={THEME.colors.accent.teal} />
        <Circle cx={end.x} cy={end.y} r={5} fill="none" stroke={THEME.colors.accent.teal} strokeWidth={2} />
        <Line
          x1={end.x - 7}
          y1={end.y - 7}
          x2={end.x + 7}
          y2={end.y + 7}
          stroke={THEME.colors.accent.teal}
          strokeWidth={1.5}
        />
      </Svg>

      <Animated.View
        {...responder.panHandlers}
        style={[
          styles.grip,
          { transform: [{ translateX: Animated.subtract(pos.x, RULER_GRIP / 2) }, { translateY: Animated.subtract(pos.y, RULER_GRIP / 2) }] },
        ]}
      >
        <View style={styles.gripInner}>
          <Text style={styles.gripMark}>|||</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  grip: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: RULER_GRIP,
    height: RULER_GRIP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gripInner: {
    width: RULER_GRIP,
    height: RULER_GRIP,
    borderRadius: RULER_GRIP / 2,
    backgroundColor: THEME.colors.accent.brown,
    borderWidth: 2,
    borderColor: THEME.colors.bg.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gripMark: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    lineHeight: 18,
    color: THEME.colors.text.onDark,
  },
});

export const ScaleRuler = memo(ScaleRulerBase);
export default ScaleRuler;
