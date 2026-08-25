import React, { useState, useRef, useEffect } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { getCharNumber } from './characterNumber.js';
import { withCustomChars } from './characterNumber.js';
import SoccerFighter from './SoccerFighter.jsx';
import SoccerMatchReview from './SoccerMatchReview.jsx';
import BracketVisualization from './BracketVisualization.jsx';
import PrematchAnimation from './PrematchAnimation.jsx';
import GroupTournament from './GroupTournament.jsx';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import GameIcon from "./GameIcon.jsx";

const BASE_ALL = [...HEROES, ...VILLAINS];
const ALL = [...HEROES, ...VILLAINS];

export default function SoccerMode({ onBack, onEnd, onAward, onShop, onOnlinePlay, unlockedIds, favoriteId, sfxVolume = 70, musicVolume = 50, equippedAccessories = {}, equippedSkins = {}, settings = {}, charLevels = {}, equippedElements = {}, onEquipElement, customCharsData = {}, customNumberMap = {}, equippedCrossovers = {}, equippedShikigami = {}, ownedAccessories = [], onEquipAccessory, equippedEmotes = {} }) {
  const ALL = withCustomChars(BASE_ALL, customCharsData, customNumberMap);
  const [phase, setPhase] = useState('select'); // select -> bracket -> fight -> summary
  const [p1, setP1] = useState(favoriteId || 'yellow');
  const [p2, setP2] = useState(() => {
    const pool = ALL.filter(c => c.id !== 'evil' && c.id !== (favoriteId || 'yellow'));
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : 'blue';
  });
  const [p1b, setP1b] = useState(() => {
    const pool = ALL.filter(c => c.id !== 'evil' && c.id !== (favoriteId || 'yellow'));
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : 'blue';
  });
  const [gameMode, setGameMode] = useState('quick'); // quick | tournament | head | penalties | 2v2
  const [p2IsCPU, setP2IsCPU] = useState(true);
  const [p1IsCPU, setP1IsCPU] = useState(false);
  const [cpuDifficulty, setCpuDifficulty] = useState(settings?.defaultCPUDifficulty || 'regular');
  const [showRules, setShowRules] = useState(false);
  const [penaltiesEnabled, setPenaltiesEnabled] = useState(settings?.penaltiesInsteadOfSuddenDeath === true);
  const [p1Jersey, setP1Jersey] = useState(true);
  const [p2Jersey, setP2Jersey] = useState(true);
  const [p1Element, setP1Element] = useState(equippedElements?.[favoriteId || 'yellow'] || 'basic');
  const [p2Element, setP2Element] = useState('basic');
  const [replayNonce, setReplayNonce] = useState(0);
  const [fightOpp, setFightOpp] = useState(null); // { p2Char, p2bChar } — frozen when fight starts
  const fightOppRef = useRef(null);

  useEffect(() => { setP1Element(equippedElements?.[p1] || 'basic'); }, [p1]);
  useEffect(() => { setP2Element(equippedElements?.[p2] || 'basic'); }, [p2]);

  const [bracket, setBracket] = useState(null);
  const [summary, setSummary] = useState(null);
  const bracketRef = useRef(null);
  bracketRef.current = bracket;

  // Freeze opponent characters when entering fight/prematch phase so they
  // don't re-randomize on every re-render (fixes mid-match character/weather glitch).
  useEffect(() => {
    if (phase !== 'fight' && phase !== 'prematch') return;
    const fallbackPool = ALL.filter(c => c.id !== p1 && c.id !== 'evil');
    const pickRandom = (exclude) => {
      const pool = ALL.filter(c => c.id !== 'evil' && !exclude.includes(c.id));
      return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : 'blue';
    };
    if (gameMode === '2v2') {
      const opp = pickRandom([p1, p1b]);
      const opp2 = pickRandom([p1, p1b, opp]);
      fightOppRef.current = { p2Char: opp, p2bChar: opp2 };
      setFightOpp(fightOppRef.current);
    } else if (gameMode === 'tournament') {
      const rawOpp = bracket?.currentRound === 0 ? bracket?.slots?.[1]
        : bracket?.results?.[bracket.currentRound - 1]?.[1];
      const opp = ALL.find(c => c.id === rawOpp) ? rawOpp : (fallbackPool[0]?.id || 'blue');
      fightOppRef.current = { p2Char: opp, p2bChar: null };
      setFightOpp(fightOppRef.current);
    } else {
      fightOppRef.current = { p2Char: p2, p2bChar: null };
      setFightOpp(fightOppRef.current);
    }
  }, [phase, gameMode, bracket?.currentRound]);

  const unlockedSet = new Set(unlockedIds || ['yellow']);

  const handleStart = (mode) => {
    setP1IsCPU(false);
    setGameMode(mode);
    if (mode === 'tournament') {
      const pool = ALL.filter(c => c.id !== p1 && c.id !== 'evil');
      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 15);
      setBracket({ slots: [p1, ...shuffled], results: {}, currentRound: 0 });
      setPhase('bracket');
    } else {
      // Populate this synchronously before changing screens.  The old code
      // waited for an effect, leaving one render where SoccerFighter had no
      // opponent and returned a completely blank page.
      if (mode === '2v2') {
        const pool = ALL.filter(c => c.id !== 'evil' && c.id !== p1 && c.id !== p1b);
        const first = pool[Math.floor(Math.random() * pool.length)]?.id || 'blue';
        const secondPool = pool.filter(c => c.id !== first);
        const second = secondPool[Math.floor(Math.random() * secondPool.length)]?.id || first;
        fightOppRef.current = { p2Char: first, p2bChar: second };
      } else {
        fightOppRef.current = { p2Char: p2, p2bChar: null };
      }
      setFightOpp(fightOppRef.current);
    }
    if (mode === 'quick') {
      setPhase('prematch');
    } else if (mode !== 'tournament') {
      setPhase('fight');
    }
  };

  const handleFightEnd = (result) => {
    const bk = bracketRef.current;
    if (gameMode === 'tournament') {
      if (!bk) { setPhase('select'); return; }
      if (result.p1Won === null || result.p1Won === undefined) {
        setReplayNonce(n => n + 1);
        return;
      }
      if (result.p1Won) {
        const newResults = { ...bk.results };
        const round = bk.currentRound;
        newResults[round] = { ...(newResults[round] || {}) };
        newResults[round][0] = p1;

        // Simulate all non-player matches for this round
        const numMatches = Math.pow(2, 3 - round); // R16: 8, QF: 4, SF: 2, Final: 1
        for (let m = 1; m < numMatches; m++) {
          let a, b;
          if (round === 0) {
            a = bk.slots[m * 2]; b = bk.slots[m * 2 + 1];
          } else {
            a = newResults[round - 1][m * 2]; b = newResults[round - 1][m * 2 + 1];
          }
          newResults[round][m] = Math.random() < 0.5 ? a : b;
        }

        const nextRound = round + 1;
        const updated = { ...bk, results: newResults, currentRound: nextRound };
        bracketRef.current = updated;
        setBracket(updated);

        if (nextRound <= 3) {
          setPhase('bracket');
        } else {
          onEnd?.({ tournamentWon: true, reward: 50, p1CharId: p1, p2CharId: result.p2Char, soccerStats: result.soccerStats });
        }
      } else {
        onEnd?.({ tournamentWon: false, p1Won: false, p1CharId: p1, p2CharId: result.p2Char, soccerStats: result.soccerStats });
      }
    } else {
      if (result.p1Won === null || result.p1Won === undefined) {
        setReplayNonce(n => n + 1);
        return;
      }
      setSummary({ result, mode: gameMode, p2CharId: result.p2Char || p2, p2IsHuman: !p2IsCPU && gameMode !== 'tournament' && gameMode !== '2v2' });
      setPhase('summary');
    }
  };

  const continueFromBracket = () => {
    const rawOpp = bracket?.currentRound === 0 ? bracket?.slots?.[1]
      : bracket?.results?.[bracket.currentRound - 1]?.[1];
    const opponent = ALL.some(c => c.id === rawOpp) ? rawOpp : 'blue';
    fightOppRef.current = { p2Char: opponent, p2bChar: null };
    setFightOpp(fightOppRef.current);
    setPhase('prematch');
  };

  // ── Group Tournament ──
  if (phase === 'grouptournament') {
    return (
      <GroupTournament
        onBack={() => setPhase('select')}
        onEnd={(result) => { onEnd?.(result); }}
        onAward={(result) => { onAward?.(result); }}
        onShop={onShop}
        unlockedIds={unlockedIds}
        favoriteId={favoriteId}
        sfxVolume={sfxVolume}
        musicVolume={musicVolume}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
        settings={settings}
        charLevels={charLevels}
        equippedElements={equippedElements}
        onEquipElement={onEquipElement}
      />
    );
  }

  // ── Prematch intro animation ──
  if (phase === 'prematch') {
    const opp = gameMode === 'tournament'
      ? (bracket.currentRound === 0 ? bracket.slots[1] : bracket.results[bracket.currentRound - 1]?.[1])
      : p2;
    const p1CD = ALL.find(c => c.id === p1);
    const p2CD = ALL.find(c => c.id === opp);
    const participants = [];
    if (p1CD) participants.push({ char: p1CD, side: 1, teamColor: '#4488FF' });
    if (p2CD) participants.push({ char: p2CD, side: 2, teamColor: '#AA44FF' });
    const title = gameMode === 'tournament'
      ? (['ROUND OF 16', 'QUARTERFINAL', 'SEMIFINAL', 'FINAL'][bracket?.currentRound] || 'TOURNAMENT')
      : 'QUICK MATCH';
    return (
      <PrematchAnimation
        participants={participants}
        sport="soccer"
        title={title}
        onDone={() => setPhase('fight')}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
      />
    );
  }

  // ── Fight phase ──
  if (phase === 'fight') {
    if (gameMode === 'tournament' && (!bracket || !bracket.slots)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-5 text-foreground">
          <p className="font-heading text-xl">PREPARING SOCCER BRACKET…</p>
          <button onClick={() => setPhase('select')} className="px-6 py-3 rounded-lg bg-accent text-accent-foreground font-heading">BACK TO SOCCER</button>
        </div>
      );
    }
    const fallbackPool = ALL.filter(c => c.id !== p1 && c.id !== 'evil');
    const randomId = (exclude) => {
      const pool = ALL.filter(c => c.id !== 'evil' && !exclude.includes(c.id));
      return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : 'blue';
    };
    const rematch = () => {
      // Re-freeze new random opponents for the next match
      if (gameMode === '2v2') {
        const newOpp = randomId([p1, p1b]);
        const newOpp2 = randomId([p1, p1b, newOpp]);
        fightOppRef.current = { p2Char: newOpp, p2bChar: newOpp2 };
        setFightOpp(fightOppRef.current);
      } else if (gameMode !== 'tournament') {
        fightOppRef.current = { p2Char: p2, p2bChar: null };
        setFightOpp(fightOppRef.current);
      }
      setReplayNonce(n => n + 1);
    };

    // Use frozen opponents from fightOppRef (set when fight phase started)
    const frozen = fightOppRef.current || (gameMode !== 'tournament' ? { p2Char: p2, p2bChar: null } : null);
    if (!frozen) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-5 text-foreground">
          <p className="font-heading text-xl">PREPARING SOCCER MATCH…</p>
          <button onClick={() => setPhase('select')} className="px-6 py-3 rounded-lg bg-accent text-accent-foreground font-heading">BACK TO SOCCER</button>
        </div>
      );
    }

    if (gameMode === '2v2') {
      return (
        <SoccerFighter
          key={`soccer-2v2-${replayNonce}`}
          p1Char={p1} p2Char={frozen.p2Char} p2IsCPU cpuDifficulty={cpuDifficulty}
          round={1} totalRounds={1} onEnd={handleFightEnd} onRematch={rematch}
          sfxVolume={sfxVolume} musicVolume={musicVolume}
          headSoccer={false} penaltiesEnabled={false} penaltiesOnly={false}
          teamMode p1bChar={p1b} p2bChar={frozen.p2bChar}
          p1Jersey={p1Jersey} p2Jersey={p2Jersey}
          equippedAccessories={equippedAccessories} equippedSkins={equippedSkins} equippedShikigami={equippedShikigami} settings={settings}
          p1Element={p1Element}
          p2Element="basic"
          customCharsData={customCharsData}
          equippedCrossovers={equippedCrossovers}
          equippedEmotes={equippedEmotes}
          />
      );
    }

    const isCPU = gameMode === 'tournament' ? true : p2IsCPU;
    return (
      <SoccerFighter
        key={gameMode === 'tournament' ? `soccer-r${bracket?.currentRound}-${replayNonce}` : `soccer-quick-${replayNonce}`}
        p1Char={p1}
        p2Char={frozen.p2Char}
        p2IsCPU={isCPU}
        p1IsCPU={p1IsCPU}
        cpuDifficulty={gameMode === 'tournament' ? 'pro' : cpuDifficulty}
        round={gameMode === 'tournament' ? (bracket?.currentRound ?? 0) + 1 : 1}
        totalRounds={gameMode === 'tournament' ? 4 : 1}
        onEnd={handleFightEnd}
        sfxVolume={sfxVolume}
        musicVolume={musicVolume}
        headSoccer={false}
        penaltiesEnabled={penaltiesEnabled}
        penaltiesOnly={gameMode === 'penalties'}
        onRematch={rematch}
        p1Jersey={p1Jersey} p2Jersey={p2Jersey}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
        equippedShikigami={equippedShikigami}
        settings={settings}
        p1Element={p1Element}
        p2Element={p2Element}
        customCharsData={customCharsData}
        equippedEmotes={equippedEmotes}
        />
    );
  }

  // ── Summary phase ──
  if (phase === 'summary' && summary) {
    const r = summary.result;
    const p1CD = ALL.find(c => c.id === p1);
    const p2CD = ALL.find(c => c.id === (summary.p2CharId || p2));
    return (
      <SoccerMatchReview
        stats={r.soccerStats}
        p1Name={summary.mode === '2v2' ? 'TEAM BLUE' : (p1CD?.name || 'Blue')}
        p2Name={summary.mode === '2v2' ? 'TEAM PURPLE' : (p2CD?.name || 'Purple')}
        p1Color={p1CD?.color || '#4488FF'}
        p2Color={p2CD?.color || '#AA44FF'}
        p1Won={r.p1Won}
        onContinue={() => { setSummary(null); onEnd?.({ tournamentWon: false, p1Won: r.p1Won, p1CharId: p1, p2CharId: summary.p2CharId || p2, p2IsHuman: summary.p2IsHuman, soccerStats: r.soccerStats }); }}
        onRematch={() => {
          // Pay out XP/coins for the match just played before starting a new one,
          // so rematching never skips rewards.
          if (onAward) {
            onAward({ tournamentWon: false, p1Won: r.p1Won, p1CharId: p1, p2CharId: summary.p2CharId || p2, p2IsHuman: summary.p2IsHuman, soccerStats: r.soccerStats });
          }
          setSummary(null);
          setReplayNonce(n => n + 1);
          setPhase('fight');
        }}
      />
    );
  }

  // ── Bracket phase (between tournament rounds) ──
  if (phase === 'bracket' && bracket) {
    const roundNames = ['ROUND OF 16', 'QUARTERFINAL', 'SEMIFINAL', 'FINAL'];
    const roundName = roundNames[bracket.currentRound] || 'COMPLETE';
    const nextOpp = bracket.currentRound === 0 ? bracket.slots[1]
      : bracket.currentRound === 1 ? bracket.results[0]?.[1]
      : bracket.results[1]?.[1];
    const nextOppChar = ALL.find(c => c.id === nextOpp);
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
        <h2 className="text-2xl font-heading text-accent tracking-wider">SOCCER TOURNAMENT</h2>
        <p className="text-sm text-muted-foreground font-body">{roundName} — {bracket.currentRound > 0 ? `${bracket.currentRound} win${bracket.currentRound > 1 ? 's' : ''} so far!` : 'Your first match!'}</p>

        <div className="w-full bg-card border border-border rounded-xl p-4">
          <BracketVisualization
            slots={bracket.slots}
            results={bracket.results}
            currentRound={bracket.currentRound}
            playerSlot={0}
            allChars={ALL.filter(c => c.id !== 'evil').map(c => ({ id: c.id, name: c.name, color: c.color }))}
          />
        </div>

        <div className="flex gap-3 items-center">
          <span className="text-sm font-heading text-foreground">Next opponent:</span>
          <div className="flex items-center gap-2 bg-card border-2 border-accent rounded-lg px-4 py-2">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: nextOppChar?.color }} />
            <span className="font-heading text-sm">{nextOppChar?.name}</span>
            <span className="text-xs text-muted-foreground">#{getCharNumber(nextOpp)}</span>
          </div>
        </div>

        <button onClick={continueFromBracket} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90 shadow-lg">CONTINUE TO MATCH <GameIcon emoji="→" size={14} /></button>
        <button onClick={() => { setPhase('select'); setBracket(null); }} className="px-4 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80">Quit Tournament</button>
      </div>
    );
  }

  // ── Select phase ──
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider">SOCCER MODE</h2>
        <div className="flex gap-2">
          <button onClick={onShop} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-80">SHOP</button>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>

      {/* Game mode buttons — sets the mode; START is in the universal select below */}
      <div className="flex gap-2 w-full justify-center flex-wrap">
        <button onClick={() => setGameMode('quick')} className={`px-4 py-2 rounded-lg font-heading text-sm ${gameMode === 'quick' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>QUICK MATCH</button>
        <button onClick={() => setGameMode('penalties')} className={`px-4 py-2 rounded-lg font-heading text-sm ${gameMode === 'penalties' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>PENALTIES</button>
        <button onClick={() => setGameMode('tournament')} className={`px-4 py-2 rounded-lg font-heading text-sm ${gameMode === 'tournament' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground border-2 border-accent'}`}>TOURNAMENT</button>
        <button onClick={() => setGameMode('2v2')} className={`px-4 py-2 rounded-lg font-heading text-sm ${gameMode === '2v2' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>2v2</button>
        <button onClick={() => setPhase('grouptournament')} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm border-2 border-primary">GROUP</button>
        <button onClick={() => setShowRules(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm"><GameIcon emoji="📜" size={14} /> RULES</button>
        <button onClick={onOnlinePlay} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm"><GameIcon emoji="🌐" size={14} /> ONLINE</button>
      </div>

      {/* Character select — universal screen */}
      <UniversalCharacterSelect
        title="SOCCER — SELECT FIGHTERS"
        modeLabel={gameMode === 'tournament' ? 'TOURNAMENT' : gameMode === '2v2' ? '2v2' : 'QUICK MATCH'}
        startLabel="▶ START MATCH"
        unlockedIds={unlockedIds || ['yellow']}
        favoriteId={favoriteId}
        customCharsData={customCharsData}
        equippedSkins={equippedSkins}
        equippedAccessories={equippedAccessories}
        ownedAccessories={ownedAccessories}
        onEquipAccessory={onEquipAccessory}
        charLevels={charLevels}
        equippedElements={equippedElements}
        onEquipElement={onEquipElement}
        playerCount={gameMode === '2v2' ? 1 : 2}
        defaultCPUDifficulty={cpuDifficulty}
        onStart={(c1, c2, p2cpu, diff) => {
          setP1(c1); setP2(c2); setP2IsCPU(p2cpu); if (diff) setCpuDifficulty(diff);
          handleStart(gameMode);
        }}
        onBack={onBack}
        extraControls={
          <div className="flex gap-3 flex-wrap items-center justify-center bg-card/60 border border-border rounded-lg p-2 text-[10px]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={p1Jersey} onChange={e => setP1Jersey(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
              <span className="text-muted-foreground">P1 Kit</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={p2Jersey} onChange={e => setP2Jersey(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
              <span className="text-muted-foreground">P2 Kit</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={penaltiesEnabled} onChange={e => setPenaltiesEnabled(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
              <span className="text-muted-foreground">Penalties (not Sudden Death)</span>
            </label>
            {gameMode === '2v2' && (
              <label className="flex items-center gap-1.5">
                <span className="text-muted-foreground">TEAMMATE:</span>
                <select value={p1b} onChange={e => setP1b(e.target.value)} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px]">
                  {ALL.filter(c => c.id !== 'evil' && unlockedSet.has(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}
          </div>
        }
      />

      {gameMode === '2v2' && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-heading" style={{ color: '#4488FF' }}>TEAMMATE:</span>
          <select value={p1b} onChange={e => setP1b(e.target.value)} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body border border-border">
            {ALL.filter(c => c.id !== 'evil' && unlockedSet.has(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => { const pool = ALL.filter(c => c.id !== 'evil' && unlockedSet.has(c.id) && c.id !== p1); setP1b(pool.length ? pool[Math.floor(Math.random()*pool.length)].id : 'blue'); }} className="text-xs px-2 py-1 bg-primary/30 rounded">RAND</button>
          <span className="text-xs text-muted-foreground font-body ml-2">vs 2 CPUs</span>
        </div>
      )}

      {gameMode === 'tournament' && (
        <p className="text-xs text-muted-foreground font-body text-center">Opponents are hidden — discover them as you advance!</p>
      )}

      <div className="bg-card border border-border rounded-xl p-4 w-full max-w-lg">
        <h3 className="font-heading text-sm text-accent mb-2">HOW TO PLAY SOCCER</h3>
        <p className="text-xs text-muted-foreground font-body">• Use your attacks to hit the ball into the opponent's net</p>
        <p className="text-xs text-muted-foreground font-body">• First to {10} goals wins the match</p>
        <p className="text-xs text-muted-foreground font-body">• Super moves & heavy attacks are disabled — signatures only!</p>
        <p className="text-xs text-muted-foreground font-body">• Powers launch the ball at 5x damage toward the opponent's goal!</p>
        <p className="text-xs text-muted-foreground font-body">• Own goals are blocked — ball bounces off your own net</p>
        <p className="text-xs text-muted-foreground font-body">• Clock shows 90s but each second counts double — more time to score!</p>
        <p className="text-xs text-muted-foreground font-body">• Tied after regulation <GameIcon emoji="→" size={14} /> 30s extra time <GameIcon emoji="→" size={14} /> sudden death (or penalties if enabled)</p>
        <p className="text-xs text-muted-foreground font-body">• Goals are behind the wall — shoot through the gap to score!</p>
        <p className="text-xs text-muted-foreground font-body">• Win the 4-round Round of 16 tournament for 50 tokens!</p>
        <p className="text-xs text-muted-foreground font-body">• Visit the Shop to buy Soccer Kits for any character!</p>
      </div>

      {showRules && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-lg text-accent tracking-wider">SOCCER RULES</h3>
              <button onClick={() => setShowRules(false)} className="text-muted-foreground hover:text-foreground text-xl"><GameIcon emoji="✕" size={14} /></button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground font-body">
              <p>• Use your signature attacks to hit the ball into the opponent's net</p>
              <p>• First to 10 goals wins the match</p>
              <p>• Goals are BEHIND the wall — shoot through the narrow gap to score!</p>
              <p>• Super moves and heavy attacks are disabled — signatures only</p>
              <p>• Powers launch the ball at 5x damage toward the opponent's goal</p>
              <p>• Own goals are blocked — the ball bounces off your own net</p>
              <p>• Match clock shows 90s but each second counts as 2 — more time to score!</p>
              <p>• Tied after regulation <GameIcon emoji="→" size={14} /> 30s extra time <GameIcon emoji="→" size={14} /> sudden death (or penalties if enabled)</p>
              <p>• Penalties: shooter uses SIG to shoot (DOWN+SIG for low), keeper jumps to save — roles switch each shot</p>
              <p>• Tournament: 16-player bracket (Round of 16 <GameIcon emoji="→" size={14} /> Final), 4 rounds</p>
              <p>• Win the tournament for 50 tokens!</p>
              <p>• Visit the Shop to buy Soccer Kits for any character</p>
            </div>
            <button onClick={() => setShowRules(false)} className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-80">GOT IT</button>
          </div>
        </div>
      )}
    </div>
  );
}
