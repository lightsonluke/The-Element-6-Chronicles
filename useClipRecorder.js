import { useEffect, useRef } from 'react';
import {
  initClipRecorder,
  saveClip,
  stopClipRecorder,
  isClipRecorderActive,
  getClipRecordingCanvas
} from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function showClipToast(message) {
  const old = document.getElementById('clip-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'clip-toast';
  toast.textContent = message;
  toast.style.cssText =
    'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

async function saveCurrentClip() {
  const result = await saveClip();

  if (!result?.blob) {
    showClipToast('CLIP IS STILL BEING FINALIZED — TRY AGAIN IN A MOMENT');
    return false;
  }

  try {
    const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await saveClipBlob(id, result.blob, {
      mime: 'video/mp4',
      extension: 'mp4',
      duration: result.duration
    });

    await trimClips(30);

    window.dispatchEvent(new CustomEvent('clipSaved', {
      detail: {
        id,
        created: Date.now(),
        mime: 'video/mp4',
        extension: 'mp4',
        size: result.blob.size,
        duration: result.duration
      }
    }));

    showClipToast(`CLIP SAVED — ${Math.max(1, Math.round(result.duration))} SECONDS — MP4 60FPS`);
    return true;
  } catch (error) {
    console.error('[Element 6 Clips] Failed to persist MP4:', error);
    showClipToast('CLIP SAVE FAILED');
    return false;
  }
}

export function useClipRecorder(canvasRef) {
  const initialized = useRef(false);
  const ownsRecorder = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initialized.current) return undefined;

    if (isClipRecorderActive() && getClipRecordingCanvas() === canvas) {
      initialized.current = true;
      ownsRecorder.current = false;
      window.__e6ClipRecorderActive = true;
    } else {
      const ok = initClipRecorder(canvas);
      initialized.current = !!ok;
      ownsRecorder.current = !!ok;
      if (ok) window.__e6ClipRecorderActive = true;
    }

    return () => {
      if (ownsRecorder.current) stopClipRecorder();
      initialized.current = false;
      ownsRecorder.current = false;
      if (!isClipRecorderActive()) {
        window.__e6ClipRecorderActive = false;
      }
    };
  }, [canvasRef]);

  useEffect(() => {
    const handler = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;

      const target = event.target;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) return;

      if (!window.__e6ClipRecorderActive) return;

      event.preventDefault();
      await saveCurrentClip();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
