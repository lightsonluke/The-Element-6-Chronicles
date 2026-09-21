import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let loading = null;

const CORE_BASES = [
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd',
  'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd',
];

async function loadEncoder() {
  if (ffmpeg) return ffmpeg;
  if (loading) return loading;

  loading = (async () => {
    const instance = new FFmpeg();
    let lastError = null;

    for (const base of CORE_BASES) {
      try {
        await instance.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        ffmpeg = instance;
        return instance;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('MP4 encoder could not be loaded');
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
}

export async function convertWebMBlobToMP4(webmBlob) {
  if (!webmBlob || webmBlob.size < 1000) {
    throw new Error('The clip file is empty or incomplete.');
  }

  const encoder = await loadEncoder();
  const token = `e6_download_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const input = `${token}.webm`;
  const output = `${token}.mp4`;

  try {
    await encoder.writeFile(input, await fetchFile(webmBlob));

    let exitCode = await encoder.exec([
      '-y',
      '-i', input,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '21',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      output,
    ]);

    // Some browser FFmpeg cores do not expose libx264. Use the native
    // MPEG-4 encoder in that case. This is still a real MP4 conversion.
    if (exitCode !== 0) {
      try { await encoder.deleteFile(output); } catch {}
      exitCode = await encoder.exec([
        '-y',
        '-i', input,
        '-c:v', 'mpeg4',
        '-q:v', '5',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        output,
      ]);
    }

    if (exitCode !== 0) {
      throw new Error(`FFmpeg could not convert the clip to MP4 (exit ${exitCode}).`);
    }

    const data = await encoder.readFile(output);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const mp4 = new Blob([bytes], { type: 'video/mp4' });

    if (mp4.size < 1000) {
      throw new Error('FFmpeg produced an empty MP4 file.');
    }

    return mp4;
  } finally {
    try { await encoder.deleteFile(input); } catch {}
    try { await encoder.deleteFile(output); } catch {}
  }
}
