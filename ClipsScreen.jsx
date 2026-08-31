import React, { useState, useEffect, useRef } from 'react';
import { getClipBlob, deleteClipBlob } from './clipStorage.js';
import GameIcon from "./GameIcon.jsx";

export default function ClipsScreen({ clips, onDeleteClip, onBack }) {
  const [clipUrls, setClipUrls] = useState({});

  // Keep created object URLs alive in a ref so they aren't revoked between renders;
  // only revoke them when the screen unmounts (avoids "fails to load" on rewatch).
  const urlMapRef = useRef({});
  useEffect(() => {
    let cancelled = false;
    clips.forEach(async (clip) => {
      if (urlMapRef.current[clip.id]) return;
      try {
        const blob = await getClipBlob(clip.id);
        if (cancelled) return;
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          urlMapRef.current[clip.id] = url;
          setClipUrls(prev => ({ ...prev, [clip.id]: url }));
        }
      } catch {}
    });
    return () => { cancelled = true; };
  }, [clips]);

  useEffect(() => () => {
    Object.values(urlMapRef.current).forEach(url => { try { URL.revokeObjectURL(url); } catch {} });
    urlMapRef.current = {};
  }, []);

  const handleDelete = async (clipId) => {
    try { await deleteClipBlob(clipId); } catch {}
    onDeleteClip(clipId);
  };

  const handleDownload = (clipId) => {
    const url = clipUrls[clipId];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    const clip = clips.find(c => c.id === clipId);
    const ext = (clip?.mime || '').includes('mp4') ? 'mp4' : 'webm';
    a.download = `${clipId}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🎬" size={14} /> CLIPS</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <p className="text-xs text-muted-foreground font-body">
        Press <span className="text-accent font-bold">SPACE</span> during any battle to save the last ~10 seconds. Max 30 clips — oldest are removed automatically.
      </p>
      {clips.length === 0 ? (
        <div className="text-center text-muted-foreground py-20 font-body">
          <p className="text-5xl mb-4"><GameIcon emoji="🎬" size={14} /></p>
          <p>No clips yet. Press SPACE during a battle to capture a clip!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clips.map(clip => (
            <div key={clip.id} className="bg-card border border-border rounded-xl p-3">
              {clipUrls[clip.id] ? (
                <video src={clipUrls[clip.id]} controls playsInline preload="auto" className="w-full rounded-lg bg-black" style={{ aspectRatio: '16 / 9' }} />
              ) : (
                <div className="w-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm" style={{ aspectRatio: '16 / 9' }}>Loading…</div>
              )}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-body">{new Date(clip.created).toLocaleString()}</span>
                  <button onClick={() => handleDownload(clip.id)} className="px-2 py-1 bg-primary/30 text-primary rounded text-[10px] font-heading hover:opacity-80"><GameIcon emoji="⬇" size={14} /> SAVE</button>
                  <button onClick={() => handleDelete(clip.id)} className="px-2 py-1 bg-destructive/20 text-destructive rounded text-[10px] font-heading hover:opacity-80">DELETE</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}