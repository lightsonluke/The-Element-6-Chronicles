// Human-readable descriptions of what each power type does.
// Shared by MeetCharacters, EditCharacters, and PowerInfoCard.

export const POWER_TYPE_INFO = {
  stat_boost: {
    how: 'Self-buff — activates instantly on you.',
    effect: 'Increases speed, attack power, and knockback resistance for the duration.'
  },
  slow_opponent: {
    how: 'Targets your opponent directly.',
    effect: 'Drastically reduces the opponent\'s movement speed for the duration.'
  },
  dash_slash: {
    how: 'Dashes toward your opponent instantly.',
    effect: 'Teleports behind the opponent and delivers a slashing strike from their blind side.'
  },
  teleport: {
    how: 'Warps you across the stage instantly.',
    effect: 'Teleports you to a strategic position near the opponent.'
  },
  earth_drop: {
    how: 'Summons a boulder above your opponent.',
    effect: 'A falling stone drops onto the opponent, dealing heavy damage and knockback.'
  },
  homing: {
    how: 'Self-buff — activates instantly on you.',
    effect: 'Grants a chance to auto-dodge incoming attacks for the duration.'
  },
  shield: {
    how: 'Self-buff — activates instantly on you.',
    effect: 'Raises a protective barrier that blocks or reduces all incoming damage.'
  },
  copy_move: {
    how: 'Targets your opponent directly.',
    effect: 'Mimics the opponent\'s current attack, copying their move temporarily.'
  },
  spawn_clone: {
    how: 'Summons a clone beside you.',
    effect: 'Creates a translucent mirror copy that fights alongside you with boosted damage.'
  },
  bubble_trap: {
    how: 'Targets your opponent directly.',
    effect: 'Encases the opponent in a slow-drifting bubble they cannot escape.'
  },
  transform: {
    how: 'Targets your nearest opponent.',
    effect: 'Shapeshifts into the opponent, copying their stats and abilities for the duration.'
  },
  glue_trap: {
    how: 'Targets your opponent directly.',
    effect: 'Drops a sticky glue trap that slows the opponent drastically and roots them in place.'
  },
  vine_snare: {
    how: 'Targets your opponent directly.',
    effect: 'Ensnars the opponent in vines, rooting them in place and preventing all movement.'
  },
  stage_slice: {
    how: 'Sweeps a blade forward across the stage.',
    effect: 'A wide slashing arc that damages and knocks back opponents it hits.'
  },
  shadow_drain: {
    how: 'Targets your opponent directly.',
    effect: 'Latches a shadow that drains health and slows the opponent over several seconds.'
  },
  marionette: {
    how: 'Targets your opponent directly.',
    effect: 'Seizes control of the opponent like a puppet, stunning and reversing their movement.'
  },
  poison_cloud: {
    how: 'Engulfs your opponent in poison.',
    effect: 'Creates a toxic cloud that deals ongoing damage over several seconds.'
  },
  deep_freeze: {
    how: 'Targets your opponent directly.',
    effect: 'Freezes the opponent solid in a block of ice, fully immobile for the duration.'
  },
  hammer_throw: {
    how: 'Throws a hammer forward that returns to you.',
    effect: 'A spinning hammer deals damage and knockback, then flies back to your hand.'
  },
  pull_all: {
    how: 'Pulls ALL opponents toward you.',
    effect: 'A magnetic force drags every enemy close for a follow-up attack.'
  },
  add_damage: {
    how: 'Targets all opponents.',
    effect: 'Instantly increases the opponent\'s damage meter by a set amount.'
  },
  potion_throw: {
    how: 'Lobs a flask at your opponent.',
    effect: 'A thrown potion that damages and inflicts a slowing brew on hit.'
  },
  sonar_pulse: {
    how: 'Releases an expanding ring from your position.',
    effect: 'A growing pulse that stuns any opponent it washes over.'
  },
  spawn_walls: {
    how: 'Raises walls on both sides of you.',
    effect: 'Summons iron walls that push opponents back and block movement.'
  },
  spawn_platform: {
    how: 'Solidifies air beneath you.',
    effect: 'Creates a temporary floating platform you can stand on.'
  },
  beam: {
    how: 'Fires a beam forward in your facing direction.',
    effect: 'A long-range energy beam that pierces and launches opponents hit.'
  },
  range_boost: {
    how: 'Self-buff — activates instantly on you.',
    effect: 'Extends your attack reach and reduces damage taken for the duration.'
  },
  freeze_opponent: {
    how: 'Targets your opponent directly.',
    effect: 'Freezes the opponent in time — they cannot move or attack for the duration.'
  },
  invincible: {
    how: 'Self-buff — activates instantly on you.',
    effect: 'Become completely intangible — pass through attacks and platforms.'
  },
  homing_projectile: {
    how: 'Fires forward and homes toward your opponent.',
    effect: 'A tracking projectile that chases the opponent and deals damage on hit.'
  },
  flight: {
    how: 'Self-buff — activates instantly on you.',
    effect: 'Grants unlimited jumps and aerial control for the duration.'
  },
  lightning_strike: {
    how: 'Calls down lightning on your opponent.',
    effect: 'A bolt strikes from above, dealing heavy damage to the opponent.'
  },
  pull_opponent: {
    how: 'Yanks your opponent toward you.',
    effect: 'Pulls the enemy close for a follow-up attack.'
  },
  whip_stun: {
    how: 'Cracks a whip forward in your facing direction.',
    effect: 'Damages and stuns the opponent briefly with an electric whip.'
  },
  platform_delete: {
    how: 'Erases platforms from the stage.',
    effect: 'Removes two random platforms for 10 seconds.'
  },
  reverse_controls: {
    how: 'Targets your opponent directly.',
    effect: 'Seizes the opponent\'s mind — their left and right controls are reversed for the duration.'
  },
  damage_over_time: {
    how: 'Targets your opponent directly.',
    effect: 'Inflicts ongoing damage over several seconds.'
  },
  random_effect: {
    how: 'Unleashes chaotic alchemy.',
    effect: 'Triggers random effects — potions, explosions, transformations.'
  },
  gravity_flip: {
    how: 'Targets all opponents. Hold DOWN to affect yourself too.',
    effect: 'Reverses the opponent\'s gravity, launching them upward.'
  },
  energy_ball: {
    how: 'Fires an energy ball forward.',
    effect: 'A tracking energy projectile that scales with your current damage.'
  },
  demon_strike: {
    how: 'Summons a demon that swoops toward your opponent.',
    effect: 'A demonic homing attack that deals damage and knockback.'
  },
  infinite_jumps: {
    how: 'Self-buff — activates instantly on you.',
    effect: 'Jump freely in the air for the duration.'
  },
  heal: {
    how: 'Self-buff — activates instantly on you.',
    effect: 'Gradually restores your damage meter. May revive on KO.'
  },
  gambit: {
    how: 'Gambles for random damage on your opponent.',
    effect: 'Adds a random amount of damage to the opponent — high risk, high reward.'
  },
  elementor_call: {
    how: 'Calls forth 3–7 hollowed entities that charge forward in your facing direction.',
    effect: 'Opponents touched by the entities lose their power for 30 seconds and suffer knockback but no damage.'
  },
};

export function getPowerDescription(charId, charData = null) {
  const effect = getPowerEffect(charId, charData) || POWER_EFFECTS_REF[charId];
  if (!effect) return null;
  const info = POWER_TYPE_INFO[effect.type] || { how: 'Self-buff or targeted effect.', effect: 'See power details.' };
  return {
    name: effect.name,
    type: effect.type,
    duration: effect.duration,
    cooldown: effect.cooldown,
    howToUse: effect.how || info.how,
    effectDesc: effect.effect || info.effect,
  };
}

// Late binding to avoid circular import
import { POWER_EFFECTS, getPowerEffect } from './powerEffects.js';
const POWER_EFFECTS_REF = POWER_EFFECTS;