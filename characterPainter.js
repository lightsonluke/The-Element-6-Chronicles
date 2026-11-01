// Roster sprite illustrator.
// Each fighter is drawn as a compact, cel-shaded side-view character and
// rendered into an 8-pose SVG atlas.  The body color always comes from the
// game roster; the authored visual sheet supplies hair, tailoring, footwear,
// signature hardware, and motion character.  Hands are smooth body-colored
// stumps: no fingers or thumbs are drawn.
import { getCharacterVisualStyle } from './characterVisuals.js';

const CELL = 192;
const INK = '#17131e';
const OUTLINE = '#0b0910';
const cache = new Map();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&apos;' })[c]);
const has = (s, re) => re.test(String(s || ''));

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < String(s).length; i++) h = Math.imul(h ^ String(s).charCodeAt(i), 16777619);
  return h >>> 0;
}

function mix(hex, amount) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return '#777777';
  const n = parseInt(m[1], 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => clamp(v + amount, 0, 255).toString(16).padStart(2, '0')).join('');
}

function path(d, fill, stroke = INK, sw = 2, extra = '') {
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

function line(d, color, sw = 2, extra = '') {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

function circle(x, y, r, fill, stroke = INK, sw = 1.6, extra = '') {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
}

function limb(x1, y1, x2, y2, width, fill, highlight = true) {
  const dx = x2 - x1, dy = y2 - y1;
  const nx = -dy / (Math.hypot(dx, dy) || 1), ny = dx / (Math.hypot(dx, dy) || 1);
  let s = line(`M${x1} ${y1} Q${(x1+x2)/2 + nx*2} ${(y1+y2)/2 + ny*2} ${x2} ${y2}`, OUTLINE, width + 4);
  s += line(`M${x1} ${y1} Q${(x1+x2)/2 + nx*2} ${(y1+y2)/2 + ny*2} ${x2} ${y2}`, fill, width);
  if (highlight) s += line(`M${x1 + nx*width*.18} ${y1 + ny*width*.18} Q${(x1+x2)/2 + nx*width*.22} ${(y1+y2)/2 + ny*width*.22} ${x2 + nx*width*.14} ${y2 + ny*width*.14}`, 'rgba(255,255,255,.30)', Math.max(1, width*.12));
  return s;
}

function shoeMarkup(kind, x, y, cloth, trim, seed) {
  const high = has(kind, /high|boot|ankle|combat|winter|riding|metal|work|ceremonial|guard/i);
  const sandal = has(kind, /sandal|bare|splitSole/i);
  const toe = has(kind, /square|angular|metal|plate/i) ? 3 : 8;
  const h = high ? 16 : (sandal ? 8 : 11);
  const body = `M${x-7} ${y-h+4} Q${x-4} ${y-h} ${x+1} ${y-h+2} L${x+5} ${y-5} Q${x+14} ${y-4} ${x+18} ${y+1} Q${x+18} ${y+5} ${x+12} ${y+6} L${x-7} ${y+5} Q${x-11} ${y+3} ${x-7} ${y-h+4}Z`;
  let s = path(body, sandal ? mix(cloth, 4) : cloth, OUTLINE, 2.8);
  s += path(`M${x-9} ${y+3} Q${x+1} ${y+6} ${x+17} ${y+2} L${x+18} ${y+6} Q${x+2} ${y+10} ${x-9} ${y+7}Z`, mix(cloth, -26), INK, 1.4);
  if (high) {
    s += path(`M${x-7} ${y-h+3} L${x+3} ${y-h+2} L${x+5} ${y-5} L${x-8} ${y-5}Z`, mix(cloth, 16), INK, 1.1);
    s += line(`M${x-5} ${y-h+6} L${x+2} ${y-h+6} M${x-5} ${y-h+10} L${x+3} ${y-h+10}`, trim, 1.8);
  }
  if (sandal) s += line(`M${x-3} ${y-h+4} L${x+5} ${y-5} M${x+3} ${y-h+4} L${x-1} ${y-5}`, trim, 2.1);
  s += path(`M${x+7} ${y-5} Q${x+13} ${y-4} ${x+16} ${y} Q${x+12} ${y+2} ${x+8} ${y+1}Z`, seed%2 ? trim : mix(cloth, 24), INK, 1);
  return s;
}

function hairBack(kind, hair, trim, phase) {
  const braid = has(kind, /braid/i), long = has(kind, /long|tail|pony|lock|tendril|nape|willow|sweep|fox/i);
  const twin = has(kind, /twin|pair|fox|loop/i);
  let s = '';
  if (long) {
    const sway = Math.sin(phase) * 3;
    const count = twin ? 2 : 1;
    for (let i=0; i<count; i++) {
      const sx = 74 - i*5, sy = 49 + i*6, ex = 52 - i*9 + sway*(i ? .6 : 1), ey = 88 + i*14;
      s += path(`M${sx} ${sy} Q${sx-13} ${sy+20} ${ex+7} ${ey-8} Q${ex-3} ${ey+3} ${ex-10} ${ey+1} Q${ex-3} ${ey-12} ${sx-4} ${sy+5}Z`, hair, INK, 2.4);
      s += line(`M${sx-4} ${sy+7} Q${sx-15} ${sy+22} ${ex-3} ${ey-5}`, mix(hair, 34), 1.5);
      if (braid) for (let q=0; q<4; q++) s += path(`M${sx-5-q*2} ${sy+10+q*7} q8 2 3 7 q-8-2-3-7Z`, q%2 ? mix(hair,-10) : mix(hair,18), INK, .8);
    }
  }
  if (has(kind, /bun|knot|crown|puff|twin|loop|fox|monk/i)) {
    const n = twin ? 2 : 1;
    for (let i=0;i<n;i++) {
      const x = 76 - i*20, y = 28 + (i%2)*2;
      s += circle(x, y, twin ? 10 : 12, hair, INK, 2.1);
      s += path(`M${x-7} ${y+1} Q${x} ${y-10} ${x+7} ${y-2}`, 'none', mix(hair,36), 1.6);
      s += circle(x-3,y-4,1.7,'rgba(255,255,255,.65)','none',0);
    }
  }
  return s;
}

function hairFront(kind, hair, trim, seed) {
  let s = '';
  const spiky = has(kind, /spike|quiff|crest|storm|thorn|feather|flame|bristle|broad|zigzag|cowlick|brush|tuft|shag|hard|blade/i);
  const round = has(kind, /bob|curl|puff|round|loop|braid|bun|crown|fox|pearl|willow/i);
  const n = 4 + (seed % 3);
  let d = 'M62 56 Q54 42 63 29 ';
  if (spiky) {
    for (let i=0;i<n;i++) {
      const x=64+i*9, peak=11 + ((seed >>> (i*3))%8), next=x+9;
      d += `L${x-3} ${25+i%2*3} Q${x} ${peak} ${x+5} ${peak+3} Q${x+5} ${20+i%3*3} ${next} ${27+i%2*2} `;
    }
  } else if (round) {
    d += 'Q68 18 79 23 Q91 13 101 23 Q116 18 124 31 Q136 33 132 50 ';
  } else {
    d += `Q76 13 95 20 Q116 ${14+(seed%5)} 130 32 Q137 39 130 52 `;
  }
  d += 'Q123 43 116 47 Q109 57 99 53 Q86 64 77 55 Q68 60 62 56Z';
  s += path(d, hair, OUTLINE, 3.2);
  s += path('M66 40 Q78 24 95 27 Q111 25 124 37 Q114 33 106 38 Q96 45 88 43 Q76 45 67 51Z', mix(hair,-12), INK, 1.2);
  s += line('M70 35 Q84 21 99 24 M88 34 Q101 26 115 30', mix(trim,18), 1.6);
  if (has(kind, /part|slick|razor|side/i)) s += line('M102 20 Q107 28 108 36', mix(hair,42), 1.7);
  if (has(kind, /fringe|curtain|wolf|shag|asym|side|bob|sweep|nape/i)) s += path('M79 31 Q92 34 97 44 Q85 40 76 53 Q74 42 79 31Z', mix(hair,-18), INK, 1);
  if (has(kind, /feather/i)) s += path('M82 24 Q95 8 105 12 Q99 22 90 27Z', mix(hair,12), INK, 1.1);
  if (has(kind, /flame|storm|zigzag/i)) s += path('M111 27 Q126 12 128 19 Q125 27 118 32Z', trim, 'none', 0);
  return s;
}

function poseFor(index, style) {
  const motion = style.motion || [0,0,0,0,0];
  const drift = motion[0] * 15, swing = motion[1] * 13, flare = style.flare || .2;
  const poses = [
    { lean: 0, head: 0, legs:[[82,119,75,143,69,164],[107,119,115,143,123,164]], arms:[[78,82,66,99,68,113],[108,82,121,96,129,108]] },
    { lean: -6-drift*4, head:-2, legs:[[82,119,68,143,57,154],[107,119,119,138,132,161]], arms:[[78,82,68,69,63,58],[108,82,123,96,133,90]] },
    { lean: -5-drift*4, head:2, legs:[[82,119,70,137,63,161],[107,119,120,144,130,152]], arms:[[78,82,66,97,63,91],[108,82,120,69,128,61]] },
    { lean: -16-drift*5, head:-5, legs:[[82,119,71,144,61,163],[107,119,121,138,136,155]], arms:[[78,82,66,91,56,99],[108,82,120,95,132,103]] },
    { lean: 2, head:0, legs:[[82,119,72,141,74,161],[107,119,116,140,112,160]], arms:[[78,82,68,64,64,47],[108,82,121,92,132,98]] },
    { lean: -7, head:-3, legs:[[82,119,72,129,64,144],[107,119,117,132,127,145]], arms:[[78,82,68,63,63,48],[108,82,120,63,128,48]] },
    { lean: 10, head:4, legs:[[82,119,71,143,65,163],[107,119,114,143,122,163]], arms:[[78,82,65,98,61,110],[108,82,122,99,129,111]] },
    { lean: -12, head:-4, legs:[[82,119,73,142,63,163],[107,119,120,136,131,157]], arms:[[78,82,66,91,57,96],[108,82,127,88,139,88]] },
  ];
  const base = poses[index] || poses[0];
  const p = { ...base, legs: base.legs.map((leg) => leg.slice()), arms: base.arms.map((arm) => arm.slice()) };
  p.lean += index === 1 ? swing*1.6 : 0;
  p.legs[1][4] += flare*5 + drift*2;
  p.arms[1][4] += swing*1.5;
  return p;
}

function outfitMarkup(style, body, id, seed, pose) {
  const cut = String(style.cut || ''), cloth = style.cloth || '#26303b', trim = style.trim || '#c9b768';
  const long = has(cut, /coat|cape|mantle|poncho|robe|drape|overcoat|long|ceremonial|storm/i) || style.hem > .7;
  const wide = has(cut, /poncho|cape|mantle|scallop|oversized|wide|sailor|kimono/i);
  const armored = has(cut, /armor|plate|brute|reactor|metal|tech|storm|reinforced|geometric|work/i);
  const wrap = has(cut, /wrap|kimono|martial|hakama|robe|sash|monk/i);
  const sleeveless = has(cut, /sleeveless|vest|grappler|singleSleeve|ceremonialSleeveless/i);
  const flare = (style.flare || .2) * 9;
  let s = '';
  // trailing waist panels are character-specific and react to the pose
  if (long || wide || style.cape > .42) {
    const tail = 13 + (style.cape || 0)*18 + (pose.lean < -8 ? 5 : 0);
    const x = 74 - flare;
    s += path(`M82 79 Q${x} 75 ${x-4} 86 L${x-tail} ${121+tail*.35} Q${x-8} 129 ${x+8} 130 L93 116Z`, mix(cloth,-12), INK, 2.8);
    s += path(`M105 82 Q120 78 126 91 L${129+flare} ${118+tail*.4} Q118 133 108 126 L100 112Z`, mix(trim,-22), INK, 2.3);
    s += line(`M${x-2} 90 Q${x-tail*.55} 112 ${x-tail} ${121+tail*.35}`, 'rgba(255,255,255,.32)', 1.7);
  }
  // compact layered torso with a fitted waist, not a human mannequin
  s += path('M80 75 Q95 69 111 75 L119 111 Q113 122 96 124 Q79 121 75 111Z', mix(cloth,-8), OUTLINE, 3.4);
  s += path('M83 77 Q96 72 108 77 L111 105 Q98 112 82 106Z', cloth, INK, 1.8);
  if (wide) s += path('M78 77 Q62 76 59 90 L70 107 Q83 102 89 91Z', mix(cloth,14), INK, 2.4);
  if (armored) {
    s += path('M77 78 L88 73 L93 84 L83 91 L73 87Z', mix(cloth,22), INK, 2);
    s += path('M103 74 L113 78 L119 88 L109 92 L101 84Z', mix(cloth,14), INK, 1.9);
    s += line('M78 85 L86 80 M108 81 L115 85', trim, 1.7);
  }
  if (wrap) {
    s += path('M82 79 L107 80 L99 91 L85 108 L77 104 L91 88Z', mix(cloth,20), INK, 1.4);
    s += line('M85 82 L104 92 M81 90 L99 101', 'rgba(255,255,255,.48)', 1.6);
  }
  // unique collar and layered front panel
  s += path('M82 74 L92 78 L97 88 L86 85 L79 79Z', mix(trim,-8), INK, 1.5);
  s += path('M109 74 L100 78 L97 88 L108 84 L114 78Z', mix(trim,-18), INK, 1.5);
  s += path('M96 88 L104 87 L101 108 L96 112 L91 108Z', mix(cloth,18), INK, 1.25);
  s += line('M97 94 L97 111 M84 105 Q96 110 109 103', 'rgba(255,255,255,.32)', 1.4);
  // belt, waist closure, and identity mark
  s += path('M77 108 Q96 113 114 107 L116 114 Q96 121 76 115Z', mix(cloth,-22), INK, 1.7);
  s += path('M92 109 L101 109 L102 117 L92 117Z', trim, INK, 1.2);
  s += circle(97,113,2.2, mix(trim,24), INK, .8);
  // silhouette-specific hem / skirt / utility panels
  if (has(style.lower, /skirt|pleat|splitShort|dress|opposed|hak|flameHem/i)) {
    s += path(`M77 114 Q96 119 116 113 L${117+flare} 132 L100 128 L93 138 L76 128Z`, mix(cloth,8), INK, 2.1);
    s += line('M84 119 L80 127 M94 121 L91 133 M105 120 L108 128', trim, 1.4);
  } else if (long) {
    s += path(`M78 113 L95 119 L88 143 L75 135Z`, mix(cloth,-16), INK, 1.7);
    s += path(`M99 119 L115 112 L119 135 L104 143Z`, mix(cloth,-24), INK, 1.7);
    s += line('M80 121 L77 132 M112 119 L115 131', mix(trim,8), 1.2);
  }
  // a graphic motif changes by character instead of a shared blank chest
  const mark = (seed % 5);
  if (mark === 0) s += path('M96 92 L101 98 L96 104 L91 98Z', trim, INK, 1);
  else if (mark === 1) s += path('M88 94 Q96 88 104 94 L101 101 L91 101Z', mix(trim,10), INK, 1);
  else if (mark === 2) s += line('M88 97 L104 97 M90 101 L102 101', trim, 1.6);
  else if (mark === 3) s += circle(96,97,3.2, trim, INK, .9);
  else s += path('M90 94 L96 90 L102 94 L96 101Z', mix(trim,-14), INK, 1);
  if (has(id, /crossover/i)) {
    s += line('M84 83 L91 87 M103 83 L111 88 M83 101 L88 103', trim, 1.2, 'stroke-dasharray="2 2"');
  }
  if (style.cape > .3) s += path(`M81 79 Q65 79 61 94 L${66-style.cape*5} 101 Q77 98 84 87Z`, mix(trim,-18), INK, 1.8);
  return s;
}

function propMarkup(style, seed, body, id) {
  const prop = String(style.prop || '');
  const trim = style.trim || '#d4bb70', cloth = style.cloth || '#26303b';
  let s = '';
  if (has(prop, /pouch|satchel|case|spool|camera|radio|tool|document|strap/i)) {
    s += line('M84 78 Q104 92 111 114', mix(trim, -6), 2.4);
    s += path('M108 104 Q117 103 120 110 L117 121 L106 119Z', mix(cloth,18), INK, 1.8);
    s += path('M108 107 L117 108 L116 112 L108 111Z', trim, INK, .9);
  }
  if (has(prop, /seal|pin|crest|clip|stud|crown|thorn|feather|star|fox|ear|crescent|flame|brooch/i)) {
    const x = has(prop,/ear/i) ? 72 : 116, y = has(prop,/crown|crest/i) ? 20 : 32;
    if (has(prop,/star/i)) s += path(`M${x} ${y-5} L${x+1.5} ${y-1.5} L${x+5} ${y} L${x+1.5} ${y+1.5} L${x} ${y+5} L${x-1.5} ${y+1.5} L${x-5} ${y} L${x-1.5} ${y-1.5}Z`, trim, INK, 1);
    else s += path(`M${x} ${y-5} L${x+4} ${y} L${x} ${y+5} L${x-4} ${y}Z`, trim, INK, 1);
    s += circle(x-1,y-1,1.1,'rgba(255,255,255,.8)','none',0);
  }
  if (has(prop, /pendant|charm|token|medallion|brooch|core|hourglass|drop|glass|prayer|bead|bell|wood|sound|cord|clasp/i)) {
    s += line('M96 83 L96 93', trim, 1.4);
    s += path('M96 92 Q103 97 96 104 Q89 98 96 92Z', trim, INK, 1.2);
    s += circle(94,95,1,'rgba(255,255,255,.9)','none',0);
  }
  if (has(prop, /vial|conductor|control|clock|watch|device|compass|thread|reactor|iron|gravity|ring|mirror|halo|broken|guard|bracer|wrist/i)) {
    s += path('M71 105 L80 105 L82 114 L72 114Z', mix(cloth,22), INK, 1.2);
    s += line('M73 108 L79 108 M74 111 L78 111', trim, 1.1);
  }
  if (has(prop,/mask/i)) s += path('M104 48 Q119 46 127 51 L123 61 Q114 63 105 58Z', mix(cloth,14), INK, 1.5);
  if (has(id,/crossover/i)) {
    const symbol = has(id,/entity|lifeform/i) ? 'M113 50 Q122 45 127 51 Q122 58 113 55Z' : 'M111 52 L126 52 M113 57 L123 57';
    s += path(symbol, 'none', trim, 1.7);
  }
  return s;
}

function fighterFrame(charData, body, style, frame) {
  const id = String(charData?.id || 'unknown');
  const seed = hash(id + ':' + String(style.hair || ''));
  const pose = poseFor(frame, style);
  const hair = style.hairColor || mix(body, -55), cloth = style.cloth || '#26303b', trim = style.trim || '#c9b768';
  const face = body || '#8877bb';
  const phase = frame * .7 + seed%9;
  const rot = pose.lean + (style.asym || 0) * (frame === 3 ? 12 : 4);
  let s = `<g transform="rotate(${rot} 96 102)">`;
  // rear panels and far-side limbs establish a clear side-facing silhouette
  s += hairBack(style.hair, hair, trim, phase);
  const farL = pose.legs[0], nearL = pose.legs[1];
  s += limb(farL[0],farL[1],farL[2],farL[3],9,mix(cloth,-18),false);
  s += limb(farL[2],farL[3],farL[4],farL[5],8,mix(cloth,-10),false);
  s += shoeMarkup(style.shoe,farL[4],farL[5],mix(cloth,-3),trim,seed);
  const farA = pose.arms[0], nearA = pose.arms[1];
  s += limb(farA[0],farA[1],farA[2],farA[3],7.3,face,false);
  if (!has(style.cut,/sleeveless|vest|singleSleeve|grappler|ceremonialSleeveless/i)) s += limb(farA[0],farA[1],farA[2],farA[3],8.2,mix(cloth,4),false);
  s += circle(farA[2],farA[3],4.8,mix(cloth,-8),INK,1.5);
  s += limb(farA[2],farA[3],farA[4],farA[5],5.6,face,false);
  s += `<ellipse cx="${farA[4]+3}" cy="${farA[5]}" rx="6.1" ry="5.3" fill="${face}" stroke="${INK}" stroke-width="1.8"/>`;
  // cloak / skirt backs, fitted torso, garment panels and individual insignia
  s += outfitMarkup(style,face,id,seed,pose);
  // neck and head remain the established Element 6 body color
  s += path('M89 67 Q96 63 103 67 L105 79 Q97 84 88 78Z', face, INK, 2.1);
  // near-side arms: visible articulated elbows and round, fingerless stump hands
  s += limb(nearA[0],nearA[1],nearA[2],nearA[3],7.8,face,false);
  if (!has(style.cut,/sleeveless|vest|grappler|ceremonialSleeveless/i)) {
    s += path(`M${nearA[0]-6} ${nearA[1]-3} Q${nearA[0]} ${nearA[1]-8} ${nearA[0]+7} ${nearA[1]-2} L${nearA[2]+5} ${nearA[3]+3} Q${nearA[2]} ${nearA[3]+8} ${nearA[2]-5} ${nearA[3]+3}Z`, mix(cloth,12), INK, 1.6);
    s += line(`M${nearA[0]-3} ${nearA[1]+3} L${nearA[0]+4} ${nearA[1]+5}`, trim, 1.4);
  }
  s += circle(nearA[2],nearA[3],5.2,mix(cloth,-14),INK,1.5);
  s += limb(nearA[2],nearA[3],nearA[4],nearA[5],5.5,face,false);
  // rounded mitt/stump endpoints, intentionally no digits or finger grooves
  s += `<ellipse cx="${nearA[4]+3}" cy="${nearA[5]}" rx="6.5" ry="5.6" fill="${face}" stroke="${INK}" stroke-width="2"/>`;
  s += line(`M${nearA[4]+1} ${nearA[5]-2} Q${nearA[4]+4} ${nearA[5]-4} ${nearA[4]+7} ${nearA[5]-2}`, 'rgba(255,255,255,.36)', 1.1);
  // front leg and shaped footwear
  s += limb(nearL[0],nearL[1],nearL[2],nearL[3],10.2,mix(cloth,-4));
  s += circle(nearL[2],nearL[3],6.5,mix(cloth,8),INK,2);
  s += limb(nearL[2],nearL[3],nearL[4],nearL[5],8.5,mix(cloth,2));
  s += shoeMarkup(style.shoe,nearL[4],nearL[5],cloth,trim,seed+1);
  // chest and waist details sit above the body, attached at actual rig locations
  s += propMarkup(style,seed,face,id);
  // body-color head with one expressive graphic eye; no realistic skin tones
  s += `<ellipse cx="99" cy="49" rx="27" ry="28" fill="url(#body-${safe(id)})" stroke="${OUTLINE}" stroke-width="3.3"/>`;
  s += `<path d="M80 41 Q87 24 104 25 Q119 26 124 39" fill="none" stroke="rgba(255,255,255,.34)" stroke-width="2.2" stroke-linecap="round"/>`;
  s += circle(77,51,5.2,mix(face,-22),INK,1.2);
  s += `<ellipse cx="111" cy="49" rx="3.2" ry="5.4" fill="#19151e"/><circle cx="112" cy="47" r="1.1" fill="#fff"/>`;
  s += line('M116 60 Q120 61 123 59', mix(face,-75), 1.2);
  // distinct hair silhouette and layered fringe
  s += hairFront(style.hair,hair,trim,seed);
  // costume fastener/emblem and a restrained color echo in the hair
  s += `<path d="M98 90 L103 96 L98 102 L93 96Z" fill="${trim}" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<g opacity=".8"><path d="M89 30 Q96 25 102 27" fill="none" stroke="${trim}" stroke-width="1.1"/></g>`;
  s += '</g>';
  return s;
}

function safe(v) { return String(v || 'char').replace(/[^a-z0-9_-]/gi,'_'); }

function spriteSvg(charData, body) {
  const style = getCharacterVisualStyle(charData || {});
  const id = safe(charData?.id || 'fighter');
  let frames = '';
  for (let i=0;i<8;i++) {
    const x=(i%4)*CELL, y=Math.floor(i/4)*CELL;
    frames += `<g transform="translate(${x} ${y})">${fighterFrame(charData,body,style,i)}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="384" viewBox="0 0 768 384" role="img" aria-label="${esc(charData?.name || id)} illustrated fighter sprite sheet">
  <defs>
    <linearGradient id="body-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(body,32)}"/><stop offset=".56" stop-color="${body}"/><stop offset="1" stop-color="${mix(body,-34)}"/></linearGradient>
  </defs>${frames}</svg>`;
}

function dataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function imageFor(charData, body) {
  if (typeof Image === 'undefined') return null;
  const id = charData?.id || 'fighter';
  const key = `${id}|${body}|${charData?.secondaryColor || ''}|${charData?.name || ''}`;
  if (cache.has(key)) return cache.get(key);
  const image = new Image();
  image.decoding = 'async';
  image.src = dataUrl(spriteSvg(charData,body));
  cache.set(key,image);
  return image;
}

function frameFor(state, frame) {
  const s=String(state || 'idle').toLowerCase();
  if (/wall.?slide|wallslide|slide/.test(s)) return 4;
  if (/dash|burst/.test(s)) return 3;
  if (/jump|air|fall|launched/.test(s)) return 5;
  if (/land|recover|crouch/.test(s)) return 6;
  if (/attack|heavy|super|kick|throw|hit/.test(s)) return 7;
  if (/run|moving|walk/.test(s)) return 1 + (Math.floor((Number(frame)||0)/7)%2);
  return 0;
}

export function paintFighterCharacter(ctx, J, color, charData = null, frame = 0, state = 'idle') {
  const image=imageFor(charData,color);
  if (!image || !image.complete || !image.naturalWidth) {
    // Fast vector fallback for the first image-load frame; keeps the fighter
    // visible while the full individual SVG atlas decodes.
    const head=J?.head || [0,-J.s*1.28], r=Math.max(7,(J?.headR || J.s*.25)*.86);
    ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.strokeStyle=INK; ctx.lineWidth=Math.max(5,J.s*.20);
    for (const L of [J?.far,J?.near].filter(Boolean)) {
      ctx.beginPath(); ctx.moveTo(...L.hip); ctx.lineTo(...L.knee); ctx.lineTo(...L.foot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...L.shoulder); ctx.lineTo(...L.elbow); ctx.lineTo(...L.hand); ctx.stroke();
    }
    ctx.fillStyle=color; ctx.beginPath(); ctx.arc(head[0],head[1],r,0,Math.PI*2); ctx.fill();
    ctx.restore(); return;
  }
  const idx=frameFor(state,frame), sx=(idx%4)*CELL, sy=Math.floor(idx/4)*CELL;
  const scale=Math.max(.1,(J?.s || 36)/36);
  const w=82*scale, h=78*scale, baseline=71*scale;
  ctx.save();
  if ((J?.facing || 1)<0) ctx.scale(-1,1);
  ctx.drawImage(image,sx,sy,CELL,CELL,-w*.50,-baseline,w,h);
  ctx.restore();
}

export function getCharacterSpriteSheet(charData, bodyColor) {
  return spriteSvg(charData,bodyColor);
}
