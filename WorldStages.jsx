import React, { useEffect, useMemo, useState } from 'react';
import db from './cloudCommunity.js';
import GameIcon from './GameIcon.jsx';
import { MATERIALS, drawMaterialOverlay } from './materials.js';
import { HAZARD_TYPES, OBJECT_TYPES } from './stageHazards.js';

const PAGE_SIZE = 24;

function stageDataOf(stage) {
  if (!stage) return {};
  const raw = stage.stage_data;
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {}
  }
  // Some older records stored the stage fields directly.
  return stage.platforms || stage.hazards || stage.objects ? stage : {};
}

function normalizeStage(row) {
  if (!row || typeof row !== 'object') return null;
  const data = stageDataOf(row);
  return {
    ...row,
    stage_data: data,
    backdrop: row.backdrop || data.backdrop || 'splitcity',
    emoji: row.emoji || data.emoji || '🎨',
    name: row.name || data.name || 'Untitled Stage',
  };
}

function stageEntity() {
  const entities = db?.entities || {};
  // Keep compatibility with the existing UploadedStage entity, but also
  // support the community_stages table/entity used by the current SQL schema.
  return entities.UploadedStage || entities.CommunityStage || entities.community_stages || null;
}

function platformCount(stage) {
  return Array.isArray(stageDataOf(stage).platforms) ? stageDataOf(stage).platforms.length : 0;
}

function formatDate(value) {
  if (!value) return 'Unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderThumb(ctx, stage, w = 320, h = 180) {
  const data = stageDataOf(stage);
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  const palette = {
    city: ['#0a0820', '#1a1250'], forest: ['#0a2010', '#1a4020'], void: ['#05010a', '#150030'],
    sunset: ['#1a0a30', '#FF6644'], ocean: ['#001030', '#004488'], volcano: ['#1a0500', '#FF3300'],
    space: ['#000005', '#100020'], arctic: ['#0a0a30', '#4488CC'], desert: ['#2a1a00', '#CCAA44'],
    jungle: ['#0a2000', '#226622'], sky: ['#001122', '#4488FF'], underworld: ['#0a0005', '#440022'],
    neon: ['#0a0020', '#FF00AA'], ruins: ['#1a1000', '#443322'], crystal: ['#0a0a20', '#AA44FF'],
    storm: ['#050510', '#334466'], dawn: ['#1a1040', '#FFAA88'], midnight: ['#000010', '#000033'],
    aurora: ['#000510', '#44FF88'], ember: ['#100000', '#FF6600'], splitcity: ['#0a0820', '#1a1250'],
  };
  const colors = palette[stage.backdrop || data.backdrop] || palette.city;
  g.addColorStop(0, colors[0]); g.addColorStop(1, colors[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  const sx = w / 1280, sy = h / 720;
  (data.platforms || []).forEach(p => {
    const mat = MATERIALS.find(m => m.id === (p.material || 'normal')) || MATERIALS[0];
    ctx.fillStyle = mat.color;
    ctx.fillRect(p.x * sx, p.y * sy, Math.max(2, p.w * sx), Math.max(2, p.h * sy));
    try { drawMaterialOverlay(ctx, { ...p, x: p.x * sx, y: p.y * sy, w: Math.max(2, p.w * sx), h: Math.max(2, p.h * sy) }, 0); } catch {}
  });
  (data.hazards || []).forEach(h => {
    const def = HAZARD_TYPES.find(t => t.id === h.type) || HAZARD_TYPES[0];
    ctx.globalAlpha = 0.6; ctx.fillStyle = def.color || '#ff4444';
    ctx.fillRect(h.x * sx, h.y * sy, Math.max(2, (h.w || 40) * sx), Math.max(2, (h.h || 30) * sy));
    ctx.globalAlpha = 1;
  });
  (data.objects || []).forEach(o => {
    const def = OBJECT_TYPES.find(t => t.id === o.type) || OBJECT_TYPES[0];
    ctx.fillStyle = def.color || '#ffffff';
    ctx.beginPath(); ctx.arc(o.x * sx, o.y * sy, Math.max(2, (def.size || 20) * sx * 0.5), 0, Math.PI * 2); ctx.fill();
  });
}

function Thumbnail({ stage }) {
  const ref = React.useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    renderThumb(ref.current.getContext('2d'), stage);
  }, [stage]);
  return <canvas ref={ref} width={320} height={180} className="w-full rounded-lg border border-border" />;
}

async function fetchPublicStages() {
  const entity = stageEntity();
  if (!entity) throw new Error('World Stages entity is not available');

  try {
    if (typeof entity.filter === 'function') {
      const rows = await entity.filter({ is_private: false, hidden: false });
      if (Array.isArray(rows)) return rows.map(normalizeStage).filter(Boolean);
    }
  } catch {}

  try {
    if (typeof entity.list === 'function') {
      const rows = await entity.list();
      if (Array.isArray(rows)) return rows.map(normalizeStage).filter(Boolean).filter(s => !s.is_private && !s.hidden);
    }
  } catch {}

  return [];
}

export default function WorldStages({ onBack, onPlay, onDownload }) {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const rows = await fetchPublicStages();
      // Defensive normalization + global public-only filtering.
      const clean = rows
        .map(normalizeStage)
        .filter(Boolean)
        .filter(s => !s.is_private && !s.hidden)
        .filter(s => Array.isArray(stageDataOf(s).platforms));
      setStages(clean);
    } catch (e) {
      setStages([]);
      setError('Could not load World Stages. Check the community database setup and try again.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [query, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? stages.filter(s => [s.name, s.owner_username, s.description].some(v => String(v || '').toLowerCase().includes(q))) : [...stages];
    list.sort((a, b) => {
      if (sort === 'plays') return (b.plays || 0) - (a.plays || 0);
      if (sort === 'likes') return (b.likes || 0) - (a.likes || 0);
      if (sort === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
      return new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0);
    });
    return list;
  }, [stages, query, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-xl font-heading text-accent tracking-wider">WORLD STAGES</h3>
          <p className="text-xs text-muted-foreground font-body">Public stages from every creator — no owner or region filter.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs disabled:opacity-50"><GameIcon emoji="↻" size={14} /> REFRESH</button>
          <button onClick={onBack} className="px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs">← BACK</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap bg-card border border-border rounded-xl p-3">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search stage, creator, description..." className="flex-1 min-w-[220px] px-3 py-2 bg-secondary text-secondary-foreground rounded text-xs" />
        <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 bg-secondary text-secondary-foreground rounded text-xs">
          <option value="newest">Newest</option><option value="plays">Most played</option><option value="likes">Most liked</option><option value="name">Name A–Z</option>
        </select>
      </div>

      {loading && <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">Loading global stages…</div>}
      {!loading && error && <div className="bg-destructive/15 border border-destructive rounded-xl p-4 text-sm text-destructive">{error}</div>}
      {!loading && !error && visible.length === 0 && <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No public stages match your search.</div>}

      {!loading && !error && visible.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(stage => (
            <div key={stage.id || `${stage.owner_user_id}-${stage.name}`} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
              <Thumbnail stage={stage} />
              <div className="flex items-center gap-2">
                <span className="text-2xl">{stage.emoji || '🎨'}</span>
                <div className="min-w-0">
                  <div className="font-heading text-sm truncate">{stage.name || 'Untitled Stage'}</div>
                  <div className="text-[10px] text-muted-foreground truncate">by {stage.owner_username || 'Player'} · {formatDate(stage.updated_date || stage.created_date)}</div>
                </div>
              </div>
              {stage.description && <p className="text-[10px] text-muted-foreground line-clamp-2">{stage.description}</p>}
              <div className="text-[9px] text-muted-foreground flex gap-3 flex-wrap">
                <span>{platformCount(stage)} platforms</span><span>▶ {stage.plays || 0}</span><span>♥ {stage.likes || 0}</span>
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => onPlay?.(stage)} className="flex-1 px-3 py-2 bg-accent text-accent-foreground rounded font-heading text-xs hover:opacity-80">PLAY / IMPORT</button>
                <button onClick={() => onDownload?.(stage)} className="px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80">SAVE</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 bg-secondary rounded text-xs disabled:opacity-40">←</button>
          <span className="text-xs text-muted-foreground">PAGE {page} / {pages} · {filtered.length} GLOBAL STAGES</span>
          <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1 bg-secondary rounded text-xs disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}
