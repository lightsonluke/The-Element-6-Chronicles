// Shared backdrop list used by Stage Editor, My Stages, and World Stages previews.
export const STAGE_BACKDROPS = [
  { id: 'city', name: 'Split City', colors: ['#0a0820', '#1a1250'] },
  { id: 'forest', name: 'Forest', colors: ['#0a2010', '#1a4020'] },
  { id: 'void', name: 'Void', colors: ['#05010a', '#150030'] },
  { id: 'sunset', name: 'Sunset', colors: ['#1a0a30', '#FF6644'] },
  { id: 'ocean', name: 'Ocean', colors: ['#001030', '#004488'] },
  { id: 'volcano', name: 'Volcano', colors: ['#1a0500', '#FF3300'] },
  { id: 'space', name: 'Deep Space', colors: ['#000005', '#100020'] },
  { id: 'arctic', name: 'Arctic', colors: ['#0a0a30', '#4488CC'] },
  { id: 'desert', name: 'Desert', colors: ['#2a1a00', '#CCAA44'] },
  { id: 'jungle', name: 'Jungle', colors: ['#0a2000', '#226622'] },
  { id: 'sky', name: 'Sky Temple', colors: ['#001122', '#4488FF'] },
  { id: 'underworld', name: 'Underworld', colors: ['#0a0005', '#440022'] },
  { id: 'neon', name: 'Neon City', colors: ['#0a0020', '#FF00AA'] },
  { id: 'ruins', name: 'Ancient Ruins', colors: ['#1a1000', '#443322'] },
  { id: 'crystal', name: 'Crystal Cave', colors: ['#0a0a20', '#AA44FF'] },
  { id: 'storm', name: 'Storm', colors: ['#050510', '#334466'] },
  { id: 'dawn', name: 'Dawn', colors: ['#1a1040', '#FFAA88'] },
  { id: 'midnight', name: 'Midnight', colors: ['#000010', '#000033'] },
  { id: 'aurora', name: 'Aurora', colors: ['#000510', '#44FF88'] },
  { id: 'ember', name: 'Ember', colors: ['#100000', '#FF6600'] },
  { id: 'opal', name: 'Opal Cave', colors: ['#1a0a2a', '#2a1a4a'] },
];

export function getBackdrop(id) {
  return STAGE_BACKDROPS.find(b => b.id === id) || STAGE_BACKDROPS[0];
}