// Emotes system — 35 animated character poses triggered by number keys.
// Replaces the old emoji-based system with actual character body animations.
// Emotes are drawn by overriding the character's limb pose (see emotePose.js).

export const EMOTES = [
  // ── Core 4 ──
  { id: 'fistbump',  name: 'Fist Bump',       duration: 90,  price: 500, desc: 'Extend fist — syncs with nearby players doing the same', interaction: 'fistbump' },
  { id: 'yay',       name: 'Yay!',            duration: 120, price: 500, desc: 'Three happy jumps with arms raised' },
  { id: 'takeL',     name: 'L',                duration: 100, price: 500, desc: 'Take-the-L dance' },
  { id: 'highfive',  name: 'High Five',       duration: 90,  price: 500, desc: 'High-five your shikigami (requires shikigami)', interaction: 'highfive', requiresShikigami: true },

  // ── 20 additional ──
  { id: 'wave',      name: 'Wave',            duration: 90,  price: 500, desc: 'Friendly wave' },
  { id: 'comehere',  name: 'Come Here',       duration: 80,  price: 500, desc: 'Beckon someone over' },
  { id: 'point',     name: 'Point',           duration: 70,  price: 500, desc: 'Dramatic point forward' },
  { id: 'laugh',     name: 'Laugh',            duration: 80,  price: 500, desc: 'Hearty laugh' },
  { id: 'shrug',     name: 'Shrug',            duration: 70,  price: 500, desc: 'I don\'t know' },
  { id: 'facepalm',  name: 'Facepalm',         duration: 70,  price: 500, desc: 'Cover your face' },
  { id: 'bow',       name: 'Bow',              duration: 80,  price: 500, desc: 'Respectful bow' },
  { id: 'victory',   name: 'Victory',          duration: 80,  price: 500, desc: 'Confident victory pose' },
  { id: 'clap',      name: 'Clap',              duration: 90,  price: 500, desc: 'Applause' },
  { id: 'respect',   name: 'Respect',          duration: 80,  price: 500, desc: 'Show respect' },
  { id: 'boo',       name: 'Boo',               duration: 80,  price: 500, desc: 'Boo the opponent' },
  { id: 'taunt',     name: 'Taunt',             duration: 70,  price: 500, desc: 'Cocky taunt' },
  { id: 'bringit',   name: 'Bring It',          duration: 80,  price: 500, desc: 'Come fight me gesture' },
  { id: 'tooeasy',   name: 'Too Easy',          duration: 80,  price: 500, desc: 'Dismissive — that was easy' },
  { id: 'whatwas',   name: 'What Was That?',    duration: 80,  price: 500, desc: 'Confused disbelief' },
  { id: 'cry',       name: 'Cry',               duration: 90,  price: 500, desc: 'Salty tears' },
  { id: 'angry',     name: 'Angry',             duration: 80,  price: 500, desc: 'Furious rage' },
  { id: 'sleep',     name: 'Sleep',             duration: 90,  price: 500, desc: 'Falling asleep standing up' },
  { id: 'flex',      name: 'Flex',              duration: 80,  price: 500, desc: 'Show off strength' },
  { id: 'challenge', name: 'Challenge',         duration: 70,  price: 500, desc: 'Challenge the opponent' },

  // ── Extra platform-fighter emotes ──
  { id: 'ko',        name: 'KO',                duration: 100, price: 500, desc: 'I just won celebration' },
  { id: 'almost',    name: 'Almost',            duration: 70,  price: 500, desc: 'So close!' },
  { id: 'oops',      name: 'Oops',               duration: 60,  price: 500, desc: 'Surprised oops' },
  { id: 'panic',     name: 'Panic',              duration: 70,  price: 500, desc: 'Funny panic' },
  { id: 'thinking',  name: 'Thinking',          duration: 80,  price: 500, desc: 'Deep in thought' },
  { id: 'genius',    name: 'Genius',             duration: 90,  price: 500, desc: 'A brilliant idea!' },
  { id: 'chill',     name: 'Chill',              duration: 80,  price: 500, desc: 'Ultra relaxed' },
  { id: 'dance',     name: 'Dance',              duration: 100, price: 500, desc: 'Original dance moves' },
  { id: 'spin',      name: 'Spin',               duration: 80,  price: 500, desc: 'Stylish full-body spin' },
  { id: 'salute',    name: 'Salute',             duration: 70,  price: 500, desc: 'Clean salute' },
  { id: 'goodbye',   name: 'Goodbye',            duration: 90,  price: 500, desc: 'Turn and wave goodbye' },
];

// Build a quick lookup map
const EMOTE_MAP = {};
EMOTES.forEach(e => { EMOTE_MAP[e.id] = e; });

export function getEmoteById(id) {
  return EMOTE_MAP[id] || null;
}

// Get emote progress (0→1) from timer countdown
export function getEmoteProgress(timer, maxTimer) {
  if (!maxTimer) return 0;
  return 1 - (timer / maxTimer);
}

// Draw an emote name label above the character (the animation itself is on the body)
export function drawEmote(ctx, x, y, emoteId, timer, maxTimer, frame) {
  const emote = getEmoteById(emoteId);
  if (!emote) return;
  const t = timer / maxTimer;
  const alpha = t > 0.85 ? (1 - t) / 0.15 : t < 0.15 ? t / 0.15 : 1;
  const bounceY = Math.sin(frame * 0.15) * 3;
  const labelY = y - 100 - bounceY;

  ctx.save();
  ctx.globalAlpha = alpha * 0.85;
  ctx.font = 'bold 11px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  const text = emote.name.toUpperCase();
  const tw = ctx.measureText(text).width + 16;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath(); ctx.roundRect(x - tw / 2, labelY - 10, tw, 18, 4); ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 6;
  ctx.fillText(text, x, labelY + 3);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// Legacy compat — old code may import getEmoteByKey
export function getEmoteByKey(key) {
  // Keys are now resolved via emote slots, not fixed emote assignments.
  // This is kept for backward compatibility but returns null.
  return null;
}