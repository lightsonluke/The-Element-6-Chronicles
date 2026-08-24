import React, { useState, useMemo } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { PLAYABLE } from './sports.js';
import PlatformFighter from './PlatformFighter.jsx';
import SoccerFighter from './SoccerFighter.jsx';
import VolleyballGame from './VolleyballGame.jsx';
import BaseballGame from './BaseballGame.jsx';
import DodgeballGame from './DodgeballGame.jsx';
import BangerGame from './BangerGame.jsx';
import { music } from './music.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];
const FIGHT_MAPS = ['splitcity', 'skyarena', 'lavarift', 'icepalace', 'cloudkingdom'];

const SPORT_COMPONENTS = {
  soccer: { Comp: SoccerFighter, label: 'SOCCER', emoji: '⚽', desc: 'First to 10 goals', color: 'bg-chart-3' },
  volleyball: { Comp: VolleyballGame, label: 'VOLLEYBALL', emoji: '🏐', desc: 'Bump set spike', color: 'bg-accent' },
  baseball: { Comp: BaseballGame, label: 'BASEBALL', emoji: '⚾', desc: '3 innings duel', color: 'bg-chart-3' },
  dodgeball: { Comp: DodgeballGame, label: 'DODGEBALL', emoji: '🎯', desc: 'Last one standing', color: 'bg-chart-5' },
  banger: { Comp: BangerGame, label: 'BANGER', emoji: '🏈', desc: 'Net-drop side-rolling', color: 'bg-primary' },
};

export default function ExperimentalMode({ onBack, unlockedIds, favoriteId, equippedAccessories, equippedSkins, settings, sfxVolume, musicVolume }) {
  const [type, setType] = useState(null); // null | 'fight' | 'soccer' | 'volleyball' | ...
  const [p1, setP1] = useState(() => (favoriteId && unlockedIds?.includes(favoriteId)) ? favoriteId : 'yellow');
  const [p2, setP2] = useState(() => {
    const pool = PLAYABLE.filter(c => c.id !== 'yellow' && c.id !== 'evil');
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : 'blue';
  });
  const [difficulty, setDifficulty] = useState('regular');
  const [mapId, setMapId] = useState('splitcity');
  const [p2IsCPU, setP2IsCPU] = useState(true);
  const [p1Jersey, setP1Jersey] = useState(true);
  const [p2Jersey, setP2Jersey] = useState(true);
  const [headSoccer, setHeadSoccer] = useState(false);
  const [penalties, setPenalties] = useState(true);

  const unlocked = useMemo(() => {
    const set = new Set(unlockedIds && unlockedIds.length ? unlockedIds : ['yellow']);
    return ALL.filter(c => set.has(c.id) || c.isGuardian);
  }, [unlockedIds]);

  const pickOpponent = () => {
    const pool = ALL.filter(c => c.id !== p1 && c.id !== 'evil');
    return pool[Math.floor(Math.random() * pool.length)].id;
  };

  const launch = (t) => {
    setType(t);
    music.stop();
  };

  const handleEnd = () => setType(null);
  const handleResult = () => setType(null);

  // ── Fight mode ──
  if (type === 'fight') {
    return (
      <PlatformFighter
        p1Char={p1} p2Char={pickOpponent()} p2IsCPU selectedMap={mapId}
        cpuDifficulty={difficulty} gameMode="regular"
        onEnd={handleEnd} musicVolume={musicVolume} sfxVolume={sfxVolume}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        settings={settings}
      />
    );
  }

  // ── Soccer mode (special props) ──
  if (type === 'soccer') {
    return (
      <SoccerFighter
        p1Char={p1} p2Char={p2} p2IsCPU={p2IsCPU} cpuDifficulty={difficulty}
        round={1} totalRounds={1} onEnd={handleResult}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        headSoccer={headSoccer} penaltiesEnabled={penalties} settings={settings}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        p1Jersey={p1Jersey} p2Jersey={p2Jersey}
      />
    );
  }

  // ── Other sport modes (shared props) ──
  if (type && SPORT_COMPONENTS[type] && type !== 'soccer') {
    const { Comp } = SPORT_COMPONENTS[type];
    return (
      <Comp
        key={`exp-${type}`}
        p1Chars={[p1]} p2Chars={[p2]} p2IsCPU={p2IsCPU} difficulty={difficulty}
        onResult={handleResult} onQuit={handleEnd}
        p1Jersey={p1Jersey} p2Jersey={p2Jersey}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        settings={settings}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🧪" size={14} /> EXPERIMENTAL</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <p className="text-xs text-muted-foreground font-body">
        A sandbox to quickly test features in any game mode against the CPU or a local player. No rewards are given here.
      </p>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading text-muted-foreground">YOUR CHARACTER</span>
          <select value={p1} onChange={e => setP1(e.target.value)} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-body text-sm">
            {unlocked.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-heading text-muted-foreground">P2 / OPPONENT</span>
            <select value={p2} onChange={e => setP2(e.target.value)} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-body text-sm">
              {PLAYABLE.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-heading text-muted-foreground">P2 MODE</span>
            <select value={p2IsCPU ? 'cpu' : 'human'} onChange={e => setP2IsCPU(e.target.value === 'cpu')} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-body text-sm">
              <option value="cpu">VS CPU</option>
              <option value="human">VS PLAYER</option>
            </select>
          </label>
        </div>
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-heading text-muted-foreground">CPU DIFFICULTY</span>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-body text-sm">
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-heading text-muted-foreground">FIGHT MAP</span>
            <select value={mapId} onChange={e => setMapId(e.target.value)} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-body text-sm">
              {FIGHT_MAPS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs font-body">
            <input type="checkbox" checked={p1Jersey} onChange={e => setP1Jersey(e.target.checked)} className="w-4 h-4 accent-primary" />
            P1 Jersey
          </label>
          <label className="flex items-center gap-2 text-xs font-body">
            <input type="checkbox" checked={p2Jersey} onChange={e => setP2Jersey(e.target.checked)} className="w-4 h-4 accent-primary" />
            P2 Jersey
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button onClick={() => launch('fight')} className="px-4 py-5 bg-primary text-primary-foreground rounded-xl font-heading text-sm hover:opacity-90 transition shadow-lg flex flex-col items-center gap-1">
          <span className="text-2xl"><GameIcon emoji="⚔️" size={14} /></span>
          TEST FIGHT
          <span className="text-[9px] font-body opacity-70">Platform fighter</span>
        </button>
        {Object.entries(SPORT_COMPONENTS).map(([id, cfg]) => (
          <button key={id} onClick={() => launch(id)} className="px-4 py-5 bg-accent text-accent-foreground rounded-xl font-heading text-sm hover:opacity-90 transition shadow-lg flex flex-col items-center gap-1">
            <span className="text-2xl">{cfg.emoji}</span>
            {cfg.label}
            <span className="text-[9px] font-body opacity-70">{cfg.desc}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
        <span className="text-[10px] font-heading text-muted-foreground">SOCCER OPTIONS</span>
        <label className="flex items-center gap-2 text-xs font-body">
          <input type="checkbox" checked={headSoccer} onChange={e => setHeadSoccer(e.target.checked)} />
          Head Soccer mode
        </label>
        <label className="flex items-center gap-2 text-xs font-body">
          <input type="checkbox" checked={penalties} onChange={e => setPenalties(e.target.checked)} />
          Penalties enabled (after extra time)
        </label>
      </div>
    </div>
  );
}