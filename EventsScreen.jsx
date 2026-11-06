import React, { useState, useEffect, useRef } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getActiveEvent, getNextEvent } from './events.js';
import { BATTLE_PASSES_2027, HOLIDAY_EVENTS_2027, getActive2027BattlePass, getActive2027Holiday, SEASON_2027_TIER_COUNT, SEASON_2027_XP_PER_TIER } from './season2027.js';
import { getAccessory, drawAccessory, isBehindAccessory } from './cosmetics.js';
import { getSkin, RARITY_COLORS } from './skins.js';
import { getKillFX, drawKillFX } from './killFX.js';
import { getShikigami } from './shikigami.js';
import { drawStickman } from './renderer.js';
import { getMovementTrail, drawMovementTrail } from './movementTrails.js';
import { music } from './music.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const MAX_TIERS = SEASON_2027_TIER_COUNT;
const XP_PER_TIER = SEASON_2027_XP_PER_TIER;
const MULTI_PAL = ['#FF4444', '#FFDD44', '#44FF44', '#4488FF'];
const SEASON_PASS_BANNERS = {
  'Frost & Found': 'frost-found.svg',
  'Six Feet Under: Yokai Rising': 'yokai-rising.svg',
  'Petal to the Metal': 'petal-metal.svg',
  "Six O'Clock Somewhere": 'six-oclock.svg',
  'Out of This Element': 'out-of-element.svg',
  'The Sixth Eclipse': 'sixth-eclipse.svg',
};
const EVENT_ACCENTS_2027 = {
  'frost-found-2027': '#78C9EA',
  'yokai-rising-2027': '#D28ABF',
  'petal-metal-2027': '#F08EAA',
  'six-oclock-2027': '#F4B64B',
  'out-of-this-element-2027': '#9D7BFA',
  'sixth-eclipse-2027': '#E65768',
  'new-year-2027': '#D8B45F',
  'love-at-first-fight': '#E987A9',
  'luck-of-the-sixth': '#59B879',
  'egg-stinction-event': '#E6A774',
  'elemental-prank': '#F2B738',
  'planet-of-the-elements': '#6C9B61',
  'trick-or-beatdown': '#CE713E',
  'living-chronicles': '#E08A3B',
  'thanks-for-the-elements': '#CB9B44',
  'winter-wonderland': '#83C8E8',
  'new-year-2028': '#D8B45F',
};

export default function EventsScreen({ onBack, progress, onClaimEventReward, onNavigateEquip }) {
  const [scrollTier, setScrollTier] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [selectedTrack, setSelectedTrack] = useState('pass');
  const [claimingTiers, setClaimingTiers] = useState([]);
  const [claimError, setClaimError] = useState('');
  const timelineRef = useRef(null);

  const date = new Date(now);
  const battlePassPlus = progress?.battlePassPlus === true;
  const pass2027 = getActive2027BattlePass(date);
  const holiday2027 = getActive2027Holiday(date);
  const legacyEvent = getActiveEvent();
  const normalizeTrack = event => event ? ({
    ...event,
    color: event.color || EVENT_ACCENTS_2027[event.id] || '#A77AE8',
    battlePass: event.rewards.map(reward => ({
      ...reward,
      item: { id: reward.id, name: reward.name, type: reward.type === 'accessory' ? getAccessory(reward.id)?.type : reward.type, baseFxId: reward.id },
    })),
    starCharIds: [],
    is2027: true,
  }) : null;
  const uses2027Calendar = date.getUTCFullYear() === 2027 || (date.getUTCFullYear() === 2028 && date.getUTCMonth() === 0 && date.getUTCDate() <= 3);
  const seasonTrack = normalizeTrack(pass2027) || (uses2027Calendar || holiday2027 ? null : legacyEvent);
  const holidayTrack = normalizeTrack(holiday2027);
  const activeEvent = selectedTrack === 'holiday' && holidayTrack ? holidayTrack : seasonTrack || holidayTrack;
  const isHolidayTrack = activeEvent?.kind === 'holiday';
  const passIsUnlocked = !activeEvent?.is2027 && !isHolidayTrack && battlePassPlus;
  const xpPerTier = activeEvent?.is2027 ? XP_PER_TIER : 100;
  const tierCount = activeEvent?.is2027 ? MAX_TIERS : (activeEvent?.battlePass?.length || MAX_TIERS);
  const upcoming2027 = [...BATTLE_PASSES_2027, ...HOLIDAY_EVENTS_2027]
    .filter(event => Date.parse(event.startAt) > now)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0];
  const nextEventInfo = uses2027Calendar
    ? { event: upcoming2027, startDate: upcoming2027 ? new Date(upcoming2027.startAt) : null }
    : getNextEvent();
  const bannerName = activeEvent?.banner?.split('/').pop() || SEASON_PASS_BANNERS[activeEvent?.name];
  const seasonBanner = bannerName
    ? `${import.meta.env.BASE_URL}assets/battle-passes/2027/${bannerName}`
    : null;

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const claimedTiers = progress?.eventProgress?.[activeEvent?.id]?.claimedTiers || [];
  const eventXP = progress?.eventProgress?.[activeEvent?.id]?.xp || 0;
  const currentTier = passIsUnlocked ? tierCount : Math.min(
    tierCount,
    Math.floor(eventXP / xpPerTier) + (activeEvent?.is2027 ? 0 : 1),
  );
  const xpInTier = eventXP % xpPerTier;
  const trackComplete = currentTier >= tierCount;
  const displayTier = Math.max(1, currentTier);
  const progressPercent = passIsUnlocked || trackComplete ? 100 : (xpInTier / xpPerTier) * 100;

  useEffect(() => {
    if (timelineRef.current && activeEvent) {
      const target = timelineRef.current.children[currentTier - 1];
      if (target) target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeEvent, currentTier]);

  const handleClaim = async (tier) => {
    if (claimedTiers.includes(tier) || tier > currentTier) return;
    const reward = activeEvent.battlePass.find(b => b.tier === tier);
    if (!reward) return;
    if (claimingTiers.includes(tier)) return;
    setClaimingTiers(current => [...current, tier]);
    setClaimError('');
    try {
      if (typeof onClaimEventReward !== 'function') throw new Error('Reward claiming is unavailable right now. Your progress has not changed.');
      await onClaimEventReward(activeEvent.id, tier);
    } catch (error) { setClaimError(error?.message || 'The reward could not be claimed. Try again.'); }
    finally { setClaimingTiers(current => current.filter(value => value !== tier)); }
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
        <button type="button" onClick={onBack} className="e6-pass-back"><GameIcon icon="info" size={17} /> LOBBY</button>
        <div className="e6-pass-brand"><span>ELEMENT 6 / SEASONAL</span><strong>REWARD TRACK</strong></div>
        <div className="e6-pass-actions">
          <button type="button" onClick={() => onNavigateEquip?.()} className="e6-pass-secondary">VIEW COLLECTION <GameIcon icon="arrowRight" size={14} /></button>
          <button type="button" onClick={handleClaimAll} className="e6-pass-claim-all" disabled={!claimableCount}>
            CLAIM AVAILABLE <span>{claimableCount}</span>
          </button>
        </div>
      </header>

      {activeEvent ? <>
        {seasonTrack && holidayTrack && <nav className="e6-pass-track-tabs" aria-label="Reward tracks">
          <button type="button" aria-pressed={!isHolidayTrack} onClick={() => { setSelectedTrack('pass'); setClaimError(''); }} className={!isHolidayTrack ? 'is-active' : ''}>
            2027 BATTLE PASS <small>{seasonTrack.name}</small>
          </button>
          <button type="button" aria-pressed={isHolidayTrack} onClick={() => { setSelectedTrack('holiday'); setClaimError(''); }} className={isHolidayTrack ? 'is-active' : ''}>
            HOLIDAY EVENT <small>{holidayTrack.name}</small>
          </button>
        </nav>}
        <section className="e6-pass-hero" style={{ '--pass-accent': activeEvent.color || '#d9a441' }}>
          <div className="e6-pass-art"><EventShowcaseCanvas event={activeEvent} starChars={starChars} bannerImage={seasonBanner} />{!seasonBanner && <span className="e6-pass-art-tag">LIVE SEASON</span>}</div>
          <div className="e6-pass-hero-content">
            <div className="e6-pass-eyebrow"><span className="e6-pass-live-dot" /> {isHolidayTrack ? 'LIMITED EVENT' : 'SEASON REWARDS'} <span className="e6-pass-divider">/</span> {tierCount} {isHolidayTrack ? 'REWARDS' : 'TIERS'}</div>
            <h1>{activeEvent.name}</h1>
            <p className="e6-pass-summary">{activeEvent.is2027 ? `Earn Event XP in battle to unlock a reward every ${xpPerTier.toLocaleString()} XP. ${isHolidayTrack ? 'This limited event runs alongside the Battle Pass.' : 'Progress continues while holiday events are active.'}` : `Earn Event XP in battle to unlock a new reward every ${xpPerTier} XP. Collect your rewards as you progress.`}</p>
            {starChars.length > 0 && <p className="e6-pass-featured"><span>FEATURED FIGHTERS</span>{starChars.map(c => c.name).join('  ·  ')}</p>}
            <div className="e6-pass-progress-block">
              <div className="e6-pass-progress-title"><span>YOUR PROGRESS</span><strong>TIER {displayTier} <i>/ {tierCount}</i></strong></div>
              <div className="e6-pass-progress-track"><span style={{ width: `${progressPercent}%` }} /></div>
              <div className="e6-pass-progress-foot"><span>{eventXP.toLocaleString()} TOTAL XP</span><span>{passIsUnlocked ? 'ALL TIERS UNLOCKED' : trackComplete ? 'TRACK COMPLETE' : `${xpInTier} / ${xpPerTier} XP TO NEXT TIER`}</span></div>
            </div>
            {!isHolidayTrack && !activeEvent.is2027 && <div className={`e6-pass-premium-status ${battlePassPlus ? 'is-active' : ''}`}>
              <span className="e6-pass-premium-mark"></span>
              <div><strong>{battlePassPlus ? 'BATTLE PASS+ ACTIVE' : 'BATTLE PASS+'}</strong><small>{battlePassPlus ? 'Bonus rewards are included when you claim a tier.' : 'Premium rewards are shown on each tier.'}</small></div>
              <span className="e6-pass-premium-state">{battlePassPlus ? 'ACTIVE' : 'PREMIUM'}</span>
            </div>}
          </div>
        </section>

        <section className="e6-pass-track-section">
          {claimError && <p className="e6-pass-claim-error" role="alert">{claimError}</p>}
          <div className="e6-pass-section-head">
            <div><span className="e6-pass-section-kicker">{isHolidayTrack ? 'LIMITED-TIME TRACK' : 'THE REWARD ROAD'}</span><h2>{isHolidayTrack ? 'Holiday rewards' : 'Season track'}</h2><p>{isHolidayTrack ? 'Progress this event while your Battle Pass continues.' : 'Claim rewards you’ve earned. Milestone tiers bring featured seasonal drops.'}</p></div>
            <div className="e6-pass-track-tools"><span className="e6-pass-claimed-count"><b>{claimedTiers.length}</b> / {tierCount} CLAIMED</span>
              <button type="button" onClick={() => { const c = timelineRef.current; if (c) { const t = c.children[Math.max(0, displayTier - 1)]; if (t) t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } }} className="e6-pass-jump">JUMP TO {isHolidayTrack ? 'REWARD' : 'TIER'} {displayTier} <GameIcon icon="arrowRight" size={13} /></button>
            </div>
          </div>
          <div className="e6-pass-lane-labels"><span>{isHolidayTrack ? 'EVENT REWARDS' : activeEvent.is2027 ? 'REWARD TRACK' : 'FREE TRACK'} <small>{isHolidayTrack ? 'Limited time' : 'Available through play'}</small></span>{!isHolidayTrack && !activeEvent.is2027 && <span className="e6-pass-premium-lane">PREMIUM TRACK <small>{battlePassPlus ? 'Pass active' : 'Bonus tier rewards'}</small></span>}<span className="e6-pass-tier-guide">TIER</span></div>
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
                      <span className="e6-pass-cell-label">{isHolidayTrack ? 'EVENT' : activeEvent.is2027 ? 'REWARD' : 'FREE'}</span>
                      <RewardPreview bp={bp} event={activeEvent} />
                      <strong title={label}>{label}</strong>
                      <small>{(bp.type || 'reward').replace(/([A-Z])/g, ' $1').toUpperCase()}{(isMilestone || isStar) && ' · FEATURED'}</small>
                      {claimed ? <span className="e6-pass-reward-status is-done"><GameIcon icon="check" size={13} /> CLAIMED</span>
                        : canClaim ? <button type="button" onClick={() => handleClaim(bp.tier)} className="e6-pass-tier-claim" disabled={claimingTiers.includes(bp.tier)}>{claimingTiers.includes(bp.tier) ? 'CLAIMING…' : 'CLAIM'}</button>
                        : <span className="e6-pass-reward-status"><GameIcon icon="lock" size={12} /> TIER {bp.tier}</span>}
                    </div>
                    {!isHolidayTrack && !activeEvent.is2027 && <div className={`e6-pass-reward-cell e6-pass-bonus-cell ${battlePassPlus ? 'is-unlocked' : ''} ${!bp.premiumReward ? 'is-empty' : ''}`}>
                      <span className="e6-pass-cell-label"> PREMIUM</span>
                      {bp.premiumReward ? <>
                        <RewardPreview bp={bp.premiumReward} event={activeEvent} />
                        <strong title={premiumLabel}>{premiumLabel}</strong>
                        <small>{(bp.premiumReward.type || 'bonus reward').toUpperCase()}</small>
                        <span className="e6-pass-reward-status">{battlePassPlus ? 'INCLUDED WITH CLAIM' : <><GameIcon icon="lock" size={12} /> BONUS TRACK</>}</span>
                      </> : <><span className="e6-pass-no-reward">—</span><strong>NO BONUS DROP</strong><small>FREE TIER</small><span className="e6-pass-reward-status">FREE REWARD TIER</span></>}
                    </div>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <footer className="e6-pass-footnote"><span></span><p><strong>How progression works</strong> Earn Event XP from battles. Every {xpPerTier.toLocaleString()} XP advances this track by one reward. {isHolidayTrack ? 'Holiday rewards contain no emotes or movement trails.' : 'Battle Pass+ bonus rewards remain available only where defined.'}</p></footer>
      </> : <section className="e6-pass-empty"><span></span><p className="e6-pass-section-kicker">SEASONAL REWARDS</p><h1>No active season</h1><p>There isn’t an active reward track right now. Check back when the next event begins.</p>
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
function EventShowcaseCanvas({ event, starChars, bannerImage }) {
  const ref = useRef(null);
  const [bannerFailed, setBannerFailed] = useState(false);
  useEffect(() => setBannerFailed(false), [bannerImage]);
  useEffect(() => {
    if (bannerImage && !bannerFailed) return undefined;
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
        ctx.fillText('', cx, cy - 100);
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
  }, [event, starChars, bannerImage, bannerFailed]);
  return bannerImage && !bannerFailed
    ? <img src={bannerImage} alt={`LIVE SEASON · ${event.name}`} onError={() => setBannerFailed(true)} />
    : <canvas ref={ref} width={800} height={180} className="w-full" style={{ maxWidth: '800px' }} />;
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
      } else if (event?.is2027 && bp.type === 'accessory' && getAccessory(bp.id)) {
        const accessory = getAccessory(bp.id);
        drawAccessory(ctx, 24, 38, accessory.type, accessory.color, f, .48, '');
      } else if (event?.is2027 && bp.type === 'ko') {
        // The season catalog calls these rewards `ko`; run the real effect
        // renderer so previews match the equipped in-match effect.
        drawKillFX(ctx, 24, 35, bp.id, (f % 72) / 72, event.color, f);
      } else if (event?.is2027 && bp.type === 'emote') {
        // Season emotes have authored pose entries in emotePose.js. Preview
        // the same rig pose used in a match instead of a generic letter tile.
        const char = ALL.find(candidate => candidate.id === 'yellow') || ALL[0];
        if (char) {
          ctx.fillStyle = `${event.color || '#9C6DF1'}22`;
          ctx.beginPath(); ctx.arc(24, 25, 20, 0, Math.PI * 2); ctx.fill();
          drawStickman(ctx, 24, 43, char.color, 1, f, .48, char.isSpirit, 'idle', char,
            null, false, null, { id: bp.id, progress: (f % 120) / 120 });
        }
      } else if (event?.is2027 && bp.type === 'trail') {
        const trail = getMovementTrail(bp.id);
        if (trail) {
          const histories = {};
          // Trace a short sample path through the real trail renderer so this
          // preview uses the equipped trail's color and particle language.
          for (let step = 0; step < 12; step++) {
            const x = 7 + step * 3.1;
            const y = 29 + Math.sin((step + f * .08) * .72) * 5;
            drawMovementTrail(ctx, { x, y, frame: f * 12 + step, facing: 1 }, trail.id, histories, 'preview', .28);
          }
        }
      } else if (event?.is2027 && bp.type === 'title') {
        const accent = event.color || '#9C6DF1';
        ctx.fillStyle = `${accent}33`; ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(3, 12, 42, 24, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#F5F2FF'; ctx.font = 'bold 7px Orbitron, sans-serif'; ctx.textAlign = 'center';
        const title = (bp.name || 'TITLE').toUpperCase();
        ctx.fillText(title.length > 11 ? `${title.slice(0, 10)}…` : title, 24, 27);
      } else if (event?.is2027) {
        const marks = { title: 'T', shikigami: 'S', ko: 'K', emote: 'E', trail: 'M', accessory: 'A' };
        const accent = event.color || '#9C6DF1';
        const spirit = bp.type === 'shikigami' ? getShikigami(bp.shikigamiId) : null;
        if (spirit) spirit.draw(ctx, 24, 31, f, .72);
        else {
          ctx.fillStyle = `${accent}22`; ctx.beginPath(); ctx.arc(24, 24, 18, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(24, 24, 15, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#F5F2FF'; ctx.font = 'bold 16px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(marks[bp.type] || 'R', 24, 24);
        }
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
          ctx.fillText('', 40, 12);
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
        ctx.fillText('', 24, 30);
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
