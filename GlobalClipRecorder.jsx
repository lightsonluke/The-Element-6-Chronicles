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
  toast.style.cssText = 'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function findGameCanvas() {
  const canvases = [...document.querySelectorAll('canvas')];
  const visible = canvases.filter(canvas => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const style = window.getComputedStyle(canvas);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
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

    const startOrFollowCanvas = () => {
      if (cancelled) return;
      const canvas = findGameCanvas();
      if (!canvas) return;

      if (isClipRecorderActive() && getClipRecordingCanvas() === canvas) {
        canvasRef.current = canvas;
        return;
      }

      // When the game changes canvases, clipRecorder.js preserves one complete
      // MP4 window from the old canvas while starting the new canvas. This is
      // what keeps the previous match available on Victory / Match Facts.
      const ok = initClipRecorder(canvas);
      if (!ok) {
        window.__e6ClipRecorderActive = false;
        window.__e6ClipRecorderReady = false;
        return;
      }

      canvasRef.current = canvas;
      ownsRecorder.current = true;

      if (!window.__e6ClipRecorderToastShown) {
        window.__e6ClipRecorderToastShown = true;
        showToast('CLIPS READY — MP4 60 FPS — PRESS SPACE');
      }
    };

    const save = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.target?.tagName === 'INPUT' || event.target?.tagName === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (!isClipRecorderActive() || saveInFlight.current) return;

      event.preventDefault();
      event.stopPropagation();
      saveInFlight.current = true;

      try {
        const result = await saveClip();
        if (!result?.blob) {
          showToast('NO COMPLETE MP4 CLIP IS READY YET');
          return;
        }

        // saveClip() returns a COMPLETE MediaRecorder MP4 session. Do not
        // change its bytes or MIME type here; doing so can corrupt the file.
        if (String(result.mime || '').toLowerCase().indexOf('video/mp4') !== 0) {
          throw new Error(`Recorder returned unsupported MIME: ${result.mime}`);
        }

        const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        await saveClipBlob(id, result.blob, {
          mime: result.mime,
          extension: 'mp4',
          duration: result.duration,
        });
        await trimClips(30);

        const created = Date.now();
        window.dispatchEvent(new CustomEvent('clipSaved', {
          detail: {
            id,
            created,
            mime: result.mime,
            extension: 'mp4',
            size: result.blob.size,
            duration: result.duration,
          },
        }));

        showToast(`CLIP SAVED — ${Math.max(1, Math.round(result.duration))} SECONDS — MP4 60 FPS`);
      } catch (error) {
        console.error('[Element 6 Clips] Save failed:', error);
        showToast('CLIP SAVE FAILED — MP4 RECORDING ERROR');
      } finally {
        saveInFlight.current = false;
      }
    };

    window.addEventListener('keydown', save, true);
    scanTimer.current = setInterval(startOrFollowCanvas, 500);
    startOrFollowCanvas();

    return () => {
      cancelled = true;
      window.removeEventListener('keydown', save, true);
      if (scanTimer.current) clearInterval(scanTimer.current);
      scanTimer.current = null;
      if (ownsRecorder.current) stopClipRecorder();
      ownsRecorder.current = false;
      canvasRef.current = null;
    };
  }, []);

  return null;
}
