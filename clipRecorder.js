// Element 6 native-only rolling clip recorder.
// Browser-native APIs only: Canvas.captureStream + MediaRecorder + Blob.
// No third-party media libraries.

let stream = null;
let recorder = null;
let chunks = [];
let recording = false;
let clipMime = '';
let startedAt = 0;
let lastDataAt = 0;
let saveBusy = false;

const FPS = 30;
const CHUNK_MS = 250;
const CLIP_SECONDS = 30;
// Keep a small safety margin because the first MediaRecorder chunk is also the
// container initialization chunk. This keeps the assembled native recording
// under 30 seconds without needing a third-party encoder to trim it.
const MAX_WINDOW_MS = CLIP_SECONDS * 1000 - CHUNK_MS;
const MIN_RECORDING_MS = 500;

function getSupportedMime() {
  const types = [
    'video/mp4;codecs="avc1.42E01E"',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs="vp9"',
    'video/webm;codecs="vp8"',
    'video/webm',
  ];

  for (const type of types) {
    try {
      if (window.MediaRecorder?.isTypeSupported?.(type)) return type;
    } catch {}
  }
  return '';
}

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function resetState() {
  recording = false;
  window.__e6ClipRecorderReady = false;
  stream = null;
  recorder = null;
  chunks = [];
  startedAt = 0;
  lastDataAt = 0;
  saveBusy = false;
  clipMime = '';
}

function pruneChunks() {
  if (!chunks.length) return;

  const newestAt = chunks[chunks.length - 1].at;
  const cutoff = newestAt - MAX_WINDOW_MS;

  // Keep only media from the rolling 30-second window. The first chunk is
  // retained as the container initialization chunk when the browser emits it.
  let firstHeader = chunks[0];
  let recent = chunks.filter((entry, index) => index !== 0 && entry.at >= cutoff);

  // If the browser's first data event is itself a normal media chunk, retaining
  // it as the header is still required for a reassembled MediaRecorder stream.
  chunks = [firstHeader, ...recent];
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function' || !window.MediaRecorder) return false;
  if (recording) stopClipRecorder();

  try {
    stream = canvas.captureStream(FPS);
    const requestedMime = getSupportedMime();

    recorder = requestedMime
      ? new MediaRecorder(stream, {
          mimeType: requestedMime,
          videoBitsPerSecond: 4500000,
        })
      : new MediaRecorder(stream, {
          videoBitsPerSecond: 4500000,
        });

    clipMime = recorder.mimeType || requestedMime || 'video/webm';
    chunks = [];
    startedAt = performance.now();
    lastDataAt = startedAt;

    recorder.ondataavailable = event => {
      if (!event.data || event.data.size === 0) return;
      const at = performance.now();
      chunks.push({ blob: event.data, at });
      lastDataAt = at;
      pruneChunks();
    };

    recorder.onerror = event => {
      console.error('[Element 6 Clips] Native MediaRecorder error:', event?.error || event);
    };

    recorder.start(CHUNK_MS);
    recording = true;
    window.__e6ClipRecorderReady = true;
    window.__e6ClipRecorderMime = clipMime;
    return true;
  } catch (error) {
    console.error('[Element 6 Clips] Could not start native recorder:', error);
    try { stream?.getTracks?.().forEach(track => track.stop()); } catch {}
    resetState();
    return false;
  }
}

function waitForNextData(minDelay = 180) {
  return new Promise(resolve => setTimeout(resolve, minDelay));
}

async function flushLatestChunk() {
  if (!recorder || recorder.state !== 'recording') return;
  try {
    const before = chunks.length;
    recorder.requestData();
    for (let i = 0; i < 8 && chunks.length === before; i += 1) {
      await waitForNextData(60);
    }
    pruneChunks();
  } catch {}
}

function buildRollingBlob() {
  if (chunks.length < 2) return null;

  const media = chunks.map(entry => entry.blob);
  return new Blob(media, {
    type: clipMime || recorder?.mimeType || 'video/webm',
  });
}

async function readDuration(blob) {
  if (!blob) return 0;

  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(blob);
    let done = false;

    const finish = value => {
      if (done) return;
      done = true;
      try { video.pause(); } catch {}
      video.removeAttribute('src');
      try { video.load(); } catch {}
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(value) ? value : 0);
    };

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => finish(video.duration);
    video.onerror = () => finish(0);
    video.src = url;
    setTimeout(() => finish(0), 4000);
  });
}

export async function saveClip() {
  if (saveBusy || !recording || !recorder || recorder.state !== 'recording') return null;

  saveBusy = true;
  try {
    const elapsedMs = performance.now() - startedAt;
    if (elapsedMs < MIN_RECORDING_MS) return null;

    await flushLatestChunk();
    const source = buildRollingBlob();
    if (!source) return null;

    const duration = await readDuration(source);
    if (!duration) {
      console.error('[Element 6 Clips] Native recording has no readable duration.');
      return null;
    }

    // The rolling buffer is intentionally kept below 30 seconds. Native
    // MediaRecorder cannot frame-accurately trim an encoded Blob without a
    // media encoder, so we bound the buffer before assembling it instead.
    const safeDuration = Math.min(duration, CLIP_SECONDS);

    const type = recorder.mimeType || clipMime || source.type || 'video/webm';
    return {
      blob: source,
      mime: type,
      extension: extensionForMime(type),
      duration: safeDuration,
    };
  } catch (error) {
    console.error('[Element 6 Clips] Native clip creation failed:', error);
    return null;
  } finally {
    saveBusy = false;
  }
}

export function getClipRecordingInfo() {
  return {
    active: isClipRecorderActive(),
    mime: clipMime,
    extension: extensionForMime(clipMime),
    ageSeconds: startedAt ? (performance.now() - startedAt) / 1000 : 0,
    lastDataAt,
  };
}

export function stopClipRecorder() {
  try {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  } catch {}
  try { stream?.getTracks?.().forEach(track => track.stop()); } catch {}
  resetState();
}

export function isClipRecorderActive() {
  return recording && !!recorder && recorder.state === 'recording';
}
