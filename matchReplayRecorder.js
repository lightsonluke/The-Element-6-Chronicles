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
import { saveReplayBlob, getReplaySource } from './clipStorage.js';
import { music } from './music.js';

let active = null;
let chunks = [];
let startedAt = 0;
let canvas = null;
const failedReplaySources = new Map();
const replayConversionsInProgress = new Set();

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
    const audioQuality = new Quality({ bitrate: 192000 });
    if (!(await canEncodeAudio('aac', { numberOfChannels: channels, sampleRate, quality: audioQuality }))) {
      throw new Error('AAC audio encoding is unavailable; the replay audio cannot be preserved.');
    }
    audioOptions = { codec: 'aac', quality: audioQuality, forceTranscode: true };
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
  const mp4 = new Blob([buffer], { type: 'video/mp4' });
  const header = new Uint8Array(await mp4.slice(0, 12).arrayBuffer());
  if (header[4] !== 0x66 || header[5] !== 0x74 || header[6] !== 0x79 || header[7] !== 0x70) {
    throw new Error('Replay MP4 validation failed: the output has no MP4 container header.');
  }
  return mp4;
}

export function startMatchReplay(canvasEl, meta = {}) {
  const mime = supported();
  if (!canvasEl?.captureStream || !mime) return false;
  if (active && canvas === canvasEl) return true;
  // Let the lifecycle coordinator stop/finalize the old match first. Starting
  // here while an older MP4 is converting would otherwise reuse its global
  // chunk array and corrupt one or both files.
  if (active) return false;
  canvas = canvasEl;
  chunks = [];
  const sessionChunks = chunks;
  startedAt = Date.now();

  try {
    const stream = canvas.captureStream(60);
    try {
      const audio = music.getRecordingAudioStream?.()?.getAudioTracks?.()[0];
      if (audio) stream.addTrack(audio);
    } catch {}

    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 7000000 });
    recorder.ondataavailable = event => { if (event.data?.size) sessionChunks.push(event.data); };
    recorder.start(500);
    active = recorder;
    window.__e6MatchReplayRecording = true;
    window.__e6MatchReplayMeta = { ...meta };
    return true;
  } catch {
    active = null;
    canvas = null;
    chunks = [];
    return false;
  }
}

export async function stopMatchReplay() {
  const recorder = active;
  const sessionStartedAt = startedAt;
  const sessionCanvas = canvas;
  const sessionChunks = chunks;
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
      const webm = new Blob(sessionChunks, { type: recorder.mimeType || 'video/webm' });
      const id = `replay_${sessionStartedAt}_${Math.random().toString(36).slice(2, 8)}`;
      const endedAt = Date.now();
      const duration = Math.max(0, (endedAt - sessionStartedAt) / 1000);
      try {
        const replayMeta = { ...sessionMeta, createdAt: sessionStartedAt, endedAt, format: 'mp4', processingState: 'ready' };
        if (webm.size < 1000) {
          if (webm.size > 0) {
            failedReplaySources.set(id, webm);
            await saveReplayBlob(id, webm, {
              mime: 'video/webm', extension: 'webm', duration,
              replay: true, status: 'failed', sourceBlob: webm, created: sessionStartedAt,
              replayMeta: { ...replayMeta, format: 'webm-source', processingState: 'failed' },
            }).catch(() => {});
          }
          window.dispatchEvent(new CustomEvent('replaySaveFailed', { detail: { id } }));
          resolve(null);
          return;
        }

        await saveReplayBlob(id, webm, {
          mime: 'video/webm', extension: 'webm', duration, replay: true,
          status: 'processing', sourceBlob: webm, created: sessionStartedAt,
          replayMeta: { ...replayMeta, format: 'webm-source', processingState: 'processing' },
        });
        replayConversionsInProgress.add(id);
        window.dispatchEvent(new CustomEvent('replayProcessing', { detail: { id } }));

        // Never save a replay as WebM or fake an MP4 by renaming the file.
        // Replays are saved only after a real H.264/AAC MP4 conversion succeeds.
        const mp4 = await convertReplayToMP4(webm);
        const header = new Uint8Array(await mp4.slice(0, 12).arrayBuffer());
        if (header[4] !== 0x66 || header[5] !== 0x74 || header[6] !== 0x79 || header[7] !== 0x70) {
          throw new Error('Replay MP4 validation failed: the output has no MP4 container header.');
        }
        await saveReplayBlob(id, mp4, {
          mime: 'video/mp4',
          extension: 'mp4',
          duration,
          replay: true,
          created: sessionStartedAt,
          status: 'ready',
          replayMeta,
        });
        failedReplaySources.delete(id);
        window.dispatchEvent(new CustomEvent('replaySaved', { detail: { id, replay: true, extension: 'mp4', mime: 'video/mp4' } }));
        resolve(id);
      } catch (error) {
        console.error('[Element 6 Replays] MP4 save failed:', error);
        failedReplaySources.set(id, webm);
        await saveReplayBlob(id, webm, {
          mime: 'video/webm', extension: 'webm', duration,
          replay: true, status: 'failed', sourceBlob: webm, created: sessionStartedAt,
          replayMeta: { ...sessionMeta, createdAt: sessionStartedAt, endedAt, format: 'webm-source', processingState: 'failed' },
        }).catch(storageError => console.error('[Element 6 Replays] Could not preserve the source recording:', storageError));
        window.dispatchEvent(new CustomEvent('replaySaveFailed', { detail: { id, message: error?.message || 'MP4 replay conversion failed.' } }));
        resolve(null);
      } finally {
        replayConversionsInProgress.delete(id);
        try { recorder.stream?.getTracks?.().forEach(track => track.stop()); } catch {}
        if (canvas === sessionCanvas) canvas = null;
        if (chunks === sessionChunks) chunks = [];
      }
    };

    recorder.onstop = finish;
    try {
      if (recorder.state !== 'inactive') recorder.stop();
      else finish();
    } catch { finish(); }
  });
}

export async function retryReplayMP4(id) {
  if (replayConversionsInProgress.has(id)) throw new Error('MP4 conversion is already in progress.');
  replayConversionsInProgress.add(id);
  let stored = null;
  let source = failedReplaySources.get(id) || null;
  try {
    stored = await getReplaySource(id);
    source = source || stored?.blob;
    if (!source || source.size < 1) throw new Error('The source recording for this replay is unavailable.');
    await saveReplayBlob(id, source, {
      mime: 'video/webm', extension: 'webm', replay: true, status: 'processing',
      sourceBlob: source, created: stored?.created, duration: stored?.duration,
      replayMeta: { ...(stored?.replayMeta || {}), format: 'webm-source', processingState: 'processing' },
    });
    window.dispatchEvent(new CustomEvent('replayProcessing', { detail: { id } }));
    const mp4 = await convertReplayToMP4(source);
    const header = new Uint8Array(await mp4.slice(0, 12).arrayBuffer());
    if (header[4] !== 0x66 || header[5] !== 0x74 || header[6] !== 0x79 || header[7] !== 0x70) {
      throw new Error('Replay MP4 validation failed: the output has no MP4 container header.');
    }
    await saveReplayBlob(id, mp4, {
      mime: 'video/mp4', extension: 'mp4', replay: true, status: 'ready',
      created: stored?.created,
      duration: stored?.duration,
      sourceBlob: null,
      replayMeta: { ...(stored?.replayMeta || {}), format: 'mp4', processingState: 'ready' },
    });
    failedReplaySources.delete(id);
    window.dispatchEvent(new CustomEvent('replaySaved', { detail: { id, replay: true, extension: 'mp4', mime: 'video/mp4' } }));
    return id;
  } catch (error) {
    if (source?.size) {
      await saveReplayBlob(id, source, {
        mime: 'video/webm', extension: 'webm', replay: true, status: 'failed',
        sourceBlob: source, created: stored?.created, duration: stored?.duration,
        replayMeta: { ...(stored?.replayMeta || {}), format: 'webm-source', processingState: 'failed' },
      }).catch(() => {});
    }
    window.dispatchEvent(new CustomEvent('replaySaveFailed', { detail: { id, message: error?.message || 'MP4 replay conversion failed.' } }));
    throw error;
  } finally {
    replayConversionsInProgress.delete(id);
  }
}

export function isReplayConversionActive(id) { return replayConversionsInProgress.has(id); }
export function isMatchReplayActive() { return !!active; }
