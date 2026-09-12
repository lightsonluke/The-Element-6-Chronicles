// Element 6 clips: reliable 60 FPS canvas capture -> WebM -> MP4 conversion.
// IMPORTANT: MediaRecorder is used for the actual recording because Chrome commonly
// does not support MP4 MediaRecorder output. The recorded WebM is then converted to
// a standards-compliant H.264/AAC MP4 with ffmpeg.wasm.
//
// Install:
//   npm install @ffmpeg/ffmpeg @ffmpeg/util
//
// This recorder deliberately does NOT manufacture MP4 by changing a WebM extension.

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let sourceCanvas = null;
let sourceStream = null;
let recording = false;
let sequence = 0;
let recordingGeneration = 0;
let saveBusy = false;
let ffmpeg = null;
let ffmpegLoading = null;

const FPS = 60;
const CLIP_SECONDS = 30;
const CLIP_MS = CLIP_SECONDS * 1000;
const SLOT_COUNT = 7;
const SLOT_STAGGER_MS = 5000;
const VIDEO_BITRATE = 6000000;

const slots = new Map();

function now() {
  return performance.now();
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeId() {
  sequence += 1;
  return `e6_clip_${Date.now()}_${sequence}_${Math.random().toString(36).slice(2, 8)}`;
}

function stopRecorder(recorder) {
  return new Promise(resolve => {
    if (!recorder || recorder.state === 'inactive') {
      resolve();
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    recorder.addEventListener('stop', finish, { once: true });

    try {
      recorder.stop();
    } catch {
      finish();
    }

    setTimeout(finish, 5000);
  });
}

function createRecorder() {
  if (!sourceStream || !window.MediaRecorder) return null;

  // Record in WebM first. This is the reliable path in Chromium.
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];

  for (const mimeType of candidates) {
    try {
      if (!MediaRecorder.isTypeSupported(mimeType)) continue;
      return new MediaRecorder(sourceStream, {
        mimeType,
        videoBitsPerSecond: VIDEO_BITRATE
      });
    } catch {}
  }

  try {
    return new MediaRecorder(sourceStream, {
      videoBitsPerSecond: VIDEO_BITRATE
    });
  } catch {
    return null;
  }
}

function startSlot(id) {
  if (!recording || !sourceStream || slots.has(id)) return false;

  const recorder = createRecorder();
  if (!recorder) return false;

  const slot = {
    id,
    recorder,
    chunks: [],
    startedAt: now(),
    finished: false,
    timer: null,
    mime: recorder.mimeType || 'video/webm'
  };

  recorder.ondataavailable = event => {
    if (slot.finished) return;
    if (event.data && event.data.size > 0) slot.chunks.push(event.data);
  };

  recorder.onerror = event => {
    console.error('[Element 6 Clips] Recorder error:', event?.error || event);
  };

  try {
    recorder.start(1000);
  } catch (error) {
    console.error('[Element 6 Clips] Recorder start failed:', error);
    return false;
  }

  slot.timer = setTimeout(() => {
    finishSlot(id, false).catch(error =>
      console.error('[Element 6 Clips] Automatic slot finish failed:', error)
    );
  }, CLIP_MS);

  slots.set(id, slot);
  return true;
}

async function finishSlot(id, requested) {
  const slot = slots.get(id);
  if (!slot || slot.finished) return null;

  slot.finished = true;
  if (slot.timer) clearTimeout(slot.timer);
  slot.timer = null;

  await stopRecorder(slot.recorder);
  slots.delete(id);

  const elapsed = Math.max(0, (now() - slot.startedAt) / 1000);
  if (!slot.chunks.length) return null;

  const blob = new Blob(slot.chunks, { type: slot.mime || 'video/webm' });

  return {
    id: makeId(),
    blob,
    sourceMime: slot.mime || 'video/webm',
    duration: Math.min(CLIP_SECONDS, elapsed),
    requested
  };
}

async function restartSlot(id) {
  if (!recording || slots.has(id)) return;
  startSlot(id);
}

async function maintainSlots() {
  for (let i = 0; i < SLOT_COUNT; i++) {
    setTimeout(() => {
      if (recording) startSlot(i);
    }, i * SLOT_STAGGER_MS);
  }
}

async function ensureFFmpeg() {
  if (ffmpeg) return ffmpeg;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const instance = new FFmpeg();

    // Load the browser worker/core from the official jsDelivr package distribution.
    const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

    await instance.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${base}/ffmpeg-core.worker.js`, 'text/javascript')
    });

    ffmpeg = instance;
    return instance;
  })();

  try {
    return await ffmpegLoading;
  } finally {
    ffmpegLoading = null;
  }
}

async function convertWebMToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size <= 0) {
    throw new Error('Empty recording');
  }

  const encoder = await ensureFFmpeg();
  const inputName = `input_${Date.now()}_${Math.random().toString(36).slice(2)}.webm`;
  const outputName = `output_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;

  try {
    await encoder.writeFile(inputName, await fetchFile(webmBlob));

    await encoder.exec([
      '-i', inputName,
      '-vf', 'fps=60',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-an',
      outputName
    ]);

    const data = await encoder.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const mp4 = new Blob([bytes], { type: 'video/mp4' });

    if (!mp4.size) throw new Error('FFmpeg returned an empty MP4');

    // Basic browser decode check. We only return the MP4 if the browser can
    // parse its container and obtain real metadata.
    const check = document.createElement('video');
    const url = URL.createObjectURL(mp4);

    const valid = await new Promise(resolve => {
      let finished = false;
      const done = value => {
        if (finished) return;
        finished = true;
        try { check.removeAttribute('src'); check.load(); } catch {}
        URL.revokeObjectURL(url);
        resolve(value);
      };

      check.preload = 'metadata';
      check.onloadedmetadata = () => {
        const duration = Number(check.duration);
        done(Number.isFinite(duration) && duration > 0);
      };
      check.onerror = () => done(false);
      check.src = url;
      check.load();

      setTimeout(() => done(false), 8000);
    });

    if (!valid) throw new Error('Generated MP4 failed browser validation');

    return mp4;
  } finally {
    try { await encoder.deleteFile(inputName); } catch {}
    try { await encoder.deleteFile(outputName); } catch {}
  }
}

export function getClipRecordingCanvas() {
  return sourceCanvas;
}

export function getClipRecordingInfo() {
  const ages = [...slots.values()].map(slot =>
    Math.max(0, (now() - slot.startedAt) / 1000)
  );

  return {
    active: recording,
    ready: recording && slots.size > 0,
    mime: 'video/mp4',
    extension: 'mp4',
    recorderCount: slots.size,
    oldestSeconds: ages.length ? Math.max(...ages) : 0,
    newestSeconds: ages.length ? Math.min(...ages) : 0,
    fps: FPS
  };
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function' || !window.MediaRecorder) {
    return false;
  }

  if (recording) {
    if (sourceCanvas === canvas) return true;
    stopClipRecorder();
  }

  try {
    sourceCanvas = canvas;
    sourceStream = canvas.captureStream(FPS);

    if (!sourceStream || !sourceStream.getVideoTracks().length) {
      sourceCanvas = null;
      sourceStream = null;
      return false;
    }

    recording = true;
    recordingGeneration += 1;

    window.__e6ClipRecorderActive = true;
    window.__e6ClipRecorderReady = false;
    window.__e6ClipRecorderMime = 'video/mp4';
    window.__e6ClipRecorderFPS = FPS;

    maintainSlots();

    // The recorder is usable as soon as at least one slot starts. We do not
    // wait for 30 seconds and we do not require native MP4 MediaRecorder support.
    const started = startSlot(999);
    if (!started) {
      stopClipRecorder();
      return false;
    }

    window.__e6ClipRecorderReady = true;
    return true;
  } catch (error) {
    console.error('[Element 6 Clips] Initialization failed:', error);
    stopClipRecorder();
    return false;
  }
}

export async function saveClip() {
  if (saveBusy || !recording || !slots.size) return null;

  saveBusy = true;

  try {
    const current = [...slots.values()]
      .filter(slot => !slot.finished)
      .sort((a, b) => b.startedAt - a.startedAt);

    // Prefer the newest fully mature 30s slot. If none is mature yet, choose
    // the oldest active slot: it contains the most history and will finish soon.
    let target = current.find(slot => now() - slot.startedAt >= CLIP_MS - 250);
    if (!target) target = current[0];

    if (!target) return null;

    const targetId = target.id;
    const remaining = Math.max(
      0,
      CLIP_MS - (now() - target.startedAt)
    );

    // Let the selected recorder finish naturally so its WebM is a complete,
    // valid container. This is usually <=5 seconds because of the stagger.
    if (remaining > 0) await wait(Math.min(remaining + 150, 5500));

    let result = await finishSlot(targetId, true);

    // If the selected slot was automatically finished between the wait and
    // this call, it may already be gone. Find the next available mature slot.
    if (!result) {
      const mature = [...slots.values()]
        .filter(slot => !slot.finished)
        .sort((a, b) => (b.startedAt - a.startedAt));

      const fallback = mature.find(slot => now() - slot.startedAt >= CLIP_MS - 250);
      if (fallback) result = await finishSlot(fallback.id, true);
    }

    if (!result) return null;

    // Immediately replace the consumed recording window.
    if (recording) {
      startSlot(targetId);
    }

    const mp4 = await convertWebMToMP4(result.blob);

    return {
      blob: mp4,
      mime: 'video/mp4',
      extension: 'mp4',
      duration: result.duration,
      sequence: sequence
    };
  } catch (error) {
    console.error('[Element 6 Clips] MP4 conversion failed:', error);
    return null;
  } finally {
    saveBusy = false;
  }
}

export function stopClipRecorder() {
  recording = false;
  recordingGeneration += 1;

  for (const slot of slots.values()) {
    slot.finished = true;
    if (slot.timer) clearTimeout(slot.timer);
    try {
      if (slot.recorder?.state !== 'inactive') slot.recorder.stop();
    } catch {}
  }

  slots.clear();

  try {
    sourceStream?.getTracks?.().forEach(track => track.stop());
  } catch {}

  sourceStream = null;
  sourceCanvas = null;

  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
}

export function isClipRecorderActive() {
  return recording && slots.size > 0;
}
