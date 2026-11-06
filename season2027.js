const slug = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function rewardFromLabel(label, eventId, tier) {
  const id = `${eventId}-t${tier}-${slug(label)}`;
  const token = label.match(/^([\d,]+) Tokens$/);
  if (token) return { id, type: 'tokens', name: 'Tokens', amount: Number(token[1].replace(/,/g, '')) };
  if (label.startsWith('Title: ')) {
    const name = label.slice(7);
    return { id, type: 'title', name, titleId: `title-${slug(name)}` };
  }
  if (label.startsWith('Shikigami: ')) {
    const text = label.slice(11);
    const [name, description = ''] = text.split(' — ', 2);
    return { id, type: 'shikigami', name, description, shikigamiId: `shikigami-${slug(name)}` };
  }
  const lower = label.toLowerCase();
  const type = /\bko$/.test(lower) ? 'ko'
    : /\bemote$/.test(lower) ? 'emote'
      : /\btrail$/.test(lower) ? 'trail' : 'accessory';
  return { id, type, name: label.replace(/\s+(emote|trail|ko)$/i, ''), displayName: label };
}

function rewardsFromLabels(eventId, labels) {
  return labels.split('|').map((label, index) => ({
    tier: index + 1,
    ...rewardFromLabel(label.trim(), eventId, index + 1),
  }));
}

const passRows = [
  ['frost-found-2027', 'Frost & Found', '2027-01-01', '2027-02-18', 'frost-found.svg', `Snowcap|500 Tokens|Frostbite|Snow Drift emote|Snowflake Trail|750 Tokens|Ice Crystal Shoulder Ornament|Frozen Breath KO|Title: Frostbound|Shikigami: Yuki-Maru — snow fox|Icicle Horns|500 Tokens|Snowball Toss emote|Frost Rune Wristbands|Blizzard Burst KO|750 Tokens|Snowflake Halo|Figure Skater emote|Title: Winter Wanderer|Shikigami: Hyo-Rin — ice crane|Polar Explorer Scarf|1,000 Tokens|Frosted Spectacles|Freeze Frame emote|Glacier Break KO|750 Tokens|Frozen Antler Headpiece|Snow Angel emote|Title: Snowfall Survivor|Shikigami: Kori-Bō — ice tanuki|Crystal Ice Crown|1,000 Tokens|Frosted Back Mantle|Whiteout KO|Aurora Movement Trail|1,000 Tokens|Icicle Ear Cuffs|Frozen Bow emote|Title: Master of Winter|Shikigami: Shimo-Tsuru — snow owl|Glacier Face Mask|1,500 Tokens|Aurora Halo|Frost Stomp emote|Glacial Fracture KO|1,500 Tokens|Crystalline Back Ornament|Blizzard Bow emote|Title: Found in the Frost|Shikigami: Hakugin — frost kirin`],
  ['yokai-rising-2027', 'Six Feet Under: Yokai Rising', '2027-02-19', '2027-04-08', 'yokai-rising.svg', `Mini Oni Horns|500 Tokens|Paper Talisman Earrings|Ghost Lantern emote|Wisp Burst KO|750 Tokens|Foxfire Shoulder Charms|Cursed Grin face accessory|Title: Yokai Watcher|Shikigami: Kagekitsune — shadow fox|Broken Oni Mask|500 Tokens|Vanishing Spirit emote|Spirit Bell Accessory|Phantom Gate KO|750 Tokens|Floating Paper Seal Halo|Creepy Head Tilt emote|Title: Haunted by Legends|Shikigami: Aka-Kasa — umbrella yokai|Demon Fang Necklace|1,000 Tokens|Wispy Spirit Hair Ornament|Possession emote|Oni Flame KO|750 Tokens|Cursed Hand Shoulder Accessory|Ghostly Float emote|Title: Cursed Soul|Shikigami: Nure-Onna — water serpent|Oni War Crown|1,000 Tokens|Spirit Chain Back Ornament|Haunted Bell KO|Purple Foxfire Trail|1,000 Tokens|Floating Talisman Accessory|Summoning Circle emote|Title: Master of the Unseen|Shikigami: Shirogami — ghost deer|Cursed Oni Faceplate|1,500 Tokens|Spectral Flame Halo|Dark Ritual emote|Abyssal Spirit KO|1,500 Tokens|Demon Spine Back Ornament|Yokai Parade emote|Title: Six Feet Under|Shikigami: Gashadokuro — skeletal giant`],
  ['petal-metal-2027', 'Petal to the Metal', '2027-04-09', '2027-05-27', 'petal-metal.svg', `Sakura Hairpin|500 Tokens|Blossom Face Paint|Petal Catch emote|Sakura Burst KO|750 Tokens|Cherry Blossom Shoulder Flowers|Falling Petals Trail|Title: Spring Awakening|Shikigami: Hanakitsune — pink petal fox|Floral Ear Cuffs|500 Tokens|Flower Offering emote|Vine Wrist Wraps|Blossom Explosion KO|750 Tokens|Sakura Crown|Petal Spin emote|Title: Petalstorm|Shikigami: Momohana — flower deer|Butterfly Hair Ornament|1,000 Tokens|Floral Cheek Markings|Garden Bow emote|Nature's Embrace KO|750 Tokens|Blooming Shoulder Mantle|Blossom Dance emote|Title: Garden Guardian|Shikigami: Kusa-Tanuki — mossy flower tanuki|Sakura Branch Antlers|1,000 Tokens|Petal Wing Back Ornament|Floral Vortex KO|Butterfly Swarm Trail|1,000 Tokens|Flower Crown|Springtime Stretch emote|Title: Blooming Legend|Shikigami: Shōka — blossom crane|Golden Sakura Hairpiece|1,500 Tokens|Petal Halo|Blossoming Meditation emote|Eternal Spring KO|1,500 Tokens|Sakura Branch Backpiece|Thousand Petals emote|Title: Petal to the Metal|Shikigami: Sakura-Ō — cherry blossom dragon`],
  ['six-oclock-2027', "Six O'Clock Somewhere", '2027-05-28', '2027-07-15', 'six-oclock.svg', `Festival Headband|500 Tokens|Paper Fan Accessory|Festival Bow emote|Firework Pop KO|750 Tokens|Lantern Shoulder Charm|Confetti Trail|Title: Festival Regular|Shikigami: Chōchin — lantern spirit|Festival Face Paint|500 Tokens|Fan Dance emote|Paper Streamer Wristbands|Firecracker KO|750 Tokens|Golden Lantern Halo|Matsuri Dance emote|Title: Midnight Reveler|Shikigami: Hanabi — firework fox|Koi Hair Ornament|1,000 Tokens|Festival Mask|Lantern Lighting emote|Grand Fireworks KO|750 Tokens|Koi Shoulder Accessory|Summer Fan emote|Title: Festival Legend|Shikigami: Koi-Ryu — air-swimming koi dragon|Golden Festival Crown|1,000 Tokens|Floating Lantern Backpiece|Firework Dragon KO|Sparkler Trail|1,000 Tokens|Festival Bell Earrings|Bon Odori emote|Title: Master of Matsuri|Shikigami: Taiko — drum spirit|Firework Antler Ornament|1,500 Tokens|Lantern Halo|Grand Festival Bow emote|Midnight Sky KO|1,500 Tokens|Golden Koi Backpiece|Firework Finale emote|Title: Six O'Clock Somewhere|Shikigami: Amateru — celestial festival dragon`],
  ['out-of-this-element-2027', 'Out of This Element', '2027-07-16', '2027-09-02', 'out-of-element.svg', `Starburst Hair Ornament|500 Tokens|Nebula Face Markings|Zero Gravity emote|Star Collapse KO|750 Tokens|Meteor Shoulder Ornament|Comet Trail|Title: Star Seeker|Shikigami: Hoshiko — star fox|Crescent Moon Earrings|500 Tokens|Stargazing emote|Cosmic Wristbands|Supernova KO|750 Tokens|Galaxy Halo|Floating Meditation emote|Title: Beyond the Stars|Shikigami: Ginga — galaxy turtle|Meteorite Faceplate|1,000 Tokens|Constellation Shoulder Charms|Planet Orbit emote|Black Hole KO|750 Tokens|Astral Antlers|Cosmic Dance emote|Title: Rift Walker|Shikigami: Sora-Kujira — celestial whale|Celestial Crown|1,000 Tokens|Nebula Backpiece|Dimensional Rift KO|Starlight Trail|1,000 Tokens|Floating Planet Accessory|Galaxy Spin emote|Title: Cosmic Champion|Shikigami: Tenmon — celestial owl|Solar Flare Face Accessory|1,500 Tokens|Cosmic Ring Halo|Astral Projection emote|Universe Collapse KO|1,500 Tokens|Star Dragon Backpiece|Constellation Master emote|Title: Out of This Element|Shikigami: Seiryū Nova — cosmic dragon`],
  ['sixth-eclipse-2027', 'The Sixth Eclipse', '2027-09-03', '2027-10-21', 'sixth-eclipse.svg', `Crimson Hair Ornament|500 Tokens|Eclipse Face Markings|Shadow Stance emote|Crimson Moon KO|750 Tokens|Dark Maple Shoulder Accessory|Blood Moon Trail|Title: Eclipse Watcher|Shikigami: Kurotsuki — black fox with red crescent|Shadow Horns|500 Tokens|Vanishing Shadow emote|Crimson Wrist Wraps|Eclipse Burst KO|750 Tokens|Blood Moon Halo|Dark Bow emote|Title: Moon's Chosen|Shikigami: Aka-Kage — shadow wolf|Maple Leaf Face Accessory|1,000 Tokens|Cursed Shoulder Mantle|Shadow Clone emote|Crimson Rift KO|750 Tokens|Dark Antler Ornament|Eclipse Meditation emote|Title: Harbinger|Shikigami: Tsukikage — spectral deer|Crimson Emperor Crown|1,000 Tokens|Shadow Wing Backpiece|Blood Moon Explosion KO|Red Eclipse Trail|1,000 Tokens|Cursed Mask|Moonlit Stare emote|Title: Master of the Eclipse|Shikigami: Yomikami — dark owl|Eclipse Antler Crown|1,500 Tokens|Crimson Aura Halo|Shadow Realm emote|Total Eclipse KO|1,500 Tokens|Blood Moon Back Ornament|Final Eclipse emote|Title: The Sixth Eclipse|Shikigami: Kōketsu — eclipse dragon`],
];

export const BATTLE_PASSES_2027 = Object.freeze(passRows.map(([id, name, start, end, banner, labels]) => Object.freeze({
  id,
  name,
  kind: 'battle-pass',
  startAt: `${start}T00:00:00.000Z`,
  endAt: `${end}T23:59:59.999Z`,
  banner: `assets/battle-passes/2027/${banner}`,
  rewards: Object.freeze(rewardsFromLabels(id, labels)),
})));

const holidayRows = [
  ['new-year-2027', 'Six... Five... Four...', '2026-12-27', '2027-01-03', `1,500 Tokens|Golden Clock Head Accessory|Midnight Fireworks KO|Shikigami: Toki — clockwork fox with golden gears|Title: First Legend of 2027|Shikigami: Toshigami — New Year spirit with golden aura`],
  ['love-at-first-fight', 'Love at First Fight', '2027-02-11', '2027-02-17', `1,000 Tokens|Heart-shaped Hair Clips|Cupid's Arrow KO|Shikigami: Amore — pink rabbit with heart ears|Title: Love at First Fight|Heart Halo accessory`],
  ['luck-of-the-sixth', 'Luck of the Sixth', '2027-03-14', '2027-03-20', `1,000 Tokens|Four-Leaf Clover Head Accessory|Pot of Gold KO|Shikigami: Cloverkin — green clover deer|Title: Luck of the Sixth`],
  ['egg-stinction-event', 'Egg-stinction Event', '2027-03-25', '2027-03-31', `1,000 Tokens|Bunny Ear Head Accessory|Eggsplosion KO|Shikigami: Eggbert — pastel egg creature with bunny ears|Title: Egg Hunter|Spring Basket Backpiece`],
  ['elemental-prank', 'April Fools: The Elemental Prank', '2027-04-01', '2027-04-07', `1,000 Tokens|Oversized Clown Nose|Cartoon Bonk KO|Shikigami: Boingo — mischievous bouncing jester spirit|Title: Certified Menace|Spring-Loaded Party Hat`],
  ['planet-of-the-elements', 'Planet of the Elements', '2027-04-19', '2027-04-25', `1,000 Tokens|Leaf Crown|Nature Bloom KO|Shikigami: Midoriko — moss-covered forest spirit|Title: Guardian of Gaia|Living Vine Backpiece`],
  ['trick-or-beatdown', 'Trick or Beatdown', '2027-10-22', '2027-10-31', `1,500 Tokens|Pumpkin Head Accessory|Ghostly Vanish KO|Shikigami: Booji — floating ghost with pumpkin lantern|Title: Nightmare of Element 6|Haunted Lantern Backpiece|Shikigami: Kabocha-Kami — pumpkin spirit with glowing vines and candles`],
  ['living-chronicles', 'The Living Chronicles', '2027-11-01', '2027-11-07', `1,000 Tokens|Marigold Flower Crown|Marigold Spirit KO|Shikigami: Cempasúchil — flower spirit with glowing petals|Title: Legend Eternal|Floral Skull Face Accessory`],
  ['thanks-for-the-elements', 'Thanks for the Elements', '2027-11-22', '2027-11-28', `1,000 Tokens|Harvest Leaf Headband|Golden Harvest KO|Shikigami: Kogane — golden harvest squirrel holding an acorn|Title: Grateful Guardian|Autumn Leaf Backpiece`],
  ['winter-wonderland', 'Winter Wonderland: Let It Glow!', '2027-12-01', '2027-12-26', `2,000 Tokens|Snowman Head Accessory|Snowflake Face Paint|Frosty Burst KO|Shikigami: Pompom — snowball penguin|Winter Scarf|1,000 Tokens|Frozen Star Halo|Blizzard KO|Shikigami: Yukihana — snow rabbit with crystal ears|Title: Winter Wonderland|Snowflake Backpiece|Shikigami: Fuyutsuki — winter spirit fox with aurora tail`],
  ['new-year-2028', 'Six... Five... Four...', '2027-12-27', '2028-01-03', `1,500 Tokens|Golden Clock Head Accessory|Midnight Fireworks KO|Shikigami: Toki — clockwork fox with golden gears|Title: First Legend of 2028|Shikigami: Toshigami — New Year spirit with golden aura`],
];

export const HOLIDAY_EVENTS_2027 = Object.freeze(holidayRows.map(([id, name, start, end, labels]) => Object.freeze({
  id,
  name,
  kind: 'holiday',
  startAt: `${start}T00:00:00.000Z`,
  endAt: `${end}T23:59:59.999Z`,
  rewards: Object.freeze(rewardsFromLabels(id, labels)),
})));

export const SEASON_2027_TIER_COUNT = 50;
export const SEASON_2027_XP_PER_TIER = 1000;

function activeAt(event, date) {
  const time = date instanceof Date ? date.getTime() : new Date(date).getTime();
  return time >= Date.parse(event.startAt) && time <= Date.parse(event.endAt);
}

export function getActive2027BattlePass(date = new Date()) {
  return BATTLE_PASSES_2027.find(event => activeAt(event, date)) || null;
}

export function getActive2027Holiday(date = new Date()) {
  return HOLIDAY_EVENTS_2027.find(event => activeAt(event, date)) || null;
}

export function get2027EventById(id) {
  return BATTLE_PASSES_2027.find(event => event.id === id)
    || HOLIDAY_EVENTS_2027.find(event => event.id === id)
    || null;
}
