// Element 6 native-only clip recorder.
// Browser-native APIs only: Canvas.captureStream + MediaRecorder + Blob.
// No third-party media libraries.
//
// The important rule here is: NEVER manufacture a rolling media file by
// deleting old MediaRecorder chunks from the middle of a recording. A saved
// clip is always the complete output of ONE MediaRecorder session, so its
// container/header/timestamps remain internally consistent.
//
// Native-browser limitation:
// MediaRecorder cannot retroactively encode exactly the previous 30 seconds
// from an already-encoded stream without a media encoder/remuxer. This native
// implementation therefore keeps a complete recording session at <=30s and
// saves the current complete session when requested.

let stream = null;
let recorder = null;
let chunks = [];
let recording = false;
let clipMime = '';
let segmentStartedAt = 0;
let lastDataAt = 0;
let saveBusy = false;
let segmentTimer = null;
let segmentGeneration = 0;

const FPS = 30;
const CLIP_SECONDS = 30;
const CLIP_MS = CLIP_SECONDS * 1000;
const MIN_RECORDING_MS = 500;
const VIDEO_BITRATE = 4500000;

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function getCandidateMimes() {
  // Prefer browser-default MediaRecorder output first. This is intentionally
  // NOT forced to MP4 or WebM: the user agent chooses the format/codecs it can
  // actually record for this MediaStream.
  const candidates = [
    '',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
    'video/mp4;codecs=avc1',
    'video/mp4;codecs="avc1.42E01E"',
  ];

  return candidates.filter((type, index) => {
    if (candidates.indexOf(type) !== index) return false;
    if (!type) return true;
    try {
      return !!window.MediaRecorder?.isTypeSupported?.(type);
    } catch {
      return false;
    }
  });
}

function clearSegmentTimer() {
  if (segmentTimer) clearTimeout(segmentTimer);
  segmentTimer = null;
}

function resetState() {
  clearSegmentTimer();
  recording = false;
  window.__e6ClipRecorderReady = false;
  stream = null;
  recorder = null;
  chunks = [];
  segmentStartedAt = 0;
  lastDataAt = 0;
  saveBusy = false;
  clipMime = '';
  segmentGeneration += 1;
}

function buildBlob(sourceChunks, mime) {
  if (!sourceChunks?.length) return null;
  return new Blob(sourceChunks, { type: mime || 'video/webm' });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadVideoForValidation(blob, { requireFrame = false } = {}) {
  if (!blob) return Promise.resolve({ ok: false, duration: 0, reason: 'empty blob' });

  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(blob);
    let finished = false;
    let frameTimer = null;

    const finish = result => {
      if (finished) return;
      finished = true;
      if (frameTimer) clearTimeout(frameTimer);
      try { video.pause(); } catch {}
      try { video.removeAttribute('src'); } catch {}
      try { video.load(); } catch {}
      try { URL.revokeObjectURL(url); } catch {}
      resolve(result);
    };

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    video.onerror = () => finish({
      ok: false,
      duration: 0,
      reason: video.error?.message || `media error ${video.error?.code || ''}`,
    });

    video.onloadedmetadata = async () => {
      const duration = Number(video.duration);
      if (!Number.isFinite(duration) || duration <= 0) {
        finish({ ok: false, duration: 0, reason: 'invalid duration' });
        return;
      }

      if (!requireFrame) {
        finish({ ok: true, duration, width: video.videoWidth, height: video.videoHeight });
        return;
      }

      try {
        // Move to the beginning and ask the browser to decode an actual frame.
        video.currentTime = 0;
        await video.play();

        if (typeof video.requestVideoFrameCallback === 'function') {
          video.requestVideoFrameCallback(() => finish({
            ok: video.videoWidth > 0 && video.videoHeight > 0,
            duration,
            width: video.videoWidth,
            height: video.videoHeight,
            reason: video.videoWidth > 0 ? '' : 'no decoded video frame',
          }));
        } else {
          // Fallback for browsers without requestVideoFrameCallback.
          setTimeout(() => finish({
            ok: video.videoWidth > 0 && video.videoHeight > 0,
            duration,
            width: video.videoWidth,
            height: video.videoHeight,
            reason: video.videoWidth > 0 ? '' : 'no decoded video frame',
          }), 300);
        }
      } catch (error) {
        finish({ ok: false, duration, reason: error?.message || 'playback validation failed' });
      }
    };

    frameTimer = setTimeout(() => finish({
      ok: false,
      duration: 0,
      reason: 'timed out while validating recording',
    }), 7000);

    video.src = url;
    try { video.load(); } catch {}
  });
}

async function validateRecording(blob, requireFrame = true) {
  // First verify the container/metadata, then verify that at least one real
  // video frame can be decoded. This prevents broken files from being saved.
  return loadVideoForValidation(blob, { requireFrame });
}

function createRecorderForStream(mediaStream) {
  if (!mediaStream || !window.MediaRecorder) return null;

  const candidates = getCandidateMimes();
  let lastError = null;

  for (const requestedMime of candidates) {
    try {
      const options = {
        videoBitsPerSecond: VIDEO_BITRATE,
      };
      if (requestedMime) options.mimeType = requestedMime;

      const next = new MediaRecorder(mediaStream, options);
      // IMPORTANT: trust what the browser actually selected, not what we asked
      // for. MDN documents recorder.mimeType as the resulting container/media
      // type for the recording.
      return next;
    } catch (error) {
      lastError = error;
    }
  }

  console.error('[Element 6 Clips] No supported MediaRecorder format:', lastError);
  return null;
}

function waitForStop(targetRecorder) {
  return new Promise(resolve => {
    if (!targetRecorder || targetRecorder.state === 'inactive') {
      resolve();
      return;
    }

    const previous = targetRecorder.onstop;
    targetRecorder.onstop = event => {
      try { previous?.(event); } catch {}
      resolve();
    };

    try {
      targetRecorder.stop();
    } catch {
      resolve();
    }
  });
}

function attachRecorderHandlers(targetRecorder, generation) {
  targetRecorder.ondataavailable = event => {
    if (generation !== segmentGeneration) return;
    if (!event.data || event.data.size === 0) return;
    chunks.push(event.data);
    lastDataAt = performance.now();
  };

  targetRecorder.onerror = event => {
    console.error('[Element 6 Clips] Native MediaRecorder error:', event?.error || event);
  };
}

async function startSegment() {
  if (!stream || !window.MediaRecorder || !recording) return false;

  const generation = ++segmentGeneration;
  const nextRecorder = createRecorderForStream(stream);
  if (!nextRecorder) return false;

  try {
    recorder = nextRecorder;
    chunks = [];
    segmentStartedAt = performance.now();
    lastDataAt = segmentStartedAt;
    clipMime = recorder.mimeType || '';

    attachRecorderHandlers(recorder, generation);

    // No timeslice. We want one complete contiguous MediaRecorder output.
    recorder.start();
    clipMime = recorder.mimeType || clipMime || 'video/webm';
    window.__e6ClipRecorderMime = clipMime;

    clearSegmentTimer();
    segmentTimer = setTimeout(async () => {
      if (!recording || generation !== segmentGeneration) return;
      if (!recorder || recorder.state !== 'recording') return;
      await finishAndRestartSegment(generation);
    }, CLIP_MS - 100);

    return true;
  } catch (error) {
    console.error('[Element 6 Clips] Could not start native recorder:', error);
    return false;
  }
}

async function finishAndRestartSegment(generation = segmentGeneration) {
  if (!recorder || recorder.state !== 'recording' || generation !== segmentGeneration) return;

  clearSegmentTimer();
  const oldRecorder = recorder;
  await waitForStop(oldRecorder);

  if (!recording || generation !== segmentGeneration) return;
  await startSegment();
}

export function initClipRecorder(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function' || !window.MediaRecorder) return false;
  if (recording) stopClipRecorder();

  try {
    stream = canvas.captureStream(FPS);
    recording = true;
    window.__e6ClipRecorderReady = false;
    window.__e6ClipRecorderActive = true;

    startSegment().then(ok => {
      if (!ok) {
        console.error('[Element 6 Clips] Native recorder could not start.');
        stopClipRecorder();
        return;
      }
      window.__e6ClipRecorderReady = true;
      window.__e6ClipRecorderMime = clipMime;
    });

    return true;
  } catch (error) {
    console.error('[Element 6 Clips] Could not initialize native recorder:', error);
    try { stream?.getTracks?.().forEach(track => track.stop()); } catch {}
    resetState();
    return false;
  }
}

export async function saveClip() {
  if (saveBusy || !recording || !recorder || recorder.state !== 'recording') return null;

  saveBusy = true;
  const generation = segmentGeneration;

  try {
    const elapsedMs = performance.now() - segmentStartedAt;
    if (elapsedMs < MIN_RECORDING_MS) return null;

    const target = recorder;
    clearSegmentTimer();

    // Stop the CURRENT complete recording. The final dataavailable event is
    // guaranteed to happen as part of MediaRecorder.stop().
    await waitForStop(target);

    const source = buildBlob(chunks, target.mimeType || clipMime || 'video/webm');
    if (!source) return null;

    const validation = await validateRecording(source, true);
    if (!validation.ok) {
      console.error('[Element 6 Clips] Recorder output failed frame validation:', validation.reason, {
        mime: target.mimeType,
        size: source.size,
        duration: validation.duration,
      });
      return null;
    }

    const type = target.mimeType || clipMime || source.type || 'video/webm';

    // Start a brand-new complete segment immediately after the validated clip
    // is captured. The saved Blob remains immutable and self-contained.
    if (recording && generation === segmentGeneration) {
      await startSegment();
    }

    return {
      blob: source,
      mime: type,
      extension: extensionForMime(type),
      duration: Math.min(validation.duration, CLIP_SECONDS),
    };
  } catch (error) {
    console.error('[Element 6 Clips] Native clip creation failed:', error);
    return null;
  } finally {
    saveBusy = false;
  }
}

export function getClipRecordingInfo() {
  return {
    active: isClipRecorderActive(),
    mime: clipMime,
    extension: extensionForMime(clipMime),
    ageSeconds: segmentStartedAt ? (performance.now() - segmentStartedAt) / 1000 : 0,
    lastDataAt,
  };
}

export function stopClipRecorder() {
  recording = false;
  clearSegmentTimer();
  ++segmentGeneration;

  try {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  } catch {}
  try { stream?.getTracks?.().forEach(track => track.stop()); } catch {}

  resetState();
  window.__e6ClipRecorderActive = false;
}

export function isClipRecorderActive() {
  return recording && !!recorder && recorder.state === 'recording';
}
