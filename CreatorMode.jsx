import db from './cloudCommunity.js';

import React, { useState, useEffect, useRef } from 'react';

import PlatformFighter from './PlatformFighter.jsx';
import StagePreview from './StagePreview.jsx';
import { ALL_CHARS } from './allCharacters.js';
import { STAGE_LIST } from './stages.js';
import { defaultMods, WIN_CONDITIONS, CPU_DIFFICULTIES, CPU_BEHAVIORS } from './matchMods.js';
import { sfx } from './sfx.js';
import CommunityCampaignBrowser from './CommunityCampaignBrowser.jsx';
import GameIcon from "./GameIcon.jsx";

const ALL = ALL_CHARS;
const DIFFS = ['Easy','Normal','Hard','Expert','Nightmare'];
const LOCAL_KEY = 'el6_creator_campaigns';

// Creator Mode — build & play community-made campaigns of ordered battles.
// Players can create, save, edit, duplicate, delete, and publish campaigns.
export default function CreatorMode({ progress, customCharsData = {}, onBack, playCampaign = null, customStages = [] }) {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [view, setView] = useState(playCampaign ? 'play' : 'browse'); // browse | edit | play
  const [myCampaigns, setMyCampaigns] = useState(() => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; } });
  const [edit, setEdit] = useState(null); // working draft campaign object
  const [playCur, setPlayCur] = useState(playCampaign ? { campaign: playCampaign, index: 0, finishedBattles: [] } : null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showWorld, setShowWorld] = useState(false);

  useEffect(() => {
    db.auth.me().then(u => { setUserId(u.id); setUsername(u.username || (u.full_name || (u.email || 'Player')).split('@')[0]); }).catch(() => {});
  }, []);

  const persist = (list) => { setMyCampaigns(list); try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch {} };

  const newCampaign = () => {
    setEdit({
      _local: true,
      name: 'Untitled Campaign', description: '', thumbnail: '🎮',
      difficulty: 'normal', estimated_minutes: 15, is_public: true,
      battles: [], dialogues: [],
    });
    setView('edit');
    sfx.click();
  };
  const editCampaign = (c, idx) => { setEdit({ ...c, _localIdx: idx, _local: !c._fromServer }); setView('edit'); };
  const duplicateCampaign = (c) => { persist([{ ...c, name: c.name + ' (Copy)', _id: undefined, _localId: undefined }, ...myCampaigns]); sfx.click(); };
  const deleteCampaign = (idx) => { persist(myCampaigns.filter((_, i) => i !== idx)); sfx.warning(); };
  const saveLocal = () => {
    if (!edit) return;
    const list = [...myCampaigns];
    if (edit._localId != null) { list[edit._localId] = edit; } else { edit._localId = list.length; list.push(edit); }
    persist(list);
    sfx.purchaseSuccess();
  };
  const addBattle = () => {
    setEdit({ ...edit, battles: [...edit.battles, {
      stage: 'splitcity', p1Char: progress?.favoriteId || 'yellow', cpuChars: ['red'], teams: [1],
      introText: '', outroText: '', music: 'fight', weather: 'clear',
      mods: { ...defaultMods() }, winCondition: 'ko', target: 1,
    }] });
    sfx.click();
  };
  const updateBattle = (i, patch) => { const b = [...edit.battles]; b[i] = { ...b[i], ...patch }; setEdit({ ...edit, battles: b }); };
  const removeBattle = (i) => { setEdit({ ...edit, battles: edit.battles.filter((_, idx) => idx !== i) }); };
  const moveBattle = (i, dir) => { const b = [...edit.battles]; const j = i + dir; if (j < 0 || j >= b.length) return; [b[i], b[j]] = [b[j], b[i]]; setEdit({ ...edit, battles: b }); };

  const publish = async () => {
    setErr('');
    if (!edit || !edit.battles.length) { setErr('Add at least one battle.'); return; }
    setBusy(true);
    try {
      // Update an existing server campaign if we already published it (keep likes/plays).
      if (edit._campaignId) {
        await db.entities.Campaign.update(edit._campaignId, {
          name: edit.name, description: edit.description, thumbnail: edit.thumbnail,
          difficulty: edit.difficulty, estimated_minutes: edit.estimated_minutes,
          is_public: edit.is_public, battles: edit.battles, dialogues: edit.dialogues,
        });
        sfx.purchaseSuccess();
      } else {
        const created = await db.entities.Campaign.create({
          owner_user_id: userId, owner_username: username,
          name: edit.name, description: edit.description, thumbnail: edit.thumbnail,
          difficulty: edit.difficulty, estimated_minutes: edit.estimated_minutes,
          is_public: edit.is_public, battles: edit.battles, dialogues: edit.dialogues,
        });
        edit._campaignId = created.id;
        saveLocal();
        sfx.purchaseSuccess();
      }
    } catch (e) { setErr('Publish failed. Try again.'); }
    setBusy(false);
  };

  if (showWorld) {
    return <CommunityCampaignBrowser onBack={() => setShowWorld(false)} onPlay={(c) => { setShowWorld(false); setPlayCur({ campaign: c, index: 0, finishedBattles: [] }); setView('play'); }} />;
  }

  // ── Play mode ──
  if (view === 'play' && playCur) {
    return <CampaignPlayer cur={playCur} setCur={setPlayCur} progress={progress} customCharsData={customCharsData} customStages={customStages} onExit={() => { setView('browse'); setPlayCur(null); }} />;
  }

  if (view === 'edit') {
    return (
      <div className="w-full max-w-5xl flex flex-col gap-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-heading text-accent tracking-wider"><GameIcon emoji="✎" size={14} /> CAMPAIGN — EDITOR</h2>
          <button onClick={() => { saveLocal(); setView('browse'); }} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label className="flex flex-col gap-1"><span className="text-[9px] font-heading text-muted-foreground">CAMPAIGN NAME</span><input value={edit.name} maxLength={32} onChange={e => setEdit({ ...edit, name: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs font-body col-span-2" /></label>
          <label className="flex flex-col gap-1"><span className="text-[9px] font-heading text-muted-foreground">ICON</span><input value={edit.thumbnail} maxLength={2} onChange={e => setEdit({ ...edit, thumbnail: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-center text-sm w-12" /></label>
          <label className="flex flex-col gap-1"><span className="text-[9px] font-heading text-muted-foreground">DIFFICULTY</span><select value={edit.difficulty} onChange={e => setEdit({ ...edit, difficulty: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs"><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option><option value="expert">Expert</option><option value="nightmare">Nightmare</option></select></label>
          <label className="flex flex-col gap-1 col-span-2"><span className="text-[9px] font-heading text-muted-foreground">DESCRIPTION</span><input value={edit.description} maxLength={140} onChange={e => setEdit({ ...edit, description: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs font-body" /></label>
          <label className="flex flex-col gap-1"><span className="text-[9px] font-heading text-muted-foreground">EST. MINUTES</span><input type="number" min={1} max={600} value={edit.estimated_minutes} onChange={e => setEdit({ ...edit, estimated_minutes: parseInt(e.target.value) || 15 })} className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs w-16" /></label>
          <label className="flex items-center gap-2"><span className="text-[9px] font-heading text-muted-foreground">PUBLIC</span><input type="checkbox" checked={!!edit.is_public} onChange={e => setEdit({ ...edit, is_public: e.target.checked })} /></label>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={addBattle} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs">+ ADD BATTLE</button>
          <button onClick={saveLocal} className="px-3 py-1.5 bg-primary text-primary-foreground rounded font-heading text-xs">SAVE LOCAL</button>
          <button onClick={publish} disabled={busy || !userId} className="px-3 py-1.5 bg-primary text-primary-foreground rounded font-heading text-xs disabled:opacity-50">{busy ? 'PUBLISHING…' : '↑ PUBLISH / UPDATE'}</button>
        </div>
        {err && <p className="text-[10px] text-destructive font-body">{err}</p>}

        <div className="flex flex-col gap-2">
          {edit.battles.length === 0 && <p className="text-muted-foreground text-xs font-body">No battles yet. Add one to begin your campaign.</p>}
          {edit.battles.map((b, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-heading text-xs text-accent">BATTLE {i + 1}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveBattle(i, -1)} className="px-2 py-0.5 bg-secondary rounded text-xs"><GameIcon emoji="↑" size={14} /></button>
                  <button onClick={() => moveBattle(i, 1)} className="px-2 py-0.5 bg-secondary rounded text-xs"><GameIcon emoji="↓" size={14} /></button>
                  <button onClick={() => removeBattle(i)} className="px-2 py-0.5 bg-destructive text-destructive-foreground rounded text-xs"><GameIcon emoji="🗑" size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                <label className="flex flex-col gap-0.5"><span className="font-heading text-muted-foreground">STAGE</span>
                  <select value={b.stage} onChange={e => updateBattle(i, { stage: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5">
                    {STAGE_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    {customStages.map((s, ci) => <option key={ci} value={`custom_${ci}`}>{s.emoji || <GameIcon emoji="🎨" size={14} />} {s.name || 'Custom'}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-0.5"><span className="font-heading text-muted-foreground">YOUR CHAR</span>
                  <select value={b.p1Char} onChange={e => updateBattle(i, { p1Char: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5">
                    <option value="__playerselect"><GameIcon emoji="🎭" size={14} /> Player Select</option>
                    {ALL.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-0.5"><span className="font-heading text-muted-foreground">CPU CHAR</span>
                  <select value={b.cpuChars[0]} onChange={e => updateBattle(i, { cpuChars: [e.target.value] })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5">
                    {ALL.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-0.5"><span className="font-heading text-muted-foreground">CPU LVL</span>
                  <select value={b.mods.cpuDifficulty} onChange={e => updateBattle(i, { mods: { ...b.mods, cpuDifficulty: e.target.value } })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5">
                    {CPU_DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-0.5"><span className="font-heading text-muted-foreground">BEHAVIOR</span>
                  <select value={b.mods.cpuBehavior} onChange={e => updateBattle(i, { mods: { ...b.mods, cpuBehavior: e.target.value } })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5">
                    {CPU_BEHAVIORS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-0.5"><span className="font-heading text-muted-foreground">WIN COND</span>
                  <select value={b.winCondition} onChange={e => updateBattle(i, { winCondition: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5">
                    {WIN_CONDITIONS.map(w => <option key={w.id} value={w.id}>{w.label.split(' ')[0]}</option>)}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-0.5"><span className="font-heading text-[9px] text-muted-foreground">INTRO TEXT</span><input value={b.introText} maxLength={120} onChange={e => updateBattle(i, { introText: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5 text-[10px] font-body" /></label>
              <label className="flex flex-col gap-0.5"><span className="font-heading text-[9px] text-muted-foreground">OUTRO TEXT</span><input value={b.outroText} maxLength={120} onChange={e => updateBattle(i, { outroText: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5 text-[10px] font-body" /></label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px]">
                <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">STOCKS</span><input type="number" min={1} max={9} value={b.mods.stocks} onChange={e => updateBattle(i, { mods: { ...b.mods, stocks: parseInt(e.target.value) || 1 } })} className="w-12 bg-secondary text-secondary-foreground rounded px-1 py-0.5" /></label>
                <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">TIME</span><input type="number" min={0} max={999} value={b.mods.timeLimit} onChange={e => updateBattle(i, { mods: { ...b.mods, timeLimit: parseInt(e.target.value) || 0 } })} className="w-12 bg-secondary text-secondary-foreground rounded px-1 py-0.5" /></label>
                <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">DMG%</span><input type="number" step={0.25} min={0.25} max={4} value={b.mods.damageMultiplier} onChange={e => updateBattle(i, { mods: { ...b.mods, damageMultiplier: parseFloat(e.target.value) || 1 } })} className="w-12 bg-secondary text-secondary-foreground rounded px-1 py-0.5" /></label>
                <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">GRAV</span><input type="number" step={0.25} min={0.25} max={3} value={b.mods.gravity} onChange={e => updateBattle(i, { mods: { ...b.mods, gravity: parseFloat(e.target.value) || 1 } })} className="w-12 bg-secondary text-secondary-foreground rounded px-1 py-0.5" /></label>
                <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">SLOWMO</span><input type="number" step={0.1} min={0.1} max={2} value={b.mods.slowMotion} onChange={e => updateBattle(i, { mods: { ...b.mods, slowMotion: parseFloat(e.target.value) || 1 } })} className="w-12 bg-secondary text-secondary-foreground rounded px-1 py-0.5" /></label>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {['infiniteJumps','infiniteStocks','infiniteSuper','infinitePower','freezeAI','stageHazards','friendlyFire'].map(k => (
                  <button key={k} onClick={() => updateBattle(i, { mods: { ...b.mods, [k]: !b.mods[k] } })} className={`px-2 py-1 rounded font-heading text-[9px] border-2 ${b.mods[k] ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary border-border text-secondary-foreground'}`}>{k}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground">Updating a republished campaign keeps its likes, plays, and favorites. Public campaigns appear in the Community Campaign Browser automatically.</p>
      </div>
    );
  }

  // browse view
  return (
    <div className="w-full max-w-5xl flex flex-col gap-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🧩" size={14} /> CAMPAIGN</h2>
        <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <div className="flex gap-2">
        <button onClick={newCampaign} className="px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-sm">+ NEW CAMPAIGN</button>
        <button onClick={() => setShowWorld(true)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="🌐" size={14} /> WORLD CAMPAIGNS</button>
      </div>
      <p className="font-heading text-xs text-primary mt-2">MY DRAFTS</p>
      {myCampaigns.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center"><p className="text-muted-foreground text-sm font-body">No campaigns yet. Create one to build your own playable story!</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myCampaigns.map((c, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between"><span className="text-3xl">{c.thumbnail || <GameIcon emoji="🎮" size={14} />}</span><span className="text-[9px] px-2 py-0.5 rounded bg-primary/20 text-primary font-heading">{DIFFS[['easy','normal','hard','expert','nightmare'].indexOf(c.difficulty)] || 'Normal'}</span></div>
              <p className="font-heading text-sm text-foreground">{c.name}</p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-heading"><span><GameIcon emoji="⚔" size={14} /> {c.battles.length} battles</span><span>{c.is_public ? '🌐 Public' : '🔒 Private'}</span></div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => { setPlayCur({ campaign: c, index: 0, finishedBattles: [] }); setView('play'); sfx.click(); }} className="flex-1 px-2 py-1.5 bg-primary text-primary-foreground rounded font-heading text-xs"><GameIcon emoji="▶" size={14} /> PLAY</button>
                <button onClick={() => editCampaign(c, idx)} className="px-2 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="✎" size={14} /> EDIT</button>
                <button onClick={() => persist([c, ...myCampaigns.filter((_, i) => i !== idx)])} className="px-2 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs">⧉ DUP</button>
                <button onClick={() => deleteCampaign(idx)} className="px-2 py-1.5 bg-destructive text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="🗑" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Campaign Player — runs battles in sequence with intro/outro text ──
function CampaignPlayer({ cur, setCur, progress, customCharsData, customStages, onExit }) {
  const [phase, setPhase] = useState(() => {
    const firstB = (cur.campaign.battles || [])[cur.index];
    return firstB && firstB.p1Char === '__playerselect' ? 'charselect' : 'intro';
  }); // charselect | intro | fight | outro | done
  const [fightKey, setFightKey] = useState(0);
  const [overrideChar, setOverrideChar] = useState(null);
  const c = cur.campaign;
  const battles = c.battles || [];
  const b = battles[cur.index];

  // Guard: campaign has no battles
  if (!b) {
    return (
      <div className="w-full max-w-2xl flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-heading text-destructive">NO BATTLES</h2>
        <p className="font-body text-sm text-muted-foreground">This campaign has no battles yet.</p>
        <button onClick={onExit} className="px-5 py-2 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
    );
  }

  const allowSelect = b.p1Char === '__playerselect';
  const p1Char = allowSelect ? (overrideChar || progress?.favoriteId || (progress?.unlockedIds || ['yellow'])[0] || 'yellow') : b.p1Char;

  const finishBattle = (result) => {
    const won = result?.p1Won === true;
    setCur({ ...cur, finishedBattles: [...cur.finishedBattles, { idx: cur.index, won }] });
    setPhase('outro');
    if (!won) return;
    sfx.click();
  };

  const nextBattle = () => { if (cur.index + 1 < battles.length) { setCur({ ...cur, index: cur.index + 1 }); setOverrideChar(null); setPhase((battles[cur.index + 1] || {}).p1Char === '__playerselect' ? 'charselect' : 'intro'); } else setPhase('done'); };

  const stage = b.stage?.startsWith('custom_') ? (() => { const idx = parseInt(b.stage.split('_')[1], 10); const st = customStages[idx]; return { map: 'custom', customPlatforms: st?.platforms, customSpawnPoints: st?.spawnPoints }; })() : { map: b.stage || 'splitcity', customPlatforms: null, customSpawnPoints: null };

  // ── Character select — choose your fighter before each battle ──
  if (phase === 'charselect') {
    const unlocked = progress?.unlockedIds || ['yellow'];
    const customIds = customCharsData ? Object.keys(customCharsData) : [];
    const allUnlocked = Array.from(new Set([...unlocked, ...customIds]));
    const isFirst = cur.index === 0;
    return (
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <h2 className="font-heading text-xl text-accent mb-1">{c.name}</h2>
          <p className="font-body text-sm text-muted-foreground">by {c.owner_username || 'Community'}</p>
          <p className="font-heading text-xs text-primary mt-2">{isFirst ? 'CHOOSE YOUR FIGHTER' : `BATTLE ${cur.index + 1} — CHOOSE YOUR FIGHTER`}</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[50vh] overflow-y-auto bg-card border border-border rounded-xl p-3">
          {allUnlocked.map(id => {
            const ch = customCharsData[id] || ALL.find(c => c.id === id) || { name: id, color: '#888' };
            const sel = (overrideChar || b.p1Char) === id;
            return (
              <button key={id} onClick={() => { setOverrideChar(id); sfx.click(); }} title={ch.name}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-bold ${sel ? 'border-accent scale-105' : 'border-transparent'}`}
                style={{ background: ch.color || '#888' }}>
                {ch.name?.[0] || '?'}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 justify-center">
          <button onClick={() => { setPhase('intro'); sfx.click(); }} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-heading text-sm">{isFirst ? '▶ START CAMPAIGN' : '▶ FIGHT'}</button>
          <button onClick={onExit} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-heading text-sm"><GameIcon emoji="←" size={14} /> EXIT</button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="w-full max-w-2xl flex flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-heading text-accent"><GameIcon emoji="🏆" size={14} /> CAMPAIGN COMPLETE</h2>
        <p className="font-body text-sm text-muted-foreground">You cleared "{c.name}" by {c.owner_username || 'the community'}.</p>
        <button onClick={onExit} className="px-5 py-2 bg-primary text-primary-foreground rounded font-heading text-sm">FINISH</button>
      </div>
    );
  }

  if (phase === 'fight') {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <PlatformFighter key={fightKey}
          p1Char={p1Char} p2Char={(b.cpuChars || ['red'])[0]} p2IsCPU
          selectedMap={stage.map} customPlatforms={stage.customPlatforms} customSpawnPoints={stage.customSpawnPoints}
          cpuDifficulty={(b.mods || {}).cpuDifficulty || 'regular'}
          gameMode={(b.winCondition === 'no_stock_lost' ? 'sudden' : 'regular')}
          infiniteSuper={!!((b.mods || {}).infiniteSuper)}
          matchTime={(b.mods || {}).timeLimit || 240}
          mods={b.mods || {}}
          stockCount={(b.mods || {}).stocks || 0}
          musicVolume={progress?.settings?.musicVolume ?? 50} sfxVolume={progress?.settings?.sfxVolume ?? 70}
          settings={progress?.settings || {}}
          equippedAccessories={progress?.equippedAccessories || {}}
          equippedSkins={progress?.equippedSkins || {}}
          killFXId={progress?.settings?.killFXEnabled !== false ? (progress?.equippedKillFX || 'none') : 'none'}
          customCharsData={customCharsData}
          onEnd={finishBattle}
          onAward={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
        <p className="font-heading text-xs text-accent">{phase === 'intro' ? '⚔ BATTLE ' + (cur.index + 1) : '✓ BATTLE CLEARED'}</p>
        <p className="font-heading text-lg text-foreground">{c.name} — Battle {cur.index + 1}/{battles.length}</p>
        <p className="font-body text-sm text-muted-foreground min-h-[3em]">{phase === 'intro' ? (b.introText || 'Prepare for the next battle…') : (b.outroText || 'Victory! Onward.')}</p>
        {phase === 'intro' ? (
          <button onClick={() => { setFightKey(k => k + 1); setPhase('fight'); sfx.click(); }} className="px-5 py-2.5 bg-primary text-primary-foreground rounded font-heading text-sm self-start"><GameIcon emoji="▶" size={14} /> FIGHT</button>
        ) : (
          <div className="flex gap-2">
            {cur.index + 1 < battles.length ? <button onClick={nextBattle} className="px-5 py-2 bg-accent text-accent-foreground rounded font-heading text-sm">NEXT BATTLE <GameIcon emoji="→" size={14} /></button> : <button onClick={() => setPhase('done')} className="px-5 py-2 bg-accent text-accent-foreground rounded font-heading text-sm">FINISH</button>}
            <button onClick={onExit} className="px-5 py-2 bg-secondary text-secondary-foreground rounded font-heading text-sm">EXIT CAMPAIGN</button>
          </div>
        )}
      </div>
    </div>
  );
}
