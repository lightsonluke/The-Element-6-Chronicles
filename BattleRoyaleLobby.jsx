import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ALL_CHARS } from './allCharacters.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import ElementSelect from './ElementSelect.jsx';
import BattleRoyaleEngine from './BattleRoyaleEngine.jsx';
import GameIcon from './GameIcon.jsx';
import PrematchAnimation from './PrematchAnimation.jsx';
import { getEquippedAccessories } from './cosmetics.js';
import {
  findBattleRoyaleMatch,
  getBattleRoyaleMatch,
  getBattleRoyalePlayers,
  subscribeToBattleRoyale,
  startBattleRoyale,
  heartbeatBattleRoyale,
  leaveBattleRoyale,
  finishBattleRoyale,
} from './battleRoyaleOnline.js';

const MAX_PLAYERS = 50;
const MATCHMAKE_SECONDS = 60;
const ALL = ALL_CHARS;
const randChar = () => ALL[Math.floor(Math.random() * ALL.length)].id;
const BOT_DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

export default function BattleRoyaleLobby({ onBack, onEnd, unlockedIds, favoriteId, equippedElements = {}, equippedAccessories = {}, equippedSkins = {}, charLevels = {}, settings = {}, sfxVolume = 70, musicVolume = 50, onEquipElement, equippedShikigami = {}, equippedEmotes = {} }) {
  const [me, setMe] = useState(null);
  const [myChar, setMyChar] = useState(favoriteId || 'yellow');
  const [myElement, setMyElement] = useState(equippedElements?.[favoriteId || 'yellow'] || 'basic');
  const [phase, setPhase] = useState('pick');
  const [matchId, setMatchId] = useState(null);
  const [role, setRole] = useState(null);
  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [countdown, setCountdown] = useState(MATCHMAKE_SECONDS);
  const [error, setError] = useState(null);
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [botDifficulty, setBotDifficulty] = useState('honored');
  const startedRef = useRef(false);
  const matchRef = useRef(null);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('menu');
    import('./supabaseClient.js').then(({ supabase }) => supabase.auth.getUser().then(({ data }) => setMe(data.user || null)).catch(() => setMe(null)));
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => { setMyElement(equippedElements?.[myChar] || 'basic'); }, [equippedElements, myChar]);

  const refreshMatch = useCallback(async (id = matchId) => {
    if (!id) return;
    try {
      const [m, ps] = await Promise.all([getBattleRoyaleMatch(id), getBattleRoyalePlayers(id)]);
      if (!m) return;
      matchRef.current = m;
      setMatch(m);
      const roster = Array.isArray(m.settings?.roster) && m.settings.roster.length ? m.settings.roster : ps;
      setPlayers(roster);
      if (m.settings?.maxPlayers) setMaxPlayers(Number(m.settings.maxPlayers));
      if (m.settings?.botDifficulty) setBotDifficulty(m.settings.botDifficulty);
      if (m.status === 'playing' && !startedRef.current) {
        startedRef.current = true;
        setPhase('prematch');
        sfx.matchFound();
      }
      if (m.status === 'finished' && phase !== 'fight') {
        setError('Match ended.');
        setPhase('pick');
      }
    } catch (e) { setError(e?.message || 'Could not refresh Battle Royale match.'); }
  }, [matchId, phase]);

  useEffect(() => {
    if (!matchId) return;
    refreshMatch(matchId);
    const off = subscribeToBattleRoyale(matchId, () => refreshMatch(matchId));
    const timer = setInterval(() => heartbeatBattleRoyale(matchId).catch(() => {}), 5000);
    return () => { off(); clearInterval(timer); };
  }, [matchId, refreshMatch]);

  useEffect(() => {
    if (phase !== 'queue' || role !== 'host' || !matchId) return;
    const deadline = Date.now() + MATCHMAKE_SECONDS * 1000;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setCountdown(left);
      const realCount = players.filter(p => !p.is_bot).length;
      if (left <= 0 || realCount >= maxPlayers) {
        clearInterval(t);
        beginMatch();
      }
    }, 500);
    return () => clearInterval(t);
  }, [phase, role, matchId, players, maxPlayers]);

  const findMatch = async charId => {
    if (!me) { setError('Sign in to play Battle Royale online.'); return; }
    const char = charId || myChar;
    if (charId) setMyChar(charId);
    setError(null); startedRef.current = false; setPhase('queue');
    try {
      const result = await findBattleRoyaleMatch({
        char_id: char,
        element: myElement,
        username: me.user_metadata?.username || me.user_metadata?.full_name || me.email?.split('@')[0] || 'Player',
        equippedAccessories: getEquippedAccessories(equippedAccessories, char),
        equippedSkins,
        equippedShikigami,
      });
      setMatchId(result.match_id);
      setRole(result.role);
      setCountdown(MATCHMAKE_SECONDS);
      await refreshMatch(result.match_id);
    } catch (e) {
      setError(e?.message || 'Could not join Battle Royale matchmaking.');
      setPhase('pick');
    }
  };

  const beginMatch = async () => {
    if (role !== 'host' || !matchId || startedRef.current) return;
    try {
      const real = (players || []).filter(p => !p.is_bot);
      const target = Math.max(2, Math.min(MAX_PLAYERS, maxPlayers));
      const used = new Set(real.map(p => p.char_id));
      const bots = [];
      while (real.length + bots.length < target) {
        let id = randChar();
        let guard = 0;
        while (used.has(id) && used.size < ALL.length - 1 && guard++ < 100) id = randChar();
        used.add(id);
        bots.push({ user_id: `bot_${bots.length}`, username: `BOT ${bots.length + 1}`, char_id: id, element: 'basic', is_bot: true, accessories: [], equippedSkins: {}, equippedShikigami: {} });
      }
      const finalPlayers = [...real, ...bots].map((p, i) => ({ ...p, slot: i }));
      await startBattleRoyale(matchId, { maxPlayers: target, botDifficulty, roster: finalPlayers });
      await refreshMatch(matchId);
    } catch (e) {
      setError(e?.message || 'Could not start Battle Royale.');
    }
  };

  const cancelSearch = async () => {
    try { await leaveBattleRoyale(matchId); } catch {}
    setMatchId(null); setMatch(null); setPlayers([]); setRole(null); setPhase('pick'); startedRef.current = false;
  };

  if (phase === 'prematch' && matchId) {
    const participants = players.slice(0, 12).map((p, i) => {
      const c = ALL.find(x => x.id === p.char_id);
      return c ? { char: c, side: i % 2 === 0 ? 1 : 2, teamColor: i % 2 === 0 ? '#4488FF' : '#AA44FF' } : null;
    }).filter(Boolean);
    return <PrematchAnimation participants={participants} sport="battle-royale" title="BATTLE ROYALE" onDone={() => setPhase('fight')} sfxVolume={sfxVolume} musicVolume={musicVolume} />;
  }

  if (phase === 'fight' && matchId) {
    const roster = players.length ? players : (Array.isArray(match?.settings?.roster) ? match.settings.roster : []);
    return <BattleRoyaleEngine
      matchId={matchId} role={role} myUserId={me?.id} myChar={myChar} myElement={myElement}
      players={roster} sfxVolume={sfxVolume} musicVolume={musicVolume} settings={settings}
      matchSettings={match?.settings || { botDifficulty, maxPlayers }}
      equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
      equippedShikigami={equippedShikigami} equippedEmotes={equippedEmotes}
      onEnd={async res => { if (role === 'host') { try { await finishBattleRoyale(matchId, res || {}); } catch {} } onEnd?.(res); }}
    />;
  }

  const realCount = players.filter(p => !p.is_bot).length;
  return <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
    <div className="flex justify-between items-center w-full">
      <h2 className="text-2xl font-heading text-accent tracking-wider">BATTLE ROYALE</h2>
      <button onClick={() => { cancelSearch(); onBack(); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
    </div>
    <div className="bg-card border border-border rounded-xl p-3 w-full max-w-md text-center">
      <p className="text-xs text-muted-foreground font-body">Online Battle Royale · one authoritative host simulation · up to 50 fighters.</p>
    </div>
    {error && <p className="text-xs text-destructive font-body">{error}</p>}
    {phase === 'pick' && <UniversalCharacterSelect title="PICK YOUR FIGHTER" startLabel="➜ NEXT" unlockedIds={unlockedIds || ['yellow']} favoriteId={favoriteId} playerCount={1} banCustomChars hidePedestals onStart={c1 => { setMyChar(c1); setMyElement(equippedElements?.[c1] || 'basic'); setPhase('element'); }} onBack={onBack} />}
    {phase === 'element' && <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <p className="text-xs font-heading text-muted-foreground">FIGHTER: <span className="text-accent">{ALL.find(c => c.id === myChar)?.name}</span></p>
      <ElementSelect charId={myChar} currentElement={myElement} onSelect={setMyElement} charLevels={charLevels} label="YOUR ELEMENT" />
      {role === 'host' && <div className="w-full grid grid-cols-2 gap-2"><label className="text-xs font-heading">MAX PLAYERS<select value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} className="w-full mt-1 bg-secondary rounded p-2">{[2,4,8,12,16,25,50].map(n => <option key={n} value={n}>{n}</option>)}</select></label><label className="text-xs font-heading">BOT DIFFICULTY<select value={botDifficulty} onChange={e => setBotDifficulty(e.target.value)} className="w-full mt-1 bg-secondary rounded p-2">{BOT_DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}</select></label></div>}
      <div className="flex gap-2"><button onClick={() => setPhase('pick')} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm">← BACK</button><button onClick={() => findMatch()} className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm shadow-lg">🔍 FIND MATCH</button></div>
    </div>}
    {phase === 'queue' && <div className="flex flex-col items-center gap-4 py-10 w-full max-w-md">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="font-heading text-lg text-accent animate-pulse">SEARCHING FOR PLAYERS…</p>
      <div className="bg-card border border-border rounded-lg p-4 w-full text-center"><p className="font-heading text-3xl text-accent">{realCount} / {maxPlayers}</p><p className="text-xs text-muted-foreground">real players joined</p><p className="text-[10px] text-muted-foreground mt-2">Match starts in <span className="text-accent font-heading">{countdown}s</span> — bots fill the rest</p></div>
      {role === 'host' && realCount >= 1 && <button onClick={beginMatch} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm">START NOW</button>}
      <button onClick={cancelSearch} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm">CANCEL</button>
    </div>}
  </div>;
}
