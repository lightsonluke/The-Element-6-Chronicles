import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let sourceCanvas = null;
let sourceStream = null;
let recorder = null;
let recording = false;
let generation = 0;
let saveSequence = 0;
let ffmpeg = null;
let ffmpegPromise = null;
let saveQueue = Promise.resolve();
let chunks = [];
let chunkBytes = 0;
let recordingStartedAt = 0;
let lastDataAt = 0;
let recorderMime = 'video/webm';

const FPS = 60;
const CLIP_SECONDS = 30;
const CLIP_MS = CLIP_SECONDS * 1000;
const VIDEO_BITRATE = 8000000;
const CHUNK_MS = 250;
const MIN_CHUNK_BYTES = 128;
const FFMPEG_CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

function log(message, error = null) {
  if (error) console.error(`[Element 6 Clips] ${message}`, error);
  else console.debug(`[Element 6 Clips] ${message}`);
}

function supportedMime() {
  if (!window.MediaRecorder) return '';

  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];

  for (const mime of candidates) {
    try {
      if (!MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(mime)) return mime;
    } catch {}
  }

  return '';
}

function rebuildBlob() {
  if (!chunks.length || chunkBytes < MIN_CHUNK_BYTES) return null;

  const blob = new Blob(
    chunks.map(chunk => chunk.data),
    { type: recorderMime || 'video/webm' }
  );

  return blob.size >= MIN_CHUNK_BYTES ? blob : null;
}

function trimBuffer() {
  const cutoff = performance.now() - CLIP_MS - 1000;

  while (chunks.length > 1 && chunks[0].time < cutoff) {
    chunkBytes -= chunks[0].size;
    chunks.shift();
  }
}

function attachRecorderHandlers(instance, myGeneration) {
  instance.ondataavailable = event => {
    if (myGeneration !== generation) return;
    if (!event.data || event.data.size <= 0) return;

    chunks.push({
      data: event.data,
      time: performance.now(),
      size: event.data.size
    });

    chunkBytes += event.data.size;
    lastDataAt = performance.now();
    trimBuffer();
  };

  instance.onerror = event => {
    log(`MediaRecorder error: ${event?.error?.message || 'unknown error'}`, event?.error);
  };
}

function startRecorder() {
  if (!recording || !sourceStream || !window.MediaRecorder) return false;
  if (recorder && recorder.state !== 'inactive') return true;

  const mime = supportedMime();

  try {
    const options = { videoBitsPerSecond: VIDEO_BITRATE };
    if (mime) options.mimeType = mime;

    const instance = new MediaRecorder(sourceStream, options);
    const myGeneration = generation;

    attachRecorderHandlers(instance, myGeneration);

    recorder = instance;
    recorderMime = instance.mimeType || mime || 'video/webm';
    recordingStartedAt = performance.now();
    lastDataAt = 0;
    chunks = [];
    chunkBytes = 0;

    instance.start(CHUNK_MS);
    return true;
  } catch (error) {
    recorder = null;
    log('Could not start MediaRecorder', error);
    return false;
  }
}

function requestRecorderData() {
  return new Promise(resolve => {
    const currentRecorder = recorder;

    if (!currentRecorder || currentRecorder.state !== 'recording') {
      resolve();
      return;
    }

    const before = lastDataAt;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      currentRecorder.removeEventListener('dataavailable', onData);
      resolve();
    };

    const onData = () => {
      if (lastDataAt !== before) finish();
    };

    const timer = setTimeout(finish, 1500);

    currentRecorder.addEventListener('dataavailable', onData);

    try {
      currentRecorder.requestData();
    } catch {
      finish();
    }
  });
}

async function makeSnapshot() {
  if (!recorder || recorder.state === 'inactive') return null;

  await requestRecorderData();

  const blob = rebuildBlob();
  if (!blob) return null;

  const duration = Math.min(
    CLIP_SECONDS,
    Math.max(0.25, (performance.now() - recordingStartedAt) / 1000)
  );

  return { blob, duration };
}

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    const instance = new FFmpeg();

    instance.on('log', ({ message }) => {
      console.debug('[Element 6 FFmpeg]', message);
    });

    await instance.load({
      coreURL: await toBlobURL(
        `${FFMPEG_CORE_BASE}/ffmpeg-core.js`,
        'text/javascript'
      ),
      wasmURL: await toBlobURL(
        `${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`,
        'application/wasm'
      )
    });

    ffmpeg = instance;
    return instance;
  })();

  try {
    return await ffmpegPromise;
  } catch (error) {
    ffmpegPromise = null;
    throw error;
  } finally {
    if (ffmpeg) ffmpegPromise = null;
  }
}

async function convertToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < MIN_CHUNK_BYTES) {
    throw new Error('recording data is empty');
  }

  const encoder = await loadFFmpeg();
  const token = `e6_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const input = `${token}.webm`;
  const output = `${token}.mp4`;

  try {
    await encoder.writeFile(input, await fetchFile(webmBlob));

    await encoder.exec([
      '-i', input,
      '-r', String(FPS),
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-profile:v', 'main',
      '-level', '4.2',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=ceil(iw/2)*2:ceil(ih/2)*2',
      '-movflags', '+faststart',
      '-an',
      '-f', 'mp4',
      output
    ]);

    const data = await encoder.readFile(output);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const result = new Blob([bytes], { type: 'video/mp4' });

    if (result.size < 1000) {
      throw new Error('FFmpeg produced an empty MP4');
    }

    return result;
  } finally {
    try { await encoder.deleteFile(input); } catch {}
    try { await encoder.deleteFile(output); } catch {}
  }
}

export function initClipRecorder(canvas) {
  if (
    !canvas ||
    typeof canvas.captureStream !== 'function' ||
    !window.MediaRecorder
  ) {
    return false;
  }

  if (
    recording &&
    sourceCanvas === canvas &&
    recorder &&
    recorder.state !== 'inactive'
  ) {
    return true;
  }

  stopClipRecorder();

  try {
    sourceCanvas = canvas;
    sourceStream = canvas.captureStream(FPS);

    if (!sourceStream?.getVideoTracks?.().length) {
      throw new Error('Canvas video track unavailable');
    }

    recording = true;
    generation += 1;

    window.__e6ClipRecorderActive = true;
    window.__e6ClipRecorderReady = false;
    window.__e6ClipRecorderFPS = FPS;
    window.__e6ClipRecorderMime = 'video/mp4';

    if (!startRecorder()) {
      throw new Error('Could not start MediaRecorder');
    }

    return true;
  } catch (error) {
    log('Recorder initialization failed', error);
    stopClipRecorder();
    return false;
  }
}


async function validateVideoBlob(blob) {
  if (!blob || blob.size < 1000) {
    throw new Error('Video blob is empty');
  }

  if (typeof document === 'undefined') return true;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(blob);
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      try { video.load(); } catch {}
      URL.revokeObjectURL(url);
    };

    const succeed = () => {
      cleanup();
      resolve(true);
    };

    const fail = () => {
      const error = new Error('Browser could not decode the generated video');
      cleanup();
      reject(error);
    };

    const timer = setTimeout(fail, 10000);

    video.preload = 'metadata';
    video.muted = true;
    video.onloadedmetadata = succeed;
    video.onerror = fail;
    video.src = url;
    video.load();
  });
}

export function saveClip() {
  const job = async () => {
    if (
      !recording ||
      !sourceCanvas ||
      !recorder ||
      recorder.state === 'inactive'
    ) {
      return null;
    }

    const snapshot = await makeSnapshot();
    if (!snapshot) return null;

    let blob = snapshot.blob;
    let mime = recorderMime || 'video/webm';
    let extension = 'webm';

    try {
      const mp4 = await convertToMP4(snapshot.blob);
      await validateVideoBlob(mp4);
      blob = mp4;
      mime = 'video/mp4';
      extension = 'mp4';
    } catch (error) {
      // Do not throw away an otherwise valid recording just because
      // the browser could not initialize FFmpeg.
      log('MP4 conversion failed; saving the original WebM clip instead.', error);
    }

    window.__e6ClipRecorderReady = true;

    return {
      blob,
      mime,
      extension,
      duration: snapshot.duration,
      sequence: ++saveSequence
    };
  };

  const result = saveQueue.then(job, job);

  saveQueue = result.catch(error => {
    log('Queued clip save failed', error);
  });

  return result;
}

export function getClipRecordingInfo() {
  const age = recordingStartedAt
    ? (performance.now() - recordingStartedAt) / 1000
    : 0;

  return {
    active: Boolean(recording && recorder && recorder.state !== 'inactive'),
    ready: Boolean(
      recording &&
      recorder &&
      recorder.state !== 'inactive' &&
      chunkBytes >= MIN_CHUNK_BYTES
    ),
    mime: recorderMime || 'video/webm',
    extension: recorderMime === 'video/mp4' ? 'mp4' : 'webm',
    fps: FPS,
    recorderCount: recorder && recorder.state !== 'inactive' ? 1 : 0,
    completedCount: 0,
    oldestSeconds: Math.min(CLIP_SECONDS, age),
    newestSeconds: Math.min(CLIP_SECONDS, age)
  };
}

export function getClipRecordingCanvas() {
  return sourceCanvas;
}

export function isClipRecorderActive() {
  return Boolean(recording && recorder && recorder.state !== 'inactive');
}

export function stopClipRecorder() {
  recording = false;
  generation += 1;

  const oldRecorder = recorder;
  recorder = null;

  if (oldRecorder) {
    try {
      if (oldRecorder.state !== 'inactive') oldRecorder.stop();
    } catch {}
  }

  try {
    sourceStream?.getTracks?.().forEach(track => track.stop());
  } catch {}

  sourceStream = null;
  sourceCanvas = null;
  chunks = [];
  chunkBytes = 0;
  recordingStartedAt = 0;
  lastDataAt = 0;

  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
}
