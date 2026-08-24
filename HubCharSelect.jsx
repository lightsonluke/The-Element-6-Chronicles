import React from 'react';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';

export default function HubCharSelect({ unlockedIds = [], customCharsData = {}, favoriteId, onEnter, onBack }) {
  return (
    <UniversalCharacterSelect
      title="👥 CHOOSE YOUR CHARACTER"
      startLabel="ENTER THE COMMUNITY HUB →"
      unlockedIds={unlockedIds}
      favoriteId={favoriteId}
      customCharsData={customCharsData}
      playerCount={1}
      hidePedestals
      onStart={(c1) => onEnter?.(c1)}
      onBack={onBack}
    />
  );
}