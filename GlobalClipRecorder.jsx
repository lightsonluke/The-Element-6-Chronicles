import React, { useEffect, useRef, useState } from 'react';
import {
  initClipRecorder,
  saveClip,
  stopClipRecorder,
  isClipRecorderActive,
} from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function showToast(message) {
  const existing = document.getElementById('clip-toast');

  if (existing) existing.remove();

  const toast = document.createElement('div');

  toast.id = 'clip-toast';
  toast.textContent = message;

  toast.style.cssText =
    'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2200);
}

function clipsEnabledInSettings() {
  try {
    const raw = localStorage.getItem('element6_progress');

    if (!raw) return false;

    const progress = JSON.parse(raw);

    return progress?.settings?.enableClips === true;
  } catch {
    return false;
  }
}

function findGameCanvas() {
  const canvases = [...document.querySelectorAll('canvas')];

  const visible = canvases.filter(canvas => {
    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return false;

    const style = window.getComputedStyle(canvas);

    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number(style.opacity) === 0
    ) {
      return false;
    }

    return rect.width >= 300 && rect.height >= 250;
  });

  if (!visible.length) return null;

  // Element 6 has lots of small preview canvases.
  // Pick the largest visible canvas so we capture the actual game canvas.
  visible.sort((a, b) => {
    const aArea = a.width * a.height;
    const bArea = b.width * b.height;
    return bArea - aArea;
  });

  return visible[0];
}

export default function GlobalClipRecorder() {
  const [enabled, setEnabled] = useState(() =>
    clipsEnabledInSettings()
  );

  const busyRef = useRef(false);
  const canvasRef = useRef(null);
  const scanTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const stop = () => {
      stopClipRecorder();
      canvasRef.current = null;
    };

    const tryStart = () => {
      if (cancelled) return;

      const shouldBeEnabled = clipsEnabledInSettings();

      setEnabled(shouldBeEnabled);

      if (!shouldBeEnabled) {
        if (isClipRecorderActive()) stop();
        return;
      }

      const canvas = findGameCanvas();

      // Clips only exist while an actual gameplay canvas exists.
      if (!canvas) {
        if (isClipRecorderActive()) stop();
        return;
      }

      // Already recording the correct canvas.
      if (
        isClipRecorderActive() &&
        canvasRef.current === canvas
      ) {
        return;
      }

      // A new game canvas appeared.
      if (isClipRecorderActive()) {
        stop();
      }

      const ok = initClipRecorder(canvas);

      if (!ok) {
        showToast('COULD NOT START GAME CLIP RECORDING');
        return;
      }

      canvasRef.current = canvas;

      showToast(
        'GAME CLIPS ENABLED — PRESS SPACE TO SAVE'
      );
    };

    const save = async event => {
      if (
        event.code !== 'Space' &&
        event.key !== ' '
      ) {
        return;
      }

      if (
        event.target?.tagName === 'INPUT' ||
        event.target?.tagName === 'TEXTAREA' ||
        event.target?.isContentEditable
      ) {
        return;
      }

      if (!isClipRecorderActive()) return;

      // Do NOT use a global busy lock.
      // Multiple clip saves are intentionally allowed to overlap.
      if (!clipsEnabledInSettings()) return;

      event.preventDefault();
      event.stopPropagation();

      try {
        const result = await saveClip();

        if (!result?.blob) {
          showToast('CLIP COULD NOT BE CREATED');
          return;
        }

        const id =
          `clip_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

        await saveClipBlob(id, result.blob, {
          mime: result.mime,
          extension: result.extension,
          duration: result.duration,
        });

        await trimClips(30);

        const created = Date.now();

        window.dispatchEvent(
          new CustomEvent('clipSaved', {
            detail: {
              id,
              created,
              mime: result.mime,
              extension: result.extension,
              size: result.blob.size,
              duration: result.duration,
            },
          })
        );

        showToast(
          `CLIP SAVED — ${Math.max(
            1,
            Math.round(result.duration)
          )} SECONDS`
        );
      } catch (error) {
        console.error(
          '[Element 6 Clips] Failed to save clip:',
          error
        );

        showToast('CLIP SAVE FAILED');
      }
    };

    const settingsChanged = () => {
      tryStart();
    };

    window.addEventListener(
      'element6-settings-changed',
      settingsChanged
    );

    window.addEventListener(
      'keydown',
      save,
      true
    );

    // Check for gameplay canvases appearing/disappearing.
    scanTimerRef.current = setInterval(
      tryStart,
      750
    );

    tryStart();

    return () => {
      cancelled = true;

      window.removeEventListener(
        'element6-settings-changed',
        settingsChanged
      );

      window.removeEventListener(
        'keydown',
        save,
        true
      );

      if (scanTimerRef.current) {
        clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
      }

      stop();
    };
  }, []);

  return null;
}
