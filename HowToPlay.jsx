import React, { useState } from 'react';
import GameIcon from "./GameIcon.jsx";

// Full How-to-Play reference: every stat's effect + every game mode's rules.
// Used by the MainMenu "? HOW TO" button.

const STAT_ROWS = [
  { name: 'Speed',     color: '#FFD700', desc: 'Movement speed and fast-break pace. Higher Speed means you run faster and accelerate quicker.' },
  { name: 'Power',     color: '#FF3322', desc: 'Attack damage and knockback. In Basketball, Power drives dunk force and shot power.' },
  { name: 'Defense',   color: '#C0C0C0', desc: 'Reduces damage taken and extends survival. In Basketball, boosts steals, blocks, and rebounds.' },
  { name: 'Control',   color: '#44CCAA', desc: 'Faster attack recovery and longer hitstun on enemies. In Basketball, improves dribbling, passing, and shooting accuracy.' },
  { name: 'Utility',   color: '#9944CC', desc: 'Higher movement, bigger jumps, longer reach. In Track, gives a small extra stride advantage.' },
];

const MODES = [
  {
    name: 'FIGHTING',
    color: '#7744FF',
    controls: 'P1: Arrows + , sig · . power · L heavy · / super. P2: WASD + V · C · F · X. ESC pauses.',
    objective: 'Rack up damage %, then knock opponents off the stage. 3 stocks each. Win by being the last fighter standing.',
    rewards: 'XP + Element 6 tokens (more for ranked/challenge/sudden death/coin/brawl wins). Ranked wins also raise your bot ELO.',
    tournament: 'Tournament mode runs a 16-player bracket (Round of 16 → Final). Win all 4 rounds for a big token payout.',
  },
  {
    name: 'SOCCER',
    color: '#44AA44',
    controls: 'Signature passes/heads the ball. Power launches it 5× toward the goal. Supers & heavies disabled — sigs only!',
    objective: 'First to 10 goals wins. Goals are behind the wall — shoot through the gap. Own goals bounce off your net.',
    rewards: 'XP for goals, saves, shots on target, and possession. Wins give more tokens. Ties go to extra time → sudden death.',
    tournament: '4-round Round of 16 bracket. Win the tournament for 50 tokens. Soccer Kits are buyable in the Shop.',
  },
  {
    name: 'BASEBALL',
    color: '#886633',
    controls: 'Pitcher: Signature to pitch. Batter: Signature to swing (timing = power). Fielder: Signature to throw, Power to run the runner down.',
    objective: 'Draft 3 characters — assign Pitcher, Infield, Outfield. Score runs by hitting and running bases. Switch sides at 3 outs or 5 runs. Ties → extra innings → sudden death.',
    rewards: 'XP for runs, hits, and strikeouts. Win bonus + tokens. Tournament supported. Buy Baseball Uniforms in the Shop.',
    tournament: '8-team tournament bracket. Outscore each opponent across innings to advance to the championship.',
  },
  {
    name: 'VOLLEYBALL',
    color: '#FF8800',
    controls: 'Signature = bump/serve. Power = set up. Super = switch to your teammate. Flow: Bump → Set → Switch → Jump (↑) → Spike (Sig).',
    objective: 'Each team picks 2 characters. Servers alternate each rotation. Ground the ball on the opponent’s side to score. First to the set point total wins.',
    rewards: 'XP for spikes, digs, and aces. Win bonus + tokens. Tournament supported. Buy Volleyball Uniforms in the Shop.',
    tournament: '8-team bracket — play full sets each round to advance. Win the final for a trophy payout.',
  },
  {
    name: 'BATTLE ROYALE',
    color: '#FF4444',
    controls: 'Same fighter controls as Fighting mode. Up to 30 fighters spawn across a massive multi-tier Split City arena.',
    objective: 'Last fighter standing wins. A shrinking zone deals damage outside the safe circle — stay inside! Loot power-ups for heals, speed, damage, shields, and super meter. Damage builds to 500% — at 500% you auto-die and are eliminated.',
    rewards: 'Win against all HONORED bots for 50 tokens. Top placements in matches with 5+ human players earn tokens (100 for 1st, 75 for 2nd).',
    tournament: 'No tournament — free-for-all survival. Host configures max fighters (up to 30), bot difficulty, zone speed, and loot density.',
  },
  { name: 'DODGEBALL', color: '#FF5555', controls: 'Move, jump, throw with Signature and use Power for a stronger throw. Catching an incoming ball eliminates the thrower.', objective: 'Hit the opposing team or catch their throw. The last team with active players wins.', rewards: 'XP for hits, catches, dodges, and wins.', tournament: 'Play locally, in LAN/custom rooms, or online when the queue is available.' },
  { name: 'BANGER', color: '#55CCFF', controls: 'Move your oscillation target only when the ball is near your own player. Time the hit to launch it across the court.', objective: 'Keep the ball alive and eliminate the other team. Players who are out spectate until the round ends.', rewards: 'XP for returns and winning rounds.', tournament: 'Local and online 3v3 matches require every team slot to be filled.' },
  { name: 'PARKOUR / ROCK CLIMB / ZIPLINE', color: '#66E0FF', controls: 'Use your movement controls to jump, wall-jump, grab holds, and change lanes.', objective: 'Finish quickly or survive for the highest distance.', rewards: 'Personal bests and completed runs are posted to the correct leaderboard after the run.', tournament: 'These are solo challenge sports.' },
];

export default function HowToPlay({ onClose }) {
  const [tab, setTab] = useState('stats');
  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-3xl w-full max-h-[88vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl text-accent tracking-wider">HOW TO PLAY</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none"><GameIcon emoji="✕" size={14} /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('stats')} className={`px-4 py-1.5 rounded-lg font-heading text-xs ${tab === 'stats' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>STATS</button>
          <button onClick={() => setTab('modes')} className={`px-4 py-1.5 rounded-lg font-heading text-xs ${tab === 'modes' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>GAME MODES</button>
        </div>

        {tab === 'stats' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-body mb-2">Every character has 5 stats (rated 3–10). They affect combat and each sport differently:</p>
            {STAT_ROWS.map(r => (
              <div key={r.name} className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="font-heading text-sm" style={{ color: r.color }}>{r.name.toUpperCase()}</span>
                </div>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">{r.desc}</p>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground font-body pt-1">Equip Elements in character select to boost or shift stats. Level up characters by earning XP in any mode.</p>
          </div>
        )}

        {tab === 'modes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MODES.map(m => (
              <div key={m.name} className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <p className="font-heading text-sm mb-2" style={{ color: m.color }}>{m.name}</p>
                <p className="text-[11px] font-body text-foreground/80 mb-1"><b className="text-muted-foreground">Controls:</b> {m.controls}</p>
                <p className="text-[11px] font-body text-foreground/80 mb-1"><b className="text-muted-foreground">Objective:</b> {m.objective}</p>
                <p className="text-[11px] font-body text-foreground/80 mb-1"><b className="text-muted-foreground">XP & Rewards:</b> {m.rewards}</p>
                <p className="text-[11px] font-body text-foreground/80"><b className="text-muted-foreground">Tournament:</b> {m.tournament}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-80">GOT IT</button>
      </div>
    </div>
  );
}
