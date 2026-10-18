SPLIT CITY REPLACEMENT — corrected artwork and collision alignment

Replace the included source files in the project root and copy public/art/stages/split-city/ to the same public path.

Corrections in this package:
- Main platform uses the complete supplied 1536x1024 image. It is scaled uniformly to preserve its original proportions; no short crop or squashing.
- Main platform collision is a single rectangle: x=75, y=500, width=1130, height=338. Its standing line is aligned with the centre of the front purple light strip; the side and bottom collider edges match the rendered image bounds.
- Mini platform image is the original attachment named “Split City Moving(L:R above main platform In intervals)Drop Through Mini Platfrom.png” (the version without the 6 emblem), not the main-platform art. It is placed higher at y=310.
- Mini platform uses only a top collision. Its collider is 220x16, with no solid sides or underside. Jumping up through it is allowed; down+jump drops through.
- Horizontal movement is set for approximately 45 seconds one-way (about 90 seconds for a full left-right-left cycle).
- Wall sliding remains enabled and the two-jump wall-contact change is retained.

I verified the included source edits and JavaScript syntax. I have not run the full game, so please test the visual alignment and controls in-game before publishing.
