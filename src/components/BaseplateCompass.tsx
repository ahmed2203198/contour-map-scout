import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Image, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import ASSETS from '../assets';
import { THEME } from '../constants/theme';
import { useHapticTicks } from '../hooks/useHapticTicks';
import { SENSITIVITY_FACTOR, Sensitivity } from '../hooks/useSettings';

const DIAL = 172;
const R = DIAL / 2;

function norm(deg: number) {
  return ((deg % 360) + 360) % 360;
}

/**
 * The baseplate bezel. The dial turns 1:1 under the finger with no easing - all
 * the angle bookkeeping sits in refs, and the numeric bearing is pushed out on a
 * throttle so the reading stays live without a render per touch frame.
 */
function BaseplateCompassBase({
  resetKey,
  sensitivity,
  hapticsOn,
  onBearing,
  disabled = false,
}: {
  /** Changing this - the task id - spins the bezel back to the index. */
  resetKey: string;
  sensitivity: Sensitivity;
  hapticsOn: boolean;
  onBearing: (deg: number) => void;
  disabled?: boolean;
}) {
  const rot = useRef(new Animated.Value(0)).current;
  const bearingRef = useRef(0);
  const grantAngle = useRef(0);
  const grantBearing = useRef(0);
  const grantLoc = useRef({ x: R, y: 0 });
  const lastPush = useRef(0);

  const onBearingRef = useRef(onBearing);
  onBearingRef.current = onBearing;

  const { tick, reset } = useHapticTicks(hapticsOn);
  const factor = SENSITIVITY_FACTOR[sensitivity];

  useEffect(() => {
    bearingRef.current = 0;
    grantBearing.current = 0;
    lastPush.current = 0;
    rot.setValue(0);
    reset();
  }, [resetKey, rot, reset]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: evt => {
          const lx = evt.nativeEvent.locationX;
          const ly = evt.nativeEvent.locationY;
          const x = isFinite(lx) ? lx : R;
          const y = isFinite(ly) ? ly : 0;
          grantLoc.current = { x, y };
          grantAngle.current = (Math.atan2(y - R, x - R) * 180) / Math.PI;
          grantBearing.current = bearingRef.current;
        },
        onPanResponderMove: (_evt, g) => {
          const x = grantLoc.current.x + g.dx;
          const y = grantLoc.current.y + g.dy;
          const angle = (Math.atan2(y - R, x - R) * 180) / Math.PI;
          let delta = angle - grantAngle.current;
          if (delta > 180) {
            delta -= 360;
          }
          if (delta < -180) {
            delta += 360;
          }
          const next = norm(grantBearing.current + delta * factor);
          bearingRef.current = next;
          rot.setValue(next);
          tick(next);

          const now = Date.now();
          if (now - lastPush.current > 70) {
            lastPush.current = now;
            onBearingRef.current(Math.round(next));
          }
        },
        onPanResponderRelease: () => {
          onBearingRef.current(Math.round(bearingRef.current));
        },
      }),
    [disabled, factor, rot, tick],
  );

  const spin = rot.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '-360deg'],
  });

  const ticks = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    for (let d = 0; d < 360; d += 10) {
      const a = ((d - 90) * Math.PI) / 180;
      const major = d % 30 === 0;
      const outer = R - 6;
      const inner = R - (major ? 18 : 12);
      out.push({
        x1: R + Math.cos(a) * inner,
        y1: R + Math.sin(a) * inner,
        x2: R + Math.cos(a) * outer,
        y2: R + Math.sin(a) * outer,
        major,
      });
    }
    return out;
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.indexMark} />
      <View {...responder.panHandlers} style={styles.touch}>
        <Animated.View style={[styles.dial, { transform: [{ rotate: spin }] }]} pointerEvents="none">
          <Image source={ASSETS.sprite2} style={styles.plate} resizeMode="contain" />
          <Svg width={DIAL} height={DIAL} style={StyleSheet.absoluteFill}>
            <Circle
              cx={R}
              cy={R}
              r={R - 3}
              fill="rgba(255,253,247,0.72)"
              stroke={THEME.colors.accent.brown}
              strokeWidth={2}
            />
            <G>
              {ticks.map((t, i) => (
                <Line
                  key={`t-${i}`}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={THEME.colors.accent.brown}
                  strokeOpacity={t.major ? 0.9 : 0.45}
                  strokeWidth={t.major ? 2 : 1}
                />
              ))}
            </G>
            {/* Orienting lines - line these up with the grid northings */}
            <Line x1={R} y1={22} x2={R} y2={DIAL - 22} stroke={THEME.colors.accent.teal} strokeWidth={1.5} strokeOpacity={0.5} />
            <Line x1={R - 16} y1={34} x2={R - 16} y2={DIAL - 34} stroke={THEME.colors.accent.teal} strokeWidth={1} strokeOpacity={0.35} />
            <Line x1={R + 16} y1={34} x2={R + 16} y2={DIAL - 34} stroke={THEME.colors.accent.teal} strokeWidth={1} strokeOpacity={0.35} />
            {/* North needle */}
            <Path d={`M ${R} 26 L ${R - 9} ${R - 6} L ${R + 9} ${R - 6} Z`} fill={THEME.colors.accent.teal} />
            <Path
              d={`M ${R} ${DIAL - 26} L ${R - 9} ${R + 6} L ${R + 9} ${R + 6} Z`}
              fill={THEME.colors.accent.brown}
              fillOpacity={0.8}
            />
            <SvgText x={R} y={20} fill={THEME.colors.accent.teal} fontSize={11} fontWeight="800" textAnchor="middle">
              N
            </SvgText>
            <SvgText x={R} y={DIAL - 8} fill={THEME.colors.text.secondary} fontSize={10} fontWeight="800" textAnchor="middle">
              S
            </SvgText>
            <Circle cx={R} cy={R} r={4} fill={THEME.colors.accent.brown} />
          </Svg>
        </Animated.View>
      </View>
      <Text style={styles.caption}>DRAG THE BEZEL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  indexMark: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: THEME.colors.accent.terracotta,
    marginBottom: 2,
  },
  touch: { width: DIAL, height: DIAL },
  dial: { width: DIAL, height: DIAL },
  plate: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: DIAL - 16,
    height: DIAL - 16,
    opacity: 0.55,
  },
  caption: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
    marginTop: 8,
  },
});

export const BaseplateCompass = memo(BaseplateCompassBase);
export default BaseplateCompass;
