// brDestructible.js — Battle Royale ONLY: destructible platform sections.
// Each BR platform is divided into independent sections. Powerful attacks
// (sigs, heavies, supers) break the section they hit. Broken sections detach,
// fall, and stop functioning as platforms. The rest of the platform remains.
//
// Broken sections RESPAWN after 10 seconds — the section reappears at its
// original position and becomes collidable again.
//
// Sections are plain platform objects ({x,y,w,h,material}) with extra fields:
//   _pi        — parent platform index
//   _si        — section index within the parent
//   _deleted   — 0 = active, 1 = broken (skipped by engine + bot nav)
//   _fallY/_fallVy — falling animation offset (render only, no collision)
//   _respawnTimer — frames until respawn (0 = active or counting)

const SECTION_W = 120; // width of each destructible section
const RESPAWN_TIME = 600; // 10 seconds at 60fps

// Divide every BR platform into SECTION_W-wide sections. The ground platform
// (y >= 7700) is indestructible so the arena always has a floor. Only ~50%
// of the remaining platforms are destructible — the rest stay solid so the
// arena keeps stable footing and players can't fall through everything.
export function buildDestructiblePlatforms(platforms) {
  const sections = [];
  for (let pi = 0; pi < platforms.length; pi++) {
    const p = platforms[pi];
    const isGround = p.y >= 7700; // ground floor never breaks
    // 50% of non-ground platforms are destructible (deterministic per index so
    // host & guest agree without syncing — every other platform is destructible)
    const indestructible = isGround || (pi % 2 === 0);
    const count = Math.max(1, Math.ceil(p.w / SECTION_W));
    const sw = p.w / count;
    for (let si = 0; si < count; si++) {
      sections.push({
        x: p.x + si * sw,
        y: p.y,
        w: sw,
        h: p.h,
        material: p.material || 'normal',
        _pi: pi,
        _si: si,
        _deleted: 0,
        _fallY: 0,
        _fallVy: 0,
        _fallRot: 0,
        _fallRotV: 0,
        _xOff: 0,
        _fallAlpha: 1,
        _respawnTimer: 0,
        _indestructible: indestructible,
        _parentW: p.w,
        _parentX: p.x,
      });
    }
  }
  return sections;
}

// Active (non-broken) sections — used as the collision platform array.
export function activePlatforms(sections) {
  return sections;
}

// Check if an attacker's current attack hits a platform section and break it.
export function processPlatformDestruction(fighters, sections) {
  for (const a of fighters) {
    if (a._eliminated || a.stocks <= 0) continue;
    const ad = a.attackData;
    if (!ad || ad.hitApplied) continue;
    if (ad.isNormal) continue;
    const p = ad.progress || 0;
    if (p < 0.08 || p > 0.85) continue;

    let breakCount = 1;
    if (ad.isSuper) breakCount = 3;
    else if (ad.isHeavy) breakCount = 2;

    const baseRange = (ad.range || 80) * (a.rangeBoost || 1);
    const facing = a.facing;
    const st = ad.sigType;
    let hbW, hbH, hbCX, hbCY;
    if (st === 'up' || st === 'aerial') {
      hbW = 70; hbH = baseRange; hbCX = a.x; hbCY = a.y - baseRange / 2 - 10;
    } else if (st === 'down' || st === 'downNormal') {
      hbW = 70; hbH = baseRange; hbCX = a.x; hbCY = a.y + baseRange / 2 - 20;
    } else if (st === 'heavy') {
      hbW = baseRange * 1.1; hbH = 80; hbCX = a.x + facing * (hbW / 2 - 10); hbCY = a.y - 30;
    } else {
      hbW = baseRange; hbH = 60; hbCX = a.x + facing * (hbW / 2 - 10); hbCY = a.y - 30;
    }

    const isRecovery = ad.isRecovery;

    // Quick spatial filter: skip all sections if none are near the hitbox
    const hbLeft = hbCX - hbW / 2, hbRight = hbCX + hbW / 2;
    const hbTop = hbCY - hbH / 2, hbBottom = hbCY + hbH / 2;

    let broken = 0;
    for (const s of sections) {
      if (broken >= breakCount) break;
      if (s._deleted || s._indestructible) continue;
      // Fast bounds reject before detailed overlap
      if (s.x > hbRight || s.x + s.w < hbLeft || s.y > hbBottom || s.y + s.h < hbTop) continue;

      const overlap = hbLeft < (s.x + s.w) && hbRight > s.x && hbTop < (s.y + s.h) && hbBottom > s.y;
      if (!overlap) continue;

      if (a.grounded && Math.abs(a.y - s.y) < 6 && a.x > s.x - 10 && a.x < s.x + s.w + 10) continue;

      const directlyUnder = a.y > s.y + s.h + 10 && a.y < s.y + s.h + 120 &&
                            a.x > s.x - 20 && a.x < s.x + s.w + 20;
      if (directlyUnder && !isRecovery) continue;

      // Break it
      s._deleted = 1;
      s._fallVy = 0.5 + Math.random() * 1.5;
      s._fallVx = (Math.random() - 0.5) * 2;
      s._fallRot = 0;
      s._fallRotV = (Math.random() - 0.5) * 0.04;
      s._respawnTimer = RESPAWN_TIME;
      broken++;
    }
  }
}

// Animate broken sections — they fall down, drift sideways, rotate, and
// fade away as they drop. After the fall finishes they stay gone until respawn.
export function updateFallingSections(sections, dt) {
  const FADE_FRAMES = 120; // ~2 seconds of falling + fading
  for (const s of sections) {
    if (!s._deleted) continue;
    if (s._respawnTimer > 0) {
      s._respawnTimer--;
      // Physics: gravity pulls the broken chunk down, drift sideways, rotate
      s._fallVy = (s._fallVy || 0) + 0.55;
      if (s._fallVy > 18) s._fallVy = 18;
      s._fallY = (s._fallY || 0) + s._fallVy;
      s._xOff = (s._xOff || 0) + (s._fallVx || 0);
      s._fallRot = (s._fallRot || 0) + (s._fallRotV || 0);
      // Fade out as it falls — alpha reaches 0 around when FADE_FRAMES expires
      const elapsed = RESPAWN_TIME - s._respawnTimer;
      if (elapsed < FADE_FRAMES) {
        s._fallAlpha = 1 - (elapsed / FADE_FRAMES);
      } else {
        s._fallAlpha = 0;
      }
      if (s._respawnTimer <= 0) {
        s._deleted = 0;
        s._fallY = 0;
        s._fallVy = 0;
        s._xOff = 0;
        s._fallRot = 0;
        s._fallRotV = 0;
        s._fallVx = 0;
        s._fallAlpha = 1;
      }
    }
  }
}

// Serialize broken sections for network sync (compact: just indices + respawn timer).
export function serializeDestructible(sections) {
  const broken = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (s._deleted) broken.push({ i, fy: Math.round(s._fallY || 0), fx: Math.round(s._xOff || 0), fr: Math.round((s._fallRot || 0) * 100), rt: s._respawnTimer || 0 });
  }
  return broken;
}

// Apply broken sections from network sync (guest side).
export function applyDestructibleSync(sections, brokenList) {
  if (!brokenList) return;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const entry = brokenList.find(b => b.i === i);
    if (entry) {
      // Section is broken — update fall animation + respawn timer
      if (!s._deleted) {
        s._deleted = 1;
        s._fallVy = 0.5 + Math.random() * 1.5;
        s._fallVx = (Math.random() - 0.5) * 2;
        s._fallRotV = (Math.random() - 0.5) * 0.04;
      }
      s._fallY = entry.fy;
      s._xOff = entry.fx;
      s._fallRot = entry.fr / 100;
      s._respawnTimer = entry.rt;
    } else if (s._deleted) {
      // Section is no longer in the broken list — respawn it
      s._deleted = 0;
      s._fallY = 0;
      s._fallVy = 0;
      s._xOff = 0;
      s._fallRot = 0;
      s._fallVx = 0;
      s._fallRotV = 0;
      s._respawnTimer = 0;
    }
  }
}

// Check if a position is on a broken section (for bot AI — know where gaps are).
export function isSectionBrokenAt(sections, x, y) {
  for (const s of sections) {
    if (!s._deleted) continue;
    if (x > s.x && x < s.x + s.w && Math.abs(y - s.y) < 30) return true;
  }
  return false;
}

// Find the section a fighter is standing on (for bot AI — avoid breaking own section).
export function sectionUnderFighter(sections, fighter) {
  if (!fighter.grounded) return null;
  for (const s of sections) {
    if (s._deleted) continue;
    if (Math.abs(fighter.y - s.y) < 6 && fighter.x > s.x && fighter.x < s.x + s.w) return s;
  }
  return null;
}