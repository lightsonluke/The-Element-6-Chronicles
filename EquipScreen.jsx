import React, { useState, useEffect, useRef } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getAccessory, drawAccessory, isBehindAccessory, resolveAccColor, getEquippedAccessories, getEquippedAccessoryIds } from './cosmetics.js';
import { getSkin, getSkinParts, RARITY_COLORS } from './skins.js';
import { getKillFX, drawKillFX } from './killFX.js';
import { CROSSOVERS, getCrossover, getCrossoverColor, getCrossoverParts } from './crossovers.js';
import { SHIKIGAMI, getShikigami } from './shikigami.js';
import { EMOTES as ALL_EMOTES, getEmoteById } from './emotes.js';
import { SOLO_KEYS, COOP_P2_KEYS, COOP_P1_KEYS, getEquippedEmoteSlots, ownsEmote } from './emoteSlots.js';
import EmotePreview from './EmotePreview.jsx';
import EmoteEquipSection from './EmoteEquipSection.jsx';
import { drawStickman } from './renderer.js';
import { music } from './music.js';
import { getCharNumber } from './characterNumber.js';
import { OLD_GEN_CHARS, ERAS } from './eras.js';
import { MASTERY_REWARDS, getMasteryRankForChar, getMasterySkinTints } from './mastery.js';
import MasteryRewardsPanel from './MasteryRewardsPanel.jsx';
import EraTabBar from './EraTabBar.jsx';
import { getNameColor } from './charSelectHelpers.js';
import GameIcon from "./GameIcon.jsx";

const OLD_GEN_NORMALIZED = OLD_GEN_CHARS.map(c => ({ ...c, power: c.power || c.powerTitle, isGuardian: false, isOldGen: true, era: c.era }));
const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS, ...OLD_GEN_NORMALIZED];
const ERA_LABELS = Object.fromEntries(ERAS.map(e => [e.id, e.name]));

function getRosterForEra(eraId) {
  if (eraId === 'all') return ALL;
  if (eraId === 'g5') return [...HEROES, ...VILLAINS, ...GUARDIANS];
  return OLD_GEN_NORMALIZED.filter(c => c.era === eraId);
}

export default function EquipScreen({ onBack, progress, onEquipSkin, onEquipAccessory, onEquipKillFX, onEquipCrossover, onEquipShikigami, onEquipEmote, ownedEmotes = [], equippedEmotes = {} }) {
  const [selectedChar, setSelectedChar] = useState(progress?.favoriteId || HEROES[0].id);
  const [subTab, setSubTab] = useState('gear');
  const [eraTab, setEraTab] = useState('g5');
  const showCharSelector = ['gear', 'mastery', 'crossovers', 'shikigami'].includes(subTab);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  const char = ALL.find(c => c.id === selectedChar);
  const ownedSkins = progress?.ownedSkins || [];
  const ownedAccessories = progress?.ownedAccessories || [];
  const ownedKillFX = progress?.ownedKillFX || [];
  const equippedSkins = progress?.equippedSkins || {};
  const equippedAccessories = progress?.equippedAccessories || {};
  const equippedKillFX = progress?.equippedKillFX || 'none';
  const ownedCrossovers = progress?.ownedCrossovers || [];
  const equippedCrossovers = progress?.equippedCrossovers || {};
  const ownedShikigami = progress?.ownedShikigami || [];
  const equippedShikigami = progress?.equippedShikigami || {};
  const _ownedEmotes = progress?.ownedEmotes || ownedEmotes;
  const _equippedEmotes = progress?.equippedEmotes || equippedEmotes;
  const equippedShikigamiId = equippedShikigami[selectedChar] || null;

  const charOwnedCrossovers = CROSSOVERS.filter(cx => ownedCrossovers.includes(cx.id) && cx.charId === selectedChar);
  const equippedCrossoverId = equippedCrossovers[selectedChar] || null;
  const equippedCrossover = equippedCrossoverId ? getCrossover(equippedCrossoverId) : null;
  const crossoverColors = getCrossoverColor(selectedChar, equippedCrossovers);

  const charOwnedSkins = ownedSkins
    .map(id => getSkin(id))
    .filter(s => s && (s.charId === selectedChar || s.isAllChar));

  const charOwnedAccessories = ownedAccessories
    .map(id => getAccessory(id))
    .filter(a => a && (!a.exclusiveTo || a.exclusiveTo === selectedChar));

  return (
    <div className="w-full max-w-5xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading text-accent tracking-wider">EQUIP</h2>
          <p className="text-xs text-muted-foreground font-body">Equip skins, gear, accessories, and kill FX on any character</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1">
        <button onClick={() => setSubTab('gear')} className={`px-4 py-1.5 rounded font-heading text-xs ${subTab === 'gear' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>GEAR / ACCESSORIES</button>
        <button onClick={() => setSubTab('killfx')} className={`px-4 py-1.5 rounded font-heading text-xs ${subTab === 'killfx' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>KILL FX</button>
        <button onClick={() => setSubTab('crossovers')} className={`px-4 py-1.5 rounded font-heading text-xs ${subTab === 'crossovers' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>CROSSOVERS</button>
        <button onClick={() => setSubTab('shikigami')} className={`px-4 py-1.5 rounded font-heading text-xs ${subTab === 'shikigami' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>🪶 SHIKIGAMI</button>
        <button onClick={() => setSubTab('emotes')} className={`px-4 py-1.5 rounded font-heading text-xs ${subTab === 'emotes' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>EMOTES</button>
        <button onClick={() => setSubTab('mastery')} className={`px-4 py-1.5 rounded font-heading text-xs ${subTab === 'mastery' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>MASTERY</button>
        <button onClick={() => setSubTab('characters')} className={`px-4 py-1.5 rounded font-heading text-xs ${subTab === 'characters' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>CHARACTERS</button>
      </div>

      {/* Character preview (only for skins/gear) */}
      {showCharSelector && (
      <div className="bg-card/80 border border-border rounded-xl p-4 flex items-center gap-4">
        <EquipPreviewCanvas char={char} skinColor={equippedSkins[selectedChar] ? getSkin(equippedSkins[selectedChar])?.color : null}
          skinParts={equippedSkins[selectedChar] ? getSkinParts(selectedChar, equippedSkins) : []}
          accessories={getEquippedAccessories(equippedAccessories, selectedChar)}
          crossoverColors={crossoverColors} crossoverParts={getCrossoverParts(selectedChar, equippedCrossovers)}
          shikigamiId={equippedShikigamiId} />
        <div className="flex-1">
          <p className="font-heading text-lg" style={{ color: getNameColor(char) }}>{char?.name}</p>
          <p className="text-[10px] text-muted-foreground font-body">{char?.title}</p>
          {equippedSkins[selectedChar] && <p className="text-[9px] font-heading text-accent mt-1">Skin: {getSkin(equippedSkins[selectedChar])?.name}</p>}
          {equippedCrossover && <p className="text-[9px] font-heading text-accent mt-0.5">Crossover: {equippedCrossover.name}</p>}
          {equippedKillFX !== 'none' && <p className="text-[9px] font-heading text-accent">Kill FX: {getKillFX(equippedKillFX)?.name}</p>}
          <p className="text-[9px] font-heading text-muted-foreground mt-1">EQUIPPED ACCESSORIES ({getEquippedAccessoryIds(equippedAccessories, selectedChar).length}/4)</p>
          <div className="flex gap-2 mt-1">
            {Array.from({ length: 4 }).map((_, i) => {
              const ids = getEquippedAccessoryIds(equippedAccessories, selectedChar);
              const accId = ids[i];
              const acc = accId ? getAccessory(accId) : null;
              return (
                <button key={i} onClick={() => acc && onEquipAccessory?.(selectedChar, accId)}
                  className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center ${acc ? 'border-accent bg-accent/10 hover:border-destructive' : 'border-border bg-muted/30'}`}
                  title={acc ? `${acc.name} (click to unequip)` : 'Empty slot'}>
                  {acc ? (
                    <>
                      <AccessoryPreview accessory={acc} small />
                      <span className="text-[6px] text-muted-foreground">click ×</span>
                    </>
                  ) : (
                    <span className="text-[16px] text-muted-foreground/50">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Character selector (only for skins/gear) */}
      {showCharSelector && (
      <>
        <EraTabBar selectedEra={eraTab} onEraChange={setEraTab} compact />
        <p className="text-[10px] font-heading text-muted-foreground mt-2">SELECT CHARACTER</p>
        <div className="flex gap-1.5 flex-wrap max-h-32 overflow-y-auto p-1">
          {getRosterForEra(eraTab).map(c => (
            <button key={c.id} onClick={() => setSelectedChar(c.id)} title={c.era && c.era !== 'g5' ? ERA_LABELS[c.era] : ''}
              className={`flex flex-col items-center p-1 rounded border-2 ${selectedChar === c.id ? 'border-accent bg-accent/10' : 'border-border'}`}>
              <div className="w-6 h-6 rounded-full" style={c.splitColor ? { background: `linear-gradient(135deg, ${c.color} 50%, ${c.secondaryColor} 50%)` } : { backgroundColor: c.color }} />
              <span className="text-[6px] font-body text-muted-foreground leading-tight max-w-[48px] truncate">{c.name}</span>
            </button>
          ))}
        </div>
      </>
      )}

      {/* Gear */}
      {subTab === 'gear' && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
          <button onClick={() => onEquipAccessory?.(selectedChar, null)}
            className={`rounded-lg p-2 border-2 flex flex-col items-center justify-center ${getEquippedAccessoryIds(equippedAccessories, selectedChar).length === 0 ? 'border-accent' : 'border-border'}`}>
            <p className="text-[8px] font-heading text-center py-6">Clear All</p>
          </button>
          {charOwnedAccessories.map(a => {
            const equippedIds = getEquippedAccessoryIds(equippedAccessories, selectedChar);
            const isEquipped = equippedIds.includes(a.id);
            const slotNum = equippedIds.indexOf(a.id) + 1;
            return (
              <div key={a.id} className={`rounded-lg p-2 border-2 flex flex-col items-center ${isEquipped ? 'border-accent' : 'border-border'}`}>
                <AccessoryPreview accessory={a} />
                <p className="text-[8px] font-heading mt-1 text-center">{a.name}</p>
                {a.isEvent && <span className="text-[6px] text-primary font-heading">EVENT</span>}
                <button onClick={() => onEquipAccessory?.(selectedChar, a.id)}
                  className={`px-2 py-0.5 rounded text-[8px] font-heading mt-1 w-full ${isEquipped ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'}`}>
                  {isEquipped ? `✓ SLOT ${slotNum}` : 'EQUIP'}
                </button>
              </div>
            );
          })}
          {charOwnedAccessories.length === 0 && <p className="text-xs text-muted-foreground col-span-4 text-center py-8">No gear owned yet!</p>}
        </div>
      )}

      {/* Kill FX */}
      {subTab === 'killfx' && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
          <div className={`rounded-lg p-2 border-2 flex flex-col items-center ${equippedKillFX === 'none' ? 'border-accent' : 'border-border'}`}>
            <p className="text-[8px] font-heading text-center py-4">None</p>
            <button onClick={() => onEquipKillFX?.('none')}
              className={`px-2 py-0.5 rounded text-[8px] font-heading mt-1 w-full ${equippedKillFX === 'none' ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'}`}>
              {equippedKillFX === 'none' ? '✓ EQUIPPED' : 'EQUIP'}
            </button>
          </div>
          {ownedKillFX.map(id => {
            const fx = getKillFX(id);
            if (!fx) return null;
            const isEquipped = equippedKillFX === id;
            const fxId = fx.baseFxId || fx.id;
            return (
              <div key={id} className={`rounded-lg p-2 border-2 flex flex-col items-center ${isEquipped ? 'border-accent' : 'border-border'}`}>
                <KillFXPreview fxId={fxId} color="#FFD700" />
                <p className="text-[8px] font-heading mt-1 text-center">{fx.name}</p>
                {fx.isEvent && <span className="text-[6px] text-primary font-heading">EVENT</span>}
                <button onClick={() => onEquipKillFX?.(isEquipped ? 'none' : id)}
                  className={`px-2 py-0.5 rounded text-[8px] font-heading mt-1 w-full ${isEquipped ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'}`}>
                  {isEquipped ? '✓ EQUIPPED' : 'EQUIP'}
                </button>
              </div>
            );
          })}
          {ownedKillFX.length === 0 && <p className="text-xs text-muted-foreground col-span-4 text-center py-8">No kill FX owned yet!</p>}
        </div>
      )}

      {/* Crossovers */}
      {subTab === 'crossovers' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto p-1">
          <div className={`rounded-lg p-2 border-2 flex flex-col items-center ${!equippedCrossoverId ? 'border-accent' : 'border-border'}`}>
            <div className="w-12 h-12 rounded-full bg-muted/40 border border-border flex items-center justify-center">
              <span className="text-[16px] text-muted-foreground/50">∅</span>
            </div>
            <p className="text-[8px] font-heading mt-1 text-center">None</p>
            <button onClick={() => onEquipCrossover?.(selectedChar, null)}
              className={`px-2 py-0.5 rounded text-[8px] font-heading mt-1 w-full ${!equippedCrossoverId ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'}`}>
              {!equippedCrossoverId ? '✓ EQUIPPED' : 'EQUIP'}
            </button>
          </div>
          {charOwnedCrossovers.map(cx => {
            const isEquipped = equippedCrossoverId === cx.id;
            return (
              <div key={cx.id} className={`rounded-lg p-2 border-2 flex flex-col items-center ${isEquipped ? 'border-accent' : 'border-border'}`}>
                <div className="w-12 h-12 rounded-full" style={{ backgroundColor: cx.colorMap.primary, boxShadow: `0 0 10px ${cx.colorMap.primary}88` }} />
                <p className="text-[8px] font-heading mt-1 text-center leading-tight">{cx.name}</p>
                <p className="text-[7px] text-muted-foreground text-center">{cx.event}</p>
                <div className="flex gap-0.5 mt-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: cx.colorMap.primary }} title="Primary" />
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: cx.colorMap.secondary }} title="Secondary" />
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: cx.colorMap.attack }} title="Attack" />
                </div>
                <button onClick={() => onEquipCrossover?.(selectedChar, isEquipped ? null : cx.id)}
                  className={`px-2 py-0.5 rounded text-[8px] font-heading mt-1 w-full ${isEquipped ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'}`}>
                  {isEquipped ? '✓ EQUIPPED' : 'EQUIP'}
                </button>
              </div>
            );
          })}
          {charOwnedCrossovers.length === 0 && <p className="text-xs text-muted-foreground col-span-4 text-center py-8">No crossovers owned for this character yet! Buy them in the Shop.</p>}
        </div>
      )}

      {/* Shikigami — cosmetic floating companion (per-character) */}
      {subTab === 'shikigami' && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
          <div className={`rounded-lg p-2 border-2 flex flex-col items-center ${!equippedShikigamiId ? 'border-accent' : 'border-border'}`}>
            <div className="w-12 h-12 rounded-full bg-muted/40 border border-border flex items-center justify-center">
              <span className="text-[16px] text-muted-foreground/50">∅</span>
            </div>
            <p className="text-[8px] font-heading mt-1 text-center">None</p>
            <button onClick={() => onEquipShikigami?.(selectedChar, null)}
              className={`px-2 py-0.5 rounded text-[8px] font-heading mt-1 w-full ${!equippedShikigamiId ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'}`}>
              {!equippedShikigamiId ? '✓ EQUIPPED' : 'EQUIP'}
            </button>
          </div>
          {SHIKIGAMI.filter(s => ownedShikigami.includes(s.id)).map(s => {
            const isEquipped = equippedShikigamiId === s.id;
            return (
              <div key={s.id} className={`rounded-lg p-2 border-2 flex flex-col items-center ${isEquipped ? 'border-accent' : 'border-border'}`}>
                <ShikigamiMiniPreview shikigamiId={s.id} />
                <p className="text-[8px] font-heading mt-1 text-center">{s.name}</p>
                <button onClick={() => onEquipShikigami?.(selectedChar, isEquipped ? null : s.id)}
                  className={`px-2 py-0.5 rounded text-[8px] font-heading mt-1 w-full ${isEquipped ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'}`}>
                  {isEquipped ? '✓ EQUIPPED' : 'EQUIP'}
                </button>
              </div>
            );
          })}
          {ownedShikigami.length === 0 && <p className="text-xs text-muted-foreground col-span-5 text-center py-8">No Shikigami owned yet! Buy them in the Shop.</p>}
        </div>
      )}

      {/* Emotes — assign owned emotes to number-key slots */}
      {subTab === 'emotes' && (
        <EmoteEquipSection char={char} ownedEmotes={_ownedEmotes} equippedEmotes={_equippedEmotes} onEquipEmote={onEquipEmote} />
      )}

      {/* Mastery — rank-based skin tint rewards */}
      {subTab === 'mastery' && (
        <MasteryRewardsPanel char={char} charMastery={progress?.charMastery || {}}
          equippedSkinId={equippedSkins[selectedChar]} onEquipSkin={onEquipSkin} selectedChar={selectedChar} />
      )}

      {/* Characters tab */}
      {subTab === 'characters' && (
        <>
        <EraTabBar selectedEra={eraTab} onEraChange={setEraTab} compact />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-h-96 overflow-y-auto p-1 mt-2">
          {getRosterForEra(eraTab).filter(c => (progress?.unlockedIds || ['yellow']).includes(c.id) || c.isOldGen).map(c => (
            <div key={c.id} className="rounded-lg p-2 border border-border flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-2" style={{ backgroundColor: c.color, borderColor: c.color, boxShadow: `0 0 8px ${c.color}55` }} />
              <p className="text-[8px] font-heading mt-1 text-center leading-tight">{c.name}</p>
              <p className="text-[7px] text-muted-foreground text-center">{c.title}</p>
            </div>
          ))}
          {(progress?.unlockedIds || ['yellow']).filter(id => ALL.find(c => c.id === id)).length === 0 && (
            <p className="text-xs text-muted-foreground col-span-6 text-center py-8">No characters unlocked yet!</p>
          )}
        </div>
        </>
      )}
    </div>
  );
}

function EquipPreviewCanvas({ char, skinColor, skinParts = [], accessories = [], crossoverColors, crossoverParts = [], shikigamiId }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !char) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const renderColor = crossoverColors ? crossoverColors.primary : (skinColor || char.color);
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 120, 140);
      ctx.fillStyle = '#0a0820'; ctx.fillRect(0, 0, 120, 140);
      // Behind layer
      crossoverParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 60, 110, p.type, p.color, f, 1, char.id));
      skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 60, 110, p.type, p.color, f, 1, char.id));
      accessories.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, 60, 110, a.type, resolveAccColor(a, char), f, 1, char.id));
      drawStickman(ctx, 60, 110, renderColor, 1, f, 1, char.isSpirit, 'idle', char);
      // Front layer
      crossoverParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 60, 110, p.type, p.color, f, 1, char.id));
      skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 60, 110, p.type, p.color, f, 1, char.id));
      accessories.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, 60, 110, a.type, resolveAccColor(a, char), f, 1, char.id));
      const _sk = shikigamiId ? getShikigami(shikigamiId) : null;
      if (_sk) _sk.draw(ctx, 26, 68, f, 0.6);
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [char, skinColor, skinParts, accessories, crossoverColors, crossoverParts, shikigamiId]);
  return <canvas ref={ref} width={120} height={140} className="rounded-lg" />;
}

function AccessoryPreview({ accessory, small }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !accessory) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const size = small ? 48 : 64;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#111128'; ctx.fillRect(0, 0, size, size);
      drawAccessory(ctx, size / 2, size * 0.68, accessory.type, accessory.color, f, small ? 0.4 : 0.55, accessory.exclusiveTo || '');
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [accessory, small]);
  return <canvas ref={ref} width={small ? 48 : 64} height={small ? 48 : 64} className={small ? 'w-12 h-12' : 'w-16 h-16'} />;
}

function ShikigamiMiniPreview({ shikigamiId }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const def = getShikigami(shikigamiId);
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 48, 48);
      ctx.fillStyle = '#111128'; ctx.fillRect(0, 0, 48, 48);
      if (def) def.draw(ctx, 24, 24, f, 0.9);
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [shikigamiId]);
  return <canvas ref={ref} width={48} height={48} className="w-12 h-12" />;
}

function KillFXPreview({ fxId, color }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !fxId) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = '#111128'; ctx.fillRect(0, 0, 64, 64);
      const progress = (f % 60) / 60;
      drawKillFX(ctx, 32, 50, fxId, progress, color, f);
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [fxId, color]);
  return <canvas ref={ref} width={64} height={64} />;
}

function EquipSkinPreview({ char, skin }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !char || !skin) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 64, 72);
      ctx.fillStyle = '#0a0820'; ctx.fillRect(0, 0, 64, 72);
      // Behind layer
      if (skin.customParts) {
        skin.customParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 32, 56, p.type, p.color, f, 0.5, char.id));
      }
      drawStickman(ctx, 32, 56, skin.color, 1, f, 0.5, char.isSpirit, 'idle', char);
      // Front layer
      if (skin.customParts) {
        skin.customParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 32, 56, p.type, p.color, f, 0.5, char.id));
      }
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [char, skin]);
  return <canvas ref={ref} width={64} height={72} />;
}