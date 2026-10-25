# Gen 2 fighter implementation audit — 2026-10-25

## Scope

Modified game source files:
- `gen2AttackAnims.js`
- `attackSpecs.js`
- `charAttackAnims.js`

The patch retains the existing 13-character Gen 2 architecture. It adds staged super artwork for Renji, Kaito, Hana, Daigo, Suzu, Mai, Osamu, Yui, Ibuki, and Nishikawa; adds separate Ittō Return Return and Meteor Pound artwork/hitbox branches; routes those Ittō moves separately from his seven protected moves; and adds bounded active-window gating for Gen 2 collision checks.

Ittō's existing Up Signature, Down Signature, Side Signature, Up Heavy, Down Heavy, Side Heavy, and Super branches were not intentionally changed.

## Validation actually completed

- `node --check` on the three modified files — PASS.
- JavaScript syntax scan across the project — **202 `.js` files checked, 0 failures**.
- Animation/hitbox sampling — **2,457 cases** (13 character IDs × 9 move families × 21 progress samples); 6,196 collision shapes examined; zero runtime exceptions and zero non-finite coordinates.
- ZIP integrity checks — PASS for the replacement package and full-project archive.

## Build and gameplay status — NOT COMPLETE

- `npm install --ignore-scripts --no-audit --no-fund --progress=false` — attempted for 5 minutes, timed out.
- The npm debug log records registry DNS failures (`EAI_AGAIN`), and the environment has no cached packages. Vite and the project's dependencies are not installed.
- Vite production build — **NOT RUN** because dependencies could not be obtained.
- Browser/in-game combat tests — **NOT RUN**.

So this is a source-validated patch, **not a fully built or gameplay-verified release**. Geometry sampling verifies that the drawing/hitbox functions execute and output finite coordinates; it does not prove that hit timing, damage, hitstun, knockback, grounded/airborne cases, interruptions, or performance are correct in live matches.

## Character status

| Character | Regular move families | Super artwork | Live combat validation |
|---|---|---|---|
| Renji Kurogane | 7 branches inspected and sampled | New staged colossus / spikes / crash | Not tested |
| Kaito Ren | 7 branches inspected and sampled | New flight / flame rain / impact | Not tested |
| Hana Mizushima | 7 branches inspected and sampled | New water wall / surge / spikes | Not tested |
| Daigo Ishikawa | 7 branches inspected and sampled | New stone rise / fall / burst | Not tested |
| Suzu Kaze | 7 branches inspected and sampled | New tornado / blades / launch | Not tested |
| Mai Yoru | 7 branches inspected and sampled | New darkness / clones / slash | Not tested |
| Osamu Tsuchida | 7 branches inspected and sampled | New resonance waves / blast | Not tested |
| Yui Hoshikawa | 7 branches inspected and sampled | New constellation / starlight / burst | Not tested |
| Ibuki | 7 branches inspected and sampled | New drain / vortex / vitality burst | Not tested |
| Nishikawa | 7 branches inspected and sampled | New thread web / bind / snap | Not tested |
| Ittō | Seven protected branches preserved; geometry sampled | Existing super branch preserved | Not tested |
| Twin Foxes | 7 branches inspected and sampled | Existing super branch preserved | Not tested |
| Utsuro | 7 branches inspected and sampled | Existing super branch preserved | Not tested |

## Ittō protected moves

The `itto()` branches for `us`, `ds`, `ss`, `uh`, `sh`, `dh`, and `sp` were not edited by this patch. Separate `recovery` and `groundPound` branches were added. Attack routing recognizes `isRecovery`/`type === 'recovery'` and `isGroundPound`/`type === 'groundPound'`.

## Remaining work before calling this finished

1. Install dependencies in an environment with working npm registry access.
2. Run `npm run build` and fix any build errors.
3. Run the game and validate hit registration, startup/active windows, damage, hitstun, knockback, facing, grounded/airborne behavior, and interruption handling.
4. Tune per-move timings based on observed gameplay rather than relying on fallback timing metadata.
