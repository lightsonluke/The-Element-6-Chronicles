// Element 6 — always-on canvas clip recorder.
// Uses overlapping MediaRecorder windows and converts only the requested window
// to a real H.264 MP4. Automatic window rotation NEVER waits for FFmpeg.

let sourceCanvas = null;
let sourceStream = null;
let recording = false;
let generation = 0;
let saveSequence = 0;
let ffmpeg = null;
let ffmpegPromise = null;
let conversionQueue = Promise.resolve();
let saveQueue = Promise.resolve();

const FPS = 60;
const CLIP_SECONDS = 30;
const CLIP_MS = CLIP_SECONDS * 1000;
const SLOT_COUNT = 7;
const SLOT_INTERVAL_MS = 5000;
const VIDEO_BITRATE = 6000000;
const MIN_BLOB_SIZE = 1000;

const slots = new Map();

const FFMPEG_SCRIPT = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js';
const FFMPEG_CORE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function logError(message) {
  console.error(`[Element 6 Clips] ${message}`);
}

async function fetchAsBlobURL(url, type) {
  const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
  if (!response.ok) throw new Error(`Could not load FFmpeg resource: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  return URL.createObjectURL(new Blob([bytes], { type }));
}

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    if (!window.FFmpegWASM?.FFmpeg) {
      await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-e6-ffmpeg="1"]');
        if (existing) {
          if (window.FFmpegWASM?.FFmpeg) {
            resolve();
            return;
          }
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = FFMPEG_SCRIPT;
        script.async = true;
        script.dataset.e6Ffmpeg = '1';
        script.onload = resolve;
        script.onerror = () => reject(new Error('FFmpeg browser runtime failed to load'));
        document.head.appendChild(script);
      });
    }

    const Ctor = window.FFmpegWASM?.FFmpeg;
    if (!Ctor) throw new Error('FFmpeg constructor is unavailable');

    const instance = new Ctor();
    const coreURL = await fetchAsBlobURL(`${FFMPEG_CORE}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await fetchAsBlobURL(`${FFMPEG_CORE}/ffmpeg-core.wasm`, 'application/wasm');
    const workerURL = await fetchAsBlobURL(`${FFMPEG_CORE}/ffmpeg-core.worker.js`, 'text/javascript');

    try {
      await instance.load({ coreURL, wasmURL, workerURL });
    } finally {
      URL.revokeObjectURL(coreURL);
      URL.revokeObjectURL(wasmURL);
      URL.revokeObjectURL(workerURL);
    }

    ffmpeg = instance;
    return instance;
  })();

  try {
    return await ffmpegPromise;
  } finally {
    ffmpegPromise = null;
  }
}

async function convertToMP4(source) {
  if (!source || source.size < MIN_BLOB_SIZE) {
    throw new Error('Recording window was empty');
  }

  const encoder = await loadFFmpeg();
  const token = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const input = `e6_${token}.webm`;
  const output = `e6_${token}.mp4`;

  try {
    await encoder.writeFile(input, new Uint8Array(await source.arrayBuffer()));
    await encoder.exec([
      '-i', input,
      '-r', String(FPS),
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-an',
      output,
    ]);

    const data = await encoder.readFile(output);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const mp4 = new Blob([bytes], { type: 'video/mp4' });
    if (mp4.size < MIN_BLOB_SIZE) throw new Error('FFmpeg produced an empty MP4');
    return mp4;
  } finally {
    try { await encoder.deleteFile(input); } catch {}
    try { await encoder.deleteFile(output); } catch {}
  }
}

function createRecorder() {
  if (!sourceStream || !window.MediaRecorder) return null;

  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    '',
  ];

  for (const mime of candidates) {
    try {
      if (mime && MediaRecorder.isTypeSupported && !MediaRecorder.isTypeSupported(mime)) continue;
      const options = { videoBitsPerSecond: VIDEO_BITRATE };
      if (mime) options.mimeType = mime;
      return new MediaRecorder(sourceStream, options);
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

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    recorder.addEventListener('stop', done, { once: true });
    try { recorder.stop(); } catch { done(); }
    setTimeout(done, 8000);
  });
}

function startSlot(id) {
  if (!recording || !sourceStream || slots.has(id)) return false;

  const recorder = createRecorder();
  if (!recorder) return false;

  const slot = {
    id,
    recorder,
    chunks: [],
    startedAt: performance.now(),
    finalizing: false,
    stopped: false,
    timer: null,
  };

  // IMPORTANT: MediaRecorder may emit its last dataavailable event after stop().
  // Do not mark the slot stopped until stop() has completed.
  recorder.ondataavailable = event => {
    if (event.data?.size) slot.chunks.push(event.data);
  };

  recorder.onerror = event => {
    logError(`MediaRecorder error: ${event?.error?.message || 'unknown error'}`);
  };

  try {
    // A timeslice makes the window usable even before a full 30 seconds have elapsed.
    recorder.start(250);
  } catch (error) {
    logError(`MediaRecorder.start failed: ${error?.message || error}`);
    return false;
  }

  slots.set(id, slot);

  slot.timer = setTimeout(() => {
    rotateSlot(id).catch(error => logError(error?.message || error));
  }, CLIP_MS);

  return true;
}

async function stopSlot(slot) {
  if (!slot || slot.finalizing) return null;
  slot.finalizing = true;

  if (slot.timer) {
    clearTimeout(slot.timer);
    slot.timer = null;
  }

  // requestData() flushes current timeslice data; stop() then flushes the final chunk.
  try { slot.recorder.requestData?.(); } catch {}
  await wait(40);
  await stopRecorder(slot.recorder);
  slot.stopped = true;

  return new Blob(slot.chunks, {
    type: slot.recorder.mimeType || 'video/webm',
  });
}

async function rotateSlot(id) {
  const slot = slots.get(id);
  if (!slot || slot.finalizing) return;

  // CRITICAL: automatic rotation does NOT convert to MP4.
  // It stops, discards that old source, and immediately starts a fresh window.
  const source = await stopSlot(slot);
  slots.delete(id);

  if (recording && slots.size < SLOT_COUNT) startSlot(id);

  // Let GC reclaim the old recording. There is intentionally no FFmpeg work here.
  return source;
}

function chooseSlot() {
  const active = [...slots.values()]
    .filter(slot => !slot.finalizing && !slot.stopped && slot.recorder?.state === 'recording')
    .sort((a, b) => a.startedAt - b.startedAt);

  return active[0] || null;
}

async function saveOldestSlot() {
  if (!recording) return null;

  let slot = chooseSlot();
  const deadline = performance.now() + 2500;

  while (!slot && recording && performance.now() < deadline) {
    await wait(50);
    slot = chooseSlot();
  }

  if (!slot) return null;

  const startedAt = slot.startedAt;
  const source = await stopSlot(slot);
  slots.delete(slot.id);

  // Restart the window BEFORE doing any conversion. This is what makes clipping
  // seamless even when FFmpeg takes several seconds.
  if (recording) startSlot(slot.id);

  if (!source || source.size < MIN_BLOB_SIZE) return null;

  const duration = Math.min(
    CLIP_SECONDS,
    Math.max(0.25, (performance.now() - startedAt) / 1000)
  );

  // FFmpeg is serialized, but recording is not blocked by this queue.
  const mp4 = await new Promise((resolve, reject) => {
    conversionQueue = conversionQueue.then(async () => {
      try {
        resolve(await convertToMP4(source));
      } catch (error) {
        reject(error);
      }
    }).catch(() => {});
  });

  return {
    blob: mp4,
    mime: 'video/mp4',
    extension: 'mp4',
    duration,
    sequence: ++saveSequence,
  };
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function' || !window.MediaRecorder) return false;

  if (recording && sourceCanvas === canvas && slots.size > 0) return true;

  stopClipRecorder();

  try {
    sourceCanvas = canvas;
    sourceStream = canvas.captureStream(FPS);
    if (!sourceStream?.getVideoTracks?.().length) throw new Error('Canvas video track unavailable');

    recording = true;
    generation += 1;
    const myGeneration = generation;

    window.__e6ClipRecorderActive = true;
    window.__e6ClipRecorderReady = true;
    window.__e6ClipRecorderFPS = FPS;
    window.__e6ClipRecorderMime = 'video/mp4';

    if (!startSlot(0)) throw new Error('Could not start the clip recorder');

    // Stagger the initial windows so the browser is never asked to start seven
    // MediaRecorders in the same task.
    for (let i = 1; i < SLOT_COUNT; i++) {
      setTimeout(() => {
        if (recording && generation === myGeneration && !slots.has(i)) startSlot(i);
      }, i * SLOT_INTERVAL_MS);
    }

    return true;
  } catch (error) {
    logError(`Recorder initialization failed: ${error?.message || error}`);
    stopClipRecorder();
    return false;
  }
}

export function saveClip() {
  // Save requests are serialized so two presses never finalize the same slot.
  // Each selected slot is restarted immediately; only its MP4 conversion waits.
  const job = saveQueue.then(() => saveOldestSlot());
  saveQueue = job.catch(() => null);
  return job;
}

export function getClipRecordingInfo() {
  const now = performance.now();
  const ages = [...slots.values()]
    .filter(slot => !slot.stopped && !slot.finalizing)
    .map(slot => (now - slot.startedAt) / 1000);

  return {
    active: recording,
    ready: recording && slots.size > 0,
    mime: 'video/mp4',
    extension: 'mp4',
    fps: FPS,
    recorderCount: slots.size,
    oldestSeconds: ages.length ? Math.max(...ages) : 0,
    newestSeconds: ages.length ? Math.min(...ages) : 0,
  };
}

export function getClipRecordingCanvas() {
  return sourceCanvas;
}

export function isClipRecorderActive() {
  return recording && slots.size > 0;
}

export function stopClipRecorder() {
  recording = false;
  generation += 1;

  for (const slot of slots.values()) {
    slot.finalizing = true;
    slot.stopped = true;
    if (slot.timer) clearTimeout(slot.timer);
    try { if (slot.recorder.state !== 'inactive') slot.recorder.stop(); } catch {}
  }

  slots.clear();

  try { sourceStream?.getTracks?.().forEach(track => track.stop()); } catch {}

  sourceStream = null;
  sourceCanvas = null;

  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
}
