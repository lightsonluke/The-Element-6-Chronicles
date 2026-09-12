import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { toggleElementFullscreen } from './fullscreen.js';
import { drawStickman } from './renderer.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getAccessory, drawAccessory } from './cosmetics.js';
import StoryBattle from './StoryBattle.jsx';
import StoryCharacterSelect from './StoryCharacterSelect.jsx';
import StoryNewsreelCutscene from './StoryNewsreelCutscene.jsx';
import StorySettingsOverlay from './StorySettingsOverlay.jsx';
import StoryEpilogue from './StoryEpilogue.jsx';
import { STORY_BOOKS, BOOK_ROLE_RULES, CANON_LOCKS, defaultStoryProgress, calculateStoryProgress } from './storyModeOverhaul.js';
import { music } from './music.js';

const W=960, H=560, G=0.48, J=-11, SPEED=4.1;
const SAVE_VERSION=2;

const BIOMES={
  sakura:{sky:'#11131e',far:'#29253d',mid:'#473e55',ground:'#17151d',accent:'#f0a9bd',particle:'#ffd5df'},
  ash:{sky:'#151719',far:'#292c31',mid:'#3b3e43',ground:'#111214',accent:'#d0a36d',particle:'#e7c18d'},
  blight:{sky:'#100f17',far:'#252034',mid:'#3a2940',ground:'#0d0c12',accent:'#b979d8',particle:'#9d7be0'},
  tower:{sky:'#0d1118',far:'#1d2632',mid:'#2e3a49',ground:'#0a0d12',accent:'#69c6e8',particle:'#8de5ff'},
  cosmic:{sky:'#060612',far:'#11122b',mid:'#1d1b43',ground:'#05050c',accent:'#c5a5ff',particle:'#d6c7ff'}
};

function mergeProgress(progress, heroId){
  const base=defaultStoryProgress(heroId);
  const p={...base,...(progress||{})};
  p.version=SAVE_VERSION; p.storyVersion=SAVE_VERSION;
  p.selectedHeroId=p.selectedHeroId||heroId; p.currentHeroId=p.currentHeroId||heroId;
  p.viewedBeats=[...(p.viewedBeats||[])]; p.wonMatches=[...(p.wonMatches||[])]; p.nonVillainWins=[...(p.nonVillainWins||[])];
  p.sidegrounds=[...(p.sidegrounds||[])]; p.gimmickObjectives=[...(p.gimmickObjectives||[])]; p.shardVaults=[...(p.shardVaults||[])];
  p.bountyWins=[...(p.bountyWins||[])]; p.defeatedVillains=[...(p.defeatedVillains||[])]; p.swapHistory=[...(p.swapHistory||[])];
  return p;
}

function heroFor(id){return HEROES.find(h=>h.id===id)||null}
function nameFor(id){return heroFor(id)?.name||VILLAINS.find(v=>v.id===id)?.name||id}
function heroNickname(h){return h?.nickname||h?.codename||h?.title||h?.name||'Hero'}
function tokenize(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function findCharacterByTitle(title){
  const t=tokenize(title);
  const pool=[...HEROES,...VILLAINS];
  const exact=pool.find(c=>tokenize(c.id)===t||tokenize(c.name)===t||tokenize(c.title)===t);
  if(exact)return exact.id;
  const words=t.split(/(?=[A-Z])/).filter(Boolean);
  const hit=pool.find(c=>{const id=tokenize(c.id), n=tokenize(c.name), ct=tokenize(c.title); return id&&t.includes(id)||n&&t.includes(n)||ct&&t.includes(ct) || words.some(w=>w.length>3&&(id.includes(w)||n.includes(w)))})
  return hit?.id || VILLAINS.find(v=>!v.isFinalBoss)?.id || HEROES[0]?.id || 'yellow';
}

function affinity(hero){
  const s=`${hero?.name||''} ${hero?.title||''} ${hero?.element||''} ${hero?.power||''}`.toLowerCase();
  if(/fire|flame|burn|lava/.test(s))return 'fire'; if(/water|ice|frost|snow/.test(s))return 'water'; if(/grass|plant|earth|stone|sand|bone|thorn/.test(s))return 'earth';
  if(/shadow|dark|stealth|void/.test(s))return 'shadow'; if(/speed|wind|air/.test(s))return 'speed'; if(/light|heal|restore/.test(s))return 'support';
  return 'force';
}
function assignRole(book, hero){
  const rules=BOOK_ROLE_RULES[book.id];
  if(!rules)return {role:'Secondary', anchor:false};
  if(book.number===5)return {role:'Open Roster',anchor:false};
  const h=tokenize(hero?.id); if(rules.anchor && h.includes(tokenize(rules.anchor)))return {role:book.anchor,anchor:true};
  const a=affinity(hero); const match=rules.secondary.find(x=>tokenize(x).includes(a));
  return {role:match||rules.fallback[0],anchor:false};
}

function makePlatforms(book){
  const p=[{x:0,y:500,w:360,h:28},{x:420,y:455,w:260,h:28},{x:730,y:390,w:230,h:28},{x:980,y:470,w:360,h:28},{x:1430,y:420,w:300,h:28},{x:1810,y:500,w:500,h:28},{x:2360,y:445,w:330,h:28},{x:2790,y:380,w:280,h:28},{x:3180,y:470,w:420,h:28},{x:3700,y:410,w:340,h:28},{x:4140,y:490,w:620,h:28}];
  if(book.number===4)return p.map((v,i)=>({...v,y:v.y-(i%3)*35,w:Math.max(180,v.w-20)}));
  if(book.number===5)return p.map((v,i)=>({...v,y:v.y-(i%2)*50,w:v.w+30}));
  return p;
}

function makeNodes(book){
  const matches=book.matches;
  const nodes=[];
  matches.forEach((m,i)=>nodes.push({id:m.id,type:'match',x:520+i*360,y:book.number===5?330-(i%3)*55:340-(i%2)*40,data:m}));
  book.beats.forEach((b,i)=>nodes.push({id:b,type:'beat',x:180+i*410,y:300+(i%3)*30,beat:b}));
  [1,2,3,4,5].forEach((n,i)=>nodes.push({id:`${book.id}_shard_${n}`,type:'shard',x:260+i*820,y:250+(i%2)*70,index:n}));
  nodes.push({id:`${book.id}_bounty`,type:'bounty',x:260,y:455});
  return nodes;
}

export default function StoryMode({ onBack, progress, onUnlockHero, onUnlockVillain, onUnlockAll, onSaveProgress, onAddCoins, equippedAccessories = {}, equippedSkins = {}, equippedShikigami = {}, equippedEmotes = {} }) {
  const canvasRef=useRef(null), fullRef=useRef(null), keysRef=useRef({}), rafRef=useRef(null), stateRef=useRef(null), saveTimer=useRef(0);
  const initialHero=progress?.selectedHeroId||progress?.currentHeroId||progress?.favoriteId||progress?.unlockedIds?.[0]||'yellow';
  const [save,setSave]=useState(()=>mergeProgress(progress,initialHero));
  const [screen,setScreen]=useState('save');
  const [selectedSave,setSelectedSave]=useState(null);
  const [showSettings,setShowSettings]=useState(false), [cutscene,setCutscene]=useState(null), [battle,setBattle]=useState(null), [message,setMessage]=useState(''), [epilogue,setEpilogue]=useState(false);
  const [activeNode,setActiveNode]=useState(null);
  const [bounty,setBounty]=useState(null);
  const [slots,setSlots]=useState(()=>{try{const raw=JSON.parse(localStorage.getItem('element6_story_slots_v2')||'null');const base=Array.isArray(raw)&&raw.length===3?raw:[null,null,null];if(!base.some(Boolean)&&(progress?.storyInitialized||progress?.currentBook||progress?.selectedHeroId)){base[0]=mergeProgress(progress,initialHero);localStorage.setItem('element6_story_slots_v2',JSON.stringify(base));}return base}catch{return [null,null,null]}});
  const unlockedIds=progress?.unlockedIds||save?.unlockedIds||['yellow'];
  const book=STORY_BOOKS[Math.max(0,Math.min(4,(save.currentBook||1)-1))];
  const hero=heroFor(save.currentHeroId);
  const role=assignRole(book,hero);
  const percent=calculateStoryProgress(save);

  const persist=(next)=>{
    const merged={...save,...next,lastSave:Date.now(),storyInitialized:true};
    setSave(merged); onSaveProgress?.(merged);
    if(selectedSave!=null){const ns=[...slots];ns[selectedSave]=merged;setSlots(ns);try{localStorage.setItem('element6_story_slots_v2',JSON.stringify(ns))}catch{}}
  };
  const mark=(field,id,extra={})=>{if((save[field]||[]).includes(id))return;persist({[field]:[...(save[field]||[]),id],...extra})};

  const startNew=(slot,heroId)=>{
    const fresh=defaultStoryProgress(heroId); fresh.unlockedIds=unlockedIds; fresh.storyInitialized=true; fresh.currentHeroId=heroId; fresh.selectedHeroId=heroId;
    const ns=[...slots];ns[slot]=fresh;setSlots(ns);setSelectedSave(slot);setSave(fresh);try{localStorage.setItem('element6_story_slots_v2',JSON.stringify(ns))}catch{}
    setScreen('newsreel');
  };
  const continueSave=(slot)=>{const s=slots[slot];if(!s)return;setSelectedSave(slot);setSave(mergeProgress(s,s.selectedHeroId||s.currentHeroId||'yellow'));setScreen('game')};
  const deleteSave=(slot)=>{const ns=[...slots];ns[slot]=null;setSlots(ns);try{localStorage.setItem('element6_story_slots_v2',JSON.stringify(ns))}catch{}};

  useEffect(()=>{ if(screen!=='game')return; music.play('story'); return()=>music.stop() },[screen]);

  const beginMatch=useCallback((m, isBounty=false)=>{
    const opponent=m.enemyIds?.[0]||findCharacterByTitle(m.title);
    const multi=m.enemyIds?.length>1 ? m.enemyIds : undefined;
    setBattle({ ...m, opponent, enemyIds:multi, isBounty });
  },[]);

  const interact=useCallback(()=>{
    const s=stateRef.current;if(!s||activeNode||battle)return;
    let nearest=null,d=Infinity;
    s.nodes.forEach(n=>{if(n.collected)return;const dx=n.x-s.player.x,dy=n.y-s.player.y;const dd=Math.hypot(dx,dy);if(dd<90&&dd<d){nearest=n;d=dd}});
    if(!nearest)return;
    setActiveNode(nearest.id);
    if(nearest.type==='shard'){nearest.collected=true;persist({collectedShards:(save.collectedShards||0)+1,sidegrounds:[...(save.sidegrounds||[]),nearest.id]});setActiveNode(null);setMessage('ELEMENT 6 SHARD FOUND');setTimeout(()=>setMessage(''),1800);return}
    if(nearest.type==='bounty'){const candidates=HEROES.filter(h=>h.id!==hero?.id);const c=candidates[(save.bountyWins?.length||0)%Math.max(1,candidates.length)]||HEROES[0];beginMatch({id:`bounty_${book.id}_${Date.now()}`,title:`Bounty — ${heroNickname(c)}`,stage:book.stages.find(s=>!book.matches.some(m=>m.stage===s))||book.stages[0]||'basic',stocks:2,time:150,difficulty:'hard'},true);return}
    if(nearest.type==='beat'){mark('viewedBeats',`${book.id}:${nearest.beat}`);setCutscene({id:nearest.beat,book:book.number});return}
    if(nearest.type==='match'){const won=save.wonMatches?.includes(nearest.data.id);if(won){setMessage('CLEARED — PRESS E TO REPLAY');setTimeout(()=>setMessage(''),1200);beginMatch(nearest.data)} else {const idx=book.matches.findIndex(m=>m.id===nearest.data.id);const blocked=idx>0&&book.matches.slice(0,idx).some(m=>!(save.wonMatches||[]).includes(m.id));if(blocked){setMessage('THE PATH IS SEALED — CLEAR THE PREVIOUS ENCOUNTER');setTimeout(()=>setMessage(''),1600)}else beginMatch(nearest.data)}}
  },[activeNode,battle,book,hero,save]);

  useEffect(()=>{if(screen!=='game')return; const kd=e=>{keysRef.current[e.key]=true;keysRef.current[e.key.toLowerCase()]=true;if(e.key==='Escape')setShowSettings(v=>!v);if(e.key==='e'||e.key==='Enter')interact();if(e.key==='Tab'){e.preventDefault();setShowSettings(v=>!v)}};const ku=e=>{keysRef.current[e.key]=false;keysRef.current[e.key.toLowerCase()]=false};window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)}},[screen,interact]);

  useEffect(()=>{
    if(screen!=='game'||battle)return;
    const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext('2d');
    const platforms=makePlatforms(book), nodes=makeNodes(book);
    const p={x:save.currentX||80,y:save.currentY||430,vx:0,vy:0,grounded:false,facing:1,frame:0};
    const world={platforms,nodes}; stateRef.current={player:p,nodes,world,running:true};
    let last=performance.now();
    const loop=(now)=>{
      if(!stateRef.current?.running)return;const dt=Math.min(2,(now-last)/16.67);last=now;p.frame++;
      const k=keysRef.current;p.vx=((k.ArrowLeft||k.a)?-SPEED:(k.ArrowRight||k.d)?SPEED:0);if(p.vx)p.facing=Math.sign(p.vx);
      if((k.ArrowUp||k.w||k[' '])&&p.grounded){p.vy=J;p.grounded=false;keysRef.current.ArrowUp=false;keysRef.current.w=false;keysRef.current[' ']=false}
      p.vy=Math.min(12,p.vy+G*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.grounded=false;
      if(p.x<0)p.x=0;if(p.x>4720)p.x=4720;
      platforms.forEach(pl=>{if(p.x+18>pl.x&&p.x-18<pl.x+pl.w&&p.y+55<=pl.y+14&&p.y+55+p.vy*dt>=pl.y){p.y=pl.y-55;p.vy=0;p.grounded=true}});
      const targetX=p.x,camX=Math.max(0,Math.min(3760,targetX-W/2));
      drawScene(ctx,book,hero,p,platforms,nodes,camX,H,save,role,equippedSkins,equippedAccessories);
      saveTimer.current+=dt/60;if(saveTimer.current>=5){saveTimer.current=0;persist({currentX:p.x,currentY:p.y,currentArea:`${book.id}_hub`})}
      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);return()=>{stateRef.current&&(stateRef.current.running=false);if(rafRef.current)cancelAnimationFrame(rafRef.current)};
  },[screen,battle,book,hero,save.currentX,save.currentY,save.currentHeroId,role,equippedSkins,equippedAccessories]);

  const finishBattle=(won)=>{
    const b=battle;if(!b){return} setBattle(null);setActiveNode(null);
    const narrative=(won==='narrative'); if(narrative) won=true;
    if(!won){setMessage('DEFEATED — TRY AGAIN');setTimeout(()=>setMessage(''),1800);return}
    if(b.isBounty){persist({bountyWins:[...(save.bountyWins||[]),b.id],residue:(save.residue||0)+15,nonVillainWins:[...(save.nonVillainWins||[]),b.id]});setMessage('BOUNTY CLEARED • +15 RESIDUE');setTimeout(()=>setMessage(''),1800);return}
    persist({wonMatches:[...(save.wonMatches||[]),b.id],nonVillainWins:b.kind==='boss'||b.kind==='final'?[...(save.nonVillainWins||[])]:[...(save.nonVillainWins||[]),b.id],defeatedVillains:narrative?[...(save.defeatedVillains||[])]:[...(save.defeatedVillains||[]),b.opponent]});
    const idx=book.matches.findIndex(m=>m.id===b.id);
    if(idx>=0&&idx===book.matches.length-1){
      if(book.number<5){persist({currentBook:book.number+1,currentBeat:0,currentX:80,currentY:430,gimmickObjectives:[...(save.gimmickObjectives||[]),`${book.id}:complete`]});setCutscene({id:`book${book.number}_end`,book:book.number});}
      else {persist({epilogueUnlocked:true,currentBook:5});setEpilogue(true)}
    } else {setMessage('VICTORY — THE PATH AHEAD IS OPEN');setTimeout(()=>setMessage(''),1800)}
  };

  const changeHero=(id)=>{if(!unlockedIds.includes(id))return;const h=heroFor(id);const r=assignRole(book,h);persist({currentHeroId:id,swapHistory:[...(save.swapHistory||[]),{book:book.id,heroId:id,role:r.role,at:Date.now()}]})};

  const beatText=(id)=>({
    awakening_lightning:'The first awakening. Lightning cuts through the storm and the age begins.',awakening_fire:'Fire answers the darkness. A second power joins the legend.',awakening_water:'The river opens a path through the impossible.',awakening_grass:'Roots find a way where roads cannot.',awakening_ice:'The frozen world teaches patience before the heroes move as one.',mountain:'THE MOUNTAIN — A canon-locked feat. The Thunder Hero performs the legendary strike while your hero witnesses the moment.',journal:'The journal is written. The legacy passes forward.',
    corps_rollcall:'CORPS ROLL CALL — The Hero Corps becomes a team, and every unlocked hero can fill an open secondary role.',itto_first:'Ittō appears. The first encounter is a narrative-loss match; victory is not required for the story to continue.',itto_rematch:'The Eastern Castle rematch gives the player a true chance to settle the score.',foxes:'The Twin Foxes turn the battlefield into an illusion-reading trial.',puppeteer:"Nishikawa's strings turn the villagers into a moving battlefield.",ibuki:'The Hollow Monk waits in the forge.',utsuro_phase1:'Utsuro reveals only part of the threat.',utsuro_final:'CANON-LOCKED — Yui restores Utsuro. Your selected hero witnesses and assists, then immediately resumes control.',
tournament:'THE TOURNAMENT CIRCUIT — Optional bracket fights award Residue and banners.',blight:'BLIGHT CONTAINMENT — Corrupted floors must be crossed without letting the sickness spread.',extraction_ring:'The Extraction Ring is exposed beneath the city.',ogata:'Ogata is the ring leader behind the extraction operation.',yokai_spider:'The spider yokai emerges from the Blight.',yokai_oni:'The oni burns through the ruined district.',yokai_fox:'The nine-tail turns the shadows against the heroes.',fake_arm:'THE MAN WITH THE FAKE ARM — no fight begins. He simply closes the door.',
charter:'THE CHARTER — The Hero Corps receives its name.',two_names:'TWO NAMES — codenames and colors are formally revealed.',safehouse_sweep:'The Ring safehouses are cleared one by one.',controller_chase:'The Controller is seen, pursued, and lost in shadow.',renko:'Renko Kurenai makes her move.',tower_siege:'The tower comes under siege.',source:'THE SOURCE — A defense sequence leads directly into the canon-locked sacrifice.',gold_sacrifice:'CANON-LOCKED — Gold stabilizes the Source and sacrifices herself. If you are Gold, the scene uses the special first-person variant.',
crimson_red:'The Crimson and Red sparring match foreshadows the tragedy.',pink_betrayal:'Pink turns against the heroes.',controller:'The Controller confronts the full team.',war:'The Controller War spreads through Split City.',crimson_sacrifice:'CANON-LOCKED — Crimson sacrifices himself at the amplification node.',reality_nexus:'The final Controller confrontation reaches the reality-nexus.',magenta_sacrifice:'CANON-LOCKED — Magenta gives everything at the nexus.',evil:'CANON-LOCKED — EVIL begins the final multi-phase battle. The finale resolves with the surviving roster attacking together.',epilogue:'YEARS LATER — the surviving heroes finally get their peaceful lives.'
}[id]||'A new chapter of the Element 6 story unfolds.');

  if(screen==='save')return <SaveScreen slots={slots} unlockedIds={unlockedIds} onNew={slot=>{setSelectedSave(slot);setScreen('character')}} onContinue={continueSave} onDelete={deleteSave} onBack={onBack}/>;
  if(screen==='character')return <StoryCharacterSelect unlockedIds={unlockedIds} onNext={id=>startNew(selectedSave,id)} onBack={()=>setScreen('save')}/>;
  if(screen==='newsreel')return <StoryNewsreelCutscene onDone={()=>{setScreen('game');setCutscene({id:'cold_open',book:1});}}/>;
  if(epilogue)return <StoryEpilogue onBack={()=>setEpilogue(false)}/>;
  if(battle)return <StoryBattle heroId={save.currentHeroId} villainId={battle.opponent} enemyIds={battle.enemyIds} stageId={battle.stage} difficulty={battle.difficulty} battleTitle={battle.title} storyStocks={battle.stocks} storyTime={battle.time} narrativeLoss={battle.kind==='narrative-loss'} onEnd={finishBattle} equippedAccessories={equippedAccessories} equippedSkins={equippedSkins} equippedShikigami={equippedShikigami} equippedEmotes={equippedEmotes}/>;

  return <div ref={fullRef} className="relative w-full flex flex-col items-center gap-2 text-white">
    <div className="w-full max-w-[960px] flex items-center justify-between px-2 py-1"><div><span className="text-[10px] tracking-[.3em] text-white/35">BOOK {book.number}</span><h2 className="font-heading text-lg tracking-widest">{book.title}</h2><span className="text-[10px] text-white/45">{book.hub} • {role.anchor?'ANCHOR HERO':'SECONDARY ROLE: '+role.role}</span></div><div className="flex items-center gap-2"><span className="text-xs text-white/60">Progress {percent}%</span><button onClick={()=>setShowSettings(true)} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs">SETTINGS</button><button onClick={()=>{persist({currentX:stateRef.current?.player.x,currentY:stateRef.current?.player.y});onBack?.()}} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs">MENU</button></div></div>
    <div className="relative w-full max-w-[960px]"><canvas ref={canvasRef} width={W} height={H} className="w-full border border-white/10 rounded-xl shadow-2xl"/><div className="absolute top-3 left-3 text-[10px] text-white/50">← → / A D MOVE • SPACE / ↑ JUMP • E INTERACT • ESC/TAB CHANGE HERO</div><div className="absolute top-3 right-3 flex gap-2 text-xs"><span className="px-2 py-1 rounded bg-black/50">◆ {save.collectedShards||0}</span><span className="px-2 py-1 rounded bg-black/50">Residue {save.residue||0}</span></div>{message&&<div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-5 py-2 rounded-lg bg-black/75 border border-white/15 text-xs font-heading tracking-widest">{message}</div>}</div>
    {showSettings&&<StorySettingsOverlay unlockedIds={unlockedIds} currentHeroId={save.currentHeroId} onChangeHero={changeHero} onClose={()=>setShowSettings(false)}/>} 
    {cutscene&&<StoryCutscene text={cutscene.id==='cold_open'?'THE SHATTERING — THE STORY BEGINS':beatText(cutscene.id)} book={cutscene.book} canon={CANON_LOCKS.has(cutscene.id)||/sacrifice|mountain|evil|succession/.test(cutscene.id)} hero={hero} onDone={()=>{if(cutscene.id===`book${book.number}_end`){setSave(s=>({...s,currentBook:book.number+1,currentX:80,currentY:430}));}setCutscene(null)}}/>}
  </div>;
}

function SaveScreen({slots,unlockedIds,onNew,onContinue,onDelete,onBack}){
  const [confirm,setConfirm]=useState(null);
  return <div className="w-full max-w-4xl text-white p-5"><div className="text-center mb-8"><div className="text-[10px] tracking-[.5em] text-white/35">ELEMENT 6</div><h1 className="text-4xl font-heading tracking-[.25em] mt-2">SELECT YOUR SAVE</h1><p className="text-sm text-white/45 mt-2">Choose a journey, create a new one, or erase an existing file.</p></div><div className="grid gap-4">{[0,1,2].map(i=>{const s=slots[i];const h=s&&heroFor(s.currentHeroId||s.selectedHeroId);const pct=calculateStoryProgress(s||{});return <div key={i} className="rounded-2xl border border-white/10 bg-black/45 p-5 flex items-center gap-5"><div className="w-16 h-16 rounded-full border-2 shrink-0" style={{background:h?.color||'#222',borderColor:h?.color||'#444',boxShadow:h?`0 0 24px ${h.color}55`:undefined}}/><div className="flex-1"><div className="text-xs tracking-[.25em] text-white/35">SAVE {i+1}</div>{s?<><div className="text-lg font-heading">{heroNickname(h)}</div><div className="text-xs text-white/50 mt-1">Progress: {pct}%</div><div className="h-1.5 bg-white/10 rounded mt-2 overflow-hidden"><div className="h-full bg-white" style={{width:`${pct}%`}}/></div></>:<div className="text-sm text-white/35 mt-1">EMPTY SLOT</div>}</div><div className="flex gap-2">{s?<button onClick={()=>onContinue(i)} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-heading">CONTINUE</button>:<button onClick={()=>onNew(i)} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-heading">CREATE</button>}{s&&(confirm===i?<><button onClick={()=>{onDelete(i);setConfirm(null)}} className="px-3 py-2 bg-red-500/80 rounded-lg text-xs">CONFIRM</button><button onClick={()=>setConfirm(null)} className="px-3 py-2 bg-white/10 rounded-lg text-xs">CANCEL</button></>:<button onClick={()=>setConfirm(i)} className="px-3 py-2 bg-white/10 rounded-lg text-xs">DELETE</button>)}</div></div>})}</div><button onClick={onBack} className="mt-6 px-4 py-2 bg-white/10 rounded-lg text-xs">BACK</button></div>;
}

function StoryCutscene({text,book,canon,hero,onDone}){const [skip,setSkip]=useState(false);useEffect(()=>{const k=e=>{if(e.key==='Enter'||e.key==='Return'||e.key===' ')setSkip(true)};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k)},[]);useEffect(()=>{const t=setTimeout(onDone,skip?100:4200);return()=>clearTimeout(t)},[skip,onDone]);return <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-8"><div className="max-w-3xl text-center"><div className="text-[10px] tracking-[.6em] text-white/30">BOOK {book} {canon?'• CANON-LOCKED':''}</div><h2 className="text-5xl md:text-7xl font-serif tracking-widest mt-5">{canon?'THE MOMENT':'THE STORY CONTINUES'}</h2><p className="mt-8 text-lg md:text-xl leading-relaxed text-white/70">{text}</p><div className="mt-8 text-[10px] tracking-[.3em] text-white/30">PRESS ENTER TO SKIP</div>{hero&&<div className="mt-5 text-xs text-white/35">Current hero: {heroNickname(hero)}</div>}</div></div>}

function drawScene(ctx,book,hero,p,platforms,nodes,camX,H,save,role,equippedSkins,equippedAccessories){const b=BIOMES[book.biome]||BIOMES.sakura;ctx.clearRect(0,0,W,H);ctx.fillStyle=b.sky;ctx.fillRect(0,0,W,H);for(let layer=1;layer<=3;layer++){ctx.fillStyle=layer===1?b.far:layer===2?b.mid:b.ground;const off=-(camX*(0.12*layer))%W;for(let x=off-200;x<W+300;x+=280+layer*35){ctx.beginPath();ctx.moveTo(x,H);ctx.lineTo(x+70,H-150-layer*30);ctx.lineTo(x+150,H-80);ctx.lineTo(x+230,H-190-layer*20);ctx.lineTo(x+320,H);ctx.fill()}}for(let i=0;i<55;i++){const x=((i*173+performance.now()/30*(i%3+1))%W),y=(i*83)%430;ctx.fillStyle=b.particle;ctx.globalAlpha=.08+(i%4)*.03;ctx.fillRect(x,y,2,2)}ctx.globalAlpha=1;platforms.forEach(pl=>{const x=pl.x-camX;if(x+pl.w<0||x>W)return;ctx.fillStyle=b.ground;ctx.fillRect(x,pl.y,pl.w,pl.h);ctx.fillStyle=b.accent;ctx.globalAlpha=.35;ctx.fillRect(x,pl.y,pl.w,3);ctx.globalAlpha=1;for(let tx=x;tx<x+pl.w;tx+=42){ctx.strokeStyle='rgba(255,255,255,.06)';ctx.strokeRect(tx,pl.y,42,pl.h)}});nodes.forEach(n=>{if(n.collected)return;const x=n.x-camX;if(x<-50||x>W+50)return;if(n.type==='shard'){ctx.fillStyle=b.accent;ctx.shadowColor=b.accent;ctx.shadowBlur=16;ctx.beginPath();ctx.moveTo(x,n.y-15);ctx.lineTo(x+10,n.y);ctx.lineTo(x,n.y+15);ctx.lineTo(x-10,n.y);ctx.closePath();ctx.fill();ctx.shadowBlur=0}else if(n.type==='match'){ctx.strokeStyle='rgba(255,255,255,.28)';ctx.setLineDash([5,5]);ctx.strokeRect(x-28,n.y-45,56,55);ctx.setLineDash([]);ctx.fillStyle='white';ctx.font='9px Rajdhani';ctx.textAlign='center';ctx.fillText('MATCH',x,n.y-52)}else if(n.type==='bounty'){ctx.fillStyle='#d2a85a';ctx.fillRect(x-22,n.y-35,44,35);ctx.fillStyle='#111';ctx.font='bold 9px Rajdhani';ctx.textAlign='center';ctx.fillText('BOUNTY',x,n.y-14)}else{ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.arc(x,n.y,7,0,Math.PI*2);ctx.fill()}});const sx=p.x-camX,sy=p.y;const c=getCharRenderColor(hero?.id,equippedSkins)||hero?.color||'#FFD700';drawStickman(ctx,sx,sy,c,p.facing,p.frame,1.05,hero?.isSpirit,Math.abs(p.vx)>.5?'moving':p.vy<0?'jumping':'idle',hero);(getSkinParts(hero?.id,equippedSkins)||[]).forEach(part=>drawAccessory(ctx,sx,sy,part.type,part.color,p.frame,1.05,hero?.id));const acc=getAccessory(equippedAccessories?.[hero?.id]);if(acc)drawAccessory(ctx,sx,sy,acc.type,getCharRenderColor(hero?.id,equippedSkins)||c,p.frame,1.05,hero?.id);ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,H-42,W,42);ctx.fillStyle='white';ctx.font='11px Rajdhani';ctx.textAlign='left';ctx.fillText(`${heroNickname(hero)} • ${role.anchor?'ANCHOR':'ROLE: '+role.role}`,14,H-25);ctx.textAlign='right';ctx.fillText(`${book.era} • ${book.gimmick}`,W-14,H-25)}
