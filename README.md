# Element 6 — Gen 4 Animation + Shared Wall Replacement

Replace these files in the Element 6 project:

- `gen4AttackAnims.js`
- `fighter.js`

## Gen 4 attack animation rebuild

All Generation IV characters now have fully authored, layered attack visuals for:
- Up Signature
- Down Signature
- Side Signature
- Up Heavy
- Down Heavy
- Side Heavy
- Super

The animation style is intentionally raised to the detail level of the hand-authored Thunder Hero animations: staged startup, layered effects, readable impact frames, trails, secondary particles, and recovery.

### Cobalt Up Signature
Cobalt's Up Signature follows the supplied 12-frame reference sequence directly:
1. startup
2. barrier begins rising
3. barrier rises through Cobalt
4. diagonal spike forms at the top
5. spike catches the opponent hitbox
6–7. upward/outward knockback visual
8. barrier retracts
9. opponent out of range
10. idle/end of attack
11. return to idle
12. ready for next action

The circular effect remains a visual radius; the authored attack hitbox stays in the hitbox system.

## Shared solid walls/barriers

Persistent wall/barrier powers are collected from the fighter and active opponents and inserted into the normal solid-platform collision pass. This makes the wall physically solid to other fighters instead of being creator-only.

Covered persistent wall types:
- `iron_wall`
- `gen_ice_wall`
- `gen_glass_wall`
- `gen_solid_barrier`
- `gen_protect_wall`

No attack damage, character stats, move metadata, or hitbox definitions were intentionally changed by this package.

Validation performed:
- `node --check gen4AttackAnims.js`
- `node --check fighter.js`
