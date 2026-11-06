import React, { useEffect, useRef } from 'react';
import {
  initClipRecorder,
  saveClip,
  stopClipRecorder,
  isClipRecorderActive,
  setClipRecorderPaused
} from './clipRecorder.js';
import { saveClipBlob } from './clipStorage.js';

function showToast(message) {
  const old = document.getElementById('clip-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'clip-toast';
  toast.className = 'e6-clip-toast';
  toast.textContent = message;
  toast.style.cssText =
    'position:fixed;top:18px;right:18px;z-index:99999;pointer-events:none;';
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2400);
}

function findGameCanvas() {
  const candidates = [
    ...document.querySelectorAll('canvas[data-e6-game-canvas="true"]')
  ];
  const visible = candidates.filter(canvas => {
    const rect = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);
    return rect.width > 0 && rect.height > 0 &&
      style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
  });
  visible.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return visible[0] || null;
}

async function persistClip() {
  const result = await saveClip();

  if (!result?.blob || result.blob.size < 128) {
    showToast('CLIP IS NOT READY YET — TRY AGAIN IN A MOMENT');
    return false;
  }

  const id = `clip_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  await saveClipBlob(id, result.blob, {
    mime: result.mime || result.blob.type || 'video/webm',
    extension: result.extension || 'webm',
    duration: result.duration,
    previewBlob: result.previewBlob || null
  });

  window.dispatchEvent(
    new CustomEvent('clipSaved', {
      detail: {
        id,
        created: Date.now(),
        mime: result.mime || result.blob.type || 'video/webm',
        extension: result.extension || 'webm',
        size: result.blob.size,
        duration: result.duration
      }
    })
  );

  showToast(
    `CLIP SAVED — ${Math.max(1, Math.round(result.duration))} SECONDS — ${String(result.extension || 'webm').toUpperCase()} 60FPS`
  );

  return true;
}

export default function GlobalClipRecorder({ enabled = false } = {}) {
  const canvasRef = useRef(null);
  const scanTimerRef = useRef(null);
  const savingRef = useRef(false);

  // Clip saving is an explicit action. Keep this handler mounted even when
  // recording is disabled so the pause-menu button can explain how to enable it.
  useEffect(() => {
    const requestSave = async () => {
      if (savingRef.current) return;
      if (!enabled) {
        showToast('TURN ON ENABLE CLIPS IN SETTINGS TO SAVE GAMEPLAY');
        return;
      }
      if (!isClipRecorderActive()) {
        showToast('NO RECENT GAMEPLAY IS AVAILABLE TO SAVE');
        return;
      }

      savingRef.current = true;
      try {
        await persistClip();
      } catch (error) {
        console.error('[Element 6 Clips] Save failed:', error);
        showToast(error?.name === 'QuotaExceededError'
          ? 'CLIP NOT SAVED — LOCAL STORAGE IS FULL; EXISTING FILES WERE KEPT'
          : 'CLIP NOT SAVED — SOURCE BUFFER RETAINED, TRY AGAIN');
      } finally {
        savingRef.current = false;
      }
    };
    const onRequest = () => { void requestSave(); };
    const onKeyDown = event => {
      if (event.code !== 'F8' || !window.__el6GameplayCaptureActive) return;
      const target = event.target;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      event.preventDefault();
      event.stopPropagation();
      onRequest();
    };

    window.addEventListener('el6-save-clip', onRequest);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('el6-save-clip', onRequest);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      stopClipRecorder();
      canvasRef.current = null;
      return undefined;
    }
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      // Capture only after the renderer explicitly confirms live gameplay.
      // A mounted canvas alone can also belong to setup, preview, or results UI.
      if (window.__el6GameplayCaptureActive !== true) {
        stopClipRecorder();
        canvasRef.current = null;
        return;
      }
      const canvas = findGameCanvas();
      if (!canvas) {
        stopClipRecorder();
        canvasRef.current = null;
        return;
      }
      // Prematch animation canvases are deliberately not marked as match canvases.
      // Once the real sport/BR canvas mounts, switch the recorder to it automatically.
      if (canvasRef.current === canvas && isClipRecorderActive()) return;
      if (initClipRecorder(canvas)) {
        canvasRef.current = canvas;
        window.__e6ClipRecorderActive = true;
        syncPauseState();
      }
    };

    const syncPauseState = () => {
      const pauseLayer = document.querySelector('.el6-pause-overlay-layer, .el6-global-pause-layer');
      const onlinePause = document.querySelector('.el6-pause-overlay-layer[data-match-continues="true"]');
      const pauseOpen = Boolean(
        (pauseLayer && !onlinePause) ||
        document.querySelector('[data-game-paused="true"]')
      );
      setClipRecorderPaused(pauseOpen);
    };

    const pauseObserver = new MutationObserver(() => {
      syncPauseState();
      // Stop on a result/exit render immediately; the interval remains as a
      // fallback for renderers whose lifecycle flag changes without DOM work.
      if (window.__el6GameplayCaptureActive !== true) start();
    });
    pauseObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-state', 'data-game-paused']
    });

    start();
    // The active-scene contract can change without a DOM mutation, so poll it
    // promptly to keep transitions and result screens out of recordings.
    scanTimerRef.current = setInterval(start, 100);

    return () => {
      cancelled = true;
      pauseObserver.disconnect();

      if (scanTimerRef.current) {
        clearInterval(scanTimerRef.current);
      }

      scanTimerRef.current = null;
      stopClipRecorder();
      canvasRef.current = null;
    };
  }, [enabled]);

  return null;
}
