import React, { useEffect, useRef, useState } from 'react';
import { getClipBlob, deleteClipBlob, listClipMetadata } from './clipStorage.js';
import GameIcon from './GameIcon.jsx';

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
}) {
  const [storedClips, setStoredClips] = useState([]);
  const clips = Array.isArray(externalClips) ? externalClips : storedClips;
  const [sources, setSources] = useState({});
  const [failed, setFailed] = useState({});
  const [activeViewer, setActiveViewer] = useState(null);
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
          if (!blob || blob.size < 1000) continue;

          next[clip.id] = {
            blob,
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

    const url = source.url || URL.createObjectURL(source.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      `Element6_Clip_${new Date(clip.created || Date.now()).toISOString().replace(/[:.]/g, '-')}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    if (!source.url) setTimeout(() => URL.revokeObjectURL(url), 1500);
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

                            const made = makeVideoSource(node, source.blob);
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
