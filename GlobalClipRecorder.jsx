import React, { useEffect, useRef } from 'react';
import {
  initClipRecorder,
  saveClip,
  stopClipRecorder,
  isClipRecorderActive,
} from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function showToast(message) {
  const old = document.getElementById('clip-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'clip-toast';
  toast.textContent = message;
  toast.style.cssText =
    'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}

function clipsEnabled() {
  try {
    const raw = localStorage.getItem('element6_progress');
    if (!raw) return false;
    return JSON.parse(raw)?.settings?.enableClips === true;
  } catch {
    return false;
  }
}

function findGameCanvas() {
  const candidates = [...document.querySelectorAll('canvas')].filter(canvas => {
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

  candidates.sort(
    (a, b) => b.width * b.height - a.width * a.height
  );

  return candidates[0] || null;
}

async function persistClip() {
  const result = await saveClip();
  if (!result?.blob) {
    showToast('CLIP IS NOT READY YET');
    return false;
  }

  const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await saveClipBlob(id, result.blob, {
    mime: 'video/mp4',
    extension: 'mp4',
    duration: result.duration,
  });

  await trimClips(30);

  window.dispatchEvent(
    new CustomEvent('clipSaved', {
      detail: {
        id,
        created: Date.now(),
        mime: 'video/mp4',
        extension: 'mp4',
        size: result.blob.size,
        duration: result.duration,
      },
    })
  );

  showToast(
    `CLIP SAVED — ${Math.max(1, Math.round(result.duration))}s — MP4 60FPS`
  );

  return true;
}

export default function GlobalClipRecorder() {
  const scanRef = useRef(null);
  const saveCountRef = useRef(0);

  useEffect(() => {
    const startIfPossible = () => {
      if (!clipsEnabled()) {
        if (isClipRecorderActive()) stopClipRecorder();
        return;
      }

      if (isClipRecorderActive()) return;

      const canvas = findGameCanvas();
      if (!canvas) return;

      if (initClipRecorder(canvas)) {
        window.__e6ClipRecorderActive = true;
      }
    };

    const onSettings = () => startIfPossible();

    const onKeyDown = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;

      const target = event.target;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) return;

      if (!clipsEnabled() || !isClipRecorderActive()) return;

      event.preventDefault();
      event.stopPropagation();

      // No global save lock: conversions are queued in clipRecorder.js,
      // while recording continues.
      saveCountRef.current += 1;

      try {
        await persistClip();
      } catch (error) {
        console.error('[Element 6 Clips] Save failed:', error);
        showToast('CLIP SAVE FAILED');
      }
    };

    window.addEventListener('element6-settings-changed', onSettings);
    window.addEventListener('keydown', onKeyDown, true);

    startIfPossible();
    scanRef.current = setInterval(startIfPossible, 750);

    return () => {
      window.removeEventListener('element6-settings-changed', onSettings);
      window.removeEventListener('keydown', onKeyDown, true);
      if (scanRef.current) clearInterval(scanRef.current);
      scanRef.current = null;

      // Global component teardown stops recording normally.
      stopClipRecorder();
    };
  }, []);

  return null;
}
