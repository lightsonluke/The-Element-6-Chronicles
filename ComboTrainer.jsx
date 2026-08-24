import React, { useState, useEffect, useRef } from 'react';
import { ALL_CHARS, ERAS, getRosterForEra } from './allCharacters.js';
import { ELEMENTS, applyElement } from './elements.js';
import { COMBOS } from './combos.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import PlatformFighter from './PlatformFighter.jsx';
import GameIcon from "./GameIcon.jsx";

const PROGRESS_KEY = 'element6_combo_trainer_progress';
const COMBO_TIMEOUT_MS = 1500;

function loadProgress() {
  try {
    const saved = parseInt(localStorage.getItem(PROGRESS_KEY) || '0', 10);
    return isNaN(saved) ? 0 : Math.max(0, Math.min(saved, COMBOS.length - 1));
  } catch { return 0; }
}

// Characters ordered by generation: G1 → G2 → G3 → G4 → G5
const SORTED_CHARS = ERAS.flatMap(era => getRosterForEra(era.id));

export default function ComboTrainer({ onBack, customCharsData = {}, equippedSkins = {}, equippedAccessories = {}, sfxVolume = 70, musicVolume = 50, settings = {} }) {
  const [phase, setPhase] = useState('select');
  const [selectedChar, setSelectedChar] = useState('yellow');
  const [selectedElement, setSelectedElement] = useState('basic');
  const [comboIndex, setComboIndex] = useState(loadProgress);
  const [moveIndex, setMoveIndex] = useState(0);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [, forceTick] = useState(0);
  const [completed, setCompleted] = useState(false);

  const comboStateRef = useRef({ moveIndex: 0, lastMoveTime: 0, comboIndex: comboIndex });

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  // Timeout checker — resets combo progress if 1.5s passes without a matching move
  useEffect(() => {
    if (phase !== 'fight') return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (comboStateRef.current.lastMoveTime > 0 && now - comboStateRef.current.lastMoveTime > COMBO_TIMEOUT_MS) {
        comboStateRef.current.moveIndex = 0;
        comboStateRef.current.lastMoveTime = 0;
        setMoveIndex(0);
        setLastMoveTime(0);
        sfx.warning();
      }
      forceTick(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  const handleMove = (moveType) => {
    const idx = comboStateRef.current.comboIndex;
    const combo = COMBOS[idx];
    if (!combo) return;
    const expected = combo.moves[comboStateRef.current.moveIndex];
    if (!expected) return;

    if (moveType === expected.type || (expected.type === 'downHeavy' && moveType === 'heavy')) {
      comboStateRef.current.moveIndex++;
      comboStateRef.current.lastMoveTime = Date.now();
      setMoveIndex(comboStateRef.current.moveIndex);
      setLastMoveTime(Date.now());

      if (comboStateRef.current.moveIndex >= combo.moves.length) {
        // Combo completed!
        sfx.purchaseSuccess();
        const nextIdx = idx + 1;
        if (nextIdx >= COMBOS.length) {
          setCompleted(true);
          comboStateRef.current.comboIndex = 0;
          comboStateRef.current.moveIndex = 0;
          comboStateRef.current.lastMoveTime = 0;
          setComboIndex(0);
          setMoveIndex(0);
          localStorage.setItem(PROGRESS_KEY, '0');
        } else {
          comboStateRef.current.comboIndex = nextIdx;
          comboStateRef.current.moveIndex = 0;
          comboStateRef.current.lastMoveTime = 0;
          setComboIndex(nextIdx);
          setMoveIndex(0);
          localStorage.setItem(PROGRESS_KEY, String(nextIdx));
        }
      }
    }
  };

  const handleReset = () => {
    comboStateRef.current = { moveIndex: 0, lastMoveTime: 0, comboIndex: 0 };
    setComboIndex(0);
    setMoveIndex(0);
    setLastMoveTime(0);
    setCompleted(false);
    localStorage.setItem(PROGRESS_KEY, '0');
    sfx.click();
  };

  // Sync ref comboIndex when comboIndex changes externally
  useEffect(() => { comboStateRef.current.comboIndex = comboIndex; }, [comboIndex]);

  // ── Character Select Phase ──
  if (phase === 'select') {
    return (
      <div className="w-full max-w-5xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-heading text-accent tracking-wider">COMBO TRAINER</h2>
            <p className="text-xs text-muted-foreground font-body">Learn {COMBOS.length} combo chains — practice against a training dummy</p>
          </div>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>

        {/* Progress */}
        <div className="bg-card/80 border border-border rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-heading text-muted-foreground">YOUR PROGRESS</p>
            <p className="text-sm font-heading text-accent">{Math.min(loadProgress(), COMBOS.length)} / {COMBOS.length} combos completed</p>
          </div>
          <button onClick={handleReset} className="px-3 py-1.5 bg-destructive/80 text-destructive-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="↺" size={12} /> RESET PROGRESS</button>
        </div>

        {/* Character grid — ordered by generation G1→G5, all characters, even locked ones */}
        <div>
          <p className="text-[10px] font-heading text-muted-foreground mb-1.5">SELECT YOUR CHARACTER (any character — ordered by generation)</p>
          <div className="max-h-64 overflow-y-auto p-1 bg-card/50 border border-border rounded-lg space-y-2">
            {ERAS.map(era => {
              const eraChars = getRosterForEra(era.id);
              if (!eraChars.length) return null;
              return (
                <div key={era.id}>
                  <p className="text-[8px] font-heading text-accent/70 px-1 mb-0.5">{era.short} — {era.name}</p>
                  <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
                    {eraChars.map(c => (
                      <button key={c.id} onClick={() => { setSelectedChar(c.id); sfx.click(); }}
                        className={`flex flex-col items-center p-1 rounded border-2 transition ${selectedChar === c.id ? 'border-accent bg-accent/15' : 'border-border/50 hover:border-border'}`}>
                        <div className="rounded-full flex items-center justify-center" style={{ width: 26, height: 26, backgroundColor: c.color, boxShadow: `0 0 4px ${c.color}55` }}>
                          <span className="font-heading text-[10px] font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{(c.name || '?')[0]}</span>
                        </div>
                        <span className="text-[6px] font-heading text-foreground leading-none truncate" style={{ maxWidth: 40 }}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Element selector */}
        <div>
          <p className="text-[10px] font-heading text-muted-foreground mb-1.5">SELECT ELEMENT</p>
          <div className="flex gap-1.5 flex-wrap">
            {ELEMENTS.map(el => (
              <button key={el.id} onClick={() => { setSelectedElement(el.id); sfx.click(); }}
                className={`px-3 py-1.5 rounded font-heading text-xs border-2 ${selectedElement === el.id ? 'border-accent bg-accent/15 text-accent' : 'border-border/50 text-foreground hover:border-border'}`}>
                {el.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected character preview */}
        <div className="bg-card/80 border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ backgroundColor: SORTED_CHARS.find(c => c.id === selectedChar)?.color || '#888', boxShadow: '0 0 8px #7744FF55' }} />
          <div className="flex-1">
            <p className="font-heading text-sm">{SORTED_CHARS.find(c => c.id === selectedChar)?.name}</p>
            <p className="text-[10px] text-muted-foreground">Element: {ELEMENTS.find(e => e.id === selectedElement)?.name || 'Basic'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-heading text-muted-foreground">NEXT COMBO</p>
            <p className="text-xs font-heading text-accent">{COMBOS[loadProgress()]?.name || 'All complete!'}</p>
          </div>
        </div>

        <button onClick={() => { setPhase('fight'); sfx.menuOpen(); }}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-heading text-sm hover:opacity-80 transition">
          START COMBO TRAINING
        </button>
      </div>
    );
  }

  // ── Fight Phase ──
  const currentCombo = COMBOS[comboIndex];
  const timeSinceMove = lastMoveTime > 0 ? Date.now() - lastMoveTime : 0;
  const timerPercent = lastMoveTime > 0 ? Math.max(0, 100 - (timeSinceMove / COMBO_TIMEOUT_MS) * 100) : 100;

  return (
    <div className="relative w-full flex flex-col items-center gap-2">
      {/* Top bar with reset and back */}
      <div className="flex justify-between w-full max-w-[1280px]">
        <button onClick={() => { setPhase('select'); }}
          className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Character Select</button>
        <button onClick={handleReset}
          className="px-3 py-1 bg-destructive/80 text-destructive-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="↺" size={12} /> RESET COMBOS</button>
      </div>

      <div className="relative w-full" style={{ maxWidth: '1280px' }}>
        <PlatformFighter
          p1Char={selectedChar}
          p2Char="corpent"
          p2IsCPU
          gameMode="regular"
          selectedMap="traininggrounds"
          cpuDifficulty="beginner"
          dummy
          dummyAutoRecover={false}
          comboMode
          onMove={handleMove}
          equippedAccessories={equippedAccessories}
          equippedSkins={equippedSkins}
          customCharsData={customCharsData}
          p1Element={selectedElement}
          p2Element="basic"
          onEnd={() => setPhase('select')}
          musicVolume={musicVolume}
          sfxVolume={sfxVolume}
          settings={settings}
          matchTime={0}
        />

        {/* Combo tracker overlay — top right corner */}
        {currentCombo && !completed && (
          <div className="absolute top-3 right-3 z-30 bg-card/95 border-2 border-accent rounded-lg p-3 shadow-2xl" style={{ width: 200 }}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-heading text-[10px] text-accent">COMBO {comboIndex + 1}/{COMBOS.length}</span>
              <span className="text-[8px] font-heading text-muted-foreground">{currentCombo.difficulty.toUpperCase()}</span>
            </div>
            <p className="text-[9px] font-heading text-foreground mb-2 leading-tight">{currentCombo.name}</p>
            <div className="space-y-1">
              {currentCombo.moves.map((move, i) => {
                const done = i < moveIndex;
                const current = i === moveIndex;
                return (
                  <div key={i} className={`flex items-center gap-1.5 px-1.5 py-1 rounded ${current ? 'bg-accent/20 border border-accent/40' : done ? 'opacity-50' : ''}`}>
                    <span className="text-xs" style={{ color: done ? '#44FF88' : current ? 'var(--accent)' : 'var(--muted-foreground)' }}>
                      {done ? '☑' : '☐'}
                    </span>
                    <span className={`text-[10px] font-heading ${done ? 'text-muted-foreground line-through' : current ? 'text-accent font-bold' : 'text-foreground/70'}`}>
                      {move.display}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Timer bar */}
            <div className="mt-2 h-1.5 bg-muted rounded overflow-hidden">
              <div className="h-full rounded transition-all" style={{
                width: `${timerPercent}%`,
                backgroundColor: timerPercent > 50 ? 'var(--accent)' : timerPercent > 20 ? '#FFAA00' : '#FF4444',
              }} />
            </div>
            <p className="text-[7px] text-muted-foreground text-center mt-1">1.5s window between moves</p>
          </div>
        )}

        {/* Completion overlay */}
        {completed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg z-40">
            <div className="text-center">
              <p className="text-4xl font-heading text-accent mb-2">ALL COMBOS COMPLETE!</p>
              <p className="text-sm text-muted-foreground mb-4">You've mastered all {COMBOS.length} combo chains!</p>
              <button onClick={() => { setCompleted(false); setPhase('select'); }}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-80">BACK TO SELECT</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}