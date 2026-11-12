// Demo data. Play counts, remix counts, creators and earnings are illustrative.
window.PB = (() => {
  const creators = {
    mossbyte:   { name: 'mossbyte',   bio: 'Tiny 3D worlds, big game feel.',             hue: 18 },
    kiln:       { name: 'kiln',       bio: 'Puzzles you can feel in your thumbs.',        hue: 48 },
    'otto.wav': { name: 'otto.wav',   bio: 'Arcade loops with too many particles.',       hue: 190 },
    drifthaus:  { name: 'drifthaus',  bio: 'Speed, synths, and one more run.',            hue: 318 },
    tallgrass:  { name: 'tallgrass',  bio: 'Soft colours, sharp controls.',               hue: 140 },
    nuri:       { name: 'nuri',       bio: 'Remixing everything into candy.',             hue: 280 },
    vantae:     { name: 'vantae',     bio: 'Space things. Mostly orbiting.',              hue: 210 },
    pixelnoodle:{ name: 'pixelnoodle',bio: 'Ships a new swing game every weekend.',       hue: 90 },
  };

  const bases = [
    {
      slug: 'neon-drift', is3d: true, genres: ['Racing', '3D'],
      controls: 'A / D or ← / → to steer · drag on touch',
      mechanics: ['camera-follow', 'screen-shake', 'particle-burst', 'dash-trail'],
      audio: 'Synth engine hum, pickup blips, crash thump (WebAudio)',
      prompt: 'Make an endless 3D hover-racer in one HTML file with Three.js. Steer left/right to dodge pylons and grab energy shards. Speed ramps up, near-misses give bonus. Add camera lean, screen shake on crashes and a particle trail.',
      themes: [
        { title: 'Neon Drift',  by: 'drifthaus',  colors: ['#ff2fb3', '#19e3ff'], style: 'Synthwave night · grid floor · glowing sun', plays: 1284000, remixes: 3120, days: 41 },
        { title: 'Dune Drift',  by: 'mossbyte',   colors: ['#ffb057', '#8a3414'], style: 'Desert sunset · sandstone pillars', plays: 412000, remixes: 640, days: 19 },
        { title: 'Frost Drift', by: 'tallgrass',  colors: ['#c9efff', '#3a6ea5'], style: 'Glacier blue · crystal obstacles · snowfall', plays: 198000, remixes: 211, days: 6 },
      ],
    },
    {
      slug: 'swarm-arena', is3d: false, genres: ['Survivor', 'Action'],
      controls: 'WASD / arrows to move · auto-fire · pick 1 of 3 on level-up',
      mechanics: ['upgrade-cards', 'damage-numbers', 'screen-shake', 'hit-stop', 'particle-burst'],
      audio: 'Pew stack, XP chime ladder, level-up sting (WebAudio)',
      prompt: 'Make a top-down arena survivor in one HTML file on Canvas 2D. Auto-fire at the nearest enemy, waves that swarm, XP gems, and a pick-1-of-3 upgrade screen on level-up. Add damage numbers, hit-stop and screen shake.',
      themes: [
        { title: 'Swarm Arena',  by: 'otto.wav',    colors: ['#7c5cff', '#00e0b8'], style: 'Dark neon · geometric enemies', plays: 2051000, remixes: 4870, days: 58 },
        { title: 'Garden Swarm', by: 'tallgrass',   colors: ['#f3ead2', '#7fb069'], style: 'Paper background · bugs · tiny gardener', plays: 733000, remixes: 902, days: 23 },
        { title: 'Deep Swarm',   by: 'vantae',      colors: ['#0b3c6f', '#5fd4ff'], style: 'Underwater blues · jellyfish · bubbles', plays: 301000, remixes: 318, days: 9 },
      ],
    },
    {
      slug: 'sky-hop', is3d: true, genres: ['Platformer', '3D'],
      controls: '← / → or A / D to steer · hold Space to hop longer',
      mechanics: ['platformer-controller', 'camera-follow', 'particle-burst'],
      audio: 'Bouncy hop pitch ladder, gem sparkle, crumble (WebAudio)',
      prompt: 'Make a 3D tile-hopping game in one HTML file with Three.js. A bouncy character auto-hops forward; steer to land on floating tiles that crumble, move and shrink. Low-poly look, fog, smooth follow camera, squash and stretch.',
      themes: [
        { title: 'Sky Hop',   by: 'mossbyte', colors: ['#9ad8ff', '#ffd6e8'], style: 'Pastel sky islands · clouds', plays: 968000, remixes: 2240, days: 34 },
        { title: 'Lava Hop',  by: 'drifthaus', colors: ['#ff5a1f', '#2a0d08'], style: 'Volcanic rock · glowing lava · embers', plays: 356000, remixes: 505, days: 15 },
        { title: 'Candy Hop', by: 'nuri',      colors: ['#ff8ad1', '#ffe45c'], style: 'Glossy candy tiles · sprinkles', plays: 524000, remixes: 780, days: 4 },
      ],
    },
    {
      slug: 'grapple-rush', is3d: false, genres: ['Platformer', 'Action'],
      controls: 'Hold mouse / Space / touch to grapple · release to fling',
      mechanics: ['grapple-hook', 'camera-follow', 'dash-trail', 'particle-burst'],
      audio: 'Rope zip, wind whoosh by speed, coin ping (WebAudio)',
      prompt: 'Make a side-scrolling grappling-hook swinger in one HTML file on Canvas 2D. Hold to fire a rope at the nearest anchor and swing with real pendulum physics, release to fling. Parallax background, speed lines, coins.',
      themes: [
        { title: 'Grapple Rush', by: 'pixelnoodle', colors: ['#1b1f4b', '#ff4d9d'], style: 'Night skyline · neon anchors · parallax', plays: 842000, remixes: 1960, days: 47 },
        { title: 'Jungle Swing', by: 'tallgrass',   colors: ['#1f6f43', '#d9f27e'], style: 'Green canopy · vines · fireflies', plays: 290000, remixes: 402, days: 21 },
        { title: 'Cave Swing',   by: 'vantae',      colors: ['#3b1d6e', '#9ff5ff'], style: 'Crystal cave · stalactites · glow', plays: 151000, remixes: 144, days: 11 },
      ],
    },
    {
      slug: 'core-defender', is3d: true, genres: ['Shooter', '3D'],
      controls: 'A / D or ← / → to orbit · auto-fire · drag on touch',
      mechanics: ['screen-shake', 'particle-burst', 'hit-stop', 'damage-numbers'],
      audio: 'Laser ticks, core alarm, shield pulse (WebAudio)',
      prompt: 'Make a 3D orbital defence game in one HTML file with Three.js. A ship orbits a glowing core and auto-fires outward at things falling in from every direction. Waves escalate, power-ups drop, the core has health. Fake bloom with additive sprites.',
      themes: [
        { title: 'Core Defender', by: 'vantae',  colors: ['#0a2a33', '#5ff0d0'], style: 'Deep space teal · rocky meteors', plays: 677000, remixes: 1410, days: 29 },
        { title: 'Hive Core',     by: 'otto.wav', colors: ['#2c0f47', '#a6ff4d'], style: 'Organic green/purple · spores · pulsing core', plays: 244000, remixes: 356, days: 13 },
        { title: 'Solar Core',    by: 'drifthaus', colors: ['#ffb300', '#b3200a'], style: 'Sun core · solar flares', plays: 189000, remixes: 97, days: 2 },
      ],
    },
    {
      slug: 'tile-forge', is3d: false, genres: ['Puzzle'],
      controls: 'Click / tap a group of 2+ matching tiles',
      mechanics: ['particle-burst', 'screen-shake', 'damage-numbers', 'loot-reveal'],
      audio: 'Pitched pops by combo size, heat sizzle (WebAudio)',
      prompt: 'Make a tactile collapse puzzle in one HTML file on Canvas 2D. Tap connected groups of same-colour tiles to smelt them; tiles fall with bouncy easing. Bigger groups score exponentially and spawn bombs. Add a heat meter and lots of juice.',
      themes: [
        { title: 'Tile Forge', by: 'kiln', colors: ['#2a1206', '#ff7a1a'], style: 'Dark forge · molten ingots · sparks', plays: 1532000, remixes: 2680, days: 52 },
        { title: 'Gem Forge',  by: 'nuri', colors: ['#2b0a3d', '#57e6ff'], style: 'Cut jewels on velvet · sparkle', plays: 468000, remixes: 590, days: 17 },
        { title: 'Mochi Pop',  by: 'nuri', colors: ['#ffe9f2', '#ff9ec4'], style: 'Pastel squishy blobs with faces', plays: 889000, remixes: 1203, days: 7 },
      ],
    },
  ];

  const games = [];
  bases.forEach(b => b.themes.forEach((t, i) => {
    games.push({
      id: i === 0 ? b.slug : `${b.slug}-${i}`,
      base: b.slug, theme: i,
      src: `games/${b.slug}.html?theme=${i}`,
      parent: i === 0 ? null : b.slug,
      title: t.title, by: t.by, colors: t.colors, style: t.style,
      plays: t.plays, remixes: t.remixes, days: t.days,
      is3d: b.is3d, genres: b.genres, controls: b.controls,
      mechanics: b.mechanics, audio: b.audio,
      prompt: i === 0 ? b.prompt : `Remake "${b.themes[0].title}" with a new look: ${t.style.toLowerCase()}. Keep the controls and difficulty curve, change the shapes, palette and sound to match.`,
    });
  }));

  const mechanics = [
    { slug: 'platformer-controller', name: 'Platformer Controller', cat: 'Movement', by: 'mossbyte', installs: 48200,
      desc: 'Acceleration, variable jump height, coyote time and jump buffering, with squash and stretch.',
      prompt: 'Add a platformer controller with acceleration curves, variable jump height, 100ms coyote time, 120ms jump buffer, squash & stretch and landing dust.' },
    { slug: 'screen-shake', name: 'Trauma Screen Shake', cat: 'Feel', by: 'otto.wav', installs: 91300,
      desc: 'Trauma-based camera shake that stacks and decays, instead of random jitter.',
      prompt: 'Add trauma-based screen shake: impacts add trauma (0–1), shake = trauma², decay over time, rotate slightly as well as translate.' },
    { slug: 'hit-stop', name: 'Hit Stop', cat: 'Feel', by: 'otto.wav', installs: 63900,
      desc: 'Freeze frames, white flash and knockback so every hit lands.',
      prompt: 'Add hit-stop on impact: freeze the whole world for 70ms + 75ms × hit power (about 120–180ms), keep the target fully white for the whole freeze, then apply knockback to the target and recoil to the attacker when the freeze ends.' },
    { slug: 'particle-burst', name: 'Layered Particle Burst', cat: 'Feel', by: 'kiln', installs: 77400,
      desc: 'Sparks, smoke, shockwave ring and debris in one call.',
      prompt: 'Add a burst(x, y, power) effect with four layers: fast sparks, slow smoke, an expanding shockwave ring and debris with gravity. Cap total particles.' },
    { slug: 'grapple-hook', name: 'Grapple Hook', cat: 'Movement', by: 'pixelnoodle', installs: 29800,
      desc: 'Pendulum rope physics with a release fling.',
      prompt: 'Add a grappling hook: fire at the nearest anchor, constrain to rope length, simulate pendulum swing, keep momentum on release.' },
    { slug: 'dash-trail', name: 'Dash + Afterimage', cat: 'Movement', by: 'drifthaus', installs: 41100,
      desc: 'A snappy dash with afterimages, speed lines and a cooldown ring.',
      prompt: 'Add a dash toward the pointer with eased burst speed, fading afterimages, speed lines and a visible cooldown ring.' },
    { slug: 'upgrade-cards', name: 'Pick 1 of 3', cat: 'Progression', by: 'otto.wav', installs: 58700,
      desc: 'Level-up cards that deal in, tilt on hover and confirm with a burst.',
      prompt: 'Add a level-up screen that pauses the game and deals three upgrade cards with stagger, 3D tilt on hover and a confirm burst.' },
    { slug: 'loot-reveal', name: 'Loot Reveal', cat: 'Progression', by: 'nuri', installs: 22600,
      desc: 'Shake, crack, rarity beam, confetti.',
      prompt: 'Add a loot reveal: the capsule shakes with rising intensity, cracks open, shows the item with a rarity-coloured beam and confetti.' },
    { slug: 'damage-numbers', name: 'Damage Numbers', cat: 'Feedback', by: 'vantae', installs: 53300,
      desc: 'Pop, arc and fade, with crits that look like crits.',
      prompt: 'Add floating damage numbers: pop-scale in, arc sideways, fade out; crits are larger, coloured and shake; nearby numbers stack.' },
    { slug: 'camera-follow', name: 'Smooth Camera', cat: 'Camera', by: 'tallgrass', installs: 69500,
      desc: 'Smooth-damped follow with look-ahead and a dead zone.',
      prompt: 'Add a camera that follows with critically damped smoothing, look-ahead in the movement direction and a small dead zone.' },
  ];

  const byId = Object.fromEntries(games.map(g => [g.id, g]));
  const mechBySlug = Object.fromEntries(mechanics.map(m => [m.slug, m]));
  return { creators, games, mechanics, byId, mechBySlug };
})();
