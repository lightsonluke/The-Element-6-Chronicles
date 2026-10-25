// Detailed native Canvas artwork over the shared collision silhouette. The bright inner
// stroke is the damaging shape; outer elemental traces are decorative motion trails.
import { getGen1AttackGeometry } from './gen1AttackGeometry.js';
export function drawGen1MotionArt(ctx, x, y, p, charId, move) {
 const q=Math.max(0,Math.min(1,p));
 const palette={g1_fire:['#FF5A16','#FF9A22','#FFF3B0','#541006'],g1_grass:['#4D9C22','#7CFF28','#E4FF9C','#173C0B'],g1_ice:['#168FCB','#79DFFF','#F1FFFF','#174B70'],g1_thunder:['#C5A500','#FFFF44','#FFFFFF','#554400'],g1_water:['#087EBA','#18BFFF','#DDFBFF','#06466D']};
 const [dark,main,light,shade]=palette[charId]||palette.g1_fire;
 const warmup=Math.max(0,Math.min(1,q/.3)), recovery=Math.max(0,Math.min(1,(q-.62)/.38),0);
 const shapes=getGen1AttackGeometry(charId,move,q);
 ctx.save(); ctx.translate(x,y);
 // Motion echoes are fixed-count and deterministic, avoiding per-frame particle accumulation.
 for(let echo=2;echo>=1;echo--){
   const alpha=(.055+warmup*.035)*(1-q*.55)/echo;
   for(const s of shapes){
     ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=main;ctx.lineWidth=(s.r||6)*1.8;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
     if(s.shape==='capsule'){ctx.moveTo(s.x1-echo*4,s.y1+echo*2);ctx.lineTo(s.x2-echo*4,s.y2+echo*2);}
     else if(s.shape==='box'){ctx.rect(s.x-echo*4,s.y+echo*2,s.w,s.h);}
     else if(s.shape==='circle'){ctx.ellipse(s.x-echo*4,s.y+echo*2,s.r,s.r*.72,0,0,Math.PI*2);}
     ctx.stroke();ctx.restore();
   }
 }
 for(const s of shapes){
   ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
   if(s.shape==='capsule'){
     // Water is rendered as a broad, layered liquid volume rather than a thin beam.
     if(charId==='g1_water'){
       const dx=s.x2-s.x1,dy=s.y2-s.y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
       const grad=ctx.createLinearGradient?.(s.x1,s.y1,s.x2,s.y2);grad?.addColorStop?.(0,'#07528F');grad?.addColorStop?.(.32,'#087EBA');grad?.addColorStop?.(.68,'#20CFFF');grad?.addColorStop?.(1,'#E5FFFF');
       ctx.globalAlpha=.96;ctx.lineCap='round';ctx.strokeStyle='#06466D';ctx.lineWidth=s.r*4.2;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.quadraticCurveTo((s.x1+s.x2)/2+nx*s.r*.65,(s.y1+s.y2)/2+ny*s.r*.65,s.x2,s.y2);ctx.stroke();
       ctx.globalAlpha=.98;ctx.strokeStyle=grad;ctx.lineWidth=s.r*3.25;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.quadraticCurveTo((s.x1+s.x2)/2-nx*s.r*.25,(s.y1+s.y2)/2-ny*s.r*.25,s.x2,s.y2);ctx.stroke();
       ctx.globalAlpha=.9;ctx.strokeStyle='#BDF8FF';ctx.lineWidth=Math.max(2,s.r*.72);ctx.beginPath();ctx.moveTo(s.x1+nx*s.r*.48,s.y1+ny*s.r*.48);ctx.quadraticCurveTo((s.x1+s.x2)/2+nx*s.r*.3,(s.y1+s.y2)/2+ny*s.r*.3,s.x2+nx*s.r*.12,s.y2+ny*s.r*.12);ctx.stroke();
       // Curled foam crests and deterministic droplets give the volume a liquid silhouette.
       for(let i=1;i<=3;i++){const t=i/4,px=s.x1+dx*t,py=s.y1+dy*t;ctx.globalAlpha=.72;ctx.fillStyle=i%2?'#DDFBFF':'#18BFFF';ctx.beginPath();ctx.ellipse(px+nx*s.r*.9,py+ny*s.r*.9,Math.max(1.5,s.r*.26),Math.max(1,s.r*.14),Math.atan2(dy,dx),0,Math.PI*2);ctx.fill();}
       ctx.globalAlpha=.82;ctx.fillStyle='#DDFBFF';for(let i=0;i<2;i++){const t=i?0.82:0.18,px=s.x1+dx*t+nx*s.r*1.7,py=s.y1+dy*t+ny*s.r*1.7;ctx.beginPath();ctx.arc(px,py,Math.max(1.3,s.r*.18),0,Math.PI*2);ctx.fill();}
     } else {
     // This exact centerline + radius is also the capsule collision shape.
     ctx.globalAlpha=.96;ctx.strokeStyle=dark;ctx.lineWidth=s.r*2.35;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
     ctx.globalAlpha=.98;ctx.strokeStyle=main;ctx.lineWidth=s.r*1.35;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
     ctx.globalAlpha=.98;ctx.strokeStyle=light;ctx.lineWidth=Math.max(1.4,s.r*.28);ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
     // Material-specific details are attached to the strike, not floating generic particles.
     const dx=s.x2-s.x1,dy=s.y2-s.y1,len=Math.hypot(dx,dy)||1, nx=-dy/len,ny=dx/len;
     if(charId==='g1_grass'){
       for(let i=1;i<=3;i++){const t=i/4,px=s.x1+dx*t,py=s.y1+dy*t;ctx.globalAlpha=.9;ctx.fillStyle=(i%2?main:light);ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+nx*10,py+ny*10,px+dx/len*8+nx*3,py+dy/len*8+ny*3);ctx.quadraticCurveTo(px-nx*3,py-ny*3,px,py);ctx.fill();}
     }else if(charId==='g1_ice'){
       ctx.globalAlpha=.95;ctx.strokeStyle=light;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(s.x1+nx*s.r*.35,s.y1+ny*s.r*.35);ctx.lineTo(s.x2+nx*s.r*.35,s.y2+ny*s.r*.35);ctx.stroke();
     }else if(charId==='g1_thunder'){
       const mx=(s.x1+s.x2)/2,my=(s.y1+s.y2)/2;ctx.globalAlpha=.95;ctx.strokeStyle=light;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(mx-5,my-4);ctx.lineTo(mx+2,my+3);ctx.lineTo(s.x2,s.y2);ctx.stroke();
     }else if(charId==='g1_water'){
       ctx.globalAlpha=.9;ctx.strokeStyle=light;ctx.lineWidth=Math.max(1.2,s.r*.25);ctx.beginPath();ctx.moveTo(s.x1+nx*s.r*.22,s.y1+ny*s.r*.22);ctx.quadraticCurveTo((s.x1+s.x2)/2+nx*4,(s.y1+s.y2)/2+ny*4,s.x2+nx*s.r*.22,s.y2+ny*s.r*.22);ctx.stroke();
     }else{
       // Flame tongues follow the attack's actual path; no full-screen blur/shadow.
       const count=Math.max(2,Math.min(5,Math.floor(len/22)));ctx.fillStyle=main;ctx.globalAlpha=.8;
       for(let i=1;i<count;i++){const t=i/count,px=s.x1+dx*t,py=s.y1+dy*t;ctx.beginPath();ctx.moveTo(px-s.r*.38,py);ctx.quadraticCurveTo(px-2,py- s.r*1.45,px+s.r*.2,py-s.r*.35);ctx.quadraticCurveTo(px+s.r*.75,py-s.r*.8,px+s.r*.45,py);ctx.closePath();ctx.fill();}
     }
     }
   } else if(s.shape==='box'){
     ctx.globalAlpha=.2;ctx.fillStyle=main;ctx.fillRect(s.x,s.y,s.w,s.h);ctx.globalAlpha=.95;ctx.strokeStyle=dark;ctx.lineWidth=5;ctx.strokeRect(s.x,s.y,s.w,s.h);ctx.strokeStyle=main;ctx.lineWidth=2.5;ctx.strokeRect(s.x,s.y,s.w,s.h);ctx.strokeStyle=light;ctx.lineWidth=1;ctx.strokeRect(s.x+3,s.y+3,s.w-6,s.h-6);
   } else if(s.shape==='circle'){
     if(charId==='g1_water'){
       const bead=ctx.createRadialGradient?.(s.x-s.r*.28,s.y-s.r*.34,1,s.x,s.y,s.r*1.3);bead?.addColorStop?.(0,'#F0FFFF');bead?.addColorStop?.(.22,'#6DEBFF');bead?.addColorStop?.(.62,'#12AEEB');bead?.addColorStop?.(1,'#07528F');ctx.globalAlpha=.95;ctx.fillStyle=bead || main;ctx.beginPath();ctx.ellipse(s.x,s.y,s.r*1.15,s.r*.86,-.18,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.85;ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.ellipse(s.x-s.r*.28,s.y-s.r*.3,Math.max(1,s.r*.25),Math.max(1,s.r*.12),-.35,0,Math.PI*2);ctx.fill();
     } else {ctx.globalAlpha=.15;ctx.fillStyle=main;ctx.beginPath();ctx.ellipse(s.x,s.y,s.r,s.r*.72,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=.92;ctx.strokeStyle=dark;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(s.x,s.y,s.r,s.r*.72,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=main;ctx.lineWidth=2.6;ctx.beginPath();ctx.ellipse(s.x,s.y,s.r,s.r*.72,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=light;ctx.lineWidth=1.1;ctx.beginPath();ctx.ellipse(s.x,s.y,s.r*.68,s.r*.48,0,0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
 }
 // Tiny deliberate contact accents only during the strike beat, not dozens of particles.
 if(q>.26&&q<.72){const a=Math.sin((q-.26)/.46*Math.PI);const cx=shapes.length?(shapes[shapes.length-1].x ?? shapes[shapes.length-1].x2 ?? 20):20;const cy=shapes.length?(shapes[shapes.length-1].y ?? shapes[shapes.length-1].y2 ?? -40):-40;ctx.globalAlpha=.55*a;ctx.strokeStyle=light;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-7,cy-7);ctx.lineTo(cx+7,cy+7);ctx.moveTo(cx+7,cy-7);ctx.lineTo(cx-7,cy+7);ctx.stroke();}
 ctx.restore();
 return true;
}
