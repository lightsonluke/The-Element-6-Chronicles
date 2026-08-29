import React, { useState, useEffect, useRef } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { ACCESSORIES, getAccessory, drawAccessory, accessoriesFor, isBehindAccessory, resolveAccColor, getEquippedAccessories, getEquippedAccessoryIds } from './cosmetics.js';
import { drawSportChar } from './sportDraw.jsx';
import { shopSkinsForChar as skinsForChar, getSkin, getSkinParts, getCharRenderColor, RARITY_COLORS } from './skins.js';
import { KILL_FX, getKillFX, drawKillFX } from './killFX.js';
import { drawStickman } from './renderer.js';
import { music } from './music.js';
import DonateTab from './DonateTab.jsx';
import { formatNumber } from './formatNumber.js';
import { PAID_PACKS } from './shopPacks.js';
import { PROFILE_TITLES, getTitleColor, ownsTitle } from './profileTitles.js';
import { charPrice, charCategory, charEra, CATEGORY_COLORS } from './charPrices.js';
import { CROSSOVERS, crossoversForChar, getCrossoverColor } from './crossovers.js';
import { SHIKIGAMI, getShikigami, getShikigamiStat } from './shikigami.js';
import { EMOTES as ALL_EMOTES, getEmoteById } from './emotes.js';
import EmotePreview from './EmotePreview.jsx';
import { ALL_CHARS, getRosterForEra, getEraForCharId, ERAS } from './allCharacters.js';
import EraTabBar from './EraTabBar.jsx';
import SoundButton from './SoundButton.jsx';
import GameIcon from "./GameIcon.jsx";

const ALL = ALL_CHARS;

// Shop ordering: the 6 original heroes first, then everyone else by gen 1→5.
const CHEAP_HERO_ORDER = ['yellow', 'blue', 'purple', 'orange', 'green', 'pink'];
const ERA_ORDER = ['g1', 'g2', 'g3', 'g4', 'g5'];
function shopCharOrder(c) {
  const cheapIdx = CHEAP_HERO_ORDER.indexOf(c.id);
  if (cheapIdx >= 0) return cheapIdx; // 0-5 — always first
  const era = getEraForCharId(c.id)?.id || 'g5';
  const eraIdx = ERA_ORDER.indexOf(era);
  return 100 + (eraIdx < 0 ? 99 : eraIdx); // 100+ so they come after the 6
}
const SHOP_SORTED = [...ALL].sort((a, b) => shopCharOrder(a) - shopCharOrder(b));

export default function Shop({ progress, onBuy, onEquip, onBuySkin, onEquipSkin, onBuyKillFX, onEquipKillFX, onBuyCharacter, onBuyPack, onEquipTitle, onBuyCrossover, onEquipCrossover, onBuyShikigami, onEquipShikigami, onBuyEmote, onBack }) {
  const [selected, setSelected] = useState(progress?.favoriteId || HEROES[0].id);
  const [tryOn, setTryOn] = useState(null); // accessory id being previewed
  const [justBought, setJustBought] = useState(null); // post-buy "equip in shop" overlay
  const [shopTab, setShopTab] = useState('accessories');
  const [paidCategory, setPaidCategory] = useState('Featured');
  const [eraFilter, setEraFilter] = useState('all');
  const coins = progress?.coins || 0;
  const owned = progress?.ownedAccessories || [];
  const equipped = progress?.equippedAccessories || {};
  const equippedSkins = progress?.equippedSkins || {};
  const ownedKillFX = progress?.ownedKillFX || [];
  const equippedKillFX = progress?.equippedKillFX || 'none';
  const ownedShikigami = progress?.ownedShikigami || [];
  const equippedShikigami = progress?.equippedShikigami || {};
  const char = ALL.find(c => c.id === selected);

  // Reset try-on when switching characters
  useEffect(() => { setTryOn(null); }, [selected]);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  const equippedIds = getEquippedAccessoryIds(equipped, char?.id);
  const equippedAccs = getEquippedAccessories(equipped, char?.id);
  const shownAccessory = tryOn ? getAccessory(tryOn) : equippedAccs[0] || null;
  const available = accessoriesFor(selected);
  const equippedSkinId = equippedSkins[char?.id];
  const previewSkinColor = equippedSkinId ? getSkin(equippedSkinId)?.color : null;
  const previewSkinParts = equippedSkinId ? getSkinParts(char?.id, equippedSkins) : [];

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading text-accent tracking-wider">SHOP</h2>
          <p className="text-xs text-muted-foreground font-body">Element 6 Tokens: <span className="text-accent font-heading">{formatNumber(coins)}</span> <GameIcon emoji="◆" size={14} /></p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setShopTab('accessories')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'accessories' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>ACCESSORIES</button>
        <button onClick={() => setShopTab('kits')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'kits' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>KITS</button>
        <button onClick={() => setShopTab('killfx')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'killfx' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'}`}>KILL FX</button>
        <button onClick={() => setShopTab('characters')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'characters' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>CHARACTERS</button>
        <button onClick={() => setShopTab('titles')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'titles' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}><GameIcon emoji="🏷️" size={14} /> TITLES</button>
        <button onClick={() => setShopTab('crossovers')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'crossovers' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}><GameIcon emoji="🔀" size={14} /> CROSSOVERS</button>
        <button onClick={() => setShopTab('shikigami')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'shikigami' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>🪶 SHIKIGAMI</button>
        <button onClick={() => setShopTab('emotes')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'emotes' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>EMOTES</button>
        <button onClick={() => setShopTab('paid')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'paid' ? 'bg-primary text-primary-foreground' : 'bg-primary/50 text-primary-foreground'}`}><GameIcon emoji="💰" size={14} /> PAID</button>
        <button onClick={() => setShopTab('donate')} className={`px-4 py-1.5 rounded font-heading text-xs ${shopTab === 'donate' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}><GameIcon emoji="💖" size={14} /> DONATE</button>
      </div>

      {['accessories', 'kits'].includes(shopTab) && (
      <div className="flex gap-4">
        {/* Character picker */}
        <div className="w-56">
          <p className="text-[10px] font-heading text-muted-foreground mb-1">EQUIP ON</p>
          <div className="mb-1">
            <EraTabBar selectedEra={eraFilter} onEraChange={setEraFilter} compact />
          </div>
          <div className="grid grid-cols-6 gap-1 max-h-56 overflow-y-auto">
            {(eraFilter === 'all' ? ALL : getRosterForEra(eraFilter)).map(c => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                className={`w-8 h-8 rounded-full border-2 ${selected === c.id ? 'border-accent' : 'border-border'}`}
                style={{ backgroundColor: c.color }} title={c.name} />
            ))}
          </div>
        </div>

        {/* Try-on preview */}
        <div className="flex-1 flex flex-col items-center bg-card border border-border rounded-xl p-4">
          <PreviewCanvas char={char} accessories={tryOn ? [getAccessory(tryOn)] : equippedAccs} skinColor={previewSkinColor} skinParts={previewSkinParts} />
          <p className="text-[9px] font-heading text-muted-foreground mt-2">EQUIPPED {equippedIds.length}/4</p>
          {tryOn ? (
            <p className="text-xs font-heading text-accent mt-1">Trying on: {shownAccessory?.name}</p>
          ) : equippedIds.length > 0 ? (
            <p className="text-xs font-heading text-accent mt-1">Wearing: {equippedAccs.map(a => a.name).join(', ')}</p>
          ) : (
            <p className="text-xs text-muted-foreground font-body mt-1">No accessory equipped — click one to try on</p>
          )}
        </div>
      </div>
      )}

      {/* Accessories grid — only the selected character's exclusive set */}
      {shopTab === 'accessories' && (
      <div>
        <p className="text-[10px] font-heading text-muted-foreground mb-2">ACCESSORIES{char ? ` FOR ${char.name.toUpperCase()}` : ''}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {available.filter(a => !a.exclusiveTo || a.exclusiveTo === selected).map(a => {
            const isOwned = owned.includes(a.id);
            const isEquipped = equipped[char?.id] === a.id;
            const isTrying = tryOn === a.id;
            return (
              <div key={a.id} className={`bg-card border rounded-xl p-3 flex flex-col items-center cursor-pointer transition ${isTrying ? 'border-accent' : 'border-border'}`}
                onClick={() => setTryOn(isTrying ? null : a.id)}>
                <AccessoryIcon accessory={a} />
                <p className="font-heading text-xs text-foreground mt-1">{a.name}</p>
                {a.exclusiveTo && <span className="text-[8px] text-primary font-heading">EXCLUSIVE</span>}
                <p className="text-[10px] text-accent font-heading mb-2">{a.price} <GameIcon emoji="◆" size={14} /></p>
                {isOwned ? (
                  <span className="px-3 py-1 rounded font-heading text-[10px] w-full bg-secondary text-secondary-foreground text-center block"><GameIcon emoji="✓" size={14} /> OWNED</span>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); if (coins >= a.price) { onBuy(a.id); setJustBought({ label: a.name, equip: () => onEquip(char.id, a.id) }); } }}
                    disabled={coins < a.price}
                    className={`px-3 py-1 rounded font-heading text-[10px] w-full ${coins >= a.price ? 'bg-primary text-primary-foreground hover:opacity-80' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                    BUY
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Sport Kits grid */}
      {shopTab === 'kits' && (
      <div>
        <p className="text-[10px] font-heading text-muted-foreground mb-2">SPORT KITS{char ? ` FOR ${char.name.toUpperCase()}` : ''}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {available.filter(a => ['soccer_kit','volleyball_kit','baseball_kit'].includes(a.type)).map(a => {
            const isOwned = owned.includes(a.id);
            const isEquipped = equippedIds.includes(a.id);
            const isTrying = tryOn === a.id;
            const kitLabel = {soccer_kit:'SOCCER',volleyball_kit:'VOLLEYBALL',baseball_kit:'BASEBALL'}[a.type] || 'KIT';
            return (
              <div key={a.id} className={`bg-card border rounded-xl p-3 flex flex-col items-center cursor-pointer transition ${isTrying ? 'border-accent' : 'border-border'}`}
                onClick={() => setTryOn(isTrying ? null : a.id)}>
                <AccessoryIcon accessory={a} />
                <p className="font-heading text-xs text-foreground mt-1">{a.name}</p>
                <span className="text-[8px] text-primary font-heading">{kitLabel}</span>
                <p className="text-[10px] text-accent font-heading mb-2">{a.price} <GameIcon emoji="◆" size={14} /></p>
                {isOwned ? (
                  <span className="px-3 py-1 rounded font-heading text-[10px] w-full bg-secondary text-secondary-foreground text-center block"><GameIcon emoji="✓" size={14} /> OWNED</span>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); if (coins >= a.price) { onBuy(a.id); setJustBought({ label: a.name, equip: () => onEquip(char.id, a.id) }); } }}
                    disabled={coins < a.price}
                    className={`px-3 py-1 rounded font-heading text-[10px] w-full ${coins >= a.price ? 'bg-primary text-primary-foreground hover:opacity-80' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                    BUY
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Characters grid */}
      {shopTab === 'characters' && (
      <div>
        <div className="mb-3">
          <EraTabBar selectedEra={eraFilter} onEraChange={setEraFilter} />
        </div>
        <p className="text-[10px] font-heading text-muted-foreground mb-2">CHARACTERS — Unlock fighters to use in battle</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(eraFilter === 'all' ? SHOP_SORTED : getRosterForEra(eraFilter)).map(c => {
            const isUnlocked = (progress?.unlockedIds || []).includes(c.id);
            const price = charPrice(c.id);
            const cat = charCategory(c.id);
            const eraInfo = getEraForCharId(c.id);
            return (
              <div key={c.id} className={`bg-card border rounded-xl p-3 flex flex-col items-center ${isUnlocked ? 'border-accent' : 'border-border'}`}>
                <div className="w-12 h-12 rounded-full border-2 mb-1" style={{ backgroundColor: c.color, borderColor: c.color, boxShadow: `0 0 8px ${c.color}55` }} />
                <p className="font-heading text-xs text-foreground mt-1 text-center leading-tight">{c.name}</p>
                <span className="text-[8px] font-heading" style={{ color: CATEGORY_COLORS[cat] }}>{cat}</span>
                {eraInfo && <span className="text-[7px] text-muted-foreground font-body">{eraInfo.short}</span>}
                {isUnlocked ? (
                  <span className="text-[10px] font-heading text-accent mt-2"><GameIcon emoji="✓" size={14} /> UNLOCKED</span>
                ) : (
                  <>
                    <p className="text-[10px] text-accent font-heading mb-2 mt-1">{price} <GameIcon emoji="◆" size={14} /></p>
                    <button onClick={() => onBuyCharacter(c.id)}
                      disabled={coins < price}
                      className={`px-3 py-1 rounded font-heading text-[10px] w-full ${coins >= price ? 'bg-primary text-primary-foreground hover:opacity-80' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                      BUY
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Kill FX grid */}
      {shopTab === 'killfx' && (
      <div>
        <p className="text-[10px] font-heading text-muted-foreground mb-2">KILL FX — Global effect on every KO (not per character)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KILL_FX.filter(k => k.price > 0).map(k => {
            const isOwned = ownedKillFX.includes(k.id);
            const isEquipped = equippedKillFX === k.id;
            return (
              <div key={k.id} className={`bg-card border rounded-xl p-3 flex flex-col items-center ${isEquipped ? 'border-accent' : 'border-border'}`}>
                <KillFXPreview fxId={k.id} color="#FFD700" />
                <p className="font-heading text-xs text-foreground mt-1">{k.name}</p>
                <p className="text-[9px] text-muted-foreground text-center mb-1">{k.desc}</p>
                <p className="text-[10px] text-accent font-heading mb-2">{k.price} <GameIcon emoji="◆" size={14} /></p>
                {isOwned ? (
                  <span className="px-3 py-1 rounded font-heading text-[10px] w-full bg-secondary text-secondary-foreground text-center block"><GameIcon emoji="✓" size={14} /> OWNED</span>
                ) : (
                  <button onClick={() => { if (coins >= k.price) { onBuyKillFX(k.id); setJustBought({ label: k.name, equip: () => onEquipKillFX(k.id) }); } }}
                    disabled={coins < k.price}
                    className={`px-3 py-1 rounded font-heading text-[10px] w-full ${coins >= k.price ? 'bg-primary text-primary-foreground hover:opacity-80' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                    BUY
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Crossovers tab */}
      {shopTab === 'crossovers' && (
      <div>
        <p className="text-[10px] font-heading text-muted-foreground mb-2">CROSSOVERS — Thematic event skins that transform character visuals & attack colors. Hover a character to see their crossovers.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CROSSOVERS.map(cx => {
            const isOwned = (progress?.ownedCrossovers || []).includes(cx.id);
            const isEquipped = (progress?.equippedCrossovers || {})[cx.charId] === cx.id;
            const char = ALL.find(c => c.id === cx.charId);
            return (
              <div key={cx.id} className={`bg-card border-2 rounded-xl p-3 flex flex-col items-center ${isEquipped ? 'border-accent' : 'border-border'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: cx.colorMap.primary, boxShadow: `0 0 12px ${cx.colorMap.primary}` }} />
                  <div className="text-left">
                    <p className="font-heading text-sm text-foreground">{cx.name}</p>
                    <p className="text-[9px] text-muted-foreground">{char?.name} · {cx.event}</p>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground text-center mb-1">Origin: {cx.origin}</p>
                <p className="text-[8px] text-muted-foreground text-center mb-2 flex-1">{cx.desc}</p>
                <div className="flex gap-1 mb-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: cx.colorMap.primary }} title="Primary" />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: cx.colorMap.secondary }} title="Secondary" />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: cx.colorMap.attack }} title="Attack" />
                </div>
                <p className="text-[10px] text-accent font-heading mb-2">{cx.price} <GameIcon emoji="◆" size={14} /></p>
                {isOwned ? (
                  <span className="px-3 py-1 rounded font-heading text-[10px] w-full bg-secondary text-secondary-foreground text-center block"><GameIcon emoji="✓" size={14} /> OWNED</span>
                ) : (
                  <button onClick={() => { if (coins >= cx.price) { onBuyCrossover?.(cx.id); setJustBought({ label: cx.name, equip: () => onEquipCrossover?.(cx.charId, cx.id) }); } }}
                    disabled={coins < cx.price}
                    className={`px-3 py-1 rounded font-heading text-[10px] w-full ${coins >= cx.price ? 'bg-primary text-primary-foreground hover:opacity-80' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                    BUY
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Shikigami tab */}
      {shopTab === 'shikigami' && (
      <div>
        <p className="text-[10px] font-heading text-muted-foreground mb-2">SHIKIGAMI — Purely cosmetic floating companions. Equip one per character; it follows you in every mode. No gameplay effect.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SHIKIGAMI.map(s => {
            const isOwned = ownedShikigami.includes(s.id);
            const isEquipped = equippedShikigami[char?.id] === s.id;
            return (
              <div key={s.id} className={`bg-card border rounded-xl p-3 flex flex-col items-center ${isEquipped ? 'border-accent' : 'border-border'}`}>
                <ShikigamiPreview shikigamiId={s.id} />
                <p className="font-heading text-xs text-foreground mt-1">{s.name}</p>
                <p className="text-[8px] text-muted-foreground text-center mb-1 leading-tight">{s.desc}</p>
                <p className="text-[8px] text-accent font-heading text-center mb-1">+0.5 {(getShikigamiStat(s.id) || '').toUpperCase()}</p>
                <p className="text-[10px] text-accent font-heading mb-2">{s.price} <GameIcon emoji="◆" size={14} /></p>
                {isOwned ? (
                  <span className="px-3 py-1 rounded font-heading text-[10px] w-full bg-secondary text-secondary-foreground text-center block"><GameIcon emoji="✓" size={14} /> OWNED</span>
                ) : (
                  <button onClick={() => { if (coins >= s.price) { onBuyShikigami?.(s.id); setJustBought({ label: s.name, equip: () => onEquipShikigami?.(char?.id, s.id) }); } }}
                    disabled={coins < s.price}
                    className={`px-3 py-1 rounded font-heading text-[10px] w-full ${coins >= s.price ? 'bg-primary text-primary-foreground hover:opacity-80' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                    BUY
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Emotes tab */}
      {shopTab === 'emotes' && (
      <div>
        <p className="text-[10px] font-heading text-muted-foreground mb-2">EMOTES — Animated character poses triggered with number keys (1-0) during battle. Free emotes are automatically owned.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ALL_EMOTES.map(e => {
            const isOwned = (progress?.ownedEmotes || []).includes(e.id) || e.price === 0;
            return (
              <div key={e.id} className={`bg-card border rounded-xl p-3 flex flex-col items-center ${isOwned ? 'border-accent' : 'border-border'}`}>
                <EmotePreview emoteId={e.id} char={char || HEROES[0]} />
                <p className="font-heading text-xs text-foreground mt-1">{e.name}</p>
                <p className="text-[8px] text-muted-foreground text-center mb-1 leading-tight">{e.desc}</p>
                {e.price === 0 ? (
                  <span className="px-3 py-1 rounded font-heading text-[10px] w-full bg-accent/20 text-accent text-center block">FREE</span>
                ) : isOwned ? (
                  <span className="px-3 py-1 rounded font-heading text-[10px] w-full bg-secondary text-secondary-foreground text-center block"><GameIcon emoji="✓" size={14} /> OWNED</span>
                ) : (
                  <>
                    <p className="text-[10px] text-accent font-heading mb-2">{e.price} <GameIcon emoji="◆" size={14} /></p>
                    <button onClick={() => { if (coins >= e.price) { onBuyEmote?.(e.id); setJustBought({ label: e.name, equip: () => {} }); } }}
                      disabled={coins < e.price}
                      className={`px-3 py-1 rounded font-heading text-[10px] w-full ${coins >= e.price ? 'bg-primary text-primary-foreground hover:opacity-80' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                      BUY
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Donate tab */}
      {shopTab === 'donate' && (
        <DonateTab />
      )}

      {/* Profile Titles tab */}
      {shopTab === 'titles' && (
      <div>
        <p className="text-[10px] font-heading text-muted-foreground mb-2">PROFILE TITLES — Displayed above your username in-game</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROFILE_TITLES.map(t => {
            const isOwned = ownsTitle(t.id, progress);
            const isEquipped = progress?.equippedTitle === t.id;
            return (
              <div key={t.id} className={`bg-card border rounded-xl p-3 flex flex-col items-center ${isEquipped ? 'border-accent' : 'border-border'}`}>
                <p className="font-heading text-sm text-center" style={{ color: getTitleColor(t.id) }}>{t.name}</p>
                <span className="text-[8px] font-heading text-muted-foreground">{t.rarity.toUpperCase()}</span>
                {isOwned ? (
                  <button onClick={() => onEquipTitle?.(isEquipped ? null : t.id)}
                    className={`mt-2 px-3 py-1 rounded font-heading text-[10px] w-full ${isEquipped ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'} hover:opacity-80`}>
                    {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                  </button>
                ) : (
                  <span className="text-[9px] text-muted-foreground mt-2 text-center">Unlock via All Titles Pack ($5)</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 bg-accent/10 border border-accent/30 rounded-lg p-3 text-center">
          <p className="text-[10px] text-accent font-body">Unlock all titles (current + future) with the All Profile Titles Pack in the Paid tab.</p>
        </div>
      </div>
      )}

      {/* Paid Items tab */}
      {shopTab === 'paid' && (
      <div>
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-4 mb-3">
          <p className="font-heading text-lg text-accent">PAID SHOP</p>
          <p className="text-[11px] text-muted-foreground">Token-shop items above are unchanged. Browse paid rewards by category.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['Featured','Accessories','Emotes','Shikigami','Profile','Battle Pass','Tokens','Support','Custom Content'].map(category => <button key={category} onClick={() => setPaidCategory(category)} className={`px-3 py-1.5 rounded-full font-heading text-[10px] ${paidCategory === category ? 'bg-accent text-accent-foreground shadow-lg' : 'bg-secondary text-secondary-foreground'}`}>{category.toUpperCase()}</button>)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAID_PACKS.filter(p => paidCategory === 'Featured' ? ['Tokens','Battle Pass','Support'].includes(p.category) : p.category === paidCategory).map(p => {
            const isOwned = (progress?.ownedPacks || []).includes(p.id);
            return (
              <div key={p.id} className={`bg-card border-2 rounded-2xl p-4 flex flex-col items-center text-center shadow-xl transition-transform hover:-translate-y-1 ${p.category === 'Tokens' || p.category === 'Support' ? 'md:col-span-1' : ''}`} style={{ borderColor: p.color + '88' }}>
                <span className="text-4xl mb-1">{p.emoji}</span>
                <p className="font-heading text-sm text-foreground">{p.name}</p>
                <p className="text-[9px] text-muted-foreground mb-2 flex-1">{p.desc}</p>
                {p.grants?.amount && <p className="font-heading text-2xl mb-1" style={{ color: p.color }}>{p.grants.amount.toLocaleString()} TOKENS</p>}
                {p.name.includes('RANDOM') && <span className="mb-2 px-2 py-0.5 rounded bg-primary/20 text-primary font-heading text-[9px]">RANDOM REWARDS</span>}
                <p className="font-heading text-xl mb-2" style={{ color: p.color }}>${(p.price / 100).toFixed(2)}</p>
                {isOwned ? (
                  <span className="px-3 py-1 bg-accent/20 text-accent rounded font-heading text-[10px] w-full"><GameIcon emoji="✓" size={14} /> OWNED</span>
                ) : (
                  <button onClick={() => onBuyPack?.(p.id)} disabled
                    className="px-3 py-2 bg-muted text-muted-foreground rounded-lg font-heading text-[10px] w-full cursor-not-allowed">
                    COMING SOON
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {justBought && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-card border-2 border-accent rounded-xl p-5 flex flex-col items-center gap-2 max-w-xs text-center">
            <p className="font-heading text-lg text-accent"><GameIcon emoji="✓" size={14} /> EQUIP IN SHOP</p>
            <p className="text-sm font-heading text-foreground">{justBought.label}</p>
            <p className="text-[10px] text-muted-foreground">Purchased! Equip it now or from the Equip tab later.</p>
            <button onClick={() => { justBought.equip?.(); setJustBought(null); }} className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-80">EQUIP NOW</button>
            <button onClick={() => setJustBought(null)} className="text-xs text-muted-foreground hover:text-foreground">Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShikigamiPreview({ shikigamiId }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const def = getShikigami(shikigamiId);
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = '#111128'; ctx.fillRect(0, 0, 64, 64);
      if (def) def.draw(ctx, 32, 30, f, 1.1);
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [shikigamiId]);
  return <canvas ref={ref} width={64} height={64} />;
}

function KillFXPreview({ fxId, color }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const c = ref.current; if (!c) return;
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

function PreviewCanvas({ char, accessories = [], skinColor, skinParts = [] }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const c = ref.current; if (!c || !char) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const renderColor = skinColor || char.color;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 160, 180);
      ctx.fillStyle = '#0a0820'; ctx.fillRect(0, 0, 160, 180);
      const kitAcc = accessories.find(a => a.type === 'volleyball_kit' || a.type === 'baseball_kit');
      const _sportForKit = kitAcc && (kitAcc.type === 'volleyball_kit' ? 'volleyball' : kitAcc.type === 'baseball_kit' ? 'baseball' : null);
      if (_sportForKit) {
        drawSportChar(ctx, 80, 150, char, { facing: 1, frame: f, scale: 1.3, jersey: true, sport: _sportForKit, teamColor: kitAcc.color, state: 'idle', equippedSkins: {}, equippedAccessories: {} });
        requestAnimationFrame(loop); return;
      }
      skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 80, 140, p.type, p.color, f, 1.3, char.id));
      accessories.filter(a => isBehindAccessory(a.type)).forEach(a => {
        const accColor = skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, char);
        drawAccessory(ctx, 80, 140, a.type, accColor, f, 1.3, char.id);
      });
      drawStickman(ctx, 80, 140, renderColor, 1, f, 1.3, char.isSpirit, 'idle', char);
      skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 80, 140, p.type, p.color, f, 1.3, char.id));
      accessories.filter(a => !isBehindAccessory(a.type)).forEach(a => {
        const accColor = skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, char);
        drawAccessory(ctx, 80, 140, a.type, accColor, f, 1.3, char.id);
      });
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [char, accessories, skinColor, skinParts]);
  return <canvas ref={ref} width={160} height={180} className="rounded-lg" />;
}

function AccessoryIcon({ accessory }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = '#111128'; ctx.fillRect(0, 0, 64, 64);
      drawAccessory(ctx, 32, 44, accessory.type, accessory.color, f, 0.55, accessory.exclusiveTo || '');
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [accessory]);
  return <canvas ref={ref} width={64} height={64} />;
}
