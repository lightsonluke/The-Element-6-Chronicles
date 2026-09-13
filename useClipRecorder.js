import { useEffect, useRef } from 'react';
import {
  initClipRecorder,
  saveClip,
  isClipRecorderActive,
} from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function toast(message) {
  const old = document.getElementById('clip-toast');
  if (old) old.remove();
  const node = document.createElement('div');
  node.id = 'clip-toast';
  node.textContent = message;
  node.style.cssText =
    'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;pointer-events:none;';
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2400);
}

export function useClipRecorder(canvasRef) {
  const initialized = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initialized.current) return;

    if (isClipRecorderActive()) {
      initialized.current = true;
      return;
    }

    initialized.current = initClipRecorder(canvas);

    return () => {
      // The global recorder owns the recording lifecycle. Do not let a
      // gameplay component unmount kill a recording during Victory/Match Facts.
      initialized.current = false;
    };
  }, [canvasRef]);


}
