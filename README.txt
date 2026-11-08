Gen 1 Character Redesign – Drop-in files
========================================

Replace / add these two files in the same folder as your existing characterRig.js
(and next to emotePose.js):

  characterRig.js          ← replace the old one
  gen1DetailedDraw.js      ← new file

What you get
------------
• All five Gen 1 heroes (g1_fire, g1_water, g1_ice, g1_grass, g1_thunder)
  now draw with the detailed clothing, hair and accessories from your
  reference images instead of the plain colored rig.

• New locomotion states already wired in the rig:
  - running / moving
  - jumping
  - falling
  - landing
  - dashing / airdash
  - wallslide
  - crouching, hitstun, attacking, etc. (unchanged)

How to use the new states
-------------------------
Wherever you currently pass state: 'running' or 'jumping' to drawElement6Rig /
getCharacterRig, you can also pass:

  'dashing'   – strong forward lean, arms back
  'airdash'   – same pose (use while airborne)
  'wallslide' – body pressed toward the wall
  'falling'   – relaxed mid-air pose
  'landing'   – compressed recovery pose

No other files need to change. The detailed art only activates for character
ids that start with "g1_". Every other character continues to use the classic
Element 6 rounded rig.

After dropping the files in, rebuild / refresh the game and select any Gen 1
hero to see the new look + animations.
