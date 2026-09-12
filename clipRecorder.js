// Element 6 native canvas clip recorder.
// Captures ONLY the game's canvas and keeps a rolling in-memory recording.
// The recorder starts automatically as soon as a usable game canvas is found.

let stream = null;
let recording = false;
let clipMime = '';
let sequence = 0;
let recordingCanvas = null;
let recordingGeneration = 0;
let recorder = null;
let chunks = [];
let chunkStartedAt = 0;
let lastDataAt = 0;
let restartTimer = null;
let saveQueue = Promise.resolve();

const FPS = 30;
const CLIP_MS = 30000;
const TIMESLICE_MS = 1000;
const VIDEO_BITRATE = 4500000;

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function candidateMimes() {
  const values = [
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
    'video/mp4;codecs=avc1',
    '',
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
      const options = { videoBitsPerSecond: VIDEO_BITRATE };
      if (mime) options.mimeType = mime;
      return new MediaRecorder(stream, options);
    } catch {}
  }

  return null;
}

function publishState() {
  window.__e6ClipRecorderActive = recording && !!recorder && recorder.state !== 'inactive';
  window.__e6ClipRecorderReady = window.__e6ClipRecorderActive;
  window.__e6ClipRecorderMime = clipMime;
}

function pruneChunks(now = performance.now()) {
  const cutoff = now - CLIP_MS;
  while (chunks.length > 1 && chunks[0].endAt < cutoff) chunks.shift();
}

function setupRecorder(generation) {
  if (!recording || !stream || generation !== recordingGeneration) return false;

  const next = createRecorder();
  if (!next) return false;

  recorder = next;
  chunkStartedAt = performance.now();
  lastDataAt = chunkStartedAt;

  next.ondataavailable = event => {
    if (!recording || generation !== recordingGeneration) return;
    if (!event.data || !event.data.size) return;

    const now = performance.now();
    chunks.push({ blob: event.data, startAt: lastDataAt || chunkStartedAt, endAt: now });
    lastDataAt = now;
    pruneChunks(now);
  };

  next.onerror = event => {
    console.error('[Element 6 Clips] MediaRecorder error:', event?.error || event);
    publishState();
  };

  next.onstop = () => {
    if (!recording || generation !== recordingGeneration) return;
    if (restartTimer) clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
      restartTimer = null;
      if (recording && generation === recordingGeneration) {
        const ok = setupRecorder(generation);
        if (!ok) {
          window.__e6ClipRecorderReady = false;
          publishState();
        }
      }
    }, 50);
  };

  next.onstart = () => publishState();

  try {
    // timeslice is important: without it MediaRecorder may hold everything
    // until stop(), leaving no usable rolling data for an early clip request.
    next.start(TIMESLICE_MS);
  } catch (error) {
    console.error('[Element 6 Clips] Could not start recorder:', error);
    recorder = null;
    return false;
  }

  clipMime = next.mimeType || 'video/webm';
  publishState();
  return true;
}

async function stopActiveRecorder() {
  const current = recorder;
  if (!current || current.state === 'inactive') return;

  await new Promise(resolve => {
    const oldStop = current.onstop;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    current.onstop = event => {
      try { oldStop?.(event); } catch {}
      finish();
    };

    try { current.stop(); } catch { finish(); }
    setTimeout(finish, 2500);
  });
}

export function initClipRecorder(canvas) {
  if (!canvas || !window.MediaRecorder) return false;

  if (recording && recordingCanvas === canvas && recorder && recorder.state !== 'inactive') {
    publishState();
    return true;
  }

  if (typeof canvas.captureStream !== 'function') {
    console.error('[Element 6 Clips] canvas.captureStream() unavailable.');
    return false;
  }

  stopClipRecorder();

  try {
    recordingGeneration++;
    const generation = recordingGeneration;
    stream = canvas.captureStream(FPS);
    if (!stream) return false;

    recordingCanvas = canvas;
    recording = true;
    clipMime = '';
    chunks = [];

    const ok = setupRecorder(generation);
    if (!ok) {
      stopClipRecorder();
      return false;
    }

    const tracks = stream.getVideoTracks?.() || [];
    tracks.forEach(track => {
      track.addEventListener?.('ended', () => {
        if (!recording || generation !== recordingGeneration) return;
        console.warn('[Element 6 Clips] Canvas recording track ended; restarting recorder.');
        stopClipRecorder();
      }, { once: true });
    });

    publishState();
    return true;
  } catch (error) {
    console.error('[Element 6 Clips] Initialization failed:', error);
    stopClipRecorder();
    return false;
  }
}

export async function saveClip() {
  if (!recording || !recorder || recorder.state === 'inactive') return null;

  // Serialize clip creation so repeated Space presses cannot mutate the rolling
  // buffer while another clip is being assembled.
  return saveQueue = saveQueue.then(async () => {
    const now = performance.now();
    pruneChunks(now);

    const usable = chunks.filter(item => item?.blob?.size > 0 && item.endAt >= now - CLIP_MS);
    if (!usable.length) return null;

    const blob = new Blob(usable.map(item => item.blob), { type: clipMime || 'video/webm' });
    if (blob.size < 1000) return null;

    const oldest = usable[0].startAt;
    const duration = Math.min(CLIP_MS / 1000, Math.max(0, (now - oldest) / 1000));

    sequence++;
    return {
      blob,
      mime: clipMime || blob.type || 'video/webm',
      extension: extensionForMime(clipMime || blob.type),
      duration,
      sequence,
    };
  });
}

export function getClipRecordingInfo() {
  const now = performance.now();
  pruneChunks(now);
  const oldest = chunks[0];
  return {
    active: recording && !!recorder && recorder.state !== 'inactive',
    mime: clipMime,
    extension: extensionForMime(clipMime),
    recorderCount: recorder && recorder.state !== 'inactive' ? 1 : 0,
    oldestSeconds: oldest ? Math.min(CLIP_MS / 1000, (now - oldest.startAt) / 1000) : 0,
    newestSeconds: chunks.length ? Math.max(0, (now - chunks[chunks.length - 1].endAt) / 1000) : 0,
    chunkCount: chunks.length,
  };
}

export function stopClipRecorder() {
  recordingGeneration++;
  recording = false;

  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  const current = recorder;
  recorder = null;
  if (current) {
    try {
      current.onstop = null;
      if (current.state !== 'inactive') current.stop();
    } catch {}
  }

  try { stream?.getTracks?.()?.forEach(track => track.stop()); } catch {}

  stream = null;
  recordingCanvas = null;
  clipMime = '';
  chunks = [];
  publishState();
}

export function isClipRecorderActive() {
  return recording && !!recorder && recorder.state !== 'inactive';
}

export function getClipRecordingCanvas() {
  return recordingCanvas;
}
