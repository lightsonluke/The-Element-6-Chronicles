SPLIT CITY REPLACEMENT — v6 collision tuning

Install the included source files in the project root and copy public/art/stages/split-city/ into the same public path.

Changes in this revision:
- Uses the latest attached “Neon Purple Platform with Emblem 6(1).png” texture for both main and moving platform, as requested in the latest message.
- Main artwork keeps its original aspect ratio and visual placement. The main solid collider is now x=95, y=450, w=1090, h=470: its top is raised 50px, its side edges are inset 20px, and its bottom extends much farther down. The rendered art is independently anchored at x=75, y=500, w=1130 so the collider tuning does not squash or shift the main image.
- Moving platform is higher at y=260 and uses a one-way top-only collider (220x16). No side or underside collision is added; down+jump drop-through is supported by the existing soft-platform logic.
- Moving platform travels horizontally across a 700px span, taking about 45 seconds one way. The movement speed floor was lowered so slow stage movement is honored.
- Wall sliding and two-jump wall-contact behavior are retained.

Validation: JavaScript syntax checked. The game itself was not launched here, so verify the final visual/collision alignment in your build.
