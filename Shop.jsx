import React, { useEffect, useMemo, useState } from 'react';
import { ACCESSORIES, accessoriesFor, drawAccessory } from './cosmetics.js';
import { SHIKIGAMI, getShikigami } from './shikigami.js';
import { EMOTES, getEmoteById } from './emotes.js';
import { PROFILE_TITLES, getTitleColor } from './profileTitles.js';
import { HEROES } from './heroes.js';
import { music } from './music.js';
import { formatNumber } from './formatNumber.js';
import GameIcon from './GameIcon.jsx';

// The storefront deliberately contains no skin products: skins have been retired.
const NAV = [
  ['featured', 'FEATURED'], ['accessories', 'ACCESSORIES'], ['emotes', 'EMOTES'],
  ['shikigami', 'SHIKIGAMI'], ['profile', 'PROFILE'], ['battlepass', 'BATTLE PASS'],
  ['tokens', 'TOKENS'], ['support', 'SUPPORT ELEMENT 6'],
];

const TOKEN_PACKS = [
  { id: 'tokens_5000', amount: 5000, price: '$1.99', color: '#f6d449' },
  { id: 'tokens_15000', amount: 15000, price: '$4.99', color: '#ffa928', badge: 'POPULAR' },
  { id: 'tokens_50000', amount: 50000, price: '$9.99', color: '#ff7a28', badge: 'BEST VALUE' },
  { id: 'tokens_100000', amount: 100000, price: '$19.99', color: '#ff4b54' },
];

const SUPPORT_PACKS = [
  { id: 'supporter_pack', name: 'SUPPORTER PACK', price: '$4.99', emoji: '💜', items: ['Exclusive title', 'Exclusive profile banner', '5,000 Tokens'] },
  { id: 'founder_pack', name: 'FOUNDER PACK', price: '$9.99', emoji: '👑', items: ['Exclusive accessory', 'Exclusive title', 'Exclusive profile icon', '15,000 Tokens'] },
  { id: 'ultimate_supporter_pack', name: 'ULTIMATE SUPPORTER', price: '$24.99', emoji: '✨', items: ['Exclusive accessory & shikigami', 'Exclusive emotes & profile cosmetics', '100,000 Tokens', '+10 Custom Character Slots'] },
];

const BUNDLES = {
  accessories: [{ id: 'accessory_random_10', label: '10 RANDOM ACCESSORIES', price: '$4.99', count: 10 }],
  emotes: [
    { id: 'emote_random_3', label: '3 RANDOM EMOTES', price: '$4.99', count: 3 },
    { id: 'emote_random_6', label: '6 RANDOM EMOTES', price: '$7.99', count: 6 },
    { id: 'emote_random_10', label: '10 RANDOM EMOTES', price: '$9.99', count: 10 },
  ],
  shikigami: [{ id: 'shikigami_random_5', label: '5 RANDOM SHIKIGAMI', price: '$4.99', count: 5 }],
  profile: [{ id: 'profile_random_5', label: '5 RANDOM PROFILE ITEMS', price: '$4.99', count: 5 }],
};

export default function Shop({ progress = {}, onBuy, onEquip, onBuyPack, onBuyShikigami, onEquipShikigami, onBuyEmote, onEquipTitle, onBack }) {
  const [tab, setTab] = useState('featured');
  const [selectedChar, setSelectedChar] = useState(progress.favoriteId || HEROES[0]?.id);
  const [notice, setNotice] = useState(null);
  const coins = progress.coins || 0;
  const ownedAccessories = progress.ownedAccessories || [];
  const ownedEmotes = progress.ownedEmotes || [];
  const ownedShikigami = progress.ownedShikigami || [];
  const ownedTitles = progress.ownedTitles || [];

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);
  const callCheckout = item => { onBuyPack?.(item.id); setNotice(`${item.name || item.label || item.amount + ' Tokens'} will open checkout once payments are connected.`); };
  const featured = useMemo(() => [TOKEN_PACKS[2], BUNDLES.emotes[2], SUPPORT_PACKS[2]], []);
  const charAccessories = accessoriesFor(selectedChar).filter(a => !a.exclusiveTo || a.exclusiveTo === selectedChar).slice(0, 16);

  return <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-card/80 p-4">
      <div><h2 className="font-heading text-2xl text-accent tracking-wider">ELEMENT 6 SHOP</h2><p className="text-xs text-muted-foreground">Cosmetics, profiles and optional support — never gameplay power.</p></div>
      <div className="flex items-center gap-3"><div className="rounded-xl bg-accent/15 px-4 py-2 text-right"><p className="text-[10px] text-muted-foreground">YOUR TOKENS</p><p className="font-heading text-lg text-accent">{formatNumber(coins)} ◆</p></div><button onClick={onBack} className="rounded-lg bg-secondary px-4 py-2 font-heading text-sm">← BACK</button></div>
    </header>
    <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">{NAV.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-lg px-2 py-2 font-heading text-[10px] ${tab === id ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-secondary text-secondary-foreground'}`}>{label}</button>)}</nav>

    {tab === 'featured' && <section className="space-y-4"><SectionTitle title="FEATURED" subtitle="Rotating highlights from across the Element 6 store." /><div className="grid md:grid-cols-3 gap-4">{featured.map(item => <FeatureCard key={item.id} item={item} onBuy={() => callCheckout(item)} />)}</div><div className="rounded-2xl border border-accent/50 bg-gradient-to-r from-primary/25 to-accent/20 p-5"><h3 className="font-heading text-xl text-accent">PREMIUM BATTLE PASS — $7.99</h3><p className="text-sm text-muted-foreground">Unlock the premium reward track: accessories, emotes, shikigami, titles, profile cosmetics and Tokens.</p><button onClick={() => setTab('battlepass')} className="mt-3 rounded-lg bg-accent px-4 py-2 font-heading text-sm text-accent-foreground">VIEW BATTLE PASS</button></div></section>}

    {tab === 'accessories' && <section className="space-y-4"><SectionTitle title="ACCESSORIES" subtitle="Choose a fighter, preview accessories, or collect a larger random bundle." /><div className="flex gap-2 overflow-x-auto pb-1">{HEROES.slice(0, 12).map(c => <button key={c.id} onClick={() => setSelectedChar(c.id)} title={c.name} className={`h-9 w-9 shrink-0 rounded-full border-2 ${selectedChar === c.id ? 'border-accent' : 'border-border'}`} style={{ background:c.color }} />)}</div><BundleRow bundles={BUNDLES.accessories} onBuy={callCheckout} /><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{charAccessories.map(a => <ProductCard key={a.id} title={a.name} price="$1.99" preview={<AccessoryPreview accessory={a} />} owned={ownedAccessories.includes(a.id)} onBuy={() => callCheckout({ id:`accessory_${a.id}`, name:a.name })} />)}</div></section>}

    {tab === 'emotes' && <section className="space-y-4"><SectionTitle title="EMOTES" subtitle="Animated expression cosmetics for matches and the Community Hub." /><BundleRow bundles={BUNDLES.emotes} onBuy={callCheckout} /><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{EMOTES.filter(e => e.price !== 0).slice(0, 24).map(e => <ProductCard key={e.id} title={e.name} price="$1.99" preview={<div className="grid h-20 place-items-center text-4xl animate-pulse">{e.emoji || '✦'}</div>} owned={ownedEmotes.includes(e.id)} onBuy={() => callCheckout({ id:`emote_${e.id}`, name:e.name })} />)}</div></section>}

    {tab === 'shikigami' && <section className="space-y-4"><SectionTitle title="SHIKIGAMI" subtitle="Spirit companions with large animated previews." /><BundleRow bundles={BUNDLES.shikigami} onBuy={callCheckout} /><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{SHIKIGAMI.map(s => <ProductCard key={s.id} large title={s.name} price="$2.99" preview={<ShikigamiPreview id={s.id} />} owned={ownedShikigami.includes(s.id)} onBuy={() => callCheckout({ id:`shikigami_${s.id}`, name:s.name })} />)}</div></section>}

    {tab === 'profile' && <section className="space-y-4"><SectionTitle title="PROFILE" subtitle="Titles and profile cosmetics visible throughout Element 6." /><BundleRow bundles={BUNDLES.profile} onBuy={callCheckout} /><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{PROFILE_TITLES.filter(t => t.price > 0).map(t => <ProductCard key={t.id} title={t.name} price="$0.99" preview={<ProfilePreview title={t} />} owned={ownedTitles.includes(t.id)} onBuy={() => callCheckout({ id:`profile_${t.id}`, name:t.name })} />)}</div></section>}

    {tab === 'battlepass' && <BattlePass onBuy={() => callCheckout({ id:'premium_battle_pass', name:'Premium Battle Pass' })} />}
    {tab === 'tokens' && <section className="space-y-4"><SectionTitle title="TOKENS" subtitle="Use Tokens for in-game cosmetic unlocks." /><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{TOKEN_PACKS.map(pack => <div key={pack.id} className="rounded-2xl border-2 p-5 text-center" style={{borderColor:pack.color}}>{pack.badge && <span className="rounded bg-accent px-2 py-1 text-[9px] font-heading text-accent-foreground">{pack.badge}</span>}<p className="mt-4 font-heading text-4xl" style={{color:pack.color}}>{formatNumber(pack.amount)}</p><p className="font-heading text-lg">TOKENS ◆</p><p className="my-3 font-heading text-2xl">{pack.price}</p><BuyButton onClick={() => callCheckout(pack)} /></div>)}</div></section>}
    {tab === 'support' && <section className="space-y-5"><SectionTitle title="SUPPORT ELEMENT 6" subtitle="Optional packs that support the game and grant exclusive cosmetic thank-you items." /><div className="grid md:grid-cols-3 gap-4">{SUPPORT_PACKS.map(pack => <SupportCard key={pack.id} pack={pack} onBuy={() => callCheckout(pack)} />)}</div><div className="rounded-2xl border border-primary bg-card p-5"><h3 className="font-heading text-lg text-primary">CUSTOM CONTENT</h3><p className="mb-3 text-sm text-muted-foreground">Extra Custom Character Slots are separate from cosmetic purchases.</p><div className="grid sm:grid-cols-3 gap-3">{[{id:'custom_slots_2',label:'+2 SLOTS',price:'$1.99'},{id:'custom_slots_5',label:'+5 SLOTS',price:'$3.99'},{id:'custom_slots_10',label:'+10 SLOTS',price:'$6.99'}].map(slot => <div key={slot.id} className="rounded-xl bg-secondary/60 p-4 text-center"><p className="font-heading text-xl">{slot.label}</p><p className="my-2 font-heading text-accent">{slot.price}</p><BuyButton onClick={() => callCheckout(slot)} /></div>)}</div></div></section>}
    {notice && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-accent bg-card px-5 py-3 text-sm shadow-2xl">{notice}<button onClick={() => setNotice(null)} className="ml-3 text-accent">OK</button></div>}
  </div>;
}

const SectionTitle = ({ title, subtitle }) => <div><h3 className="font-heading text-2xl text-accent">{title}</h3><p className="text-sm text-muted-foreground">{subtitle}</p></div>;
const BuyButton = ({ onClick }) => <button onClick={onClick} className="w-full rounded-lg bg-primary px-3 py-2 font-heading text-xs text-primary-foreground hover:opacity-90">PURCHASE</button>;
function BundleRow({ bundles, onBuy }) { return <div className="grid md:grid-cols-3 gap-3">{bundles.map(b => <div key={b.id} className="rounded-2xl border-2 border-accent bg-accent/10 p-5 text-center"><p className="font-heading text-lg text-accent">{b.label}</p><p className="my-2 text-3xl font-heading">{b.count} <span className="text-sm">ITEMS</span></p><p className="mb-3 rounded bg-destructive/80 px-2 py-1 text-xs font-heading text-white">RANDOM</p><p className="mb-3 font-heading text-xl">{b.price}</p><BuyButton onClick={() => onBuy(b)} /></div>)}</div> }
function ProductCard({ title, price, preview, owned, onBuy, large }) { return <div className={`rounded-xl border border-border bg-card p-3 text-center ${large ? 'min-h-56' : ''}`}>{preview}<p className="font-heading text-sm">{title}</p><p className="my-2 font-heading text-accent">{price}</p>{owned ? <span className="block rounded bg-accent/20 px-3 py-2 text-xs font-heading text-accent">OWNED</span> : <BuyButton onClick={onBuy} />}</div>; }
function FeatureCard({ item, onBuy }) { const label=item.name || item.label || `${formatNumber(item.amount)} TOKENS`; const price=item.price; return <div className="rounded-2xl border-2 border-primary bg-gradient-to-b from-primary/20 to-card p-5 text-center"><p className="text-4xl">{item.emoji || '◆'}</p><p className="mt-2 font-heading text-lg">{label}</p><p className="my-3 font-heading text-2xl text-accent">{price}</p><BuyButton onClick={onBuy} /></div>; }
function SupportCard({ pack, onBuy }) { return <div className="rounded-2xl border-2 border-accent bg-gradient-to-b from-accent/20 to-card p-5 text-center"><p className="text-4xl">{pack.emoji}</p><p className="mt-2 font-heading text-lg text-accent">{pack.name}</p><ul className="my-3 space-y-1 text-xs text-muted-foreground">{pack.items.map(x => <li key={x}>✓ {x}</li>)}</ul><p className="mb-3 font-heading text-2xl">{pack.price}</p><BuyButton onClick={onBuy} /></div>; }
function AccessoryPreview({ accessory }) { const ref=React.useRef(null); useEffect(()=>{ const c=ref.current; if(!c)return; const x=c.getContext('2d'); let f=0, raf; const draw=()=>{f++;x.fillStyle='#0a0820';x.fillRect(0,0,80,80);drawAccessory(x,40,58,accessory.type,accessory.color,f,.7,accessory.exclusiveTo||'');raf=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(raf);},[accessory]);return <canvas ref={ref} width={80} height={80} className="mx-auto rounded-lg"/>; }
function ShikigamiPreview({ id }) { const ref=React.useRef(null); useEffect(()=>{ const c=ref.current;if(!c)return;const x=c.getContext('2d');const s=getShikigami(id);let f=0,raf;const draw=()=>{f++;x.fillStyle='#0a0820';x.fillRect(0,0,170,130);s?.draw?.(x,85,75,f,2);raf=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(raf);},[id]);return <canvas ref={ref} width={170} height={130} className="mx-auto rounded-xl"/>; }
function ProfilePreview({ title }) { return <div className="mx-auto mb-2 w-full rounded-lg border border-primary/50 bg-primary/10 p-3"><p className="text-[9px] text-muted-foreground">ELEMENT 6 PROFILE</p><p className="font-heading text-sm" style={{color:getTitleColor(title.id)}}>{title.name}</p><p className="text-xs">PLAYER</p></div>; }
function BattlePass({ onBuy }) { const rewards=['Accessory','Emote','Shikigami','Title','Profile Cosmetic','5,000 Tokens','Accessory','Emote'];return <section className="space-y-4"><SectionTitle title="BATTLE PASS" subtitle="Complete matches and quests to advance. Premium adds an extra reward at every tier." /><div className="rounded-2xl border-2 border-accent bg-card p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-heading text-2xl text-accent">PREMIUM BATTLE PASS</p><p className="text-sm text-muted-foreground">$7.99 · Cosmetics and Tokens only</p></div><button onClick={onBuy} className="rounded-lg bg-accent px-6 py-3 font-heading text-accent-foreground">GET PREMIUM — $7.99</button></div><div className="mt-5 overflow-x-auto"><div className="min-w-[760px] space-y-3"><RewardTrack label="FREE" rewards={rewards.map((r,i)=>i%2?'Tokens':r)} /><RewardTrack label="PREMIUM" premium rewards={rewards} /></div></div></div></section>; }
function RewardTrack({label,rewards,premium}) {return <div className="grid grid-cols-[90px_repeat(8,1fr)] gap-2 items-stretch"><div className={`grid place-items-center rounded font-heading text-xs ${premium?'bg-accent text-accent-foreground':'bg-secondary'}`}>{label}</div>{rewards.map((r,i)=><div key={i} className="min-h-20 rounded-lg border border-border bg-secondary/40 p-2 text-center text-[10px] font-heading">TIER {i+1}<br/><span className="text-accent">{r}</span></div>)}</div>; }
