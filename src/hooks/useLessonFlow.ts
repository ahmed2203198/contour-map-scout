import { useCallback, useEffect, useRef, useState } from 'react';
import { REVEAL_MS, TRACE_MS } from '../constants/config';
import { Verdict } from '../game/grading';
import { Task } from '../game/progress';

export type Feedback = 'idle' | 'correct' | 'reveal';

export type LegResult = { label: string; detail: string; ok: boolean };

export type LessonResult = {
  correct: number;
  errors: number;
  total: number;
  accuracy: number;
  streak: number;
  legs: LegResult[];
};

/**
 * The task queue for one lesson: tallies, the per-task feedback window and the
 * hand-off to the debrief. `locked` is a ref because the grading callbacks read
 * it during the feedback window, where a stale state value would let a second
 * tap through.
 */
export function useLessonFlow(tasks: Task[], onFinish: (result: LessonResult) => void) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>('idle');

  const lockedRef = useRef(false);
  const legsRef = useRef<LegResult[]>([]);
  const bestStreakRef = useRef(0);
  const correctRef = useRef(0);
  const errorsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishRef = useRef(onFinish);
  const tasksRef = useRef(tasks);

  finishRef.current = onFinish;
  tasksRef.current = tasks;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const task: Task | undefined = tasks[index];

  const submit = useCallback((verdict: Verdict, detail: string) => {
    if (lockedRef.current) {
      return;
    }
    lockedRef.current = true;

    const queue = tasksRef.current;
    const at = queue.length === 0 ? 0 : Math.min(index, queue.length - 1);
    const currentTask = queue[at];

    if (verdict === 'correct') {
      correctRef.current += 1;
      setCorrect(correctRef.current);
      setStreak(s => {
        const next = s + 1;
        bestStreakRef.current = Math.max(bestStreakRef.current, next);
        return next;
      });
      setFeedback('correct');
    } else {
      errorsRef.current += 1;
      setErrors(errorsRef.current);
      setStreak(0);
      setFeedback('reveal');
    }

    legsRef.current = [
      ...legsRef.current,
      {
        label: currentTask ? currentTask.leg : `TASK ${at + 1}`,
        detail,
        ok: verdict === 'correct',
      },
    ];

    const hold = verdict === 'correct' ? TRACE_MS + 220 : REVEAL_MS + 160;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const total = queue.length;
      const done = at + 1 >= total;
      setFeedback('idle');
      lockedRef.current = false;
      if (done) {
        const c = correctRef.current;
        const e = errorsRef.current;
        finishRef.current({
          correct: c,
          errors: e,
          total,
          accuracy: total > 0 ? Math.round((c / total) * 100) : 0,
          streak: bestStreakRef.current,
          legs: legsRef.current,
        });
      } else {
        setIndex(at + 1);
      }
    }, hold);
  }, [index]);

  const isLocked = useCallback(() => lockedRef.current, []);

  const answered = correct + errors;

  return {
    task,
    index,
    total: tasks.length,
    correct,
    errors,
    streak,
    feedback,
    submit,
    isLocked,
    answered,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 100,
  };
}

export default useLessonFlow;
