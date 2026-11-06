import {
  Input,
  ALL_FORMATS,
  BlobSource,
  Output,
  BufferTarget,
  Mp4OutputFormat,
  Conversion,
  Quality,
  canEncodeVideo,
  canEncodeAudio,
} from 'mediabunny';
import { music } from './music.js';

let sourceCanvas = null;
let captureCanvas = null;
let captureCtx = null;
let captureRaf = 0;
let sourceStream = null;
let recorder = null;
let recording = false;
let generation = 0;
let saveSequence = 0;
let saveQueue = Promise.resolve();
let chunks = [];
let chunkBytes = 0;
let recordingStartedAt = 0;
let activeCaptureMs = 0;
let activeSegmentStartedAt = null;
let capturePaused = false;
let lastDataAt = 0;
let recorderMime = 'video/webm';
let audioTrackAttached = false;

const FPS = 60;
const CLIP_SECONDS = 30;
const VIDEO_BITRATE = 8000000;
const CHUNK_MS = 250;
const MIN_CHUNK_BYTES = 128;

function log(message, error = null) {
  if (error) console.error(`[Element 6 Clips] ${message}`, error);
  else console.debug(`[Element 6 Clips] ${message}`);
}

function supportedMime() {
  if (!window.MediaRecorder) return '';
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
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
  const blob = new Blob(chunks.map(chunk => chunk.data), { type: recorderMime || 'video/webm' });
  return blob.size >= MIN_CHUNK_BYTES ? blob : null;
}

function captureClock(now = performance.now()) {
  return activeCaptureMs + (!capturePaused && activeSegmentStartedAt !== null ? Math.max(0, now - activeSegmentStartedAt) : 0);
}

export function setClipRecorderPaused(paused) {
  const nextPaused = Boolean(paused);
  if (!recording || capturePaused === nextPaused) return;
  const now = performance.now();
  if (nextPaused) {
    if (activeSegmentStartedAt !== null) activeCaptureMs += Math.max(0, now - activeSegmentStartedAt);
    activeSegmentStartedAt = null;
    capturePaused = true;
    const current = recorder;
    if (current?.state === 'recording') {
      // Close the current segment before pausing so the last fraction of a
      // second remains available to a clip requested during the pause.
      requestRecorderData().finally(() => {
        if (!capturePaused || recorder !== current || current.state !== 'recording') return;
        try { current.pause(); } catch (error) { log('Could not pause clip capture', error); }
      });
    }
    return;
  }
  capturePaused = false;
  activeSegmentStartedAt = now;
  if (recorder?.state === 'paused') {
    try { recorder.resume(); } catch (error) { log('Could not resume clip capture', error); }
  }
}

function trimBuffer(referenceTime = captureClock()) {
  // MediaRecorder's first chunk contains the WebM initialization/header data.
  // Keep that chunk forever and rotate only the media chunks after it. Removing
  // the first chunk makes the remaining WebM invalid, which caused saves to
  // fail with the recorder reporting that a clip was not ready.
  const cutoff = referenceTime - CLIP_SECONDS * 1000;
  while (chunks.length > 1 && chunks[1].time < cutoff) {
    chunkBytes -= chunks[1].size;
    chunks.splice(1, 1);
  }
}

function stopCaptureMirror() {
  if (captureRaf) cancelAnimationFrame(captureRaf);
  captureRaf = 0;
  captureCtx = null;
  captureCanvas = null;
}

function startCaptureMirror(canvas) {
  stopCaptureMirror();
  captureCanvas = document.createElement('canvas');
  captureCanvas.width = 1280;
  captureCanvas.height = 720;
  captureCtx = captureCanvas.getContext('2d', { alpha: false });
  const draw = () => {
    if (!captureCanvas || !captureCtx || !sourceCanvas || sourceCanvas !== canvas) return;
    const sw = Math.max(1, sourceCanvas.width || 1280);
    const sh = Math.max(1, sourceCanvas.height || 720);
    const scale = Math.min(1280 / sw, 720 / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (1280 - dw) / 2;
    const dy = (720 - dh) / 2;
    captureCtx.fillStyle = '#000';
    captureCtx.fillRect(0, 0, 1280, 720);
    captureCtx.drawImage(sourceCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
    captureRaf = requestAnimationFrame(draw);
  };
  captureRaf = requestAnimationFrame(draw);
  return captureCanvas;
}

function attachRecordingAudioTrack() {
  if (!sourceStream || audioTrackAttached) return;
  try {
    const audioStream = music.getRecordingAudioStream?.();
    const track = audioStream?.getAudioTracks?.()[0];
    if (track && !sourceStream.getAudioTracks().some(t => t.id === track.id)) {
      sourceStream.addTrack(track);
      audioTrackAttached = true;
    }
  } catch (error) {
    log('Could not attach game audio to clip stream', error);
  }
}

function attachRecorderHandlers(instance, myGeneration) {
  instance.ondataavailable = event => {
    if (myGeneration !== generation) return;
    if (!event.data || event.data.size <= 0) return;
    const now = captureClock();
    chunks.push({ data: event.data, time: now, size: event.data.size });
    chunkBytes += event.data.size;
    lastDataAt = now;
    trimBuffer(now);
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
    const options = { videoBitsPerSecond: VIDEO_BITRATE, audioBitsPerSecond: 192000 };
    if (mime) options.mimeType = mime;
    const instance = new MediaRecorder(sourceStream, options);
    const myGeneration = generation;
    attachRecorderHandlers(instance, myGeneration);
    recorder = instance;
    recorderMime = instance.mimeType || mime || 'video/webm';
    recordingStartedAt = performance.now();
    activeCaptureMs = 0;
    activeSegmentStartedAt = recordingStartedAt;
    capturePaused = false;
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
    if (!currentRecorder || currentRecorder.state !== 'recording') { resolve(); return; }
    const before = lastDataAt;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      currentRecorder.removeEventListener('dataavailable', onData);
      resolve();
    };
    const onData = () => { if (lastDataAt !== before) finish(); };
    const timer = setTimeout(finish, 1500);
    currentRecorder.addEventListener('dataavailable', onData);
    try { currentRecorder.requestData(); } catch { finish(); }
  });
}

async function makeSnapshot() {
  if (!recorder || recorder.state === 'inactive') return null;
  attachRecordingAudioTrack();
  await requestRecorderData();
  const now = captureClock();
  trimBuffer(now);
  const blob = rebuildBlob();
  if (!blob) return null;
  const mediaStart = chunks[1]?.time ?? chunks[0]?.time ?? 0;
  const duration = Math.min(CLIP_SECONDS, Math.max(0.25, (now - mediaStart) / 1000));
  return { blob, duration };
}

async function convertToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < MIN_CHUNK_BYTES) throw new Error('recording data is empty');

  const input = new Input({ source: new BlobSource(webmBlob), formats: ALL_FORMATS });
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });

  const width = 1280;
  const height = 720;
  const videoOK = await canEncodeVideo('avc', { width, height, frameRate: FPS, quality: new Quality({ bitrate: VIDEO_BITRATE }) });
  if (!videoOK) throw new Error('H.264/AVC encoding is unavailable in this browser');

  let hasAudio = false;
  try { hasAudio = Boolean(await input.getPrimaryAudioTrack()); } catch {}
  if (hasAudio) {
    const audioOK = await canEncodeAudio('aac', { numberOfChannels: 2, sampleRate: 48000, quality: new Quality({ bitrate: 192000 }) });
    if (!audioOK) throw new Error('AAC audio encoding is unavailable in this browser');
  }

  const conversion = await Conversion.init({
    input,
    output,
    video: { codec: 'avc', quality: new Quality({ bitrate: VIDEO_BITRATE }), forceTranscode: true, frameRate: FPS, hardwareAcceleration: 'prefer-hardware' },
    ...(hasAudio ? { audio: { codec: 'aac', quality: new Quality({ bitrate: 192000 }), forceTranscode: true } } : {})
  });

  if (!conversion.isValid) {
    const details = conversion.discardedTracks?.map(t => t.reason || 'track discarded').join('; ');
    throw new Error(`Mediabunny MP4 conversion is invalid${details ? `: ${details}` : ''}`);
  }

  await conversion.execute();
  const buffer = output.target.buffer;
  if (!buffer || buffer.byteLength < 1000) throw new Error('Mediabunny produced an empty MP4');
  return new Blob([buffer], { type: 'video/mp4' });
}

export function initClipRecorder(canvas) {
  if (!canvas || !window.MediaRecorder || typeof document === 'undefined') return false;
  if (recording && sourceCanvas === canvas && recorder && recorder.state !== 'inactive') return true;
  stopClipRecorder();
  try {
    sourceCanvas = canvas;
    const mirror = startCaptureMirror(canvas);
    sourceStream = mirror.captureStream(FPS);
    if (!sourceStream?.getVideoTracks?.().length) throw new Error('Canvas video track unavailable');
    recording = true;
    generation += 1;
    audioTrackAttached = false;
    // Music/SFX are routed through the shared recording destination. Attach the
    // track immediately when available, and again before every saved snapshot.
    attachRecordingAudioTrack();
    window.__e6ClipRecorderActive = true;
    window.__e6ClipRecorderReady = false;
    window.__e6ClipRecorderFPS = FPS;
    window.__e6ClipRecorderMime = 'video/webm';
    if (!startRecorder()) throw new Error('Could not start MediaRecorder');
    return true;
  } catch (error) {
    log('Recorder initialization failed', error);
    stopClipRecorder();
    return false;
  }
}

export function saveClip() {
  const job = async () => {
    if (!recording || !sourceCanvas || !recorder || recorder.state === 'inactive') return null;
    const snapshot = await makeSnapshot();
    if (!snapshot) return null;

    // Only publish a clip when the browser has produced a real MP4. On a
    // conversion failure, keep the rolling source chunks in memory so the
    // player can retry while the gameplay session remains active.
    const outputBlob = await convertToMP4(snapshot.blob);
    const header = new Uint8Array(await outputBlob.slice(0, 12).arrayBuffer());
    if (header[4] !== 0x66 || header[5] !== 0x74 || header[6] !== 0x79 || header[7] !== 0x70) {
      throw new Error('MP4 validation failed: the converted file has no MP4 container header.');
    }

    window.__e6ClipRecorderReady = true;
    return {
      blob: outputBlob,
      previewBlob: outputBlob,
      mime: 'video/mp4',
      extension: 'mp4',
      duration: snapshot.duration,
      sequence: ++saveSequence
    };
  };

  const result = saveQueue.then(job, job);
  saveQueue = result.catch(error => log('Queued clip save failed', error));
  return result;
}

export function getClipRecordingInfo() {
  const age = captureClock() / 1000;
  return {
    active: Boolean(recording && recorder && recorder.state !== 'inactive'),
    ready: Boolean(recording && recorder && recorder.state !== 'inactive' && chunkBytes >= MIN_CHUNK_BYTES),
    mime: recorderMime || 'video/webm',
    extension: 'webm',
    fps: FPS,
    recorderCount: recorder && recorder.state !== 'inactive' ? 1 : 0,
    completedCount: 0,
    oldestSeconds: Math.min(CLIP_SECONDS, age),
    newestSeconds: Math.min(CLIP_SECONDS, age)
  };
}

export function getClipRecordingCanvas() { return sourceCanvas; }
export function isClipRecorderActive() { return Boolean(recording && recorder && recorder.state !== 'inactive'); }

export function stopClipRecorder() {
  recording = false;
  stopCaptureMirror();
  generation += 1;
  const oldRecorder = recorder;
  recorder = null;
  if (oldRecorder) { try { if (oldRecorder.state !== 'inactive') oldRecorder.stop(); } catch {} }
  try { sourceStream?.getVideoTracks?.().forEach(track => track.stop()); } catch {}
  sourceStream = null;
  sourceCanvas = null;
  chunks = [];
  chunkBytes = 0;
  recordingStartedAt = 0;
  activeCaptureMs = 0;
  activeSegmentStartedAt = null;
  capturePaused = false;
  lastDataAt = 0;
  audioTrackAttached = false;
  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
}
