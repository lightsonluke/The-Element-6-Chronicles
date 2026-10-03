WATER HERO — FLUID FRAME-BY-FRAME SCREEN-SAFE FIX

This patch fixes the runtime error that caused the canvas to remain translated/scaled after a Water attack. The missing lerp helper is restored, all Gen 1 attack/super draw wrappers now use try/finally so canvas transforms are ALWAYS restored, and the Water attacks remain native Canvas animations (reference images are not used as sprites).

Water moves are reconstructed from the supplied frame sheet with flowing layered water bodies, tapered streams, droplets/spray, and frame-to-frame motion:
- Up Signature: ring forms, separates, arcs upward, fades.
- Down Signature: twin rising splash sheets.
- Side Signature: forming/curling water whip.
- Up Heavy: wrapping spiral/ribbon and upward launch.
- Down Heavy: floating sphere, drop/impact, upward burst.
- Side Heavy: thick crescent water blade and breakup spray.
- Super: gather, rotating sphere, collapse/explosion, expanding ring stages.

The reference images are not loaded or drawn in-game.

Replace:
  gen1AttackAnims.js
  attackSpecs.js
  fighter.js
  eras.js
  upHeavies.js
  downHeavies.js

Do NOT replace renderer.js.
