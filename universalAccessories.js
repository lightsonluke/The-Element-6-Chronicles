// Universal accessories — unique cosmetic parts that were once exclusive to skins.
// Now available to EVERY character (gens 1–5). Each is colored at render time by
// the wearer's main color or accent (secondary) color — roughly 50/50 across the
// set. All part types here are rendered by drawAccessory in cosmetics.js.

// colorMode: 'main'  → uses character.color
//            'accent' → uses character.secondaryColor
export const UNIVERSAL_ACCESSORIES = [
  // ── Headwear ──
  { id: 'univ_headphones',  name: 'Headphones',      type: 'headphones',       price: 120, colorMode: 'accent' },
  { id: 'univ_helmet',      name: 'Helmet',           type: 'helmet',           price: 130, colorMode: 'main' },
  { id: 'univ_headband',    name: 'Sport Headband',   type: 'headband',         price: 90,  colorMode: 'main' },
  { id: 'univ_cap',         name: 'Cap',              type: 'headband',         price: 95,  colorMode: 'accent' },
  { id: 'univ_glasses',     name: 'Glasses',          type: 'visor',            price: 100, colorMode: 'accent' },
  { id: 'univ_goggles',     name: 'Goggles',          type: 'goggles',          price: 110, colorMode: 'main' },
  { id: 'univ_laservisors', name: 'Laser Visor',      type: 'laser_visors',     price: 160, colorMode: 'main' },
  { id: 'univ_mask',        name: 'Mask',             type: 'mask',             price: 100, colorMode: 'main' },
  { id: 'univ_crown_jewel', name: 'Jeweled Crown',    type: 'crown_jewel',      price: 180, colorMode: 'main' },
  { id: 'univ_snow_crown',  name: 'Snow Crown',       type: 'snow_crown',       price: 170, colorMode: 'accent' },
  { id: 'univ_graveyard',   name: 'Graveyard Crown',  type: 'graveyard_crown',  price: 190, colorMode: 'main' },
  { id: 'univ_halo_ring',   name: 'Halo Ring',        type: 'halo_ring',       price: 150, colorMode: 'accent' },
  { id: 'univ_angel_halo',  name: 'Angel Halo',       type: 'angel_halo',       price: 160, colorMode: 'accent' },
  { id: 'univ_mind_halo',   name: 'Mind Halo',        type: 'mind_halo',        price: 150, colorMode: 'main' },
  { id: 'univ_flame_crown', name: 'Flame Crown',      type: 'flame_crown',      price: 170, colorMode: 'main' },
  { id: 'univ_horns_spike', name: 'Spike Horns',      type: 'horns_spike',     price: 140, colorMode: 'accent' },
  { id: 'univ_blindfold',   name: 'Blindfold',        type: 'blindfold',        price: 120, colorMode: 'main' },

  // ── Body / Wear ──
  { id: 'univ_baton',       name: 'Baton',            type: 'baton',            price: 110, colorMode: 'accent' },
  { id: 'univ_katana',      name: 'Katana',           type: 'katana',           price: 200, colorMode: 'main' },
  { id: 'univ_weapon_back', name: 'Back Weapon',      type: 'weapon_back',      price: 150, colorMode: 'main' },
  { id: 'univ_haori',       name: 'Checkered Haori',  type: 'checkered_haori',  price: 220, colorMode: 'main' },
  { id: 'univ_cape_long',   name: 'Long Cape',        type: 'cape_long',        price: 140, colorMode: 'main' },
  { id: 'univ_scarf_long',  name: 'Long Scarf',       type: 'scarf_long',       price: 120, colorMode: 'accent' },
  { id: 'univ_pauldrons',   name: 'Pauldrons',        type: 'pauldrons',        price: 130, colorMode: 'main' },
  { id: 'univ_armguards',   name: 'Armguards',        type: 'armguards',        price: 110, colorMode: 'accent' },
  { id: 'univ_kneepads',    name: 'Kneepads',         type: 'kneepads',         price: 100, colorMode: 'main' },
  { id: 'univ_belt',        name: 'Belt',             type: 'belt',             price: 90,  colorMode: 'accent' },
  { id: 'univ_backpack',    name: 'Backpack',         type: 'backpack',         price: 120, colorMode: 'main' },
  { id: 'univ_gloves',      name: 'Gloves',           type: 'gloves',           price: 90,  colorMode: 'accent' },
  { id: 'univ_claw_gaunt',  name: 'Claw Gauntlets',   type: 'claw_gauntlets',   price: 170, colorMode: 'main' },
  { id: 'univ_vine_bracers',name: 'Vine Bracers',     type: 'vine_bracers',     price: 130, colorMode: 'accent' },
  { id: 'univ_shadow_cloak',name: 'Shadow Cloak',     type: 'shadow_cloak',     price: 160, colorMode: 'main' },
  { id: 'univ_chrome_armor',name: 'Chrome Armor',     type: 'chrome_armor',     price: 180, colorMode: 'accent' },

  // ── Footwear ──
  { id: 'univ_shoes',       name: 'Shoes',            type: 'shoes',            price: 90,  colorMode: 'main' },
  { id: 'univ_slayer_shoes',name: 'Slayer Shoes',     type: 'slayer_shoes',     price: 110, colorMode: 'accent' },
  { id: 'univ_flippers',    name: 'Flippers',         type: 'flippers',         price: 100, colorMode: 'main' },
  { id: 'univ_rocket_boots',name: 'Rocket Boots',     type: 'rocket_boots',     price: 190, colorMode: 'accent' },
  { id: 'univ_gravity_boots',name:'Gravity Boots',    type: 'gravity_boots',    price: 180, colorMode: 'main' },

  // ── Effects / Aura ──
  { id: 'univ_ice_crystals',name: 'Ice Crystals',     type: 'ice_crystals',     price: 140, colorMode: 'accent' },
  { id: 'univ_crystals',    name: 'Crystal Shards',    type: 'crystals',         price: 130, colorMode: 'main' },
  { id: 'univ_sonic_rings', name: 'Portal Rings',      type: 'sonic_rings',      price: 160, colorMode: 'accent' },
  { id: 'univ_time_dial',   name: 'Time Dial',         type: 'time_dial',        price: 170, colorMode: 'main' },
  { id: 'univ_web_spinner', name: 'Web Spinner',       type: 'web_spinner',      price: 150, colorMode: 'accent' },
  { id: 'univ_void_tendrils',name:'Void Tendrils',     type: 'void_tendrils',    price: 170, colorMode: 'main' },
  { id: 'univ_soul_chains', name: 'Soul Chains',       type: 'soul_chains',      price: 150, colorMode: 'accent' },
  { id: 'univ_angel_feathers',name:'Angel Feathers',   type: 'angel_feathers',   price: 160, colorMode: 'main' },
  { id: 'univ_wings_energy',name: 'Energy Wings',      type: 'wings_energy',     price: 200, colorMode: 'accent' },
  { id: 'univ_venom_drip',  name: 'Venom Drip',        type: 'venom_drip',       price: 140, colorMode: 'main' },
  { id: 'univ_clone_echo',  name: 'Clone Echo',        type: 'clone_echo',       price: 160, colorMode: 'accent' },
  { id: 'univ_rising_souls',name: 'Rising Souls',      type: 'rising_souls',     price: 170, colorMode: 'main' },
  { id: 'univ_snow_dots',   name: 'Snow Dots',         type: 'snow_dots',        price: 110, colorMode: 'accent' },

  // ── Japanese Traditional ──
  { id: 'univ_kimono',        name: 'Kimono',           type: 'kimono',          price: 200, colorMode: 'main' },
  { id: 'univ_yukata',        name: 'Yukata',           type: 'yukata',          price: 170, colorMode: 'accent' },
  { id: 'univ_haori_plain',   name: 'Haori',            type: 'haori',           price: 150, colorMode: 'main' },
  { id: 'univ_hakama',        name: 'Hakama',           type: 'hakama',          price: 180, colorMode: 'main' },
  { id: 'univ_samurai_armor', name: 'Samurai Armor',    type: 'samurai_armor',   price: 250, colorMode: 'main' },
  { id: 'univ_oni_mask_red',  name: 'Red Oni Mask',     type: 'oni_mask_red',    price: 160, colorMode: 'main' },
  { id: 'univ_oni_mask_blue', name: 'Blue Oni Mask',    type: 'oni_mask_blue',   price: 160, colorMode: 'accent' },
  { id: 'univ_oni_hannya',    name: 'Hannya Mask',      type: 'oni_mask_hannya', price: 180, colorMode: 'main' },
  { id: 'univ_kitsune_mask',  name: 'Kitsune Mask',     type: 'kitsune_mask',    price: 170, colorMode: 'accent' },
  { id: 'univ_geta',          name: 'Geta',             type: 'geta',            price: 130, colorMode: 'main' },
  { id: 'univ_hachimaki',     name: 'Hachimaki',        type: 'hachimaki',       price: 90,  colorMode: 'accent' },
  { id: 'univ_wagasa',        name: 'Wagasa Umbrella',  type: 'wagasa',          price: 200, colorMode: 'accent' },
  { id: 'univ_sensu',         name: 'Folding Fan',      type: 'sensu',           price: 120, colorMode: 'main' },
];