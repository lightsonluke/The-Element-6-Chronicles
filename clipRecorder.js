// Element 6 — always-on canvas clip recorder.
// Keeps a rolling set of WebM windows in memory. MP4/H.264 conversion happens
// ONLY when the player asks to save a clip, so the recorder can never exhaust
// itself by converting expired windows in the background.

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
const VIDEO_BITRATE = 8000000;
const MAX_COMPLETED = 14;
const slots = new Map();
const completed = [];

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function logError(message) { console.error(`[Element 6 Clips] ${message}`); }

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    const instance = new FFmpeg();
    const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
    await instance.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${base}/ffmpeg-core.worker.js`, 'text/javascript'),
    });
    ffmpeg = instance;
    return instance;
  })();
  try { return await ffmpegPromise; } finally { ffmpegPromise = null; }
}

async function convertToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < 1000) throw new Error('Recording data is empty');
  const encoder = await loadFFmpeg();
  const token = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const input = `e6_${token}.webm`;
  const output = `e6_${token}.mp4`;
  try {
    await encoder.writeFile(input, new Uint8Array(await webmBlob.arrayBuffer()));
    const code = await encoder.exec([
      '-i', input,
      '-an',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-r', String(FPS),
      '-movflags', '+faststart',
      output,
    ]);
    if (typeof code === 'number' && code !== 0) throw new Error(`FFmpeg exited with code ${code}`);
    const data = await encoder.readFile(output);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.byteLength < 1000) throw new Error('FFmpeg produced an empty MP4');
    return new Blob([bytes], { type: 'video/mp4' });
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
      const opts = { videoBitsPerSecond: VIDEO_BITRATE };
      if (mime) opts.mimeType = mime;
      return new MediaRecorder(sourceStream, opts);
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
    setTimeout(finish, 5000);
  });
}

function makeWindow(slot) {
  return {
    id: `${slot.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    blob: new Blob(slot.chunks, { type: slot.recorder.mimeType || 'video/webm' }),
    startedAt: slot.startedAt,
    endedAt: performance.now(),
    duration: Math.min(CLIP_SECONDS, Math.max(0.25, (performance.now() - slot.startedAt) / 1000)),
  };
}

function pushCompleted(windowData) {
  if (!windowData?.blob || windowData.blob.size < 1000) return;
  completed.push(windowData);
  while (completed.length > MAX_COMPLETED) completed.shift();
}

function startSlot(id) {
  if (!recording || !sourceStream || slots.has(id)) return false;
  const recorder = createRecorder();
  if (!recorder) return false;
  const slot = { id, recorder, chunks: [], startedAt: performance.now(), stopped: false, finalizing: false, timer: null };
  recorder.ondataavailable = e => { if (e.data?.size) slot.chunks.push(e.data); };
  recorder.onerror = e => logError(`MediaRecorder error: ${e?.error?.message || 'unknown'}`);
  try { recorder.start(250); } catch (e) { logError(`MediaRecorder.start failed: ${e?.message || e}`); return false; }
  slots.set(id, slot);
  slot.timer = setTimeout(() => finishSlot(id).catch(e => logError(e?.message || e)), CLIP_MS);
  return true;
}

async function finishSlot(id) {
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
  const windowData = makeWindow(slot);
  pushCompleted(windowData);
  // Start the replacement immediately. Never wait for FFmpeg.
  if (recording) startSlot(id);
  return windowData;
}

function chooseCompleted() {
  return completed.length ? completed[completed.length - 1] : null;
}

async function finalizeOldestActiveForFirstClip() {
  const active = [...slots.values()].filter(s => !s.finalizing).sort((a, b) => a.startedAt - b.startedAt)[0];
  if (!active) return null;
  return finishSlot(active.id);
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function' || !window.MediaRecorder) return false;
  if (recording && sourceCanvas === canvas && slots.size) return true;
  if (recording && sourceCanvas !== canvas) stopClipRecorder(false);
  else if (recording) stopClipRecorder(false);
  else stopClipRecorder(true);
  try {
    sourceCanvas = canvas;
    sourceStream = canvas.captureStream(FPS);
    if (!sourceStream?.getVideoTracks?.().length) throw new Error('Canvas video track unavailable');
    recording = true;
    generation += 1;
    const g = generation;
    window.__e6ClipRecorderActive = true;
    window.__e6ClipRecorderReady = true;
    window.__e6ClipRecorderFPS = FPS;
    window.__e6ClipRecorderMime = 'video/mp4';
    if (!startSlot(0)) throw new Error('Could not start the first recorder');
    for (let i = 1; i < SLOT_COUNT; i++) {
      setTimeout(() => {
        if (recording && generation === g && !slots.has(i)) startSlot(i);
      }, i * SLOT_INTERVAL_MS);
    }
    return true;
  } catch (e) {
    logError(`Recorder initialization failed: ${e?.message || e}`);
    stopClipRecorder();
    return false;
  }
}

export function saveClip() {
  const job = saveQueue.then(async () => {
    if (!recording) return null;
    // Prefer a complete rolling window. If the user clips before the first
    // 30-second window has completed, finalize the oldest active window so the
    // player still gets a real recording rather than a false "not ready" state.
    let windowData = chooseCompleted();
    if (!windowData) windowData = await finalizeOldestActiveForFirstClip();
    if (!windowData?.blob || windowData.blob.size < 1000) return null;

    let mp4;
    const conversionJob = conversionQueue.then(async () => {
      mp4 = await convertToMP4(windowData.blob);
    });
    conversionQueue = conversionJob.catch(() => {});
    await conversionJob;
    if (!mp4 || mp4.size < 1000) throw new Error('MP4 conversion failed');
    return { blob: mp4, mime: 'video/mp4', extension: 'mp4', duration: windowData.duration, sequence: ++saveSequence };
  });
  saveQueue = job.catch(() => null);
  return job;
}

export function getClipRecordingInfo() {
  const now = performance.now();
  const ages = [...slots.values()].map(s => (now - s.startedAt) / 1000);
  return {
    active: recording,
    ready: recording && (slots.size > 0 || completed.length > 0),
    mime: 'video/mp4', extension: 'mp4', fps: FPS,
    recorderCount: slots.size, completedCount: completed.length,
    oldestSeconds: ages.length ? Math.max(...ages) : 0,
    newestSeconds: ages.length ? Math.min(...ages) : 0,
  };
}
export function getClipRecordingCanvas() { return sourceCanvas; }
export function isClipRecorderActive() { return recording && (slots.size > 0 || completed.length > 0); }

export function stopClipRecorder(clearCompleted = true) {
  recording = false;
  generation += 1;
  for (const slot of slots.values()) {
    slot.stopped = true;
    if (slot.timer) clearTimeout(slot.timer);
    try { if (slot.recorder.state !== 'inactive') slot.recorder.stop(); } catch {}
  }
  slots.clear();
  if (clearCompleted) completed.length = 0;
  try { sourceStream?.getTracks?.().forEach(track => track.stop()); } catch {}
  sourceStream = null;
  sourceCanvas = null;
  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
}
