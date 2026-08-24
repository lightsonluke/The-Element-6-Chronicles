# Element 6 Chronicles — standalone build

This is a regular Vite + React project with no hosted-platform SDK or plugin.

```sh
pnpm install
pnpm dev
```

Open the local address printed by Vite (normally `http://127.0.0.1:5173`). For a production bundle, run `pnpm build`.

## Local behavior

- A local player profile is created on first sign-in; it is stored in this browser.
- Former entity reads/writes use `localStorage` through `localBackend.js`.
- Realtime/multiplayer records are therefore limited to the same browser profile. A server can be added later behind this adapter without touching game components.
- Online checkout and AI generation are deliberately disabled. File uploads are represented by browser object URLs.
- The lore reader now loads `public/lore.txt`. Replace it with your own licensed lore text if desired.

The original export was a flattened directory tree. Its imports were normalized to root-relative modules, including the two case-conflicting quest component/data modules.
