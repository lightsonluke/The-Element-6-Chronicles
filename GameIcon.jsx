import React from 'react';
import * as Unicons from '@iconscout/react-unicons';

// Use the IconScout React package as a compatibility layer. The namespace
// import is intentional: it prevents a single icon that was renamed/removed
// from breaking the entire Vite build at compile time.
const FALLBACK = Unicons.UilInfoCircle || Unicons.UilCheck || Unicons.UilUser;

const pick = (...names) => names.map((name) => Unicons[name]).find(Boolean) || FALLBACK;

const ICONS = Object.freeze({
  angleDown: pick('UilAngleDown'), angleLeft: pick('UilAngleLeft'),
  angleRight: pick('UilAngleRight'), angleUp: pick('UilAngleUp'),
  arrowDown: pick('UilArrowDown'), arrowLeft: pick('UilArrowLeft'),
  arrowRight: pick('UilArrowRight'), arrowUp: pick('UilArrowUp'),
  check: pick('UilCheck'), checkCircle: pick('UilCheckCircle', 'UilCheck'),
  clock: pick('UilClock'), copy: pick('UilCopy'), download: pick('UilDownloadAlt', 'UilDownload'),
  edit: pick('UilEdit'), warning: pick('UilExclamationTriangle', 'UilExclamationCircle'),
  eye: pick('UilEye'), fire: pick('UilFire'), folder: pick('UilFolderOpen', 'UilFolder'),
  gift: pick('UilGift'), globe: pick('UilGlobe'), heart: pick('UilHeart'), home: pick('UilHome'),
  info: pick('UilInfoCircle', 'UilInfo'), link: pick('UilLink'), lock: pick('UilLock'),
  map: pick('UilMap'), minus: pick('UilMinus'), pause: pick('UilPause'), play: pick('UilPlay'),
  plus: pick('UilPlus'), redo: pick('UilRedo'), refresh: pick('UilRefresh'), save: pick('UilSave'),
  search: pick('UilSearch'), settings: pick('UilSetting', 'UilSettings'),
  cart: pick('UilShoppingCart'), star: pick('UilStar'), stop: pick('UilStopCircle', 'UilStop'),
  trophy: pick('UilTrophy'), unlock: pick('UilUnlock'), upload: pick('UilUpload'), user: pick('UilUser'),
  users: pick('UilUsersAlt', 'UilUsers'), video: pick('UilVideo'), water: pick('UilWater'),
  palette: pick('UilPalette'), layers: pick('UilLayers'), box: pick('UilBox'), comment: pick('UilComment'),
  book: pick('UilBookOpen'), calendar: pick('UilCalendarAlt'), chart: pick('UilChart'),
  clipboard: pick('UilClipboard'), paperclip: pick('UilPaperclip'), package: pick('UilPackage'),
  shuffle: pick('UilShuffle'), filter: pick('UilFilter'), expand: pick('UilExpandAlt'),
  compress: pick('UilCompressAlt'), cursor: pick('UilMouseAlt'), camera: pick('UilCamera'),
  image: pick('UilImage'), music: pick('UilMusic'), volume: pick('UilVolume'),
  muted: pick('UilVolumeOff'), cloud: pick('UilCloud'), snow: pick('UilSnowflake'),
  trees: pick('UilTrees'), leaf: pick('UilLeaf'), flower: pick('UilFlower'), flag: pick('UilFlag'),
  running: pick('UilRunning'), medal: pick('UilMedal'), bag: pick('UilBag'), tag: pick('UilTagAlt'),
  soccer: pick('UilFootball', 'UilFutbol'), volleyball: pick('UilVolleyball'), baseball: pick('UilBaseballBall', 'UilBaseballBatBall'),
  zipline: pick('UilLink', 'UilArrowUpRight'), banger: pick('UilBolt', 'UilFlash'), parkour: pick('UilRunning'),
  rockclimb: pick('UilMountains', 'UilMountain'), ctf: pick('UilFlag'), dodgeball: pick('UilTarget', 'UilCrosshairs'),
  mountain: pick('UilMountains', 'UilMountain'), target: pick('UilTarget', 'UilCrosshairs'),
  shield: pick('UilShield', 'UilShieldCheck'), exchange: pick('UilExchange', 'UilSync'),
  flask: pick('UilFlask', 'UilBeaker'), bolt: pick('UilBolt', 'UilFlash'),
  marker: pick('UilMapMarker'), database: pick('UilDatabase'), server: pick('UilServer'),
  wifi: pick('UilWifi'), game: pick('UilGame'), controller: pick('UilController'),
  hourglass: pick('UilHourglass'), spinner: pick('UilSpinner'),
  exclamationCircle: pick('UilExclamationCircle', 'UilExclamationTriangle'),
  close: pick('UilTimesCircle', 'UilTimes'),
  trash: pick('UilTrashAlt', 'UilTrash'),
  file: pick('UilFile'),
  undo: pick('UilUndo', 'UilCornerUpLeft'),
});

const ICON_ALIASES = Object.freeze({
  add: ICONS.plus, remove: ICONS.minus, trash: ICONS.trash, close: ICONS.close,
  check: ICONS.checkCircle, play: ICONS.play, stop: ICONS.stop, pause: ICONS.pause,
  search: ICONS.search, edit: ICONS.edit, copy: ICONS.copy, download: ICONS.download,
  upload: ICONS.upload, save: ICONS.save, settings: ICONS.settings, warning: ICONS.warning,
  info: ICONS.info, eye: ICONS.eye, lock: ICONS.lock, unlock: ICONS.unlock, home: ICONS.home,
  map: ICONS.map, layers: ICONS.layers, box: ICONS.box, link: ICONS.link, users: ICONS.users,
  user: ICONS.user, trophy: ICONS.trophy, medal: ICONS.medal, heart: ICONS.heart, star: ICONS.star,
  gift: ICONS.gift, calendar: ICONS.calendar, chart: ICONS.chart, clipboard: ICONS.clipboard,
  folder: ICONS.folder, package: ICONS.package, filter: ICONS.filter, expand: ICONS.expand,
  compress: ICONS.compress, cursor: ICONS.cursor, camera: ICONS.camera, image: ICONS.image,
  video: ICONS.video, music: ICONS.music, volume: ICONS.volume, muted: ICONS.muted, cloud: ICONS.cloud,
  water: ICONS.water, fire: ICONS.fire, snow: ICONS.snow, trees: ICONS.trees, leaf: ICONS.leaf,
  flower: ICONS.flower, flag: ICONS.flag, running: ICONS.running, bag: ICONS.bag, tag: ICONS.tag,
  marker: ICONS.marker, database: ICONS.database, server: ICONS.server, wifi: ICONS.wifi, game: ICONS.game,
  controller: ICONS.controller, loading: ICONS.spinner, time: ICONS.clock, hourglass: ICONS.hourglass,
  soccer: ICONS.soccer, volleyball: ICONS.volleyball, baseball: ICONS.baseball, mountain: ICONS.mountain,
  zipline: ICONS.zipline, banger: ICONS.banger, parkour: ICONS.parkour, rockclimb: ICONS.rockclimb,
  ctf: ICONS.ctf, dodgeball: ICONS.dodgeball,
  target: ICONS.target, shield: ICONS.shield, exchange: ICONS.exchange, flask: ICONS.flask, bolt: ICONS.bolt,
  undo: ICONS.undo, redo: ICONS.redo, refresh: ICONS.refresh, file: ICONS.file,
});

// Project-authored sport glyphs keep each sport recognizable even if a third
// party icon package changes or omits a named icon in a future release.
const SPORT_GLYPHS = Object.freeze({
  soccer: <><circle cx="12" cy="12" r="9.2" /><path d="m12 7 3 2.2-1.1 3.5h-3.8L9 9.2 12 7Zm-3 2.2-3.2-.4M9 12.7l-2.5 2.7m7.4-2.7 2.6 2.7m.1-6.2 3.2-.4M9.7 5l1.1-2m3.5 2-1.1-2m-2.1 12.7-.9 3m3.1-3 1 3" /></>,
  volleyball: <><path d="M4 8.5c4.2 0 7.2 2 8 6.4M7.3 4.2c3 3.2 7.2 4.4 11.6 2.4M5.4 17.7c3.8-1.8 7.5-1.1 10.4 2.1M12 2.8a9.2 9.2 0 1 0 0 18.4 9.2 9.2 0 0 0 0-18.4Z" /></>,
  parkour: <><circle cx="15.8" cy="4.6" r="2" /><path d="m13.7 8-3.2 3.2-3.1-.6m6.3-2.6 2.5 3 3.2.5m-8.9-.9-1.2 4.2-3.8 4m5.1-4.2 3.8 2.2 1.8 3.1" /></>,
  rockclimb: <><path d="m2.5 20 6.2-10 3.2 4.1 3.4-7.4L21.5 20H2.5Z" /><path d="m10.4 13.3 1.1-.5m2.2-2.5 1.1-.5m-7.7 4.8 1.1-.5" /></>,
  ctf: <><path d="M5 21V3m1 1h12l-2.3 4L18 12H6" /><path d="M3 21h5" /></>,
  dodgeball: <><circle cx="8.2" cy="14.8" r="5.3" /><circle cx="16.1" cy="8" r="4.3" /><path d="m7 13.5 2.5 2.5m5.5-8.2 2 2" /></>,
  zipline: <><path d="M3 5 21 19M5 3l14 18" /><circle cx="12" cy="12" r="2.1" /><path d="m10.5 14-2 3m3.5-2 2 3m-.5-6 3-2" /></>,
  banger: <><path d="m13.4 2.5-9 11h6.2l-.9 8 9.9-12h-6.4l.2-7Z" /></>,
});

const ELEMENT_GLYPHS = Object.freeze({
  basic: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v4m0 11v4m9.5-9.5h-4m-11 0h-4m16.2-6.7-2.8 2.8M8.1 15.9l-2.8 2.8m13.4 0-2.8-2.8M8.1 8.1 5.3 5.3" /></>,
  speed: <><path d="M3 7h11m-8 5h14M3 17h11" /><path d="m16 5 3 2-3 2m-1 3 3 2-3 2" /></>,
  power: <><path d="M13.4 2.5c.7 4.1-2.7 5.4-2.5 8.1-1.4-.7-2-2.1-1.7-3.7C6.1 9.3 4.9 12 5.1 14.7a6.9 6.9 0 1 0 13.8-.2c0-3.3-2.2-7.3-5.5-12Z" /><path d="M12 13c-1.7 1.3-2.3 2.5-2 4a2.1 2.1 0 0 0 4.2-.1c0-1.3-.8-2.6-2.2-3.9Z" /></>,
  defense: <><path d="M12 2.8 20 6v5.6c0 4.5-3.1 7.7-8 9.6-4.9-1.9-8-5.1-8-9.6V6l8-3.2Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  control: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
  utility: <><path d="M4 4.5h7v7H4zM13 4.5h7v7h-7zM4 13.5h7v7H4z" /><path d="M16.5 13.5v7m-3.5-3.5h7" /></>,
  reversal: <><path d="M4 8h15l-3-3m4 11H5l3 3" /><path d="m16 5 3 3-3 3M8 13l-3 3 3 3" /></>,
  testing: <><path d="M9 3h6m-5 0v6l-5 9.2A2 2 0 0 0 6.8 21h10.4a2 2 0 0 0 1.8-2.8L14 9V3" /><path d="M7.5 16h9" /></>,
});

export default function GameIcon({ icon, size = 16, color = 'currentColor', className = '', style = {}, title }) {
  const glyph = SPORT_GLYPHS[icon] || ELEMENT_GLYPHS[icon];
  if (glyph) {
    const safeSize = typeof size === 'number' ? size : 16;
    return <span aria-hidden={title ? undefined : true} title={title} className={`inline-flex shrink-0 items-center justify-center align-middle leading-none ${className}`} style={{ width: safeSize, height: safeSize, minWidth: safeSize, minHeight: safeSize, maxWidth: safeSize, maxHeight: safeSize, flex: `0 0 ${safeSize}px`, lineHeight: 0, color, ...style }}><svg viewBox="0 0 24 24" width={safeSize} height={safeSize} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: '0 0 auto' }}>{glyph}</svg></span>;
  }
  const Icon = ICON_ALIASES[icon] || ICONS[icon] || FALLBACK;
  const safeSize = typeof size === 'number' ? size : 16;

  return (
    <span
      aria-hidden={title ? undefined : true}
      title={title}
      className={`inline-flex shrink-0 items-center justify-center align-middle leading-none ${className}`}
      style={{
        width: safeSize,
        height: safeSize,
        minWidth: safeSize,
        minHeight: safeSize,
        maxWidth: safeSize,
        maxHeight: safeSize,
        flex: `0 0 ${safeSize}px`,
        lineHeight: 0,
        ...style,
      }}
    >
      <Icon
        size={safeSize}
        color={color}
        style={{ display: 'block', width: safeSize, height: safeSize, flex: '0 0 auto' }}
      />
    </span>
  );
}

export { ICON_ALIASES, ICONS };
