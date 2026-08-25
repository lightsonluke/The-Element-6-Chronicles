import React, { useEffect, useState } from 'react';
import GameIcon from './GameIcon.jsx';
import { getMyRankedRating } from './rankedOnline.js';
import { getMyOnlineSportRatings } from './sportsOnline.js';

function rankFor(elo) {
  if (elo >= 2200) return 'ELEMENT 6 ELITE';
  if (elo >= 1900) return 'DIAMOND';
  if (elo >= 1600) return 'PLATINUM';
  if (elo >= 1300) return 'GOLD';
  if (elo >= 1000) return 'SILVER';
  return 'BRONZE';
}
function percent(wins, losses) { const total = (wins || 0) + (losses || 0); return total ? `${Math.round((wins || 0) * 100 / total)}%` : '—'; }

export default function EloScreen({ onBack, botRankedElo = 1000 }) {
  const [fight, setFight] = useState(null); const [sports, setSports] = useState({});
  useEffect(() => { getMyRankedRating().then(setFight).catch(() => {}); getMyOnlineSportRatings().then(setSports).catch(() => {}); }, []);
  const rows = [
    ['Ranked Fights', fight],
    ['Bot Ranked', { rating: botRankedElo, wins: 0, losses: 0 }],
    ['Soccer Ranked', sports.soccer_ranked],
    ['Dodgeball Ranked', sports.dodgeball_ranked],
    ['Volleyball Ranked', sports.volleyball_1v1_ranked],
  ];
  return <div className="w-full max-w-3xl flex flex-col gap-4"><div className="flex justify-between items-center"><h2 className="text-2xl font-heading text-accent">ELO</h2><button onClick={onBack} className="px-4 py-2 bg-secondary rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> MENU</button></div><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-xs"><thead className="bg-secondary"><tr><th className="p-3">MODE</th><th className="p-3">RANK</th><th className="p-3">ELO</th><th className="p-3">WIN RATE</th><th className="p-3">W / L</th></tr></thead><tbody>{rows.map(([name, stats]) => { const elo = stats?.rating ?? 1000; return <tr key={name} className="border-t border-border"><td className="p-3 font-heading">{name}</td><td className="p-3 text-primary">{rankFor(elo)}</td><td className="p-3 text-accent font-heading">{elo}</td><td className="p-3">{percent(stats?.wins, stats?.losses)}</td><td className="p-3">{stats ? `${stats.wins || 0} / ${stats.losses || 0}` : '0 / 0'}</td></tr>; })}</tbody></table></div><p className="text-[10px] text-muted-foreground">Online ratings are finalized after the match result is verified. Bot Ranked is your local single-player rating.</p></div>;
}
