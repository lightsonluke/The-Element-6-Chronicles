import db from './cloudCommunity.js';

import React, { useState, useEffect, useRef } from 'react';

import StagePreview from './StagePreview.jsx';
import { checkProfanity } from './profanityFilter.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// Browse every public stage uploaded by every player. Players can search,
// favorite, like, report, and instantly play any stage.
export default function WorldStages({ onBack, onPlay, onDownload }) {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest'); // newest | played | rated | liked
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(0);
  const unsubRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { const u = await db.auth.me(); setUserId(u.id); refresh(u.id); }
      catch { refresh(null); }
    })();
  }, []);

  const refresh = async (uid) => {
    setLoading(true);
    try {
      let list = await db.entities.UploadedStage.filter({ is_private: false, hidden: false }, '-created_date', 60);
      list = list || [];
      // Deduplicate stages that share a name so only the original creator's copy
      // appears. Same-owner duplicates keep the most recently updated (latest
      // content); cross-owner duplicates (downloaded re-publishes) keep the
      // earliest created (the original creator, e.g. king luke for "dont drop the eggs").
      const byName = {};
      list.forEach(s => { (byName[s.name] = byName[s.name] || []).push(s); });
      const dupIds = [];
      Object.values(byName).forEach(arr => {
        if (arr.length <= 1) return;
        const owners = new Set(arr.map(s => s.owner_user_id));
        if (owners.size === 1) {
          arr.sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || ''));
        } else {
          arr.sort((a, b) => (a.created_date || '').localeCompare(b.created_date || ''));
        }
        arr.slice(1).forEach(s => dupIds.push(s.id));
      });
      for (const id of dupIds) { try { await db.entities.UploadedStage.delete(id); } catch (e) {} }
      if (dupIds.length) list = list.filter(s => !dupIds.includes(s.id));
      setStages(list);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); }
    unsubRef.current = db.entities.UploadedStage.subscribe(() => { refresh(); });
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, []);

  const filtered = (() => {
    let arr = [...stages];
    const q = query.trim().toLowerCase();
    if (q) arr = arr.filter(s => (s.name || '').toLowerCase().includes(q) || (s.owner_username || '').toLowerCase().includes(q));
    const cmp = {
      newest: (a, b) => (b.created_date || '').localeCompare(a.created_date || ''),
      played: (a, b) => (b.plays || 0) - (a.plays || 0),
      liked: (a, b) => (b.likes || 0) - (a.likes || 0),
      rated: (a, b) => (b.likes || 0) - (b.reported_count || 0) - ((a.likes || 0) - (a.reported_count || 0)),
    }[sort] || cmp.newest;
    arr.sort(cmp);
    return arr;
  })();

  const likeStage = async (s) => {
    if (!userId || (s.liked_by || []).includes(userId)) return;
    try {
      await db.entities.UploadedStage.update(s.id, { likes: (s.likes || 0) + 1, liked_by: [...(s.liked_by || []), userId] });
      sfx.coin();
    } catch (e) {}
  };
  const favStage = async (s) => {
    if (!userId) return;
    const has = (s.favorited_by || []).includes(userId);
    try {
      await db.entities.UploadedStage.update(s.id, { favorited_by: has ? (s.favorited_by || []).filter(i => i !== userId) : [...(s.favorited_by || []), userId] });
      sfx.click();
    } catch (e) {}
  };
  const reportStage = async (s) => {
    if (!userId || (s.reporters || []).includes(userId)) return;
    const reports = (s.reported_count || 0) + 1;
    const hide = reports >= 5; // auto-hide after enough valid reports
    try {
      await db.entities.UploadedStage.update(s.id, { reported_count: reports, reporters: [...(s.reporters || []), userId], hidden: hide });
      sfx.warning();
    } catch (e) {}
  };
  const playStage = async (s) => {
    try { await db.entities.UploadedStage.update(s.id, { plays: (s.plays || 0) + 1 }); } catch (e) {}
    sfx.levelUp();
    onPlay?.(s);
  };

  return (
    <div className="w-full max-w-6xl flex flex-col gap-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🌍" size={14} /> WORLD STAGES</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or creator…" maxLength={28}
            className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body w-44" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-heading">
            <option value="newest">Newest</option>
            <option value="played">Most Played</option>
            <option value="rated">Highest Rated</option>
            <option value="liked">Most Liked</option>
          </select>
          <button onClick={refresh} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="↻" size={14} /></button>
          <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm font-body">Loading stages…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground font-body text-sm">No public stages found yet. Use the Stage Editor to create and publish one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xl">{s.emoji || <GameIcon emoji="🎨" size={14} />}</span>
                <span className="text-[9px] text-muted-foreground">{new Date(s.created_date || Date.now()).toLocaleDateString()}</span>
              </div>
              <StagePreview stage={s.stage_data} />
              <p className="font-heading text-sm text-foreground truncate">{s.name || 'Untitled Stage'}</p>
              <p className="text-[10px] text-muted-foreground font-body">by {s.owner_username || 'Unknown'}</p>
              {s.description && <p className="text-[9px] text-muted-foreground font-body line-clamp-2">{s.description}</p>}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-heading">
                <span><GameIcon emoji="▶" size={14} /> {s.plays || 0}</span>
                <span><GameIcon emoji="♥" size={14} /> {s.likes || 0}</span>
                <span><GameIcon emoji="★" size={14} /> {s.favorited_by?.length || 0}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => playStage(s)} className="flex-1 px-2 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="▶" size={14} /> PLAY</button>
                <button onClick={() => { onDownload?.(s); sfx.click(); }} className="px-2 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs" title="Download to your stages"><GameIcon emoji="⬇" size={14} /></button>
                <button onClick={() => likeStage(s)} disabled={(s.liked_by || []).includes(userId)} className="px-2 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs disabled:opacity-40"><GameIcon emoji="♥" size={14} /></button>
                <button onClick={() => favStage(s)} className="px-2 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="★" size={14} /></button>
                <button onClick={() => reportStage(s)} disabled={(s.reporters || []).includes(userId)} className="px-2 py-1.5 bg-destructive text-destructive-foreground rounded font-heading text-xs disabled:opacity-40"><GameIcon emoji="⚠" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[8px] text-muted-foreground text-center">Every public stage appears here automatically. Stages with many valid reports are auto-hidden pending moderation.</p>
    </div>
  );
}
