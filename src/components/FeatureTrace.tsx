import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { REVEAL_MS, SHEET_PX, TRACE_MS } from '../constants/config';
import { THEME } from '../constants/theme';
import { pathPixelLength, svgPath, toPx } from '../game/geometry';
import { Feature } from '../game/sheets';
import type { Feedback } from '../hooks/useLessonFlow';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The per-task feedback layer, drawn over the sheet so a trace never forces the
 * contour stack to re-render. Stroke props are SVG attributes, so these two
 * animations run with useNativeDriver:false by necessity - the native driver is
 * only ever used for transform and opacity on this project.
 */
function FeatureTraceBase({ feature, state }: { feature: Feature | null; state: Feedback }) {
  const d = useMemo(() => (feature ? svgPath(feature.path) : ''), [feature]);
  const len = useMemo(() => (feature ? pathPixelLength(feature.path) : 1), [feature]);
  const target = useMemo(() => (feature ? toPx(feature.target) : { x: 0, y: 0 }), [feature]);

  const offset = useRef(new Animated.Value(len)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    offset.stopAnimation();
    flash.stopAnimation();

    if (state === 'correct') {
      offset.setValue(len);
      flash.setValue(0);
      Animated.timing(offset, {
        toValue: 0,
        duration: TRACE_MS,
        useNativeDriver: false,
      }).start();
      return;
    }

    if (state === 'reveal') {
      offset.setValue(0);
      flash.setValue(0);
      Animated.sequence([
        Animated.timing(flash, { toValue: 0.9, duration: 160, useNativeDriver: false }),
        Animated.delay(REVEAL_MS - 320),
        Animated.timing(flash, { toValue: 0, duration: 160, useNativeDriver: false }),
      ]).start();
      return;
    }

    offset.setValue(len);
    flash.setValue(0);
  }, [state, len, offset, flash, feature]);

  if (!feature || d === '' || state === 'idle') {
    return null;
  }

  return (
    <Svg
      width={SHEET_PX}
      height={SHEET_PX}
      viewBox={`0 0 ${SHEET_PX} ${SHEET_PX}`}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {state === 'correct' ? (
        <>
          <AnimatedPath
            d={d}
            stroke={THEME.colors.accent.teal}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${len},${len}`}
            strokeDashoffset={offset as unknown as number}
          />
          <Circle
            cx={target.x}
            cy={target.y}
            r={10}
            fill="none"
            stroke={THEME.colors.accent.teal}
            strokeWidth={2}
          />
        </>
      ) : (
        <AnimatedPath
          d={d}
          stroke={THEME.colors.accent.teal}
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeDasharray="8,5"
          fill="none"
          strokeOpacity={flash as unknown as number}
        />
      )}
    </Svg>
  );
}

export const FeatureTrace = memo(FeatureTraceBase);
export default FeatureTrace;
