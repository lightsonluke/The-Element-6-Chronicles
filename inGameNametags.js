import { parseCharName } from './allCharacters.js';

export function getCharacterNametag(character) {
  if (!character) return '';
  // allCharacters.js already normalizes old-gen names, but this also safely
  // handles raw/full names passed by older match engines.
  if (character.isOldGen || /^g[1-4]_/.test(character.id || '')) {
    if (character.id === 'g4_daichi') return 'Daichi';
    const source = character.fullName && character.name === character.fullName ? character.name : character.name;
    return parseCharName(source || character.name || '').displayName || character.name || '';
  }
  return character.name || '';
}

export function drawOnlineNameTag(ctx, x, y, character, username, options = {}) {
  const characterName = getCharacterNametag(character);
  const playerName = String(username || '').trim();
  if (!characterName && !playerName) return;
  const gap = options.gap ?? 13;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (playerName) {
    ctx.font = options.usernameFont || 'bold 10px Orbitron, sans-serif';
    ctx.fillStyle = options.usernameColor || '#FFFFFF';
    ctx.shadowColor = '#000000'; ctx.shadowBlur = 4;
    ctx.fillText(playerName, x, y);
    ctx.shadowBlur = 0;
  }
  if (characterName) {
    ctx.font = options.characterFont || 'bold 11px Orbitron, sans-serif';
    ctx.fillStyle = options.characterColor || character?.color || '#FFFFFF';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 5;
    ctx.fillText(characterName, x, y + gap);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

export function drawOfflineNameTag(ctx, x, y, character, options = {}) {
  const name = getCharacterNametag(character);
  if (!name) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = options.font || 'bold 11px Orbitron, sans-serif';
  ctx.fillStyle = options.color || character?.color || '#FFFFFF';
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 5;
  ctx.fillText(name, x, y);
  ctx.restore();
}
