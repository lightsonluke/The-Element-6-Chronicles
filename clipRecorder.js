// Element 6 native game-canvas clip recorder.
//
// IMPORTANT:
// - NEVER uses getDisplayMedia()
// - NEVER captures the browser window/tab
// - Captures only the Element 6 gameplay canvas
// - Uses overlapping MediaRecorder sessions
// - No clip-save cooldown
// - Multiple clip requests can overlap
//
// HTMLCanvasElement.captureStream() provides a MediaStream containing the
// canvas's rendered frames, which MediaRecorder can record. :contentReference[oaicite:1]{index=1}

let sourceCanvas = null;
let sourceStream = null;
let recording = false;
let clipMime = '';
let saveSequence = 0;

const FPS = 30;
const CLIP_SECONDS = 30;
const CLIP_MS = CLIP_SECONDS * 1000;

// Six overlapping recorders.
// A new recorder starts every 5 seconds, and each one records for 30 seconds.
// This means there is always a recorder covering approximately the previous
// 30 seconds once the initial 30-second warmup has completed.
const SLOT_COUNT = 6;
const SLOT_INTERVAL_MS = 5000;

const VIDEO_BITRATE = 2500000;

const slots = new Map();

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function getCandidateMimes() {
  const candidates = [
    '',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
    'video/mp4;codecs=avc1',
  ];

  return candidates.filter((type, index) => {
    if (candidates.indexOf(type) !== index) return false;
    if (!type) return true;

    try {
      return !!window.MediaRecorder?.isTypeSupported?.(type);
    } catch {
      return false;
    }
  });
}

function createRecorder(stream) {
  if (!stream || !window.MediaRecorder) return null;

  let lastError = null;

  for (const mime of getCandidateMimes()) {
    try {
      const options = {
        videoBitsPerSecond: VIDEO_BITRATE,
      };

      if (mime) options.mimeType = mime;

      return new MediaRecorder(stream, options);
    } catch (error) {
      lastError = error;
    }
  }

  console.error('[Element 6 Clips] Could not create MediaRecorder:', lastError);
  return null;
}

function waitForRecorderStop(recorder) {
  return new Promise(resolve => {
    if (!recorder || recorder.state === 'inactive') {
      resolve();
      return;
    }

    const previousStop = recorder.onstop;

    recorder.onstop = event => {
      try {
        previousStop?.(event);
      } catch {}

      resolve();
    };

    try {
      recorder.stop();
    } catch {
      resolve();
    }
  });
}

function validateBlob(blob) {
  if (!blob || blob.size < 1000) {
    return Promise.resolve({
      ok: false,
      duration: 0,
      reason: 'empty recording',
    });
  }

  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(blob);
    let finished = false;
    let timeout = null;

    const finish = result => {
      if (finished) return;

      finished = true;

      if (timeout) clearTimeout(timeout);

      try {
        video.pause();
      } catch {}

      try {
        video.removeAttribute('src');
        video.load();
      } catch {}

      try {
        URL.revokeObjectURL(url);
      } catch {}

      resolve(result);
    };

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    video.onerror = () => {
      finish({
        ok: false,
        duration: 0,
        reason: video.error?.message || 'video decode error',
      });
    };

    video.onloadedmetadata = async () => {
      const duration = Number(video.duration);

      if (!Number.isFinite(duration) || duration <= 0) {
        finish({
          ok: false,
          duration: 0,
          reason: 'invalid duration',
        });
        return;
      }

      try {
        video.currentTime = 0;

        await video.play();

        if (typeof video.requestVideoFrameCallback === 'function') {
          video.requestVideoFrameCallback(() => {
            finish({
              ok: video.videoWidth > 0 && video.videoHeight > 0,
              duration,
              reason:
                video.videoWidth > 0
                  ? ''
                  : 'no decoded video frame',
            });
          });
        } else {
          setTimeout(() => {
            finish({
              ok: video.videoWidth > 0 && video.videoHeight > 0,
              duration,
              reason:
                video.videoWidth > 0
                  ? ''
                  : 'no decoded video frame',
            });
          }, 300);
        }
      } catch (error) {
        finish({
          ok: false,
          duration,
          reason: error?.message || 'video validation failed',
        });
      }
    };

    timeout = setTimeout(() => {
      finish({
        ok: false,
        duration: 0,
        reason: 'video validation timed out',
      });
    }, 7000);

    video.src = url;

    try {
      video.load();
    } catch {}
  });
}

function createSlot(slotId) {
  if (!sourceStream || !recording) return false;

  const recorder = createRecorder(sourceStream);

  if (!recorder) return false;

  const slot = {
    id: slotId,
    recorder,
    chunks: [],
    startedAt: performance.now(),
    stopped: false,
  };

  recorder.ondataavailable = event => {
    if (!event.data || event.data.size === 0) return;
    if (slot.stopped) return;

    slot.chunks.push(event.data);
  };

  recorder.onerror = event => {
    console.error(
      '[Element 6 Clips] Recorder slot error:',
      event?.error || event
    );
  };

  try {
    recorder.start();
  } catch (error) {
    console.error(
      '[Element 6 Clips] Could not start recorder slot:',
      error
    );

    return false;
  }

  slot.mime = recorder.mimeType || 'video/webm';

  slots.set(slotId, slot);

  // Automatically finish this 30-second recorder.
  slot.timer = setTimeout(async () => {
    await finishSlot(slotId, false);
  }, CLIP_MS + 100);

  return true;
}

async function finishSlot(slotId, requestedByUser) {
  const slot = slots.get(slotId);

  if (!slot || slot.stopped) return null;

  slot.stopped = true;

  if (slot.timer) {
    clearTimeout(slot.timer);
    slot.timer = null;
  }

  const recorder = slot.recorder;

  await waitForRecorderStop(recorder);

  slots.delete(slotId);

  const blob = new Blob(slot.chunks, {
    type: recorder.mimeType || slot.mime || 'video/webm',
  });

  const validation = await validateBlob(blob);

  const result = {
    blob,
    mime: recorder.mimeType || slot.mime || blob.type || 'video/webm',
    extension: extensionForMime(
      recorder.mimeType || slot.mime || blob.type
    ),
    duration: Math.min(
      validation.duration || (performance.now() - slot.startedAt) / 1000,
      CLIP_SECONDS
    ),
    startedAt: slot.startedAt,
    requestedByUser,
    valid: validation.ok,
  };

  if (!validation.ok) {
    console.warn(
      '[Element 6 Clips] Discarded invalid recorder output:',
      validation.reason
    );

    return null;
  }

  return result;
}

async function restartSlot(slotId) {
  if (!recording) return;

  // Do not create duplicate slot IDs.
  if (slots.has(slotId)) return;

  createSlot(slotId);
}

function chooseBestSlot() {
  const now = performance.now();

  const available = [...slots.values()]
    .filter(slot => !slot.stopped)
    .map(slot => ({
      slot,
      age: now - slot.startedAt,
    }))
    .sort((a, b) => b.age - a.age);

  if (!available.length) return null;

  // Prefer a recorder that has reached the full 30 seconds.
  const full = available.find(
    entry => entry.age >= CLIP_MS - 750
  );

  if (full) return full.slot;

  // During the initial warmup, return the oldest available recording
  // rather than forcing the player to wait.
  return available[0].slot;
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function') {
    console.warn(
      '[Element 6 Clips] No canvas.captureStream() available.'
    );
    return false;
  }

  if (!window.MediaRecorder) {
    console.warn(
      '[Element 6 Clips] MediaRecorder is not supported.'
    );
    return false;
  }

  stopClipRecorder();

  try {
    sourceCanvas = canvas;

    // THIS is the important change:
    // capture only the Element 6 canvas.
    sourceStream = canvas.captureStream(FPS);

    if (!sourceStream) {
      sourceCanvas = null;
      return false;
    }

    recording = true;

    window.__e6ClipRecorderActive = true;
    window.__e6ClipRecorderReady = false;

    // Start the six overlapping recording windows.
    let started = 0;

    for (let i = 0; i < SLOT_COUNT; i++) {
      if (createSlot(i)) started++;
    }

    // Stagger the remaining recorder windows.
    for (let i = 1; i < SLOT_COUNT; i++) {
      setTimeout(() => {
        if (!recording) return;

        if (!slots.has(i)) {
          createSlot(i);
        }
      }, i * SLOT_INTERVAL_MS);
    }

    if (started === 0) {
      stopClipRecorder();
      return false;
    }

    clipMime =
      slots.values().next().value?.mime ||
      'video/webm';

    window.__e6ClipRecorderMime = clipMime;
    window.__e6ClipRecorderReady = true;

    return true;
  } catch (error) {
    console.error(
      '[Element 6 Clips] Canvas recorder initialization failed:',
      error
    );

    stopClipRecorder();
    return false;
  }
}

export async function saveClip() {
  if (!recording) return null;

  const slot = chooseBestSlot();

  if (!slot) {
    return null;
  }

  const slotId = slot.id;

  // This slot is consumed for this clip.
  const result = await finishSlot(slotId, true);

  // Immediately replace the consumed recording window.
  // There is NO cooldown.
  if (recording) {
    restartSlot(slotId);
  }

  if (!result) return null;

  saveSequence++;

  return {
    ...result,
    sequence: saveSequence,
  };
}

export function getClipRecordingInfo() {
  const now = performance.now();

  const ages = [...slots.values()]
    .filter(slot => !slot.stopped)
    .map(slot => (now - slot.startedAt) / 1000);

  return {
    active: recording,
    mime: clipMime,
    extension: extensionForMime(clipMime),
    recorderCount: slots.size,
    oldestSeconds: ages.length ? Math.max(...ages) : 0,
    newestSeconds: ages.length ? Math.min(...ages) : 0,
  };
}

export function stopClipRecorder() {
  recording = false;

  for (const slot of slots.values()) {
    slot.stopped = true;

    if (slot.timer) {
      clearTimeout(slot.timer);
      slot.timer = null;
    }

    try {
      if (slot.recorder.state !== 'inactive') {
        slot.recorder.stop();
      }
    } catch {}
  }

  slots.clear();

  try {
    sourceStream?.getTracks?.().forEach(track => track.stop());
  } catch {}

  sourceStream = null;
  sourceCanvas = null;
  clipMime = '';

  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
}

export function isClipRecorderActive() {
  return recording && slots.size > 0;
}
