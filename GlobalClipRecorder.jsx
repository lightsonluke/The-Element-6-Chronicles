import React, { useEffect, useRef } from 'react';
import { initClipRecorder, saveClip, stopClipRecorder, isClipRecorderActive } from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function showToast(message) {
  const old = document.getElementById('clip-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.id = 'clip-toast';
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}

function findGameCanvas() {
  const matchCanvas = document.querySelector('canvas.el6-match-canvas');
  if (matchCanvas) {
    const rect = matchCanvas.getBoundingClientRect();
    const style = getComputedStyle(matchCanvas);
    if (rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0) {
      return matchCanvas;
    }
  }

  // Fallback for older builds that did not have the match-canvas class.
  const visible = [...document.querySelectorAll('canvas')].filter(canvas => {
    const rect = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);
    const ratio = rect.width / Math.max(1, rect.height);
    const looksLikeGameCanvas = Math.abs(ratio - (16 / 9)) < 0.08 && canvas.width >= 800 && canvas.height >= 450;
    return looksLikeGameCanvas && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
  });
  visible.sort((a, b) => b.width * b.height - a.width * a.height);
  return visible[0] || null;
}

async function persistClip() {
  const result = await saveClip();
  if (!result?.blob) {
    showToast('CLIP RECORDING IS STARTING — TRY AGAIN IN A MOMENT');
    return false;
  }

  const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await saveClipBlob(id, result.blob, { mime: 'video/mp4', extension: 'mp4', duration: result.duration });
  await trimClips(30);

  window.dispatchEvent(new CustomEvent('clipSaved', {
    detail: { id, created: Date.now(), mime: 'video/mp4', extension: 'mp4', size: result.blob.size, duration: result.duration },
  }));

  showToast(`CLIP SAVED — ${Math.max(1, Math.round(result.duration))} SECONDS — MP4 60FPS`);
  return true;
}

export default function GlobalClipRecorder() {
  const canvasRef = useRef(null);
  const scanTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const start = () => {
      if (cancelled || isClipRecorderActive()) return;
      const canvas = findGameCanvas();
      if (!canvas) return;
      if (initClipRecorder(canvas)) {
        canvasRef.current = canvas;
        window.__e6ClipRecorderActive = true;
      }
    };

    const save = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      const target = event.target;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if (!isClipRecorderActive()) {
        const canvas = findGameCanvas();
        if (canvas) initClipRecorder(canvas);
      }
      if (!isClipRecorderActive()) return;

      // Clips are always recording during gameplay. There is deliberately no
      // settings/localStorage gate here, so a stale setting cannot produce the
      // old "not ready" behavior.
      event.preventDefault();
      event.stopPropagation();

      try {
        await persistClip();
      } catch (error) {
        console.error('[Element 6 Clips] Save failed:', error);
        showToast('CLIP SAVE FAILED');
      }
    };

    window.addEventListener('keydown', save, true);
    start();
    scanTimerRef.current = setInterval(start, 750);

    return () => {
      cancelled = true;
      window.removeEventListener('keydown', save, true);
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
      stopClipRecorder();
      canvasRef.current = null;
    };
  }, []);

  return null;
}
