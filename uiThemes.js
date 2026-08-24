// UI Theme definitions — shared between Settings (selection) and Game (initial load).
// Each theme sets CSS custom properties on :root. Gen 1 themes include extended
// variables (card, border, secondary, etc.) for a more complete visual overhaul.

export const THEMES = [
  { id: 'default', name: 'Purple & Gold', primary: '260 80% 60%', accent: '45 90% 55%', bg: '220 25% 8%' },
  { id: 'ocean', name: 'Ocean Blue', primary: '210 80% 55%', accent: '190 90% 50%', bg: '220 30% 6%' },
  { id: 'forest', name: 'Forest Green', primary: '140 70% 45%', accent: '60 90% 50%', bg: '150 25% 6%' },
  { id: 'fire', name: 'Fire & Brimstone', primary: '0 75% 55%', accent: '30 90% 55%', bg: '0 20% 6%' },
  { id: 'neon', name: 'Neon Night', primary: '290 80% 60%', accent: '180 90% 55%', bg: '270 30% 5%' },
  { id: 'cyber', name: 'Cyber Punk', primary: '320 80% 55%', accent: '180 90% 55%', bg: '220 40% 4%' },
  { id: 'royal', name: 'Royal Indigo', primary: '240 70% 55%', accent: '40 85% 55%', bg: '240 25% 7%' },
  { id: 'sunset', name: 'Sunset', primary: '20 80% 55%', accent: '350 85% 60%', bg: '10 25% 6%' },
  { id: 'purpleblue', name: 'Purple & Blue', primary: '270 85% 65%', accent: '210 90% 55%', bg: '230 30% 6%' },
  { id: 'purplewhite', name: 'Purple & White', primary: '270 80% 60%', accent: '0 0% 95%', bg: '270 20% 8%' },
  { id: 'candy', name: 'Candy Pop', primary: '330 85% 65%', accent: '180 80% 60%', bg: '300 25% 6%' },
  { id: 'royalgold', name: 'Royal Gold', primary: '45 90% 55%', accent: '30 85% 50%', bg: '30 20% 6%' },
  { id: 'ice', name: 'Ice Frost', primary: '200 80% 60%', accent: '220 90% 70%', bg: '210 30% 8%' },
  { id: 'emerald', name: 'Emerald', primary: '160 80% 45%', accent: '60 85% 55%', bg: '160 25% 5%' },
  { id: 'crimson', name: 'Crimson', primary: '350 80% 55%', accent: '20 85% 55%', bg: '350 20% 6%' },
  { id: 'mono', name: 'Monochrome', primary: '0 0% 60%', accent: '0 0% 80%', bg: '220 10% 8%' },
  // ── Gen 1 themes — extended palette overhaul (card, border, secondary, etc.) ──
  // Gen 1: deep purple cityscape, gold/bronze accents, dark slate panels with gold outlines
  {
    id: 'gen1', name: 'Gen 1',
    primary: '43 57% 53%', accent: '43 57% 53%', bg: '265 42% 7%',
    card: '255 16% 10%', border: '43 40% 38%', secondary: '255 16% 16%', muted: '255 16% 14%',
    ring: '43 57% 53%', foreground: '40 30% 90%', mutedFg: '43 20% 62%', input: '255 16% 18%',
    popover: '255 16% 10%', sidebarBg: '265 42% 5%', sidebarBorder: '43 40% 38%',
  },
  // Gen 1 Dark: near-black with orange/gold glow, violet iconography, atmospheric
  {
    id: 'gen1dark', name: 'Gen 1 Dark',
    primary: '36 96% 61%', accent: '38 57% 56%', bg: '240 10% 4%',
    card: '240 10% 8%', border: '36 80% 42%', secondary: '240 10% 14%', muted: '240 10% 12%',
    ring: '36 96% 61%', foreground: '0 0% 90%', mutedFg: '36 30% 60%', input: '240 10% 16%',
    popover: '240 10% 8%', sidebarBg: '240 10% 3%', sidebarBorder: '36 80% 42%',
  },
];

// Extended CSS variables that Gen 1 themes override. When switching back to a
// basic theme, these are cleared so the stylesheet defaults take over again.
const EXT_VARS = [
  '--card', '--border', '--secondary', '--muted', '--ring', '--foreground',
  '--muted-foreground', '--input', '--popover', '--sidebar-background', '--sidebar-border',
];

// Apply a UI theme by setting CSS custom properties on :root (and .dark if present).
// Does NOT save the setting — caller handles persistence.
export function applyUiTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  const dark = document.querySelector('.dark');

  // Clear extended variables so basic themes fall back to stylesheet defaults
  EXT_VARS.forEach(v => {
    root.style.removeProperty(v);
    if (dark) dark.style.removeProperty(v);
  });

  // Core variables — always set
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--background', theme.bg);
  if (dark) {
    dark.style.setProperty('--primary', theme.primary);
    dark.style.setProperty('--accent', theme.accent);
    dark.style.setProperty('--background', theme.bg);
  }

  // Extended variables — only set if the theme defines them
  const setExt = (key, val) => {
    if (val) {
      root.style.setProperty(key, val);
      if (dark) dark.style.setProperty(key, val);
    }
  };
  setExt('--card', theme.card);
  setExt('--border', theme.border);
  setExt('--secondary', theme.secondary);
  setExt('--muted', theme.muted);
  setExt('--ring', theme.ring);
  setExt('--foreground', theme.foreground);
  setExt('--muted-foreground', theme.mutedFg);
  setExt('--input', theme.input);
  setExt('--popover', theme.popover);
  setExt('--sidebar-background', theme.sidebarBg);
  setExt('--sidebar-border', theme.sidebarBorder);

  // Body class for atmospheric background gradients
  document.body.classList.remove('theme-gen1', 'theme-gen1dark');
  if (themeId === 'gen1') document.body.classList.add('theme-gen1');
  else if (themeId === 'gen1dark') document.body.classList.add('theme-gen1dark');
}