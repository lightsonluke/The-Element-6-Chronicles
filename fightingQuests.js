// Infinite fighting quests — generates 8 per "tier", scaling targets each tier.
// Stats are accumulated in PlatformFighter and stored under progress.stats as nested maps.
// progress.fightQuestTier tracks which tier is active (0 = first set).
// When all 8 in a tier are claimed, the component calls onNextTier to advance.

const QUEST_POOL = [
  { charId: 'purple',   stat: 'distance', base: 50,  reward: 30 },
  { charId: 'yellow',   stat: 'distance', base: 200, reward: 40 },
  { charId: 'red',      stat: 'supers',   base: 100, reward: 50 },
  { charId: 'blue',     stat: 'supers',   base: 50,  reward: 40 },
  { charId: 'black',    stat: 'supers',   base: 75,  reward: 50 },
  { charId: 'green',    stat: 'powers',   base: 30,  reward: 35 },
  { charId: 'crimson',  stat: 'powers',   base: 25,  reward: 45 },
  { charId: 'silver',   stat: 'wins',     base: 10,  reward: 60 },
  { charId: 'pink',     stat: 'powers',   base: 20,  reward: 35 },
  { charId: 'orange',   stat: 'heavies',  base: 40,  reward: 40 },
  { charId: 'indigo',   stat: 'powers',   base: 25,  reward: 40 },
  { charId: 'white',    stat: 'distance', base: 150, reward: 45 },
  { charId: 'scarlet',  stat: 'supers',   base: 40,  reward: 40 },
  { charId: 'maroon',   stat: 'powers',   base: 30,  reward: 35 },
  { charId: 'lavender', stat: 'heavies',  base: 30,  reward: 35 },
  { charId: 'copper',   stat: 'powers',   base: 25,  reward: 40 },
  { charId: 'grey',     stat: 'wins',     base: 8,   reward: 50 },
  { charId: 'magenta',  stat: 'powers',   base: 20,  reward: 35 },
  { charId: 'turquoise',stat: 'heavies',  base: 25,  reward: 35 },
  { charId: 'olive',    stat: 'distance', base: 80,  reward: 30 },
];

const QUEST_TITLES = {
  distance: (n, name) => ({ title: `${name}'s Trek`, desc: `Walk ${n} feet using ${name}` }),
  supers:   (n, name) => ({ title: `${name}'s Surge`, desc: `Use your super move ${n} times with ${name}` }),
  powers:   (n, name) => ({ title: `${name}'s Awakening`, desc: `Activate power ${n} times with ${name}` }),
  heavies:  (n, name) => ({ title: `${name}'s Might`, desc: `Land ${n} heavy attacks with ${name}` }),
  wins:     (n, name) => ({ title: `${name}'s Dominance`, desc: `Win ${n} battles as ${name}` }),
};

export function generateFightQuests(tier = 0) {
  // pick 8 distinct entries from the pool, offset by tier so it rotates
  const picks = [];
  const used = new Set();
  let idx = (tier * 3) % QUEST_POOL.length;
  while (picks.length < 8) {
    const p = QUEST_POOL[idx % QUEST_POOL.length];
    const key = `${p.charId}_${p.stat}`;
    if (!used.has(key)) { used.add(key); picks.push(p); }
    idx++;
    if (idx > tier * 3 + 100) break; // safety
  }
  const scale = 1 + tier * 0.5;
  return picks.map((p, i) => {
    const target = Math.round(p.base * scale);
    const name = p.charId.charAt(0).toUpperCase() + p.charId.slice(1);
    const meta = QUEST_TITLES[p.stat](target, name);
    return {
      id: `t${tier}_${p.charId}_${p.stat}_${i}`,
      charId: p.charId,
      stat: p.stat,
      target,
      reward: Math.round(p.reward * (1 + tier * 0.25)),
      title: meta.title,
      desc: meta.desc,
      tier,
    };
  });
}

// Legacy export for any code still importing the static list (returns tier 0)
export const FIGHTING_QUESTS = generateFightQuests(0);

export function getFightingQuest(id) { return FIGHTING_QUESTS.find(q => q.id === id); }