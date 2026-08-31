import React, { useState, useEffect } from 'react';
import HowToPlay from './HowToPlay.jsx';
import MenuButton from './MenuButton.jsx';
import UpdatesSlideshow from './UpdatesSlideshow.jsx';
import TitleArt from './TitleArt.jsx';
import { music } from './music.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

function getRank(elo) {
  if (elo >= 2200) return 'Elite';
  if (elo >= 1800) return 'Platinum';
  if (elo >= 1500) return 'Diamond';
  if (elo >= 1200) return 'Gold';
  if (elo >= 1000) return 'Silver';
  return 'Bronze';
}

export default function MainMenu({ onNavigate, coins, favoriteName, favoriteLevel, rankedRating, onlineRankedRating, musicVolume, activeEvent, mobileMode, username, chatNotifCount }) {
  const [showHowTo, setShowHowTo] = useState(false);
  const [frontCol, setFrontCol] = useState('col1');
  const [expandedTab, setExpandedTab] = useState(null);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const rim = isDark ? '#1a1a4e' : '#c4a8ff';

  useEffect(() => {
    music.setVolume(musicVolume ?? 50);
    music.play('menu');
    return () => music.stop();
  }, [musicVolume]);

  const handleNav = (key) => {
    sfx.click();
    if (key === 'howto') { sfx.menuOpen(); setShowHowTo(true); return; }
    onNavigate(key);
  };

  const col1 = [
    { type: 'tab', id: 'fight', label: 'FIGHT', items: [
      { label: 'Fight Modes', key: 'modeSelect' },
      { label: 'Custom Battle', key: 'custombattle' },
      { label: 'Regular Battle', key: 'regularbattle' },
      { label: 'Stage Editor', key: 'stageeditor' },
    ]},
    { type: 'tab', id: 'ranked', label: 'RANKED', items: [
      { label: 'Online Ranked', key: 'onlineranked' },
      { label: 'Online Unranked', key: 'onlineunranked' },
    ]},
    { type: 'tab', id: 'online', label: 'ONLINE', items: [
      { label: 'Battle Royale', key: 'battleroyale' },
      { label: 'Custom Rooms', key: 'customrooms' },
      { label: 'LAN Play', key: 'lan' },
      { label: 'Friends', key: 'friends' },
      { label: 'Chat', key: 'chat' },
      { label: 'ELO', key: 'elo' },
    ]},
    { type: 'button', label: 'STORY MODE', key: 'story' },
    { type: 'button', label: 'SPORTS', key: 'sports' },
    { type: 'tab', id: 'sandbox', label: 'SANDBOX', items: [
      { label: 'Sandbox Mode', key: 'sandbox' },
      { label: 'Stage Editor', key: 'stageeditor' },
    ]},
  ];

  const col2 = [
    { type: 'tab', id: 'learn', label: 'LEARN', items: [
      { label: 'Training', key: 'training' },
      { label: 'Combo Trainer', key: 'combos' },
      { label: 'Tutorial', key: 'tutorial' },
      { label: 'About the Game', key: 'about' },
    ]},
    { type: 'tab', id: 'characters', label: 'CHARACTERS', items: [
      { label: 'Meet Characters', key: 'meet' },
      { label: 'Edit Characters', key: 'editchars' },
      { label: 'Equip', key: 'equip' },
      { label: 'Create Character', key: 'creator' },
      { label: 'Hero Codex', key: 'codex' },
    ]},
    { type: 'tab', id: 'quests', label: 'QUESTS', items: [
      { label: 'Daily Quests', key: 'daily' },
      { label: 'Fight Quests', key: 'fightquests' },
      { label: 'Leaderboard', key: 'leaderboard' },
    ]},
    { type: 'tab', id: 'creator', label: 'CAMPAIGN', items: [
      { label: 'Campaign', key: 'creatormode' },
    ]},
    { type: 'button', label: 'SHOP', key: 'shop' },
    { type: 'button', label: 'SAVE CODES', key: 'savecodes' },
  ];

  const renderItem = (item, colId) => {
    const isFront = frontCol === colId;
    if (item.type === 'tab') {
      return (
        <div key={item.id}>
          <MenuButton label={item.label} hasSubItems expanded={expandedTab === item.id}
            onToggleExpand={() => isFront && setExpandedTab(expandedTab === item.id ? null : item.id)}
            disabled={!isFront} isDark={isDark} />
          {expandedTab === item.id && isFront && (
            <div className="mt-1.5 ml-4 space-y-1.5">
              {item.items.map(sub => (
                <button key={sub.key} onClick={() => handleNav(sub.key)}
                  className="block w-full text-left px-4 py-2 rounded-lg border text-xs font-heading bg-card/90 border-border hover:bg-primary/20 text-foreground transition">
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <MenuButton key={item.key} label={item.label} onClick={() => handleNav(item.key)}
        disabled={!isFront} notifCount={item.key === 'chat' ? chatNotifCount : 0} isDark={isDark} />
    );
  };

  const renderMobileItem = (item) => {
    if (item.type === 'tab') {
      return (
        <div key={item.id}>
          <MenuButton label={item.label} hasSubItems expanded={expandedTab === item.id}
            onToggleExpand={() => setExpandedTab(expandedTab === item.id ? null : item.id)} isDark={isDark} />
          {expandedTab === item.id && (
            <div className="mt-1 space-y-1">
              {item.items.map(sub => (
                <button key={sub.key} onClick={() => handleNav(sub.key)}
                  className="block w-full text-left px-3 py-1.5 rounded-md border text-[10px] font-heading bg-card/90 border-border text-foreground">{sub.label}</button>
              ))}
            </div>
          )}
        </div>
      );
    }
    return <MenuButton key={item.key} label={item.label} onClick={() => handleNav(item.key)}
      notifCount={item.key === 'chat' ? chatNotifCount : 0} isDark={isDark} />;
  };

  return (
    <div className="w-full max-w-7xl mx-auto relative">
      {/* ── Desktop layout ── */}
      <div className="hidden lg:block">
        {/* Top bar: © Made by + user info + settings/howto — all on one horizontal line */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 bg-card/80 border-b border-border px-3 py-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">©</span>
            <span className="font-heading text-[10px] text-muted-foreground tracking-wider">Made by Element 6 Studios</span>
          </div>
          <div className="flex items-center gap-2.5 text-[10px] font-heading">
            {username && <span className="inline-flex items-center gap-1 text-foreground"><GameIcon emoji="👤" size={12} /> {username}</span>}
            {favoriteName && <span className="inline-flex items-center gap-1 text-muted-foreground"><GameIcon emoji="★" size={12} /> {favoriteName}{favoriteLevel > 1 && <span className="text-primary"> Lv.{favoriteLevel}</span>}</span>}
            <span className="inline-flex items-center gap-1 text-muted-foreground"><GameIcon emoji="◆" size={12} /> <span className="text-accent">{coins || 0}</span></span>
            <span className="text-muted-foreground">Ranked ELO: <span className="text-primary">{onlineRankedRating}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => handleNav('settings')} className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-heading text-[10px] hover:opacity-80"><GameIcon emoji="⚙" size={12} /> SETTINGS</button>
            <button onClick={() => handleNav('howto')} className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-heading text-[10px] hover:opacity-80"><GameIcon emoji="?" size={12} /> HOW TO</button>
          </div>
        </div>

        {/* Bottom left: element6.app link */}
        <div className="absolute bottom-1 left-2 z-30">
          <a href="https://element6.app" target="_blank" rel="noopener noreferrer" className="text-[10px] font-heading text-muted-foreground hover:text-accent transition">element6.app</a>
        </div>

        <div className="flex gap-4 items-start pt-12">
          {/* Left: overlapping button columns — moved down, more spacing, fixed width */}
          <div className="relative flex mt-6" style={{ width: '400px', height: '470px' }}>
            <div className="flex flex-col justify-between w-56 transition-all duration-500 ease-out"
              style={{ transform: frontCol === 'col1' ? 'translateX(0)' : 'translateX(56px) translateY(12px)', zIndex: frontCol === 'col1' ? 20 : 10, opacity: frontCol === 'col1' ? 1 : 0.45 }}
              onClick={() => frontCol !== 'col1' && setFrontCol('col1')}>
              {col1.map(item => renderItem(item, 'col1'))}
            </div>
            <div className="flex flex-col justify-between w-56 transition-all duration-500 ease-out"
              style={{ transform: frontCol === 'col2' ? 'translateX(0)' : 'translateX(-56px) translateY(12px)', zIndex: frontCol === 'col2' ? 20 : 10, opacity: frontCol === 'col2' ? 1 : 0.45, marginLeft: '-28px' }}
              onClick={() => frontCol !== 'col2' && setFrontCol('col2')}>
              {col2.map(item => renderItem(item, 'col2'))}
            </div>
          </div>

          {/* Center: World button + TitleArt (battle pass design) + Battle Pass button */}
          <div className="flex-1 flex flex-col items-center gap-4 pt-4">
            <button onClick={() => handleNav('clips')}
              className="inline-flex items-center gap-1.5 px-8 py-2.5 rounded-xl font-heading text-sm text-white tracking-wider hover:scale-105 transition"
              style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))', border: `2px solid ${rim}` }}>
              <GameIcon emoji="🎬" size={14} /> CLIPS
            </button>
            <button onClick={() => handleNav('hub')}
              className="inline-flex items-center gap-1.5 px-8 py-2.5 rounded-xl font-heading text-sm text-white tracking-wider hover:scale-105 transition"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', border: `2px solid ${rim}` }}>
              COMMUNITY HUB
            </button>
            <TitleArt />
            <button onClick={() => handleNav('events')}
              className="inline-flex items-center gap-1.5 px-8 py-2.5 rounded-xl font-heading text-sm text-white tracking-wider hover:scale-105 transition"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', border: `2px solid ${rim}` }}>
              BATTLE PASS
            </button>
            <button onClick={() => handleNav('lore')}
              className="inline-flex items-center gap-1.5 px-8 py-2.5 rounded-xl font-heading text-sm text-white tracking-wider hover:scale-105 transition"
              style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))', border: `2px solid ${rim}` }}>
              <GameIcon emoji="📖" size={14} /> LORE LIBRARY
            </button>
          </div>

          {/* Right: updates slideshow (matching left width) + equip */}
          <div className="shrink-0 flex flex-col items-center gap-4" style={{ width: '400px' }}>
            <UpdatesSlideshow />
            <button onClick={() => handleNav('equip')}
              className="inline-flex items-center gap-1.5 px-8 py-2.5 rounded-xl font-heading text-sm text-white tracking-wider hover:scale-105 transition"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', border: `2px solid ${rim}` }}>
              EQUIP
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden flex flex-col items-center gap-3">
        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
          <span className="text-sm">©</span>
          <span className="font-heading text-[10px] text-muted-foreground">Made by Element 6 Studios</span>
        </div>
        <div className="w-full flex justify-end gap-1.5 mt-8">
          <button onClick={() => handleNav('settings')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg font-heading text-xs"><GameIcon emoji="⚙" size={14} /> SETTINGS</button>
          <button onClick={() => handleNav('howto')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg font-heading text-xs"><GameIcon emoji="?" size={14} /> HOW TO</button>
        </div>
        <div className="bg-card/80 border border-border rounded-lg px-2.5 py-1.5 text-[9px] font-heading flex flex-wrap gap-2 justify-center max-w-sm">
          {username && <span className="inline-flex items-center gap-1 text-foreground"><GameIcon emoji="👤" size={12} /> {username}</span>}
          <span className="inline-flex items-center gap-1 text-muted-foreground"><GameIcon emoji="◆" size={12} /> {coins || 0}</span>
          <span className="text-muted-foreground">Ranked ELO: <span className="text-primary">{onlineRankedRating}</span></span>
        </div>
        <TitleArt />
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => handleNav('clips')} className="px-6 py-2 rounded-xl font-heading text-xs text-white" style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))' }}>🎬 CLIPS</button>
          <button onClick={() => handleNav('hub')} className="px-6 py-2 rounded-xl font-heading text-xs text-white"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>HUB</button>
          <button onClick={() => handleNav('events')} className="px-6 py-2 rounded-xl font-heading text-xs text-white"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>BATTLE PASS</button>
          <button onClick={() => handleNav('lore')} className="px-6 py-2 rounded-xl font-heading text-xs text-white"
            style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))' }}>LORE</button>
          <button onClick={() => handleNav('equip')} className="px-6 py-2 rounded-xl font-heading text-xs text-white"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>EQUIP</button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
          {[...col1, ...col2].map(renderMobileItem)}
        </div>
        <UpdatesSlideshow />
      </div>

      {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}
    </div>
  );
}
