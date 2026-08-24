import React, { useState, useEffect, useRef } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import PlatformFighter from './PlatformFighter.jsx';
import GameIcon from "./GameIcon.jsx";

const STEPS = [
  { title: 'Move Around', desc: 'Use the Arrow Keys (or A/D) to walk left and right. Try it now!', check: (k) => k['ArrowLeft'] || k['ArrowRight'] || k['a'] || k['d'] },
  { title: 'Jump', desc: 'Press Up (or W) to jump. You get a double-jump too — press jump again in the air!', check: (k) => k['ArrowUp'] || k['w'] },
  { title: 'Signature Attack', desc: 'Press , (comma) to unleash your signature attack. Add a direction for different sigs!', check: (k) => k[','] || k['v'] },
  { title: 'Heavy Attack', desc: 'Press L to do a heavy attack. Hold Down + L in the air for a Ground Pound!', check: (k) => k['l'] || k['g'] },
  { title: 'Power Button', desc: 'Press . (period) to activate your character\'s unique power. It has a cooldown!', check: (k) => k['.'] || k['c'] },
  { title: 'Sig + Heavy Combo', desc: 'Chain attacks! Press , (sig) then L (heavy) within 1.5 seconds for a combo!', combo: [',', 'l'] },
  { title: 'Aerial Sig', desc: 'Jump (Up/W), then press , (sig) in the air for an aerial attack!', combo: ['ArrowUp', ','] },
  { title: 'Power + Sig Combo', desc: 'Press . (power) then , (sig) within 1.5 seconds to chain your power into an attack!', combo: ['.', ','] },
  { title: 'Super Move', desc: 'When your gold super meter is full, press / to unleash your super move!', check: (k) => k['/'] || k['x'] },
  { title: 'You\'re Ready!', desc: 'You\'ve learned the basics and combos. Go win some battles, hero!', check: () => false, last: true },
];

export default function Tutorial({ onBack }) {
  const [step, setStep] = useState(0);
  const [fighting, setFighting] = useState(false);
  const [done, setDone] = useState([]);
  const keysRef = useRef({});
  const keyTimesRef = useRef({});
  const cur = STEPS[step];

  useEffect(() => {
    const kd = e => { keysRef.current[e.key] = true; keysRef.current[e.key.toLowerCase?.()] = true; keyTimesRef.current[e.key] = Date.now(); keyTimesRef.current[e.key.toLowerCase?.()] = Date.now(); };
    const ku = e => { keysRef.current[e.key] = false; keysRef.current[e.key.toLowerCase?.()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  useEffect(() => {
    if (!fighting || cur.last || done.includes(step)) return;
    const interval = setInterval(() => {
      if (cur.combo) {
        const k1 = cur.combo[0], k2 = cur.combo[1];
        const t1 = keyTimesRef.current[k1] || keyTimesRef.current[k1.toLowerCase?.()];
        const t2 = keyTimesRef.current[k2] || keyTimesRef.current[k2.toLowerCase?.()];
        if (t1 && t2 && Math.abs(t1 - t2) < 1500) {
          setDone(prev => [...prev, step]);
          setTimeout(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 600);
        }
      } else if (cur.check(keysRef.current)) {
        setDone(prev => [...prev, step]);
        setTimeout(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 600);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [fighting, step, done, cur]);

  // Suppress controller menu-nav during active tutorial gameplay so the A button
  // (jump) doesn't accidentally click SKIP/EXIT. The completion overlay re-enables
  // nav so the player can click REPLAY/DONE with the controller.
  useEffect(() => {
    window.__el6GameplayActive = fighting && !cur.last;
    return () => { window.__el6GameplayActive = false; };
  }, [fighting, cur.last]);

  if (fighting) {
    return (
      <div className="w-full flex flex-col items-center gap-2">
        <div className="w-full max-w-[1280px] bg-card border-2 border-accent rounded-xl p-3 mb-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-heading text-accent text-lg">TUTORIAL — Step {step + 1}/{STEPS.length}: {cur.title}</h3>
            <div className="flex gap-2">
              <button onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs">SKIP STEP</button>
              <button onClick={() => setFighting(false)} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs">EXIT</button>
            </div>
          </div>
          <p className="font-body text-foreground/90 text-sm">{cur.desc}</p>
          <div className="flex gap-1 mt-2">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-accent' : i === step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>
        <PlatformFighter
          p1Char={HEROES[0].id} p2Char={VILLAINS[0].id} p2IsCPU
          gameMode="regular" selectedMap="traininggrounds" cpuDifficulty="beginner"
          dummy infiniteSuper
          onEnd={() => setFighting(false)}
        />
        {cur.last && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-card border-2 border-accent rounded-xl p-8 text-center">
              <p className="text-3xl font-heading text-accent mb-4"><GameIcon emoji="🎓" size={14} /> TUTORIAL COMPLETE!</p>
              <p className="text-foreground font-body mb-4">You're ready to fight. Go show them what you've learned!</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setFighting(false); setStep(0); setDone([]); }} className="px-5 py-2 bg-secondary text-secondary-foreground rounded font-heading">REPLAY</button>
                <button onClick={onBack} className="px-5 py-2 bg-primary text-primary-foreground rounded font-heading">DONE</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider">TUTORIAL</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="font-body text-foreground/90 mb-4">Welcome to <span className="font-heading text-accent">The Element 6: Heroes in Color</span>! This tutorial will teach you the basics in a practice arena with a training dummy that won't fight back.</p>
        <p className="font-body text-muted-foreground text-sm mb-4">You'll learn: movement, jumping, signature attacks, heavy attacks, the power button, and super moves. Each step advances automatically once you perform the action.</p>
        <div className="bg-muted/30 rounded-lg p-3 mb-4 text-xs font-body text-foreground/80">
          <p className="font-heading text-primary mb-1">CONTROLS</p>
          <p>Arrows/WASD = move & jump · , = sig · L = heavy · . = power · / = super</p>
        </div>
        <button onClick={() => setFighting(true)} className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading hover:opacity-80">START TUTORIAL</button>
      </div>
    </div>
  );
}