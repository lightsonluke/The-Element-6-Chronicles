import { fight } from './live2.mjs';
const ids=Object.keys((await import('./mvMoves.js')).V2MOVES).filter(i=>!/^g1_/.test(i));
let probs=0;
for(const id of ids) for(const sl of ['us','ds','ss','uh','dh','sh','sp','rc','gp']){
  let best=null; for(const dx of [14,26,38,52,66,80,96,120,150]){ let r; try{ r=fight(id,sl,{dx}); }catch(e){ console.log('ERR',id,sl,String(e).slice(0,100)); probs++; best=null; break;} if(!best||r.hits.length>best.r.hits.length) best={dx,r}; }
  if(!best) continue; const r=best.r; const m=r.hits.map(h=>`s${h.stage}:${h.dmg}dmg hs${h.hs} v(${h.vx},${h.vy})`);
  const flag = (sl!=='rc' && !r.hits.length) ? ' <<< NO HIT' : (sl!=='rc'&&sl!=='gp'&& r.hits.some(h=>h.vx<0 && !['g2_itto','g2_nishikawa','g2_mai'].includes(id)) ? ' <<< BACKWARD' : '');
  if(flag) probs++;
  console.log(id.padEnd(13),sl,'dx',String(best.dx).padEnd(3),'f',r.startF,r.first,r.last,'travel',r.travel,'hits',JSON.stringify(m)+flag);
}
console.log('probs',probs);
