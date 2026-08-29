import db from './localBackend';

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
import { getEquippedAccessories } from './cosmetics.js';
import { supabase } from './supabaseClient.js';

const MAX_PLAYERS = 50;
const MATCHMAKE_SECONDS = 60;
const ALL = ALL_CHARS;
const randChar = () => ALL[Math.floor(Math.random() * ALL.length)].id;
const BOT_DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

export default function BattleRoyaleLobby({ onBack, onEnd, unlockedIds, favoriteId, equippedElements = {}, equippedAccessories = {}, equippedSkins = {}, charLevels = {}, settings = {}, sfxVolume = 70, musicVolume = 50, onEquipElement, equippedShikigami = {}, equippedEmotes = {} }) {
  const [me, setMe] = useState(null);
  const [myChar, setMyChar] = useState(favoriteId || 'yellow');
  const [myElement, setMyElement] = useState(equippedElements?.[favoriteId || 'yellow'] || 'basic');
  const [phase, setPhase] = useState('pick'); // pick | element | queue | fight
  const [matchId, setMatchId] = useState(null);
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

  // When entering the element phase, check whether any open match exists.
  // If one exists you will JOIN as a guest (host controls settings); otherwise
  // you will CREATE as the host and your settings apply.
  useEffect(() => {
    if (phase !== 'element' || !me) return;
    let cancelled = false;
    (async () => {
      try {
        const open = await db.entities.BattleRoyaleMatch.filter({ status: 'searching' });
        const joinable = (open || []).filter(c => c.host_user_id !== me.id);
        if (!cancelled) setWillBeHost(joinable.length === 0);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [phase, me]);

  // Subscribe to the active match for player-count updates + start signal.
  useEffect(() => {
    if (!matchId) return;
    matchIdRef.current = matchId;
    let unsub = () => {};
    const refresh = async () => {
      try {
        const m = await db.entities.BattleRoyaleMatch.get(matchId);
        if (m) { setMatch(m); setPlayers(m.players || []); if (m.status === 'active' && !startedRef.current) startEngine(m); }
      } catch {}
    };
    refresh();
    try {
      unsub = db.entities.BattleRoyaleMatch.subscribe((ev) => {
        if (!ev?.data || ev.data.id !== matchId) return;
        const m = ev.data; setMatch(m); setPlayers(m.players || []);
        if (m.status === 'active' && !startedRef.current) startEngine(m);
        if (m.status === 'finished' && phase !== 'fight') { setError('Match ended.'); setPhase('pick'); }
      });
    } catch {}
    const poll = setInterval(refresh, 1000);
    return () => { unsub(); clearInterval(poll); };
    // eslint-disable-next-line
  }, [matchId]);

  const startEngine = useCallback((m) => {
    startedRef.current = true;
    setPlayers(m.players || []);
    setPhase('fight');
    sfx.matchFound();
  }, []);

  // Matchmaking countdown (host only): when it hits 0, fill bots + start.
  useEffect(() => {
    if (phase !== 'queue' || role !== 'host' || !matchId) return;
    setCountdown(MATCHMAKE_SECONDS);
    deadlineRef.current = Date.now() + MATCHMAKE_SECONDS * 1000;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setCountdown(left);
      const realPlayers = (matchRef.current?.players || []).filter(p => !p.is_bot).length;
      if (left <= 0 || realPlayers >= maxPlayers) {
        clearInterval(t);
        beginMatch();
      }
    }, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [phase, role, matchId]);

  const tryJoinExisting = async (char, afterMs = 0) => {
    if (!me) return false;
    const candidates = await db.entities.BattleRoyaleMatch.filter({ status: 'searching' });
    const now = Date.now();
    const joinable = (candidates || [])
      .filter(c => c.host_user_id !== me.id && c.id !== matchIdRef.current)
      .filter(c => (c.players || []).length < (c.max_players || MAX_PLAYERS))
      .filter(c => {
        const created = c.created_date ? new Date(c.created_date).getTime() : 0;
        return (!c.created_date || now - created < 60000) && created > afterMs;
      })
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    for (const c of joinable) {
      try {
        const existing = await db.entities.BattleRoyaleMatch.get(c.id);
        const cur = existing?.players || [];
        if (cur.length >= (c.max_players || MAX_PLAYERS)) continue;
        await db.entities.BattleRoyaleMatch.update(c.id, { players: [...cur, { user_id: me.id, username: me.full_name || (me.email || 'Player').split('@')[0], char_id: char, element: myElement, is_bot: false, accessories: getEquippedAccessories(equippedAccessories, char) }] });
        // Guest adopts the host's room settings for the engine + queue UI.
        const s = existing?.settings || {};
        if (s.botDifficulty) setBotDifficulty(s.botDifficulty);
        if (existing?.max_players) setMaxPlayers(existing.max_players);
        setMatchId(c.id); setRole('guest'); setMatch(existing); return true;
      } catch {}
    }
    return false;
  };

  const findMatch = async (charId) => {
    if (!me) { setError('Not signed in.'); return; }
    const char = charId || myChar;
    if (charId) setMyChar(charId);
    setError(null); startedRef.current = false;
    setPhase('queue');
    try {
      // Clean stale searching matches in a single call (non-blocking)
      try { await db.entities.BattleRoyaleMatch.updateMany({ status: 'searching', host_user_id: me.id }, { $set: { status: 'finished' } }); } catch {}
      // Try to join an existing open match
      let joined = false;
      try { joined = await tryJoinExisting(char); } catch {}
      if (joined) return;
      const brSettings = { botDifficulty };
      const playerEntry = { user_id: me.id, username: me.full_name || (me.email || 'Player').split('@')[0], char_id: char, element: myElement, is_bot: false, accessories: getEquippedAccessories(equippedAccessories, char) };
      const created = await db.entities.BattleRoyaleMatch.create({
        status: 'searching', host_user_id: me.id, host_username: me.full_name || (me.email || 'Player').split('@')[0],
        players: [playerEntry],
        max_players: maxPlayers, guest_inputs: {}, match_state: {}, winner: 'none', settings: brSettings,
      });
      setMatchId(created.id); setRole('host'); setMatch(created);
      hostedCreatedAtRef.current = created.created_date ? new Date(created.created_date).getTime() : Date.now();
    } catch (e) {
      setError('Could not search for matches. Please try again.');
      setPhase('pick');
    }
  };

  // While hosting a searching match, re-scan for newer matches to join. This
  // breaks the deadlock where two players both create matches at the same time
  // and neither finds the other: the older host joins the newer host's match.
  useEffect(() => {
    if (phase !== 'queue' || role !== 'host' || !matchId) return;
    const t = setInterval(async () => {
      if (document.hidden || startedRef.current) return;
      try { await tryJoinExisting(myChar, hostedCreatedAtRef.current); } catch {}
    }, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [phase, role, matchId, myChar]);

  // Host: fill remaining slots with bots and start. Re-fetches the latest match
  // state so newly-joined real players are included, and retries on failure.
  const beginMatch = async () => {
    if (!me || startedRef.current) return;
    startedRef.current = true;
    try {
      // Re-fetch to get the latest player list (guests may have joined since last poll)
      const latest = await db.entities.BattleRoyaleMatch.get(matchIdRef.current || matchId);
      if (!latest) { startedRef.current = false; return; }
      const real = (latest.players || []).filter(p => !p.is_bot);
      const target = latest.max_players || MAX_PLAYERS;
      const usedChars = new Set(real.map(p => p.char_id));
      const bots = [];
      while (real.length + bots.length < target) {
        let id; do { id = randChar(); } while (usedChars.has(id) && usedChars.size < ALL.length - 1);
        usedChars.add(id);
        bots.push({ user_id: `bot_${bots.length}`, username: `BOT ${bots.length + 1}`, char_id: id, element: 'basic', is_bot: true });
      }
      const finalPlayers = [...real, ...bots];
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try { await db.entities.BattleRoyaleMatch.update(latest.id, { status: 'active', players: finalPlayers }); ok = true; } catch { await new Promise(r => setTimeout(r, 500)); }
      }
      if (!ok) { startedRef.current = false; setError('Could not start match. Try again.'); setPhase('pick'); return; }
      setPlayers(finalPlayers);
      setPhase('fight');
      sfx.matchFound();
    } catch { startedRef.current = false; }
  };

  const cancelSearch = async () => {
    if (matchId) { try { await db.entities.BattleRoyaleMatch.update(matchId, { status: 'finished' }); } catch {} }
    setMatchId(null); setMatch(null); setPhase('pick');
  };

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
        onEnd={(res) => { try { db.entities.BattleRoyaleMatch.update(matchId, { status: 'finished' }).catch(() => {}); } catch {} onEnd?.(res); }}
      />
    );
  }

  const realCount = players.filter(p => !p.is_bot).length;
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
