import React, { useEffect, useRef } from 'react';
import {
  initClipRecorder,
  saveClip,
  stopClipRecorder,
  isClipRecorderActive,
  getClipRecordingCanvas,
} from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function showToast(message) {
  const old = document.getElementById('clip-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'clip-toast';
  toast.textContent = message;
  toast.style.cssText =
    'position:fixed;top:18px;right:18px;z-index:99999;' +
    'background:#FFD700;color:#1a1030;padding:10px 18px;' +
    'border-radius:10px;font:bold 15px Orbitron,sans-serif;' +
    'box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function findGameCanvas() {
  const canvases = [...document.querySelectorAll('canvas')];
  const visible = canvases.filter(canvas => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;

    const style = window.getComputedStyle(canvas);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      return false;
    }

    return rect.width >= 300 && rect.height >= 250;
  });

  visible.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return visible[0] || null;
}

export default function GlobalClipRecorder() {
  const canvasRef = useRef(null);
  const scanTimer = useRef(null);
  const ownsRecorder = useRef(false);
  const saveInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const stop = () => {
      if (ownsRecorder.current) stopClipRecorder();
      ownsRecorder.current = false;
      canvasRef.current = null;
    };

    const startIfNeeded = () => {
      if (cancelled) return;

      const canvas = findGameCanvas();
      if (!canvas) return;

      if (isClipRecorderActive() && getClipRecordingCanvas() === canvas) {
        canvasRef.current = canvas;
        return;
      }

      if (isClipRecorderActive()) stop();

      const ok = initClipRecorder(canvas);
      if (!ok) {
        window.__e6ClipRecorderActive = false;
        window.__e6ClipRecorderReady = false;
        return;
      }

      canvasRef.current = canvas;
      ownsRecorder.current = true;
      showToast('CLIPS READY — PRESS SPACE TO SAVE');
    };

    const save = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.target?.tagName === 'INPUT' || event.target?.tagName === 'TEXTAREA' || event.target?.isContentEditable) return;

      // Space is the clip hotkey only while the recorder is active.
      if (!isClipRecorderActive()) return;

      event.preventDefault();
      event.stopPropagation();
      if (saveInFlight.current) return;
      saveInFlight.current = true;

      try {
        const result = await saveClip();
        if (!result?.blob) {
          showToast('CLIP BUFFER IS NOT READY YET');
          return;
        }

        const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
        console.error('[Element 6 Clips] Save failed:', error);
        showToast('CLIP SAVE FAILED');
      } finally {
        saveInFlight.current = false;
      }
    };

    window.addEventListener('keydown', save, true);
    scanTimer.current = setInterval(startIfNeeded, 500);
    startIfNeeded();

    return () => {
      cancelled = true;
      window.removeEventListener('keydown', save, true);
      if (scanTimer.current) {
        clearInterval(scanTimer.current);
        scanTimer.current = null;
      }
      stop();
    };
  }, []);

  return null;
}
