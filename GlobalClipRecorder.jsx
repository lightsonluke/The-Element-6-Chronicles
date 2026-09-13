import React, { useEffect, useRef } from 'react';
import { initClipRecorder, saveClip, stopClipRecorder, isClipRecorderActive, getClipRecordingCanvas } from './clipRecorder.js';
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

function clipsEnabled() {
  try {
    const raw = localStorage.getItem('element6_progress');
    return JSON.parse(raw || '{}')?.settings?.enableClips === true;
  } catch {
    return false;
  }
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

  const visible = [...document.querySelectorAll('canvas')].filter(canvas => {
    const rect = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);
    const ratio = rect.width / Math.max(1, rect.height);
    return Math.abs(ratio - (16 / 9)) < 0.08 && canvas.width >= 800 && canvas.height >= 450 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
  });
  visible.sort((a, b) => b.width * b.height - a.width * a.height);
  return visible[0] || null;
}

async function persistClip() {
  const result = await saveClip();
  if (!result?.blob) {
    showToast('CLIP COULD NOT BE SAVED — RECORDER RECOVERING');
    return false;
  }

  const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await saveClipBlob(id, result.blob, {
    mime: 'video/mp4',
    extension: 'mp4',
    duration: result.duration,
  });
  await trimClips(30);

  window.dispatchEvent(new CustomEvent('clipSaved', {
    detail: {
      id,
      created: Date.now(),
      mime: 'video/mp4',
      extension: 'mp4',
      size: result.blob.size,
      duration: result.duration,
    },
  }));

  showToast(`CLIP SAVED — ${Math.max(1, Math.round(result.duration))} SECONDS — MP4 60FPS`);
  return true;
}

export default function GlobalClipRecorder() {
  const scanTimerRef = useRef(null);
  const saveRequestsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const syncRecorder = () => {
      if (cancelled) return;

      if (!clipsEnabled()) {
        if (isClipRecorderActive()) stopClipRecorder();
        return;
      }

      const canvas = findGameCanvas();
      if (!canvas) return;

      const current = getClipRecordingCanvas();
      // When React replaces the match canvas, move the recorder to the new
      // canvas instead of leaving it attached to a detached old canvas.
      if (isClipRecorderActive() && current === canvas) return;
      if (isClipRecorderActive() && current !== canvas) stopClipRecorder();

      initClipRecorder(canvas);
    };

    const onSettingsChanged = event => {
      const enabled = event?.detail?.enableClips === true;
      if (!enabled) {
        stopClipRecorder();
      } else {
        syncRecorder();
      }
    };

    const save = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      const target = event.target;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if (!clipsEnabled() || !isClipRecorderActive()) return;

      event.preventDefault();
      event.stopPropagation();
      saveRequestsRef.current += 1;
      try {
        await persistClip();
      } catch (error) {
        console.error('[Element 6 Clips] Save failed:', error);
        showToast('CLIP SAVE FAILED');
      }
    };

    window.addEventListener('element6-settings-changed', onSettingsChanged);
    window.addEventListener('keydown', save, true);

    syncRecorder();
    scanTimerRef.current = setInterval(syncRecorder, 500);

    return () => {
      cancelled = true;
      window.removeEventListener('element6-settings-changed', onSettingsChanged);
      window.removeEventListener('keydown', save, true);
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
      stopClipRecorder();
    };
  }, []);

  return null;
}
