import React, { useState, useEffect, useRef } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { accessoriesFor, getAccessory, drawAccessory, isBehindAccessory } from './cosmetics.js';
import { skinsForChar, getSkin, getSkinParts, getCharRenderColor, RARITY_COLORS } from './skins.js';
import { ELEMENTS, getCharLevelData, getUnlockedElements, applyElement, xpForLevel, MAX_LEVEL } from './elements.js';
import { drawStickman } from './renderer.js';
import { music } from './music.js';
import PowerInfoCard from './PowerInfoCard.jsx';
import { OLD_GEN_CHARS, ERAS } from './eras.js';
import EraTabBar from './EraTabBar.jsx';
import GameIcon from "./GameIcon.jsx";

const OLD_GEN_NORMALIZED = OLD_GEN_CHARS.map(c => ({ ...c, power: c.power || c.powerTitle, isGuardian: false, isOldGen: true, era: c.era }));
const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS, ...OLD_GEN_NORMALIZED];
const ERA_LABELS = Object.fromEntries(ERAS.map(e => [e.id, e.name]));

function getRosterForEra(eraId) {
  if (eraId === 'all') return ALL;
  if (eraId === 'g5') return [...HEROES, ...VILLAINS, ...GUARDIANS];
  return OLD_GEN_NORMALIZED.filter(c => c.era === eraId);
}

export default function EditCharacters({ onBack, progress, onEquipAccessory, onEquipSkin, onEquipElement, onSetFavorite }) {
  const [selected, setSelected] = useState(progress?.favoriteId || HEROES[0].id);
  const [tab, setTab] = useState('elements');
  const [eraTab, setEraTab] = useState('g5');
  const canvasRef = useRef(null);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  const char = ALL.find(c => c.id === selected);
  const equippedAccessories = progress?.equippedAccessories || {};
  const equippedSkins = progress?.equippedSkins || {};
  const equippedElements = progress?.equippedElements || {};
  const charLevelData = getCharLevelData(progress, selected);
  const equippedElementId = equippedElements[selected] || 'basic';
  const equippedElementObj = ELEMENTS.find(e => e.id === equippedElementId) || ELEMENTS[0];
  const unlockedElements = getUnlockedElements(charLevelData.level);
  const modifiedStats = applyElement(char?.stats || {}, equippedElementId);

  const equippedAcc = getAccessory(equippedAccessories[selected]);
  const equippedSkinId = equippedSkins[selected];
  const renderColor = getCharRenderColor(selected, equippedSkins) || char?.color;
  const skinParts = getSkinParts(selected, equippedSkins);
  const ownedSkinsList = progress?.ownedSkins || [];
  const availableSkins = skinsForChar(selected, ownedSkinsList).filter(s => ownedSkinsList.includes(s.id));
  const availableAccs = [
    ...accessoriesFor(selected),
    ...(progress?.ownedAccessories || [])
      .map(id => getAccessory(id))
      .filter(a => a && a.isEvent && (!a.exclusiveTo || a.exclusiveTo === selected)),
  ];

  useEffect(() => {
    const c = canvasRef.current; if (!c || !char) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 260, 290);
      ctx.fillStyle = '#0a0820'; ctx.fillRect(0, 0, 260, 290);
      // Behind layer
      skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 130, 220, p.type, p.color, f, 1.6, selected));
      if (equippedAcc && isBehindAccessory(equippedAcc.type)) {
        const accColor = renderColor !== char?.color && equippedAcc.type === 'soccer_kit' ? renderColor : equippedAcc.color;
        drawAccessory(ctx, 130, 220, equippedAcc.type, accColor, f, 1.6, selected);
      }
      drawStickman(ctx, 130, 220, renderColor, 1, f, 1.6, char.isSpirit, 'idle', char);
      // Front layer
      skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, 130, 220, p.type, p.color, f, 1.6, selected));
      if (equippedAcc && !isBehindAccessory(equippedAcc.type)) {
        const accColor = renderColor !== char?.color && equippedAcc.type === 'soccer_kit' ? renderColor : equippedAcc.color;
        drawAccessory(ctx, 130, 220, equippedAcc.type, accColor, f, 1.6, selected);
      }
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [char, selected, renderColor, skinParts, equippedAcc]);

  return (
    <div className="w-full max-w-7xl flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading text-accent tracking-wider">EDIT YOUR CHARACTERS</h2>
        <button onClick={onBack} className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-heading text-base hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="flex gap-6 flex-wrap">
        <div className="w-72">
          <p className="text-sm font-heading text-muted-foreground mb-2">SELECT CHARACTER</p>
          <EraTabBar selectedEra={eraTab} onEraChange={setEraTab} compact />
          <div className="grid grid-cols-6 gap-2 max-h-[480px] overflow-y-auto pr-1 mt-2">
            {getRosterForEra(eraTab).map(c => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                className={`w-11 h-11 rounded-full border-2 ${selected === c.id ? 'border-accent scale-110' : 'border-border'} transition`}
                style={{ backgroundColor: c.color, boxShadow: selected === c.id ? `0 0 12px ${c.color}` : 'none' }}
                title={c.name} />
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[280px] flex flex-col items-center bg-card border border-border rounded-xl p-6">
          <canvas ref={canvasRef} width={260} height={290} className="rounded-lg" />
          <div className="flex items-center gap-3 mt-3">
            <p className="font-heading text-lg text-foreground">{char?.name}</p>
            <button onClick={() => onSetFavorite?.(selected)}
              className={`px-3 py-1 rounded text-xs font-heading ${selected === progress?.favoriteId ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80'}`}>
              {selected === progress?.favoriteId ? '★ Favorite' : '☆ Set Favorite'}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{char?.title}</p>
          <div className="flex gap-3 mt-2">
            <span className="text-sm font-heading text-accent">Lv {charLevelData.level}/{MAX_LEVEL}</span>
          </div>
          <div className="w-full mt-4">
            {['speed', 'power', 'defense', 'control', 'utility'].filter(s => modifiedStats[s] !== undefined).map((stat) => {
              const val = modifiedStats[stat];
              const baseVal = char?.stats?.[stat] || 5;
              const isBoosted = val > baseVal;
              const isReduced = val < baseVal;
              return (
                <div key={stat} className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-body text-muted-foreground w-20 capitalize">{stat}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${val * 10}%`, backgroundColor: isBoosted ? '#FFFFFF' : char?.color, boxShadow: isBoosted ? '0 0 8px #FFFFFF' : 'none' }} />
                  </div>
                  <span className="text-sm font-heading w-10" style={{ color: isBoosted ? '#FFFFFF' : isReduced ? '#FF6666' : 'inherit', textShadow: isBoosted ? '0 0 6px #FFFFFF' : 'none' }}>{val}{isBoosted ? ' ⬆' : isReduced ? ' ⬇' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-96 flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setTab('elements')} className={`flex-1 px-3 py-2 rounded font-heading text-sm ${tab === 'elements' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>ELEMENTS</button>
            <button onClick={() => setTab('skins')} className={`flex-1 px-3 py-2 rounded font-heading text-sm ${tab === 'skins' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>SKINS</button>
            <button onClick={() => setTab('accs')} className={`flex-1 px-3 py-2 rounded font-heading text-sm ${tab === 'accs' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>GEAR</button>
            <button onClick={() => setTab('power')} className={`flex-1 px-3 py-2 rounded font-heading text-sm ${tab === 'power' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>POWER</button>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 max-h-[500px] overflow-y-auto">
            {tab === 'elements' && (
              <div>
                <p className="text-sm font-heading text-muted-foreground mb-2">EQUIPPED: <span style={{ color: equippedElementObj.color }}>{equippedElementObj.name}</span></p>
                <p className="text-xs text-muted-foreground mb-3">{equippedElementObj.desc}</p>
                <p className="text-xs text-muted-foreground mb-4">Choose one element per battle. +1 to one stat, -1 from another. Unlock more by leveling up!</p>
                {ELEMENTS.map(el => {
                  const isUnlocked = charLevelData.level >= el.unlockLevel;
                  const isEquipped = equippedElementId === el.id;
                  return (
                    <button key={el.id} onClick={() => isUnlocked && onEquipElement?.(selected, isEquipped ? null : el.id)}
                      disabled={!isUnlocked}
                      className={`w-full p-3 rounded border-2 text-left mb-3 ${isEquipped ? 'border-accent' : isUnlocked ? 'border-border' : 'border-border opacity-40 cursor-not-allowed'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: el.color }} />
                        <span className="text-sm font-heading" style={{ color: isEquipped ? 'var(--accent)' : 'inherit' }}>{el.name}</span>
                        {isEquipped && <span className="text-xs text-accent ml-auto"><GameIcon emoji="✓" size={14} /></span>}
                        {!isUnlocked && <span className="text-xs text-muted-foreground ml-auto"><GameIcon emoji="🔒" size={14} /> Lv {el.unlockLevel}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{el.desc}</p>
                    </button>
                  );
                })}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-body text-muted-foreground">XP: {charLevelData.xp || 0}/{charLevelData.level >= MAX_LEVEL ? 'MAX' : xpForLevel(charLevelData.level)}</p>
                  <p className="text-xs font-body text-muted-foreground">Win battles to gain XP and unlock elements!</p>
                </div>
              </div>
            )}

            {tab === 'skins' && (
              <div className="grid grid-cols-2 gap-3">
                {availableSkins.map(s => {
                  const isEquipped = equippedSkinId === s.id;
                  return (
                    <button key={s.id} onClick={() => onEquipSkin?.(selected, isEquipped ? null : s.id)}
                      className={`p-3 rounded border-2 text-left ${isEquipped ? 'border-accent' : 'border-border'}`}
                      style={{ borderColor: isEquipped ? undefined : RARITY_COLORS[s.rarity] + '44' }}>
                      <div className="w-10 h-10 rounded-full border-2" style={{ backgroundColor: s.color, borderColor: RARITY_COLORS[s.rarity] }} />
                      <p className="text-sm font-heading mt-2">{s.name}</p>
                      <p className="text-xs" style={{ color: RARITY_COLORS[s.rarity] }}>{(s.rarity || 'common').toUpperCase()}</p>
                      {isEquipped && <p className="text-xs text-accent"><GameIcon emoji="✓" size={14} /> EQUIPPED</p>}
                    </button>
                  );
                })}
                {availableSkins.length === 0 && <p className="text-sm text-muted-foreground">No skins owned. Buy in Shop!</p>}
              </div>
            )}

            {tab === 'accs' && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onEquipAccessory?.(selected, null)}
                  className={`p-3 rounded border-2 ${!equippedAcc ? 'border-accent' : 'border-border'}`}>
                  <p className="text-sm font-heading">None</p>
                </button>
                {availableAccs.filter(a => (progress?.ownedAccessories || []).includes(a.id)).map(a => {
                  const isEquipped = equippedAccessories[selected] === a.id;
                  return (
                    <button key={a.id} onClick={() => onEquipAccessory?.(selected, isEquipped ? null : a.id)}
                      className={`p-3 rounded border-2 ${isEquipped ? 'border-accent' : 'border-border'}`}>
                      <div className="w-10 h-10 rounded mx-auto" style={{ backgroundColor: a.color }} />
                      <p className="text-sm font-heading mt-2 text-center">{a.name}</p>
                      {isEquipped && <p className="text-xs text-accent text-center"><GameIcon emoji="✓" size={14} /></p>}
                    </button>
                  );
                })}
                {(progress?.ownedAccessories || []).length === 0 && <p className="text-sm text-muted-foreground col-span-2">No accessories owned. Buy in Shop!</p>}
              </div>
            )}

            {tab === 'power' && (
              <div>
                <p className="text-sm font-heading text-muted-foreground mb-3">POWER INFO</p>
                <PowerInfoCard char={char} />
                <p className="text-xs text-muted-foreground mt-3 font-body">The power button replaces the light attack. Build your super meter by landing hits, then use your super move (gold meter) for massive damage!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}