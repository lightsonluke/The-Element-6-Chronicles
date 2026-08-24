import React, { useRef } from 'react';
import { drawStickman } from './renderer.js';
import { getEquippedAccessories, drawAccessory, isBehindAccessory, resolveAccColor } from './cosmetics.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getShikigami } from './shikigami.js';
import { getCharLevelData, applyElement, getUnlockedElements, ELEMENTS } from './elements.js';
import { STAT_KEYS, getStatTotal, getEraLabel, getEraAccent, getAlignment, getPowerName, getRealName, getNameColor } from './charSelectHelpers.js';
import { ALL_CHARS_MAP } from './allCharacters.js';

// A single pedestal displaying a selected character with stats and info.
export default function CharacterPedestal({
  char, // character object
  playerId = 1,
  isActive, // currently being edited
  isCPU,
  element = 'basic',
  onEquipElement,
  charLevels,
  equippedSkins = {},
  equippedAccessories = {},
  shikigamiId,
  ready,
  onToggleReady,
  compact = false,
}) {
  const canvasRef = useRef(null);

  React.useEffect(() => {
    if (!char) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const W = 140, H = 180;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, W, H);
      // bg gradient
      const grad = ctx.createRadialGradient(W / 2, H * 0.4, 10, W / 2, H * 0.4, W * 0.7);
      grad.addColorStop(0, char.color + '22');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // pedestal platform
      const pedY = H - 40;
      const pedGrad = ctx.createLinearGradient(0, pedY - 8, 0, H);
      pedGrad.addColorStop(0, getEraAccent(char) + 'CC');
      pedGrad.addColorStop(0.5, '#1a1a2a');
      pedGrad.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = pedGrad;
      ctx.beginPath();
      ctx.ellipse(W / 2, pedY, 48, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // pedestal ring
      ctx.strokeStyle = getEraAccent(char) + '88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(W / 2, pedY, 48, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      // energy glow under char
      const glow = ctx.createRadialGradient(W / 2, pedY - 5, 5, W / 2, pedY - 5, 40);
      glow.addColorStop(0, char.color + '44');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(W / 2, pedY - 5, 40, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // character
      const renderColor = getCharRenderColor(char.id, equippedSkins) || char.color;
      const skinParts = getSkinParts(char.id, equippedSkins);
      const accs = getEquippedAccessories(equippedAccessories, char.id);
      const cx = W / 2, cy = pedY - 5;
      skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, cx, cy, p.type, p.color, f, 1.4, char.id));
      accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, cx, cy, a.type, resolveAccColor(a, char), f, 1.4, char.id));
      drawStickman(ctx, cx, cy, renderColor, 1, f, 1.4, char.isSpirit, 'idle', char);
      skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, cx, cy, p.type, p.color, f, 1.4, char.id));
      accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, cx, cy, a.type, resolveAccColor(a, char), f, 1.4, char.id));
      const _sk = shikigamiId ? getShikigami(shikigamiId) : null;
      if (_sk) _sk.draw(ctx, cx - 32, cy - 52, f, 0.7);
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [char, equippedSkins, equippedAccessories, shikigamiId]);

  if (!char) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${isActive ? 'border-accent' : 'border-border'} p-3 min-w-[160px] ${compact ? 'h-[200px]' : 'h-[280px]'}`}>
        <div className="text-3xl text-muted-foreground mb-2">?</div>
        <p className="text-[10px] font-heading text-muted-foreground">PLAYER {playerId}</p>
        <p className="text-[9px] text-muted-foreground">Select a character</p>
      </div>
    );
  }

  const elemCharId = char.isCrossover ? char.baseCharId : char.id;
  const level = getCharLevelData({ charLevels }, elemCharId).level;
  const modifiedStats = applyElement(char.stats || {}, element);
  const statTotal = getStatTotal(modifiedStats);
  const alignment = getAlignment(char);
  const eraAccent = getEraAccent(char);
  const realName = getRealName(char);

  return (
    <div className={`flex flex-col rounded-xl border-2 transition ${isActive ? 'shadow-lg' : ''}`}
      style={{ borderColor: isActive ? eraAccent : 'var(--border)', backgroundColor: 'var(--card)' }}>
      {/* Player label */}
      <div className="flex items-center justify-between px-2 py-1 rounded-t-xl" style={{ backgroundColor: eraAccent + '22' }}>
        <span className="text-[9px] font-heading font-bold" style={{ color: eraAccent }}>P{playerId}</span>
        <span className="text-[8px] font-heading text-muted-foreground">{isCPU ? 'CPU' : 'PLAYER'}</span>
        {ready !== undefined && (
          <button onClick={onToggleReady} className={`text-[8px] font-heading px-1.5 py-0.5 rounded ${ready ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {ready ? '✓ READY' : 'NOT READY'}
          </button>
        )}
      </div>

      {/* Character canvas */}
      <div className="flex justify-center pt-1">
        <canvas ref={canvasRef} width={140} height={180} className={compact ? 'scale-90' : ''} />
      </div>

      {/* Name + era */}
      <div className="px-2 pb-1 text-center">
        <p className="font-heading text-sm leading-tight" style={{ color: getNameColor(char), textShadow: `0 0 8px ${char.color}66` }}>{char.name}</p>
        {realName && <p className="text-[8px] text-muted-foreground font-body">{realName}</p>}
        <p className="text-[7px] font-heading" style={{ color: eraAccent }}>{(char.isCrossover ? 'Crossover' : getEraLabel(char)).toUpperCase()}</p>
        <p className="text-[7px] font-heading text-muted-foreground">{(char.isCrossover ? (ALL_CHARS_MAP[char.baseCharId]?.name || 'Crossover') : alignment).toUpperCase()} · {getPowerName(char).toUpperCase()}</p>
        <p className="text-[7px] font-heading text-accent">Lv {level}</p>
      </div>

      {/* Stat bars */}
      <div className="px-2 pb-1.5 space-y-0.5">
        {STAT_KEYS.map(stat => {
          const val = modifiedStats[stat] || 0;
          const baseVal = char.stats?.[stat] || 0;
          const boosted = val > baseVal;
          const reduced = val < baseVal;
          return (
            <div key={stat} className="flex items-center gap-1">
              <span className="text-[7px] font-body text-muted-foreground w-10 capitalize">{stat}</span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${val * 10}%`, backgroundColor: boosted ? '#FFFFFF' : char.color, boxShadow: boosted ? '0 0 4px #FFFFFF' : 'none' }} />
              </div>
              <span className="text-[7px] font-heading w-3 text-right" style={{ color: boosted ? '#FFFFFF' : reduced ? '#FF6666' : 'inherit' }}>{val}</span>
            </div>
          );
        })}
        <div className="flex items-center justify-between pt-0.5 border-t border-border">
          <span className="text-[7px] font-heading text-muted-foreground">TOTAL</span>
          <span className="text-[8px] font-heading text-accent">{statTotal} / 35</span>
        </div>
      </div>

      {/* Element selector */}
      {onEquipElement && (
        <div className="px-2 pb-1.5 border-t border-border pt-1">
          <p className="text-[7px] font-heading text-muted-foreground mb-0.5">ELEMENT</p>
          <div className="flex gap-0.5 flex-wrap">
            {getUnlockedElements(level).map(el => (
              <button key={el.id} onClick={() => onEquipElement(el.id)}
                className="px-1 py-0.5 rounded text-[7px] font-heading"
                style={{ backgroundColor: element === el.id ? (el.color || '#666') : 'rgba(128,128,128,0.3)', color: '#fff' }}>
                {el.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}