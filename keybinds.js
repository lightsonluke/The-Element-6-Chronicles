export const DEFAULT_KEYBINDS = {
  p1: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    down: 'ArrowDown',
    sig: ',',
    power: '.',
    superMove: '/',
    heavy: 'l',
  },
  p2: {
    left: 'a',
    right: 'd',
    jump: 'w',
    down: 's',
    sig: 'v',
    power: 'c',
    superMove: 'x',
    heavy: 'f',
  },
};

// WASD preset — an alternative full control set for players who prefer WASD
export const WASD_KEYBINDS = {
  p1: {
    left: 'a',
    right: 'd',
    jump: 'w',
    down: 's',
    sig: 'f',
    power: 'g',
    superMove: 'h',
    heavy: 'v',
  },
  p2: {
    left: 'j',
    right: 'l',
    jump: 'i',
    down: 'k',
    sig: 'o',
    power: 'p',
    superMove: 'u',
    heavy: ';',
  },
};

export const KEYBIND_ACTIONS = [
  { id: 'left', label: 'Move Left' },
  { id: 'right', label: 'Move Right' },
  { id: 'jump', label: 'Jump' },
  { id: 'down', label: 'Down / Fast Fall' },
  { id: 'sig', label: 'Signature' },
  { id: 'power', label: 'Power' },
  { id: 'superMove', label: 'Super Move' },
  { id: 'heavy', label: 'Heavy Attack' },
];

// Get the full set of keybinds based on the active main control setting.
// Returns { p1, p2 } — the active control scheme used by the game.
export function getKeybinds(settings) {
  const main = settings?.mainControl;
  if (main === 'wasd') return { p1: { ...WASD_KEYBINDS.p1 }, p2: { ...WASD_KEYBINDS.p2 } };
  if (typeof main === 'number' && settings?.customControls?.[main]) {
    const cc = settings.customControls[main];
    return {
      p1: { ...DEFAULT_KEYBINDS.p1, ...cc.p1 },
      p2: { ...DEFAULT_KEYBINDS.p2, ...cc.p2 },
    };
  }
  // Legacy fallback: settings.keybinds overrides default arrows
  if (settings?.keybinds) {
    return {
      p1: { ...DEFAULT_KEYBINDS.p1, ...settings.keybinds.p1 },
      p2: { ...DEFAULT_KEYBINDS.p2, ...settings.keybinds.p2 },
    };
  }
  return { p1: { ...DEFAULT_KEYBINDS.p1 }, p2: { ...DEFAULT_KEYBINDS.p2 } };
}

// Resolve keybinds for a specific scheme identifier used in "choose your controls" screens.
// scheme can be: 'p1' (arrows), 'p2' (wasd), 'custom_0', 'custom_1', 'custom_2'
export function getSchemeKeybinds(settings, scheme) {
  const kb = getKeybinds(settings);
  if (scheme === 'p1' || scheme === undefined || scheme === null) return kb.p1;
  if (scheme === 'p2') return kb.p2;
  if (typeof scheme === 'string' && scheme.startsWith('custom_')) {
    const idx = parseInt(scheme.split('_')[1], 10);
    const cc = settings?.customControls?.[idx];
    if (cc) return { ...DEFAULT_KEYBINDS.p1, ...cc.p1 };
  }
  return kb.p1;
}

// Get the solo-control keybinds — the single keybind set to auto-use when playing alone.
// Returns null if no solo control is set (caller should fall back to readSinglePlayerInput).
export function getSoloKeybinds(settings) {
  const solo = settings?.soloControl;
  if (solo === undefined || solo === null) return null;
  if (solo === 'arrows') return { ...DEFAULT_KEYBINDS.p1 };
  if (solo === 'wasd') return { ...WASD_KEYBINDS.p1 };
  if (typeof solo === 'number' && settings?.customControls?.[solo]) {
    return { ...DEFAULT_KEYBINDS.p1, ...settings.customControls[solo].p1 };
  }
  return null;
}

// Get the list of control options for UI dropdowns / "choose your controls" screens.
export function getControlOptions(settings) {
  const opts = [
    { id: 'p1', label: 'Arrows' },
    { id: 'p2', label: 'WASD' },
  ];
  (settings?.customControls || []).forEach((cc, i) => {
    if (!cc) return; // deleted slots leave null holes — skip them
    opts.push({ id: `custom_${i}`, label: cc.name || `Custom ${i + 1}` });
  });
  return opts;
}

export function readPlayerInput(keys, binds) {
  return {
    left: !!keys[binds.left],
    right: !!keys[binds.right],
    jump: !!keys[binds.jump],
    up: !!keys[binds.jump],
    down: !!keys[binds.down],
    sig: !!keys[binds.sig],
    power: !!keys[binds.power],
    superMove: !!keys[binds.superMove],
    heavy: !!keys[binds.heavy],
  };
}

export function readSinglePlayerInput(keys, p1binds, p2binds) {
  return {
    left: !!keys[p1binds.left] || !!keys[p2binds.left],
    right: !!keys[p1binds.right] || !!keys[p2binds.right],
    jump: !!keys[p1binds.jump] || !!keys[p2binds.jump],
    up: !!keys[p1binds.jump] || !!keys[p2binds.jump],
    down: !!keys[p1binds.down] || !!keys[p2binds.down],
    sig: !!keys[p1binds.sig] || !!keys[p2binds.sig],
    power: !!keys[p1binds.power] || !!keys[p2binds.power],
    superMove: !!keys[p1binds.superMove] || !!keys[p2binds.superMove],
    heavy: !!keys[p1binds.heavy] || !!keys[p2binds.heavy],
  };
}

export function formatKey(key) {
  if (!key) return '—';
  const map = {
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    ' ': 'Space', Shift: 'Shift', Control: 'Ctrl', Alt: 'Alt',
    Enter: 'Enter', Backspace: '⌫', Tab: 'Tab', Escape: 'Esc',
  };
  if (map[key]) return map[key];
  if (key.length === 1) return key.toUpperCase();
  return key;
}