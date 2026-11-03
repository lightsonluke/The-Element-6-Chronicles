import React, { useState, useEffect, useRef } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getActiveEvent, getNextEvent } from './events.js';
import { getAccessory, drawAccessory, isBehindAccessory } from './cosmetics.js';
import { getSkin, RARITY_COLORS } from './skins.js';
import { getKillFX, drawKillFX } from './killFX.js';
import { drawStickman } from './renderer.js';
import { music } from './music.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const MAX_TIERS = 50;
const XP_PER_TIER = 100;
const MULTI_PAL = ['#FF4444', '#FFDD44', '#44FF44', '#4488FF'];

export default function EventsScreen({ onBack, progress, onClaimEventReward, onNavigateEquip }) {
  const [scrollTier, setScrollTier] = useState(0);
  const [now, setNow] = useState(Date.now());
  const timelineRef = useRef(null);

  const activeEvent = getActiveEvent();
  const nextEventInfo = getNextEvent();

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const claimedTiers = progress?.eventProgress?.[activeEvent?.id]?.claimedTiers || [];
  const eventXP = progress?.eventProgress?.[activeEvent?.id]?.xp || 0;
  const battlePassPlus = progress?.battlePassPlus === true;
  const currentTier = battlePassPlus ? MAX_TIERS : Math.min(MAX_TIERS, Math.floor(eventXP / XP_PER_TIER) + 1);
  const xpInTier = eventXP % XP_PER_TIER;

  useEffect(() => {
    if (timelineRef.current && activeEvent) {
      const target = timelineRef.current.children[currentTier - 1];
      if (target) target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeEvent, currentTier]);

  const handleClaim = (tier) => {
    if (claimedTiers.includes(tier) || tier > currentTier) return;
    const reward = activeEvent.battlePass.find(b => b.tier === tier);
    if (!reward) return;
    onClaimEventReward?.(activeEvent.id, tier, reward);
  };

  const handleClaimAll = () => {
    if (!activeEvent?.battlePass) return;
    activeEvent.battlePass.forEach(bp => {
      if (!claimedTiers.includes(bp.tier) && bp.tier <= currentTier) {
        handleClaim(bp.tier);
      }
    });
  };

  const claimableCount = activeEvent?.battlePass?.filter(bp => bp.tier <= currentTier && !claimedTiers.includes(bp.tier)).length || 0;

  // Star characters for the event
  const starChars = (activeEvent?.starCharIds || []).map(id => ALL.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="e6-season-pass-screen">
      <header className="e6-pass-topbar">
        <button type="button" onClick={onBack} className="e6-pass-back"><GameIcon emoji="←" size={17} /> LOBBY</button>
        <div className="e6-pass-brand"><span>ELEMENT 6 / SEASONAL</span><strong>REWARD TRACK</strong></div>
        <div className="e6-pass-actions">
          <button type="button" onClick={() => onNavigateEquip?.()} className="e6-pass-secondary">VIEW COLLECTION <GameIcon emoji="→" size={14} /></button>
          <button type="button" onClick={handleClaimAll} className="e6-pass-claim-all" disabled={!claimableCount}>
            CLAIM AVAILABLE <span>{claimableCount}</span>
          </button>
        </div>
      </header>

      {activeEvent ? <>
        <section className="e6-pass-hero" style={{ '--pass-accent': activeEvent.color || '#d9a441' }}>
          <div className="e6-pass-art"><EventShowcaseCanvas event={activeEvent} starChars={starChars} /><span className="e6-pass-art-tag">LIVE SEASON</span></div>
          <div className="e6-pass-hero-content">
            <div className="e6-pass-eyebrow"><span className="e6-pass-live-dot" /> SEASON REWARDS <span className="e6-pass-divider">/</span> 50 TIERS</div>
            <h1>{activeEvent.name}</h1>
            <p className="e6-pass-summary">Earn Event XP in battle to unlock a new reward every {XP_PER_TIER} XP. Collect your free rewards as you progress.</p>
            {starChars.length > 0 && <p className="e6-pass-featured"><span>FEATURED FIGHTERS</span>{starChars.map(c => c.name).join('  ·  ')}</p>}
            <div className="e6-pass-progress-block">
              <div className="e6-pass-progress-title"><span>YOUR PROGRESS</span><strong>TIER {Math.min(currentTier, MAX_TIERS)} <i>/ {MAX_TIERS}</i></strong></div>
              <div className="e6-pass-progress-track"><span style={{ width: `${battlePassPlus ? 100 : (xpInTier / XP_PER_TIER) * 100}%` }} /></div>
              <div className="e6-pass-progress-foot"><span>{eventXP.toLocaleString()} TOTAL XP</span><span>{battlePassPlus ? 'ALL TIERS UNLOCKED' : `${xpInTier} / ${XP_PER_TIER} XP TO NEXT TIER`}</span></div>
            </div>
            <div className={`e6-pass-premium-status ${battlePassPlus ? 'is-active' : ''}`}>
              <span className="e6-pass-premium-mark">✦</span>
              <div><strong>{battlePassPlus ? 'BATTLE PASS+ ACTIVE' : 'BATTLE PASS+'}</strong><small>{battlePassPlus ? 'Bonus rewards are included when you claim a tier.' : 'Premium rewards are shown on each tier.'}</small></div>
              <span className="e6-pass-premium-state">{battlePassPlus ? 'ACTIVE' : 'PREMIUM'}</span>
            </div>
          </div>
        </section>

        <section className="e6-pass-track-section">
          <div className="e6-pass-section-head">
            <div><span className="e6-pass-section-kicker">THE REWARD ROAD</span><h2>Season track</h2><p>Claim rewards you’ve earned. Milestone tiers bring featured seasonal drops.</p></div>
            <div className="e6-pass-track-tools"><span className="e6-pass-claimed-count"><b>{claimedTiers.length}</b> / {MAX_TIERS} CLAIMED</span>
              <button type="button" onClick={() => { const c = timelineRef.current; if (c) { const t = c.children[Math.max(0, currentTier - 1)]; if (t) t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } }} className="e6-pass-jump">JUMP TO TIER {Math.min(currentTier, MAX_TIERS)} <GameIcon emoji="→" size={13} /></button>
            </div>
          </div>
          <div className="e6-pass-lane-labels"><span>FREE TRACK <small>Available through play</small></span><span className="e6-pass-premium-lane">PREMIUM TRACK <small>{battlePassPlus ? 'Pass active' : 'Bonus tier rewards'}</small></span><span className="e6-pass-tier-guide">TIER</span></div>
          <div className="e6-pass-timeline" ref={timelineRef}>
            {activeEvent.battlePass.map(bp => {
              const claimed = claimedTiers.includes(bp.tier);
              const canClaim = bp.tier <= currentTier && !claimed;
              const isMilestone = bp.tier % 10 === 0;
              const isStar = bp.isStar;
              const isCurrent = bp.tier === currentTier;
              const label = bp.type === 'tokens' ? `${bp.amount} Tokens`
                : bp.type === 'skin' ? bp.item?.name || 'Skin'
                : bp.type === 'allskins' ? bp.name || 'All Skins'
                : bp.type === 'allaccessories' ? bp.name || 'All Accessories'
                : bp.type === 'accessory' ? bp.item?.name || 'Accessory'
                : bp.type === 'character' ? bp.name || bp.charId || 'Character'
                : bp.type === 'killfx' ? bp.item?.name || 'KO Effect'
                : bp.type === 'emote' ? bp.name || 'Emote'
                : bp.name || 'Season Reward';
              const premiumLabel = bp.premiumReward?.type === 'tokens' ? `${bp.premiumReward.amount} Tokens`
                : bp.premiumReward?.type === 'accessory' ? bp.premiumReward.item?.name || 'Accessory'
                : bp.premiumReward?.type === 'killfx' ? bp.premiumReward.item?.name || 'KO Effect'
                : bp.premiumReward?.name || (bp.premiumReward ? 'Bonus Reward' : '');
              return (
                <article key={bp.tier} className={`e6-pass-tier ${claimed ? 'is-claimed' : ''} ${canClaim ? 'is-claimable' : ''} ${isCurrent ? 'is-current' : ''} ${isMilestone ? 'is-milestone' : ''} ${isStar ? 'is-star' : ''}`}>
                  <div className="e6-pass-tier-index"><span>{String(bp.tier).padStart(2, '0')}</span>{isCurrent && <small>CURRENT</small>}</div>
                  <div className="e6-pass-reward-pair">
                    <div className="e6-pass-reward-cell e6-pass-free-cell">
                      <span className="e6-pass-cell-label">FREE</span>
                      <RewardPreview bp={bp} event={activeEvent} />
                      <strong title={label}>{label}</strong>
                      <small>{(bp.type || 'reward').replace(/([A-Z])/g, ' $1').toUpperCase()}{(isMilestone || isStar) && ' · FEATURED'}</small>
                      {claimed ? <span className="e6-pass-reward-status is-done"><GameIcon emoji="✓" size={13} /> CLAIMED</span>
                        : canClaim ? <button type="button" onClick={() => handleClaim(bp.tier)} className="e6-pass-tier-claim">CLAIM FREE</button>
                        : <span className="e6-pass-reward-status"><GameIcon emoji="🔒" size={12} /> TIER {bp.tier}</span>}
                    </div>
                    <div className={`e6-pass-reward-cell e6-pass-bonus-cell ${battlePassPlus ? 'is-unlocked' : ''} ${!bp.premiumReward ? 'is-empty' : ''}`}>
                      <span className="e6-pass-cell-label">✦ PREMIUM</span>
                      {bp.premiumReward ? <>
                        <RewardPreview bp={bp.premiumReward} event={activeEvent} />
                        <strong title={premiumLabel}>{premiumLabel}</strong>
                        <small>{(bp.premiumReward.type || 'bonus reward').toUpperCase()}</small>
                        <span className="e6-pass-reward-status">{battlePassPlus ? 'INCLUDED WITH CLAIM' : <><GameIcon emoji="🔒" size={12} /> BONUS TRACK</>}</span>
                      </> : <><span className="e6-pass-no-reward">—</span><strong>NO BONUS DROP</strong><small>FREE TIER</small><span className="e6-pass-reward-status">FREE REWARD TIER</span></>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <footer className="e6-pass-footnote"><span>✦</span><p><strong>How progression works</strong> Earn Event XP from battles. Every {XP_PER_TIER} XP advances your free track by one tier. Claiming a tier uses the existing reward system; Battle Pass+ adds its bonus reward when active.</p></footer>
      </> : <section className="e6-pass-empty"><span>✦</span><p className="e6-pass-section-kicker">SEASONAL REWARDS</p><h1>No active season</h1><p>There isn’t an active reward track right now. Check back when the next event begins.</p>
        {nextEventInfo?.event && nextEventInfo?.startDate && (() => {
          const diff = Math.max(0, nextEventInfo.startDate.getTime() - now);
          const totalSec = Math.floor(diff / 1000); const days = Math.floor(totalSec / 86400); const hours = Math.floor((totalSec % 86400) / 3600); const mins = Math.floor((totalSec % 3600) / 60); const secs = totalSec % 60;
          return <div className="e6-pass-next-event"><span>NEXT SEASON · {nextEventInfo.event.name}</span><strong>{days}d {String(hours).padStart(2, '0')}h {String(mins).padStart(2, '0')}m {String(secs).padStart(2, '0')}s</strong></div>;
        })()}
      </section>}
    </div>
  );
}

// ── Event showcase canvas — draws a cool event-themed scene with star characters ──
function EventShowcaseCanvas({ event, starChars }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const W = 800, H = 180;
    const loop = () => {
      if (!r) return; f++;
      // Background gradient with event color
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0820');
      bg.addColorStop(0.5, event.color + '22');
      bg.addColorStop(1, '#06040f');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Energy swirl around center
      ctx.save();
      ctx.globalAlpha = 0.15 + Math.sin(f * 0.03) * 0.05;
      const swirl = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 200);
      swirl.addColorStop(0, event.color + '66');
      swirl.addColorStop(0.5, event.color + '22');
      swirl.addColorStop(1, 'transparent');
      ctx.fillStyle = swirl; ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Particle effects
      for (let i = 0; i < 30; i++) {
        const px = (i * 27 + f * 0.5) % W;
        const py = (i * 19 + Math.sin(f * 0.05 + i) * 10) % H;
        ctx.fillStyle = event.color + '44';
        ctx.beginPath(); ctx.arc(px, py, 1 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }

      // Energy rays
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.translate(W / 2, H / 2);
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6 + f * 0.002);
        ctx.fillStyle = event.color;
        ctx.fillRect(-2, -100, 4, 200);
      }
      ctx.restore();

      // Draw star characters
      const charCount = Math.max(2, starChars.length);
      const spacing = W / (charCount + 1);
      starChars.slice(0, 3).forEach((char, idx) => {
        const cx = spacing * (idx + 1);
        const cy = H - 30;
        // Glow under character
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(f * 0.08 + idx) * 0.1;
        const charGlow = ctx.createRadialGradient(cx, cy - 40, 10, cx, cy - 40, 60);
        charGlow.addColorStop(0, char.color + 'AA');
        charGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = charGlow; ctx.fillRect(cx - 60, cy - 100, 120, 120);
        ctx.restore();

        // Draw character
        ctx.save();
        ctx.shadowColor = event.color; ctx.shadowBlur = 15;
        drawStickman(ctx, cx, cy, char.color, idx % 2 === 0 ? 1 : -1, f, 1.1, char.isSpirit, 'idle', char);
        ctx.restore();

        // Star label
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
        ctx.font = 'bold 14px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', cx, cy - 100);
        ctx.fillStyle = char.color;
        ctx.font = 'bold 11px Orbitron';
        ctx.fillText(char.name, cx, cy - 115);
        ctx.restore();
      });

      // Event title text
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = event.color; ctx.shadowBlur = 20;
      ctx.font = 'bold 24px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(event.name, W / 2, 30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = event.color;
      ctx.font = '10px Orbitron';
      ctx.fillText('BATTLE PASS', W / 2, 46);
      ctx.restore();

      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [event, starChars]);
  return <canvas ref={ref} width={800} height={180} className="w-full" style={{ maxWidth: '800px' }} />;
}

function RewardPreview({ bp, event }) {
  const ref = useRef(null);
  const frameRef = useRef(0);
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { rootMargin: '80px', threshold: 0.01 });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const c = ref.current; if (!c || !isVisible) return undefined;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 48, 48);
      ctx.fillStyle = '#111128'; ctx.fillRect(0, 0, 48, 48);
      if (bp.type === 'tokens') {
        ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(24, 24, 12, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#000'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('◆', 24, 28);
      } else if (bp.type === 'skin' && bp.item) {
        const skinColor = bp.item.color;
        // Draw mini character preview
        const char = ALL.find(c => c.id === bp.item.charId) || ALL[0];
        if (bp.item.customParts) {
          bp.item.customParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 24, 40, p.type, p.color, f, 0.3, char.id));
        }
        drawStickman(ctx, 24, 40, skinColor || char.color, 1, f, 0.3, char.isSpirit, 'idle', char);
        if (bp.item.customParts) {
          bp.item.customParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 24, 40, p.type, p.color, f, 0.3, char.id));
        }
        if (bp.isStar) {
          ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
          ctx.fillText('★', 40, 12);
        }
      } else if (bp.type === 'accessory' && bp.item) {
        drawAccessory(ctx, 24, 36, bp.item.type, bp.item.color, f, 0.4, '');
      } else if (bp.type === 'character') {
        // Draw a mini character silhouette
        const char = ALL.find(c => c.id === bp.charId) || ALL[0];
        drawStickman(ctx, 24, 40, char.color, 1, f, 0.3, char.isSpirit, 'idle', char);
      } else if (bp.type === 'allaccessories') {
        // Draw a rainbow of accessory icons
        for (let j = 0; j < 4; j++) {
          const ax = 12 + j * 8, ay = 36;
          drawAccessory(ctx, ax, ay, 'aura', MULTI_PAL[j], f, 0.25, '');
        }
      } else if (bp.type === 'killfx' && bp.item) {
        const progress = (f % 60) / 60;
        drawKillFX(ctx, 24, 40, bp.item.baseFxId, progress, event.color, f);
      } else if (bp.type === 'emote') {
        // Draw a mini character doing a pose with emote label
        ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 6;
        ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('💃', 24, 30);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 6px Orbitron';
        ctx.fillText((bp.name || 'EMOTE').substring(0, 8).toUpperCase(), 24, 42);
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; cancelAnimationFrame(frameRef.current); };
  }, [bp, event, isVisible]);
  return <canvas ref={ref} width={48} height={48} className="rounded flex-shrink-0" />;
}
