import { useEffect, useRef } from 'react';
import { initClipRecorder, isClipRecorderActive, getClipRecordingCanvas } from './clipRecorder.js';

// The app-level GlobalClipRecorder owns the keyboard/save pipeline. Game
// components only register their canvas here. This prevents duplicate Space
// listeners from consuming two rolling windows for one key press.
export function useClipRecorder(canvasRef) {
  const initialized = useRef(false);
  useEffect(() => {
    const start = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (isClipRecorderActive()) {
        // A new match gets a new canvas. Switch the recording source at the
        // match boundary; during Victory/Match Facts no game hook is mounted,
        // so the previous match remains available for clipping.
        if (getClipRecordingCanvas() !== canvas) {
          initialized.current = initClipRecorder(canvas);
        } else {
          initialized.current = true;
        }
        return;
      }
      initialized.current = initClipRecorder(canvas);
    };
    start();
    const timer = setInterval(start, 500);
    return () => {
      clearInterval(timer);
      initialized.current = false;
    };
  }, [canvasRef]);
}
