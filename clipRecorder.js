// Element 6 native canvas clip recorder.
// Captures ONLY the game's canvas.
// Never uses getDisplayMedia().

let stream = null;
let recording = false;
let clipMime = '';
let sequence = 0;
let recordingCanvas = null;
let recordingGeneration = 0;

const FPS = 30;
const CLIP_MS = 30000;
const SLOT_COUNT = 6;
const SLOT_STAGGER_MS = 5000;
const VIDEO_BITRATE = 4500000;

const slots = new Map();

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4')
    ? 'mp4'
    : 'webm';
}

function candidateMimes() {
  const values = [
    '',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
    'video/mp4;codecs=avc1',
  ];

  return values.filter((mime, index) => {
    if (values.indexOf(mime) !== index) return false;
    if (!mime) return true;

    try {
      return MediaRecorder.isTypeSupported(mime);
    } catch {
      return false;
    }
  });
}

function createRecorder() {
  if (!stream || !window.MediaRecorder) return null;

  for (const mime of candidateMimes()) {
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

function stopRecorder(recorder) {
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

function startSlot(id) {
  if (!recording || !stream || slots.has(id)) return false;

  const recorder = createRecorder();

  if (!recorder) return false;

  const slot = {
    id,
    recorder,
    chunks: [],
    startedAt: performance.now(),
    finished: false,
  };

  recorder.ondataavailable = event => {
    if (slot.finished) return;
    if (!event.data || !event.data.size) return;

    slot.chunks.push(event.data);
  };

  recorder.onerror = event => {
    console.error(
      '[Element 6 Clips] MediaRecorder error:',
      event?.error || event
    );
  };

  try {
    recorder.start();
  } catch (error) {
    console.error(
      '[Element 6 Clips] Could not start recorder:',
      error
    );
    return false;
  }

  slot.mime =
    recorder.mimeType ||
    'video/webm';

  slot.timer = setTimeout(() => {
    finishSlot(id, false);
  }, CLIP_MS);

  slots.set(id, slot);

  if (!clipMime) {
    clipMime = slot.mime;
    window.__e6ClipRecorderMime = clipMime;
  }

  return true;
}

async function finishSlot(id, userRequested) {
  const slot = slots.get(id);

  if (!slot || slot.finished) return null;

  slot.finished = true;

  if (slot.timer) {
    clearTimeout(slot.timer);
    slot.timer = null;
  }

  const recorder = slot.recorder;

  await stopRecorder(recorder);

  slots.delete(id);

  // Keep the rolling recorder windows alive. Each 30s slot is replaced at the
  // moment it ends, while the five-second stagger between slots remains intact.
  // User-requested saves are restarted by saveClip() immediately below.
  if (recording && !userRequested) {
    startSlot(id);
  }

  const mime =
    recorder.mimeType ||
    slot.mime ||
    'video/webm';

  const blob = new Blob(slot.chunks, {
    type: mime,
  });

  if (blob.size < 1000) {
    return null;
  }

  return {
    blob,
    mime,
    extension: extensionForMime(mime),
    duration: Math.min(
      CLIP_MS / 1000,
      (performance.now() - slot.startedAt) / 1000
    ),
    userRequested,
  };
}

function oldestSlot() {
  let result = null;

  for (const slot of slots.values()) {
    if (slot.finished) continue;

    if (!result || slot.startedAt < result.startedAt) {
      result = slot;
    }
  }

  return result;
}

export function initClipRecorder(canvas) {
  if (!canvas) return false;
  if (!window.MediaRecorder) return false;

  // Multiple game/UI components can mount the clip hook at once. Reuse the
  // existing recorder when it is already recording this exact game canvas;
  // otherwise they can stop each other's recordings.
  if (recording && recordingCanvas === canvas && slots.size > 0) {
    return true;
  }
  if (typeof canvas.captureStream !== 'function') {
    console.error(
      '[Element 6 Clips] canvas.captureStream() unavailable.'
    );
    return false;
  }

  stopClipRecorder();

  try {
    recordingGeneration++;
    const generation = recordingGeneration;

    // ONLY the Element 6 canvas.
    stream = canvas.captureStream(FPS);

    if (!stream) return false;

    recordingCanvas = canvas;
    recording = true;
    clipMime = '';

    window.__e6ClipRecorderActive = true;
    window.__e6ClipRecorderReady = false;

    // Start ONE recorder immediately. Starting six MediaRecorder instances at
    // exactly the same time is unreliable in some browsers (especially Safari)
    // and was the main reason clips could be completely unavailable in-game.
    const started = startSlot(0) ? 1 : 0;

    if (!started) {
      stopClipRecorder();
      return false;
    }

    // Build the rolling 30-second window progressively. Each slot is a full
    // standalone recording, staggered by five seconds, so there is always a
    // recent recording ready without hammering the browser with six simultaneous
    // recorder starts.
    for (let i = 1; i < SLOT_COUNT; i++) {
      setTimeout(() => {
        if (recording && generation === recordingGeneration && !slots.has(i)) {
          startSlot(i);
        }
      }, i * SLOT_STAGGER_MS);
    }

    window.__e6ClipRecorderReady = true;

    return true;
  } catch (error) {
    console.error(
      '[Element 6 Clips] Initialization failed:',
      error
    );

    stopClipRecorder();
    return false;
  }
}

export async function saveClip() {
  if (!recording) return null;

  const slot = oldestSlot();

  if (!slot) return null;

  const id = slot.id;

  // Finish one complete recorder session.
  const result = await finishSlot(id, true);

  // Immediately replace it.
  // No cooldown.
  if (recording) {
    startSlot(id);
  }

  if (!result) return null;

  sequence++;

  return {
    ...result,
    sequence,
  };
}

export function getClipRecordingInfo() {
  const now = performance.now();

  const ages = [...slots.values()]
    .filter(slot => !slot.finished)
    .map(slot =>
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
  recordingGeneration++;
  recording = false;

  for (const slot of slots.values()) {
    slot.finished = true;

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
    stream
      ?.getTracks()
      ?.forEach(track => track.stop());
  } catch {}

  stream = null;
  recordingCanvas = null;
  clipMime = '';

  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
}

export function isClipRecorderActive() {
  return recording && slots.size > 0;
}

export function getClipRecordingCanvas() {
  return recordingCanvas;
}
