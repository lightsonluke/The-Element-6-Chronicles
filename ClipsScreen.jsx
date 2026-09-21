import React, { useEffect, useRef, useState } from 'react';
import { getClipBlob, getClipPreviewBlob, deleteClipBlob, listClipMetadata, saveClipBlob, trimClips } from './clipStorage.js';
import GameIcon from './GameIcon.jsx';
import { startBrowserScreenRecording } from './clipScreenRecorder.js';

const DEFAULT_FPS = 60;

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function makeVideoSource(video, blob) {
  const url = URL.createObjectURL(blob);
  video.src = url;
  video.preload = 'auto';
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.load();
  return { url, video };
}

export default function ClipsScreen({
  clips: externalClips = null,
  onDeleteClip = () => {},
  onBack = () => {},
  clipsEnabled = true,
}) {
  const [storedClips, setStoredClips] = useState([]);
  const clips = Array.isArray(externalClips) ? externalClips : storedClips;
  const [sources, setSources] = useState({});
  const [failed, setFailed] = useState({});
  const [activeViewer, setActiveViewer] = useState(null);
  const [localFile, setLocalFile] = useState(null);
  const [screenRecording, setScreenRecording] = useState(false);
  const [screenRecorderApi, setScreenRecorderApi] = useState(null);
  const [screenError, setScreenError] = useState('');
  useEffect(() => () => { if (localFile?.url) { try { URL.revokeObjectURL(localFile.url); } catch {} } }, [localFile]);
  const videoRefs = useRef({});
  const sourceRefs = useRef({});

  useEffect(() => {
    if (Array.isArray(externalClips)) return;

    let alive = true;

    const refresh = async () => {
      try {
        const rows = await listClipMetadata();
        if (alive) setStoredClips(rows);
      } catch (error) {
        console.error('[Element 6 Clips] Could not list clips:', error);
      }
    };

    refresh();
    window.addEventListener('clipSaved', refresh);

    return () => {
      alive = false;
      window.removeEventListener('clipSaved', refresh);
    };
  }, [externalClips]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const metadata = clips.length ? clips : await listClipMetadata().catch(() => []);
      const next = {};

      for (const clip of metadata) {
        try {
          const blob = await getClipBlob(clip.id);
          const previewBlob = await getClipPreviewBlob(clip.id).catch(() => blob);
          if (!blob || blob.size < 1000) continue;

          next[clip.id] = {
            blob,
            previewBlob,
            mime: blob.type || clip.mime || 'video/mp4',
            extension: extensionForMime(blob.type || clip.mime),
          };
        } catch (error) {
          console.error('[Element 6 Clips] Could not load clip:', error);
        }
      }

      if (!cancelled) setSources(next);
    })();

    return () => { cancelled = true; };
  }, [clips]);

  useEffect(() => () => {
    Object.values(sourceRefs.current).forEach(source => {
      try { source.video?.pause?.(); } catch {}
      if (source.url) {
        try { URL.revokeObjectURL(source.url); } catch {}
      }
    });
    sourceRefs.current = {};
  }, []);

  const getVideo = id => videoRefs.current[id];

  const stepFrame = (id, direction) => {
    const video = getVideo(id);
    if (!video || !Number.isFinite(video.duration)) return;

    video.pause();
    try {
      video.currentTime = Math.max(
        0,
        Math.min(video.duration, video.currentTime + direction / DEFAULT_FPS)
      );
    } catch {}
  };

  const fullscreen = async id => {
    const container = document.getElementById(`clip-viewer-${id}`);
    const video = getVideo(id);
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } catch (error) {
      console.warn('[Element 6 Clips] Fullscreen failed:', error);
    }
  };

  const preview = async id => {
    const video = getVideo(id);
    if (!video) return;
    setActiveViewer(id);
    try {
      video.currentTime = 0;
      await video.play();
    } catch {}
  };

  const download = clip => {
    const source = sources[clip.id];
    if (!source?.blob) return;

    const url = URL.createObjectURL(source.blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = source.extension || extensionForMime(source.mime || source.blob.type);
    a.download =
      `Element6_Clip_${new Date(clip.created || Date.now()).toISOString().replace(/[:.]/g, '-')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const remove = async id => {
    await deleteClipBlob(id).catch(() => {});

    const source = sourceRefs.current[id];
    try { source?.video?.pause?.(); } catch {}
    if (source?.url) {
      try { URL.revokeObjectURL(source.url); } catch {}
    }

    delete sourceRefs.current[id];

    setSources(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setFailed(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (activeViewer === id) setActiveViewer(null);
    onDeleteClip?.(id);
    if (!Array.isArray(externalClips)) {
      setStoredClips(prev => prev.filter(clip => clip.id !== id));
    }
  };

  const handleLocalFile = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!String(file.type || '').startsWith('video/')) {
      setScreenError('That file is not a browser-playable video.');
      return;
    }
    if (localFile?.url) URL.revokeObjectURL(localFile.url);
    setLocalFile({ file, url: URL.createObjectURL(file) });
    setScreenError('');
  };

  const startScreenRecording = async () => {
    if (!clipsEnabled || screenRecording) return;
    setScreenError('');
    try {
      const api = await startBrowserScreenRecording();
      setScreenRecorderApi(api);
      setScreenRecording(true);
      const result = await api.done;
      setScreenRecording(false);
      setScreenRecorderApi(null);
      if (!result?.blob || result.blob.size < 128) throw new Error('No screen recording data was produced.');
      const id = `clip_screen_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await saveClipBlob(id, result.blob, { mime: result.mime, extension: 'webm', duration: result.duration, previewBlob: result.blob });
      await trimClips(30);
      window.dispatchEvent(new CustomEvent('clipSaved', { detail: { id, created: Date.now(), mime: result.mime, extension: 'webm', size: result.blob.size, duration: result.duration } }));
      setStoredClips(prev => [{ id, created: Date.now(), mime: result.mime, extension: 'webm', size: result.blob.size, duration: result.duration }, ...prev].slice(0, 30));
    } catch (error) {
      setScreenRecording(false);
      setScreenRecorderApi(null);
      if (error?.name === 'NotAllowedError') setScreenError('Screen recording was cancelled.');
      else setScreenError(error?.message || 'Browser screen recording failed.');
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto p-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-heading text-accent tracking-wider">
            <GameIcon emoji="🎬" size={14} /> CLIPS
          </h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-xs hover:opacity-80"
          >
            ← BACK
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-body mb-5">
          MP4 · 60 FPS · saved locally in your browser.
        </p>

        {clipsEnabled && (
          <div className="mb-5 rounded-xl border border-border bg-card p-3 flex flex-wrap items-center gap-2">
            <label className="px-3 py-2 rounded bg-secondary text-secondary-foreground font-heading text-[10px] cursor-pointer">
              OPEN VIDEO FILE
              <input type="file" accept="video/*,.webm,.mp4,.mov,.mkv" className="hidden" onChange={handleLocalFile} />
            </label>
            <button onClick={startScreenRecording} disabled={screenRecording} className="px-3 py-2 rounded bg-accent text-accent-foreground font-heading text-[10px] disabled:opacity-50">
              {screenRecording ? 'RECORDING SCREEN…' : 'RECORD SCREEN IN BROWSER'}
            </button>
            {screenRecording && screenRecorderApi && <button onClick={() => screenRecorderApi.stop()} className="px-3 py-2 rounded bg-destructive text-destructive-foreground font-heading text-[10px]">STOP RECORDING</button>}
            {localFile?.url && <button onClick={() => { URL.revokeObjectURL(localFile.url); setLocalFile(null); }} className="px-3 py-2 rounded bg-secondary text-secondary-foreground font-heading text-[10px]">CLOSE FILE</button>}
            {screenError && <span className="w-full text-[10px] text-destructive">{screenError}</span>}
          </div>
        )}
        {localFile?.url && (
          <div className="mb-5 bg-card border border-border rounded-xl p-3">
            <div className="text-xs font-heading text-accent mb-2">LOCAL VIDEO: {localFile.file.name}</div>
            <video src={localFile.url} controls playsInline className="w-full max-h-[70vh] rounded-lg bg-black" />
          </div>
        )}

        {clips.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">
            No clips yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.slice(0, 30).map(clip => {
              const source = sources[clip.id];
              const videoReady = !!source?.blob;

              return (
                <div
                  key={clip.id}
                  className="bg-card border border-border rounded-xl p-3 shadow-xl"
                >
                  {videoReady ? (
                    <div
                      id={`clip-viewer-${clip.id}`}
                      className="relative rounded-lg overflow-hidden bg-black"
                    >
                      <video
                        ref={node => {
                          videoRefs.current[clip.id] = node;

                          if (
                            node &&
                            source &&
                            sourceRefs.current[clip.id]?.blob !== source.blob
                          ) {
                            const old = sourceRefs.current[clip.id];
                            if (old?.url) {
                              try { URL.revokeObjectURL(old.url); } catch {}
                            }

                            const made = makeVideoSource(node, source.previewBlob || source.blob);
                            sourceRefs.current[clip.id] = {
                              ...made,
                              blob: source.blob,
                            };
                          }
                        }}
                        controls
                        playsInline
                        preload="auto"
                        className="w-full rounded-lg bg-black block"
                        style={{ aspectRatio: '16 / 9' }}
                        onError={() => {
                          setFailed(prev => ({
                            ...prev,
                            [clip.id]: true,
                          }));
                        }}
                      />

                      <div className="absolute left-2 bottom-12 flex gap-1">
                        <button
                          type="button"
                          onClick={() => stepFrame(clip.id, -1)}
                          className="w-9 h-9 rounded-md bg-black/75 text-white font-bold text-lg"
                          title="Previous frame"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => stepFrame(clip.id, 1)}
                          className="w-9 h-9 rounded-md bg-black/75 text-white font-bold text-lg"
                          title="Next frame"
                        >
                          →
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => fullscreen(clip.id)}
                        className="absolute right-2 bottom-12 w-9 h-9 rounded-md bg-black/75 text-white font-bold"
                        title="Fullscreen"
                      >
                        ⛶
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-full rounded-lg bg-black flex items-center justify-center text-xs text-muted-foreground"
                      style={{ aspectRatio: '16 / 9' }}
                    >
                      Loading clip…
                    </div>
                  )}

                  {failed[clip.id] && (
                    <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-[10px]">
                      This MP4 could not be decoded by the browser.
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-body flex-1 min-w-[180px]">
                      {new Date(clip.created || Date.now()).toLocaleString()}
                      {' · MP4 · '}
                      {Math.round(clip.duration || 30)}s
                    </span>

                    <button
                      disabled={!videoReady}
                      onClick={() => preview(clip.id)}
                      className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40"
                    >
                      ▶ PREVIEW
                    </button>

                    <button
                      disabled={!videoReady}
                      onClick={() => download(clip)}
                      className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40"
                    >
                      <GameIcon emoji="⬇" size={14} /> SAVE MP4
                    </button>

                    <button
                      onClick={() => remove(clip.id)}
                      className="px-2 py-1 bg-destructive/20 text-destructive rounded text-[10px] font-heading"
                    >
                      DELETE
                    </button>
                  </div>

                  <div className="text-[9px] text-muted-foreground mt-1">
                    Frame step: 1/60s · ←/→ also step frames · fullscreen on player
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
