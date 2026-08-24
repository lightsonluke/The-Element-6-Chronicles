import db from './cloudCommunity.js';

import React, { useState, useEffect, useRef } from 'react';

import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const DIFF_LABEL = { easy: 'Easy', normal: 'Normal', hard: 'Hard', expert: 'Expert', nightmare: 'Nightmare' };

// Community Campaign Browser — browse every uploaded campaign.
export default function CommunityCampaignBrowser({ onBack, onPlay }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    db.auth.me().then(u => setUserId(u.id)).catch(() => {});
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await db.entities.Campaign.filter({ is_public: true, hidden: false }, '-created_date', 60);
      setCampaigns(list || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); }
    unsubRef.current = db.entities.Campaign.subscribe(() => { refresh(); });
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, []);

  const filtered = (() => {
    let arr = [...campaigns];
    const q = query.trim().toLowerCase();
    if (q) arr = arr.filter(c => (c.name || '').toLowerCase().includes(q) || (c.owner_username || '').toLowerCase().includes(q));
    const cmp = {
      newest: (a, b) => (b.created_date || '').localeCompare(a.created_date || ''),
      played: (a, b) => (b.plays || 0) - (a.plays || 0),
      liked: (a, b) => (b.likes || 0) - (a.likes || 0),
    }[sort] || ((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    arr.sort(cmp);
    return arr;
  })();

  const like = async (c) => {
    if (!userId || (c.liked_by || []).includes(userId)) return;
    try { await db.entities.Campaign.update(c.id, { likes: (c.likes || 0) + 1, liked_by: [...(c.liked_by || []), userId] }); sfx.coin(); } catch (e) {}
  };
  const fav = async (c) => {
    if (!userId) return;
    const has = (c.favorited_by || []).includes(userId);
    try { await db.entities.Campaign.update(c.id, { favorited_by: has ? (c.favorited_by || []).filter(i => i !== userId) : [...(c.favorited_by || []), userId] }); sfx.click(); } catch (e) {}
  };
  const report = async (c) => {
    if (!userId || (c.reporters || []).includes(userId)) return;
    const r = (c.reported_count || 0) + 1;
    try { await db.entities.Campaign.update(c.id, { reported_count: r, reporters: [...(c.reporters || []), userId], hidden: r >= 5 }); sfx.warning(); } catch (e) {}
  };
  const play = async (c) => {
    try { await db.entities.Campaign.update(c.id, { plays: (c.plays || 0) + 1 }); } catch (e) {}
    sfx.click();
    onPlay?.(c);
  };

  return (
    <div className="w-full max-w-6xl flex flex-col gap-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🏆" size={14} /> COMMUNITY CAMPAIGNS</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search campaigns or creators…" maxLength={28} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body w-48" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-heading">
            <option value="newest">Newest</option>
            <option value="played">Most Played</option>
            <option value="liked">Most Liked</option>
          </select>
          <button onClick={refresh} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="↻" size={14} /></button>
          <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>
      {loading ? <p className="text-muted-foreground text-sm">Loading…</p> : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground font-body text-sm">No campaigns found yet. Create one in Creator Mode!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between"><span className="text-3xl">{c.thumbnail || <GameIcon emoji="🎮" size={14} />}</span><span className="text-[9px] px-2 py-0.5 rounded bg-primary/20 text-primary font-heading">{DIFF_LABEL[c.difficulty] || 'Normal'}</span></div>
              <p className="font-heading text-sm text-foreground truncate">{c.name || 'Untitled Campaign'}</p>
              <p className="text-[10px] text-muted-foreground font-body">by {c.owner_username || 'Unknown'}</p>
              {c.description && <p className="text-[9px] text-muted-foreground font-body line-clamp-2">{c.description}</p>}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-heading">
                <span><GameIcon emoji="⚔" size={14} /> {(c.battles || []).length} battles</span>
                <span><GameIcon emoji="⏱" size={14} /> ~{c.estimated_minutes || 15}m</span>
                <span><GameIcon emoji="▶" size={14} /> {c.plays || 0}</span>
                <span><GameIcon emoji="♥" size={14} /> {c.likes || 0}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => play(c)} className="flex-1 px-2 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="▶" size={14} /> PLAY</button>
                <button onClick={() => like(c)} disabled={(c.liked_by || []).includes(userId)} className="px-2 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs disabled:opacity-40"><GameIcon emoji="♥" size={14} /></button>
                <button onClick={() => fav(c)} className="px-2 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="★" size={14} /></button>
                <button onClick={() => report(c)} disabled={(c.reporters || []).includes(userId)} className="px-2 py-1.5 bg-destructive text-destructive-foreground rounded font-heading text-xs disabled:opacity-40"><GameIcon emoji="⚠" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
