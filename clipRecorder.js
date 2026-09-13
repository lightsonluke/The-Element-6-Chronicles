import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let sourceCanvas = null;
let sourceStream = null;
let recording = false;
let generation = 0;
let saveSequence = 0;
let ffmpeg = null;
let ffmpegPromise = null;
let conversionQueue = Promise.resolve();
let slotCounter = 0;

const FPS = 60;
const CLIP_SECONDS = 30;
const CLIP_MS = CLIP_SECONDS * 1000;
const SLOT_COUNT = 7;
const SLOT_INTERVAL_MS = 5000;
const VIDEO_BITRATE = 6000000;
const MIN_SAVE_MS = 350;
const slots = new Map();
const completed = new Map();
const FFMPEG_CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function err(message) { console.error(`[Element 6 Clips] ${message}`); }

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    const instance = new FFmpeg();
    instance.on('log', ({ message }) => { if (message) console.debug('[Element 6 FFmpeg]', message); });
    await instance.load({
      coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpeg = instance;
    return instance;
  })();
  try { return await ffmpegPromise; } finally { ffmpegPromise = null; }
}

async function convertToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < 1000) throw new Error('recording data is empty');
  const encoder = await loadFFmpeg();
  const token = `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
  const input = `e6_${token}.webm`, output = `e6_${token}.mp4`;
  try {
    await encoder.writeFile(input, await fetchFile(webmBlob));
    await encoder.exec(['-i', input, '-r', String(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', output]);
    const data = await encoder.readFile(output);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const result = new Blob([bytes], { type: 'video/mp4' });
    if (result.size < 1000) throw new Error('FFmpeg returned an empty MP4');
    return result;
  } finally {
    try { await encoder.deleteFile(input); } catch {}
    try { await encoder.deleteFile(output); } catch {}
  }
}

function createRecorder() {
  if (!sourceStream || !window.MediaRecorder) return null;
  for (const mime of ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','']) {
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

function buildBlob(chunks, mime) {
  if (!chunks?.length) return null;
  const blob = new Blob(chunks, { type: mime || 'video/webm' });
  return blob.size >= 1000 ? blob : null;
}

function startSlot(id) {
  if (!recording || !sourceStream || slots.has(id)) return false;
  const recorder = createRecorder();
  if (!recorder) return false;
  const slot = { id, recorder, chunks: [], startedAt: performance.now(), stopped: false, finalizing: false, timer: null, mime: '' };
  recorder.ondataavailable = e => { if (e.data?.size) slot.chunks.push(e.data); };
  recorder.onerror = e => err(`MediaRecorder error: ${e?.error?.message || 'unknown error'}`);
  try { recorder.start(250); slot.mime = recorder.mimeType || 'video/webm'; }
  catch (e) { err(`MediaRecorder.start failed: ${e?.message || e}`); return false; }
  slots.set(id, slot);
  const myGeneration = generation;
  slot.timer = setTimeout(() => completeSlot(id, myGeneration).catch(e => err(e?.message || e)), CLIP_MS);
  return true;
}

async function completeSlot(id, expectedGeneration = generation) {
  const slot = slots.get(id);
  if (!slot || slot.finalizing || expectedGeneration !== generation) return null;
  slot.finalizing = true;
  if (slot.timer) clearTimeout(slot.timer);
  slot.timer = null;
  try { slot.recorder.requestData?.(); } catch {}
  await wait(100);
  await stopRecorder(slot.recorder);
  slot.stopped = true;
  slots.delete(id);
  const source = buildBlob(slot.chunks, slot.mime || slot.recorder.mimeType);
  if (!source) { if (recording && expectedGeneration === generation) startSlot(id); return null; }
  const item = { id, blob: source, duration: Math.min(CLIP_SECONDS, Math.max(0.25, (performance.now()-slot.startedAt)/1000)), finishedAt: performance.now(), startedAt: slot.startedAt };
  completed.set(id, item);
  while (completed.size > SLOT_COUNT + 2) {
    const oldest = [...completed.values()].sort((a,b) => a.finishedAt-b.finishedAt)[0];
    if (!oldest) break;
    completed.delete(oldest.id);
  }
  if (recording && expectedGeneration === generation) startSlot(id);
  return item;
}

function snapshotActiveSlot(slot) {
  if (!slot) return null;
  const age = performance.now() - slot.startedAt;
  if (age < MIN_SAVE_MS) return null;
  const source = buildBlob(slot.chunks, slot.mime || slot.recorder.mimeType);
  if (!source) return null;
  return { id: `active_${slot.id}_${Date.now()}`, blob: source, duration: Math.min(CLIP_SECONDS, Math.max(0.25, age/1000)), finishedAt: performance.now() };
}

function consumeSource() {
  const ready = [...completed.values()].sort((a,b) => b.finishedAt-a.finishedAt)[0];
  if (ready) { completed.delete(ready.id); return ready; }
  const active = [...slots.values()].filter(s => !s.stopped && !s.finalizing).sort((a,b) => b.startedAt-a.startedAt)[0];
  return snapshotActiveSlot(active);
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
    for (let i=1;i<SLOT_COUNT;i++) setTimeout(() => { if (recording && generation===myGeneration && !slots.has(i)) startSlot(i); }, i*SLOT_INTERVAL_MS);
    return true;
  } catch (e) { err(`Recorder initialization failed: ${e?.message || e}`); stopClipRecorder(); return false; }
}

export function saveClip() {
  return (async () => {
    if (!recording) return null;
    const source = consumeSource();
    if (!source) return null;
    try {
      let result;
      conversionQueue = conversionQueue.then(async () => { result = await convertToMP4(source.blob); });
      await conversionQueue;
      if (!result) throw new Error('MP4 conversion produced no result');
      return { blob: result, mime: 'video/mp4', extension: 'mp4', duration: source.duration, sequence: ++saveSequence };
    } catch (e) { err(`MP4 conversion failed: ${e?.message || e}`); return null; }
  })();
}

export function getClipRecordingInfo() {
  const ages = [...slots.values()].filter(s => !s.stopped).map(s => (performance.now()-s.startedAt)/1000);
  return { active: recording, ready: recording && (slots.size>0 || completed.size>0), mime:'video/mp4', extension:'mp4', fps:FPS, recorderCount:slots.size, completedCount:completed.size, oldestSeconds:ages.length?Math.max(...ages):0, newestSeconds:ages.length?Math.min(...ages):0 };
}
export function getClipRecordingCanvas() { return sourceCanvas; }
export function isClipRecorderActive() { return recording && slots.size>0; }

export function stopClipRecorder() {
  recording = false;
  generation += 1;
  for (const slot of slots.values()) {
    slot.stopped = true;
    if (slot.timer) clearTimeout(slot.timer);
    try { if (slot.recorder.state !== 'inactive') slot.recorder.stop(); } catch {}
  }
  slots.clear();
  completed.clear();
  try { sourceStream?.getTracks?.().forEach(track => track.stop()); } catch {}
  sourceStream = null;
  sourceCanvas = null;
  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
}
