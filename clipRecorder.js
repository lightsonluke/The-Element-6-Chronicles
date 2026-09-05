// Element 6 native-only rolling clip recorder.
// Uses browser-native Canvas.captureStream + MediaRecorder only.
// No external media-processing dependency.

let stream = null;
let recorder = null;
let chunks = [];
let recording = false;
let clipMime = '';
let startedAt = 0;
let lastDataAt = 0;
let saveBusy = false;
let canvasRef = null;

const CHUNK_MS = 1000;
const CLIP_SECONDS = 30;
const ROLLING_SECONDS = 34;
const MAX_MEDIA_CHUNKS = ROLLING_SECONDS + 4;

function getSupportedMime() {
  const types = [
    'video/mp4;codecs="avc1.42E01E"',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pruneChunks() {
  // The first chunk normally contains the container initialization/header.
  // Keep it plus the newest rolling media chunks. MediaRecorder data must be
  // reassembled in order before playback; individual slices are not standalone.
  if (chunks.length <= MAX_MEDIA_CHUNKS + 1) return;
  chunks = [chunks[0], ...chunks.slice(-(MAX_MEDIA_CHUNKS))];
}

function resetState() {
  recording = false;
  window.__e6ClipRecorderReady = false;
  stream = null;
  recorder = null;
  chunks = [];
  canvasRef = null;
  startedAt = 0;
  lastDataAt = 0;
  saveBusy = false;
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function' || !window.MediaRecorder) return false;
  if (recording) stopClipRecorder();

  try {
    canvasRef = canvas;
    stream = canvas.captureStream(30);
    const requestedMime = getSupportedMime();

    recorder = requestedMime
      ? new MediaRecorder(stream, {
          mimeType: requestedMime,
          videoBitsPerSecond: 4500000,
        })
      : new MediaRecorder(stream, {
          videoBitsPerSecond: 4500000,
        });

    // Use the actual browser-selected type. It can differ from the requested
    // type and is the type that must be used when rebuilding the final Blob.
    clipMime = recorder.mimeType || requestedMime || 'video/webm';
    chunks = [];
    startedAt = Date.now();
    lastDataAt = startedAt;

    recorder.ondataavailable = event => {
      if (!event.data || event.data.size === 0) return;
      chunks.push({ blob: event.data, at: Date.now() });
      lastDataAt = Date.now();
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

async function flushLatestChunk() {
  if (!recorder || recorder.state !== 'recording') return;
  try {
    recorder.requestData();
    await sleep(120);
  } catch {}
}

function buildRollingBlob() {
  if (!chunks.length) return null;

  const media = chunks.map(entry => entry.blob);
  if (!media.length) return null;

  return new Blob(media, {
    type: clipMime || recorder?.mimeType || 'video/webm',
  });
}

async function isPlayableBlob(blob) {
  if (!blob || blob.size < 1000) return false;

  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(blob);
    let settled = false;

    const finish = value => {
      if (settled) return;
      settled = true;
      try { video.pause(); } catch {}
      video.removeAttribute('src');
      try { video.load(); } catch {}
      URL.revokeObjectURL(url);
      resolve(value);
    };

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) && video.duration > 0);
    video.onerror = () => finish(false);
    video.src = url;
    setTimeout(() => finish(false), 2500);
  });
}

export async function saveClip() {
  if (
    saveBusy ||
    !recording ||
    !recorder ||
    recorder.state !== 'recording'
  ) return null;

  saveBusy = true;
  try {
    const elapsed = (Date.now() - startedAt) / 1000;
    if (elapsed < CLIP_SECONDS) return null;

    // Flush the newest slice so the saved window includes the most recent media.
    await flushLatestChunk();

    // We cannot losslessly trim arbitrary media with browser-native APIs alone.
    // Instead, reassemble the native MediaRecorder stream from its initialization
    // chunk plus the newest ~34 seconds of sequential slices. The resulting file
    // stays in the browser's native recording container/codec.
    const source = buildRollingBlob();
    if (!source) return null;

    const playable = await isPlayableBlob(source);
    if (!playable) {
      console.error('[Element 6 Clips] Browser produced a non-playable native recording.');
      return null;
    }

    const type = recorder.mimeType || clipMime || source.type || 'video/webm';
    const extension = extensionForMime(type);
    const durationHint = Math.min(CLIP_SECONDS, elapsed);

    return {
      blob: source,
      mime: type,
      extension,
      duration: durationHint,
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
    ageSeconds: startedAt ? (Date.now() - startedAt) / 1000 : 0,
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
