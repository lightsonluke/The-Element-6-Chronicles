// Combo chains ordered by difficulty (easiest → hardest)
// Allowed move types: sigSide, sigUp, sigDown, heavy (side heavy),
// fastfall, downHeavy (always after fastfall), jump, super

export const COMBOS = [
  // ═══ EASY (2-3 moves) ═══
  { id: 1, name: 'Side-Sig → Side-Heavy', category: 'Momentum-Gravity', difficulty: 'Easy', moves: [
    { display: 'Side-Sig', type: 'sigSide' },
    { display: 'Side-Heavy', type: 'heavy' },
  ]},
  { id: 2, name: 'Side-Sig → Up-Sig', category: 'Momentum-Gravity', difficulty: 'Easy', moves: [
    { display: 'Side-Sig', type: 'sigSide' },
    { display: 'Up-Sig', type: 'sigUp' },
  ]},
  { id: 3, name: 'Down-Sig → Side-Heavy', category: 'Gravity-Lock', difficulty: 'Easy', moves: [
    { display: 'Down-Sig', type: 'sigDown' },
    { display: 'Side-Heavy', type: 'heavy' },
  ]},
  { id: 4, name: 'Up-Sig → Side-Heavy', category: 'Momentum-Gravity', difficulty: 'Easy', moves: [
    { display: 'Up-Sig', type: 'sigUp' },
    { display: 'Side-Heavy', type: 'heavy' },
  ]},
  { id: 5, name: 'Down-Sig → Up-Sig', category: 'Gravity-Lock', difficulty: 'Easy', moves: [
    { display: 'Down-Sig', type: 'sigDown' },
    { display: 'Up-Sig', type: 'sigUp' },
  ]},
  { id: 6, name: 'Jump → Side-Heavy', category: 'Momentum-Gravity', difficulty: 'Easy', moves: [
    { display: 'Jump', type: 'jump' },
    { display: 'Side-Heavy', type: 'heavy' },
  ]},
  { id: 7, name: 'Side-Sig → Jump → Side-Heavy', category: 'Momentum-Gravity', difficulty: 'Easy', moves: [
    { display: 'Side-Sig', type: 'sigSide' },
    { display: 'Jump', type: 'jump' },
    { display: 'Side-Heavy', type: 'heavy' },
  ]},

  // ═══ MEDIUM (3-4 moves with fastfall and jump) ═══
  { id: 8, name: 'Down-Sig → Side-Sig → Side-Heavy', category: 'Gravity-Lock', difficulty: 'Medium', moves: [
    { display: 'Down-Sig', type: 'sigDown' },
    { display: 'Side-Sig', type: 'sigSide' },
    { display: 'Side-Heavy', type: 'heavy' },
  ]},
  { id: 9, name: 'Side-Sig → Up-Sig → Side-Heavy', category: 'Momentum-Gravity', difficulty: 'Medium', moves: [
    { display: 'Side-Sig', type: 'sigSide' },
    { display: 'Up-Sig', type: 'sigUp' },
    { display: 'Side-Heavy', type: 'heavy' },
  ]},
  { id: 10, name: 'Jump → FastFall → Down-Heavy', category: 'Gravity-Lock', difficulty: 'Medium', moves: [
    { display: 'Jump', type: 'jump' },
    { display: 'FastFall', type: 'fastfall' },
    { display: 'Down-Heavy', type: 'downHeavy' },
  ]},
  { id: 11, name: 'Down-Sig → FastFall → Down-Heavy', category: 'Gravity-Lock', difficulty: 'Medium', moves: [
    { display: 'Down-Sig', type: 'sigDown' },
    { display: 'FastFall', type: 'fastfall' },
    { display: 'Down-Heavy', type: 'downHeavy' },
  ]},
  { id: 12, name: 'Side-Heavy → Jump → FastFall → Down-Heavy', category: 'Gravity-Lock', difficulty: 'Medium', moves: [
    { display: 'Side-Heavy', type: 'heavy' },
    { display: 'Jump', type: 'jump' },
    { display: 'FastFall', type: 'fastfall' },
    { display: 'Down-Heavy', type: 'downHeavy' },
  ]},
  { id: 13, name: 'Up-Sig → Jump → Side-Heavy', category: 'Momentum-Gravity', difficulty: 'Medium', moves: [
    { display: 'Up-Sig', type: 'sigUp' },
    { display: 'Jump', type: 'jump' },
    { display: 'Side-Heavy', type: 'heavy' },
  ]},

  // ═══ HARD (3-4 moves with Super finish) ═══
  { id: 14, name: 'Side-Sig → Side-Heavy → Super', category: 'Ultimate-Finish', difficulty: 'Hard', moves: [
    { display: 'Side-Sig', type: 'sigSide' },
    { display: 'Side-Heavy', type: 'heavy' },
    { display: 'Super', type: 'super' },
  ]},
  { id: 15, name: 'Down-Sig → Side-Heavy → Super', category: 'Ultimate-Finish', difficulty: 'Hard', moves: [
    { display: 'Down-Sig', type: 'sigDown' },
    { display: 'Side-Heavy', type: 'heavy' },
    { display: 'Super', type: 'super' },
  ]},
  { id: 16, name: 'Side-Sig → Up-Sig → Super', category: 'Ultimate-Finish', difficulty: 'Hard', moves: [
    { display: 'Side-Sig', type: 'sigSide' },
    { display: 'Up-Sig', type: 'sigUp' },
    { display: 'Super', type: 'super' },
  ]},
  { id: 17, name: 'Up-Sig → Side-Heavy → Super', category: 'Ultimate-Finish', difficulty: 'Hard', moves: [
    { display: 'Up-Sig', type: 'sigUp' },
    { display: 'Side-Heavy', type: 'heavy' },
    { display: 'Super', type: 'super' },
  ]},
  { id: 18, name: 'Down-Sig → Up-Sig → Super', category: 'Ultimate-Finish', difficulty: 'Hard', moves: [
    { display: 'Down-Sig', type: 'sigDown' },
    { display: 'Up-Sig', type: 'sigUp' },
    { display: 'Super', type: 'super' },
  ]},
  { id: 19, name: 'Jump → FastFall → Down-Heavy → Super', category: 'Ultimate-Finish', difficulty: 'Hard', moves: [
    { display: 'Jump', type: 'jump' },
    { display: 'FastFall', type: 'fastfall' },
    { display: 'Down-Heavy', type: 'downHeavy' },
    { display: 'Super', type: 'super' },
  ]},
  { id: 20, name: 'Side-Heavy → FastFall → Down-Heavy → Super', category: 'Ultimate-Finish', difficulty: 'Hard', moves: [
    { display: 'Side-Heavy', type: 'heavy' },
    { display: 'FastFall', type: 'fastfall' },
    { display: 'Down-Heavy', type: 'downHeavy' },
    { display: 'Super', type: 'super' },
  ]},

  // ═══ EXPERT (2-3 moves with Super finish) ═══
  { id: 21, name: 'Side-Heavy → Super', category: 'Ultimate-Finish', difficulty: 'Expert', moves: [
    { display: 'Side-Heavy', type: 'heavy' },
    { display: 'Super', type: 'super' },
  ]},
  { id: 22, name: 'Up-Sig → Super', category: 'Ultimate-Finish', difficulty: 'Expert', moves: [
    { display: 'Up-Sig', type: 'sigUp' },
    { display: 'Super', type: 'super' },
  ]},
  { id: 23, name: 'Jump → Side-Heavy → Super', category: 'Ultimate-Finish', difficulty: 'Expert', moves: [
    { display: 'Jump', type: 'jump' },
    { display: 'Side-Heavy', type: 'heavy' },
    { display: 'Super', type: 'super' },
  ]},
  { id: 24, name: 'FastFall → Down-Heavy → Super', category: 'Ultimate-Finish', difficulty: 'Expert', moves: [
    { display: 'FastFall', type: 'fastfall' },
    { display: 'Down-Heavy', type: 'downHeavy' },
    { display: 'Super', type: 'super' },
  ]},
];

// Map combo move types to the engine's attack inputs for the Honored bot
export function comboMoveToInput(move, inputs, opponent, fighter) {
  switch (move) {
    case 'sigSide':
      inputs.sig = true;
      break;
    case 'sigUp':
      inputs.sig = true; inputs.up = true;
      break;
    case 'sigDown':
      inputs.sig = true; inputs.down = true;
      break;
    case 'heavy':
      inputs.heavy = true;
      break;
    case 'downHeavy':
      inputs.heavy = true; inputs.down = true;
      break;
    case 'fastfall':
      inputs.down = true;
      break;
    case 'jump':
      inputs.jump = true;
      break;
    case 'super':
      inputs.superMove = true;
      break;
  }
}

export function comboMoveReady(fighter, move) {
  switch (move) {
    case 'sigSide':
    case 'sigUp':
    case 'sigDown':
      return fighter.sigCooldown <= 0 && fighter.grounded;
    case 'heavy':
      return fighter.heavyCooldown <= 0;
    case 'downHeavy':
      return fighter.heavyCooldown <= 0 && fighter.grounded;
    case 'fastfall':
      return !fighter.grounded;
    case 'jump':
      return fighter.grounded || fighter.jumps > 0;
    case 'super':
      return fighter.superMeter >= fighter.maxSuper;
    default:
      return false;
  }
}