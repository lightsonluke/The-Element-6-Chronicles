// Element 6 native canvas clip recorder.
// Captures ONLY the game's canvas with a continuous rolling 30-second buffer.
// MP4/H.264 is required; no WebM fallback is used.

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

const FPS = 60;
const CLIP_MS = 30000;
const TIMESLICE_MS = 1000;
const VIDEO_BITRATE = 12000000;

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function candidateMimes() {
  const values = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ];
  return values.filter((mime, index) => {
    if (values.indexOf(mime) !== index) return false;
    try { return !!window.MediaRecorder?.isTypeSupported?.(mime); } catch { return false; }
  });
}

function createRecorder() {
  if (!stream || !window.MediaRecorder) return null;
  for (const mime of candidateMimes()) {
    try {
      return new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: VIDEO_BITRATE,
      });
    } catch {}
  }
  return null;
}

function publishState() {
  const active = recording && !!recorder && recorder.state !== 'inactive';
  window.__e6ClipRecorderActive = active;
  window.__e6ClipRecorderReady = active && chunks.length > 0;
  window.__e6ClipRecorderMime = clipMime;
  window.__e6ClipRecorderFps = FPS;
}

function pruneChunks(now = performance.now()) {
  const cutoff = now - CLIP_MS;
  while (chunks.length > 1 && chunks[0].endAt < cutoff) chunks.shift();
}

function attachRecorder(next, generation) {
  recorder = next;
  chunkStartedAt = performance.now();
  lastDataAt = chunkStartedAt;

  next.ondataavailable = event => {
    if (!event.data || !event.data.size) return;
    const now = performance.now();
    chunks.push({
      blob: event.data,
      startAt: lastDataAt || chunkStartedAt,
      endAt: now,
      generation,
    });
    lastDataAt = now;
    pruneChunks(now);
    publishState();
  };

  next.onerror = event => {
    console.error('[Element 6 Clips] MediaRecorder error:', event?.error || event);
    publishState();
  };

  next.onstart = () => publishState();

  try {
    next.start(TIMESLICE_MS);
  } catch (error) {
    console.error('[Element 6 Clips] Could not start MP4 recorder:', error);
    recorder = null;
    return false;
  }

  clipMime = next.mimeType || 'video/mp4';
  publishState();
  return true;
}

function startRecorder(generation) {
  if (!recording || !stream || generation !== recordingGeneration) return false;
  const next = createRecorder();
  if (!next) {
    console.error('[Element 6 Clips] This browser does not support MP4 MediaRecorder recording.');
    return false;
  }
  return attachRecorder(next, generation);
}

function stopRecorderWithoutClearingBuffer() {
  const current = recorder;
  recorder = null;
  if (!current) return;
  try {
    current.onstop = null;
    if (current.state !== 'inactive') current.stop();
  } catch {}
}

export function initClipRecorder(canvas) {
  if (!canvas || !window.MediaRecorder) return false;
  if (typeof canvas.captureStream !== 'function') {
    console.error('[Element 6 Clips] canvas.captureStream() unavailable.');
    return false;
  }

  if (recording && recordingCanvas === canvas && recorder && recorder.state !== 'inactive') {
    publishState();
    return true;
  }

  // Switching canvases is intentionally NOT treated as a hard stop.
  // The previous match remains in the rolling buffer so Victory / Match Facts
  // clips can still contain the end of the actual match.
  stopRecorderWithoutClearingBuffer();
  try { stream?.getTracks?.()?.forEach(track => track.stop()); } catch {}

  recordingGeneration++;
  const generation = recordingGeneration;

  try {
    stream = canvas.captureStream(FPS);
    if (!stream) return false;
    recordingCanvas = canvas;
    recording = true;

    if (!chunks.length) clipMime = '';

    const ok = startRecorder(generation);
    if (!ok) {
      recording = false;
      try { stream.getTracks().forEach(track => track.stop()); } catch {}
      stream = null;
      recordingCanvas = null;
      publishState();
      return false;
    }

    const tracks = stream.getVideoTracks?.() || [];
    tracks.forEach(track => {
      track.addEventListener?.('ended', () => {
        if (!recording || generation !== recordingGeneration) return;
        console.warn('[Element 6 Clips] Canvas recording track ended.');
        // Keep the accumulated buffer. GlobalClipRecorder will attach the next
        // available game canvas without throwing away the previous match.
        recorder = null;
        stream = null;
        recordingCanvas = null;
        publishState();
      }, { once: true });
    });

    publishState();
    return true;
  } catch (error) {
    console.error('[Element 6 Clips] Initialization failed:', error);
    recording = false;
    publishState();
    return false;
  }
}

export async function saveClip() {
  if (!recording) return null;

  return saveQueue = saveQueue.then(async () => {
    const now = performance.now();
    pruneChunks(now);

    const usable = chunks
      .filter(item => item?.blob?.size > 0 && item.endAt >= now - CLIP_MS)
      .sort((a, b) => a.startAt - b.startAt);

    if (!usable.length) return null;

    const mime = clipMime || 'video/mp4';
    const blob = new Blob(usable.map(item => item.blob), { type: mime });
    if (blob.size < 1000) return null;

    const oldest = usable[0].startAt;
    const duration = Math.min(CLIP_MS / 1000, Math.max(0, (now - oldest) / 1000));
    sequence++;

    return {
      blob,
      mime,
      extension: 'mp4',
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
    extension: 'mp4',
    recorderCount: recorder && recorder.state !== 'inactive' ? 1 : 0,
    oldestSeconds: oldest ? Math.min(CLIP_MS / 1000, (now - oldest.startAt) / 1000) : 0,
    newestSeconds: chunks.length ? Math.max(0, (now - chunks[chunks.length - 1].endAt) / 1000) : 0,
    chunkCount: chunks.length,
    fps: FPS,
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
      current.ondataavailable = null;
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
