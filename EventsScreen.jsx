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

  // Star characters for the event
  const starChars = (activeEvent?.starCharIds || []).map(id => ALL.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="w-full max-w-5xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading tracking-wider" style={{ color: activeEvent?.color || 'var(--accent)' }}>BATTLE PASS</h2>
          <p className="text-xs text-muted-foreground font-body">{activeEvent?.name} — Earn XP from battles to climb 50 tiers!</p>
          {battlePassPlus && <p className="text-[10px] font-heading text-accent mt-1"><GameIcon emoji="⭐" size={14} /> BATTLE PASS+ ACTIVE — All tiers unlocked!</p>}
          {nextEventInfo?.event && nextEventInfo?.startDate && (() => {
            const diff = Math.max(0, nextEventInfo.startDate.getTime() - now);
            const totalSec = Math.floor(diff / 1000);
            const days = Math.floor(totalSec / 86400);
            const hours = Math.floor((totalSec % 86400) / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;
            const months = Math.floor(days / 30);
            const remDays = days % 30;
            return (
              <div className="mt-2 inline-flex flex-col gap-0.5 bg-card/60 border border-border rounded-lg px-3 py-1.5">
                <p className="text-[9px] font-heading" style={{ color: nextEventInfo.event.color }}>
                  NEXT: {nextEventInfo.event.name}
                </p>
                <p className="text-[10px] font-heading text-foreground tabular-nums">
                  {months > 0 && `${months}mo `}{remDays}d {String(hours).padStart(2,'0')}h {String(mins).padStart(2,'0')}m {String(secs).padStart(2,'0')}s
                </p>
              </div>
            );
          })()}
        </div>
        <div className="flex gap-2">
          <button onClick={handleClaimAll} className="px-3 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-80">CLAIM ALL</button>
          <button onClick={() => onNavigateEquip?.()} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-80">EQUIP <GameIcon emoji="→" size={14} /></button>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>

      {/* Active event banner with star character showcase */}
      {activeEvent && (
        <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: activeEvent.color + '66' }}>
          <EventShowcaseCanvas event={activeEvent} starChars={starChars} />
          <div className="p-4 flex items-center gap-4" style={{ background: `linear-gradient(135deg, ${activeEvent.color}15 0%, #0a0b16 70%)` }}>
            <div className="flex-1">
              <p className="text-[8px] font-heading text-muted-foreground uppercase">ACTIVE EVENT</p>
              <p className="font-heading text-lg" style={{ color: activeEvent.color }}>{activeEvent.name}</p>
              {starChars.length > 0 && (
                <p className="text-[9px] text-muted-foreground font-body">Stars: {starChars.map(c => c.name).join(' & ')} — exclusive star skins in the pass!</p>
              )}
              <p className="text-[9px] text-muted-foreground font-body mt-1">Tier {currentTier}/{MAX_TIERS} • {eventXP} XP earned • {xpInTier}/{XP_PER_TIER} to next tier</p>
            </div>
            <div className="w-40">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(xpInTier / XP_PER_TIER) * 100}%`, backgroundColor: activeEvent.color }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[7px] text-muted-foreground">{xpInTier} XP</span>
                <span className="text-[7px] text-muted-foreground">{XP_PER_TIER} XP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier rewards — horizontal scrollable timeline */}
      {activeEvent && (
        <div className="bg-card/80 border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-heading text-accent">{(activeEvent.name || 'EVENT').toUpperCase()} — 50 TIER TIMELINE</p>
            <div className="flex gap-2 items-center">
              <p className="text-[9px] text-muted-foreground">{claimedTiers.length}/{MAX_TIERS} claimed</p>
              <button onClick={() => {
                const c = timelineRef.current;
                if (c) { const t = c.children[currentTier - 1]; if (t) t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }
              }} className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[8px] font-heading hover:bg-primary/30">JUMP TO CURRENT</button>
            </div>
          </div>
          <div ref={timelineRef} className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'thin' }}>
            {activeEvent.battlePass.map(bp => {
              const claimed = claimedTiers.includes(bp.tier);
              const canClaim = bp.tier <= currentTier && !claimed;
              const isMilestone = bp.tier % 10 === 0;
              const isStar = bp.isStar;
              const isCurrent = bp.tier === currentTier;
              const rewardLabel = bp.type === 'tokens' ? `${bp.amount} ◆`
                : bp.type === 'skin' ? `${bp.item?.name || 'Skin'}`
                : bp.type === 'allskins' ? `${bp.name || 'All Skins'} ★`
                : bp.type === 'allaccessories' ? `${bp.name || 'All Accessories'} ★`
                : bp.type === 'accessory' ? `${bp.item?.name || 'Gear'}`
                : bp.type === 'character' ? `${bp.name || bp.charId || 'Character'}`
                : bp.type === 'killfx' ? `${bp.item?.name || 'Kill FX'}`
                : bp.type === 'emote' ? `${bp.name || 'Emote'} 💃`
                : 'Reward';
              return (
                <div key={bp.tier} className={`flex-shrink-0 w-28 rounded-lg p-2 border-2 flex flex-col items-center gap-1 ${claimed ? 'border-green-600 opacity-60' : canClaim ? 'border-accent' : 'border-border opacity-50'} ${isMilestone ? 'bg-accent/5' : ''} ${isStar ? 'bg-accent/10' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-sm flex-shrink-0"
                    style={{ backgroundColor: (isStar ? '#FFD700' : activeEvent.color) + '22', color: isStar ? '#FFD700' : activeEvent.color }}>
                    {bp.tier}
                  </div>
                  <RewardPreview bp={bp} event={activeEvent} />
                  <p className="text-[8px] font-heading text-foreground text-center truncate w-full">{rewardLabel}</p>
                  <p className="text-[6px] text-muted-foreground text-center">
                    {(bp.type || 'reward').toUpperCase()}
                    {isMilestone && ' ★'}
                    {isStar && ' ★'}
                  </p>
                  {claimed ? (
                    <span className="text-[9px] text-green-500 font-heading"><GameIcon emoji="✓" size={14} /></span>
                  ) : canClaim ? (
                    <button onClick={() => handleClaim(bp.tier)} className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-[7px] font-heading hover:opacity-80">CLAIM</button>
                  ) : (
                    <span className="text-[6px] text-muted-foreground"><GameIcon emoji="🔒" size={14} /></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-card/60 border border-border rounded-xl p-3">
        <p className="text-[9px] font-heading text-accent mb-1">HOW THE 50-TIER BATTLE PASS WORKS</p>
        <p className="text-[10px] text-muted-foreground font-body">• Win battles to earn Event XP — each 100 XP unlocks the next tier</p>
        <p className="text-[10px] text-muted-foreground font-body">• Tiers reward cool multi-colored accessories, kill FX, tokens, and up to 20 character unlocks!</p>
        <p className="text-[10px] text-muted-foreground font-body">• Milestone tiers (10, 20, 30, 40) unlock exclusive STAR accessories!</p>
        <p className="text-[10px] text-muted-foreground font-body">• Tier 50 unlocks the ultimate all-accessory legendary pack!</p>
        <p className="text-[10px] text-muted-foreground font-body">• Event items never appear in the shop — only earnable during the event!</p>
      </div>
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
  useEffect(() => {
    const c = ref.current; if (!c) return;
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
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [bp, event]);
  return <canvas ref={ref} width={48} height={48} className="rounded flex-shrink-0" />;
}