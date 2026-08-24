import React, { useState } from 'react';
import { PLAYABLE, TEAM_COLOR_P1, TEAM_COLOR_P2 } from './sports.js';
import { withCustomChars } from './characterNumber.js';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import BangerGame from './BangerGame.jsx';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// Banger — Element 6 Original. 3v3 elimination on the volleyball court.
const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];
const NET_STARTS = [{ id: 500, label: 'Floor' }, { id: 470, label: 'Low' }, { id: 430, label: 'Mid' }];
const NET_MAX = [{ id: 360, label: 'Low' }, { id: 320, label: 'Mid' }, { id: 260, label: 'High' }];
const BALL_SPEEDS = [{ id: 0.85, label: 'Slow' }, { id: 1.0, label: 'Normal' }, { id: 1.2, label: 'Fast' }];
const WEATHERS = [{ id: 'clear', label: '☀️ Clear' }, { id: 'rain', label: '🌧️ Rain' }, { id: 'snow', label: '❄️ Snow' }];
const MUSIC = [{ id: 'arena', label: '🏟️ Arena' }, { id: 'chill', label: '🎵 Chill' }, { id: 'epic', label: '🔥 Epic' }];

export default function BangerMode({
  onExit, onAward, unlockedIds, favoriteId, equippedAccessories = {}, equippedSkins = {}, settings = {},
  charLevels = {}, equippedElements = {}, onEquipElement, sfxVolume = 50, musicVolume = 50,
  customCharsData = {}, customNumberMap = {}, charMastery = {},
}) {
  const ALL = withCustomChars(PLAYABLE, customCharsData, customNumberMap);
  const unlocked = new Set(unlockedIds || ['yellow']);
  const [phase, setPhase] = useState('select');
  const [team1, setTeam1] = useState([]);
  const [team2, setTeam2] = useState([]);
  const [els1, setEls1] = useState({});
  const [els2, setEls2] = useState({});
  const [p2IsCPU, setP2IsCPU] = useState(true);
  const [difficulty, setDifficulty] = useState(settings?.defaultCPUDifficulty || 'regular');
  const [ms, setMs] = useState({ startNet: 500, maxNet: 260, ballSpeed: 1.0, weather: 'clear', music: 'arena' });
  const [result, setResult] = useState(null);
  const [nonce, setNonce] = useState(0);

  const togglePick = (team, setTeam, setEls, id) => {
    setTeam(t => t.includes(id) ? t.filter(x => x !== id) : (t.length >= 3 ? t : [...t, id]));
    setEls(e => ({ ...e, [id]: e[id] || equippedElements?.[id] || 'basic' }));
    sfx.characterSelect();
  };
  const ready = team1.length === 3 && team2.length === 3;

  const start = (t1Ready, t2Ready) => { if (!t1Ready || !t2Ready) return; sfx.click(); setNonce(n => n + 1); setResult(null); setPhase('game'); };

  const handleResult = (r) => {
    const full = {
      sport: 'banger', p1Won: r.p1Won, p1CharId: team1[0], p2CharId: team2[0], p2IsHuman: !p2IsCPU,
      stats: { elims: (r.elims ? r.elims[1] + r.elims[2] : 0), hits: r.hits || 0 }, tournamentWon: false,
    };
    onAward?.(full);
    setResult({ ...full, winner: r.winner, elims: r.elims });
    setPhase('summary');
  };

  if (phase === 'game') {
    return (
      <BangerGame
        key={`banger-${nonce}`}
        p1Chars={team1} p2Chars={team2} p2IsCPU={p2IsCPU} difficulty={difficulty}
        matchSettings={ms}
        onResult={handleResult} onQuit={() => setPhase('select')}
        p1Elements={team1.map(id => els1[id] || 'basic')} p2Elements={team2.map(id => els2[id] || 'basic')}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        settings={settings} sfxVolume={sfxVolume} musicVolume={musicVolume}
        customCharsData={customCharsData}
      />
    );
  }

  if (phase === 'summary' && result) {
    const winColor = result.p1Won ? TEAM_COLOR_P1 : TEAM_COLOR_P2;
    const winName = result.p1Won ? 'BLUE TEAM' : 'RED TEAM';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
        <div className="w-full max-w-md flex flex-col gap-4 p-6 bg-card border-2 border-accent rounded-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-heading text-accent tracking-wider"><GameIcon emoji="💥" size={14} /> BANGER</h2>
            <p className="text-[10px] font-heading text-muted-foreground tracking-widest mt-1">ELEMENT 6 ORIGINAL</p>
            <p className="text-2xl font-heading mt-3" style={{ color: winColor }}>{winName} WINS!</p>
            <p className="text-xs text-muted-foreground font-body mt-1">{result.elims ? `Eliminations — Blue ${result.elims[1]} · Red ${result.elims[2]}` : ''}</p>
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={() => { setNonce(n => n + 1); setResult(null); setPhase('game'); }} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading hover:opacity-80">REMATCH</button>
            <button onClick={onExit} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading hover:opacity-90">CONTINUE</button>
          </div>
        </div>
      </div>
    );
  }

  // Auto-fill team to 3 with randoms from unlocked pool
  const fillTeam = (main, exclude = []) => {
    const pool = ALL.filter(c => unlocked.has(c.id) && c.id !== main && !exclude.includes(c.id));
    const rest = [main];
    const used = new Set([main]);
    while (rest.length < 3 && pool.length > 0) {
      const avail = pool.filter(c => !used.has(c.id));
      if (avail.length === 0) break;
      const pick = avail[Math.floor(Math.random() * avail.length)];
      rest.push(pick.id); used.add(pick.id);
    }
    const els = {};
    rest.forEach(id => { els[id] = equippedElements?.[id] || 'basic'; });
    return { team: rest, els };
  };

  return (
    <UniversalCharacterSelect
      title="💥 BANGER — 3v3"
      modeLabel="ELEMENT 6 ORIGINAL"
      startLabel="▶ START MATCH"
      unlockedIds={unlockedIds || ['yellow']}
      favoriteId={favoriteId}
      customCharsData={customCharsData}
      equippedSkins={equippedSkins}
      equippedAccessories={equippedAccessories}
      charLevels={charLevels}
      equippedElements={equippedElements}
      onEquipElement={onEquipElement}
      playerCount={6}
      teamMode={true}
      charMastery={charMastery}
      defaultCPUDifficulty={difficulty}
      onStart={(c1, c2, p2cpu, diff, _p1el, _p2el, ...extraPicks) => {
        // Last item in extraPicks is the shikigamiOverride map — filter it out (only string IDs are characters)
        const charPicks = extraPicks.filter(p => typeof p === 'string');
        // Distribute picks to teams: P1,P3,P5 → Team 1; P2,P4,P6 → Team 2
        const t1 = [c1]; const t2 = [c2];
        for (let i = 0; i < charPicks.length; i++) {
          if (i % 2 === 0) t1.push(charPicks[i]); else t2.push(charPicks[i]);
        }
        setTeam1(t1); setTeam2(t2);
        const e1 = {}; const e2 = {};
        t1.forEach(id => { e1[id] = equippedElements?.[id] || 'basic'; });
        t2.forEach(id => { e2[id] = equippedElements?.[id] || 'basic'; });
        setEls1(e1); setEls2(e2);
        setP2IsCPU(p2cpu);
        if (diff) setDifficulty(diff);
        // Check readiness using local variables — state updates are async
        start(t1.length === 3, t2.length === 3);
      }}
      onBack={onExit}
      extraControls={
        <div className="flex gap-3 flex-wrap items-center justify-center bg-card/60 border border-border rounded-lg p-2 text-[10px]">
          <span className="font-heading text-accent">MATCH SETTINGS</span>
          <Setting label="WEATHER" options={WEATHERS} value={ms.weather} onChange={v => setMs(m => ({ ...m, weather: v }))} />
          <span className="text-muted-foreground">Teams auto-fill to 3 with random unlocked characters</span>
        </div>
      }
    />
  );
}

function Setting({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-heading text-muted-foreground">{label}</span>
      <div className="flex gap-1 flex-wrap justify-center">
        {options.map(o => (
          <button key={o.id} onClick={() => onChange(o.id)}
            className={`px-2 py-1 rounded text-[9px] font-heading ${value === o.id ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}