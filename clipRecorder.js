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
const FFMPEG_CORE_BASES = [
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd',
  'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd'
];

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

  while (chunks.length > 2 && chunks[1].time < cutoff) {
    chunkBytes -= chunks[1].size;
    chunks.splice(1, 1);
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

    let lastError = null;
    for (const base of FFMPEG_CORE_BASES) {
      try {
        await instance.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm')
        });
        ffmpeg = instance;
        return instance;
      } catch (error) { lastError = error; }
    }
    throw lastError || new Error('FFmpeg core could not be loaded');
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

    let exitCode = await encoder.exec([
      '-y', '-i', input,
      '-an',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '21',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      output
    ]);

    if (exitCode !== 0) {
      try { await encoder.deleteFile(output); } catch {}
      exitCode = await encoder.exec([
        '-y', '-i', input,
        '-an',
        '-c:v', 'mpeg4',
        '-q:v', '5',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        output
      ]);
    }

    if (exitCode !== 0) {
      throw new Error(`FFmpeg MP4 encode failed (exit ${exitCode}); browser could not encode the rolling clip to MP4`);
    }

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
    window.__e6ClipRecorderMime = 'video/webm';

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
    if (!snapshot?.blob || snapshot.blob.size < MIN_CHUNK_BYTES) return null;

    // IMPORTANT: clips stay in their native WebM format for the entire
    // recording and storage lifecycle. MP4 conversion happens only when the
    // player explicitly downloads a clip from ClipsScreen.
    window.__e6ClipRecorderReady = true;

    return {
      blob: snapshot.blob,
      previewBlob: snapshot.blob,
      mime: snapshot.blob.type || recorderMime || 'video/webm',
      extension: 'webm',
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

export { convertToMP4 };

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
