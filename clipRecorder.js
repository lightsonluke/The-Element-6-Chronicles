// Element 6 clip recorder
// Build-safe: NO static @ffmpeg imports.
// Captures only the game's canvas at 60 FPS.
// Records complete WebM sessions, then converts each completed session to a
// real H.264 MP4 at runtime using FFmpeg.wasm loaded from CDN.
// Never uses getDisplayMedia().

let sourceCanvas = null;
let sourceStream = null;
let recording = false;
let generation = 0;
let sequence = 0;
let ffmpegInstance = null;
let ffmpegLoadPromise = null;
let conversionQueue = Promise.resolve();

const FPS = 60;
const CLIP_SECONDS = 30;
const CLIP_MS = CLIP_SECONDS * 1000;
const SLOT_COUNT = 7;
const SLOT_STAGGER_MS = 5000;
const VIDEO_BITRATE = 6000000;

const slots = new Map();

const FFMPEG_MAIN =
  'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js';
const FFMPEG_CORE =
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

async function blobUrlFromURL(url, type) {
  const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
  const data = await response.blob();
  return URL.createObjectURL(new Blob([data], { type }));
}

async function loadFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoadPromise) return ffmpegLoadPromise;

  ffmpegLoadPromise = (async () => {
    if (!window.FFmpegWASM?.FFmpeg) {
      const source = await fetch(FFMPEG_MAIN, {
        mode: 'cors',
        cache: 'force-cache',
      });
      if (!source.ok) throw new Error(`HTTP ${source.status} loading FFmpeg`);

      const text = await source.text();

      // Importing the fetched UMD file as a Blob keeps Vite/Rollup from
      // trying to resolve @ffmpeg/ffmpeg during the production build.
      const patched = text.replace(
        'new URL(e.p+e.u(814),e.b)',
        'new URL(e.p+e.u(814),r.workerLoadURL)'
      );

      const url = URL.createObjectURL(
        new Blob([patched], { type: 'text/javascript' })
      );

      try {
        await import(/* @vite-ignore */ url);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    const FFmpegCtor = window.FFmpegWASM?.FFmpeg;
    if (!FFmpegCtor) {
      throw new Error('FFmpeg.wasm loaded but FFmpeg constructor is unavailable');
    }

    const ffmpeg = new FFmpegCtor();

    const coreURL = await blobUrlFromURL(
      `${FFMPEG_CORE}/ffmpeg-core.js`,
      'text/javascript'
    );
    const wasmURL = await blobUrlFromURL(
      `${FFMPEG_CORE}/ffmpeg-core.wasm`,
      'application/wasm'
    );

    const workerLoadURL = await blobUrlFromURL(
      `${FFMPEG_CORE}/ffmpeg-core.worker.js`,
      'text/javascript'
    );

    try {
      await ffmpeg.load({
        coreURL,
        wasmURL,
        workerURL: workerLoadURL,
        workerLoadURL,
      });
    } finally {
      URL.revokeObjectURL(coreURL);
      URL.revokeObjectURL(wasmURL);
      URL.revokeObjectURL(workerLoadURL);
    }

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await ffmpegLoadPromise;
  } finally {
    ffmpegLoadPromise = null;
  }
}

async function fetchBytes(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

async function convertToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < 1000) {
    throw new Error('Empty WebM recording');
  }

  const ffmpeg = await loadFFmpeg();
  const token = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const input = `e6_input_${token}.webm`;
  const output = `e6_output_${token}.mp4`;

  try {
    await ffmpeg.writeFile(input, await fetchBytes(webmBlob));

    // Force 60 fps in the final file and use a broadly compatible H.264/AAC
    // MP4 container. +faststart makes it seek/play nicely in web editors.
    await ffmpeg.exec([
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

    const data = await ffmpeg.readFile(output);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const mp4 = new Blob([bytes], { type: 'video/mp4' });

    if (mp4.size < 1000) throw new Error('FFmpeg produced an empty MP4');

    return mp4;
  } finally {
    try { await ffmpeg.deleteFile(input); } catch {}
    try { await ffmpeg.deleteFile(output); } catch {}
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

  for (const mimeType of candidates) {
    try {
      if (
        mimeType &&
        window.MediaRecorder.isTypeSupported &&
        !window.MediaRecorder.isTypeSupported(mimeType)
      ) continue;

      const options = { videoBitsPerSecond: VIDEO_BITRATE };
      if (mimeType) options.mimeType = mimeType;
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
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    recorder.addEventListener('stop', finish, { once: true });

    try {
      recorder.stop();
    } catch {
      finish();
    }

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
    finished: false,
    timer: null,
  };

  recorder.ondataavailable = event => {
    if (!slot.finished && event.data?.size) {
      slot.chunks.push(event.data);
    }
  };

  recorder.onerror = event => {
    console.error('[Element 6 Clips] MediaRecorder error:', event?.error || event);
  };

  try {
    recorder.start(1000);
  } catch (error) {
    console.error('[Element 6 Clips] MediaRecorder.start failed:', error);
    return false;
  }

  slot.mime = recorder.mimeType || 'video/webm';
  slots.set(id, slot);

  slot.timer = setTimeout(() => {
    finishSlot(id, false).catch(error =>
      console.error('[Element 6 Clips] Slot finish failed:', error)
    );
  }, CLIP_MS);

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

  const source = new Blob(slot.chunks, {
    type: slot.recorder.mimeType || slot.mime || 'video/webm',
  });

  if (source.size < 1000) return null;

  const duration = Math.min(
    CLIP_SECONDS,
    Math.max(0, (performance.now() - slot.startedAt) / 1000)
  );

  // Conversion is serialized because FFmpeg.wasm uses one virtual filesystem.
  const mp4 = await new Promise((resolve, reject) => {
    conversionQueue = conversionQueue
      .then(async () => {
        try {
          resolve(await convertToMP4(source));
        } catch (error) {
          reject(error);
        }
      })
      .catch(() => {});
  });

  return {
    blob: mp4,
    mime: 'video/mp4',
    extension: 'mp4',
    duration,
    requested,
    sequence: ++sequence,
  };
}

function chooseSlot() {
  const active = [...slots.values()]
    .filter(slot => !slot.finished)
    .sort((a, b) => a.startedAt - b.startedAt);

  if (!active.length) return null;

  // Prefer the oldest complete window. This gives the closest approximation
  // to the previous 30 seconds while keeping the recorder pool running.
  const mature = active.find(
    slot => performance.now() - slot.startedAt >= CLIP_MS - 500
  );

  return mature || active[0];
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function') return false;
  if (!window.MediaRecorder) return false;

  if (
    recording &&
    sourceCanvas === canvas &&
    slots.size > 0
  ) {
    return true;
  }

  stopClipRecorder();

  try {
    sourceCanvas = canvas;
    sourceStream = canvas.captureStream(FPS);

    if (!sourceStream?.getVideoTracks?.().length) {
      stopClipRecorder();
      return false;
    }

    recording = true;
    generation += 1;
    const currentGeneration = generation;

    window.__e6ClipRecorderActive = true;
    window.__e6ClipRecorderReady = false;
    window.__e6ClipRecorderFPS = FPS;
    window.__e6ClipRecorderMime = 'video/mp4';

    if (!startSlot(0)) {
      stopClipRecorder();
      return false;
    }

    for (let i = 1; i < SLOT_COUNT; i++) {
      setTimeout(() => {
        if (
          recording &&
          generation === currentGeneration &&
          !slots.has(i)
        ) {
          startSlot(i);
        }
      }, i * SLOT_STAGGER_MS);
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
  if (!recording) return null;

  const slot = chooseSlot();
  if (!slot) return null;

  const result = await finishSlot(slot.id, true);

  // Replace the consumed window immediately. Other slots continue recording,
  // so another Space press can overlap this MP4 conversion.
  if (recording) startSlot(slot.id);

  return result;
}

export function getClipRecordingInfo() {
  const ages = [...slots.values()]
    .filter(slot => !slot.finished)
    .map(slot => (performance.now() - slot.startedAt) / 1000);

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
