import { useEffect, useRef } from 'react';
import { initClipRecorder, saveClip, stopClipRecorder } from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function showClipToast(message = 'CLIP SAVED — LAST 30 SECONDS') {
  const existing = document.getElementById('clip-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'clip-toast';
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

async function saveCurrentClip() {
  const result = await saveClip();
  if (!result?.blob) return false;

  try {
    const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await saveClipBlob(id, result.blob, {
      mime: result.mime,
      extension: result.extension,
      duration: result.duration,
    });
    await trimClips(30);
    window.dispatchEvent(new CustomEvent('clipSaved', {
      detail: {
        id,
        created: Date.now(),
        mime: result.mime,
        extension: result.extension,
        size: result.blob.size,
        duration: result.duration,
      },
    }));
    showClipToast(`CLIP SAVED — LAST ${Math.max(1, Math.round(result.duration))} SECONDS`);
    return true;
  } catch (error) {
    console.error('[Element 6 Clips] Failed to persist native clip:', error);
    return false;
  }
}

export function useClipRecorder(canvasRef) {
  const initialized = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !initialized.current) {
      const ok = initClipRecorder(canvas);
      initialized.current = !!ok;
      if (ok) window.__e6ClipRecorderActive = true;
    }

    return () => {
      if (initialized.current) stopClipRecorder();
      initialized.current = false;
      window.__e6ClipRecorderActive = false;
    };
  }, [canvasRef]);

  useEffect(() => {
    const handler = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.target?.tagName === 'INPUT' || event.target?.tagName === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (!window.__e6ClipRecorderActive) return;

      event.preventDefault();
      const saved = await saveCurrentClip();
      if (!saved && !window.__e6ClipRecorderReady) {
        showClipToast('CLIP RECORDING IS NOT AVAILABLE IN THIS MODE.');
      } else if (!saved) {
        showClipToast('NO RECORDED CLIP DATA YET.');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
