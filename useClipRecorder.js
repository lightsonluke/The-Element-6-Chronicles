import { useEffect, useRef } from 'react';
import { initClipRecorder, isClipRecorderActive } from './clipRecorder.js';

export function useClipRecorder(canvasRef) {
  const initialized = useRef(false);

  useEffect(() => {
    const canvas = canvasRef?.current;

    if (!canvas || initialized.current) return;

    if (!isClipRecorderActive()) {
      initialized.current = initClipRecorder(canvas);
    } else {
      initialized.current = true;
    }

    return () => {
      initialized.current = false;
    };
  }, [canvasRef]);
}
