import React, { useEffect, useRef, useState } from 'react';
import { getClipBlob, deleteClipBlob, listClipMetadata } from './clipStorage.js';
import GameIcon from './GameIcon.jsx';

const DEFAULT_FPS = 60;

function normalizeMp4Blob(blob) {
  if (!blob || blob.size < 1000) return null;
  return blob.type === 'video/mp4'
    ? blob
    : new Blob([blob], { type: 'video/mp4' });
}

export default function ClipsScreen({
  clips: externalClips = null,
  onDeleteClip = () => {},
  onBack = () => {},
}) {
  const [storedClips, setStoredClips] = useState([]);
  const clips = Array.isArray(externalClips) ? externalClips : storedClips;
  const [sources, setSources] = useState({});
  const [ready, setReady] = useState({});
  const [failed, setFailed] = useState({});
  const [activeViewer, setActiveViewer] = useState(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState(false);
  const videoRefs = useRef({});
  const urlRefs = useRef({});

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
          const raw = await getClipBlob(clip.id);
          const blob = normalizeMp4Blob(raw);
          if (!blob) continue;
          next[clip.id] = blob;
        } catch (error) {
          console.error('[Element 6 Clips] Could not load clip:', error);
        }
      }

      if (!cancelled) {
        Object.values(urlRefs.current).forEach(url => {
          try { URL.revokeObjectURL(url); } catch {}
        });
        urlRefs.current = {};
        setSources(next);
        setReady({});
        setFailed({});
      }
    })();

    return () => { cancelled = true; };
  }, [clips]);

  useEffect(() => () => {
    Object.values(urlRefs.current).forEach(url => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    urlRefs.current = {};
  }, []);

  const getUrl = id => {
    if (!sources[id]) return null;
    if (!urlRefs.current[id]) urlRefs.current[id] = URL.createObjectURL(sources[id]);
    return urlRefs.current[id];
  };

  const attachVideo = (id, node) => {
    videoRefs.current[id] = node;
    if (!node) return;

    const url = getUrl(id);
    if (!url) return;

    // Setting src directly from React state is more reliable than doing it in
    // a ref callback that can be called multiple times during rerenders.
    if (node.src !== url) {
      node.src = url;
      node.preload = 'auto';
      node.muted = true;
      node.playsInline = true;
      node.load();
    }
  };

  const markReady = id => {
    setReady(prev => ({ ...prev, [id]: true }));
    setFailed(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const markFailed = (id, event) => {
    console.error('[Element 6 Clips] MP4 playback failed:', id, event?.currentTarget?.error);
    setReady(prev => ({ ...prev, [id]: false }));
    setFailed(prev => ({ ...prev, [id]: true }));
  };

  const preview = id => {
    if (!sources[id]) return;
    setViewerReady(false);
    setViewerError(false);
    setActiveViewer(id);
  };

  const closeViewer = () => {
    const video = videoRefs.current.viewer;
    try { video?.pause(); } catch {}
    setActiveViewer(null);
    setViewerReady(false);
    setViewerError(false);
  };

  const playViewer = async node => {
    videoRefs.current.viewer = node;
    if (!node || !activeViewer) return;

    const url = getUrl(activeViewer);
    if (!url) return;

    if (node.src !== url) {
      node.src = url;
      node.preload = 'auto';
      node.playsInline = true;
      node.load();
    }

    if (!node.dataset.e6Loaded) return;
    try {
      node.currentTime = 0;
      await node.play();
    } catch (error) {
      try {
        node.muted = true;
        node.currentTime = 0;
        await node.play();
      } catch (retryError) {
        console.error('[Element 6 Clips] Preview playback failed:', retryError || error);
      }
    }
  };

  const download = clip => {
    const blob = sources[clip.id];
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Element6_Clip_${new Date(clip.created || Date.now())
      .toISOString().replace(/[:.]/g, '-')}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const remove = async id => {
    await deleteClipBlob(id).catch(() => {});
    if (urlRefs.current[id]) {
      try { URL.revokeObjectURL(urlRefs.current[id]); } catch {}
      delete urlRefs.current[id];
    }
    delete videoRefs.current[id];
    setSources(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setReady(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFailed(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeViewer === id) closeViewer();
    onDeleteClip?.(id);
    if (!Array.isArray(externalClips)) setStoredClips(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto p-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-heading text-accent tracking-wider">
            <GameIcon emoji="🎬" size={14} /> CLIPS
          </h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-xs hover:opacity-80">
            ← BACK
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-body mb-5">
          MP4 · 60 FPS · saved locally in your browser.
        </p>

        {clips.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">No clips yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.slice(0, 30).map(clip => {
              const blob = sources[clip.id];
              const loaded = !!ready[clip.id];
              const bad = !!failed[clip.id];

              return (
                <div key={clip.id} className="bg-card border border-border rounded-xl p-3 shadow-xl">
                  {blob ? (
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        ref={node => attachVideo(clip.id, node)}
                        controls
                        muted
                        playsInline
                        preload="auto"
                        className="w-full rounded-lg bg-black block"
                        style={{ aspectRatio: '16 / 9' }}
                        onLoadedData={() => markReady(clip.id)}
                        onCanPlay={() => markReady(clip.id)}
                        onError={event => markFailed(clip.id, event)}
                      />
                      {!loaded && !bad && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs text-white">
                          Loading clip…
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full rounded-lg bg-black flex items-center justify-center text-xs text-muted-foreground" style={{ aspectRatio: '16 / 9' }}>
                      Loading clip…
                    </div>
                  )}

                  {bad && (
                    <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-[10px]">
                      This MP4 could not be decoded. Delete this copy and record a new clip.
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-body flex-1 min-w-[180px]">
                      {new Date(clip.created || Date.now()).toLocaleString()} · MP4 · {Math.round(clip.duration || 30)}s
                    </span>
                    <button disabled={!loaded} onClick={() => preview(clip.id)} className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40">
                      ▶ PREVIEW
                    </button>
                    <button disabled={!blob} onClick={() => download(clip)} className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40">
                      <GameIcon emoji="⬇" size={14} /> SAVE MP4
                    </button>
                    <button onClick={() => remove(clip.id)} className="px-2 py-1 bg-destructive/20 text-destructive rounded text-[10px] font-heading">
                      DELETE
                    </button>
                  </div>

                  <div className="text-[9px] text-muted-foreground mt-1">Frame step: 1/60s · fullscreen on player</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeViewer && sources[activeViewer] && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={closeViewer}>
          <div className="w-full max-w-5xl bg-card rounded-xl p-3 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading text-accent">CLIP PREVIEW · MP4</span>
              <button onClick={closeViewer} className="px-3 py-1 bg-secondary rounded text-xs font-heading">✕ CLOSE</button>
            </div>

            <video
              ref={playViewer}
              controls
              autoPlay
              muted
              playsInline
              preload="auto"
              className="w-full max-h-[75vh] bg-black rounded-lg"
              onLoadedData={event => {
                event.currentTarget.dataset.e6Loaded = '1';
                setViewerReady(true);
                setViewerError(false);
                event.currentTarget.play().catch(() => {});
              }}
              onCanPlay={() => setViewerReady(true)}
              onError={event => {
                console.error('[Element 6 Clips] Viewer MP4 error:', event.currentTarget.error);
                setViewerError(true);
              }}
            />

            {!viewerReady && !viewerError && (
              <div className="text-center text-xs text-muted-foreground py-3">Loading MP4 preview…</div>
            )}
            {viewerError && (
              <div className="text-center text-xs text-destructive py-3">This MP4 cannot be decoded by this browser.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
