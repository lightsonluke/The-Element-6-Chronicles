import React from 'react';
import { createPortal } from 'react-dom';

const HOST_ID = 'el6-game-canvas-host';

function getHost() {
  if (typeof document === 'undefined' || !document.body) return null;
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.className = 'el6-game-canvas-host';
    document.body.appendChild(host);
  }
  return host;
}

export default function GameCanvasPortal({ children, gameMode = null }) {
  const host = getHost();
  if (!host) return null;
  if (gameMode) host.dataset.gameMode = String(gameMode);
  else delete host.dataset.gameMode;

  // Sports matches must not inherit any transient layout offsets from a
  // previous screen. Keep the shared canvas host physically locked to the
  // viewport; individual game CSS can still size/center the canvas.
  if (gameMode === 'volleyball') {
    host.style.position = 'fixed';
    host.style.left = '0';
    host.style.top = '0';
    host.style.right = '0';
    host.style.bottom = '0';
    host.style.width = '100vw';
    host.style.height = '100dvh';
    host.style.margin = '0';
    host.style.transform = 'none';
  }

  return createPortal(children, host);
}
