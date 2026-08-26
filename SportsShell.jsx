import React, { useState, useRef } from 'react';
import { getSport, calculateSportXP, PLAYABLE as BASE_PLAYABLE, TEAM_COLOR_P1, TEAM_COLOR_P2 } from './sports.js';
import { getCharNumber } from './characterNumber.js';
import { withCustomChars } from './characterNumber.js';
import BracketVisualization from './BracketVisualization.jsx';
import VolleyballMatchReview from './VolleyballMatchReview.jsx';
import BaseballMatchReview from './BaseballMatchReview.jsx';
import PrematchAnimation from './PrematchAnimation.jsx';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import GameIcon from "./GameIcon.jsx";

const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

// Tournament team color palette — 16 distinct colors. The player picks one
// at the start of a tournament and the other 15 opponents randomize from the rest.
const TEAM_PALETTE = [
  '#3577E8', '#E04646', '#FFD700', '#44AA44',
  '#AA66FF', '#FF8800', '#00CCDD', '#FF44AA',
  '#2266AA', '#77AA22', '#9933CC', '#DD6644',
  '#44AAAA', '#774422', '#AAAA22', '#336699',
];
const TEAM_COLOR_NAMES = {
  '#3577E8': 'Blue', '#E04646': 'Red', '#FFD700': 'Gold',
  '#44AA44': 'Green', '#AA66FF': 'Purple', '#FF8800': 'Orange',
  '#00CCDD': 'Cyan', '#FF44AA': 'Pink', '#2266AA': 'Navy',
  '#77AA22': 'Lime', '#9933CC': 'Violet', '#DD6644': 'Coral',
  '#44AAAA': 'Teal', '#774422': 'Brown', '#AAAA22': 'Olive',
  '#336699': 'Sky',
};
const teamColorName = (hex) => TEAM_COLOR_NAMES[hex] || 'Mixed';

// Shared meta-flow for all new sport modes (not soccer — that has its own).
// Manages: char select (with Random), per-position role assignment for team
// sports, quick/tournament modes, bracket, and result screen.
export default function SportsShell({ sport, unlockedIds, favoriteId, equippedAccessories = {}, equippedSkins = {}, settings = {}, charLevels = {}, equippedElements = {}, onEquipElement, sfxVolume = 70, musicVolume = 50, GameComponent, onAward, onEnd, onShop, onOnlinePlay, onExit, customCharsData = {}, customNumberMap = {}, charMastery = {} }) {
  const cfg = getSport(sport);
  const PLAYABLE = withCustomChars(BASE_PLAYABLE, customCharsData, customNumberMap);
  const randomCharId = (_unlockedIds, exclude = [], bot = false) => {
    // CPU opponents and CPU teammates are not player purchases. They may use
    // the complete roster, including a character locked for the local player.
    const pool = PLAYABLE.filter(c => (bot || (_unlockedIds || []).includes(c.id)) && !exclude.includes(c.id));
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : 'yellow';
  };
  const [vbMode, setVbMode] = useState('2v2'); // '2v2' or '1v1' (volleyball only)
  const teamSize = (sport === 'volleyball' && vbMode === '1v1') ? 1 : cfg.teamSize;
  const hasRoles = !!(cfg.roles && cfg.roles.length) && teamSize > 1;
  const unlocked = new Set(unlockedIds || ['yellow']);
  const firstId = (favoriteId && unlocked.has(favoriteId)) ? favoriteId : 'yellow';

  // Build an empty role-ordered lineup by drawing random chars (no repeats within team).
  const mkLineup = (excludeFirst = null) => {
    let exclude = excludeFirst ? [excludeFirst] : [];
    const line = [];
    for (let i = 0; i < teamSize; i++) {
      const id = randomCharId(unlockedIds, exclude, true);
      line.push(id); exclude = [...exclude, id];
    }
    return line;
  };

  // When vbMode changes, resize lineups
  const ensureLineupSize = (line, first) => {
    if (line.length === teamSize) return line;
    if (line.length > teamSize) return line.slice(0, teamSize);
    let ex = [first, ...line]; const out = [...line];
    while (out.length < teamSize) { const id = randomCharId(unlockedIds, ex, true); out.push(id); ex = [...ex, id]; }
    return out;
  };

  const [phase, setPhase] = useState('select');
  const [mode, setMode] = useState('quick');
  const [p1, setP1] = useState(firstId);
  const [p1Team, setP1Team] = useState(() => {
    if (!hasRoles) return Array.from({ length: teamSize }, () => firstId);
    // main char fills role[0]
    return mkLineup(firstId);
  });
  const [p2, setP2] = useState(() => randomCharId(unlockedIds, [p1], true));
  const [p2Team, setP2Team] = useState(() => mkLineup());
  const [p1Els, setP1Els] = useState(() => p1Team.map(id => equippedElements?.[id] || 'basic'));
  const [p2Els, setP2Els] = useState(() => p2Team.map(id => equippedElements?.[id] || 'basic'));
  const [p2IsCPU, setP2IsCPU] = useState(true);
  const [difficulty, setDifficulty] = useState(settings?.defaultCPUDifficulty || 'regular');
  const [p1Jersey, setP1Jersey] = useState(true);
  const [p2Jersey, setP2Jersey] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [tournamentTeamColors, setTournamentTeamColors] = useState(null);
  const [showTeamColorPicker, setShowTeamColorPicker] = useState(false);
  const [pickTeamColorIdx, setPickTeamColorIdx] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [bracket, setBracket] = useState(null);
  const [summary, setSummary] = useState(null);
  const paidRef = useRef(false);
  const bracketRef = useRef(null);
  bracketRef.current = bracket;

  // Keep team[0] in sync when the "main" char changes for solo sports;
  // For role sports, role[0] becomes p1 too (role 0 = lead role).
  const lineupFromMain = (first) => {
    if (!hasRoles) return Array.from({ length: teamSize }, () => first);
    const rest = [];
    let ex = [first];
    for (let i = 1; i < teamSize; i++) { const r = randomCharId(unlockedIds, ex, true); rest.push(r); ex = [...ex, r]; }
    return [first, ...rest];
  };

  const setMainP1 = (id) => {
    setP1(id);
    setP1Team(prev => hasRoles ? prev.map((v, i) => i === 0 ? id : v) : [id]);
    setP1Els(prev => { const n = [...prev]; n[0] = equippedElements?.[id] || 'basic'; return n; });
  };
  const setMainP2 = (id) => {
    setP2(id);
    setP2Team(prev => hasRoles ? prev.map((v, i) => i === 0 ? id : v) : [id]);
    setP2Els(prev => { const n = [...prev]; n[0] = equippedElements?.[id] || 'basic'; return n; });
  };
  const setElement = (side, idx, el) => {
    if (side === 1) setP1Els(prev => { const n = [...prev]; n[idx] = el; return n; });
    else setP2Els(prev => { const n = [...prev]; n[idx] = el; return n; });
  };

  const setSlot = (side, idx, id) => {
    if (side === 1) { setP1Team(prev => { const n = [...prev]; n[idx] = id; return n; }); setP1Els(prev => { const n = [...prev]; n[idx] = equippedElements?.[id] || 'basic'; return n; }); }
    else { setP2Team(prev => { const n = [...prev]; n[idx] = id; return n; }); setP2Els(prev => { const n = [...prev]; n[idx] = equippedElements?.[id] || 'basic'; return n; }); }
  };

  const handleStart = (m) => {
    setMode(m);
    if (m === 'tournament') {
      setShowTeamColorPicker(true); // pick team color before generating the bracket
    } else {
      setPhase('prematch');
    }
  };

  // Build the bracket after the player picks their team color. Each of the 16
  // slots (one per character) is assigned a team color — the player's pick first,
  // then 15 random colors from the remaining palette. Stored as {charId: color}.
  const startTournamentWith = (chosenColorIdx) => {
    const chosenColor = TEAM_PALETTE[chosenColorIdx];
    const otherColors = TEAM_PALETTE.filter((c, i) => i !== chosenColorIdx).sort(() => Math.random() - 0.5);
    const pool = PLAYABLE.filter(c => c.id !== p1);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 15);
    const slots = [p1, ...shuffled];
    const colorMap = {};
    colorMap[p1] = chosenColor;
    let ci = 0;
    for (const id of slots.slice(1)) {
      colorMap[id] = otherColors[ci % otherColors.length]; ci++;
    }
    setTournamentTeamColors(colorMap);
    setBracket({ slots, results: {}, currentRound: 0 });
    setShowTeamColorPicker(false);
    setPhase('bracket');
  };

  const teamColorForChar = (charId) => tournamentTeamColors?.[charId] || null;

  const resolveGame = (result) => {
    if (result.p1Won === null || result.p1Won === undefined) { setNonce(n => n + 1); return; }
    const full = {
      sport, p1Won: result.p1Won, p1CharId: p1, p2CharId: p2,
      p2IsHuman: !p2IsCPU && mode !== 'tournament', stats: result.stats || {}, tournamentWon: false,
      p1Stats: result.p1Stats, p2Stats: result.p2Stats,
      p1CharStats: result.p1CharStats, p2CharStats: result.p2CharStats,
    };
    if (mode === 'tournament') {
      const bk = bracketRef.current;
      if (!bk) { setPhase('select'); return; }
      if (!full.p1Won) { onAward?.(full); onEnd?.({ ...full, tournamentWon: false }); return; }
      onAward?.(full);
      const newResults = { ...bk.results }; const round = bk.currentRound;
      newResults[round] = { ...(newResults[round] || {}) }; newResults[round][0] = p1;
      const numMatches = Math.pow(2, 3 - round);
      for (let mr = 1; mr < numMatches; mr++) {
        let a, b;
        if (round === 0) { a = bk.slots[mr * 2]; b = bk.slots[mr * 2 + 1]; }
        else { a = newResults[round - 1][mr * 2]; b = newResults[round - 1][mr * 2 + 1]; }
        newResults[round][mr] = Math.random() < 0.5 ? a : b;
      }
      const nextRound = round + 1;
      const updated = { ...bk, results: newResults, currentRound: nextRound };
      bracketRef.current = updated; setBracket(updated);
      if (nextRound <= 3) {
        const nextOpp = newResults[nextRound - 1]?.[1];
        if (nextOpp) { setP2(nextOpp); setP2Team(lineupFromMain(nextOpp)); }
        setNonce(n => n + 1);
        setPhase('bracket');
      } else { onEnd?.({ ...full, tournamentWon: true, reward: 50 }); }
    } else {
      onAward?.(full);
      paidRef.current = true;
      setSummary({ ...full, p2CharName: PLAYABLE.find(c => c.id === p2)?.name || 'CPU' });
      setPhase('summary');
    }
  };

  const continueFromBracket = () => setPhase('prematch');
  const replayNonce = () => setNonce(n => n + 1);
  const allPicksOrdered = (first, rest) => [first, ...rest].slice(0, teamSize);

  if (phase === 'prematch') {
    const p1Line = allPicksOrdered(p1, p1Team.slice(1));
    const p2Line = allPicksOrdered(p2, p2Team.slice(1));
    const participants = [];
    p1Line.forEach(id => { const c = PLAYABLE.find(x => x.id === id); if (c) participants.push({ char: c, side: 1, teamColor: teamColorForChar(id) || TEAM_COLOR_P1 }); });
    p2Line.forEach(id => { const c = PLAYABLE.find(x => x.id === id); if (c) participants.push({ char: c, side: 2, teamColor: teamColorForChar(id) || TEAM_COLOR_P2 }); });
    const title = mode === 'tournament'
      ? (['ROUND OF 16', 'QUARTERFINAL', 'SEMIFINAL', 'FINAL'][bracketRef.current?.currentRound] || 'TOURNAMENT')
      : 'QUICK MATCH';
    return (
      <PrematchAnimation
        participants={participants}
        sport={sport}
        title={title}
        onDone={() => setPhase('game')}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
      />
    );
  }

  if (phase === 'game') {
    const opp = mode === 'tournament'
      ? (bracketRef.current.currentRound === 0 ? bracketRef.current.slots[1] : bracketRef.current.results[bracketRef.current.currentRound - 1]?.[1])
      : p2;
    const p2Main = PLAYABLE.find(c => c.id === opp) ? opp : p2;
    return (
      <GameComponent
        key={`sport-${sport}-${mode}-${nonce}`}
        p1Chars={allPicksOrdered(p1, p1Team.slice(1))}
        p2Chars={allPicksOrdered(p2Main, p2Team.slice(1))}
        p2IsCPU={mode === 'tournament' ? true : p2IsCPU}
        difficulty={mode === 'tournament' ? 'pro' : difficulty}
        onResult={resolveGame}
        onQuit={() => setPhase('select')}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
        settings={settings}
        p1Jersey={p1Jersey} p2Jersey={p2Jersey}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        p1Elements={p1Els} p2Elements={p2Els}
        p1TeamColor={tournamentTeamColors?.[p1] || TEAM_COLOR_P1}
        p2TeamColor={tournamentTeamColors?.[p2Main] || TEAM_COLOR_P2}
        customCharsData={customCharsData}
      />
    );
  }

  if (phase === 'summary' && summary) {
    const xp = calculateSportXP(sport, summary.stats, summary.p1Won);
    const p1CD = PLAYABLE.find(c => c.id === p1);
    const p2CD = PLAYABLE.find(c => c.id === p2);
    if (sport === 'volleyball') {
      return (
        <VolleyballMatchReview
          p1Name={p1CD?.name || 'P1'} p2Name={summary.p2CharName || p2CD?.name || 'P2'}
          p1Color={TEAM_COLOR_P1} p2Color={TEAM_COLOR_P2}
          p1Won={summary.p1Won}
          p1Stats={summary.p1Stats} p2Stats={summary.p2Stats}
          p1CharStats={summary.p1CharStats} p2CharStats={summary.p2CharStats}
          onRematch={() => { paidRef.current = false; setSummary(null); replayNonce(); setPhase('game'); }}
          onContinue={() => { setSummary(null); onEnd?.({ ...summary, tournamentWon: false }); }}
        />
      );
    }
    if (sport === 'baseball') {
      return (
        <BaseballMatchReview
          p1Name={p1CD?.name || 'P1'} p2Name={summary.p2CharName || p2CD?.name || 'P2'}
          p1Color={TEAM_COLOR_P1} p2Color={TEAM_COLOR_P2}
          p1Won={summary.p1Won}
          p1Stats={summary.p1Stats || {}} p2Stats={summary.p2Stats || {}}
          onRematch={() => { paidRef.current = false; setSummary(null); replayNonce(); setPhase('game'); }}
          onContinue={() => { setSummary(null); onEnd?.({ ...summary, tournamentWon: false }); }}
        />
      );
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
        <div className="w-full max-w-md flex flex-col gap-4 p-6">
          <div className="text-center">
            <h2 className="text-3xl font-heading text-accent tracking-wider">{cfg.name.toUpperCase()}</h2>
            <p className="text-2xl font-heading mt-2" style={{ color: summary.p1Won ? (p1CD?.color || '#FFD700') : (p2CD?.color || '#888') }}>
              {summary.p1Won ? `${p1CD?.name || 'P1'} WINS!` : `${summary.p2CharName} WINS!`}
            </p>
            <p className="text-sm text-muted-foreground font-body mt-1">+{xp} XP earned</p>
          </div>
          <div className="bg-card/80 border border-border rounded-xl p-4">
            <table className="w-full text-xs font-body">
              <tbody>
                {Object.entries(summary.stats || {}).map(([k, v]) => (
                  <tr key={k} className="border-b border-border/50">
                    <td className="py-1 text-muted-foreground capitalize">{k}</td>
                    <td className="py-1 text-right font-heading text-foreground">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={() => { paidRef.current = false; setSummary(null); replayNonce(); setPhase('game'); }} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading hover:opacity-80">REMATCH</button>
            <button onClick={() => { setSummary(null); onEnd?.({ ...summary, tournamentWon: false }); }} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading hover:opacity-90">CONTINUE</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'bracket' && bracket) {
    const roundNames = ['ROUND OF 16', 'QUARTERFINAL', 'SEMIFINAL', 'FINAL'];
    const roundName = roundNames[bracket.currentRound] || 'COMPLETE';
    const nextOpp = bracket.currentRound === 0 ? bracket.slots[1] : bracket.results[bracket.currentRound - 1]?.[1];
    const nextOppChar = PLAYABLE.find(c => c.id === nextOpp);
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
        <h2 className="text-2xl font-heading text-accent tracking-wider">{cfg.name.toUpperCase()} TOURNAMENT</h2>
        <p className="text-sm text-muted-foreground font-body">{roundName} — {bracket.currentRound > 0 ? `${bracket.currentRound} win${bracket.currentRound > 1 ? 's' : ''} so far` : 'Your first match!'}</p>
        <div className="w-full bg-card border border-border rounded-xl p-4">
          <BracketVisualization slots={bracket.slots} results={bracket.results} currentRound={bracket.currentRound} playerSlot={0}
            allChars={PLAYABLE.map(c => ({ id: c.id, name: c.name, color: c.color }))} />
        </div>
        <div className="flex items-center gap-2 bg-card border-2 border-accent rounded-lg px-4 py-2">
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tournamentTeamColors?.[nextOpp] || nextOppChar?.color }} />
          <span className="font-heading text-sm">{mode === 'tournament' ? `Team ${teamColorName(tournamentTeamColors?.[nextOpp] || TEAM_COLOR_P2)}` : (nextOppChar?.name || 'P2')}</span>
          {mode !== 'tournament' && <span className="text-xs text-muted-foreground">#{getCharNumber(nextOpp)}</span>}
        </div>
        <button onClick={continueFromBracket} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90 shadow-lg">CONTINUE TO MATCH <GameIcon emoji="→" size={14} /></button>
        <button onClick={() => { setBracket(null); setPhase('select'); }} className="px-4 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs">Quit Tournament</button>
      </div>
    );
  }

  // ── Select ──
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider">{cfg.emoji} {cfg.name.toUpperCase()}</h2>
        <div className="flex gap-2">
          {sport === 'soccer' && <button onClick={onShop} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm"><GameIcon emoji="🛒" size={14} /> SHOP</button>}
          <button onClick={() => onExit ? onExit() : onBack()} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> SPORTS</button>
        </div>
      </div>

      {/* Universal character select screen */}
      <UniversalCharacterSelect
        title={`${cfg.emoji} ${cfg.name.toUpperCase()} — SELECT FIGHTERS`}
        modeLabel={mode === 'tournament' ? 'TOURNAMENT' : 'QUICK MATCH'}
        startLabel="▶ START MATCH"
        unlockedIds={unlockedIds || ['yellow']}
        favoriteId={favoriteId}
        customCharsData={customCharsData}
        equippedSkins={equippedSkins}
        equippedAccessories={equippedAccessories}
        charLevels={charLevels}
        equippedElements={equippedElements}
        onEquipElement={onEquipElement}
        playerCount={teamSize * 2}
        teamMode={teamSize > 1}
        charMastery={charMastery}
        defaultCPUDifficulty={difficulty}
        onStart={(c1, c2, p2cpu, diff, _p1el, _p2el, ...extraPicks) => {
          setP2IsCPU(p2cpu); if (diff) setDifficulty(diff);
          if (hasRoles && extraPicks.length > 0) {
            // Distribute picks to teams: P1,P3,P5 → Team 1; P2,P4,P6 → Team 2
            const t1 = [c1]; const t2 = [c2];
            for (let i = 0; i < extraPicks.length; i++) {
              if (i % 2 === 0) t1.push(extraPicks[i]); else t2.push(extraPicks[i]);
            }
            setP1(c1); setP2(c2);
            setP1Team(t1.slice(0, teamSize));
            setP2Team(t2.slice(0, teamSize));
            setP1Els(t1.slice(0, teamSize).map(id => equippedElements?.[id] || 'basic'));
            setP2Els(t2.slice(0, teamSize).map(id => equippedElements?.[id] || 'basic'));
          } else {
            setMainP1(c1); setMainP2(c2);
          }
          handleStart(mode);
        }}
        onBack={() => onExit ? onExit() : onBack()}
        extraControls={
          <div className="flex gap-3 flex-wrap items-center justify-center bg-card/60 border border-border rounded-lg p-2 text-[10px]">
            {sport === 'volleyball' && (
              <div className="flex gap-1 items-center">
                <span className="text-muted-foreground">MODE:</span>
                <button onClick={() => { setVbMode('2v2'); const nt1 = ensureLineupSize(p1Team, p1); const nt2 = ensureLineupSize(p2Team, p2); setP1Team(nt1); setP2Team(nt2); setP1Els(nt1.map(id => equippedElements?.[id] || 'basic')); setP2Els(nt2.map(id => equippedElements?.[id] || 'basic')); }}
                  className={`px-2 py-0.5 rounded font-heading ${vbMode === '2v2' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>2v2</button>
                <button onClick={() => { setVbMode('1v1'); setP1Team([p1]); setP2Team([p2]); setP1Els([equippedElements?.[p1] || 'basic']); setP2Els([equippedElements?.[p2] || 'basic']); }}
                  className={`px-2 py-0.5 rounded font-heading ${vbMode === '1v1' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>1v1</button>
              </div>
            )}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={p1Jersey} onChange={e => setP1Jersey(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
              <span className="text-muted-foreground">P1 Jersey</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={p2Jersey} onChange={e => setP2Jersey(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
              <span className="text-muted-foreground">P2 Jersey</span>
            </label>
            <button onClick={() => setShowRules(true)} className="px-2 py-0.5 bg-primary text-primary-foreground rounded font-heading"><GameIcon emoji="📜" size={14} /> RULES</button>
            <button onClick={() => handleStart('tournament')} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded font-heading border border-accent"><GameIcon emoji="🏆" size={14} /> TOURNAMENT</button>
            {onOnlinePlay && <button onClick={onOnlinePlay} className="px-2 py-0.5 bg-accent/80 text-accent-foreground rounded font-heading"><GameIcon emoji="🌐" size={14} /> ONLINE</button>}
          </div>
        }
      />

      {mode === 'tournament' && <p className="text-xs text-muted-foreground font-body text-center">16-player single-elimination bracket — win 4 rounds for the trophy!</p>}

      {showTeamColorPicker && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-card border-2 border-accent rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-heading text-lg text-accent text-center mb-2 tracking-wider">PICK YOUR TEAM COLOR</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">Your tournament team wears this color. Opponents get random colors from the rest.</p>
            <div className="grid grid-cols-4 gap-2 mb-4 justify-items-center">
              {TEAM_PALETTE.map((c, i) => (
                <button key={c} onClick={() => setPickTeamColorIdx(i)}
                  className={`w-16 h-16 rounded-lg transition ${pickTeamColorIdx === i ? 'ring-4 ring-accent scale-105' : 'border-2 border-border hover:border-accent/70'}`}
                  style={{ backgroundColor: c }}>
                  <span className="block text-[9px] font-heading text-white/95 mt-1 drop-shadow-md">{teamColorName(c)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowTeamColorPicker(false); setPhase('select'); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm flex-1 hover:opacity-80">CANCEL</button>
              <button onClick={() => startTournamentWith(pickTeamColorIdx)} className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm flex-1 hover:opacity-90">START TOURNAMENT <GameIcon emoji="→" size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-lg text-accent tracking-wider">{cfg.name.toUpperCase()} RULES</h3>
              <button onClick={() => setShowRules(false)} className="text-muted-foreground hover:text-foreground text-xl"><GameIcon emoji="✕" size={14} /></button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground font-body">
              {RULES[sport]?.map((r, i) => <p key={i}>• {r}</p>)}
            </div>
            <button onClick={() => setShowRules(false)} className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm">GOT IT</button>
          </div>
        </div>
      )}
    </div>
  );

  function onBack() { setPhase('select'); setBracket(null); }
}

const RULES = {
  volleyball: [
    '2v2: pick 2 characters per side. 1v1: one character each.',
    'Bump (",") = ball arcs UP and OVER the net — works on ground or in air.',
    'Set/Spike (".") = SET on the ground (ball pops high), SPIKE in the air (powerful downward hit).',
    'Switch ("/" = Super Move button) = swap to your other character (2v2 only). Works even during your team\'s serve — switch away and your bot teammate serves for you!',
    'Serve: press , to TOSS the ball up, then press , again to SERVE it over. Server is frozen until toss.',
    'Dive: press L (P1) or F (P2) + a direction to dive and dig the ball — 10s cooldown (bar above your nametag). Bots also dive for far balls!',
    'You can\'t block a spike with another spike — bump or set instead.',
    'Only the server may touch the ball before it crosses the net — teammate touching = foul.',
    'Your inactive teammate is an AI that receives, sets, bumps, dives, and spikes for you — and keeps spacing to cover the court.',
    'The CPU team plays real volleyball: receives serves, bumps, sets near the net, steps aside, and their teammate spikes.',
    'First side to 11 wins (win by 2). XP for spikes, digs, and aces.',
  ],
  soccer: [
    'Signatures hit the ball. Powers launch it 5× toward the goal. Supers/heavies disabled.',
    'First to 10 goals wins. Goals are behind the wall — shoot through the gap.',
    'Own goals bounce off your net. Ties → extra time → sudden death.',
    'Win the 4-round tournament for 50 tokens.',
  ],
  baseball: [
    'Each team has 3 characters: Pitcher, Infield, Outfield — pick roles and elements for each.',
    'P2 bats first. P1 pitches: press , to throw (hold arrows to curve/speed up/slow down the pitch).',
    'Batting: press , (or X for P2) to swing when the ball enters the strike zone. Better timing = farther hit.',
    'After a hit, the game switches to birds-eye view. Batter spams , to run forward, . to run back.',
    'Fielding: arrows move the controlled fielder. / (supermove) switches control to the "next" fielder. . (power) cycles the next indicator. , (sig) throws the ball to the "next" fielder.',
    'Get the ball to a base before the runner = force out. Touch a runner with the ball = tag out.',
    '3 outs = sides switch. 3 innings. Power = throw strength, Utility = batting power, Speed = running speed.',
    'Win the tournament for 50 tokens!',
  ],
  tennis: [
    '1v1 singles. Move with arrows/WASD, jump to reach high balls.',
    'SIG (,) = groundstroke hit. POWER (.) = lob. SUPER (/) = overhead smash (in the air).',
    'Serve: press , to toss, then , again to serve.',
    'First to 4 points wins the game. Ball must land in the opponent\'s court.',
    'Speed = movement. Power = shot strength. Control = accuracy.',
  ],
  track: [
    '4 events: 100m Sprint, 110m Hurdles, Long Jump, and 400m.',
    '100m: Mash , or SPACE to sprint. Speed stat = higher max velocity.',
    'Hurdles: Mash to run, press W/↑ to jump over hurdles. Hitting a hurdle slows you down!',
    'Long Jump: Sprint to the takeoff board, then jump at the right moment for max distance.',
    '400m: Pace yourself — stamina drains as you sprint. Tap too fast and you fade!',
    'Points per event: 1st = 3 pts, 2nd = 1 pt. Most points after 4 events wins.',
    'P1 mashes ,/SPACE · P2 mashes V/B (or CPU auto). Jump with W/↑ (P1) or S/↓ (P2).',
  ],
  basketball: [
    '1v1 on the hardwood. P1 attacks the RIGHT hoop, P2 attacks the LEFT hoop.',
    'Move with arrows/WASD. SIG (,) = shoot or steal. POWER (.) = pass. SUPER (/) = dunk (near rim + full meter).',
    'Dribble to move with the ball. Shoot with arc — closer = better chance.',
    'Super meter charges over time. At full meter + near your rim = slam dunk (automatic points).',
    'Defense: get close and press , to steal. Steals have a cooldown.',
    'First to 21 points wins. 3-point line gives extra points.',
  ],
};
