import db from './localBackend';


import React, { useState, useEffect, useRef } from 'react';
import { music } from './music.js';
import { FIGHT_TRACK_LIBRARY } from './music.js';
import { sfx } from './sfx.js';

import EditControls from './EditControls';
import { getKeybinds } from './keybinds.js';
import { PROFILE_TITLES, getTitleColor, ownsTitle } from './profileTitles.js';
import { ERAS } from './eras.js';
import SoundButton from './SoundButton.jsx';
import { useGamepad } from './useGamepad.js';
import GameIcon from "./GameIcon.jsx";

import { THEMES, applyUiTheme } from './uiThemes.js';
import { setCustomBackdropUrl, clearCustomBackdrop } from './customBackdrop.js';
import AccountPanel from './AccountPanel.jsx';
import { syncCurrentUsername } from './usernameSync.js';

const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];
const MATCH_TIMES = [
  { v: 60, label: '1:00' }, { v: 90, label: '1:30' }, { v: 120, label: '2:00' },
  { v: 180, label: '3:00' }, { v: 240, label: '4:00' }, { v: 300, label: '5:00' }, { v: 0, label: 'Infinite' },
];
const GAME_MODES = ['regular', 'time', 'hp', 'superonly', 'sudden', 'ranked', 'coin', 'brawl', 'challenge', 'botbattle', 'lowgravity', 'custom'];

const MUSIC_SCENES = [
  { id: 'menu', label: 'Menu / Background' },
  { id: 'fight', label: 'Fight Music' },
  { id: 'story', label: 'Story Mode' },
  { id: 'soccer', label: 'Soccer' },
];

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`w-12 h-6 rounded-full transition relative ${on ? 'bg-accent' : 'bg-muted'}`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-0.5'}`} />
    </button>
  );
}

export default function Settings({ onBack, settings, onSave, onReset, onUsernameChange, onOpenController, onOpenMobileControls }) {
  const [local, setLocal] = useState(settings || {});
  const { pads } = useGamepad();
  const [uploading, setUploading] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [equippedTitle, setEquippedTitle] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [allowChatsFromNonFriends, setAllowChatsFromNonFriends] = useState(true);
  const [myUserId, setMyUserId] = useState('');
  const [usernameCooldownMs, setUsernameCooldownMs] = useState(0);

  const apply = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onSave?.(next);
    if (next.musicVolume != null) music.setVolume(next.musicVolume);
    if (next.sfxVolume != null) sfx.setVolume(next.sfxVolume);
    if (patch.customMusic) music.setCustomTracks(next.customMusic);
  };

  useEffect(() => {
    db.auth.me().then(u => {
      const name = u.username || (u.full_name || (u.email || 'Player')).split('@')[0];
      setUsername(name);
      setOriginalUsername(name);
      setEquippedTitle(u.profile_title || '');
      setAllowFriendRequests(u.allow_friend_requests !== false);
      setAllowChatsFromNonFriends(u.allow_chats_non_friends !== false);
      setMyUserId(u.id);
      // Load cooldown
      const lastChange = parseInt(localStorage.getItem('element6_username_changed_at') || '0', 10);
      const remaining = lastChange + 3600000 - Date.now();
      setUsernameCooldownMs(remaining > 0 ? remaining : 0);
    }).catch(() => {});
    music.setVolume(local.musicVolume ?? 50);
    sfx.setVolume(local.sfxVolume ?? 70);
    if (local.customMusic) music.setCustomTracks(local.customMusic);
    music.play('menu');
    const mode = settings?.displayMode || 'dark';
    if (mode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try { setMatchHistory(JSON.parse(localStorage.getItem('element6_matchHistory') || '[]')); } catch { setMatchHistory([]); }
    return () => music.stop();
  }, []);

  const applyDisplayMode = (mode) => { apply({ displayMode: mode }); if (mode === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); };

  const applyTheme = (themeId) => {
    apply({ theme: themeId });
    applyUiTheme(themeId);
  };

  const handleMusicUpload = async (scene, file) => {
    if (!file) return;
    setUploading(scene);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      const cm = { ...(local.customMusic || {}), [scene]: file_url };
      apply({ customMusic: cm });
    } catch (e) {
      const blobUrl = URL.createObjectURL(file);
      const cm = { ...(local.customMusic || {}), [scene]: blobUrl };
      apply({ customMusic: cm });
    }
    setUploading(null);
  };

  const handleBackdropUpload = async (file) => {
    if (!file) return;
    setUploading('backdrop');
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setCustomBackdropUrl(file_url);
      apply({ customBackdrop: file_url });
    } catch (e) {
      const blobUrl = URL.createObjectURL(file);
      setCustomBackdropUrl(blobUrl);
      apply({ customBackdrop: blobUrl });
    }
    setUploading(null);
  };

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDownloadApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch {}
      setDeferredPrompt(null);
      return;
    }
    // Generate a downloadable desktop launcher (HTML file)
    const gameUrl = 'https://element6game.db.app';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Element 6 - Heroes of Color</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: radial-gradient(ellipse at top, #1a0a30 0%, #0a0820 50%, #06040f 100%); display: flex; align-items: center; justify-content: center; height: 100vh; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; }
.container { text-align: center; }
.logo { font-size: 52px; font-weight: 900; color: #FFFFFF; text-shadow: 0 0 30px #7744AA, 0 0 60px #7744AA; letter-spacing: 3px; }
.subtitle { font-size: 18px; color: #AA88DD; margin-top: 8px; text-shadow: 0 0 15px #9966CC; letter-spacing: 2px; }
.orb { display: inline-flex; align-items: center; justify-content: center; width: 70px; height: 70px; border-radius: 50%; background: radial-gradient(circle, rgba(255,215,0,0.4), rgba(170,68,255,0.3)); margin: 25px auto; box-shadow: 0 0 40px rgba(255,215,0,0.3); font-size: 32px; font-weight: 900; color: #FFD700; }
.btn { margin-top: 30px; padding: 18px 56px; background: linear-gradient(135deg, #7744FF, #9955DD); color: white; border: none; border-radius: 12px; font-size: 22px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 25px rgba(119,68,255,0.4); transition: transform 0.2s, box-shadow 0.2s; letter-spacing: 1px; }
.btn:hover { transform: scale(1.05); box-shadow: 0 6px 35px rgba(119,68,255,0.6); }
.url { margin-top: 25px; color: #666; font-size: 13px; letter-spacing: 1px; }
.hint { margin-top: 10px; color: #444; font-size: 11px; }
</style>
</head>
<body>
<div class="container">
<div class="logo">THE ELEMENT 6</div>
<div class="subtitle">HEROES OF COLOR</div>
<div class="orb">6</div>
<button class="btn" onclick="window.open('${gameUrl}','_blank')">&#9654; PLAY GAME</button>
<div class="url">element6game.com</div>
<div class="hint">Save this file to your desktop &mdash; double-click anytime to launch the game!</div>
</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Element6Game.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto pr-1">
      <div className="flex justify-between items-center sticky top-0 z-10 bg-background/80 backdrop-blur py-2 -mx-1 px-1">
        <h2 className="text-2xl font-heading text-accent tracking-wider">SETTINGS</h2>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>

      <AccountPanel />

      {/* AUDIO */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">AUDIO</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-body text-muted-foreground w-28">Music volume:</span>
            <input type="range" min="0" max="100" value={local.musicVolume ?? 50} onChange={e => apply({ musicVolume: parseInt(e.target.value) })} className="flex-1 accent-primary" />
            <span className="text-xs font-heading text-foreground w-8 text-right">{local.musicVolume ?? 50}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-body text-muted-foreground w-28">SFX volume:</span>
            <input type="range" min="0" max="100" value={local.sfxVolume ?? 70} onChange={e => apply({ sfxVolume: parseInt(e.target.value) })} className="flex-1 accent-primary" />
            <span className="text-xs font-heading text-foreground w-8 text-right">{local.sfxVolume ?? 70}</span>
          </div>
        </div>
      </div>

      {/* PROFILE — Username + Title */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">PROFILE</h3>
        <div className="space-y-3">
          <div>
            <span className="text-xs font-body text-muted-foreground block mb-1">Username (displayed everywhere in-game):</span>
            <div className="flex gap-2">
              <input value={username} onChange={e => setUsername(e.target.value)} maxLength={16}
                className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded font-body text-sm" />
              <SoundButton onClick={async () => {
                const clean = username.trim();
                if (clean.length < 3) { setUsernameError('Username must be at least 3 characters.'); sfx.warning(); return; }
                const lastChange = parseInt(localStorage.getItem('element6_username_changed_at') || '0', 10);
                const remaining = lastChange + 3600000 - Date.now();
                if (remaining > 0) {
                  const mins = Math.ceil(remaining / 60000);
                  setUsernameError(`You can change your username again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
                  sfx.warning(); return;
                }
                try {
                  // Check uniqueness (case-insensitive) across ALL players worldwide
                  const [entries, presences] = await Promise.all([
                    db.entities.LeaderboardEntry.filter({}),
                    db.entities.Presence.filter({}),
                  ]);
                  const lower = clean.toLowerCase();
                  const taken = entries.some(e => (e.user_name || '').toLowerCase() === lower && e.user_id !== myUserId)
                    || presences.some(p => (p.username || '').toLowerCase() === lower && p.user_id !== myUserId);
                  if (taken) { setUsernameError('That username is already taken by another player. Try another.'); sfx.warning(); return; }
                  // Update Supabase first so the name cannot revert on another
                  // device. The SQL function mirrors it into every online view.
                  try { await syncCurrentUsername(clean); }
                  catch { await db.auth.updateMe({ username: clean }); }
                  // Mirror to leaderboard + presence so other players see the new name
                  const lb = entries.find(e => e.user_id === myUserId);
                  if (lb) await db.entities.LeaderboardEntry.update(lb.id, { user_name: clean });
                  const pres = presences.find(p => p.user_id === myUserId);
                  if (pres) await db.entities.Presence.update(pres.id, { username: clean });
                  localStorage.setItem('element6_username_changed_at', Date.now().toString());
                  setUsernameCooldownMs(3600000);
                  setUsernameError(''); sfx.purchaseSuccess();
                  onUsernameChange?.({ oldName: originalUsername, newName: clean });
                  setOriginalUsername(clean);
                } catch (e) { setUsernameError('Could not save username.'); sfx.warning(); }
              }} sound="success" className="px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-sm">SAVE</SoundButton>
            </div>
            {usernameError && <p className="text-[10px] text-destructive mt-1">{usernameError}</p>}
            {!usernameError && usernameCooldownMs > 0 && <p className="text-[10px] text-muted-foreground mt-1">Next change available in {Math.ceil(usernameCooldownMs / 60000)} min</p>}
          </div>
          <div>
            <span className="text-xs font-body text-muted-foreground block mb-1">Profile Title (shown above username on HUD):</span>
            <div className="flex flex-wrap gap-1">
              <SoundButton onClick={async () => { await db.auth.updateMe({ profile_title: '' }); setEquippedTitle(''); sfx.click(); }}
                className={`px-2 py-1 rounded font-heading text-[10px] ${!equippedTitle ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>NONE</SoundButton>
              {PROFILE_TITLES.filter(t => ownsTitle(t.id, { ownedPacks: local.ownedPacks, ownedTitles: local.ownedTitles })).map(t => (
                <SoundButton key={t.id} onClick={async () => { await db.auth.updateMe({ profile_title: t.id }); setEquippedTitle(t.id); sfx.click(); }}
                  className={`px-2 py-1 rounded font-heading text-[10px] ${equippedTitle === t.id ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  style={{ color: getTitleColor(t.id) }}>{t.name}</SoundButton>
              ))}
            </div>
            {PROFILE_TITLES.filter(t => ownsTitle(t.id, { ownedPacks: local.ownedPacks, ownedTitles: local.ownedTitles })).length === 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">Unlock titles in the Shop (Paid tab <GameIcon emoji="→" size={14} /> All Profile Titles Pack).</p>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM MUSIC */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-2">CUSTOM MUSIC</h3>
        <p className="text-[10px] text-muted-foreground mb-3">Upload your own MP3 for each scene. Overrides the default tracks.</p>
        <div className="space-y-2">
          {MUSIC_SCENES.map(s => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="text-xs font-body text-muted-foreground w-32">{s.label}:</span>
              <label className="flex-1 cursor-pointer">
                <input type="file" accept="audio/mp3,audio/mpeg,audio/*" className="hidden" onChange={e => handleMusicUpload(s.id, e.target.files?.[0])} />
                <span className={`block text-center px-3 py-1.5 rounded text-[10px] font-body border border-dashed border-border hover:border-accent transition ${uploading === s.id ? 'opacity-50' : ''}`}>
                  {uploading === s.id ? 'Uploading...' : local.customMusic?.[s.id] ? '✓ Custom track set — Click to replace' : 'Upload MP3'}
                </span>
              </label>
              {local.customMusic?.[s.id] && (
                <button onClick={() => { const cm = { ...local.customMusic }; delete cm[s.id]; apply({ customMusic: cm }); }} className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded hover:opacity-80"><GameIcon emoji="✕" size={14} /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CUSTOM BACKDROP */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-2">CUSTOM BACKDROP</h3>
        <p className="text-[10px] text-muted-foreground mb-3">Upload your own image to replace the Split City backdrop on the home menu and menu screens. PNG, JPG, GIF (animated), WEBP supported.</p>
        <div className="flex items-center gap-2">
          <label className="flex-1 cursor-pointer">
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/*" className="hidden" onChange={e => handleBackdropUpload(e.target.files?.[0])} />
            <span className={`block text-center px-3 py-1.5 rounded text-[10px] font-body border border-dashed border-border hover:border-accent transition ${uploading === 'backdrop' ? 'opacity-50' : ''}`}>
              {uploading === 'backdrop' ? 'Uploading...' : local.customBackdrop ? '✓ Custom backdrop set — Click to replace' : 'Upload Image'}
            </span>
          </label>
          {local.customBackdrop && (
            <button onClick={() => { apply({ customBackdrop: null }); clearCustomBackdrop(); sfx.click(); }} className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded hover:opacity-80"><GameIcon emoji="✕" size={14} /></button>
          )}
        </div>
        {local.customBackdrop && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border">
            <img src={local.customBackdrop} alt="Backdrop preview" className="w-full max-h-32 object-cover" />
          </div>
        )}
      </div>

      {/* FIGHT & SPORTS MUSIC */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-2">FIGHT & SPORTS MUSIC</h3>
        <p className="text-[10px] text-muted-foreground mb-3">Pick a built-in track for fights, sports & battle royale. "Auto" rotates through all tracks. This overrides uploads above for fight/soccer scenes.</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => { const cm = { ...(local.customMusic || {}) }; delete cm.fight; delete cm.soccer; apply({ customMusic: cm }); sfx.click(); }}
            className={`px-3 py-1.5 rounded-lg font-heading text-[10px] border ${!local.customMusic?.fight && !local.customMusic?.soccer ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground border-border'}`}>AUTO ROTATE</button>
          {FIGHT_TRACK_LIBRARY.map(t => {
            const selected = local.customMusic?.fight === t.url && local.customMusic?.soccer === t.url;
            return (
              <button key={t.id} onClick={() => { const cm = { ...(local.customMusic || {}), fight: t.url, soccer: t.url }; apply({ customMusic: cm }); sfx.click(); music.play('fight'); }}
                className={`px-3 py-1.5 rounded-lg font-heading text-[10px] border ${selected ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground border-border'}`}>{t.name.toUpperCase()}</button>
            );
          })}
        </div>
      </div>

      {/* CPU */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">CPU DEFAULTS</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-muted-foreground">Default CPU difficulty:</span>
            <select value={local.defaultCPUDifficulty || 'regular'} onChange={e => apply({ defaultCPUDifficulty: e.target.value })} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body">
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-muted-foreground">Auto-select favorite in CPU battles:</span>
            <Toggle on={local.autoSelectFavorite !== false} onClick={() => apply({ autoSelectFavorite: !local.autoSelectFavorite })} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-body text-muted-foreground w-32">AI aggression:</span>
            <input type="range" min="0" max="100" value={local.aiAggression ?? 50} onChange={e => apply({ aiAggression: parseInt(e.target.value) })} className="flex-1 accent-primary" />
            <span className="text-xs font-heading text-foreground w-8 text-right">{local.aiAggression ?? 50}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-muted-foreground">Bot personality:</span>
            <select value={local.botPersonality || 'balanced'} onChange={e => apply({ botPersonality: e.target.value })} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body">
              <option value="evasive">Evasive</option>
              <option value="defensive">Defensive</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>
      </div>

      {/* MATCH HISTORY */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">MATCH HISTORY</h3>
        {matchHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground font-body">No matches played yet.</p>
        ) : (
          <div className="space-y-1">
            {matchHistory.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                <span className={`text-[10px] font-heading px-1.5 py-0.5 rounded ${m.result === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{m.result}</span>
                <span className="text-[10px] font-body text-foreground flex-1">{m.p1 || '?'} vs {m.p2 || '?'}</span>
                <span className="text-[10px] font-heading text-muted-foreground">{m.mode}</span>
                <span className="text-[10px] font-heading text-foreground">{m.score}</span>
                <span className="text-[10px] font-heading text-accent">+{m.xp} XP</span>
                <span className="text-[9px] text-muted-foreground">{m.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GAMEPLAY */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">GAMEPLAY</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-muted-foreground">Default match time:</span>
            <select value={local.matchTime ?? 240} onChange={e => apply({ matchTime: parseInt(e.target.value) })} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body">
              {MATCH_TIMES.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-muted-foreground">Camera zoom:</span>
            <select value={local.cameraZoom || 'normal'} onChange={e => apply({ cameraZoom: e.target.value })} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body">
              <option value="close">Close</option><option value="normal">Normal</option><option value="far">Far</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-body text-muted-foreground w-32">Stage zoom:</span>
            <input type="range" min="0.2" max="1.0" step="0.05" value={local.stageZoom ?? 1.0} onChange={e => apply({ stageZoom: parseFloat(e.target.value) })} className="flex-1 accent-primary" />
            <span className="text-xs font-heading text-foreground w-10 text-right">{(local.stageZoom ?? 1.0).toFixed(2)}x</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-muted-foreground font-body w-full mb-0.5">Quick presets:</span>
            {[{v:0.2,l:'0.2x'},{v:0.35,l:'0.35x'},{v:0.5,l:'0.5x'},{v:0.65,l:'0.65x'},{v:0.8,l:'0.8x'},{v:1.0,l:'1.0x'}].map(p => (
              <button key={p.v} onClick={() => apply({ stageZoom: p.v })} className={`px-2 py-0.5 rounded text-[9px] font-heading border ${(local.stageZoom ?? 1.0) === p.v ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground border-border'}`}>{p.l}</button>
            ))}
          </div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Default game mode:</span>
            <select value={local.defaultGameMode || 'regular'} onChange={e => apply({ defaultGameMode: e.target.value })} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body">
              {GAME_MODES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Screen shake:</span><Toggle on={local.screenShake !== false} onClick={() => apply({ screenShake: !local.screenShake })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Damage numbers:</span><Toggle on={local.showDamageNumbers !== false} onClick={() => apply({ showDamageNumbers: !local.showDamageNumbers })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Kill FX animations:</span><Toggle on={local.killFXEnabled !== false} onClick={() => apply({ killFXEnabled: !local.killFXEnabled })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Combo counter:</span><Toggle on={local.comboCounter !== false} onClick={() => apply({ comboCounter: !local.comboCounter })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Penalties instead of sudden death (soccer):</span><Toggle on={local.penaltiesInsteadOfSuddenDeath === true} onClick={() => apply({ penaltiesInsteadOfSuddenDeath: !local.penaltiesInsteadOfSuddenDeath })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Show blast zones:</span><Toggle on={local.showBlastZones !== false} onClick={() => apply({ showBlastZones: !local.showBlastZones })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Show nametags:</span><Toggle on={local.showNametags !== false} onClick={() => apply({ showNametags: !local.showNametags })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Reduced motion (no shake/particles):</span><Toggle on={local.reducedMotion === true} onClick={() => apply({ reducedMotion: !local.reducedMotion })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Auto-pause on focus loss:</span><Toggle on={local.autoPauseFocus !== false} onClick={() => apply({ autoPauseFocus: !local.autoPauseFocus })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Show FPS counter:</span><Toggle on={local.showFPS === true} onClick={() => apply({ showFPS: !local.showFPS })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Mobile Mode (on-screen buttons, singleplayer only):</span><Toggle on={local.mobileMode === true} onClick={() => apply({ mobileMode: !local.mobileMode })} /></div>
          {local.mobileMode && <p className="text-[10px] text-accent font-body">Mobile Mode is ON — on-screen touch controls will appear during gameplay. Multiplayer is restricted to LAN Play only (different devices).</p>}
          <button onClick={onOpenMobileControls} className="w-full px-4 py-2 bg-accent/15 border border-accent/40 text-accent rounded-lg font-heading text-xs hover:bg-accent/25">OPEN MOBILE CONTROL LAYOUT TEST</button>
          <div className="border-t border-border/50 my-2 pt-2">
            <p className="text-[9px] font-heading text-primary mb-2">HUD HIDES (all non-online fight modes)</p>
            <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Hide stock boxes:</span><Toggle on={local.hideStockBoxes === true} onClick={() => apply({ hideStockBoxes: !local.hideStockBoxes })} /></div>
            <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Hide stage name &amp; gamemode:</span><Toggle on={local.hideStageAndMode === true} onClick={() => apply({ hideStageAndMode: !local.hideStageAndMode })} /></div>
            <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Hide countdown:</span><Toggle on={local.hideCountdown === true} onClick={() => apply({ hideCountdown: !local.hideCountdown })} /></div>
            <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Hide top username:</span><Toggle on={local.hideTopUsername === true} onClick={() => apply({ hideTopUsername: !local.hideTopUsername })} /></div>
          </div>
        </div>
      </div>

      {/* EDIT CONTROLS */}
      <EditControls
        settings={local}
        onSave={(patch) => apply(patch)}
        onReset={() => apply({ keybinds: null, customControls: null, mainControl: null, soloControl: null })}
      />

      {/* CONTROLLER (Bluetooth + Wired) */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3"><GameIcon emoji="🎮" size={14} /> CONTROLLER (BLUETOOTH & WIRED)</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-muted-foreground">Enable controller input:</span>
            <Toggle on={local.controllerEnabled !== false} onClick={() => apply({ controllerEnabled: !(local.controllerEnabled !== false) })} />
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-[10px] font-heading text-muted-foreground mb-1">CONNECTED CONTROLLERS ({pads.length})</p>
            {pads.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No controllers detected. Connect a Bluetooth or USB controller — hot-plugging is supported.</p>
            ) : (
              <ul className="space-y-1">
                {pads.map(p => (
                  <li key={p.index} className="text-xs text-foreground font-body flex items-center gap-2">
                    <span className="text-accent"><GameIcon emoji="●" size={14} /></span> Slot {p.index}: <span className="font-heading truncate flex-1">{p.id || 'Gamepad'}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary capitalize">{p.family}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={() => { sfx.click(); onOpenController?.(); }} className="w-full px-4 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90">
            <GameIcon emoji="⚙" size={14} /> BUTTON MAPPING & CONTROLLER SETTINGS
          </button>
          <p className="text-[10px] text-muted-foreground font-body">Remap every button, adjust stick deadzones & sensitivity, invert axes, toggle vibration strength, and save multiple controller profiles.</p>
        </div>
      </div>

      {/* DISPLAY */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">DISPLAY</h3>
        <div className="flex gap-3 mb-3">
          <button onClick={() => applyDisplayMode('dark')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition ${local.displayMode === 'dark' ? 'border-accent bg-accent/10' : 'border-border hover:border-muted-foreground'}`}><span className="font-heading text-sm text-foreground">Dark</span></button>
          <button onClick={() => applyDisplayMode('light')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition ${local.displayMode === 'light' ? 'border-accent bg-accent/10' : 'border-border hover:border-muted-foreground'}`}><span className="font-heading text-sm text-foreground">Light</span></button>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-body text-muted-foreground w-32">Background particle density:</span>
          <input type="range" min="0" max="50" value={local.bgParticleDensity ?? 30} onChange={e => apply({ bgParticleDensity: parseInt(e.target.value) })} className="flex-1 accent-primary" />
          <span className="text-xs font-heading text-foreground w-8 text-right">{local.bgParticleDensity ?? 30}</span>
        </div>
        <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Disable event background art:</span><Toggle on={local.disableEventBackground === true} onClick={() => apply({ disableEventBackground: !local.disableEventBackground })} /></div>
      </div>

      {/* THEME */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">APP THEME</h3>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => applyTheme(t.id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition ${local.theme === t.id ? 'border-accent' : 'border-border hover:border-muted-foreground'}`}>
              <div className="flex gap-1"><div className="w-5 h-5 rounded" style={{ backgroundColor: `hsl(${t.primary})` }} /><div className="w-5 h-5 rounded" style={{ backgroundColor: `hsl(${t.accent})` }} /></div>
              <span className="text-[8px] font-heading text-foreground text-center leading-tight">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* UI ERA */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">UI ERA</h3>
        <p className="text-[10px] text-muted-foreground mb-2">Changes the visual presentation of the game. Does not affect gameplay.</p>
        <div className="flex flex-wrap gap-2">
          {ERAS.map(era => (
            <button key={era.id} onClick={() => apply({ uiEra: era.id })} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition ${local.uiEra === era.id ? 'border-accent' : 'border-border hover:border-muted-foreground'}`}>
              <div className="w-6 h-6 rounded" style={{ background: era.accent }} />
              <span className="text-[8px] font-heading text-foreground text-center leading-tight">{era.name}</span>
            </button>
          ))}
          <button onClick={() => apply({ uiEra: 'dynamic' })} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition ${local.uiEra === 'dynamic' || !local.uiEra ? 'border-accent' : 'border-border hover:border-muted-foreground'}`}>
            <div className="w-6 h-6 rounded bg-gradient-to-r from-primary to-accent" />
            <span className="text-[8px] font-heading text-foreground text-center leading-tight">Dynamic</span>
          </button>
        </div>
      </div>

      {/* SOCIAL */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">SOCIAL</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Allow friend requests:</span>
            <Toggle on={allowFriendRequests} onClick={async () => { const n = !allowFriendRequests; setAllowFriendRequests(n); apply({ allowFriendRequests: n }); try { await db.auth.updateMe({ allow_friend_requests: n }); } catch {} sfx.click(); }} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Allow chats from non-friends:</span>
            <Toggle on={allowChatsFromNonFriends} onClick={async () => { const n = !allowChatsFromNonFriends; setAllowChatsFromNonFriends(n); apply({ allowChatsFromNonFriends: n }); try { await db.auth.updateMe({ allow_chats_non_friends: n }); } catch {} sfx.click(); }} /></div>
        </div>
      </div>

      {/* ONLINE & LAN (merged from OnlineSettings) */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3"><GameIcon emoji="🌐" size={14} /> ONLINE &amp; LAN</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-muted-foreground">Region:</span>
            <select value={local.region || 'auto'} onChange={e => apply({ region: e.target.value })} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body">
              <option value="auto">Auto</option><option value="na">North America</option><option value="eu">Europe</option><option value="sa">South America</option><option value="asia">Asia</option><option value="oce">Oceania</option><option value="afr">Africa</option>
            </select>
          </div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Preferred match mode:</span>
            <select value={local.preferredMatchMode || 'unranked'} onChange={e => apply({ preferredMatchMode: e.target.value })} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body">
              <option value="ranked">Ranked</option><option value="unranked">Unranked</option><option value="soccer">Soccer</option>
            </select>
          </div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Auto-accept matchmaking:</span><Toggle on={local.autoAcceptMatchmaking === true} onClick={() => apply({ autoAcceptMatchmaking: !local.autoAcceptMatchmaking })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Allow cross-region matches:</span><Toggle on={local.crossRegion === true} onClick={() => apply({ crossRegion: !local.crossRegion })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Show opponent ping:</span><Toggle on={local.showPing !== false} onClick={() => apply({ showPing: !local.showPing })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Mute opponent emotes:</span><Toggle on={local.muteOpponentEmotes === true} onClick={() => apply({ muteOpponentEmotes: !local.muteOpponentEmotes })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">LAN auto-discovery:</span><Toggle on={local.lanDiscovery !== false} onClick={() => apply({ lanDiscovery: !local.lanDiscovery })} /></div>
          <p className="text-[10px] text-muted-foreground font-body">Create or join a room with a friend on the same network. Supported modes: Fight, Soccer, Volleyball, Baseball.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5"><p className="text-[10px] text-muted-foreground font-body">Settings are saved automatically. Theme changes apply immediately.</p></div>

      <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-5 text-center">
        <h3 className="font-heading text-sm text-destructive mb-2">DANGER ZONE</h3>
        <p className="text-xs text-muted-foreground font-body mb-3">Reset your entire account — all progress, unlocked characters, coins, skins, and save data will be permanently deleted.</p>
        <button onClick={() => { if (window.confirm('Are you ABSOLUTELY SURE? This will permanently delete ALL your progress, unlocks, coins, and save data. This cannot be undone!')) { if (window.confirm('Last chance! This is irreversible. Click OK to erase everything.')) { onReset?.(); } } }} className="px-8 py-4 bg-destructive text-destructive-foreground rounded-lg font-heading text-lg hover:opacity-80 transition shadow-lg">RESET ENTIRE ACCOUNT</button>
      </div>
    </div>
  );
}
