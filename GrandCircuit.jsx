// The Grand Circuit — 32-player single-elimination tournament.
// Phases: setup → humanCount → charSelect → bracketSetup → bracketPlay → versus → preMatch → match → defeat → champion

import React, { useState, useEffect } from 'react';
import { ALL_CHARS, ALL_CHARS_MAP } from './allCharacters.js';
import { getControlOptions } from './keybinds.js';
import GCBracket from './GCBracket.jsx';
import GCVersusScene from './GCVersusScene.jsx';
import GCMatch from './GCMatch.jsx';
import GameIcon from './GameIcon.jsx';

const charById = (id) => ALL_CHARS_MAP[id] || null;

function getNextMatch(results) {
  for (let r = 0; r <= 4; r++) {
    const count = [16, 8, 4, 2, 1][r];
    for (let m = 0; m < count; m++) {
      if (results[r]?.[m] === undefined) return { round: r, match: m };
    }
  }
  return null;
}

function getMatchParticipants(round, match, slots, results) {
  if (round === 0) return [slots[match * 2], slots[match * 2 + 1]];
  const prev = round - 1;
  return [results[prev]?.[match * 2], results[prev]?.[match * 2 + 1]];
}

// Fill 32 slots: human chars are spread evenly across the bracket, rest filled from the full char pool (including locked chars)
function randomizeSlots(charPool, humanChars) {
  const pool = charPool.filter(id => !humanChars.includes(id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const result = new Array(32);
  // Spread humans evenly across the 32-slot bracket so they don't meet early
  const n = humanChars.length;
  if (n > 0) {
    const step = 32 / n;
    humanChars.forEach((id, i) => {
      result[Math.floor(i * step)] = id;
    });
  }
  // Fill remaining slots with bots (from full pool including locked chars)
  let poolIdx = 0;
  for (let i = 0; i < 32; i++) {
    if (result[i]) continue;
    result[i] = shuffled[poolIdx] || pool[Math.floor(Math.random() * pool.length)];
    poolIdx++;
  }
  // Shuffle non-human slots so humans don't always face the same bots
  const humanPositions = new Set(humanChars.map((_, i) => Math.floor(i * (32 / humanChars.length))));
  const nonHumanIndices = [];
  for (let i = 0; i < 32; i++) { if (!humanPositions.has(i)) nonHumanIndices.push(i); }
  const nonHumanVals = nonHumanIndices.map(i => result[i]).sort(() => Math.random() - 0.5);
  nonHumanIndices.forEach((idx, i) => { result[idx] = nonHumanVals[i]; });
  return result;
}

const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

export default function GrandCircuit({ onBack, onEnd, unlockedIds = [], favoriteId, settings = {}, sfxVolume = 70, musicVolume = 50, equippedAccessories = {}, equippedSkins = {}, customCharsData = {}, charLevels = {}, equippedElements = {}, onEquipElement, equippedShikigami = {}, equippedEmotes = {} }) {
  const [phase, setPhase] = useState('setup');
  const [cpuDifficulty, setCpuDifficulty] = useState('regular');
  const [humanCount, setHumanCount] = useState(1);
  const [humanChars, setHumanChars] = useState([]); // array of char IDs selected by humans
  const [slots, setSlots] = useState(new Array(32).fill(null));
  const [results, setResults] = useState({});
  const [glowMatch, setGlowMatch] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null); // { round, match, p1, p2 } — captured when a match begins, used by handleMatchEnd to avoid stale-closure bugs
  const [defeatInfo, setDefeatInfo] = useState(null);
  const [champion, setChampion] = useState(null);
  const [p1Scheme, setP1Scheme] = useState('p1');
  const [p2Scheme, setP2Scheme] = useState('p2');

  // Bot pool — the 77 characters from gens 1-5 (locked chars can be bots, just not human)
  const charPool = ALL_CHARS.map(c => c.id);
  // Human-selectable chars — only unlocked + custom
  const selectableChars = [...new Set([...unlockedIds, ...Object.keys(customCharsData || {})])].filter(Boolean);
  const controlOptions = getControlOptions(settings);

  const startSetup = () => setPhase('humanCount');

  const confirmHumanCount = (count) => {
    setHumanCount(count);
    setHumanChars([]);
    setPhase('charSelect');
  };

  const toggleHumanChar = (charId) => {
    setHumanChars(prev => {
      // If already selected, remove one instance (click again to remove)
      const idx = prev.lastIndexOf(charId);
      if (idx >= 0) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }
      if (prev.length >= humanCount) return prev; // can't select more than humanCount
      return [...prev, charId]; // allow duplicates — multiple humans can play same char
    });
  };

  const confirmChars = () => {
    if (humanChars.length !== humanCount) return;
    const newSlots = randomizeSlots(charPool, humanChars);
    setSlots(newSlots);
    setResults({});
    setPhase('bracketSetup');
  };

  const startTournament = () => setPhase('bracketPlay');

  const shuffleBracket = () => {
    setSlots(prev => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  };

  const swapSlots = (i, j) => {
    setSlots(prev => {
      const arr = [...prev];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  const humanIds = new Set(humanChars);

  // ── bracketPlay: glow next match, wait for Start click ──
  useEffect(() => {
    if (phase !== 'bracketPlay') return;
    const next = getNextMatch(results);
    if (!next) {
      const champ = results[4]?.[0];
      setChampion(champ);
      setPhase('champion');
      return;
    }
    setGlowMatch(next);
    setCurrentMatch(next);
  }, [phase, results]);

  const startNextMatch = () => {
    setGlowMatch(null);
    setPhase('versus');
  };

  const onVersusContinue = () => setPhase('preMatch');

  // Capture the exact match + participants when a match begins so handleMatchEnd
  // always writes the winner to the correct bracket slot and shows the correct
  // fighters on the defeat screen — regardless of any stale closure state.
  const beginMatch = () => {
    if (!currentMatch) return;
    const [p1, p2] = getMatchParticipants(currentMatch.round, currentMatch.match, slots, results);
    setActiveMatch({ round: currentMatch.round, match: currentMatch.match, p1, p2 });
    setPhase('match');
  };

  const handleMatchEnd = (winnerCharId) => {
    // Use the captured activeMatch — never the possibly-stale currentMatch/results
    if (!activeMatch) return;
    const { round, match, p1, p2 } = activeMatch;
    setResults(prev => {
      const next = { ...prev };
      if (!next[round]) next[round] = {};
      next[round][match] = winnerCharId;
      return next;
    });
    const loser = winnerCharId === p1 ? p2 : p1;
    setDefeatInfo({ winner: winnerCharId, loser, p1, p2 });
    setActiveMatch(null);
    setPhase('defeat');
  };

  const continueFromDefeat = () => {
    setDefeatInfo(null);
    setActiveMatch(null);
    setPhase('bracketPlay');
  };

  const simulateMatch = () => {
    if (!currentMatch) return;
    const [p1, p2] = getMatchParticipants(currentMatch.round, currentMatch.match, slots, results);
    if (!p1 || !p2) return;
    const winner = Math.random() < 0.5 ? p1 : p2;
    setResults(prev => {
      const next = { ...prev };
      if (!next[currentMatch.round]) next[currentMatch.round] = {};
      next[currentMatch.round][currentMatch.match] = winner;
      return next;
    });
    setPhase('bracketPlay');
  };

  // ── Simulate all bot-vs-bot matches until next human match (or end) ──
  const simToNextHuman = () => {
    setResults(prev => {
      let r = { ...prev };
      let changed = true;
      while (changed) {
        changed = false;
        const next = getNextMatch(r);
        if (!next) break;
        const [p1, p2] = getMatchParticipants(next.round, next.match, slots, r);
        if (!p1 || !p2) break;
        // Stop if any human char is in this match
        if (humanIds.has(p1) || humanIds.has(p2)) break;
        const winner = Math.random() < 0.5 ? p1 : p2;
        if (!r[next.round]) r[next.round] = {};
        r[next.round][next.match] = winner;
        changed = true;
      }
      return r;
    });
    setPhase('bracketPlay');
  };

  const finishTournament = () => {
    const userWon = humanIds.has(champion);
    onEnd?.({ champion, userWon, humanChars });
  };

  // ── Render phases ──
  if (phase === 'setup') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-heading text-accent tracking-wider">THE GRAND CIRCUIT</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground font-body">A 32-player single-elimination tournament. Pick your human players, fight through 5 rounds, and claim the circuit crown. Locked characters can appear as bots.</p>
          <div>
            <p className="font-heading text-sm text-primary mb-2">CPU DIFFICULTY</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setCpuDifficulty(d)}
                  className={`px-3 py-1.5 rounded-lg font-heading text-xs border-2 ${cpuDifficulty === d ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-card text-foreground hover:opacity-80'}`}>
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-secondary/30 border border-border rounded-lg p-3 text-xs font-body text-muted-foreground">
            <p><strong className="text-foreground">Match Rules:</strong> 2 stocks · 500% damage KO · 85% reduced knockback · Respawn where you died · 6-minute timer · Harder super buildup</p>
          </div>
          <button onClick={startSetup} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-90">BEGIN</button>
        </div>
      </div>
    );
  }

  // ── Human count selection — how many human players? ──
  if (phase === 'humanCount') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">HUMAN PLAYERS</h2>
          <button onClick={() => setPhase('setup')} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground font-body">How many human players will participate in this tournament? (Max: {selectableChars.length} — your unlocked characters)</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[55vh] overflow-y-auto p-2">
            {Array.from({ length: Math.min(32, selectableChars.length) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => confirmHumanCount(n)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition hover:opacity-90 ${humanCount === n ? 'border-accent bg-accent/20' : 'border-border bg-card hover:border-primary/50'}`}>
                <span className="text-2xl font-heading text-accent">{n}</span>
                <span className="text-[10px] font-heading text-foreground">{n === 1 ? 'PLAYER' : 'PLAYERS'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Select human characters (multi-select) ──
  if (phase === 'charSelect') {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">SELECT HUMAN CHARACTERS ({humanChars.length}/{humanCount})</h2>
          <button onClick={() => setPhase('humanCount')} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
        <p className="text-xs text-muted-foreground font-body">Pick {humanCount} character{humanCount > 1 ? 's' : ''} for the human player{humanCount > 1 ? 's' : ''}. Locked characters cannot be selected — but they can still appear as bots in the tournament.</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[55vh] overflow-y-auto p-2 bg-card/50 rounded-lg border border-border">
          {selectableChars.map(id => {
            const c = charById(id);
            if (!c) return null;
            const count = humanChars.filter(h => h === id).length;
            const selected = count > 0;
            const disabled = !selected && humanChars.length >= humanCount;
            return (
              <button key={id} onClick={() => toggleHumanChar(id)} disabled={disabled}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition ${selected ? 'border-accent bg-accent/20' : disabled ? 'border-border bg-card opacity-40 cursor-not-allowed' : 'border-border bg-card hover:border-primary/50'}`}>
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}66` }} />
                <span className="text-[8px] font-heading text-foreground text-center truncate w-full">{c.name.slice(0, 8)}</span>
                {selected && <span className="text-[7px] font-heading text-accent">×{count}</span>}
              </button>
            );
          })}
        </div>
        <button onClick={confirmChars} disabled={humanChars.length !== humanCount}
          className={`px-8 py-3 rounded-lg font-heading text-lg ${humanChars.length === humanCount ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}>
          CONFIRM ({humanChars.length}/{humanCount})
        </button>
      </div>
    );
  }

  if (phase === 'bracketSetup') {
    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-3 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">BRACKET SETUP</h2>
          <div className="flex gap-2">
            <button onClick={shuffleBracket} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="🔀" size={14} /> SHUFFLE</button>
            <button onClick={startTournament} className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90">START</button>
            <button onClick={() => setPhase('charSelect')} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-body">Drag and drop slots to swap fighters, or double-click a name to swap with the fighter across the bracket. Human players are marked with ★.</p>
        <GCBracket slots={slots} results={results} humanIds={humanIds} charById={charById} onSwap={swapSlots} draggable={true} />
      </div>
    );
  }

  if (phase === 'bracketPlay') {
    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-3 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider">THE GRAND CIRCUIT</h2>
          <div className="flex gap-2">
            <button onClick={simToNextHuman} className="px-4 py-2 bg-primary/80 text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90">⏩ SIM TO NEXT HUMAN MATCH</button>
            <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> QUIT</button>
          </div>
        </div>
        <GCBracket slots={slots} results={results} humanIds={humanIds} charById={charById} glowMatch={glowMatch} compact />
        {currentMatch && (
          <div className="flex justify-center mt-2">
            <button onClick={startNextMatch} className="px-10 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-xl hover:opacity-90 animate-pulse">START NEXT MATCH</button>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'versus' && currentMatch) {
    const [p1, p2] = getMatchParticipants(currentMatch.round, currentMatch.match, slots, results);
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-3 p-4">
        <GCVersusScene p1Char={p1} p2Char={p2} mode="versus" onContinue={onVersusContinue} autoAdvance={true} />
      </div>
    );
  }

  // ── preMatch: Start button + options based on match type ──
  if (phase === 'preMatch' && currentMatch) {
    const [p1, p2] = getMatchParticipants(currentMatch.round, currentMatch.match, slots, results);
    const p1IsHuman = humanIds.has(p1);
    const p2IsHuman = humanIds.has(p2);
    const isBotVsBot = !p1IsHuman && !p2IsHuman;
    const isPvP = p1IsHuman && p2IsHuman;
    const c1 = charById(p1);
    const c2 = charById(p2);

    const SchemePicker = ({ label, value, onChange, color }) => (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-heading" style={{ color }}>{label}</span>
        <select value={value} onChange={e => onChange(e.target.value)}
          className="bg-card border-2 border-border rounded-lg px-3 py-2 font-body text-sm text-foreground">
          {controlOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
    );

    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-5 p-6">
        <h2 className="text-3xl font-heading text-accent tracking-wider">NEXT MATCH</h2>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full" style={{ backgroundColor: c1?.color, boxShadow: `0 0 16px ${c1?.color}88` }} />
            <span className="font-heading text-sm" style={{ color: c1?.color }}>{c1?.name}</span>
            {p1IsHuman && <span className="text-xs text-accent font-heading">★ YOU</span>}
          </div>
          <span className="text-2xl font-heading text-muted-foreground">VS</span>
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full" style={{ backgroundColor: c2?.color, boxShadow: `0 0 16px ${c2?.color}88` }} />
            <span className="font-heading text-sm" style={{ color: c2?.color }}>{c2?.name}</span>
            {p2IsHuman && <span className="text-xs text-accent font-heading">★ YOU</span>}
          </div>
        </div>

        {isBotVsBot && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground font-body">Bot vs Bot — choose how to proceed:</p>
            <div className="flex gap-3">
              <button onClick={beginMatch} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90">▶ WATCH</button>
              <button onClick={simulateMatch} className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading text-lg hover:opacity-80">⏩ SIM</button>
            </div>
          </div>
        )}

        {!isBotVsBot && !isPvP && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground font-body">Player vs Bot — select your controls:</p>
            {p1IsHuman ? <SchemePicker label="Your Controls" value={p1Scheme} onChange={setP1Scheme} color={c1?.color} /> : <SchemePicker label="Your Controls" value={p2Scheme} onChange={setP2Scheme} color={c2?.color} />}
            <div className="flex gap-3 mt-2">
              <button onClick={beginMatch} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90">▶ PLAY</button>
              <button onClick={simulateMatch} className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading text-lg hover:opacity-80">⏩ SIMULATE</button>
            </div>
          </div>
        )}

        {isPvP && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground font-body">Player vs Player — assign controls:</p>
            <div className="flex gap-6">
              <SchemePicker label={`${c1?.name} Controls`} value={p1Scheme} onChange={setP1Scheme} color={c1?.color} />
              <SchemePicker label={`${c2?.name} Controls`} value={p2Scheme} onChange={setP2Scheme} color={c2?.color} />
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={beginMatch} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90">▶ PLAY</button>
              <button onClick={simulateMatch} className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading text-lg hover:opacity-80">⏩ SIMULATE</button>
            </div>
          </div>
        )}

        <button onClick={simToNextHuman} className="mt-4 px-6 py-2 bg-primary/60 text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90">⏩ SIM TO NEXT HUMAN MATCH</button>
      </div>
    );
  }

  if (phase === 'match' && activeMatch) {
    const { p1, p2, round } = activeMatch;
    const p1IsHuman = humanIds.has(p1);
    const p2IsHuman = humanIds.has(p2);
    const isFinalMatch = round === 4;
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-2 p-4">
        <GCMatch
          p1Char={p1} p2Char={p2}
          p1IsHuman={p1IsHuman} p2IsHuman={p2IsHuman}
          p1Scheme={p1Scheme} p2Scheme={p2Scheme}
          cpuDifficulty={cpuDifficulty}
          settings={settings}
          equippedAccessories={equippedAccessories}
          equippedSkins={equippedSkins}
          equippedShikigami={equippedShikigami}
          equippedEmotes={equippedEmotes}
          p1Element={equippedElements[p1] || 'basic'}
          p2Element={equippedElements[p2] || 'basic'}
          sfxVolume={sfxVolume}
          musicVolume={musicVolume}
          isFinalMatch={isFinalMatch}
          onEnd={handleMatchEnd}
        />
      </div>
    );
  }

  if (phase === 'defeat' && defeatInfo) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-3 p-4">
        <GCVersusScene p1Char={defeatInfo.p1} p2Char={defeatInfo.p2}
          mode="defeat" winner={defeatInfo.winner} onContinue={continueFromDefeat} autoAdvance={false} />
      </div>
    );
  }

  if (phase === 'champion' && champion) {
    const c = charById(champion);
    const userWon = humanIds.has(champion);
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 p-8">
        <div className="text-center">
          <span className="text-7xl">🏆</span>
          <h2 className="text-4xl font-heading text-accent tracking-wider mt-2">GRAND CIRCUIT CHAMPION</h2>
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full" style={{ backgroundColor: c?.color, boxShadow: `0 0 30px ${c?.color}88` }} />
            <p className="text-2xl font-heading text-foreground">{c?.name}</p>
          </div>
          <p className={`text-lg font-heading mt-4 ${userWon ? 'text-accent' : 'text-muted-foreground'}`}>
            {userWon ? 'YOU WIN THE CIRCUIT!' : 'Better luck next time!'}
          </p>
        </div>
        <button onClick={finishTournament} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-90">CONTINUE</button>
      </div>
    );
  }

  return null;
}