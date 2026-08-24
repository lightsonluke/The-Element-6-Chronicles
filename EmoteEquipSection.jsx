import React, { useState } from 'react';
import { EMOTES as ALL_EMOTES, getEmoteById } from './emotes.js';
import { SOLO_KEYS, COOP_P2_KEYS, COOP_P1_KEYS, ownsEmote, setEmoteSlot, getVictoryEmote, setVictoryEmote } from './emoteSlots.js';
import EmotePreview from './EmotePreview.jsx';
import GameIcon from './GameIcon.jsx';

// Emote equip section — assign owned emotes to number-key slots.
// Solo/Online: 10 slots (keys 1-0). Co-op: P1 gets 5 (keys 6-0), P2 gets 5 (keys 1-5).
// An "armed" emote stays selected so you can click multiple slots to assign it.
export default function EmoteEquipSection({ char, ownedEmotes = [], equippedEmotes = {}, onEquipEmote }) {
  const [mode, setMode] = useState('solo'); // 'solo' | 'coop'
  const [selectedSlot, setSelectedSlot] = useState(null); // { playerId, slotIndex }
  const [armedEmote, setArmedEmote] = useState(null); // emoteId that's "loaded" for multi-slot assign
  const [activePlayer, setActivePlayer] = useState(1); // for co-op: which player's slots to edit

  const ownedEmoteList = ALL_EMOTES.filter(e => ownsEmote(ownedEmotes, e.id));

  const handleSlotClick = (playerId, slotIndex) => {
    // If an emote is armed, assign it to this slot immediately (multi-slot link)
    if (armedEmote) {
      const newEquipped = setEmoteSlot(equippedEmotes, playerId, slotIndex, armedEmote);
      onEquipEmote?.(newEquipped);
      return; // keep armed so user can click more slots
    }
    setSelectedSlot({ playerId, slotIndex });
  };

  const handleEmoteClick = (emoteId) => {
    if (selectedSlot) {
      // Slot-first flow: assign to the selected slot, then arm for more slots
      const newEquipped = setEmoteSlot(equippedEmotes, selectedSlot.playerId, selectedSlot.slotIndex, emoteId);
      onEquipEmote?.(newEquipped);
      setSelectedSlot(null);
      setArmedEmote(emoteId); // arm so user can click more slots with the same emote
    } else {
      // Emote-first flow: toggle armed state
      setArmedEmote(prev => prev === emoteId ? null : emoteId);
    }
  };

  const handleClearSlot = (playerId, slotIndex) => {
    const newEquipped = setEmoteSlot(equippedEmotes, playerId, slotIndex, null);
    onEquipEmote?.(newEquipped);
  };

  const renderSlot = (key, playerId, slotIndex, slots) => {
    const emoteId = slots[slotIndex];
    const emote = emoteId ? getEmoteById(emoteId) : null;
    const isSelected = selectedSlot?.playerId === playerId && selectedSlot?.slotIndex === slotIndex;
    return (
      <div key={`${playerId}-${slotIndex}`}
        className={`relative rounded-lg border-2 p-1 flex flex-col items-center cursor-pointer transition ${isSelected ? 'border-accent bg-accent/10 scale-105' : 'border-border bg-card hover:border-primary/50'}`}
        onClick={() => handleSlotClick(playerId, slotIndex)}>
        <span className="text-[9px] font-heading text-muted-foreground absolute top-0.5 left-1">[{key}]</span>
        {emote ? (
          <>
            <EmotePreview emoteId={emote.id} char={char} size={48} />
            <p className="text-[7px] font-heading text-center leading-tight">{emote.name}</p>
            <button onClick={(e) => { e.stopPropagation(); handleClearSlot(playerId, slotIndex); }}
              className="absolute top-0.5 right-0.5 text-[8px] text-muted-foreground hover:text-destructive">✕</button>
          </>
        ) : (
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-[16px] text-muted-foreground/40">+</span>
          </div>
        )}
      </div>
    );
  };

  const soloSlots = equippedEmotes?.emoteSlots || [];
  const coopP1Slots = equippedEmotes?.emoteSlots || [];
  const coopP2Slots = equippedEmotes?.emoteSlotsP2 || [];
  const victoryEmoteId = getVictoryEmote(equippedEmotes);
  const [selectingVictory, setSelectingVictory] = useState(false);

  const handleVictoryClick = (emoteId) => {
    const newEquipped = setVictoryEmote(equippedEmotes, emoteId);
    onEquipEmote?.(newEquipped);
    setSelectingVictory(false);
  };

  const handleClearVictory = () => {
    const newEquipped = setVictoryEmote(equippedEmotes, null);
    onEquipEmote?.(newEquipped);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Armed emote indicator */}
      {armedEmote && (
        <div className="bg-primary/20 border-2 border-primary rounded-lg p-2 flex items-center gap-2">
          <span className="text-[10px] font-heading text-primary">ARMED:</span>
          <EmotePreview emoteId={armedEmote} char={char} size={32} />
          <span className="text-[9px] font-heading text-primary">{getEmoteById(armedEmote)?.name}</span>
          <span className="text-[9px] text-muted-foreground flex-1">Click any slot to assign. Same emote can go in multiple slots.</span>
          <button onClick={() => setArmedEmote(null)} className="text-[9px] text-muted-foreground hover:text-foreground px-2">DISARM</button>
        </div>
      )}

      {/* Victory emote slot */}
      <div className="bg-accent/10 border-2 border-accent/40 rounded-xl p-3 flex flex-col gap-2">
        <p className="text-[10px] font-heading text-accent">🏆 VICTORY EMOTE — Played automatically on the victory screen</p>
        <div className="flex items-center gap-3">
          <div className="relative rounded-lg border-2 border-accent bg-card p-1 flex flex-col items-center cursor-pointer transition hover:scale-105"
            onClick={() => setSelectingVictory(!selectingVictory)}>
            {victoryEmoteId ? (
              <>
                <EmotePreview emoteId={victoryEmoteId} char={char} size={48} />
                <p className="text-[7px] font-heading text-center leading-tight">{getEmoteById(victoryEmoteId)?.name}</p>
                <button onClick={(e) => { e.stopPropagation(); handleClearVictory(); }}
                  className="absolute top-0.5 right-0.5 text-[8px] text-muted-foreground hover:text-destructive">✕</button>
              </>
            ) : (
              <div className="w-12 h-12 flex items-center justify-center">
                <span className="text-[16px] text-muted-foreground/40">+</span>
              </div>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground font-body flex-1">
            {victoryEmoteId ? 'Equipped — your character will perform this emote on the victory screen instead of the default celebration.' : 'Click the slot to assign a victory emote.'}
          </p>
        </div>
        {selectingVictory && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-border rounded-lg bg-card/40 mt-1">
            {ownedEmoteList.map(e => (
              <button key={e.id} onClick={() => handleVictoryClick(e.id)}
                className={`rounded-lg border-2 p-1 flex flex-col items-center transition hover:border-accent hover:bg-accent/10 cursor-pointer ${victoryEmoteId === e.id ? 'border-accent bg-accent/10' : 'border-primary/50'}`}>
                <EmotePreview emoteId={e.id} char={char} size={48} />
                <p className="text-[7px] font-heading text-center leading-tight mt-0.5">{e.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 items-center">
        <span className="text-[10px] font-heading text-muted-foreground">MODE:</span>
        <button onClick={() => setMode('solo')} className={`px-3 py-1 rounded font-heading text-[10px] ${mode === 'solo' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>SOLO / ONLINE (10 SLOTS)</button>
        <button onClick={() => setMode('coop')} className={`px-3 py-1 rounded font-heading text-[10px] ${mode === 'coop' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>LOCAL CO-OP (5+5)</button>
      </div>

      {mode === 'solo' ? (
        <div>
          <p className="text-[10px] font-heading text-muted-foreground mb-1">SLOTS — Press number keys 1-0 during battle to trigger (hold to loop)</p>
          <div className="grid grid-cols-5 gap-2">
            {SOLO_KEYS.map((key, i) => renderSlot(key, 1, i, soloSlots))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-heading text-muted-foreground mb-1">PLAYER 1 — Keys 6-0</p>
            <div className="grid grid-cols-5 gap-2">
              {COOP_P1_KEYS.map((key, i) => renderSlot(key, 1, i, coopP1Slots))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-heading text-muted-foreground mb-1">PLAYER 2 — Keys 1-5</p>
            <div className="grid grid-cols-5 gap-2">
              {COOP_P2_KEYS.map((key, i) => renderSlot(key, 2, i, coopP2Slots))}
            </div>
          </div>
        </div>
      )}

      {/* Emote library */}
      <div className="mt-2">
        <p className="text-[10px] font-heading text-muted-foreground mb-1">
          {armedEmote ? 'CLICK SLOTS ABOVE TO ASSIGN ARMED EMOTE' : selectedSlot ? 'CLICK AN EMOTE TO ASSIGN TO SELECTED SLOT' : 'OWNED EMOTES — Click an emote to arm it, then click slots to assign (same emote can fill multiple slots)'}
        </p>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1 border border-border rounded-lg bg-card/40">
          {ownedEmoteList.map(e => (
            <button key={e.id} onClick={() => handleEmoteClick(e.id)}
              className={`rounded-lg border-2 p-1 flex flex-col items-center transition cursor-pointer ${armedEmote === e.id ? 'border-primary bg-primary/20 scale-105' : selectedSlot ? 'border-primary/50 hover:border-accent hover:bg-accent/10' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}>
              <EmotePreview emoteId={e.id} char={char} size={48} />
              <p className="text-[7px] font-heading text-center leading-tight mt-0.5">{e.name}</p>
            </button>
          ))}
          {ownedEmoteList.length === 0 && (
            <p className="text-xs text-muted-foreground col-span-6 text-center py-8">No emotes owned yet! Buy them in the Shop.</p>
          )}
        </div>
      </div>

      {(selectedSlot || armedEmote) && (
        <div className="text-center">
          <button onClick={() => { setSelectedSlot(null); setArmedEmote(null); }} className="text-[10px] text-muted-foreground hover:text-foreground">Cancel selection</button>
        </div>
      )}
    </div>
  );
}