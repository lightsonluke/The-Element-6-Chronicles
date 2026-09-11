// Element 6 native canvas clip recorder.
// No getDisplayMedia.
// No browser screen/window capture.
// Uses the Element 6 canvas directly.
// Keeps overlapping 30-second recorder windows.
// Saved blobs remain downloadable through ClipsScreen.

let sourceCanvas = null;
let sourceStream = null;
let recording = false;
let clipMime = '';
let saveSequence = 0;

const FPS = 30;
const CLIP_SECONDS = 30;
const CLIP_MS = CLIP_SECONDS * 1000;

const SLOT_COUNT = 7;
const SLOT_INTERVAL_MS = 5000;
const VIDEO_BITRATE = 4500000;

const slots = new Map();

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4')
    ? 'mp4'
    : 'webm';
}

function supportedMimes() {
  const candidates = [
    '',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
    'video/mp4;codecs=avc1',
  ];

  return candidates.filter((mime, index) => {
    if (candidates.indexOf(mime) !== index) return false;
    if (!mime) return true;

    try {
      return MediaRecorder.isTypeSupported(mime);
    } catch {
      return false;
    }
  });
}

function createRecorder(stream) {
  if (!stream || !window.MediaRecorder) return null;

  for (const mime of supportedMimes()) {
    try {
      const options = {
        videoBitsPerSecond: VIDEO_BITRATE,
      };

      if (mime) options.mimeType = mime;

      return new MediaRecorder(stream, options);
    } catch {}
  }

  return null;
}

function waitForStop(recorder) {
  return new Promise(resolve => {
    if (!recorder || recorder.state === 'inactive') {
      resolve();
      return;
    }

    const oldStop = recorder.onstop;

    recorder.onstop = event => {
      try {
        oldStop?.(event);
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
    });
  }

  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(blob);

    let done = false;

    const finish = result => {
      if (done) return;
      done = true;

      try {
        video.pause();
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
      });
    };

    video.onloadedmetadata = async () => {
      const duration = Number(video.duration);

      if (!Number.isFinite(duration) || duration <= 0) {
        finish({
          ok: false,
          duration: 0,
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
            });
          });
        } else {
          setTimeout(() => {
            finish({
              ok: video.videoWidth > 0 && video.videoHeight > 0,
              duration,
            });
          }, 250);
        }
      } catch {
        finish({
          ok: false,
          duration,
        });
      }
    };

    setTimeout(() => {
      finish({
        ok: false,
        duration: 0,
      });
    }, 7000);

    video.src = url;
    video.load();
  });
}

function createSlot(id) {
  if (!recording || !sourceStream || slots.has(id)) {
    return false;
  }

  const recorder = createRecorder(sourceStream);

  if (!recorder) return false;

  const slot = {
    id,
    recorder,
    chunks: [],
    startedAt: performance.now(),
    stopped: false,
    timer: null,
  };

  recorder.ondataavailable = event => {
    if (slot.stopped) return;
    if (!event.data || event.data.size === 0) return;

    slot.chunks.push(event.data);
  };

  recorder.onerror = event => {
    console.error(
      '[Element 6 Clips] Recorder error:',
      event?.error || event
    );
  };

  try {
    recorder.start();
  } catch (error) {
    console.error(
      '[Element 6 Clips] Recorder failed to start:',
      error
    );
    return false;
  }

  slot.mime = recorder.mimeType || 'video/webm';

  slots.set(id, slot);

  slot.timer = setTimeout(() => {
    finishSlot(id);
  }, CLIP_MS + 100);

  return true;
}

async function finishSlot(id) {
  const slot = slots.get(id);

  if (!slot || slot.stopped) return null;

  slot.stopped = true;

  if (slot.timer) {
    clearTimeout(slot.timer);
    slot.timer = null;
  }

  await waitForStop(slot.recorder);

  slots.delete(id);

  const blob = new Blob(slot.chunks, {
    type:
      slot.recorder.mimeType ||
      slot.mime ||
      'video/webm',
  });

  const validation = await validateBlob(blob);

  if (!validation.ok) {
    return null;
  }

  return {
    blob,
    mime:
      slot.recorder.mimeType ||
      slot.mime ||
      blob.type ||
      'video/webm',
    extension: extensionForMime(
      slot.recorder.mimeType ||
      slot.mime ||
      blob.type
    ),
    duration: Math.min(
      validation.duration,
      CLIP_SECONDS
    ),
    sequence: ++saveSequence,
  };
}

function chooseSlot() {
  const now = performance.now();

  const available = [...slots.values()]
    .filter(slot => !slot.stopped)
    .map(slot => ({
      slot,
      age: now - slot.startedAt,
    }))
    .sort((a, b) => b.age - a.age);

  if (!available.length) return null;

  return available[0].slot;
}

function restartSlot(id) {
  if (!recording) return;

  if (!slots.has(id)) {
    createSlot(id);
  }
}

export function initClipRecorder(canvas) {
  if (
    !canvas ||
    typeof canvas.captureStream !== 'function'
  ) {
    console.warn(
      '[Element 6 Clips] Game canvas capture is unavailable.'
    );
    return false;
  }

  if (!window.MediaRecorder) {
    console.warn(
      '[Element 6 Clips] MediaRecorder is unavailable.'
    );
    return false;
  }

  stopClipRecorder();

  try {
    sourceCanvas = canvas;

    // ONLY captures the Element 6 canvas.
    sourceStream = canvas.captureStream(FPS);

    if (!sourceStream) {
      stopClipRecorder();
      return false;
    }

    recording = true;

    window.__e6ClipRecorderActive = true;
    window.__e6ClipRecorderReady = false;

    let started = 0;

    for (let i = 0; i < SLOT_COUNT; i++) {
      if (createSlot(i)) {
        started++;
      }
    }

    // Stagger recorder windows so there is always a recent window available.
    for (let i = 1; i < SLOT_COUNT; i++) {
      setTimeout(() => {
        if (!recording) return;

        if (!slots.has(i)) {
          createSlot(i);
        }
      }, i * SLOT_INTERVAL_MS);
    }

    if (!started) {
      stopClipRecorder();
      return false;
    }

    const firstSlot = slots.values().next().value;

    clipMime =
      firstSlot?.mime ||
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

  const slot = chooseSlot();

  if (!slot) return null;

  const id = slot.id;

  // Consume this recording window.
  const result = await finishSlot(id);

  // Immediately replace it.
  // There is intentionally NO cooldown.
  restartSlot(id);

  return result;
}

export function getClipRecordingInfo() {
  const now = performance.now();

  const ages = [...slots.values()]
    .filter(slot => !slot.stopped)
    .map(
      slot =>
        (now - slot.startedAt) / 1000
    );

  return {
    active: recording,
    mime: clipMime,
    extension: extensionForMime(clipMime),
    recorderCount: slots.size,
    oldestSeconds: ages.length
      ? Math.max(...ages)
      : 0,
    newestSeconds: ages.length
      ? Math.min(...ages)
      : 0,
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
    sourceStream?.getTracks?.().forEach(track => {
      track.stop();
    });
  } catch {}

  sourceStream = null;
  sourceCanvas = null;
  clipMime = '';

  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
}

export function isClipRecorderActive() {
  return (
    recording &&
    slots.size > 0
  );
}
