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
import { saveReplayBlob, trimClips } from './clipStorage.js';
import { music } from './music.js';

let active = null;
let chunks = [];
let startedAt = 0;
let canvas = null;
let timer = null;

function supported() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find(type => MediaRecorder.isTypeSupported(type)) || '';
}

async function convertReplayToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < 1000) throw new Error('Replay recording is empty.');

  const input = new Input({ source: new BlobSource(webmBlob), formats: ALL_FORMATS });
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  });

  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) throw new Error('Replay contains no video track.');
  const width = await videoTrack.getDisplayWidth();
  const height = await videoTrack.getDisplayHeight();
  const fpsInfo = await videoTrack.computeFrameRateMetrics().catch(() => null);
  const frameRate = Math.max(24, Math.min(60, fpsInfo?.bestGuessFrameRate || 60));
  const videoQuality = new Quality({ bitrate: 8000000 });

  if (!(await canEncodeVideo('avc', { width, height, frameRate, quality: videoQuality }))) {
    throw new Error(`H.264 encoding is unavailable for ${width}x${height} video.`);
  }

  const audioTrack = await input.getPrimaryAudioTrack().catch(() => null);
  let audioOptions = null;
  if (audioTrack) {
    const channels = await audioTrack.getNumberOfChannels().catch(() => 2);
    const sampleRate = await audioTrack.getSampleRate().catch(() => 48000);
    if (await canEncodeAudio('aac', { numberOfChannels: channels, sampleRate, quality: new Quality({ bitrate: 192000 }) })) {
      audioOptions = { codec: 'aac', quality: new Quality({ bitrate: 192000 }), forceTranscode: true };
    }
  }

  const conversion = await Conversion.init({
    input,
    output,
    tracks: 'primary',
    video: async track => ({
      codec: 'avc',
      width: await track.getDisplayWidth(),
      height: await track.getDisplayHeight(),
      quality: videoQuality,
      forceTranscode: true,
      frameRate,
      hardwareAcceleration: 'prefer-hardware',
    }),
    ...(audioOptions ? { audio: audioOptions } : { audio: { discard: true } }),
  });

  if (!conversion.isValid) {
    const reasons = (conversion.discardedTracks || []).map(x => x.reason).join(', ');
    throw new Error(`Replay MP4 conversion is invalid${reasons ? ` (${reasons})` : ''}.`);
  }
  await conversion.execute();

  const buffer = output.target.buffer;
  if (!buffer || buffer.byteLength < 1000) throw new Error('Replay MP4 conversion produced an empty file.');
  return new Blob([buffer], { type: 'video/mp4' });
}

export function startMatchReplay(canvasEl, meta = {}) {
  const mime = supported();
  if (!canvasEl?.captureStream || !mime) return false;
  if (active && canvas === canvasEl) return true;

  stopMatchReplay().catch(() => {});
  canvas = canvasEl;
  chunks = [];
  startedAt = Date.now();

  try {
    const stream = canvas.captureStream(60);
    try {
      const audio = music.getRecordingAudioStream?.()?.getAudioTracks?.()[0];
      if (audio) stream.addTrack(audio);
    } catch {}

    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 7000000 });
    recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
    recorder.start(500);
    active = recorder;
    window.__e6MatchReplayRecording = true;
    window.__e6MatchReplayMeta = { ...meta };
    timer = setTimeout(() => stopMatchReplay().catch(() => {}), 30 * 60 * 1000);
    return true;
  } catch {
    active = null;
    canvas = null;
    chunks = [];
    return false;
  }
}

export async function stopMatchReplay() {
  if (timer) { clearTimeout(timer); timer = null; }
  const recorder = active;
  const sessionStartedAt = startedAt;
  const sessionMeta = { ...(window.__e6MatchReplayMeta || {}) };
  active = null;
  window.__e6MatchReplayRecording = false;

  if (!recorder) {
    canvas = null;
    chunks = [];
    return null;
  }

  return new Promise(resolve => {
    const finish = async () => {
      try {
        const webm = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        if (webm.size < 1000) { resolve(null); return; }

        // Never save a replay as WebM or fake an MP4 by renaming the file.
        // Replays are saved only after a real H.264/AAC MP4 conversion succeeds.
        const mp4 = await convertReplayToMP4(webm);
        const meta = sessionMeta;
        const endedAt = Date.now();
        const id = `replay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await saveReplayBlob(id, mp4, {
          mime: 'video/mp4',
          extension: 'mp4',
          duration: (Date.now() - sessionStartedAt) / 1000,
          replay: true,
          replayMeta: { ...meta, createdAt: sessionStartedAt, endedAt, format: 'mp4' },
        });
        await trimClips(80).catch(() => {});
        window.dispatchEvent(new CustomEvent('replaySaved', { detail: { id, replay: true, extension: 'mp4', mime: 'video/mp4' } }));
        resolve(id);
      } catch (error) {
        console.error('[Element 6 Replays] MP4 save failed:', error);
        window.dispatchEvent(new CustomEvent('replaySaveFailed', { detail: { message: error?.message || 'MP4 replay conversion failed.' } }));
        resolve(null);
      } finally {
        try { recorder.stream?.getTracks?.().forEach(track => track.stop()); } catch {}
        canvas = null;
        chunks = [];
      }
    };

    recorder.onstop = finish;
    try {
      if (recorder.state !== 'inactive') recorder.stop();
      else finish();
    } catch { finish(); }
  });
}

export function isMatchReplayActive() { return !!active; }
