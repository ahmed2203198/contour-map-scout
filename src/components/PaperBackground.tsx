import React, { memo, useEffect, useState } from 'react';
import { ImageBackground, InteractionManager, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import ASSETS from '../assets';
import { SCREEN_H, SCREEN_W } from '../constants/config';
import { THEME } from '../constants/theme';

export type PaperVariant = 'loader' | 'menu' | 'game' | 'debrief';

/**
 * The single background of the whole app: one survey-paper photograph with a
 * per-screen gradient over it. The Loader sits under an opaque ink wash so it
 * can never be mistaken for the Menu.
 */
const GRADIENTS: Record<PaperVariant, string[]> = {
  loader: ['rgba(30,24,14,0.97)', 'rgba(58,46,28,0.94)', 'rgba(104,70,36,0.90)'],
  menu: ['rgba(245,239,224,0.90)', 'rgba(239,230,210,0.93)', 'rgba(231,218,192,0.95)'],
  game: ['rgba(245,239,224,0.94)', 'rgba(237,227,205,0.96)'],
  debrief: ['rgba(239,230,210,0.93)', 'rgba(245,239,224,0.90)', 'rgba(226,212,184,0.96)'],
};

const GRAIN: Record<PaperVariant, number> = {
  loader: 0.3,
  menu: 0.2,
  game: 0.16,
  debrief: 0.2,
};

function LoaderDecor() {
  const cx = SCREEN_W / 2;
  const cy = SCREEN_H * 0.38;
  return (
    <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
      <Circle cx={cx} cy={cy} r={90} stroke={THEME.colors.text.onDark} strokeOpacity={0.14} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={130} stroke={THEME.colors.text.onDark} strokeOpacity={0.1} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={170} stroke={THEME.colors.accent.teal} strokeOpacity={0.22} strokeWidth={1} fill="none" />
    </Svg>
  );
}

function MenuDecor() {
  const cx = SCREEN_W * 0.78;
  const cy = SCREEN_H * 0.68;
  const rings = [44, 72, 104, 140, 178];
  return (
    <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
      {rings.map(r => (
        <Circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          stroke={THEME.colors.accent.brown}
          strokeOpacity={0.1}
          strokeWidth={1}
          fill="none"
        />
      ))}
      <Path
        d={`M ${SCREEN_W} ${SCREEN_H * 0.46} L ${SCREEN_W * 0.72} ${SCREEN_H * 0.58} L ${SCREEN_W * 0.58} ${
          SCREEN_H * 0.74
        } L ${SCREEN_W * 0.3} ${SCREEN_H * 0.86} L 0 ${SCREEN_H * 0.93}`}
        stroke={THEME.colors.accent.teal}
        strokeOpacity={0.16}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  );
}

function DebriefDecor() {
  const y = SCREEN_H * 0.2;
  return (
    <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
      <Path
        d={`M 0 ${y + 26} L ${SCREEN_W * 0.24} ${y} L ${SCREEN_W * 0.46} ${y + 34} L ${SCREEN_W * 0.7} ${y + 6} L ${SCREEN_W} ${
          y + 30
        }`}
        stroke={THEME.colors.accent.teal}
        strokeOpacity={0.2}
        strokeWidth={2}
        fill="none"
      />
      <Circle cx={SCREEN_W * 0.78} cy={SCREEN_H * 0.74} r={120} stroke={THEME.colors.accent.brown} strokeOpacity={0.08} strokeWidth={1} fill="none" />
      <Circle cx={SCREEN_W * 0.78} cy={SCREEN_H * 0.74} r={166} stroke={THEME.colors.accent.brown} strokeOpacity={0.07} strokeWidth={1} fill="none" />
    </Svg>
  );
}

function PaperBackgroundBase({
  variant,
  children,
}: {
  variant: PaperVariant;
  children?: React.ReactNode;
}) {
  const base = variant === 'loader' ? THEME.colors.bg.ink : THEME.colors.bg.paper;

  /**
   * The paper photograph is a full-screen texture: decoding it costs Fresco a
   * multi-megabyte bitmap, and mounting it with the tree put that decode on the
   * path to the FIRST frame - the app took 13-30s to reach the foreground on a
   * loaded host and the launch probe timed out. The base colour and the gradient
   * already carry the whole palette, so the texture mounts one interaction later
   * and simply fades in over them.
   */
  const [textureReady, setTextureReady] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setTextureReady(true));
    return () => task.cancel();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: base }]}>
      {textureReady ? (
        <ImageBackground
          source={ASSETS.bgGame}
          style={StyleSheet.absoluteFill}
          imageStyle={{ opacity: GRAIN[variant] }}
          resizeMode="cover"
          fadeDuration={220}
        />
      ) : null}
      <LinearGradient colors={GRADIENTS[variant]} style={StyleSheet.absoluteFill} />
      {variant === 'loader' ? <LoaderDecor /> : null}
      {variant === 'menu' ? <MenuDecor /> : null}
      {variant === 'debrief' ? <DebriefDecor /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});

export const PaperBackground = memo(PaperBackgroundBase);
export default PaperBackground;
