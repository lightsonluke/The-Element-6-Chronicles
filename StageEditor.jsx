import db from './cloudCommunity.js';

import React, { useState, useRef, useEffect } from 'react';

import { MATERIALS, drawMaterialOverlay } from './materials.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import WorldStages from './WorldStages.jsx';
import GameIcon from "./GameIcon.jsx";
import { HAZARD_TYPES, OBJECT_TYPES, makeHazard, makeObject } from './stageHazards.js';

const BACKDROPS = [
  { id: 'city', name: 'Split City', colors: ['#0a0820', '#1a1250'] },
  { id: 'forest', name: 'Forest', colors: ['#0a2010', '#1a4020'] },
  { id: 'void', name: 'Void', colors: ['#05010a', '#150030'] },
  { id: 'sunset', name: 'Sunset', colors: ['#1a0a30', '#FF6644'] },
  { id: 'ocean', name: 'Ocean', colors: ['#001030', '#004488'] },
  { id: 'volcano', name: 'Volcano', colors: ['#1a0500', '#FF3300'] },
  { id: 'space', name: 'Deep Space', colors: ['#000005', '#100020'] },
  { id: 'arctic', name: 'Arctic', colors: ['#0a0a30', '#4488CC'] },
  { id: 'desert', name: 'Desert', colors: ['#2a1a00', '#CCAA44'] },
  { id: 'jungle', name: 'Jungle', colors: ['#0a2000', '#226622'] },
  { id: 'sky', name: 'Sky Temple', colors: ['#001122', '#4488FF'] },
  { id: 'underworld', name: 'Underworld', colors: ['#0a0005', '#440022'] },
  { id: 'neon', name: 'Neon City', colors: ['#0a0020', '#FF00AA'] },
  { id: 'ruins', name: 'Ancient Ruins', colors: ['#1a1000', '#443322'] },
  { id: 'crystal', name: 'Crystal Cave', colors: ['#0a0a20', '#AA44FF'] },
  { id: 'storm', name: 'Storm', colors: ['#050510', '#334466'] },
  { id: 'dawn', name: 'Dawn', colors: ['#1a1040', '#FFAA88'] },
  { id: 'midnight', name: 'Midnight', colors: ['#000010', '#000033'] },
  { id: 'aurora', name: 'Aurora', colors: ['#000510', '#44FF88'] },
  { id: 'ember', name: 'Ember', colors: ['#100000', '#FF6600'] },
];

// Editor canvas covers the full KO perimeter of an actual match.
// A normal (non-large) stage's blast zone extends 500px left/right and
// 600px up / 450px down beyond the 1280×720 play area, so the editor canvas
// spans that exact region. Game (0,0) sits at editor (ORIGIN_X, ORIGIN_Y),
// and all platform/hazard/object/spawn state is stored in game coords.
const PLAY_W = 1280;
const PLAY_H = 720;
const ORIGIN_X = 500;
const ORIGIN_Y = 600;
const CANVAS_W = ORIGIN_X + PLAY_W + 500;   // 2280
const CANVAS_H = ORIGIN_Y + PLAY_H + 450;   // 1770

export default function StageEditor({ onSave, onBack, onDeleteStage, savedStages = [], existing = [], existingMeta = null }) {
  const canvasRef = useRef(null);
  const [platforms, setPlatforms] = useState([
    { x: 40, y: 600, w: 1200, h: 40, material: 'normal' },
    { x: 120, y: 440, w: 320, h: 18, material: 'normal' },
    { x: 840, y: 440, w: 320, h: 18, material: 'normal' },
    { x: 480, y: 300, w: 320, h: 18, material: 'normal' },
  ]);
  const [mode, setMode] = useState('add');
  const [material, setMaterial] = useState('normal');
  const [drag, setDrag] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [stageName, setStageName] = useState('');
  const [stageEmoji, setStageEmoji] = useState('🎨');
  const [backdrop, setBackdrop] = useState('city');
  const [showGrid, setShowGrid] = useState(true);
  const [gridLock, setGridLock] = useState(false);
  const [conveyorDir, setConveyorDir] = useState(1);
  const [tab, setTab] = useState('editor'); // 'editor' | 'stages'
  const [spawnPoints, setSpawnPoints] = useState([
    { x: 200, y: 500, color: '#FF4444' },
    { x: 1080, y: 500, color: '#4444FF' },
    { x: 500, y: 400, color: '#44FF44' },
    { x: 780, y: 400, color: '#FFAA00' },
  ]);
  const [spawnSelect, setSpawnSelect] = useState(0);
  // Moving-platform editor
  const [motionType, setMotionType] = useState('horizontal'); // horizontal | vertical | oneway | static
  const [motionDirection, setMotionDirection] = useState('right');
  const [motionSecondEnabled, setMotionSecondEnabled] = useState(false);
  const [motionSecondType, setMotionSecondType] = useState('vertical');
  const [motionSecondDirection, setMotionSecondDirection] = useState('down');
  const [motionSecondDistance, setMotionSecondDistance] = useState(160);
  const [motionSecondSpeed, setMotionSecondSpeed] = useState(0.5);
  const [motionSpeed, setMotionSpeed] = useState(0.5);
  const [motionDistance, setMotionDistance] = useState(160);
  const [motionPaused, setMotionPaused] = useState(false);
  const [selectedMotionId, setSelectedMotionId] = useState(null);
  const [showWorldStages, setShowWorldStages] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [publishStatus, setPublishStatus] = useState('');
  // Hazard & knockback-item placement
  const [hazards, setHazards] = useState([]); // [{ type, x, y, w, h, range? }]
  const [objects, setObjects] = useState([]); // [{ type, x, y }]
  const [hazardType, setHazardType] = useState('fire');
  const [objectType, setObjectType] = useState('heavy');
  // Moving-saw motion editing (axis, speed, range) — applies to newly placed
  // and selected moving saws. Also used for the selected-hazard editor.
  const [hazardAxis, setHazardAxis] = useState('horizontal');
  const [hazardSpeed, setHazardSpeed] = useState(2.5);
  const [hazardRange, setHazardRange] = useState(200);
  const [selectedHazardIdx, setSelectedHazardIdx] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [originalOwnerId, setOriginalOwnerId] = useState(null);
  const [catapultDir, setCatapultDir] = useState('right');
  const [windDir, setWindDir] = useState('right');
  const [windStrength, setWindStrength] = useState(3);
  const [hazardW, setHazardW] = useState(80);
  const [hazardH, setHazardH] = useState(40);
  const [hazardMotion, setHazardMotion] = useState(false);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);
  useEffect(() => { db.auth.me().then(u => { setUserId(u.id); setUsername(u.username || (u.full_name || (u.email || 'Player')).split('@')[0]); }).catch(() => {}); }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    let r = true; let f = 0;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      const bd = BACKDROPS.find(b => b.id === backdrop) || BACKDROPS[0];
      const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      g.addColorStop(0, bd.colors[0]); g.addColorStop(1, bd.colors[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // KO perimeter — canvas rim = blast zone boundary in an actual match
      ctx.strokeStyle = 'rgba(255,80,80,0.55)'; ctx.lineWidth = 4; ctx.setLineDash([16, 10]);
      ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4); ctx.setLineDash([]);
      // grid (toggleable) — covers the full build area
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
        for (let x = 0; x < CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
        for (let y = 0; y < CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }
      }
      // Shift to game-coordinate space: editor (ORIGIN_X, ORIGIN_Y) = game (0,0)
      ctx.save(); ctx.translate(ORIGIN_X, ORIGIN_Y);
      // The whole canvas is one build section — no inner play-area box.
      // platforms
      platforms.forEach((p, i) => {
        const mat = MATERIALS.find(m => m.id === (p.material || 'normal')) || MATERIALS[0];
        const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
        pg.addColorStop(0, mat.color); pg.addColorStop(1, mat.color + '88');
        ctx.fillStyle = pg; ctx.fillRect(p.x, p.y, p.w, p.h);
        drawMaterialOverlay(ctx, p, f);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '9px Orbitron'; ctx.textAlign = 'left';
        ctx.fillText(`#${i + 1} ${mat.name}${p.move ? ' ⛯' : ''}${p.destroyable ? ' 💥' : ''}`, p.x + 4, p.y - 4);
        // Destroyable platform indicator — crack pattern overlay
        if (p.destroyable) {
          ctx.strokeStyle = 'rgba(255,100,50,0.5)'; ctx.lineWidth = 1.5;
          for (let cx = p.x + 20; cx < p.x + p.w - 10; cx += 30) {
            ctx.beginPath(); ctx.moveTo(cx, p.y + 2); ctx.lineTo(cx + 4, p.y + p.h - 2); ctx.lineTo(cx - 3, p.y + p.h - 2); ctx.stroke();
          }
        }
        // Moving-platform travel path indicator
        if (p.move && p.move.type !== 'static' && p.move.distance) {
          const d = p.move.distance / 2;
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
          ctx.beginPath();
          if (p.move.type === 'horizontal') {
            ctx.moveTo(p.x - d, p.y + p.h / 2); ctx.lineTo(p.x + p.w + d, p.y + p.h / 2);
          } else if (p.move.type === 'vertical') {
            ctx.moveTo(p.x + p.w / 2, p.y - d); ctx.lineTo(p.x + p.w / 2, p.y + p.h + d);
          }
          ctx.stroke(); ctx.setLineDash([]);
          // arrows at ends
          ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center';
          if (p.move.type === 'horizontal') {
            ctx.fillText('<', p.x - d, p.y + p.h / 2 + 4); ctx.fillText('>', p.x + p.w + d, p.y + p.h / 2 + 4);
          } else {
            ctx.fillText('^', p.x + p.w / 2, p.y - d + 4); ctx.fillText('v', p.x + p.w / 2, p.y + p.h + d + 4);
          }
        }
        // Highlight selected motion platform
        if (mode === 'motion' && i === selectedMotionId) {
          ctx.strokeStyle = '#FF6600'; ctx.lineWidth = 3; ctx.strokeRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
        }
      });
      // Spawn points
      spawnPoints.forEach((sp, i) => {
        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(`P${i + 1}`, sp.x, sp.y + 4);
        if (mode === 'spawn' && i === spawnSelect) {
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(sp.x, sp.y, 18, 0, Math.PI * 2); ctx.stroke();
        }
      });
      // Hazard zones (editor preview — simplified colored boxes with labels)
      hazards.forEach((hz, i) => {
        const def = HAZARD_TYPES.find(t => t.id === hz.type) || HAZARD_TYPES[0];
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = def.color;
        ctx.fillRect(hz.x, hz.y, hz.w, hz.h);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = def.color; ctx.lineWidth = 2;
        ctx.setLineDash(hz.type === 'moving' ? [4, 4] : []);
        ctx.strokeRect(hz.x, hz.y, hz.w, hz.h);
        ctx.setLineDash([]);
        // moving saw travel range (horizontal or vertical)
        if (hz.type === 'moving' && hz.range) {
          ctx.strokeStyle = def.color + '88'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
          ctx.beginPath();
          if ((hz.axis || 'horizontal') === 'vertical') {
            ctx.moveTo(hz.x + hz.w / 2, hz.y - hz.range / 2); ctx.lineTo(hz.x + hz.w / 2, hz.y + hz.range / 2);
          } else {
            ctx.moveTo(hz.x - hz.range / 2, hz.y + hz.h / 2); ctx.lineTo(hz.x + hz.range / 2, hz.y + hz.h / 2);
          }
          ctx.stroke(); ctx.setLineDash([]);
        }
        // generic motion travel path (fire/electric/water/wind/catapult with `move`)
        if (hz.move) {
          const ax = hz.move.axis || 'horizontal';
          const rng = hz.move.range || 200;
          ctx.strokeStyle = def.color + 'AA'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
          ctx.beginPath();
          if (ax === 'vertical') { ctx.moveTo(hz.x + hz.w / 2, hz.y - rng / 2); ctx.lineTo(hz.x + hz.w / 2, hz.y + hz.h + rng / 2); }
          else { ctx.moveTo(hz.x - rng / 2, hz.y + hz.h / 2); ctx.lineTo(hz.x + hz.w + rng / 2, hz.y + hz.h / 2); }
          ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center';
        const dirArrow = hz.dir ? (hz.dir === 'left' ? ' ←' : hz.dir === 'right' ? ' →' : hz.dir === 'up' ? ' ↑' : hz.dir === 'down' ? ' ↓' : '') : '';
        ctx.fillText(`${def.icon} ${def.name}${dirArrow}`, hz.x + hz.w / 2, hz.y - 4);
        // remove highlight
        if (mode === 'remove') { ctx.strokeStyle = '#FF4444'; ctx.lineWidth = 1.5; ctx.strokeRect(hz.x - 2, hz.y - 2, hz.w + 4, hz.h + 4); }
        // selected hazard highlight (size/motion editing or moving)
        if ((mode === 'hazard' || mode === 'move') && selectedHazardIdx === i) { ctx.strokeStyle = '#FF6600'; ctx.lineWidth = 3; ctx.strokeRect(hz.x - 3, hz.y - 3, hz.w + 6, hz.h + 6); }
      });
      // Knockback objects (editor preview — colored circles with type labels)
      objects.forEach((obj, i) => {
        const def = OBJECT_TYPES.find(t => t.id === obj.type) || OBJECT_TYPES[0];
        const r = (def.size || 24) / 2;
        ctx.fillStyle = def.color; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(obj.x, obj.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(def.icon, obj.x, obj.y + 3);
        ctx.fillStyle = '#FFF'; ctx.font = '8px Orbitron';
        ctx.fillText(def.name, obj.x, obj.y - r - 4);
        if (mode === 'remove') { ctx.strokeStyle = '#FF4444'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(obj.x, obj.y, r + 3, 0, Math.PI * 2); ctx.stroke(); }
      });
      // Blue dotted drag preview
      if (drag && mousePos && mode === 'add' && (drag.platformIdx == null || drag.platformIdx < 0)) {
        const px = Math.min(drag.x, mousePos.x), py = Math.min(drag.y, mousePos.y);
        const pw = Math.abs(mousePos.x - drag.x), ph = Math.abs(mousePos.y - drag.y);
        ctx.strokeStyle = '#4488FF'; ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(px, py, pw, ph);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(68,136,255,0.12)'; ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = '#4488FF'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'left';
        ctx.fillText(`${Math.round(pw)}×${Math.round(ph)}`, px + 4, py - 4);
      }
      // Portal link lines — each pair gets a random-colored dotted line so links are trackable
      const portalList = hazards.filter(h => h.type === 'portal');
      for (let pi = 0; pi < portalList.length; pi += 2) {
        if (!portalList[pi + 1]) continue;
        const a = portalList[pi], b = portalList[pi + 1];
        // Stable random color per pair index (deterministic so it doesn't flicker)
        const hue = (pi * 47) % 360;
        ctx.strokeStyle = `hsl(${hue}, 90%, 65%)`;
        ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(a.x + a.w / 2, a.y + a.h / 2);
        ctx.lineTo(b.x + b.w / 2, b.y + b.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // small link badge at midpoint
        ctx.fillStyle = `hsl(${hue}, 90%, 65%)`;
        ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(`LINK ${pi / 2 + 1}`, (a.x + b.x) / 2 + a.w / 2, (a.y + b.y) / 2 + a.h / 2);
      }
      ctx.restore();
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [platforms, drag, mousePos, mode, backdrop, spawnPoints, spawnSelect, hazards, objects, hazardType, objectType, selectedHazardIdx]);

  const pos = (e) => {
    const c = canvasRef.current; const rect = c.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX - ORIGIN_X,
      y: (e.clientY - rect.top) * scaleY - ORIGIN_Y,
    };
  };

  const findPlatformAt = (x, y) => platforms.findIndex(p => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);

  const onDown = (e) => {
    const { x, y } = pos(e);
    // Right-click = place a default-sized block at cursor
    if (e.button === 2) {
      const defW = 160, defH = 20;
      const snap = (v) => gridLock ? Math.round(v / 40) * 40 : Math.round(v);
      setPlatforms([...platforms, { x: snap(x - defW / 2), y: snap(y - defH / 2), w: defW, h: defH, material, ...(material === 'conveyor' ? { conveyorDir } : {}) }]);
      return;
    }
    if (mode === 'spawn') {
      const newSpawns = [...spawnPoints];
      newSpawns[spawnSelect] = { ...newSpawns[spawnSelect], x, y };
      setSpawnPoints(newSpawns);
      return;
    }
    if (mode === 'remove') {
      const i = findPlatformAt(x, y);
      if (i >= 0) { setPlatforms(platforms.filter((_, idx) => idx !== i)); return; }
      // remove hazard at point
      const hzIdx = hazards.findIndex(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (hzIdx >= 0) { setHazards(hazards.filter((_, idx) => idx !== hzIdx)); return; }
      // remove object at point (circle hit test)
      const objIdx = objects.findIndex(o => { const r = 20; return Math.hypot(x - o.x, y - o.y) < r + 6; });
      if (objIdx >= 0) { setObjects(objects.filter((_, idx) => idx !== objIdx)); return; }
      return;
    }
    if (mode === 'hazard') {
      const snap = (v) => gridLock ? Math.round(v / 40) * 40 : Math.round(v);
      // Click an existing hazard → select it for editing (size + motion)
      const existIdx = hazards.findIndex(h => x >= h.x - 4 && x <= h.x + h.w + 4 && y >= h.y - 4 && y <= h.y + h.h + 4);
      if (existIdx >= 0) {
        const eh = hazards[existIdx];
        setSelectedHazardIdx(existIdx);
        setHazardType(eh.type);
        setHazardW(eh.w); setHazardH(eh.h);
        if (eh.type === 'moving') { setHazardAxis(eh.axis || 'horizontal'); setHazardSpeed(eh.speed || 2.5); setHazardRange(eh.range || 200); setHazardMotion(false); }
        else if (eh.move) { setHazardMotion(true); setHazardAxis(eh.move.axis || 'horizontal'); setHazardSpeed(eh.move.speed || 2.5); setHazardRange(eh.move.range || 200); }
        else setHazardMotion(false);
        if (eh.type === 'catapult') setCatapultDir(eh.dir || 'right');
        if (eh.type === 'wind') { setWindDir(eh.dir || 'right'); setWindStrength(eh.strength || 3); }
        return;
      }
      const hzOpts = { w: hazardW, h: hazardH,
        ...(hazardType === 'moving' ? { axis: hazardAxis, speed: hazardSpeed, range: hazardRange }
        : hazardType === 'catapult' ? { dir: catapultDir }
        : hazardType === 'wind' ? { dir: windDir, strength: windStrength }
        : {}) };
      const hz = makeHazard(hazardType, snap(x), snap(y), hzOpts);
      // center the hazard on the cursor
      hz.x = snap(x - hz.w / 2); hz.y = snap(y - hz.h / 2);
      if (hz.startX != null) hz.startX = hz.x;
      if (hz.startY != null) hz.startY = hz.y;
      // Apply generic motion to non-moving, non-portal hazards
      if (hazardMotion && hazardType !== 'moving' && hazardType !== 'portal') {
        hz.move = { axis: hazardAxis, speed: hazardSpeed, range: hazardRange, startX: hz.x, startY: hz.y, dir: 1 };
      }
      setHazards([...hazards, hz]);
      setSelectedHazardIdx(null);
      return;
    }
    if (mode === 'move') {
      const snap = (v) => gridLock ? Math.round(v / 40) * 40 : Math.round(v);
      // hazard?
      const hzIdx = hazards.findIndex(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (hzIdx >= 0) {
        const h = hazards[hzIdx];
        setDrag({ x, y, hazardIdx: hzIdx, offsetX: x - h.x, offsetY: y - h.y });
        setSelectedHazardIdx(hzIdx);
        return;
      }
      // object?
      const objIdx = objects.findIndex(o => Math.hypot(x - o.x, y - o.y) < 24);
      if (objIdx >= 0) {
        const o = objects[objIdx];
        setDrag({ x, y, objectIdx: objIdx, offsetX: x - o.x, offsetY: y - o.y });
        return;
      }
      // platform?
      const pi = findPlatformAt(x, y);
      if (pi >= 0) {
        const p = platforms[pi];
        setDrag({ x, y, platformIdx: pi, offsetX: x - p.x, offsetY: y - p.y });
      }
      return;
    }
    if (mode === 'item') {
      const snap = (v) => gridLock ? Math.round(v / 40) * 40 : Math.round(v);
      setObjects([...objects, makeObject(objectType, snap(x), snap(y))]);
      return;
    }
    if (mode === 'motion') {
      const i = findPlatformAt(x, y);
      if (i >= 0) {
        setSelectedMotionId(i);
        const next = [...platforms];
        const cur = next[i].move || {};
        const directionVector = (dir) => ({
          right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1],
          downRight: [1, 1], downLeft: [-1, 1], upRight: [1, -1], upLeft: [-1, -1],
        }[dir] || [1, 0]);
        const [dirX, dirY] = directionVector(motionDirection);
        const [dir2X, dir2Y] = directionVector(motionSecondDirection);
        next[i] = { ...next[i], move: {
          type: motionType, speed: motionSpeed, distance: motionDistance, pause: motionPaused ? 1 : 0, phase: cur.phase || 0,
          dirX, dirY, offsetX: cur.offsetX || 0, offsetY: cur.offsetY || 0,
          ...(motionSecondEnabled ? { second: { type: motionSecondType, speed: motionSecondSpeed, distance: motionSecondDistance, dirX: dir2X, dirY: dir2Y } } : { second: undefined }),
        } };
        setPlatforms(next);
      } else {
        // click empty: just clear selection
        setSelectedMotionId(null);
      }
      return;
    }
    // ADD mode: if clicking on an existing platform, drag it instead of drawing a new one
    const i = findPlatformAt(x, y);
    if (i >= 0) {
      const p = platforms[i];
      setDrag({ x, y, platformIdx: i, offsetX: x - p.x, offsetY: y - p.y });
    } else {
      setDrag({ x, y, platformIdx: -1 });
    }
    setMousePos({ x, y });
  };
  const onMove = (e) => {
    if (!drag) return;
    const mp = pos(e);
    setMousePos(mp);
    const snap = (v) => gridLock ? Math.round(v / 40) * 40 : Math.round(v);
    if (drag.platformIdx >= 0) {
      const next = [...platforms];
      next[drag.platformIdx] = { ...next[drag.platformIdx], x: snap(mp.x - drag.offsetX), y: snap(mp.y - drag.offsetY) };
      setPlatforms(next);
    }
    if (drag.hazardIdx >= 0) {
      const next = [...hazards];
      const h = next[drag.hazardIdx];
      const nx = snap(mp.x - drag.offsetX), ny = snap(mp.y - drag.offsetY);
      const updated = { ...h, x: nx, y: ny };
      if (h.move) updated.move = { ...h.move, startX: nx, startY: ny };
      if (h.type === 'moving') { updated.startX = nx; updated.startY = ny; }
      next[drag.hazardIdx] = updated;
      setHazards(next);
    }
    if (drag.objectIdx >= 0) {
      const next = [...objects];
      const nx = snap(mp.x - drag.offsetX), ny = snap(mp.y - drag.offsetY);
      next[drag.objectIdx] = { ...next[drag.objectIdx], x: nx, y: ny, _originX: nx, _originY: ny };
      setObjects(next);
    }
  };
  const onUp = (e) => {
    if (!drag) return;
    if (drag.platformIdx < 0) {
      const { x, y } = pos(e);
      const px = Math.min(drag.x, x), py = Math.min(drag.y, y);
      const pw = Math.abs(x - drag.x), ph = Math.abs(y - drag.y);
      if (pw > 20 && ph > 8) {
        const snap = (v) => gridLock ? Math.round(v / 40) * 40 : Math.round(v);
        setPlatforms([...platforms, { x: snap(px), y: snap(py), w: snap(pw), h: Math.max(10, snap(ph)), material, ...(material === 'conveyor' ? { conveyorDir } : {}) }]);
      }
    }
    setDrag(null);
    setMousePos(null);
  };

  // Load a saved stage into the editor for editing (tracks which slot is being edited)
  const loadStage = (stage, idx) => {
    const platforms = stage.platforms || stage;
    setPlatforms(platforms);
    setStageName(stage.name || 'Custom Stage');
    setStageEmoji(stage.emoji || '🎨');
    setBackdrop(stage.backdrop || 'city');
    if (stage.spawnPoints) setSpawnPoints(stage.spawnPoints);
    setHazards(stage.hazards || []);
    setObjects(stage.objects || []);
    setEditingIndex(idx);
    setIsDownloaded(!!stage.downloaded);
    setOriginalOwnerId(stage.originalOwnerId || null);
    setTab('editor');
  };

  // Render stage thumbnail preview on a small canvas
  const renderThumbnail = (ctx, stage, w, h) => {
    const platforms = stage.platforms || stage;
    ctx.clearRect(0, 0, w, h);
    const bd = BACKDROPS.find(b => b.id === (stage.backdrop || 'city')) || BACKDROPS[0];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, bd.colors[0]); g.addColorStop(1, bd.colors[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const sx = w / 1280, sy = h / 720;
    platforms.forEach(p => {
      const mat = MATERIALS.find(m => m.id === (p.material || 'normal')) || MATERIALS[0];
      ctx.fillStyle = mat.color;
      ctx.fillRect(p.x * sx, p.y * sy, p.w * sx, Math.max(2, p.h * sy));
      drawMaterialOverlay(ctx, { ...p, x: p.x * sx, y: p.y * sy, w: p.w * sx, h: Math.max(2, p.h * sy) }, 0);
    });
    // hazards + objects in thumbnail
    (stage.hazards || []).forEach(hz => {
      const def = HAZARD_TYPES.find(t => t.id === hz.type) || HAZARD_TYPES[0];
      ctx.globalAlpha = 0.6; ctx.fillStyle = def.color;
      ctx.fillRect(hz.x * sx, hz.y * sy, Math.max(2, hz.w * sx), Math.max(2, hz.h * sy));
      ctx.globalAlpha = 1;
    });
    (stage.objects || []).forEach(o => {
      const def = OBJECT_TYPES.find(t => t.id === o.type) || OBJECT_TYPES[0];
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(o.x * sx, o.y * sy, Math.max(2, def.size * sx * 0.5), 0, Math.PI * 2); ctx.fill();
    });
  };

  return (
    <div className="w-full max-w-5xl flex flex-col gap-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-heading text-accent tracking-wider">STAGE EDITOR</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTab('editor')} className={`px-3 py-1 rounded font-heading text-xs ${tab === 'editor' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>EDIT</button>
          <button onClick={() => setTab('stages')} className={`px-3 py-1 rounded font-heading text-xs ${tab === 'stages' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>SEE STAGES ({savedStages.length})</button>
          {tab === 'stages' && <button onClick={() => setShowWorldStages(true)} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="🌍" size={14} /> WORLD STAGES</button>}
          <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>

      {showWorldStages && (
        <WorldStages
          onBack={() => setShowWorldStages(false)}
          onPlay={(s) => {
            // Import world stage into local custom stages
            const stageData = s.stage_data || {};
            const imported = {
              platforms: stageData.platforms || [],
              spawnPoints: stageData.spawnPoints || null,
              backdrop: stageData.backdrop || s.backdrop || 'city',
              name: s.name || 'Imported Stage',
              emoji: s.emoji || '🎨',
              hazards: stageData.hazards || [],
              objects: stageData.objects || [],
              downloaded: true,
              originalOwnerId: s.owner_user_id,
            };
            onSave?.(imported);
            setShowWorldStages(false);
            setTab('editor');
          }}
          onDownload={(s) => {
            const stageData = s.stage_data || {};
            onSave?.({
              platforms: stageData.platforms || [],
              spawnPoints: stageData.spawnPoints || null,
              backdrop: stageData.backdrop || s.backdrop || 'city',
              name: s.name || 'Downloaded Stage',
              emoji: s.emoji || '🎨',
              hazards: stageData.hazards || [],
              objects: stageData.objects || [],
              downloaded: true,
              originalOwnerId: s.owner_user_id,
            });
          }}
        />
      )}

      {tab === 'stages' && !showWorldStages && (
        <div className="flex flex-col gap-3">
          {savedStages.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground font-body text-sm">No saved stages yet. Create one in the EDIT tab!</p>
              <button onClick={() => setTab('editor')} className="mt-4 px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-xs hover:opacity-80">GO TO EDITOR <GameIcon emoji="→" size={14} /></button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedStages.map((stage, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{stage.emoji || <GameIcon emoji="🎨" size={14} />}</span>
                    <span className="font-heading text-sm text-foreground">{stage.name || 'Custom Stage'}</span>
                  </div>
                  <StageThumbnail stage={stage} renderFn={renderThumbnail} />
                  <div className="flex gap-2">
                    <button onClick={() => loadStage(stage, i)} className="flex-1 px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="✎" size={14} /> EDIT</button>
                    <button onClick={() => { if (confirm(`Delete "${stage.name || 'Custom Stage'}"?`)) onDeleteStage?.(i); }} className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="🗑" size={14} /> DELETE</button>
                  </div>
                  {(stage.backdrop || stage.platforms) && (
                    <p className="text-[9px] text-muted-foreground font-body">
                      {(stage.platforms || stage).length} platforms · {BACKDROPS.find(b => b.id === stage.backdrop)?.name || 'Default'}{((stage.hazards || []).length || (stage.objects || []).length) ? ` · ${(stage.hazards || []).length} hazards · ${(stage.objects || []).length} items` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'editor' && (
        <>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setMode('add')} className={`px-3 py-1 rounded font-heading text-xs ${mode === 'add' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>ADD (drag)</button>
          <button onClick={() => setMode('remove')} className={`px-3 py-1 rounded font-heading text-xs ${mode === 'remove' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'}`}>REMOVE</button>
          <button onClick={() => setMode('spawn')} className={`px-3 py-1 rounded font-heading text-xs ${mode === 'spawn' ? 'bg-green-600 text-white' : 'bg-secondary text-secondary-foreground'}`}>SPAWN</button>
          <button onClick={() => setMode('motion')} className={`px-3 py-1 rounded font-heading text-xs ${mode === 'motion' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>MOTION</button>
          <button onClick={() => setMode('hazard')} className={`px-3 py-1 rounded font-heading text-xs ${mode === 'hazard' ? 'bg-orange-600 text-white' : 'bg-secondary text-secondary-foreground'}`}>HAZARD</button>
          <button onClick={() => setMode('item')} className={`px-3 py-1 rounded font-heading text-xs ${mode === 'item' ? 'bg-purple-600 text-white' : 'bg-secondary text-secondary-foreground'}`}>ITEM</button>
          <button onClick={() => setMode('move')} className={`px-3 py-1 rounded font-heading text-xs ${mode === 'move' ? 'bg-cyan-600 text-white' : 'bg-secondary text-secondary-foreground'}`}>MOVE</button>
          {mode === 'hazard' && (
            <div className="flex items-center gap-1 flex-wrap border border-border rounded-lg px-2 py-1">
              <span className="text-[10px] font-heading text-muted-foreground">TYPE:</span>
              {HAZARD_TYPES.map(t => (
                <button key={t.id} onClick={() => { setHazardType(t.id); setSelectedHazardIdx(null); setHazardW(t.defaultW); setHazardH(t.defaultH); setHazardMotion(false); }} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${hazardType === t.id ? 'border-accent' : 'border-border'}`} style={{ background: hazardType === t.id ? t.color + '33' : 'transparent' }}>{t.icon} {t.name}</button>
              ))}
              {/* Size + generic motion controls (all hazard types) */}
              <span className="text-[10px] font-heading text-muted-foreground ml-2">W:</span>
              <input type="range" min="20" max="600" step="10" value={hazardW} onChange={e => { const v = parseInt(e.target.value); setHazardW(v); if (selectedHazardIdx != null) setHazards(hazards.map((h, i) => i === selectedHazardIdx ? { ...h, w: v } : h)); }} className="w-16" />
              <span className="text-[9px] w-8">{hazardW}</span>
              <span className="text-[10px] font-heading text-muted-foreground">H:</span>
              <input type="range" min="20" max="400" step="10" value={hazardH} onChange={e => { const v = parseInt(e.target.value); setHazardH(v); if (selectedHazardIdx != null) setHazards(hazards.map((h, i) => i === selectedHazardIdx ? { ...h, h: v } : h)); }} className="w-16" />
              <span className="text-[9px] w-8">{hazardH}</span>
              {hazardType !== 'moving' && hazardType !== 'portal' && (
                <>
                  <span className="text-[10px] font-heading text-muted-foreground ml-2">MOTION:</span>
                  <button onClick={() => {
                    const next = !hazardMotion; setHazardMotion(next);
                    if (selectedHazardIdx != null) setHazards(hazards.map((h, i) => i === selectedHazardIdx ? (next ? { ...h, move: h.move || { axis: hazardAxis, speed: hazardSpeed, range: hazardRange, startX: h.x, startY: h.y, dir: 1 } } : { ...h, move: null }) : h));
                  }} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${hazardMotion ? 'border-accent bg-accent/20' : 'border-border'}`}>{hazardMotion ? 'ON' : 'OFF'}</button>
                  {hazardMotion && (
                    <>
                      <span className="text-[10px] font-heading text-muted-foreground">AXIS:</span>
                      {['horizontal','vertical'].map(ax => (
                        <button key={ax} onClick={() => { setHazardAxis(ax); if (selectedHazardIdx != null) setHazards(hazards.map((h, i) => i === selectedHazardIdx && h.move ? { ...h, move: { ...h.move, axis: ax } } : h)); }} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${hazardAxis === ax ? 'border-accent' : 'border-border'}`}>{ax === 'horizontal' ? '← →' : '↑ ↓'}</button>
                      ))}
                      <span className="text-[10px] font-heading text-muted-foreground">SPD:</span>
                      <input type="range" min="0.5" max="6" step="0.5" value={hazardSpeed} onChange={e => { const v = parseFloat(e.target.value); setHazardSpeed(v); if (selectedHazardIdx != null) setHazards(hazards.map((h, i) => i === selectedHazardIdx && h.move ? { ...h, move: { ...h.move, speed: v } } : h)); }} className="w-14" />
                      <span className="text-[9px] w-6">{hazardSpeed}</span>
                      <span className="text-[10px] font-heading text-muted-foreground">RNG:</span>
                      <input type="range" min="40" max="600" step="20" value={hazardRange} onChange={e => { const v = parseInt(e.target.value); setHazardRange(v); if (selectedHazardIdx != null) setHazards(hazards.map((h, i) => i === selectedHazardIdx && h.move ? { ...h, move: { ...h.move, range: v } } : h)); }} className="w-14" />
                      <span className="text-[9px] w-8">{hazardRange}</span>
                    </>
                  )}
                </>
              )}
              {selectedHazardIdx != null && <span className="text-[10px] text-accent font-heading ml-2">EDITING #{selectedHazardIdx + 1}</span>}
              {hazardType === 'moving' && (
                <>
                  <span className="text-[10px] font-heading text-muted-foreground ml-2">AXIS:</span>
                  {['horizontal','vertical'].map(ax => (
                    <button key={ax} onClick={() => {
                      setHazardAxis(ax);
                      if (selectedHazardIdx != null) setHazards(hazards.map((h, i) => i === selectedHazardIdx ? { ...h, axis: ax, vx: ax === 'horizontal' ? (h.speed || hazardSpeed) : 0, vy: ax === 'vertical' ? (h.speed || hazardSpeed) : 0 } : h));
                    }} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${hazardAxis === ax ? 'border-accent' : 'border-border'}`}>{ax === 'horizontal' ? '← →' : '↑ ↓'}</button>
                  ))}
                  <span className="text-[10px] font-heading text-muted-foreground">SPD:</span>
                  <input type="range" min="0.5" max="6" step="0.5" value={hazardSpeed} onChange={e => {
                    const v = parseFloat(e.target.value); setHazardSpeed(v);
                    if (selectedHazardIdx != null) setHazards(hazards.map((h, i) => i === selectedHazardIdx ? { ...h, speed: v, vx: (h.axis || 'horizontal') === 'horizontal' ? v : 0, vy: (h.axis || 'horizontal') === 'vertical' ? v : 0 } : h));
                  }} className="w-16" />
                  <span className="text-[9px] w-6">{hazardSpeed}</span>
                  <span className="text-[10px] font-heading text-muted-foreground">RNG:</span>
                  <input type="range" min="40" max="600" step="20" value={hazardRange} onChange={e => {
                    const v = parseInt(e.target.value); setHazardRange(v);
                    if (selectedHazardIdx != null) setHazards(hazards.map((h, i) => i === selectedHazardIdx ? { ...h, range: v } : h));
                  }} className="w-16" />
                  <span className="text-[9px] w-8">{hazardRange}</span>
                  {selectedHazardIdx != null && <span className="text-[10px] text-accent font-heading">EDITING SAW #{selectedHazardIdx + 1}</span>}
                </>
              )}
              {hazardType === 'portal' && <span className="text-[10px] text-accent font-heading ml-2">Portals auto-link in pairs (1&2, 3&4…) — a colored dotted line shows each link.</span>}
              {hazardType === 'catapult' && (
                <>
                  <span className="text-[10px] font-heading text-muted-foreground ml-2">DIR:</span>
                  {['left','right','up'].map(d => (
                    <button key={d} onClick={() => setCatapultDir(d)} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${catapultDir === d ? 'border-accent' : 'border-border'}`}>{d === 'left' ? '←' : d === 'right' ? '→' : '↑'}</button>
                  ))}
                  <span className="text-[10px] text-muted-foreground font-body">Launches fighters on touch.</span>
                </>
              )}
              {hazardType === 'wind' && (
                <>
                  <span className="text-[10px] font-heading text-muted-foreground ml-2">DIR:</span>
                  {['left','right','up','down'].map(d => (
                    <button key={d} onClick={() => setWindDir(d)} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${windDir === d ? 'border-accent' : 'border-border'}`}>{d === 'left' ? '←' : d === 'right' ? '→' : d === 'up' ? '↑' : '↓'}</button>
                  ))}
                  <span className="text-[10px] font-heading text-muted-foreground">STR:</span>
                  <input type="range" min="1" max="8" step="0.5" value={windStrength} onChange={e => setWindStrength(parseFloat(e.target.value))} className="w-16" />
                  <span className="text-[9px] w-6">{windStrength}</span>
                  <span className="text-[10px] text-muted-foreground font-body">Pushes fighters & items inside the zone.</span>
                </>
              )}
              <span className="text-[10px] text-muted-foreground font-body ml-1">Click canvas to place. REMOVE mode deletes.</span>
            </div>
          )}
          {mode === 'item' && (
            <div className="flex items-center gap-1 flex-wrap border border-border rounded-lg px-2 py-1">
              <span className="text-[10px] font-heading text-muted-foreground">TYPE:</span>
              {OBJECT_TYPES.map(t => (
                <button key={t.id} onClick={() => setObjectType(t.id)} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${objectType === t.id ? 'border-accent' : 'border-border'}`} style={{ background: objectType === t.id ? t.color + '33' : 'transparent' }}>{t.icon} {t.name}</button>
              ))}
              <span className="text-[10px] text-muted-foreground font-body ml-1">Click canvas to place. REMOVE mode deletes.</span>
            </div>
          )}
          {mode === 'motion' && (
            <div className="flex items-center gap-2 flex-wrap border border-border rounded-lg px-2 py-1">
              <span className="text-[10px] font-heading text-muted-foreground">MOVE:</span>
              {['static','horizontal','vertical','oneway'].map(t => (
                <button key={t} onClick={() => setMotionType(t)} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${motionType === t ? 'border-accent' : 'border-border'}`} style={{ background: motionType === t ? 'rgba(255,215,0,0.2)' : 'transparent' }}>
                  {t === 'horizontal' ? '← →' : t === 'vertical' ? '↑ ↓' : t === 'oneway' ? 'ONE-WAY' : 'STATIC'}
                </button>
              ))}
              {motionType === 'oneway' && <>
                <span className="text-[10px] font-heading text-muted-foreground">DIR:</span>
                {['left','right','up','down','upLeft','upRight','downLeft','downRight'].map(d => (
                  <button key={d} onClick={() => setMotionDirection(d)} className={`px-1.5 py-1 rounded font-heading text-[10px] border ${motionDirection === d ? 'border-accent bg-accent/20' : 'border-border'}`}>
                    {{left:'←',right:'→',up:'↑',down:'↓',upLeft:'↖',upRight:'↗',downLeft:'↙',downRight:'↘'}[d]}
                  </button>
                ))}
              </>}
              <span className="text-[10px] font-heading text-muted-foreground">SPEED:</span>
              <input type="range" min="0.1" max="3" step="0.1" value={motionSpeed} onChange={e => setMotionSpeed(parseFloat(e.target.value))} className="w-20" />
              <span className="text-[9px] w-6">{motionSpeed}</span>
              <span className="text-[10px] font-heading text-muted-foreground">DIST:</span>
              <input type="range" min="0" max="1500" step="10" value={motionDistance} onChange={e => setMotionDistance(parseInt(e.target.value))} className="w-20" />
              <span className="text-[9px] w-8">{motionDistance}</span>
              <button onClick={() => setMotionSecondEnabled(v => !v)} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${motionSecondEnabled ? 'border-accent bg-accent/20' : 'border-border'}`} disabled={selectedMotionId == null}>2ND MOTION {motionSecondEnabled ? 'ON' : 'OFF'}</button>
              {motionSecondEnabled && <>
                <select value={motionSecondType} onChange={e => setMotionSecondType(e.target.value)} className="bg-secondary text-secondary-foreground rounded px-1 py-1 text-[10px]">
                  <option value="horizontal">HORIZONTAL</option><option value="vertical">VERTICAL</option><option value="oneway">ONE-WAY</option>
                </select>
                <select value={motionSecondDirection} onChange={e => setMotionSecondDirection(e.target.value)} className="bg-secondary text-secondary-foreground rounded px-1 py-1 text-[10px]">
                  <option value="left">←</option><option value="right">→</option><option value="up">↑</option><option value="down">↓</option><option value="upLeft">↖</option><option value="upRight">↗</option><option value="downLeft">↙</option><option value="downRight">↘</option>
                </select>
                <span className="text-[10px] font-heading text-muted-foreground">D2:</span>
                <input type="range" min="0" max="1500" step="10" value={motionSecondDistance} onChange={e => setMotionSecondDistance(parseInt(e.target.value))} className="w-20" />
                <span className="text-[9px] w-8">{motionSecondDistance}</span>
                <span className="text-[10px] font-heading text-muted-foreground">S2:</span>
                <input type="range" min="0.1" max="3" step="0.1" value={motionSecondSpeed} onChange={e => setMotionSecondSpeed(parseFloat(e.target.value))} className="w-16" />
                <span className="text-[9px] w-6">{motionSecondSpeed}</span>
              </>}
              <button onClick={() => setPlatforms(platforms.map((p, idx) => idx === selectedMotionId ? { ...p, move: undefined } : p))} className="px-2 py-1 rounded font-heading text-[10px] bg-destructive text-destructive-foreground" disabled={selectedMotionId == null}>CLEAR</button>
              <span className="text-[10px] font-heading text-muted-foreground ml-2">DESTROY:</span>
              <button onClick={() => setPlatforms(platforms.map((p, idx) => idx === selectedMotionId ? { ...p, destroyable: !p.destroyable } : p))} className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${selectedMotionId != null && platforms[selectedMotionId]?.destroyable ? 'border-orange-500 bg-orange-600/30 text-orange-300' : 'border-border'}`} disabled={selectedMotionId == null}>{selectedMotionId != null && platforms[selectedMotionId]?.destroyable ? 'ON 💥' : 'OFF'}</button>
            </div>
          )}
          {mode === 'spawn' && [0, 1, 2, 3].map(i => (
            <button key={i} onClick={() => setSpawnSelect(i)} className={`px-2 py-1 rounded font-heading text-[10px] ${spawnSelect === i ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`} style={{ color: spawnSelect === i ? '#FFF' : spawnPoints[i].color }}>P{i + 1}</button>
          ))}
          <button onClick={() => setShowGrid(g => !g)} className={`px-3 py-1 rounded font-heading text-xs ${showGrid ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>GRID: {showGrid ? 'ON' : 'OFF'}</button>
          <button onClick={() => setGridLock(g => !g)} className={`px-3 py-1 rounded font-heading text-xs ${gridLock ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>LOCK: {gridLock ? 'ON' : 'OFF'}</button>
          {material === 'conveyor' && (
            <button onClick={() => setConveyorDir(d => -d)} className="px-3 py-1 rounded font-heading text-xs bg-accent text-accent-foreground">CONVEYOR: {conveyorDir > 0 ? <GameIcon emoji="→" size={14} /> : <GameIcon emoji="←" size={14} />}</button>
          )}
          <button onClick={() => setPlatforms([{ x: 40, y: PLAY_H - 120, w: PLAY_W - 80, h: 40, material: 'normal' }, { x: PLAY_W / 2 - 160, y: PLAY_H / 2, w: 320, h: 18, material: 'normal' }])} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs">RESET</button>
          <button onClick={async () => {
            // Platforms/hazards/objects/spawns are stored in game coords (1280×720),
            // so no scaling is needed — they map 1:1 to the match canvas.
            const stageData = { platforms, name: stageName || 'Custom Stage', emoji: stageEmoji, backdrop, spawnPoints, hazards, objects, _editingIndex: editingIndex, downloaded: isDownloaded, originalOwnerId };
            onSave(stageData);
            // Auto-publish to world — only for stages you created (downloaded stages stay local)
            if (userId && !isDownloaded) {
              setPublishStatus('Publishing…');
              try {
                const existing = await db.entities.UploadedStage.filter({ owner_user_id: userId, name: stageName || 'Custom Stage' });
                if (existing.length > 0) {
                  // Keep only the most-recently-updated record; update it and delete any older duplicates
                  existing.sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || ''));
                  const keep = existing[0];
                  await db.entities.UploadedStage.update(keep.id, { stage_data: stageData, backdrop, emoji: stageEmoji });
                  for (const dup of existing.slice(1)) {
                    try { await db.entities.UploadedStage.delete(dup.id); } catch (e) {}
                  }
                } else {
                  await db.entities.UploadedStage.create({ owner_user_id: userId, owner_username: username, name: stageName || 'Custom Stage', description: '', emoji: stageEmoji, backdrop, stage_data: stageData });
                }
                sfx.purchaseSuccess();
                setPublishStatus('Published to world! ✓');
              } catch (e) { setPublishStatus('Publish failed'); sfx.warning(); }
              setTimeout(() => setPublishStatus(''), 3000);
            } else if (isDownloaded) {
              setPublishStatus("Saved locally — downloaded stages don't publish to World Stages.");
              sfx.click();
              setTimeout(() => setPublishStatus(''), 3000);
            }
          }} className="px-4 py-1 bg-primary text-primary-foreground rounded font-heading text-sm">SAVE STAGE</button>
        </div>

      <div className="flex gap-4 flex-wrap items-center bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-heading text-muted-foreground">NAME:</span>
          <input type="text" value={stageName} onChange={e => setStageName(e.target.value)} placeholder="Stage name" maxLength={20}
            className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body w-32" />
          <span className="text-[10px] font-heading text-muted-foreground">ICON:</span>
          <input type="text" value={stageEmoji} onChange={e => setStageEmoji(e.target.value)} maxLength={2}
            className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm w-10 text-center" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-heading text-muted-foreground">BACKDROP:</span>
          <select value={backdrop} onChange={e => setBackdrop(e.target.value)} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body">
            {BACKDROPS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap items-center bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-heading text-muted-foreground">MATERIAL:</span>
          {MATERIALS.map(m => (
            <button key={m.id} onClick={() => setMaterial(m.id)}
              className={`px-2 py-1 rounded font-heading text-[10px] border-2 ${material === m.id ? 'border-accent' : 'border-border'}`}
              style={{ backgroundColor: m.color + '33' }}>
              {m.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-heading text-accent">STAGE SIZE: FIXED (2280×1770 — full KO perimeter)</span>
          <span className="text-[10px] font-heading text-muted-foreground">SLOTS: {savedStages.length}/10 (includes downloads)</span>
        </div>
        {publishStatus && <p className="text-[10px] font-heading text-accent">{publishStatus}</p>}
      </div>

      <canvas
        ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        onMouseDown={onDown} onMouseUp={onUp} onMouseMove={onMove}
        onContextMenu={e => e.preventDefault()}
        className="border-2 border-border rounded-lg shadow-2xl w-full"
        style={{ cursor: mode === 'remove' ? 'not-allowed' : 'crosshair' }}
      />
      <div className="bg-card border border-border rounded-xl p-3 text-[10px] text-muted-foreground font-body">
        <p className="font-heading text-accent text-xs mb-1">HOW TO USE</p>
        <p>• <b>ADD mode:</b> Click and drag on the canvas to draw a platform. A blue dotted line shows where the block will be placed — release to confirm.</p>
        <p>• <b>Right-click:</b> Right-click anywhere on the canvas to instantly place a default-sized block (160×20) using the currently selected material.</p>
        <p>• <b>Grid toggle:</b> Turn the grid on/off for easier alignment.</p>
        <p>• <b>Grid Lock:</b> When ON, platforms snap to 40px grid lines for perfect symmetry.</p>
        <p>• <b>Conveyor Direction:</b> When Conveyor material is selected, use the <GameIcon emoji="→" size={14} />/<GameIcon emoji="←" size={14} /> button to set push direction.</p>
        <p>• <b>REMOVE mode:</b> Click on any platform to delete it.</p>
        <p>• <b>SEE STAGES tab:</b> View, edit, or delete your saved stages.</p>
        <p>• <b>Materials:</b> Ice = near-zero friction. Lava = fall through slowly, take damage, swim up. Water = fall through slowly, swim up. Bounce = launches you upward. Cloud = pass-through, no effect. Spike = damage + knockback. Conveyor = pushes you sideways (direction settable). Acid = damages + disables powers temporarily. Sand = slow to walk on. Quicksand = slowly sinks you. Snow = slowly sinks you, weak jumps. Tar = traps you until hit by an attack. Metal/Glass/Wood/Grass/Rubber/Crystal = normal solid.</p>
        <p>• <b>Name & Icon:</b> Give your stage a name and pick an emoji icon — it shows in the map select screen.</p>
        <p>• <b>Backdrop:</b> Choose from 20 different background themes.</p>
        <p>• You can save up to 10 custom stages (this includes stages you download from World Stages — downloads count toward the 10-slot limit).</p>
        <p>• <b>SPAWN mode:</b> Click on the canvas to place a spawn point for P1-P4. Use the P1/P2/P3/P4 buttons to select which player's spawn to move. Spawn points are saved with the stage.</p>
        <p>• <b>MOTION mode:</b> Click any platform to make it move. Set the motion type (<GameIcon emoji="←" size={14} /> <GameIcon emoji="→" size={14} /> horizontal, <GameIcon emoji="↑" size={14} /> <GameIcon emoji="↓" size={14} /> vertical, or STATIC), then adjust SPEED and DISTANCE. A dashed gold line shows the platform's travel range. Click CLEAR to remove motion from the currently selected (orange box) platform. Moving platforms carry any fighter standing on them during a match. Use the DESTROY toggle to mark a platform as destructible — it shows a 💥 icon and crack overlay. Destructible platforms break when hit by attacks during matches and regenerate after 10 seconds.</p>
        <p>• <b>HAZARD mode:</b> Pick a hazard type and click the canvas to place it. Hazards damage fighters during matches. Use REMOVE mode to delete placed hazards.</p>
        <p>• <b>Moving Saw motion:</b> With the Moving Saw type selected, use AXIS (←→ / ↑↓), SPD (speed), and RNG (travel range) to set how a newly placed saw moves. Click an existing saw to select it (orange) and edit its motion live. A dashed line shows the travel path.</p>
        <p>• <b>Portals:</b> Place portals in pairs — they auto-link (1&2, 3&4…). A random-colored dotted line connects each linked pair so you can track them. Fighters teleport between linked portals (1s cooldown).</p>
        <p>• <b>Catapults:</b> Touching a catapult sucks a fighter in, locks them briefly, then launches them in the chosen direction (←, →, or ↑). Pick the direction with the DIR buttons before placing.</p>
        <p>• <b>Wind:</b> A wind zone applies a strong burst in the chosen direction (←, →, ↑, ↓). Set the strength with the STR slider. Both fighters and items inside the zone get pushed each frame.</p>
        <p>• <b>Size:</b> Use the W and H sliders to set the size of any hazard before placing it. Click an existing hazard in HAZARD mode to select it (orange box) and resize it live with the sliders.</p>
        <p>• <b>Motion:</b> Turn the MOTION toggle ON to make a hazard travel back and forth. Set the AXIS (←→ / ↑↓), SPD (speed), and RNG (travel range). Works on Fire, Electric, Water, Wind, and Catapult zones. A dashed line shows the travel path.</p>
        <p>• <b>MOVE mode:</b> Click and drag any hazard, item, or platform to reposition it. Hazards keep their size, motion, and settings when moved.</p>
        <p>• <b>Anti-Gravity material:</b> A semi-transparent field that reverses gravity while a fighter is inside it — they float upward gently. Place it as a platform with the Anti-Grav material selected.</p>
        <p>• <b>ITEM mode:</b> Pick a knockback object type (Heavy, Light, Bouncing, Breakable, Boomerang) and click the canvas to place it. Objects can be hit by attacks to knock them into opponents. Use REMOVE mode to delete placed items.</p>
      </div>
        </>
      )}
    </div>
  );
}

function StageThumbnail({ stage, renderFn }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    renderFn(ctx, stage, 240, 135);
  }, [stage, renderFn]);
  return <canvas ref={ref} width={240} height={135} className="rounded-lg border border-border w-full" style={{ aspectRatio: '16 / 9' }} />;
}
