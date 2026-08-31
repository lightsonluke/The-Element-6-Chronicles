import { useEffect, useRef } from 'react';
import { initClipRecorder, saveClip, stopClipRecorder } from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

// Shows a small "You saved a clip!" toast in the top-right corner.
function showClipToast() {
  const existing = document.getElementById('clip-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'clip-toast';
  t.textContent = '🎬 You saved a clip!';
  t.style.cssText = 'position:fixed;top:18px;right:18px;z-index:9999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron, sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.5);pointer-events:none;transition:opacity 0.4s;opacity:1;';
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 450); }, 2000);
}

// Attaches to a canvas ref. Pressing SPACE saves the last ~10s as a clip
// (stored in IndexedDB) and dispatches a 'clipSaved' CustomEvent with { id, created }.
export function useClipRecorder(canvasRef) {
  const initialized = useRef(false);

  useEffect(() => {
    if (canvasRef.current && !initialized.current) {
      initClipRecorder(canvasRef.current);
      window.__e6ClipRecorderActive = true;
      initialized.current = true;
    }
    return () => { stopClipRecorder(); initialized.current = false; window.__e6ClipRecorderActive = false; };
  }, [canvasRef]);

  useEffect(() => {
    const handler = async (e) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;
      e.preventDefault();
      const url = await saveClip();
      if (!url) return;
      try {
        const blob = await fetch(url).then(r => r.blob());
        // Only keep clips that actually recorded something
        if (!blob || blob.size === 0) return;
        const id = `clip_${Date.now()}`;
        await saveClipBlob(id, blob);
        await trimClips(30);
        window.dispatchEvent(new CustomEvent('clipSaved', { detail: { id, created: Date.now(), mime: blob.type || 'video/webm' } }));
        showClipToast();
      } catch {}
      finally {
        // free the temporary recorder URL
        try { URL.revokeObjectURL(url); } catch {}
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}