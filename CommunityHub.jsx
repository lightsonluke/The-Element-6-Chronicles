import db from './localBackend';

import React, { useState, useEffect, useRef } from 'react';

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { EMOTES, drawEmote } from './emotes.js';
import { drawStickman } from './renderer.js';
import { getCharLevelData } from './elements.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import CommunityCampaignBrowser from './CommunityCampaignBrowser.jsx';
import EquipOverlay from './EquipOverlay.jsx';
import HubServerBrowser from './HubServerBrowser.jsx';
import FlyerBoard from './FlyerBoard.jsx';
import PlayerProfileModal from './PlayerProfileModal.jsx';
import TradeGiftModal from './TradeGiftModal.jsx';
import OnlineUsersModal from './OnlineUsersModal.jsx';
import TradesGiftsPanel from './TradesGiftsPanel.jsx';
import TradeOfferModal from './TradeOfferModal.jsx';
import HubChat from './HubChat.jsx';
import PartyPanel from './PartyPanel.jsx';
import GameIcon from "./GameIcon.jsx";

const HUB_ROOM_NAME = 'Community Hub';
const HUB_GROUND_Y = 340; // canvas is 420 tall — player stands fully visible, no jump needed
const BOARD_PLATFORM_Y = HUB_GROUND_Y - 70; // elevated platform for bulletin boards — above player head
const HUB_WIDTH = 2400;

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// 20 ornate bulletin boards placed across the map
const BULLETIN_BOARDS = Array.from({ length: 20 }, (_, i) => ({ x: 150 + i * 115, id: i }));
// 10 stone statues
const STATUES = Array.from({ length: 10 }, (_, i) => ({
  x: 207 + i * 230,
  name: ['Hero', 'Guardian', 'Champion', 'Legend', 'Master', 'Rival', 'Pioneer', 'Spirit', 'Knight', 'Sage'][i],
  color: ['#FFD700', '#44ccff', '#ff66aa', '#66ff66', '#ff8844'][i % 5],
}));

// Static developer bulletins (one per board if no live flyers available)
const DEV_BULLETINS = [
  'Welcome to the Community Hub!',
  'v2 Patch — World Mode removed.',
  'Stage Editor: moving platforms added.',
  'Controller support is live.',
  'Weekly Saturday tournaments.',
  'New cosmetics in the Shop.',
  'Creator Mode campaigns now shared.',
  'Community Flyers — post your own.',
  'Ranked season resets monthly.',
  'Sandbox mode for pure fun.',
  'Leaderboard Hall updated daily.',
  'Trading & gifting enabled.',
  'Report toxic flyers to moderate.',
  'Equip cosmetics from the Hub.',
  'Invite friends to your server.',
  'Sports modes: soccer & more.',
  'Custom stages share globally.',
  'Battle Pass season active.',
  'Save codes back up progress.',
  'element6.app — thanks for playing!',
];

function computeTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 20 || h < 5) return 'night';
  if (h >= 17) return 'sunset';
  if (h < 8) return 'dawn';
  return 'day';
}

// Split City night skyline — matches the attached reference image
const SKY = {
  day:    ['#2a3a6a', '#1a2050', '#0a0a2e'],
  sunset: ['#ff5e3a', '#5a2060', '#1a0a2e'],
  dawn:   ['#3a4a8a', '#1a1a3a', '#0a0a1e'],
  night:  ['#1a1a33', '#0a0a2a', '#050510'],
};

export default function CommunityHub({ progress, userProfile, customCharsData = {}, onBack, onNavigate, onOpenServers, onPlayCampaign, onEquipPatch, onTransfer, onDownloadStage, serverCode = 'default' }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ px: HUB_WIDTH / 2, py: HUB_GROUND_Y, vy: 0, grounded: true, facing: 1, cam: 0, frame: 0, emote: null, emoteT: 0, emoteMaxT: 0 });
  const keysRef = useRef({});
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(userProfile?.username || 'Player');
  const [title, setTitle] = useState(userProfile?.title || '');
  const [favId, setFavId] = useState(progress?.favoriteId || 'yellow');
  const [players, setPlayers] = useState([]);
  const [room, setRoom] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showEquip, setShowEquip] = useState(false);
  const [showServers, setShowServers] = useState(false);
  const [showFlyers, setShowFlyers] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [tradePeer, setTradePeer] = useState(null);
  const [giftPeer, setGiftPeer] = useState(null);
  const [showTradesGifts, setShowTradesGifts] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParty, setShowParty] = useState(false);
  const [party, setParty] = useState(null);
  const [partyInviteToast, setPartyInviteToast] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState(computeTimeOfDay());
  const [clock, setClock] = useState('');
  const [hoverBoard, setHoverBoard] = useState(null);
  const [flyers, setFlyers] = useState([]);
  const [joinToast, setJoinToast] = useState(null);
  const presenceId = useRef(null);
  const playersRef = useRef([]);
  playersRef.current = players;
  const prevPlayerIds = useRef(new Set());
  const roomRef = useRef(null);
  const playerRenderX = useRef({});

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  // Real-world time clock
  useEffect(() => {
    const tick = () => { setTimeOfDay(computeTimeOfDay()); setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  // Load user + account stats for HUD
  const [stats, setStats] = useState({ xp: 0, wins: 0, kos: 0, rank: '—' });
  useEffect(() => {
    db.auth.me().then(async (u) => {
      setUserId(u.id);
      setUsername(u.username || (u.full_name || (u.email || 'Player')).split('@')[0]);
      setTitle(u.profile_title || '');
      try {
        const entries = await db.entities.LeaderboardEntry.filter({ user_id: u.id });
        if (entries[0]) {
          const e = entries[0];
          const rank = e.total_xp > 10000 ? 'Elite' : e.total_xp > 5000 ? 'Platinum' : e.total_xp > 2000 ? 'Gold' : e.total_xp > 500 ? 'Silver' : 'Bronze';
          setStats({ xp: e.total_xp || 0, wins: e.wins || 0, kos: e.combat_kills || 0, rank });
        }
      } catch {}
    }).catch(() => {});
  }, []);

  // Load community flyers to display on boards
  useEffect(() => {
    const load = async () => {
      try { const list = await db.entities.Flyer.filter({ hidden: false }, '-created_date', 120); setFlyers(list || []); } catch {}
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  // Presence-based hub multiplayer — each player writes ONLY their own record.
  // This eliminates the race condition where two players overwrite each other's
  // position data in a shared CustomRoom (the teleporting bug).
  // Other players are discovered by filtering Presence records by hub_server.

  const charColor = (() => {
    const c = customCharsData[favId] || ALL.find(c => c.id === favId) || HEROES[0];
    return c.color || '#FFD700';
  })();
  const charSecondary = (() => {
    const c = customCharsData[favId] || ALL.find(c => c.id === favId) || HEROES[0];
    return c.secondary_color || c.color || '#333333';
  })();
  const equippedSkin = progress?.equippedSkins?.[favId];
  const equippedAcc = progress?.equippedAccessories?.[favId];

  // Hub multiplayer via Presence — creates/updates own record, subscribes to others
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let unsub = null;
    let tickTimer = null;

    (async () => {
      try {
        // Create or update our Presence record with hub data
        const existing = await db.entities.Presence.filter({ user_id: userId });
        const now = new Date().toISOString();
        const hubData = {
          last_active: now,
          username,
          hub_server: serverCode,
          hub_x: HUB_WIDTH / 2,
          hub_y: HUB_GROUND_Y,
          hub_facing: 1,
          hub_frame: 0,
          hub_char_id: favId,
          hub_color: charColor,
          hub_title: title,
          hub_skin: equippedSkin || null,
          hub_acc: equippedAcc || null,
          hub_killfx: progress?.equippedKillFX || 'none',
          hub_emote: null,
          hub_emote_t: 0,
          hub_level: getCharLevelData(progress, favId)?.level || 1,
        };
        if (existing[0]) {
          presenceId.current = existing[0].id;
          await db.entities.Presence.update(existing[0].id, hubData);
        } else {
          const rec = await db.entities.Presence.create({ user_id: userId, ...hubData });
          presenceId.current = rec.id;
        }
        if (cancelled) return;

        // Initial load of other players in this server
        const loadPlayers = async () => {
          try {
            const all = await db.entities.Presence.filter({ hub_server: serverCode }, '-last_active', 50);
            const cutoff = Date.now() - 120000; // 2 min stale cutoff
            const others = (all || []).filter(p => p.user_id !== userId && p.last_active && new Date(p.last_active).getTime() > cutoff);
            setPlayers(others.map(p => ({
              id: p.user_id,
              name: p.username || 'Player',
              color: p.hub_color || '#88ff88',
              charId: p.hub_char_id || 'yellow',
              title: p.hub_title || '',
              x: p.hub_x || 200,
              skin: p.hub_skin || null,
              acc: p.hub_acc || null,
              killfx: p.hub_killfx || 'none',
              emote: p.hub_emote || null,
              emoteT: p.hub_emote_t || 0,
              level: p.hub_level || 1,
            })));
            // Build a pseudo room for TradesGiftsPanel
            setRoom({ id: serverCode, players: others.map(p => ({ id: p.user_id, name: p.username, color: p.hub_color, charId: p.hub_char_id })) });
          } catch {}
        };
        await loadPlayers();

        // Detect new joiners
        const initialIds = new Set(playersRef.current.map(p => p.id));
        prevPlayerIds.current = initialIds;

        // Subscribe to Presence changes
        unsub = db.entities.Presence.subscribe((ev) => {
          loadPlayers();
          // Check for new joiners
          const currentIds = new Set(playersRef.current.map(p => p.id));
          const newJoiners = playersRef.current.filter(p => !prevPlayerIds.current.has(p.id));
          if (newJoiners.length > 0) {
            newJoiners.forEach(p => {
              setJoinToast({ name: p.name || 'A player', text: 'joined the Hub' });
              sfx.notification();
              setTimeout(() => setJoinToast(null), 3500);
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                try { new Notification('Element 6 Hub', { body: `${p.name || 'A player'} joined the Community Hub` }); } catch {}
              }
            });
          }
          prevPlayerIds.current = currentIds;
        });

        // Tick: update our position/emote/equips every 250ms (NO race condition — only our record)
        tickTimer = setInterval(async () => {
          const st = stateRef.current;
          try {
            if (presenceId.current) {
              await db.entities.Presence.update(presenceId.current, {
                hub_x: st.px,
                hub_y: st.py,
                hub_facing: st.facing,
                hub_frame: st.frame,
                hub_emote: st.emote || null,
                hub_emote_t: st.emoteT || 0,
                last_active: new Date().toISOString(),
                hub_char_id: favId,
                hub_color: charColor,
                hub_title: title,
                hub_skin: equippedSkin || null,
                hub_acc: equippedAcc || null,
                hub_killfx: progress?.equippedKillFX || 'none',
                hub_level: getCharLevelData(progress, favId)?.level || 1,
                });
            }
          } catch {}
        }, 250);

        // Cleanup on leave — clear hub fields so we disappear from the hub
        const clearHub = async () => {
          try {
            if (presenceId.current) {
              await db.entities.Presence.update(presenceId.current, {
                hub_server: null,
                hub_emote: null,
                hub_emote_t: 0,
                last_active: new Date().toISOString(),
              });
            }
          } catch {}
        };
        roomRef.current = { id: serverCode, removeSelf: clearHub };
        const onLeave = () => clearHub();
        const onVis = () => { if (document.visibilityState === 'hidden') clearHub(); };
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('pagehide', onLeave);
        window.addEventListener('beforeunload', onLeave);

        return () => {
          unsub?.(); clearInterval(tickTimer);
          document.removeEventListener('visibilitychange', onVis);
          window.removeEventListener('pagehide', onLeave);
          window.removeEventListener('beforeunload', onLeave);
          clearHub();
        };
      } catch (e) {}
    })();

    return () => {
      cancelled = true;
      unsub?.();
      if (tickTimer) clearInterval(tickTimer);
    };
  }, [userId, serverCode]);

  // Poll for party invites
  useEffect(() => {
    if (!userId) return;
    let seenIds = new Set();
    const poll = async () => {
      try {
        const invites = await db.entities.PartyInvite.filter({ to_user_id: userId, status: 'pending' });
        const fresh = (invites || []).find(i => !seenIds.has(i.id));
        if (fresh) {
          seenIds.add(fresh.id);
          setPartyInviteToast(fresh);
          sfx.notification();
        }
        // Check accepted invites
        const accepted = await db.entities.PartyInvite.filter({ from_user_id: userId, status: 'accepted' });
        const freshAccepted = (accepted || []).find(i => !seenIds.has(`a_${i.id}`));
        if (freshAccepted) {
          seenIds.add(`a_${freshAccepted.id}`);
          setJoinToast({ name: freshAccepted.to_username || 'Player', text: 'joined your party!' });
          sfx.notification();
          setTimeout(() => setJoinToast(null), 3500);
        }
      } catch {}
    };
    poll();
    const t = setInterval(poll, 6000);
    return () => clearInterval(t);
  }, [userId]);

  // Track party membership
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const list = await db.entities.Party.filter({});
        const mine = (list || []).filter(p => (p.member_ids || []).includes(userId));
        setParty(mine[0] || null);
      } catch {}
    };
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [userId]);

  // Request notification permission once
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch {}
    }
  }, []);

  // Input
  useEffect(() => {
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (e.key >= '1' && e.key <= '5') {
        const em = EMOTES.find(m => m.key === e.key) || EMOTES[parseInt(e.key) - 1];
        if (em) { stateRef.current.emote = em.id; stateRef.current.emoteT = em.duration; stateRef.current.emoteMaxT = em.duration; sfx.click(); }
      }
      if (k === 'escape') { setSelectedPlayer(null); }
    };
    const ku = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  // ── Split City night skyline drawing ──
  const drawSky = (ctx, c) => {
    const cols = SKY[timeOfDay] || SKY.night;
    const g = ctx.createLinearGradient(0, 0, 0, HUB_GROUND_Y + 40);
    g.addColorStop(0, cols[0]); g.addColorStop(0.55, cols[1]); g.addColorStop(1, cols[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    // moon (night/sunset/dawn)
    if (timeOfDay !== 'day') {
      ctx.save();
      ctx.globalAlpha = 0.9;
      const mx = c.width - 90, my = 70;
      const mg = ctx.createRadialGradient(mx, my, 8, mx, my, 40);
      mg.addColorStop(0, '#fffbe0'); mg.addColorStop(0.4, '#fff8d0'); mg.addColorStop(1, 'rgba(255,248,208,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 40, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(mx, my, 16, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // stars (twinkling)
    if (timeOfDay === 'night' || timeOfDay === 'dawn') {
      for (let i = 0; i < 60; i++) {
        const x = (i * 97) % c.width, y = (i * 53) % (HUB_GROUND_Y * 0.5);
        const tw = 0.4 + Math.sin(stateRef.current.frame * 0.05 + i) * 0.3;
        ctx.globalAlpha = Math.max(0.1, tw);
        ctx.fillStyle = i % 7 === 0 ? '#aaccff' : '#fff';
        ctx.beginPath(); ctx.arc(x, y, i % 6 === 0 ? 1.6 : 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // soft clouds
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 320 - stateRef.current.cam * 0.15) % (c.width + 200)) - 100;
      const cy = 60 + (i % 2) * 40;
      ctx.beginPath(); ctx.ellipse(cx, cy, 90, 18, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  // City skyline silhouette with glowing windows — parallax
  const drawCity = (ctx, c, cam) => {
    const baseY = HUB_GROUND_Y + 8;
    const parallax = cam * 0.4;
    // far buildings
    for (let i = 0; i < 14; i++) {
      const w = 70 + (i % 3) * 30; const h = 60 + (i * 23) % 90;
      const x = i * 95 - parallax;
      const sx = ((x % (c.width + 200)) + c.width + 200) % (c.width + 200) - 100;
      ctx.fillStyle = timeOfDay === 'night' ? '#0a0a1a' : timeOfDay === 'sunset' ? '#2a1040' : '#1a1a3a';
      ctx.fillRect(sx, baseY - h, w, h);
      // windows
      for (let wy = 6; wy < h - 8; wy += 12) {
        for (let wx = 5; wx < w - 8; wx += 12) {
          if ((wx + wy + i) % 3 === 0) {
            ctx.fillStyle = (wy + i) % 4 === 0 ? '#ffd700' : '#6a5acd';
            ctx.globalAlpha = 0.85; ctx.fillRect(sx + wx, baseY - h + wy, 4, 6);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  };

  // Floating translucent platforms (Split City signature)
  const drawPlatforms = (ctx, c, cam) => {
    const plats = [
      { x: 180, y: HUB_GROUND_Y - 70, w: 140 },
      { x: 520, y: HUB_GROUND_Y - 110, w: 120 },
      { x: 860, y: HUB_GROUND_Y - 80, w: 150 },
      { x: 1240, y: HUB_GROUND_Y - 120, w: 130 },
    ];
    plats.forEach((p, i) => {
      const sx = p.x - (cam * 0.6) + i * 20;
      const wrap = ((sx % (c.width + 300)) + c.width + 300) % (c.width + 300) - 150;
      ctx.fillStyle = 'rgba(46,58,95,0.7)';
      ctx.beginPath();
      const r = 8;
      ctx.moveTo(wrap, p.y + r);
      ctx.arcTo(wrap, p.y, wrap + r, p.y, r);
      ctx.arcTo(wrap + p.w, p.y, wrap + p.w, p.y + r, r);
      ctx.arcTo(wrap + p.w, p.y + r * 2, wrap + p.w - r, p.y + r * 2, r);
      ctx.arcTo(wrap, p.y + r * 2, wrap, p.y + r, r);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,140,200,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    });
  };

  // Walking plane — cobblestone path that scrolls with the world (camera offset)
  const drawGround = (ctx, c) => {
    const top = HUB_GROUND_Y;
    const cam = stateRef.current.cam;
    // main surface gradient
    const g = ctx.createLinearGradient(0, top, 0, c.height);
    g.addColorStop(0, '#c0c0c0');
    g.addColorStop(0.15, '#8a8a98');
    g.addColorStop(0.6, '#3a3a4a');
    g.addColorStop(1, '#15151f');
    ctx.fillStyle = g; ctx.fillRect(0, top, c.width, c.height - top);
    // top edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(c.width, top); ctx.stroke();
    // cobblestones — scroll with camera so the ground is part of the world
    const stone = 26;
    const camMod = cam % stone;
    for (let y = top + 4; y < c.height; y += stone) {
      const rowOffset = (Math.floor(y / stone) % 2) * (stone / 2);
      for (let x = -stone - camMod - rowOffset; x < c.width + stone * 2; x += stone) {
        const worldCol = Math.floor((x + cam) / stone);
        const worldRow = Math.floor(y / stone);
        const shade = 150 + ((worldCol * 7 + worldRow * 13) % 40) - 20;
        ctx.fillStyle = `rgb(${shade},${shade - 4},${shade - 14})`;
        const r = 4;
        const sx = x, sy = y, w = stone - 3, h = stone - 3;
        ctx.beginPath();
        ctx.moveTo(sx + r, sy);
        ctx.arcTo(sx + w, sy, sx + w, sy + r, r);
        ctx.arcTo(sx + w, sy + h, sx + w - r, sy + h, r);
        ctx.arcTo(sx, sy + h, sx, sy + h - r, r);
        ctx.arcTo(sx, sy, sx + r, sy, r);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    // subtle top sheen
    const sheen = ctx.createLinearGradient(0, top, 0, top + 14);
    sheen.addColorStop(0, 'rgba(255,255,255,0.18)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen; ctx.fillRect(0, top, c.width, 14);
  };

  // Ornate wooden bulletin board — maroon frame, gold sword arch, 2x3 grid of flyers, stone base
  // Big enough that the pinned flyer titles are readable without clicking.
  const drawBoard = (ctx, x, cam, idx) => {
    const sx = x - cam; if (sx < -90 || sx > canvasRef.current.width + 90) return;
    const baseY = BOARD_PLATFORM_Y;
    const W = 64, H = 86;
    // stone base
    ctx.fillStyle = '#8d8d8d'; ctx.fillRect(sx - 24, baseY - 14, 48, 14);
    ctx.fillStyle = '#6e6e6e'; ctx.fillRect(sx - 24, baseY - 14, 48, 4);
    // posts
    ctx.fillStyle = '#3a1a1a'; ctx.fillRect(sx - 20, baseY - 10 - H, 6, H - 4); ctx.fillRect(sx + 14, baseY - 10 - H, 6, H - 4);
    // maroon frame with carved arch
    const frameGrad = ctx.createLinearGradient(0, baseY - 10 - H, 0, baseY - 10);
    frameGrad.addColorStop(0, '#a02828'); frameGrad.addColorStop(1, '#601818');
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.moveTo(sx - W / 2, baseY - 10 - H);
    ctx.lineTo(sx - W / 2, baseY - 10 - H + 22);
    ctx.quadraticCurveTo(sx, baseY - 10 - H - 14, sx + W / 2, baseY - 10 - H + 22);
    ctx.lineTo(sx + W / 2, baseY - 10 - H);
    ctx.closePath(); ctx.fill();
    // wood grain
    ctx.strokeStyle = 'rgba(60,10,10,0.4)'; ctx.lineWidth = 0.6;
    for (let g = 0; g < 4; g++) { ctx.beginPath(); ctx.moveTo(sx - W / 2 + 4, baseY - 10 - H + g * (H / 4)); ctx.lineTo(sx + W / 2 - 4, baseY - 10 - H + g * (H / 4)); ctx.stroke(); }
    // frame outline
    ctx.strokeStyle = '#3a0808'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - W / 2, baseY - 10 - H);
    ctx.lineTo(sx - W / 2, baseY - 10 - H + 22);
    ctx.quadraticCurveTo(sx, baseY - 10 - H - 14, sx + W / 2, baseY - 10 - H + 22);
    ctx.lineTo(sx + W / 2, baseY - 10 - H);
    ctx.stroke();
    // gold sword in arch with glow
    ctx.shadowColor = '#FFC107'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#FFC107'; ctx.font = '14px serif'; ctx.textAlign = 'center';
    ctx.fillText('⚔', sx, baseY - 10 - H + 16);
    ctx.shadowBlur = 0;
    // cork interior
    const corkGrad = ctx.createLinearGradient(0, baseY - 10 - H + 24, 0, baseY - 10);
    corkGrad.addColorStop(0, '#ead4b4'); corkGrad.addColorStop(1, '#d6bf9a');
    ctx.fillStyle = corkGrad; ctx.fillRect(sx - W / 2 + 4, baseY - 10 - H + 24, W - 8, H - 28);
    ctx.strokeStyle = '#3a0808'; ctx.lineWidth = 1.5; ctx.strokeRect(sx - W / 2 + 4, baseY - 10 - H + 24, W - 8, H - 28);
    // inner shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(sx - W / 2 + 4, baseY - 10 - H + 24, W - 8, 4);
    // 2x3 grid of pinned flyers — show actual flyer titles (truncated) so they're readable
    const boardFlyers = flyers.slice(idx * 6, idx * 6 + 6);
    const cols = 2, rows = 3;
    const cellW = (W - 12) / cols, cellH = (H - 32) / rows;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const fx = sx - W / 2 + 6 + col * cellW;
        const fy = baseY - 10 - H + 26 + r * cellH;
        ctx.fillStyle = '#fff'; ctx.fillRect(fx + 1, fy + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = '#bbb'; ctx.lineWidth = 0.5; ctx.strokeRect(fx + 1, fy + 1, cellW - 2, cellH - 2);
        // pin
        ctx.fillStyle = '#cc1010'; ctx.beginPath(); ctx.arc(fx + cellW / 2, fy + 3, 1.5, 0, Math.PI * 2); ctx.fill();
        // flyer text
        const f = boardFlyers[r * cols + col];
        if (f) {
          ctx.fillStyle = '#222'; ctx.font = '4px Rajdhani'; ctx.textAlign = 'center';
          const t = (f.title || '').slice(0, 14);
          ctx.fillText(t, fx + cellW / 2, fy + cellH / 2 + 1);
        } else if (idx < DEV_BULLETINS.length) {
          ctx.fillStyle = '#666'; ctx.font = '4px Rajdhani'; ctx.textAlign = 'center';
          const t = DEV_BULLETINS[idx].slice(0, 14);
          ctx.fillText(t, fx + cellW / 2, fy + cellH / 2 + 1);
        }
      }
    }
    // hover glow
    if (hoverBoard === idx) { ctx.strokeStyle = '#FFC107'; ctx.lineWidth = 2; ctx.strokeRect(sx - W / 2 - 2, baseY - 10 - H - 2, W + 4, H + 4); }
  };

  // Uses the EXACT same drawStickman from renderer.js that story mode and fights use.
  // Draws aura + ground pool, then the character body, then a rounded nametag
  // showing char name + level ABOVE the username, then emote as a speech bubble.
  const drawHubChar = (ctx, x, y, color, facing, frame, walking, username, charName, charLevel, opts = {}) => {
    const { statue = false, emote = null, emoteT = 0, emoteMaxT = 0, charData = null } = opts;
    const drawColor = statue ? '#b0b0b0' : color;

    // ── ground light pool + aura ──
    ctx.save();
    ctx.globalAlpha = statue ? 0.1 : 0.3 + Math.sin(frame * 0.1) * 0.08;
    const pool = ctx.createRadialGradient(x, y, 2, x, y, 28);
    pool.addColorStop(0, color);
    pool.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pool;
    ctx.beginPath(); ctx.ellipse(x, y, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (!statue) {
      ctx.save();
      ctx.globalAlpha = 0.15 + Math.sin(frame * 0.08) * 0.05;
      const ag = ctx.createRadialGradient(x, y - 30, 4, x, y - 30, 40);
      ag.addColorStop(0, color); ag.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.arc(x, y - 30, 40, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // ── character body (exact same as story mode / fights) ──
    drawStickman(ctx, x, y, drawColor, facing, frame, 0.72, false, walking ? 'moving' : 'idle', charData || { color: drawColor, name: charName }, null, true);

    // ── nametag: char name + level ABOVE username ──
    if (username || charName) {
      ctx.textAlign = 'center';
      const charLabel = charLevel > 0 ? `${charName} Lv.${charLevel}` : charName;
      ctx.font = 'bold 10px Orbitron';
      const charW = ctx.measureText(charLabel).width + 14;
      ctx.font = 'bold 11px Orbitron';
      const userW = username ? ctx.measureText(username).width + 14 : 0;
      const tagW = Math.max(charW, userW);
      const tagH = (username ? 30 : 15);
      const tagY = y - 108;
      const tagX = x - tagW / 2;

      // Background pill
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      roundRect(ctx, tagX, tagY, tagW, tagH, 8); ctx.fill();

      // Char name + level (top line, colored)
      ctx.fillStyle = color;
      ctx.font = 'bold 10px Orbitron';
      ctx.fillText(charLabel, x, tagY + 11);

      // Username (bottom line, white)
      if (username) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Orbitron';
        ctx.fillText(username, x, tagY + 25);
      }
    }

    // ── emote as speech bubble with emoji ──
    if (emote && emoteT > 0) {
      drawEmote(ctx, x, y - 55, emote, emoteT, emoteMaxT, frame);
    }
    ctx.textAlign = 'left';
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // Continuous elevated platform that holds all bulletin boards — above player head
  const drawBoardPlatform = (ctx, c, cam) => {
    const top = BOARD_PLATFORM_Y;
    // platform surface — wooden plank running the full map width
    const g = ctx.createLinearGradient(0, top, 0, top + 16);
    g.addColorStop(0, '#6a4a2a'); g.addColorStop(0.5, '#5a3a20'); g.addColorStop(1, '#3a2010');
    ctx.fillStyle = g;
    const stone = 48;
    const camMod = cam % stone;
    for (let x = -stone - camMod; x < c.width + stone; x += stone) {
      ctx.fillRect(x, top, stone - 2, 14);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(x, top, stone - 2, 14);
      // wood grain
      ctx.strokeStyle = 'rgba(100,60,20,0.4)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x + 2, top + 4); ctx.lineTo(x + stone - 4, top + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 2, top + 9); ctx.lineTo(x + stone - 4, top + 9); ctx.stroke();
    }
    // top highlight
    ctx.strokeStyle = 'rgba(255,200,120,0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(c.width, top); ctx.stroke();
    // support posts every 200px
    for (let i = 0; i < HUB_WIDTH / 200; i++) {
      const px = i * 200 - cam;
      if (px < -20 || px > c.width + 20) continue;
      ctx.fillStyle = '#3a2410';
      ctx.fillRect(px - 3, top + 14, 6, HUB_GROUND_Y - top - 14);
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(px - 3, top + 14, 2, HUB_GROUND_Y - top - 14);
    }
  };

  // Stone statue — same drawStickman design but grey, on a pedestal
  const drawStatue = (ctx, x, cam, st) => {
    const sx = x - cam; if (sx < -60 || sx > canvasRef.current.width + 60) return;
    const baseY = HUB_GROUND_Y;
    // pedestal
    ctx.fillStyle = '#8a8a92'; roundRect(ctx, sx - 18, baseY - 26, 36, 26, 4); ctx.fill();
    ctx.fillStyle = '#6a6a72'; ctx.fillRect(sx - 18, baseY - 26, 36, 4);
    ctx.strokeStyle = '#5a5a62'; ctx.lineWidth = 1; ctx.strokeRect(sx - 18, baseY - 26, 36, 26);
    // fighter statue — same body as live players, grey
    drawHubChar(ctx, sx, baseY - 26, st.color, 1, 0, false, null, st.name, 0, { statue: true, charData: { color: '#b0b0b0', name: st.name } });
    // plaque
    ctx.fillStyle = '#FFC107'; ctx.font = '7px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(st.name, sx, baseY - 30); ctx.textAlign = 'left';
  };

  // Render loop
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    let raf = true, last = performance.now();
    const loop = (t) => {
      if (!raf) return;
      const dt = Math.min((t - last) / 1000, 0.05); last = t;
      const s = stateRef.current;
      s.frame++;
      const left = keysRef.current['a'] || keysRef.current['arrowleft'];
      const right = keysRef.current['d'] || keysRef.current['arrowright'];
      const jump = keysRef.current[' '] || keysRef.current['w'] || keysRef.current['arrowup'];
      const speed = 4.5;
      if (left) { s.px -= speed * (dt * 60); s.facing = -1; }
      if (right) { s.px += speed * (dt * 60); s.facing = 1; }
      s.px = Math.max(40, Math.min(HUB_WIDTH - 40, s.px));
      if (jump && s.grounded) { s.vy = -12; s.grounded = false; sfx.jump(); }
      s.vy += 0.6; s.py += s.vy;
      if (s.py >= HUB_GROUND_Y) { s.py = HUB_GROUND_Y; s.vy = 0; s.grounded = true; }
      if (s.emoteT > 0) s.emoteT--; else s.emote = null;
      s.cam = Math.max(0, Math.min(HUB_WIDTH - 800, s.px - 400));

      drawSky(ctx, c);
      drawCity(ctx, c, s.cam);
      drawPlatforms(ctx, c, s.cam);
      drawGround(ctx, c);
      drawBoardPlatform(ctx, c, s.cam);
      STATUES.forEach(st => drawStatue(ctx, st.x, s.cam, st));
      BULLETIN_BOARDS.forEach(b => drawBoard(ctx, b.x, s.cam, b.id));
      // Clean up stale renderX entries for players no longer present
      const currentIds = new Set(playersRef.current.map(p => p.id));
      Object.keys(playerRenderX.current).forEach(id => { if (!currentIds.has(id)) delete playerRenderX.current[id]; });
      // other players — interpolated positions + walking animation + shared frame
      playersRef.current.forEach((p) => {
        const targetX = p.x || 200;
        const prevRX = playerRenderX.current[p.id] ?? targetX;
        const dx = targetX - prevRX;
        // Snap if too far (prevents walk-back / teleport effect from stale data)
        const renderX = Math.abs(dx) > 60 ? targetX : prevRX + dx * 0.4;
        playerRenderX.current[p.id] = renderX;
        const walking = Math.abs(targetX - prevRX) > 0.8;
        const x = renderX - s.cam; if (x < -50 || x > c.width + 50) return;
        const pc = ALL.find(ch => ch.id === p.charId) || customCharsData[p.charId] || { color: p.color || '#88ff88', name: p.charId };
        const pLevel = p.level || 1;
        const pFacing = (targetX - prevRX) > 0 ? 1 : (targetX - prevRX) < -0.1 ? -1 : 1;
        drawHubChar(ctx, x, HUB_GROUND_Y, pc.color || p.color, pFacing, s.frame, walking, p.name, pc.name || p.charId, pLevel, { charData: pc, emote: p.emote, emoteT: p.emoteT, emoteMaxT: 80 });
      });
      // self
      const selfChar = ALL.find(c => c.id === favId) || customCharsData[favId] || { color: charColor, name: favId };
      const selfLevel = getCharLevelData(progress, favId)?.level || 1;
      drawHubChar(ctx, s.px - s.cam, s.py, charColor, s.facing, s.frame, (left || right), username, selfChar.name || favId, selfLevel, { emote: s.emote, emoteT: s.emoteT, emoteMaxT: s.emoteMaxT, charData: selfChar });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { raf = false; };
  }, [timeOfDay, userId, charColor, charSecondary, hoverBoard, flyers]);

  const favLabel = () => { const ch = ALL.find(c => c.id === favId) || customCharsData[favId]; return ch?.name || favId; };

  const refreshHub = async () => {
    sfx.click();
    // Re-fetch flyers immediately
    try { const list = await db.entities.Flyer.filter({ hidden: false }, '-created_date', 120); setFlyers(list || []); } catch {}
    // Update our presence to stay active
    try {
      if (presenceId.current) {
        await db.entities.Presence.update(presenceId.current, { last_active: new Date().toISOString(), hub_server: serverCode });
      }
    } catch {}
  };

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (800 / rect.width);
    const cy = (e.clientY - rect.top) * (420 / rect.height);
    for (const b of BULLETIN_BOARDS) {
      const x = b.x - stateRef.current.cam;
      if (Math.abs(cx - x) < 34 && cy > BOARD_PLATFORM_Y - 100 && cy < BOARD_PLATFORM_Y) { setShowFlyers(true); sfx.click(); return; }
    }
    for (const p of players) {
      const x = (p.x || 200) - stateRef.current.cam;
      if (Math.abs(cx - x) < 30 && Math.abs(cy - (HUB_GROUND_Y - 30)) < 50) { setSelectedPlayer({ ...p, username: p.name, onTrade: true, onGift: true }); sfx.click(); return; }
    }
  };

  const handleMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (800 / rect.width);
    const cy = (e.clientY - rect.top) * (420 / rect.height);
    let h = null;
    for (const b of BULLETIN_BOARDS) {
      const x = b.x - stateRef.current.cam;
      if (Math.abs(cx - x) < 34 && cy > BOARD_PLATFORM_Y - 100 && cy < BOARD_PLATFORM_Y) { h = b.id; break; }
    }
    setHoverBoard(h);
  };

  if (showCampaigns) {
    return <CommunityCampaignBrowser onBack={() => setShowCampaigns(false)} onPlay={onPlayCampaign} />;
  }

  return (
    <div className="w-full max-w-5xl flex flex-col gap-2">
      {/* Account stats HUD (replaces the "apples & vigor" from the reference) */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-heading text-accent tracking-wider"><GameIcon emoji="🌐" size={14} /> COMMUNITY HUB <span className="text-xs text-muted-foreground ml-2"><GameIcon emoji="🕐" size={14} /> {clock} · {timeOfDay}</span></h2>
        <div className="flex items-center gap-2 bg-card/80 border border-border rounded-lg px-3 py-1.5 text-[10px] font-heading">
          <span className="text-muted-foreground"><GameIcon emoji="◆" size={14} /> <span className="text-accent">{progress?.coins || 0}</span></span>
          <span className="text-muted-foreground">XP <span className="text-primary">{stats.xp}</span></span>
          <span className="text-muted-foreground">W <span className="text-primary">{stats.wins}</span></span>
          <span className="text-muted-foreground">KO <span className="text-primary">{stats.kos}</span></span>
          <span className="text-muted-foreground">Rank <span className="text-accent">{stats.rank}</span></span>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setShowEquip(true)} className="px-2.5 py-1 bg-primary text-primary-foreground rounded font-heading text-xs"><GameIcon emoji="⚔" size={14} /> EQUIP</button>
        <button onClick={() => setShowCampaigns(true)} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="🏆" size={14} /> CAMPAIGNS</button>
        <button onClick={() => onNavigate?.('leaderboardhall')} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="🌍" size={14} /> LEADERBOARD</button>
        <button onClick={() => setShowFlyers(true)} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="📎" size={14} /> FLYERS</button>
        <button onClick={() => setShowServers(true)} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="🌐" size={14} /> SERVERS</button>
        <button onClick={() => setShowOnlineUsers(true)} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="👥" size={14} /> ONLINE</button>
        <button onClick={refreshHub} className="px-2.5 py-1 bg-primary text-primary-foreground rounded font-heading text-xs"><GameIcon emoji="↻" size={14} /> REFRESH</button>
        <button onClick={() => setShowTradesGifts(true)} className="px-2.5 py-1 bg-primary text-primary-foreground rounded font-heading text-xs"><GameIcon emoji="📦" size={14} /> TRADES</button>
        <button onClick={() => setShowParty(true)} className="px-2.5 py-1 bg-primary text-primary-foreground rounded font-heading text-xs"><GameIcon emoji="👥" size={14} /> PARTY{party ? ` (${(party.member_ids || []).length})` : ''}</button>
        <button onClick={() => setShowChat(true)} className="px-2.5 py-1 bg-primary text-primary-foreground rounded font-heading text-xs"><GameIcon emoji="💬" size={14} /> CHAT</button>
        <button onClick={() => onNavigate?.('friends')} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="👥" size={14} /> FRIENDS</button>
        <button onClick={onBack} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      {/* Matchmaking quick queue — back returns to Hub */}
      <div className="flex gap-1.5 flex-wrap bg-card/60 border border-border rounded-xl px-2 py-1.5">
        <span className="text-[9px] font-heading text-muted-foreground self-center mr-1">QUICK QUEUE:</span>
        <button onClick={() => onNavigate?.('onlineunranked')} className="px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]">ONLINE</button>
        <button onClick={() => onNavigate?.('onlineranked')} className="px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]">RANKED</button>
        <button onClick={() => onNavigate?.('tournament')} className="px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]">TOURNAMENT</button>
        <button onClick={() => onNavigate?.('sports')} className="px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]">SPORTS</button>
        <button onClick={() => onNavigate?.('customrooms')} className="px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]">CUSTOM ROOMS</button>
      </div>

      <canvas ref={canvasRef} width={800} height={420} onClick={handleClick} onMouseMove={handleMove}
        className="w-full rounded-xl border-2 border-border shadow-2xl" style={{ aspectRatio: '800 / 420', cursor: 'pointer' }} />

      <div className="flex justify-between items-center flex-wrap gap-2 bg-card/60 border border-border rounded-xl px-3 py-1.5 text-[10px]">
        <div className="flex gap-3 font-heading text-muted-foreground"><span>A/D <GameIcon emoji="←" size={14} /> Move</span><span>Space/W Jump</span><span>1-5 Emote</span><span>Click a board to read · Click a player to interact</span></div>
        <div className="font-heading text-muted-foreground">Players here: <span className="text-foreground">{(players || []).length + 1}</span></div>
      </div>

      {joinToast && (
        <div className="fixed top-16 right-4 z-50 bg-card border-2 border-primary rounded-lg px-4 py-3 shadow-2xl max-w-xs animate-pulse">
          <p className="text-[10px] font-heading text-primary"><GameIcon emoji="🌐" size={14} /> PLAYER JOINED</p>
          <p className="text-xs font-body text-foreground"><span className="text-accent font-heading">{joinToast.name}</span> {joinToast.text}</p>
        </div>
      )}

      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          me={{ id: userId, name: username }}
          onClose={(kind, p) => {
            setSelectedPlayer(null);
            if (kind === 'trade') setTradePeer({ ...p, name: p.username || p.name, offer: null });
            else if (kind === 'gift') setGiftPeer({ ...p, name: p.username || p.name });
          }}
          onPlayCampaign={onPlayCampaign}
          onDownloadStage={onDownloadStage}
        />
      )}

      {showEquip && (
        <EquipOverlay progress={progress} customCharsData={customCharsData}
          onApply={(patch) => onEquipPatch?.(patch)}
          onClose={() => setShowEquip(false)} />
      )}

      {showFlyers && <FlyerBoard onBack={() => setShowFlyers(false)} />}

      {showServers && (
        <HubServerBrowser username={username} charColor={charColor} charName={favId} charId={favId}
          onJoin={() => {}} onLeft={() => {}} onClose={() => setShowServers(false)} />
      )}

      {showOnlineUsers && <OnlineUsersModal onClose={() => setShowOnlineUsers(false)} />}

      {showTradesGifts && (
        <TradesGiftsPanel
          userId={userId} username={username} progress={progress} room={room}
          onTrade={(peer) => { setTradePeer({ ...peer, name: peer.username || peer.name }); }}
          onGift={(peer) => { setGiftPeer({ ...peer, name: peer.username || peer.name }); }}
          onClose={() => setShowTradesGifts(false)}
        />
      )}

      {tradePeer && (
        <TradeOfferModal mode="trade" peer={tradePeer} progress={progress} userId={userId} username={username}
          onConfirm={(data) => { onTransfer?.({ ...data, to: tradePeer.id, kind: 'trade' }); setTradePeer(null); }}
          onClose={() => setTradePeer(null)} />
      )}

      {giftPeer && (
        <TradeGiftModal mode="gift" peerName={giftPeer.name} progress={progress}
          onConfirm={(data) => { onTransfer?.({ ...data, to: giftPeer.id, kind: 'gift', peerName: giftPeer.name }); setGiftPeer(null); }}
          onClose={() => setGiftPeer(null)} />
      )}

      {showChat && (
        <HubChat
          userId={userId} username={username} serverCode={serverCode}
          partyId={party?.id} partyName={party?.name}
          onClose={() => setShowChat(false)}
        />
      )}

      {showParty && (
        <PartyPanel
          userId={userId} username={username} serverCode={serverCode}
          hubPlayers={players.map(p => ({ id: p.id, name: p.name, username: p.name }))}
          onClose={() => setShowParty(false)}
        />
      )}

      {partyInviteToast && (
        <div className="fixed top-72 right-4 z-50 bg-card border-2 border-primary rounded-lg px-4 py-3 shadow-2xl max-w-xs">
          <p className="text-[10px] font-heading text-primary"><GameIcon emoji="👥" size={14} /> PARTY INVITE</p>
          <p className="text-xs font-body text-foreground mb-2"><span className="text-accent font-heading">{partyInviteToast.from_username}</span> invited you to <span className="text-primary font-heading">{partyInviteToast.party_name}</span></p>
          <div className="flex gap-2">
            <button onClick={async () => {
              try {
                await db.entities.PartyInvite.update(partyInviteToast.id, { status: 'accepted' });
                const party = await db.entities.Party.get(partyInviteToast.party_id);
                if (party) {
                  const newIds = [...new Set([...(party.member_ids || []), userId])];
                  const newNames = [...new Set([...(party.member_names || []), username])];
                  await db.entities.Party.update(party.id, { member_ids: newIds, member_names: newNames });
                }
                setPartyInviteToast(null);
                sfx.purchaseSuccess();
              } catch { sfx.warning(); }
            }} className="flex-1 px-3 py-1 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="✓" size={14} /> JOIN</button>
            <button onClick={async () => {
              try { await db.entities.PartyInvite.update(partyInviteToast.id, { status: 'declined' }); } catch {}
              setPartyInviteToast(null);
              sfx.click();
            }} className="flex-1 px-3 py-1 bg-destructive text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="✕" size={14} /> DECLINE</button>
          </div>
        </div>
      )}
    </div>
  );
}