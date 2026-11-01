// Calibrates knockback growth per move class by simulating launches with the game's real physics constants.
const G=0.42, AIRF=0.94, FRIC=0.45, MAXFALL=15, BZ={l:-500,r:1280+500,t:-600,b:720+450};
function hitstunFor(v0){ return Math.max(10, Math.min(50, Math.round(8 + v0*1.1))); }
function sim(x,y,v0,angDeg,face,meteor){ // face=-1: launched toward -x
  const a=angDeg*Math.PI/180; let vx=face*Math.cos(a)*v0, vy=-Math.sin(a)*v0, hs=hitstunFor(v0), kill=false, minY=y, maxX=x;
  for(let f=0;f<420;f++){
    if(hs>0){ hs--; const s=Math.abs(vx); vx = s<=FRIC?0:vx-Math.sign(vx)*FRIC; } else { vx*=AIRF; }
    vy+=G; if(vy>MAXFALL) vy=MAXFALL;
    x+=vx; y+=vy;
    if(x>=190&&x<=1090&&y>=520&&vy>=0&&y-vy<=522){ y=520; vy=0; if(f>3) return false; }
    if(x<BZ.l||x>BZ.r||y<BZ.t) return true;
    if(y>BZ.b) return !!meteor;
    if(!meteor && y>1000) return false;
  }
  return false;
}
// kill percent for a class
function killPct(c, origin){ const met=c.ang<-45;
  for(let D=0; D<=1500; D++){
    const v0=c.bkb+c.kbg*D;
    if(sim(origin.x,origin.y,v0,c.ang,origin.face,met)) return D;
  }
  return 9999;
}
const ORIG={ ledge:{x:200,y:520,face:-1}, center:{x:640,y:520,face:-1}, up:{x:640,y:520,face:-1} };
const CLASSES={
  us:{bkb:6, ang:80, org:'up', target:200},
  ds:{bkb:5, ang:42, org:'ledge', target:260},
  ss:{bkb:6, ang:26, org:'ledge', target:230},
  uh:{bkb:9, ang:84, org:'up', target:130},
  dh:{bkb:9, ang:32, org:'ledge', target:115},
  sh:{bkb:10, ang:30, org:'ledge', target:88},
  rc:{bkb:5, ang:72, org:'up', target:330},
  gpdive:{bkb:9, ang:-70, org:'ledgeLow', target:110},
  gpland:{bkb:7, ang:24, org:'ledge', target:230},
  sp:{bkb:11, ang:40, org:'ledge', target:150},
};
const out={};
for(const [k,c] of Object.entries(CLASSES)){
  const org = k==='gpdive' ? {x:200,y:600,face:-1} : ORIG[c.org];
  let lo=0.005, hi=1.2;
  for(let i=0;i<40;i++){ const mid=(lo+hi)/2; const kp=killPct({...c,kbg:mid},org); if(kp>c.target) lo=mid; else hi=mid; }
  const kbg=+hi.toFixed(4); const kp=killPct({...c,kbg},org);
  out[k]={bkb:c.bkb,kbg,ang:c.ang,kill:kp,target:c.target, v0at0:c.bkb, v0at100:+(c.bkb+kbg*100).toFixed(1)};
  console.log(k.padEnd(7),JSON.stringify(out[k]));
}
require('fs').writeFileSync('calib.json',JSON.stringify(out));
