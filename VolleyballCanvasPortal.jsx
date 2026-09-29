import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const HOST_ID = 'el6-volleyball-canvas-host';

function getHost() {
  if (typeof document === 'undefined' || !document.body) return null;
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.className = 'el6-volleyball-canvas-host';
    document.body.appendChild(host);
  }
  Object.assign(host.style, {
    position: 'fixed',
    left: '0', top: '0', right: '0', bottom: '0',
    width: '100vw', height: '100dvh',
    margin: '0', padding: '0',
    overflow: 'hidden',
    transform: 'none',
    display: 'block',
    boxSizing: 'border-box',
    zIndex: '2147483000',
  });
  return host;
}

export default function VolleyballCanvasPortal({ children }) {
  const host = getHost();

  useEffect(() => {
    document.documentElement.classList.add('el6-volleyball-active');
    document.body.classList.add('el6-volleyball-active');
    return () => {
      document.documentElement.classList.remove('el6-volleyball-active');
      document.body.classList.remove('el6-volleyball-active');
    };
  }, []);

  if (!host) return null;
  return createPortal(children, host);
}
