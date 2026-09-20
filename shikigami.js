// Shikigami — purely cosmetic floating companions. NO gameplay effect.
// Each Shikigami has a draw(ctx, x, y, frame, scale) function that paints a
// small (~1.5× head-size) spirit at the follower's smoothed position.
// drawShikigamiFollower handles the smooth follow + idle bob and caches its
// per-fighter trail state on fighter._shikigamiState.
//
// Renderers use gradient shading, layered body parts, secondary motion
// (tail wag, wing flap, ear twitch), and ambient particles for depth.

const GLOW = (ctx, x, y, r, color, a = 0.5) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};
// Radial-shaded ellipse: a soft 3D-ish body fill with a highlight offset toward the light.
const SHADE = (ctx, x, y, rx, ry, rot, base, hi) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const g = ctx.createRadialGradient(-rx * 0.3, -ry * 0.4, rx * 0.1, 0, 0, Math.max(rx, ry));
  g.addColorStop(0, hi || base);
  g.addColorStop(0.55, base);
  g.addColorStop(1, base);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};
const ELL = (ctx, x, y, rx, ry, rot, color) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
const CIR = (ctx, x, y, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
const RING = (ctx, x, y, r, color, w = 2) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); };
// Eye with pupil + glint for a more "alive" look.
const EYE = (ctx, x, y, r, iris, pupil = '#000000') => {
  CIR(ctx, x, y, r, '#FFFFFF');
  CIR(ctx, x, y, r * 0.62, iris);
  CIR(ctx, x + r * 0.12, y - r * 0.18, r * 0.28, pupil);
  ctx.save(); ctx.globalAlpha = 0.85; CIR(ctx, x - r * 0.22, y - r * 0.3, r * 0.2, '#FFFFFF'); ctx.restore();
};
// Triangle ear with inner shading.
const EAR = (ctx, x, y, s, color, inner) => {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x - 4 * s, y); ctx.lineTo(x, y - 7 * s); ctx.lineTo(x + 4 * s, y + 1 * s); ctx.fill();
  if (inner) { ctx.fillStyle = inner; ctx.beginPath(); ctx.moveTo(x - 1.6 * s, y - 0.5 * s); ctx.lineTo(x, y - 5 * s); ctx.lineTo(x + 1.6 * s, y + 0.5 * s); ctx.fill(); }
};
// A small drifting particle that orbits with frame-based phase.
const ORB = (ctx, cx, cy, frame, radius, i, speed, r, color, phase = 0) => {
  const a = frame * speed + i * 2.1 + phase;
  CIR(ctx, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius * 0.7, r, color);
};

export const SHIKIGAMI = [
  { id: 'kitsune', name: 'Kitsune', desc: 'White fox spirit with red markings and two glowing tails.', price: 220, color: '#FFFFFF', accent: '#FF3322', draw: drawKitsune },
  { id: 'kuro', name: 'Kuro', desc: 'Tiny black wolf with faint purple eyes and smoky fur.', price: 200, color: '#1A1A22', accent: '#AA66FF', draw: drawKuro },
  { id: 'tora', name: 'Tora', desc: 'Orange tiger spirit with dark stripes and a glowing tail.', price: 210, color: '#FF8800', accent: '#221100', draw: drawTora },
  { id: 'rai', name: 'Rai', desc: 'Thunderbird with dark feathers and electric sparks.', price: 230, color: '#332244', accent: '#FFFF44', draw: drawRai },
  { id: 'kaze', name: 'Kaze', desc: 'Pale-blue bird surrounded by swirling wind.', price: 180, color: '#AADDFF', accent: '#FFFFFF', draw: drawKaze },
  { id: 'hana', name: 'Hana', desc: 'Spirit deer with flower markings and blossoms on its antlers.', price: 200, color: '#FFDDEE', accent: '#FF66AA', draw: drawHana },
  { id: 'yuki', name: 'Yuki', desc: 'White rabbit with icy-blue markings and snow particles.', price: 190, color: '#FFFFFF', accent: '#88CCFF', draw: drawYuki },
  { id: 'mizu', name: 'Mizu', desc: 'Translucent blue koi spirit that swims through the air.', price: 210, color: '#4488FF', accent: '#AAEEFF', draw: drawMizu },
  { id: 'hi', name: 'Hi', desc: 'Red salamander surrounded by a subtle flame aura.', price: 200, color: '#FF4422', accent: '#FFAA22', draw: drawHi },
  { id: 'tsuki', name: 'Tsuki', desc: 'Silver rabbit with a crescent-moon marking and soft glow.', price: 220, color: '#CCCCCC', accent: '#DDEEFF', draw: drawTsuki },
  { id: 'sora', name: 'Sora', desc: 'White crane with faint blue patterns on its wings.', price: 200, color: '#FFFFFF', accent: '#88AAFF', draw: drawSora },
  { id: 'kumo', name: 'Kumo', desc: 'Gray spider with a tiny floating web beneath it.', price: 170, color: '#888888', accent: '#DDDDDD', draw: drawKumo },
  { id: 'kage', name: 'Kage', desc: 'Shadow cat with smoky body that fades at the edges.', price: 190, color: '#222233', accent: '#000000', draw: drawKage },
  { id: 'akuma', name: 'Akuma', desc: 'Red oni spirit with two miniature horns.', price: 210, color: '#DD2222', accent: '#FFAA22', draw: drawAkuma },
  { id: 'koi', name: 'Koi', desc: 'Red-and-white koi spirit with golden fins.', price: 200, color: '#FF3344', accent: '#FFD700', draw: drawKoi },
  { id: 'mori', name: 'Mori', desc: 'Round wooden forest spirit with leaves on its head.', price: 180, color: '#8B5A2B', accent: '#44AA44', draw: drawMori },
  { id: 'ishi', name: 'Ishi', desc: 'Stone turtle with glowing cracks across its shell.', price: 190, color: '#777766', accent: '#FFCC44', draw: drawIshi },
  { id: 'hoshi', name: 'Hoshi', desc: 'Star-shaped spirit with a golden glow and orbiting particles.', price: 220, color: '#FFDD44', accent: '#FFFFFF', draw: drawHoshi },
  { id: 'nami', name: 'Nami', desc: 'Water serpent made from translucent blue water.', price: 210, color: '#44AAFF', accent: '#AAEEFF', draw: drawNami },
  { id: 'kaminari', name: 'Kaminari', desc: 'Electric fox with yellow markings and sparks at its paws.', price: 230, color: '#FFCC22', accent: '#FFFF66', draw: drawKaminari },
  { id: 'tsubaki', name: 'Tsubaki', desc: 'Deep-red spirit bird with camellia flowers around it.', price: 200, color: '#CC1133', accent: '#FF6688', draw: drawTsubaki },
  { id: 'kumoji', name: 'Kumoji', desc: 'Cloud-like spirit with a cute face and trailing wisps.', price: 180, color: '#EEF2FF', accent: '#CCD0FF', draw: drawKumoji },
  { id: 'hebi', name: 'Hebi', desc: 'White-and-gold serpent that slowly coils while floating.', price: 210, color: '#FFF8DD', accent: '#FFD700', draw: drawHebi },
  { id: 'tanuki', name: 'Tanuki', desc: 'Brown tanuki spirit with a striped tail and a leaf on its head.', price: 190, color: '#885533', accent: '#66AA44', draw: drawTanuki },
  { id: 'karasu', name: 'Karasu', desc: 'Black crow spirit with blue-purple feather highlights.', price: 200, color: '#111118', accent: '#6644AA', draw: drawKarasu },
  { id: 'ryuu', name: 'Ryuu', desc: 'Eastern dragon with dark green scales, horns, and a smoke trail.', price: 260, color: '#226644', accent: '#88FFAA', draw: drawRyuu },
  { id: 'cho', name: 'Cho', desc: 'Glowing butterfly spirit with translucent purple wings.', price: 190, color: '#AA55FF', accent: '#FFCCFF', draw: drawCho },
  { id: 'sakura', name: 'Sakura', desc: 'Pink fox spirit surrounded by falling cherry-blossom petals.', price: 210, color: '#FFAADD', accent: '#FF77BB', draw: drawSakura },
  { id: 'hotaru', name: 'Hotaru', desc: 'Firefly spirit with a glowing yellow-green body and light particles.', price: 200, color: '#CCFF44', accent: '#FFFFAA', draw: drawHotaru },
  { id: 'shiro', name: 'Shiro', desc: 'Completely white wolf spirit with a faint silver aura and blue eyes.', price: 240, color: '#FFFFFF', accent: '#AABBFF', draw: drawShiro },
  { id: 'yatagarasu', name: 'Yatagarasu', desc: 'Three-legged sun crow that circles its master in three bright arcs.', price: 240, color: '#17121F', accent: '#FFD34D', draw: drawYatagarasu },
  { id: 'kappa', name: 'Kappa', desc: 'Mischievous river spirit with a water-filled crown and tiny shell.', price: 205, color: '#4E9F70', accent: '#8DE7FF', draw: drawKappa },
  { id: 'tengu', name: 'Tengu', desc: 'Mountain guardian with a red mask, feathered wings, and a tiny fan.', price: 230, color: '#B33A32', accent: '#F2C14E', draw: drawTengu },
  { id: 'bakeneko', name: 'Bakeneko', desc: 'Two-tailed house cat spirit that dances around a floating blue flame.', price: 215, color: '#40324F', accent: '#6EE7FF', draw: drawBakeneko },
  { id: 'nekomata', name: 'Nekomata', desc: 'Ancient cat with split tails and twin paper talismans fluttering behind it.', price: 225, color: '#D7C6A8', accent: '#A855F7', draw: drawNekomata },
  { id: 'jorogumo', name: 'Jorogumo', desc: 'Silken spider spirit with a jewel-like abdomen and eight silver threads.', price: 235, color: '#5B315F', accent: '#F6C8FF', draw: drawJorogumo },
  { id: 'rokurokubi', name: 'Rokurokubi', desc: 'Playful lantern spirit with an impossibly long neck that curls in loops.', price: 210, color: '#E7B6A4', accent: '#FF6B8A', draw: drawRokurokubi },
  { id: 'nurarihyon', name: 'Nurarihyon', desc: 'Calm tea-house spirit with a smooth oversized head and a drifting cup.', price: 220, color: '#A98F80', accent: '#D8B26E', draw: drawNurarihyon },
  { id: 'kodama', name: 'Kodama', desc: 'Forest tree spirit carrying a tiny branch crown and glowing leaves.', price: 195, color: '#B7D58A', accent: '#D8FF9A', draw: drawKodama },
  { id: 'baku', name: 'Baku', desc: 'Dream-eating tapir spirit that puffs little stars from its trunk.', price: 225, color: '#7E8AA2', accent: '#FFD86B', draw: drawBaku },
  { id: 'nue', name: 'Nue', desc: 'Chimera spirit with a monkey face, tiger body, snake tail, and bird wings.', price: 250, color: '#5A5148', accent: '#B6E36B', draw: drawNue },
  { id: 'gashadokuro', name: 'Gashadokuro', desc: 'Tiny floating bone giant assembled from mismatched glowing pieces.', price: 245, color: '#D9D3C7', accent: '#A7F3D0', draw: drawGashadokuro },
  { id: 'raiju', name: 'Raiju', desc: 'Lightning beast curled like a storm cloud, crackling with white sparks.', price: 245, color: '#6D78B8', accent: '#E8F34A', draw: drawRaiju },
  { id: 'kamaitachi', name: 'Kamaitachi', desc: 'Swift sickle-weasel that spins three crescent blades around its paws.', price: 235, color: '#C9C5B9', accent: '#C7F9FF', draw: drawKamaitachi },
  { id: 'kawauso', name: 'Kawauso', desc: 'River otter spirit balancing a pebble while ripples orbit its feet.', price: 200, color: '#7A5A43', accent: '#7DD3FC', draw: drawKawauso },
  { id: 'shuten', name: 'Shuten', desc: 'Miniature oni lord with a sake gourd, crimson horns, and gold beads.', price: 240, color: '#8F2633', accent: '#FFD166', draw: drawShuten },
  { id: 'tamamo', name: 'Tamamo', desc: 'Nine-tailed fox spirit whose tails form a glowing golden fan.', price: 260, color: '#F0D6A6', accent: '#FFB703', draw: drawTamamo },
  { id: 'yuki_onna', name: 'Yuki-Onna', desc: 'Snow woman spirit wrapped in a drifting white veil of frost.', price: 235, color: '#DCEBFF', accent: '#9BE7FF', draw: drawYukiOnna },
  { id: 'ubume', name: 'Ubume', desc: 'Gentle bird-mother spirit carrying a glowing folded charm.', price: 210, color: '#BFA7D9', accent: '#FFD1E8', draw: drawUbume },
  { id: 'futakuchi', name: 'Futakuchi', desc: 'Quiet spirit with a second little mouth hidden beneath its flowing hair.', price: 225, color: '#D9A6B5', accent: '#6B4C7A', draw: drawFutakuchi },
  { id: 'akaname', name: 'Akaname', desc: 'Bathhouse goblin with a long tongue and a scrub brush tucked under one arm.', price: 190, color: '#9A6A58', accent: '#FFB4A2', draw: drawAkaname },
  { id: 'mokumokuren', name: 'Mokumokuren', desc: 'Shifting paper screen spirit covered in blinking little eyes.', price: 215, color: '#D8CBB7', accent: '#7C5CFC', draw: drawMokumokuren },
  { id: 'konaki', name: 'Konaki-Jiji', desc: 'Tiny old mountain spirit whose oversized bundle rocks gently in the air.', price: 205, color: '#B7A48A', accent: '#F4D58D', draw: drawKonaki },
  { id: 'ittan', name: 'Ittan-Momen', desc: 'Animated cotton cloth that folds itself into a smiling ribbon creature.', price: 200, color: '#F5F1E8', accent: '#E9A8FF', draw: drawIttan },
  { id: 'rokuro', name: 'Rokuro', desc: 'Spinning well-spirit with a wooden bucket and a ring of blue water.', price: 210, color: '#76533C', accent: '#62D6FF', draw: drawRokuro },
  { id: 'tsukumogami', name: 'Tsukumogami', desc: 'Cheerful enchanted tea kettle with tiny legs and a puff of steam.', price: 205, color: '#8C9AA8', accent: '#FFD166', draw: drawTsukumogami },
  { id: 'onryo', name: 'Onryo', desc: 'Restless spirit draped in pale ribbons with a single floating bell.', price: 225, color: '#D8E1EA', accent: '#9D7BFF', draw: drawOnryo },
  { id: 'hannya', name: 'Hannya', desc: 'Jealous mask spirit with curled horns and a fan of violet flames.', price: 230, color: '#C94F6D', accent: '#A855F7', draw: drawHannya },
  { id: 'namahage', name: 'Namahage', desc: 'Winter demon spirit with a straw cape, red mask, and wooden blade charm.', price: 225, color: '#B74A3A', accent: '#E7D8B1', draw: drawNamahage },
  { id: 'otoroshi', name: 'Otoroshi', desc: 'Shaggy shrine guardian with tusks, a mane, and a stone bell.', price: 235, color: '#665A52', accent: '#D7B98E', draw: drawOtoroshi },
  { id: 'zashiki', name: 'Zashiki', desc: 'House spirit with a red hood, tiny sandals, and a warm paper lantern.', price: 200, color: '#C65A4A', accent: '#FFE29A', draw: drawZashiki },
  { id: 'inari', name: 'Inari', desc: 'Fox shrine messenger carrying a miniature rice sheaf and torii charm.', price: 235, color: '#F1B84B', accent: '#FFF0A8', draw: drawInari },
  { id: 'satori', name: 'Satori', desc: 'Mountain mind-reader with a third eye and a swirling thought halo.', price: 230, color: '#8C6BAE', accent: '#F5B7FF', draw: drawSatori },
  { id: 'ama_no', name: 'Ama-No-Jaku', desc: 'Tiny mountain imp wearing an upside-down charm mask and crooked horns.', price: 220, color: '#6C4B70', accent: '#FF8FA3', draw: drawAmaNoJaku },
  { id: 'shirime', name: 'Shirime', desc: 'Mischievous shadow creature whose single eye glows from a strange tail.', price: 195, color: '#3A3345', accent: '#7DF9FF', draw: drawShirime },
  { id: 'amefuri', name: 'Amefuri', desc: 'Rain spirit wrapped in a tiny kasa hat with droplets orbiting its body.', price: 205, color: '#6687A8', accent: '#B9F2FF', draw: drawAmefuri },
  { id: 'kijimuna', name: 'Kijimuna', desc: 'Red-haired Okinawan tree spirit with leaves woven through its hair.', price: 215, color: '#C85B48', accent: '#8FE388', draw: drawKijimuna },
  { id: 'shisa', name: 'Shisa', desc: 'Okinawan guardian lion with a curled tail and a tiny protective bell.', price: 225, color: '#B57B4B', accent: '#67D5FF', draw: drawShisa },
  { id: 'ama_bie', name: 'Amabie', desc: 'Three-legged sea prophet with long hair, a beak, and a radiant scale crest.', price: 240, color: '#4AA3A2', accent: '#F6E58D', draw: drawAmabie },
  { id: 'umibozu', name: 'Umibozu', desc: 'Little sea monk rising from a dark blue wave with a paper boat.', price: 235, color: '#233B62', accent: '#78D6FF', draw: drawUmibozu },
  { id: 'isogashi', name: 'Isogashi', desc: 'Frenzied worker spirit sprinting with six tiny arms and a scroll.', price: 210, color: '#C49A6C', accent: '#FFCE56', draw: drawIsogashi },
  { id: 'shiranui', name: 'Shiranui', desc: 'Mysterious sea lights that float as twin blue flames around a dark core.', price: 230, color: '#24334A', accent: '#62F5FF', draw: drawShiranui },
  { id: 'hitodama', name: 'Hitodama', desc: 'Wandering soul-fire with a teardrop flame and a tiny trailing wick.', price: 215, color: '#566B9A', accent: '#B7F3FF', draw: drawHitodama },
  { id: 'kudan', name: 'Kudan', desc: 'Prophetic calf spirit with a little paper scroll tied to its horn.', price: 225, color: '#B99B78', accent: '#EDE2C6', draw: drawKudan },
  { id: 'bakekujira', name: 'Bakekujira', desc: 'Ghost whale spirit reduced to a tiny ribbed silhouette swimming through mist.', price: 245, color: '#A9B4C4', accent: '#D8F3FF', draw: drawBakekujira },
  { id: 'shogunrei', name: 'Shogunrei', desc: 'Samurai ancestral spirit with a floating kabuto and a paper blade.', price: 240, color: '#3B4658', accent: '#D4AF37', draw: drawShogunrei },
  { id: 'komainu', name: 'Komainu', desc: 'Shrine guardian lion-dog with a curled mane and a floating prayer tag.', price: 225, color: '#8B8F98', accent: '#F0C674', draw: drawKomainu },
  { id: 'kitsune_bi', name: 'Kitsune-Bi', desc: 'Fox-fire spirit shaped like a small fox made entirely from blue flame.', price: 235, color: '#3D6FB6', accent: '#A8F7FF', draw: drawKitsuneBi },
  { id: 'tatarimokke', name: 'Tatarimokke', desc: 'Owl-shaped guardian spirit with a bell necklace and glowing eyes.', price: 215, color: '#806A58', accent: '#FFE08A', draw: drawTatarimokke },
  { id: 'enko', name: 'Enko', desc: 'Playful Japanese monkey spirit with a red scarf and a peach-shaped charm.', price: 200, color: '#B86F4C', accent: '#FFB6C1', draw: drawEnko },
];

// All Shikigami cost the same price
SHIKIGAMI.forEach(s => { s.price = 2000; });

function drawYatagarasu(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;GLOW(ctx,x,y+b,20*s,'#FFD34D',.28);ctx.save();ctx.translate(x,y+b);ctx.fillStyle='#17121F';ctx.beginPath();ctx.ellipse(0,2*s,11*s,8*s,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2A2335';ctx.beginPath();ctx.moveTo(-9*s,0);ctx.quadraticCurveTo(-20*s,-7*s,-13*s,7*s);ctx.quadraticCurveTo(-5*s,4*s,-4*s,2*s);ctx.fill();ctx.beginPath();ctx.moveTo(9*s,0);ctx.quadraticCurveTo(20*s,-7*s,13*s,7*s);ctx.quadraticCurveTo(5*s,4*s,4*s,2*s);ctx.fill();ctx.fillStyle='#FFD34D';ctx.beginPath();ctx.moveTo(9*s,-1*s);ctx.lineTo(17*s,2*s);ctx.lineTo(9*s,3*s);ctx.fill();EYE(ctx,-4*s,-1*s,1.7*s,'#FFD34D');EYE(ctx,4*s,-1*s,1.7*s,'#FFD34D');for(let i=0;i<3;i++){ctx.strokeStyle='#FFD34D';ctx.lineWidth=1*s;ctx.beginPath();ctx.moveTo((-7+i*7)*s,8*s);ctx.lineTo((-8+i*8)*s,13*s);ctx.stroke();}ctx.restore();}
function drawKappa(ctx,x,y,f,s=1){const b=Math.sin(f*.07)*2*s;GLOW(ctx,x,y+b,17*s,'#62D6FF',.25);ELL(ctx,x,y+3*s+b,9*s,8*s,.05,'#4E9F70');ELL(ctx,x,y-6*s+b,7*s,6*s,0,'#67B982');CIR(ctx,x,y-10*s+b,5*s,'#83D6A0');CIR(ctx,x,y-10*s+b,3*s,'#7DD3FC');EAR(ctx,x-5*s,y-10*s+b,1,'#4E9F70','#B8F0C8');EAR(ctx,x+5*s,y-10*s+b,1,'#4E9F70','#B8F0C8');EYE(ctx,x-2.5*s,y-6*s+b,1.3*s,'#FDE68A');EYE(ctx,x+2.5*s,y-6*s+b,1.3*s,'#FDE68A');ctx.strokeStyle='#8DE7FF';ctx.lineWidth=1.2*s;ctx.beginPath();ctx.arc(x,y+5*s+b,7*s,0,Math.PI);ctx.stroke();}
function drawTengu(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;GLOW(ctx,x,y+b,18*s,'#FF5A4F',.25);ctx.save();ctx.translate(x,y+b);ctx.fillStyle='#B33A32';ctx.beginPath();ctx.arc(0,-4*s,8*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#F0C14E';ctx.beginPath();ctx.moveTo(-6*s,-9*s);ctx.lineTo(0,-15*s);ctx.lineTo(6*s,-9*s);ctx.fill();ctx.fillStyle='#221A1A';ctx.beginPath();ctx.moveTo(-7*s,1*s);ctx.lineTo(-15*s,6*s);ctx.lineTo(-6*s,8*s);ctx.fill();ctx.beginPath();ctx.moveTo(7*s,1*s);ctx.lineTo(15*s,6*s);ctx.lineTo(6*s,8*s);ctx.fill();ctx.fillStyle='#6B2D2A';ctx.beginPath();ctx.moveTo(-3*s,1*s);ctx.lineTo(3*s,1*s);ctx.lineTo(0,5*s);ctx.fill();EYE(ctx,-3*s,-5*s,1.4*s,'#FFD166');EYE(ctx,3*s,-5*s,1.4*s,'#FFD166');ctx.strokeStyle='#E8C76A';ctx.lineWidth=1*s;ctx.beginPath();ctx.arc(10*s,7*s,5*s,0,Math.PI*1.5);ctx.stroke();ctx.restore();}
function drawBakeneko(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;GLOW(ctx,x,y+b,18*s,'#6EE7FF',.22);ELL(ctx,x,y+3*s+b,9*s,7*s,0,'#40324F');ELL(ctx,x+1*s,y-6*s+b,7*s,6*s,0,'#50405F');EAR(ctx,x-5*s,y-10*s+b,1,'#40324F','#B58CFF');EAR(ctx,x+5*s,y-10*s+b,1,'#40324F','#B58CFF');EYE(ctx,x-3*s,y-6*s+b,1.3*s,'#6EE7FF');EYE(ctx,x+3*s,y-6*s+b,1.3*s,'#6EE7FF');for(let i=0;i<2;i++){ctx.save();ctx.translate(x+(i?7:-7)*s,y+5*s+b);ctx.rotate((i?1:-1)*(.6+Math.sin(f*.05)*.15));ctx.strokeStyle='#8B5CF6';ctx.lineWidth=3*s;ctx.beginPath();ctx.arc(0,0,7*s,0,Math.PI);ctx.stroke();ctx.restore();}ORB(ctx,x,y+b,f,14*s,0,.06,2*s,'#6EE7FF');}
function drawNekomata(ctx,x,y,f,s=1){const b=Math.sin(f*.055)*2*s;ELL(ctx,x,y+3*s+b,10*s,7*s,.1,'#D7C6A8');ELL(ctx,x,y-6*s+b,7*s,6*s,0,'#E4D4BC');EAR(ctx,x-5*s,y-10*s+b,1,'#E4D4BC','#A855F7');EAR(ctx,x+5*s,y-10*s+b,1,'#E4D4BC','#A855F7');EYE(ctx,x-2.5*s,y-6*s+b,1.2*s,'#A855F7');EYE(ctx,x+2.5*s,y-6*s+b,1.2*s,'#A855F7');for(let i=0;i<2;i++){ctx.strokeStyle='#A855F7';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo((i?6:-6)*s,5*s+b);ctx.quadraticCurveTo((i?16:-16)*s,10*s+b,(i?12:-12)*s,-1*s+b);ctx.stroke();}ctx.fillStyle='#FFF1C7';for(let i=0;i<2;i++){ctx.save();ctx.translate((i?11:-11)*s,1*s+b);ctx.rotate(i?-.3:.3);ctx.fillRect(-2*s,-6*s,4*s,12*s);ctx.restore();}}
function drawJorogumo(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;GLOW(ctx,x,y+b,20*s,'#F6C8FF',.2);CIR(ctx,x,y+b,9*s,'#5B315F');CIR(ctx,x,y-2*s+b,4*s,'#F6C8FF');for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.sin(f*.03)*.1;ctx.strokeStyle='#DCC5FF';ctx.lineWidth=1.4*s;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*5*s,y+Math.sin(a)*5*s+b);ctx.lineTo(x+Math.cos(a)*16*s,y+Math.sin(a)*12*s+b);ctx.stroke();}EYE(ctx,x-2*s,y-2*s+b,1*s,'#FF8CF5');EYE(ctx,x+2*s,y-2*s+b,1*s,'#FF8CF5');}
function drawRokurokubi(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ctx.strokeStyle='#E7B6A4';ctx.lineWidth=5*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y+8*s+b);ctx.bezierCurveTo(x-10*s,y+2*s+b,x+10*s,y-3*s+b,x,y-13*s+b);ctx.stroke();CIR(ctx,x,y-15*s+b,6*s,'#E7B6A4');EYE(ctx,x-2*s,y-16*s+b,1.1*s,'#FF6B8A');EYE(ctx,x+2*s,y-16*s+b,1.1*s,'#FF6B8A');}
function drawNurarihyon(ctx,x,y,f,s=1){const b=Math.sin(f*.04)*1.5*s;ELL(ctx,x,y+4*s+b,8*s,6*s,0,'#7D6A5F');ELL(ctx,x,y-5*s+b,10*s,8*s,0,'#A98F80');ctx.fillStyle='#D8B26E';ctx.beginPath();ctx.arc(x+11*s,y+1*s+b,4*s,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#D8B26E';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(x+8*s,y-1*s+b);ctx.lineTo(x+13*s,y-6*s+b);ctx.stroke();EYE(ctx,x-3*s,y-6*s+b,1.2*s,'#6B4F3A');EYE(ctx,x+3*s,y-6*s+b,1.2*s,'#6B4F3A');}
function drawKodama(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;GLOW(ctx,x,y+b,16*s,'#D8FF9A',.22);ELL(ctx,x,y+3*s+b,8*s,9*s,0,'#B7D58A');ctx.fillStyle='#6B8F3E';ctx.beginPath();ctx.moveTo(x-7*s,y-5*s+b);ctx.quadraticCurveTo(x,y-16*s+b,x+7*s,y-5*s+b);ctx.lineTo(x,y-8*s+b);ctx.fill();for(let i=0;i<4;i++)ORB(ctx,x,y+b,f,12*s,i,.04,1.6*s,'#D8FF9A');EYE(ctx,x-2.5*s,y-2*s+b,1*s,'#315B37');EYE(ctx,x+2.5*s,y-2*s+b,1*s,'#315B37');}
function drawBaku(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+3*s+b,11*s,7*s,-.1,'#7E8AA2');ELL(ctx,x+8*s,y-1*s+b,6*s,5*s,.1,'#8D9AB0');ctx.fillStyle='#68748C';ctx.beginPath();ctx.moveTo(x+11*s,y-2*s+b);ctx.quadraticCurveTo(x+17*s,y+4*s+b,x+12*s,y+7*s+b);ctx.quadraticCurveTo(x+8*s,y+4*s+b,x+11*s,y-2*s+b);ctx.fill();EYE(ctx,x+6*s,y-2*s+b,1.2*s,'#FFD86B');for(let i=0;i<4;i++)ORB(ctx,x+13*s,y-2*s+b,f,8*s,i,.04,1.2*s,'#FFD86B');}
function drawNue(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+3*s+b,10*s,7*s,0,'#5A5148');ELL(ctx,x,y-6*s+b,6*s,5*s,0,'#7B6A5C');ctx.fillStyle='#39402F';ctx.beginPath();ctx.moveTo(-8*s+x,y+b);ctx.quadraticCurveTo(x-20*s,y-8*s+b,x-10*s,y+7*s+b);ctx.fill();ctx.beginPath();ctx.moveTo(8*s+x,y+b);ctx.quadraticCurveTo(x+20*s,y-8*s+b,x+10*s,y+7*s+b);ctx.fill();ctx.strokeStyle='#B6E36B';ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(x+9*s,y+5*s+b);ctx.quadraticCurveTo(x+17*s,y+10*s+b,x+12*s,y+15*s+b);ctx.stroke();EYE(ctx,x-2*s,y-6*s+b,1.1*s,'#B6E36B');EYE(ctx,x+2*s,y-6*s+b,1.1*s,'#B6E36B');}
function drawGashadokuro(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;GLOW(ctx,x,y+b,19*s,'#A7F3D0',.18);ctx.strokeStyle='#D9D3C7';ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(x-7*s,y+7*s+b);ctx.lineTo(x+7*s,y+7*s+b);ctx.moveTo(x,y+7*s+b);ctx.lineTo(x,y-8*s+b);ctx.stroke();CIR(ctx,x,y-10*s+b,7*s,'#D9D3C7');CIR(ctx,x-3*s,y-11*s+b,1.5*s,'#263238');CIR(ctx,x+3*s,y-11*s+b,1.5*s,'#263238');for(let i=0;i<3;i++){ctx.save();ctx.translate(x+(i-1)*7*s,y+10*s+b);ctx.rotate(Math.sin(f*.07+i));ctx.fillStyle='#D9D3C7';ctx.fillRect(-2*s,-5*s,4*s,10*s);ctx.restore();}}
function drawRaiju(ctx,x,y,f,s=1){const b=Math.sin(f*.09)*2*s;GLOW(ctx,x,y+b,20*s,'#E8F34A',.25);ctx.fillStyle='#6D78B8';ctx.beginPath();ctx.arc(x,y+b,9*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8994D4';ctx.beginPath();ctx.moveTo(x-7*s,y-1*s+b);ctx.lineTo(x-16*s,y-8*s+b);ctx.lineTo(x-10*s,y+4*s+b);ctx.fill();ctx.beginPath();ctx.moveTo(x+7*s,y-1*s+b);ctx.lineTo(x+16*s,y-8*s+b);ctx.lineTo(x+10*s,y+4*s+b);ctx.fill();for(let i=0;i<4;i++){ctx.strokeStyle='#E8F34A';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.moveTo(x+(i-1.5)*5*s,y+5*s+b);ctx.lineTo(x+(i-1.5)*5*s+Math.sin(f*.2+i)*3*s,y+12*s+b);ctx.stroke();}EYE(ctx,x-3*s,y-2*s+b,1.2*s,'#E8F34A');EYE(ctx,x+3*s,y-2*s+b,1.2*s,'#E8F34A');}
function drawKamaitachi(ctx,x,y,f,s=1){const b=Math.sin(f*.08)*2*s;ELL(ctx,x,y+3*s+b,10*s,6*s,-.15,'#C9C5B9');ELL(ctx,x+7*s,y-4*s+b,5*s,5*s,0,'#D8D4C9');EAR(ctx,x+4*s,y-8*s+b,1,'#C9C5B9','#C7F9FF');ctx.strokeStyle='#C7F9FF';ctx.lineWidth=2*s;for(let i=0;i<3;i++){const a=f*.08+i*2;ctx.beginPath();ctx.arc(x-7*s,y+3*s+b,8*s,a,a+.8);ctx.stroke();}EYE(ctx,x+6*s,y-5*s+b,1*s,'#C7F9FF');}
function drawKawauso(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;ELL(ctx,x,y+4*s+b,10*s,6*s,-.1,'#7A5A43');ELL(ctx,x+7*s,y-1*s+b,5*s,4*s,0,'#8B6A50');CIR(ctx,x+10*s,y-1*s+b,1*s,'#111827');ctx.strokeStyle='#7DD3FC';ctx.lineWidth=1.3*s;ctx.beginPath();ctx.arc(x,y+9*s+b,10*s,0,Math.PI);ctx.stroke();CIR(ctx,x,y+1*s+b,3*s,'#B08B5D');}
function drawShuten(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;GLOW(ctx,x,y+b,19*s,'#FF6B4A',.2);ELL(ctx,x,y+3*s+b,9*s,8*s,0,'#8F2633');CIR(ctx,x,y-6*s+b,7*s,'#B43B48');EAR(ctx,x-5*s,y-10*s+b,1,'#8F2633','#FFD166');EAR(ctx,x+5*s,y-10*s+b,1,'#8F2633','#FFD166');ctx.strokeStyle='#FFD166';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(x+9*s,y+2*s+b);ctx.lineTo(x+15*s,y+8*s+b);ctx.stroke();CIR(ctx,x+15*s,y+9*s+b,4*s,'#7A3E2E');EYE(ctx,x-3*s,y-6*s+b,1.3*s,'#FFD166');EYE(ctx,x+3*s,y-6*s+b,1.3*s,'#FFD166');}
function drawTamamo(ctx,x,y,f,s=1){const b=Math.sin(f*.04)*2*s;GLOW(ctx,x,y+b,22*s,'#FFB703',.24);ELL(ctx,x,y+3*s+b,8*s,7*s,0,'#F0D6A6');ELL(ctx,x,y-5*s+b,6*s,5*s,0,'#F0D6A6');for(let i=0;i<9;i++){const a=(i-4)*.32+Math.sin(f*.03+i)*.08;ctx.save();ctx.translate(x,y+5*s+b);ctx.rotate(a);ctx.fillStyle=i%2?'#FFD166':'#FFB703';ctx.beginPath();ctx.ellipse(0,-10*s,3*s,10*s,0,0,Math.PI*2);ctx.fill();ctx.restore();}EYE(ctx,x-2*s,y-5*s+b,1*s,'#FFB703');EYE(ctx,x+2*s,y-5*s+b,1*s,'#FFB703');}
function drawYukiOnna(ctx,x,y,f,s=1){const b=Math.sin(f*.04)*2*s;GLOW(ctx,x,y+b,21*s,'#9BE7FF',.25);ctx.fillStyle='#DCEBFF';ctx.beginPath();ctx.moveTo(x,y-14*s+b);ctx.quadraticCurveTo(x-10*s,y-3*s+b,x-9*s,y+10*s+b);ctx.quadraticCurveTo(x,y+15*s+b,x+9*s,y+10*s+b);ctx.quadraticCurveTo(x+10*s,y-3*s+b,x,y-14*s+b);ctx.fill();CIR(ctx,x,y-9*s+b,6*s,'#EDF7FF');ctx.strokeStyle='#9BE7FF';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.moveTo(x-10*s,y+4*s+b);ctx.lineTo(x+10*s,y+4*s+b);ctx.stroke();EYE(ctx,x-2*s,y-9*s+b,1*s,'#70CFFF');EYE(ctx,x+2*s,y-9*s+b,1*s,'#70CFFF');}
function drawUbume(ctx,x,y,f,s=1){const b=Math.sin(f*.07)*2*s;ELL(ctx,x,y+2*s+b,7*s,9*s,0,'#BFA7D9');ctx.save();ctx.translate(x-7*s,y+b);ctx.rotate(-.3);ELL(ctx,0,0,4*s,10*s,.1,'#E8D9F5');ctx.restore();ctx.save();ctx.translate(x+7*s,y+b);ctx.rotate(.3);ELL(ctx,0,0,4*s,10*s,-.1,'#E8D9F5');ctx.restore();ctx.fillStyle='#FFD1E8';ctx.fillRect(x-3*s,y+5*s+b,6*s,5*s);EYE(ctx,x-2*s,y-4*s+b,1*s,'#7A5A99');EYE(ctx,x+2*s,y-4*s+b,1*s,'#7A5A99');}
function drawFutakuchi(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+3*s+b,8*s,8*s,0,'#D9A6B5');ctx.fillStyle='#4C304D';ctx.beginPath();ctx.moveTo(x-7*s,y-5*s+b);ctx.quadraticCurveTo(x,y-15*s+b,x+8*s,y-3*s+b);ctx.lineTo(x+7*s,y+9*s+b);ctx.lineTo(x-7*s,y+8*s+b);ctx.fill();EYE(ctx,x-2*s,y-5*s+b,1*s,'#6B4C7A');EYE(ctx,x+2*s,y-5*s+b,1*s,'#6B4C7A');ctx.strokeStyle='#FF8FA3';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.arc(x,y+6*s+b,4*s,0,Math.PI);ctx.stroke();}
function drawAkaname(ctx,x,y,f,s=1){const b=Math.sin(f*.08)*2*s;ELL(ctx,x,y+3*s+b,8*s,9*s,0,'#9A6A58');CIR(ctx,x,y-6*s+b,6*s,'#B97A62');ctx.fillStyle='#FFB4A2';ctx.beginPath();ctx.moveTo(x-2*s,y-1*s+b);ctx.quadraticCurveTo(x+7*s,y+5*s+b,x+13*s,y-1*s+b);ctx.stroke();ctx.fill();ctx.strokeStyle='#D2B48C';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(x-8*s,y+5*s+b);ctx.lineTo(x-14*s,y+13*s+b);ctx.stroke();EYE(ctx,x-2*s,y-6*s+b,1*s,'#FFE0B2');EYE(ctx,x+2*s,y-6*s+b,1*s,'#FFE0B2');}
function drawMokumokuren(ctx,x,y,f,s=1){const b=Math.sin(f*.04)*2*s;ctx.fillStyle='#D8CBB7';ctx.beginPath();ctx.roundRect(x-10*s,y-11*s+b,20*s,22*s,3*s);ctx.fill();for(let i=0;i<6;i++){const px=x+((i%2)*10-5)*s,py=y+(-7+Math.floor(i/2)*7)*s+b;EYE(ctx,px,py,1.5*s,'#7C5CFC');}ctx.strokeStyle='#9B8E7A';ctx.lineWidth=1*s;ctx.strokeRect(x-10*s,y-11*s+b,20*s,22*s);}
function drawKonaki(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+4*s+b,9*s,8*s,0,'#B7A48A');CIR(ctx,x,y-5*s+b,5*s,'#CBB9A0');ctx.strokeStyle='#F4D58D';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(x-8*s,y+2*s+b);ctx.quadraticCurveTo(x-15*s,y+6*s+b,x-9*s,y+12*s+b);ctx.stroke();ctx.beginPath();ctx.moveTo(x+8*s,y+2*s+b);ctx.quadraticCurveTo(x+15*s,y+6*s+b,x+9*s,y+12*s+b);ctx.stroke();EYE(ctx,x-2*s,y-6*s+b,1*s,'#725F4C');EYE(ctx,x+2*s,y-6*s+b,1*s,'#725F4C');}
function drawIttan(ctx,x,y,f,s=1){const b=Math.sin(f*.08)*2*s;ctx.save();ctx.translate(x,y+b);ctx.rotate(Math.sin(f*.04)*.12);ctx.fillStyle='#F5F1E8';ctx.beginPath();ctx.moveTo(-13*s,-3*s);ctx.quadraticCurveTo(-4*s,-13*s,8*s,-7*s);ctx.quadraticCurveTo(15*s,0,5*s,8*s);ctx.quadraticCurveTo(-5*s,13*s,-13*s,3*s);ctx.fill();ctx.strokeStyle='#E9A8FF';ctx.lineWidth=1.5*s;ctx.stroke();EYE(ctx,0,-2*s,1.3*s,'#8B5CF6');ctx.restore();}
function drawRokuro(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+5*s+b,8*s,7*s,0,'#76533C');CIR(ctx,x,y-5*s+b,6*s,'#8D6548');ctx.strokeStyle='#62D6FF';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.arc(x,y+4*s+b,12*s,0,Math.PI*1.7);ctx.stroke();ctx.fillStyle='#9B6B47';ctx.fillRect(x+8*s,y+2*s+b,5*s,7*s);EYE(ctx,x-2*s,y-6*s+b,1*s,'#62D6FF');EYE(ctx,x+2*s,y-6*s+b,1*s,'#62D6FF');}
function drawTsukumogami(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;ELL(ctx,x,y+3*s+b,9*s,8*s,0,'#8C9AA8');ctx.fillStyle='#AEB9C4';ctx.fillRect(x-6*s,y-9*s+b,12*s,3*s);ctx.strokeStyle='#8C9AA8';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(x,y-5*s+b,7*s,Math.PI,Math.PI*2);ctx.stroke();ctx.fillStyle='#E8EEF2';ctx.beginPath();ctx.arc(x+9*s,y-4*s+b,3*s,0,Math.PI*2);ctx.fill();for(let i=0;i<3;i++)ORB(ctx,x,y-11*s+b,f,7*s,i,.03,1.5*s,'#FFD166');EYE(ctx,x-3*s,y+1*s+b,1*s,'#FFD166');EYE(ctx,x+3*s,y+1*s+b,1*s,'#FFD166');}
function drawOnryo(ctx,x,y,f,s=1){const b=Math.sin(f*.04)*2*s;ctx.fillStyle='#D8E1EA';ctx.beginPath();ctx.moveTo(x,y-14*s+b);ctx.quadraticCurveTo(x-11*s,y-3*s+b,x-8*s,y+12*s+b);ctx.lineTo(x,y+7*s+b);ctx.lineTo(x+8*s,y+12*s+b);ctx.quadraticCurveTo(x+11*s,y-3*s+b,x,y-14*s+b);ctx.fill();CIR(ctx,x,y-8*s+b,5*s,'#E9F2F8');ctx.strokeStyle='#9D7BFF';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(x+11*s,y+5*s+b,4*s,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1*s;ctx.beginPath();ctx.moveTo(x+11*s,y+9*s+b);ctx.lineTo(x+11*s,y+14*s+b);ctx.stroke();EYE(ctx,x-2*s,y-8*s+b,1*s,'#9D7BFF');EYE(ctx,x+2*s,y-8*s+b,1*s,'#9D7BFF');}
function drawHannya(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;GLOW(ctx,x,y+b,19*s,'#A855F7',.2);ctx.fillStyle='#C94F6D';ctx.beginPath();ctx.moveTo(x-8*s,y-9*s+b);ctx.lineTo(x-4*s,y-15*s+b);ctx.lineTo(x,y-10*s+b);ctx.lineTo(x+4*s,y-15*s+b);ctx.lineTo(x+8*s,y-9*s+b);ctx.lineTo(x+7*s,y+8*s+b);ctx.lineTo(x,y+12*s+b);ctx.lineTo(x-7*s,y+8*s+b);ctx.closePath();ctx.fill();EYE(ctx,x-3*s,y-5*s+b,1.5*s,'#FFD166');EYE(ctx,x+3*s,y-5*s+b,1.5*s,'#FFD166');for(let i=0;i<4;i++)ORB(ctx,x,y+5*s+b,f,13*s,i,.06,1.5*s,'#A855F7');}
function drawNamahage(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;ELL(ctx,x,y+4*s+b,9*s,8*s,0,'#A74A3A');CIR(ctx,x,y-6*s+b,7*s,'#B74A3A');ctx.fillStyle='#E7D8B1';ctx.fillRect(x-9*s,y+5*s+b,18*s,4*s);ctx.strokeStyle='#D9C49C';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(x+10*s,y-1*s+b);ctx.lineTo(x+16*s,y-7*s+b);ctx.stroke();EYE(ctx,x-3*s,y-6*s+b,1.2*s,'#FFD166');EYE(ctx,x+3*s,y-6*s+b,1.2*s,'#FFD166');}
function drawOtoroshi(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+3*s+b,11*s,8*s,.05,'#665A52');ELL(ctx,x,y-7*s+b,8*s,6*s,0,'#7C6C62');ctx.fillStyle='#D7B98E';ctx.beginPath();ctx.moveTo(x-5*s,y-10*s+b);ctx.lineTo(x-9*s,y-16*s+b);ctx.lineTo(x-2*s,y-11*s+b);ctx.moveTo(x+5*s,y-10*s+b);ctx.lineTo(x+9*s,y-16*s+b);ctx.lineTo(x+2*s,y-11*s+b);ctx.fill();ctx.strokeStyle='#D7B98E';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(x+12*s,y+5*s+b,4*s,0,Math.PI*2);ctx.stroke();EYE(ctx,x-3*s,y-7*s+b,1.2*s,'#F4D58D');EYE(ctx,x+3*s,y-7*s+b,1.2*s,'#F4D58D');}
function drawZashiki(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;ELL(ctx,x,y+4*s+b,7*s,8*s,0,'#C65A4A');CIR(ctx,x,y-6*s+b,6*s,'#D87360');ctx.fillStyle='#A23B35';ctx.fillRect(x-7*s,y-10*s+b,14*s,3*s);ctx.strokeStyle='#FFE29A';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(x+11*s,y-1*s+b,5*s,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#FFE29A';ctx.fillRect(x+10*s,y-1*s+b,2*s,8*s);EYE(ctx,x-2*s,y-6*s+b,1*s,'#FFE29A');EYE(ctx,x+2*s,y-6*s+b,1*s,'#FFE29A');}
function drawInari(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;GLOW(ctx,x,y+b,19*s,'#FFF0A8',.22);ELL(ctx,x,y+4*s+b,8*s,7*s,0,'#F1B84B');ELL(ctx,x,y-6*s+b,6*s,6*s,0,'#F1B84B');EAR(ctx,x-4*s,y-10*s+b,1,'#F1B84B','#FFF0A8');EAR(ctx,x+4*s,y-10*s+b,1,'#F1B84B','#FFF0A8');ctx.fillStyle='#FFF0A8';ctx.fillRect(x-2*s,y+6*s+b,4*s,8*s);ctx.strokeStyle='#E6A83D';ctx.lineWidth=1*s;ctx.strokeRect(x-5*s,y+5*s+b,10*s,5*s);EYE(ctx,x-2*s,y-6*s+b,1*s,'#FFF0A8');EYE(ctx,x+2*s,y-6*s+b,1*s,'#FFF0A8');}
function drawSatori(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+4*s+b,9*s,7*s,0,'#8C6BAE');CIR(ctx,x,y-6*s+b,6*s,'#9D78BF');EYE(ctx,x-2*s,y-6*s+b,1*s,'#F5B7FF');EYE(ctx,x+2*s,y-6*s+b,1*s,'#F5B7FF');CIR(ctx,x,y-5*s+b,2*s,'#F5B7FF');ctx.strokeStyle='#F5B7FF';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.arc(x,y-6*s+b,12*s,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++)ORB(ctx,x,y-6*s+b,f,12*s,i,.03,1*s,'#F5B7FF');}
function drawAmaNoJaku(ctx,x,y,f,s=1){const b=Math.sin(f*.08)*2*s;ELL(ctx,x,y+4*s+b,8*s,8*s,0,'#6C4B70');CIR(ctx,x,y-6*s+b,6*s,'#7E5882');EAR(ctx,x-5*s,y-10*s+b,1,'#6C4B70','#FF8FA3');EAR(ctx,x+5*s,y-10*s+b,1,'#6C4B70','#FF8FA3');ctx.fillStyle='#F4D1E0';ctx.beginPath();ctx.moveTo(x-5*s,y-5*s+b);ctx.lineTo(x,y-10*s+b);ctx.lineTo(x+5*s,y-5*s+b);ctx.fill();ctx.fillStyle='#FF8FA3';ctx.fillRect(x-4*s,y+2*s+b,8*s,2*s);EYE(ctx,x-2*s,y-6*s+b,1*s,'#FF8FA3');EYE(ctx,x+2*s,y-6*s+b,1*s,'#FF8FA3');}
function drawShirime(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;ELL(ctx,x,y+3*s+b,8*s,9*s,0,'#3A3345');ctx.save();ctx.translate(x+9*s,y+4*s+b);ctx.rotate(Math.sin(f*.08)*.2);CIR(ctx,0,0,4*s,'#4A4258');EYE(ctx,0,0,2.2*s,'#7DF9FF');ctx.restore();CIR(ctx,x-3*s,y-3*s+b,1*s,'#BBA8C9');CIR(ctx,x+3*s,y-3*s+b,1*s,'#BBA8C9');}
function drawAmefuri(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+4*s+b,8*s,8*s,0,'#6687A8');ctx.fillStyle='#4B637C';ctx.beginPath();ctx.arc(x,y-8*s+b,7*s,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(x-9*s,y-8*s+b,18*s,2*s);for(let i=0;i<5;i++)ORB(ctx,x,y+7*s+b,f,11*s,i,.05,1.2*s,'#B9F2FF');EYE(ctx,x-2*s,y-4*s+b,1*s,'#B9F2FF');EYE(ctx,x+2*s,y-4*s+b,1*s,'#B9F2FF');}
function drawKijimuna(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;ELL(ctx,x,y+4*s+b,8*s,8*s,0,'#C85B48');CIR(ctx,x,y-6*s+b,6*s,'#D96A55');ctx.strokeStyle='#8FE388';ctx.lineWidth=2*s;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(x-7*s+i*3*s,y-9*s+b);ctx.quadraticCurveTo(x-5*s+i*3*s,y-16*s+b,x-3*s+i*3*s,y-10*s+b);ctx.stroke();}EYE(ctx,x-2*s,y-6*s+b,1*s,'#8FE388');EYE(ctx,x+2*s,y-6*s+b,1*s,'#8FE388');}
function drawShisa(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+4*s+b,10*s,8*s,.1,'#B57B4B');CIR(ctx,x,y-6*s+b,7*s,'#C38A56');EAR(ctx,x-5*s,y-11*s+b,1,'#B57B4B','#67D5FF');EAR(ctx,x+5*s,y-11*s+b,1,'#B57B4B','#67D5FF');ctx.strokeStyle='#67D5FF';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(x+10*s,y+4*s+b,6*s,-Math.PI/2,Math.PI);ctx.stroke();EYE(ctx,x-3*s,y-6*s+b,1.2*s,'#67D5FF');EYE(ctx,x+3*s,y-6*s+b,1.2*s,'#67D5FF');}
function drawAmabie(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;GLOW(ctx,x,y+b,20*s,'#F6E58D',.2);ELL(ctx,x,y+4*s+b,8*s,8*s,0,'#4AA3A2');CIR(ctx,x,y-7*s+b,6*s,'#62B8B2');ctx.fillStyle='#4AA3A2';ctx.beginPath();ctx.moveTo(x-5*s,y-10*s+b);ctx.lineTo(x-2*s,y-17*s+b);ctx.lineTo(x,y-11*s+b);ctx.lineTo(x+2*s,y-17*s+b);ctx.lineTo(x+5*s,y-10*s+b);ctx.fill();ctx.fillStyle='#F6E58D';ctx.beginPath();ctx.moveTo(x+4*s,y-6*s+b);ctx.lineTo(x+14*s,y-3*s+b);ctx.lineTo(x+4*s,y-1*s+b);ctx.fill();for(let i=0;i<3;i++){ctx.fillStyle='#F6E58D';ctx.fillRect(x-6*s+i*5*s,y+6*s+b,3*s,4*s);}EYE(ctx,x-2*s,y-7*s+b,1*s,'#F6E58D');EYE(ctx,x+2*s,y-7*s+b,1*s,'#F6E58D');}
function drawUmibozu(ctx,x,y,f,s=1){const b=Math.sin(f*.04)*2*s;GLOW(ctx,x,y+b,19*s,'#78D6FF',.2);ctx.fillStyle='#233B62';ctx.beginPath();ctx.arc(x,y+b,9*s,Math.PI,Math.PI*2);ctx.quadraticCurveTo(x+11*s,y+12*s+b,x,y+13*s+b);ctx.quadraticCurveTo(x-11*s,y+12*s+b,x-9*s,y+b);ctx.fill();ctx.fillStyle='#F8FAFC';ctx.beginPath();ctx.moveTo(x+9*s,y+5*s+b);ctx.lineTo(x+15*s,y+9*s+b);ctx.lineTo(x+9*s,y+10*s+b);ctx.fill();EYE(ctx,x-2*s,y-2*s+b,1.2*s,'#78D6FF');EYE(ctx,x+2*s,y-2*s+b,1.2*s,'#78D6FF');}
function drawIsogashi(ctx,x,y,f,s=1){const b=Math.sin(f*.12)*2*s;ELL(ctx,x,y+3*s+b,9*s,7*s,0,'#C49A6C');CIR(ctx,x,y-6*s+b,5*s,'#D8B078');for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.sin(f*.1)*.1;ctx.strokeStyle='#C49A6C';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*6*s,y+Math.sin(a)*6*s+b);ctx.lineTo(x+Math.cos(a)*14*s,y+Math.sin(a)*11*s+b);ctx.stroke();}ctx.fillStyle='#FFCE56';ctx.fillRect(x+6*s,y-5*s+b,7*s,5*s);EYE(ctx,x-2*s,y-6*s+b,1*s,'#FFCE56');EYE(ctx,x+2*s,y-6*s+b,1*s,'#FFCE56');}
function drawShiranui(ctx,x,y,f,s=1){const b=Math.sin(f*.04)*2*s;GLOW(ctx,x,y+b,20*s,'#62F5FF',.3);CIR(ctx,x,y+b,4*s,'#24334A');for(let i=0;i<2;i++){const a=f*.04+i*Math.PI;const px=x+Math.cos(a)*10*s,py=y+Math.sin(a)*8*s+b;CIR(ctx,px,py,4*s,'#62F5FF');ctx.globalAlpha=.45;CIR(ctx,px,py,7*s,'#62F5FF');ctx.globalAlpha=1;}ctx.strokeStyle='#B8FBFF';ctx.lineWidth=1*s;ctx.beginPath();ctx.arc(x,y+b,12*s,0,Math.PI*2);ctx.stroke();}
function drawHitodama(ctx,x,y,f,s=1){const b=Math.sin(f*.07)*2*s;GLOW(ctx,x,y+b,18*s,'#B7F3FF',.3);ctx.fillStyle='#566B9A';ctx.beginPath();ctx.moveTo(x,y-12*s+b);ctx.quadraticCurveTo(x+8*s,y-2*s+b,x,y+9*s+b);ctx.quadraticCurveTo(x-8*s,y-2*s+b,x,y-12*s+b);ctx.fill();ctx.fillStyle='#B7F3FF';ctx.beginPath();ctx.moveTo(x-2*s,y+8*s+b);ctx.quadraticCurveTo(x,y+14*s+b,x+2*s,y+8*s+b);ctx.fill();CIR(ctx,x-2*s,y-2*s+b,1.2*s,'#EFFFFF');CIR(ctx,x+2*s,y-2*s+b,1.2*s,'#EFFFFF');}
function drawKudan(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+4*s+b,9*s,7*s,0,'#B99B78');ELL(ctx,x+7*s,y-3*s+b,5*s,5*s,0,'#C9AB86');ctx.fillStyle='#D9C7A6';ctx.beginPath();ctx.moveTo(x+4*s,y-7*s+b);ctx.lineTo(x+7*s,y-14*s+b);ctx.lineTo(x+10*s,y-7*s+b);ctx.fill();ctx.strokeStyle='#EDE2C6';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.moveTo(x+10*s,y-5*s+b);ctx.lineTo(x+16*s,y-2*s+b);ctx.stroke();EYE(ctx,x+6*s,y-4*s+b,1*s,'#EDE2C6');}
function drawBakekujira(ctx,x,y,f,s=1){const b=Math.sin(f*.04)*2*s;ctx.strokeStyle='#D8F3FF';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(x,y+b,9*s,Math.PI*.15,Math.PI*1.85);ctx.stroke();for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*4*s,y-6*s+b);ctx.lineTo(x+i*4*s,y+7*s+b);ctx.stroke();}for(let i=0;i<4;i++)ORB(ctx,x,y+b,f,15*s,i,.03,1.2*s,'#D8F3FF');}
function drawShogunrei(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+4*s+b,8*s,8*s,0,'#3B4658');ctx.fillStyle='#263142';ctx.beginPath();ctx.moveTo(x-7*s,y-8*s+b);ctx.lineTo(x,y-14*s+b);ctx.lineTo(x+7*s,y-8*s+b);ctx.fill();ctx.strokeStyle='#D4AF37';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(x-7*s,y-8*s+b);ctx.lineTo(x+7*s,y-8*s+b);ctx.stroke();ctx.rotate(0);ctx.beginPath();ctx.moveTo(x+9*s,y+8*s+b);ctx.lineTo(x+16*s,y-2*s+b);ctx.stroke();EYE(ctx,x-2*s,y-5*s+b,1*s,'#D4AF37');EYE(ctx,x+2*s,y-5*s+b,1*s,'#D4AF37');}
function drawKomainu(ctx,x,y,f,s=1){const b=Math.sin(f*.06)*2*s;ELL(ctx,x,y+4*s+b,10*s,8*s,0,'#8B8F98');CIR(ctx,x,y-6*s+b,7*s,'#9EA2AA');EAR(ctx,x-5*s,y-11*s+b,1,'#8B8F98','#F0C674');EAR(ctx,x+5*s,y-11*s+b,1,'#8B8F98','#F0C674');ctx.strokeStyle='#F0C674';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.moveTo(x-7*s,y+8*s+b);ctx.quadraticCurveTo(x-14*s,y+12*s+b,x-9*s,y+15*s+b);ctx.stroke();ctx.fillStyle='#F0C674';ctx.fillRect(x+8*s,y-1*s+b,5*s,7*s);EYE(ctx,x-3*s,y-6*s+b,1.2*s,'#F0C674');EYE(ctx,x+3*s,y-6*s+b,1.2*s,'#F0C674');}
function drawKitsuneBi(ctx,x,y,f,s=1){const b=Math.sin(f*.08)*2*s;GLOW(ctx,x,y+b,20*s,'#A8F7FF',.28);ctx.fillStyle='#3D6FB6';ctx.beginPath();ctx.moveTo(x-9*s,y+7*s+b);ctx.quadraticCurveTo(x-14*s,y-2*s+b,x-5*s,y-9*s+b);ctx.quadraticCurveTo(x,y-15*s+b,x+7*s,y-8*s+b);ctx.quadraticCurveTo(x+15*s,y-1*s+b,x+8*s,y+8*s+b);ctx.quadraticCurveTo(x,y+13*s+b,x-9*s,y+7*s+b);ctx.fill();ctx.fillStyle='#A8F7FF';ctx.beginPath();ctx.moveTo(x+4*s,y-7*s+b);ctx.quadraticCurveTo(x+15*s,y-12*s+b,x+11*s,y-2*s+b);ctx.quadraticCurveTo(x+7*s,y+3*s+b,x+4*s,y-7*s+b);ctx.fill();EYE(ctx,x-2*s,y-6*s+b,1*s,'#FFFFFF');EYE(ctx,x+2*s,y-6*s+b,1*s,'#FFFFFF');}
function drawTatarimokke(ctx,x,y,f,s=1){const b=Math.sin(f*.05)*2*s;ELL(ctx,x,y+4*s+b,9*s,8*s,0,'#806A58');ELL(ctx,x,y-5*s+b,7*s,6*s,0,'#9A826D');ctx.fillStyle='#D6B87A';ctx.beginPath();ctx.arc(x,y+9*s+b,3*s,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#FFE08A';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.arc(x-3*s,y-5*s+b,1.5*s,0,Math.PI*2);ctx.arc(x+3*s,y-5*s+b,1.5*s,0,Math.PI*2);ctx.stroke();EYE(ctx,x-2*s,y-5*s+b,1*s,'#FFE08A');EYE(ctx,x+2*s,y-5*s+b,1*s,'#FFE08A');}
function drawEnko(ctx,x,y,f,s=1){const b=Math.sin(f*.08)*2*s;ELL(ctx,x,y+4*s+b,8*s,8*s,0,'#B86F4C');CIR(ctx,x,y-6*s+b,6*s,'#C97A54');EAR(ctx,x-5*s,y-10*s+b,1,'#B86F4C','#FFB6C1');EAR(ctx,x+5*s,y-10*s+b,1,'#B86F4C','#FFB6C1');ctx.strokeStyle='#D98B63';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(x+8*s,y+4*s+b,7*s,-1.2,1.3);ctx.stroke();ctx.fillStyle='#FFB6C1';ctx.beginPath();ctx.arc(x,y+3*s+b,3*s,0,Math.PI*2);ctx.fill();EYE(ctx,x-2*s,y-6*s+b,1*s,'#FFF0B3');EYE(ctx,x+2*s,y-6*s+b,1*s,'#FFF0B3');}

const SHIKIGAMI_MAP = Object.fromEntries(SHIKIGAMI.map(s => [s.id, s]));
export const getShikigami = (id) => SHIKIGAMI_MAP[id] || null;

// Each Shikigami grants +0.5 to one stat in combat (silently — not reflected in
// the stats screen). The shop description tells the player which stat it boosts.
const SHIKIGAMI_STATS = {
  kitsune: 'power', kuro: 'defense', tora: 'power', rai: 'speed', kaze: 'speed',
  hana: 'utility', yuki: 'defense', mizu: 'control', hi: 'power', tsuki: 'control',
  sora: 'speed', kumo: 'utility', kage: 'power', akuma: 'power', koi: 'control',
  mori: 'defense', ishi: 'defense', hoshi: 'utility', nami: 'control', kaminari: 'speed',
  tsubaki: 'power', kumoji: 'utility', hebi: 'control', tanuki: 'utility', karasu: 'speed',
  ryuu: 'power', cho: 'speed', sakura: 'utility', hotaru: 'utility', shiro: 'defense',
  yatagarasu: 'power', kappa: 'defense', tengu: 'speed', bakeneko: 'control', nekomata: 'utility',
  jorogumo: 'control', rokurokubi: 'utility', nurarihyon: 'defense', kodama: 'utility', baku: 'control',
  nue: 'power', gashadokuro: 'defense', raiju: 'speed', kamaitachi: 'speed', kawauso: 'utility',
  shuten: 'power', tamamo: 'control', yuki_onna: 'defense', ubume: 'utility', futakuchi: 'control',
  akaname: 'utility', mokumokuren: 'control', konaki: 'defense', ittan: 'speed', rokuro: 'utility',
  tsukumogami: 'defense', onryo: 'control', hannya: 'power', namahage: 'defense', otoroshi: 'power',
  zashiki: 'utility', inari: 'speed', satori: 'control', ama_no: 'power', shirime: 'speed',
  amefuri: 'defense', kijimuna: 'utility', shisa: 'defense', ama_bie: 'control', umibozu: 'power',
  isogashi: 'speed', shiranui: 'utility', hitodama: 'control', kudan: 'defense', bakekujira: 'power',
  shogunrei: 'power', komainu: 'defense', kitsune_bi: 'speed', tatarimokke: 'control', enko: 'utility',
};
export const getShikigamiStat = (id) => SHIKIGAMI_STATS[id] || null;
// Apply the +0.5 Shikigami stat bonus to a stats object (returns a new object).
export function applyShikigamiStat(stats, shikigamiId) {
  if (!shikigamiId || !SHIKIGAMI_STATS[shikigamiId]) return stats;
  const stat = SHIKIGAMI_STATS[shikigamiId];
  return { ...stats, [stat]: (stats[stat] || 5) + 0.5 };
}

// ── Per-design draw functions ── each paints centered at (x, y), ~40px tall.
function drawKitsune(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 18 * s, '#FFEECC', 0.4);
  // two tails with gradient + sway
  ctx.save(); ctx.translate(x - 6 * s, y + 8 * s + bob);
  for (let i = 0; i < 2; i++) { const a = (i ? 1 : -1) + Math.sin(f * 0.04 + i) * 0.3; ctx.save(); ctx.rotate(a); SHADE(ctx, 0, 9 * s, 4 * s, 12 * s, 0, '#FFFFFF', '#FFF6E0'); ctx.restore(); } ctx.restore();
  SHADE(ctx, x, y + bob, 11 * s, 9 * s, 0, '#FFFFFF', '#FFF6E0'); // body
  SHADE(ctx, x, y - 8 * s + bob, 8 * s, 7.5 * s, 0, '#FFFFFF', '#FFF6E0'); // head
  // red cheek markings
  ctx.save(); ctx.globalAlpha = 0.7; ELL(ctx, x - 5 * s, y - 6 * s + bob, 2 * s, 1.2 * s, 0.3, '#FF3322'); ELL(ctx, x + 5 * s, y - 6 * s + bob, 2 * s, 1.2 * s, -0.3, '#FF3322'); ctx.restore();
  EYE(ctx, x - 3 * s, y - 9 * s + bob, 1.8 * s, '#FF3322'); EYE(ctx, x + 3 * s, y - 9 * s + bob, 1.8 * s, '#FF3322');
  ctx.fillStyle = '#FF3322'; ctx.beginPath(); ctx.moveTo(x, y - 5 * s + bob); ctx.lineTo(x - 2 * s, y - 3 * s + bob); ctx.lineTo(x + 2 * s, y - 3 * s + bob); ctx.fill();
  EAR(ctx, x - 6 * s, y - 13 * s + bob, s, '#FFFFFF', '#FFDDEE'); EAR(ctx, x + 6 * s, y - 13 * s + bob, s, '#FFFFFF', '#FFDDEE');
  // orbiting embers
  for (let i = 0; i < 3; i++) ORB(ctx, x, y + bob, f, 15 * s, i, 0.06, 1.1 * s, '#FF8844');
}
function drawKuro(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#7744AA', 0.3);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#1A1A22', '#332244');
  SHADE(ctx, x, y - 8 * s + bob, 7 * s, 6.5 * s, 0, '#1A1A22', '#2A2A3A');
  // smoky tail with wisps
  ctx.save(); ctx.globalAlpha = 0.65; ELL(ctx, x - 9 * s, y + 6 * s + bob, 5 * s, 10 * s, 0.4, '#1A1A22'); ctx.restore();
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = 0.3; CIR(ctx, x - 11 * s - i * 2 * s + Math.sin(f * 0.05 + i) * 2, y + 10 * s + bob + i * 3, (3 - i * 0.6) * s, '#332244'); ctx.restore(); }
  EYE(ctx, x - 3 * s, y - 9 * s + bob, 1.6 * s, '#AA66FF'); EYE(ctx, x + 3 * s, y - 9 * s + bob, 1.6 * s, '#AA66FF');
  EAR(ctx, x - 6 * s, y - 13 * s + bob, s, '#1A1A22', '#332244'); EAR(ctx, x + 6 * s, y - 13 * s + bob, s, '#1A1A22', '#332244');
}
function drawTora(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#FF8800', 0.35);
  ctx.save(); ctx.globalAlpha = 0.75; SHADE(ctx, x - 10 * s, y + 4 * s + bob, 4 * s, 11 * s, 0.5, '#FFCC44', '#FFEEBB'); ctx.restore();
  SHADE(ctx, x, y + 2 * s + bob, 11 * s, 8.5 * s, 0, '#FF8800', '#FFAA44');
  SHADE(ctx, x, y - 8 * s + bob, 7 * s, 6.5 * s, 0, '#FF8800', '#FFAA44');
  // dark stripes
  ctx.strokeStyle = '#221100'; ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round';
  [0, 1, 2].forEach(i => { const yy = y - 12 * s + i * 4 * s + bob; ctx.beginPath(); ctx.moveTo(x - 6 * s, yy); ctx.lineTo(x - 2 * s, yy); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(x - 7 * s, y - 2 * s + bob); ctx.lineTo(x - 3 * s, y - 1 * s + bob); ctx.stroke();
  EYE(ctx, x - 3 * s, y - 9 * s + bob, 1.7 * s, '#220000'); EYE(ctx, x + 3 * s, y - 9 * s + bob, 1.7 * s, '#220000');
  ctx.fillStyle = '#221100'; ctx.beginPath(); ctx.moveTo(x, y - 5 * s + bob); ctx.lineTo(x - 2 * s, y - 3 * s + bob); ctx.lineTo(x + 2 * s, y - 3 * s + bob); ctx.fill();
  EAR(ctx, x - 6 * s, y - 13 * s + bob, s, '#FF8800', '#221100'); EAR(ctx, x + 6 * s, y - 13 * s + bob, s, '#FF8800', '#221100');
}
function drawRai(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.08) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFFF44', 0.35);
  SHADE(ctx, x, y + 2 * s + bob, 9 * s, 7.5 * s, 0, '#332244', '#4A3A66');
  const wf = Math.sin(f * 0.15) * 0.4;
  ctx.save(); ctx.translate(x - 7 * s, y + bob); ctx.rotate(-0.5 + wf); SHADE(ctx, 0, 0, 6 * s, 11 * s, 0, '#332244', '#4A3A66'); ctx.restore();
  ctx.save(); ctx.translate(x + 7 * s, y + bob); ctx.rotate(0.5 - wf); SHADE(ctx, 0, 0, 6 * s, 11 * s, 0, '#332244', '#4A3A66'); ctx.restore();
  SHADE(ctx, x, y - 8 * s + bob, 6 * s, 5.5 * s, 0, '#332244', '#4A3A66');
  // beak
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x, y - 6 * s + bob); ctx.lineTo(x - 2 * s, y - 4 * s + bob); ctx.lineTo(x + 2 * s, y - 4 * s + bob); ctx.fill();
  EYE(ctx, x - 2.5 * s, y - 9 * s + bob, 1.5 * s, '#FFFF44'); EYE(ctx, x + 2.5 * s, y - 9 * s + bob, 1.5 * s, '#FFFF44');
  // electric sparks — jagged mini bolts
  ctx.strokeStyle = '#FFFF66'; ctx.lineWidth = 1.2 * s; ctx.globalAlpha = 0.8;
  for (let i = 0; i < 3; i++) { const a = f * 0.1 + i * 2.1; const sx = x + Math.cos(a) * 13 * s, sy = y + Math.sin(a) * 9 * s + bob; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 3 * s, sy - 4 * s); ctx.lineTo(sx - 1 * s, sy - 5 * s); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
function drawKaze(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.07) * 2 * s;
  // swirling wind arcs
  ctx.save(); ctx.strokeStyle = '#AADDFF'; ctx.lineWidth = 1.8 * s; ctx.globalAlpha = 0.55; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const r = (10 + i * 5) * s + Math.sin(f * 0.05 + i) * 2; ctx.beginPath(); ctx.arc(x, y + bob, r, f * 0.04 + i, f * 0.04 + i + 1.6); ctx.stroke(); }
  ctx.restore();
  SHADE(ctx, x, y + 2 * s + bob, 8 * s, 7 * s, 0, '#AADDFF', '#DDEEFF');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#AADDFF', '#DDEEFF');
  const wf = Math.sin(f * 0.12) * 0.3;
  ctx.save(); ctx.translate(x - 6 * s, y + bob); ctx.rotate(-0.5 + wf); SHADE(ctx, 0, 0, 5 * s, 9 * s, 0, '#BBE0FF', '#FFFFFF'); ctx.restore();
  ctx.save(); ctx.translate(x + 6 * s, y + bob); ctx.rotate(0.5 - wf); SHADE(ctx, 0, 0, 5 * s, 9 * s, 0, '#BBE0FF', '#FFFFFF'); ctx.restore();
  EYE(ctx, x - 2.5 * s, y - 8 * s + bob, 1.4 * s, '#224466'); EYE(ctx, x + 2.5 * s, y - 8 * s + bob, 1.4 * s, '#224466');
  // drifting breeze motes
  for (let i = 0; i < 4; i++) ORB(ctx, x, y + bob, f, 16 * s, i, 0.05, 1 * s, '#DDEEFF', i);
}
function drawHana(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#FF66AA', 0.3);
  SHADE(ctx, x, y + 3 * s + bob, 9 * s, 7 * s, 0, '#FFDDEE', '#FFEEF5');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFDDEE', '#FFEEF5');
  // antlers with blossoms
  ctx.strokeStyle = '#AA6655'; ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 4 * s, y - 12 * s + bob); ctx.quadraticCurveTo(x - 7 * s, y - 16 * s + bob, x - 8 * s, y - 19 * s + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 4 * s, y - 12 * s + bob); ctx.quadraticCurveTo(x + 7 * s, y - 16 * s + bob, x + 8 * s, y - 19 * s + bob); ctx.stroke();
  [0, 1].forEach(i => { CIR(ctx, x - 8 * s + i * 2 * s, y - 19 * s + bob, 2.2 * s, '#FF99CC'); CIR(ctx, x - 8 * s + i * 2 * s, y - 19 * s + bob, 1 * s, '#FFDDEE'); CIR(ctx, x + 8 * s - i * 2 * s, y - 19 * s + bob, 2.2 * s, '#FF99CC'); CIR(ctx, x + 8 * s - i * 2 * s, y - 19 * s + bob, 1 * s, '#FFDDEE'); });
  // flower cheek marks
  ctx.save(); ctx.globalAlpha = 0.8; ELL(ctx, x - 4 * s, y - 6 * s + bob, 1.6 * s, 1 * s, 0.3, '#FF66AA'); ELL(ctx, x + 4 * s, y - 6 * s + bob, 1.6 * s, 1 * s, -0.3, '#FF66AA'); ctx.restore();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#FF66AA'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#FF66AA');
  // falling petals
  for (let i = 0; i < 4; i++) { const a = f * 0.02 + i * 1.6; const px = x + Math.cos(a) * 14 * s; const py = y + ((f * 0.4 + i * 24) % 20 - 10) * s + bob; ctx.save(); ctx.translate(px, py); ctx.rotate(a); ELL(ctx, 0, 0, 2 * s, 1.2 * s, 0, '#FFCCEE'); ctx.restore(); }
}
function drawYuki(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#88CCFF', 0.35);
  SHADE(ctx, x, y + 3 * s + bob, 9 * s, 8 * s, 0, '#FFFFFF', '#EEF6FF');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFFFFF', '#EEF6FF');
  // ears with icy inner
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 11 * s + bob); ctx.lineTo(x - 3 * s, y - 16 * s + bob); ctx.lineTo(x - 1 * s, y - 11 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 5 * s, y - 11 * s + bob); ctx.lineTo(x + 3 * s, y - 16 * s + bob); ctx.lineTo(x + 1 * s, y - 11 * s + bob); ctx.fill();
  ctx.fillStyle = '#88CCFF'; ctx.beginPath(); ctx.moveTo(x - 4 * s, y - 11.5 * s + bob); ctx.lineTo(x - 3 * s, y - 14.5 * s + bob); ctx.lineTo(x - 2 * s, y - 11.5 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 4 * s, y - 11.5 * s + bob); ctx.lineTo(x + 3 * s, y - 14.5 * s + bob); ctx.lineTo(x + 2 * s, y - 11.5 * s + bob); ctx.fill();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#88CCFF'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#88CCFF');
  // snowflake particles
  for (let i = 0; i < 5; i++) { const a = f * 0.03 + i * 1.25; const px = x + Math.cos(a) * 13 * s; const py = y + Math.sin(a) * 10 * s + bob; ctx.save(); ctx.translate(px, py); ctx.rotate(a * 2); ctx.strokeStyle = '#DDEEFF'; ctx.lineWidth = 0.8 * s; for (let j = 0; j < 3; j++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-1.5 * s, 0); ctx.lineTo(1.5 * s, 0); ctx.stroke(); } ctx.restore(); }
}
function drawMizu(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 3 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#4488FF', 0.35);
  ctx.save(); ctx.globalAlpha = 0.75;
  SHADE(ctx, x, y + bob, 12 * s, 7 * s, Math.sin(f * 0.04) * 0.2, '#4488FF', '#88BBFF');
  // tail fin with wave
  ctx.save(); ctx.translate(x - 11 * s, y + bob); ctx.rotate(Math.sin(f * 0.08) * 0.4); SHADE(ctx, 0, 0, 4 * s, 8 * s, 0, '#AAEEFF', '#FFFFFF'); ctx.restore();
  ctx.restore();
  SHADE(ctx, x + 7 * s, y - 2 * s + bob, 5 * s, 4.5 * s, 0, '#4488FF', '#88BBFF');
  EYE(ctx, x + 5 * s, y - 3 * s + bob, 1.4 * s, '#FFFFFF', '#224488');
  // dorsal fin
  ctx.save(); ctx.globalAlpha = 0.65; ELL(ctx, x, y - 7 * s + bob, 4 * s, 3 * s, 0.3, '#AAEEFF'); ctx.restore();
  // water droplets
  for (let i = 0; i < 3; i++) ORB(ctx, x, y + bob, f, 15 * s, i, 0.07, 1 * s, '#AAEEFF', i * 0.5);
}
function drawHi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.07) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#FF4422', 0.4);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 6.5 * s, 0, '#FF4422', '#FF7755');
  SHADE(ctx, x + 6 * s, y + bob, 5 * s, 4.5 * s, 0, '#FF4422', '#FF7755');
  // flame aura — layered flickering tongues
  ctx.save(); ctx.globalAlpha = 0.55;
  for (let i = 0; i < 4; i++) { const h = (9 + Math.sin(f * 0.12 + i) * 4) * s; const fx = x - 8 * s + i * 5 * s; ctx.fillStyle = i % 2 ? '#FFAA22' : '#FF6622'; ctx.beginPath(); ctx.moveTo(fx, y + 8 * s + bob); ctx.quadraticCurveTo(fx + 2 * s, y + 8 * s - h * 0.6 + bob, fx, y + 8 * s - h + bob); ctx.quadraticCurveTo(fx - 2 * s, y + 8 * s - h * 0.6 + bob, fx, y + 8 * s + bob); ctx.fill(); }
  ctx.restore();
  EYE(ctx, x + 4 * s, y - 1 * s + bob, 1.4 * s, '#FFFF88'); EYE(ctx, x + 8 * s, y - 1 * s + bob, 1.4 * s, '#FFFF88');
  // ember sparks
  for (let i = 0; i < 3; i++) { const py = y + 12 * s + bob - ((f * 0.5 + i * 20) % 24) * s; CIR(ctx, x - 6 * s + i * 6 * s, py, 1 * s, '#FFCC44'); }
}
function drawTsuki(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#DDEEFF', 0.45);
  SHADE(ctx, x, y + 3 * s + bob, 9 * s, 8 * s, 0, '#CCCCCC', '#EEEEEE');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#CCCCCC', '#EEEEEE');
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 11 * s + bob); ctx.lineTo(x - 3 * s, y - 16 * s + bob); ctx.lineTo(x - 1 * s, y - 11 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 5 * s, y - 11 * s + bob); ctx.lineTo(x + 3 * s, y - 16 * s + bob); ctx.lineTo(x + 1 * s, y - 11 * s + bob); ctx.fill();
  // crescent moon marking on forehead
  ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#DDEEFF'; ctx.beginPath(); ctx.arc(x, y - 7 * s + bob, 3.5 * s, 0.4, Math.PI * 1.4); ctx.fill(); ctx.restore();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.4 * s, '#88AAFF'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.4 * s, '#88AAFF');
  // twinkling stars
  for (let i = 0; i < 3; i++) { const a = f * 0.04 + i * 2; const px = x + Math.cos(a) * 15 * s, py = y + Math.sin(a) * 11 * s + bob; ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); for (let j = 0; j < 4; j++) { ctx.rotate(Math.PI / 2); ctx.moveTo(0, 0); ctx.lineTo(1.2 * s, 0); } ctx.lineWidth = 0.8 * s; ctx.strokeStyle = '#FFFFFF'; for (let j = 0; j < 4; j++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1.4 * s, 0); ctx.stroke(); } ctx.restore(); }
}
function drawSora(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFFFFF', 0.35);
  SHADE(ctx, x, y + 2 * s + bob, 9 * s, 7 * s, 0, '#FFFFFF', '#EEF6FF');
  const wf = Math.sin(f * 0.1) * 0.4;
  ctx.save(); ctx.translate(x - 7 * s, y + bob); ctx.rotate(-0.4 + wf); SHADE(ctx, 0, 0, 5 * s, 11 * s, 0, '#FFFFFF', '#DDEEFF'); ctx.restore();
  ctx.save(); ctx.translate(x + 7 * s, y + bob); ctx.rotate(0.4 - wf); SHADE(ctx, 0, 0, 5 * s, 11 * s, 0, '#FFFFFF', '#DDEEFF'); ctx.restore();
  // blue wing feather patterns
  ctx.strokeStyle = '#88AAFF'; ctx.lineWidth = 1 * s; ctx.globalAlpha = 0.6; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 4 * s + bob + i * 3 * s); ctx.lineTo(x - 5 * s, y + bob + i * 3 * s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 9 * s, y - 4 * s + bob + i * 3 * s); ctx.lineTo(x + 5 * s, y + bob + i * 3 * s); ctx.stroke(); }
  ctx.globalAlpha = 1;
  SHADE(ctx, x, y - 8 * s + bob, 5 * s, 4.5 * s, 0, '#FFFFFF', '#EEF6FF');
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x, y - 7 * s + bob); ctx.lineTo(x - 2 * s, y - 5 * s + bob); ctx.lineTo(x + 2 * s, y - 5 * s + bob); ctx.fill();
  EYE(ctx, x - 2 * s, y - 9 * s + bob, 1.3 * s, '#224466'); EYE(ctx, x + 2 * s, y - 9 * s + bob, 1.3 * s, '#224466');
}
function drawKumo(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  SHADE(ctx, x, y + bob, 10 * s, 7 * s, 0, '#888888', '#AAAAAA');
  SHADE(ctx, x, y - 7 * s + bob, 5 * s, 4.5 * s, 0, '#999999', '#BBBBBB');
  // legs with little feet
  ctx.strokeStyle = '#888888'; ctx.lineWidth = 1.3 * s; ctx.lineCap = 'round';
  [0, 1, 2, 3].forEach(i => { const lx = x - 7 * s + i * 5 * s; ctx.beginPath(); ctx.moveTo(lx, y + 5 * s + bob); ctx.lineTo(lx + Math.sin(f * 0.05 + i) * 2 * s, y + 11 * s + bob); ctx.stroke(); CIR(ctx, lx + Math.sin(f * 0.05 + i) * 2 * s, y + 11 * s + bob, 1.2 * s, '#777777'); });
  EYE(ctx, x - 2 * s, y - 8 * s + bob, 1.4 * s, '#FF4444'); EYE(ctx, x + 2 * s, y - 8 * s + bob, 1.4 * s, '#FF4444');
  // floating web beneath
  ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = '#DDDDDD'; ctx.lineWidth = 0.8 * s;
  const wy = y + 14 * s + bob;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x - 9 * s + i * 4.5 * s, wy + 6 * s); ctx.stroke(); }
  for (let r = 3; r <= 9; r += 3) { ctx.beginPath(); ctx.ellipse(x, wy + 2 * s, r * s, r * 0.4 * s, 0, 0, Math.PI); ctx.stroke(); }
  ctx.restore();
}
function drawKage(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#000000', 0.35);
  ctx.save(); ctx.globalAlpha = 0.75;
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 7 * s, 0, '#222233', '#332244'); SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#222233', '#332244');
  // smoky fading edges
  for (let i = 0; i < 6; i++) { const a = f * 0.03 + i * 1.05; CIR(ctx, x + Math.cos(a) * 13 * s, y + Math.sin(a) * 10 * s + bob, 2.2 * s, '#111122'); }
  ctx.restore();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.6 * s, '#FFAA00'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.6 * s, '#FFAA00');
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#222233', '#111122'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#222233', '#111122');
}
function drawAkuma(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.07) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#DD2222', 0.35);
  SHADE(ctx, x, y + 3 * s + bob, 9 * s, 8 * s, 0, '#DD2222', '#FF5555');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#DD2222', '#FF5555');
  // horns with gradient
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 11 * s + bob); ctx.lineTo(x - 7 * s, y - 16 * s + bob); ctx.lineTo(x - 3 * s, y - 12 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 5 * s, y - 11 * s + bob); ctx.lineTo(x + 7 * s, y - 16 * s + bob); ctx.lineTo(x + 3 * s, y - 12 * s + bob); ctx.fill();
  ctx.fillStyle = '#FFDD66'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 11 * s + bob); ctx.lineTo(x - 6 * s, y - 14 * s + bob); ctx.lineTo(x - 4 * s, y - 12 * s + bob); ctx.fill();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.6 * s, '#FFFF44'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.6 * s, '#FFFF44');
  // mischievous mouth with fangs
  ctx.strokeStyle = '#660000'; ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.arc(x, y - 4 * s + bob, 2.2 * s, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x - 1.5 * s, y - 2.5 * s + bob); ctx.lineTo(x - 0.8 * s, y - 1.5 * s + bob); ctx.lineTo(x - 0.3 * s, y - 2.5 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 1.5 * s, y - 2.5 * s + bob); ctx.lineTo(x + 0.8 * s, y - 1.5 * s + bob); ctx.lineTo(x + 0.3 * s, y - 2.5 * s + bob); ctx.fill();
}
function drawKoi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 3 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFD700', 0.3);
  ctx.save(); ctx.globalAlpha = 0.9;
  SHADE(ctx, x, y + bob, 12 * s, 7 * s, Math.sin(f * 0.04) * 0.2, '#FF3344', '#FF6688');
  // white patch
  ctx.save(); ctx.globalAlpha = 0.85; ELL(ctx, x - 2 * s, y - 2 * s + bob, 4 * s, 4 * s, 0, '#FFFFFF'); ctx.restore();
  // black spots
  CIR(ctx, x - 4 * s, y + bob, 1.4 * s, '#220000'); CIR(ctx, x + 3 * s, y - 1 * s + bob, 1.2 * s, '#220000');
  ctx.restore();
  // golden fins with wave
  ctx.save(); ctx.translate(x - 11 * s, y + bob); ctx.rotate(Math.sin(f * 0.08) * 0.4); SHADE(ctx, 0, 0, 4 * s, 7 * s, 0, '#FFD700', '#FFEEBB'); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.75; ELL(ctx, x, y - 7 * s + bob, 4 * s, 3 * s, 0.3, '#FFD700'); ctx.restore();
  SHADE(ctx, x + 7 * s, y - 1 * s + bob, 5 * s, 4.5 * s, 0, '#FF3344', '#FF6688');
  EYE(ctx, x + 5 * s, y - 2 * s + bob, 1.5 * s, '#000000', '#000000');
  // whiskers
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.7 * s; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(x + 10 * s, y + bob); ctx.quadraticCurveTo(x + 14 * s, y - 2 * s + bob, x + 16 * s, y + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 10 * s, y + 2 * s + bob); ctx.quadraticCurveTo(x + 14 * s, y + 4 * s + bob, x + 16 * s, y + 3 * s + bob); ctx.stroke();
  ctx.globalAlpha = 1;
}
function drawMori(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 14 * s, '#44AA44', 0.25);
  SHADE(ctx, x, y + bob, 10 * s, 9 * s, 0, '#8B5A2B', '#A9703A');
  SHADE(ctx, x, y - 9 * s + bob, 6 * s, 5.5 * s, 0, '#8B5A2B', '#A9703A');
  // wood grain rings
  ctx.strokeStyle = '#6B4520'; ctx.lineWidth = 0.8 * s; ctx.globalAlpha = 0.5;
  for (let r = 3; r <= 8; r += 2.5) RING(ctx, x, y + bob, r * s, '#6B4520', 0.8 * s);
  ctx.globalAlpha = 1;
  // leaves on head
  [0, 1, 2].forEach(i => { ctx.save(); ctx.translate(x - 5 * s + i * 5 * s, y - 14 * s + bob); ctx.rotate(i - 1 + Math.sin(f * 0.04 + i) * 0.15); SHADE(ctx, 0, 0, 3 * s, 2 * s, 0, '#44AA44', '#66BB66'); ctx.restore(); });
  EYE(ctx, x - 3 * s, y - 10 * s + bob, 1.4 * s, '#222200'); EYE(ctx, x + 3 * s, y - 10 * s + bob, 1.4 * s, '#222200');
  // little smile
  ctx.strokeStyle = '#6B4520'; ctx.lineWidth = 0.8 * s; ctx.beginPath(); ctx.arc(x, y - 8 * s + bob, 1.5 * s, 0.2, Math.PI - 0.2); ctx.stroke();
}
function drawIshi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.04) * 1.5 * s;
  SHADE(ctx, x, y + 2 * s + bob, 11 * s, 8 * s, 0, '#777766', '#999988');
  // shell hexagon plates
  ctx.strokeStyle = '#555544'; ctx.lineWidth = 0.8 * s; ctx.globalAlpha = 0.5;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const hx = x + i * 4 * s, hy = y + 2 * s + j * 3 * s + bob; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; const px = hx + Math.cos(a) * 2 * s, py = hy + Math.sin(a) * 2 * s; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.stroke(); }
  ctx.globalAlpha = 1;
  SHADE(ctx, x, y - 7 * s + bob, 5 * s, 4.5 * s, 0, '#999988', '#BBBBCA');
  // glowing cracks
  ctx.strokeStyle = '#FFCC44'; ctx.lineWidth = 1.3 * s; ctx.globalAlpha = 0.7 + Math.sin(f * 0.1) * 0.25; ctx.shadowColor = '#FFCC44'; ctx.shadowBlur = 4;
  ctx.beginPath(); ctx.moveTo(x - 8 * s, y + bob); ctx.lineTo(x - 2 * s, y + 4 * s + bob); ctx.lineTo(x + 5 * s, y - 1 * s + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 8 * s, y + 3 * s + bob); ctx.lineTo(x + 2 * s, y - 3 * s + bob); ctx.stroke();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  EYE(ctx, x - 2 * s, y - 8 * s + bob, 1.4 * s, '#FFCC44'); EYE(ctx, x + 2 * s, y - 8 * s + bob, 1.4 * s, '#FFCC44');
  // legs
  ctx.strokeStyle = '#999988'; ctx.lineWidth = 1.4 * s; ctx.lineCap = 'round';
  [0, 1, 2, 3].forEach(i => { const lx = x - 8 * s + i * 5 * s; ctx.beginPath(); ctx.moveTo(lx, y + 8 * s + bob); ctx.lineTo(lx + Math.sin(f * 0.03 + i) * 1.5 * s, y + 12 * s + bob); ctx.stroke(); });
}
function drawHoshi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#FFDD44', 0.45);
  // 5-point star with gradient
  ctx.save(); ctx.translate(x, y + bob); ctx.rotate(f * 0.02);
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 12 * s); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#FFDD44'); g.addColorStop(1, '#FFAA22');
  ctx.fillStyle = g; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const r = (i % 2 ? 4 : 11) * s; const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const px = Math.cos(a) * r, py = Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.fill();
  ctx.restore();
  // orbiting particles with trails
  for (let i = 0; i < 5; i++) { const a = f * 0.06 + i * 1.26; const px = x + Math.cos(a) * 15 * s, py = y + Math.sin(a) * 15 * s + bob; CIR(ctx, px, py, 1.5 * s, '#FFFFFF'); ctx.save(); ctx.globalAlpha = 0.4; CIR(ctx, px, py, 2.5 * s, '#FFDD44'); ctx.restore(); }
  CIR(ctx, x, y + bob, 2 * s, '#FFFFFF');
}
function drawNami(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 3 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#44AAFF', 0.35);
  ctx.save(); ctx.globalAlpha = 0.8;
  // serpent body curve with gradient stroke
  const g = ctx.createLinearGradient(x - 12 * s, y, x + 12 * s, y); g.addColorStop(0, '#44AAFF'); g.addColorStop(0.5, '#88CCFF'); g.addColorStop(1, '#44AAFF');
  ctx.strokeStyle = g; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 12 * s, y + 6 * s + bob);
  ctx.quadraticCurveTo(x - 6 * s, y - 6 * s + bob + Math.sin(f * 0.06) * 3 * s, x, y + 2 * s + bob);
  ctx.quadraticCurveTo(x + 6 * s, y + 10 * s + bob - Math.sin(f * 0.06) * 3 * s, x + 12 * s, y - 2 * s + bob);
  ctx.stroke();
  // fin along the back
  ctx.strokeStyle = '#AAEEFF'; ctx.lineWidth = 2 * s; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(x - 6 * s, y - 2 * s + bob); ctx.lineTo(x - 4 * s, y - 6 * s + bob); ctx.lineTo(x - 2 * s, y - 2 * s + bob); ctx.stroke();
  ctx.restore();
  SHADE(ctx, x + 12 * s, y - 2 * s + bob, 5 * s, 4.5 * s, 0, '#44AAFF', '#88CCFF');
  EYE(ctx, x + 10 * s, y - 3 * s + bob, 1.4 * s, '#FFFFFF', '#224488');
  // water droplets
  for (let i = 0; i < 3; i++) ORB(ctx, x, y + bob, f, 16 * s, i, 0.08, 1.1 * s, '#AAEEFF', i);
}
function drawKaminari(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFFF66', 0.35);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#FFCC22', '#FFE066');
  // tail with sway
  ctx.save(); ctx.translate(x - 9 * s, y + 5 * s + bob); ctx.rotate(Math.sin(f * 0.05) * 0.3); SHADE(ctx, 0, 0, 4 * s, 9 * s, 0, '#FFCC22', '#FFE066'); ctx.restore();
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFCC22', '#FFE066');
  // yellow lightning marking on forehead
  ctx.strokeStyle = '#FFFF66'; ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round'; ctx.shadowColor = '#FFFF66'; ctx.shadowBlur = 3;
  ctx.beginPath(); ctx.moveTo(x - 2 * s, y - 10 * s + bob); ctx.lineTo(x, y - 7 * s + bob); ctx.lineTo(x - 1.5 * s, y - 5 * s + bob); ctx.lineTo(x + 1 * s, y - 3 * s + bob); ctx.stroke();
  ctx.shadowBlur = 0;
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#FFCC22', '#FFE066'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#FFCC22', '#FFE066');
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#222200'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#222200');
  // sparks at paws
  for (let i = 0; i < 3; i++) { const px = x - 6 * s + i * 6 * s; const py = y + 9 * s + bob + Math.sin(f * 0.2 + i) * 2; ctx.strokeStyle = '#FFFF88'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 2 * s, py - 3 * s); ctx.lineTo(px - 1 * s, py - 4 * s); ctx.stroke(); CIR(ctx, px, py, 1.1 * s, '#FFFF88'); }
}
function drawTsubaki(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#CC1133', 0.3);
  SHADE(ctx, x, y + 2 * s + bob, 9 * s, 7 * s, 0, '#CC1133', '#EE4455');
  const wf = Math.sin(f * 0.1) * 0.4;
  ctx.save(); ctx.translate(x - 7 * s, y + bob); ctx.rotate(-0.4 + wf); SHADE(ctx, 0, 0, 5 * s, 10 * s, 0, '#CC1133', '#EE4455'); ctx.restore();
  ctx.save(); ctx.translate(x + 7 * s, y + bob); ctx.rotate(0.4 - wf); SHADE(ctx, 0, 0, 5 * s, 10 * s, 0, '#CC1133', '#EE4455'); ctx.restore();
  // feather lines
  ctx.strokeStyle = '#880022'; ctx.lineWidth = 0.7 * s; ctx.globalAlpha = 0.5;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 7 * s, y - 4 * s + bob + i * 3 * s); ctx.lineTo(x - 3 * s, y + bob + i * 3 * s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 7 * s, y - 4 * s + bob + i * 3 * s); ctx.lineTo(x + 3 * s, y + bob + i * 3 * s); ctx.stroke(); }
  ctx.globalAlpha = 1;
  SHADE(ctx, x, y - 8 * s + bob, 5 * s, 4.5 * s, 0, '#CC1133', '#EE4455');
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x, y - 7 * s + bob); ctx.lineTo(x - 2 * s, y - 5 * s + bob); ctx.lineTo(x + 2 * s, y - 5 * s + bob); ctx.fill();
  EYE(ctx, x - 2 * s, y - 9 * s + bob, 1.3 * s, '#FFCC44'); EYE(ctx, x + 2 * s, y - 9 * s + bob, 1.3 * s, '#FFCC44');
  // camellia flowers with petals
  [0, 1].forEach(i => { const fx = x - 9 * s + i * 18 * s; const fy = y + 4 * s + bob; for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5; ELL(ctx, fx + Math.cos(a) * 2 * s, fy + Math.sin(a) * 2 * s, 1.8 * s, 1.2 * s, a, '#FF6688'); } CIR(ctx, fx, fy, 1.2 * s, '#FFAA00'); });
}
function drawKumoji(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#CCD0FF', 0.35);
  // cloud body (puffs) with soft shading
  const puff = (px, py, r) => { const g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.4, r * 0.1, px, py, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#EEF2FF'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); };
  puff(x - 6 * s, y + 2 * s + bob, 7 * s); puff(x + 6 * s, y + 2 * s + bob, 7 * s); puff(x, y - 1 * s + bob, 9 * s);
  // face
  EYE(ctx, x - 3 * s, y - 1 * s + bob, 1.5 * s, '#334466'); EYE(ctx, x + 3 * s, y - 1 * s + bob, 1.5 * s, '#334466');
  ctx.strokeStyle = '#334466'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.arc(x, y + 2 * s + bob, 2 * s, 0, Math.PI); ctx.stroke();
  // trailing wisps
  ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#CCD0FF';
  for (let i = 0; i < 3; i++) { const wy = y + 8 * s + i * 4 * s + bob; CIR(ctx, x - 4 * s + i * 2 * s + Math.sin(f * 0.05 + i) * 2 * s, wy, 3 * s - i * 0.6 * s, '#CCD0FF'); }
  ctx.restore();
}
function drawHebi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFD700', 0.3);
  ctx.save(); ctx.globalAlpha = 0.9;
  // coiling body with gradient
  const g = ctx.createLinearGradient(x - 12 * s, y, x + 12 * s, y); g.addColorStop(0, '#FFF8DD'); g.addColorStop(0.5, '#FFFFFF'); g.addColorStop(1, '#FFF8DD');
  ctx.strokeStyle = g; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 12 * s, y + 6 * s + bob);
  ctx.quadraticCurveTo(x - 4 * s, y - 8 * s + bob, x + 4 * s, y + 2 * s + bob + Math.sin(f * 0.04) * 3 * s);
  ctx.quadraticCurveTo(x + 10 * s, y + 8 * s + bob, x + 12 * s, y - 4 * s + bob);
  ctx.stroke();
  // gold stripe overlay
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5 * s; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(x - 10 * s, y + 5 * s + bob); ctx.quadraticCurveTo(x - 3 * s, y - 6 * s + bob, x + 4 * s, y + bob); ctx.stroke();
  ctx.restore();
  SHADE(ctx, x + 12 * s, y - 4 * s + bob, 5 * s, 4.5 * s, 0, '#FFF8DD', '#FFFFFF');
  // forked tongue
  ctx.strokeStyle = '#FF6688'; ctx.lineWidth = 0.8 * s; ctx.beginPath(); ctx.moveTo(x + 16 * s, y - 4 * s + bob); ctx.lineTo(x + 19 * s, y - 5 * s + bob); ctx.moveTo(x + 16 * s, y - 4 * s + bob); ctx.lineTo(x + 19 * s, y - 3 * s + bob); ctx.stroke();
  EYE(ctx, x + 10 * s, y - 5 * s + bob, 1.4 * s, '#FFD700', '#AA7700');
}
function drawTanuki(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 14 * s, '#66AA44', 0.25);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#885533', '#A9703A');
  // striped tail
  ctx.save(); ctx.translate(x - 10 * s, y + 5 * s + bob); ctx.rotate(Math.sin(f * 0.05) * 0.3); SHADE(ctx, 0, 0, 4 * s, 8 * s, 0, '#885533', '#A9703A'); ctx.fillStyle = '#A07744'; ctx.fillRect(-2 * s, -7 * s, 4 * s, 2 * s); ctx.fillRect(-2 * s, -1 * s, 4 * s, 2 * s); ctx.restore();
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#885533', '#A9703A');
  // leaf on head
  ctx.save(); ctx.translate(x, y - 14 * s + bob); ctx.rotate(0.3 + Math.sin(f * 0.04) * 0.1); const lg = ctx.createLinearGradient(-3 * s, 0, 3 * s, 0); lg.addColorStop(0, '#88BB66'); lg.addColorStop(1, '#44AA44'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(0, 0, 3 * s, 1.8 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#885533', '#A9703A'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#885533', '#A9703A');
  // mask-like face marking
  ctx.save(); ctx.globalAlpha = 0.5; ELL(ctx, x, y - 4 * s + bob, 4 * s, 3 * s, 0, '#DDCCAA'); ctx.restore();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#221100'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#221100');
}
function drawKarasu(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.07) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#6644AA', 0.3);
  SHADE(ctx, x, y + 2 * s + bob, 9 * s, 8 * s, 0, '#111118', '#332244');
  const wf = Math.sin(f * 0.12) * 0.4;
  ctx.save(); ctx.translate(x - 7 * s, y + bob); ctx.rotate(-0.4 + wf); SHADE(ctx, 0, 0, 5 * s, 11 * s, 0, '#111118', '#332244'); ctx.restore();
  ctx.save(); ctx.translate(x + 7 * s, y + bob); ctx.rotate(0.4 - wf); SHADE(ctx, 0, 0, 5 * s, 11 * s, 0, '#111118', '#332244'); ctx.restore();
  // blue-purple feather highlights
  ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#6644AA';
  ctx.beginPath(); ctx.ellipse(x - 7 * s, y + bob, 3 * s, 8 * s, -0.4 + wf, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 7 * s, y + bob, 3 * s, 8 * s, 0.4 - wf, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  SHADE(ctx, x, y - 8 * s + bob, 5 * s, 4.5 * s, 0, '#111118', '#332244');
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x, y - 7 * s + bob); ctx.lineTo(x - 2.5 * s, y - 4 * s + bob); ctx.lineTo(x + 2.5 * s, y - 4 * s + bob); ctx.fill();
  EYE(ctx, x - 2 * s, y - 9 * s + bob, 1.4 * s, '#FFCC44'); EYE(ctx, x + 2 * s, y - 9 * s + bob, 1.4 * s, '#FFCC44');
}
function drawRyuu(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#226644', 0.35);
  ctx.save(); ctx.globalAlpha = 0.92;
  // serpent body with scale gradient
  const g = ctx.createLinearGradient(x - 12 * s, y, x + 12 * s, y); g.addColorStop(0, '#226644'); g.addColorStop(0.5, '#339966'); g.addColorStop(1, '#226644');
  ctx.strokeStyle = g; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 12 * s, y + 6 * s + bob);
  ctx.quadraticCurveTo(x - 4 * s, y - 6 * s + bob, x + 2 * s, y + 2 * s + bob + Math.sin(f * 0.05) * 3 * s);
  ctx.quadraticCurveTo(x + 8 * s, y + 8 * s + bob, x + 12 * s, y - 2 * s + bob);
  ctx.stroke();
  // scale highlight ridges
  ctx.strokeStyle = '#88FFAA'; ctx.lineWidth = 1 * s; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.moveTo(x - 10 * s, y + 5 * s + bob); ctx.quadraticCurveTo(x - 3 * s, y - 5 * s + bob, x + 2 * s, y + bob); ctx.stroke();
  ctx.restore();
  SHADE(ctx, x + 12 * s, y - 2 * s + bob, 6 * s, 5.5 * s, 0, '#226644', '#339966');
  // horns
  ctx.fillStyle = '#88FFAA'; ctx.beginPath(); ctx.moveTo(x + 10 * s, y - 7 * s + bob); ctx.lineTo(x + 8 * s, y - 12 * s + bob); ctx.lineTo(x + 12 * s, y - 8 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 14 * s, y - 7 * s + bob); ctx.lineTo(x + 16 * s, y - 12 * s + bob); ctx.lineTo(x + 13 * s, y - 8 * s + bob); ctx.fill();
  // whiskers
  ctx.strokeStyle = '#88FFAA'; ctx.lineWidth = 0.8 * s; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(x + 16 * s, y + bob); ctx.quadraticCurveTo(x + 20 * s, y - 2 * s + bob, x + 22 * s, y + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 16 * s, y + 2 * s + bob); ctx.quadraticCurveTo(x + 20 * s, y + 4 * s + bob, x + 22 * s, y + 3 * s + bob); ctx.stroke();
  ctx.globalAlpha = 1;
  EYE(ctx, x + 10 * s, y - 3 * s + bob, 1.5 * s, '#FFCC44'); EYE(ctx, x + 14 * s, y - 3 * s + bob, 1.5 * s, '#FFCC44');
  // smoke trail
  ctx.save(); ctx.globalAlpha = 0.3; for (let i = 0; i < 3; i++) CIR(ctx, x - 14 * s - i * 4 * s, y + 8 * s + bob - i * 2 * s, (3 - i * 0.5) * s, '#88FFAA'); ctx.restore();
}
function drawCho(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.08) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#AA55FF', 0.35);
  const wf = Math.sin(f * 0.15) * 0.5;
  // wings with gradient + vein lines
  const wing = (sx) => { ctx.save(); ctx.globalAlpha = 0.75; ctx.translate(x + sx * 6 * s, y + bob); ctx.rotate(-0.3 * sx + wf * sx); const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 9 * s); g.addColorStop(0, '#CC88FF'); g.addColorStop(1, '#8833CC'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 7 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#6622AA'; ctx.lineWidth = 0.6 * s; ctx.globalAlpha = 0.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sx * 6 * s, (i - 1) * 5 * s); ctx.stroke(); } ctx.restore(); };
  wing(-1); wing(1);
  SHADE(ctx, x, y + bob, 2.5 * s, 7 * s, 0, '#8833CC', '#AA55FF');
  SHADE(ctx, x, y - 6 * s + bob, 2.5 * s, 2.3 * s, 0, '#8833CC', '#AA55FF');
  // antennae with glowing tips
  ctx.strokeStyle = '#8833CC'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(x - 1 * s, y - 8 * s + bob); ctx.lineTo(x - 3 * s, y - 12 * s + bob); ctx.moveTo(x + 1 * s, y - 8 * s + bob); ctx.lineTo(x + 3 * s, y - 12 * s + bob); ctx.stroke();
  CIR(ctx, x - 3 * s, y - 12 * s + bob, 1.2 * s, '#FFCCFF'); CIR(ctx, x + 3 * s, y - 12 * s + bob, 1.2 * s, '#FFCCFF');
  EYE(ctx, x - 1.5 * s, y - 7 * s + bob, 1.1 * s, '#FFFFFF', '#000000'); EYE(ctx, x + 1.5 * s, y - 7 * s + bob, 1.1 * s, '#FFFFFF', '#000000');
}
function drawSakura(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#FF77BB', 0.3);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#FFAADD', '#FFCCDD');
  ctx.save(); ctx.translate(x - 9 * s, y + 5 * s + bob); ctx.rotate(Math.sin(f * 0.05) * 0.3); SHADE(ctx, 0, 0, 4 * s, 9 * s, 0, '#FFAADD', '#FFCCDD'); ctx.restore();
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFAADD', '#FFCCDD');
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#FFAADD', '#FFCCDD'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#FFAADD', '#FFCCDD');
  // blossom mark on forehead
  for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5 - Math.PI / 2; ELL(ctx, x + Math.cos(a) * 2 * s, y - 9 * s + bob + Math.sin(a) * 2 * s, 1.2 * s, 0.8 * s, a, '#FFFFFF'); }
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#AA3366'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#AA3366');
  // falling petals
  for (let i = 0; i < 6; i++) { const a = f * 0.02 + i * 1.05; const px = x + Math.cos(a) * 15 * s; const py = y + ((f * 0.5 + i * 26) % 26 - 13) * s + bob; ctx.save(); ctx.translate(px, py); ctx.rotate(a + f * 0.05); ELL(ctx, 0, 0, 2 * s, 1.3 * s, 0, '#FFCCEE'); ctx.restore(); }
}
function drawHotaru(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  const glow = 0.45 + Math.sin(f * 0.12) * 0.3;
  GLOW(ctx, x, y + bob, 18 * s, '#CCFF44', glow);
  SHADE(ctx, x, y + 2 * s + bob, 4 * s, 8 * s, 0, '#886622', '#AA8844');
  SHADE(ctx, x, y - 7 * s + bob, 3.5 * s, 3.2 * s, 0, '#886622', '#AA8844');
  // glowing abdomen
  const ag = ctx.createRadialGradient(x, y + 6 * s + bob, 1, x, y + 6 * s + bob, 6 * s); ag.addColorStop(0, '#FFFFAA'); ag.addColorStop(0.5, '#CCFF44'); ag.addColorStop(1, 'rgba(136,255,68,0)');
  ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(x, y + 6 * s + bob, 5 * s, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.6; CIR(ctx, x, y + 6 * s + bob, 7 * s, '#FFFFAA'); ctx.restore();
  EYE(ctx, x - 2 * s, y - 8 * s + bob, 1.2 * s, '#222200'); EYE(ctx, x + 2 * s, y - 8 * s + bob, 1.2 * s, '#222200');
  // wings (delicate)
  ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.6 * s;
  ctx.beginPath(); ctx.ellipse(x - 4 * s, y + bob, 4 * s, 2 * s, -0.3, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + 4 * s, y + bob, 4 * s, 2 * s, 0.3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  // light particles
  for (let i = 0; i < 5; i++) { const a = f * 0.05 + i * 1.26; const px = x + Math.cos(a) * 13 * s, py = y + Math.sin(a) * 10 * s + bob; ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(f * 0.1 + i) * 0.4; CIR(ctx, px, py, 1.2 * s, '#FFFFAA'); ctx.restore(); }
}
function drawShiro(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#AABBFF', 0.35);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#FFFFFF', '#EEF2FF');
  ctx.save(); ctx.globalAlpha = 0.6; SHADE(ctx, x - 9 * s, y + 5 * s + bob, 4 * s, 9 * s, 0.3, '#FFFFFF', '#EEF2FF'); ctx.restore();
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFFFFF', '#EEF2FF');
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#FFFFFF', '#DDEEFF'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#FFFFFF', '#DDEEFF');
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.6 * s, '#AABBFF'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.6 * s, '#AABBFF');
  // nose
  ctx.fillStyle = '#8899CC'; ctx.beginPath(); ctx.ellipse(x, y - 5 * s + bob, 1.2 * s, 0.8 * s, 0, 0, Math.PI * 2); ctx.fill();
  // silver aura sparkles
  for (let i = 0; i < 4; i++) { const a = f * 0.04 + i * 1.6; const px = x + Math.cos(a) * 15 * s, py = y + Math.sin(a) * 11 * s + bob; ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(f * 0.08 + i) * 0.4; CIR(ctx, px, py, 1.1 * s, '#CCDDEE'); ctx.restore(); }
}

// ── Follower: smooth follow + idle bob. Purely visual, no gameplay state. ──
// Caches the smoothed position on fighter._shikigamiState so it persists
// across frames. Draws the shikigami behind & slightly above the fighter.
export function drawShikigamiFollower(ctx, fighter, shikigamiId, frame, scale = 1) {
  const def = shikigamiId ? getShikigami(shikigamiId) : null;
  if (!def || !fighter) return;
  if (!fighter._shikigamiState) fighter._shikigamiState = { x: fighter.x, y: fighter.y - 78 };
  const st = fighter._shikigamiState;
  // Target: behind (opposite of facing) and above the head
  const tx = fighter.x - (fighter.facing || 1) * 44;
  const ty = fighter.y - 80;
  st.x += (tx - st.x) * 0.12;
  st.y += (ty - st.y) * 0.12;
  def.draw(ctx, st.x, st.y, frame, scale);
}

// Resolve the equipped shikigami id for a fighter's character, allowing a
// per-match override map to take precedence over the permanent loadout.
export function resolveShikigami(charId, equippedShikigami = {}, matchOverride = {}) {
  if (matchOverride && matchOverride[charId]) return matchOverride[charId];
  return equippedShikigami?.[charId] || null;
}