import db from './localBackend';

import React, { useState, useEffect, useRef } from 'react';

import StagePreview from './StagePreview.jsx';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// My Stages — stages created by the current player.
// - Local custom stages (saved on device) with edit/delete/play
// - Uploaded public stages (on the server) with play, delist, like/fav counts
export default function MyStages({ progress, onBack, onEditStage, onDeleteStage, onPlayStage, onWorldStages }) {
  const [uploaded, setUploaded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const local = progress.customStages || [];

  useEffect(() => {
    db.auth.me().then(u => { setUserId(u.id); setUsername(u.username || (u.full_name || (u.email || 'Player')).split('@')[0]); }).catch(() => {});
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      if (userId) { const list = await db.entities.UploadedStage.filter({ owner_user_id: userId }, '-created_date', 30); setUploaded(list || []); }
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { if (userId) refresh(); }, [userId]);

  const uploadStage = async (stage, idx) => {
    setErr('');
    const name = stage.name || 'Custom Stage';
    const desc = stage.description || '';
    setUploading(true);
    try {
      await db.entities.UploadedStage.create({
        owner_user_id: userId,
        owner_username: username,
        name, description: desc, emoji: stage.emoji || <GameIcon emoji="🎨" size={14} />, backdrop: stage.backdrop || 'city',
        stage_data: { platforms: stage.platforms, spawnPoints: stage.spawnPoints, backdrop: stage.backdrop || 'city' },
        is_private: false,
      });
      sfx.purchaseSuccess();
      refresh();
    } catch (e) { setErr('Upload failed. Try again.'); }
    setUploading(false);
  };

  const delist = async (s) => {
    if (!confirm(`Delist "${s.name}"? It will be removed from World Stages.`)) return;
    try { await db.entities.UploadedStage.update(s.id, { is_private: true }); sfx.click(); refresh(); } catch (e) {}
  };

  const playLocal = (stage) => {
    try { db.entities.UploadedStage; } catch {}
    onPlayStage?.(stage);
  };

  return (
    <div className="w-full max-w-6xl flex flex-col gap-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="📁" size={14} /> MY STAGES</h2>
        <div className="flex gap-2">
          <button onClick={onWorldStages} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="🌍" size={14} /> WORLD STAGES</button>
          <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>

      <div>
        <p className="font-heading text-sm text-primary mb-2">YOUR STAGES ({local.length}/5 saved locally)</p>
        {local.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-muted-foreground font-body text-sm mb-3">No local stages yet. Build one in the Stage Editor!</p>
            {onEditStage && <button onClick={() => onEditStage()} className="px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-xs">OPEN STAGE EDITOR <GameIcon emoji="→" size={14} /></button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {local.map((stage, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2"><span className="text-xl">{stage.emoji || <GameIcon emoji="🎨" size={14} />}</span><span className="font-heading text-sm text-foreground">{stage.name || 'Custom Stage'}</span></div>
                <StagePreview stage={stage} />
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => playLocal(stage)} className="flex-1 px-2 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="▶" size={14} /> PLAY</button>
                  {onEditStage && <button onClick={() => onEditStage(i)} className="px-2 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="✎" size={14} /></button>}
                  {onDeleteStage && <button onClick={() => onDeleteStage(i)} className="px-2 py-1.5 bg-destructive text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="🗑" size={14} /></button>}
                  <button onClick={() => uploadStage(stage, i)} disabled={uploading || !userId} className="px-2 py-1.5 bg-primary text-primary-foreground rounded font-heading text-xs disabled:opacity-50"><GameIcon emoji="↑" size={14} /> UPLOAD</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2">
        <p className="font-heading text-sm text-primary mb-2">UPLOADED ({uploaded.length})</p>
        {loading ? <p className="text-muted-foreground text-xs">Loading…</p> : uploaded.length === 0 ? (
          <p className="text-[10px] text-muted-foreground font-body">You haven't uploaded any stages yet. Upload a local stage to share it on World Stages.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploaded.map(s => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between"><span className="text-xl">{s.emoji || <GameIcon emoji="🎨" size={14} />}</span><span className="text-[9px] text-muted-foreground">{new Date(s.created_date || Date.now()).toLocaleDateString()}</span></div>
                <StagePreview stage={s.stage_data} />
                <p className="font-heading text-sm text-foreground truncate">{s.name}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-heading"><span><GameIcon emoji="▶" size={14} /> {s.plays || 0}</span><span><GameIcon emoji="♥" size={14} /> {s.likes || 0}</span></div>
                <div className="flex gap-1.5">
                  <button onClick={() => onPlayStage?.(s.stage_data)} className="flex-1 px-2 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="▶" size={14} /> PLAY</button>
                  <button onClick={() => delist(s)} className="px-2 py-1.5 bg-destructive text-destructive-foreground rounded font-heading text-xs">DELIST</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {err && <p className="text-[10px] text-destructive font-body">{err}</p>}
    </div>
  );
}