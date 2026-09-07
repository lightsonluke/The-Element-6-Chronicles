import React from 'react';

/**
 * Drop this into the Home top navigation immediately before Settings.
 * Props:
 *   onOpenClans - existing Home navigation callback that opens ClansScreen
 */
export default function ClansMenuButton({ onOpenClans }) {
  return (
    <button
      type="button"
      onClick={onOpenClans}
      className="rounded-lg px-3 py-2 text-sm font-heading transition hover:bg-secondary"
      aria-label="Open Clans"
    >
      Clans
    </button>
  );
}
