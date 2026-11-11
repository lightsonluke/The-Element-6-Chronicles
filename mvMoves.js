// Single authoritative registry of authored per-character moves (all fighting modes read this through mvBuild).
import { V2MOVES as G1 } from './mvArchV2.js';
import { G2 } from './mvArchV2g2.js';
import { G3, G4 } from './mvArchV2g3.js';
import { G5 } from './mvArchV2g5.js';
export const V2MOVES = { ...G1, ...G2, ...G3, ...G4, ...G5 };
export const MOVE_NAMES = Object.fromEntries(Object.entries(V2MOVES).map(([c, s]) => [c, Object.fromEntries(Object.entries(s).map(([k, m]) => [k, m.name]))]));
