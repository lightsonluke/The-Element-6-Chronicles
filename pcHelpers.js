import { ALL_CHARS } from './sports.js';

// Shared helpers for Personal Community sub-components
export const resolveChar = (id, custom) => (custom && custom[id]) || ALL_CHARS.find(c => c.id === id) || { id, name: id, color: '#888' };
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];