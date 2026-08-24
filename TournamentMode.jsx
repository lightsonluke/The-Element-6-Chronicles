import React, { useState, useEffect } from 'react';
import { ALL_CHARS } from './allCharacters.js';
import { drawStickman, STAGE_MAPS } from './renderer.js';
import PlatformFighter from './PlatformFighter.jsx';
import BracketVisualization from './BracketVisualization.jsx';
import { music } from './music.js';
import GameIcon from "./GameIcon.jsx";

const ALL = ALL_CHARS;
const ROUND_NAMES = ['Round of 16', 'Quarterfinal', 'Semifinal', 'GRAND FINAL'];
const MAP_IDS = STAGE_MAPS.map(m => m.id);

function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function randomMap() { return MAP_IDS[Math.floor(Math.random() * MAP_IDS.length)]; }

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

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  const newTournament = () => {
    const pool = shuffle(ALL.filter(c => c.id !== 'evil'));
    let newSlots = pool.slice(0, 16).map(c => c.id);
    // Ensure favorite is in the pool if unlocked
    if (favoriteId && unlockedIds.includes(favoriteId) && !newSlots.includes(favoriteId)) {
      newSlots[0] = favoriteId;
    }
    setSlots(newSlots);
    setCurrentRound(0);
    setResults({});
    setLog([]);
    // Always go to pick screen so the player chooses their fighter
    setPlayerChar(null);
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

  const simulateOtherMatches = (round) => {
    const numMatches = [8, 4, 2, 1][round];
    const newResults = { ...results };
    newResults[round] = { ...(newResults[round] || {}) };
    newResults[round][0] = playerChar;

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
    const won = result?.p1Won === true;
    if (won) {
      simulateOtherMatches(currentRound);
      setLog(l => [...l, `${ROUND_NAMES[currentRound]}: You defeated ${nameOf(opponent)}!`]);
      onAwardCoins?.(15);
      onAwardXP?.(playerChar, 10 + currentRound * 5);
      if (currentRound >= 3) {
        setPhase('champion');
        onChampion?.();
        const locked = ALL.filter(c => !unlockedIds.includes(c.id));
        if (locked.length) {
          const u = locked[Math.floor(Math.random() * locked.length)];
          onUnlock(u.id);
          setLog(l => [...l, `🏆 CHAMPION! You unlocked ${nameOf(u.id)}!`]);
        } else { setLog(l => [...l, '🏆 CHAMPION! All characters already unlocked!']); }
        onAwardCoins?.(50);
        onAwardXP?.(playerChar, 50);
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
        p1Char={playerChar} p2Char={opponent} p2IsCPU
        gameMode="regular" selectedMap={roundMap} cpuDifficulty={cpuDifficulty}
        onEnd={handleEnd}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
      />
    );
  }

  // ── Pick phase ──
  if (phase === 'pick' && slots) {
    return (
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">TOURNAMENT MODE</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>

        <div className="bg-card border-2 border-accent rounded-xl p-6 text-center">
          <h3 className="font-heading text-lg text-accent mb-2">CHOOSE YOUR FIGHTER</h3>
          <p className="text-xs text-muted-foreground font-body mb-4"><GameIcon emoji="⚠" size={14} /> This is locked for the entire tournament — choose wisely!</p>
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
          <div className="grid grid-cols-8 gap-2 mb-4 max-w-2xl mx-auto">
            {slots.map((id, i) => {
              const c = ALL.find(x => x.id === id);
              const locked = !unlockedIds.includes(id);
              return (
                <button key={i} onClick={() => !locked && handlePickChar(id)}
                  disabled={locked}
                  className={`flex flex-col items-center p-2 rounded border-2 transition ${locked ? 'border-border/30 opacity-30 cursor-not-allowed' : 'border-border hover:border-accent hover:scale-105'}`}>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: locked ? '#333' : c?.color, boxShadow: locked ? 'none' : `0 0 8px ${c?.color}55` }} />
                  <span className="text-[8px] font-heading text-foreground mt-1 leading-tight">{locked ? <GameIcon emoji="🔒" size={14} /> : c?.name}</span>
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
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-heading text-accent mb-3">TOURNAMENT BRACKET — {ROUND_NAMES[currentRound]}</p>
          <BracketVisualization
            slots={slots}
            results={results}
            currentRound={currentRound}
            playerSlot={0}
            allChars={ALL}
          />
        </div>

        <div className="bg-card border-2 border-accent rounded-xl p-4 text-center">
          <p className="font-heading text-sm text-primary mb-2">{ROUND_NAMES[currentRound]}</p>
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
            FIGHT! ({ROUND_NAMES[currentRound]})
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
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
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
          <p className="text-xl font-heading text-green-500 mb-2"><GameIcon emoji="✓" size={14} /> {ROUND_NAMES[currentRound]} WON!</p>
          <p className="text-sm text-muted-foreground font-body mb-4">You defeated {nameOf(opponent)}!</p>
          <button onClick={advanceRound} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-80">
            CONTINUE TO {currentRound < 3 ? ROUND_NAMES[currentRound + 1] : 'FINAL'}
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
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
        <div className="bg-card border-2 border-accent rounded-xl p-8 text-center">
          <p className="text-4xl font-heading text-accent mb-4"><GameIcon emoji="🏆" size={14} /> CHAMPION! <GameIcon emoji="🏆" size={14} /></p>
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
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
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