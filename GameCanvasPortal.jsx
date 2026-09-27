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
    Object.assign(host.style, {
      position: 'fixed', left: '0px', top: '0px', right: '0px', bottom: '0px',
      width: '100vw', height: '100vh', margin: '0', padding: '0',
      transform: 'none', overflow: 'hidden', boxSizing: 'border-box',
    });
    document.body.appendChild(host);
  }
  Object.assign(host.style, {
    position: 'fixed', left: '0px', top: '0px', right: '0px', bottom: '0px',
    width: '100vw', height: '100vh', margin: '0', padding: '0',
    transform: 'none', overflow: 'hidden', boxSizing: 'border-box',
  });
  return host;
}

export default function GameCanvasPortal({ children, gameMode = null }) {
  const host = getHost();
  if (!host) return null;
  if (gameMode) host.dataset.gameMode = String(gameMode);
  else delete host.dataset.gameMode;
  return createPortal(children, host);
}
