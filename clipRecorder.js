// Element 6 — always-on canvas clip recorder.
// Records overlapping WebM windows continuously and converts a selected window
// to a real H.264 MP4 at save time. No static FFmpeg package import.

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
const MIN_BLOB_BYTES = 1000;
const slots = new Map();

const FFMPEG_SCRIPT = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js';
const FFMPEG_CORE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function blobURL(url, type) {
  const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
  if (!response.ok) throw new Error(`Could not load ${url}: HTTP ${response.status}`);
  return URL.createObjectURL(new Blob([await response.arrayBuffer()], { type }));
}

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    if (!window.FFmpegWASM?.FFmpeg) {
      await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-e6-ffmpeg="1"]');
        if (existing) {
          if (window.FFmpegWASM?.FFmpeg) { resolve(); return; }
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
    const coreURL = await blobURL(`${FFMPEG_CORE}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await blobURL(`${FFMPEG_CORE}/ffmpeg-core.wasm`, 'application/wasm');
    const workerURL = await blobURL(`${FFMPEG_CORE}/ffmpeg-core.worker.js`, 'text/javascript');
    try {
      await instance.load({ coreURL, wasmURL, workerURL });
    } finally {
      URL.revokeObjectURL(coreURL); URL.revokeObjectURL(wasmURL); URL.revokeObjectURL(workerURL);
    }
    ffmpeg = instance;
    return instance;
  })();
  try { return await ffmpegPromise; } finally { ffmpegPromise = null; }
}

async function convertToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < MIN_BLOB_BYTES) throw new Error('The recording window was empty');
  const encoder = await loadFFmpeg();
  const token = `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
  const input = `e6_${token}.webm`;
  const output = `e6_${token}.mp4`;
  try {
    await encoder.writeFile(input, new Uint8Array(await webmBlob.arrayBuffer()));
    await encoder.exec([
      '-i', input,
      '-r', '60',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-an', output,
    ]);
    const data = await encoder.readFile(output);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const result = new Blob([bytes], { type: 'video/mp4' });
    if (result.size < MIN_BLOB_BYTES) throw new Error('FFmpeg returned an empty MP4');
    return result;
  } finally {
    try { await encoder.deleteFile(input); } catch {}
    try { await encoder.deleteFile(output); } catch {}
  }
}

function createRecorder() {
  if (!sourceStream || !window.MediaRecorder) return null;
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', ''];
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
    if (!recorder || recorder.state === 'inactive') return resolve();
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    recorder.addEventListener('stop', finish, { once: true });
    try { recorder.stop(); } catch { finish(); }
    setTimeout(finish, 8000);
  });
}

function startSlot(id) {
  if (!recording || !sourceStream || slots.has(id)) return false;
  const recorder = createRecorder();
  if (!recorder) return false;
  const slot = {
    id, recorder, chunks: [], startedAt: performance.now(), stopped: false,
    finalizing: false, timer: null,
  };
  recorder.ondataavailable = event => {
    if (!slot.stopped && event.data?.size) slot.chunks.push(event.data);
  };
  recorder.onerror = event => console.error('[Element 6 Clips] MediaRecorder error:', event?.error || event);
  try { recorder.start(250); }
  catch (error) { console.error('[Element 6 Clips] MediaRecorder.start failed:', error); return false; }
  slots.set(id, slot);
  slot.timer = setTimeout(() => {
    finishSlot(id, true).catch(error => console.error('[Element 6 Clips] Automatic window finish failed:', error));
  }, CLIP_MS);
  return true;
}

// Finish the recording portion immediately, then restart the same slot BEFORE
// doing any FFmpeg work. This is the key to keeping the recorder continuously
// armed even while a clip is being converted.
async function finishSlot(id, restartImmediately = false) {
  const slot = slots.get(id);
  if (!slot || slot.finalizing) return null;
  slot.finalizing = true;
  if (slot.timer) clearTimeout(slot.timer);
  slot.timer = null;

  try { slot.recorder.requestData?.(); } catch {}
  await wait(80);
  await stopRecorder(slot.recorder);
  slot.stopped = true;
  slots.delete(id);

  const source = new Blob(slot.chunks, { type: slot.recorder.mimeType || 'video/webm' });
  const duration = Math.min(CLIP_SECONDS, Math.max(0.1, (performance.now() - slot.startedAt) / 1000));

  // Restart before conversion. Automatic windows are intentionally discarded;
  // they exist only to keep a rolling history. Manual saves convert this source.
  if (restartImmediately && recording) startSlot(id);

  if (source.size < MIN_BLOB_BYTES) return null;

  const mp4 = await new Promise((resolve, reject) => {
    conversionQueue = conversionQueue.then(async () => {
      try { resolve(await convertToMP4(source)); }
      catch (error) { reject(error); }
    }).catch(() => {});
  });
  return { blob: mp4, mime: 'video/mp4', extension: 'mp4', duration };
}

function chooseSlot() {
  const active = [...slots.values()]
    .filter(slot => !slot.stopped && !slot.finalizing)
    .sort((a, b) => a.startedAt - b.startedAt);
  // Prefer the oldest window. During the first 30 seconds this intentionally
  // returns a partial recording rather than reporting "not ready".
  return active[0] || null;
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function' || !window.MediaRecorder) return false;
  if (recording && sourceCanvas === canvas && slots.size) return true;
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
    if (!startSlot(0)) throw new Error('Could not start the first clip recorder');
    for (let i = 1; i < SLOT_COUNT; i++) {
      setTimeout(() => {
        if (recording && generation === myGeneration && !slots.has(i)) startSlot(i);
      }, i * SLOT_INTERVAL_MS);
    }
    return true;
  } catch (error) {
    console.error('[Element 6 Clips] Recorder initialization failed:', error);
    stopClipRecorder();
    return false;
  }
}

export function saveClip() {
  const job = saveQueue.then(async () => {
    if (!recording) return null;
    const slot = chooseSlot();
    if (!slot) return null;
    // Restart the consumed window as soon as its recorder is stopped; do not
    // wait for the MP4 conversion.
    const result = await finishSlot(slot.id, true);
    if (!result) return null;
    return { ...result, sequence: ++saveSequence };
  });
  saveQueue = job.catch(() => null);
  return job;
}

export function getClipRecordingInfo() {
  const now = performance.now();
  const ages = [...slots.values()].filter(s => !s.stopped).map(s => (now - s.startedAt) / 1000);
  return {
    active: recording, ready: recording && slots.size > 0, mime: 'video/mp4', extension: 'mp4',
    fps: FPS, recorderCount: slots.size,
    oldestSeconds: ages.length ? Math.max(...ages) : 0,
    newestSeconds: ages.length ? Math.min(...ages) : 0,
  };
}
export function getClipRecordingCanvas() { return sourceCanvas; }
export function isClipRecorderActive() { return recording && slots.size > 0; }

export function stopClipRecorder() {
  recording = false;
  generation += 1;
  for (const slot of slots.values()) {
    slot.stopped = true;
    if (slot.timer) clearTimeout(slot.timer);
    try { if (slot.recorder.state !== 'inactive') slot.recorder.stop(); } catch {}
  }
  slots.clear();
  try { sourceStream?.getTracks?.().forEach(track => track.stop()); } catch {}
  sourceStream = null; sourceCanvas = null;
  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
}
