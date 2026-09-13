// Element 6 — always-on canvas clip recorder.
// Captures the game's canvas only. Recording stays active continuously while a
// gameplay canvas exists. MP4 conversion happens ONLY when the player clips.

let sourceCanvas = null;
let sourceStream = null;
let recording = false;
let generation = 0;
let saveSequence = 0;
let ffmpeg = null;
let ffmpegPromise = null;
let conversionQueue = Promise.resolve();
let saveQueue = Promise.resolve();
let sequenceTimer = null;

const FPS = 60;
const CLIP_SECONDS = 30;
const CLIP_MS = CLIP_SECONDS * 1000;
const SLOT_COUNT = 7;
const SLOT_INTERVAL_MS = 5000;
const VIDEO_BITRATE = 6000000;
const MIN_BLOB_SIZE = 1000;
const COMPLETED_RETENTION_MS = 45000;

const slots = new Map();
const completedSlots = new Map();

const FFMPEG_SCRIPT_URLS = [
  'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js',
  'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js',
];
const FFMPEG_CORE_BASES = [
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd',
  'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd',
];

function toastlessError(message) {
  console.error(`[Element 6 Clips] ${message}`);
}

async function fetchBlobURL(url, type) {
  const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
  if (!response.ok) throw new Error(`Could not load ${url}: HTTP ${response.status}`);
  const data = await response.arrayBuffer();
  return URL.createObjectURL(new Blob([data], { type }));
}

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    if (!window.FFmpegWASM?.FFmpeg) {
      let loaded = false;
      let lastError = null;
      for (const url of FFMPEG_SCRIPT_URLS) {
        try {
          await new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-e6-ffmpeg="1"]');
            if (existing) {
              if (window.FFmpegWASM?.FFmpeg) { resolve(); return; }
              existing.addEventListener('load', resolve, { once: true });
              existing.addEventListener('error', reject, { once: true });
              return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.dataset.e6Ffmpeg = '1';
            script.onload = resolve;
            script.onerror = () => reject(new Error(`FFmpeg script failed: ${url}`));
            document.head.appendChild(script);
          });
          if (window.FFmpegWASM?.FFmpeg) { loaded = true; break; }
        } catch (error) {
          lastError = error;
          const bad = document.querySelector('script[data-e6-ffmpeg="1"]');
          bad?.remove();
        }
      }
      if (!loaded) throw lastError || new Error('FFmpeg browser runtime failed to load');
    }

    const Ctor = window.FFmpegWASM?.FFmpeg;
    if (!Ctor) throw new Error('FFmpeg constructor is unavailable');
    const instance = new Ctor();
    let lastError = null;

    for (const base of FFMPEG_CORE_BASES) {
      let coreURL = null, wasmURL = null, workerURL = null;
      try {
        coreURL = await fetchBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript');
        wasmURL = await fetchBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm');
        workerURL = await fetchBlobURL(`${base}/ffmpeg-core.worker.js`, 'text/javascript');
        await instance.load({ coreURL, wasmURL, workerURL });
        ffmpeg = instance;
        return instance;
      } catch (error) {
        lastError = error;
      } finally {
        if (coreURL) URL.revokeObjectURL(coreURL);
        if (wasmURL) URL.revokeObjectURL(wasmURL);
        if (workerURL) URL.revokeObjectURL(workerURL);
      }
    }
    throw lastError || new Error('FFmpeg core failed to load');
  })();

  try { return await ffmpegPromise; }
  finally { ffmpegPromise = null; }
}

async function convertToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < MIN_BLOB_SIZE) throw new Error('The recording window was empty');
  const encoder = await loadFFmpeg();
  const token = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
      '-an',
      output,
    ]);
    const data = await encoder.readFile(output);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const result = new Blob([bytes], { type: 'video/mp4' });
    if (result.size < MIN_BLOB_SIZE) throw new Error('FFmpeg returned an empty MP4');
    return result;
  } finally {
    try { await encoder.deleteFile(input); } catch {}
    try { await encoder.deleteFile(output); } catch {}
  }
}

function createRecorder() {
  if (!sourceStream || !window.MediaRecorder) return null;
  const candidates = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1',
    'video/mp4',
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
    id,
    recorder,
    chunks: [],
    startedAt: performance.now(),
    stopped: false,
    finalizing: false,
    timer: null,
    mime: '',
  };
  recorder.ondataavailable = event => {
    if (event.data?.size) slot.chunks.push(event.data);
  };
  recorder.onerror = event => toastlessError(`MediaRecorder error: ${event?.error?.message || 'unknown error'}`);
  try { recorder.start(250); }
  catch (error) { toastlessError(`MediaRecorder.start failed: ${error?.message || error}`); return false; }
  slot.mime = recorder.mimeType || 'video/webm';
  slots.set(id, slot);
  slot.timer = setTimeout(() => rotateSlot(id).catch(error => toastlessError(error?.message || error)), CLIP_MS);
  return true;
}

async function collectSlot(slot) {
  if (!slot) return null;
  try { slot.recorder.requestData?.(); } catch {}
  await new Promise(resolve => setTimeout(resolve, 150));
  await stopRecorder(slot.recorder);
  slot.stopped = true;
  const source = new Blob(slot.chunks, { type: slot.mime || slot.recorder.mimeType || 'video/webm' });
  if (source.size < MIN_BLOB_SIZE) return null;
  return {
    id: slot.id,
    source,
    mime: source.type || slot.mime || 'video/webm',
    startedAt: slot.startedAt,
    endedAt: performance.now(),
    duration: Math.min(CLIP_SECONDS, Math.max(0.25, (performance.now() - slot.startedAt) / 1000)),
  };
}

async function rotateSlot(id) {
  const slot = slots.get(id);
  if (!slot || slot.finalizing) return;
  slot.finalizing = true;
  if (slot.timer) clearTimeout(slot.timer);
  slot.timer = null;
  const generationAtStart = generation;
  const item = await collectSlot(slot);
  slots.delete(id);
  if (item) {
    completedSlots.set(`${generation}:${id}`, item);
    cleanupCompleted();
  }
  if (recording && generation === generationAtStart) startSlot(id);
}

function cleanupCompleted() {
  const now = performance.now();
  for (const [id, item] of completedSlots) {
    if (now - item.endedAt > COMPLETED_RETENTION_MS) completedSlots.delete(id);
  }
}

function chooseClipSource() {
  cleanupCompleted();
  const complete = [...completedSlots.values()].sort((a, b) => b.endedAt - a.endedAt);
  if (complete.length) return { kind: 'completed', item: complete[0] };
  const active = [...slots.values()]
    .filter(slot => !slot.stopped && !slot.finalizing)
    .sort((a, b) => a.startedAt - b.startedAt);
  return active.length ? { kind: 'active', item: active[0] } : null;
}

async function convertSource(item) {
  const directMP4 = String(item.mime || '').toLowerCase().includes('video/mp4');
  if (directMP4) return new Blob([item.source], { type: 'video/mp4' });
  let result = null;
  const run = conversionQueue.then(
    async () => { result = await convertToMP4(item.source); },
    async () => { result = await convertToMP4(item.source); },
  );
  conversionQueue = run.then(() => null, () => null);
  await run;
  if (!result) throw new Error('MP4 conversion produced no output');
  return result;
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function' || !window.MediaRecorder) return false;
  if (recording && sourceCanvas === canvas && slots.size) return true;

  // Switching from one game canvas to another must NOT erase completed
  // windows from the previous match. Those windows are exactly what lets a
  // player save from a victory/match-facts screen after the match canvas is gone.
  if (recording && sourceCanvas !== canvas) {
    generation += 1;
    for (const slot of slots.values()) {
      slot.stopped = true;
      if (slot.timer) clearTimeout(slot.timer);
      try { if (slot.recorder.state !== 'inactive') slot.recorder.stop(); } catch {}
    }
    slots.clear();
    try { sourceStream?.getTracks?.().forEach(track => track.stop()); } catch {}
    sourceStream = null;
    recording = false;
  } else if (!recording) {
    // Starting from a completely idle state can safely clear stale completed
    // windows left from a previous session.
    completedSlots.clear();
  }

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
    toastlessError(`Recorder initialization failed: ${error?.message || error}`);
    stopClipRecorder();
    return false;
  }
}

export function saveClip() {
  const job = saveQueue.catch(() => null).then(async () => {
    if (!recording && completedSlots.size === 0) return null;
    const chosen = chooseClipSource();
    if (!chosen) return null;

    let item;
    if (chosen.kind === 'completed') {
      item = chosen.item;
      completedSlots.delete(item.id);
    } else {
      const slot = chosen.item;
      slot.finalizing = true;
      if (slot.timer) clearTimeout(slot.timer);
      const collected = await collectSlot(slot);
      slots.delete(slot.id);
      if (recording) startSlot(slot.id);
      if (!collected) return null;
      item = collected;
    }

    const mp4 = await convertSource(item);
    return {
      blob: mp4,
      mime: 'video/mp4',
      extension: 'mp4',
      duration: item.duration,
      sequence: ++saveSequence,
    };
  });
  saveQueue = job.then(() => null, error => {
    toastlessError(`Clip save failed internally: ${error?.message || error}`);
    return null;
  });
  return job;
}

export function getClipRecordingInfo() {
  cleanupCompleted();
  const now = performance.now();
  const ages = [...slots.values()].filter(s => !s.stopped).map(s => (now - s.startedAt) / 1000);
  return {
    active: recording,
    ready: recording && (slots.size > 0 || completedSlots.size > 0),
    mime: 'video/mp4',
    extension: 'mp4',
    fps: FPS,
    recorderCount: slots.size,
    completedCount: completedSlots.size,
    oldestSeconds: ages.length ? Math.max(...ages) : 0,
    newestSeconds: ages.length ? Math.min(...ages) : 0,
  };
}

export function getClipRecordingCanvas() { return sourceCanvas; }
export function isClipRecorderActive() { return recording && (slots.size > 0 || completedSlots.size > 0); }

export function stopClipRecorder() {
  recording = false;
  generation += 1;
  if (sequenceTimer) clearTimeout(sequenceTimer);
  sequenceTimer = null;
  for (const slot of slots.values()) {
    slot.stopped = true;
    if (slot.timer) clearTimeout(slot.timer);
    try { if (slot.recorder.state !== 'inactive') slot.recorder.stop(); } catch {}
  }
  slots.clear();
  completedSlots.clear();
  try { sourceStream?.getTracks?.().forEach(track => track.stop()); } catch {}
  sourceStream = null;
  sourceCanvas = null;
  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
}
