// Element 6 clip recorder.
// Each clip is the COMPLETE output of one MediaRecorder session.
// This is critical for MP4: never slice MediaRecorder chunks out of a
// longer MP4 recording and concatenate them, because that can produce a
// corrupt/unplayable MP4 container.

const FPS = 60;
const CLIP_MS = 30000;
const SLOT_COUNT = 6;
const SLOT_STAGGER_MS = 5000;
const VIDEO_BITRATE = 12000000;

let activeSession = null;
let retiringSessions = new Set();
let recording = false;
let recordingCanvas = null;
let sequence = 0;
let generation = 0;

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function candidateMimes() {
  return [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ].filter((mime, index, list) => {
    if (list.indexOf(mime) !== index) return false;
    try { return !!window.MediaRecorder?.isTypeSupported?.(mime); } catch { return false; }
  });
}

function createRecorder(stream) {
  if (!stream || !window.MediaRecorder) return null;
  for (const mime of candidateMimes()) {
    try {
      return new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: VIDEO_BITRATE,
      });
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
    const finish = () => resolve();
    recorder.addEventListener('stop', finish, { once: true });
    try { recorder.stop(); } catch { resolve(); }
  });
}

function makeSession(canvas) {
  if (!canvas || typeof canvas.captureStream !== 'function') return null;
  const stream = canvas.captureStream(FPS);
  if (!stream) return null;

  return {
    canvas,
    stream,
    slots: new Map(),
    retiring: false,
    stopped: false,
    sessionGeneration: ++generation,
  };
}

function startSlot(session, id) {
  if (!session || session.stopped || session.slots.has(id)) return false;

  const recorder = createRecorder(session.stream);
  if (!recorder) return false;

  const slot = {
    id,
    recorder,
    chunks: [],
    startedAt: performance.now(),
    finished: false,
    timer: null,
    mime: '',
  };

  recorder.ondataavailable = event => {
    if (slot.finished) return;
    if (event.data?.size) slot.chunks.push(event.data);
  };

  recorder.onerror = event => {
    console.error('[Element 6 Clips] MediaRecorder error:', event?.error || event);
  };

  try {
    // Complete-session recording. We intentionally do NOT use a timeslice;
    // the resulting MP4 is finalized by MediaRecorder.stop().
    recorder.start();
  } catch (error) {
    console.error('[Element 6 Clips] Could not start MP4 recorder:', error);
    return false;
  }

  slot.mime = recorder.mimeType || 'video/mp4';
  session.slots.set(id, slot);

  slot.timer = setTimeout(() => {
    finishSlot(session, id, false).then(result => {
      // A normal rolling slot is replaced immediately. Retiring sessions are
      // deliberately NOT restarted because they exist only to preserve the
      // previous match through Victory/Match Facts.
      if (!session.retiring && !session.stopped && result !== null) {
        startSlot(session, id);
      }
      cleanupSessionIfEmpty(session);
    });
  }, CLIP_MS);

  return true;
}

async function finishSlot(session, id, userRequested) {
  const slot = session?.slots.get(id);
  if (!slot || slot.finished) return null;
  slot.finished = true;

  if (slot.timer) {
    clearTimeout(slot.timer);
    slot.timer = null;
  }

  await stopRecorder(slot.recorder);
  session.slots.delete(id);

  const blob = slot.chunks.length
    ? new Blob(slot.chunks, { type: slot.mime || 'video/mp4' })
    : null;

  if (!blob || blob.size < 1000) return null;

  const duration = Math.min(
    CLIP_MS / 1000,
    Math.max(0, (performance.now() - slot.startedAt) / 1000)
  );

  return {
    blob,
    mime: slot.mime || blob.type || 'video/mp4',
    extension: 'mp4',
    duration,
    userRequested,
    startedAt: slot.startedAt,
    session,
  };
}

function stopSession(session, preserveOldest = false) {
  if (!session || session.stopped) return;
  session.stopped = true;

  const slots = [...session.slots.values()].sort((a, b) => a.startedAt - b.startedAt);
  const keep = preserveOldest ? slots[0] : null;

  for (const slot of slots) {
    if (keep && slot === keep) {
      slot.timer = null;
      continue;
    }
    slot.finished = true;
    if (slot.timer) clearTimeout(slot.timer);
    slot.timer = null;
    try {
      if (slot.recorder.state !== 'inactive') slot.recorder.stop();
    } catch {}
    session.slots.delete(slot.id);
  }

  if (!keep) {
    try { session.stream?.getTracks?.().forEach(track => track.stop()); } catch {}
    session.slots.clear();
  } else {
    session.retiring = true;
    // The kept recorder is allowed to finish naturally. Its stream remains
    // alive long enough to preserve the previous match through the transition.
    keep.timer = setTimeout(() => {
      finishSlot(session, keep.id, false).then(() => cleanupSessionIfEmpty(session));
    }, Math.max(0, CLIP_MS - (performance.now() - keep.startedAt)));
  }
}

function cleanupSessionIfEmpty(session) {
  if (!session || session.slots.size) return;
  try { session.stream?.getTracks?.().forEach(track => track.stop()); } catch {}
  retiringSessions.delete(session);
  if (activeSession === session) activeSession = null;
}

function allSlots() {
  const result = [];
  if (activeSession) {
    for (const slot of activeSession.slots.values()) result.push({ session: activeSession, slot });
  }
  for (const session of retiringSessions) {
    for (const slot of session.slots.values()) result.push({ session, slot });
  }
  return result.filter(item => item.slot && !item.slot.finished);
}

export function initClipRecorder(canvas) {
  if (!canvas || !window.MediaRecorder) return false;
  if (activeSession?.canvas === canvas && activeSession.slots.size) {
    recording = true;
    return true;
  }
  if (typeof canvas.captureStream !== 'function') return false;
  if (!candidateMimes().length) {
    console.error('[Element 6 Clips] This browser does not support MP4/H.264 MediaRecorder output.');
    return false;
  }

  // Preserve the oldest in-flight recording from the previous canvas so a
  // Victory / Match Facts transition can still save the previous match.
  if (activeSession) {
    const old = activeSession;
    retiringSessions.add(old);
    stopSession(old, true);
  }

  const session = makeSession(canvas);
  if (!session) return false;

  activeSession = session;
  recordingCanvas = canvas;
  recording = true;
  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = 'video/mp4';
  window.__e6ClipRecorderFps = FPS;

  let started = 0;
  if (startSlot(session, 0)) started++;

  // Stagger the remaining complete 30-second MP4 sessions by 5 seconds.
  for (let i = 1; i < SLOT_COUNT; i++) {
    setTimeout(() => {
      if (activeSession === session && !session.stopped) startSlot(session, i);
    }, i * SLOT_STAGGER_MS);
  }

  if (!started) {
    stopSession(session, false);
    activeSession = null;
    recording = false;
    return false;
  }

  window.__e6ClipRecorderActive = true;
  window.__e6ClipRecorderReady = true;
  return true;
}

export async function saveClip() {
  if (!recording) return null;

  const candidates = allSlots();
  if (!candidates.length) return null;

  // Oldest slot wins. During a Victory/Match Facts transition this is the
  // preserved slot from the just-finished match, so it is saved before the
  // newly-started victory-screen recording.
  candidates.sort((a, b) => a.slot.startedAt - b.slot.startedAt);
  const chosen = candidates[0];
  const result = await finishSlot(chosen.session, chosen.slot.id, true);

  if (chosen.session === activeSession && !chosen.session.stopped) {
    startSlot(chosen.session, chosen.slot.id);
  } else {
    cleanupSessionIfEmpty(chosen.session);
  }

  if (!result) return null;
  sequence++;
  return { ...result, sequence };
}

export function getClipRecordingInfo() {
  const slots = allSlots();
  const now = performance.now();
  const ages = slots.map(item => (now - item.slot.startedAt) / 1000);
  const mime = slots[0]?.slot.mime || 'video/mp4';
  return {
    active: recording && slots.length > 0,
    mime,
    extension: 'mp4',
    recorderCount: slots.length,
    oldestSeconds: ages.length ? Math.max(...ages) : 0,
    newestSeconds: ages.length ? Math.min(...ages) : 0,
  };
}

export function stopClipRecorder() {
  recording = false;
  generation++;
  if (activeSession) stopSession(activeSession, false);
  for (const session of [...retiringSessions]) stopSession(session, false);
  activeSession = null;
  retiringSessions.clear();
  recordingCanvas = null;
  window.__e6ClipRecorderActive = false;
  window.__e6ClipRecorderReady = false;
  window.__e6ClipRecorderMime = '';
  window.__e6ClipRecorderFps = FPS;
}

export function isClipRecorderActive() {
  return recording && allSlots().length > 0;
}

export function getClipRecordingCanvas() {
  return recordingCanvas;
}
