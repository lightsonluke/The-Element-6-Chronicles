import React, { useEffect, useRef } from 'react';
import {
  initClipRecorder,
  saveClip,
  stopClipRecorder,
  isClipRecorderActive,
  getClipRecordingCanvas
} from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function toast(message) {
  const old = document.getElementById('clip-toast');
  if (old) old.remove();

  const node = document.createElement('div');
  node.id = 'clip-toast';
  node.textContent = message;
  node.style.cssText =
    'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2500);
}

function findGameCanvas() {
  const canvases = [...document.querySelectorAll('canvas')];

  const visible = canvases.filter(canvas => {
    const rect = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);

    return (
      rect.width >= 300 &&
      rect.height >= 250 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) !== 0
    );
  });

  visible.sort((a, b) =>
    (b.width * b.height) - (a.width * a.height)
  );

  return visible[0] || null;
}

async function persistClip() {
  const result = await saveClip();

  if (!result?.blob) {
    toast('CLIP IS STILL BEING FINALIZED — TRY AGAIN IN A MOMENT');
    return;
  }

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

  toast(`CLIP SAVED — ${Math.max(1, Math.round(result.duration))} SECONDS — MP4 60FPS`);
}

export default function GlobalClipRecorder() {
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const savingRef = useRef(false);

  useEffect(() => {
    const check = () => {
      const canvas = findGameCanvas();

      if (!canvas) return;

      if (isClipRecorderActive() && getClipRecordingCanvas() === canvas) {
        canvasRef.current = canvas;
        return;
      }

      // Do not restart a healthy recorder merely because React rendered a new
      // component. Only initialize when no recorder exists.
      if (!isClipRecorderActive()) {
        const ok = initClipRecorder(canvas);
        if (ok) {
          canvasRef.current = canvas;
          window.__e6ClipRecorderActive = true;
        }
      }
    };

    check();
    timerRef.current = setInterval(check, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Global recorder intentionally remains alive across Victory/Match Facts
      // component transitions. It is stopped only by app teardown/unmount.
    };
  }, []);

  useEffect(() => {
    const onKey = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;

      const target = event.target;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) return;

      if (!isClipRecorderActive() || savingRef.current) return;

      event.preventDefault();
      savingRef.current = true;

      try {
        await persistClip();
      } catch (error) {
        console.error('[Element 6 Clips] Save failed:', error);
        toast('CLIP SAVE FAILED');
      } finally {
        savingRef.current = false;
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  return null;
}
