import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { formatNumber } from './formatNumber.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const getCharData = (id) => ALL.find(c => c.id === id);
const PIE_COLORS = ['#22C55E', '#EF4444', '#3B82F6'];

export default function MatchReview({ mode, data, onContinue }) {
  if (mode === 'soccer') return <SoccerReview data={data} onContinue={onContinue} />;
  return <FightReview data={data} onContinue={onContinue} />;
}

function SoccerReview({ data, onContinue }) {
  const stats = data.soccerStats || {};
  const p1 = stats.p1 || {};
  const p2 = stats.p2 || {};
  const won = data.p1Won === true;
  const p1Char = getCharData(data.p1CharId);
  const p2Char = getCharData(data.p2CharId);

  const compareData = [
    { stat: 'Goals', P1: p1.goals || 0, P2: p2.goals || 0 },
    { stat: 'Saves', P1: p1.saves || 0, P2: p2.saves || 0 },
    { stat: 'Shots', P1: p1.shots || 0, P2: p2.shots || 0 },
    { stat: 'On Tgt', P1: p1.shotsOnTarget || 0, P2: p2.shotsOnTarget || 0 },
  ];

  const p1Shots = p1.shots || 0;
  const p1OnTarget = p1.shotsOnTarget || 0;
  const p1Missed = Math.max(0, p1Shots - p1OnTarget);
  const accuracyData = p1Shots > 0 ? [
    { name: 'On Target', value: p1OnTarget },
    { name: 'Missed', value: p1Missed },
  ] : [{ name: 'No Shots', value: 1 }];

  const savePct = p1.shots > 0 ? Math.round((p1.saves || 0) / p1.shots * 100) : 0;
  const accuracyPct = p1Shots > 0 ? Math.round(p1OnTarget / p1Shots * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <span className="text-4xl font-heading drop-shadow-lg" style={{ color: won ? '#FFD700' : '#FF4444' }}>
        {won ? 'VICTORY!' : 'DEFEAT'}
      </span>

      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: p1Char?.color || '#4488FF' }} />
          <span className="font-heading text-sm">{p1Char?.name || 'You'}</span>
        </div>
        <span className="text-xs font-heading text-muted-foreground">VS</span>
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm">{p2Char?.name || 'Opponent'}</span>
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: p2Char?.color || '#AA44FF' }} />
        </div>
      </div>

      <div className="w-full bg-card border border-border rounded-xl p-3">
        <p className="text-xs font-heading text-muted-foreground mb-2">STAT COMPARISON</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={compareData}>
            <XAxis dataKey="stat" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="P1" fill="#4488FF" radius={[3, 3, 0, 0]} />
            <Bar dataKey="P2" fill="#AA44FF" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs font-heading text-muted-foreground mb-1">SHOT ACCURACY</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={accuracyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 9 }}>
                {accuracyData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-lg font-heading text-accent">{accuracyPct}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex flex-col justify-center gap-2">
          <p className="text-xs font-heading text-muted-foreground mb-1">KEY STATS</p>
          <StatRow label="Save %" value={`${savePct}%`} />
          <StatRow label="Goals" value={p1.goals || 0} />
          <StatRow label="Saves" value={p1.saves || 0} />
          <StatRow label="Shots" value={p1.shots || 0} />
          <StatRow label="On Target" value={p1OnTarget} />
        </div>
      </div>

      <button onClick={onContinue} className="px-10 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-80 shadow-lg">CONTINUE</button>
    </div>
  );
}

function FightReview({ data, onContinue }) {
  const result = data.result || {};
  const stats = result.stats || {};
  const won = result.p1Won === true;
  const char = getCharData(data.charId);
  const p2Char = getCharData(data.p2CharId);

  const moveStats = result.moveStats || {};
  const charMoveStats = moveStats[data.charId] || {};
  const moveData = Object.entries(charMoveStats)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), uses: v }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 6);

  const statData = [
    { stat: 'Supers', value: stats.supers || 0 },
    { stat: 'Powers', value: stats.powers || 0 },
    { stat: 'Heavies', value: stats.heavies || 0 },
  ].filter(s => s.value > 0);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <span className="text-4xl font-heading drop-shadow-lg" style={{ color: won ? '#FFD700' : '#FF4444' }}>
        {won ? 'VICTORY!' : 'DEFEAT'}
      </span>

      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: char?.color || '#FFD700' }} />
          <span className="font-heading text-sm">{char?.name || 'You'}</span>
        </div>
        <span className="text-xs font-heading text-muted-foreground">VS</span>
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm">{p2Char?.name || 'Opponent'}</span>
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: p2Char?.color || '#FF4444' }} />
        </div>
      </div>

      {statData.length > 0 && (
        <div className="w-full bg-card border border-border rounded-xl p-3">
          <p className="text-xs font-heading text-muted-foreground mb-2">COMBAT STATS</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={statData}>
              <XAxis dataKey="stat" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {moveData.length > 0 && (
        <div className="w-full bg-card border border-border rounded-xl p-3">
          <p className="text-xs font-heading text-muted-foreground mb-2">MOVE USAGE</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={moveData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={70} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="uses" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 w-full">
        <StatCard label="RESULT" value={won ? 'WIN' : 'LOSS'} color={won ? '#22C55E' : '#EF4444'} />
        <StatCard label="REWARD" value={`${formatNumber(data.coinsEarned || 0)} ◆`} color="#FFD700" />
        <StatCard label="DISTANCE" value={`${Math.round(stats.distance || 0)}m`} color="#4488FF" />
      </div>

      <button onClick={onContinue} className="px-10 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-80 shadow-lg">CONTINUE</button>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground font-body">{label}</span>
      <span className="text-sm font-heading text-foreground">{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-center">
      <p className="text-xs font-heading text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-heading" style={{ color }}>{value}</p>
    </div>
  );
}