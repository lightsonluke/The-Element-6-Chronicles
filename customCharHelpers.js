import db from './localBackend';

// AI-assisted custom character generation.
// Given a player's power description, InvokeLLM produces a complete, balanced
// character definition matching the official hero data structure so it slots
// directly into the fighter engine.

// The JSON schema the AI must return — mirrors the HEROES structure exactly.
const CHAR_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    title: { type: 'string' },
    color: { type: 'string' },
    secondary_color: { type: 'string' },
    weapon: { type: 'string' },
    power_name: { type: 'string' },
    lore: { type: 'string' },
    stats: {
      type: 'object',
      properties: {
        power: { type: 'number' }, speed: { type: 'number' }, defense: { type: 'number' },
        utility: { type: 'number' }, control: { type: 'number' },
      },
    },
    heavyAttack: {
      type: 'object',
      properties: {
        name: { type: 'string' }, desc: { type: 'string' },
        damage: { type: 'number' }, range: { type: 'number' }, duration: { type: 'number' },
        color: { type: 'string' }, type: { type: 'string' }, knockback: { type: 'number' },
      },
    },
    signatures: {
      type: 'object',
      properties: {
        side: { type: 'object', properties: { name: { type: 'string' }, desc: { type: 'string' }, damage: { type: 'number' }, range: { type: 'number' }, duration: { type: 'number' }, color: { type: 'string' }, type: { type: 'string' } } },
        up:   { type: 'object', properties: { name: { type: 'string' }, desc: { type: 'string' }, damage: { type: 'number' }, range: { type: 'number' }, duration: { type: 'number' }, color: { type: 'string' }, type: { type: 'string' } } },
        down: { type: 'object', properties: { name: { type: 'string' }, desc: { type: 'string' }, damage: { type: 'number' }, range: { type: 'number' }, duration: { type: 'number' }, color: { type: 'string' }, type: { type: 'string' } } },
      },
    },
    superMove: {
      type: 'object',
      properties: { name: { type: 'string' }, desc: { type: 'string' }, damage: { type: 'number' }, duration: { type: 'number' }, color: { type: 'string' } },
    },
    power_effect: {
      type: 'object',
      properties: {
        type: { type: 'string' }, name: { type: 'string' },
        duration: { type: 'number' }, cooldown: { type: 'number' },
        damage: { type: 'number' }, knockback: { type: 'number' }, color: { type: 'string' },
      },
    },
    combo_potential: { type: 'string' },
    visual_effects: { type: 'string' },
    particle_effects: { type: 'string' },
    sound_effects: { type: 'string' },
  },
};

const GENERATION_PROMPT = `You are a master game designer for "The Element 6: Heroes of Color", a 2D platform fighter.
The player will describe a power/character concept. Design a COMPLETE, BALANCED character that feels like an official Element 6 hero.

CRITICAL: The power_effect.type you choose MUST be one of these EXACT strings (the game engine executes these):
  stat_boost, freeze_opponent, invincible, teleport, homing, homing_projectile, lightning_strike,
  gravity_flip, energy_ball, beam, dash_slash, earth_drop, shield, heal, spawn_clone, spawn_walls,
  spawn_platform, glue_trap, sonar_pulse, infinite_jumps, range_boost, transform, bubble_trap

Choose the power type that BEST matches the player's described power concept. For example:
  - "teleports and summons ravens" → dash_slash (teleport-based) with damage
  - "shoots fireballs" → homing_projectile with projectileType "fireball"
  - "freezes enemies" → freeze_opponent
  - "creates barriers" → spawn_walls
  - "heals over time" → heal
  - "goes invisible/phases" → invincible
  - "slows enemies" → glue_trap or bubble_trap
  - "shoots lightning" → lightning_strike
  - "throws energy" → energy_ball or beam
  - "controls gravity" → gravity_flip

RULES:
- Stats are 1-10 each. Total should be around 30-35 (balanced, not overpowered).
- Signature damage: 14-22. Heavy damage: 20-26. Super damage: 38-52.
- Power effect cooldown: 14-20. Power effect duration: 0-10 (0 = instant, 10 = max).
- Colors are hex codes (e.g. "#FF6600").
- Attack "type" must be one of: dash, wave, launch, groundSlam, teleSlash, portalStrike, boulderCharge, pillar, quake, freeze, tkPush, levCrush, mindPress, wallRam, barrierUp, cage, beastLunge, wingRise, serpent, shrinkExpand, microBarrage, chronoStrike, timeLift, temporalCage, phaseStrike, intangibleRise, ghostGrab, sonicPulse, echoLift, resonance, flameJet, firePillar, infernoRing, airBlade, airLaunch, vacuumCrush, cloneRush, cloneToss, clonePile, lightningBolt, thunderLaunch, stormGround, adhesiveShot, stickyTrap, webBind, gravCrush, gravInvert, singularity, energyBeam, absorbBurst, overload, crimsonBlade, spearLaunch, detonation, deathWave, soulPull, graveRise, windCharge, aerialSpiral, diveBomb, metalCharge, chromeUpper, ironStomp
- For homing_projectile: include projectileType ("fireball", "electric", or "energy") and color.
- For heal: include healAmount (number) and healOpponents (boolean).
- For spawn_walls/spawn_platform: include duration.
- For lightning_strike: include damage.
- For dash_slash: include damage and knockback.
- Make the character feel unique, thematic, and balanced — like it belongs in the roster.
- Give evocative names to every ability.
- The power_effect MUST have: type, name, duration, cooldown, damage, knockback, color.`;

export async function generateAICharacter(description) {
  const result = await db.integrations.Core.InvokeLLM({
    prompt: `${GENERATION_PROMPT}\n\nPlayer's concept: "${description}"\n\nGenerate the complete character now.`,
    response_json_schema: CHAR_SCHEMA,
    model: 'claude_sonnet_4_6', // High-quality model for rich, balanced character design
  });
  return result;
}

// Convert a generated/custom character definition into the format the fighter
// engine expects (matching HEROES structure + POWER_EFFECTS entry).
export function customCharToHeroDef(cc) {
  const a = cc.abilities || {};
  const pe = cc.power_effect || a.power_effect || {};
  return {
    id: `custom_${cc.id || cc.name}`,
    name: cc.name,
    title: cc.title || 'The Custom',
    color: cc.color || '#FF6600',
    secondaryColor: cc.secondary_color || cc.color || '#FFAA44',
    weapon: cc.weapon || 'Custom',
    power: cc.power_name || pe.name || 'Custom Power',
    isCustom: true,
    stats: cc.stats || { power: 5, speed: 5, defense: 5, utility: 5, control: 5 },
    lore: cc.lore || 'A custom-created fighter.',
    heavyAttack: a.heavyAttack || {
      name: 'Heavy Strike', desc: 'A powerful strike', damage: 22, range: 170, duration: 22,
      color: cc.color || '#FF6600', type: 'dash', knockback: 1.3,
    },
    signatures: a.signatures || {
      side: { name: 'Side Strike', desc: 'A forward strike', damage: 18, range: 180, duration: 20, color: cc.color, type: 'dash' },
      up:   { name: 'Rising Strike', desc: 'An upward strike', damage: 15, range: 120, duration: 18, color: cc.color, type: 'launch' },
      down: { name: 'Ground Strike', desc: 'A downward strike', damage: 20, range: 150, duration: 22, color: cc.color, type: 'groundSlam' },
    },
    superMove: a.superMove || {
      name: 'Ultimate Move', desc: 'A devastating ultimate', damage: 45, duration: 55, color: cc.color,
    },
  };
}

export function customCharToPowerEffect(cc) {
  const pe = cc.power_effect || (cc.abilities && cc.abilities.power_effect) || {};
  return {
    type: pe.type || 'stat_boost',
    name: pe.name || cc.power_name || 'Custom Power',
    duration: pe.duration || 5,
    cooldown: pe.cooldown || 16,
    damage: pe.damage || 20,
    knockback: pe.knockback || 1.2,
    color: pe.color || cc.color,
  };
}