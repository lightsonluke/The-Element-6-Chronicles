Split City stage replacement — v7

Included: only the stage/game source files and assets needed for this replacement.

Changes in v7:
- Main platform uses the newly attached full-height image with the large lower wall.
- Main collider keeps the existing top and side alignment and ends at y=812, where the visible wall ends. Its rectangle is x=95..1185 and y=450..812.
- Moving platform uses the newly attached thin platform image (without the large lower wall).
- Moving platform starts at y=210 and has a 220x16 top-only/one-way collider; no solid sides or underside are added by the platform collider.
- Horizontal travel is 700 pixels, approximately 45 seconds each way with the current movement runtime.

Install by replacing the corresponding files in the project. Back up the original files first.

Validation: source was edited and the JavaScript syntax was checked. The full game was not launched here, so in-game alignment and controls still require a test in the target project.
