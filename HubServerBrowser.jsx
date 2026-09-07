import db from './localBackend';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sfx } from './sfx.js';
import GameIcon from './GameIcon.jsx';

export default function HubServerBrowser({
  username,
  charColor,
  charName,
  charId,
  onJoin,
  onLeft,
  onClose
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(null);
  const [joined, setJoined] = useState(null);
  const [err, setErr] = useState('');
  const [codeInput, setCodeInput] = useState('');

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('el6_hub_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('el6_hub_recent') || '[]');
    } catch {
      return [];
    }
  });

  const roomSubRef = useRef(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (roomSubRef.current) {
        try {
          roomSubRef.current();
        } catch {}

        roomSubRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let alive = true;

    db.auth.me()
      .then(user => {
        if (alive) {
          setUserId(user?.id || null);
        }
      })
      .catch(() => {
        if (alive) {
          setUserId(null);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setErr('');

    try {
      const list = await db.entities.CustomRoom.filter(
        { status: 'open' },
        '-created_date',
        40
      );

      if (!mountedRef.current) return;

      const hubRooms = (list || []).filter(
        room =>
          room &&
          room.status === 'open' &&
          room.settings?.mode === 'hub'
      );

      setRooms(hubRooms);
    } catch {
      if (mountedRef.current) {
        setErr('Could not load servers.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const makePlayer = useCallback(() => {
    return {
      id: userId,
      name: username || charName || 'Player',
      color: charColor,
      charId,
      x: 200,
      z: 0
    };
  }, [userId, username, charName, charColor, charId]);

  const remember = useCallback(room => {
    if (!room?.id) return;

    setRecent(prev => {
      const next = [
        {
          id: room.id,
          code: room.room_code,
          name: room.stage_name
        },
        ...prev.filter(x => x.id !== room.id)
      ].slice(0, 6);

      try {
        localStorage.setItem(
          'el6_hub_recent',
          JSON.stringify(next)
        );
      } catch {}

      return next;
    });
  }, []);

  const subscribeRoom = useCallback(
    roomId => {
      if (roomSubRef.current) {
        try {
          roomSubRef.current();
        } catch {}

        roomSubRef.current = null;
      }

      if (!roomId) return;

      try {
        roomSubRef.current = db.entities.CustomRoom.subscribe(ev => {
          const room = ev?.data;

          if (!room?.id || room.id !== roomId) return;

          if (!mountedRef.current) return;

          setJoined(room);

          setRooms(prev => {
            if (room.status !== 'open') {
              return prev.filter(r => r.id !== room.id);
            }

            const isHub = room.settings?.mode === 'hub';

            if (!isHub) {
              return prev.filter(r => r.id !== room.id);
            }

            const exists = prev.some(r => r.id === room.id);

            if (!exists) {
              return [room, ...prev];
            }

            return prev.map(r =>
              r.id === room.id ? room : r
            );
          });
        });
      } catch {}
    },
    []
  );

  const beginBusy = () => {
    if (busyRef.current) return false;

    busyRef.current = true;
    setBusy(true);

    return true;
  };

  const endBusy = () => {
    busyRef.current = false;

    if (mountedRef.current) {
      setBusy(false);
    }
  };

  const joinRoom = async room => {
    if (!room?.id) return false;

    if (!userId) {
      setErr('Still loading your account. Try again.');
      return false;
    }

    if (!beginBusy()) return false;

    setErr('');

    try {
      const latest = await db.entities.CustomRoom.filter({
        id: room.id,
        status: 'open'
      });

      const current = latest?.[0];

      if (!current) {
        setErr('That server is no longer available.');
        return false;
      }

      if (current.settings?.mode !== 'hub') {
        setErr('That is not a Community Hub server.');
        return false;
      }

      const players = Array.isArray(current.players)
        ? current.players
        : [];

      const maxPlayers = Number(current.max_players) || 15;

      const alreadyJoined = players.some(
        player => player?.id === userId
      );

      if (
        !alreadyJoined &&
        players.length >= maxPlayers
      ) {
        setErr('Server is full.');
        return false;
      }

      const player = makePlayer();

      const nextPlayers = alreadyJoined
        ? players.map(p =>
            p?.id === userId
              ? { ...p, ...player }
              : p
          )
        : [...players, player];

      const updated = await db.entities.CustomRoom.update(
        current.id,
        {
          players: nextPlayers,
          status: 'open'
        }
      );

      if (!mountedRef.current) return false;

      setJoined(updated);
      setRooms(prev =>
        prev.map(r =>
          r.id === updated.id ? updated : r
        )
      );

      remember(updated);
      subscribeRoom(updated.id);

      onJoin?.(updated);
      sfx.click();

      return true;
    } catch {
      if (mountedRef.current) {
        setErr('Failed to join.');
      }

      return false;
    } finally {
      endBusy();
    }
  };

  const create = async isPrivate => {
    if (!userId) {
      setErr('Still loading your account. Try again.');
      return;
    }

    if (!beginBusy()) return;

    setErr('');

    try {
      const code =
        Math.random()
          .toString(36)
          .slice(2, 7)
          .toUpperCase();

      const player = makePlayer();

      const room = await db.entities.CustomRoom.create({
        room_code: code,
        status: 'open',
        host_user_id: userId,
        host_char: charName,
        stage_name: 'Community Hub',
        max_players: 15,
        players: [player],
        settings: {
          mode: 'hub',
          private: Boolean(isPrivate)
        }
      });

      if (!mountedRef.current) return;

      setJoined(room);
      setRooms(prev => [room, ...prev]);
      remember(room);
      subscribeRoom(room.id);

      onJoin?.(room);
      sfx.purchaseSuccess();
    } catch {
      if (mountedRef.current) {
        setErr('Failed to create.');
      }
    } finally {
      endBusy();
    }
  };

  const joinByCode = async () => {
    const code = codeInput.trim().toUpperCase();

    if (!code) return;

    if (!userId) {
      setErr('Still loading your account. Try again.');
      return;
    }

    if (!beginBusy()) return;

    setErr('');

    try {
      const found = await db.entities.CustomRoom.filter({
        room_code: code,
        status: 'open'
      });

      const room = found?.[0];

      if (!room) {
        setErr('No server with that code.');
        return;
      }

      if (room.settings?.mode !== 'hub') {
        setErr('That code does not belong to a Community Hub server.');
        return;
      }

      /*
       * Do not call joinRoom here because joinRoom manages
       * its own busy state.
       *
       * Release this busy lock first, then let joinRoom handle it.
       */
      endBusy();
      await joinRoom(room);
      return;
    } catch {
      setErr('Failed.');
    } finally {
      if (busyRef.current) {
        endBusy();
      }
    }
  };

  const randomJoin = async () => {
    if (!beginBusy()) return;

    setErr('');

    try {
      const pool = rooms.filter(
        room =>
          room?.status === 'open' &&
          room?.settings?.mode === 'hub' &&
          !room?.settings?.private &&
          (room.players || []).length <
            (Number(room.max_players) || 15)
      );

      if (!pool.length) {
        endBusy();
        await create(false);
        return;
      }

      const room =
        pool[Math.floor(Math.random() * pool.length)];

      endBusy();
      await joinRoom(room);
    } catch {
      if (mountedRef.current) {
        setErr('Could not find a server.');
      }

      if (busyRef.current) {
        endBusy();
      }
    }
  };

  const toggleFav = room => {
    if (!room?.id) return;

    setFavorites(prev => {
      const exists = prev.some(
        favorite => favorite.id === room.id
      );

      const next = exists
        ? prev.filter(favorite => favorite.id !== room.id)
        : [
            ...prev,
            {
              id: room.id,
              code: room.room_code,
              name: room.stage_name
            }
          ];

      try {
        localStorage.setItem(
          'el6_hub_favorites',
          JSON.stringify(next)
        );
      } catch {}

      return next;
    });

    sfx.click();
  };

  const leave = async () => {
    if (!joined || !userId) return;
    if (!beginBusy()) return;

    try {
      const latest = await db.entities.CustomRoom.filter({
        id: joined.id,
        status: 'open'
      });

      const current = latest?.[0];

      if (current) {
        const players = Array.isArray(current.players)
          ? current.players
          : [];

        const next = players.filter(
          player => player?.id !== userId
        );

        /*
         * Only delete when the server is genuinely empty.
         * Otherwise keep the room alive.
         */
        if (next.length === 0) {
          try {
            await db.entities.CustomRoom.delete(current.id);
          } catch {
            /*
             * Another player may have joined between the read
             * and delete. In that case leave the room alone.
             */
          }
        } else {
          await db.entities.CustomRoom.update(
            current.id,
            {
              players: next,
              status: 'open'
            }
          );
        }
      }
    } catch {}

    if (roomSubRef.current) {
      try {
        roomSubRef.current();
      } catch {}

      roomSubRef.current = null;
    }

    if (mountedRef.current) {
      setJoined(null);
      setRooms(prev =>
        prev.map(room => {
          if (room.id !== joined.id) return room;

          return {
            ...room,
            players: (room.players || []).filter(
              player => player?.id !== userId
            )
          };
        })
      );
    }

    onLeft?.();
    sfx.click();

    endBusy();
  };

  const deleteServer = async room => {
    if (!room?.id || room.host_user_id !== userId) {
      return;
    }

    if (!beginBusy()) return;

    try {
      await db.entities.CustomRoom.delete(room.id);

      if (mountedRef.current) {
        setRooms(prev =>
          prev.filter(r => r.id !== room.id)
        );
      }

      sfx.warning();
    } catch {
      if (mountedRef.current) {
        setErr('Could not delete server.');
      }
    } finally {
      endBusy();
    }
  };

  const favoriteRooms = favorites
    .map(favorite =>
      rooms.find(room => room.id === favorite.id)
    )
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-5 w-[480px] max-w-[94%] max-h-[86vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent">
            <GameIcon emoji="🌐" size={14} />
            {' '}COMMUNITY SERVERS
          </h3>

          <button
            onClick={onClose}
            className="text-xs text-muted-foreground"
          >
            <GameIcon emoji="✕" size={14} />
          </button>
        </div>

        {joined ? (
          <div>
            <div className="bg-primary/10 border border-primary/40 rounded-lg p-3 mb-3">
              <p className="font-heading text-sm text-primary">
                {joined.stage_name}
              </p>

              <p className="text-[10px] text-muted-foreground">
                Code:{' '}
                <span className="text-accent font-heading">
                  {joined.room_code}
                </span>
                {' • '}
                {(joined.players || []).length}/
                {joined.max_players || 15}
              </p>
            </div>

            <button
              onClick={leave}
              disabled={busy}
              className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded font-heading text-xs disabled:opacity-50"
            >
              {busy ? 'Leaving…' : 'Leave Server'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={codeInput}
                onChange={e =>
                  setCodeInput(e.target.value.toUpperCase())
                }
                placeholder="Enter server code"
                className="flex-1 bg-secondary text-secondary-foreground rounded px-2 py-1.5 text-xs font-heading"
              />

              <button
                onClick={joinByCode}
                disabled={busy || !userId}
                className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs disabled:opacity-50"
              >
                JOIN
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => create(false)}
                disabled={busy || !userId}
                className="px-3 py-2 bg-primary text-primary-foreground rounded font-heading text-xs disabled:opacity-50"
              >
                + Public
              </button>

              <button
                onClick={() => create(true)}
                disabled={busy || !userId}
                className="px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs disabled:opacity-50"
              >
                + Private
              </button>

              <button
                onClick={randomJoin}
                disabled={busy || !userId}
                className="px-3 py-2 bg-accent/80 text-accent-foreground rounded font-heading text-xs disabled:opacity-50"
              >
                <GameIcon emoji="🎲" size={14} />
                {' '}Random
              </button>
            </div>

            {favoriteRooms.length > 0 && (
              <div>
                <p className="text-[10px] font-heading text-primary mb-1">
                  <GameIcon emoji="★" size={14} />
                  {' '}FAVORITES
                </p>

                <div className="space-y-1">
                  {favoriteRooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => joinRoom(room)}
                      disabled={busy}
                      className="w-full text-left bg-muted/30 rounded px-2 py-1.5 text-xs font-heading text-foreground disabled:opacity-50"
                    >
                      {room.stage_name}
                      {' '}
                      <span className="text-accent">
                        {room.room_code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recent.length > 0 && (
              <div>
                <p className="text-[10px] font-heading text-muted-foreground mb-1">
                  <GameIcon emoji="⏱" size={14} />
                  {' '}RECENT
                </p>

                <div className="flex flex-wrap gap-1">
                  {recent.map(room => (
                    <span
                      key={room.id}
                      className="text-[10px] px-2 py-0.5 bg-muted/50 rounded text-muted-foreground"
                    >
                      {room.code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <p className="text-[10px] font-heading text-muted-foreground">
                PUBLIC SERVERS
              </p>

              <button
                onClick={refresh}
                disabled={loading}
                className="text-[10px] text-accent disabled:opacity-50"
              >
                <GameIcon emoji="↻" size={14} />
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {loading && (
                <p className="text-[10px] text-muted-foreground">
                  Loading…
                </p>
              )}

              {!loading && rooms.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                  No open servers. Create one!
                </p>
              )}

              {rooms.map(room => {
                const playerCount =
                  (room.players || []).length;

                const maxPlayers =
                  Number(room.max_players) || 15;

                const full =
                  playerCount >= maxPlayers;

                return (
                  <div
                    key={room.id}
                    className="bg-muted/30 border border-border rounded-lg p-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-heading text-xs text-foreground">
                        {room.stage_name}
                      </p>

                      <p className="text-[9px] text-muted-foreground">
                        {room.room_code}
                        {' • '}
                        {playerCount}/{maxPlayers}
                        {' • '}
                        {room.host_char || '?'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleFav(room)}
                        className="text-xs text-accent"
                      >
                        <GameIcon emoji="★" size={14} />
                      </button>

                      {room.host_user_id === userId && (
                        <button
                          onClick={() => deleteServer(room)}
                          disabled={busy}
                          className="text-xs text-destructive disabled:opacity-50"
                          title="Delete server"
                        >
                          <GameIcon emoji="🗑" size={14} />
                        </button>
                      )}

                      <button
                        onClick={() => joinRoom(room)}
                        disabled={
                          busy ||
                          full ||
                          !userId
                        }
                        className="px-2.5 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px] disabled:opacity-50"
                      >
                        {full ? 'Full' : 'Join'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {err && (
              <p className="text-[10px] text-destructive">
                {err}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
