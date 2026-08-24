import db from './localBackend';

import React, { useState, useEffect } from 'react';

import GameIcon from "./GameIcon.jsx";

export default function HonoredBotTracking({ onBack }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('matches');
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await db.auth.me().catch(() => null);
        if (user) setMyId(user.id);
        const data = await db.entities.HonoredBotMatch.list('-created_date', 200);
        setMatches(data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  // Aggregate wins per player
  const winCounts = {};
  matches.forEach(m => {
    if (m.winner === 'player') {
      if (!winCounts[m.user_id]) winCounts[m.user_id] = { username: m.username, wins: 0, total: 0 };
      winCounts[m.user_id].wins++;
    }
    if (!winCounts[m.user_id]) winCounts[m.user_id] = { username: m.username, wins: 0, total: 0 };
    winCounts[m.user_id].total++;
  });
  const winLeaderboard = Object.entries(winCounts)
    .map(([uid, v]) => ({ user_id: uid, ...v }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 20);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider flex items-center gap-2">
          <GameIcon emoji="👑" size={20} color="var(--accent)" /> HONORED BOT TRACKING
        </h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">
          <GameIcon emoji="←" size={14} /> BACK
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTab('matches')} className={`px-5 py-2 rounded-lg font-heading text-sm ${tab === 'matches' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          ALL MATCHES ({matches.length})
        </button>
        <button onClick={() => setTab('winners')} className={`px-5 py-2 rounded-lg font-heading text-sm ${tab === 'winners' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          TOP WINNERS
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground font-heading">Loading...</div>
      ) : tab === 'matches' ? (
        <div className="w-full space-y-2 max-h-[60vh] overflow-y-auto">
          {matches.length === 0 ? (
            <div className="text-muted-foreground font-heading text-center py-8">No honored bot matches recorded yet.</div>
          ) : (
            matches.map(m => (
              <div key={m.id} className={`rounded-lg p-3 border ${m.winner === 'player' ? 'bg-accent/10 border-accent/40' : 'bg-card border-border/50'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-heading text-sm font-bold ${m.winner === 'player' ? 'text-accent' : 'text-destructive'}`}>
                        {m.winner === 'player' ? 'WIN' : 'LOSS'}
                      </span>
                      <span className="text-foreground font-heading text-sm">{m.username}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Player: <span className="text-foreground">{m.char_name}</span> vs Bot: <span className="text-foreground">{m.bot_char_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Stocks: <span className="text-accent">{m.player_stocks}</span> - <span className="text-destructive">{m.bot_stocks}</span> | Time: {formatDuration(m.match_duration_seconds || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="w-full space-y-2 max-h-[60vh] overflow-y-auto">
          {winLeaderboard.length === 0 ? (
            <div className="text-muted-foreground font-heading text-center py-8">No winners yet. Be the first to beat the honored bot!</div>
          ) : (
            winLeaderboard.map((p, i) => (
              <div key={p.user_id} className={`flex items-center gap-3 rounded-lg p-3 border ${p.user_id === myId ? 'bg-accent/10 border-accent/40' : 'bg-card border-border/50'}`}>
                <span className="font-heading text-lg w-8 text-center" style={{ color: i < 3 ? 'var(--accent)' : 'var(--muted-foreground)' }}>#{i + 1}</span>
                <div className="flex-1">
                  <span className="font-heading text-sm text-foreground">{p.username}</span>
                </div>
                <div className="text-right">
                  <span className="font-heading text-sm text-accent">{p.wins} wins</span>
                  <span className="text-xs text-muted-foreground ml-2">/ {p.total} matches</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}