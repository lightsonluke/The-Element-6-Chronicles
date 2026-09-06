
// Battle Royale lobby — character select (reuses UniversalCharacterSelect),
// online matchmaking via the BattleRoyaleMatch entity, then bot-fill + start.
// Host fills empty slots with bots and launches the authoritative engine.

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { ALL_CHARS } from './allCharacters.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import ElementSelect from './ElementSelect.jsx';
import BattleRoyaleEngine from './BattleRoyaleEngine.jsx';
import GameIcon from './GameIcon.jsx';
import PrematchAnimation from './PrematchAnimation.jsx';
import { getEquippedAccessories } from './cosmetics.js';
import { supabase } from './supabaseClient.js';
import { leaveBattleRoyaleMatch } from './battleRoyaleOnline.js';

const MAX_PLAYERS = 50;
const MATCHMAKE_SECONDS = 60;
const ALL = ALL_CHARS;
const randChar = () => ALL[Math.floor(Math.random() * ALL.length)].id;
const BOT_DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

function seededRandom(seed) { let x = (Number(seed) >>> 0) || 0x6d2b79f5; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; }
function buildBattleRoyaleRoster(realPlayers, matchRow, maxCount = 50) {
  const real = [...(realPlayers || [])].sort((a, b) => Number(a.player_slot || 0) - Number(b.player_slot || 0));
  const count = Math.max(1, Math.min(50, Number(matchRow?.max_players || maxCount || 50)));
  const rand = seededRandom(matchRow?.random_seed || matchRow?.id || 1);
  const roster = real.slice(0, count);
  for (let i = roster.length; i < count; i += 1) {
    const char = ALL[Math.floor(rand() * ALL.length)] || ALL[0];
    roster.push({ user_id: `bot:${matchRow.id}:${i + 1}`, username: `BOT ${String(i + 1).padStart(2, '0')}`, char_id: char.id, element: 'basic', accessories: [], player_slot: i + 1, is_bot: true });
  }
  return roster;
}

export default function BattleRoyaleLobby({ onBack, onEnd, unlockedIds, favoriteId, equippedElements = {}, equippedAccessories = {}, equippedSkins = {}, charLevels = {}, settings = {}, sfxVolume = 70, musicVolume = 50, onEquipElement, equippedShikigami = {}, equippedEmotes = {} }) {
  const [me, setMe] = useState(null);
  const [myChar, setMyChar] = useState(favoriteId || 'yellow');
  const [myElement, setMyElement] = useState(equippedElements?.[favoriteId || 'yellow'] || 'basic');
  const [phase, setPhase] = useState('pick'); // pick | element | queue | prematch | fight
  const [matchId, setMatchId] = useState(null);
  const [slot, setSlot] = useState(1);
  const [role, setRole] = useState('host');
  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [countdown, setCountdown] = useState(MATCHMAKE_SECONDS);
  const [error, setError] = useState(null);
  // Host custom settings
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [botDifficulty, setBotDifficulty] = useState('honored');
  const [willBeHost, setWillBeHost] = useState(true);
  const matchRef = useRef(null); matchRef.current = match;
  const matchIdRef = useRef(null);
  const startedRef = useRef(false);
  const deadlineRef = useRef(0);
  const hostedCreatedAtRef = useRef(0);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('menu');
    // Battle Royale matchmaking must read the real Supabase session.  The
    // old local adapter has no knowledge of an email/password login.
    supabase.auth.getUser().then(({ data }) => setMe(data.user || null)).catch(() => setMe(null));
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    if (phase !== 'element' || !me) return;
    setWillBeHost(true);
  }, [phase, me]);

  // Subscribe to the active Supabase match and participant rows.
  useEffect(() => {
    if (!matchId) return;
    matchIdRef.current = matchId;
    let active = true;
    const refresh = async () => {
      try {
        const [{ data: m }, { data: ps }] = await Promise.all([
          supabase.from('online_battle_royale_matches').select('*').eq('id', matchId).maybeSingle(),
          supabase.from('online_battle_royale_players').select('*').eq('match_id', matchId).order('player_slot'),
        ]);
        if (!active || !m) return;
        const mapped = (ps || []).map(p => ({
          user_id: p.user_id, username: p.loadout?.username || (p.user_id === me?.id ? 'You' : 'Player'),
          char_id: p.loadout?.character_id || 'yellow', element: p.loadout?.element || 'basic',
          is_bot: false, accessories: p.loadout?.accessories || [], player_slot: p.player_slot,
        }));
        const roster = buildBattleRoyaleRoster(mapped, m, Number(m.max_players || maxPlayers));
        setMatch(m); setPlayers(roster);
        if (m.status === 'playing' && !startedRef.current) startEngine({ ...m, players: roster });
        if (m.status === 'finished' && phase !== 'fight') { setError('Match ended.'); setPhase('pick'); }
      } catch {}
    };
    refresh();
    const channel = supabase.channel(`br-match:${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_battle_royale_matches', filter: `id=eq.${matchId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_battle_royale_players', filter: `match_id=eq.${matchId}` }, refresh)
      .subscribe();
    const poll = setInterval(refresh, 1500);
    return () => { active = false; clearInterval(poll); supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, [matchId]);

  const startEngine = useCallback((m) => {
    startedRef.current = true;
    const sourcePlayers = Array.isArray(m?.players) && m.players.length ? m.players : players;
    const roster = buildBattleRoyaleRoster(sourcePlayers, m, Number(m?.max_players || maxPlayers));
    setPlayers(roster);
    setPhase('prematch');
    sfx.matchFound();
  }, [players, maxPlayers]);

  // Matchmaking countdown (host only): when it hits 0, fill bots + start.
  useEffect(() => {
    if (phase !== 'queue' || role !== 'host' || !matchId) return;
    setCountdown(MATCHMAKE_SECONDS);
    deadlineRef.current = Date.now() + MATCHMAKE_SECONDS * 1000;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setCountdown(left);
      const realPlayers = Math.max(1, players.filter(p => !p.is_bot).length);
      if (left <= 0 || realPlayers >= maxPlayers) {
        clearInterval(t);
        beginMatch();
      }
    }, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [phase, role, matchId, players, maxPlayers]);

  const findMatch = async (charId) => {
    if (!me) { setError('Not signed in.'); return; }
    const char = charId || myChar;
    if (charId) setMyChar(charId);
    setError(null); startedRef.current = false; setPhase('queue');
    try {
      const loadout = {
        character_id: char, element: myElement,
        accessories: getEquippedAccessories(equippedAccessories, char),
        username: me.full_name || (me.email || 'Player').split('@')[0],
      };
      const { data, error: rpcError } = await supabase.rpc('find_or_create_element6_battle_royale', { p_loadout: loadout });
      if (rpcError) throw rpcError;
      if (!data?.match_id) throw new Error('Invalid Battle Royale matchmaking response.');
      setMatchId(data.match_id); setSlot(Number(data.slot || 1)); setRole(data.role || 'guest');
      const { data: m } = await supabase.from('online_battle_royale_matches').select('*').eq('id', data.match_id).maybeSingle();
      setMatch(m);
    } catch (e) {
      setError(e?.message || 'Could not search for matches.'); setPhase('pick');
    }
  };

  const beginMatch = async () => {
    if (!matchId || role !== 'host' || startedRef.current) return;
    try {
      const { error } = await supabase.rpc('start_element6_battle_royale', { p_match_id: matchId, p_max_players: maxPlayers, p_bot_difficulty: botDifficulty });
      if (error) throw error;
      const { data: m } = await supabase.from('online_battle_royale_matches').select('*').eq('id', matchId).maybeSingle();
      setMatch(m);
      if (m?.status === 'playing') startEngine(m);
    } catch (e) { setError(e?.message || 'Could not start match.'); }
  };

  const cancelSearch = async () => {
    if (matchId) { try { await leaveBattleRoyaleMatch(matchId); } catch {} }
    setMatchId(null); setMatch(null); setPlayers([]); setPhase('pick');
  };

  if (phase === 'prematch' && matchId) {
    const participants = players.slice(0, 12).map((p, i) => {
      const c = ALL.find(x => x.id === p.char_id);
      return c ? { char: c, side: i % 2 === 0 ? 1 : 2, teamColor: i % 2 === 0 ? '#4488FF' : '#AA44FF' } : null;
    }).filter(Boolean);
    return <PrematchAnimation participants={participants} sport="battle-royale" title="BATTLE ROYALE" onDone={() => setPhase('fight')} sfxVolume={sfxVolume} musicVolume={musicVolume} />;
  }

  if (phase === 'fight' && matchId) {
    return (
      <BattleRoyaleEngine
        matchId={matchId} role={role} myUserId={me?.id} myChar={myChar} myElement={myElement}
        players={players} sfxVolume={sfxVolume} musicVolume={musicVolume} settings={settings}
        matchSettings={match?.settings || { botDifficulty }}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
        equippedShikigami={equippedShikigami}
        equippedEmotes={equippedEmotes}
        onEnd={(res) => { onEnd?.(res); }}
      />
    );
  }

  const realCount = Math.max(1, players.filter(p => !p.is_bot).length);
  const botCount = players.filter(p => p.is_bot).length;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider">BATTLE ROYALE</h2>
        <button onClick={() => { cancelSearch(); onBack(); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 w-full max-w-md text-center">
        <p className="text-xs text-muted-foreground font-body">Last fighter standing wins. 50 fighters · honored bots · zone crushes automatically.</p>
      </div>

      {phase === 'pick' && (
        <>
          {error && <p className="text-xs text-destructive font-body">{error}</p>}
          <UniversalCharacterSelect
            title="PICK YOUR FIGHTER"
            startLabel="➜ NEXT"
            unlockedIds={unlockedIds || ['yellow']}
            favoriteId={favoriteId}
            playerCount={1}
            banCustomChars
            hidePedestals
            onStart={(c1) => { setMyChar(c1); setMyElement(equippedElements?.[c1] || 'basic'); setPhase('element'); }}
            onBack={onBack}
          />
        </>
      )}

      {phase === 'element' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          {error && <p className="text-xs text-destructive font-body">{error}</p>}
          <p className="text-xs font-heading text-muted-foreground">FIGHTER: <span className="text-accent">{ALL.find(c => c.id === myChar)?.name}</span></p>
          <ElementSelect charId={myChar} currentElement={myElement} onSelect={setMyElement} charLevels={charLevels} label="YOUR ELEMENT" />
          <div className="flex gap-2">
            <button onClick={() => setPhase('pick')} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
            <button onClick={() => findMatch()} className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90 shadow-lg">🔍 FIND MATCH</button>
          </div>
        </div>
      )}

      {phase === 'queue' && (
        <div className="flex flex-col items-center gap-4 py-10 w-full max-w-md">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg text-accent animate-pulse">SEARCHING FOR PLAYERS…</p>
          <div className="bg-card border border-border rounded-lg p-4 w-full text-center">
            <p className="font-heading text-3xl text-accent">{realCount} / {maxPlayers}</p>
            <p className="text-xs text-muted-foreground font-body">real players joined</p>
            <p className="text-[10px] text-muted-foreground font-body mt-2">Match starts in <span className="text-accent font-heading">{countdown}s</span> — bots fill the rest</p>
          </div>
          {role === 'host' && realCount >= 1 && (
            <button onClick={beginMatch} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-80">START NOW</button>
          )}
          <button onClick={cancelSearch} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">CANCEL</button>
        </div>
      )}
    </div>
  );
}
