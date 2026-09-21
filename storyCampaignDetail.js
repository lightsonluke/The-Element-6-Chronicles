// Part 21 — detailed Story Mode world bible and runtime scene definitions.
// This file deliberately uses the existing roster/stage systems; it only supplies the adventure layer.

const P = (x,y,w,h=22,kind='stone') => ({x,y,w,h,kind});
const N = (x,y,name,role,dialogue,shop=null) => ({x,y,name,role,dialogue,shop});
const S = (id,title,arc,description,palette,structures,platforms,npcs,weather,hazards,landmarks) => ({id,title,arc,description,palette,structures,platforms,npcs,weather,hazards,landmarks});

const palettes = {
  dawn:{sky:'#101827',horizon:'#263b4d',far:'#304b52',mid:'#5d5a55',ground:'#2b2724',accent:'#f2b7c7',light:'#ffdca6'},
  war:{sky:'#171518',horizon:'#3b2d2c',far:'#4a3530',mid:'#68463b',ground:'#211b1a',accent:'#d89a63',light:'#f5d5a0'},
  fallen:{sky:'#120f18',horizon:'#2b2030',far:'#3b2939',mid:'#60414b',ground:'#1b171c',accent:'#c57a9b',light:'#e6c1d3'},
  corps:{sky:'#0c121b',horizon:'#1c2c3a',far:'#243746',mid:'#3b5562',ground:'#10161b',accent:'#63c9e8',light:'#b8efff'},
  cosmic:{sky:'#050510',horizon:'#10152b',far:'#1b2041',mid:'#33285a',ground:'#080811',accent:'#c4a2ff',light:'#eef0ff'}
};

function sceneSeries(book,pal,baseNames,arcNames,descriptions,structures,npcSets,weather,hazards){
  return baseNames.map((title,i)=>S(
    `${book}_scene_${i+1}`,
    title,
    arcNames[i]||arcNames[arcNames.length-1],
    descriptions[i]||'A story region connected to the surrounding world.',
    pal,
    structures[i]||[],
    [P(0,500,430),P(480,450,280),P(820,390,240),P(1110,470,420),P(1580,420,300),P(1960,500,430),P(2440,445,310),P(2840,375,280),P(3220,470,430),P(3700,410,340),P(4140,490,580)],
    npcSets[i]||[],
    weather[i]||'clear',
    hazards[i]||[],
    structures[i]?.filter(x=>x.kind==='landmark').map(x=>x.label)||[]
  ));
}

const books = {
  1:{
    id:'book1',number:1,title:'DAWN OF HEROES',hub:'Sengoku Overworld',era:'Sengoku Japan',palette:palettes.dawn,
    scenes:sceneSeries('book1',palettes.dawn,
      ['Storm Rice Fields','Blizzard Monastery','Flooded River','Buried Garden','Northern Whiteout','Mountain Pass','Five Heroes Camp','Warlord Road','The Split Mountain','Quiet Village','Thunder Training Field'],
      ['The Five Awakenings','The Five Awakenings','The Five Awakenings','The Five Awakenings','The Five Awakenings','The Mountain Pass','Five Strangers, One Fire','Hundred Blade War','The Mountain','The Long Peace','The Succession'],
      [
        'A rain-soaked rice valley where the first awakening is treated as a playable tutorial. Lightning forks over paddies, wooden bridges and a tiny farmhouse.',
        'A snowbound temple courtyard surrounds a dying brazier. The route alternates between sheltered walkways and exposed drifts.',
        'A swollen river cuts through a fishing settlement. Floating planks and stone banks create a vertical traversal route.',
        'A landslide has buried a terraced garden. Roots, soil and broken irrigation channels create an underground escape.',
        'A silent northern ridge under whiteout conditions. Visibility is low and the safest route follows old hunter markers.',
        'A long mountain battlefield with banners, siege wagons and burning supply tents. The five heroes first stand together here.',
        'A quiet campfire valley after battle. Optional conversations establish Fire, Water, Grass, Ice and Thunder as people rather than legends.',
        'A road between provinces filled with war camps, messengers and villages asking for help. Encounters are spaced out to preserve quiet travel.',
        'A gigantic split mountain dominates the skyline. This is a canon spectacle area, not a conventional boss arena.',
        'A peaceful postwar settlement with repaired homes, shrine paths and old battle markers slowly being reclaimed by nature.',
        'Thunder’s training grounds: rain, wooden dummies, stone circles and a small journal shelter. The succession is deliberately quiet.'
      ],
      [
        [{kind:'building',x:70,y:335,w:170,h:165,label:'Farmhouse'},{kind:'tree',x:300,y:300,h:200,label:'Sakura'},{kind:'landmark',x:690,y:285,w:100,h:110,label:'Storm Shrine'}],
        [{kind:'building',x:80,y:310,w:210,h:190,label:'Ashen Monastery'},{kind:'tree',x:680,y:300,h:180,label:'Snow Pine'},{kind:'landmark',x:380,y:250,w:190,h:80,label:'Brazier Court'}],
        [{kind:'building',x:90,y:340,w:170,h:160,label:'Fisher House'},{kind:'bridge',x:500,y:365,w:300,h:18,label:'River Bridge'},{kind:'tree',x:850,y:290,h:210,label:'Flood Willow'}],
        [{kind:'building',x:60,y:355,w:190,h:145,label:'Garden Shed'},{kind:'tree',x:330,y:260,h:240,label:'Rooted Cedar'},{kind:'landmark',x:740,y:300,w:150,h:100,label:'Buried Gate'}],
        [{kind:'tree',x:120,y:220,h:280,label:'White Pine'},{kind:'landmark',x:470,y:300,w:220,h:80,label:'Hunter Shrine'},{kind:'tree',x:820,y:210,h:290,label:'Frozen Pine'}],
        [{kind:'building',x:70,y:340,w:180,h:160,label:'War Camp'},{kind:'banner',x:360,y:230,h:270,label:'Kessho Banner'},{kind:'building',x:690,y:330,w:190,h:170,label:'Command Tent'},{kind:'landmark',x:1030,y:270,w:180,h:100,label:'Mountain Gate'}],
        [{kind:'campfire',x:180,y:425,label:'Campfire'},{kind:'tree',x:600,y:260,h:240,label:'Old Cedar'},{kind:'tent',x:830,y:365,w:130,h:135,label:'Travel Tent'}],
        [{kind:'banner',x:120,y:260,h:250,label:'Warlord Banner'},{kind:'building',x:520,y:340,w:210,h:160,label:'Road Inn'},{kind:'wagon',x:850,y:405,w:140,h:70,label:'Supply Wagon'}],
        [{kind:'mountain',x:80,y:100,w:850,h:400,label:'Split Mountain'},{kind:'landmark',x:520,y:285,w:160,h:100,label:'Stone Shrine'}],
        [{kind:'building',x:90,y:345,w:200,h:155,label:'Rebuilt Home'},{kind:'tree',x:480,y:250,h:250,label:'Peace Tree'},{kind:'shrine',x:810,y:315,w:120,h:185,label:'Memorial Shrine'}],
        [{kind:'building',x:90,y:345,w:170,h:155,label:'Training Shelter'},{kind:'dummy',x:500,y:350,w:70,h:150,label:'Training Dummy'},{kind:'landmark',x:760,y:280,w:180,h:120,label:'Thunder Circle'}]
      ],
      [
        [N(170,440,'Mika','Farmer','The storm has been getting closer every year. Today the lightning chose someone.')],
        [N(180,420,'Brother Ren','Monk','The fire should have died. Instead, it answered him.')],
        [N(180,430,'Aya','Fisher','The river carried her upward. I have never seen water move with a will of its own.')],
        [N(180,430,'Hanae','Gardener','The roots reached for him before anyone could dig him out.')],
        [N(180,420,'Toma','Hunter','Follow the old markers. The mountain does not care how brave you are.')],
        [N(170,425,'Genko','Warlord Scout','Five strangers. One battlefield. If they stand together, this war changes.')],
        [N(180,425,'Fire Hero','Awakened Hero','You saved the village. Do not expect me to admit that twice.')],
        [N(170,430,'Water Hero','Awakened Hero','There are three villages ahead. We cannot help all of them at once.')],
        [N(170,430,'Young Scholar','Historian','They say Thunder split the mountain with one strike. The stone still remembers.')],
        [N(170,430,'Old Villager','Witness','Peace is quieter than people imagine. That is why I like it.')],
        [N(170,430,'Thunder Student','Student','Do not copy his power. Learn his restraint.')]
      ],
      ['rain','snow','rain','ash','blizzard','storm','clear','ash','storm','wind','rain'],
      [['lightning'],['ice'],['water'],['falling_rock'],['whiteout'],['fire'],[],['arrows'],[],[],[]]
    )
  },
  2:{
    id:'book2',number:2,title:'KINGDOMS AT WAR',hub:'Ashen Monastery',era:'Kurenai / Shirasagi Borderlands',palette:palettes.war,
    scenes:sceneSeries('book2',palettes.war,
      ['Ashen Monastery','Border Well','Poisoned Village','Eastern Road','Generation I Shrine','Foxwood','Puppeteer Village','Eastern Castle','Forgotten Temple','Amayo Fields','Restored Borderlands'],
      ['New Legends','The Broken Clan','The Broken Clan','The Broken Clan','Echoes of Thunder','Twin Foxes','Rogue Elementors','Siege of Eastern Castle','Forgotten Temple','War for Japan','A New Era'],
      [
        'A fortified monastery becomes the new generation’s home base, with archive rooms, a training yard and a healing hall.',
        'A border well and a collapsed watchtower frame the investigation into the poisoned-water accusation.',
        'A village divided by propaganda. Half the buildings are abandoned and the market stalls are shuttered.',
        'A long military road with wagons, banners and messenger posts leading toward the eastern castle.',
        'An old Generation I chamber hidden behind a shrine wall. Thunder’s legacy is visible in scorched stone and sealed relic cases.',
        'A moonlit forest where paths loop through illusion markers and foxfire. The environment is intentionally deceptive.',
        'A village whose residents move like puppets. Threads hang from rooftops and disappear into the underground.',
        'A massive three-tier castle siege with walls, battlements, gates and an inner keep.',
        'An abandoned mountain temple built over an ancient Element 6 extraction chamber.',
        'The largest battlefield of the book: armies, yokai, Corps members and rival factions converge on the same valley.',
        'A rebuilt border settlement where former enemies trade openly. The last hidden fragment points toward the future.'
      ],
      [
        [{kind:'building',x:70,y:320,w:250,h:180,label:'Ashen Monastery'},{kind:'tower',x:740,y:250,w:100,h:250,label:'Archive Tower'}],
        [{kind:'well',x:180,y:405,w:90,h:95,label:'Border Well'},{kind:'tower',x:620,y:250,w:90,h:250,label:'Watchtower'},{kind:'banner',x:870,y:250,h:250,label:'Kurenai Banner'}],
        [{kind:'building',x:80,y:345,w:180,h:155,label:'Shuttered Inn'},{kind:'market',x:450,y:365,w:300,h:135,label:'Empty Market'},{kind:'shrine',x:850,y:330,w:100,h:170,label:'Village Shrine'}],
        [{kind:'wagon',x:90,y:405,w:150,h:70,label:'Army Wagon'},{kind:'bridge',x:470,y:360,w:280,h:18,label:'War Road Bridge'},{kind:'banner',x:850,y:240,h:270,label:'Eastern Standard'}],
        [{kind:'shrine',x:70,y:300,w:180,h:200,label:'Generation I Shrine'},{kind:'relic',x:500,y:330,w:130,h:120,label:'Scorched Relic Chamber'},{kind:'tree',x:820,y:230,h:270,label:'Ancient Pine'}],
        [{kind:'tree',x:70,y:170,h:330,label:'Foxwood'},{kind:'foxfire',x:460,y:310,w:180,h:130,label:'Foxfire Ring'},{kind:'tree',x:800,y:180,h:320,label:'Moon Forest'}],
        [{kind:'building',x:60,y:350,w:170,h:150,label:'Puppeted Home'},{kind:'threadweb',x:420,y:260,w:300,h:220,label:'Thread Network'},{kind:'well',x:840,y:390,w:80,h:110,label:'Village Hollow'}],
        [{kind:'tower',x:60,y:190,w:130,h:310,label:'Outer Wall'},{kind:'tower',x:430,y:150,w:150,h:350,label:'Inner Keep'},{kind:'gate',x:780,y:320,w:180,h:180,label:'Castle Gate'}],
        [{kind:'temple',x:60,y:285,w:230,h:215,label:'Forgotten Temple'},{kind:'basin',x:520,y:360,w:190,h:140,label:'Extraction Basin'},{kind:'cave',x:830,y:330,w:130,h:170,label:'Mountain Scar'}],
        [{kind:'banner',x:80,y:230,h:270,label:'Alliance Banner'},{kind:'battlefield',x:380,y:320,w:350,h:180,label:'Amayo Field'},{kind:'yokai',x:830,y:270,w:120,h:230,label:'Yokai Shrine'}],
        [{kind:'building',x:80,y:345,w:210,h:155,label:'Rebuilt Inn'},{kind:'market',x:460,y:350,w:280,h:150,label:'Peace Market'},{kind:'shrine',x:840,y:320,w:100,h:180,label:'Memorial'}]
      ],
      [
        [N(170,425,'Genko','Master','The old legends are useful only if we understand what they cost.')],
        [N(170,430,'Lady Sachi','Investigator','The water is clean. Someone wants the village to believe otherwise.')],
        [N(170,430,'Tetsu','Villager','They told us the Corps poisoned our well. I believed them until I saw the evidence.')],
        [N(170,430,'Messenger','Soldier','The castle is preparing for three days of fighting.')],
        [N(170,430,'Yui','Archivist','This chamber predates our records. Thunder was not the first to touch this power.')],
        [N(170,430,'Reiko','Fox','You are following the path we want you to see.')],
        [N(170,430,'Daigo','Rescuer','Do not cut the thread. Trace it first.')],
        [N(170,430,'Renji','Corps Leader','We take the walls without becoming the thing we are fighting.')],
        [N(170,430,'Mai','Shadow Operative','There is something under the temple. It feels older than the war.')],
        [N(170,430,'Kaito','Frontliner','This is too many enemies for one battlefield. Good.')],
        [N(170,430,'Hana','Healer','People are finally trading again. Let them have their peace.')]
      ],
      ['ash','rain','ash','wind','snow','fog','fog','storm','rain','ash','clear'],
      [['smoke'],['poison'],['smoke'],['arrows'],['residue'],['illusion'],['threads'],['fire','arrows'],['residue'],['yokai'],[]]
    )
  },
  3:{
    id:'book3',number:3,title:'THE FALLEN AGE',hub:'Fallen Capital',era:'Fallen Capital',palette:palettes.fallen,
    scenes:sceneSeries('book3',palettes.fallen,
      ['Fallen Capital Gate','Grand Tournament District','Champion Avenue','Underground Market','Blight Ward','Extraction Tenements','Ogata Laboratory','Assembly Hall','Blight Scar','Council Archive','The Man with the Fake Arm'],
      ['The World That Needs Them','Tournament Circuit','Tournament Circuit','Market Beneath the Market','What Utsuro Left Behind','Extraction Ring','The Bone Debt','Widening Divide','Reckoning at the Capital','Political Reckoning','The Man With the Fake Arm'],
      [
        'A crowded capital gate establishes a world where Element 6 heroes are now infrastructure, celebrity and political tools.',
        'Tournament banners fill a huge plaza. Bracket boards, bookmakers and spectator stands make the district feel alive.',
        'The tournament’s champion road connects arenas, food stalls and training courtyards.',
        'A hidden market beneath the legal city: relic sellers, enhancement dealers and coded doors.',
        'A district where Blight has begun growing through stone and plumbing. Containment teams patrol the streets.',
        'A tenement block used by the Extraction Ring. Doors are marked with coded numbers and medical warnings.',
        'A subterranean laboratory full of tanks, extraction machinery and damaged research notes.',
        'The Assembly Hall: polished stone, banners and a central hearing floor where heroes can be questioned.',
        'A huge scar under the old capital. The floor pulses with contaminated Element 6.',
        'A quiet archive district where political records and missing evidence are stored.',
        'An abandoned industrial yard where the mysterious prosthetic-armed man finally speaks.'
      ],
      [
        [{kind:'gate',x:50,y:300,w:180,h:200,label:'Capital Gate'},{kind:'building',x:420,y:280,w:240,h:220,label:'Civic Hall'},{kind:'tram',x:780,y:390,w:160,h:110,label:'Capital Tram'}],
        [{kind:'arena',x:60,y:230,w:300,h:270,label:'Tournament Arena'},{kind:'stands',x:500,y:310,w:380,h:190,label:'Grandstands'},{kind:'board',x:820,y:280,w:100,h:120,label:'Bracket Board'}],
        [{kind:'shop',x:70,y:360,w:160,h:140,label:'Food Stall'},{kind:'building',x:430,y:330,w:210,h:170,label:'Champion Gym'},{kind:'fountain',x:800,y:380,w:100,h:120,label:'Victory Fountain'}],
        [{kind:'shop',x:80,y:360,w:180,h:140,label:'Relic Dealer'},{kind:'cave',x:470,y:300,w:240,h:200,label:'Hidden Passage'},{kind:'shop',x:820,y:350,w:110,h:150,label:'Black Market'}],
        [{kind:'building',x:60,y:340,w:200,h:160,label:'Containment Clinic'},{kind:'blight',x:420,y:300,w:300,h:200,label:'Blight Growth'},{kind:'barrier',x:820,y:280,w:100,h:220,label:'Containment Wall'}],
        [{kind:'building',x:60,y:330,w:190,h:170,label:'Tenement'},{kind:'door',x:500,y:310,w:110,h:190,label:'Ring Door'},{kind:'alley',x:820,y:340,w:120,h:160,label:'Back Alley'}],
        [{kind:'machine',x:70,y:310,w:220,h:190,label:'Extractor'},{kind:'tank',x:450,y:270,w:140,h:230,label:'Resonance Tank'},{kind:'terminal',x:780,y:320,w:160,h:180,label:'Research Terminal'}],
        [{kind:'building',x:70,y:280,w:260,h:220,label:'Assembly Hall'},{kind:'podium',x:470,y:350,w:180,h:150,label:'Council Floor'},{kind:'banner',x:820,y:250,h:250,label:'Assembly Banner'}],
        [{kind:'scar',x:50,y:170,w:860,h:330,label:'Capital Scar'},{kind:'pillar',x:430,y:240,w:100,h:260,label:'Corrupted Pillar'}],
        [{kind:'archive',x:80,y:300,w:260,h:200,label:'Archive'},{kind:'books',x:500,y:330,w:180,h:170,label:'Records'},{kind:'vault',x:820,y:300,w:120,h:200,label:'Evidence Vault'}],
        [{kind:'warehouse',x:70,y:330,w:250,h:170,label:'Industrial Yard'},{kind:'machine',x:500,y:300,w:180,h:200,label:'Broken Rig'},{kind:'arm',x:820,y:320,w:100,h:180,label:'Prosthetic Workbench'}]
      ],
      [
        [N(170,430,'Takeshi','Assembly Captain','Everyone wants the heroes to solve the problem. Fewer people ask what happens when we become the problem.')],
        [N(170,430,'Tournament Clerk','Bracket Keeper','Pick a match, win your way forward, and try not to destroy the stands.',[{name:'Arena Token',price:10,desc:'A tournament utility token.'}])],
        [N(170,430,'Bookmaker','Promoter','The crowd loves power. The city is starting to love it too much.')],
        [N(170,430,'Under-Market Dealer','Merchant','I sell what the law forgot to regulate.',[{name:'Residue Filter',price:20,desc:'Utility item for contaminated routes.'},{name:'Old Relic',price:12,desc:'A recovered story relic.'}]) ,N(820,430,'Bounty Broker','Broker','Bring me a rogue Elementor and I will point you toward the next lead.',[{name:'Bounty Map',price:15,desc:'Reveals an optional bounty lead.'}])],
        [N(170,430,'Containment Chief','Blight Officer','Do not touch the purple growth. It remembers energy.')],
        [N(170,430,'Survivor','Witness','They promised awakening. Most of us got something else.')],
        [N(170,430,'Ryo','Investigator','The notebook says there was a second process. Someone tore out the page.')],
        [N(170,430,'Aiko','Censured Hero','A hero can save a city and still be judged for how they did it.')],
        [N(170,430,'Emi','Rescue Captain','We contain the scar. We do not pretend it never existed.')],
        [N(170,430,'Council Clerk','Archivist','Some records disappear because someone wants them gone.')],
        [N(170,430,'Prosthetic Man','Unknown','Ogata wanted a repeatable process. I wanted to know whether Element 6 could be changed by hand.')]
      ],
      ['clear','clear','wind','fog','ash','rain','sparks','clear','smoke','rain','night'],
      [['crowd'],[],[],['traps'],['blight'],['gas'],['machines'],[],['blight','residue'],[],[]]
    )
  },
  4:{
    id:'book4',number:4,title:'THE HERO CORPS',hub:'Hero Corps Tower',era:'Hero Corps Era',palette:palettes.corps,
    scenes:sceneSeries('book4',palettes.corps,
      ['Corps Charter Plaza','Training Deck','Kurenai Warehouse','Harvest Laboratory','Powerless Ward','Controller Rooftops','Tower Construction','Tower Siege','The Old Capital Scar','Gold Memorial','Rebuilt Corps Tower'],
      ['The Colors They Chose','The Colors They Chose','The Ring Returns','The Ring Returns','What’s Left When Power Goes','The Man in the Dark','The Siege of the Tower','The Siege of the Tower','The Source','What Gold Gave','The One Who Stays'],
      [
        'A clean modern plaza with the new Hero Corps emblem, recruitment boards and the charter stage.',
        'A multi-level training deck with holographic targets, rescue dummies and a view over the city.',
        'A warehouse district where the Harvest Guild moves sealed Element 6 containers.',
        'A high-security laboratory built around extraction machinery and resonance monitors.',
        'A medical and training district where powerless heroes relearn combat through equipment and tactics.',
        'Modern rooftops under rain. The Controller can be seen in the distance but cannot yet be reached.',
        'The unfinished Hero Corps headquarters: scaffolding, cranes, exposed floors and temporary power lines.',
        'A multi-floor siege with breached windows, evacuation corridors and emergency lighting.',
        'An enormous underground facility built directly above the ancient scar.',
        'A quiet memorial garden overlooking the city. Gold’s absence is represented by empty space, not spectacle.',
        'The completed Corps Tower becomes a living hub with offices, training, archives and civilian services.'
      ],
      [
        [{kind:'stage',x:70,y:330,w:250,h:170,label:'Charter Stage'},{kind:'monument',x:520,y:270,w:150,h:230,label:'Corps Monument'},{kind:'building',x:800,y:320,w:150,h:180,label:'Corps Hall'}],
        [{kind:'hologram',x:90,y:300,w:150,h:200,label:'Training Target'},{kind:'platform',x:450,y:250,w:260,h:250,label:'Training Deck'},{kind:'tower',x:820,y:210,w:110,h:290,label:'City Tower'}],
        [{kind:'warehouse',x:70,y:320,w:260,h:180,label:'Ring Warehouse'},{kind:'container',x:470,y:350,w:160,h:150,label:'Sealed Cargo'},{kind:'truck',x:790,y:400,w:170,h:100,label:'Transport'}],
        [{kind:'machine',x:70,y:280,w:220,h:220,label:'Extraction Rig'},{kind:'tank',x:470,y:260,w:160,h:240,label:'Refinement Tank'},{kind:'terminal',x:820,y:320,w:110,h:180,label:'Resonance Console'}],
        [{kind:'clinic',x:60,y:320,w:230,h:180,label:'Recovery Ward'},{kind:'gym',x:470,y:330,w:220,h:170,label:'Combat Gym'},{kind:'workshop',x:810,y:300,w:130,h:200,label:'Daichi Workshop'}],
        [{kind:'building',x:80,y:300,w:220,h:200,label:'City Block'},{kind:'antenna',x:510,y:180,w:100,h:320,label:'Signal Tower'},{kind:'rooftop',x:790,y:330,w:160,h:170,label:'Rooftop'}],
        [{kind:'crane',x:70,y:170,w:160,h:330,label:'Construction Crane'},{kind:'scaffold',x:430,y:180,w:300,h:320,label:'Tower Frame'},{kind:'generator',x:820,y:360,w:120,h:140,label:'Generator'}],
        [{kind:'breach',x:60,y:300,w:170,h:200,label:'Breached Wall'},{kind:'elevator',x:480,y:250,w:140,h:250,label:'Emergency Elevator'},{kind:'medbay',x:790,y:310,w:150,h:190,label:'Evacuation Medbay'}],
        [{kind:'scar',x:50,y:150,w:860,h:350,label:'Ancient Scar'},{kind:'facility',x:420,y:300,w:300,h:200,label:'Source Facility'}],
        [{kind:'memorial',x:80,y:280,w:240,h:220,label:'Gold Memorial'},{kind:'garden',x:470,y:330,w:240,h:170,label:'Quiet Garden'},{kind:'bench',x:820,y:400,w:120,h:100,label:'Bench'}],
        [{kind:'tower',x:60,y:110,w:220,h:390,label:'Hero Corps Tower'},{kind:'bridge',x:470,y:330,w:260,h:18,label:'Skybridge'},{kind:'plaza',x:800,y:350,w:150,h:150,label:'Public Plaza'}]
      ],
      [
        [N(170,430,'Cobalt','Commander','A name is useful when it gives people something to trust. A color is useful when it lets them find you in a crisis.')],
        [N(170,430,'Daichi','Engineer','Power is only one tool. Build something that works when the power is gone.')],
        [N(170,430,'Ring Courier','Enforcer','The Guild owns the warehouse. You were never supposed to know it exists.')],
        [N(170,430,'Graphite','Analyst','The extraction process is cleaner than the old records. That is what scares me.')],
        [N(170,430,'Vermilion','Powerless Hero','I still know how to fight. I just have to remember that I am not a walking superpower.')],
        [N(170,430,'Onyx','Scout','He was on the roof. I looked away for one second. He was gone.')],
        [N(170,430,'Gold','Healer','If we are going to call this a home, we have to build it like one.')],
        [N(170,430,'Sora','Rescue Hero','The west stairwell is gone. We are moving civilians through the archive.')],
        [N(170,430,'Graphite','Investigator','The corrupted ground is feeding the process. This facility is sitting on a wound.')],
        [N(170,430,'Sota','Child','Gold told me heroes do not have to be fearless. They just have to keep going.')],
        [N(170,430,'Haruki','Corps Recruit','The tower is open. Anyone can come in now, even if they just need help.')]
      ],
      ['clear','clear','rain','sparks','clear','rain','wind','smoke','ash','clear','clear'],
      [[],[],['electric'],['steam'],[],['lightning'],['falling_steel'],['fire','falling_steel'],['residue'],[],[]]
    )
  },
  5:{
    id:'book5',number:5,title:'HEROES OF COLOR',hub:'Split City',era:'Split City / Cosmic Era',palette:palettes.cosmic,
    scenes:sceneSeries('book5',palettes.cosmic,
      ['Split City','Grand Coliseum','Cargo District','Magnetic Yard','Mint Gardens','Frozen Exhibition Arena','Poison Garden','Abandoned Refinery','Controller Warzone','Reality Nexus','Cosmic Void'],
      ['Creation Arc','Tournament Arc','Hammer and the Pull','Hammer and the Pull','Roots and Ruin','Where Fire Meets Frost','Poison Garden and Nightmare','Pink Betrayal / Saving Pink','Controller War','Final Controller Battle','Evil War'],
      [
        'A futuristic city split by elevated roads, neon signage and gravity anomalies. Indigo’s childhood is remembered through subtle environmental distortions.',
        'A colossal arena district with multiple entrances, crowd tiers, bracket boards and dynamic lighting.',
        'A cargo district where Corpent’s hammer attack tears through containers and streets.',
        'A magnetic industrial yard with floating metal, rail lines and unstable machinery.',
        'A city park consumed by aggressive roots and overgrown structures.',
        'A stadium divided between extreme cold and heat, with lightning interference and sound-amplified zones.',
        'A poison garden filled with flowers, vines, alchemical pools and toxic clouds before the Nightmare sequence.',
        'An abandoned coastal refinery used for Pink’s betrayal and later intervention.',
        'Split City becomes a global warzone with evacuation routes, portals, collapsing buildings and enemy incursions.',
        'A reality-bending nexus where time, gravity and portals overlap.',
        'The cosmic battlefield transitions through collapsing cities, broken dimensions and fragments of reality.'
      ],
      [
        [{kind:'building',x:60,y:280,w:240,h:220,label:'Split City Block'},{kind:'rail',x:470,y:340,w:260,h:160,label:'Sky Rail'},{kind:'tower',x:820,y:130,w:120,h:370,label:'Indigo Tower'}],
        [{kind:'arena',x:50,y:190,w:330,h:310,label:'Grand Coliseum'},{kind:'stands',x:470,y:280,w:350,h:220,label:'Crowd Tiers'},{kind:'board',x:840,y:250,w:90,h:140,label:'Tournament Board'}],
        [{kind:'container',x:70,y:350,w:180,h:150,label:'Cargo Stack'},{kind:'crane',x:480,y:150,w:160,h:350,label:'Cargo Crane'},{kind:'warehouse',x:790,y:320,w:160,h:180,label:'Warehouse'}],
        [{kind:'magnet',x:70,y:250,w:170,h:250,label:'Magnetic Rig'},{kind:'rail',x:430,y:390,w:350,h:110,label:'Rail Yard'},{kind:'machine',x:820,y:300,w:120,h:200,label:'Lift Core'}],
        [{kind:'tree',x:70,y:150,h:350,label:'Giant Mint Tree'},{kind:'garden',x:420,y:330,w:300,h:170,label:'Living Garden'},{kind:'ruin',x:820,y:310,w:120,h:190,label:'Overgrown Ruin'}],
        [{kind:'arena',x:50,y:210,w:300,h:290,label:'Exhibition Stadium'},{kind:'ice',x:430,y:300,w:230,h:200,label:'Frozen Half'},{kind:'fire',x:760,y:300,w:190,h:200,label:'Heated Half'}],
        [{kind:'flower',x:70,y:270,w:220,h:230,label:'Poison Flowers'},{kind:'vine',x:450,y:240,w:250,h:260,label:'Vine Wall'},{kind:'pool',x:800,y:360,w:150,h:140,label:'Alchemical Pool'}],
        [{kind:'refinery',x:50,y:300,w:260,h:200,label:'Refinery'},{kind:'pipe',x:470,y:250,w:240,h:250,label:'Broken Pipes'},{kind:'tank',x:820,y:300,w:120,h:200,label:'Containment Tank'}],
        [{kind:'building',x:60,y:280,w:230,h:220,label:'Warzone Block'},{kind:'portal',x:460,y:250,w:180,h:250,label:'Portal Gate'},{kind:'evac',x:790,y:320,w:150,h:180,label:'Evacuation Route'}],
        [{kind:'nexus',x:50,y:120,w:860,h:380,label:'Reality Nexus'},{kind:'rift',x:440,y:230,w:200,h:270,label:'Dimensional Rift'}],
        [{kind:'cosmic',x:40,y:80,w:880,h:420,label:'Fractured Reality'},{kind:'planet',x:120,y:170,w:180,h:180,label:'World Fragment'},{kind:'void',x:650,y:120,w:250,h:380,label:'Cosmic Void'}]
      ],
      [
        [N(170,430,'Indigo','Young Hero','Gravity does not feel like a weapon. It feels like the world forgetting which way is down.')],
        [N(170,430,'Silver','Organizer','This tournament is about control. If you cannot control yourself, power is irrelevant.')],
        [N(170,430,'Green','Protector','Civilians are between us and that hammer. We move them first.')],
        [N(170,430,'Black','Striker','Metal in the air. Keep your feet grounded and your eyes open.')],
        [N(170,430,'Green','Earth Hero','The park is alive. It is angry. I can feel something underneath the roots.')],
        [N(170,430,'Pink','Telekinetic Hero','Four threats at once. Keep them separated and nobody gets overwhelmed.')],
        [N(170,430,'Hazel','Alchemist','The flowers are not decoration. They are part of the trap.',[{name:'Void Lantern',price:35,desc:'A strange lantern that highlights anomalies.'}])],
        [N(170,430,'Magenta','Mediator','Pink, you are still one of us. Come back before this becomes irreversible.')],
        [N(170,430,'Indigo','Leader','We protect them anyway. That is what changes after the war.')],
        [N(170,430,'Silver','Visionary','I cannot see beyond this point. For once, we have to choose without foresight.')],
        [N(170,430,'Life','Force of Life','Equilibrium is not stillness. It is the choice to keep existence in motion.')]
      ],
      ['clear','clear','wind','sparks','rain','snow','fog','rain','storm','rift','cosmic'],
      [[],[],['falling_metal'],['magnetic'],['vines'],['ice','fire','lightning'],['poison'],['steam','fire'],['falling_debris','portal'],['gravity','time','portal'],['reality_erase']]
    )
  }
};

export const STORY_WORLD = Object.values(books);
export const STORY_SCENE_WIDTH = 4720;
export function getStoryWorldBook(number){return books[number]||books[1]}
export function getStoryScene(number,x=0){
  const b=getStoryWorldBook(number), idx=Math.max(0,Math.min(b.scenes.length-1,Math.floor((Number(x)||0)/(STORY_SCENE_WIDTH/b.scenes.length))));
  return {...b.scenes[idx],index:idx,book:b};
}

// Existing-roster-first boss mapping. Missing lore antagonists use a temporary combatant
// built from an existing fighter definition in StoryBattle, never added to the main roster.
export const STORY_BOSS_CHARACTER_MAP = {
  corppent:'corpent', corpent:'corpent', magneto:'magneto', willow:'willow', cable:'cable',
  snodvor:'snodvor', kirsten:'kirsten', volt:'volt', temple:'temple', nightmare:'nightmare',
  hazel:'hazel', whami:'whami', controller:'controller', evil:'evil',
  itto:'story_itto', renko:'story_renko', ibuki:'story_ibuki', utsuro:'story_utsuro',
  ogata:'story_ogata', nishikawa:'story_nishikawa', hidesaka:'story_hidetaka',
  'hollow monk':'story_ibuki', puppeteer:'story_nishikawa', kessho:'story_kessho', kurenai:'story_kurenai',
  reiko:'story_reiko', ren:'story_ren', spider:'story_spider', oni:'story_oni', 'nine-tail':'story_ninetail',
  hidetaka:'story_hidetaka'
};

export const STORY_TEMP_CHARACTERS = {
  story_itto:{id:'story_itto',name:'Ittō',title:'Rogue Elementor',color:'#b7b7c9',stats:{power:8,speed:8,defense:6,utility:7,control:8}},
  story_renko:{id:'story_renko',name:'Renko Kurenai',title:'Harvest Guild Master',color:'#8b1e3f',stats:{power:8,speed:6,defense:7,utility:9,control:8}},
  story_ibuki:{id:'story_ibuki',name:'Hollow Monk Ibuki',title:'Rogue Healer',color:'#b8c7c9',stats:{power:7,speed:5,defense:8,utility:10,control:9}},
  story_utsuro:{id:'story_utsuro',name:'Utsuro',title:'Corrupted Remnant',color:'#5d526e',stats:{power:10,speed:7,defense:9,utility:10,control:10},isFinalBoss:true},
  story_ogata:{id:'story_ogata',name:'Ogata',title:'Extraction Architect',color:'#5b4939',stats:{power:6,speed:5,defense:7,utility:9,control:8}},
  story_nishikawa:{id:'story_nishikawa',name:'Nishikawa the Puppeteer',title:'Rogue Elementor',color:'#9a5bb5',stats:{power:7,speed:7,defense:5,utility:10,control:10}},
  story_hidetaka:{id:'story_hidetaka',name:'Hidetaka',title:'Eastern Warlord',color:'#7d2f2f',stats:{power:8,speed:6,defense:8,utility:6,control:7}},
  story_kessho:{id:'story_kessho',name:'Kessho Commander',title:'Warlord General',color:'#8b5a3c',stats:{power:7,speed:6,defense:8,utility:6,control:6}},
  story_kurenai:{id:'story_kurenai',name:'Kurenai General',title:'Border General',color:'#7d2630',stats:{power:8,speed:7,defense:7,utility:6,control:7}},
  story_reiko:{id:'story_reiko',name:'Reiko',title:'Twin Fox Assassin',color:'#b85b8b',stats:{power:7,speed:9,defense:5,utility:9,control:9}},
  story_ren:{id:'story_ren',name:'Ren',title:'Twin Fox Assassin',color:'#6d5bb8',stats:{power:7,speed:9,defense:5,utility:9,control:9}},
  story_spider:{id:'story_spider',name:'Blight-Born Spider',title:'Yokai',color:'#7b5b8e',stats:{power:8,speed:7,defense:8,utility:8,control:8}},
  story_oni:{id:'story_oni',name:'Blight-Born Oni',title:'Yokai',color:'#8e4638',stats:{power:9,speed:5,defense:9,utility:6,control:7}},
  story_ninetail:{id:'story_ninetail',name:'Blight-Born Nine-Tail',title:'Yokai',color:'#d08a52',stats:{power:8,speed:8,defense:6,utility:10,control:9}}
};

export const STORY_SHOPS = {
  book1:[{name:'Rice Ration',price:5,desc:'Story utility item. Restores a small amount of survival stock.'},{name:'Old Charm',price:12,desc:'A relic from the first generation.'}],
  book2:[{name:'Monastery Salve',price:8,desc:'A field-healing item.'},{name:'Foxfire Lantern',price:18,desc:'Reveals hidden illusion markers.'}],
  book3:[{name:'Arena Token',price:10,desc:'Unlocks an optional tournament rematch.'},{name:'Residue Filter',price:20,desc:'Reduces contamination in optional Blight routes.'}],
  book4:[{name:'Resonance Cell',price:15,desc:'Prototype utility equipment.'},{name:'Emergency Patch',price:22,desc:'A Corps field-repair item.'}],
  book5:[{name:'Reality Anchor',price:25,desc:'A lore artifact from the Controller War.'},{name:'Void Lantern',price:35,desc:'Highlights dimensional anomalies.'}]
};
