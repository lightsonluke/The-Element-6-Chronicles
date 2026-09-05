import { useEffect } from 'react';
import { initClipRecorder, saveClip, stopClipRecorder } from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function showToast(message) {
  const existing = document.getElementById('clip-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'clip-toast';
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

export default function GlobalClipRecorder() {
  useEffect(() => {
    let cancelled = false;
    let currentCanvas = null;
    let timer = null;

    const findCanvas = () => {
      if (window.__e6ClipRecorderActive) return;
      const canvases = Array.from(document.querySelectorAll('canvas'))
        .filter(canvas => canvas.width > 0 && canvas.height > 0)
        .sort((a, b) => (b.width * b.height) - (a.width * a.height));
      const canvas = canvases[0];
      if (!canvas || canvas === currentCanvas) return;

      currentCanvas = canvas;
      if (initClipRecorder(canvas)) window.__e6ClipRecorderGlobal = true;
    };

    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(findCanvas, 100);
    });

    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    findCanvas();

    const onKey = async event => {
      if (window.__e6ClipRecorderActive || !window.__e6ClipRecorderGlobal) return;
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.target?.tagName === 'INPUT' || event.target?.tagName === 'TEXTAREA' || event.target?.isContentEditable) return;

      event.preventDefault();
      const result = await saveClip();
      if (!result?.blob || cancelled) {
        showToast('NO RECORDED CLIP DATA YET');
        return;
      }

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
        showToast(`CLIP SAVED — LAST ${Math.max(1, Math.round(result.duration))} SECONDS`);
      } catch (error) {
        console.error('[Element 6 Clips] Failed to persist global native clip:', error);
        showToast('CLIP SAVE FAILED');
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      if (window.__e6ClipRecorderGlobal && !window.__e6ClipRecorderActive) stopClipRecorder();
      window.__e6ClipRecorderGlobal = false;
      currentCanvas = null;
    };
  }, []);

  return null;
}
