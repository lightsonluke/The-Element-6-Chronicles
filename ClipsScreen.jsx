import React, { useEffect, useRef, useState } from 'react';
import { getClipBlob, getClipPreviewBlob, deleteClipBlob, listClipMetadata } from './clipStorage.js';
import GameIcon from './GameIcon.jsx';

const DEFAULT_FPS = 60;

function getMime(clip, blob) {
  return String(blob?.type || clip?.mime || 'video/mp4').toLowerCase();
}

function isMP4(clip, blob) {
  return getMime(clip, blob).includes('mp4') || String(clip?.extension || '').toLowerCase() === 'mp4';
}

function makeObjectURL(blob) {
  try { return URL.createObjectURL(blob); } catch { return null; }
}

function waitForVideo(video, url) {
  return new Promise((resolve, reject) => {
    if (!video || !url) {
      reject(new Error('Video source unavailable'));
      return;
    }

    let finished = false;
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', ok);
      video.removeEventListener('canplay', ok);
      video.removeEventListener('error', bad);
    };
    const finish = (error) => {
      if (finished) return;
      finished = true;
      cleanup();
      error ? reject(error) : resolve(video);
    };
    const ok = () => finish();
    const bad = () => finish(new Error('Video could not be decoded'));
    const timer = setTimeout(() => finish(new Error('Video preview timed out')), 8000);

    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.addEventListener('loadedmetadata', ok);
    video.addEventListener('canplay', ok);
    video.addEventListener('error', bad);
    video.src = url;
    video.load();
  });
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
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState('');
  const videoRefs = useRef({});
  const sourceRefs = useRef({});
  const modalVideoRef = useRef(null);
  const modalUrlRef = useRef(null);

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
          const preview = await getClipPreviewBlob(clip.id).catch(() => null);
          const mime = getMime(clip, blob);
          next[clip.id] = { blob, previewBlob: preview && preview.size >= 1000 ? preview : null, mime, extension: 'mp4' };
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
      if (source.url) try { URL.revokeObjectURL(source.url); } catch {}
    });
    sourceRefs.current = {};
    if (modalUrlRef.current) {
      try { URL.revokeObjectURL(modalUrlRef.current); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!activeViewer) return;
    const source = sources[activeViewer];
    const video = modalVideoRef.current;
    if (!source?.blob || !video) return;

    setViewerLoading(true);
    setViewerError('');

    if (modalUrlRef.current) {
      try { URL.revokeObjectURL(modalUrlRef.current); } catch {}
    }
    const url = makeObjectURL(source.previewBlob || source.blob);
    modalUrlRef.current = url;

    waitForVideo(video, url)
      .then(() => setViewerLoading(false))
      .catch(error => {
        console.error('[Element 6 Clips] Preview failed:', error);
        setViewerLoading(false);
        setViewerError('This MP4 could not be decoded by the browser.');
      });

    return () => {
      try { video.pause(); } catch {}
    };
  }, [activeViewer, sources]);

  const getVideo = id => videoRefs.current[id];

  const stepFrame = (id, direction) => {
    const video = getVideo(id);
    if (!video || !Number.isFinite(video.duration)) return;
    video.pause();
    try {
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + direction / DEFAULT_FPS));
    } catch {}
  };

  const preview = id => {
    if (!sources[id]?.blob) return;
    setActiveViewer(id);
    setViewerError('');
  };

  const closePreview = () => {
    const video = modalVideoRef.current;
    try { video?.pause?.(); } catch {}
    if (modalUrlRef.current) {
      try { URL.revokeObjectURL(modalUrlRef.current); } catch {}
      modalUrlRef.current = null;
    }
    setActiveViewer(null);
    setViewerLoading(false);
    setViewerError('');
  };

  const fullscreen = async id => {
    const video = getVideo(id);
    if (!video) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (video.requestFullscreen) await video.requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    } catch (error) {
      console.warn('[Element 6 Clips] Fullscreen failed:', error);
    }
  };

  const download = clip => {
    const source = sources[clip.id];
    if (!source?.blob) return;

    const url = makeObjectURL(source.previewBlob || source.blob);
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `Element6_Clip_${new Date(clip.created || Date.now()).toISOString().replace(/[:.]/g, '-')}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const remove = async id => {
    if (activeViewer === id) closePreview();
    await deleteClipBlob(id).catch(() => {});

    const source = sourceRefs.current[id];
    try { source?.video?.pause?.(); } catch {}
    if (source?.url) try { URL.revokeObjectURL(source.url); } catch {}
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
    onDeleteClip?.(id);
    if (!Array.isArray(externalClips)) setStoredClips(prev => prev.filter(clip => clip.id !== id));
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto p-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🎬" size={14} /> CLIPS</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-xs hover:opacity-80">← BACK</button>
        </div>

        <p className="text-xs text-muted-foreground font-body mb-5">MP4 · H.264 · 60 FPS · saved locally in your browser.</p>

        {clips.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">No clips yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.slice(0, 30).map(clip => {
              const source = sources[clip.id];
              const videoReady = !!source?.blob;
              return (
                <div key={clip.id} className="bg-card border border-border rounded-xl p-3 shadow-xl">
                  {videoReady ? (
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        ref={node => {
                          videoRefs.current[clip.id] = node;
                          if (node && source && sourceRefs.current[clip.id]?.blob !== source.blob) {
                            const old = sourceRefs.current[clip.id];
                            if (old?.url) try { URL.revokeObjectURL(old.url); } catch {}
                            const url = makeObjectURL(source.previewBlob || source.blob);
                            sourceRefs.current[clip.id] = { url, blob: source.blob };
                            if (url) {
                              node.src = url;
                              node.preload = 'metadata';
                              node.muted = true;
                              node.playsInline = true;
                              node.load();
                            }
                          }
                        }}
                        controls
                        playsInline
                        muted
                        preload="metadata"
                        className="w-full rounded-lg bg-black block"
                        style={{ aspectRatio: '16 / 9' }}
                        onError={() => setFailed(prev => ({ ...prev, [clip.id]: true }))}
                      />
                      <div className="absolute left-2 bottom-12 flex gap-1">
                        <button type="button" onClick={() => stepFrame(clip.id, -1)} className="w-9 h-9 rounded-md bg-black/75 text-white font-bold text-lg">←</button>
                        <button type="button" onClick={() => stepFrame(clip.id, 1)} className="w-9 h-9 rounded-md bg-black/75 text-white font-bold text-lg">→</button>
                      </div>
                      <button type="button" onClick={() => fullscreen(clip.id)} className="absolute right-2 bottom-12 w-9 h-9 rounded-md bg-black/75 text-white font-bold">⛶</button>
                    </div>
                  ) : (
                    <div className="w-full rounded-lg bg-black flex items-center justify-center text-xs text-muted-foreground" style={{ aspectRatio: '16 / 9' }}>Loading clip…</div>
                  )}

                  {failed[clip.id] && <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-[10px]">This MP4 could not be decoded by the browser.</div>}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-body flex-1 min-w-[180px]">
                      {new Date(clip.created || Date.now()).toLocaleString()} · MP4 · {Math.round(clip.duration || 30)}s
                    </span>
                    <button disabled={!videoReady} onClick={() => preview(clip.id)} className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40">▶ PREVIEW</button>
                    <button disabled={!videoReady} onClick={() => download(clip)} className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40"><GameIcon emoji="⬇" size={14} /> SAVE MP4</button>
                    <button onClick={() => remove(clip.id)} className="px-2 py-1 bg-destructive/20 text-destructive rounded text-[10px] font-heading">DELETE</button>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">Frame step: 1/60s · ←/→ also step frames · fullscreen on player</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeViewer && sources[activeViewer]?.blob && (
        <div className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) closePreview(); }}>
          <div className="w-full max-w-5xl bg-card border border-border rounded-xl p-3 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="font-heading text-xs text-accent">CLIP PREVIEW · MP4 · H.264 · 60 FPS</div>
              <button onClick={closePreview} className="px-3 py-1 rounded bg-secondary text-secondary-foreground text-xs font-heading">CLOSE</button>
            </div>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={modalVideoRef} controls playsInline muted preload="auto" className="w-full max-h-[75vh] object-contain bg-black" />
              {viewerLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-heading">LOADING CLIP…</div>}
            </div>
            {viewerError && <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-xs">{viewerError}</div>}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => download(clips.find(c => c.id === activeViewer) || { id: activeViewer })} disabled={viewerLoading || !!viewerError} className="px-3 py-2 bg-primary/30 text-primary rounded text-xs font-heading disabled:opacity-40">SAVE MP4</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
