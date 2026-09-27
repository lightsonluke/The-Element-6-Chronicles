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
  return createPortal(children, host);
}
