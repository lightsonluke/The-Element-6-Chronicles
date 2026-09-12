export const STORY_BOOKS = [
  {
    id: 'book1', number: 1, title: 'DAWN OF HEROES', era: 'Sengoku Japan', biome: 'sakura',
    hub: 'Sengoku Overworld', anchor: 'Thunder Hero',
    secondary: ['Fire Hero','Water Hero','Grass Hero','Ice Hero'],
    stages: ['traininggrounds','sunsetridge','stormpeak','obsidianfield'],
    gimmick: 'Five Awakenings',
    beats: ['awakening_lightning','awakening_fire','awakening_water','awakening_grass','awakening_ice','mountain','journal'],
    matches: [
      { id:'b1_kessho_guard', title:"Kessho's Honor Guard", stage:'traininggrounds', kind:'trial', stocks:1, time:120, difficulty:'easy' },
      { id:'b1_ronin', title:'Rival Ronin', stage:'sunsetridge', kind:'rival', stocks:2, time:150, difficulty:'normal' },
      { id:'b1_commander', title:"Kessho's Army Commander", stage:'stormpeak', kind:'boss', stocks:3, time:180, difficulty:'hard' },
      { id:'b1_ambush', title:"Kurenai's Ambush General", stage:'obsidianfield', kind:'boss', stocks:3, time:180, difficulty:'hard' },
    ]
  },
  {
    id: 'book2', number: 2, title: 'KINGDOMS AT WAR', era: 'Kurenai / Shirasagi Borderlands', biome: 'ash',
    hub: 'Ashen Monastery', anchor: 'Renji Kurogane', secondary: ['Kaito','Hana','Daigo','Osamu','Mai','Yui','Suzu'],
    stages: ['crimsonarena','midnighttower','shadowrealm','toxicmarsh','emberforge','splitcity','voidplane'],
    gimmick: 'Corps Roll Call',
    beats: ['corps_rollcall','itto_first','itto_rematch','foxes','puppeteer','ibuki','utsuro_phase1','utsuro_final'],
    matches: [
      { id:'b2_itto_first', title:'Ittō — First Encounter', stage:'crimsonarena', kind:'narrative-loss', stocks:2, time:120, difficulty:'hard' },
      { id:'b2_itto_rematch', title:'Ittō — Eastern Castle', stage:'midnighttower', kind:'rival', stocks:3, time:180, difficulty:'hard' },
      { id:'b2_foxes', title:'Twin Foxes', stage:'shadowrealm', kind:'handicap', enemyIds:['reiko','ren'], stocks:2, time:150, difficulty:'hard' },
      { id:'b2_puppeteer', title:"Nishikawa's Possessed Villagers", stage:'toxicmarsh', kind:'waves', stocks:3, time:180, difficulty:'hard' },
      { id:'b2_ibuki', title:'Hollow Monk Ibuki', stage:'emberforge', kind:'boss', stocks:3, time:180, difficulty:'hard' },
      { id:'b2_utsuro1', title:'Utsuro — Phase I', stage:'splitcity', kind:'boss', stocks:3, time:180, difficulty:'hard' },
      { id:'b2_utsuro2', title:'Utsuro — Final Form', stage:'voidplane', kind:'boss', stocks:4, time:210, difficulty:'very-hard' },
    ]
  },
  {
    id:'book3', number:3, title:'THE FALLEN AGE', era:'The Fallen Capital', biome:'blight', hub:'Fallen Capital', anchor:'Takeshi Sando',
    secondary:['Aiko Hone','Haru Garasu','Chiyo Doku','Emi Chi','Ryo Kiri','Masaru Hai','Nozomi Toge'],
    stages:['thunderdome','grandarena','toxicmarsh','lavafalls','shadowrealm','basic','underworld'], gimmick:'Tournament Circuit + Blight Containment',
    beats:['tournament','blight','extraction_ring','ogata','yokai_spider','yokai_oni','yokai_fox','fake_arm'],
    matches:[
      {id:'b3_enforcer',title:"Merchant's Enforcer",stage:'toxicmarsh',kind:'rival',stocks:2,time:150,difficulty:'normal'},
      {id:'b3_tournament',title:'Tournament Circuit',stage:'grandarena',kind:'tournament',stocks:2,time:150,difficulty:'normal'},
      {id:'b3_extraction',title:'Extraction Ring Enforcers',stage:'basic',kind:'waves',stocks:2,time:120,difficulty:'normal'},
      {id:'b3_ogata',title:'Ogata',stage:'underworld',kind:'boss',stocks:3,time:180,difficulty:'hard'},
      {id:'b3_spider',title:'Blight-Born Spider Yokai',stage:'toxicmarsh',kind:'boss',stocks:3,time:180,difficulty:'hard'},
      {id:'b3_oni',title:'Blight-Born Oni',stage:'lavafalls',kind:'boss',stocks:3,time:180,difficulty:'hard'},
      {id:'b3_fox',title:'Blight-Born Nine-Tail',stage:'shadowrealm',kind:'boss',stocks:3,time:180,difficulty:'hard'},
    ]
  },
  {
    id:'book4', number:4, title:'THE HERO CORPS', era:'Hero Corps Era', biome:'tower', hub:'Hero Corps Tower', anchor:'Kenji Aoyama / Cobalt', secondary:['Reiji / Cyan','Ayaka / Onyx','Sora / Gold','Haruto / Vermilion','Yumi / Umber','Chika / Graphite','Daichi'],
    stages:['cobaltmines','neonspire','midnighttower'], gimmick:'Two Names + Resonance Tech',
    beats:['charter','two_names','safehouse_sweep','controller_chase','renko','tower_siege','source','gold_sacrifice'],
    matches:[
      {id:'b4_enforcers',title:'Ring Enforcer Ambush',stage:'cobaltmines',kind:'waves',stocks:2,time:150,difficulty:'normal'},
      {id:'b4_renko',title:'Renko Kurenai',stage:'neonspire',kind:'boss',stocks:3,time:180,difficulty:'hard'},
      {id:'b4_siege',title:'Hero Corps Tower Siege',stage:'midnighttower',kind:'waves',stocks:3,time:210,difficulty:'hard'},
    ]
  },
  {
    id:'book5', number:5, title:'HEROES OF COLOR', era:'Split City / Cosmic Era', biome:'cosmic', hub:'Split City', anchor:'Silver → Indigo', secondary:['Pink','Red','Crimson','Black','Yellow','Maroon','Magenta','Blue','Green','Purple','White','Grey','Lavender','Orange','Turquoise','Olive','Copper','Pearl','Scarlet'],
    stages:['traininggrounds','grandarena','colossalcoliseum','thunderdome','cobaltmines','mintgardens','obsidianfield','frozenlake','toxicmarsh','cosmicvoid','tidalreef','shadowrealm','splitcity','voidplane'], gimmick:'The Full Roster',
    beats:['crimson_red','tournament','corpent','magneto','willow','temple','four_boss_gauntlet','hazel_whami','nightmare','pink_betrayal','controller','war','crimson_sacrifice','reality_nexus','magenta_sacrifice','evil','epilogue'],
    matches:[
      {id:'b5_crimson_red',title:'Crimson vs. Red',stage:'traininggrounds',kind:'narrative-loss',stocks:2,time:150,difficulty:'hard'},
      {id:'b5_tournament',title:'Grand Tournament',stage:'colossalcoliseum',kind:'tournament',stocks:2,time:150,difficulty:'hard'},
      {id:'b5_corpent',title:'Corpent',stage:'cobaltmines',kind:'boss',stocks:3,time:180,difficulty:'hard'},
      {id:'b5_magneto',title:'Magneto',stage:'cobaltmines',kind:'boss',stocks:3,time:180,difficulty:'hard'},
      {id:'b5_willow',title:'Willow',stage:'mintgardens',kind:'boss',stocks:3,time:180,difficulty:'hard'},
      {id:'b5_temple',title:'Temple',stage:'obsidianfield',kind:'boss',stocks:3,time:180,difficulty:'hard'},
      {id:'b5_gauntlet',title:'Kirsten / Snodvor / Cable / Volt',stage:'frozenlake',kind:'gauntlet',stocks:3,time:210,difficulty:'very-hard'},
      {id:'b5_hazel_whami',title:'Hazel & Whami',stage:'toxicmarsh',kind:'boss',enemyIds:['hazel','whami'],stocks:3,time:210,difficulty:'very-hard'},
      {id:'b5_nightmare',title:'The Nightmare',stage:'cosmicvoid',kind:'boss',stocks:3,time:180,difficulty:'very-hard'},
      {id:'b5_pink',title:'Corrupted Pink',stage:'tidalreef',kind:'boss',stocks:3,time:180,difficulty:'hard'},
      {id:'b5_controller',title:'The Controller',stage:'shadowrealm',kind:'boss',stocks:4,time:210,difficulty:'very-hard'},
      {id:'b5_war',title:'Controller War',stage:'splitcity',kind:'boss',stocks:4,time:240,difficulty:'very-hard'},
      {id:'b5_final_controller',title:'Reality Nexus — The Controller',stage:'voidplane',kind:'boss',stocks:4,time:240,difficulty:'very-hard'},
      {id:'b5_evil',title:'EVIL — Final Battle',stage:'cosmicvoid',kind:'final',enemyIds:['evil'],stocks:5,time:300,difficulty:'very-hard'},
    ]
  }
];

export const BOOK_ROLE_RULES = {
  book1:{anchor:'thunder', secondary:['fire','water','grass','ice'], fallback:['grass','water','fire','ice']},
  book2:{anchor:'renji', secondary:['kaito','hana','daigo','osamu','mai','yui','suzu'], fallback:['daigo','hana','kaito','mai','osamu','suzu','yui']},
  book3:{anchor:'takeshi', secondary:['aiko','haru','chiyo','emi','ryo','masaru','nozomi'], fallback:['haru','aiko','nozomi','chiyo','masaru','ryo','emi']},
  book4:{anchor:'cobalt', secondary:['cyan','onyx','gold','vermilion','umber','graphite','daichi'], fallback:['umber','vermilion','cyan','onyx','graphite','gold','daichi']},
  book5:{anchor:'silver-indigo', secondary:['roster'], fallback:['roster']}
};

export const CANON_LOCKS = new Set(['mountain','utsuro_final','gold_sacrifice','crimson_sacrifice','magenta_sacrifice','evil','silver_indigo_succession']);

export function defaultStoryProgress(heroId='yellow') {
  return {
    version: 2, storyVersion: 2, storyInitialized: true, selectedHeroId: heroId, currentHeroId: heroId,
    currentBook: 1, currentBeat: 0, currentArea: 'book1_start', currentX: 360, currentY: 0,
    viewedBeats: [], wonMatches: [], nonVillainWins: [], sidegrounds: [], gimmickObjectives: [],
    defeatedVillains: [], collectedShards: 0, residue: 0, shardVaults: [], bountyWins: [],
    inventory: {}, hotbar: Array(9).fill(null), blockMods: {},
    roleAssignments: {}, swapHistory: [], lastSave: Date.now(),
    cutsceneSeen: false, epilogueUnlocked: false
  };
}

export function calculateStoryProgress(p={}) {
  const beatsTotal = STORY_BOOKS.reduce((n,b)=>n+b.beats.length,0);
  const matchTotal = STORY_BOOKS.reduce((n,b)=>n+b.matches.length,0);
  const viewed = new Set(p.viewedBeats||[]).size;
  const won = new Set(p.wonMatches||[]).size;
  const nonVillain = new Set(p.nonVillainWins||[]).size;
  const side = new Set(p.sidegrounds||[]).size;
  const gimmicks = new Set(p.gimmickObjectives||[]).size;
  const sideTotal = 25;
  const gimmickTotal = 5;
  return Math.round((viewed/Math.max(1,beatsTotal))*30 + (won/Math.max(1,matchTotal))*30 + (nonVillain/Math.max(1,Math.ceil(matchTotal*.55)))*20 + (side/sideTotal)*15 + (gimmicks/gimmickTotal)*5);
}

export function getBookForProgress(p={}) { return STORY_BOOKS[Math.max(0, Math.min(4,(p.currentBook||1)-1))]; }

export function findHero(id) { return null; }
