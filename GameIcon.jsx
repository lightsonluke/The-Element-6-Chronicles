import React from 'react';
import {
  UilAngleDown, UilAngleLeft, UilAngleRight, UilAngleUp,
  UilArrowDown, UilArrowLeft, UilArrowRight, UilArrowUp,
  UilCheck, UilClock, UilCopy, UilDownloadAlt, UilEdit,
  UilExclamationTriangle, UilEye, UilFire, UilFolderOpen,
  UilGift, UilGlobe, UilHeart, UilHome, UilInfoCircle,
  UilLink, UilLock, UilMap, UilMinus, UilPause, UilPlay,
  UilPlus, UilRedo, UilRefresh, UilSave, UilSearch,
  UilSetting, UilShoppingCart, UilStar, UilStopCircle,
  UilTrophy, UilUndo, UilUnlock, UilUpload, UilUser,
  UilUsersAlt, UilVideo, UilWater, UilPalette, UilLayers,
  UilBox, UilComment, UilBookOpen, UilCalendarAlt, UilChart,
  UilClipboard, UilPaperclip, UilPackage, UilShuffle,
  UilFilter, UilExpandAlt, UilCompressAlt, UilMouseAlt,
  UilCamera, UilImage, UilMusic, UilVolume, UilVolumeOff,
  UilCloud, UilSnowflake, UilTrees, UilLeaf, UilFlower,
  UilFlag, UilRunning, UilMedal, UilBag, UilTagAlt,
  UilMapMarker, UilDatabase, UilServer, UilWifi, UilGame,
  UilController, UilHourglass, UilSpinner, UilExclamationCircle,
  UilTimes, UilTimesCircle, UilCheckCircle,
} from '@iconscout/react-unicons';

// IconScout's Unicons are used as the game's single icon layer. Existing
// GameIcon emoji calls are kept as compatibility aliases so the rest of the
// codebase can be upgraded without changing every component at once.
const EMOJI_MAP = Object.freeze({
  '←': UilArrowLeft, '→': UilArrowRight, '↑': UilArrowUp, '↓': UilArrowDown,
  '⬆': UilArrowUp, '⬇': UilArrowDown, '‹': UilAngleLeft, '›': UilAngleRight,
  '⌄': UilAngleDown, '⌃': UilAngleUp, '↔': UilArrowRight, '↺': UilUndo,
  '↻': UilRedo, '➤': UilArrowRight, '?': UilInfoCircle,
  'X': UilTimes, '✕': UilTimes, '✖': UilTimes, '✗': UilTimes,
  '✓': UilCheck, '✔': UilCheckCircle, '✅': UilCheckCircle,
  '▶': UilPlay, '⏸': UilPause, '⏯': UilPause, '⏱': UilClock, '🕐': UilClock,
  '◆': UilStar, '◎': UilBox, '●': UilBox, '★': UilStar, '⭐': UilStar,
  '🌟': UilStar, '✦': UilStar, '✨': UilStar,
  '♥': UilHeart, '❤': UilHeart, '💕': UilHeart, '💖': UilHeart,
  '⚑': UilFlag, '🚩': UilFlag, '🏁': UilFlag,
  '⚙': UilSetting, '⚠': UilExclamationTriangle, '⚡': UilExclamationTriangle,
  '💥': UilExclamationCircle, '💨': UilCloud,
  '🌍': UilGlobe, '🌐': UilGlobe, '🏠': UilHome, '🏘️': UilHome,
  '🏙️': UilHome, '🏛': UilHome, '🌳': UilTrees, '⛰️': UilMap,
  '❄️': UilSnowflake, '💧': UilWater, '🔥': UilFire,
  '⚽': UilGame, '🏀': UilGame, '🏐': UilGame, '⚾': UilGame,
  '🏃': UilRunning, '🧗': UilRunning, '🏆': UilTrophy, '🏅': UilMedal,
  '👑': UilTrophy, '👤': UilUser, '👥': UilUsersAlt, '🎁': UilGift,
  '🎉': UilStar, '🎓': UilBookOpen, '🎨': UilPalette, '🎩': UilTagAlt,
  '🎬': UilVideo, '🎭': UilGame, '🎮': UilController, '🎲': UilShuffle,
  '💬': UilComment, '📅': UilCalendarAlt, '📊': UilChart, '📋': UilClipboard,
  '📎': UilPaperclip, '📖': UilBookOpen, '📜': UilPackage, '📦': UilPackage,
  '📰': UilFile, '📁': UilFolderOpen, '💾': UilSave, '💰': UilBag,
  '🪙': UilBag, '🛒': UilShoppingCart, '🛋️': UilHome, '🛠': UilSetting,
  '🛠️': UilSetting, '🤝': UilUsersAlt, '🧩': UilBox, '🧪': UilPackage,
  '🧹': UilTrashAlt, '🪢': UilLink, '🧤': UilBag, '💍': UilStar,
  '💀': UilExclamationCircle, '🔀': UilShuffle, '🔄': UilRefresh, '🔍': UilSearch,
  '🔒': UilLock, '🔓': UilUnlock, '🔴': UilBox, '🔵': UilBox,
  '🚪': UilArrowRight, '✎': UilEdit, '✏': UilEdit, '👁': UilEye,
  '🗑': UilTrashAlt, '🏷️': UilTagAlt, '⭐': UilStar,
  '↗': UilArrowRight, '↖': UilArrowUp, '↙': UilArrowDown, '↘': UilArrowRight,
  '+': UilPlus, '-': UilMinus,
});

// Named aliases let newer UI code request a semantic icon directly.
const ICON_ALIASES = Object.freeze({
  add: UilPlus, remove: UilMinus, trash: UilTrashAlt, close: UilTimesCircle,
  check: UilCheckCircle, play: UilPlay, stop: UilStopCircle, pause: UilPause,
  search: UilSearch, edit: UilEdit, copy: UilCopy, download: UilDownloadAlt,
  upload: UilUpload, save: UilSave, settings: UilSetting, warning: UilExclamationTriangle,
  info: UilInfoCircle, eye: UilEye, lock: UilLock, unlock: UilUnlock,
  home: UilHome, map: UilMap, layers: UilLayers, box: UilBox, link: UilLink,
  users: UilUsersAlt, user: UilUser, trophy: UilTrophy, medal: UilMedal,
  heart: UilHeart, star: UilStar, gift: UilGift, calendar: UilCalendarAlt,
  chart: UilChart, clipboard: UilClipboard, folder: UilFolderOpen, package: UilPackage,
  filter: UilFilter, expand: UilExpandAlt, compress: UilCompressAlt,
  cursor: UilMouseAlt, camera: UilCamera, image: UilImage, video: UilVideo,
  music: UilMusic, volume: UilVolume, muted: UilVolumeOff, cloud: UilCloud,
  water: UilWater, fire: UilFire, snow: UilSnowflake, trees: UilTrees,
  leaf: UilLeaf, flower: UilFlower, flag: UilFlag, running: UilRunning,
  bag: UilBag, tag: UilTagAlt, marker: UilMapMarker, database: UilDatabase,
  server: UilServer, wifi: UilWifi, game: UilGame, controller: UilController,
  loading: UilSpinner, time: UilClock, hourglass: UilHourglass,
});

export default function GameIcon({ emoji = '', icon, size = 16, color = 'currentColor', className = '', style = {}, title }) {
  const Icon = ICON_ALIASES[icon] || EMOJI_MAP[emoji] || UilInfoCircle;
  return (
    <span
      aria-hidden={title ? undefined : true}
      title={title}
      className={`inline-flex shrink-0 items-center justify-center align-middle leading-none ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size, ...style }}
    >
      <Icon size={size} color={color} />
    </span>
  );
}

export { EMOJI_MAP, ICON_ALIASES };
