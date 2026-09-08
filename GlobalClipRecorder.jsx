import React, { useEffect, useState } from 'react';
import { initClipRecorder, saveClip, stopClipRecorder, isClipRecorderActive } from './clipRecorder.js';
import { saveClipBlob, trimClips } from './clipStorage.js';

function showToast(message) {
  const existing = document.getElementById('clip-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'clip-toast';
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;top:18px;right:18px;z-index:99999;background:#FFD700;color:#1a1030;padding:10px 18px;border-radius:10px;font:bold 15px Orbitron,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

export default function GlobalClipRecorder() {
  const [enabled, setEnabled] = useState(() => !!window.__e6ClipRecorderActive);
  const [busy, setBusy] = useState(false);
  const busyRef = React.useRef(false);

  useEffect(() => {
    let cancelled = false;
    let currentStream = null;

    const enable = async () => {
      if (isClipRecorderActive()) {
        setEnabled(true);
        return;
      }
      if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
        showToast('CLIP RECORDING IS NOT SUPPORTED IN THIS BROWSER');
        return;
      }

      try {
        // The browser will ask the user what to capture. Choose the Element 6
        // tab/window so recording follows the app across every screen.
        const capture = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30, max: 30 } },
          audio: true,
        });

        if (cancelled) {
          capture.getTracks().forEach(track => track.stop());
          return;
        }

        currentStream = capture;
        const ok = initClipRecorder(capture);
        if (!ok) {
          capture.getTracks().forEach(track => track.stop());
          showToast('COULD NOT START CLIP RECORDING');
          return;
        }

        const videoTrack = capture.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            stopClipRecorder();
            if (!cancelled) {
              setEnabled(false);
              showToast('CLIP RECORDING STOPPED');
            }
          }, { once: true });
        }

        setEnabled(true);
        showToast('CLIP RECORDING ENABLED — PRESS SPACE TO CLIP');
      } catch (error) {
        console.warn('[Element 6 Clips] Screen capture was not started:', error);
        showToast('CLIP RECORDING WAS NOT ENABLED');
      }
    };

    const save = async event => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.target?.tagName === 'INPUT' || event.target?.tagName === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (!isClipRecorderActive() || busyRef.current) return;

      // Space is also a gameplay key in some modes. The recorder owns it only
      // when the browser has active clip recording enabled.
      event.preventDefault();
      event.stopPropagation();

      busyRef.current = true;
      setBusy(true);
      try {
        const result = await saveClip();
        if (!result?.blob) {
          showToast('WAIT A MOMENT — NO 30-SECOND CLIP IS READY YET');
          return;
        }

        const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await saveClipBlob(id, result.blob, {
          mime: result.mime,
          extension: result.extension,
          duration: result.duration,
        });
        await trimClips(30);

        const created = Date.now();
        window.dispatchEvent(new CustomEvent('clipSaved', {
          detail: {
            id,
            created,
            mime: result.mime,
            extension: result.extension,
            size: result.blob.size,
            duration: result.duration,
          },
        }));
        showToast(`CLIP SAVED — ${Math.max(1, Math.round(result.duration))} SECONDS`);
      } catch (error) {
        console.error('[Element 6 Clips] Failed to save clip:', error);
        showToast('CLIP SAVE FAILED');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    };

    const enableEvent = () => { enable(); };
    window.addEventListener('element6-enable-clips', enableEvent);
    window.addEventListener('keydown', save, true);

    return () => {
      cancelled = true;
      window.removeEventListener('element6-enable-clips', enableEvent);
      window.removeEventListener('keydown', save, true);
      if (currentStream && !window.__e6ClipRecorderActive) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (enabled || isClipRecorderActive()) return null;

  return (
    <button
      type="button"
      onClick={() => {
        // Reuse the exact same user gesture so getDisplayMedia is allowed by
        // the browser's security model.
        const event = new Event('element6-enable-clips');
        window.dispatchEvent(event);
      }}
      className="fixed bottom-4 right-4 z-[99998] px-4 py-3 rounded-xl bg-accent text-accent-foreground font-heading text-xs shadow-xl hover:opacity-90"
      title="Enable the always-on last-30-seconds clip recorder"
    >
      🎬 ENABLE CLIPS
    </button>
  );
}
