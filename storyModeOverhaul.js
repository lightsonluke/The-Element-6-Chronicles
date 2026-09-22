import { HEROES } from './heroes.js';
import { CANONICAL_SECTIONS, canonicalText } from './storyModeCanonical.js';

export const STORY_SAVE_SLOTS = 5;
export const STORY_SAVE_VERSION = 4;

// The existing game has 23 playable heroes. Story Mode intentionally exposes the
// complete playable roster instead of applying the normal unlock gate. This does
// not alter unlock state anywhere else in the game.
export const ALL_STORY_HERO_IDS = HEROES.map(h => h.id);

const chapter = (id, title, canonicalTitle, kind='exploration', extra={}) => ({
  id, title, canonicalTitle, kind,
  text: canonicalText(canonicalTitle),
  ...extra
});

const books = [
  {
    id:'book1', number:1, title:'DAWN OF HEROES', era:'Sengoku-era Japan', hub:'Sengoku Overworld', biome:'sakura', gimmick:'Five Awakenings',
    stages:['traininggrounds','stormpeak','sunsetridge','obsidianfield','basic'],
    chapters:[
      chapter('b1_open','The Four Forces and the Shattering','10. BOOK I — DAWN OF HEROES','cinematic',{canon:true}),
      chapter('b1_awakenings','The Five Awakenings','BOOK I — ARC I: THE FIVE AWAKENINGS','exploration',{canon:true}),
      chapter('b1_thunder','Thunder Awakening','EVENT 1 — THUNDER AWAKENING','tutorial',{canon:true}),
      chapter('b1_fire','Fire Awakening','EVENT 2 — FIRE AWAKENING','survival',{canon:true}),
      chapter('b1_water','Water Awakening','EVENT 3 — WATER AWAKENING','traversal',{canon:true}),
      chapter('b1_grass','Grass Awakening','EVENT 4 — GRASS AWAKENING','exploration',{canon:true}),
      chapter('b1_ice','Ice Awakening','EVENT 5 — ICE AWAKENING','survival',{canon:true}),
      chapter('b1_mountain_pass','The Mountain Pass','ARC II — THE MOUNTAIN PASS','battle',{canon:true}),
      chapter('b1_strangers','Five Strangers, One Fire','ARC III — FIVE STRANGERS, ONE FIRE','exploration'),
      chapter('b1_war','The Hundred Blade War Begins','ARC IV — THE HUNDRED BLADE WAR BEGINS','war'),
      chapter('b1_reputations','Five Reputations','ARC V — FIVE REPUTATIONS','quests'),
      chapter('b1_mountain','The Mountain','ARC VI — THE MOUNTAIN','cinematic',{canon:true}),
      chapter('b1_war_end','The War’s End','ARC VII — THE WAR\'S END','cinematic',{canon:true}),
      chapter('b1_peace','The Long Peace','ARC VIII — THE LONG PEACE','montage'),
      chapter('b1_question','The Question','ARC IX — THE QUESTION','dialogue'),
      chapter('b1_succession','The Succession','ARC X — THE SUCCESSION','cinematic',{canon:true}),
      chapter('b1_transition','Transition — Book I → Book II','TRANSITION — BOOK I → BOOK II','transition',{canon:true}),
    ],
    matches:[
      {id:'b1_mountain_pass_battle',chapterId:'b1_mountain_pass',title:'The Mountain Pass — Kessho’s Army',stage:'traininggrounds',kind:'boss',stocks:3,time:180,difficulty:'hard',opponent:'red'},
      {id:'b1_hundred_blade',chapterId:'b1_war',title:'Hundred Blade War — Critical Battle',stage:'traininggrounds',kind:'war',stocks:3,time:210,difficulty:'hard',opponent:'purple'},
    ],
    sideQuests:['rescue villagers','protect caravans','help temples','investigate abandoned battlefields','recover lost Generation I relics','find Thunder journal fragments','find traces of the Ice Hero']
  },
  {
    id:'book2', number:2, title:'KINGDOMS AT WAR', era:'Kurenai / Shirasagi Borderlands', hub:'Ashen Monastery', biome:'ash', gimmick:'Corps Roll Call',
    stages:['traininggrounds','midnighttower','shadowrealm','toxicmarsh','emberforge','splitcity','voidplane'],
    chapters:[
      chapter('b2_open','The New Legends','ARC I — THE NEW LEGENDS','exploration'),
      chapter('b2_broken_clan','The Broken Clan','ARC II — THE BROKEN CLAN','investigation'),
      chapter('b2_itto_first','Ittō — First Encounter','MAJOR BATTLE — ITTŌ FIRST ENCOUNTER','battle',{canon:true}),
      chapter('b2_echoes','Echoes of Thunder','ARC III — ECHOES OF THUNDER','exploration'),
      chapter('b2_rogues','The Rogue Elementors','ARC IV — THE ROGUE ELEMENTORS','quests'),
      chapter('b2_ibuki','Hollow Monk Ibuki','HOLLOW MONK IBUKI','battle'),
      chapter('b2_puppeteer','Nishikawa the Puppeteer','NISHIKAWA THE PUPPETEER','battle'),
      chapter('b2_foxes','Twin Foxes','TWIN FOXES','battle'),
      chapter('b2_siege','The Siege of the Eastern Castle','ARC V — THE SIEGE OF THE EASTERN CASTLE','battle'),
      chapter('b2_renji_itto','Ittō vs Renji','Ittō vs Renji','battle',{canon:true}),
      chapter('b2_temple','The Forgotten Temple','ARC VI — THE FORGOTTEN TEMPLE','investigation'),
      chapter('b2_fractures','Fractures Within','ARC VII — FRACTURES WITHIN','dialogue'),
      chapter('b2_yokai','The Great Yokai Hunt','ARC VIII — THE GREAT YOKAI HUNT','boss'),
      chapter('b2_enemy','Rise of the First Great Enemy','ARC IX — RISE OF THE FIRST GREAT ENEMY','cinematic'),
      chapter('b2_utsuro','Utsuro','UTSURO','boss',{canon:true}),
      chapter('b2_war','The War for Japan','ARC X — THE WAR FOR JAPAN','war'),
      chapter('b2_amayo','Amayo Fields','ARC X BATTLE — AMAYO FIELDS','battle',{canon:true}),
      chapter('b2_last_stand','The Last Stand','ARC XI — THE LAST STAND','battle',{canon:true}),
      chapter('b2_new_era','A New Era','ARC XII — A NEW ERA','transition',{canon:true}),
      chapter('b2_transition','Transition — Book II → Book III','TRANSITION — BOOK II → BOOK III','transition',{canon:true}),
    ],
    matches:[
      {id:'b2_itto_first_match',chapterId:'b2_itto_first',title:'Ittō — First Encounter',stage:'traininggrounds',kind:'narrative-loss',stocks:2,time:120,difficulty:'hard',opponent:'purple'},
      {id:'b2_ibuki_match',chapterId:'b2_ibuki',title:'Hollow Monk Ibuki',stage:'traininggrounds',kind:'boss',stocks:3,time:180,difficulty:'hard',opponent:'scarlet'},
      {id:'b2_foxes_match',chapterId:'b2_foxes',title:'Twin Foxes',stage:'traininggrounds',kind:'handicap',stocks:3,time:180,difficulty:'hard',opponent:'turquoise',enemyIds:['olive']},
      {id:'b2_siege_match',chapterId:'b2_siege',title:'Eastern Castle Siege',stage:'traininggrounds',kind:'waves',stocks:3,time:210,difficulty:'hard',opponent:'black'},
      {id:'b2_amayo_match',chapterId:'b2_amayo',title:'Amayo Fields',stage:'splitcity',kind:'war',stocks:4,time:240,difficulty:'honored',opponent:'crimson',enemyIds:['red','purple']},
      {id:'b2_utsuro_match',chapterId:'b2_utsuro',title:'Utsuro — Final Stand',stage:'voidplane',kind:'boss',stocks:4,time:240,difficulty:'honored',opponent:'scarlet'},
    ],
    sideQuests:['free controlled villagers','investigate missing travelers','bounty hunt rogue Elementors','locate hidden Fox clues','recover old Generation I artifacts','explore abandoned temples','investigate yokai sightings']
  },
  {
    id:'book3', number:3, title:'THE FALLEN AGE', era:'The Fallen Capital', hub:'Fallen Capital', biome:'blight', gimmick:'Tournament Circuit + Blight Containment',
    stages:['grandarena','toxicmarsh','lavafalls','shadowrealm','basic','underworld','thunderdome'],
    chapters:[
      chapter('b3_world','The World That Needs Them','ARC I — THE WORLD THAT NEEDS THEM','exploration'),
      chapter('b3_tournament','The Tournament Circuit','ARC II — THE TOURNAMENT CIRCUIT','tournament'),
      chapter('b3_utsuro','What Utsuro Left Behind','ARC III — WHAT UTSURO LEFT BEHIND','investigation'),
      chapter('b3_market','The Market Beneath the Market','ARC IV — THE MARKET BENEATH THE MARKET','exploration'),
      chapter('b3_daimyo','The Daimyo’s Bargain','ARC V — THE DAIMYO\'S BARGAIN','political'),
      chapter('b3_divide','The Widening Divide','ARC VI — THE WIDENING DIVIDE','dialogue'),
      chapter('b3_ring','The Extraction Ring','ARC VII — THE EXTRACTION RING','investigation',{canon:true}),
      chapter('b3_ogata','Ogata','OGATA','boss'),
      chapter('b3_bone','The Bone Debt','ARC VIII — THE BONE DEBT','dialogue'),
      chapter('b3_reckoning','The Reckoning at the Capital','ARC IX — THE RECKONING AT THE CAPITAL','war',{canon:true}),
      chapter('b3_fake_arm','The Man With the Fake Arm','ARC X — THE MAN WITH THE FAKE ARM','mystery'),
      chapter('b3_transition','Transition — Book III → Book IV','TRANSITION — BOOK III → BOOK IV','transition',{canon:true}),
    ],
    matches:[
      {id:'b3_tournament_match',chapterId:'b3_tournament',title:'Grand Tournament — Opening Round',stage:'grandarena',kind:'tournament',stocks:2,time:150,difficulty:'regular',opponent:'yellow'},
      {id:'b3_ogata_match',chapterId:'b3_ogata',title:'Ogata',stage:'traininggrounds',kind:'boss',stocks:3,time:180,difficulty:'hard',opponent:'magenta'},
      {id:'b3_reckoning_match',chapterId:'b3_reckoning',title:'Blight Reckoning at the Capital',stage:'traininggrounds',kind:'waves',stocks:4,time:240,difficulty:'hard',opponent:'green',enemyIds:['grey','blue']},
    ],
    sideQuests:['tournament side matches','black-market investigations','Assembly requests','Blight containment','political errands','missing-person cases','underground merchant quests','hidden extraction laboratories']
  },
  {
    id:'book4', number:4, title:'THE HERO CORPS', era:'Hero Corps Era', hub:'Hero Corps Tower', biome:'tower', gimmick:'Two Names + Resonance Tech',
    stages:['cobaltmines','neonspire','midnighttower','splitcity'],
    chapters:[
      chapter('b4_colors','The Colors They Chose','ARC I — THE COLORS THEY CHOSE','cinematic'),
      chapter('b4_ring','The Ring Returns','ARC II — THE RING RETURNS','investigation'),
      chapter('b4_renko','Renko Kurenai','RENKO KURENAI','boss'),
      chapter('b4_powerless','What’s Left When the Power Goes','ARC III — WHAT\'S LEFT WHEN THE POWER GOES','special'),
      chapter('b4_dark','The Man in the Dark','ARC IV — THE MAN IN THE DARK','mystery'),
      chapter('b4_controller_name','The Name They Gave Him','ARC V — THE NAME THEY GAVE HIM','mystery'),
      chapter('b4_controller','The Controller','THE CONTROLLER','cinematic'),
      chapter('b4_siege','The Siege of the Tower','ARC VI — THE SIEGE OF THE TOWER','battle'),
      chapter('b4_sota','The Child in the Rubble','ARC VII — THE CHILD IN THE RUBBLE','exploration',{canon:true}),
      chapter('b4_source','The Source','ARC VIII — THE SOURCE','investigation'),
      chapter('b4_gold','What Gold Gave','ARC IX — WHAT GOLD GAVE','battle',{canon:true}),
      chapter('b4_end','The One Who Stays','ARC X — THE ONE WHO STAYS','transition',{canon:true}),
      chapter('b4_transition','Transition — Book IV → Book V','TRANSITION — BOOK IV → BOOK V','transition',{canon:true}),
    ],
    matches:[
      {id:'b4_renko_match',chapterId:'b4_renko',title:'Renko Kurenai',stage:'traininggrounds',kind:'boss',stocks:3,time:180,difficulty:'hard',opponent:'corpent'},
      {id:'b4_siege_match',chapterId:'b4_siege',title:'Hero Corps Tower Siege',stage:'traininggrounds',kind:'waves',stocks:4,time:240,difficulty:'hard',opponent:'controller'},
      {id:'b4_source_match',chapterId:'b4_source',title:'The Source — Extraction Facility',stage:'traininggrounds',kind:'boss',stocks:4,time:240,difficulty:'honored',opponent:'controller'},
    ],
    sideQuests:['Ring facility investigations','rescue stolen Elementors','protect construction workers','tower defense','technological prototype quests','Controller investigation','civilian rescue missions']
  },
  {
    id:'book5', number:5, title:'HEROES OF COLOR', era:'Split City / Cosmic Era', hub:'Split City', biome:'cosmic', gimmick:'The Full Roster',
    stages:['splitcity','colossalcoliseum','cobaltmines','mintgardens','obsidianfield','frozenlake','toxicmarsh','cosmicvoid','tidalreef','shadowrealm','voidplane','realitynexus'],
    chapters:[
      chapter('b5_creation','The Creation Arc','ARC I — THE CREATION ARC','cinematic',{canon:true}),
      chapter('b5_crimson','The Crimson Arc','ARC II — THE CRIMSON ARC','character'),
      chapter('b5_tournament','The Tournament Arc','ARC III — THE TOURNAMENT ARC','tournament'),
      chapter('b5_hammer','The Hammer and the Pull','ARC IV — THE HAMMER AND THE PULL','battle'),
      chapter('b5_corpent','Corpent','CORPENT','boss'),
      chapter('b5_magneto','Magneto','MAGNETO','boss'),
      chapter('b5_roots','Roots and Ruin','ARC V — ROOTS AND RUIN','exploration'),
      chapter('b5_willow','Willow','WILLOW','boss'),
      chapter('b5_fire_frost','Where Fire Meets Frost','ARC VI — WHERE FIRE MEETS FROST','battle'),
      chapter('b5_poison','The Poison Garden and the Waking Nightmare','ARC VII — THE POISON GARDEN AND THE WAKING NIGHTMARE','hazard'),
      chapter('b5_pink_betrayal','The Pink Betrayal Arc','ARC VIII — THE PINK BETRAYAL ARC','narrative',{canon:true}),
      chapter('b5_pink_save','The Saving Pink Arc','ARC IX — THE SAVING PINK ARC','intervention',{canon:true}),
      chapter('b5_silver_steps','Silver Steps Down','SILVER STEPS DOWN','transition',{canon:true}),
      chapter('b5_controller_war','The Controller War','ARC X — THE CONTROLLER WAR','war',{canon:true}),
      chapter('b5_split_city','First Major Clash — Split City','FIRST MAJOR CLASH — SPLIT CITY','battle'),
      chapter('b5_crimson_redemption','Crimson’s Redemption','CRIMSON\'S REDEMPTION','battle',{canon:true}),
      chapter('b5_controller_final','Final Controller Battle','FINAL CONTROLLER BATTLE','boss',{canon:true}),
      chapter('b5_purge','The Elementor Purge','ARC XI — THE ELEMENTOR PURGE','aftermath'),
      chapter('b5_evil_discovery','Discovering Evil','ARC XII — DISCOVERING EVIL','cinematic',{canon:true}),
      chapter('b5_evil','Evil','EVIL','boss',{canon:true}),
      chapter('b5_evil_war','The Evil War','ARC XIII — THE EVIL WAR','cosmic',{canon:true}),
      chapter('b5_silver_sacrifice','Silver’s Final Sacrifice','SILVER\'S FINAL SACRIFICE','cinematic',{canon:true}),
      chapter('b5_final','Final Battle','FINAL BATTLE','final',{canon:true}),
      chapter('b5_forces','Post-Battle — The Four Forces','POST-BATTLE — THE FOUR FORCES','epilogue',{canon:true}),
      chapter('b5_epilogue','Final Epilogue','FINAL EPILOGUE','epilogue',{canon:true}),
    ],
    matches:[
      {id:'b5_crimson_red_match',chapterId:'b5_crimson',title:'Crimson vs. Red',stage:'traininggrounds',kind:'narrative-loss',stocks:2,time:150,difficulty:'hard',opponent:'crimson'},
      {id:'b5_tournament_match',chapterId:'b5_tournament',title:'Grand Tournament',stage:'traininggrounds',kind:'tournament',stocks:2,time:180,difficulty:'hard',opponent:'yellow'},
      {id:'b5_corpent_match',chapterId:'b5_corpent',title:'Corpent',stage:'traininggrounds',kind:'boss',stocks:3,time:180,difficulty:'hard',opponent:'corpent'},
      {id:'b5_magneto_match',chapterId:'b5_magneto',title:'Magneto',stage:'traininggrounds',kind:'boss',stocks:3,time:180,difficulty:'hard',opponent:'magneto'},
      {id:'b5_willow_match',chapterId:'b5_willow',title:'Willow',stage:'traininggrounds',kind:'boss',stocks:3,time:180,difficulty:'hard',opponent:'willow'},
      {id:'b5_fire_frost_match',chapterId:'b5_fire_frost',title:'Kirsten / Snodvor / Cable / Volt',stage:'traininggrounds',kind:'gauntlet',stocks:4,time:240,difficulty:'honored',opponent:'kirsten',enemyIds:['snodvor','cable','volt']},
      {id:'b5_nightmare_match',chapterId:'b5_poison',title:'The Nightmare',stage:'cosmicvoid',kind:'boss',stocks:3,time:180,difficulty:'honored',opponent:'nightmare'},
      {id:'b5_pink_match',chapterId:'b5_pink_save',title:'Saving Pink — Intervention',stage:'traininggrounds',kind:'narrative',stocks:3,time:210,difficulty:'hard',opponent:'pink'},
      {id:'b5_controller_war_match',chapterId:'b5_controller_war',title:'Controller War — Split City',stage:'splitcity',kind:'war',stocks:4,time:240,difficulty:'honored',opponent:'controller'},
      {id:'b5_crimson_sacrifice_match',chapterId:'b5_crimson_redemption',title:'Crimson’s Redemption',stage:'traininggrounds',kind:'narrative-loss',stocks:3,time:210,difficulty:'honored',opponent:'crimson'},
      {id:'b5_controller_final_match',chapterId:'b5_controller_final',title:'Reality Nexus — The Controller',stage:'voidplane',kind:'boss',stocks:4,time:240,difficulty:'honored',opponent:'controller'},
      {id:'b5_evil_match',chapterId:'b5_evil',title:'EVIL — Final Battle',stage:'voidplane',kind:'final',stocks:5,time:300,difficulty:'honored',opponent:'evil'},
      {id:'b5_final_match',chapterId:'b5_final',title:'Final Battle — Restore Equilibrium',stage:'voidplane',kind:'final',stocks:5,time:300,difficulty:'honored',opponent:'evil'},
    ],
    sideQuests:['tournament matches','villain investigations','cosmic anomalies','missing Elementor missions','Nightmare investigations','Controller remnants','reality fractures','postwar reconstruction']
  }
];

export const STORY_BOOKS = books;
export const STORY_ARCS = books.flatMap(b => b.chapters);
export const CANON_LOCKS = new Set(STORY_ARCS.filter(c=>c.canon).map(c=>c.id));

export const BOOK_ROLE_RULES = {
  book1:{anchor:'thunder',secondary:['fire','water','grass','ice'],fallback:['yellow','red','blue','green','purple']},
  book2:{anchor:'renji',secondary:['kaito','hana','daigo','osamu','mai','yui','suzu'],fallback:['grey','turquoise','olive','copper','emerald','pearl','lavender']},
  book3:{anchor:'takeshi',secondary:['aiko','haru','chiyo','emi','ryo','masaru','nozomi'],fallback:['orange','magenta','amber','black','indigo','maroon','crimson']},
  book4:{anchor:'cobalt',secondary:['cyan','onyx','gold','vermilion','umber','graphite','daichi'],fallback:['blue','grey','green','yellow','red','silver','white']},
  book5:{anchor:'silver-indigo',secondary:['roster'],fallback:ALL_STORY_HERO_IDS}
};

export function defaultStoryProgress(heroId='yellow') {
  return {
    version:STORY_SAVE_VERSION, storyVersion:STORY_SAVE_VERSION, storyInitialized:true,
    selectedHeroId:heroId,currentHeroId:heroId,currentBook:1,currentChapterIndex:0,currentArea:'book1_start',currentX:80,currentY:430,
    viewedBeats:[],completedChapters:[],wonMatches:[],nonVillainWins:[],sidegrounds:[],gimmickObjectives:[],
    defeatedVillains:[],collectedShards:0,residue:0,shardVaults:[],bountyWins:[],inventory:{},hotbar:Array(9).fill(null),blockMods:{},
    roleAssignments:{},swapHistory:[],lastSave:Date.now(),cutsceneSeen:false,epilogueUnlocked:false,mainStoryComplete:false,
    discoveredAreas:[],completedSideQuests:[],completedBounties:[],viewedLore:[],flags:{},playtimeSeconds:0
  };
}

export function mergeStoryProgress(progress,heroId='yellow') {
  const base=defaultStoryProgress(heroId);
  const p={...base,...(progress||{})};
  p.version=STORY_SAVE_VERSION;p.storyVersion=STORY_SAVE_VERSION;p.selectedHeroId=p.selectedHeroId||heroId;p.currentHeroId=p.currentHeroId||heroId;
  for(const k of ['viewedBeats','completedChapters','wonMatches','nonVillainWins','sidegrounds','gimmickObjectives','defeatedVillains','shardVaults','bountyWins','swapHistory','discoveredAreas','completedSideQuests','completedBounties','viewedLore']) p[k]=Array.isArray(p[k])?p[k]:[];
  p.inventory=p.inventory&&typeof p.inventory==='object'?p.inventory:{};p.flags=p.flags&&typeof p.flags==='object'?p.flags:{};
  return p;
}

export function calculateStoryProgress(p={}) {
  const beatsTotal=STORY_ARCS.length;
  const matchesTotal=books.reduce((n,b)=>n+b.matches.length,0);
  const viewed=new Set(p.viewedBeats||[]).size;
  const won=new Set(p.wonMatches||[]).size;
  const nonVillain=new Set(p.nonVillainWins||[]).size;
  const side=new Set(p.sidegrounds||[]).size;
  const gimmicks=new Set(p.gimmickObjectives||[]).size;
  return Math.min(100,Math.round(
    viewed/Math.max(1,beatsTotal)*30 +
    won/Math.max(1,matchesTotal)*30 +
    nonVillain/Math.max(1,Math.ceil(matchesTotal*.55))*20 +
    Math.min(1,side/25)*15 +
    Math.min(1,gimmicks/10)*5
  ));
}

export function getBookForProgress(p={}) { return books[Math.max(0,Math.min(4,(p.currentBook||1)-1))]; }
export function getChapter(bookId,chapterId) { return books.find(b=>b.id===bookId)?.chapters.find(c=>c.id===chapterId)||null; }
export function getChapterIndex(book,chapterId){return book?.chapters?.findIndex(c=>c.id===chapterId)??-1;}
export function canonicalTextForChapter(chapterId){return STORY_ARCS.find(c=>c.id===chapterId)?.text||'';}
export { CANONICAL_SECTIONS, canonicalText } from './storyModeCanonical.js';
