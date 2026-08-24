// Controller remapping profiles. Each profile maps logical actions to standard
// gamepad button indices (W3C Standard Gamepad layout) and stick settings.
//
// Standard button indices — physical positions (shared by all controllers):
//   0 bottom face  1 right face   2 left face   3 top face
//   4 LB/L1        5 RB/R1        6 LT/L2       7 RT/R2
//   8 Select/Minus/Share  9 Start/Plus/Options   10 L-Stick  11 R-Stick
//   12 D-Up 13 D-Down 14 D-Left 15 D-Right  16 Home/PS/Logo
//
// Nintendo labels on a Switch Pro Controller:
//   0 = B   1 = A   2 = Y   3 = X   (4 = L, 5 = R, 6 = ZL, 7 = ZR, 8 = -, 9 = +)

export const CONTROLLER_TYPES = [
  { id: 'xbox_one', label: 'Xbox One', icon: '🟩' },
  { id: 'xbox_series', label: 'Xbox Series X|S', icon: '🟩' },
  { id: 'xbox_elite', label: 'Xbox Elite Series 2', icon: '🟩' },
  { id: 'ds4', label: 'PlayStation DualShock 4', icon: '🟦' },
  { id: 'dualsense', label: 'PlayStation DualSense', icon: '🟦' },
  { id: 'switch_pro', label: 'Nintendo Switch Pro', icon: '🟥' },
  { id: 'joy_con_pair', label: 'Joy-Con (Paired)', icon: '🟥' },
  { id: 'joy_con_left', label: 'Joy-Con L (Single)', icon: '🟥' },
  { id: 'joy_con_right', label: 'Joy-Con R (Single)', icon: '🟥' },
  { id: 'xinput', label: 'Generic XInput', icon: '🎮' },
  { id: 'directinput', label: 'Generic DirectInput', icon: '🎮' },
  { id: 'fightstick', label: 'Fight Stick', icon: '🕹' },
];

// Default family assumed when no controller is detected yet. Nintendo is the
// platform's default so button glyphs show Switch-style labels (B/A/Y/X) on the
// Controller Settings screen out of the box.
export const DEFAULT_FAMILY = 'nintendo';

// Button display glyphs per controller family.
export const PROMPT_GLYPHS = {
  xbox: { 0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 8: '☰', 9: '☰', 10: 'LS', 11: 'RS', 12: '↑', 13: '↓', 14: '←', 15: '→', 16: '⌂' },
  playstation: { 0: '✕', 1: '○', 2: '□', 3: '△', 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 8: 'SHARE', 9: 'OPTIONS', 10: 'L3', 11: 'R3', 12: '↑', 13: '↓', 14: '←', 15: '→', 16: 'PS' },
  nintendo: { 0: 'B', 1: 'A', 2: 'Y', 3: 'X', 4: 'L', 5: 'R', 6: 'ZL', 7: 'ZR', 8: '−', 9: '+', 10: 'L stk', 11: 'R stk', 12: '↑', 13: '↓', 14: '←', 15: '→', 16: '⌂' },
  generic: { 0: '1', 1: '2', 2: '3', 3: '4', 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 8: 'S', 9: 'O', 10: 'LS', 11: 'RS', 12: '↑', 13: '↓', 14: '←', 15: '→', 16: '⌂' },
};

// Guess a controller family from the gamepad id string.
export function guessFamily(gp) {
  const id = (gp?.id || '').toLowerCase();
  if (id.includes('xbox') || id.includes('xinput')) return 'xbox';
  if (id.includes('sony') || id.includes('dualshock') || id.includes('dualsense') || id.includes('054c')) return 'playstation';
  if (id.includes('nintendo') || id.includes('200e') || id.includes('joy-con') || id.includes('joycon') || id.includes('pro controller') || id.includes('057e')) return 'nintendo';
  return DEFAULT_FAMILY;
}

// Detect specific Nintendo controller model from gamepad id.
 // Returns: 'pro' | 'joycon_left' | 'joycon_right' | 'joycon_pair' | 'nintendo_generic' | null
export function detectControllerModel(gp) {
  const id = (gp?.id || '').toLowerCase();
  if (!id) return null;
  if (id.includes('pro controller') || id.includes('pro cont')) return 'pro';
  if (id.includes('joy-con') || id.includes('joycon')) {
    // "Joy-Con (L)", "Joy-Con L", "Joy-Con Left"
    if (id.includes('(l)') || id.includes('left') || id.match(/joy-?con\s*l\b/) || id.includes('(l/r)') === false && id.endsWith('l')) return 'joycon_left';
    if (id.includes('(r)') || id.includes('right') || id.match(/joy-?con\s*r\b/) || id.endsWith('r')) return 'joycon_right';
    if (id.includes('pair') || id.includes('l/r') || id.includes('both') || id.includes('combined')) return 'joycon_pair';
    // Single Joy-Con but can't tell which side from id — use button count heuristic
    // Paired Joy-Cons typically report more buttons than a single one
    if (gp.buttons && gp.buttons.length <= 10) return 'joycon_left'; // best guess
    return 'joycon_pair';
  }
  if (id.includes('057e') || id.includes('nintendo') || id.includes('switch')) return 'nintendo_generic';
  return null;
}

// ── Default Profile (Nintendo layout) ──
// Standard indices: 0=B, 1=A, 2=Y, 3=X, 7=ZR, 9=Plus, 12-15=D-Pad.
//   B  → Jump
//   A  → Heavy Attack / Confirm (menus)
//   Y  → Signature (Sig)
//   X  → Power
//   ZR → Super
//   +  → Pause / Menu
//   B  → Back/Deny (menus)
//   Left Stick OR D-Pad → Move / Navigate, press down = fastfall
export const DEFAULT_PROFILE = {
  name: 'Default',
  buttons: {
    jump: 0, heavy: 1, sig: 2, power: 3,
    super: 7, start: 9, menu: 9, confirm: 1, back: 0,
    up: 12, down: 13, left: 14, right: 15,
    emote1: 6, emote2: 6, emote3: 6,
  },
  leftStick: { move: true, deadzone: 0.18, sensitivity: 1, invertX: false, invertY: false },
  rightStick: { deadzone: 0.18, sensitivity: 1 },
  triggers: { sensitivity: 1 },
  vibration: true,
  vibrationStrength: 0.6,
};

// ── Joy-Con Profiles ──
// Single Joy-Cons held horizontally map their limited buttons to fighting actions.
// Paired Joy-Cons use the same layout as the Switch Pro Controller.
// Button indices follow the W3C Standard Gamepad layout where Joy-Cons report it;
// users can rebind via Controller Settings if their platform differs.

// Single Left Joy-Con — held horizontally (stick on left, D-pad becomes face buttons on right)
export const JOYCON_LEFT_PROFILE = {
  name: 'Joy-Con L',
  buttons: {
    // D-pad indices become the 4 face buttons when held sideways
    jump: 15,      // D-Right (top when horizontal) → Jump
    sig: 14,       // D-Left (bottom when horizontal) → Signature (Sig)
    heavy: 12,     // D-Up (right when horizontal) → Heavy Attack
    power: 13,     // D-Down (left when horizontal) → Power
    super: 5,      // SR → Super
    start: 8,      // Minus → Start/Pause
    menu: 8, confirm: 15, back: 13,
    up: 12, down: 13, left: 14, right: 15,
  },
  leftStick: { move: true, deadzone: 0.15, sensitivity: 1, invertX: false, invertY: false },
  rightStick: { deadzone: 0.18, sensitivity: 1 },
  triggers: { sensitivity: 1 },
  vibration: true,
  vibrationStrength: 0.6,
};

// Single Right Joy-Con — held horizontally (stick on right, face buttons on left)
export const JOYCON_RIGHT_PROFILE = {
  name: 'Joy-Con R',
  buttons: {
    jump: 0,       // B (bottom) → Jump
    sig: 2,        // Y (left) → Signature (Sig)
    heavy: 3,      // X (top) → Heavy Attack
    power: 1,      // A (right) → Power
    super: 4,      // SL → Super
    start: 9,      // Plus → Start/Pause
    menu: 9, confirm: 0, back: 1,
    up: 12, down: 13, left: 14, right: 15,
  },
  leftStick: { move: true, deadzone: 0.15, sensitivity: 1, invertX: false, invertY: false },
  rightStick: { deadzone: 0.18, sensitivity: 1 },
  triggers: { sensitivity: 1 },
  vibration: true,
  vibrationStrength: 0.6,
};

// Paired Joy-Cons (or Switch Pro) — full standard layout
export const JOYCON_PAIR_PROFILE = {
  name: 'Joy-Con Pair',
  buttons: {
    jump: 0,       // B → Jump
    heavy: 1,      // A → Heavy Attack
    sig: 2,        // Y → Signature (Sig)
    power: 3,      // X → Power
    super: 7,      // ZR → Super
    start: 9,      // Plus → Start/Pause
    menu: 9, confirm: 1, back: 0,
    up: 12, down: 13, left: 14, right: 15,
  },
  leftStick: { move: true, deadzone: 0.15, sensitivity: 1, invertX: false, invertY: false },
  rightStick: { deadzone: 0.18, sensitivity: 1 },
  triggers: { sensitivity: 1 },
  vibration: true,
  vibrationStrength: 0.6,
};

// ── Per-slot profile storage ──
// Each gamepad slot can have its own profile, so mixed setups
// (e.g. Xbox in slot 0, Joy-Con in slot 1) all work simultaneously.
const SLOT_KEY = 'el6_controller_slot_profiles';

export function getSlotProfileName(slot) {
  try { const raw = localStorage.getItem(SLOT_KEY); if (raw) { const map = JSON.parse(raw); if (map && map[slot] != null) return map[slot]; } } catch {}
  return null;
}

export function setSlotProfileName(slot, name) {
  try { const raw = localStorage.getItem(SLOT_KEY); const map = raw ? JSON.parse(raw) : {}; if (name) map[slot] = name; else delete map[slot]; localStorage.setItem(SLOT_KEY, JSON.stringify(map)); } catch {}
  _activeProfileCache = null;
}

// Auto-assign Joy-Con profiles to slots that don't have one yet.
// Call this when controllers connect or when entering controller settings.
export function autoAssignJoyConProfiles() {
  const gps = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
  let changed = false;
  gps.forEach((gp) => {
    const model = detectControllerModel(gp);
    if (!model) return;
    const existing = getSlotProfileName(gp.index);
    if (existing) return; // don't override user's choice
    if (model === 'joycon_left') { setSlotProfileName(gp.index, 'Joy-Con L'); changed = true; }
    else if (model === 'joycon_right') { setSlotProfileName(gp.index, 'Joy-Con R'); changed = true; }
    else if (model === 'joycon_pair' || model === 'pro') { setSlotProfileName(gp.index, 'Joy-Con Pair'); changed = true; }
  });
  return changed;
}

// Migrate older profile shapes onto the current schema so cached profiles saved
// before the layout change keep working: rename `light`→`sig`, drop the now
// removed `dodge`/`grab` keys, and seed any missing defaults.
function migrateProfile(p) {
  if (!p || typeof p !== 'object') return p;
  const b = p.buttons || {};

  // Detect the legacy "Default" profile (the old Xbox-style default that shipped
  // before the Nintendo-layout change) and replace it with the new canonical
  // DEFAULT_PROFILE so the new starting controls ship automatically.
  const isOldDefault =
    p.name === 'Default' &&
    typeof b.light === 'number' &&
    b.jump === 0 && b.light === 2 && b.heavy === 3 && b.power === 1 && b.super === 5;
  if (isOldDefault) {
    return { ...DEFAULT_PROFILE };
  }

  // Carry over renamed action, fall back to old 'light' index if present.
  if (b.sig == null) b.sig = b.light;
  delete b.light;
  delete b.dodge;
  delete b.grab;
  // Ensure the new menu actions exist.
  if (b.confirm == null) b.confirm = b.jump;
  if (b.back == null) b.back = b.power;
  // Ensure emote defaults exist.
  if (b.emote1 == null) b.emote1 = 6;
  if (b.emote2 == null) b.emote2 = 6;
  if (b.emote3 == null) b.emote3 = 6;
  p.buttons = b;
  return p;
}

export function loadProfiles() {
  try {
    const raw = localStorage.getItem('el6_controller_profiles');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        const migrated = arr.map(p => migrateProfile({ ...p }));
        // Always make sure the built-in Editor / Default profile and the
        // canonical Joy-Con shapes are present and up to date.
        const hasDefault = migrated.some(p => p.name === 'Default');
        const hasL = migrated.some(p => p.name === 'Joy-Con L');
        const hasR = migrated.some(p => p.name === 'Joy-Con R');
        const hasP = migrated.some(p => p.name === 'Joy-Con Pair');
        let next = migrated;
        let changed = false;
        if (!hasDefault) { next = [{ ...DEFAULT_PROFILE }, ...next]; changed = true; }
        // Re-apply canonical Joy-Con shapes so the new button layout ships even
        // if an older cached version exists.
        const merged = next.map(p => {
          if (p.name === 'Joy-Con L' && (!hasL || !de(p, JOYCON_LEFT_PROFILE))) return { ...JOYCON_LEFT_PROFILE };
          if (p.name === 'Joy-Con R' && (!hasR || !de(p, JOYCON_RIGHT_PROFILE))) return { ...JOYCON_RIGHT_PROFILE };
          if (p.name === 'Joy-Con Pair' && (!hasP || !de(p, JOYCON_PAIR_PROFILE))) return { ...JOYCON_PAIR_PROFILE };
          return p;
        });
        const needCanonicals = !hasL || !hasR || !hasP;
        let final = merged;
        if (needCanonicals) {
          if (!hasL) final.push({ ...JOYCON_LEFT_PROFILE });
          if (!hasR) final.push({ ...JOYCON_RIGHT_PROFILE });
          if (!hasP) final.push({ ...JOYCON_PAIR_PROFILE });
        }
        if (changed || needCanonicals) { saveProfiles(final); }
        return final;
      }
    }
  } catch {}
  return [
    { ...DEFAULT_PROFILE },
    { ...JOYCON_LEFT_PROFILE },
    { ...JOYCON_RIGHT_PROFILE },
    { ...JOYCON_PAIR_PROFILE },
  ];
}
// Lightweight deep-equal used only for canonical-shape replacement checks above.
function de(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (Object.keys(a).length !== Object.keys(b).length) return false;
  for (const k in b) { if (typeof b[k] === 'object') { if (!de(a[k], b[k])) return false; } else if (a[k] !== b[k]) return false; }
  return true;
}

export function saveProfiles(list) {
  try { localStorage.setItem('el6_controller_profiles', JSON.stringify(list)); } catch {}
  _activeProfileCache = null;
}

let _activeProfileCache = null;
export function loadActiveProfile() {
  if (_activeProfileCache) return _activeProfileCache;
  try { const n = localStorage.getItem('el6_controller_active'); if (n) { const p = loadProfiles().find(p => p.name === n); if (p) { _activeProfileCache = p; return p; } } } catch {}
  _activeProfileCache = loadProfiles()[0];
  return _activeProfileCache;
}

export function setActiveProfileName(name) {
  try { if (name) localStorage.setItem('el6_controller_active', name); } catch {}
  _activeProfileCache = null;
}

// Resolve the profile for a given gamepad slot.
// Priority: explicit per-slot assignment > Joy-Con auto-detect > active profile.
export function resolveSlotProfile(slot, gp) {
  // Use the gamepad's original index (gp.index) for profile lookup, since
  // per-slot profiles are stored under the original gamepad index, not the
  // position in a filtered array.
  const realSlot = gp?.index ?? slot;
  // 1. Explicit per-slot assignment
  const slotName = getSlotProfileName(realSlot);
  if (slotName) {
    const p = loadProfiles().find(p => p.name === slotName);
    if (p) return p;
  }
  // 2. Auto-detect Joy-Con type
  const model = detectControllerModel(gp);
  if (model === 'joycon_left') return { ...JOYCON_LEFT_PROFILE };
  if (model === 'joycon_right') return { ...JOYCON_RIGHT_PROFILE };
  if (model === 'joycon_pair' || model === 'pro' || model === 'nintendo_generic') return { ...JOYCON_PAIR_PROFILE };
  // 3. Fall back to active profile
  return loadActiveProfile();
}

// Global rumble gate — read once per call from local settings; source of truth
// for the user-facing "Controller Rumble" toggle in Controller Settings.
function rumbleEnabled() {
  try {
    // Read directly from the same settings store used across the app.
    const raw = localStorage.getItem('el6_rumble_enabled');
    if (raw != null) return raw === '1';
  } catch {}
  return true; // Enabled by default.
}
export function setRumbleEnabled(v) {
  try { localStorage.setItem('el6_rumble_enabled', v ? '1' : '0'); } catch {}
}

// Trigger controller rumble on a connected gamepad, honoring both the
// per-profile vibration setting and the global rumble toggle.
export function triggerRumble(index, strong = 0.6, weak = 0.4, duration = 200) {
  if (!rumbleEnabled()) return;
  const prof = loadActiveProfile();
  if (!prof.vibration) return;
  const s = Math.min(1, strong * (prof.vibrationStrength ?? 0.6));
  const w = Math.min(1, weak * (prof.vibrationStrength ?? 0.6));
  const gp = navigator.getGamepads?.()[index];
  if (gp?.vibrationActuator?.playEffect) {
    gp.vibrationActuator.playEffect('dual-rumble', { duration, strongMagnitude: s, weakMagnitude: w }).catch(() => {});
  }
}

// Read a gamepad at the given slot and return a normalized input object matching
// the game's input format: { left, right, jump, up, down, sig, power, superMove, heavy, start, confirm, back }
// Returns null when no gamepad is connected at that slot.
// Each slot uses its own profile (per-slot or auto-detected Joy-Con profile),
// so a single left Joy-Con and a single right Joy-Con can be used as 2 players.
export function readGamepadInput(slot = 0) {
  const gps = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
  const gp = gps[slot];
  if (!gp) return null;
  const prof = resolveSlotProfile(slot, gp);
  const dz = (v, dzv) => (Math.abs(v) < dzv ? 0 : v);
  const apply = (axis, cfg) => {
    let v = dz(gp.axes[axis] || 0, cfg.deadzone ?? 0.18);
    v *= cfg.sensitivity ?? 1;
    if (cfg.invertX && axis % 2 === 0) v = -v;
    if (cfg.invertY && axis % 2 === 1) v = -v;
    return v;
  };
  const btn = (k) => { const idx = prof.buttons[k]; return idx != null && !!gp.buttons[idx]?.pressed; };
  const moveX = prof.leftStick.move ? apply(0, prof.leftStick) : 0;
  const moveY = prof.leftStick.move ? apply(1, prof.leftStick) : 0;
  let left = moveX < -0.15, right = moveX > 0.15;
  let up = moveY < -0.15, down = moveY > 0.15;
  // D-Pad also drives movement/navigation when the stick isn't overriding it.
  if (btn('left')) left = true;
  if (btn('right')) right = true;
  if (btn('up')) up = true;
  if (btn('down')) down = true;
  return {
    left, right, jump: btn('jump'), up, down,
    sig: btn('sig'), heavy: btn('heavy'),
    power: btn('power'), superMove: btn('super'),
    start: btn('start'),
    confirm: btn('confirm'), back: btn('back'),
  };
}