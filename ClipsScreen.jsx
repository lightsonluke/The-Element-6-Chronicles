import React, { useEffect, useRef, useState } from 'react';
import { getClipBlob, deleteClipBlob } from './clipStorage.js';
import GameIcon from './GameIcon.jsx';

const DEFAULT_FPS = 30;

function clipExtension(clip) {
  if (clip?.extension) return clip.extension;
  return String(clip?.mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function clipMime(clip) {
  if (clip?.mime) return clip.mime;
  return clipExtension(clip) === 'mp4' ? 'video/mp4' : 'video/webm';
}

export default function ClipsScreen({ clips, onDeleteClip, onBack }) {
  const [clipUrls, setClipUrls] = useState({});
  const [failed, setFailed] = useState({});
  const [activeViewer, setActiveViewer] = useState(null);
  const urlMapRef = useRef({});
  const videoRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const clip of clips) {
        if (urlMapRef.current[clip.id]) continue;
        try {
          const blob = await getClipBlob(clip.id);
          if (!blob || blob.size < 1000) {
            if (!cancelled) setFailed(prev => ({ ...prev, [clip.id]: true }));
            continue;
          }
          const url = URL.createObjectURL(blob);
          urlMapRef.current[clip.id] = url;
          if (!cancelled) setClipUrls(prev => ({ ...prev, [clip.id]: url }));
        } catch (error) {
          console.error('[Element 6 Clips] Could not load clip:', error);
          if (!cancelled) setFailed(prev => ({ ...prev, [clip.id]: true }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [clips]);

  useEffect(() => () => {
    Object.values(urlMapRef.current).forEach(url => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    urlMapRef.current = {};
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
    const fps = Number(video.dataset?.fps) || DEFAULT_FPS;
    const next = Math.max(0, Math.min(video.duration, video.currentTime + (direction / fps)));
    video.pause();
    video.currentTime = next;
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
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } catch (error) {
      console.warn('[Element 6 Clips] Fullscreen unavailable:', error);
    }
  };

  const handleDelete = async clipId => {
    try { await deleteClipBlob(clipId); } catch {}
    const url = urlMapRef.current[clipId];
    if (url) {
      try { URL.revokeObjectURL(url); } catch {}
    }
    delete urlMapRef.current[clipId];
    setClipUrls(prev => {
      const next = { ...prev };
      delete next[clipId];
      return next;
    });
    if (activeViewer === clipId) setActiveViewer(null);
    onDeleteClip(clipId);
  };

  const handleDownload = clip => {
    const url = clipUrls[clip.id];
    if (!url) return;
    const ext = clipExtension(clip);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Element6_Clip_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
          Press <span className="text-accent font-bold">SPACE</span> during gameplay to save the most recent <b>30-second replay window</b> using your browser&apos;s native recorder. MP4 is used when supported; otherwise the clip remains native WebM. Up to <b>30 clips</b> are kept locally.
        </p>

        {clips.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">
            No clips yet. Play for at least 30 seconds, then press SPACE.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.slice(0, 30).map(clip => {
              const ext = clipExtension(clip).toUpperCase();
              const url = clipUrls[clip.id];
              return (
                <div key={clip.id} className="bg-card border border-border rounded-xl p-3 shadow-xl">
                  {url ? (
                    <div id={`clip-viewer-${clip.id}`} className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        ref={node => { videoRefs.current[clip.id] = node; }}
                        key={`${clip.id}-${url}`}
                        src={url}
                        controls
                        playsInline
                        preload="auto"
                        data-fps={DEFAULT_FPS}
                        onLoadedMetadata={event => {
                          const duration = event.currentTarget.duration;
                          if (!Number.isFinite(duration) || duration <= 0) {
                            setFailed(prev => ({ ...prev, [clip.id]: true }));
                          }
                        }}
                        onError={event => {
                          console.error('[Element 6 Clips] Browser could not preview clip:', event.currentTarget.error);
                          setFailed(prev => ({ ...prev, [clip.id]: true }));
                        }}
                        className="w-full rounded-lg bg-black block"
                        style={{ aspectRatio: '16 / 9' }}
                      >
                        <source src={url} type={clipMime(clip)} />
                      </video>

                      <div className="absolute left-2 bottom-12 flex gap-1 pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => stepFrame(clip.id, -1)}
                          className="w-9 h-9 rounded-md bg-black/75 text-white font-bold text-lg hover:bg-black/90"
                          title="Previous frame"
                          aria-label="Previous frame"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => stepFrame(clip.id, 1)}
                          className="w-9 h-9 rounded-md bg-black/75 text-white font-bold text-lg hover:bg-black/90"
                          title="Next frame"
                          aria-label="Next frame"
                        >
                          →
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleFullscreen(clip.id)}
                        className="absolute right-2 bottom-12 w-9 h-9 rounded-md bg-black/75 text-white font-bold hover:bg-black/90"
                        title="Fullscreen"
                        aria-label="Fullscreen"
                      >
                        ⛶
                      </button>
                    </div>
                  ) : (
                    <div className="w-full rounded-lg bg-black flex items-center justify-center text-xs text-muted-foreground" style={{ aspectRatio: '16 / 9' }}>
                      {failed[clip.id] ? 'This clip could not be previewed by this browser.' : 'Loading clip…'}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-body flex-1 min-w-[180px]">
                      {new Date(clip.created).toLocaleString()} · {ext} · {Math.round(clip.duration || 30)}s
                    </span>
                    <button disabled={!url} onClick={() => handleDownload(clip)} className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40">
                      <GameIcon emoji="⬇" size={14} /> SAVE {ext}
                    </button>
                    <button onClick={() => handleDelete(clip.id)} className="px-2 py-1 bg-destructive/20 text-destructive rounded text-[10px] font-heading">DELETE</button>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">
                    Frame step: 1/{DEFAULT_FPS}s · ←/→ also step frames · fullscreen button on player
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
