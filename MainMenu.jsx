import React, { useEffect, useRef, useState } from 'react';
import HowToPlay from './HowToPlay.jsx';
import GameIcon from './GameIcon.jsx';
import { music } from './music.js';
import { sfx } from './sfx.js';

const SECTIONS = [
  {
    id: 'arena', label: 'ENTER ARENA', summary: 'Choose a mode and step into your next match.', icon: 'game',
    items: [
      { label: 'Ranked', detail: 'Compete for rating', key: 'onlineranked', icon: 'medal' },
      { label: 'Unranked', detail: 'Play online without rating changes', key: 'onlineunranked', icon: 'globe' },
      { label: 'Regular Battle', detail: 'Start a local fight', key: 'regularbattle', icon: 'game' },
      { label: 'Tournament', detail: 'Enter a knockout bracket', key: 'tournament', icon: 'trophy' },
      { label: 'Training', detail: 'Practice against a training dummy', key: 'training', icon: 'running' },
      { label: 'Elo Ratings', detail: 'Review competitive ratings', key: 'elo', icon: 'chart' },
      { label: 'Daily Quests', detail: 'Complete today’s challenges', key: 'daily', icon: 'calendar' },
    ],
  },
  {
    id: 'play', label: 'PLAY', summary: 'Explore stories and multiplayer.', icon: 'game',
    items: [
      { label: 'Fight Modes', detail: 'Browse every fight format', key: 'modeSelect', icon: 'game' },
      { label: 'Story Mode', detail: 'Continue the chronicles', key: 'story', icon: 'book' },
      { label: 'Online', detail: 'Find a match or join friends', key: 'online', icon: 'globe' },
      { label: 'Sports', detail: 'Play the full sports roster', key: 'sports', icon: 'trophy' },
    ],
  },
  {
    id: 'customize', label: 'CUSTOMIZE', summary: 'Make your roster and loadout yours.', icon: 'palette',
    items: [
      { label: 'Shop', detail: 'Browse fighters and cosmetics', key: 'shop', icon: 'cart' },
      { label: 'Battle Pass', detail: 'See season rewards', key: 'events', icon: 'calendar' },
      { label: 'Equip', detail: 'Manage your loadouts', key: 'equip', icon: 'package' },
      { label: 'Meet Characters', detail: 'Explore the roster', key: 'meet', icon: 'users' },
      { label: 'Edit Characters', detail: 'Manage your fighters', key: 'editchars', icon: 'edit' },
      { label: 'Hero Codex', detail: 'Read fighter profiles', key: 'codex', icon: 'book' },
    ],
  },
  {
    id: 'progress', label: 'PROGRESSION', summary: 'Track rewards, challenges, and records.', icon: 'chart',
    items: [
      { label: 'Daily Reward', detail: 'Claim today’s reward', key: 'dailyreward', icon: 'gift' },
      { label: 'Daily Quests', detail: 'Complete today’s challenges', key: 'daily', icon: 'calendar' },
      { label: 'Fight Quests', detail: 'Earn rewards in battle', key: 'fightquests', icon: 'checkCircle' },
      { label: 'Leaderboard', detail: 'View your standing', key: 'leaderboard', icon: 'chart' },
      { label: 'Elo Ratings', detail: 'Review competitive ratings', key: 'elo', icon: 'medal' },
    ],
  },
  {
    id: 'community', label: 'COMMUNITY', summary: 'Meet players and keep in touch.', icon: 'users',
    items: [
      { label: 'Community Hub', detail: 'Visit the shared plaza', key: 'hub', icon: 'globe' },
      { label: 'Friends', detail: 'Manage your friend list', key: 'friends', icon: 'users' },
      { label: 'Chat', detail: 'Open your conversations', key: 'chat', icon: 'comment' },
      { label: 'Clans', detail: 'Browse and manage clans', key: 'clans', icon: 'users' },
      { label: 'Clips', detail: 'Review saved match clips', key: 'clips', icon: 'video' },
      { label: 'Online Users', detail: 'See who is playing', key: 'online', icon: 'user' },
    ],
  },
  {
    id: 'tools', label: 'TOOLS & LEARN', summary: 'Practice, create, and adjust your game.', icon: 'settings',
    items: [
      { label: 'Training', detail: 'Practice against a dummy', key: 'training', icon: 'running' },
      { label: 'Combo Trainer', detail: 'Study routes and timing', key: 'combos', icon: 'chart' },
      { label: 'Tutorial', detail: 'Learn the controls', key: 'tutorial', icon: 'info' },
      { label: 'Custom Battle', detail: 'Set up a custom match', key: 'custombattle', icon: 'settings' },
      { label: 'Stage Editor', detail: 'Build a custom arena', key: 'stageeditor', icon: 'layers' },
      { label: 'Sandbox', detail: 'Explore match settings', key: 'sandbox', icon: 'expand' },
      { label: 'Campaign Creator', detail: 'Build a battle campaign', key: 'creatormode', icon: 'edit' },
      { label: 'Save Codes', detail: 'Import or export setups', key: 'savecodes', icon: 'clipboard' },
      { label: 'Settings', detail: 'Tune controls and display', key: 'settings', icon: 'settings' },
      { label: 'About the Game', detail: 'Learn about The Chronicles', key: 'about', icon: 'info' },
    ],
  },
];

export default function MainMenu({ onNavigate, coins = 0, favoriteName, favoriteLevel = 1, onlineRankedRating, musicVolume, username, chatNotifCount = 0, backdropUrl = `${import.meta.env.BASE_URL}assets/e6-home-menu-background.png` }) {
  const [showHowTo, setShowHowTo] = useState(false);
  const [activeSection, setActiveSection] = useState('play');
  const [query, setQuery] = useState('');
  const arenaTabRef = useRef(null);
  const selected = SECTIONS.find(section => section.id === activeSection) || SECTIONS[0];
  const visibleItems = selected.items.filter(item => `${item.label} ${item.detail}`.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    music.setVolume(musicVolume ?? 50);
    music.play('menu');
    return () => music.stop();
  }, [musicVolume]);

  useEffect(() => {
    if (activeSection === 'arena') arenaTabRef.current?.focus();
  }, [activeSection]);

  const navigate = (key) => {
    sfx.click();
    if (key === 'arena') {
      setActiveSection('arena'); setQuery('');
      requestAnimationFrame(() => arenaTabRef.current?.focus());
      return;
    }
    if (key === 'howto') {
      sfx.menuOpen();
      setShowHowTo(true);
      return;
    }
    onNavigate(key);
  };

  return (
    <main className="e6-home-menu">
      <img className="e6-home-backdrop" src={backdropUrl} alt="" aria-hidden="true" draggable="false" loading="eager" />
      <header className="e6-home-topbar">
        <div className="e6-home-brand" aria-label="Element 6">
          <span className="e6-home-brand-mark"><img src={`${import.meta.env.BASE_URL}favicon.png`} alt="" /></span>
          <span><strong>ELEMENT</strong><small>6</small></span>
        </div>
        <div className="e6-home-player-strip">
          <div className="e6-home-player-name"><span className="e6-home-eyebrow">PLAYER</span><strong>{username || 'Guest Player'}</strong></div>
          {favoriteName && <div className="e6-home-favorite"><span className="e6-home-eyebrow">FAVORITE FIGHTER</span><strong>{favoriteName}<small>{favoriteLevel > 1 ? ` · LV ${favoriteLevel}` : ''}</small></strong></div>}
          <div className="e6-home-currency"><span className="e6-home-eyebrow">TOKENS</span><strong>{Number(coins || 0).toLocaleString()}</strong></div>
          {onlineRankedRating != null && <div className="e6-home-rating"><span className="e6-home-eyebrow">RANKED</span><strong>{onlineRankedRating}</strong></div>}
        </div>
        <div className="e6-home-utility">
          <button type="button" onClick={() => navigate('settings')} aria-label="Open settings"><GameIcon icon="settings" size={17} /><span>Settings</span></button>
          <button type="button" onClick={() => navigate('howto')} aria-label="How to play"><GameIcon icon="info" size={17} /><span>How to Play</span></button>
        </div>
      </header>

      <section className="e6-home-layout">
        <div className="e6-home-hero">
          <div className="e6-home-season">A NEW ERA OF ELEMENTAL FIGHTING</div>
          <h1>THE <span>CHRONICLES</span></h1>
          <p className="e6-home-subtitle">A world of fighters, stories, and rivalries waits beyond the city lights.</p>
          <div className="e6-home-actions">
            <button type="button" className="e6-home-primary" onClick={() => navigate('arena')}>
              <span><small>READY WHEN YOU ARE</small><strong>ENTER THE ARENA</strong></span><GameIcon icon="arrowRight" size={20} />
            </button>
            <button type="button" className="e6-home-secondary" onClick={() => navigate('story')}><GameIcon icon="book" size={17} /> EXPLORE STORY</button>
          </div>
          <div className="e6-home-quicklinks">
            <button type="button" onClick={() => navigate('shop')}><GameIcon icon="cart" size={16} /><span>SHOP</span></button>
            <button type="button" onClick={() => navigate('events')}><GameIcon icon="calendar" size={16} /><span>BATTLE PASS</span></button>
            <button type="button" onClick={() => navigate('equip')}><GameIcon icon="package" size={16} /><span>LOADOUT</span></button>
          </div>
          <div className="e6-home-caption">YOUR NEXT CHAPTER STARTS HERE</div>
        </div>

        <aside className="e6-home-navigation" aria-label="Game destinations">
          <div className="e6-home-nav-heading">
            <div><span className="e6-home-eyebrow">EXPLORE</span><h2>Where to next?</h2></div>
            <span className="e6-home-nav-count">0{selected.items.length}</span>
          </div>
          <div className="e6-home-tabs" role="tablist" aria-label="Destination categories">
            {SECTIONS.map(section => (
              <button key={section.id} ref={section.id === 'arena' ? arenaTabRef : undefined} data-section={section.id} type="button" role="tab" aria-selected={activeSection === section.id}
                aria-controls="e6-home-destinations" className={activeSection === section.id ? 'is-active' : ''} onClick={() => { setActiveSection(section.id); setQuery(''); }}>
                <GameIcon icon={section.icon} size={16} /><span>{section.label}</span>
              </button>
            ))}
          </div>
          <div className="e6-home-section-intro"><span>{selected.summary}</span></div>
          <label className="e6-home-search"><GameIcon icon="search" size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Find in ${selected.label.toLowerCase()}…`} aria-label={`Find in ${selected.label.toLowerCase()}`} /></label>
          <div className="e6-home-destination-list" id="e6-home-destinations" role="tabpanel" aria-label={`${selected.label} destinations`}>
            {visibleItems.map((item, index) => (
              <button key={item.key} type="button" className="e6-home-destination" onClick={() => navigate(item.key)}>
                <span className="e6-home-destination-icon"><GameIcon icon={item.icon} size={17} /></span>
                <span className="e6-home-destination-copy"><strong>{item.label}{item.key === 'chat' && chatNotifCount > 0 && <i>{chatNotifCount}</i>}</strong><small>{item.detail}</small></span>
                <GameIcon icon="arrowRight" size={15} className="e6-home-destination-arrow" />
              </button>
            ))}
            {visibleItems.length === 0 && <div className="e6-home-empty">No destinations match “{query}”.</div>}
          </div>
          <div className="e6-home-nav-footer"><span>THE CHRONICLES</span><button type="button" onClick={() => navigate('about')}>ABOUT THE GAME <GameIcon icon="arrowRight" size={13} /></button></div>
        </aside>
      </section>

      {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}
    </main>
  );
}
