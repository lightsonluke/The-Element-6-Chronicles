export const MOBILE_CONTROL_DEFAULTS = {
  mode: 'arrows',
  joystickDynamic: false,
  joystick: { x: 8, y: 72, size: 92, opacity: 0.72, shape: 'circle', color: '#FFFFFF' },
  buttons: {
    jump: { x: 16, y: 64, size: 58, opacity: 0.72, shape: 'circle', color: '#FFFFFF' },
    down: { x: 16, y: 82, size: 58, opacity: 0.72, shape: 'circle', color: '#FFFFFF' },
    left: { x: 3, y: 73, size: 58, opacity: 0.72, shape: 'circle', color: '#FFFFFF' },
    right: { x: 16, y: 73, size: 58, opacity: 0.72, shape: 'circle', color: '#FFFFFF' },
    power: { x: 80, y: 62, size: 64, opacity: 0.78, shape: 'circle', color: '#FFD700' },
    sig: { x: 68, y: 72, size: 64, opacity: 0.78, shape: 'circle', color: '#FFD700' },
    heavy: { x: 90, y: 72, size: 64, opacity: 0.78, shape: 'circle', color: '#FFD700' },
    superMove: { x: 80, y: 84, size: 64, opacity: 0.82, shape: 'circle', color: '#FF66AA' },
  },
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(Number(n)) ? Number(n) : lo));

export function normalizeMobileControls(value = {}) {
  const src = value || {};
  const d = MOBILE_CONTROL_DEFAULTS;
  const buttons = {};
  for (const [id, def] of Object.entries(d.buttons)) {
    const v = src.buttons?.[id] || {};
    buttons[id] = {
      x: clamp(v.x ?? def.x, 0, 100),
      y: clamp(v.y ?? def.y, 0, 100),
      size: clamp(v.size ?? def.size, 36, 120),
      opacity: clamp(v.opacity ?? def.opacity, 0.15, 1),
      shape: ['circle','square','rounded','pill','diamond','hexagon','triangle'].includes(v.shape) ? v.shape : (def.shape || 'circle'),
      color: typeof v.color === 'string' && /^#[0-9a-f]{6}$/i.test(v.color) ? v.color : (def.color || '#FFFFFF'),
    };
  }
  const j = src.joystick || {};
  return {
    mode: src.mode === 'joystick' ? 'joystick' : 'arrows',
    joystickDynamic: src.joystickDynamic === true,
    joystick: {
      x: clamp(j.x ?? d.joystick.x, 0, 100),
      y: clamp(j.y ?? d.joystick.y, 0, 100),
      size: clamp(j.size ?? d.joystick.size, 60, 160),
      opacity: clamp(j.opacity ?? d.joystick.opacity, 0.15, 1),
      shape: 'circle', color: '#FFFFFF',
    },
    buttons,
  };
}
