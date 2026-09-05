import React, { useEffect, useRef, useState } from 'react';
import { getClipBlob, deleteClipBlob } from './clipStorage.js';
import GameIcon from './GameIcon.jsx';

const DEFAULT_FPS = 30;

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function makeVideoSource(video, blob, mime) {
  // Use the normal src/object-URL path for saved recordings. srcObject=Blob has
  // inconsistent browser support and is not needed for persisted clips.
  const url = URL.createObjectURL(blob);
  video.src = url;
  video.preload = 'auto';
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.load();
  return { url, mode: 'url' };
}

export default function ClipsScreen({ clips, onDeleteClip, onBack }) {
  const [clipSources, setClipSources] = useState({});
  const [failed, setFailed] = useState({});
  const [activeViewer, setActiveViewer] = useState(null);
  const videoRefs = useRef({});
  const sourceRefs = useRef({});

  useEffect(() => {
    let cancelled = false;

    const loadClips = async () => {
      const next = {};

      for (const clip of clips) {
        try {
          const blob = await getClipBlob(clip.id);
          if (!blob || blob.size < 1000) throw new Error('Saved clip blob is empty.');

          // Always trust the actual stored Blob MIME type over stale metadata.
          const mime = blob.type || clip.mime || 'video/webm';
          next[clip.id] = {
            blob,
            mime,
            extension: extensionForMime(mime),
          };
        } catch (error) {
          console.error('[Element 6 Clips] Could not load saved clip:', error);
          if (!cancelled) setFailed(prev => ({ ...prev, [clip.id]: true }));
        }
      }

      if (!cancelled) setClipSources(next);
    };

    loadClips();
    return () => { cancelled = true; };
  }, [clips]);

  useEffect(() => () => {
    Object.values(sourceRefs.current).forEach(source => {
      try { source?.video?.pause?.(); } catch {}
      try { source?.video?.removeAttribute?.('src'); } catch {}
      try { source?.video?.load?.(); } catch {}
      if (source?.url) {
        try { URL.revokeObjectURL(source.url); } catch {}
      }
    });
    sourceRefs.current = {};
  }, []);

  useEffect(() => {
    const onKeyDown = event => {
      if (!activeViewer) return;
      if (event.key === 'Escape') setActiveViewer(null);
      if (event.key === 'ArrowLeft') stepFrame(activeViewer, -1);
      if (event.key === 'ArrowRight') stepFrame(activeViewer, 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeViewer]);

  const getVideo = clipId => videoRefs.current[clipId];

  const stepFrame = (clipId, direction) => {
    const video = getVideo(clipId);
    if (!video || !Number.isFinite(video.duration)) return;
    const next = Math.max(0, Math.min(video.duration, video.currentTime + direction / DEFAULT_FPS));
    video.pause();
    try { video.currentTime = next; } catch {}
  };

  const toggleFullscreen = async clipId => {
    const container = document.getElementById(`clip-viewer-${clipId}`);
    const video = getVideo(clipId);
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (container.requestFullscreen) await container.requestFullscreen();
      else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
    } catch (error) {
      console.warn('[Element 6 Clips] Fullscreen unavailable:', error);
    }
  };

  const startPreview = async clipId => {
    const video = getVideo(clipId);
    if (!video) return;
    setActiveViewer(clipId);
    try {
      video.currentTime = 0;
      await video.play();
    } catch (error) {
      console.warn('[Element 6 Clips] Preview play was blocked or unsupported:', error);
    }
  };

  const handleDelete = async clipId => {
    try { await deleteClipBlob(clipId); } catch {}
    const source = sourceRefs.current[clipId];
    try { source?.video?.pause?.(); } catch {}
    try { source?.video?.removeAttribute?.('src'); } catch {}
    try { source?.video?.load?.(); } catch {}
    if (source?.url) {
      try { URL.revokeObjectURL(source.url); } catch {}
    }
    delete sourceRefs.current[clipId];
    setClipSources(prev => {
      const next = { ...prev };
      delete next[clipId];
      return next;
    });
    setFailed(prev => {
      const next = { ...prev };
      delete next[clipId];
      return next;
    });
    if (activeViewer === clipId) setActiveViewer(null);
    onDeleteClip(clipId);
  };

  const handleDownload = clip => {
    const source = clipSources[clip.id];
    if (!source?.blob) return;
    const url = source.url || URL.createObjectURL(source.blob);
    const ext = source.extension;
    const a = document.createElement('a');
    a.href = url;
    a.download = `Element6_Clip_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (!source.url) setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto p-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-heading text-accent tracking-wider">
            <GameIcon emoji="🎬" size={14} /> CLIPS
          </h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-xs hover:opacity-80">← BACK</button>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-5">
          Saved locally in your browser. Clips contain the most recent native recording window, up to 30 seconds.
        </p>

        {clips.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">No clips yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.slice(0, 30).map(clip => {
              const source = clipSources[clip.id];
              const ext = (source?.extension || extensionForMime(clip.mime)).toUpperCase();
              const videoReady = !!source?.blob;

              return (
                <div key={clip.id} className="bg-card border border-border rounded-xl p-3 shadow-xl">
                  {videoReady ? (
                    <div id={`clip-viewer-${clip.id}`} className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        ref={node => {
                          videoRefs.current[clip.id] = node;
                          if (node && source && sourceRefs.current[clip.id]?.blob !== source.blob) {
                            const old = sourceRefs.current[clip.id];
                            if (old?.url) { try { URL.revokeObjectURL(old.url); } catch {} }
                            const made = makeVideoSource(node, source.blob, source.mime);
                            sourceRefs.current[clip.id] = { ...made, video: node, blob: source.blob };
                          }
                        }}
                        controls
                        playsInline
                        preload="auto"
                        data-fps={DEFAULT_FPS}
                        onLoadedMetadata={event => {
                          const duration = event.currentTarget.duration;
                          if (!Number.isFinite(duration) || duration <= 0) return;
                          setFailed(prev => {
                            const next = { ...prev };
                            delete next[clip.id];
                            return next;
                          });
                        }}
                        onLoadedData={event => {
                          const video = event.currentTarget;
                          if (video.videoWidth > 0 && video.videoHeight > 0) {
                            setFailed(prev => {
                              const next = { ...prev };
                              delete next[clip.id];
                              return next;
                            });
                          }
                        }}
                        onCanPlay={() => {
                          setFailed(prev => {
                            const next = { ...prev };
                            delete next[clip.id];
                            return next;
                          });
                        }}
                        onError={event => {
                          console.error('[Element 6 Clips] Browser could not preview clip:', event.currentTarget.error, source.mime);
                          setFailed(prev => ({ ...prev, [clip.id]: true }));
                        }}
                        className="w-full rounded-lg bg-black block"
                        style={{ aspectRatio: '16 / 9' }}
                      />

                      <div className="absolute left-2 bottom-12 flex gap-1 pointer-events-auto">
                        <button type="button" onClick={() => stepFrame(clip.id, -1)} className="w-9 h-9 rounded-md bg-black/75 text-white font-bold text-lg hover:bg-black/90" title="Previous frame" aria-label="Previous frame">←</button>
                        <button type="button" onClick={() => stepFrame(clip.id, 1)} className="w-9 h-9 rounded-md bg-black/75 text-white font-bold text-lg hover:bg-black/90" title="Next frame" aria-label="Next frame">→</button>
                      </div>

                      <button type="button" onClick={() => toggleFullscreen(clip.id)} className="absolute right-2 bottom-12 w-9 h-9 rounded-md bg-black/75 text-white font-bold hover:bg-black/90" title="Fullscreen" aria-label="Fullscreen">⛶</button>
                    </div>
                  ) : (
                    <div className="w-full rounded-lg bg-black flex items-center justify-center text-xs text-muted-foreground" style={{ aspectRatio: '16 / 9' }}>
                      Loading clip…
                    </div>
                  )}

                  {failed[clip.id] && videoReady && (
                    <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-[10px]">
                      This browser could not decode the saved recording. Try SAVE {ext} to verify the file in a media player.
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-body flex-1 min-w-[180px]">
                      {new Date(clip.created).toLocaleString()} · {ext} · {Math.round(clip.duration || 30)}s
                    </span>
                    <button disabled={!videoReady} onClick={() => startPreview(clip.id)} className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40">▶ PREVIEW</button>
                    <button disabled={!videoReady} onClick={() => handleDownload(clip)} className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40"><GameIcon emoji="⬇" size={14} /> SAVE {ext}</button>
                    <button onClick={() => handleDelete(clip.id)} className="px-2 py-1 bg-destructive/20 text-destructive rounded text-[10px] font-heading">DELETE</button>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">Frame step: 1/{DEFAULT_FPS}s · ←/→ also step frames · fullscreen button on player</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
