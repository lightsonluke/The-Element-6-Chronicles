import { useEffect } from 'react';
import { initClipRecorder, saveClip, stopClipRecorder } from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

export default function GlobalClipRecorder() {
  useEffect(() => {
    let cancelled = false;
    let currentCanvas = null;
    let timer = null;

    const findCanvas = () => {
      if (window.__e6ClipRecorderActive) return;
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const canvas = canvases
        .filter(c => c.width > 0 && c.height > 0)
        .sort((a,b) => (b.width*b.height) - (a.width*a.height))[0];
      if (!canvas || canvas === currentCanvas) return;
      currentCanvas = canvas;
      try { initClipRecorder(canvas); } catch {}
    };

    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(findCanvas, 50);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    findCanvas();

    const onKey = async (e) => {
      if (window.__e6ClipRecorderActive) return;
      if (e.code !== 'Space' && e.key !== ' ') return;
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;
      e.preventDefault();
      const url = await saveClip();
      if (!url || cancelled) return;
      try {
        const blob = await fetch(url).then(x => x.blob());
        if (!blob || blob.size === 0) return;
        const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
        await saveClipBlob(id, blob);
        await trimClips(30);
        window.dispatchEvent(new CustomEvent('clipSaved', { detail: { id, created: Date.now(), mime: blob.type || 'video/webm' } }));
      } catch {} finally { try { URL.revokeObjectURL(url); } catch {} }
    };
    window.addEventListener('keydown', onKey);

    return () => { cancelled = true; observer.disconnect(); clearTimeout(timer); window.removeEventListener('keydown', onKey); if (!window.__e6ClipRecorderActive) stopClipRecorder(); currentCanvas = null; };
  }, []);
  return null;
}
