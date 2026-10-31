// Character authored visual overrides for the shared 2D stickman rig.
// The body color always comes from the character data. These values only drive
// hair, clothing, footwear, small props, and cosmetic pose accents.
const look = (hair, cut, lower, shoe, prop, cloth, trim, hairColor, motion, hem = 0.28, flare = 0.24, asym = 0, cape = 0) => ({
  hair, cut, lower, shoe, prop, cloth, trim, hairColor, motion, hem, flare, asym, cape,
});

export const CHARACTER_VISUALS = {
  // Generation I — distinct elemental silhouettes.
  g1_thunder: look('stormQuiff', 'storm', 'taper', 'forkHigh', 'thunderSeal', '#17233A', '#E5C94B', '#20232D', [-0.08, 0.05, 0.13, 0.02, 0.10], 0.32, 0.18, 0.22, 0.52),
  g1_fire: look('flameSweep', 'openCoat', 'flameHem', 'splitSprint', 'emberClasp', '#59251F', '#E77736', '#4A2925', [0.10, 0.16, 0.15, 0.13, 0.08], 0.74, 0.62, -0.20, 0.80),
  g1_water: look('lowBraid', 'waveTunic', 'fitted', 'waveAnkle', 'shellPin', '#123B48', '#69C8C0', '#152D37', [-0.04, 0.08, 0.02, 0.10, 0.14], 0.54, 0.40, 0.18, 0.48),
  g1_grass: look('leafCowlick', 'fieldVest', 'shortLegging', 'trailLace', 'seedSatchel', '#3C3927', '#91A45A', '#4C3728', [0.02, 0.07, 0.06, 0.08, 0.12], 0.38, 0.34, -0.10, 0.22),
  g1_ice: look('ashBob', 'iceMantle', 'narrow', 'sleekWinter', 'frostBrooch', '#293C4C', '#9AC9DC', '#B2B2A8', [-0.02, 0.04, -0.01, 0.04, 0.10], 0.46, 0.18, 0.12, 0.20),

  // Generation II — martial, practical, and theatrical designs.
  g2_renji: look('warriorKnot', 'martial', 'splitHak', 'splitWrap', 'lacquerGuard', '#272A31', '#8795A5', '#17191D', [0.00, 0.02, 0.07, 0.06, 0.12], 0.72, 0.34, 0.35, 0.34),
  g2_kaito: look('shavedFringe', 'sleevelessHood', 'jogger', 'courtLight', 'crossPouch', '#26303B', '#478AC4', '#312A28', [0.08, 0.15, 0.12, 0.12, 0.06], 0.30, 0.28, -0.22, 0.38),
  g2_hana: look('braidedPony', 'sailor', 'splitShort', 'roundHigh', 'waterCharm', '#293D4A', '#D899B0', '#1E2529', [0.01, 0.14, 0.06, 0.13, 0.10], 0.40, 0.46, 0.20, 0.28),
  g2_daigo: look('squareCrop', 'workJacket', 'reinforced', 'workBoot', 'toolLoop', '#554632', '#B39052', '#282724', [-0.08, 0.04, 0.12, 0.02, 0.08], 0.34, 0.16, 0.06, 0.12),
  g2_suzu: look('windFringe', 'streamer', 'slim', 'splitSole', 'featherPin', '#354044', '#A1C7B6', '#9A958A', [0.03, 0.10, 0.02, 0.14, 0.16], 0.56, 0.18, -0.10, 0.68),
  g2_mai: look('bluntBob', 'singleSleeve', 'legging', 'quietFlat', 'crescentPin', '#211F2A', '#735879', '#17171B', [-0.02, 0.01, 0.15, 0.02, 0.02], 0.64, 0.16, 0.26, 0.18),
  g2_osamu: look('wavyPart', 'craftOvershirt', 'rolled', 'guardSandals', 'beadCord', '#554637', '#B28B5E', '#272421', [0.02, 0.10, 0.05, 0.10, 0.08], 0.40, 0.24, -0.06, 0.18),
  g2_yui: look('starLoop', 'starJacket', 'shortLegging', 'starSneaker', 'starSatchel', '#49445C', '#E8C96E', '#684A3E', [0.06, 0.17, 0.10, 0.16, 0.12], 0.34, 0.36, 0.10, 0.54),
  // These two entries are in the game's playable data but omitted from the brief's final 75-entry list.
  g2_ibuki: look('monkCrown', 'hollowMonk', 'wrapped', 'monkSandal', 'prayerCord', '#3B3530', '#BFA77A', '#262421', [-0.03, 0.02, 0.02, 0.04, 0.18], 0.48, 0.18, 0.08, 0.10),
  g2_nishikawa: look('slickTail', 'stageTail', 'pinstripe', 'pointLow', 'puppetCase', '#35252B', '#A14B50', '#201C1C', [0.01, 0.00, 0.14, 0.06, 0.14], 0.94, 0.50, 0.30, 0.70),
  g2_itto: look('bladeTopknot', 'duelist', 'hakamaNarrow', 'hardWrap', 'cordKnot', '#352D2A', '#9D7958', '#1E1D1B', [0.03, 0.04, 0.15, 0.02, 0.06], 0.62, 0.26, 0.42, 0.30),
  g2_twinfoxes: look('foxPair', 'pairedJacket', 'opposedPanels', 'pairedSplit', 'foxTags', '#492C31', '#C26855', '#2B2222', [0.00, 0.12, 0.10, -0.10, 0.10], 0.60, 0.54, -0.32, 0.64),
  g2_utsuro: look('paleLock', 'hollowCloak', 'darkNarrow', 'silentBoot', 'blankMask', '#25232D', '#746783', '#CBC9C4', [-0.03, 0.00, 0.16, -0.04, 0.02], 0.98, 0.78, 0.16, 0.95),

  // Generation III — distinct historic and utility silhouettes.
  g3_takeshi: look('bristleCrop', 'grappler', 'kneeShort', 'flatTrainer', 'roundToken', '#4B292A', '#AE5C48', '#302925', [-0.10, 0.05, 0.14, 0.04, 0.06], 0.44, 0.56, 0.12, 0.16),
  g3_aiko: look('twinBuns', 'scallopDress', 'fittedShort', 'crossAnkle', 'bonePin', '#55484A', '#D9B9AB', '#87725D', [0.02, 0.11, 0.06, 0.10, 0.10], 0.48, 0.50, 0.14, 0.34),
  g3_haru: look('featherCrest', 'featherPanel', 'darkSlim', 'narrowHigh', 'glassCuff', '#252F35', '#72959A', '#17191D', [0.13, 0.13, 0.18, 0.08, 0.08], 0.54, 0.48, 0.24, 0.72),
  g3_chiyo: look('braidedCrown', 'vialTunic', 'narrow', 'quietSoft', 'vialBand', '#3C303C', '#A6B84C', '#392834', [-0.05, 0.00, 0.17, 0.04, 0.06], 0.52, 0.22, -0.08, 0.16),
  g3_emi: look('roundClipCut', 'medicShort', 'straight', 'laceComfort', 'aidPouch', '#514247', '#D9927D', '#47332F', [0.00, 0.06, 0.05, 0.04, 0.10], 0.42, 0.20, 0.06, 0.14),
  g3_nozomi: look('thornCrown', 'thornCrop', 'reinforced', 'angularHigh', 'thornGuard', '#34232A', '#8E343A', '#201C20', [0.15, 0.15, 0.19, 0.09, 0.10], 0.28, 0.30, 0.32, 0.22),
  g3_masaru: look('broadCrest', 'heavySport', 'splitWide', 'oversizeSport', 'kneePad', '#4B302A', '#D8793D', '#322722', [0.12, 0.14, 0.16, 0.17, 0.04], 0.36, 0.66, -0.12, 0.26),
  g3_ryo: look('curtainCut', 'raincoat', 'slim', 'sleekNarrow', 'mistClasp', '#3C4248', '#8CABB2', '#25292C', [-0.06, 0.02, 0.04, 0.02, 0.15], 0.94, 0.20, 0.12, 0.60),
  g3_souta: look('centerCurl', 'openCardigan', 'cuffed', 'canvasLow', 'cameraPouch', '#4A4641', '#6BA5A0', '#624A3D', [0.01, 0.08, 0.04, 0.07, 0.10], 0.40, 0.22, -0.08, 0.26),
  g3_ogata: look('widowCrop', 'formalLongVest', 'formalStraight', 'polishedLow', 'squareSpecs', '#34363B', '#B39A62', '#6A6863', [-0.01, 0.01, 0.01, 0.02, 0.02], 0.74, 0.16, 0.02, 0.18),
  g3_kanenobu: look('silverKnot', 'ceremonial', 'underArmor', 'raisedFormal', 'crestCord', '#40372D', '#C7A74F', '#B2ACA3', [-0.02, 0.03, 0.10, 0.05, 0.12], 0.86, 0.38, 0.18, 0.62),

  // Generation IV.
  g4_cobalt: look('diagonalPart', 'techZip', 'cargoSlim', 'segmentedRun', 'wristModule', '#202D3E', '#4F88C4', '#292B2E', [0.02, 0.03, 0.16, 0.02, 0.05], 0.40, 0.18, 0.08, 0.20),
  g4_cyan: look('napeWave', 'layerHem', 'flexible', 'aquaTrainer', 'lensPendant', '#2B3E44', '#45C9D6', '#39332E', [0.03, 0.10, 0.09, 0.12, 0.12], 0.50, 0.42, -0.12, 0.48),
  g4_onyx: look('coilTop', 'highSplitCoat', 'narrow', 'blackFlatTop', 'stoneRing', '#202124', '#898B90', '#171819', [-0.14, 0.02, 0.20, 0.00, 0.04], 0.98, 0.24, 0.22, 0.64),
  g4_gold: look('roundCurls', 'tailoredLapels', 'straight', 'pointAnkle', 'coinChain', '#493C26', '#D9B65D', '#70512F', [0.02, 0.06, 0.08, 0.11, 0.08], 0.56, 0.20, -0.04, 0.20),
  g4_vermilion: look('segmentedBraid', 'splitMantle', 'fitted', 'strapCalf', 'cordTassel', '#4B292D', '#C94B4D', '#442A27', [0.08, 0.12, 0.14, 0.12, 0.12], 0.54, 0.42, 0.24, 0.42),
  g4_umber: look('looseBun', 'ponchoVest', 'relaxed', 'mocBoot', 'woodPendant', '#4A3B2C', '#A57C4F', '#3B2C23', [-0.10, 0.04, 0.10, 0.02, 0.08], 0.68, 0.76, -0.06, 0.46),
  g4_graphite: look('hardPart', 'geometricVest', 'straight', 'monoSleek', 'collarTab', '#303238', '#A7A9AB', '#2A2B2D', [0.00, 0.00, 0.15, 0.00, 0.00], 0.82, 0.10, 0.02, 0.08),
  g4_daichi: look('stubbornCowlick', 'rolledDenim', 'shortLegging', 'treadRunner', 'toolPouch', '#3C4142', '#82916E', '#242321', [0.09, 0.12, 0.12, 0.14, 0.08], 0.38, 0.34, -0.16, 0.18),
  g4_renko: look('sidePony', 'pleatedCoat', 'splitPleat', 'slimStrap', 'fanClasp', '#3D252A', '#A73F4D', '#201C1C', [0.04, 0.12, 0.16, 0.12, 0.10], 0.70, 0.54, 0.30, 0.58),

  // Generation V heroes.
  yellow: look('messyQuiff', 'varsityCrop', 'trackTaper', 'courtChunk', 'lightningPatch', '#453B21', '#D6B52B', '#A98B54', [0.10, 0.15, 0.16, 0.16, 0.08], 0.34, 0.26, 0.08, 0.20),
  blue: look('navySidePart', 'waveVest', 'straight', 'flexLow', 'dropPendant', '#213B54', '#91C9E9', '#21252E', [-0.02, 0.07, 0.07, 0.12, 0.12], 0.54, 0.22, -0.06, 0.20),
  purple: look('wolfBob', 'asymSleeveless', 'looseTrouser', 'violetSplit', 'swordHarness', '#292631', '#786A8A', '#33282B', [0.07, 0.08, 0.17, 0.12, 0.04], 0.56, 0.34, 0.28, 0.42),
  orange: look('centralCurl', 'diagonalUtility', 'cuffedTaper', 'orangeLow', 'compassPouch', '#45372B', '#D58A3C', '#5B4330', [0.10, 0.16, 0.18, 0.13, 0.08], 0.36, 0.24, -0.30, 0.16),
  green: look('halfPony', 'leafCoat', 'flexStraight', 'trailCurve', 'seedCapsule', '#394132', '#88A46A', '#382B26', [0.07, 0.11, 0.10, 0.15, 0.12], 0.62, 0.40, 0.16, 0.56),
  pink: look('twinLowTails', 'droppedSweater', 'skirtLegging', 'platformRound', 'heartPouch', '#4A353E', '#D78DB1', '#72544C', [0.07, 0.18, 0.12, 0.16, 0.12], 0.44, 0.60, 0.24, 0.28),
  grey: look('silverStreakCrop', 'longVest', 'straight', 'monoLow', 'wristDevice', '#3D3D3E', '#B7B6B2', '#65625E', [-0.02, 0.01, 0.14, 0.02, 0.04], 0.82, 0.14, -0.04, 0.14),
  turquoise: look('sideBraidLong', 'morphPanels', 'flexDark', 'splitAnkle', 'scaleCuff', '#263C39', '#53B8AA', '#3D332D', [0.08, 0.11, 0.18, 0.08, 0.15], 0.48, 0.44, 0.18, 0.50),
  olive: look('braidedBunLow', 'fieldCrop', 'fitted', 'oliveEyelet', 'measureCharm', '#49452E', '#A69A55', '#382D22', [0.01, 0.06, 0.09, 0.14, 0.10], 0.40, 0.20, -0.02, 0.20),
  copper: look('diagonalWave', 'narrowLapel', 'charcoalFit', 'copperHeel', 'clockToken', '#403333', '#BF8053', '#593D31', [0.00, 0.01, 0.17, 0.04, 0.02], 0.48, 0.18, 0.03, 0.14),
  emerald: look('greenSideBraid', 'leafLayerCoat', 'darkLegging', 'greenStitch', 'leafBrooch', '#2D3D35', '#76B985', '#25342D', [0.02, 0.12, 0.08, 0.14, 0.12], 0.64, 0.50, -0.08, 0.74),
  pearl: look('pearlBob', 'pearlTunic', 'fitted', 'roundSoft', 'soundPendant', '#595A59', '#CFCFC3', '#C5C0B8', [0.00, 0.04, 0.06, 0.06, 0.10], 0.52, 0.20, 0.04, 0.18),
  red: look('redTipUndercut', 'combatVest', 'fitted', 'redHigh', 'flameCrest', '#4A2728', '#B63C32', '#302622', [0.13, 0.15, 0.20, 0.16, 0.08], 0.46, 0.30, 0.22, 0.34),
  lavender: look('halfUpTwist', 'softWideSleeve', 'tapered', 'softHigh', 'bellTie', '#514759', '#B8A2D2', '#A69A8C', [0.00, 0.07, 0.10, 0.17, 0.14], 0.46, 0.62, -0.08, 0.42),
  amber: look('braidedBunCurl', 'splitTailJacket', 'brownTaper', 'amberHigh', 'amberGlass', '#4B3A2A', '#D19A3D', '#8D6B3D', [0.07, 0.12, 0.15, 0.13, 0.10], 0.56, 0.44, -0.10, 0.52),
  black: look('highFade', 'raisedPanelJacket', 'taper', 'combatRunner', 'earStud', '#262B30', '#7597AA', '#17191C', [0.14, 0.14, 0.22, 0.18, 0.10], 0.48, 0.30, 0.18, 0.30),
  magenta: look('twinLowBraids', 'utilityCrop', 'shortsLegging', 'magentaLace', 'charmBracelet', '#422D3B', '#C65B91', '#2C2125', [0.05, 0.13, 0.11, 0.12, 0.12], 0.38, 0.24, 0.10, 0.18),
  indigo: look('gravitySweep', 'gravityDrape', 'fitted', 'heeledWrap', 'gravityLoop', '#292334', '#8776A6', '#27212B', [0.02, 0.05, 0.08, 0.15, 0.13], 0.72, 0.48, 0.26, 0.62),
  maroon: look('reactorCrop', 'reactorVest', 'straight', 'reactorBoot', 'reactorCore', '#3A292A', '#A75353', '#282222', [-0.01, 0.03, 0.13, 0.04, 0.03], 0.66, 0.12, 0.02, 0.12),
  crimson: look('hardSpikes', 'arsenalCoat', 'splitTaper', 'crimsonPlate', 'spearBadge', '#46292E', '#C54B5B', '#282023', [0.14, 0.16, 0.19, 0.14, 0.08], 0.62, 0.46, 0.14, 0.48),
  scarlet: look('graveSweep', 'graveCoat', 'narrow', 'graveBoot', 'hourglassCharm', '#3B2A2C', '#A9554A', '#322624', [-0.02, 0.02, 0.16, 0.04, 0.02], 0.96, 0.22, 0.06, 0.72),
  white: look('featherCrown', 'skyCape', 'slim', 'wingRunner', 'featherClasp', '#5A5A5A', '#E4E2D8', '#D2D0C9', [0.04, 0.11, 0.13, 0.18, 0.12], 0.50, 0.44, 0.02, 0.94),
  silver: look('metalBrush', 'plateVest', 'reinforced', 'metalBoot', 'metalRing', '#45494D', '#C6CDD0', '#9A9C9D', [-0.12, 0.03, 0.12, 0.03, 0.06], 0.54, 0.36, 0.06, 0.24),

  // Generation V villains.
  corpent: look('broadShag', 'bruteVest', 'patchLoose', 'broadRough', 'hammerLoop', '#494035', '#A28B6A', '#332D28', [-0.14, 0.05, 0.10, 0.02, 0.08], 0.56, 0.62, -0.06, 0.30),
  magneto: look('magnetCrest', 'magneticCoat', 'straight', 'metalSole', 'ironHalo', '#41444A', '#ADB8C5', '#4E4C4A', [0.02, 0.04, 0.15, 0.04, 0.08], 0.80, 0.28, 0.10, 0.42),
  willow: look('willowLocks', 'barkMantle', 'rootTaper', 'rootBoot', 'woodShoulder', '#3F4535', '#8B9B5A', '#514338', [0.00, 0.04, 0.08, 0.13, 0.16], 0.70, 0.58, -0.12, 0.64),
  cable: look('cableBraid', 'utilityChannel', 'oneLegGuard', 'techBoot', 'radioSpool', '#283943', '#55B7C5', '#29282A', [0.01, 0.02, 0.15, 0.03, 0.04], 0.62, 0.18, 0.12, 0.26),
  snodvor: look('shagRearTuft', 'furCollar', 'patchedUneven', 'layeredRough', 'boneToggle', '#4A4541', '#A4866D', '#C4C0B6', [-0.14, 0.04, 0.17, 0.08, 0.06], 0.62, 0.68, -0.26, 0.24),
  kirsten: look('sandyBraid', 'ridingJacket', 'slimRiding', 'ridingBoot', 'compassBrooch', '#343844', '#B49C69', '#AA8A5E', [0.02, 0.08, 0.10, 0.15, 0.12], 0.44, 0.20, 0.08, 0.18),
  volt: look('zigzagQuiff', 'sportShell', 'jogger', 'sprintTab', 'conductors', '#3A3B32', '#A7BD37', '#D0AF38', [0.16, 0.18, 0.22, 0.20, 0.08], 0.30, 0.22, 0.14, 0.16),
  temple: look('lowBunPart', 'ceremonialSleeveless', 'narrow', 'flatCeremonial', 'prayerTags', '#453D34', '#BBA67D', '#242221', [0.00, 0.02, 0.08, 0.04, 0.12], 0.96, 0.24, 0.00, 0.60),
  nightmare: look('shadowTendrils', 'raggedMantle', 'shadowNarrow', 'shadowTaper', 'brokenRing', '#28212F', '#6B557F', '#1D1A23', [0.01, 0.02, 0.20, 0.12, 0.02], 0.70, 0.84, 0.32, 0.86),
  hazel: look('looseCurls', 'scarfJacket', 'straight', 'laceAnkle', 'hazelPendant', '#454031', '#B4813F', '#64442E', [0.03, 0.08, 0.06, 0.10, 0.10], 0.48, 0.30, -0.06, 0.28),
  whami: look('unevenPuffs', 'shortPoncho', 'croppedLoose', 'roundSlip', 'wovenBell', '#4A3940', '#C27E78', '#272425', [0.08, 0.18, 0.12, 0.17, 0.12], 0.54, 0.76, 0.22, 0.40),
  controller: look('razorPart', 'geometricLong', 'narrowStraight', 'squareToe', 'controlTokens', '#25282C', '#D9D9D3', '#18191B', [0.00, 0.00, 0.18, 0.00, 0.00], 0.96, 0.14, 0.00, 0.16),
  evil: look('asymCurtain', 'tornLongcoat', 'darkFitted', 'unevenHigh', 'mirrorShard', '#2E2329', '#8D3C48', '#211C20', [0.12, 0.08, 0.22, 0.14, 0.18], 0.92, 0.50, -0.34, 0.82),

  // Guardian forces.
  life: look('crownWisps', 'petalTunic', 'softFitted', 'roundFlex', 'seedLeaf', '#414833', '#B9B76D', '#8B7044', [0.02, 0.09, 0.06, 0.16, 0.12], 0.56, 0.54, 0.04, 0.76),
  death: look('paleStreakLow', 'verticalHighcoat', 'closeNarrow', 'quietNarrow', 'hourglassChain', '#343438', '#A9A9A6', '#3A3939', [-0.04, 0.01, 0.18, 0.02, 0.04], 0.98, 0.18, 0.02, 0.70),
  mercy: look('roundedBraidBob', 'capeletSash', 'taper', 'curvedSoft', 'pairedTags', '#57474C', '#D5A9B0', '#644D47', [0.02, 0.07, 0.08, 0.10, 0.12], 0.52, 0.40, 0.06, 0.52),
};

const FALLBACK = look('naturalCrop', 'simpleTunic', 'taper', 'simpleShoe', 'smallBadge', '#33353A', '#AEB6BD', '#302A27', [0, 0.05, 0.08, 0.06, 0.06]);

export function getCharacterVisualStyle(charData) {
  const id = charData?.baseCharId || charData?.id;
  return CHARACTER_VISUALS[id] || FALLBACK;
}

