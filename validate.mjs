import { ROSTER, ROSTER_ORDER } from '../src/mvRoster.js';
import { buildMove, SLOTS } from '../src/mvBuild.js';
import { evalMove, activeBounds } from '../src/mvMove.js';
const ENV={us:[70,95],uh:[90,125],ds:[120,35],dh:[280,45],ss:[95,55],sh:[135,65],rc:[85,185],gp:[75,125]};
let bad=0, rows=[];
for(const id of ROSTER_ORDER) for(const sl of SLOTS){
  const m=buildMove(id,sl); if(!m){console.log('MISSING',id,sl);bad++;continue;}
  const [s,a,e]=m.fr; let activeWithShapes=0, nan=false;
  const st = m.gp ? {dive:true,landed:false,pc:1.3}: null;
  for(let f=0; f<m.total; f++){
    let r; 
    if(m.gp){ const stt = f<s?{dive:false,landed:false,pc:f/s}: {dive:false,landed:true,pc:2+(f-s)/(a+e)}; r=evalMove(m,Math.min(f,s+a-1),1,f<s?stt:stt); }
    else r=evalMove(m,f,1,null);
    const js=JSON.stringify(r.pose.v); if(/null|NaN/.test(js)) nan=true;
    for(const sh of r.shapes){ const t=JSON.stringify(sh); if(/null|NaN/.test(t)) nan=true; }
    if(f>=s&&f<s+a&&r.shapes.length) activeWithShapes++;
  }
  if(nan){console.log('NAN',id,sl);bad++;}
  if(sl!=='gp' && activeWithShapes<a){ console.log('GAP',id,sl,`active ${a} frames, shapes on ${activeWithShapes}`); bad++; }
  if(!m.gp){ const b=activeBounds(m); rows.push({id,sl,w:Math.round(b.w),h:Math.round(b.h),y0:Math.round(b.y0),y1:Math.round(b.y1),x0:Math.round(b.x0),x1:Math.round(b.x1)}); }
}
console.log('problems:',bad,'moves checked:',ROSTER_ORDER.length*9);
// envelope fit per slot (median bbox)
for(const sl of ['us','uh','ds','dh','ss','sh','rc']){ const r=rows.filter(x=>x.sl===sl); const med=k=>r.map(x=>x[k]).sort((a,b)=>a-b)[r.length>>1]; console.log(sl.padEnd(3),'median bbox',med('w'),'x',med('h'),' x:',med('x0'),'..',med('x1'),' y:',med('y0'),'..',med('y1'),' spec',ENV[sl].join('x')); }
const sp=rows.filter(x=>x.sl==='sp'); 
for(const reach of ['A','L']){ const r=sp.filter(x=>ROSTER[x.id].reach===reach); const med=k=>r.map(x=>x[k]).sort((a,b)=>a-b)[r.length>>1]; console.log('sp',reach,'median',med('w'),'x',med('h'),'  x',med('x0'),'..',med('x1')); }
