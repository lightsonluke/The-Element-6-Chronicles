import React, { useState, useEffect } from 'react';
import { ALL_CHARS } from './allCharacters.js';
import { drawStickman, STAGE_MAPS } from './renderer.js';
import PlatformFighter from './PlatformFighter.jsx';
import BracketVisualization from './BracketVisualization.jsx';
import { music } from './music.js';
import GameIcon from "./GameIcon.jsx";

const ALL = ALL_CHARS;
const MAP_IDS = STAGE_MAPS.map(m => m.id);

function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function randomMap() { return MAP_IDS[Math.floor(Math.random() * MAP_IDS.length)]; }
const tournamentRoundName = (round, size) => {
  const playersInRound = Math.max(2, size / (2 ** round));
  if (playersInRound === 2) return 'GRAND FINAL';
  if (playersInRound === 4) return 'SEMIFINAL';
  if (playersInRound === 8) return 'QUARTERFINAL';
  return `ROUND OF ${playersInRound}`;
};

const TEAM_FORMATS = [
  { id: 'pp_cc', label: 'P+P vs C+C', desc: 'Two players vs two CPUs' },
  { id: 'pc_pc', label: 'P+C vs P+C', desc: 'Player+CPU vs Player+CPU' },
  { id: 'pc_cc', label: 'P+C vs C+C', desc: 'Player+CPU vs two CPUs' },
];

const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

export default function TournamentMode({ unlockedIds, favoriteId, onUnlock, onAwardCoins, onChampion, onBack, equippedAccessories = {}, equippedSkins = {}, onAwardXP }) {
  const [slots, setSlots] = useState(null);
  const [playerChar, setPlayerChar] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState({});
  const [phase, setPhase] = useState('pick');
  const [opponent, setOpponent] = useState(null);
  const [roundMap, setRoundMap] = useState('splitcity');
  const [log, setLog] = useState([]);
  const [cpuDifficulty, setCpuDifficulty] = useState('pro');
  const [bracketSize, setBracketSize] = useState(16);
  const [stockCount, setStockCount] = useState(3);
  const [matchTime, setMatchTime] = useState(240);
  const [localPlayerCount, setLocalPlayerCount] = useState(1);
  const [secondPlayerChar, setSecondPlayerChar] = useState(null);
  const [secondPlayerController, setSecondPlayerController] = useState(false);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  const newTournament = (nextSize = bracketSize) => {
    const size = [8, 16, 32].includes(Number(nextSize)) ? Number(nextSize) : 16;
    const pool = shuffle(ALL.filter(c => c.id !== 'evil'));
    let newSlots = pool.slice(0, size).map(c => c.id);
    // Ensure favorite is in the pool if unlocked
    if (favoriteId && unlockedIds.includes(favoriteId) && !newSlots.includes(favoriteId)) {
      newSlots[0] = favoriteId;
    }
    setSlots(newSlots);
    setBracketSize(size);
    setCurrentRound(0);
    setResults({});
    setLog([]);
    // Always go to pick screen so the player chooses their fighter
    setPlayerChar(null);
    setSecondPlayerChar(null);
    setPhase('pick');
  };

  useEffect(() => { newTournament(); }, []);

  const nameOf = id => ALL.find(c => c.id === id)?.name || '?';

  const handlePickChar = (charId) => {
    const newSlots = [...slots];
    const idx = newSlots.indexOf(charId);
    if (idx > 0) { [newSlots[0], newSlots[idx]] = [newSlots[idx], newSlots[0]]; }
    setSlots(newSlots);
    setPlayerChar(charId);
    setSecondPlayerChar(null);
    setPhase(localPlayerCount === 2 ? 'pick-second' : 'pre-fight');
  };

  const handlePickSecondChar = (charId) => {
    if (!charId || charId === playerChar || !unlockedIds.includes(charId)) return;
    const nextSlots = [...slots];
    const idx = nextSlots.indexOf(charId);
    if (idx > 1) [nextSlots[1], nextSlots[idx]] = [nextSlots[idx], nextSlots[1]];
    else if (idx < 0) nextSlots[1] = charId;
    setSlots(nextSlots);
    setSecondPlayerChar(charId);
    setPhase('pre-fight');
  };

  const getOpponent = () => {
    if (!slots) return null;
    if (currentRound === 0) return slots[1];
    return results[currentRound - 1]?.[1];
  };

  const beginRound = () => {
    const opp = getOpponent();
    if (!opp) return;
    setOpponent(opp);
    setRoundMap(randomMap());
    setPhase('fighting');
  };

  const simulateOtherMatches = (round, winnerChar = playerChar) => {
    const numMatches = Math.pow(2, Math.log2(bracketSize) - round - 1);
    const newResults = { ...results };
    newResults[round] = { ...(newResults[round] || {}) };
    newResults[round][0] = winnerChar;

    for (let m = 1; m < numMatches; m++) {
      if (newResults[round][m]) continue;
      let p1, p2;
      if (round === 0) { p1 = slots[m * 2]; p2 = slots[m * 2 + 1]; }
      else { p1 = newResults[round - 1]?.[m * 2]; p2 = newResults[round - 1]?.[m * 2 + 1]; }
      if (p1 && p2) { newResults[round][m] = Math.random() < 0.5 ? p1 : p2; }
    }
    setResults(newResults);
  };

  const handleEnd = (result) => {
    const winnerChar = result?.p1Won === true
      ? playerChar
      : result?.p1Won === false && currentRound === 0 && localPlayerCount === 2
        ? opponent
        : null;
    const won = Boolean(winnerChar);
    if (won) {
      setPlayerChar(winnerChar);
      simulateOtherMatches(currentRound, winnerChar);
      setLog(l => [...l, `${tournamentRoundName(currentRound, bracketSize)}: You defeated ${nameOf(opponent)}!`]);
      onAwardCoins?.(15);
      onAwardXP?.(winnerChar, 10 + currentRound * 5);
      if (currentRound >= Math.log2(bracketSize) - 1) {
        setPhase('champion');
        onChampion?.();
        const locked = ALL.filter(c => !unlockedIds.includes(c.id));
        if (locked.length) {
          const u = locked[Math.floor(Math.random() * locked.length)];
          onUnlock(u.id);
          setLog(l => [...l, ` CHAMPION! You unlocked ${nameOf(u.id)}!`]);
        } else { setLog(l => [...l, ' CHAMPION! All characters already unlocked!']); }
        onAwardCoins?.(50);
        onAwardXP?.(winnerChar, 50);
      } else { setPhase('post-fight'); }
    } else {
      setLog(l => [...l, `Eliminated by ${nameOf(opponent)}. You must restart the tournament!`]);
      setPhase('eliminated');
    }
  };

  const advanceRound = () => {
    setCurrentRound(r => r + 1);
    setPhase('pre-fight');
  };

  // ── Fighting phase ──
  if (phase === 'fighting' && slots) {
    return (
      <PlatformFighter
        p1Char={playerChar} p2Char={opponent} p2IsCPU={!(currentRound === 0 && localPlayerCount === 2)}
        gameMode="regular" selectedMap={roundMap} cpuDifficulty={cpuDifficulty}
        stockCount={stockCount} matchTime={matchTime}
        localP2Controller={secondPlayerController}
        onEnd={handleEnd}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
      />
    );
  }

  if (phase === 'pick-second' && slots) {
    return (
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">PLAYER 2 · CHOOSE FIGHTER</h2>
          <button onClick={() => { setLocalPlayerCount(1); setPhase('pre-fight'); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm">BACK</button>
        </div>
        <p className="text-sm text-muted-foreground">Player 2 joins the same bracket and can use the WASD keyboard layout or a second connected controller.</p>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <label className="font-heading text-xs text-muted-foreground" htmlFor="tournament-p2-control">PLAYER 2 INPUT</label>
          <select id="tournament-p2-control" value={secondPlayerController ? 'controller' : 'keyboard'} onChange={e => setSecondPlayerController(e.target.value === 'controller')} className="min-h-10 rounded-lg bg-secondary px-3 text-foreground">
            <option value="keyboard">Keyboard · WASD</option>
            <option value="controller">Second connected controller</option>
          </select>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 rounded-xl border border-border bg-card p-4">
          {ALL.filter(c => unlockedIds.includes(c.id) && c.id !== playerChar).map(c => <button key={c.id} onClick={() => handlePickSecondChar(c.id)} className="rounded-xl border border-border bg-secondary/40 p-3 hover:border-accent"><span className="mx-auto block h-8 w-8 rounded-full" style={{ backgroundColor: c.color }} /><span className="mt-2 block truncate text-xs font-heading">{c.name}</span></button>)}
        </div>
      </div>
    );
  }

  // ── Pick phase ──
  if (phase === 'pick' && slots) {
    return (
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">TOURNAMENT MODE</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon icon="info" size={14} /> BACK</button>
        </div>

        <div className="bg-card border-2 border-accent rounded-xl p-6 text-center">
          <h3 className="font-heading text-lg text-accent mb-2">CHOOSE YOUR FIGHTER</h3>
          <p className="text-xs text-muted-foreground font-body mb-4"><GameIcon icon="lock" size={14} /> This is locked for the entire tournament — choose wisely!</p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs font-heading text-muted-foreground">CPU Difficulty:</span>
            <select value={cpuDifficulty} onChange={e => setCpuDifficulty(e.target.value)}
              className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-heading">
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex justify-center gap-2 mb-4">
            <button onClick={() => {
              const unlocked = ALL.filter(c => unlockedIds.includes(c.id));
              if (unlocked.length > 0) handlePickChar(unlocked[Math.floor(Math.random() * unlocked.length)].id);
            }} className="px-4 py-1.5 bg-primary/40 text-primary-foreground rounded font-heading text-xs hover:opacity-80">RANDOM</button>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-left text-xs font-heading text-muted-foreground">LOCAL PLAYERS
                  <select value={localPlayerCount} onChange={e => { setLocalPlayerCount(Number(e.target.value)); setSecondPlayerChar(null); }} className="min-h-10 rounded-lg bg-secondary px-3 text-foreground">
                    {[1, 2].map(n => <option key={n} value={n}>{n} local player{n === 1 ? '' : 's'}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-left text-xs font-heading text-muted-foreground">TOURNAMENT SIZE
                  <select value={bracketSize} onChange={e => newTournament(Number(e.target.value))} className="min-h-10 rounded-lg bg-secondary px-3 text-foreground">
                    {[8, 16, 32].map(n => <option key={n} value={n}>{n} entrants</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-left text-xs font-heading text-muted-foreground">STOCKS PER FIGHT
                  <select value={stockCount} onChange={e => setStockCount(Number(e.target.value))} className="min-h-10 rounded-lg bg-secondary px-3 text-foreground">
                    {[1, 2, 3, 4, 5, 7, 9].map(n => <option key={n} value={n}>{n} stocks</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-left text-xs font-heading text-muted-foreground">MATCH TIMER
                  <select value={matchTime} onChange={e => setMatchTime(Number(e.target.value))} className="min-h-10 rounded-lg bg-secondary px-3 text-foreground">
                    {[[60, '1 minute'], [120, '2 minutes'], [180, '3 minutes'], [240, '4 minutes'], [300, '5 minutes'], [480, '8 minutes'], [600, '10 minutes'], [0, 'Unlimited']].map(([n, label]) => <option key={n} value={n}>{label}</option>)}
                  </select>
                </label>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{bracketSize} entrants · {Math.log2(bracketSize)} rounds · {localPlayerCount} local player{localPlayerCount === 1 ? '' : 's'}, remaining slots filled by CPU opponents</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4 max-w-2xl mx-auto">
            {slots.map((id, i) => {
              const c = ALL.find(x => x.id === id);
              const locked = !unlockedIds.includes(id);
              return (
                <button key={i} onClick={() => !locked && handlePickChar(id)}
                  disabled={locked}
                  className={`flex flex-col items-center p-2 rounded border-2 transition ${locked ? 'border-border/30 opacity-30 cursor-not-allowed' : 'border-border hover:border-accent hover:scale-105'}`}>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: locked ? '#333' : c?.color, boxShadow: locked ? 'none' : `0 0 8px ${c?.color}55` }} />
                  <span className="text-[8px] font-heading text-foreground mt-1 leading-tight">{locked ? <GameIcon icon="lock" size={14} /> : c?.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Pre-fight phase ──
  if (phase === 'pre-fight' && slots) {
    return (
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">TOURNAMENT MODE</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon icon="info" size={14} /> BACK</button>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-heading text-accent mb-3">TOURNAMENT BRACKET — {tournamentRoundName(currentRound, bracketSize)}</p>
          <BracketVisualization
            slots={slots}
            results={results}
            currentRound={currentRound}
            playerSlot={0}
            allChars={ALL}
          />
        </div>

        <div className="bg-card border-2 border-accent rounded-xl p-4 text-center">
          <p className="font-heading text-sm text-primary mb-2">{tournamentRoundName(currentRound, bracketSize)}</p>
          {currentRound === 0 && localPlayerCount === 2 && secondPlayerChar && <p className="mb-3 text-xs text-muted-foreground">Two local entrants: {nameOf(playerChar)} and {nameOf(secondPlayerChar)} · Player 2 uses {secondPlayerController ? 'Controller 2' : 'WASD'}.</p>}
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: ALL.find(c => c.id === playerChar)?.color }} />
              <span className="text-xs font-heading mt-1">{nameOf(playerChar)}</span>
            </div>
            <span className="text-2xl font-heading text-destructive">VS</span>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: ALL.find(c => c.id === getOpponent())?.color }} />
              <span className="text-xs font-heading mt-1">{nameOf(getOpponent())}</span>
            </div>
          </div>
          <button onClick={beginRound}
            className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90 shadow-lg">
            FIGHT! ({tournamentRoundName(currentRound, bracketSize)})
          </button>
        </div>

        {log.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-3 max-h-32 overflow-y-auto">
            {log.map((l, i) => <p key={i} className="text-xs text-muted-foreground font-body">{l}</p>)}
          </div>
        )}
      </div>
    );
  }

  // ── Post-fight phase ──
  if (phase === 'post-fight' && slots) {
    return (
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">TOURNAMENT MODE</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon icon="info" size={14} /> BACK</button>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-heading text-accent mb-3">TOURNAMENT BRACKET — ROUND {currentRound + 1} RESULTS</p>
          <BracketVisualization
            slots={slots}
            results={results}
            currentRound={currentRound}
            playerSlot={0}
            allChars={ALL}
          />
        </div>

        <div className="bg-card border-2 border-green-600 rounded-xl p-6 text-center">
          <p className="text-xl font-heading text-green-500 mb-2"><GameIcon icon="check" size={14} /> {tournamentRoundName(currentRound, bracketSize)} WON!</p>
          <p className="text-sm text-muted-foreground font-body mb-4">You defeated {nameOf(opponent)}!</p>
          <button onClick={advanceRound} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-80">
            CONTINUE TO {currentRound < Math.log2(bracketSize) - 1 ? tournamentRoundName(currentRound + 1, bracketSize) : 'FINAL'}
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 max-h-32 overflow-y-auto">
          {log.map((l, i) => <p key={i} className="text-xs text-muted-foreground font-body">{l}</p>)}
        </div>
      </div>
    );
  }

  // ── Champion phase ──
  if (phase === 'champion') {
    return (
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">TOURNAMENT MODE</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon icon="info" size={14} /> BACK</button>
        </div>
        <div className="bg-card border-2 border-accent rounded-xl p-8 text-center">
          <p className="text-4xl font-heading text-accent mb-4"><GameIcon icon="trophy" size={14} /> CHAMPION! <GameIcon icon="trophy" size={14} /></p>
          <div className="text-left max-h-40 overflow-y-auto mb-4">
            {log.map((l, i) => <p key={i} className="text-xs text-muted-foreground font-body">{l}</p>)}
          </div>
          <button onClick={newTournament} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-heading hover:opacity-80">NEW TOURNAMENT</button>
        </div>
      </div>
    );
  }

  // ── Eliminated phase ──
  if (phase === 'eliminated') {
    return (
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">TOURNAMENT MODE</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon icon="info" size={14} /> BACK</button>
        </div>
        <div className="bg-card border-2 border-destructive rounded-xl p-8 text-center">
          <p className="text-3xl font-heading text-destructive mb-4">ELIMINATED!</p>
          <p className="text-sm text-muted-foreground font-body mb-4">You were defeated. You must restart the entire tournament.</p>
          <div className="text-left max-h-32 overflow-y-auto mb-4">
            {log.map((l, i) => <p key={i} className="text-xs text-muted-foreground font-body">{l}</p>)}
          </div>
          <button onClick={newTournament} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-heading hover:opacity-80">RESTART TOURNAMENT</button>
        </div>
      </div>
    );
  }

  return null;
}
