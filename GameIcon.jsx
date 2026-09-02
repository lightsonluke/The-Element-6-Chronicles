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
  marker: pick('UilMapMarker'), database: pick('UilDatabase'), server: pick('UilServer'),
  wifi: pick('UilWifi'), game: pick('UilGame'), controller: pick('UilController'),
  hourglass: pick('UilHourglass'), spinner: pick('UilSpinner'),
  exclamationCircle: pick('UilExclamationCircle', 'UilExclamationTriangle'),
  close: pick('UilTimesCircle', 'UilTimes'),
  trash: pick('UilTrashAlt', 'UilTrash'),
  file: pick('UilFile'),
  undo: pick('UilUndo', 'UilCornerUpLeft'),
});

const EMOJI_MAP = Object.freeze({
  '←': ICONS.arrowLeft, '→': ICONS.arrowRight, '↑': ICONS.arrowUp, '↓': ICONS.arrowDown,
  '⬆': ICONS.arrowUp, '⬇': ICONS.arrowDown, '‹': ICONS.angleLeft, '›': ICONS.angleRight,
  '⌄': ICONS.angleDown, '⌃': ICONS.angleUp, '↔': ICONS.arrowRight, '↺': ICONS.undo,
  '↻': ICONS.redo, '➤': ICONS.arrowRight, '?': ICONS.info,
  'X': ICONS.close, '✕': ICONS.close, '✖': ICONS.close, '✗': ICONS.close,
  '✓': ICONS.check, '✔': ICONS.checkCircle, '✅': ICONS.checkCircle,
  '▶': ICONS.play, '⏸': ICONS.pause, '⏯': ICONS.pause, '⏱': ICONS.clock, '🕐': ICONS.clock,
  '◆': ICONS.star, '◎': ICONS.box, '●': ICONS.box, '★': ICONS.star, '⭐': ICONS.star,
  '🌟': ICONS.star, '✦': ICONS.star, '✨': ICONS.star,
  '♥': ICONS.heart, '❤': ICONS.heart, '💕': ICONS.heart, '💖': ICONS.heart,
  '⚑': ICONS.flag, '🚩': ICONS.flag, '🏁': ICONS.flag,
  '⚙': ICONS.settings, '⚠': ICONS.warning, '⚡': ICONS.warning, '💥': ICONS.exclamationCircle,
  '💨': ICONS.cloud, '🌍': ICONS.globe, '🌐': ICONS.globe, '🏠': ICONS.home, '🏘️': ICONS.home,
  '🏙️': ICONS.home, '🏛': ICONS.home, '🌳': ICONS.trees, '⛰️': ICONS.map, '❄️': ICONS.snow,
  '💧': ICONS.water, '🔥': ICONS.fire,
  '⚽': ICONS.game, '🏀': ICONS.game, '🏐': ICONS.game, '⚾': ICONS.game,
  '🏃': ICONS.running, '🧗': ICONS.running, '🏆': ICONS.trophy, '🏅': ICONS.medal,
  '👑': ICONS.trophy, '👤': ICONS.user, '👥': ICONS.users, '🎁': ICONS.gift,
  '🎉': ICONS.star, '🎓': ICONS.book, '🎨': ICONS.palette, '🎩': ICONS.tag, '🎬': ICONS.video,
  '🎭': ICONS.game, '🎮': ICONS.controller, '🎲': ICONS.shuffle, '💬': ICONS.comment,
  '📅': ICONS.calendar, '📊': ICONS.chart, '📋': ICONS.clipboard, '📎': ICONS.paperclip,
  '📖': ICONS.book, '📜': ICONS.package, '📦': ICONS.package, '📰': ICONS.file, '📁': ICONS.folder,
  '💾': ICONS.save, '💰': ICONS.bag, '🪙': ICONS.bag, '🛒': ICONS.cart, '🛋️': ICONS.home,
  '🛠': ICONS.settings, '🛠️': ICONS.settings, '🤝': ICONS.users, '🧩': ICONS.box, '🧪': ICONS.package,
  '🧹': ICONS.trash, '🪢': ICONS.link, '🧤': ICONS.bag, '💍': ICONS.star, '💀': ICONS.exclamationCircle,
  '🔀': ICONS.shuffle, '🔄': ICONS.refresh, '🔍': ICONS.search, '🔒': ICONS.lock, '🔓': ICONS.unlock,
  '🔴': ICONS.box, '🔵': ICONS.box, '🚪': ICONS.arrowRight, '✎': ICONS.edit, '✏': ICONS.edit,
  '👁': ICONS.eye, '🗑': ICONS.trash, '🗑️': ICONS.trash, '🏷️': ICONS.tag,
  '↗': ICONS.arrowRight, '↖': ICONS.arrowUp, '↙': ICONS.arrowDown, '↘': ICONS.arrowRight,
  '+': ICONS.plus, '-': ICONS.minus,
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
  undo: ICONS.undo, redo: ICONS.redo, refresh: ICONS.refresh, file: ICONS.file,
});

export default function GameIcon({ emoji = '', icon, size = 16, color = 'currentColor', className = '', style = {}, title }) {
  const Icon = ICON_ALIASES[icon] || EMOJI_MAP[emoji] || FALLBACK;
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

export { EMOJI_MAP, ICON_ALIASES, ICONS };
