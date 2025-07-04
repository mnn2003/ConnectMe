import { useState, useRef, useCallback } from 'react';

export interface CallTimerHooks {
  callDuration: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

export const useCallTimer = (): CallTimerHooks => {
  const [callDuration, setCallDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    setCallDuration(0);
    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setCallDuration(0);
  }, [stopTimer]);

  return {
    callDuration,
    startTimer,
    stopTimer,
    resetTimer
  };
};