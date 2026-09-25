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
let sourceStream = null;
let recorder = null;
let recording = false;
let generation = 0;
let saveSequence = 0;
let saveQueue = Promise.resolve();
let chunks = [];
let chunkBytes = 0;
let recordingStartedAt = 0;
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

function trimBuffer(referenceTime = performance.now()) {
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
    const now = performance.now();
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
  const now = performance.now();
  trimBuffer(now);
  const blob = rebuildBlob();
  if (!blob) return null;
  const mediaStart = chunks[1]?.time ?? chunks[0]?.time ?? recordingStartedAt;
  const duration = Math.min(CLIP_SECONDS, Math.max(0.25, (now - Math.max(recordingStartedAt, mediaStart)) / 1000));
  return { blob, duration };
}

async function convertToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < MIN_CHUNK_BYTES) throw new Error('recording data is empty');

  const input = new Input({ source: new BlobSource(webmBlob), formats: ALL_FORMATS });
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });

  const width = sourceCanvas?.videoWidth || sourceCanvas?.width || 1280;
  const height = sourceCanvas?.videoHeight || sourceCanvas?.height || 720;
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
  if (!canvas || typeof canvas.captureStream !== 'function' || !window.MediaRecorder) return false;
  if (recording && sourceCanvas === canvas && recorder && recorder.state !== 'inactive') return true;
  stopClipRecorder();
  try {
    sourceCanvas = canvas;
    sourceStream = canvas.captureStream(FPS);
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

    // Keep the native WebM as the reliable source/preview, then use Mediabunny
    // to create a real H.264/AAC MP4. There is no filename-only renaming.
    let outputBlob = snapshot.blob;
    let outputMime = snapshot.blob.type || recorderMime || 'video/webm';
    let outputExtension = 'webm';
    try {
      const mp4 = await convertToMP4(snapshot.blob);
      if (mp4?.size >= 1000) {
        outputBlob = mp4;
        outputMime = 'video/mp4';
        outputExtension = 'mp4';
      }
    } catch (error) {
      // A valid WebM is still a successful clip. This prevents the old
      // "CLIP SAVE FAILED" behavior when the browser cannot encode H.264/AAC.
      log('Mediabunny MP4 conversion unavailable; keeping the valid WebM clip', error);
    }

    window.__e6ClipRecorderReady = true;
    return {
      blob: outputBlob,
      previewBlob: snapshot.blob,
      mime: outputMime,
      extension: outputExtension,
      duration: snapshot.duration,
      sequence: ++saveSequence
    };
  };

  const result = saveQueue.then(job, job);
  saveQueue = result.catch(error => log('Queued clip save failed', error));
  return result;
}

export function getClipRecordingInfo() {
  const age = recordingStartedAt ? (performance.now() - recordingStartedAt) / 1000 : 0;
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
  lastDataAt = 0;
  audioTrackAttached = false;
  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
}
