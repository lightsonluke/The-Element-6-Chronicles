// Canvas clip recorder — rolling capture using MediaRecorder + captureStream.
// Uses timeslice accumulation so saved clips are a single valid webm (rewatchable).
let stream = null;
let recorder = null;
let chunks = [];
let recording = false;
let clipMime = 'video/webm';

function getSupportedMime() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  for (const t of types) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {}
  }
  return '';
}

export function initClipRecorder(canvas) {
  if (recording) stopClipRecorder();
  try {
    stream = canvas.captureStream(30);
    const mime = getSupportedMime();
    clipMime = mime || 'video/webm';
    recorder = mime ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3000000 }) : new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    // timeslice => periodic chunks that together form one continuous, valid webm
    recorder.start(2000);
    recording = true;
  } catch { /* captureStream not supported */ }
}

// Save the last ~10s as a clip. Returns a temporary object URL (caller must revoke).
export async function saveClip() {
  if (!recording || !recorder) return null;
  // Keep only the last ~10s of chunks (5 x 2s slices) so clips stay short.
  if (chunks.length > 5) chunks = chunks.slice(-5);
  // Force a fresh chunk boundary so the saved blob includes the latest frames.
  try { if (recorder.state === 'recording') recorder.requestData(); } catch {}
  // Give the dataavailable event a moment to fire.
  await new Promise((r) => setTimeout(r, 60));
  if (chunks.length === 0) return null;
  const blob = new Blob(chunks.slice(-5), { type: clipMime });
  if (!blob || blob.size === 0) return null;
  return URL.createObjectURL(blob);
}

export function stopClipRecorder() {
  recording = false;
  if (recorder && recorder.state !== 'inactive') { try { recorder.stop(); } catch {} }
  stream = null; recorder = null; chunks = [];
}