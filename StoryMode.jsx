import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import {
  BLOCKS, BLOCK_COLORS, BLOCK_NAMES, BLOCK_SIZE,
  WorldManager, renderWorld, WORLD_HEIGHT, CHUNK_WIDTH
} from './world.js';
import { drawStickman } from './renderer.js';
import { getAccessory, drawAccessory } from './cosmetics.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { RECIPES, canCraft, craftItem } from './crafting.js';
import { QUESTS } from './quests.js';
import StoryBattle from './StoryBattle.jsx';
import VillainCutscene from './VillainCutscene.jsx';
import RiftCutscene from './RiftCutscene.jsx';
import { music } from './music.js';
import { maybeSpawnNightVillain, updateNightVillains, renderNightVillain, storyAttack } from './storyNight.js';
import { rollNightLevel } from './nightVillains.js';
import GameIcon from "./GameIcon.jsx";
import { BLOCK_DROP_ITEMS, STORY_ITEM_MAP } from './storyItems.js';

const CANVAS_W = 960;
const CANVAS_H = 560;
const PLAYER_W = BLOCK_SIZE * 0.55;
const PLAYER_H = BLOCK_SIZE * 1.9;
const MOVE_SPEED = 3.2;
const JUMP_VEL = -11;
const GRAVITY = 0.35;
const MAX_FALL = 14;
const MINE_RADIUS_BLOCKS = 5; // cursor mining radius

export default function StoryMode({ onBack, progress, onUnlockHero, onUnlockVillain, onUnlockAll, onSaveProgress, onAddCoins, equippedAccessories = {}, equippedSkins = {}, equippedShikigami = {}, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef({});
  const mouseRef = useRef({ x: 0, y: 0, held: false });
  const rafRef = useRef(null);
  const flashRef = useRef(null);

  const [showInventory, setShowInventory] = useState(false);
  const [showCrafting, setShowCrafting] = useState(false);
  const [inventory, setInventory] = useState(progress?.inventory || {});
  const [hotbar, setHotbar] = useState(progress?.hotbar || Array(9).fill(null));
  const [hotbarSlot, setHotbarSlot] = useState(0);
  const [currentHeroId, setCurrentHeroId] = useState(progress?.currentHeroId || progress?.favoriteId || progress?.unlockedIds?.[0] || 'yellow');
  const [battleVillain, setBattleVillain] = useState(null);
  const [health, setHealth] = useState(100);
  const [msg, setMsg] = useState('');
  const [quests, setQuests] = useState(QUESTS.map(q => ({ ...q })));
  const [battleStartStocks, setBattleStartStocks] = useState(3);
  const [battleStartTime, setBattleStartTime] = useState(0);
  const [showQuests, setShowQuests] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [dialogue, setDialogue] = useState(null);
  const [cutsceneVillain, setCutsceneVillain] = useState(null);
  const [riftActive, setRiftActive] = useState(false);
  const [riftAvailable, setRiftAvailable] = useState((progress?.defeatedVillains || []).includes('controller') && !progress?.riftCompleted);
  const [riftBattle, setRiftBattle] = useState(null); // null | 'guardians' | 'final'
  const [riftCutscene, setRiftCutscene] = useState(false);
  const [chestData, setChestData] = useState(null); // { key, contents }

  const unlockedIds = progress?.unlockedIds || ['yellow'];

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3500); };

  const tryStartDialogue = () => {
    const s = stateRef.current;
    if (!s || dialogue || cutsceneVillain) return;
    let nearest = null, nearestDist = Infinity, nearestType = null;
    s.npcs.forEach(npc => {
      const dx = s.player.wx - npc.wx, dy = s.player.wy - npc.wy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < BLOCK_SIZE * 4 && d < nearestDist) { nearest = npc; nearestDist = d; nearestType = 'npc'; }
    });
    s.villainSpawns.forEach(vs => {
      const dx = s.player.wx - vs.wx, dy = s.player.wy - vs.wy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < BLOCK_SIZE * 4 && d < nearestDist) { nearest = vs; nearestDist = d; nearestType = 'villain'; }
    });
    if (!nearest) return;
    if (nearestType === 'npc') {
      setDialogue({ type: 'npc', name: nearest.name, text: nearest.dialogue, options: [{ label: 'Goodbye', action: 'close' }] });
    } else {
      const v = VILLAINS.find(vl => vl.id === nearest.villainId);
      const vsIdx = stateRef.current.villainSpawns.indexOf(nearest);
      const prevAllDefeated = vsIdx === 0 || stateRef.current.villainSpawns.slice(0, vsIdx).every(v => v.defeated);
      if (!prevAllDefeated && !nearest.defeated) {
        const prevName = VILLAINS.find(vl => vl.id === stateRef.current.villainSpawns.slice(0, vsIdx).find(v => !v.defeated)?.villainId)?.name || 'a previous villain';
        setDialogue({ type: 'villain', villainId: nearest.villainId, name: v?.name, text: `Path blocked! Defeat ${prevName} first, then come challenge me.`, options: [{ label: 'Leave', action: 'close' }] });
      } else if (nearest.defeated) {
        setDialogue({ type: 'villain', villainId: nearest.villainId, name: v?.name, text: `You defeated me before... but I've recovered. Care for a rematch?`, options: [{ label: 'Rematch', action: 'fight' }, { label: 'Leave', action: 'close' }] });
      } else {
        setDialogue({ type: 'villain', villainId: nearest.villainId, name: v?.name, text: `So you've come at last. I've been waiting for this. Let's see what you're made of!`, options: [{ label: 'Fight', action: 'fight' }, { label: 'Not yet', action: 'close' }] });
      }
    }
  };

  const handleDialogueAction = (action) => {
    if (action === 'fight' && dialogue?.villainId) {
      setCutsceneVillain(dialogue.villainId);
      setDialogue(null);
    } else {
      setDialogue(null);
    }
  };

  const handleCutsceneContinue = () => {
    setBattleVillain(cutsceneVillain);
    setCutsceneVillain(null);
    setBattleStartTime(performance.now());
    if (stateRef.current) stateRef.current.running = false;
    music.stop();
  };

  const completeQuest = (questId) => {
    setQuests(prev => {
      if (prev.find(q => q.id === questId)?.done) return prev;
      return prev.map(q => q.id === questId ? { ...q, done: true } : q);
    });
  };

  // Check collection-based quests against inventory
  const checkCollectionQuests = (inv) => {
    setQuests(prev => prev.map(q => {
      if (q.done) return q;
      if (q.trigger?.type === 'collect') {
        if ((inv[q.trigger.block] || 0) >= q.trigger.count) return { ...q, done: true };
      }
      if (q.trigger?.type === 'collectMulti') {
        const met = q.trigger.needs.every(n => (inv[n.block] || 0) >= n.count);
        if (met) return { ...q, done: true };
      }
      return q;
    }));
  };

  // Sync inventory + hotbar to stateRef
  useEffect(() => {
    if (stateRef.current) stateRef.current.inventory = inventory;
    checkCollectionQuests(inventory);
  }, [inventory]);
  // Clear hotbar slots when the block they hold runs out
  useEffect(() => {
    setHotbar(prev => {
      let changed = false;
      const next = prev.map(slot => {
        if (slot != null && (inventory[slot] || 0) <= 0) { changed = true; return null; }
        return slot;
      });
      return changed ? next : prev;
    });
  }, [inventory]);
  useEffect(() => { if (stateRef.current) stateRef.current.paused = showInventory || showCrafting || !!chestData; }, [showInventory, showCrafting, chestData]);
  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.hotbarSlot = hotbarSlot;
      stateRef.current.hotbar = hotbar;
    }
  }, [hotbarSlot, hotbar]);
  useEffect(() => {
    if (stateRef.current) stateRef.current.currentHeroId = currentHeroId;
  }, [currentHeroId]);

  useEffect(() => {
    music.setVolume(progress?.settings?.musicVolume ?? 50);
    music.play('story');

    const world = new WorldManager(progress?.worldSeed || (Math.floor(Math.random()*2147483646)+1));
    const generatedSeed = world.seed;

    // Find spawn on surface — world chunk 0 around x=20
    const spawnWorldX = 20;
    const terrainY = world.getTerrainHeight(spawnWorldX);
    const spawnPixelX = spawnWorldX * BLOCK_SIZE + BLOCK_SIZE / 2;
    // Surface grass is at row terrainY, player feet stand on top of it
    const spawnPixelY = terrainY * BLOCK_SIZE - PLAYER_H;

    const player = {
      wx: spawnPixelX,
      wy: spawnPixelY,
      vx: 0, vy: 0,
      facing: 1, grounded: false, frame: 0,
      breakTarget: null, breakTimer: 0,
      doubleJump: 1, crouching: false,
    };

    const npcs = buildNPCs(world, spawnWorldX);
    const villainSpawns = buildVillainSpawns(world, spawnWorldX);

    // Restore defeated villains from saved progress
    const defeatedFromSave = progress?.defeatedVillains || [];
    villainSpawns.forEach(vs => {
      if (defeatedFromSave.includes(vs.villainId)) vs.defeated = true;
    });

    // Restore player position if saved
    const savedPX = progress?.playerX;
    const savedPY = progress?.playerY;
    if (savedPX != null) {
      player.wx = savedPX;
      player.wy = savedPY;
    }
    // Restore block modifications
    if (progress?.blockMods) world.applyModifications(progress.blockMods);

    stateRef.current = {
      world, player,
      camera: { x: player.wx, y: player.wy - CANVAS_H * 0.3 },
      dayTimer: 100, // start a bit into day
      dayProgress: 0.25,
      running: true,
      npcs, villainSpawns,
      hotbar: Array(9).fill(null),
      worldSeed: generatedSeed,
      hotbarSlot: 0,
      inventory: progress?.inventory || {},
      currentHeroId: progress?.currentHeroId || progress?.unlockedIds?.[0] || 'yellow',
      particleEffects: [],
      nearbyVillain: null,
      nearbyNpc: null,
      nightVillains: [], nightSpawnTimer: 0, nightScore: 0,
      attackCd: 0, playerHp: 100, playerInvuln: 0, screenDarken: 0,
      saplings: [], chests: {},
    };

    const handleKey = (e, down) => {
      keysRef.current[e.key] = down;
      keysRef.current[e.key.toLowerCase()] = down;
      if (down) {
        // Tab = combined inventory + crafting (side by side)
        if (e.key === 'Tab') { setShowInventory(v => !v); setShowCrafting(v => !v); }
        if (e.key.toLowerCase() === 'm') setShowMinimap(v => !v);
        if (e.key.toLowerCase() === 'q') setShowQuests(v => !v);
        if (e.key.toLowerCase() === 'r') tryStartDialogue();
        if (e.key.toLowerCase() === 'z' && stateRef.current) stateRef.current.player.crouching = !stateRef.current.player.crouching;
        // Attack keys — sig(,/v), power(.), super(//x), heavy(f/l)
        if (e.key === ',' || e.key === 'v') keysRef.current['_atkSig'] = true;
        if (e.key === '.') keysRef.current['_atkPower'] = true;
        if (e.key === '/' || e.key === 'x') keysRef.current['_atkSuper'] = true;
        if (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'l') keysRef.current['_atkHeavy'] = true;
        // Number keys 1-9 for hotbar — changes immediately
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= 9) {
          setHotbarSlot(num - 1);
          const hb = stateRef.current?.hotbar || [];
          if (hb[num - 1]) flashRef.current = { name: BLOCK_NAMES[hb[num - 1]] || 'Block', time: performance.now() };
        }
      }
      if (!['F5','F12'].includes(e.key)) e.preventDefault();
    };

    const canvas = canvasRef.current;

    const isOnCanvas = (e) => {
      const c = canvasRef.current;
      if (!c) return false;
      const rect = c.getBoundingClientRect();
      return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    };
    const handleMouseMove = (e) => {
      const c = canvasRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      if (rect.width === 0) return;
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      mouseRef.current.x = (e.clientX - rect.left) * scaleX;
      mouseRef.current.y = (e.clientY - rect.top) * scaleY;
    };
    const handleMouseDown = (e) => {
      if (!isOnCanvas(e)) return;
      if (e.button === 0) mouseRef.current.held = true;
      if (e.button === 2) { doPlacing(); e.preventDefault(); }
    };
    const handleMouseUp = (e) => {
      if (e.button === 0) {
        mouseRef.current.held = false;
        if (stateRef.current) stateRef.current.player.breakTarget = null;
      }
    };
    const handleContextMenu = (e) => { if (isOnCanvas(e)) e.preventDefault(); };

    const kd = e => handleKey(e, true);
    const ku = e => handleKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    startLoop();

    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      if (stateRef.current) stateRef.current.running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      music.stop();
    };
  }, []);

  const doPlacing = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const { camera, player, world, hotbar, hotbarSlot } = s;
    const bx = Math.floor((mouseRef.current.x + camera.x - CANVAS_W / 2) / BLOCK_SIZE);
    const by = Math.floor((mouseRef.current.y + camera.y - CANVAS_H / 2) / BLOCK_SIZE);
    // Chest interaction — right-click/E opens storage
    if (world.getBlock(bx, by) === BLOCKS.CHEST) {
      const key = `${bx},${by}`;
      if (!s.chests[key]) s.chests[key] = {};
      setChestData({ key, contents: { ...s.chests[key] } });
      return;
    }
    // Bed interaction — right-click/E on a bed skips night and sets spawn
    if (world.getBlock(bx, by) === BLOCKS.BED) {
      s.bedX = (bx + 1) * BLOCK_SIZE + BLOCK_SIZE / 2;
      s.bedY = by * BLOCK_SIZE;
      if (s.dayProgress > 0.5) {
        s.dayTimer = Math.ceil(s.dayTimer / 360) * 360;
        s.nightVillains = [];
        showMsg('You slept! Night skipped. Spawn set.');
      } else {
        showMsg('Spawn set at bed.');
      }
      return;
    }
    const blockType = hotbar[hotbarSlot];
    if (!blockType) return;
    // Apple — eat instead of placing
    if (blockType === BLOCKS.APPLE) {
      setInventory(prev => ({ ...prev, [BLOCKS.APPLE]: Math.max(0, (prev[BLOCKS.APPLE] || 0) - 1) }));
      s.playerHp = Math.min(100, (s.playerHp || 100) + 30);
      setHealth(Math.round(s.playerHp));
      showMsg('Ate an apple! +30 HP');
      return;
    }
    if (world.getBlock(bx, by) !== BLOCKS.AIR) return;
    if (blockType === BLOCKS.BED && world.getBlock(bx + 1, by) !== BLOCKS.AIR) return;
    setInventory(prev => {
      if ((prev[blockType] || 0) <= 0) return prev;
      if (blockType === BLOCKS.SAPLING) {
        world.setBlock(bx, by, blockType);
        s.saplings.push({ x: bx, y: by, plantedAt: performance.now() });
      } else if (blockType === BLOCKS.BED) {
        world.setBlock(bx, by, blockType);
        world.setBlock(bx + 1, by, blockType);
        s.bedX = (bx + 1) * BLOCK_SIZE + BLOCK_SIZE / 2; s.bedY = by * BLOCK_SIZE;
      } else {
        world.setBlock(bx, by, blockType);
      }
      return { ...prev, [blockType]: prev[blockType] - 1 };
    });
  }, []);

  const startLoop = () => {
    let lastTime = performance.now();
    const loop = (now) => {
      const s = stateRef.current;
      if (!s?.running) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      if (s.paused) { rafRef.current = requestAnimationFrame(loop); return; }
      lastTime = now;
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');

      // Day cycle — smooth gradient
      s.dayTimer += dt;
      s.dayProgress = (s.dayTimer % 360) / 360;

      // ── Night villain system — 3 min day + 3 min night ──
      const isNight = s.dayProgress > 0.5;
      if (isNight) {
        if (!s._nightLevelSet) { s._nightLevel = rollNightLevel(); s._nightLevelSet = true; }
        maybeSpawnNightVillain(s, s._nightLevel || 1);
      } else {
        s._nightLevelSet = false;
        s.nightVillains = [];
      }
      updateNightVillains(s, dt);
      // Slow auto-heal
      if (s.playerHp != null && s.playerHp < 100 && s.playerHp > 0) s.playerHp = Math.min(100, s.playerHp + 0.05);
      // Grow saplings into trees after 2 minutes
      if (s.saplings) {
        const _now = performance.now();
        s.saplings = s.saplings.filter(sap => {
          if (_now - sap.plantedAt >= 120000) {
            if (s.world.getBlock(sap.x, sap.y) === BLOCKS.SAPLING) {
              s.world.setBlock(sap.x, sap.y, BLOCKS.WOOD);
              for (let ty = 1; ty <= 3; ty++) { if (s.world.getBlock(sap.x, sap.y - ty) === BLOCKS.AIR) s.world.setBlock(sap.x, sap.y - ty, BLOCKS.WOOD); }
              for (let lx = -2; lx <= 2; lx++) for (let ly = 0; ly <= 2; ly++) { const lX = sap.x + lx, lY = sap.y - 4 + ly; if (s.world.getBlock(lX, lY) === BLOCKS.AIR) s.world.setBlock(lX, lY, BLOCKS.LEAVES); }
            }
            return false;
          }
          return true;
        });
      }
      s.attackCd = Math.max(0, (s.attackCd || 0) - 1);
      if (s.playerInvuln) s.playerInvuln--;
      if (s.screenDarken) s.screenDarken--;
      if (s.playerHp != null && Math.abs(s.playerHp - (s._lastSyncHp ?? 100)) >= 1) {
        s._lastSyncHp = Math.round(s.playerHp);
        setHealth(Math.round(s.playerHp));
      }
      if (s.playerHp != null && s.playerHp <= 0) {
        s.playerHp = 100; s.playerInvuln = 60; s.nightVillains = [];
        // 20% chance for each item to disappear on death
        setInventory(prev => {
          const next = {};
          for (const [k, v] of Object.entries(prev)) { if (v > 0 && Math.random() < 0.2) continue; next[k] = v; }
          return next;
        });
        setHotbar(prev => prev.map(slot => (slot != null && Math.random() < 0.2) ? null : slot));
        // Respawn at bed or original spawn point
        if (s.bedX != null) {
          s.player.wx = s.bedX; s.player.wy = s.bedY - PLAYER_H;
          showMsg('Defeated! Respawning at your bed -10 HP');
        } else {
          s.player.wx = 20 * BLOCK_SIZE + BLOCK_SIZE / 2;
          const _tY = s.world.getTerrainHeight(20);
          s.player.wy = _tY * BLOCK_SIZE - PLAYER_H;
          showMsg('Defeated! Respawning at spawn -10 HP');
        }
        s.player.vx = 0; s.player.vy = 0;
        setHealth(prev => Math.max(prev - 10, 0));
      }

      updatePlayer(s, dt);

      // Dynamic camera — follow player with look-ahead in movement direction
      const camTargetX = s.player.wx + s.player.vx * 18;
      const camTargetY = s.player.wy + s.player.vy * 6 - CANVAS_H * 0.15;
      s.camera.x += (camTargetX - s.camera.x) * 0.10;
      s.camera.y += (camTargetY - s.camera.y) * 0.10;

      // Auto-save location every 5 seconds
      s.autoSaveTimer = (s.autoSaveTimer || 0) + dt;
      if (s.autoSaveTimer >= 5) {
        s.autoSaveTimer = 0;
        onSaveProgress?.({
          worldSeed: s.world.seed,
          playerX: s.player.wx,
          playerY: s.player.wy,
          defeatedVillains: s.villainSpawns.filter(v => v.defeated).map(v => v.villainId),
          inventory: s.inventory,
          hotbar: s.hotbar,
          currentHeroId: s.currentHeroId,
          blockMods: s.world.serializeModifications(),
        });
      }

      // Check villain/NPC proximity for dialogue prompt
      s.nearbyVillain = null;
      s.nearbyNpc = null;
      s.villainSpawns.forEach((vs, vi) => {
        const dx = s.player.wx - vs.wx;
        const dy = s.player.wy - vs.wy;
        if (Math.abs(dx) < BLOCK_SIZE * 4 && Math.abs(dy) < BLOCK_SIZE * 4) {
          // Battle gating: can only fight if all previous villains are defeated
          const prevAllDefeated = vi === 0 || s.villainSpawns.slice(0, vi).every(v => v.defeated);
          if (prevAllDefeated || vs.defeated) {
            s.nearbyVillain = vs;
          }
        }
      });
      s.npcs.forEach(npc => {
        const dx = s.player.wx - npc.wx;
        const dy = s.player.wy - npc.wy;
        if (Math.abs(dx) < BLOCK_SIZE * 4 && Math.abs(dy) < BLOCK_SIZE * 4) {
          s.nearbyNpc = npc;
        }
      });

      // Update NPCs — gravity + collision + roaming (skip distant for performance)
      s.npcs.forEach(npc => {
        if (Math.abs(npc.wx - s.player.wx) > BLOCK_SIZE * 40) return;
        // Gravity
        if (!npc.grounded) npc.vy = (npc.vy || 0) + GRAVITY;
        else npc.vy = 0;
        if (npc.vy > MAX_FALL) npc.vy = MAX_FALL;
        const newNpcY = npc.wy + npc.vy;
        const npcBxL = Math.floor((npc.wx - PLAYER_W * 0.3) / BLOCK_SIZE);
        const npcBxR = Math.floor((npc.wx + PLAYER_W * 0.3) / BLOCK_SIZE);
        const feetBlock = Math.floor(newNpcY / BLOCK_SIZE);
        if (isSolid(s.world, npcBxL, feetBlock) || isSolid(s.world, npcBxR, feetBlock)) {
          npc.wy = feetBlock * BLOCK_SIZE;
          npc.vy = 0;
          npc.grounded = true;
        } else {
          npc.wy = newNpcY;
          npc.grounded = false;
        }

        // Flee from villains and night villains
        let _fleeDir = 0;
        s.villainSpawns.forEach(vs => {
          if (vs.defeated) return;
          if (Math.abs(npc.wx - vs.wx) < BLOCK_SIZE * 6 && Math.abs(npc.wy - vs.wy) < BLOCK_SIZE * 3) _fleeDir = npc.wx > vs.wx ? 1 : -1;
        });
        (s.nightVillains || []).forEach(nv => {
          if (Math.abs(npc.wx - nv.wx) < BLOCK_SIZE * 6 && Math.abs(npc.wy - nv.wy) < BLOCK_SIZE * 3) _fleeDir = npc.wx > nv.wx ? 1 : -1;
        });
        if (_fleeDir !== 0) {
          npc.roamDir = _fleeDir; npc.roamActive = true; npc.roamTimer = 20;
        } else {
          npc.roamTimer = (npc.roamTimer || 0) - 1;
          if (npc.roamTimer <= 0) {
            npc.roamDir = Math.random() > 0.5 ? 1 : -1;
            npc.roamTimer = 60 + Math.floor(Math.random() * 120);
            npc.roamActive = Math.random() > 0.35;
          }
        }
        if (npc.roamActive && npc.grounded) {
          const newNpcX = npc.wx + npc.roamDir * 0.5;
          const npcMoveCol = npc.roamDir >= 0
            ? Math.floor((newNpcX + PLAYER_W * 0.3) / BLOCK_SIZE)
            : Math.floor((newNpcX - PLAYER_W * 0.3) / BLOCK_SIZE);
          const npcFoot2 = Math.floor((npc.wy - 2) / BLOCK_SIZE);
          if (!isSolid(s.world, npcMoveCol, npcFoot2)) {
            npc.wx = newNpcX;
          } else if (!isSolid(s.world, npcMoveCol, npcFoot2 - 1)) {
            npc.wx = newNpcX;
            npc.wy = (npcFoot2 - 1) * BLOCK_SIZE;
          } else {
            npc.roamDir *= -1;
          }
          if (Math.abs(npc.wx - npc.homeX) > BLOCK_SIZE * 8) npc.roamDir *= -1;
        }
      });

      // Render
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      renderWorld(ctx, s.world, s.camera.x, s.camera.y, CANVAS_W, CANVAS_H, s.dayProgress);
      const currentBiome = s.world.getBiomeAt ? s.world.getBiomeAt(Math.floor(s.player.wx / BLOCK_SIZE)) : null;
      if (currentBiome) { ctx.fillStyle='rgba(0,0,0,0.42)'; ctx.roundRect(12,12,150,24,6); ctx.fill(); ctx.fillStyle='#FFF'; ctx.font='bold 10px Orbitron'; ctx.textAlign='left'; ctx.fillText(currentBiome.name,22,28); }
      // Night lighting — torches, glowstone, lanterns light up the area
      if (s.dayProgress > 0.5) {
        const dark = Math.min((s.dayProgress - 0.5) * 2, 0.65);
        ctx.fillStyle = `rgba(0,5,20,${dark})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.globalCompositeOperation = 'lighter';
        const lbx = Math.floor((s.camera.x - CANVAS_W / 2) / BLOCK_SIZE) - 2;
        const ubx = Math.ceil((s.camera.x + CANVAS_W / 2) / BLOCK_SIZE) + 2;
        const lby = Math.floor((s.camera.y - CANVAS_H / 2) / BLOCK_SIZE) - 2;
        const uby = Math.ceil((s.camera.y + CANVAS_H / 2) / BLOCK_SIZE) + 2;
        for (let bx = lbx; bx <= ubx; bx++) {
          for (let by = lby; by <= uby; by++) {
            const b = s.world.getBlock(bx, by);
            if (b === BLOCKS.TORCH || b === BLOCKS.GLOWSTONE || b === BLOCKS.LANTERN) {
              const lx = bx * BLOCK_SIZE - s.camera.x + CANVAS_W / 2 + BLOCK_SIZE / 2;
              const ly = by * BLOCK_SIZE - s.camera.y + CANVAS_H / 2 + BLOCK_SIZE / 2;
              const r = b === BLOCKS.GLOWSTONE ? 140 : b === BLOCKS.LANTERN ? 100 : 80;
              const g2 = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
              g2.addColorStop(0, `rgba(255,210,120,${0.6 * (1 - dark * 0.3)})`);
              g2.addColorStop(1, 'rgba(255,210,120,0)');
              ctx.fillStyle = g2; ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
            }
          }
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // NPCs
      s.npcs.forEach(npc => {
        const sx = npc.wx - s.camera.x + CANVAS_W / 2;
        const sy = npc.wy - s.camera.y + CANVAS_H / 2;
        if (sx > -80 && sx < CANVAS_W + 80) {
          drawStickman(ctx, sx, sy, npc.color || '#AADDFF', npc.roamDir || 1, s.player.frame + npc.offset, 1, false, npc.roamActive ? 'moving' : 'idle', null);
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 9px Orbitron';
          ctx.textAlign = 'center';
          ctx.fillText(npc.name || 'NPC', sx, sy - 58);
          if (Math.abs(sx - CANVAS_W / 2) < BLOCK_SIZE * 4) {
            ctx.fillStyle = 'rgba(255,255,200,0.9)';
            ctx.font = '8px Rajdhani';
            ctx.fillText(npc.dialogue || '...', sx, sy - 70);
          }
        }
      });

      // Update villains — gravity + walking (like NPCs, but slower and more menacing)
      s.villainSpawns.forEach(vs => {
        if (Math.abs(vs.wx - s.player.wx) > BLOCK_SIZE * 50) return;
        if (!vs.grounded) vs.vy = (vs.vy || 0) + GRAVITY;
        else vs.vy = 0;
        if (vs.vy > MAX_FALL) vs.vy = MAX_FALL;
        const newVY = vs.wy + vs.vy;
        const vsBxL = Math.floor((vs.wx - PLAYER_W * 0.3) / BLOCK_SIZE);
        const vsBxR = Math.floor((vs.wx + PLAYER_W * 0.3) / BLOCK_SIZE);
        const vsFeet = Math.floor(newVY / BLOCK_SIZE);
        if (isSolid(s.world, vsBxL, vsFeet) || isSolid(s.world, vsBxR, vsFeet)) {
          vs.wy = vsFeet * BLOCK_SIZE;
          vs.vy = 0;
          vs.grounded = true;
        } else {
          vs.wy = newVY;
          vs.grounded = false;
        }
        // Walking patrol — non-defeated villains pace back and forth near their spawn
        if (!vs.defeated) {
          vs.frame = (vs.frame || 0) + 1;
          vs.roamTimer = (vs.roamTimer || 0) - 1;
          if (vs.roamTimer <= 0) {
            vs.roamDir = Math.random() > 0.5 ? 1 : -1;
            vs.roamTimer = 80 + Math.floor(Math.random() * 120);
            vs.roamActive = Math.random() > 0.3;
          }
          if (vs.roamActive && vs.grounded) {
            const newVX = vs.wx + vs.roamDir * 0.7;
            const vsMoveCol = vs.roamDir >= 0
              ? Math.floor((newVX + PLAYER_W * 0.3) / BLOCK_SIZE)
              : Math.floor((newVX - PLAYER_W * 0.3) / BLOCK_SIZE);
            const vsFoot2 = Math.floor((vs.wy - 2) / BLOCK_SIZE);
            if (!isSolid(s.world, vsMoveCol, vsFoot2)) {
              vs.wx = newVX;
            } else if (!isSolid(s.world, vsMoveCol, vsFoot2 - 1) && !isSolid(s.world, vsMoveCol, vsFoot2 - 2)) {
              vs.wx = newVX;
              vs.wy = (vsFoot2 - 1) * BLOCK_SIZE;
              vs.vy = 0; vs.grounded = true;
            } else if (!isSolid(s.world, vsMoveCol, vsFoot2 - 1)) {
              // Hop up ~1.3 blocks — jump + forward drift so the villain can
              // clear low ledges it would otherwise get stuck on.
              vs._hopDir = vs.roamDir;
              vs.vy = -Math.sqrt(2 * GRAVITY * 1.3 * BLOCK_SIZE);
              vs.grounded = false;
            } else {
              vs.roamDir *= -1;
            }
            if (Math.abs(vs.wx - vs.homeX) > BLOCK_SIZE * 6) vs.roamDir *= -1;
          }
          // Airborne forward drift while a hop is in progress (runs every frame)
          if (!vs.grounded && vs._hopDir) {
            const hX = vs.wx + vs._hopDir * 1.6;
            const hCol = vs._hopDir >= 0 ? Math.floor((hX + PLAYER_W * 0.3) / BLOCK_SIZE) : Math.floor((hX - PLAYER_W * 0.3) / BLOCK_SIZE);
            if (!isSolid(s.world, hCol, Math.floor((vs.wy - 2) / BLOCK_SIZE)) && !isSolid(s.world, hCol, Math.floor((vs.wy - PLAYER_H + 2) / BLOCK_SIZE))) vs.wx = hX;
          }
          if (vs.grounded) vs._hopDir = 0;
        }
      });

      // Villain markers — defeated villains stay visible (greyed out) and offer rematches
      s.villainSpawns.forEach(vs => {
        const sx = vs.wx - s.camera.x + CANVAS_W / 2;
        const sy = vs.wy - s.camera.y + CANVAS_H / 2;
        if (sx > -80 && sx < CANVAS_W + 80) {
          const v = VILLAINS.find(vl => vl.id === vs.villainId);
          if (vs.defeated) {
            // Defeated — grey, idle, no glow
            ctx.globalAlpha = 0.5;
            drawStickman(ctx, sx, sy, v?.color || '#FF0000', -1, s.player.frame * 0.5, 1.2, v?.isSpirit, 'idle', v);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#888888';
            ctx.fillStyle = '#888888';
            ctx.font = '10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(`${v?.name || '?'} ✓`, sx, sy - 65);
          } else {
            const pulse = Math.sin(now * 0.004) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            const vState = vs.roamActive ? 'moving' : 'idle';
            drawStickman(ctx, sx, sy, v?.color || '#FF0000', vs.roamDir || -1, vs.frame || s.player.frame, 1.3, v?.isSpirit, vState, v);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#FF4444';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 8;
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(v?.name || '?', sx, sy - 65);
            ctx.fillText('⚔', sx, sy - 78);
            ctx.shadowBlur = 0;
          }
        }
      });

      // Direction arrow to nearest villain
      // Night villains — render with unique designs
      (s.nightVillains || []).forEach(nv => {
        const nvsx = nv.wx - s.camera.x + CANVAS_W / 2;
        const nvsy = nv.wy - s.camera.y + CANVAS_H / 2;
        if (nvsx > -80 && nvsx < CANVAS_W + 80) renderNightVillain(ctx, nv, nvsx, nvsy, nv.frame || s.player.frame);
      });
      if (s.screenDarken > 0) { ctx.fillStyle = `rgba(0,0,10,${Math.min(s.screenDarken / 300, 0.55)})`; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); }

      const nearestVillain = s.villainSpawns.find(vs => !vs.defeated);
      if (nearestVillain) {
        const dvx = nearestVillain.wx - s.player.wx;
        const dvy = nearestVillain.wy - s.player.wy;
        const dist = Math.sqrt(dvx * dvx + dvy * dvy);
        if (dist > BLOCK_SIZE * 6) {
          const angle = Math.atan2(dvy, dvx);
          const ax = CANVAS_W / 2 + Math.cos(angle) * 90;
          const ay = CANVAS_H / 2 + Math.sin(angle) * 60;
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(angle);
          ctx.fillStyle = '#FF4444';
          ctx.shadowColor = '#FF0000';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(12, 0);
          ctx.lineTo(-8, -7);
          ctx.lineTo(-8, 7);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      }

      // Player
      const hero = HEROES.find(h => h.id === s.currentHeroId) || HEROES[0];
      const psx = s.player.wx - s.camera.x + CANVAS_W / 2;
      const psy = s.player.wy - s.camera.y + CANVAS_H / 2;
      const playerState = s.player.crouching ? 'crouching' : s.player.vy < -1 ? 'jumping' : Math.abs(s.player.vx) > 0.5 ? 'moving' : 'idle';
      const playerRenderColor = getCharRenderColor(hero?.id, equippedSkins) || hero?.color || '#FFD700';
      drawStickman(ctx, psx, psy, playerRenderColor, s.player.facing, s.player.frame, 1.1, false, playerState, hero);
      // Render skin's custom parts + equipped accessory on player in story mode
      const playerSkinParts = getSkinParts(hero?.id, equippedSkins);
      playerSkinParts.forEach(p => drawAccessory(ctx, psx, psy, p.type, p.color, s.player.frame, 1.1, hero?.id));
      const acc = getAccessory(equippedAccessories[hero?.id]);
      if (acc) {
        const skinColor = getCharRenderColor(hero?.id, equippedSkins);
        const accColor = skinColor && acc.type === 'soccer_kit' ? skinColor : acc.color;
        drawAccessory(ctx, psx, psy, acc.type, accColor, s.player.frame, 1.1, hero?.id);
      }

      // Mining cursor highlight
      const msx = mouseRef.current.x;
      const msy = mouseRef.current.y;
      const mbx = Math.floor((msx + s.camera.x - CANVAS_W / 2) / BLOCK_SIZE);
      const mby = Math.floor((msy + s.camera.y - CANVAS_H / 2) / BLOCK_SIZE);
      const playerBX = Math.floor(s.player.wx / BLOCK_SIZE);
      const playerBY = Math.floor(s.player.wy / BLOCK_SIZE);
      const cursorHero = HEROES.find(h => h.id === s.currentHeroId);
      const cursorUtil = cursorHero?.stats?.utility || 5;
      const cursorMineRange = MINE_RADIUS_BLOCKS + Math.max(0, Math.floor((cursorUtil - 3) * 0.5));
      const inRange = Math.abs(mbx - playerBX) <= cursorMineRange && Math.abs(mby - playerBY) <= cursorMineRange;
      if (inRange && s.world.getBlock(mbx, mby) !== BLOCKS.AIR) {
        const scrX = mbx * BLOCK_SIZE - s.camera.x + CANVAS_W / 2;
        const scrY = mby * BLOCK_SIZE - s.camera.y + CANVAS_H / 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(scrX + 1, scrY + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        ctx.setLineDash([]);
        // Break progress
        const bp = s.world.getBreakProgress(mbx, mby);
        if (bp > 0) {
          ctx.fillStyle = '#111';
          ctx.fillRect(scrX, scrY + BLOCK_SIZE + 2, BLOCK_SIZE, 4);
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(scrX, scrY + BLOCK_SIZE + 2, BLOCK_SIZE * bp, 4);
        }
      }

      // Particles (cap for performance)
      if (s.particleEffects.length > 120) s.particleEffects = s.particleEffects.slice(-120);
      s.particleEffects = s.particleEffects.filter(pe => {
        pe.life--;
        if (pe.life <= 0) return false;
        const t = 1 - pe.life / pe.maxLife;
        const sx2 = pe.x - s.camera.x + CANVAS_W / 2;
        const sy2 = pe.y - s.camera.y + CANVAS_H / 2;
        if (pe.isPuff) {
          // Cloud puff — expands and fades
          ctx.globalAlpha = (1 - t) * 0.5;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.ellipse(sx2, sy2, pe.r + t * pe.r, pe.r * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = 1 - t;
          ctx.fillStyle = pe.color;
          ctx.shadowColor = pe.color;
          ctx.shadowBlur = pe.isPuff ? 0 : 6;
          ctx.beginPath();
          ctx.arc(sx2, sy2, pe.r * (1 - t * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
        pe.x += pe.vx; pe.y += pe.vy; pe.vy += pe.isPuff ? 0.1 : 0.2;
        return true;
      });

      // HUD
      drawHUD(ctx, s, hero, Math.round(s.playerHp ?? health), s.hotbar, s.hotbarSlot);

      // Flash block name above hotbar when switching slots
      if (flashRef.current) {
        const elapsed = performance.now() - flashRef.current.time;
        if (elapsed < 1500) {
          const alpha = Math.max(0, 1 - elapsed / 1500);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#FFD700';
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 8;
          ctx.font = 'bold 14px Orbitron, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(flashRef.current.name, CANVAS_W / 2, CANVAS_H - 56);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        } else {
          flashRef.current = null;
        }
      }

      // Minimap
      if (showMinimap) drawMinimap(ctx, s, CANVAS_W, CANVAS_H);

      // "Press F to talk" prompt
      if (s.nearbyVillain || s.nearbyNpc) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.beginPath(); ctx.roundRect(CANVAS_W / 2 - 90, CANVAS_H - 130, 180, 28, 6); ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('Press R to talk', CANVAS_W / 2, CANVAS_H - 112);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const updatePlayer = (s, dt) => {
    const k = keysRef.current;
    const p = s.player;
    const world = s.world;
    p.frame++;

    // Horizontal movement
    const inAir = !p.grounded;
    if (k['ArrowLeft'] || k['a']) {
      p.vx = -MOVE_SPEED;
      p.facing = -1;
    } else if (k['ArrowRight'] || k['d']) {
      p.vx = MOVE_SPEED;
      p.facing = 1;
    } else {
      p.vx *= p.grounded ? 0.65 : 0.88;
    }

    // Crouching — slower + edge stop
    if (p.crouching && p.grounded) {
      p.vx *= 0.5;
      const edgeCol = p.facing >= 0
        ? Math.floor((p.wx + PLAYER_W * 0.4 + 2) / BLOCK_SIZE)
        : Math.floor((p.wx - PLAYER_W * 0.4 - 2) / BLOCK_SIZE);
      const edgeRow = Math.floor((p.wy + 2) / BLOCK_SIZE);
      if (!isSolid(world, edgeCol, edgeRow)) p.vx = 0;
    }

    // Jump
    if ((k['ArrowUp'] || k['w'] || k[' ']) && !k['_jumpHeld']) {
      if (p.grounded) {
        p.vy = JUMP_VEL;
        p.grounded = false;
        p.doubleJump = 1;
        k['_jumpHeld'] = true;
        // Ground puff particles
        const hero = HEROES.find(h => h.id === s.currentHeroId) || HEROES[0];
        for (let i = 0; i < 7; i++) {
          s.particleEffects.push({
            x: p.wx + (Math.random() - 0.5) * 20,
            y: p.wy,
            vx: (Math.random() - 0.5) * 2.5,
            vy: Math.random() * 1.2 + 0.2,
            r: 5 + Math.random() * 5,
            color: '#FFFFFF',
            life: 10 + Math.floor(Math.random() * 8),
            maxLife: 18,
            isPuff: true,
          });
        }
      } else if (p.doubleJump > 0) {
        p.vy = JUMP_VEL * 0.85;
        p.doubleJump--;
        k['_jumpHeld'] = true;
        // Double jump colored sparks
        const hero = HEROES.find(h => h.id === s.currentHeroId) || HEROES[0];
        for (let i = 0; i < 10; i++) {
          const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.6;
          s.particleEffects.push({
            x: p.wx,
            y: p.wy,
            vx: Math.cos(angle) * (Math.random() * 3 + 0.5),
            vy: Math.sin(angle) * (Math.random() * 2 + 0.5),
            r: 3 + Math.random() * 3,
            color: hero.color,
            life: 14 + Math.floor(Math.random() * 8),
            maxLife: 22,
            isPuff: false,
          });
        }
      }
    }
    if (!k['ArrowUp'] && !k['w'] && !k[' ']) k['_jumpHeld'] = false;

    // Gravity
    if (!p.grounded) {
      p.vy += GRAVITY;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    }

    // X collision
    const newX = p.wx + p.vx;
    const footY = Math.floor((p.wy - 2) / BLOCK_SIZE);
    const midY = Math.floor((p.wy - BLOCK_SIZE) / BLOCK_SIZE);
    const headY2 = Math.floor((p.wy - PLAYER_H + 2) / BLOCK_SIZE);
    const checkCol = p.vx >= 0
      ? Math.floor((newX + PLAYER_W * 0.38) / BLOCK_SIZE)
      : Math.floor((newX - PLAYER_W * 0.38) / BLOCK_SIZE);

    if (!isSolid(world, checkCol, footY) && !isSolid(world, checkCol, midY) && !isSolid(world, checkCol, headY2)) {
      p.wx = newX;
    } else if (p.grounded && !isSolid(world, checkCol, footY - 1) && !isSolid(world, checkCol, midY - 1) && !isSolid(world, checkCol, headY2 - 1)) {
      // Auto-step up 1 block (walk up single blocks)
      p.wx = newX;
      p.wy = (footY - 1) * BLOCK_SIZE;
    } else {
      p.vx = 0;
    }

    // Y collision
    const newY = p.wy + p.vy;
    const bxL = Math.floor((p.wx - PLAYER_W * 0.32) / BLOCK_SIZE);
    const bxR = Math.floor((p.wx + PLAYER_W * 0.32) / BLOCK_SIZE);
    p.grounded = false;

    if (p.vy >= 0) {
      // Falling down — check block at feet (feet = p.wy, which is bottom of player)
      const feetBlock = Math.floor(newY / BLOCK_SIZE);
      if (isSolid(world, bxL, feetBlock) || isSolid(world, bxR, feetBlock)) {
        p.wy = feetBlock * BLOCK_SIZE; // land on top of the block
        p.vy = 0;
        p.grounded = true;
        p.doubleJump = 1;
      } else {
        p.wy = newY;
      }
    } else {
      // Moving up — check block at head
      const headBlock = Math.floor((newY - PLAYER_H) / BLOCK_SIZE);
      if (isSolid(world, bxL, headBlock) || isSolid(world, bxR, headBlock)) {
        p.vy = 0;
        p.wy = (headBlock + 1) * BLOCK_SIZE + PLAYER_H;
      } else {
        p.wy = newY;
      }
    }

    // Mining — cursor-based with radius (left click OR C key)
    if (mouseRef.current.held || k['c']) {
      doMiningAtCursor(s, p, world);
    } else {
      p.breakTarget = null;
    }

    // Place block — E key
    if (k['e'] && !k['_eHeld']) {
      k['_eHeld'] = true;
      doPlacing();
    }
    if (!k['e']) k['_eHeld'] = false;

    // Ladder climbing — when on a ladder, move up/down, no gravity
    const pCol = Math.floor(p.wx / BLOCK_SIZE);
    const pFeetRow = Math.floor((p.wy + 4) / BLOCK_SIZE);
    const pMidRow = Math.floor((p.wy - BLOCK_SIZE) / BLOCK_SIZE);
    if (world.getBlock(pCol, pFeetRow) === BLOCKS.LADDER || world.getBlock(pCol, pMidRow) === BLOCKS.LADDER) {
      if (k['ArrowUp'] || k['w'] || k[' ']) { p.vy = -3.5; p.grounded = true; p.doubleJump = 1; }
      else if (k['ArrowDown'] || k['s']) { p.vy = 3.5; }
      else if (!p.grounded) { p.vy = 0; }
      p.grounded = true;
    }

    // Story mode attacks (comma/side, period/up, slash/down, L/heavy, x/side, v/up)
    if (k['_atkSig'] || k['_atkPower'] || k['_atkSuper'] || k['_atkHeavy']) {
      const atkType = k['_atkHeavy'] ? 'heavy' : k['_atkSuper'] ? 'super' : k['_atkPower'] ? 'power' : 'sig';
      const hero = HEROES.find(h => h.id === s.currentHeroId) || HEROES[0];
      storyAttack(s, atkType, hero);
      k['_atkSig'] = false; k['_atkPower'] = false; k['_atkSuper'] = false; k['_atkHeavy'] = false;
    }

    // Void respawn — fall below world = respawn 8 blocks in front of last defeated villain
    if (p.wy > WORLD_HEIGHT * BLOCK_SIZE + 100) {
      const defeated = s.villainSpawns.filter(v => v.defeated);
      const lastDefeated = defeated[defeated.length - 1];
      if (lastDefeated) {
        p.wx = lastDefeated.wx + BLOCK_SIZE * 8;
      } else {
        p.wx = 20 * BLOCK_SIZE + BLOCK_SIZE / 2;
      }
      const tY = s.world.getTerrainHeight(Math.floor(p.wx / BLOCK_SIZE));
      p.wy = tY * BLOCK_SIZE - PLAYER_H;
      p.vx = 0; p.vy = 0;
      showMsg('You fell into the void! Respawning...');
    }
  };

  const doMiningAtCursor = (s, p, world) => {
    const msx = mouseRef.current.x;
    const msy = mouseRef.current.y;
    const bx = Math.floor((msx + s.camera.x - CANVAS_W / 2) / BLOCK_SIZE);
    const by = Math.floor((msy + s.camera.y - CANVAS_H / 2) / BLOCK_SIZE);
    const playerBX = Math.floor(p.wx / BLOCK_SIZE);
    const playerBY = Math.floor(p.wy / BLOCK_SIZE);
    const dx = Math.abs(bx - playerBX);
    const dy = Math.abs(by - playerBY);
    const mineHero = HEROES.find(h => h.id === s.currentHeroId);
    const utilStat = mineHero?.stats?.utility || 5;
    const mineRange = MINE_RADIUS_BLOCKS + Math.max(0, Math.floor((utilStat - 3) * 0.5));
    if (dx > mineRange || dy > mineRange) {
      p.breakTarget = null;
      return;
    }
    if (world.getBlock(bx, by) === BLOCKS.AIR) {
      p.breakTarget = null;
      return;
    }
    world.startBreaking(bx, by);
    const result = world.continueBreaking(bx, by);
    const prog = world.getBreakProgress(bx, by);
    p.breakTarget = { bx, by, prog: result ? 1 : prog };

    if (result) {
      p.breakTarget = null;
      const col = BLOCK_COLORS[result] || '#888';
      for (let i = 0; i < 8; i++) {
        s.particleEffects.push({
          x: bx * BLOCK_SIZE + BLOCK_SIZE / 2,
          y: by * BLOCK_SIZE + BLOCK_SIZE / 2,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 4 - 1,
          r: 3 + Math.random() * 3,
          color: col,
          life: 22 + Math.floor(Math.random() * 12),
          maxLife: 34,
        });
      }
      // Bed breaking — break both halves, only return 1 bed
      if (result === BLOCKS.BED) {
        if (world.getBlock(bx + 1, by) === BLOCKS.BED) world.setBlock(bx + 1, by, BLOCKS.AIR);
        if (world.getBlock(bx - 1, by) === BLOCKS.BED) world.setBlock(bx - 1, by, BLOCKS.AIR);
      }
      setInventory(prev => { const next={...prev,[result]:(prev[result]||0)+1}; const drop=BLOCK_DROP_ITEMS[result]; if(drop) next[drop]=(next[drop]||0)+1; return next; });
    }
  };

  const handleRiftCutsceneComplete = () => {
    setRiftCutscene(false);
    setRiftBattle('final');
    setBattleStartTime(performance.now());
    if (stateRef.current) stateRef.current.running = false;
    music.stop();
  };

  const handleRiftBattleEnd = (won) => {
    if (won && riftBattle === 'guardians') {
      // Won 3v1 <GameIcon emoji="→" size={14} /> show cutscene sequence before 4v2 final showdown
      setRiftBattle(null);
      setRiftCutscene(true);
      if (stateRef.current) { stateRef.current.running = true; startLoop(); }
      music.setVolume(progress?.settings?.musicVolume ?? 50);
      music.play('story');
      return;
    }
    if (won && riftBattle === 'final') {
      // Won 4v2 <GameIcon emoji="→" size={14} /> Evil defeated, unlock rewards (one-time only)
      onUnlockAll?.();
      showMsg('You defeated Evil! Check the top corner for your rewards!');
      setRiftBattle(null);
      setRiftAvailable(false);
    } else {
      setRiftBattle(null);
      showMsg('Defeated... Try again!');
    }
    if (stateRef.current) { stateRef.current.running = true; startLoop(); }
    music.setVolume(progress?.settings?.musicVolume ?? 50);
    music.play('story');
  };

  const handleBattleEnd = (won) => {
    const vs = stateRef.current?.villainSpawns?.find(v => v.villainId === battleVillain);
    setBattleVillain(null);
    if (won) {
      if (vs) vs.defeated = true;
      // If Evil is defeated, unlock everything
      if (battleVillain === 'evil') {
        onUnlockVillain?.(battleVillain);
        onUnlockAll?.();
        showMsg('You defeated Evil! Check the top corner for your rewards!');
        setRiftActive(false);
        setRiftAvailable(false);
      } else if (battleVillain === 'controller') {
        onUnlockVillain?.(battleVillain);
        // After defeating Controller, open the rift
        onAddCoins?.(50);
        showMsg('The Controller is defeated! A rift opens... +50◆');
        setRiftActive(true);
        setRiftAvailable(true);
      } else {
        // 50% chance: unlock the villain OR unlock next hero in sequence
        const heroIds = HEROES.map(h => h.id);
        const unlockedHeroes = (progress?.unlockedIds || []).filter(id => heroIds.includes(id));
        const nextIdx = unlockedHeroes.length;
        const vName = VILLAINS.find(v => v.id === battleVillain)?.name || 'Villain';
        if (Math.random() < 0.5 && nextIdx < heroIds.length) {
          const newHeroId = heroIds[nextIdx];
          onUnlockHero?.(newHeroId);
          setCurrentHeroId(newHeroId);
          if (stateRef.current) stateRef.current.currentHeroId = newHeroId;
          const hName = HEROES.find(h => h.id === newHeroId)?.name || 'Hero';
          onAddCoins?.(15);
          showMsg(`Victory! ${hName} unlocked! +15◆`);
        } else {
          onUnlockVillain?.(battleVillain);
          onAddCoins?.(15);
          showMsg(`Victory! ${vName} unlocked! +15◆`);
        }
      }
      // ── Quest completion on villain defeat ──
      setQuests(prev => prev.map(q => {
        if (q.done) return q;
        const t = q.trigger;
        if (!t) return q;
        if (t.type === 'defeat' && t.villainId === battleVillain) return { ...q, done: true };
        if (t.type === 'defeatAs' && t.heroId === currentHeroId && (!t.villainId || t.villainId === battleVillain)) return { ...q, done: true };
        if (t.type === 'defeatMulti' && t.villainIds?.includes(battleVillain)) {
          // complete only when all villains in the list are defeated
          const allDefeated = t.villainIds.every(vid =>
            stateRef.current?.villainSpawns?.find(v => v.villainId === vid)?.defeated);
          if (allDefeated) return { ...q, done: true };
        }
        if (t.type === 'special' && t.key === 'yellow_fast' && currentHeroId === 'yellow') {
          const elapsed = (performance.now() - battleStartTime) / 1000;
          if (elapsed < 60) return { ...q, done: true };
        }
        if (t.type === 'special' && t.key === 'silver_no_stock_loss' && currentHeroId === 'silver') {
          return { ...q, done: true };
        }
        if (t.type === 'special' && t.key === 'amber_power' && currentHeroId === 'amber') {
          return { ...q, done: true };
        }
        return q;
      }));
      // Save progress after battle
      if (stateRef.current) {
        onSaveProgress?.({
          playerX: stateRef.current.player.wx,
          playerY: stateRef.current.player.wy,
          defeatedVillains: stateRef.current.villainSpawns.filter(v => v.defeated).map(v => v.villainId),
          inventory: stateRef.current.inventory,
          hotbar: stateRef.current.hotbar,
          currentHeroId: stateRef.current.currentHeroId,
        });
      }
    } else {
      setHealth(prev => Math.max(prev - 20, 0));
      showMsg('Defeated... Try again!');
    }
    // Teleport relative to villain: win = 8 blocks forward, lose = 8 blocks back
    if (vs && stateRef.current) {
      const dir = won ? 1 : -1;
      stateRef.current.player.wx = vs.wx + dir * BLOCK_SIZE * 8;
      const tY = stateRef.current.world.getTerrainHeight(Math.floor(stateRef.current.player.wx / BLOCK_SIZE));
      stateRef.current.player.wy = tY * BLOCK_SIZE - PLAYER_H;
      stateRef.current.player.vx = 0;
      stateRef.current.player.vy = 0;
    }
    if (stateRef.current) { stateRef.current.running = true; startLoop(); }
    music.setVolume(progress?.settings?.musicVolume ?? 50);
    music.play('story');
  };

  const handleCraft = (recipe) => {
    setInventory(prev => craftItem(recipe, prev));
  };

  if (riftBattle) {
    const isGuardians = riftBattle === 'guardians';
    return (
      <StoryBattle
        heroId={currentHeroId}
        enemyIds={isGuardians ? ['life', 'death', 'mercy'] : ['evil', 'controller']}
        allyIds={isGuardians ? null : ['life', 'death', 'mercy']}
        stageId="voidplane"
        difficulty="hard"
        battleTitle={isGuardians ? '⚔ 3v1 — THE GUARDIAN TRIAL' : '⚔ 4v2 — THE FINAL SHOWDOWN'}
        onEnd={handleRiftBattleEnd}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
        equippedShikigami={equippedShikigami}
        equippedEmotes={equippedEmotes}
      />
    );
  }

  if (battleVillain) {
    return (
      <StoryBattle
        heroId={currentHeroId}
        villainId={battleVillain}
        onEnd={handleBattleEnd}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
        equippedShikigami={equippedShikigami}
        equippedEmotes={equippedEmotes}
      />
    );
  }

  const selectedBlock = hotbar[hotbarSlot];

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="flex gap-2 items-center mb-1 flex-wrap justify-center">
        <button onClick={() => {
          if (stateRef.current) {
            const s = stateRef.current;
            onSaveProgress?.({
              playerX: s.player.wx,
              playerY: s.player.wy,
              defeatedVillains: s.villainSpawns.filter(v => v.defeated).map(v => v.villainId),
            });
          } else {
            onSaveProgress?.();
          }
          onBack();
        }} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> Menu</button>
        <select
          value={currentHeroId}
          onChange={e => setCurrentHeroId(e.target.value)}
          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm font-body"
        >
          {HEROES.slice().sort((a, b) => (a.id === (progress?.favoriteId) ? -1 : b.id === (progress?.favoriteId) ? 1 : 0)).map((h) => (
            <option key={h.id} value={h.id} disabled={!unlockedIds.includes(h.id)}>
              {unlockedIds.includes(h.id) ? `${h.id === progress?.favoriteId ? '★ ' : ''}${h.name} — ${h.title}` : `🔒 ${h.name}`}
            </option>
          ))}
        </select>
        <button onClick={() => setShowQuests(v => !v)} className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-body hover:opacity-80">
          <GameIcon emoji="📋" size={14} /> Quests
        </button>
        <span className="text-[10px] text-muted-foreground font-body">Click/C=break • Right-click/E=place/use • Tab=inv+craft • Q=quests • R=talk • Z=crouch • 1-9=hotbar • ,/.///x/v/f/l=attack</span>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="border-2 border-border rounded-lg shadow-2xl cursor-crosshair"
          style={{ maxWidth: '100%' }}
        />

        {msg && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-2 rounded-lg font-heading text-sm shadow-lg z-10">
            {msg}
          </div>
        )}

        {/* Quest log overlay */}
        {showQuests && (
          <div className="absolute top-10 right-4 bg-card/95 border border-border rounded-xl p-4 w-64 z-20 shadow-2xl">
            <h3 className="font-heading text-sm text-accent mb-2">QUEST LOG ({quests.filter(q=>q.done).length}/{quests.length})</h3>
            <div className="max-h-80 overflow-y-auto pr-1">
              {quests.map(q => (
                <div key={q.id} className={`mb-2 p-2 rounded-lg border ${q.done ? 'border-green-600 opacity-60' : 'border-border'}`}>
                  <p className={`font-heading text-xs ${q.done ? 'text-green-400 line-through' : 'text-foreground'}`}>{q.title}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{q.desc}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowQuests(false)} className="text-[9px] text-muted-foreground hover:text-foreground mt-1">Close</button>
          </div>
        )}

        {/* Combined Inventory + Crafting overlay (Tab) — side by side */}
        {(showInventory || showCrafting) && (
          <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center z-20">
            <div className="flex gap-3 items-start bg-card border border-border rounded-xl p-4 max-w-[700px]">
              {/* Crafting panel (left) */}
              {showCrafting && (
                <div className="w-72">
                  <h3 className="font-heading text-sm text-accent mb-3">CRAFTING</h3>
                  <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto">
                    {RECIPES.map((r, i) => {
                      const craftable = canCraft(r, inventory);
                      return (
                        <button key={i} onClick={() => craftable && handleCraft(r)} disabled={!craftable}
                          className={`text-left p-2 rounded border ${craftable ? 'border-accent hover:bg-accent/10' : 'border-border opacity-50 cursor-not-allowed'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: BLOCK_COLORS[r.output.block] || '#888' }} />
                            <div className="min-w-0">
                              <p className="font-heading text-xs text-foreground truncate">{r.output.name}</p>
                              <p className="text-[9px] text-muted-foreground">{r.ingredients.map(ing => `${ing.count}x ${BLOCK_NAMES[ing.block] || 'Item'}`).join(' + ')}</p>
                            </div>
                            <span className="text-[9px] text-accent ml-auto flex-shrink-0"><GameIcon emoji="→" size={14} />{r.output.count}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inventory panel (right) — drag items to hotbar */}
              {showInventory && (
                <div className="w-80">
                  <h3 className="font-heading text-sm text-accent mb-3">INVENTORY — Drag to hotbar</h3>
                  <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                    {Object.entries(inventory).filter(([, v]) => v > 0).map(([blockId, count]) => {
                      const col = BLOCK_COLORS[blockId];
                      const bid = parseInt(blockId);
                      return (
                        <div key={blockId} draggable
                          onDragStart={(e) => { e.dataTransfer.setData('blockId', blockId); e.dataTransfer.effectAllowed = 'move'; }}
                          onClick={() => {
                            setHotbar(prev => {
                              if (prev[hotbarSlot] === bid) {
                                const next = [...prev]; next[hotbarSlot] = null; return next;
                              }
                              const next = [...prev];
                              for (let i = 0; i < next.length; i++) { if (next[i] === bid && i !== hotbarSlot) next[i] = null; }
                              next[hotbarSlot] = bid;
                              return next;
                            });
                            flashRef.current = { name: BLOCK_NAMES[bid] || 'Block', time: performance.now() };
                          }}
                          className="flex flex-col items-center p-1 rounded border border-border hover:border-accent hover:bg-accent/10 transition cursor-grab active:cursor-grabbing">
                          <div className="w-7 h-7 rounded" style={{ backgroundColor: col || '#555' }} />
                          <span className="text-[8px] text-foreground mt-0.5 leading-tight">{BLOCK_NAMES[bid]}</span>
                          <span className="text-[8px] text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                    {Object.entries(inventory).filter(([, v]) => v > 0).length === 0 && <p className="text-muted-foreground text-xs col-span-6">Empty</p>}
                  </div>
                  {/* Drag-drop hotbar slots */}
                  <p className="text-[10px] font-heading text-muted-foreground mt-3 mb-1">HOTBAR (drag items here)</p>
                  <div className="flex gap-1">
                    {hotbar.map((slotItem, i) => (
                      <div key={i} onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const bid = parseInt(e.dataTransfer.getData('blockId'));
                          if (isNaN(bid)) return;
                          setHotbar(prev => {
                            const next = [...prev];
                            for (let j = 0; j < next.length; j++) { if (next[j] === bid && j !== i) next[j] = null; }
                            next[i] = bid;
                            return next;
                          });
                          flashRef.current = { name: BLOCK_NAMES[bid] || 'Block', time: performance.now() };
                        }}
                        onClick={() => setHotbarSlot(i)}
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center cursor-pointer transition ${i === hotbarSlot ? 'border-accent bg-accent/15' : 'border-dashed border-muted-foreground bg-muted/20 hover:border-accent'}`}>
                        {slotItem != null ? (
                          <div className="w-6 h-6 rounded pointer-events-none" style={{ backgroundColor: BLOCK_COLORS[slotItem] || '#888' }} />
                        ) : (
                          <span className="text-[9px] text-muted-foreground/60">{i + 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setShowInventory(false); setShowCrafting(false); }} className="mt-3 px-4 py-1 bg-secondary text-secondary-foreground rounded text-xs font-heading">Close (Tab)</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chest storage overlay */}
        {chestData && (
          <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center z-30">
            <div className="bg-card border border-border rounded-xl p-4 w-80">
              <h3 className="font-heading text-sm text-accent mb-3">CHEST</h3>
              <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto mb-3">
                {Object.entries(chestData.contents).filter(([, v]) => v > 0).map(([blockId, count]) => {
                  const bid = parseInt(blockId);
                  return (
                    <button key={blockId} onClick={() => {
                      setInventory(prev => ({ ...prev, [bid]: (prev[bid] || 0) + 1 }));
                      const s = stateRef.current;
                      if (s && s.chests[chestData.key]) {
                        s.chests[chestData.key][bid] = (s.chests[chestData.key][bid] || 0) - 1;
                        if (s.chests[chestData.key][bid] <= 0) delete s.chests[chestData.key][bid];
                        setChestData({ key: chestData.key, contents: { ...s.chests[chestData.key] } });
                      }
                    }} className="flex flex-col items-center p-1 rounded border border-border hover:border-accent hover:bg-accent/10 transition">
                      <div className="w-7 h-7 rounded" style={{ backgroundColor: BLOCK_COLORS[bid] || '#555' }} />
                      <span className="text-[8px] text-foreground mt-0.5 leading-tight">{BLOCK_NAMES[bid]}</span>
                      <span className="text-[8px] text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
                {Object.entries(chestData.contents).filter(([, v]) => v > 0).length === 0 && <p className="text-muted-foreground text-xs col-span-6">Empty</p>}
              </div>
              <p className="text-[10px] font-heading text-muted-foreground mb-1">YOUR INVENTORY (click to store)</p>
              <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto">
                {Object.entries(inventory).filter(([, v]) => v > 0).map(([blockId, count]) => {
                  const bid = parseInt(blockId);
                  return (
                    <button key={blockId} onClick={() => {
                      const s = stateRef.current;
                      if (s && s.chests[chestData.key]) {
                        s.chests[chestData.key][bid] = (s.chests[chestData.key][bid] || 0) + 1;
                        setChestData({ key: chestData.key, contents: { ...s.chests[chestData.key] } });
                      }
                      setInventory(prev => ({ ...prev, [bid]: Math.max(0, (prev[bid] || 0) - 1) }));
                    }} className="flex flex-col items-center p-1 rounded border border-border hover:border-accent hover:bg-accent/10 transition">
                      <div className="w-7 h-7 rounded" style={{ backgroundColor: BLOCK_COLORS[bid] || '#555' }} />
                      <span className="text-[8px] text-foreground mt-0.5 leading-tight">{BLOCK_NAMES[bid]}</span>
                      <span className="text-[8px] text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setChestData(null)} className="mt-3 px-4 py-1 bg-secondary text-secondary-foreground rounded text-xs font-heading">Close</button>
            </div>
          </div>
        )}

        {/* Dialogue overlay */}
        {dialogue && (
          <div className="absolute inset-0 bg-black/75 rounded-lg flex items-center justify-center z-30">
            <div className="bg-card border-2 rounded-xl p-6 w-96" style={{ borderColor: dialogue.type === 'villain' ? '#FF4444' : '#4488FF' }}>
              <h3 className="font-heading text-lg mb-3" style={{ color: dialogue.type === 'villain' ? '#FF4444' : '#4488FF' }}>{dialogue.name}</h3>
              <p className="font-body text-sm text-foreground mb-4 min-h-[3em]">{dialogue.text}</p>
              <div className="flex gap-2 justify-end">
                {dialogue.options.map((opt, i) => (
                  <button key={i} onClick={() => handleDialogueAction(opt.action)}
                    className={`px-4 py-2 rounded font-heading text-xs ${opt.action === 'fight' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'} hover:opacity-80`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Villain cutscene before battle */}
        {cutsceneVillain && (
          <VillainCutscene villainId={cutsceneVillain} onContinue={handleCutsceneContinue} onSkip={handleCutsceneContinue} />
        )}

        {/* Rift re-entry button — shown when rift is available but overlay is closed */}
        {riftAvailable && !riftActive && !battleVillain && !cutsceneVillain && (
          <button
            onClick={() => setRiftActive(true)}
            className="absolute top-2 right-2 z-20 px-4 py-2 bg-purple-600 text-white rounded-lg font-heading text-xs hover:opacity-80 shadow-lg"
            style={{ boxShadow: '0 0 15px rgba(150,50,200,0.4)' }}
          >
            <GameIcon emoji="⚡" size={14} /> ENTER THE RIFT
          </button>
        )}

        {/* Rift overlay — after defeating Controller */}
        {riftActive && (
          <div className="absolute inset-0 bg-black/85 rounded-lg flex items-center justify-center z-40">
            <div className="bg-card border-2 border-purple-500 rounded-xl p-6 w-96 text-center" style={{ boxShadow: '0 0 40px rgba(150,50,200,0.5)' }}>
              <h3 className="font-heading text-xl text-purple-400 mb-3"><GameIcon emoji="⚡" size={14} /> THE RIFT <GameIcon emoji="⚡" size={14} /></h3>
              <p className="font-body text-sm text-foreground mb-4">The Controller's defeat has torn open a rift to the cosmic realm. Three guardians — Life, Death, and Mercy — await to test your worth.</p>
              <div className="flex justify-center gap-3 mb-4">
                {['life', 'death', 'mercy'].map(gid => {
                  const g = GUARDIANS.find(g => g.id === gid);
                  return (
                    <div key={gid} className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: g?.color, boxShadow: `0 0 12px ${g?.color}` }} />
                      <span className="text-[9px] font-heading text-foreground mt-1">{g?.name}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground font-body mb-4">Defeat all three guardians in a 3v1 battle, then the guardians join you for a 4v2 final showdown against Evil and the Controller!</p>
              <button
                onClick={() => {
                  // Start the 3v1 guardian battle
                  setRiftBattle('guardians');
                  setRiftActive(false);
                  setBattleStartTime(performance.now());
                  if (stateRef.current) stateRef.current.running = false;
                  music.stop();
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-heading text-sm hover:opacity-80 mb-2 w-full"
                style={{ boxShadow: '0 0 20px rgba(150,50,200,0.4)' }}
              >
                <GameIcon emoji="⚔" size={14} /> ENTER THE RIFT — 3v1 GUARDIAN TRIAL
              </button>
              <button onClick={() => setRiftActive(false)} className="px-4 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80">Later</button>
            </div>
          </div>
        )}

        {/* Rift cutscene sequence — plays between 3v1 guardian trial and 4v2 final showdown */}
        {riftCutscene && (
          <RiftCutscene heroId={currentHeroId} onComplete={handleRiftCutsceneComplete} onSkip={handleRiftCutsceneComplete} />
        )}
      </div>
    </div>
  );
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function drawHUD(ctx, s, hero, health, hotbar, hotbarSlot) {
  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, 36);

  ctx.fillStyle = hero?.color || '#FFF';
  ctx.shadowColor = hero?.color || '#FFF';
  ctx.shadowBlur = 7;
  ctx.font = 'bold 12px Orbitron, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${hero?.name || 'Hero'} — ${hero?.title || ''}`, 10, 23);
  ctx.shadowBlur = 0;

  // HP bar
  const hpW = 120;
  ctx.fillStyle = '#111122';
  ctx.beginPath();
  ctx.roundRect(220, 10, hpW, 14, 4);
  ctx.fill();
  const hpColor = health > 60 ? '#44FF88' : health > 30 ? '#FFFF44' : '#FF4444';
  ctx.fillStyle = hpColor;
  ctx.beginPath();
  ctx.roundRect(220, 10, hpW * (health / 100), 14, 4);
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.font = '10px Rajdhani, sans-serif';
  ctx.fillText(`HP ${health}`, 226, 22);

  // Day indicator
  const timeStr = s.dayProgress < 0.25 ? '☀ Morning' : s.dayProgress < 0.5 ? '☀ Day' : s.dayProgress < 0.75 ? '🌅 Sunset' : '🌙 Night';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '10px Rajdhani, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(timeStr, CANVAS_W / 2, 23);

  // Hotbar
  const hbSlotSize = 36;
  const hbW = 9 * hbSlotSize + 8;
  const hbX = (CANVAS_W - hbW) / 2;
  const hbY = CANVAS_H - hbSlotSize - 8;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.beginPath();
  ctx.roundRect(hbX - 4, hbY - 4, hbW + 8, hbSlotSize + 8, 8);
  ctx.fill();

  for (let i = 0; i < 9; i++) {
    const sx = hbX + i * hbSlotSize;
    const blockType = hotbar[i];
    const isSelected = i === hotbarSlot;

    // Slot background — yellow highlight for selected slot
    ctx.fillStyle = isSelected ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(sx, hbY, hbSlotSize - 2, hbSlotSize - 2, 4);
    ctx.fill();

    // Border — thicker yellow border for selected slot
    ctx.strokeStyle = isSelected ? '#FFD700' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.beginPath();
    ctx.roundRect(sx, hbY, hbSlotSize - 2, hbSlotSize - 2, 4);
    ctx.stroke();

    // Item icon — only show if slot has an item
    if (blockType) {
      const col = BLOCK_COLORS[blockType] || '#888';
      // Draw a filled block icon
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(sx + 5, hbY + 5, hbSlotSize - 12, hbSlotSize - 12, 3);
      ctx.fill();
      // Inner highlight for 3D effect
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(sx + 5, hbY + 5, hbSlotSize - 12, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(sx + 5, hbY + hbSlotSize - 10, hbSlotSize - 12, 3);
    }

    // Slot number
    ctx.fillStyle = isSelected ? '#FFD700' : 'rgba(255,255,255,0.35)';
    ctx.font = isSelected ? 'bold 7px Orbitron' : '7px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(i + 1, sx + (hbSlotSize - 2) / 2, hbY + hbSlotSize - 3);
  }
}

// ── Minimap ───────────────────────────────────────────────────────────────────
function drawMinimap(ctx, s, canvasW, canvasH) {
  const mmW = 100, mmH = 60;
  const mmX = canvasW - mmW - 8, mmY = 40;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4, 5);
  ctx.fill();

  const scale = 2;
  const pWorldX = Math.floor(s.player.wx / BLOCK_SIZE);
  const pWorldY = Math.floor(s.player.wy / BLOCK_SIZE);

  for (let bx = pWorldX - mmW / scale / 2; bx < pWorldX + mmW / scale / 2; bx++) {
    for (let by = pWorldY - mmH / scale / 2; by < pWorldY + mmH / scale / 2; by++) {
      const block = s.world.getBlock(bx, by);
      if (block === BLOCKS.AIR) continue;
      const col = BLOCK_COLORS[block];
      if (!col) continue;
      const sx = mmX + (bx - (pWorldX - mmW / scale / 2)) * scale;
      const sy = mmY + (by - (pWorldY - mmH / scale / 2)) * scale;
      ctx.fillStyle = col;
      ctx.fillRect(sx, sy, scale, scale);
    }
  }

  // Player dot
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(mmX + mmW / 2, mmY + mmH / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Villain dots — defeated shown grey
  s.villainSpawns.forEach(vs => {
    const vWorldX = Math.floor(vs.wx / BLOCK_SIZE);
    const vWorldY = Math.floor(vs.wy / BLOCK_SIZE);
    let sx = mmX + (vWorldX - (pWorldX - mmW / scale / 2)) * scale;
    let sy = mmY + (vWorldY - (pWorldY - mmH / scale / 2)) * scale;
    sx = Math.max(mmX, Math.min(mmX + mmW, sx));
    sy = Math.max(mmY, Math.min(mmY + mmH, sy));
    ctx.fillStyle = vs.defeated ? '#666666' : '#FF4444';
    ctx.beginPath();
    ctx.arc(sx, sy, vs.defeated ? 1.5 : 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isSolid(world, bx, by) {
  const b = world.getBlock(bx, by);
  return b !== BLOCKS.AIR && b !== BLOCKS.WATER && b !== BLOCKS.LAVA && b !== BLOCKS.LADDER;
}

const NPC_NAMES = ['Alex', 'Sam', 'Jordan', 'Morgan', 'Riley', 'Casey', 'Avery', 'Drew', 'Blake', 'Quinn', 'Sage', 'River'];
const NPC_COLORS = ['#FFAA88', '#88CCFF', '#AAFFAA', '#FFFF88', '#FFAAFF', '#88FFFF', '#FFCC88', '#CCAAFF'];
const NPC_DIALOGUES = [
  'Have you seen any strange activity lately?',
  'Stay safe out there!',
  'The villains grow stronger each day...',
  'I heard there\'s a new hero in town!',
  'Element 6 will protect us.',
  'Watch your step near the forest!',
  'The Controller was spotted nearby...',
  'Train hard, fight harder.',
];

function buildNPCs(world, spawnX) {
  const npcs = [];
  for (let i = 0; i < 15; i++) {
    const nx = spawnX + (i + 1) * 35 + Math.floor(Math.random() * 20);
    const ny = world.getTerrainHeight(nx);
    npcs.push({
      wx: nx * BLOCK_SIZE,
      wy: ny * BLOCK_SIZE - BLOCK_SIZE * 2,
      homeX: nx * BLOCK_SIZE,
      color: NPC_COLORS[i % NPC_COLORS.length],
      name: NPC_NAMES[i % NPC_NAMES.length],
      dialogue: NPC_DIALOGUES[i % NPC_DIALOGUES.length],
      offset: Math.floor(Math.random() * 100),
      roamDir: 1, roamTimer: Math.floor(Math.random() * 120), roamActive: false,
    });
  }
  return npcs;
}

function buildVillainSpawns(world, spawnX) {
  const ordered = VILLAINS.filter(v => !v.isFinalBoss);
  return ordered.map((v, idx) => {
    const vx = spawnX + (idx + 1) * 900 + Math.floor(Math.random() * 120);
    const vy = world.getTerrainHeight(vx);
    return {
      villainId: v.id, wx: vx * BLOCK_SIZE, wy: vy * BLOCK_SIZE - BLOCK_SIZE * 2, defeated: false,
      homeX: vx * BLOCK_SIZE, roamDir: 1, roamTimer: Math.floor(Math.random() * 120), roamActive: false, vy: 0, grounded: true, frame: 0,
    };
  });
}