import React from 'react';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';

const CPU_ONLY_MODES = ['ranked', 'challenge', 'botbattle'];

// CharacterSelect now delegates to the universal character select screen
// used across ALL game modes. Preserves the same external prop interface.
export default function CharacterSelect({ onStart, onBack, unlockedIds, favoriteId, onSetFavorite, equippedAccessories, equippedSkins, gameMode, charLevels, equippedElements, onEquipElement, defaultCPUDifficulty = 'regular', customCharsData, customNumberMap, ownedCrossovers = [], equippedCrossovers: equippedCxs = {}, onEquipCrossover, charMastery = {}, ownedShikigami = [], equippedShikigami = {}, ownedAccessories = [], onEquipAccessory }) {
  const isRanked = gameMode === 'ranked';
  const cpuOnly = CPU_ONLY_MODES.includes(gameMode);
  const banCustom = ['ranked', 'unranked', 'tournament'].includes(gameMode);

  return (
    <UniversalCharacterSelect
      title="SELECT FIGHTERS"
      modeLabel={`MODE: ${gameMode.toUpperCase()}`}
      startLabel="NEXT: SELECT MAP"
      unlockedIds={unlockedIds}
      favoriteId={favoriteId}
      customCharsData={customCharsData}
      equippedSkins={equippedSkins}
      equippedAccessories={equippedAccessories}
      ownedAccessories={ownedAccessories}
      onEquipAccessory={onEquipAccessory}
      charLevels={charLevels}
      equippedElements={equippedElements}
      onEquipElement={onEquipElement}
      ownedCrossovers={ownedCrossovers}
      equippedCrossovers={equippedCxs}
      onEquipCrossover={onEquipCrossover}
      ownedShikigami={ownedShikigami}
      equippedShikigami={equippedShikigami}
      playerCount={isRanked ? 1 : 2}
      allowCPU
      cpuOnly={cpuOnly}
      rankedRandom={isRanked}
      defaultCPUDifficulty={defaultCPUDifficulty}
      banCustomChars={banCustom}
      charMastery={charMastery}
      onStart={(p1, p2, p2IsCPU, difficulty, p1Element, p2Element, _extra, shikigamiOverride) => onStart(p1, p2, p2IsCPU, difficulty, p1Element, p2Element, shikigamiOverride)}
      onBack={onBack}
    />
  );
}