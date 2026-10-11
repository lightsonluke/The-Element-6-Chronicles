// Authored Resonance Construct design and move bible. Source: user-provided weapon specification.
export const RESONANCE_CONSTRUCT_SPECS = [
  {
    "id": 1,
    "name": "Resonance Blade",
    "design": "A balanced, single-edged steel sword with a dark grip, cyan resonance channels, and a hexagonal energy guard.",
    "moves": {
      "sideHeavy": {
        "name": "Crosscut",
        "description": "Two quick horizontal slashes; the second deals greater damage and knockback.",
        "slot": "sideHeavy",
        "geometry": "combo",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "staged-multi-hit"
      },
      "upHeavy": {
        "name": "Rising Edge",
        "description": "Swings the sword overhead in an upward arc, launching enemies above the player.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Groundbreaker",
        "description": "Stabs the sword into the ground, sending a short energy ripple along the floor.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Resonant Lunge",
        "description": "Briefly draws back, then dashes forward with a powerful piercing slash.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Sky Splitter",
        "description": "Jumps upward while delivering a rotating vertical sword cut.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Echo Counter",
        "description": "Briefly assumes a defensive stance; a successful hit triggers an automatic counter-slash.",
        "slot": "downSignature",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      },
      "recovery": {
        "name": "Ascending Cut",
        "description": "A rising sword swing propels the wielder upward.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 2,
    "name": "Twin Fangs",
    "design": "Two short, hooked daggers with mismatched cyan and magenta energy edges and claw-shaped pommels.",
    "moves": {
      "sideHeavy": {
        "name": "Crossing Fangs",
        "description": "Crosses both blades in front of the body for a quick double hit.",
        "slot": "sideHeavy",
        "geometry": "combo",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "staged-multi-hit"
      },
      "upHeavy": {
        "name": "Twin Ascension",
        "description": "Performs two upward stabs, with the second hit launching opponents.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Low Sweep",
        "description": "Crouches and sweeps both daggers outward, striking enemies on either side near the ground.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Phantom Pursuit",
        "description": "Dashes through the opponent with a rapid three-slash combo.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Predator's Leap",
        "description": "Automatically jumps diagonally upward and performs a spinning pair of cuts.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Backstep Ambush",
        "description": "Quickly retreats, then lunges forward with both blades extended.",
        "slot": "downSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "recovery": {
        "name": "Fang Climb",
        "description": "Slashes upward twice while rising; the second strike provides extra lift.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 3,
    "name": "Phase Katana",
    "design": "An extra-long black katana with a silver edge, violet phase markings, and a sheath that flickers between dimensions.",
    "moves": {
      "sideHeavy": {
        "name": "Iaido Draw",
        "description": "Sheathes the blade briefly, then executes one extremely fast horizontal draw cut.",
        "slot": "sideHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "upHeavy": {
        "name": "Moon Arc",
        "description": "Draws the katana overhead, producing a tall crescent slash.",
        "slot": "upHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "downHeavy": {
        "name": "Phase Sever",
        "description": "A downward cut that briefly passes through the floor and strikes opponents directly below the ledge.",
        "slot": "downHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "sideSignature": {
        "name": "Afterimage",
        "description": "Teleports a short distance forward and slashes; the hitbox appears after the displacement.",
        "slot": "sideSignature",
        "geometry": "phase",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "displace-strike"
      },
      "upSignature": {
        "name": "Rift Ascender",
        "description": "Cuts upward through a narrow dimensional rift, pulling the wielder upward slightly.",
        "slot": "upSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downSignature": {
        "name": "Stillness",
        "description": "Holds a short counter stance; if struck, phases behind the attacker and delivers a heavy cut.",
        "slot": "downSignature",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      },
      "recovery": {
        "name": "Sky Draw",
        "description": "A powerful upward draw slash with strong vertical lift and limited horizontal control.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 4,
    "name": "Resonance Rapier",
    "design": "A narrow silver thrusting sword with an ornate gold basket guard and a turquoise resonance crystal.",
    "moves": {
      "sideHeavy": {
        "name": "Fencer's Thrust",
        "description": "A fast, long-reaching jab with modest knockback.",
        "slot": "sideHeavy",
        "geometry": "thrust",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "linear-thrust"
      },
      "upHeavy": {
        "name": "Needle Lift",
        "description": "Three rapid upward thrusts; the final thrust launches the target.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Ankle Pierce",
        "description": "Dips low and stabs forward along the ground, effective against landing opponents.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Riposte Dash",
        "description": "Slides backward just before thrusting forward with a high-speed counter-lunge.",
        "slot": "sideSignature",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      },
      "upSignature": {
        "name": "Pinnacle Point",
        "description": "Automatically leaps and delivers a precise downward-angled thrust toward the nearest opponent above.",
        "slot": "upSignature",
        "geometry": "thrust",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "linear-thrust"
      },
      "downSignature": {
        "name": "Duelist's Challenge",
        "description": "Marks a short area in front of the player; an opponent entering it is caught in a brief grab and tossed aside.",
        "slot": "downSignature",
        "geometry": "grab",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "reach-catch-throw"
      },
      "recovery": {
        "name": "Fencer's Rise",
        "description": "A rising corkscrew thrust with low initial damage and strong vertical movement.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 5,
    "name": "Crescent Blades",
    "design": "Two inward-curved silver blades shaped like opposing moons, with jade-green inlays and ring-shaped handles.",
    "moves": {
      "sideHeavy": {
        "name": "Lunar Cross",
        "description": "Sweeps one blade forward, then the other backward to catch nearby enemies.",
        "slot": "sideHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "upHeavy": {
        "name": "Double Halo",
        "description": "Spins both blades overhead in a circular multi-hit attack.",
        "slot": "upHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "downHeavy": {
        "name": "Crescent Sweep",
        "description": "Performs a low, wide circular sweep that can hit on either side.",
        "slot": "downHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "sideSignature": {
        "name": "Orbit Break",
        "description": "Throws one blade in a curved boomerang path while the other protects the wielder.",
        "slot": "sideSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upSignature": {
        "name": "Moonrise",
        "description": "Jumps and spins vertically, creating overlapping crescent-shaped hitboxes.",
        "slot": "upSignature",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "downSignature": {
        "name": "Eclipse Trap",
        "description": "Crosses the blades to create a brief energy snare that pulls nearby enemies inward before a finishing slash.",
        "slot": "downSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "recovery": {
        "name": "Twin Spiral",
        "description": "Spins upward with both blades extended, hitting multiple times during the ascent.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 6,
    "name": "Greatblade",
    "design": "An oversized rectangular greatsword with a chipped steel edge, thick crossguard, and molten-orange cracks.",
    "moves": {
      "sideHeavy": {
        "name": "Titan Cleave",
        "description": "A slow, powerful horizontal slash with high knockback.",
        "slot": "sideHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "upHeavy": {
        "name": "Pillar Splitter",
        "description": "Hoists the sword overhead and launches it upward in a crushing vertical arc.",
        "slot": "upHeavy",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "downHeavy": {
        "name": "Ironfall",
        "description": "Slams the blade into the floor, producing a short shockwave on both sides.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Heavy Advance",
        "description": "Takes a heavy step forward with armor during startup, then delivers a shoulder-led sword smash.",
        "slot": "sideSignature",
        "geometry": "burst",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "energy-burst"
      },
      "upSignature": {
        "name": "Worldsplitter",
        "description": "Leaps upward and brings the greatblade down in a wide overhead arc, catching airborne opponents.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Executioner's Grip",
        "description": "Grabs an adjacent opponent by the collar, lifts them, and throws them downward.",
        "slot": "downSignature",
        "geometry": "grab",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "reach-catch-throw"
      },
      "recovery": {
        "name": "Rising Colossus",
        "description": "Uses a two-handed rising slash to gain height; strong launch power but a vulnerable landing.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 7,
    "name": "Reaper Scythe",
    "design": "A long black shaft with a crescent silver blade, crimson runes, and a small spectral chain wrapped around the grip.",
    "moves": {
      "sideHeavy": {
        "name": "Harvest Sweep",
        "description": "A broad horizontal scythe swing with a large range but a slower startup.",
        "slot": "sideHeavy",
        "geometry": "burst",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "energy-burst"
      },
      "upHeavy": {
        "name": "Reaping Hook",
        "description": "Hooks the blade upward and pulls opponents slightly toward the tip before launching them.",
        "slot": "upHeavy",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "downHeavy": {
        "name": "Low Harvest",
        "description": "Sweeps along the ground, tripping nearby opponents with low knockback.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Soul Snatch",
        "description": "Extends the scythe; a successful hit hooks an opponent and pulls them into a heavy follow-up slash.",
        "slot": "sideSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "upSignature": {
        "name": "Grave Spiral",
        "description": "Jumps and spins the scythe overhead, carrying the player upward.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Backward Reap",
        "description": "Dashes backward while sweeping behind, then hooks forward if the blade connects.",
        "slot": "downSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "recovery": {
        "name": "Reaper's Ascent",
        "description": "Catches the scythe above the head and uses its rotating momentum to rise.",
        "slot": "recovery",
        "geometry": "burst",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "energy-burst"
      }
    }
  },
  {
    "id": 8,
    "name": "Rift Claws",
    "design": "Arm-mounted black metal claws with three hooked silver talons per hand and violet dimensional energy between the fingers.",
    "moves": {
      "sideHeavy": {
        "name": "Rake Combo",
        "description": "Three rapid forward claw strikes, with the third hit providing the main knockback.",
        "slot": "sideHeavy",
        "geometry": "combo",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "staged-multi-hit"
      },
      "upHeavy": {
        "name": "Tear Upward",
        "description": "Performs a double uppercut with the claws, launching enemies vertically.",
        "slot": "upHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "downHeavy": {
        "name": "Predator Drop",
        "description": "Leaps a short distance forward and slashes downward on landing.",
        "slot": "downHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "sideSignature": {
        "name": "Rift Pounce",
        "description": "Crouches, then lunges forward in a long, low pounce with both claws extended.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Dimensional Snare",
        "description": "Opens a small rift overhead; clawed hands emerge to seize an opponent before throwing them upward.",
        "slot": "upSignature",
        "geometry": "grab",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "reach-catch-throw"
      },
      "downSignature": {
        "name": "Vanishing Clutch",
        "description": "Briefly phases backward; if an opponent attacks into the space vacated, reappears behind them with a grab.",
        "slot": "downSignature",
        "geometry": "grab",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "reach-catch-throw"
      },
      "recovery": {
        "name": "Claw Ascent",
        "description": "Alternates upward claw strikes, gaining height with each successful hit.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 9,
    "name": "Pulse Tonfas",
    "design": "Two compact gunmetal tonfas with perpendicular grips, cyan energy cores, and reinforced impact caps.",
    "moves": {
      "sideHeavy": {
        "name": "Pulse Flurry",
        "description": "Delivers four quick baton strikes; the last hit pushes the opponent away.",
        "slot": "sideHeavy",
        "geometry": "combo",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "staged-multi-hit"
      },
      "upHeavy": {
        "name": "Double Pop",
        "description": "Two sharp upward baton hits, the second launching enemies.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Low Impact",
        "description": "Spins both tonfas around the waist in a low circular sweep.",
        "slot": "downHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "sideSignature": {
        "name": "Breakpoint Rush",
        "description": "Quickly dashes forward while delivering alternating baton strikes.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Reactor Spin",
        "description": "Jumps into a rapid vertical spin, creating a short-lived energy ring overhead.",
        "slot": "upSignature",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "downSignature": {
        "name": "Counter Lock",
        "description": "Braces both tonfas defensively; on a successful counter, traps the opponent's arm and throws them over the shoulder.",
        "slot": "downSignature",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      },
      "recovery": {
        "name": "Pulse Vault",
        "description": "Crosses the tonfas beneath the body and releases a pulse that launches the wielder upward.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 10,
    "name": "Impact Hammer",
    "design": "A massive rectangular steel hammerhead with orange impact crystals, reinforced corners, and a black shock-absorbing handle.",
    "moves": {
      "sideHeavy": {
        "name": "Hammer Jab",
        "description": "Short forward hammer thrust; quick startup and moderate knockback.",
        "slot": "sideHeavy",
        "geometry": "thrust",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "linear-thrust"
      },
      "upHeavy": {
        "name": "Bell Ringer",
        "description": "Swings the hammer overhead in a rising arc, launching opponents straight up.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Quake Strike",
        "description": "Slams the hammer down, sending two ground-hugging shockwaves in opposite directions.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Breakthrough",
        "description": "Charges forward with the hammer held low, then delivers an armored shoulder-and-hammer impact.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Meteor Lift",
        "description": "Jumps automatically and swings the hammer upward twice, with a powerful final hit.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Anvil Catch",
        "description": "Catches an adjacent opponent in a brief grab, hoists them overhead, and slams them into the ground.",
        "slot": "downSignature",
        "geometry": "grab",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "reach-catch-throw"
      },
      "recovery": {
        "name": "Rocket Mallet",
        "description": "Strikes downward with a burst of energy that propels the wielder upward.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 11,
    "name": "Rift Axe",
    "design": "A double-headed iron axe with asymmetrical blades, glowing red rift fissures, and a rugged leather-wrapped haft.",
    "moves": {
      "sideHeavy": {
        "name": "Splitter",
        "description": "One heavy horizontal chop with strong knockback.",
        "slot": "sideHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "upHeavy": {
        "name": "Axe Uppercut",
        "description": "Drives the axe upward with both hands, launching opponents diagonally.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Woodcutter",
        "description": "Performs two low chops; the second has a wider hitbox.",
        "slot": "downHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "sideSignature": {
        "name": "Rift Cleaver",
        "description": "Opens a short rift and swings through it, extending the attack's reach beyond the physical axe.",
        "slot": "sideSignature",
        "geometry": "phase",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "displace-strike"
      },
      "upSignature": {
        "name": "Sky Execution",
        "description": "Leaps upward with the axe raised and performs a rotating overhead cleave.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Hook and Hurl",
        "description": "Hooks an opponent at close range, pulls them in, and throws them diagonally downward.",
        "slot": "downSignature",
        "geometry": "grab",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "reach-catch-throw"
      },
      "recovery": {
        "name": "Whirlwind Rise",
        "description": "Spins the axe overhead while rising, with the strongest hit at the end of the rotation.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 12,
    "name": "Gravity Maul",
    "design": "A dense spherical black-metal hammerhead surrounded by rotating violet rings and floating metal fragments.",
    "moves": {
      "sideHeavy": {
        "name": "Gravity Slam",
        "description": "Slowly swings the maul forward; a hit briefly increases the opponent's fall speed before impact knockback.",
        "slot": "sideHeavy",
        "geometry": "burst",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "energy-burst"
      },
      "upHeavy": {
        "name": "Zero-G Launch",
        "description": "Raises the maul and creates a gravity pulse that lifts nearby enemies before launching them.",
        "slot": "upHeavy",
        "geometry": "burst",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "energy-burst"
      },
      "downHeavy": {
        "name": "Singularity",
        "description": "Slams the ground, pulling nearby opponents toward the impact point before the shockwave.",
        "slot": "downHeavy",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "sideSignature": {
        "name": "Mass Driver",
        "description": "Briefly anchors the wielder in place, then launches them forward with a devastating horizontal swing.",
        "slot": "sideSignature",
        "geometry": "burst",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "energy-burst"
      },
      "upSignature": {
        "name": "Orbital Lift",
        "description": "Creates a gravity field overhead that pulls enemies inward, followed by an upward maul strike.",
        "slot": "upSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "downSignature": {
        "name": "Heavy Gravity",
        "description": "Creates a localized field that slows enemy movement briefly, then smashes the ground.",
        "slot": "downSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "recovery": {
        "name": "Anti-Gravity Burst",
        "description": "Releases a downward gravity pulse that launches the wielder upward; the move deals damage directly beneath them.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 13,
    "name": "Pulse Flail",
    "design": "A reinforced steel handle connected to a long dark chain and a spiked metal orb with a cyan energy core.",
    "moves": {
      "sideHeavy": {
        "name": "Wide Orbit",
        "description": "Swings the chained orb in a broad horizontal circle.",
        "slot": "sideHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "upHeavy": {
        "name": "Chain Lift",
        "description": "Whips the orb overhead, then snaps it upward for a launching hit.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Ground Drag",
        "description": "Drags the orb along the floor before abruptly yanking it upward.",
        "slot": "downHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "sideSignature": {
        "name": "Unchained",
        "description": "Hurls the orb forward on an extended chain; a hit briefly pulls the opponent toward the wielder.",
        "slot": "sideSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "upSignature": {
        "name": "Storm Wheel",
        "description": "Spins the flail overhead, hitting repeatedly before releasing a final upward strike.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Chain Snare",
        "description": "Throws the chain around a nearby opponent's legs and sweeps them onto the ground.",
        "slot": "downSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "recovery": {
        "name": "Whip Ascension",
        "description": "Throws the orb upward and pulls on the chain, lifting the wielder toward it before a final swing.",
        "slot": "recovery",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      }
    }
  },
  {
    "id": 14,
    "name": "Resonance Spear",
    "design": "A long silver spear with a cyan crystal embedded in the spearhead, dark shaft, and small energy fins.",
    "moves": {
      "sideHeavy": {
        "name": "Longpoint",
        "description": "A long-reaching forward thrust with high range but a narrow hitbox.",
        "slot": "sideHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upHeavy": {
        "name": "Spear Fountain",
        "description": "Stabs upward three times; the last strike launches opponents.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Low Skewer",
        "description": "Drops low and thrusts along the ground, catching opponents approaching from the side.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Impaler Dash",
        "description": "Automatically dashes forward with the spear extended; a clean hit carries the opponent briefly before knocking them away.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Star Piercer",
        "description": "Jumps vertically and thrusts toward the sky, leaving a thin energy trail that damages only during the thrust.",
        "slot": "upSignature",
        "geometry": "thrust",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "linear-thrust"
      },
      "downSignature": {
        "name": "Vault and Pin",
        "description": "Vaults over a close opponent using the spear, then pins them briefly with a downward jab.",
        "slot": "downSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "recovery": {
        "name": "Pole Vault",
        "description": "Plants the spear below the wielder and uses it as a lever to spring upward.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 15,
    "name": "Rift Halberd",
    "design": "A long black polearm with a silver axe blade, rear hooking spike, and violet dimensional runes along the shaft.",
    "moves": {
      "sideHeavy": {
        "name": "Sweeping Glaive",
        "description": "A wide horizontal cut that covers more space than the spear.",
        "slot": "sideHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "upHeavy": {
        "name": "Hooked Rise",
        "description": "Hooks the blade upward, briefly drawing enemies toward the wielder before launching them.",
        "slot": "upHeavy",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "downHeavy": {
        "name": "Pole Sweep",
        "description": "Spins the shaft low, knocking enemies off balance on either side.",
        "slot": "downHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "sideSignature": {
        "name": "Rift Drag",
        "description": "Throws the halberd head through a short rift; a hit pulls the wielder forward into a follow-up chop.",
        "slot": "sideSignature",
        "geometry": "phase",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "displace-strike"
      },
      "upSignature": {
        "name": "Sky Hook",
        "description": "Leaps and hooks an opponent above, then throws them upward while the wielder falls slightly.",
        "slot": "upSignature",
        "geometry": "grab",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "reach-catch-throw"
      },
      "downSignature": {
        "name": "Execution Arc",
        "description": "Dashes backward and swings the halberd forward in a broad, low-to-high arc.",
        "slot": "downSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "recovery": {
        "name": "Spinning Pole Vault",
        "description": "Rotates the halberd beneath the body to launch upward with a final diagonal slash.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 16,
    "name": "Flux Staff",
    "design": "A lightweight black-and-silver staff with cyan crystals at both ends and rotating runic rings around its center.",
    "moves": {
      "sideHeavy": {
        "name": "Staff Combination",
        "description": "Strikes forward with one end, then reverses the staff for a second hit.",
        "slot": "sideHeavy",
        "geometry": "combo",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "staged-multi-hit"
      },
      "upHeavy": {
        "name": "Rising Spin",
        "description": "Spins the staff overhead in a vertical circle, hitting enemies above the wielder.",
        "slot": "upHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "downHeavy": {
        "name": "Sweeping Pivot",
        "description": "Plants one end on the ground and rotates around it in a low circular kick-and-staff attack.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Flux Dash",
        "description": "Spins the staff behind the body while dashing forward, ending in a forceful thrust.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Spiral Ascent",
        "description": "Automatically jumps and spins the staff vertically, carrying the wielder upward.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Repulsion Field",
        "description": "Slams the staff down to release a short-range circular pulse that pushes enemies away.",
        "slot": "downSignature",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "recovery": {
        "name": "Staff Spring",
        "description": "Plants the staff below the wielder and springs upward, damaging enemies caught beneath the lower end.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 17,
    "name": "Triad Trident",
    "design": "A three-pronged silver trident with a deep-blue central crystal, bronze fittings, and wave-shaped engravings.",
    "moves": {
      "sideHeavy": {
        "name": "Threefold Thrust",
        "description": "Three quick forward jabs with increasing reach.",
        "slot": "sideHeavy",
        "geometry": "thrust",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "linear-thrust"
      },
      "upHeavy": {
        "name": "Tide Fork",
        "description": "Sweeps the trident upward in a broad fork-shaped arc, launching opponents vertically.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Tidal Sweep",
        "description": "Performs a low circular sweep with the prongs, followed by a short ground-level energy wave.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Undertow Charge",
        "description": "Dashes forward with a thrust; on hit, a water-like energy surge pushes the opponent farther away.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Trident Ascension",
        "description": "Vaults upward and spins the trident, finishing with a vertical spear thrust.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Fisher's Catch",
        "description": "Hooks a nearby opponent with the center prong, lifts them slightly, and tosses them to the side.",
        "slot": "downSignature",
        "geometry": "grab",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "reach-catch-throw"
      },
      "recovery": {
        "name": "Rising Tide",
        "description": "Thrusts the trident downward to propel the wielder upward in a water-like burst.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 18,
    "name": "Pulse Bow",
    "design": "A curved dark-metal bow with a luminous cyan energy string and a crystal-shaped central grip.",
    "moves": {
      "sideHeavy": {
        "name": "Charged Shot",
        "description": "Fires a straight energy arrow; holding the attack slightly increases projectile power.",
        "slot": "sideHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upHeavy": {
        "name": "Sky Volley",
        "description": "Fires three arrows upward in a spread, covering different aerial angles.",
        "slot": "upHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downHeavy": {
        "name": "Ricochet Shot",
        "description": "Fires an arrow diagonally downward that bounces once off the ground.",
        "slot": "downHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "sideSignature": {
        "name": "Piercing Bolt",
        "description": "Automatically slides backward while charging, then fires a fast projectile that pierces through multiple opponents with reduced damage on subsequent hits.",
        "slot": "sideSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upSignature": {
        "name": "Falcon Shot",
        "description": "Jumps and fires a curved arrow that tracks upward before descending toward a target.",
        "slot": "upSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downSignature": {
        "name": "Trap Arrow",
        "description": "Fires an arrow into the ground, creating a short-lived snare that triggers when an opponent touches it.",
        "slot": "downSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "recovery": {
        "name": "Recoil Launch",
        "description": "Fires a powerful arrow straight down, propelling the wielder upward through recoil.",
        "slot": "recovery",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      }
    }
  },
  {
    "id": 19,
    "name": "Resonance Cannons",
    "design": "A pair of oversized dark-steel arm cannons with cyan reactor chambers, mechanical braces, and glowing muzzle rings.",
    "moves": {
      "sideHeavy": {
        "name": "Reactor Blast",
        "description": "Fires one slow, powerful energy orb with high knockback.",
        "slot": "sideHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upHeavy": {
        "name": "Anti-Air Burst",
        "description": "Fires a short upward blast that hits twice at close range.",
        "slot": "upHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downHeavy": {
        "name": "Ground Bombardment",
        "description": "Fires a heavy projectile diagonally downward that explodes on impact.",
        "slot": "downHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "sideSignature": {
        "name": "Overdrive Charge",
        "description": "Recoils backward while charging both cannons, then dashes forward behind a concentrated blast.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Twin Launchers",
        "description": "Fires two rockets upward at diverging angles, with small explosions at their endpoints.",
        "slot": "upSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downSignature": {
        "name": "Gravity Bomb",
        "description": "Drops a bomb beneath the wielder; it briefly pulls opponents inward before detonating.",
        "slot": "downSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "recovery": {
        "name": "Jet Recoil",
        "description": "Fires both cannons downward to launch the wielder upward, dealing damage to nearby enemies below.",
        "slot": "recovery",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      }
    }
  },
  {
    "id": 20,
    "name": "Twin Blasters",
    "design": "Two compact black-and-silver energy pistols with cyan chambers, angular muzzles, and illuminated rear sights.",
    "moves": {
      "sideHeavy": {
        "name": "Double Tap",
        "description": "Fires two fast shots in succession; the second shot has stronger knockback.",
        "slot": "sideHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upHeavy": {
        "name": "Rising Burst",
        "description": "Fires three shots at progressively steeper upward angles.",
        "slot": "upHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downHeavy": {
        "name": "Slide Fire",
        "description": "Slides backward while firing a quick three-shot spread toward the ground.",
        "slot": "downHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "sideSignature": {
        "name": "Bullet Rush",
        "description": "Dashes forward while firing alternating shots; the final close-range blast launches the opponent.",
        "slot": "sideSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upSignature": {
        "name": "Crossfire",
        "description": "Jumps and fires both blasters inward, crossing their projectile paths above the wielder.",
        "slot": "upSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downSignature": {
        "name": "Close Quarters",
        "description": "Grabs a nearby opponent with one arm, presses a blaster against them, and fires a short-range blast that throws them away.",
        "slot": "downSignature",
        "geometry": "grab",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "reach-catch-throw"
      },
      "recovery": {
        "name": "Twin Recoil",
        "description": "Fires both pistols diagonally downward while rising through recoil.",
        "slot": "recovery",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      }
    }
  },
  {
    "id": 21,
    "name": "Disc Launcher",
    "design": "A forearm-mounted launcher with a circular cyan-lit chamber and interchangeable serrated metal energy discs.",
    "moves": {
      "sideHeavy": {
        "name": "Flying Disc",
        "description": "Launches a spinning disc horizontally; it returns after reaching its maximum range.",
        "slot": "sideHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "upHeavy": {
        "name": "Vertical Ricochet",
        "description": "Fires a disc upward that ricochets off a surface before returning.",
        "slot": "upHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downHeavy": {
        "name": "Skipping Disc",
        "description": "Fires a low disc that skips along the ground and hits opponents repeatedly at reduced damage.",
        "slot": "downHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "sideSignature": {
        "name": "Recall Rush",
        "description": "Throws a powerful disc, then dashes forward as it curves back toward the wielder.",
        "slot": "sideSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upSignature": {
        "name": "Orbit Array",
        "description": "Jumps and launches three discs that orbit briefly overhead before shooting outward.",
        "slot": "upSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "downSignature": {
        "name": "Disc Mine",
        "description": "Plants a stationary spinning disc that triggers a burst when an opponent approaches.",
        "slot": "downSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "recovery": {
        "name": "Disc Hitch",
        "description": "Throws a disc upward; if it connects with a surface, a short energy tether pulls the wielder toward it. Otherwise, a recoil burst provides limited lift.",
        "slot": "recovery",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      }
    }
  },
  {
    "id": 22,
    "name": "Siege Projector",
    "design": "A bulky shoulder-mounted projector with a long angular barrel, orange reactor lens, heat vents, and reinforced side plates.",
    "moves": {
      "sideHeavy": {
        "name": "Siege Beam",
        "description": "Charges briefly and fires a straight, narrow beam with high range and strong pushback.",
        "slot": "sideHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upHeavy": {
        "name": "Interceptor",
        "description": "Fires a rapid burst of small upward projectiles that can interrupt approaching enemies.",
        "slot": "upHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downHeavy": {
        "name": "Mortar Shell",
        "description": "Launches a slow, arcing explosive shell that detonates on contact with the ground.",
        "slot": "downHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "sideSignature": {
        "name": "Artillery Advance",
        "description": "Locks the barrel forward, dashes a short distance, then fires a large projectile with a delayed explosion.",
        "slot": "sideSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upSignature": {
        "name": "Sky Barrage",
        "description": "Automatically jumps while launching several projectiles vertically; they spread apart before descending.",
        "slot": "upSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downSignature": {
        "name": "Siege Anchor",
        "description": "Braces in place and creates a brief defensive shield; the next attack fires a heavy close-range blast.",
        "slot": "downSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "recovery": {
        "name": "Emergency Thrusters",
        "description": "Fires a concentrated downward blast that launches the wielder upward, with noticeable recoil and a short vulnerable landing.",
        "slot": "recovery",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      }
    }
  },
  {
    "id": 23,
    "name": "Chainwhip",
    "design": "A black-metal whip handle connected to a segmented silver chain ending in a hooked blade, with violet energy links.",
    "moves": {
      "sideHeavy": {
        "name": "Whiplash",
        "description": "Snaps the chain forward in a quick straight strike with long reach.",
        "slot": "sideHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "upHeavy": {
        "name": "Overhead Crack",
        "description": "Whips the blade in a loop above the wielder, hitting twice before launching.",
        "slot": "upHeavy",
        "geometry": "combo",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "staged-multi-hit"
      },
      "downHeavy": {
        "name": "Ground Lash",
        "description": "Slams the chain against the floor, sending a low traveling shockwave forward.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Hunter's Reel",
        "description": "Hooks an opponent from range and pulls them toward the wielder for a close-range strike.",
        "slot": "sideSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "upSignature": {
        "name": "Whip Swing",
        "description": "Hooks the chain above and swings the wielder upward in an arc; the chain's sweep damages nearby enemies.",
        "slot": "upSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "downSignature": {
        "name": "Snare Line",
        "description": "Stretches a temporary chain trap along the ground that trips the first opponent to cross it.",
        "slot": "downSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "recovery": {
        "name": "Grapple Rise",
        "description": "Launches the chain diagonally upward; if it connects with a surface, the wielder pulls themselves toward it, otherwise they gain a short upward boost.",
        "slot": "recovery",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      }
    }
  },
  {
    "id": 24,
    "name": "Tether Gauntlets",
    "design": "Reinforced silver-black fighting gauntlets with cyan tether emitters on the wrists and articulated energy cables.",
    "moves": {
      "sideHeavy": {
        "name": "Boxer Rush",
        "description": "Delivers two punches, then fires a short tether-assisted third punch with extra knockback.",
        "slot": "sideHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upHeavy": {
        "name": "Grapple Uppercut",
        "description": "Punches upward and briefly catches the opponent with a tether, pulling them into the uppercut.",
        "slot": "upHeavy",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "downHeavy": {
        "name": "Ground Pound",
        "description": "Drops into a crouch and slams both fists into the ground, creating a short shockwave.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Tether Pursuit",
        "description": "Fires a tether at a nearby opponent and rapidly pulls the wielder forward into a heavy punch.",
        "slot": "sideSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upSignature": {
        "name": "Sky Grapple",
        "description": "Launches a tether overhead and automatically swings upward before delivering a rising punch.",
        "slot": "upSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "downSignature": {
        "name": "Counter Grapple",
        "description": "Briefly guards; if struck by a close-range attack, catches the attacker and throws them behind the wielder.",
        "slot": "downSignature",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      },
      "recovery": {
        "name": "Cable Launch",
        "description": "Fires both tethers diagonally upward and pulls the wielder into the air, with a small burst on release.",
        "slot": "recovery",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      }
    }
  },
  {
    "id": 25,
    "name": "Vector Rings",
    "design": "Three metallic floating rings of different sizes, each with cyan-violet runes and rotating inner energy bands.",
    "moves": {
      "sideHeavy": {
        "name": "Orbit Throw",
        "description": "Throws one ring horizontally; it curves back toward the wielder after reaching its range.",
        "slot": "sideHeavy",
        "geometry": "burst",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "energy-burst"
      },
      "upHeavy": {
        "name": "Halo Burst",
        "description": "Spins all three rings overhead, creating a multi-hit circular attack.",
        "slot": "upHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "downHeavy": {
        "name": "Ground Orbit",
        "description": "Sends the rings circling around the wielder at ankle height, striking nearby enemies on both sides.",
        "slot": "downHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "sideSignature": {
        "name": "Vector Shift",
        "description": "Dashes sideways while the rings fly forward along three slightly different trajectories.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Ring Elevator",
        "description": "Places the rings beneath the wielder and spins them rapidly to launch the character upward.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Convergence Trap",
        "description": "Sends the rings around a nearby opponent, then closes them inward for a brief multi-hit capture followed by a knockback burst.",
        "slot": "downSignature",
        "geometry": "combo",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "staged-multi-hit"
      },
      "recovery": {
        "name": "Orbit Lift",
        "description": "The rings rotate beneath the character, creating a short upward lift while one ring sweeps around as a protective hitbox.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 26,
    "name": "Vector Greaves",
    "design": "Heavy black-and-silver armored boots with cyan thruster vents, reinforced shin plates, and angular energy fins.",
    "moves": {
      "sideHeavy": {
        "name": "Running Kick",
        "description": "Automatically dashes forward and delivers a powerful side kick.",
        "slot": "sideHeavy",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upHeavy": {
        "name": "Rising Knee",
        "description": "Jumps slightly and drives a knee upward, launching opponents above the wielder.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Sweeping Heel",
        "description": "Spins low with an extended leg, sweeping opponents off their feet.",
        "slot": "downHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "sideSignature": {
        "name": "Breakneck Drive",
        "description": "Quickly retreats a short distance, then rockets forward with a flying kick.",
        "slot": "sideSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upSignature": {
        "name": "Jet Ascent",
        "description": "Fires the boot thrusters and rises diagonally with two alternating kicks.",
        "slot": "upSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "downSignature": {
        "name": "Meteor Stomp",
        "description": "Leaps upward briefly, then dives straight down with a heavy heel stomp; a grounded hit creates a small shockwave.",
        "slot": "downSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "recovery": {
        "name": "Thruster Kick",
        "description": "Performs a rising spinning kick with a sustained thruster burst, allowing slight horizontal steering.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 27,
    "name": "Orbit Core",
    "design": "A floating black-metal sphere with a bright cyan core, three rotating silver rings, and orbiting crystal fragments.",
    "moves": {
      "sideHeavy": {
        "name": "Core Pulse",
        "description": "Commands the core to fire a slow, compact energy projectile straight ahead.",
        "slot": "sideHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upHeavy": {
        "name": "Satellite Strike",
        "description": "Sends the core above the wielder, where it drops a fast energy pulse onto opponents beneath it.",
        "slot": "upHeavy",
        "geometry": "burst",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "energy-burst"
      },
      "downHeavy": {
        "name": "Orbital Sweep",
        "description": "Spins the core around the wielder at waist height, creating a short circular multi-hit attack.",
        "slot": "downHeavy",
        "geometry": "spin",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "rotational-combo"
      },
      "sideSignature": {
        "name": "Remote Detonation",
        "description": "Sends the core forward; after a brief delay, it explodes in a spherical burst. The wielder can move during the delay.",
        "slot": "sideSignature",
        "geometry": "burst",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "energy-burst"
      },
      "upSignature": {
        "name": "Orbital Launch",
        "description": "The core rises beneath the wielder and releases a pulse that launches them upward while knocking nearby enemies away.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Gravity Well",
        "description": "Places the core near the ground, pulling opponents toward it before releasing a radial blast.",
        "slot": "downSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "recovery": {
        "name": "Core Catch",
        "description": "Throws the core upward and teleports a short distance toward it, finishing with a small upward pulse. The teleport has a limited range and cannot be used to cross the entire stage.",
        "slot": "recovery",
        "geometry": "phase",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "displace-strike"
      }
    }
  },
  {
    "id": 28,
    "name": "Aegis Shield",
    "design": "A translucent cyan crystal shield with a silver rim, layered glass-like panels, and luminous protective runes.",
    "moves": {
      "sideHeavy": {
        "name": "Shield Bash",
        "description": "Lunges forward with the shield raised, delivering a blunt impact with moderate knockback.",
        "slot": "sideHeavy",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upHeavy": {
        "name": "Guardian Lift",
        "description": "Sweeps the shield overhead and launches opponents upward with its rim.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Bulwark Drop",
        "description": "Slams the shield into the ground, briefly blocking incoming frontal attacks and creating a low shockwave.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Unbreakable Charge",
        "description": "Advances behind a temporary frontal guard, then finishes with a heavy shield bash. The guard has limited duration.",
        "slot": "sideSignature",
        "geometry": "dash",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "commit-lunge"
      },
      "upSignature": {
        "name": "Aegis Dome",
        "description": "Jumps and creates a brief protective dome; its final pulse knocks enemies away from the wielder.",
        "slot": "upSignature",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      },
      "downSignature": {
        "name": "Perfect Guard",
        "description": "Enters a short counter stance. If a melee attack connects during the active window, deflects it and performs a shield-assisted throw.",
        "slot": "downSignature",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      },
      "recovery": {
        "name": "Shield Spring",
        "description": "Places the shield beneath the feet and rebounds upward, briefly protecting the wielder from a hit directly underneath.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 29,
    "name": "Shard Array",
    "design": "Five floating blue-cyan crystal blades with silver edges, arranged around a central control crystal that directs their movement.",
    "moves": {
      "sideHeavy": {
        "name": "Shard Volley",
        "description": "Fires three shards in rapid succession along a horizontal line.",
        "slot": "sideHeavy",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upHeavy": {
        "name": "Crystal Fan",
        "description": "Launches four shards upward in a fan-shaped spread.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Falling Needles",
        "description": "Sends shards above the wielder; they fall diagonally toward the ground in sequence.",
        "slot": "downHeavy",
        "geometry": "slam",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "ground-impact"
      },
      "sideSignature": {
        "name": "Guided Barrage",
        "description": "Dashes backward while the shards lock onto an opponent's last position and fire in staggered succession. The projectiles have limited tracking.",
        "slot": "sideSignature",
        "geometry": "projectile",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-projectile"
      },
      "upSignature": {
        "name": "Ascending Array",
        "description": "Jumps automatically while shards rotate vertically around the wielder, then shoot upward together.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Crystal Cage",
        "description": "Places shards around a nearby opponent to create a brief, breakable trap before they converge for a final hit.",
        "slot": "downSignature",
        "geometry": "control",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "trap-control"
      },
      "recovery": {
        "name": "Shard Propulsion",
        "description": "Sends shards downward in sequence to propel the wielder upward; each shard produces a small hitbox as it leaves the formation.",
        "slot": "recovery",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      }
    }
  },
  {
    "id": 30,
    "name": "Bastion Set",
    "design": "A pair of reinforced dark-steel forearm guards and a compact rectangular shield with gold energy inlays and thick beveled edges.",
    "moves": {
      "sideHeavy": {
        "name": "Fortress Punch",
        "description": "Steps forward with a heavy armored punch followed by a shield strike.",
        "slot": "sideHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "upHeavy": {
        "name": "Bastion Breaker",
        "description": "Raises both arms and delivers a double-fist uppercut that launches enemies straight upward.",
        "slot": "upHeavy",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downHeavy": {
        "name": "Defensive Sweep",
        "description": "Drops into a low stance and sweeps the shield sideways, with brief frontal protection during startup.",
        "slot": "downHeavy",
        "geometry": "sweep",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "weapon-arc"
      },
      "sideSignature": {
        "name": "Countercharge",
        "description": "Braces behind the shield, then rushes forward with a powerful shoulder-first bash. Blocking an attack during startup strengthens the finishing hit.",
        "slot": "sideSignature",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      },
      "upSignature": {
        "name": "Fortress Rise",
        "description": "Performs a jumping shield uppercut, creating a protective energy barrier during ascent.",
        "slot": "upSignature",
        "geometry": "rise",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "vertical-launch"
      },
      "downSignature": {
        "name": "Iron Prison",
        "description": "Grabs a nearby opponent between the forearm guards, squeezes briefly, then throws them backward. Misses leave the wielder vulnerable.",
        "slot": "downSignature",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      },
      "recovery": {
        "name": "Bastion Bounce",
        "description": "Slams both guards downward, using the impact to launch upward while briefly reducing incoming knockback.",
        "slot": "recovery",
        "geometry": "counter",
        "phaseWindows": {
          "startup": [
            0,
            0.24
          ],
          "active": [
            0.24,
            0.72
          ],
          "recovery": [
            0.72,
            1
          ]
        },
        "motion": "brace-counter"
      }
    }
  }
];
export const RESONANCE_CONSTRUCT_SPEC_BY_NAME = Object.fromEntries(RESONANCE_CONSTRUCT_SPECS.map((w) => [w.name, w]));
export function getResonanceMoveSpec(weaponName, slot) { return RESONANCE_CONSTRUCT_SPEC_BY_NAME[weaponName]?.moves?.[slot] || null; }
