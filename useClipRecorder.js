import { useEffect } from 'react';
import { initClipRecorder, isClipRecorderActive, getClipRecordingCanvas } from './clipRecorder.js';

// The global recorder owns Space and the recording lifecycle.
// Match components only help initialize the singleton if their canvas appears
// before GlobalClipRecorder's polling pass. They NEVER install another save
// handler, so one Space press can never trigger two clip saves.
export function useClipRecorder(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return undefined;

    let timer = null;
    const sync = () => {
      if (window.__e6ClipRecorderActive) return;
      try {
        const enabled = JSON.parse(localStorage.getItem('element6_progress') || '{}')?.settings?.enableClips === true;
        if (!enabled) return;
      } catch {
        return;
      }
      if (!isClipRecorderActive() || getClipRecordingCanvas() !== canvas) {
        initClipRecorder(canvas);
      }
    };

    sync();
    timer = setTimeout(sync, 0);

    return () => {
      if (timer) clearTimeout(timer);
      // Never stop the global recorder when a match component unmounts.
    };
  }, [canvasRef]);
}
