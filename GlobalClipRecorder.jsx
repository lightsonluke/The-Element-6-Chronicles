import { useEffect } from 'react';
import { initClipRecorder, saveClip, stopClipRecorder, isClipRecorderActive } from './clipRecorder.js';
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
    let scanTimer = null;
    let rebindTimer = null;

    const findBestCanvas = () => {
      const canvases = Array.from(document.querySelectorAll('canvas'))
        .filter(canvas => canvas.isConnected && canvas.width > 0 && canvas.height > 0)
        .sort((a, b) => (b.width * b.height) - (a.width * a.height));
      return canvases[0] || null;
    };

    const bindCanvas = () => {
      if (cancelled) return;
      const canvas = findBestCanvas();

      if (!canvas) {
        if (currentCanvas && isClipRecorderActive()) stopClipRecorder();
        currentCanvas = null;
        window.__e6ClipRecorderGlobal = false;
        return;
      }

      // The previous implementation refused to rebind while a recorder was
      // active. That left the recorder attached to a destroyed game's canvas
      // after navigation, so later clips were blank/stale. Rebind whenever
      // the active canvas changes or is disconnected from the document.
      if (canvas === currentCanvas && isClipRecorderActive()) return;

      if (currentCanvas && canvas !== currentCanvas) {
        try { stopClipRecorder(); } catch {}
      }

      currentCanvas = canvas;
      const ok = initClipRecorder(canvas);
      window.__e6ClipRecorderGlobal = !!ok;
      if (!ok) currentCanvas = null;
    };

    const scheduleBind = (delay = 80) => {
      clearTimeout(scanTimer);
      scanTimer = setTimeout(bindCanvas, delay);
    };

    const observer = new MutationObserver(() => scheduleBind(100));
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });

    bindCanvas();
    rebindTimer = setInterval(() => {
      if (!currentCanvas || !currentCanvas.isConnected || !isClipRecorderActive()) scheduleBind(0);
    }, 500);

    const onKey = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.target?.tagName === 'INPUT' || event.target?.tagName === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (!window.__e6ClipRecorderGlobal || !isClipRecorderActive()) return;

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
        showToast(`CLIP SAVED — ${Math.max(1, Math.round(result.duration))} SECONDS`);
      } catch (error) {
        console.error('[Element 6 Clips] Failed to persist global native clip:', error);
        showToast('CLIP SAVE FAILED');
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(scanTimer);
      clearInterval(rebindTimer);
      clearTimeout(rebindTimer);
      window.removeEventListener('keydown', onKey);
      if (window.__e6ClipRecorderGlobal) {
        try { stopClipRecorder(); } catch {}
      }
      window.__e6ClipRecorderGlobal = false;
      currentCanvas = null;
    };
  }, []);

  return null;
}
