let active = null;

export function isScreenRecorderActive() {
  return !!(active && active.recorder && active.recorder.state !== 'inactive');
}

export async function startBrowserScreenRecording() {
  if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
    throw new Error('Browser screen recording is not supported');
  }
  if (isScreenRecorderActive()) return active;

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { ideal: 60, max: 60 } },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    surfaceSwitching: 'include'
  });

  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  let mime = '';
  for (const c of candidates) {
    try { if (!MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(c)) { mime = c; break; } } catch {}
  }

  const chunks = [];
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8000000 } : { videoBitsPerSecond: 8000000 });
  active = { stream, recorder, chunks, startedAt: performance.now() };

  recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
  const stopPromise = new Promise(resolve => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || mime || 'video/webm' });
      const duration = Math.max(0, (performance.now() - active.startedAt) / 1000);
      resolve({ blob, duration, mime: blob.type || 'video/webm', extension: 'webm' });
      try { stream.getTracks().forEach(t => t.stop()); } catch {}
      active = null;
    };
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, { once: true });
  });

  recorder.start(250);
  return { stop: () => { if (recorder.state !== 'inactive') recorder.stop(); }, done: stopPromise };
}

export function stopBrowserScreenRecording() {
  if (!active?.recorder) return;
  try { if (active.recorder.state !== 'inactive') active.recorder.stop(); } catch {}
}
