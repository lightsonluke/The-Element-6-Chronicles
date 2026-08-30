// 2D Minecraft-style world engine for story mode

export const BLOCK_SIZE = 32;
export const CHUNK_WIDTH = 32;
export const WORLD_HEIGHT = 128; // Much taller world for deep caves

// Block types
export const BLOCKS = {
  AIR: 0,
  DIRT: 1,
  STONE: 2,
  GRASS: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  WATER: 7,
  BRICK: 8,
  IRON: 9,
  GOLD: 10,
  GLASS: 11,
  PLANK: 12,
  TORCH: 13,
  DEEPSTONE: 14,
  CRYSTAL: 15,
  LAVA: 16,
  OBSIDIAN: 17,
  ELEMENT6: 18,
  DIAMOND: 19,
  LADDER: 20,
  COBBLESTONE: 21,
  MOSSSTONE: 22,
  SMOOTHSTONE: 23,
  STONEBRICK: 24,
  DARKBRICK: 25,
  LIGHTBRICK: 26,
  SANDSTONE: 27,
  CLAY: 28,
  TERRACOTTA: 29,
  PAPER: 30,
  BOOKSHELF: 31,
  LANTERN: 32,
  SNOWBLOCK: 33,
  ICEBLOCK: 34,
  CACTUS: 35,
  PUMPKIN: 36,
  HAYBLOCK: 37,
  NETHERBRICK: 38,
  QUARTZ: 39,
  GLOWSTONE: 40,
  MARBLE: 41,
  GRANITE: 42,
  COPPER: 43,
  RUNESTONE: 44,
  CHISELED: 45,
  POLISHED: 46,
  PILLAR: 47,
  RAINBOW: 48,
  CLOUD: 49,
  NEON: 50,
  BED: 51,
  SAPLING: 52,
  CHEST: 53,
  APPLE: 54,
  ELEMENT6_ORB: 55,
};

export const BLOCK_COLORS = {
  [BLOCKS.AIR]: null,
  [BLOCKS.DIRT]: '#8B6914',
  [BLOCKS.STONE]: '#808080',
  [BLOCKS.GRASS]: '#4CAF50',
  [BLOCKS.WOOD]: '#795548',
  [BLOCKS.LEAVES]: '#2E7D32',
  [BLOCKS.SAND]: '#F4D03F',
  [BLOCKS.WATER]: '#2196F3',
  [BLOCKS.BRICK]: '#B71C1C',
  [BLOCKS.IRON]: '#9E9E9E',
  [BLOCKS.GOLD]: '#FFD700',
  [BLOCKS.GLASS]: '#E0F7FA',
  [BLOCKS.PLANK]: '#A1887F',
  [BLOCKS.TORCH]: '#FFC107',
  [BLOCKS.DEEPSTONE]: '#2a2a3a',
  [BLOCKS.CRYSTAL]: '#88FFFF',
  [BLOCKS.LAVA]: '#FF4400',
  [BLOCKS.OBSIDIAN]: '#1a0a2a',
  [BLOCKS.ELEMENT6]: '#FF00FF',
  [BLOCKS.DIAMOND]: '#B9F2FF',
  [BLOCKS.LADDER]: '#AA7744',
  [BLOCKS.COBBLESTONE]: '#778877',
  [BLOCKS.MOSSSTONE]: '#557755',
  [BLOCKS.SMOOTHSTONE]: '#AAAAAA',
  [BLOCKS.STONEBRICK]: '#776655',
  [BLOCKS.DARKBRICK]: '#222233',
  [BLOCKS.LIGHTBRICK]: '#EEDDAA',
  [BLOCKS.SANDSTONE]: '#DDBB77',
  [BLOCKS.CLAY]: '#AA6644',
  [BLOCKS.TERRACOTTA]: '#CC6655',
  [BLOCKS.PAPER]: '#EEEEE8',
  [BLOCKS.BOOKSHELF]: '#775533',
  [BLOCKS.LANTERN]: '#FFCC44',
  [BLOCKS.SNOWBLOCK]: '#EEFFFA',
  [BLOCKS.ICEBLOCK]: '#AACCEE',
  [BLOCKS.CACTUS]: '#338833',
  [BLOCKS.PUMPKIN]: '#FF8800',
  [BLOCKS.HAYBLOCK]: '#DDCC44',
  [BLOCKS.NETHERBRICK]: '#331122',
  [BLOCKS.QUARTZ]: '#E8E8E0',
  [BLOCKS.GLOWSTONE]: '#FFEE88',
  [BLOCKS.MARBLE]: '#E8E8EE',
  [BLOCKS.GRANITE]: '#884444',
  [BLOCKS.COPPER]: '#CC8844',
  [BLOCKS.RUNESTONE]: '#44FFCC',
  [BLOCKS.CHISELED]: '#998877',
  [BLOCKS.POLISHED]: '#CCCCCC',
  [BLOCKS.PILLAR]: '#AAAABB',
  [BLOCKS.RAINBOW]: '#FF44AA',
  [BLOCKS.CLOUD]: '#EEEEFF',
  [BLOCKS.NEON]: '#00FFAA',
  [BLOCKS.BED]: '#CC6666',
  [BLOCKS.SAPLING]: '#3a7a3a',
  [BLOCKS.CHEST]: '#8B6914',
  [BLOCKS.APPLE]: '#E02020',
  [BLOCKS.ELEMENT6_ORB]: '#DD00FF',
};

export const BLOCK_NAMES = {
  [BLOCKS.DIRT]: 'Dirt',
  [BLOCKS.STONE]: 'Stone',
  [BLOCKS.GRASS]: 'Grass',
  [BLOCKS.WOOD]: 'Wood',
  [BLOCKS.LEAVES]: 'Leaves',
  [BLOCKS.SAND]: 'Sand',
  [BLOCKS.WATER]: 'Water',
  [BLOCKS.BRICK]: 'Brick',
  [BLOCKS.IRON]: 'Iron Ore',
  [BLOCKS.GOLD]: 'Gold Ore',
  [BLOCKS.GLASS]: 'Glass',
  [BLOCKS.PLANK]: 'Plank',
  [BLOCKS.TORCH]: 'Torch',
  [BLOCKS.DEEPSTONE]: 'Deep Stone',
  [BLOCKS.CRYSTAL]: 'Crystal',
  [BLOCKS.LAVA]: 'Lava',
  [BLOCKS.OBSIDIAN]: 'Obsidian',
  [BLOCKS.ELEMENT6]: 'Element 6',
  [BLOCKS.DIAMOND]: 'Diamond',
  [BLOCKS.LADDER]: 'Ladder',
  [BLOCKS.COBBLESTONE]: 'Cobblestone',
  [BLOCKS.MOSSSTONE]: 'Moss Stone',
  [BLOCKS.SMOOTHSTONE]: 'Smooth Stone',
  [BLOCKS.STONEBRICK]: 'Stone Brick',
  [BLOCKS.DARKBRICK]: 'Dark Brick',
  [BLOCKS.LIGHTBRICK]: 'Light Brick',
  [BLOCKS.SANDSTONE]: 'Sandstone',
  [BLOCKS.CLAY]: 'Clay',
  [BLOCKS.TERRACOTTA]: 'Terracotta',
  [BLOCKS.PAPER]: 'Paper',
  [BLOCKS.BOOKSHELF]: 'Bookshelf',
  [BLOCKS.LANTERN]: 'Lantern',
  [BLOCKS.SNOWBLOCK]: 'Snow Block',
  [BLOCKS.ICEBLOCK]: 'Ice Block',
  [BLOCKS.CACTUS]: 'Cactus',
  [BLOCKS.PUMPKIN]: 'Pumpkin',
  [BLOCKS.HAYBLOCK]: 'Hay Block',
  [BLOCKS.NETHERBRICK]: 'Nether Brick',
  [BLOCKS.QUARTZ]: 'Quartz',
  [BLOCKS.GLOWSTONE]: 'Glowstone',
  [BLOCKS.MARBLE]: 'Marble',
  [BLOCKS.GRANITE]: 'Granite',
  [BLOCKS.COPPER]: 'Copper',
  [BLOCKS.RUNESTONE]: 'Rune Stone',
  [BLOCKS.CHISELED]: 'Chiseled Stone',
  [BLOCKS.POLISHED]: 'Polished Stone',
  [BLOCKS.PILLAR]: 'Pillar',
  [BLOCKS.RAINBOW]: 'Rainbow Block',
  [BLOCKS.CLOUD]: 'Cloud Block',
  [BLOCKS.NEON]: 'Neon Block',
  [BLOCKS.BED]: 'Bed',
  [BLOCKS.SAPLING]: 'Sapling',
  [BLOCKS.CHEST]: 'Chest',
  [BLOCKS.APPLE]: 'Apple',
  [BLOCKS.ELEMENT6_ORB]: 'Element 6 Orb',
};

const BLOCK_HARDNESS = {
  [BLOCKS.DIRT]: 4,
  [BLOCKS.STONE]: 12,
  [BLOCKS.GRASS]: 4,
  [BLOCKS.WOOD]: 8,
  [BLOCKS.LEAVES]: 2,
  [BLOCKS.SAND]: 3,
  [BLOCKS.WATER]: 0,
  [BLOCKS.BRICK]: 14,
  [BLOCKS.IRON]: 16,
  [BLOCKS.GOLD]: 18,
  [BLOCKS.GLASS]: 2,
  [BLOCKS.PLANK]: 6,
  [BLOCKS.TORCH]: 1,
  [BLOCKS.DEEPSTONE]: 20,
  [BLOCKS.CRYSTAL]: 10,
  [BLOCKS.LAVA]: 0,
  [BLOCKS.OBSIDIAN]: 25,
  [BLOCKS.ELEMENT6]: 28,
  [BLOCKS.DIAMOND]: 22,
  [BLOCKS.LADDER]: 1,
  [BLOCKS.COBBLESTONE]: 10,
  [BLOCKS.MOSSSTONE]: 10,
  [BLOCKS.SMOOTHSTONE]: 14,
  [BLOCKS.STONEBRICK]: 16,
  [BLOCKS.DARKBRICK]: 18,
  [BLOCKS.LIGHTBRICK]: 14,
  [BLOCKS.SANDSTONE]: 8,
  [BLOCKS.CLAY]: 5,
  [BLOCKS.TERRACOTTA]: 12,
  [BLOCKS.PAPER]: 1,
  [BLOCKS.BOOKSHELF]: 6,
  [BLOCKS.LANTERN]: 1,
  [BLOCKS.SNOWBLOCK]: 3,
  [BLOCKS.ICEBLOCK]: 5,
  [BLOCKS.CACTUS]: 3,
  [BLOCKS.PUMPKIN]: 3,
  [BLOCKS.HAYBLOCK]: 2,
  [BLOCKS.NETHERBRICK]: 20,
  [BLOCKS.QUARTZ]: 12,
  [BLOCKS.GLOWSTONE]: 8,
  [BLOCKS.MARBLE]: 14,
  [BLOCKS.GRANITE]: 12,
  [BLOCKS.COPPER]: 14,
  [BLOCKS.RUNESTONE]: 18,
  [BLOCKS.CHISELED]: 15,
  [BLOCKS.POLISHED]: 14,
  [BLOCKS.PILLAR]: 15,
  [BLOCKS.RAINBOW]: 8,
  [BLOCKS.CLOUD]: 1,
  [BLOCKS.NEON]: 6,
  [BLOCKS.BED]: 3,
  [BLOCKS.SAPLING]: 1,
  [BLOCKS.CHEST]: 6,
  [BLOCKS.APPLE]: 1,
};

// Simple seeded random
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function noiseAt(x, seed) {
  const rng = seededRandom(x * 73856093 ^ seed);
  return rng();
}

function smoothNoise(x, seed) {
  const ix = Math.floor(x);
  const fx = x - ix;
  const a = noiseAt(ix, seed);
  const b = noiseAt(ix + 1, seed);
  return a + (b - a) * (fx * fx * (3 - 2 * fx));
}

function terrainHeight(worldX, seed) {
  const scale1 = smoothNoise(worldX * 0.018, seed) * 16;
  const scale2 = smoothNoise(worldX * 0.05, seed + 1000) * 7;
  const scale3 = smoothNoise(worldX * 0.12, seed + 2000) * 3;
  const mountain = smoothNoise(worldX * 0.008, seed + 5000) > 0.65
    ? smoothNoise(worldX * 0.03, seed + 3000) * 14 : 0;
  const base = 38; // surface around row 38 of 128
  return Math.floor(base + scale1 + scale2 + scale3 + mountain);
}

// 2D cave noise
function caveNoise(worldX, worldY, seed) {
  const nx = worldX * 0.07;
  const ny = worldY * 0.09;
  const n1 = smoothNoise(nx, seed + worldY * 300);
  const n2 = smoothNoise(ny, seed + worldX * 200);
  const n3 = smoothNoise(nx * 0.5 + ny * 0.5, seed + 77777);
  return (n1 + n2 + n3) / 3;
}

export const BIOMES = [
  { id:'forest', name:'Forest', top:BLOCKS.GRASS, sub:BLOCKS.DIRT, stone:BLOCKS.STONE, tree:0.10, water:0.015, color:'#4b8f45' },
  { id:'deep_forest', name:'Deep Forest', top:BLOCKS.GRASS, sub:BLOCKS.DIRT, stone:BLOCKS.MOSSSTONE, tree:0.18, water:0.01, color:'#245c35' },
  { id:'snowy_mountains', name:'Snowy Mountains', top:BLOCKS.SNOWBLOCK, sub:BLOCKS.ICEBLOCK, stone:BLOCKS.STONE, tree:0.025, water:0.01, mountain:18, color:'#b9d7e8' },
  { id:'frozen_tundra', name:'Frozen Tundra', top:BLOCKS.SNOWBLOCK, sub:BLOCKS.SNOWBLOCK, stone:BLOCKS.ICEBLOCK, tree:0.008, water:0.018, mountain:5, color:'#d9edf2' },
  { id:'desert', name:'Desert', top:BLOCKS.SAND, sub:BLOCKS.SAND, stone:BLOCKS.SANDSTONE, tree:0, water:0.004, cactus:0.06, color:'#d9bd67' },
  { id:'rocky_canyon', name:'Rocky Canyon', top:BLOCKS.TERRACOTTA, sub:BLOCKS.SANDSTONE, stone:BLOCKS.GRANITE, tree:0.008, water:0.006, canyon:15, color:'#a9654c' },
  { id:'swamp', name:'Swamp', top:BLOCKS.MOSSSTONE, sub:BLOCKS.DIRT, stone:BLOCKS.MOSSSTONE, tree:0.09, water:0.05, color:'#536b48' },
  { id:'jungle', name:'Jungle', top:BLOCKS.GRASS, sub:BLOCKS.DIRT, stone:BLOCKS.STONE, tree:0.22, water:0.025, color:'#2d7543' },
  { id:'volcanic_lands', name:'Volcanic Lands', top:BLOCKS.OBSIDIAN, sub:BLOCKS.NETHERBRICK, stone:BLOCKS.DEEPSTONE, tree:0, water:0.002, lava:0.06, mountain:12, color:'#6b2921' },
  { id:'crystal_caverns', name:'Crystal Caverns', top:BLOCKS.CRYSTAL, sub:BLOCKS.STONE, stone:BLOCKS.DEEPSTONE, tree:0, water:0.01, crystals:0.10, color:'#554e91' },
  { id:'underground_caverns', name:'Underground Caverns', top:BLOCKS.STONE, sub:BLOCKS.STONE, stone:BLOCKS.DEEPSTONE, tree:0, water:0.015, crystals:0.035, color:'#333746' },
  { id:'mushroom_forest', name:'Mushroom Forest', top:BLOCKS.MOSSSTONE, sub:BLOCKS.DIRT, stone:BLOCKS.MOSSSTONE, tree:0.04, water:0.02, mushrooms:0.12, color:'#6e4d68' },
  { id:'ancient_ruins', name:'Ancient Ruins', top:BLOCKS.STONEBRICK, sub:BLOCKS.MOSSSTONE, stone:BLOCKS.DEEPSTONE, tree:0.025, water:0.008, ruins:0.13, color:'#77726a' },
  { id:'coastal_beach', name:'Coastal Beach', top:BLOCKS.SAND, sub:BLOCKS.SAND, stone:BLOCKS.STONE, tree:0.025, water:0.09, color:'#7fc7cf' },
  { id:'grasslands', name:'Grasslands', top:BLOCKS.GRASS, sub:BLOCKS.DIRT, stone:BLOCKS.STONE, tree:0.025, water:0.012, color:'#7cae52' },
  { id:'highlands', name:'Highlands', top:BLOCKS.GRASS, sub:BLOCKS.DIRT, stone:BLOCKS.GRANITE, tree:0.025, water:0.008, mountain:10, color:'#667d59' },
  { id:'dark_forest', name:'Dark Forest', top:BLOCKS.DARKBRICK, sub:BLOCKS.MOSSSTONE, stone:BLOCKS.DEEPSTONE, tree:0.15, water:0.008, color:'#272b38' },
  { id:'elemental_ruins', name:'Elemental Ruins', top:BLOCKS.RUNESTONE, sub:BLOCKS.STONEBRICK, stone:BLOCKS.OBSIDIAN, tree:0.01, water:0.008, ruins:0.18, color:'#4d8c82' },
  { id:'lava_fields', name:'Lava Fields', top:BLOCKS.NETHERBRICK, sub:BLOCKS.OBSIDIAN, stone:BLOCKS.DEEPSTONE, tree:0, water:0.001, lava:0.11, mountain:8, color:'#7b3025' },
  { id:'sky_islands', name:'Sky Islands', top:BLOCKS.CLOUD, sub:BLOCKS.CLOUD, stone:BLOCKS.CLOUD, tree:0.03, water:0.02, color:'#a9c8ef' },
];

export function getBiomeIndex(worldX, seed) {
  const region = Math.floor(worldX / 320);
  const n = Math.abs(Math.floor(noiseAt(region, seed + 99173) * BIOMES.length));
  return (region + n) % BIOMES.length;
}
export function getBiome(worldX, seed) { return BIOMES[getBiomeIndex(worldX, seed)]; }

function biomeTerrainHeight(worldX, seed, biome) {
  const base = biome.id === 'sky_islands' ? 18 : 38;
  let h = base + smoothNoise(worldX * 0.018, seed) * 12 + smoothNoise(worldX * 0.05, seed + 1000) * 6;
  if (biome.mountain) h += smoothNoise(worldX * 0.008, seed + 5000) * biome.mountain;
  if (biome.canyon) h += Math.sin(worldX * 0.025) * biome.canyon * 0.45;
  return Math.max(7, Math.min(WORLD_HEIGHT - 15, Math.floor(h)));
}

function placeTree(blocks, x, surface, height, trunk=BLOCKS.WOOD, leaves=BLOCKS.LEAVES) {
  for (let ty=1; ty<=height; ty++) if (surface-ty>=0) blocks[x][surface-ty]=trunk;
  for (let dx=-2; dx<=2; dx++) for (let dy=0; dy<=3; dy++) {
    const px=x+dx, py=surface-height+dy;
    if (px>=0 && px<CHUNK_WIDTH && py>=0 && py<WORLD_HEIGHT && blocks[px][py]===BLOCKS.AIR) blocks[px][py]=leaves;
  }
}

function placeStructure(blocks, startX, groundY, type, seed) {
  const rng=seededRandom(seed + startX*31337);
  const w=8+Math.floor(rng()*8), h=4+Math.floor(rng()*4);
  const wall=type==='elemental'?BLOCKS.RUNESTONE:type==='ruin'?BLOCKS.STONEBRICK:BLOCKS.WOOD;
  for(let x=0;x<w;x++) for(let y=1;y<=h;y++) {
    const px=startX+x, py=groundY-y;
    if(px>=0&&px<CHUNK_WIDTH&&py>=0&&py<WORLD_HEIGHT) blocks[px][py]=(x===0||x===w-1||y===h)?wall:BLOCKS.AIR;
  }
  const door=startX+Math.floor(w/2);
  if(door>=0&&door<CHUNK_WIDTH){ if(groundY-1>=0)blocks[door][groundY-1]=BLOCKS.AIR; if(groundY-2>=0)blocks[door][groundY-2]=BLOCKS.AIR; }
  for(let x=2;x<w-1;x+=3){ const py=groundY-h-1; if(py>=0)blocks[startX+x][py]=type==='elemental'?BLOCKS.PILLAR:BLOCKS.PLANK; }
  if(type==='ruin') for(let x=1;x<w-1;x++) if(rng()<0.16) blocks[startX+x][groundY-1]=BLOCKS.MOSSSTONE;
  if(type==='elemental') for(let x=1;x<w-1;x++) if(rng()<0.12) blocks[startX+x][groundY-2]=BLOCKS.ELEMENT6;
}

export function generateChunk(chunkIndex, seed) {
  const blocks=[];
  const biome=getBiome(chunkIndex*CHUNK_WIDTH + CHUNK_WIDTH/2, seed);
  for(let x=0;x<CHUNK_WIDTH;x++){
    blocks[x]=new Array(WORLD_HEIGHT).fill(BLOCKS.AIR);
    const worldX=chunkIndex*CHUNK_WIDTH+x;
    const height=biomeTerrainHeight(worldX,seed,biome);
    const rng=seededRandom((worldX+1)*92821+seed);
    const surface=height;
    for(let y=0;y<WORLD_HEIGHT;y++){
      if(y<surface) blocks[x][y]=BLOCKS.AIR;
      else if(y===surface) blocks[x][y]=biome.top;
      else if(y<=surface+4) blocks[x][y]=biome.sub;
      else {
        const depth=y-surface;
        const cave=caveNoise(worldX,y,seed+(biome.id.length*911));
        if(depth>10 && cave>(depth>45?0.49:0.58)) {
          blocks[x][y]=(biome.lava && depth>70 && rng()<biome.lava)?BLOCKS.LAVA:BLOCKS.AIR;
        } else if(biome.crystals && rng()<biome.crystals*(depth/100)) blocks[x][y]=BLOCKS.CRYSTAL;
        else if(biome.id==='desert' && rng()<0.018) blocks[x][y]=BLOCKS.CLAY;
        else if(rng()<0.018) blocks[x][y]=BLOCKS.IRON;
        else if(rng()<0.012 && depth>18) blocks[x][y]=BLOCKS.GOLD;
        else if(rng()<0.006 && depth>25) blocks[x][y]=BLOCKS.DIAMOND;
        else if(rng()<0.004 && depth>35) blocks[x][y]=BLOCKS.ELEMENT6;
        else blocks[x][y]=biome.stone;
      }
    }
    if(biome.water>0 && rng()<biome.water && surface<55){
      for(let wx=-2;wx<=2;wx++) for(let wy=1;wy<=2;wy++){const px=x+wx,py=surface-wy;if(px>=0&&px<CHUNK_WIDTH&&py>=0&&blocks[px][py]===BLOCKS.AIR)blocks[px][py]=BLOCKS.WATER;}
    }
    if(biome.tree>0 && rng()<biome.tree && surface>8) placeTree(blocks,x,surface,4+Math.floor(rng()*4),biome.id==='dark_forest'?BLOCKS.DARKBRICK:BLOCKS.WOOD);
    if(biome.cactus && rng()<biome.cactus && surface>5){ const hh=1+Math.floor(rng()*3); for(let j=1;j<=hh;j++) if(surface-j>=0) blocks[x][surface-j]=BLOCKS.CACTUS; }
    if(biome.mushrooms && rng()<biome.mushrooms){ if(surface-1>=0) blocks[x][surface-1]=BLOCKS.PUMPKIN; }
  }
  const sr=seededRandom(seed*17+chunkIndex*7919);
  if(biome.ruins && sr()<biome.ruins) placeStructure(blocks,2+Math.floor(sr()*(CHUNK_WIDTH-12)),biomeTerrainHeight(chunkIndex*CHUNK_WIDTH+8,seed),'ruin',seed+chunkIndex);
  if(biome.id==='elemental_ruins' && sr()<0.7) placeStructure(blocks,4+Math.floor(sr()*18),biomeTerrainHeight(chunkIndex*CHUNK_WIDTH+12,seed),'elemental',seed+chunkIndex*3);
  if(['forest','deep_forest','grasslands','highlands','coastal_beach'].includes(biome.id) && sr()<0.25) placeStructure(blocks,3+Math.floor(sr()*18),biomeTerrainHeight(chunkIndex*CHUNK_WIDTH+10,seed),'house',seed+chunkIndex*5);
  if(biome.id==='ancient_ruins' && sr()<0.8){ const x=8+Math.floor(sr()*10); const y=biomeTerrainHeight(chunkIndex*CHUNK_WIDTH+x,seed); for(let i=0;i<5;i++){if(x+i<CHUNK_WIDTH)blocks[x+i][Math.max(0,y-5)]=BLOCKS.PILLAR;} }
  return blocks;
}

export class WorldManager {
  constructor(seed) {
    this.seed = seed || Math.floor(Math.random() * 999999);
    this.chunks = {};
    this.breakProgress = {};
    this.modifications = {}; // "x,y" → blockType (tracks player changes for saving)
  }

  getChunk(chunkIndex) {
    if (!this.chunks[chunkIndex]) {
      this.chunks[chunkIndex] = generateChunk(chunkIndex, this.seed);
    }
    return this.chunks[chunkIndex];
  }

  getBlock(worldX, worldY) {
    if (worldY < 0 || worldY >= WORLD_HEIGHT) return BLOCKS.AIR;
    const ci = Math.floor(worldX / CHUNK_WIDTH);
    const lx = ((worldX % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
    const chunk = this.getChunk(ci);
    return chunk[lx]?.[worldY] ?? BLOCKS.AIR;
  }

  setBlock(worldX, worldY, blockType) {
    if (worldY < 0 || worldY >= WORLD_HEIGHT) return;
    const ci = Math.floor(worldX / CHUNK_WIDTH);
    const lx = ((worldX % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
    const chunk = this.getChunk(ci);
    if (chunk[lx]) chunk[lx][worldY] = blockType;
    delete this.breakProgress[`${worldX},${worldY}`];
    this.modifications[`${worldX},${worldY}`] = blockType;
  }

  startBreaking(worldX, worldY) {
    const block = this.getBlock(worldX, worldY);
    if (block === BLOCKS.AIR || block === BLOCKS.WATER || block === BLOCKS.LAVA) return;
    const key = `${worldX},${worldY}`;
    if (!this.breakProgress[key]) {
      this.breakProgress[key] = { progress: 0, hardness: BLOCK_HARDNESS[block] || 5 };
    }
  }

  continueBreaking(worldX, worldY) {
    const key = `${worldX},${worldY}`;
    const bp = this.breakProgress[key];
    if (!bp) return false;
    bp.progress += 1 / bp.hardness;
    if (bp.progress >= 1) {
      const block = this.getBlock(worldX, worldY);
      this.setBlock(worldX, worldY, BLOCKS.AIR);
      delete this.breakProgress[key];
      return block;
    }
    return false;
  }

  getBreakProgress(worldX, worldY) {
    const key = `${worldX},${worldY}`;
    return this.breakProgress[key]?.progress || 0;
  }

  getTerrainHeight(worldX) { return biomeTerrainHeight(worldX, this.seed, getBiome(worldX, this.seed)); }

  getBiomeAt(worldX) { return getBiome(worldX, this.seed); }

  serializeModifications() {
    return { ...this.modifications };
  }

  applyModifications(mods) {
    if (!mods) return;
    for (const [key, blockType] of Object.entries(mods)) {
      const [wx, wy] = key.split(',').map(Number);
      this.setBlock(wx, wy, blockType);
    }
  }
}

// Block texture rendering — unique designs per block type
function drawBlockTexture(ctx, block, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
  const s = BLOCK_SIZE;
  switch (block) {
    case 1: // DIRT
      ctx.fillStyle = 'rgba(50,35,10,0.35)';
      ctx.fillRect(x+4, y+6, 3,3); ctx.fillRect(x+16, y+18, 3,3); ctx.fillRect(x+24, y+8, 2,2); ctx.fillRect(x+8, y+22, 3,2);
      break;
    case 2: // STONE
      ctx.fillStyle = 'rgba(50,50,50,0.3)';
      ctx.fillRect(x+6, y+8, 5,4); ctx.fillRect(x+18, y+20, 4,3); ctx.fillRect(x+22, y+6, 3,3);
      break;
    case 3: // GRASS
      ctx.fillStyle = '#3a8a3a'; ctx.fillRect(x, y, s, 5);
      ctx.fillStyle = '#5cb85c'; for (let i=0;i<5;i++) ctx.fillRect(x+i*6+2, y, 1, 4);
      ctx.fillStyle = 'rgba(139,105,20,0.3)'; ctx.fillRect(x, y+5, s, s-5);
      break;
    case 4: // WOOD
      ctx.strokeStyle='rgba(80,50,30,0.5)'; ctx.lineWidth=1;
      for (let i=6;i<s;i+=8){ctx.beginPath();ctx.moveTo(x+i,y);ctx.lineTo(x+i,y+s);ctx.stroke();}
      ctx.fillStyle='rgba(60,40,20,0.2)'; ctx.fillRect(x,y+12,s,2); ctx.fillRect(x,y+24,s,2);
      break;
    case 5: // LEAVES
      for(let i=0;i<6;i++){ctx.fillStyle=i%2?'rgba(46,125,50,0.5)':'rgba(30,100,40,0.4)';ctx.beginPath();ctx.arc(x+4+i*5,y+6+(i%3)*8,4,0,Math.PI*2);ctx.fill();}
      break;
    case 6: // SAND
      ctx.fillStyle='rgba(255,240,100,0.3)'; for(let i=0;i<6;i++) ctx.fillRect(x+i*5+2,y+i*5+2,2,2);
      break;
    case 8: // BRICK
      ctx.strokeStyle='rgba(180,180,180,0.5)'; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y+11);ctx.lineTo(x+s,y+11);ctx.moveTo(x,y+21);ctx.lineTo(x+s,y+21);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+12,y);ctx.lineTo(x+12,y+11);ctx.moveTo(x+20,y+11);ctx.lineTo(x+20,y+21);ctx.moveTo(x+8,y+21);ctx.lineTo(x+8,y+s);ctx.stroke();
      break;
    case 9: // IRON
      ctx.fillStyle='rgba(200,200,200,0.4)'; ctx.fillRect(x+4,y+4,4,4); ctx.fillRect(x+20,y+18,5,4);
      ctx.fillStyle='rgba(60,40,30,0.5)'; ctx.fillRect(x+10,y+10,3,3); ctx.fillRect(x+22,y+6,3,3);
      break;
    case 10: // GOLD
      ctx.fillStyle='rgba(255,235,50,0.5)'; ctx.fillRect(x+6,y+8,4,3); ctx.fillRect(x+20,y+20,4,3);
      break;
    case 11: // GLASS
      ctx.strokeStyle='rgba(200,240,250,0.6)'; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+16,y+16);ctx.moveTo(x+s,y+8);ctx.lineTo(x+20,y+s);ctx.stroke();
      break;
    case 12: // PLANK
      ctx.strokeStyle='rgba(120,90,60,0.4)'; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y+16);ctx.lineTo(x+s,y+16);ctx.stroke();
      ctx.fillStyle='rgba(180,150,100,0.2)'; ctx.fillRect(x+4,y+4,2,8);
      break;
    case 13: // TORCH
      ctx.fillStyle='#FF8800'; ctx.shadowColor='#FF8800'; ctx.shadowBlur=14;
      ctx.beginPath();ctx.arc(x+s/2,y+4,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      break;
    case 14: // DEEPSTONE
      ctx.fillStyle='rgba(15,15,25,0.5)'; ctx.fillRect(x+4,y+4,4,4); ctx.fillRect(x+18,y+16,6,6);
      break;
    case 15: // CRYSTAL
      ctx.fillStyle='rgba(170,255,255,0.6)'; ctx.shadowColor='#00FFFF'; ctx.shadowBlur=10;
      ctx.fillRect(x+6,y+2,8,s-4); ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(x+8,y+4,3,8);
      break;
    case 17: // OBSIDIAN
      ctx.fillStyle='rgba(40,10,50,0.4)'; ctx.fillRect(x+4,y+6,5,4); ctx.fillRect(x+20,y+20,4,5);
      ctx.strokeStyle='rgba(80,20,90,0.3)'; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y+10);ctx.lineTo(x+10,y+20);ctx.stroke();
      break;
    case 18: // ELEMENT6
      for(let r=4;r<s;r+=8){ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+16,y+16,r,0,Math.PI*0.5);ctx.stroke();}
      break;
    case 55: // ELEMENT6_ORB — glowing magenta orb
      ctx.fillStyle='rgba(221,0,255,0.35)'; ctx.shadowColor='#DD00FF'; ctx.shadowBlur=14;
      ctx.beginPath(); ctx.arc(x+16,y+16,11,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#FFAAFF'; ctx.beginPath(); ctx.arc(x+16,y+16,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#FFFFFF'; ctx.beginPath(); ctx.arc(x+13,y+13,2,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      break;
    case 19: // DIAMOND
      ctx.fillStyle='rgba(200,240,255,0.5)'; ctx.shadowColor='#B9F2FF'; ctx.shadowBlur=8;
      ctx.beginPath();ctx.moveTo(x+16,y+4);ctx.lineTo(x+26,y+16);ctx.lineTo(x+16,y+28);ctx.lineTo(x+6,y+16);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
      break;
    case 20: // LADDER
      ctx.strokeStyle='#AA7744'; ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x+6,y);ctx.lineTo(x+6,y+s);ctx.moveTo(x+s-6,y);ctx.lineTo(x+s-6,y+s);ctx.stroke();
      for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x+6,y+6+i*6);ctx.lineTo(x+s-6,y+6+i*6);ctx.stroke();}
      break;
    case 21: case 22: case 23: case 24: case 45: case 46: case 47: // STONE VARIANTS
      ctx.fillStyle='rgba(40,40,40,0.25)';
      ctx.fillRect(x+6,y+8,4,4); ctx.fillRect(x+18,y+22,3,3);
      break;
    case 25: // DARK BRICK
      ctx.strokeStyle='rgba(60,60,80,0.6)'; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y+16);ctx.lineTo(x+s,y+16);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+16,y);ctx.lineTo(x+16,y+16);ctx.moveTo(x+8,y+16);ctx.lineTo(x+8,y+s);ctx.stroke();
      break;
    case 26: // LIGHT BRICK
      ctx.fillStyle='rgba(255,250,220,0.3)'; ctx.fillRect(x+4,y+4,4,3); ctx.fillRect(x+20,y+20,4,3);
      break;
    case 27: // SANDSTONE
      ctx.strokeStyle='rgba(180,160,100,0.4)'; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y+12);ctx.lineTo(x+s,y+12);ctx.moveTo(x,y+22);ctx.lineTo(x+s,y+22);ctx.stroke();
      break;
    case 28: // CLAY
      ctx.fillStyle='rgba(80,40,20,0.3)'; ctx.fillRect(x+4,y+6,5,4); ctx.fillRect(x+18,y+18,5,4);
      break;
    case 29: // TERRACOTTA
      ctx.fillStyle='rgba(180,80,60,0.3)'; ctx.fillRect(x+8,y+4,4,4); ctx.fillRect(x+16,y+18,4,4);
      break;
    case 31: // BOOKSHELF
      ctx.fillStyle='rgba(180,150,100,0.5)';
      for(let i=0;i<3;i++)for(let j=0;j<3;j++) ctx.fillRect(x+j*10+4,y+i*8+4,7,5);
      break;
    case 32: // LANTERN
      ctx.fillStyle='#FFCC44'; ctx.shadowColor='#FFCC44'; ctx.shadowBlur=14;
      ctx.beginPath();ctx.arc(x+16,y+12,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle='#AA7722'; ctx.lineWidth=2; ctx.beginPath();ctx.rect(x+10,y+4,12,20);ctx.stroke();
      break;
    case 33: // SNOW
      ctx.fillStyle='rgba(255,255,255,0.3)'; for(let i=0;i<5;i++) ctx.fillRect(x+i*6+2,y+i*4+2,3,2);
      break;
    case 34: // ICE
      ctx.fillStyle='rgba(150,200,240,0.3)'; ctx.fillRect(x+4,y+6,5,4);
      ctx.strokeStyle='rgba(200,230,255,0.5)'; ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+16,y+16);ctx.stroke();
      break;
    case 35: // CACTUS
      ctx.fillStyle='rgba(20,80,20,0.4)'; ctx.fillRect(x+10,y+4,10,s-8);
      ctx.fillStyle='#225522'; ctx.fillRect(x+8,y+10,2,8); ctx.fillRect(x+22,y+14,2,8);
      break;
    case 36: // PUMPKIN
      ctx.fillStyle='rgba(200,100,0,0.3)'; ctx.fillRect(x+4,y+4,s-8,s-8);
      ctx.fillStyle='#225500'; ctx.fillRect(x+12,y,8,4);
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(x+8,y+14,4,3); ctx.fillRect(x+20,y+14,4,3);
      break;
    case 37: // HAY
      ctx.strokeStyle='rgba(200,180,60,0.5)'; ctx.lineWidth=1;
      for(let i=0;i<s;i+=6){ctx.beginPath();ctx.moveTo(x,y+i);ctx.lineTo(x+s,y+i);ctx.stroke();}
      break;
    case 38: // NETHER BRICK
      ctx.fillStyle='rgba(20,5,15,0.5)'; ctx.fillRect(x+4,y+4,4,4); ctx.fillRect(x+20,y+18,5,5);
      break;
    case 39: // QUARTZ
      ctx.fillStyle='rgba(220,220,210,0.3)'; ctx.fillRect(x+4,y+4,8,8);
      ctx.strokeStyle='rgba(200,200,190,0.5)'; ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(x+12,y+4);ctx.lineTo(x+12,y+s);ctx.stroke();
      break;
    case 40: // GLOWSTONE
      ctx.fillStyle='rgba(255,240,100,0.5)'; ctx.shadowColor='#FFEE88'; ctx.shadowBlur=8;
      ctx.fillRect(x+4,y+4,4,3); ctx.fillRect(x+20,y+18,5,3); ctx.fillRect(x+22,y+6,4,3);ctx.shadowBlur=0;
      break;
    case 41: // MARBLE
      ctx.strokeStyle='rgba(180,180,200,0.3)'; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x+s,y+20);ctx.moveTo(x,y+20);ctx.lineTo(x+s,y+8);ctx.stroke();
      break;
    case 42: // GRANITE
      ctx.fillStyle='rgba(120,50,50,0.4)'; ctx.fillRect(x+6,y+8,5,4); ctx.fillRect(x+18,y+20,4,3);
      break;
    case 43: // COPPER
      ctx.fillStyle='rgba(140,80,40,0.4)'; ctx.fillRect(x+4,y+6,6,4); ctx.fillRect(x+20,y+22,5,4);
      break;
    case 44: // RUNE STONE
      ctx.strokeStyle='rgba(60,255,200,0.6)'; ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(x+16,y+16,8,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+12,y+12);ctx.lineTo(x+20,y+20);ctx.moveTo(x+20,y+12);ctx.lineTo(x+12,y+20);ctx.stroke();
      break;
    case 48: // RAINBOW
      const _h=(Date.now()/20+x)%360;
      ctx.fillStyle=`hsla(${_h},80%,60%,0.4)`; ctx.fillRect(x,y,s,4);
      ctx.fillStyle=`hsla(${(_h+120)%360},80%,60%,0.4)`; ctx.fillRect(x,y+4,s,4);
      ctx.fillStyle=`hsla(${(_h+240)%360},80%,60%,0.4)`; ctx.fillRect(x,y+8,s,4);
      break;
    case 49: // CLOUD
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.beginPath();ctx.arc(x+8,y+8,6,0,Math.PI*2);ctx.arc(x+24,y+12,6,0,Math.PI*2);ctx.fill();
      break;
    case 50: // NEON
      ctx.shadowColor='#00FFAA'; ctx.shadowBlur=8; ctx.strokeStyle='#00FFAA'; ctx.lineWidth=1.5;
      ctx.beginPath();ctx.rect(x+4,y+4,s-8,s-8);ctx.stroke();ctx.shadowBlur=0;
      break;
    case 51: // BED — pillow + blanket
      ctx.fillStyle='#FFDDDD'; ctx.fillRect(x+4,y+6,9,9);
      ctx.fillStyle='#993344'; ctx.fillRect(x+14,y+6,s-16,16);
      ctx.fillStyle='#883333'; ctx.fillRect(x+2,y,4,s);
      break;
    case 52: // SAPLING — small green sprout
      ctx.strokeStyle='#5a3a1a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+s/2,y+s); ctx.lineTo(x+s/2,y+s-10); ctx.stroke();
      ctx.fillStyle='#3a7a3a'; ctx.beginPath(); ctx.arc(x+s/2-4,y+s-12,5,0,Math.PI*2); ctx.arc(x+s/2+4,y+s-12,5,0,Math.PI*2); ctx.arc(x+s/2,y+s-16,4,0,Math.PI*2); ctx.fill();
      break;
    case 53: // CHEST — wooden box with lock
      ctx.fillStyle='#6B4423'; ctx.fillRect(x+4,y+4,s-8,s-8);
      ctx.strokeStyle='#3a2a1a'; ctx.lineWidth=1; ctx.strokeRect(x+4,y+4,s-8,s-8);
      ctx.fillStyle='#FFD700'; ctx.fillRect(x+s/2-3,y+s/2-3,6,6);
      ctx.strokeStyle='rgba(120,80,40,0.5)'; ctx.beginPath(); ctx.moveTo(x+4,y+s/2); ctx.lineTo(x+s-4,y+s/2); ctx.stroke();
      break;
    case 54: // APPLE — red fruit (inventory icon, not placeable)
      ctx.fillStyle='#E02020'; ctx.beginPath(); ctx.arc(x+s/2,y+s/2+2,8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#225500'; ctx.fillRect(x+s/2-1,y+5,2,5);
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x+s/2-3,y+s/2,2,0,Math.PI*2); ctx.fill();
      break;
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
}

// Render the world
export function renderWorld(ctx, world, cameraX, cameraY, canvasW, canvasH, dayProgress) {
  const startBX = Math.floor((cameraX - canvasW / 2) / BLOCK_SIZE) - 1;
  const endBX = Math.ceil((cameraX + canvasW / 2) / BLOCK_SIZE) + 1;
  const startBY = Math.floor((cameraY - canvasH / 2) / BLOCK_SIZE) - 1;
  const endBY = Math.ceil((cameraY + canvasH / 2) / BLOCK_SIZE) + 1;

  function lerpColor(a, b, t) {
    const ah = a.replace('#',''), bh = b.replace('#','');
    const ar = parseInt(ah.slice(0,2),16), ag = parseInt(ah.slice(2,4),16), ab = parseInt(ah.slice(4,6),16);
    const br = parseInt(bh.slice(0,2),16), bg = parseInt(bh.slice(2,4),16), bb = parseInt(bh.slice(4,6),16);
    const r = Math.round(ar + (br-ar)*t), g = Math.round(ag + (bg-ag)*t), b2 = Math.round(ab + (bb-ab)*t);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b2.toString(16).padStart(2,'0')}`;
  }

  let skyTop, skyBot;
  const dp = dayProgress;
  if (dp < 0.25) {
    const t = dp / 0.25;
    skyTop = lerpColor('#1a0a2a', '#4488cc', t);
    skyBot = lerpColor('#3a1a1a', '#88ccee', t);
  } else if (dp < 0.5) {
    const t = (dp - 0.25) / 0.25;
    skyTop = lerpColor('#4488cc', '#FF9944', t);
    skyBot = lerpColor('#88ccee', '#FFbb77', t);
  } else if (dp < 0.75) {
    const t = (dp - 0.5) / 0.25;
    skyTop = lerpColor('#FF9944', '#0a0a2e', t);
    skyBot = lerpColor('#FFbb77', '#1a1a3a', t);
  } else {
    const t = (dp - 0.75) / 0.25;
    skyTop = lerpColor('#0a0a2e', '#1a0a2a', t);
    skyBot = lerpColor('#1a1a3a', '#3a1a1a', t);
  }

  const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(0.7, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Sun/Moon
  const celestialX = canvasW * dayProgress;
  const celestialY = 60 + Math.sin(dayProgress * Math.PI) * -40;
  if (dayProgress <= 0.5) {
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(celestialX * 2, celestialY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#DDDDEE';
    ctx.shadowColor = '#AAAACC';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc((celestialX - canvasW * 0.5) * 2, celestialY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (dayProgress > 0.5) {
    const nightAlpha = Math.min((dayProgress - 0.5) * 2, 0.4);
    ctx.fillStyle = `rgba(0,0,20,${nightAlpha})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Check if camera is underground — darken
  const camWorldY = Math.floor((cameraY) / BLOCK_SIZE);
  const surfaceAtCam = world.getTerrainHeight(Math.floor(cameraX / BLOCK_SIZE));
  const undergroundDepth = camWorldY - surfaceAtCam;
  if (undergroundDepth > 5) {
    const darkness = Math.min(undergroundDepth / 40, 0.85);
    ctx.fillStyle = `rgba(0,0,0,${darkness})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Blocks
  for (let bx = startBX; bx <= endBX; bx++) {
    for (let by = startBY; by <= endBY; by++) {
      const block = world.getBlock(bx, by);
      if (block === BLOCKS.AIR) continue;

      const screenX = bx * BLOCK_SIZE - cameraX + canvasW / 2;
      const screenY = by * BLOCK_SIZE - cameraY + canvasH / 2;

      if (screenX < -BLOCK_SIZE || screenX > canvasW + BLOCK_SIZE) continue;
      if (screenY < -BLOCK_SIZE || screenY > canvasH + BLOCK_SIZE) continue;

      const color = BLOCK_COLORS[block];
      if (!color) continue;
      drawBlockTexture(ctx, block, screenX, screenY, color);

      const breakProg = world.getBreakProgress(bx, by);
      if (breakProg > 0) {
        ctx.save();
        ctx.globalAlpha = breakProg * 0.7;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const cx2 = screenX + BLOCK_SIZE / 2;
        const cy2 = screenY + BLOCK_SIZE / 2;
        const cracks = Math.floor(breakProg * 5) + 1;
        for (let c = 0; c < cracks; c++) {
          const angle = (c / cracks) * Math.PI * 2 + breakProg;
          ctx.beginPath();
          ctx.moveTo(cx2, cy2);
          ctx.lineTo(cx2 + Math.cos(angle) * BLOCK_SIZE * 0.5, cy2 + Math.sin(angle) * BLOCK_SIZE * 0.5);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(255,255,255,${breakProg * 0.3})`;
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.restore();
      }

      if (block === BLOCKS.TORCH) {
        ctx.fillStyle = '#FF8800';
        ctx.shadowColor = '#FF8800';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(screenX + BLOCK_SIZE / 2, screenY + 4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      if (block === BLOCKS.CRYSTAL) {
        ctx.fillStyle = '#AAFFFF';
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 10;
        ctx.fillRect(screenX + 6, screenY + 2, 8, BLOCK_SIZE - 4);
        ctx.shadowBlur = 0;
      }
      if (block === BLOCKS.LAVA) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.globalAlpha = 1;
        // Lava glow
        ctx.shadowColor = '#FF4400';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#FF2200';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.shadowBlur = 0;
      }
      if (block === BLOCKS.WATER) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(screenX, screenY + 4, BLOCK_SIZE, BLOCK_SIZE - 4);
        ctx.globalAlpha = 1;
      }
    }
  }
}