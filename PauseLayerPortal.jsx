import React from 'react';
import { createPortal } from 'react-dom';

export function MatchPausePortal({ children, className = '' }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className={`el6-global-pause-layer ${className}`}>{children}</div>,
    document.body
  );
}

export function MatchPauseButtonPortal({ children }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="el6-global-pause-button-layer">{children}</div>,
    document.body
  );
}
