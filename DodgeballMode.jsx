import React, { useState } from 'react';
import { PLAYABLE, TEAM_COLOR_P1, TEAM_COLOR_P2 } from './sports.js';
import { withCustomChars } from './characterNumber.js';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import DodgeballGame from './DodgeballGame.jsx';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// Match customization: Score Limit, CPU Difficulty, Ball Speed, Super Cooldown, Weather, Music.
const SCORE_LIMITS = [5, 7, 10, 15];
const BALL_SPEEDS = [{ id: 0.85, label: 'Slow' }, { id: 1.0, label: 'Normal' }, { id: 1.2, label: 'Fast' }];
const SUPER_CDS = [{ id: 45, label: '45s' }, { id: 60, label: '60s' }, { id: 75, label: '75s' }];
const WEATHERS = [
  { id: 'clear', label: '☀️ Clear' }, { id: 'rain', label: '🌧️ Rain' }, { id: 'snow', label: '❄️ Snow' },
  { id: 'wind', label: '💨 Wind' }, { id: 'fog', label: '🌫️ Fog' },
];
const MUSIC = [{ id: 'arena', label: '🏟️ Arena' }, { id: 'chill', label: '🎵 Chill' }, { id: 'epic', label: '🔥 Epic' }];
const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

export default function DodgeballMode({
  onExit, onAward, unlockedIds, favoriteId, equippedAccessories = {}, equippedSkins = {}, settings = {},
  charLevels = {}, equippedElements = {}, onEquipElement, sfxVolume = 50, musicVolume = 50,
  customCharsData = {}, customNumberMap = {}, charMastery = {},
}) {
  const ALL = withCustomChars(PLAYABLE, customCharsData, customNumberMap);
  const unlocked = new Set(unlockedIds || ['yellow']);
  const first = (favoriteId && unlocked.has(favoriteId)) ? favoriteId : 'yellow';
  const [phase, setPhase] = useState('select');
  const [p1, setP1] = useState(first);
  const [p2, setP2] = useState(() => ALL.find(c => unlocked.has(c.id) && c.id !== first)?.id || 'yellow');
  const [p1IsCPU, setP1IsCPU] = useState(false);
  const [p2IsCPU, setP2IsCPU] = useState(true);
  const [p1El, setP1El] = useState(equippedElements?.[first] || 'basic');
  const [p2El, setP2El] = useState(equippedElements?.[p2] || 'basic');
  const [difficulty, setDifficulty] = useState(settings?.defaultCPUDifficulty || 'regular');
  const [ms, setMs] = useState({ scoreLimit: 10, ballSpeed: 1.0, superCooldown: 60, weather: 'clear', music: 'arena' });
  const [result, setResult] = useState(null);
  const [nonce, setNonce] = useState(0);

  const charOf = (id) => ALL.find(c => c.id === id);
  const setSide = (side, id) => {
    if (side === 1) { setP1(id); setP1El(equippedElements?.[id] || 'basic'); }
    else { setP2(id); setP2El(equippedElements?.[id] || 'basic'); }
  };

  const start = () => { sfx.click(); setNonce(n => n + 1); setResult(null); setPhase('game'); };

  const handleResult = (r) => {
    const full = {
      sport: 'dodgeball', p1Won: r.p1Won, p1CharId: p1, p2CharId: p2,
      p2IsHuman: !p2IsCPU, stats: r.stats, p1Stats: r.p1Stats, p2Stats: r.p2Stats,
    };
    if (!(p1IsCPU && p2IsCPU)) onAward?.(full); // CPU vs CPU = testing, no rewards
    setResult(full);
    setPhase('summary');
  };

  if (phase === 'game') {
    return (
      <DodgeballGame
        key={`db-${nonce}`}
        p1Chars={[p1]} p2Chars={[p2]} p1IsCPU={p1IsCPU} p2IsCPU={p2IsCPU} difficulty={difficulty}
        onResult={handleResult} onQuit={() => setPhase('select')}
        p1Elements={[p1El]} p2Elements={[p2El]}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        settings={settings} matchSettings={ms}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        customCharsData={customCharsData}
      />
    );
  }

  if (phase === 'summary' && result) {
    const p1C = charOf(p1), p2C = charOf(p2);
    const winnerName = result.p1Won ? p1C?.name : p2C?.name;
    const winnerColor = result.p1Won ? p1C?.color : p2C?.color;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
        <div className="w-full max-w-md flex flex-col gap-4 p-6 bg-card border-2 border-accent rounded-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-heading text-accent tracking-wider">DODGEBALL</h2>
            <p className="text-2xl font-heading mt-2" style={{ color: winnerColor }}>{winnerName} WINS!</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ c: p1C, st: result.p1Stats, col: TEAM_COLOR_P1, lbl: result.p1Won ? 'WINNER' : '' },
              { c: p2C, st: result.p2Stats, col: TEAM_COLOR_P2, lbl: !result.p1Won ? 'WINNER' : '' }].map((row, i) => (
              <div key={i} className="bg-muted/40 rounded-lg p-3 border" style={{ borderColor: row.col + '66' }}>
                <p className="font-heading text-sm" style={{ color: row.col }}>{row.c?.name}</p>
                {row.lbl && <span className="text-[9px] text-accent font-heading"><GameIcon emoji="🏆" size={14} /> {row.lbl}</span>}
                <table className="w-full text-[10px] font-body mt-1">
                  <tbody>
                    <tr><td className="text-muted-foreground">Throws</td><td className="text-right font-heading">{row.st?.throws || 0}</td></tr>
                    <tr><td className="text-muted-foreground">Hits</td><td className="text-right font-heading">{row.st?.hits || 0}</td></tr>
                    <tr><td className="text-muted-foreground">Supers</td><td className="text-right font-heading">{row.st?.superThrows || 0}</td></tr>
                    <tr><td className="text-muted-foreground">Dodges</td><td className="text-right font-heading">{row.st?.dodges || 0}</td></tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={() => { setResult(null); setNonce(n => n + 1); setPhase('game'); }} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading hover:opacity-80">REMATCH</button>
            <button onClick={onExit} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading hover:opacity-90">CONTINUE</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Select / settings ──
  return (
    <UniversalCharacterSelect
      title="🟡 DODGEBALL"
      startLabel={p1IsCPU && p2IsCPU ? '▶ CPU vs CPU (TEST)' : '▶ START MATCH'}
      unlockedIds={unlockedIds || ['yellow']}
      favoriteId={favoriteId}
      customCharsData={customCharsData}
      equippedSkins={equippedSkins}
      equippedAccessories={equippedAccessories}
      charLevels={charLevels}
      equippedElements={equippedElements}
      onEquipElement={onEquipElement}
      playerCount={2}
      charMastery={charMastery}
      defaultCPUDifficulty={difficulty}
      onStart={(c1, c2, p2cpu, diff) => {
        setSide(1, c1); setSide(2, c2); setP2IsCPU(p2cpu);
        if (diff) setDifficulty(diff);
        start();
      }}
      onBack={onExit}
      extraControls={
        <div className="flex gap-3 flex-wrap items-center justify-center bg-card/60 border border-border rounded-lg p-2 text-[10px]">
          <span className="font-heading text-accent">MATCH SETTINGS</span>
          <Setting label="WEATHER" options={WEATHERS} value={ms.weather} onChange={(v) => setMs(m => ({ ...m, weather: v }))} />
          <div className="text-[9px] text-muted-foreground text-center">
            Power<GameIcon emoji="→" size={14} />throw · Speed<GameIcon emoji="→" size={14} />move · Utility<GameIcon emoji="→" size={14} />jump · Control<GameIcon emoji="→" size={14} />super CD · Defense<GameIcon emoji="→" size={14} />stun
          </div>
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