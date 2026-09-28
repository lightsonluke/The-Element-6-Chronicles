import React, { useEffect, useRef, useState } from 'react';
import { getClipBlob, getClipPreviewBlob, deleteClipBlob, deleteAllReplays, listClipMetadata } from './clipStorage.js';
import GameIcon from './GameIcon.jsx';

const DEFAULT_FPS = 60;

function extensionForMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

function replayModeLabel(clip) {
  if (!clip?.replay) return '';
  return clip.replayMeta?.modeLabel || clip.replayMeta?.mode || 'Match';
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
  const [section, setSection] = useState('clips');
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
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
    const onRefresh = () => refresh();
    window.addEventListener('clipSaved', onRefresh);
    window.addEventListener('focus', onRefresh);
    window.addEventListener('pageshow', onRefresh);
    document.addEventListener('visibilitychange', onRefresh);

    return () => {
      alive = false;
      window.removeEventListener('clipSaved', onRefresh);
      window.removeEventListener('focus', onRefresh);
      window.removeEventListener('pageshow', onRefresh);
      document.removeEventListener('visibilitychange', onRefresh);
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
          // The saved clip is the canonical playback source. Older records may
          // contain a WebM preview alongside an MP4 main blob; never prefer that
          // stale preview because it can leave the player stuck on Loading.
          if (!blob || blob.size < 1000) continue;

          next[clip.id] = {
            blob,
            previewBlob: previewBlob && previewBlob.size >= 1000 ? previewBlob : blob,
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

  useEffect(() => {
    for (const clip of clips) {
      const source = sources[clip.id];
      const video = videoRefs.current[clip.id];
      if (!source || !video) continue;
      if (sourceRefs.current[clip.id]?.blob === source.blob && video.src) continue;
      const old = sourceRefs.current[clip.id];
      if (old?.url) { try { URL.revokeObjectURL(old.url); } catch {} }
      const made = makeVideoSource(video, source.blob);
      sourceRefs.current[clip.id] = { ...made, blob: source.blob, fallbackUsed: false };
    }
  }, [clips, sources]);

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
  const visibleClips = clips.filter(c => section === 'replays' ? c.replay : !c.replay);

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
      video.playbackRate = speed;
      await video.play();
    } catch {}
  };

  const download = clip => {
    const source = sources[clip.id];
    if (!source?.blob) return;

    const url = URL.createObjectURL(source.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      `Element6_${clip.replay ? 'MatchReplay' : 'Clip'}_${new Date(clip.created || Date.now()).toISOString().replace(/[:.]/g, '-')}.${source.extension || extensionForMime(source.mime)}`;
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

  const clearAllReplays = async () => {
    if (section !== 'replays' || !visibleClips.length) return;
    if (!window.confirm('Delete all saved match replays? This cannot be undone.')) return;
    await deleteAllReplays().catch(() => {});
    Object.keys(sourceRefs.current).forEach(id => {
      const source = sourceRefs.current[id];
      try { source?.video?.pause?.(); } catch {}
      if (source?.url) { try { URL.revokeObjectURL(source.url); } catch {} }
      delete sourceRefs.current[id];
    });
    setSources(prev => { const next = { ...prev }; visibleClips.forEach(c => delete next[c.id]); return next; });
    setStoredClips(prev => prev.filter(c => !c.replay));
    setActiveViewer(null);
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto p-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🎬" size={14} /> CLIPS</h2>
            <div className="flex gap-1 mt-2">
              <button onClick={() => setSection('clips')} className={`px-2 py-1 rounded text-[9px] font-heading ${section==='clips'?'bg-accent text-accent-foreground':'bg-secondary'}`}>CLIPS</button>
              <button onClick={() => setSection('replays')} className={`px-2 py-1 rounded text-[9px] font-heading ${section==='replays'?'bg-accent text-accent-foreground':'bg-secondary'}`}>MATCH REPLAYS</button>
            </div>
          </div>
          <div className="flex gap-2">
            {section === 'replays' && visibleClips.length > 0 && (
              <button onClick={clearAllReplays} className="px-4 py-2 bg-destructive/20 text-destructive rounded-lg font-heading text-xs hover:opacity-80">CLEAR ALL</button>
            )}
            <button
              onClick={onBack}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-xs hover:opacity-80"
            >
              ← BACK
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-body mb-5">
          Clips and automatic Match Replays are saved locally in your browser.
        </p>

        {visibleClips.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">
            No clips yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleClips.slice(0, section === 'replays' ? 50 : 30).map(clip => {
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
                        key={`${clip.id}-${source.blob.size}-${source.mime}`}
                        ref={node => { videoRefs.current[clip.id] = node; }}
                        controls
                        playsInline
                        preload="auto"
                        className="w-full rounded-lg bg-black block"
                        style={{ aspectRatio: '16 / 9', ...(clip.replay ? { transform: `scale(${zoom})`, transformOrigin: 'center center' } : {}) }}
                        onError={() => {
                          const fallback = source.previewBlob;
                          if (fallback && fallback !== source.blob && !sourceRefs.current[clip.id]?.fallbackUsed) {
                            const old = sourceRefs.current[clip.id];
                            if (old?.url) { try { URL.revokeObjectURL(old.url); } catch {} }
                            const made = makeVideoSource(videoRefs.current[clip.id], fallback);
                            sourceRefs.current[clip.id] = { ...made, blob: source.blob, fallbackUsed: true };
                            setFailed(prev => { const next = { ...prev }; delete next[clip.id]; return next; });
                            return;
                          }
                          setFailed(prev => ({ ...prev, [clip.id]: true }));
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
                      This saved recording could not be decoded by the browser.
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-body flex-1 min-w-[180px]">
                      {clip.replay && <><span className="text-accent font-heading">{replayModeLabel(clip)}</span>{' · '}</>}
                      {new Date(clip.created || Date.now()).toLocaleString()}
                      {` · ${clip.replay ? 'MP4' : (clip.extension || 'MP4').toUpperCase()} · `}
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
                      <GameIcon emoji="⬇" size={14} /> SAVE {clip.replay ? 'MP4' : (clip.extension || 'MP4').toUpperCase()}
                    </button>
                    {clip.replay && <select value={speed} onChange={e => { const v=Number(e.target.value); setSpeed(v); const vdo=getVideo(clip.id); if(vdo)vdo.playbackRate=v; }} className="px-2 py-1 bg-secondary rounded text-[10px]">
                      <option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option>
                    </select>}
                    {clip.replay && <button onClick={()=>setZoom(z=>Math.min(2.5,Number((z+0.25).toFixed(2))))} className="px-2 py-1 bg-secondary rounded text-[10px]">ZOOM +</button>}
                    {clip.replay && <button onClick={()=>setZoom(z=>Math.max(1,Number((z-0.25).toFixed(2))))} className="px-2 py-1 bg-secondary rounded text-[10px]">ZOOM −</button>}

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
