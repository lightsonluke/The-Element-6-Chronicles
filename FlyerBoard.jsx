import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const CATEGORIES = ['Looking for Players', 'Tournament', 'Clan Recruitment', 'Community Event', 'Trading', 'Stage Promotion', 'Creator Campaign Promotion', 'General'];
const SORTS = ['Newest', 'Most Liked', 'Most Viewed', 'Category', 'Creator'];
const REPORT_THRESHOLD = 5;

// Community Flyer Board — any player may post (max 3 active). Supports like,
// report (auto-hide past threshold), search, sort, and creator self-edit/delete.
export default function FlyerBoard({ onBack }) {
  const [flyers, setFlyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [sort, setSort] = useState('Newest');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '', category: 'General' });
  const [err, setErr] = useState('');
  const [reader, setReader] = useState(null);
  const [myCount, setMyCount] = useState(0);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await db.entities.Flyer.filter({ hidden: false }, '-created_date', 200);
      setFlyers(list || []);
      if (userId) setMyCount((list || []).filter(f => f.owner_user_id === userId).length);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    db.auth.me().then(u => { setUserId(u.id); setUsername(u.username || (u.full_name || (u.email || 'Player')).split('@')[0]); }).catch(() => {});
  }, []);
  useEffect(() => { if (userId) refresh(); }, [userId]);

  const post = async () => {
    setErr('');
    if (!draft.title.trim() || !draft.body.trim()) { setErr('Title and body are required.'); return; }
    if (myCount >= 3) { setErr('You already have 3 active flyers. Remove one before posting a new one.'); return; }
    try {
      await db.entities.Flyer.create({ owner_user_id: userId, owner_username: username, title: draft.title.trim(), body: draft.body.trim(), category: draft.category });
      sfx.purchaseSuccess(); setComposing(false); setDraft({ title: '', body: '', category: 'General' }); refresh();
    } catch (e) { setErr('Failed to post flyer.'); sfx.warning(); }
  };

  const remove = async (id) => {
    try { await db.entities.Flyer.delete(id); sfx.click(); refresh(); } catch {}
  };
  const like = async (f) => {
    if (!userId || (f.liked_by || []).includes(userId)) return;
    const liked_by = [...(f.liked_by || []), userId];
    try { await db.entities.Flyer.update(f.id, { likes: (f.likes || 0) + 1, liked_by }); sfx.click(); refresh(); } catch {}
  };
  const report = async (f) => {
    if (!userId || (f.reporters || []).includes(userId)) return;
    const reporters = [...(f.reporters || []), userId];
    const reported_count = (f.reported_count || 0) + 1;
    const hidden = reported_count >= REPORT_THRESHOLD;
    try { await db.entities.Flyer.update(f.id, { reported_count, reporters, hidden }); sfx.click(); refresh(); } catch {}
  };

  const sorted = (flyers || [])
    .filter(f => cat === 'All' || f.category === cat)
    .filter(f => !query || (f.title || '').toLowerCase().includes(query.toLowerCase()) || (f.owner_username || '').toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Newest') return (b.created_date || '').localeCompare(a.created_date || '');
      if (sort === 'Most Liked') return (b.likes || 0) - (a.likes || 0);
      if (sort === 'Most Viewed') return (b.views || 0) - (a.views || 0);
      if (sort === 'Category') return (a.category || '').localeCompare(b.category || '');
      if (sort === 'Creator') return (a.owner_username || '').localeCompare(b.owner_username || '');
      return 0;
    });

  return (
    <div className="w-full max-w-4xl mx-auto bg-card border border-border rounded-2xl p-5 shadow-2xl">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-heading text-xl text-accent tracking-wider"><GameIcon emoji="📎" size={14} /> COMMUNITY FLYER BOARD</h2>
        <div className="flex gap-1.5">
          <button onClick={() => setComposing(v => !v)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded font-heading text-xs">+ POST</button>
          <button onClick={onBack} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">Your active flyers: {myCount}/3. {(3 - myCount) > 0 ? `${3 - myCount} remaining.` : 'Remove one to post a new flyer.'}</p>

      {composing && (
        <div className="bg-muted/30 border border-border rounded-lg p-3 mb-3 space-y-2">
          <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Title" className="w-full bg-secondary text-secondary-foreground rounded px-3 py-2 text-xs font-heading" />
          <textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} placeholder="Body text" rows={3} className="w-full bg-secondary text-secondary-foreground rounded px-3 py-2 text-xs font-body" />
          <div className="flex gap-2 flex-wrap items-center">
            <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs font-heading">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={post} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs">POST FLYER</button>
          </div>
          {err && <p className="text-[10px] text-destructive">{err}</p>}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-3">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title / creator…" className="flex-1 min-w-[180px] bg-secondary text-secondary-foreground rounded px-3 py-1.5 text-xs font-heading" />
        <select value={cat} onChange={e => setCat(e.target.value)} className="bg-secondary text-secondary-foreground rounded px-2 py-1.5 text-xs font-heading">
          <option>All</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-secondary text-secondary-foreground rounded px-2 py-1.5 text-xs font-heading">
          {SORTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading flyers…</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto">
          {sorted.length === 0 && <p className="text-xs text-muted-foreground italic col-span-2">No flyers match. Post the first one!</p>}
          {sorted.map(f => (
            <button key={f.id} onClick={() => setReader(f)} className="text-left bg-muted/30 hover:bg-muted/60 rounded-lg p-3 border border-border">
              <div className="flex justify-between items-start">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-heading">{f.category}</span>
                <span className="text-[9px] text-muted-foreground">{(f.likes || 0)} <GameIcon emoji="♥" size={14} /></span>
              </div>
              <p className="font-heading text-sm text-foreground mt-1">{f.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">by {f.owner_username || 'Unknown'}</p>
            </button>
          ))}
        </div>
      )}

      {reader && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setReader(null)}>
          <div className="bg-card border-2 border-accent rounded-xl p-5 w-[460px] max-w-[94%]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-heading">{reader.category}</span>
              <button onClick={() => setReader(null)} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
            </div>
            <h3 className="font-heading text-base text-foreground mb-1">{reader.title}</h3>
            <p className="text-[10px] text-muted-foreground mb-3">by {reader.owner_username || 'Unknown'}</p>
            <p className="text-sm text-foreground font-body whitespace-pre-wrap mb-4">{reader.body}</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => like(reader)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="♥" size={14} /> Like ({reader.likes || 0})</button>
              <button onClick={() => report(reader)} className="px-3 py-1.5 bg-destructive/60 text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="⚑" size={14} /> Report</button>
              {reader.owner_user_id === userId && <button onClick={() => { remove(reader.id); setReader(null); }} className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="🗑" size={14} /> Delete (mine)</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}