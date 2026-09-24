import React, { useState, useEffect, useRef } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import PlatformFighter from './PlatformFighter.jsx';
import GameIcon from "./GameIcon.jsx";

const STEPS = [
  { section: 'MOVEMENT', title: 'Move Around', desc: 'Use the Arrow Keys (or A/D) to walk left and right. Move around the arena until you are comfortable with your ground movement.', check: (k) => k['ArrowLeft'] || k['ArrowRight'] || k['a'] || k['d'] },
  { section: 'MOVEMENT', title: 'Jump and Double-Jump', desc: 'Press Up (or W) to jump. Press jump again while airborne to use your second jump and recover to the stage.', check: (k) => k['ArrowUp'] || k['w'] },
  { section: 'MOVEMENT', title: 'Fast-Fall', desc: 'While airborne, press Down/S to fall faster. Fast-falls help you land sooner and change the timing of aerial attacks.', check: (k) => k['ArrowDown'] || k['s'] },
  { section: 'MOVEMENT', title: 'Dash', desc: 'Double-tap LEFT or RIGHT quickly to dash. Dashes are your fast ground movement option.', special: 'dash' },
  { section: 'MOVEMENT', title: 'Air Dodge', desc: 'While airborne, double-tap a direction to perform an air dodge. Use it to reposition and avoid attacks.', special: 'airDodge' },
  { section: 'MOVEMENT', title: 'Wall Slide', desc: 'Jump beside a tall solid wall and hold toward it while falling. You will slide instead of simply dropping past the wall.', special: 'wallSlide' },
  { section: 'COMBAT', title: 'Signature Attacks', desc: 'Press , (comma) to use your signature attack. Direction changes which signature you perform, so practice LEFT, RIGHT, UP, and DOWN inputs.', check: (k) => k[','] || k['v'] },
  { section: 'COMBAT', title: 'Aerial Signature', desc: 'Jump into the air and press , to use your aerial signature. Aerial attacks are important for catching opponents above or beside you.', combo: ['ArrowUp', ','] },
  { section: 'COMBAT', title: 'Heavy Attack', desc: 'Press L to use your heavy attack. Heavy attacks generally launch opponents farther than signatures.', check: (k) => k['l'] || k['g'] },
  { section: 'COMBAT', title: 'Ground Pound', desc: 'While airborne, hold Down/S and press L. This sends your fighter downward and is useful for attacking opponents beneath you.', combo: ['ArrowDown', 'l'] },
  { section: 'COMBAT', title: 'Power', desc: 'Press . (period) to activate your character\'s unique power. Every character has a different power and it uses a cooldown.', check: (k) => k['.'] || k['c'] },
  { section: 'COMBAT', title: 'Power Into Attack', desc: 'Use your power and then immediately follow with a signature. Learning how your character\'s power creates openings is part of mastering that character.', combo: ['.', ','] },
  { section: 'COMBAT', title: 'Build Your Super', desc: 'The tutorial keeps your super available so you can learn how the gold meter and Super Move work. Watch the meter, then use the Super Move lesson next.', info: true, wait: 900 },
  { section: 'COMBAT', title: 'Super Move', desc: 'When the gold super meter is full, press / to unleash your character\'s super move.', check: (k) => k['/'] || k['x'] },
  { section: 'COMBAT', title: 'Combo Timing', desc: 'Chain a signature into a heavy within about 1.5 seconds. The goal is to make your next attack connect before the opponent can recover.', combo: [',', 'l'] },
  { section: 'DEFENSE', title: 'Avoid Attacks', desc: 'Use jumps, dashes, air dodges, and wall movement to avoid the dummy. Defense is not just blocking damage — it is controlling where you are.', info: true, wait: 1200 },
  { section: 'DEFENSE', title: 'Recover to the Stage', desc: 'If you are knocked away, use your double-jump, directional movement, air dodge, and attacks to return to a platform instead of falling past the blast zone.', info: true, wait: 1200 },
  { section: 'DEFENSE', title: 'Understand Damage and Knockback', desc: 'Damage makes future hits launch you farther. Watch how the dummy moves after different attacks and learn which moves are better for starting combos versus finishing stocks.', info: true, wait: 1300 },
  { section: 'MATCHES', title: 'Win by Ring-Out', desc: 'In a normal fight, the objective is to knock the opponent outside the stage blast zone while keeping yourself alive. Positioning matters as much as damage.', info: true, wait: 1200 },
  { section: 'MATCHES', title: 'Stocks and Respawning', desc: 'When a fighter is knocked out, they lose a stock and return to the stage until their stocks are gone. The last fighter with a stock wins.', info: true, wait: 1200 },
  { section: 'MATCHES', title: 'Stage Awareness', desc: 'Platforms and stage layouts change how fighters move and attack. Learn to fight on the ground, above platforms, and near the edges.', info: true, wait: 1200 },
  { section: 'CHARACTERS', title: 'Every Character Is Different', desc: 'Your selected character changes attacks, power, super, movement feel, and strategy. Use Training Mode to test a character before committing to a match.', info: true, wait: 1200 },
  { section: 'CHARACTERS', title: 'Training Mode', desc: 'Training Mode gives you a dummy, damage reset, position reset, frame stepping, bot behavior options, and character/stage controls. Use it to learn exact interactions.', info: true, wait: 1400 },
  { section: 'ONLINE', title: 'Ranked and Unranked', desc: 'Online Ranked uses matchmaking and server-verified rating. Unranked is for online fights without Ranked rating consequences. Choose the mode that matches what you want to practice.', info: true, wait: 1400 },
  { section: 'ONLINE', title: 'Training While Ranked Matchmaking', desc: 'In Settings, you can choose Training While Searching. Your selected Ranked fighter can practice in Training Mode while matchmaking runs; when an opponent is found, the practice ends and the Ranked match begins.', info: true, wait: 1500 },
  { section: 'FINISH', title: 'You\'re Ready!', desc: 'You now know movement, attacks, powers, supers, recovery, knockback, stocks, stages, Training Mode, and the basic online modes. Keep experimenting — mastery comes from learning what your character can do.', check: () => false, last: true },
];

export default function Tutorial({ onBack }) {
  const [step, setStep] = useState(0);
  const [fighting, setFighting] = useState(false);
  const [done, setDone] = useState([]);
  const keysRef = useRef({});
  const keyTimesRef = useRef({});
  const movementRef = useRef({ dash: 0, airDodge: 0, wallSlide: 0, lastTap: {}, wallFrames: 0 });
  const infoStartedRef = useRef(Date.now());
  const cur = STEPS[step];
  useEffect(() => { infoStartedRef.current = Date.now(); }, [step]);

  useEffect(() => {
    const kd = e => {
      const now = Date.now();
      keysRef.current[e.key] = true; keysRef.current[e.key.toLowerCase?.()] = true;
      keyTimesRef.current[e.key] = now; keyTimesRef.current[e.key.toLowerCase?.()] = now;
      const k = e.key.toLowerCase();
      if (['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s'].includes(k)) {
        const prev = movementRef.current.lastTap[k] || 0;
        if (now - prev <= 240) {
          if (k === 'arrowleft' || k === 'arrowright' || k === 'a' || k === 'd') movementRef.current.dash++;
          else movementRef.current.airDodge++;
        }
        movementRef.current.lastTap[k] = now;
      }
    };
    const ku = e => { keysRef.current[e.key] = false; keysRef.current[e.key.toLowerCase?.()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  useEffect(() => {
    if (!fighting || cur.last || done.includes(step)) return;
    const interval = setInterval(() => {
      if (cur.info) {
        const wait = Number(cur.wait || 1000);
        if (Date.now() - infoStartedRef.current >= wait) {
          setDone(prev => [...prev, step]);
          setTimeout(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 350);
        }
      } else if (cur.special) {
        const m = movementRef.current;
        if (cur.special === 'dash' && m.dash > 0) {
          setDone(prev => [...prev, step]);
          setTimeout(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 600);
        } else if (cur.special === 'airDodge' && m.airDodge > 0) {
          setDone(prev => [...prev, step]);
          setTimeout(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 600);
        } else if (cur.special === 'wallSlide' && (keysRef.current.ArrowLeft || keysRef.current.ArrowRight || keysRef.current.a || keysRef.current.d)) {
          m.wallFrames++;
          if (m.wallFrames >= 8) {
            setDone(prev => [...prev, step]);
            setTimeout(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 600);
          }
        }
      } else if (cur.combo) {
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
            <div><div className="text-[9px] font-heading text-primary tracking-widest">{cur.section}</div><h3 className="font-heading text-accent text-lg">TUTORIAL — Step {step + 1}/{STEPS.length}: {cur.title}</h3></div>
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
        <p className="font-body text-foreground/90 mb-4">Welcome to <span className="font-heading text-accent">The Element 6: Heroes in Color</span>! This tutorial is a guided course through the core systems of The Element 6, from movement and combat to recovery, match rules, Training Mode, and online matchmaking.</p>
        <p className="font-body text-muted-foreground text-sm mb-4">Core mechanics are hands-on; system lessons pause long enough for you to read what the mechanic does. Follow the lessons in order, or skip a step if you already know it.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-[10px] font-heading"><div className="bg-muted/30 rounded p-2">MOVEMENT<br/><span className="font-body text-muted-foreground">Walk • Jump • Dash • Air Dodge • Wall Slide</span></div><div className="bg-muted/30 rounded p-2">COMBAT<br/><span className="font-body text-muted-foreground">Signatures • Heavies • Powers • Super</span></div><div className="bg-muted/30 rounded p-2">DEFENSE<br/><span className="font-body text-muted-foreground">Dodging • Recovery • Knockback</span></div><div className="bg-muted/30 rounded p-2">GAME SYSTEMS<br/><span className="font-body text-muted-foreground">Stocks • Stages • Training • Online</span></div></div>
        <div className="bg-muted/30 rounded-lg p-3 mb-4 text-xs font-body text-foreground/80">
          <p className="font-heading text-primary mb-1">CONTROLS</p>
          <p>Arrows/WASD = move & jump · Double-tap LEFT/RIGHT = dash · Double-tap a direction in air = air dodge · Hold toward a wall while falling = wall slide · , = sig · L = heavy · . = power · / = super</p>
        </div>
        <button onClick={() => setFighting(true)} className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading hover:opacity-80">START TUTORIAL</button>
      </div>
    </div>
  );
}