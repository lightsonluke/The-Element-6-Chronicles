// World Mode data — completely separate from all other game modes.
// Each character gets a unique hometown, mentor, starting quests, and dialogue.

import { HEROES } from './heroes.js';
import { activityGain, REL_CATEGORY } from './relationships.js';

// Characters that CANNOT be used in World Mode
export const EXCLUDED_WORLD_CHARS = new Set(['life', 'death', 'mercy', 'evil']);

export function getWorldCharChoices(unlockedIds) {
  return HEROES.filter(h => !EXCLUDED_WORLD_CHARS.has(h.id) && (unlockedIds || []).includes(h.id));
}

// ── Character-specific World starts ──
export const CHAR_WORLD_STARTS = {
  yellow: {
    hometown: 'Split City',
    region: 'Eola Island',
    mentor: 'Coach Flash',
    startX: 460, startY: 255,
    intro: "You wake up in your family home in Split City. Your parents are downstairs. Today feels different — today your adventure begins.",
    mentorDialogue: "Yellow! I've been waiting for you. You've got speed, kid — but you need training. Let's see what you can do!",
    earlyQuest: "Visit Coach Flash at the Split City training grounds.",
  },
  purple: {
    hometown: 'Melody District',
    region: 'Eola Island',
    mentor: 'Maestro Vibe',
    startX: 200, startY: 400,
    intro: "The sound of music fills the air in the Melody District. You grew up here among artists and dreamers.",
    mentorDialogue: "Ah, Purple! Music is power. Let me teach you to find the rhythm in combat.",
    earlyQuest: "Find Maestro Vibe at the concert hall.",
  },
  black: {
    hometown: 'Thunder Monastery',
    region: 'Eola Island',
    mentor: 'Thunder Master',
    startX: 720, startY: 300,
    intro: "High in the mountains, the Thunder Monks have trained you since childhood. The monastery is your home.",
    mentorDialogue: "Discipline, Black. Thunder answers to those who master themselves. Show me your focus.",
    earlyQuest: "Speak to the Thunder Master in the monastery courtyard.",
  },
  silver: {
    hometown: 'Silver Mansion',
    region: 'Eola Island',
    mentor: 'Steward Graves',
    startX: 560, startY: 280,
    intro: "Your mansion sits atop the hill, gleaming in the morning light. Servants attend your every need — but you crave real challenge.",
    mentorDialogue: "Young master Silver, your mansion is secure. But the world beyond these walls needs you. Are you ready?",
    earlyQuest: "Talk to Steward Graves at the mansion entrance.",
  },
  cable: {
    hometown: 'Metro City',
    region: 'Eola Island',
    mentor: 'Dr. Volt',
    startX: 340, startY: 320,
    intro: "Neon lights flicker across Metro City. You grew up repairing technology in the back alleys, building a reputation as a genius tinkerer.",
    mentorDialogue: "Cable! The city's tech is acting up again. Someone — or something — is controlling the grid. I need your help.",
    earlyQuest: "Meet Dr. Volt at the Metro City tech lab.",
  },
  pearl: {
    hometown: 'Tidewatch Bay',
    region: 'Eola Island',
    mentor: 'Captain Reef',
    startX: 150, startY: 420,
    intro: "The ocean has always been your home. Tidewatch Bay's gentle waves welcome you as you step outside your seaside cottage.",
    mentorDialogue: "Pearl, my dear! The tides brought something strange last night. Come, the sea has secrets to share.",
    earlyQuest: "Find Captain Reef at the Tidewatch Bay docks.",
  },
  temple: {
    hometown: 'Ancient Ruins',
    region: 'Eola Island',
    mentor: 'Elder Stone',
    startX: 620, startY: 380,
    intro: "The ancient ruins have been your sanctuary. Carved stones tell stories of heroes long past — and of a darkness yet to come.",
    mentorDialogue: "Temple. The ruins remember. There is a great trial ahead. Are you prepared to walk the old path?",
    earlyQuest: "Speak with Elder Stone among the ruins.",
  },
};

// Generic fallback for any hero without a custom start
export function getCharWorldStart(charId) {
  return CHAR_WORLD_STARTS[charId] || {
    hometown: 'Split City',
    region: 'Eola Island',
    mentor: 'Coach Flash',
    startX: 460, startY: 255,
    intro: "Your journey begins in Split City, the capital of Eola Island. Adventure awaits!",
    mentorDialogue: "Welcome, hero. Your story starts here. Explore the city and find your destiny.",
    earlyQuest: "Explore Split City and find your mentor.",
  };
}

// ── Stats system ──
export const WORLD_STATS = ['power', 'speed', 'hp', 'defense', 'utility', 'control'];
export const MAX_STAT = 100;

export function createWorldStats() {
  const stats = {};
  WORLD_STATS.forEach(s => { stats[s] = 1; });
  return stats;
}

export function getWorldLevel(stats) {
  if (!stats) return 1;
  const sum = WORLD_STATS.reduce((acc, s) => acc + (stats[s] || 1), 0);
  return Math.min(100, Math.ceil(sum / WORLD_STATS.length));
}

// ── 150-stage story with named milestones ──
export const NAMED_STAGES = {
  1: 'A New Beginning',
  8: 'First Victory',
  15: 'Lights Out',
  37: 'Echoes in the Woods',
  59: 'Secrets Beneath the Waves',
  74: 'Frozen Resolve',
  90: 'Heart of the Volcano',
  108: 'The Broken Sky',
  133: 'Defenders of Split City',
  149: 'The Final Override',
  150: 'A World Reborn',
};

export const CHAPTERS = [
  { id: 1, name: 'A Normal Life', stages: [1, 15], emoji: '🌱', color: '#44AA88', desc: 'Eola Island / Split City — Learn the basics of life in the world.' },
  { id: 2, name: 'Community', stages: [16, 30], emoji: '⚽', color: '#44AA44', desc: 'Meet sports coaches, learn new sports, and make friends.' },
  { id: 3, name: 'The Forest Mystery', stages: [31, 45], emoji: '🌲', color: '#228822', desc: 'People are disappearing. Bandits roam the forests. Find the ruins.' },
  { id: 4, name: 'Coastline', stages: [46, 60], emoji: '🏖', color: '#44CCAA', desc: 'Unlock beaches, boats, fishing. Discover an underwater lab.' },
  { id: 5, name: 'Frost Mountains', stages: [61, 75], emoji: '❄', color: '#88CCFF', desc: 'Travel north. Villages frozen. Meet Silver. Defeat an Ice Guardian.' },
  { id: 6, name: 'Volcano Region', stages: [76, 90], emoji: '🌋', color: '#FF4400', desc: 'Meet Crimson. Volcano erupts. Rescue civilians. Huge boss fight.' },
  { id: 7, name: 'Metro Region', stages: [91, 105], emoji: '🌆', color: '#4488CC', desc: 'Futuristic city. Crime, stealth. Someone controls the technology.' },
  { id: 8, name: 'The Rift', stages: [106, 120], emoji: '🌌', color: '#8844FF', desc: 'Reality breaks. Gravity shifts. The Controller speaks through glitches.' },
  { id: 9, name: 'War for Eola', stages: [121, 140], emoji: '⚔', color: '#FF2244', desc: 'Massive online battles. Defend cities. NPCs fight beside you.' },
  { id: 10, name: 'Beyond Evil', stages: [141, 150], emoji: '👑', color: '#FFD700', desc: 'Fight Nightmare, Evil, and The Controller. Restore the world.' },
];

export function getChapterForStage(stage) {
  return CHAPTERS.find(c => stage >= c.stages[0] && stage <= c.stages[1]);
}

export function getStageName(stage) {
  return NAMED_STAGES[stage] || `Stage ${stage}`;
}

export const TOTAL_STAGES = 150;

// ── Chapter 1 detailed stages (the tutorial chapter) ──
// Each stage has a `req` object describing the ACTUAL action the player must perform
// before it can be completed. There is no free "Complete" button — the game checks
// these requirements automatically as the player explores.
export const CHAPTER1_STAGES = [
  { stage: 1, name: 'A New Beginning', desc: 'Wake up and meet your family. Step outside your home.', type: 'talk',  req: { kind: 'talk', npc: 'mentor' } },
  { stage: 2, name: 'Find Your Mentor', desc: 'Walk to your mentor and introduce yourself.', type: 'reach', req: { kind: 'reach', building: 'training' } },
  { stage: 3, name: 'Learn Movement', desc: 'Practice walking with Arrow Keys or WASD.', type: 'move',  req: { kind: 'move', distance: 60 } },
  { stage: 4, name: 'Buy Clothes', desc: 'Visit the Split City clothing shop and buy an outfit.', type: 'shop', req: { kind: 'reach', building: 'shop' } },
  { stage: 5, name: 'Meet Someone', desc: 'Talk to another NPC in the city.', type: 'talk',  req: { kind: 'talk', npc: 'neighbor' } },
  { stage: 6, name: 'Open Inventory', desc: 'Press I to check your inventory.', type: 'inventory', req: { kind: 'inventory' } },
  { stage: 7, name: 'First Soccer Game', desc: 'Visit the sports field and play a soccer match.', type: 'sport', req: { kind: 'reach', building: 'sport' } },
  { stage: 8, name: 'First Victory', desc: 'Win your first sports match!', type: 'sport', req: { kind: 'sport', building: 'sport' } },
  { stage: 9, name: 'Split City Market', desc: 'Browse the market and buy some food.', type: 'shop', req: { kind: 'reach', building: 'shop' } },
  { stage: 10, name: 'Job Interview', desc: 'Apply for your first job at the employment office.', type: 'talk', req: { kind: 'talk', npc: 'job_agent' } },
  { stage: 11, name: 'First Paycheck', desc: 'Complete a job task and earn Element 6 Tokens.', type: 'job', req: { kind: 'work' } },
  { stage: 12, name: 'Buy Food', desc: 'Purchase food to keep your energy up.', type: 'shop', req: { kind: 'reach', building: 'shop' } },
  { stage: 13, name: 'Training Dummy', desc: 'Defeat the training dummy at the arena.', type: 'fight', req: { kind: 'train' } },
  { stage: 14, name: 'First Ability', desc: 'Learn your first ability from your mentor.', type: 'learn', req: { kind: 'reach', building: 'training' } },
  { stage: 15, name: 'Lights Out', desc: 'Strange lights appear over the city. A power outage strikes Split City!', type: 'event', req: { kind: 'auto', requiresStages: [13, 14] } },
];

// Check whether a stage's requirement has been met, given the tracked action state.
// actionState: { talkedNPCs:Set, visitedBuildings:Set, openedInventory:bool, movedDistance:number, trainedCount:number, workedCount:number, sportCount:number }
export function isStageRequirementMet(stageDef, actionState) {
  if (!stageDef || !stageDef.req) return false;
  const r = stageDef.req;
  const a = actionState || {};
  switch (r.kind) {
    case 'talk': return !!(a.talkedNPCs && a.talkedNPCs.has(r.npc));
    case 'reach': return !!(a.visitedBuildings && a.visitedBuildings.has(r.building));
    case 'move': return (a.movedDistance || 0) >= (r.distance || 60);
    case 'inventory': return !!a.openedInventory;
    case 'work': return (a.workedCount || 0) >= 1;
    case 'train': return (a.trainedCount || 0) >= 1;
    case 'sport': return (a.sportCount || 0) >= 1;
    case 'auto': {
      if (!r.requiresStages) return true;
      return r.requiresStages.every(s => (a.completedStages || []).includes(s));
    }
    default: return false;
  }
}

// ── World NPC definitions (3D coords: x = world X, z = world Z) ──
// Each NPC has an occupation, personality, mood, base friendship (relationship),
// and a quest flag. Dialogue is generated dynamically via getNPCDialogue().
export const WORLD_NPCS = [
  { id: 'mentor', name: 'Coach Flash', occupation: 'Mentor', x: 46, z: 70, color: '#FFD700', personality: 'upbeat', mood: 'happy', relationship: 50, quest: true, dialogue: "Yellow! I've been waiting for you. Let's see what you can do!" },
  { id: 'shopkeeper', name: 'Mabel Greene', occupation: 'Shopkeeper', x: 22, z: 56, color: '#44AA44', personality: 'cheerful', mood: 'happy', relationship: 30, quest: false, dialogue: 'Welcome to my shop! Food, clothes, and supplies — all here.' },
  { id: 'coach', name: 'Coach Reyes', occupation: 'Sports Coach', x: 60, z: 58, color: '#4488FF', personality: 'energetic', mood: 'pumped', relationship: 25, quest: true, dialogue: 'Soccer, baseball, volleyball — pick your sport and bring it!' },
  { id: 'mayor', name: 'Mayor Carter', occupation: 'Mayor of Split City', x: 0, z: -36, color: '#AA44FF', personality: 'formal', mood: 'calm', relationship: 40, quest: false, dialogue: 'Split City, capital of Eola Island, welcomes you.' },
  { id: 'job_agent', name: 'Mr. Doyle', occupation: 'Job Agent', x: -20, z: 24, color: '#FF8844', personality: 'busy', mood: 'focused', relationship: 20, quest: true, dialogue: 'Looking for work? Policing, cooking, sports — we have openings.' },
  { id: 'neighbor', name: 'Emily', occupation: 'Teacher', x: -42, z: 16, color: '#FF66AA', personality: 'kind', mood: 'friendly', relationship: 55, quest: false, dialogue: 'Hi neighbor! Strange things have been happening lately...' },
  { id: 'officer', name: 'Officer Miles', occupation: 'Police Officer', x: 16, z: -44, color: '#3a6ad8', personality: 'stern', mood: 'alert', relationship: 30, quest: false, dialogue: 'Keep the peace, citizen. Report anything suspicious.' },
  { id: 'doctor', name: 'Dr. Hart', occupation: 'Doctor', x: 34, z: -50, color: '#e8e8f0', personality: 'caring', mood: 'calm', relationship: 25, quest: false, dialogue: 'Stay healthy out there. Visit if you ever feel unwell.' },
  { id: 'firefighter', name: 'Captain Blaze', occupation: 'Firefighter', x: 40, z: -64, color: '#dd3344', personality: 'brave', mood: 'ready', relationship: 28, quest: false, dialogue: 'Stay sharp, hero. Fire waits for no one.' },
  { id: 'banker', name: 'Ms. Lane', occupation: 'Banker', x: 66, z: 6, color: '#5588cc', personality: 'precise', mood: 'professional', relationship: 20, quest: false, dialogue: 'Your tokens are safe with us. Invest wisely.' },
  { id: 'barista', name: 'Luca', occupation: 'Barista', x: -14, z: 42, color: '#cc7744', personality: 'warm', mood: 'cheerful', relationship: 35, quest: false, dialogue: 'Pull up a chair! Fresh brew, on the house for heroes.' },
  { id: 'student', name: 'Toby', occupation: 'Student', x: -34, z: -64, color: '#ddbb55', personality: 'curious', mood: 'excited', relationship: 45, quest: false, dialogue: 'Are you really a hero? Tell me everything!' },
  { id: 'jogger', name: 'Sam', occupation: 'Jogger', x: -30, z: 38, color: '#66ccff', personality: 'peppy', mood: 'energetic', relationship: 30, quest: false, dialogue: 'Morning run! Want to race me to the fountain?' },
  { id: 'vendor', name: 'Rosa', occupation: 'Market Vendor', x: -32, z: 40, color: '#77bb44', personality: 'lively', mood: 'happy', relationship: 28, quest: false, dialogue: 'Fresh produce! Best prices in Split City!' },
  { id: 'librarian', name: 'Ms. Quill', occupation: 'Librarian', x: 54, z: 26, color: '#99bbff', personality: 'quiet', mood: 'calm', relationship: 22, quest: false, dialogue: 'Shh... the library holds many secrets. Read carefully.' },
  { id: 'athlete', name: 'Jordan', occupation: 'Athlete', x: 62, z: 62, color: '#ff8844', personality: 'competitive', mood: 'fired up', relationship: 25, quest: false, dialogue: 'Think you can beat me? Prove it on the field.' },
];

// ── NPC relationships & dialogue ──
export function getRelationshipLabel(rel) {
  if (rel >= 80) return 'Best Friend';
  if (rel >= 60) return 'Close Friend';
  if (rel >= 40) return 'Friend';
  if (rel >= 20) return 'Acquaintance';
  if (rel >= 5) return 'Familiar';
  return 'Stranger';
}

const GREETINGS = {
  upbeat: ['Hey hey!', 'What a day!', 'Good to see you!'],
  cheerful: ['Hi there!', 'Oh, hello!', 'Always a pleasure!'],
  energetic: ['Yo!', "Let's go!", 'You look ready!'],
  formal: ['Greetings.', 'Good day.', 'A pleasure, as always.'],
  busy: ['Oh—hi! Quick!', 'Hang on... there. Hi.', 'Busy day—what is it?'],
  kind: ['Hello, dear.', 'How are you?', 'So glad you stopped by.'],
  stern: ['State your business.', 'Hm. Hello.', 'Make it quick.'],
  caring: ['Are you well?', 'Take care of yourself!', 'I was worried about you.'],
  brave: ['Stay sharp!', 'Eyes open, friend.', 'Good to see you standing.'],
  precise: ['Precisely on time.', 'Ah, you.', 'Noted your presence.'],
  warm: ['Come in, come in!', 'Lovely to see you.', "You're welcome here."],
  curious: ['Oh! Tell me everything.', 'What brings you here?', 'Fascinating to see you!'],
  peppy: ['Heyyy!', "Let's move it!", 'You got this!'],
  lively: ['Well well well!', 'Look who it is!', 'Ha! Hello!'],
  quiet: ['...oh, hi.', 'Mm, hello.', 'You came.'],
  competitive: ['Ready to lose?', 'Bring it!', "Heh. You're back."],
};

// ctx: { relationship, time:'day'|'night', weather, charName, stage, category, romanceStage, traits, marriedTo }
export function getNPCDialogue(npc, ctx = {}) {
  const rel = ctx.relationship ?? npc.relationship ?? 30;
  const time = ctx.time || 'day';
  const weather = ctx.weather || 'clear';
  const category = ctx.category || npc.category || 'friend';
  const romanceStage = ctx.romanceStage || 'none';
  const traits = ctx.traits || npc.traits || [npc.personality];
  const pool = GREETINGS[npc.personality] || GREETINGS.kind;
  let text = pool[Math.floor(Math.random() * pool.length)];
  if (category === 'family') text += ` ${npc.relation ? npc.relation + 's always stick together.' : 'Family is everything.'}`;
  if (category === 'hero') text += ' Another hero! We should train together sometime.';
  if (time === 'night') text += " It's late — be careful out there.";
  if (weather === 'rain' || weather === 'snow') text += ' Bit wet today, isn\'t it?';
  if (weather === 'fog') text += ' Hard to see far in this fog.';
  if (rel >= 60 && category !== 'family') text += ' Always good to see a true friend.';
  else if (rel < 25 && category !== 'family') text += ' We should talk more, you and I.';
  if (category === 'romance') {
    if (romanceStage === 'dating') text += ' 🌹 You make my days brighter.';
    else if (romanceStage === 'engaged') text += ' I can\'t wait for the wedding!';
    else if (romanceStage === 'married') text += ' Welcome home, love. ❤';
    else if (rel >= 40) text += ' I always enjoy your company…';
  }
  if (ctx.charName) text += `, ${ctx.charName}`;

  // Build options based on category, relationship, romance stage
  const options = [];
  if (npc.quest && rel < 70) {
    options.push({ label: 'Accept Quest', delta: +5, kind: 'quest', activity: 'quest' });
    options.push({ label: 'Maybe Later', delta: 0, kind: 'leave' });
    options.push({ label: 'Decline', delta: -2, kind: 'leave' });
  } else {
    options.push({ label: 'Talk', delta: activityGain('talk', traits), kind: 'talk', activity: 'talk' });
    options.push({ label: 'Ask for Help', delta: +1, kind: 'help', activity: 'help' });
    if (category === 'friend' || category === 'hero') options.push({ label: 'Play Sport', delta: activityGain('sport', traits), kind: 'sport', activity: 'sport' });
    if (category !== 'family') options.push({ label: 'Give Gift (10◆)', delta: activityGain('gift', traits), kind: 'gift', activity: 'gift', tokenCost: 10 });
    if (category === 'family') options.push({ label: 'Visit Home', delta: +3, kind: 'visit', activity: 'visit' });
    options.push({ label: 'Goodbye', delta: 0, kind: 'leave' });
  }
  // Romance options (adults only)
  if (category === 'romance') {
    if (rel >= 30 && romanceStage === 'none') options.push({ label: 'Flirt', delta: +4, kind: 'romance', activity: 'flirt' });
    if (rel >= 55 && romanceStage === 'interested') options.push({ label: 'Ask on a Date', delta: +6, kind: 'romance', activity: 'date' });
    if (rel >= 75 && romanceStage === 'dating') options.push({ label: 'Propose 💍', delta: +8, kind: 'romance', activity: 'propose' });
    if (rel >= 90 && romanceStage === 'engaged') options.push({ label: 'Get Married 👰', delta: +10, kind: 'romance', activity: 'marry' });
    if (romanceStage === 'married') options.push({ label: 'Start a Family 👶', delta: +5, kind: 'romance', activity: 'child' });
  }
  return { text, options, relationship: rel, relationshipLabel: getRelationshipLabel(rel), romanceStage, category };
}

// ── World buildings (Split City — capital of Eola Island) ──
// Coordinates are in 3D world units (x/z), with w/h2/height in world units.
// Organized into districts: Civic (north), Financial (east, skyscrapers),
// Shopping (south), Residential (west), Sports (southeast), Transport, Landmarks.
// rot: radians the building is rotated around Y so its door faces the nearest road.
//   0 = door faces +Z (south) | π/2 = faces +X (east) | π = faces -Z (north) | -π/2 = faces -X (west)
export const WORLD_BUILDINGS = [
  // ── Civic District (north) — face south toward main road ──
  { id: 'cityhall', name: 'City Hall', x: -16, z: -42, w: 12, h2: 10, height: 7, color: '#AA44FF', type: 'civic', rot: 0 },
  { id: 'police', name: 'Police Station', x: 16, z: -44, w: 9, h2: 7, height: 6, color: '#3a6ad8', type: 'civic', rot: 0 },
  { id: 'hospital', name: 'Hospital', x: 34, z: -50, w: 10, h2: 8, height: 7, color: '#e8e8f0', type: 'civic', rot: 0 },
  { id: 'school1', name: 'Elementary School', x: -34, z: -64, w: 12, h2: 8, height: 5, color: '#ddbb55', type: 'civic', rot: 0 },
  { id: 'firestation', name: 'Fire Station', x: 40, z: -64, w: 10, h2: 7, height: 5, color: '#dd3344', type: 'civic', rot: 0 },
  // ── Financial District (east) — face west ──
  { id: 'hq', name: 'Element 6 HQ', x: 54, z: -18, w: 10, h2: 10, height: 34, color: '#FFD700', type: 'landmark', rot: -Math.PI / 2 },
  { id: 'bank', name: 'Bank Tower', x: 66, z: 6, w: 9, h2: 9, height: 20, color: '#5588cc', type: 'civic', rot: -Math.PI / 2 },
  { id: 'office', name: 'Office Tower', x: 54, z: 26, w: 9, h2: 9, height: 17, color: '#6699dd', type: 'civic', rot: -Math.PI / 2 },
  { id: 'glass', name: 'Glass Tower', x: 72, z: -32, w: 8, h2: 8, height: 23, color: '#88ccee', type: 'civic', rot: -Math.PI / 2 },
  // ── Shopping District (south) — face north ──
  { id: 'mall', name: 'Split City Mall', x: 22, z: 40, w: 14, h2: 10, height: 6, color: '#44AA44', type: 'shop', rot: Math.PI },
  { id: 'shopA', name: 'Boutique', x: 14, z: 42, w: 8, h2: 6, height: 4, color: '#ff8844', type: 'shop', rot: Math.PI },
  { id: 'shopB', name: 'Cafe', x: -14, z: 42, w: 8, h2: 6, height: 4, color: '#cc7744', type: 'shop', rot: Math.PI },
  { id: 'shopC', name: 'Market', x: -32, z: 40, w: 9, h2: 6, height: 4, color: '#77bb44', type: 'shop', rot: Math.PI },
  // ── Residential (west) — face east toward main road ──
  { id: 'home', name: 'Your Home', x: -40, z: 8, w: 8, h2: 7, height: 5, color: '#AA8844', type: 'home', rot: Math.PI / 2 },
  { id: 'houseA', name: 'House', x: -54, z: 22, w: 7, h2: 6, height: 4, color: '#bb9955', type: 'home', rot: Math.PI / 2 },
  { id: 'houseB', name: 'House', x: -40, z: 28, w: 7, h2: 6, height: 4, color: '#aa8866', type: 'home', rot: Math.PI / 2 },
  { id: 'houseC', name: 'House', x: -60, z: 8, w: 7, h2: 6, height: 4, color: '#ccaa77', type: 'home', rot: Math.PI / 2 },
  // ── Sports Complex (southeast) ──
  { id: 'arena', name: 'Sports Arena', x: 62, z: 62, w: 16, h2: 14, height: 7, color: '#4488FF', type: 'sport', rot: Math.PI },
  { id: 'stadium', name: 'Stadium', x: 84, z: 34, w: 14, h2: 12, height: 8, color: '#3377dd', type: 'sport', rot: -Math.PI / 2 },
  { id: 'training', name: 'Training Grounds', x: 48, z: 64, w: 10, h2: 8, height: 5, color: '#FFD700', type: 'training', rot: Math.PI },
  // ── Transport ──
  { id: 'trainstation', name: 'Train Station', x: -50, z: 40, w: 12, h2: 8, height: 6, color: '#999999', type: 'civic', rot: Math.PI },
  { id: 'airport', name: 'Airport Terminal', x: 16, z: 112, w: 16, h2: 12, height: 6, color: '#cccccc', type: 'civic', rot: 0 },
  { id: 'airporttower', name: 'Airport Tower', x: 30, z: 122, w: 4, h2: 4, height: 12, color: '#445566', type: 'civic', rot: 0 },
  // ── Jobs ──
  { id: 'joboffice', name: 'Employment Office', x: -20, z: 30, w: 8, h2: 6, height: 4, color: '#FF8844', type: 'job', rot: Math.PI / 2 },
  // ── Landmarks ──
  { id: 'clocktower', name: 'Clock Tower', x: 10, z: 10, w: 3, h2: 3, height: 14, color: '#ddcc88', type: 'landmark', rot: -Math.PI * 0.75 },
];

// ── Default World save structure ──
export function createWorldSave(charId) {
  const start = getCharWorldStart(charId);
  return {
    charId,
    hometown: start.hometown,
    region: start.region,
    mentor: start.mentor,
    stage: 1,
    stats: createWorldStats(),
    tokens: 50,
    inventory: [],
    xp: 0,
    px: start.startX,
    py: start.startY,
    completedStages: [],
    npcRelationships: {},
    npcCategory: {},
    npcLastInteract: {},
    romance: {},        // npcId -> romanceStage
    marriedTo: null,
    children: [],
    job: null,
    housing: null,
    createdAt: Date.now(),
    lastSaved: Date.now(),
  };
}

export const WORLD_SAVE_KEY = 'element6_world_saves';
export const WORLD_ACTIVE_SLOT_KEY = 'element6_world_active_slot';

export function loadWorldSaves() {
  try {
    const raw = localStorage.getItem(WORLD_SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [null, null, null];
}

export function saveWorldSaves(saves) {
  try { localStorage.setItem(WORLD_SAVE_KEY, JSON.stringify(saves)); } catch {}
}

export function getWorldLevelFromSave(save) {
  return getWorldLevel(save?.stats);
}