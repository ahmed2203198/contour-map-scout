import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';
import { PROFILE_MS, SCREEN_W } from '../constants/config';
import { THEME } from '../constants/theme';

const PANEL_W = SCREEN_W - 32;
const PANEL_H = 168;
const CHART_H = 96;

/**
 * The cross-section that rises out of the sheet. Height is a layout property,
 * so this one animation runs on the JS driver - the native driver is only ever
 * used for transform and opacity, never for height.
 */
function ProfilePanelBase({
  open,
  points,
  minH,
  maxH,
  cursorT = 0.5,
}: {
  open: boolean;
  points: { t: number; h: number }[];
  minH: number;
  maxH: number;
  cursorT?: number;
}) {
  const height = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(height, {
      toValue: open ? PANEL_H : 0,
      duration: open ? PROFILE_MS : 300,
      useNativeDriver: false,
    }).start();
  }, [open, height]);

  const chartW = PANEL_W - 28;
  const span = Math.max(1, maxH - minH);

  const d = useMemo(() => {
    if (points.length === 0) {
      return '';
    }
    const toY = (h: number) => CHART_H - ((h - minH) / span) * (CHART_H - 10) - 4;
    let path = `M 0 ${CHART_H}`;
    points.forEach(p => {
      path += ` L ${(p.t * chartW).toFixed(1)} ${toY(p.h).toFixed(1)}`;
    });
    path += ` L ${chartW} ${CHART_H} Z`;
    return path;
  }, [points, minH, span, chartW]);

  return (
    <Animated.View style={[styles.panel, { height }]} pointerEvents="none">
      <View style={styles.inner}>
        <View style={styles.headRow}>
          <Text style={styles.eyebrow}>PROFILE VIEW</Text>
          <Text style={styles.range}>{`${minH} - ${maxH} M`}</Text>
        </View>
        <Svg width={chartW} height={CHART_H}>
          <Line x1={0} y1={CHART_H - 1} x2={chartW} y2={CHART_H - 1} stroke={THEME.colors.accent.brown} strokeOpacity={0.3} strokeWidth={1} />
          <Path d={d} fill={THEME.colors.accent.brown} fillOpacity={0.28} stroke={THEME.colors.accent.brown} strokeWidth={1.5} />
          <Line
            x1={cursorT * chartW}
            y1={0}
            x2={cursorT * chartW}
            y2={CHART_H}
            stroke={THEME.colors.accent.teal}
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
          <SvgText x={4} y={11} fill={THEME.colors.text.secondary} fontSize={9} fontWeight="700">
            {`${maxH} M`}
          </SvgText>
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: PANEL_W,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: THEME.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.line.hairlineStrong,
    borderTopLeftRadius: THEME.radius.lg,
    borderTopRightRadius: THEME.radius.lg,
  },
  inner: {
    height: PANEL_H,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: THEME.colors.text.secondary,
  },
  range: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: THEME.colors.accent.teal,
  },
});

export const ProfilePanel = memo(ProfilePanelBase);
export default ProfilePanel;
