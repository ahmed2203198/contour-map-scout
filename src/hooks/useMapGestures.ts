import { useMemo, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';
import { ZOOM_MAX, ZOOM_MIN } from '../constants/config';
import { clamp } from '../game/geometry';

/**
 * Pan with one finger, pinch with two - on PanResponder only, no native
 * touch library. All the bookkeeping (start distance, start offset, live
 * scale) lives in refs and never touches state: a setState per touch frame
 * would drop the frame rate and re-render the whole sheet.
 */
export function useMapGestures() {
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;

  const scaleRef = useRef(1);
  const startScale = useRef(1);
  const startDistance = useRef(0);
  const startOffset = useRef({ x: 0, y: 0 });
  const offset = useRef({ x: 0, y: 0 });
  const pinching = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Taps must reach the sheet's own targets, so the responder is claimed
        // only once the finger has actually travelled.
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_evt, g) =>
          Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6 || g.numberActiveTouches > 1,
        onMoveShouldSetPanResponderCapture: (_evt, g) => g.numberActiveTouches > 1,

        onPanResponderGrant: () => {
          startOffset.current = { ...offset.current };
          startScale.current = scaleRef.current;
          startDistance.current = 0;
          pinching.current = false;
        },

        onPanResponderMove: (evt, g) => {
          const touches = evt.nativeEvent.touches;

          if (touches.length > 1) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (!pinching.current || startDistance.current === 0) {
              pinching.current = true;
              startDistance.current = d;
              startScale.current = scaleRef.current;
              return;
            }
            const next = clamp((d / startDistance.current) * startScale.current, ZOOM_MIN, ZOOM_MAX);
            scaleRef.current = next;
            scale.setValue(next);
            return;
          }

          if (pinching.current) {
            return;
          }
          const limit = 70 * scaleRef.current;
          const nx = clamp(startOffset.current.x + g.dx, -limit, limit);
          const ny = clamp(startOffset.current.y + g.dy, -limit, limit);
          offset.current = { x: nx, y: ny };
          translate.setValue({ x: nx, y: ny });
        },

        onPanResponderRelease: () => {
          pinching.current = false;
          startDistance.current = 0;
        },
        onPanResponderTerminate: () => {
          pinching.current = false;
          startDistance.current = 0;
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [scale, translate],
  );

  /**
   * These two values are written with setValue on every pan frame, so they stay
   * JS-driven end to end; handing the same node to the native driver for the
   * spring back would mix the two drivers on one node.
   */
  const reset = () => {
    offset.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    Animated.parallel([
      Animated.spring(translate, { toValue: { x: 0, y: 0 }, tension: 60, friction: 9, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 9, useNativeDriver: false }),
    ]).start();
  };

  return { panHandlers: panResponder.panHandlers, translate, scale, scaleRef, reset };
}

export default useMapGestures;
