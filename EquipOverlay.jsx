import React, { useMemo, useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getCharLevelData } from './elements.js';
import { ACCESSORIES, accessoriesFor, getAccessory, isAccessoryCompatible } from './cosmetics.js';
import { skinsForChar, getSkin } from './skins.js';
import { KILL_FX as KILL_FX_LIST, getKillFX } from './killFX.js';
import { PROFILE_TITLES, ownsTitle } from './profileTitles.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// Equip overlay — opens over the Hub without leaving. Player can change
// character, skins, accessories, kill FX, and title. The selected character
// drives which skins/accessories are shown, updating instantly on click.
export default function EquipOverlay({ progress, customCharsData = {}, onApply, onClose }) {
  const [selectedChar, setSelectedChar] = useState(progress?.favoriteId || 'yellow');
  const [titleQuery, setTitleQuery] = useState('');
  const [titleSort, setTitleSort] = useState('name');
  const charId = selectedChar;
  const char = ALL.find(c => c.id === charId) || customCharsData?.[charId] || HEROES[0];
  const lv = getCharLevelData(progress, charId)?.level || 1;
  const unlocked = progress?.unlockedIds || ['yellow'];

  // Only show skins & accessories that apply to the selected character
  const ownedSkins = (progress?.ownedSkins || []).filter(id => {
    const sk = getSkin(id); return !sk || !sk.charId || sk.charId === charId || skinsForChar(charId).some(s => s.id === id);
  });
  const equippedSkin = progress?.equippedSkins?.[charId];
  const equippedAccs = progress?.equippedAccessories || {};
  const ownedAccs = (progress?.ownedAccessories || []).filter(id => {
    const a = getAccessory(id); return a && isAccessoryCompatible(a, charId);
  });
  const ownedFX = progress?.ownedKillFX || [];
  const equippedFX = progress?.equippedKillFX || 'none';
  const equippedTitle = progress?.equippedTitle || null;
  const ownedTitles = useMemo(() => PROFILE_TITLES
    .filter(title => ownsTitle(title.id, progress))
    .filter(title => title.name.toLowerCase().includes(titleQuery.trim().toLowerCase()))
    .sort((a, b) => titleSort === 'rarity'
      ? (['common', 'rare', 'epic', 'legendary'].indexOf(b.rarity) - ['common', 'rare', 'epic', 'legendary'].indexOf(a.rarity)) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name)), [progress?.ownedTitles, progress?.ownedPacks, titleQuery, titleSort]);

  const selectChar = (id) => {
    setSelectedChar(id);
    onApply?.({ type: 'favorite', id });
    sfx.click();
  };

  const apply = (patch) => { sfx.click(); onApply?.(patch); };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border-2 border-accent rounded-xl p-5 w-[560px] max-w-[96%] max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent"><GameIcon icon="info" size={14} /> EQUIP (Hub)</h3>
          <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon icon="close" size={14} /></button>
        </div>

        {/* Character preview header */}
        <div className="flex items-center gap-3 mb-3 bg-muted/30 rounded-lg p-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: char?.color || '#888' }}>
            {char?.name?.[0] || '?'}
          </div>
          <div>
            <p className="font-heading text-sm text-foreground">{char?.name || charId}</p>
            <p className="text-[10px] text-muted-foreground">Level {lv}</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-[10px] font-heading text-muted-foreground mb-1">CHARACTER</p>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {unlocked.map(id => {
              const c = ALL.find(x => x.id === id) || customCharsData?.[id];
              return (
                <button key={id} onClick={() => selectChar(id)}
                  className={`px-2 py-1 rounded text-[10px] font-heading border ${id === charId ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>
                  {c?.name || id}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-[10px] font-heading text-muted-foreground mb-1">SKIN — {char?.name || charId}</p>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            <button onClick={() => apply({ type: 'skin', charId, skinId: null })} className={`px-2 py-0.5 rounded text-[10px] font-heading border ${!equippedSkin ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>Default</button>
            {ownedSkins.map(id => (
              <button key={id} onClick={() => apply({ type: 'skin', charId, skinId: id })}
                className={`px-2 py-0.5 rounded text-[10px] font-heading border ${equippedSkin === id ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>
                {getSkin(id)?.name || id}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-[10px] font-heading text-muted-foreground mb-1">ACCESSORY — {char?.name || charId}</p>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            <button onClick={() => apply({ type: 'acc', charId, accId: null })} className={`px-2 py-0.5 rounded text-[10px] font-heading border ${!equippedAccs[charId] ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>None</button>
            {ownedAccs.map(id => (
              <button key={id} onClick={() => apply({ type: 'acc', charId, accId: id })}
                className={`px-2 py-0.5 rounded text-[10px] font-heading border ${equippedAccs[charId] === id ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>
                {getAccessory(id)?.name || id}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-[10px] font-heading text-muted-foreground mb-1">KILL FX</p>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => apply({ type: 'killfx', id: 'none' })} className={`px-2 py-0.5 rounded text-[10px] font-heading border ${equippedFX === 'none' ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>None</button>
            {ownedFX.map(id => (
              <button key={id} onClick={() => apply({ type: 'killfx', id })} className={`px-2 py-0.5 rounded text-[10px] font-heading border ${equippedFX === id ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>{getKillFX(id)?.name || id}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-heading text-muted-foreground mb-1">PROFILE TITLE</p>
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input value={titleQuery} onChange={event => setTitleQuery(event.target.value)} aria-label="Filter owned titles" placeholder="Filter owned titles" className="min-h-10 min-w-0 rounded-xl border border-border bg-background px-3 text-xs" />
            <select value={titleSort} onChange={event => setTitleSort(event.target.value)} aria-label="Sort owned titles" className="min-h-10 rounded-xl border border-border bg-background px-2 text-xs">
              <option value="name">A–Z</option><option value="rarity">Rarity</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => apply({ type: 'title', id: null })} className={`px-2 py-0.5 rounded text-[10px] font-heading border ${!equippedTitle ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>None</button>
            {ownedTitles.map(t => (
              <button key={t.id} onClick={() => apply({ type: 'title', id: t.id })} className={`px-2 py-0.5 rounded text-[10px] font-heading border ${equippedTitle === t.id ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>{t.name}</button>
            ))}
            {ownedTitles.length === 0 && <span className="text-[10px] text-muted-foreground">No owned titles match this filter.</span>}
          </div>
        </div>

        <p className="text-[9px] text-muted-foreground mt-3">Skins and accessories shown are filtered for the selected character. Changes update instantly for everyone in this server.</p>
      </div>
    </div>
  );
}
