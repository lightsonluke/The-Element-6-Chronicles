// genPowers.js — Gen 1-4 Power Button ability engine.
// Each Gen 1-4 character has a UNIQUE power with its own projectile type,
// physics, hit detection, and visual rendering.
//
// activateGenPower returns true for all gen_* powers (fully handled here),
// false otherwise (falls through to the existing switch in fighter.js).

const KNOCKBACK_SCALE = 0.40;
const STUN_CAP = 300; // 5 seconds at 60fps

export function activateGenPower(fighter, opponent, effect) {
  if (!effect.type || !effect.type.startsWith('gen_')) return false;

  fighter.genProjectiles = fighter.genProjectiles || [];
  const opps = fighter._allOpponents || (opponent ? [opponent] : []);
  const aliveOpps = opps.filter(o => o && o.stocks > 0);
  const dmg = (effect.damage || 15) * (fighter.statPowerMul || 1) * (fighter.damageBoost || 1);
  const color = effect.color || fighter.char.color || '#FF6600';

  switch (effect.type) {
    // ═══════════════════════════════════════════════════════════════════════
    // GEN 1
    // ═══════════════════════════════════════════════════════════════════════

    // Thunder — Lightning Call: Warning mark beneath opponent, then bolt crashes down
    case 'gen_lightning_call': {
      const tgt = aliveOpps[0] || opponent;
      const tx = tgt ? tgt.x : fighter.x + fighter.facing * 300;
      fighter.genProjectiles.push({
        type: 'gen_lightning_call', targetX: tx, targetY: (tgt ? tgt.y : 400) - 20,
        warning: 45, hitApplied: false, damage: dmg, color, life: 90, size: 50,
      });
      fighter.powerActive = 'gen_lightning_call'; fighter.powerTimer = 6;
      break;
    }

    // Fire — Flame Burst: Compact fireball shoots straight ahead, explodes on contact
    case 'gen_flame_burst': {
      fighter.genProjectiles.push({
        type: 'gen_flame_burst', x: fighter.x + fighter.facing * 20, y: fighter.y - 35,
        vx: fighter.facing * 14, vy: 0, damage: dmg, color, life: 120,
        hitApplied: false, exploded: false, explosionR: 0, maxExplosionR: 55,
      });
      fighter.powerActive = 'gen_flame_burst'; fighter.powerTimer = 6;
      break;
    }

    // Water — Water Whip: Long tendril lashes forward, hits and pulls opponent closer
    case 'gen_water_whip': {
      fighter.genProjectiles.push({
        type: 'gen_water_whip', x: fighter.x, y: fighter.y - 35, facing: fighter.facing,
        reach: 0, maxReach: 300, damage: dmg, color, life: 25, hitApplied: false, pullApplied: false,
      });
      fighter.powerActive = 'gen_water_whip'; fighter.powerTimer = 8;
      break;
    }

    // Grass — Vine Barrage: 5 vines burst from ground in a horizontal spread
    case 'gen_vine_strike': {
      const count = effect.vineCount || 5;
      const spacing = 50;
      const startX = fighter.x + fighter.facing * 40 - (count - 1) * spacing / 2;
      for (let i = 0; i < count; i++) {
        fighter.genProjectiles.push({
          type: 'gen_vine_strike', x: startX + i * spacing, y: fighter.y,
          height: 0, maxHeight: 110, damage: dmg, color, life: 35, hitApplied: false, phase: 'rise',
          delay: i * 4, // slight stagger
        });
      }
      fighter.powerActive = 'gen_vine_strike'; fighter.powerTimer = 8;
      break;
    }

    // Ice — Ice Wall: Solid ice wall in front, blocks movement, then melts
    case 'gen_ice_wall': {
      fighter.genProjectiles.push({
        type: 'gen_ice_wall', x: fighter.x + fighter.facing * 50, y: fighter.y,
        w: 60, h: 85, color, life: 240, melting: false,
      });
      fighter.powerActive = 'gen_ice_wall'; fighter.powerTimer = effect.duration * 60;
      break;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GEN 2
    // ═══════════════════════════════════════════════════════════════════════

    // Renji — Iron Clamp: Iron bands from floor around opponent, restrict movement
    case 'gen_iron_clamp': {
      const tgt = aliveOpps[0] || opponent;
      const tx = tgt ? tgt.x : fighter.x + fighter.facing * 200;
      const ty = tgt ? tgt.y : 400;
      fighter.genProjectiles.push({
        type: 'gen_iron_clamp', targetX: tx, targetY: ty, spawnDelay: 15,
        damage: dmg, color: '#9999AA', life: 200, hitApplied: false, active: false, radius: 0,
      });
      fighter.powerActive = 'gen_iron_clamp'; fighter.powerTimer = 6;
      break;
    }

    // Kaito — Ember Shot: Dense ember fires forward, bursts on impact, leaves flame patch
    case 'gen_ember_shot': {
      fighter.genProjectiles.push({
        type: 'gen_ember_shot', x: fighter.x + fighter.facing * 20, y: fighter.y - 35,
        vx: fighter.facing * 12, damage: dmg, color, life: 120,
        hitApplied: false, burst: false, burstR: 0,
      });
      fighter.powerActive = 'gen_ember_shot'; fighter.powerTimer = 6;
      break;
    }

    // Hana — Water Push: Wave blast forward, pushes opponents away
    case 'gen_water_push': {
      fighter.genProjectiles.push({
        type: 'gen_water_push', x: fighter.x, y: fighter.y - 30, vx: fighter.facing * 8,
        facing: fighter.facing, range: 260, traveled: 0, damage: dmg, color, life: 45, hitIds: {},
      });
      fighter.powerActive = 'gen_water_push'; fighter.powerTimer = 8;
      break;
    }

    // Daigo — Stone Pillar: Spawns at a set distance in front of Daigo (not at opponent)
    case 'gen_stone_pillar': {
      const tx = fighter.x + fighter.facing * 220;
      fighter.genProjectiles.push({
        type: 'gen_stone_pillar', targetX: tx, x: tx, y: fighter.y,
        height: 0, maxHeight: 100, damage: dmg, color: '#998866', life: 50, hitApplied: false,
      });
      fighter.powerActive = 'gen_stone_pillar'; fighter.powerTimer = 6;
      break;
    }

    // Suzu — Gust Push: Concentrated gust forward, shoves opponents
    case 'gen_gust_push': {
      fighter.genProjectiles.push({
        type: 'gen_gust_push', x: fighter.x, y: fighter.y - 30, vx: fighter.facing * 10,
        facing: fighter.facing, damage: dmg, color, life: 35, hitIds: {}, pushForce: 18,
      });
      fighter.powerActive = 'gen_gust_push'; fighter.powerTimer = 6;
      break;
    }

    // Mai — Shadow Hand: Spawns at opponent's current location, 0.7s warning delay, then attacks
    case 'gen_shadow_hand': {
      const tgt = aliveOpps[0] || opponent;
      fighter.genProjectiles.push({
        type: 'gen_shadow_hand', x: tgt ? tgt.x : fighter.x + fighter.facing * 30,
        y: tgt ? tgt.y - 30 : fighter.y - 30,
        phase: 'warning', phaseTimer: 42, target: tgt, damage: dmg, color, life: 80, hitApplied: false,
      });
      fighter.powerActive = 'gen_shadow_hand'; fighter.powerTimer = 10;
      break;
    }

    // Osamu — Resonance Field: Expanding ring around Osamu, stuns anyone it hits
    case 'gen_resonance_lock': {
      fighter.genProjectiles.push({
        type: 'gen_resonance_lock', x: fighter.x, y: fighter.y,
        r: 0, maxR: 200, damage: dmg, color, life: 40, hitApplied: false, hitIds: {},
        stunDuration: STUN_CAP,
      });
      fighter.powerActive = 'gen_resonance_lock'; fighter.powerTimer = 6;
      break;
    }

    // Yui — Star Shot: A star shoots forward dealing damage and knockback
    case 'gen_star_shot': {
      fighter.genProjectiles.push({
        type: 'gen_star_shot', x: fighter.x + fighter.facing * 20, y: fighter.y - 35,
        vx: fighter.facing * 16, vy: 0, facing: fighter.facing,
        damage: dmg, knockback: 1.5, color, life: 120, hitApplied: false, spin: 0,
      });
      fighter.powerActive = 'gen_star_shot'; fighter.powerTimer = 6;
      break;
    }

    // Ibuki (Hollow Monk) & Renko — Life Steal Aura: Visible field around user steals life for 10s
    case 'gen_life_steal_aura': {
      fighter.powerActive = 'gen_life_steal_aura';
      fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter._genLifeStealDot = effect.dotDamage || 4;
      fighter.genProjectiles.push({
        type: 'gen_life_steal_aura', x: fighter.x, y: fighter.y, r: 140,
        color, life: Math.min(effect.duration, 10) * 60, tick: 0, hitIds: {},
      });
      break;
    }

    // Yui (old) — Restoration Light: kept for compatibility
    case 'gen_restoration_light': {
      fighter.powerActive = 'gen_restoration_light';
      fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter._genHealPerTick = 2;
      break;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GEN 3
    // ═══════════════════════════════════════════════════════════════════════

    // Takeshi — Scatter Gust: Sand gust forward, stuns briefly
    case 'gen_scatter_gust': {
      fighter.genProjectiles.push({
        type: 'gen_scatter_gust', x: fighter.x, y: fighter.y - 30, vx: fighter.facing * 10,
        facing: fighter.facing, damage: dmg, color, life: 40, hitIds: {}, stunDuration: 50,
      });
      fighter.powerActive = 'gen_scatter_gust'; fighter.powerTimer = 6;
      break;
    }

    // Aiko — Bone Barrage: Tight spread of bone spikes shoots forward
    case 'gen_bone_barrage': {
      for (let i = 0; i < 5; i++) {
        const spread = (i - 2) * 3;
        fighter.genProjectiles.push({
          type: 'gen_bone_spike', x: fighter.x + fighter.facing * 15, y: fighter.y - 30,
          vx: fighter.facing * (12 + Math.random() * 3), vy: spread,
          damage: dmg * 0.6, color, life: 60, hitApplied: false, spin: Math.random() * 6,
        });
      }
      fighter.powerActive = 'gen_bone_barrage'; fighter.powerTimer = 6;
      break;
    }

    // Haru — Glass Wall: Solid glass wall that blocks movement
    case 'gen_glass_wall': {
      fighter.genProjectiles.push({
        type: 'gen_glass_wall', x: fighter.x + fighter.facing * 50, y: fighter.y,
        w: 24, h: 100, color, life: effect.duration * 60,
      });
      fighter.powerActive = 'gen_glass_wall'; fighter.powerTimer = 6;
      break;
    }

    // Haru (old) — Mirror Pane: kept for compatibility
    case 'gen_mirror_pane': {
      fighter.genProjectiles.push({
        type: 'gen_mirror_pane', x: fighter.x + fighter.facing * 60, y: fighter.y - 35,
        w: 16, h: 75, facing: fighter.facing, color, life: 180, redirectUsed: false,
      });
      fighter.powerActive = 'gen_mirror_pane'; fighter.powerTimer = 6;
      break;
    }

    // Chiyo — Venom Spit: Venom shot forward, applies slow on hit
    case 'gen_venom_spit': {
      fighter.genProjectiles.push({
        type: 'gen_venom_spit', x: fighter.x + fighter.facing * 20, y: fighter.y - 35,
        vx: fighter.facing * 12, damage: dmg, color, life: 100, hitApplied: false, slowDuration: 180,
      });
      fighter.powerActive = 'gen_venom_spit'; fighter.powerTimer = 6;
      break;
    }

    // Emi — Sword in Hand: sword swings during attacks (no floating sword), extra damage for duration
    case 'gen_sword_in_hand': {
      fighter.powerActive = 'gen_sword_in_hand';
      fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter.damageBoost = effect.damageMul || 1.3;
      break;
    }

    // Emi (old) — Blood Sword: kept for compatibility
    case 'gen_blood_sword': {
      fighter.powerActive = 'gen_blood_sword';
      fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter.damageBoost = 1.2;
      break;
    }

    // Nozomi — Thorn Volley: Several thorn vines burst from ground in spread
    case 'gen_thorn_volley': {
      for (let i = 0; i < 4; i++) {
        const offset = (i - 1.5) * 40;
        fighter.genProjectiles.push({
          type: 'gen_thorn_vine', x: fighter.x + fighter.facing * 50 + offset, y: fighter.y,
          height: 0, maxHeight: 90, damage: dmg * 0.7, color, life: 30, hitApplied: false,
        });
      }
      fighter.powerActive = 'gen_thorn_volley'; fighter.powerTimer = 6;
      break;
    }

    // Masaru — Ash Flash: Dense ash blast forward, stuns on direct hit
    case 'gen_ash_flash': {
      fighter.genProjectiles.push({
        type: 'gen_ash_flash', x: fighter.x, y: fighter.y - 30, vx: fighter.facing * 14,
        facing: fighter.facing, damage: dmg, color, life: 35, hitIds: {}, stunDuration: 50,
      });
      fighter.powerActive = 'gen_ash_flash'; fighter.powerTimer = 6;
      break;
    }

    // Ryo — Mist Cloud: Mist forms in front, stuns anyone who enters (no auto-hit)
    case 'gen_mist_ambush': {
      const tx = fighter.x + fighter.facing * 200;
      const ty = fighter.y;
      fighter.genProjectiles.push({
        type: 'gen_mist_ambush', targetX: tx, targetY: ty, phase: 'form', phaseTimer: 20,
        damage: dmg, color, life: 120, hitApplied: false, stunDuration: 60, hitIds: {},
      });
      fighter.powerActive = 'gen_mist_ambush'; fighter.powerTimer = 6;
      break;
    }

    // Souta — Cinder Snap: Close cinder blast, stuns briefly
    case 'gen_cinder_snap': {
      fighter.genProjectiles.push({
        type: 'gen_cinder_snap', x: fighter.x, y: fighter.y - 30, vx: fighter.facing * 16,
        facing: fighter.facing, damage: dmg, color, life: 25, hitApplied: false,
        stunDuration: 50, range: 160, traveled: 0,
      });
      fighter.powerActive = 'gen_cinder_snap'; fighter.powerTimer = 6;
      break;
    }

    // Ogata — Extraction Tech: Tech device in hand for duration, then disappears
    case 'gen_extraction_tech': {
      fighter.powerActive = 'gen_extraction_tech';
      fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter.genProjectiles.push({
        type: 'gen_extraction_tech', x: fighter.x, y: fighter.y, facing: fighter.facing,
        color, life: Math.min(effect.duration, 10) * 60,
      });
      break;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GEN 4
    // ═══════════════════════════════════════════════════════════════════════

    // Cobalt — Solid Barrier: Solid climbable barrier
    case 'gen_solid_barrier': {
      fighter.genProjectiles.push({
        type: 'gen_solid_barrier', x: fighter.x + fighter.facing * 50, y: fighter.y,
        w: 30, h: 120, color, life: effect.duration * 60,
      });
      fighter.powerActive = 'gen_solid_barrier'; fighter.powerTimer = 6;
      break;
    }

    // Cobalt (old) — Barrier Drive: kept for compatibility
    case 'gen_barrier_drive': {
      fighter.genProjectiles.push({
        type: 'gen_barrier_drive', x: fighter.x + fighter.facing * 40, y: fighter.y - 35,
        vx: fighter.facing * 3, facing: fighter.facing, w: 100, h: 80,
        damage: dmg, color, life: 120, hitIds: {},
      });
      fighter.powerActive = 'gen_barrier_drive'; fighter.powerTimer = 8;
      break;
    }

    // Cyan — Wind Carry: Wind stream catches opponent, carries sideways
    case 'gen_wind_carry': {
      fighter.genProjectiles.push({
        type: 'gen_wind_carry', x: fighter.x, y: fighter.y - 30, vx: fighter.facing * 8,
        facing: fighter.facing, damage: dmg, color, life: 50, hitApplied: false, carryDir: fighter.facing,
      });
      fighter.powerActive = 'gen_wind_carry'; fighter.powerTimer = 6;
      break;
    }

    // Onyx — Shadow Step: Teleport behind opponent (both x and y), leaves a trail
    case 'gen_shadow_shift': {
      const tgt = aliveOpps[0] || opponent;
      const exitX = tgt ? (tgt.x + fighter.facing * 80) : fighter.x + fighter.facing * 250;
      const exitY = tgt ? tgt.y : fighter.y;
      fighter.genProjectiles.push({
        type: 'gen_shadow_shift', fromX: fighter.x, fromY: fighter.y,
        exitX, exitY, timer: 30, maxTimer: 30, color, life: 40,
        trail: [],
      });
      fighter.invincible = 20;
      fighter.x = exitX; fighter.y = exitY;
      fighter.facing = -fighter.facing;
      fighter.powerActive = 'gen_shadow_shift'; fighter.powerTimer = 6;
      break;
    }

    // Gold — Restoration Beam: Gold beam restores health over time
    case 'gen_restoration_beam': {
      fighter.powerActive = 'gen_restoration_beam';
      fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter._genHealPerTick = 3;
      break;
    }

    // Vermilion — Fire Wave: Low wave of fire rolls forward
    case 'gen_fire_wave': {
      fighter.genProjectiles.push({
        type: 'gen_fire_wave', x: fighter.x + fighter.facing * 20, y: fighter.y,
        vx: fighter.facing * 6, facing: fighter.facing, damage: dmg, color, life: 80, hitIds: {}, waveH: 40,
      });
      fighter.powerActive = 'gen_fire_wave'; fighter.powerTimer = 8;
      break;
    }

    // Umber — Platform Shake: Platform shakes violently (GC: protective wall)
    case 'gen_platform_shake': {
      if (fighter._gcNoBlast) {
        // Grand Circuit: protective wall from ground
        fighter.genProjectiles.push({
          type: 'gen_protect_wall', x: fighter.x + fighter.facing * 60, y: fighter.y,
          w: 24, h: 140, color: '#886644', life: 300,
        });
      } else {
        // Find platform fighter is standing on
        let standingPlat = null;
        const plats = fighter._platforms || [];
        for (const p of plats) {
          if (fighter.x > p.x - 16 && fighter.x < p.x + p.w + 16 && Math.abs(fighter.y - p.y) < 8) {
            standingPlat = p; break;
          }
        }
        fighter.genProjectiles.push({
          type: 'gen_platform_shake', platform: standingPlat,
          originalX: standingPlat ? standingPlat.x : 0,
          shakeTimer: 0, life: effect.duration * 60, color,
        });
      }
      fighter.powerActive = 'gen_platform_shake'; fighter.powerTimer = effect.duration * 60;
      break;
    }

    // Umber (old) — Tremor Sense: kept for compatibility
    case 'gen_tremor_sense': {
      fighter.genProjectiles.push({
        type: 'gen_tremor_sense', x: fighter.x, y: fighter.y, r: 0, maxR: 400,
        color, life: 240, hitApplied: false, revealDuration: 180,
      });
      fighter.powerActive = 'gen_tremor_sense'; fighter.powerTimer = effect.duration * 60;
      break;
    }

    // Graphite (old) — Resonance Scan: kept for compatibility
    case 'gen_resonance_scan': {
      fighter.genProjectiles.push({
        type: 'gen_resonance_scan', x: fighter.x, y: fighter.y - 30, r: 0, maxR: 350,
        color, life: 50, hitIds: {},
      });
      fighter.powerActive = 'gen_resonance_scan'; fighter.powerTimer = 6;
      break;
    }

    // Daichi — Tech Bomb: aims at opponent like Whami's potion, collides with platforms,
    // explodes on contact with opponent OR when fuse runs out
    case 'gen_bomb': {
      const opps = getOpps(fighter, opponent);
      const tgt = opps.length > 0 ? opps[Math.floor(Math.random() * opps.length)] : opponent;
      const tx = tgt ? tgt.x : fighter.x + fighter.facing * 600;
      const ty = tgt ? tgt.y - 30 : fighter.y - 100;
      const bdx = tx - fighter.x, bdy = ty - (fighter.y - 40);
      const bdist = Math.sqrt(bdx * bdx + bdy * bdy) || 1;
      const bspeed = 11;
      fighter.genProjectiles.push({
        type: 'gen_bomb', x: fighter.x + fighter.facing * 24, y: fighter.y - 40,
        vx: (bdx / bdist) * bspeed, vy: (bdy / bdist) * bspeed - 2,
        damage: dmg, color, life: 150, fuse: 60, exploded: false, explosionR: 0, maxExplosionR: 120,
        target: tgt, gravity: 0.18, hitApplied: false,
      });
      fighter.powerActive = 'gen_bomb'; fighter.powerTimer = 6;
      break;
    }

    // Daichi (old) — Resonance Beacon: kept for compatibility
    case 'gen_resonance_beacon': {
      fighter.genProjectiles.push({
        type: 'gen_resonance_beacon', x: fighter.x + fighter.facing * 30, y: fighter.y,
        color, life: 300, radius: 150, pulseTimer: 0,
      });
      fighter.powerActive = 'gen_resonance_beacon'; fighter.powerTimer = 6;
      break;
    }

    default:
      return false; // Unknown gen_ type — fall through
  }
  return true;
}

// ── Helper: get all opponents for hit detection ──
function getOpps(fighter, opponent) {
  return (fighter._allOpponents && fighter._allOpponents.length > 0)
    ? fighter._allOpponents.filter(o => o && o.stocks > 0)
    : (opponent && opponent.stocks > 0 ? [opponent] : []);
}

function hitKey(opp) {
  return opp.playerIndex != null ? 'p' + opp.playerIndex : 'o' + Math.random();
}

export function updateGenProjectiles(fighter, opponent) {
  // Per-frame buff effects for non-projectile powers
  if (fighter.powerActive === 'gen_restoration_light' && fighter.powerTimer > 0 && fighter._genHealPerTick) {
    if (fighter.frame % 30 === 0) fighter.damage = Math.max(0, fighter.damage - fighter._genHealPerTick);
  }
  if (fighter.powerActive === 'gen_restoration_beam' && fighter.powerTimer > 0 && fighter._genHealPerTick) {
    if (fighter.frame % 30 === 0) {
      fighter.damage = Math.max(0, fighter.damage - fighter._genHealPerTick);
      fighter.superMeter = Math.min(fighter.maxSuper, fighter.superMeter + 2);
    }
  }
  // Life steal aura — drain nearby opponents and heal self
  if (fighter.powerActive === 'gen_life_steal_aura' && fighter.powerTimer > 0 && fighter._genLifeStealDot) {
    if (fighter.frame % 30 === 0) {
      const opps = getOpps(fighter, opponent);
      let stole = 0;
      opps.forEach(opp => {
        const d = Math.abs(opp.x - fighter.x) + Math.abs((opp.y - 30) - (fighter.y - 30));
        if (d < 160 && (opp.invincible || 0) <= 0) {
          opp.damage += fighter._genLifeStealDot;
          stole += fighter._genLifeStealDot * 0.5;
        }
      });
      if (stole > 0) fighter.damage = Math.max(0, fighter.damage - stole);
    }
  }

  if (!fighter.genProjectiles || fighter.genProjectiles.length === 0) return;
  const opps = getOpps(fighter, opponent);

  fighter.genProjectiles = fighter.genProjectiles.filter(p => {
    p.life--;
    if (p.life <= 0) {
      // Restore platform position when shake ends
      if (p.type === 'gen_platform_shake' && p.platform) {
        p.platform.x = p.originalX;
      }
      return false;
    }

    // ── GEN 1 ──
    if (p.type === 'gen_lightning_call') {
      p.warning--;
      if (p.warning <= 0 && !p.hitApplied) {
        p.hitApplied = true;
        opps.forEach(opp => {
          if (Math.abs(opp.x - p.targetX) < 55 && (opp.invincible || 0) <= 0) {
            opp.damage += p.damage; opp.hitstun = 30; opp.state = 'hitstun';
            opp.vy = -12 * KNOCKBACK_SCALE; opp.grounded = false;
          }
        });
      }
      return p.life > 0;
    }
    if (p.type === 'gen_flame_burst') {
      if (!p.hitApplied && !p.exploded) {
        p.x += p.vx;
        for (const opp of opps) {
          if (Math.abs(opp.x - p.x) < 35 && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
            p.exploded = true; p.hitApplied = true;
            opp.damage += p.damage; opp.hitstun = 20; opp.state = 'hitstun';
            opp.vx = p.vx > 0 ? 10 * KNOCKBACK_SCALE : -10 * KNOCKBACK_SCALE; opp.vy = -6 * KNOCKBACK_SCALE; opp.grounded = false;
            break;
          }
        }
      }
      if (p.exploded) { p.explosionR = Math.min(p.maxExplosionR, p.explosionR + 8); }
      return p.life > 0 && p.x > -100 && p.x < 1400;
    }
    if (p.type === 'gen_water_whip') {
      p.reach = Math.min(p.maxReach, p.reach + 28);
      const tipX = p.x + p.facing * p.reach;
      for (const opp of opps) {
        const inFront = p.facing > 0 ? (opp.x > p.x && opp.x < tipX + 20) : (opp.x < p.x && opp.x > tipX - 20);
        if (inFront && !p.hitApplied && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
          p.hitApplied = true; p.pullApplied = true;
          opp.damage += p.damage; opp.hitstun = 15; opp.state = 'hitstun';
          opp.vx = -p.facing * 6 * KNOCKBACK_SCALE; opp.grounded = false;
        }
      }
      return p.life > 0;
    }
    if (p.type === 'gen_vine_strike') {
      if (p.delay > 0) { p.delay--; return true; }
      if (p.phase === 'rise') { p.height = Math.min(p.maxHeight, p.height + 15); if (p.height >= p.maxHeight) p.phase = 'strike'; }
      else if (p.phase === 'strike') {
        for (const opp of opps) {
          if (!p.hitApplied && Math.abs(opp.x - p.x) < 40 && opp.y > p.y - p.height - 10 && (opp.invincible || 0) <= 0) {
            p.hitApplied = true;
            opp.damage += p.damage; opp.hitstun = 20; opp.state = 'hitstun';
            opp.vx = p.facing > 0 ? 8 * KNOCKBACK_SCALE : -8 * KNOCKBACK_SCALE; opp.vy = -8 * KNOCKBACK_SCALE; opp.grounded = false;
          }
        }
        p.phase = 'retract';
      } else if (p.phase === 'retract') { p.height = Math.max(0, p.height - 12); }
      return p.life > 0;
    }
    if (p.type === 'gen_ice_wall') {
      if (p.life < 60) p.melting = true;
      const allFighters = [fighter, ...opps];
      allFighters.forEach(f => {
        if (!f || f.stocks <= 0) return;
        const wallLeft = p.x - p.w / 2, wallRight = p.x + p.w / 2;
        if (f.x > wallLeft - 16 && f.x < wallRight + 16 && Math.abs(f.y - p.y) < p.h) {
          if (f.x < p.x) { f.x = wallLeft - 16; if (f.vx > 0) f.vx = 0; }
          else { f.x = wallRight + 16; if (f.vx < 0) f.vx = 0; }
        }
      });
      return p.life > 0;
    }

    // ── GEN 2 ──
    if (p.type === 'gen_iron_clamp') {
      if (p.spawnDelay > 0) { p.spawnDelay--; return true; }
      // End early if victim was hit by an attack (control effect broken)
      if (opps.some(opp => opp._controlBroken && Math.abs(opp.x - p.targetX) < 60)) {
        opps.forEach(opp => { if (Math.abs(opp.x - p.targetX) < 60) opp._controlBroken = false; });
        return false;
      }
      p.active = true; p.radius = Math.min(60, p.radius + 10);
      if (!p.hitApplied) {
        p.hitApplied = true;
        opps.forEach(opp => {
          if (Math.abs(opp.x - p.targetX) < 60 && (opp.invincible || 0) <= 0) {
            opp.damage += p.damage; opp.slowTimer = Math.min(120, 300); opp.speedMul = 0.1; opp.trapped = true;
          }
        });
      }
      opps.forEach(opp => {
        if (Math.abs(opp.x - p.targetX) < 60) { opp.slowTimer = Math.min(Math.max(opp.slowTimer, 10), 300); opp.speedMul = 0.1; opp.vx *= 0.3; }
      });
      return p.life > 0;
    }
    if (p.type === 'gen_ember_shot') {
      if (!p.hitApplied) {
        p.x += p.vx;
        for (const opp of opps) {
          if (Math.abs(opp.x - p.x) < 35 && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
            p.hitApplied = true; p.burst = true;
            opp.damage += p.damage; opp.hitstun = 18; opp.state = 'hitstun';
            opp.vx = p.vx > 0 ? 8 * KNOCKBACK_SCALE : -8 * KNOCKBACK_SCALE; opp.vy = -6 * KNOCKBACK_SCALE; opp.grounded = false;
            fighter.genProjectiles.push({
              type: 'gen_flame_patch', x: opp.x, y: opp.y, color: '#FF6600', life: 120, hitIds: {}, damage: 3,
            });
            break;
          }
        }
      }
      if (p.burst) { p.burstR = Math.min(50, p.burstR + 8); }
      return p.life > 0 && p.x > -100 && p.x < 1400;
    }
    if (p.type === 'gen_flame_patch') {
      opps.forEach(opp => {
        const key = hitKey(opp);
        if (p.hitIds[key]) return;
        if (Math.abs(opp.x - p.x) < 30 && Math.abs(opp.y - p.y) < 40 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true; opp.damage += p.damage;
        }
      });
      return p.life > 0;
    }
    if (p.type === 'gen_water_push') {
      p.x += p.vx; p.traveled += Math.abs(p.vx);
      opps.forEach(opp => {
        const key = hitKey(opp);
        if (p.hitIds[key]) return;
        if (Math.abs(opp.x - p.x) < 60 && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.vx = p.facing * 16 * KNOCKBACK_SCALE; opp.grounded = false; opp.state = 'hitstun'; opp.hitstun = 12;
        }
      });
      return p.life > 0 && p.traveled < p.range;
    }
    if (p.type === 'gen_stone_pillar') {
      p.height = Math.min(p.maxHeight, p.height + 15);
      if (!p.hitApplied && p.height >= p.maxHeight * 0.7) {
        opps.forEach(opp => {
          if (Math.abs(opp.x - p.targetX) < 45 && (opp.invincible || 0) <= 0) {
            p.hitApplied = true;
            opp.damage += p.damage; opp.vy = -18 * KNOCKBACK_SCALE; opp.grounded = false; opp.state = 'hitstun'; opp.hitstun = 20;
          }
        });
      }
      return p.life > 0;
    }
    if (p.type === 'gen_gust_push') {
      p.x += p.vx;
      opps.forEach(opp => {
        const key = hitKey(opp);
        if (p.hitIds[key]) return;
        if (Math.abs(opp.x - p.x) < 50 && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.vx = p.facing * p.pushForce * KNOCKBACK_SCALE; opp.grounded = false;
        }
      });
      return p.life > 0;
    }
    if (p.type === 'gen_shadow_hand') {
      // Warning phase: hand visible at spawn location for 0.7s (42 frames) — opponent can react and move away
      if (p.phase === 'warning') { p.phaseTimer--; if (p.phaseTimer <= 0) p.phase = 'attack'; }
      else if (p.phase === 'attack') {
        if (!p.hitApplied) {
          p.hitApplied = true;
          // Hit only if opponent is still near the hand's spawn location
          if (p.target && p.target.stocks > 0 && Math.abs(p.target.x - p.x) < 55 && Math.abs(p.target.y - p.y) < 65 && (p.target.invincible || 0) <= 0) {
            p.target.damage += p.damage; p.target.hitstun = 25; p.target.state = 'hitstun';
            p.target.vx = -p.target.facing * 10 * KNOCKBACK_SCALE; p.target.vy = -8 * KNOCKBACK_SCALE; p.target.grounded = false;
          }
        }
        return false; // hand disappears after attack attempt
      }
      return p.life > 0;
    }
    if (p.type === 'gen_resonance_lock') {
      // Expanding ring around fighter's original position, stuns on contact
      p.r = Math.min(p.maxR, p.r + 8);
      opps.forEach(opp => {
        const key = hitKey(opp);
        if (p.hitIds[key]) return;
        const d = Math.hypot(opp.x - p.x, (opp.y - 30) - (p.y - 30));
        if (d < p.r + 30 && d > p.r - 30 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.hitstun = Math.min(p.stunDuration, STUN_CAP); opp.state = 'hitstun'; opp.vx = 0; opp.vy = 0;
        }
      });
      return p.life > 0 && p.r < p.maxR;
    }
    if (p.type === 'gen_star_shot') {
      p.x += p.vx; p.spin += 0.2;
      for (const opp of opps) {
        if (!p.hitApplied && Math.abs(opp.x - p.x) < 40 && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
          p.hitApplied = true;
          opp.damage += p.damage; opp.hitstun = 20; opp.state = 'hitstun';
          opp.vx = p.facing * 14 * p.knockback * KNOCKBACK_SCALE; opp.vy = -10 * KNOCKBACK_SCALE; opp.grounded = false;
          return false;
        }
      }
      return p.life > 0 && p.x > -100 && p.x < 1400;
    }
    if (p.type === 'gen_life_steal_aura') {
      // Follow fighter
      p.x = fighter.x; p.y = fighter.y;
      return p.life > 0;
    }

    // ── GEN 3 ──
    if (p.type === 'gen_scatter_gust') {
      p.x += p.vx;
      opps.forEach(opp => {
        const key = hitKey(opp);
        if (p.hitIds[key]) return;
        if (Math.abs(opp.x - p.x) < 50 && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.hitstun = p.stunDuration; opp.state = 'hitstun'; opp.vx = p.facing * 8 * KNOCKBACK_SCALE;
        }
      });
      return p.life > 0;
    }
    if (p.type === 'gen_bone_spike') {
      p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.spin += 0.4;
      for (const opp of opps) {
        if (!p.hitApplied && Math.abs(opp.x - p.x) < 30 && Math.abs((opp.y - 30) - p.y) < 40 && (opp.invincible || 0) <= 0) {
          p.hitApplied = true;
          opp.damage += p.damage; opp.hitstun = 15; opp.state = 'hitstun';
          opp.vx = p.vx * 0.6 * KNOCKBACK_SCALE; opp.vy = -6 * KNOCKBACK_SCALE; opp.grounded = false;
        }
      }
      return p.life > 0 && p.y < 800;
    }
    if (p.type === 'gen_mirror_pane') {
      if (!p.redirectUsed) {
        opps.forEach(opp => {
          if (!opp.projectiles) return;
          opp.projectiles.forEach(proj => {
            if (proj.hitApplied || proj._redirected) return;
            if (Math.abs(proj.x - p.x) < p.w + 10 && Math.abs(proj.y - p.y) < p.h) {
              proj._redirected = true; proj.vx = -proj.vx * 0.7; proj.facing = -proj.facing;
              p.redirectUsed = true;
            }
          });
        });
      }
      return p.life > 0;
    }
    if (p.type === 'gen_glass_wall') {
      // Solid wall — block movement like ice_wall
      const allFighters = [fighter, ...opps];
      allFighters.forEach(f => {
        if (!f || f.stocks <= 0) return;
        const wallLeft = p.x - p.w / 2, wallRight = p.x + p.w / 2;
        if (f.x > wallLeft - 16 && f.x < wallRight + 16 && Math.abs(f.y - p.y) < p.h) {
          if (f.x < p.x) { f.x = wallLeft - 16; if (f.vx > 0) f.vx = 0; }
          else { f.x = wallRight + 16; if (f.vx < 0) f.vx = 0; }
        }
      });
      return p.life > 0;
    }
    if (p.type === 'gen_venom_spit') {
      p.x += p.vx;
      for (const opp of opps) {
        if (!p.hitApplied && Math.abs(opp.x - p.x) < 30 && Math.abs((opp.y - 30) - p.y) < 45 && (opp.invincible || 0) <= 0) {
          p.hitApplied = true;
          opp.damage += p.damage; opp.slowTimer = p.slowDuration; opp.speedMul = 0.35;
          opp.vx = p.vx * 0.4 * KNOCKBACK_SCALE;
          return false;
        }
      }
      return p.life > 0 && p.x > -100 && p.x < 1400;
    }
    if (p.type === 'gen_thorn_vine') {
      p.height = Math.min(p.maxHeight, p.height + 14);
      if (!p.hitApplied && p.height >= p.maxHeight * 0.6) {
        for (const opp of opps) {
          if (Math.abs(opp.x - p.x) < 35 && opp.y > p.y - p.height - 10 && (opp.invincible || 0) <= 0) {
            p.hitApplied = true;
            opp.damage += p.damage; opp.hitstun = 15; opp.state = 'hitstun';
            opp.vx = (opp.x > p.x ? 1 : -1) * 6 * KNOCKBACK_SCALE; opp.vy = -6 * KNOCKBACK_SCALE; opp.grounded = false;
          }
        }
      }
      return p.life > 0;
    }
    if (p.type === 'gen_ash_flash') {
      p.x += p.vx;
      opps.forEach(opp => {
        const key = hitKey(opp);
        if (p.hitIds[key]) return;
        if (Math.abs(opp.x - p.x) < 45 && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.hitstun = p.stunDuration; opp.state = 'hitstun';
        }
      });
      return p.life > 0;
    }
    if (p.type === 'gen_mist_ambush') {
      // Mist cloud at fixed position — stuns anyone who enters (no auto-hit)
      if (p.phase === 'form') { p.phaseTimer--; if (p.phaseTimer <= 0) p.phase = 'active'; }
      else if (p.phase === 'active') {
        opps.forEach(opp => {
          const key = hitKey(opp);
          if (p.hitIds[key]) return;
          if (Math.abs(opp.x - p.targetX) < 50 && Math.abs((opp.y - 30) - (p.targetY - 30)) < 60 && (opp.invincible || 0) <= 0) {
            p.hitIds[key] = true;
            opp.damage += p.damage; opp.hitstun = p.stunDuration; opp.state = 'hitstun';
            opp.vx = (opp.x > p.targetX ? 1 : -1) * 8 * KNOCKBACK_SCALE; opp.vy = -6 * KNOCKBACK_SCALE; opp.grounded = false;
          }
        });
      }
      return p.life > 0;
    }
    if (p.type === 'gen_cinder_snap') {
      p.x += p.vx; p.traveled += Math.abs(p.vx);
      for (const opp of opps) {
        if (!p.hitApplied && Math.abs(opp.x - p.x) < 35 && Math.abs((opp.y - 30) - p.y) < 45 && (opp.invincible || 0) <= 0) {
          p.hitApplied = true;
          opp.damage += p.damage; opp.hitstun = p.stunDuration; opp.state = 'hitstun';
          opp.vx = p.facing * 8 * KNOCKBACK_SCALE; opp.grounded = false;
          return false;
        }
      }
      return p.life > 0 && p.traveled < p.range;
    }
    if (p.type === 'gen_extraction_tech') {
      // Follow fighter position
      p.x = fighter.x; p.y = fighter.y; p.facing = fighter.facing;
      return p.life > 0;
    }

    // ── GEN 4 ──
    if (p.type === 'gen_barrier_drive') {
      p.x += p.vx;
      opps.forEach(opp => {
        const key = hitKey(opp);
        if (p.hitIds[key]) return;
        const wallL = p.x - p.w / 2, wallR = p.x + p.w / 2;
        if (opp.x > wallL - 16 && opp.x < wallR + 16 && Math.abs((opp.y - 30) - p.y) < p.h) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.vx = p.facing * 10 * KNOCKBACK_SCALE; opp.grounded = false;
        }
      });
      opps.forEach(opp => {
        const wallL = p.x - p.w / 2, wallR = p.x + p.w / 2;
        if (opp.x > wallL - 20 && opp.x < wallR + 20 && Math.abs((opp.y - 30) - p.y) < p.h) {
          opp.x += p.facing * 2;
        }
      });
      return p.life > 0 && p.x > -100 && p.x < 1400;
    }
    if (p.type === 'gen_solid_barrier') {
      // Solid wall — block movement (collision handled in resolveCollisions via wallPlatforms)
      return p.life > 0;
    }
    if (p.type === 'gen_wind_carry') {
      p.x += p.vx;
      for (const opp of opps) {
        if (!p.hitApplied && Math.abs(opp.x - p.x) < 45 && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
          p.hitApplied = true;
          opp.damage += p.damage; opp.vx = p.carryDir * 12 * KNOCKBACK_SCALE; opp.state = 'hitstun'; opp.hitstun = 30; opp.grounded = false;
        }
      }
      return p.life > 0;
    }
    if (p.type === 'gen_shadow_shift') {
      p.timer--;
      // Add trail markers along the path
      if (p.life > 15 && fighter.frame % 3 === 0) {
        const progress = 1 - p.timer / p.maxTimer;
        const tx = p.fromX + (p.exitX - p.fromX) * progress;
        const ty = p.fromY + (p.exitY - p.fromY) * progress;
        p.trail.push({ x: tx, y: ty, alpha: 1 });
      }
      // Fade trail
      if (p.trail) {
        p.trail.forEach(t => t.alpha -= 0.03);
        p.trail = p.trail.filter(t => t.alpha > 0);
      }
      return p.life > 0;
    }
    if (p.type === 'gen_fire_wave') {
      p.x += p.vx;
      opps.forEach(opp => {
        const key = hitKey(opp);
        if (p.hitIds[key]) return;
        if (Math.abs(opp.x - p.x) < 45 && opp.y > p.y - p.waveH && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.hitstun = 15; opp.state = 'hitstun';
          opp.vx = p.facing * 8 * KNOCKBACK_SCALE; opp.vy = -4 * KNOCKBACK_SCALE; opp.grounded = false;
        }
      });
      return p.life > 0 && p.x > -100 && p.x < 1400;
    }
    if (p.type === 'gen_tremor_sense') {
      p.r = Math.min(p.maxR, p.r + 10);
      opps.forEach(opp => {
        if (!p.hitApplied && Math.abs(opp.x - p.x) < p.r) {
          p.hitApplied = true;
          opp._revealed = p.revealDuration;
        }
      });
      opps.forEach(opp => {
        if (Math.abs(opp.x - p.x) < p.r) opp._revealed = Math.max(opp._revealed || 0, 20);
      });
      return p.life > 0;
    }
    if (p.type === 'gen_resonance_scan') {
      p.r = Math.min(p.maxR, p.r + 12);
      opps.forEach(opp => {
        const key = hitKey(opp);
        if (p.hitIds[key]) return;
        const d = Math.abs(opp.x - p.x) + Math.abs((opp.y - 30) - p.y);
        if (d < p.r + 30) {
          p.hitIds[key] = true;
          opp._resonanceMarked = 180;
        }
      });
      return p.life > 0;
    }
    if (p.type === 'gen_resonance_beacon') {
      p.pulseTimer--;
      if (p.pulseTimer <= 0) {
        p.pulseTimer = 30;
        opps.forEach(opp => {
          if (!opp.projectiles) return;
          opp.projectiles.forEach(proj => {
            if (Math.abs(proj.x - p.x) < p.radius) { proj.life = Math.min(proj.life, 10); }
          });
        });
      }
      return p.life > 0;
    }
    if (p.type === 'gen_platform_shake') {
      // Shake the platform violently left and right
      if (p.platform) {
        p.shakeTimer += 0.8;
        p.platform.x = p.originalX + Math.sin(p.shakeTimer) * 60;
      }
      return p.life > 0;
    }
    if (p.type === 'gen_protect_wall') {
      // Grand Circuit: solid protective wall
      const allFighters = [fighter, ...opps];
      allFighters.forEach(f => {
        if (!f || f.stocks <= 0) return;
        const wallLeft = p.x - p.w / 2, wallRight = p.x + p.w / 2;
        if (f.x > wallLeft - 16 && f.x < wallRight + 16 && Math.abs(f.y - p.y) < p.h) {
          if (f.x < p.x) { f.x = wallLeft - 16; if (f.vx > 0) f.vx = 0; }
          else { f.x = wallRight + 16; if (f.vx < 0) f.vx = 0; }
        }
      });
      return p.life > 0;
    }
    if (p.type === 'gen_bomb') {
      if (!p.exploded) {
        p.vy += (p.gravity || 0.4); p.x += p.vx; p.y += p.vy;
        p.fuse--;
        // ── Contact explosion: if bomb touches an opponent before fuse ends, explode immediately ──
        for (const opp of opps) {
          if (!p.hitApplied && Math.abs(opp.x - p.x) < 40 && Math.abs((opp.y - 30) - p.y) < 55 && (opp.invincible || 0) <= 0) {
            p.hitApplied = true; p.exploded = true; p.fuse = 0;
            opp.damage += p.damage; opp.hitstun = 25; opp.state = 'hitstun';
            opp.vx = (opp.x > p.x ? 1 : -1) * 14 * KNOCKBACK_SCALE; opp.vy = -12 * KNOCKBACK_SCALE; opp.grounded = false;
            break;
          }
        }
        // ── Platform collision: bomb bounces/rests on solid platforms ──
        if (!p.exploded && fighter._platforms) {
          for (const plat of fighter._platforms) {
            const mat = plat.material || 'normal';
            if (['water','lava','cloud','acid','tar','antigravity'].includes(mat)) continue;
            if (plat._deleted > 0 || plat.h < 18) continue;
            if (p.x > plat.x - 16 && p.x < plat.x + plat.w + 16 && p.vy > 0 && p.y >= plat.y && p.y < plat.y + 20) {
              p.y = plat.y; p.vy = -p.vy * 0.3; p.vx *= 0.6;
              if (Math.abs(p.vy) < 1) p.vy = 0;
              break;
            }
          }
        }
        // ── Fuse explosion (normal behavior if no contact) ──
        if (p.fuse <= 0 && !p.exploded) {
          p.exploded = true;
          opps.forEach(opp => {
            if (Math.abs(opp.x - p.x) < 80 && Math.abs((opp.y - 30) - p.y) < 80 && (opp.invincible || 0) <= 0) {
              opp.damage += p.damage; opp.hitstun = 25; opp.state = 'hitstun';
              opp.vx = (opp.x > p.x ? 1 : -1) * 14 * KNOCKBACK_SCALE; opp.vy = -12 * KNOCKBACK_SCALE; opp.grounded = false;
            }
          });
        }
      } else {
        p.explosionR = Math.min(p.maxExplosionR, p.explosionR + 15);
      }
      return p.life > 0;
    }

    return p.life > 0;
  });
}

export function onGenPowerExpire(fighter) {
  if (fighter.powerActive === 'gen_blood_sword' || fighter.powerActive === 'gen_sword_in_hand') {
    fighter.damageBoost = 1;
  }
  if (fighter.powerActive === 'gen_restoration_light' || fighter.powerActive === 'gen_restoration_beam') {
    fighter._genHealPerTick = 0;
  }
  if (fighter.powerActive === 'gen_life_steal_aura') {
    fighter._genLifeStealDot = 0;
  }
  // Restore platform position after shake
  if (fighter.powerActive === 'gen_platform_shake' && fighter.genProjectiles) {
    for (const p of fighter.genProjectiles) {
      if (p.type === 'gen_platform_shake' && p.platform) {
        p.platform.x = p.originalX;
      }
    }
  }
}