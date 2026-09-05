import React, { useEffect, useRef, useState } from 'react';
import { getClipBlob, deleteClipBlob } from './clipStorage.js';
import GameIcon from './GameIcon.jsx';

function clipExtension(clip) {
  if (clip?.extension) return clip.extension;
  return String(clip?.mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

export default function ClipsScreen({ clips, onDeleteClip, onBack }) {
  const [clipUrls, setClipUrls] = useState({});
  const [failed, setFailed] = useState({});
  const urlMapRef = useRef({});

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
        } catch {
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
          Press <span className="text-accent font-bold">SPACE</span> during gameplay to save the recent <b>30-second replay window</b> using your browser&apos;s native recorder. MP4 is used when your browser supports it; otherwise the clip stays in the browser&apos;s native WebM format. Up to <b>30 clips</b> are kept locally on this device.
        </p>

        {clips.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">
            No clips yet. Play for at least 30 seconds, then press SPACE.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.slice(0, 30).map(clip => {
              const ext = clipExtension(clip).toUpperCase();
              return (
                <div key={clip.id} className="bg-card border border-border rounded-xl p-3 shadow-xl">
                  {clipUrls[clip.id] ? (
                    <video
                      src={clipUrls[clip.id]}
                      controls
                      playsInline
                      preload="metadata"
                      onError={() => setFailed(prev => ({ ...prev, [clip.id]: true }))}
                      className="w-full rounded-lg bg-black"
                      style={{ aspectRatio: '16 / 9' }}
                    />
                  ) : (
                    <div className="w-full rounded-lg bg-black flex items-center justify-center text-xs text-muted-foreground" style={{ aspectRatio: '16 / 9' }}>
                      {failed[clip.id] ? 'This clip could not be played by this browser.' : 'Loading clip…'}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground font-body flex-1">
                      {new Date(clip.created).toLocaleString()} · {ext} · ~{Math.round(clip.duration || 30)}s
                    </span>
                    <button disabled={!clipUrls[clip.id]} onClick={() => handleDownload(clip)} className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading disabled:opacity-40">
                      <GameIcon emoji="⬇" size={14} /> SAVE {ext}
                    </button>
                    <button onClick={() => handleDelete(clip.id)} className="px-2 py-1 bg-destructive/20 text-destructive rounded text-[10px] font-heading">DELETE</button>
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
