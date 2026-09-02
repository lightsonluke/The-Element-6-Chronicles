ELEMENT 6 — ICON SYSTEM REPLACEMENT

Replace the existing GameIcon.jsx with this file.

This patch upgrades the existing GameIcon compatibility layer so the game's
existing emoji-style icon calls render as real IconScout Unicons instead of
empty boxes/spans. It also adds semantic icon aliases for newer UI code.

Included categories:
- navigation / arrows
- close / X / check / confirmation
- play / pause / stop / refresh
- trash / delete / edit / copy / save / upload / download
- search / filter / settings / info / warning
- lock / unlock / visibility
- home / map / layers / box / package / folder
- user / users / friends / chat / gift
- trophy / medal / heart / star
- video / camera / image / music / volume
- water / fire / snow / trees / leaf / flower
- flags / running / game / controller
- calendar / chart / clipboard / paperclip
- cloud / server / database / wifi
- stage/editor-oriented icons

The project already declares @iconscout/react-unicons as a dependency.
No new third-party dependency is required.

NOTE:
The icon package is IconScout's Unicons. IconScout's official license says
Unicons can be used in personal and commercial projects under its applicable
license terms. Review the current license for your specific asset/source.
