GENERATION I AUTHORED ATTACK ART + SHARED HITBOX UPDATE

Files to replace/add at the same source folder where fighter.js, attackSpecs.js, and gen1AttackAnims.js live:
- fighter.js (replace)
- attackSpecs.js (replace)
- gen1AttackAnims.js (replace)
- gen1AttackGeometry.js (NEW FILE)
- gen1AttackArt.js (NEW FILE)

What this patch changes:
- Adds custom, deterministic Canvas art for every move key used by all five Gen-I heroes: up signature, down signature, side signature, up heavy, down heavy, side heavy, recovery, super, and ground pound.
- Fire, Grass, Ice, Thunder, and Water use distinct palettes, line materials, accents, and per-move path variants. Strike lines, boxes, and circles are drawn from the same geometry function used by collision.
- Hitbox timing is derived from the supplied per-character startup/active/endlag frames. The full normalized attack timeline is passed to the geometry function, so the shape moves along the same coordinates shown in the animation rather than a separately guessed active-only shape.
- A confirmed hit consumes the attack's collision shape immediately; the animation can finish its recovery.
- Adds down/away knockback direction for grounded pop-outs and airborne downward/outward hits.
- Keeps decorative trails lightweight and deterministic (fixed-count canvas paths; no particle accumulation).

Authored frame data (startup / active / endlag):
Fire: Up Sig 10/2/13; Down Sig 11/4/27; Side Sig 4/5/17; Up Heavy 14/5/38; Down Heavy 14/4/27; Side Heavy 17/7/37; Recovery 5/3/20; Super 30/15/48; Ground Pound 8/5/19.
Grass: Up Sig 8/2/22; Down Sig 10/5/23; Side Sig 10/2/18; Up Heavy 18/4/29; Down Heavy 20/5/41; Side Heavy 15/6/40; Recovery 5/3/20; Super 31/9/62; Ground Pound 8/5/19.
Ice: Up Sig 9/2/22; Down Sig 14/7/15; Side Sig 9/2/9; Up Heavy 15/7/26; Down Heavy 18/3/41; Side Heavy 18/7/38; Recovery 7/3/27; Super 31/17/51; Ground Pound 16/6/27.
Thunder: Up Sig 5/5/10; Down Sig 6/7/24; Side Sig 4/3/13; Up Heavy 12/3/32; Down Heavy 23/3/27; Side Heavy 21/4/38; Recovery 4/5/15; Super 27/18/57; Ground Pound 5/2/14.
Water: Up Sig 9/2/13; Down Sig 7/3/26; Side Sig 7/4/9; Up Heavy 21/5/30; Down Heavy 26/3/36; Side Heavy 21/4/32; Recovery 9/4/19; Super 28/10/65; Ground Pound 10/2/29.

Important limitation:
This is a source-code patch, not a captured in-game proof. JavaScript syntax is checked, but the full application build and real match collision tests still need to be run in the project. The visible decorative leaves/ice flecks/lightning details/water spray are non-damaging accents; the outlined main strike silhouette is the collision geometry.
