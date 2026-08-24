import React from 'react';
import GameIcon from "./GameIcon.jsx";

export default function AboutTheGame({ onBack }) {
  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider">ABOUT THE GAME</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="text-center">
          <h3 className="font-heading text-3xl text-white tracking-wider" style={{ textShadow: '0 0 20px rgba(119,68,255,0.6)' }}>THE ELEMENT 6</h3>
          <h4 className="font-heading text-lg tracking-widest mt-1" style={{ color: '#c090ff' }}>HEROES OF COLOR</h4>
        </div>

        <p className="text-sm text-muted-foreground font-body leading-relaxed">
          The Element 6: Heroes of Color is an epic, near-infinite 2D platform fighter based on the Element 6 lore. Choose from 56+ unique fighters across five generations — Heroes, Villains, Guardians, and Generation I-IV legends — each with their own elemental powers, signature moves, power button abilities, and devastating supers. Knock your opponents off the stage to take their stocks — last fighter standing wins!
        </p>

        <div className="space-y-2">
          <h5 className="font-heading text-sm text-accent">GAME MODES</h5>
          <ul className="text-xs text-muted-foreground font-body space-y-1">
            <li>• <span className="text-foreground">Quick Fight</span> — 1v1 battle vs CPU or a friend</li>
            <li>• <span className="text-foreground">Custom Battle</span> — Up to 8 fighters with teams, custom stages, and modifiers</li>
            <li>• <span className="text-foreground">Tournament</span> — Win a 4-round single-elimination bracket</li>
            <li>• <span className="text-foreground">Group Tournament</span> — 32-fighter soccer tournament with group stages and knockout rounds</li>
            <li>• <span className="text-foreground">Grand Circuit</span> — High-stakes competitive mode with restricted knockback and unique rules</li>
            <li>• <span className="text-foreground">Battle Royale</span> — 30 fighters, closing danger zone, loot, and last-one-standing</li>
            <li>• <span className="text-foreground">Ranked</span> — Climb the ELO ladder in bot or online ranked</li>
            <li>• <span className="text-foreground">Story Mode</span> — Explore an open world, mine, craft, and defeat villains</li>
            <li>• <span className="text-foreground">Sports</span> — Soccer, Volleyball, Baseball, Dodgeball, Banger, and more</li>
            <li>• <span className="text-foreground">Combo Trainer</span> — Practice and master character combos with frame data</li>
            <li>• <span className="text-foreground">Online & LAN</span> — Battle players worldwide or on the same network</li>
            <li>• <span className="text-foreground">Community Hub</span> — Hang out, trade, gift, and chat with other players in real time</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h5 className="font-heading text-sm text-accent">FEATURES</h5>
          <ul className="text-xs text-muted-foreground font-body space-y-1">
            <li>• 56+ characters across 5 generations with unique stats, elements, and abilities</li>
            <li>• 55+ stages with hazards, materials, and platform layouts</li>
            <li>• Custom Character Creator — design your own fighter</li>
            <li>• Stage Editor — build and share custom arenas with portals, catapults, and anti-gravity</li>
            <li>• Shikigami — cosmetic spirit companions that follow you in every mode</li>
            <li>• Daily quests, fight quests, and seasonal events with battle passes</li>
            <li>• Skins, accessories, kill effects, and crossover cosmetics</li>
            <li>• Online multiplayer with rollback netcode</li>
            <li>• Trading, gifting, and party system in the Community Hub</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h5 className="font-heading text-sm text-accent">HOW TO PLAY</h5>
          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            Use arrow keys or WASD to move, jump, and attack. Each character has signature moves (side/up/down), a heavy attack, a power ability, and a super move. Build your super meter by dealing damage, then unleash it for a game-changing ultimate. Knock opponents off the stage to take their stocks — last fighter standing wins!
          </p>
        </div>

        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground font-body">© 2026 Element 6 Studios — Made with passion for platform fighter fans.</p>
        </div>
      </div>
    </div>
  );
}