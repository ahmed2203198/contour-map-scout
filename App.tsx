import React, { useCallback, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import GameOverScreen from './src/screens/GameOverScreen';
import GameScreen from './src/screens/GameScreen';
import LegendScreen from './src/screens/LegendScreen';
import LoaderScreen from './src/screens/LoaderScreen';
import MenuScreen from './src/screens/MenuScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { THEME } from './src/constants/theme';
import { EMPTY_PROGRESS, LessonMode, Progress, markLesson, nextLesson } from './src/game/progress';
import { SHEETS } from './src/game/sheets';
import { LessonResult } from './src/hooks/useLessonFlow';
import { useSettings } from './src/hooks/useSettings';

type Screen = 'loader' | 'menu' | 'game' | 'gameover' | 'legend' | 'settings';

/** State machine only - no gameplay lives here. */
export default function App() {
  const [screen, setScreen] = useState<Screen>('loader');
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [mode, setMode] = useState<LessonMode>('contours');
  const [sheetIndex, setSheetIndex] = useState(0);
  const [result, setResult] = useState<LessonResult | null>(null);

  const { settings, update } = useSettings();
  const sheet = useMemo(() => SHEETS[sheetIndex % SHEETS.length], [sheetIndex]);

  const startMission = useCallback(() => {
    setMode(nextLesson(progress));
    setScreen('game');
  }, [progress]);

  const handleGameOver = useCallback(
    (lesson: LessonResult) => {
      setResult(lesson);
      setProgress(prev => markLesson(prev, mode, lesson.accuracy, lesson.streak));
      setScreen('gameover');
    },
    [mode],
  );

  const planAgain = useCallback(() => {
    setSheetIndex(i => i + 1);
    setMode(nextLesson(progress));
    setScreen('game');
  }, [progress]);

  const goMenu = useCallback(() => setScreen('menu'), []);

  return (
    <View style={styles.root}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={screen === 'loader' ? 'light-content' : 'dark-content'}
      />

      {screen === 'loader' ? <LoaderScreen onDone={goMenu} /> : null}

      {screen === 'menu' ? (
        <MenuScreen
          progress={progress}
          sheet={sheet}
          onStart={startMission}
          onLegend={() => setScreen('legend')}
          onSettings={() => setScreen('settings')}
        />
      ) : null}

      {screen === 'game' ? (
        <GameScreen
          key={`${mode}-${sheetIndex}`}
          mode={mode}
          sheet={sheet}
          settings={settings}
          onGameOver={handleGameOver}
          onMenu={goMenu}
        />
      ) : null}

      {screen === 'gameover' && result ? (
        <GameOverScreen
          result={result}
          mode={mode}
          sheet={sheet}
          settings={settings}
          onPlayAgain={planAgain}
          onMenu={goMenu}
        />
      ) : null}

      {screen === 'legend' ? <LegendScreen onBack={goMenu} /> : null}

      {screen === 'settings' ? (
        <SettingsScreen settings={settings} onChange={update} onBack={goMenu} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.bg.paper },
});
