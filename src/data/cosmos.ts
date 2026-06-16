import type { CelestialBody, VoyagePreset } from '../types'
import { AU_IN_LY, LY_IN_KM, auToSceneRadius, lyToSceneRadius, raDecToUnit, eclipticUnit } from '../lib/astro'

type Raw = Omit<CelestialBody, 'realPos' | 'scenePos' | 'distanceLy'> & {
  distanceLy?: number
}

/** Place a top-level body (planet, star, deep-sky object) in real- and scene-space. */
function place(raw: Raw): Pick<CelestialBody, 'realPos' | 'scenePos' | 'distanceLy'> {
  if (raw.region === 'solar') {
    const au = raw.au ?? 0
    const u = eclipticUnit(raw.lonDeg ?? 0)
    const helioLy = au * AU_IN_LY // real heliocentric distance
    const distanceLy = raw.distanceLy ?? helioLy
    const r = auToSceneRadius(au)
    return {
      realPos: [u[0] * helioLy, u[1] * helioLy, u[2] * helioLy],
      scenePos: [u[0] * r, u[1] * r, u[2] * r],
      distanceLy,
    }
  }
  const u = raDecToUnit(raw.ra ?? 0, raw.dec ?? 0)
  const distanceLy = raw.distanceLy ?? 0
  const r = lyToSceneRadius(distanceLy)
  return {
    realPos: [u[0] * distanceLy, u[1] * distanceLy, u[2] * distanceLy],
    scenePos: [u[0] * r, u[1] * r, u[2] * r],
    distanceLy,
  }
}

/** Two-pass assembly so moons can be placed relative to their parent planet. */
function assemble(raws: Raw[]): CelestialBody[] {
  const map = new Map<string, CelestialBody>()
  // pass 1 — everything that isn't a moon-of-something
  raws.filter((r) => !r.parentId).forEach((r) => map.set(r.id, { ...r, ...place(r) }))
  // pass 2 — moons, offset from their parent
  raws.filter((r) => r.parentId).forEach((r) => {
    const parent = map.get(r.parentId!)!
    const distLy = (r.parentDistKm ?? 0) / LY_IN_KM
    const off = eclipticUnit(r.lonDeg ?? 0)
    map.set(r.id, {
      ...r,
      distanceLy: distLy,
      realPos: [
        parent.realPos[0] + off[0] * distLy,
        parent.realPos[1] + off[1] * distLy,
        parent.realPos[2] + off[2] * distLy,
      ],
      scenePos: [
        parent.scenePos[0] + off[0] * 0.85,
        parent.scenePos[1] + 0.12,
        parent.scenePos[2] + off[2] * 0.85,
      ],
    })
  })
  return raws.map((r) => map.get(r.id)!)
}

const RAW: Raw[] = [
  // ── The Solar System ──────────────────────────────────────────────────────
  {
    id: 'sun', name: 'The Sun', emoji: '☀️', kind: 'star', kindLabel: 'G-type star · Sol',
    region: 'solar', au: 0, lonDeg: 0, distanceLy: 0, color: '#ffd479', size: 1.7,
    vibe: 'Our star',
    facts: ['Holds 99.86% of the Solar System’s mass.', 'Surface ~5,500°C; its light takes 8m20s to reach Earth.'],
    diameterKm: 1392700, tempC: 5505, source: 'NASA Sun Fact Sheet',
  },
  {
    id: 'mercury', name: 'Mercury', emoji: '🌑', kind: 'planet', kindLabel: 'Rocky planet',
    region: 'solar', au: 0.387, lonDeg: 24, color: '#b9b2a6', size: 0.4, vibe: 'Scorched',
    facts: ['Smallest planet; a year lasts just 88 Earth-days.', 'Swings from +430°C in sunlight to −180°C in shadow.'],
    diameterKm: 4879, gravityG: 0.38, dayLengthHours: 4222.6, tempC: 167, source: 'NASA',
  },
  {
    id: 'venus', name: 'Venus', emoji: '🟠', kind: 'planet', kindLabel: 'Rocky planet',
    region: 'solar', au: 0.723, lonDeg: 68, color: '#e8cda0', size: 0.62, vibe: 'Greenhouse',
    facts: ['Hottest planet — a crushing CO₂ blanket bakes it to 465°C.', 'Spins backwards; one day is longer than its year.'],
    diameterKm: 12104, gravityG: 0.91, dayLengthHours: 2802, tempC: 464, source: 'NASA',
  },
  {
    id: 'earth', name: 'Earth', emoji: '🌍', kind: 'planet', kindLabel: 'Home world',
    region: 'solar', au: 1.0, lonDeg: 120, color: '#4f9cff', size: 0.64, vibe: 'Home',
    facts: ['The only world known to host life.', 'Where every voyage begins.'],
    diameterKm: 12742, gravityG: 1, dayLengthHours: 24, tempC: 15, source: 'NASA',
  },
  {
    id: 'moon', name: 'The Moon', emoji: '🌕', kind: 'moon', kindLabel: 'Earth’s moon',
    region: 'solar', parentId: 'earth', parentDistKm: 384400, lonDeg: 35, color: '#cfcfd6', size: 0.26,
    vibe: 'Our companion',
    facts: ['384,400 km away — 1.3 light-seconds.', 'Artemis aims to return humans here this decade.'],
    diameterKm: 3475, gravityG: 0.166, dayLengthHours: 708.7, tempC: -20, source: 'NASA Artemis',
  },
  {
    id: 'mars', name: 'Mars', emoji: '🔴', kind: 'planet', kindLabel: 'Rocky planet',
    region: 'solar', au: 1.524, lonDeg: 205, color: '#e0744a', size: 0.5, vibe: 'The next frontier',
    facts: ['Home to Olympus Mons, a volcano ~2.5× the height of Everest.', 'Rovers Perseverance & Curiosity roam it now.'],
    diameterKm: 6779, gravityG: 0.38, dayLengthHours: 24.7, tempC: -65, source: 'NASA',
  },
  {
    id: 'ceres', name: 'Ceres', emoji: '⚪', kind: 'dwarf', kindLabel: 'Dwarf planet · asteroid belt',
    region: 'solar', au: 2.77, lonDeg: 340, color: '#9a9088', size: 0.3, vibe: 'Belt dwarf',
    facts: ['Largest object in the asteroid belt.', 'Hides bright salt deposits and a possible briny ocean.'],
    diameterKm: 940, gravityG: 0.029, source: 'NASA Dawn',
  },
  {
    id: 'jupiter', name: 'Jupiter', emoji: '🪐', kind: 'planet', kindLabel: 'Gas giant',
    region: 'solar', au: 5.203, lonDeg: 300, color: '#d9a679', size: 1.2, vibe: 'King of planets',
    facts: ['So massive all other planets could fit inside it.', 'The Great Red Spot is a storm wider than Earth.'],
    diameterKm: 139820, gravityG: 2.53, dayLengthHours: 9.9, tempC: -110, source: 'NASA Juno',
  },
  {
    id: 'europa', name: 'Europa', emoji: '🧊', kind: 'moon', kindLabel: 'Icy moon of Jupiter',
    region: 'solar', parentId: 'jupiter', parentDistKm: 671100, lonDeg: 60, color: '#d8d0bf', size: 0.3, vibe: 'Ocean moon',
    facts: ['A salty ocean hides beneath its icy crust — a top hunt for life.', 'NASA’s Europa Clipper is en route to survey it.'],
    diameterKm: 3122, gravityG: 0.134, source: 'NASA Europa Clipper',
  },
  {
    id: 'saturn', name: 'Saturn', emoji: '🪐', kind: 'planet', kindLabel: 'Gas giant',
    region: 'solar', au: 9.537, lonDeg: 26, color: '#e6cf9c', size: 1.1, vibe: 'Ringed jewel',
    facts: ['Its rings span 280,000 km but are only ~10 m thick.', 'Light enough to float on water.'],
    diameterKm: 116460, gravityG: 1.07, dayLengthHours: 10.7, tempC: -140, source: 'NASA Cassini',
  },
  {
    id: 'titan', name: 'Titan', emoji: '🟤', kind: 'moon', kindLabel: 'Largest moon of Saturn',
    region: 'solar', parentId: 'saturn', parentDistKm: 1221870, lonDeg: 205, color: '#d9a23f', size: 0.34, vibe: 'Methane seas',
    facts: ['The only moon with a thick atmosphere — and liquid rivers & lakes.', 'But the rain is methane, not water.'],
    diameterKm: 5150, gravityG: 0.14, source: 'NASA Dragonfly',
  },
  {
    id: 'enceladus', name: 'Enceladus', emoji: '❄️', kind: 'moon', kindLabel: 'Icy moon of Saturn',
    region: 'solar', parentId: 'saturn', parentDistKm: 238040, lonDeg: 320, color: '#eaf6ff', size: 0.26, vibe: 'Geysers of ice',
    facts: ['Fires water-ice geysers from a buried ocean into space.', 'Cassini flew straight through its plumes.'],
    diameterKm: 504, gravityG: 0.011, source: 'NASA Cassini',
  },
  {
    id: 'uranus', name: 'Uranus', emoji: '🔵', kind: 'planet', kindLabel: 'Ice giant',
    region: 'solar', au: 19.19, lonDeg: 150, color: '#9fe7e3', size: 0.9, vibe: 'Tilted ice giant',
    facts: ['Rolls on its side at a 98° tilt — seasons last 21 years.', 'Visited once, by Voyager 2 in 1986.'],
    diameterKm: 50724, gravityG: 0.89, dayLengthHours: 17.2, tempC: -195, source: 'NASA',
  },
  {
    id: 'neptune', name: 'Neptune', emoji: '🔵', kind: 'planet', kindLabel: 'Ice giant',
    region: 'solar', au: 30.07, lonDeg: 250, color: '#5b78ff', size: 0.88, vibe: 'Wind world',
    facts: ['Supersonic winds reach 2,100 km/h — fastest in the Solar System.', 'The farthest major planet from the Sun.'],
    diameterKm: 49244, gravityG: 1.14, dayLengthHours: 16, tempC: -200, source: 'NASA',
  },
  {
    id: 'pluto', name: 'Pluto', emoji: '🤍', kind: 'dwarf', kindLabel: 'Dwarf planet · Kuiper Belt',
    region: 'solar', au: 39.48, lonDeg: 84, color: '#c8b4a0', size: 0.3, vibe: 'Dwarf at the edge',
    facts: ['Wears a giant nitrogen-ice heart, Tombaugh Regio.', 'New Horizons revealed it up close in 2015.'],
    diameterKm: 2377, gravityG: 0.063, source: 'NASA New Horizons',
  },

  // ── Nearby stars ──────────────────────────────────────────────────────────
  {
    id: 'proxima', name: 'Proxima Centauri', emoji: '⭐', kind: 'star', kindLabel: 'Red dwarf',
    region: 'deep', ra: 14.496, dec: -62.679, distanceLy: 4.246, color: '#ff7e6b', size: 0.7,
    vibe: 'The nearest star',
    facts: ['The closest star to the Sun.', 'A flare star that hosts at least two planets.'],
    source: 'Gaia / ESA',
  },
  {
    id: 'alpha-cen', name: 'Alpha Centauri', emoji: '✨', kind: 'star', kindLabel: 'Triple star system',
    region: 'deep', ra: 14.660, dec: -60.834, distanceLy: 4.367, color: '#ffe9c4', size: 0.85,
    vibe: 'The Sun’s neighbors',
    facts: ['Two Sun-like stars locked in a 79-year dance, plus Proxima.', 'The prime target for any first interstellar mission.'],
    source: 'Gaia / ESA',
  },
  {
    id: 'barnard', name: "Barnard's Star", emoji: '⭐', kind: 'star', kindLabel: 'Red dwarf',
    region: 'deep', ra: 17.963, dec: 4.693, distanceLy: 5.963, color: '#ff9d6b', size: 0.6,
    vibe: 'Fastest mover',
    facts: ['Races across our sky faster than any other star.', 'A sub-Earth-mass planet was confirmed in 2024.'],
    source: 'Gaia / ESO',
  },
  {
    id: 'sirius', name: 'Sirius', emoji: '🌟', kind: 'star', kindLabel: 'Binary star · Canis Major',
    region: 'deep', ra: 6.752, dec: -16.716, distanceLy: 8.611, color: '#cfe2ff', size: 0.95,
    vibe: 'Brightest star',
    facts: ['The brightest star in Earth’s night sky.', 'Has a white-dwarf companion, "the Pup."'],
    source: 'Hipparcos',
  },
  {
    id: 'vega', name: 'Vega', emoji: '🌟', kind: 'star', kindLabel: 'A-type star · Lyra',
    region: 'deep', ra: 18.616, dec: 38.784, distanceLy: 25.04, color: '#dbe7ff', size: 0.85,
    vibe: 'Summer beacon',
    facts: ['Once the North Star — and will be again in ~12,000 years.', 'Ringed by a dusty debris disk.'],
    source: 'Hipparcos',
  },
  {
    id: 'polaris', name: 'Polaris', emoji: '🧭', kind: 'star', kindLabel: 'Cepheid supergiant',
    region: 'deep', ra: 2.530, dec: 89.264, distanceLy: 433, color: '#fff4d6', size: 0.95,
    vibe: 'The North Star',
    facts: ['Sits almost exactly above Earth’s north pole.', 'Has guided travelers for thousands of years.'],
    source: 'Hubble / Gaia',
  },
  {
    id: 'betelgeuse', name: 'Betelgeuse', emoji: '🔴', kind: 'star', kindLabel: 'Red supergiant · Orion',
    region: 'deep', ra: 5.919, dec: 7.407, distanceLy: 548, color: '#ff6b5a', size: 1.2,
    vibe: 'Doomed supergiant',
    facts: ['So huge it would swallow Jupiter’s orbit.', 'Will explode as a supernova — sometime in the next 100,000 years.'],
    source: 'ESO',
  },
  {
    id: 'rigel', name: 'Rigel', emoji: '🔵', kind: 'star', kindLabel: 'Blue supergiant · Orion',
    region: 'deep', ra: 5.242, dec: -8.202, distanceLy: 863, color: '#bcd2ff', size: 1.1,
    vibe: 'Blue giant',
    facts: ['Shines ~120,000× brighter than the Sun.', 'The brightest star in the constellation Orion.'],
    source: 'Hipparcos',
  },

  // ── Exoplanets ──────────────────────────────────────────────────────────────
  {
    id: 'proxima-b', name: 'Proxima Centauri b', emoji: '🌎', kind: 'exoplanet', kindLabel: 'Rocky exoplanet',
    region: 'deep', ra: 14.496, dec: -62.679, distanceLy: 4.246, color: '#6fd6a0', size: 0.55,
    vibe: 'Habitable zone',
    facts: ['The closest known exoplanet to Earth.', 'Orbits in Proxima’s habitable zone — but bathed in flares.'],
    discovered: '2016', source: 'ESO',
  },
  {
    id: 'trappist-1e', name: 'TRAPPIST-1e', emoji: '🌎', kind: 'exoplanet', kindLabel: 'Rocky exoplanet',
    region: 'deep', ra: 23.106, dec: -5.041, distanceLy: 40.66, color: '#6fd6a0', size: 0.55,
    vibe: 'Seven worlds',
    facts: ['One of seven Earth-size planets around a single red dwarf.', 'Among the best bets for liquid water in the system.'],
    discovered: '2017', source: 'NASA Spitzer / JWST',
  },
  {
    id: 'kepler-452b', name: 'Kepler-452b', emoji: '🌎', kind: 'exoplanet', kindLabel: 'Super-Earth',
    region: 'deep', ra: 19.773, dec: 44.280, distanceLy: 1402, color: '#7fc9ff', size: 0.6,
    vibe: "Earth’s cousin",
    facts: ['Orbits a Sun-like star in its habitable zone.', 'Its "year" is 385 days — eerily Earth-like.'],
    discovered: '2015', source: 'NASA Kepler',
  },
  {
    id: 'toi-700d', name: 'TOI-700 d', emoji: '🌎', kind: 'exoplanet', kindLabel: 'Rocky exoplanet',
    region: 'deep', ra: 6.455, dec: -65.578, distanceLy: 101.4, color: '#6fd6a0', size: 0.55,
    vibe: 'Habitable zone',
    facts: ['First Earth-size habitable-zone world found by TESS.', 'About 10% larger than Earth.'],
    discovered: '2020', source: 'NASA TESS',
  },
  {
    id: 'peg51b', name: '51 Pegasi b', emoji: '🟠', kind: 'exoplanet', kindLabel: 'Hot Jupiter',
    region: 'deep', ra: 22.958, dec: 20.769, distanceLy: 50.45, color: '#ff8a5c', size: 0.7,
    vibe: 'The first',
    facts: ['The first planet ever found orbiting a Sun-like star (1995).', 'A scorching gas giant that hugs its star in 4 days.'],
    discovered: '1995', source: 'Nobel Prize 2019',
  },
  {
    id: 'hd189733b', name: 'HD 189733 b', emoji: '🔵', kind: 'exoplanet', kindLabel: 'Hot Jupiter',
    region: 'deep', ra: 20.004, dec: 22.711, distanceLy: 64.5, color: '#5b8dff', size: 0.7,
    vibe: 'Glass rain',
    facts: ['A deep cobalt-blue world — the color of shattered glass.', 'Winds of 8,700 km/h may rain sideways molten glass.'],
    discovered: '2005', source: 'Hubble',
  },
  {
    id: 'wasp-12b', name: 'WASP-12b', emoji: '🌑', kind: 'exoplanet', kindLabel: 'Hot Jupiter',
    region: 'deep', ra: 6.506, dec: 29.672, distanceLy: 1410, color: '#2a2030', size: 0.7,
    vibe: 'Being devoured',
    facts: ['So hot it glows; one of the darkest planets known.', 'Its star is slowly tearing it apart and eating it.'],
    discovered: '2008', source: 'Hubble',
  },
  {
    id: 'kepler-186f', name: 'Kepler-186f', emoji: '🌎', kind: 'exoplanet', kindLabel: 'Rocky exoplanet',
    region: 'deep', ra: 19.910, dec: 43.957, distanceLy: 580, color: '#6fd6a0', size: 0.55,
    vibe: 'Earth-size twin',
    facts: ['First Earth-size planet found in a habitable zone.', 'Bathed in the dim red light of a cool dwarf star.'],
    discovered: '2014', source: 'NASA Kepler',
  },

  // ── Nebulae, clusters & a black hole ────────────────────────────────────────
  {
    id: 'orion', name: 'Orion Nebula', emoji: '🌫️', kind: 'nebula', kindLabel: 'Emission nebula · M42',
    region: 'deep', ra: 5.588, dec: -5.391, distanceLy: 1344, color: '#ff7bb0', size: 1.15,
    vibe: 'Stellar nursery',
    facts: ['A glowing cloud where new stars are being born right now.', 'Visible to the naked eye in Orion’s sword.'],
    source: 'Hubble / JWST',
  },
  {
    id: 'pleiades', name: 'Pleiades', emoji: '✨', kind: 'cluster', kindLabel: 'Open cluster · M45',
    region: 'deep', ra: 3.791, dec: 24.117, distanceLy: 444, color: '#9fc6ff', size: 1.0,
    vibe: 'Seven Sisters',
    facts: ['A sparkling cluster of hot blue stars wrapped in dust.', 'Known to cultures worldwide for millennia.'],
    source: 'Hubble',
  },
  {
    id: 'crab', name: 'Crab Nebula', emoji: '🦀', kind: 'nebula', kindLabel: 'Supernova remnant · M1',
    region: 'deep', ra: 5.575, dec: 22.014, distanceLy: 6500, color: '#b07bff', size: 1.05,
    vibe: 'Supernova ghost',
    facts: ['The wreckage of a star seen exploding in 1054 AD.', 'A pulsar at its heart spins 30 times a second.'],
    source: 'Hubble / JWST',
  },
  {
    id: 'ring', name: 'Ring Nebula', emoji: '💍', kind: 'nebula', kindLabel: 'Planetary nebula · M57',
    region: 'deep', ra: 18.885, dec: 33.029, distanceLy: 2567, color: '#7be0c0', size: 0.95,
    vibe: 'A dying star',
    facts: ['A glowing shell puffed off by a dying Sun-like star.', 'JWST revealed thousands of dense knots in its ring.'],
    source: 'JWST 2023',
  },
  {
    id: 'helix', name: 'Helix Nebula', emoji: '👁️', kind: 'nebula', kindLabel: 'Planetary nebula · NGC 7293',
    region: 'deep', ra: 22.494, dec: -20.837, distanceLy: 655, color: '#6fe0d0', size: 1.0,
    vibe: 'The Eye of God',
    facts: ['One of the closest planetary nebulae to Earth.', 'Nicknamed the "Eye of God" for its haunting stare.'],
    source: 'Hubble / Spitzer',
  },
  {
    id: 'carina', name: 'Carina Nebula', emoji: '🏔️', kind: 'nebula', kindLabel: 'Star-forming region · NGC 3372',
    region: 'deep', ra: 10.752, dec: -59.867, distanceLy: 7500, color: '#ff9d6b', size: 1.2,
    vibe: 'JWST icon',
    facts: ['JWST’s "Cosmic Cliffs" — towering peaks of gas and dust.', 'A nursery birthing stars far larger than the Sun.'],
    source: 'JWST 2022',
  },
  {
    id: 'eagle', name: 'Eagle Nebula', emoji: '🦅', kind: 'nebula', kindLabel: 'Star-forming region · M16',
    region: 'deep', ra: 18.313, dec: -13.789, distanceLy: 5700, color: '#ffd08a', size: 1.15,
    vibe: 'Pillars of Creation',
    facts: ['Home to the iconic "Pillars of Creation."', 'Light-years-tall columns of gas hatching new stars.'],
    source: 'Hubble / JWST',
  },
  {
    id: 'm13', name: 'Hercules Cluster', emoji: '🔆', kind: 'cluster', kindLabel: 'Globular cluster · M13',
    region: 'deep', ra: 16.695, dec: 36.461, distanceLy: 22200, color: '#ffe7b8', size: 1.05,
    vibe: 'A million suns',
    facts: ['A dense ball of several hundred thousand ancient stars.', 'Target of the 1974 Arecibo radio message to the stars.'],
    source: 'Hubble',
  },
  {
    id: 'sgr-a', name: 'Sagittarius A*', emoji: '🕳️', kind: 'blackhole', kindLabel: 'Supermassive black hole',
    region: 'deep', ra: 17.761, dec: -29.008, distanceLy: 26000, color: '#ff9a3c', size: 1.0,
    vibe: 'The galactic heart',
    facts: ['The 4-million-solar-mass black hole at the Milky Way’s center.', 'Imaged by the Event Horizon Telescope in 2022.'],
    source: 'EHT 2022',
  },

  // ── Black holes, quasars & a void ───────────────────────────────────────────
  {
    id: 'm87', name: 'M87*', emoji: '🕳️', kind: 'blackhole', kindLabel: 'Supermassive black hole · M87',
    region: 'deep', ra: 12.514, dec: 12.391, distanceLy: 53.5e6, color: '#ff9a3c', size: 1.15,
    vibe: 'First ever imaged',
    facts: ['The first black hole ever photographed (EHT, 2019).', '6.5 billion solar masses, firing a 5,000-light-year plasma jet.'],
    source: 'EHT 2019',
  },
  {
    id: '3c273', name: '3C 273', emoji: '💠', kind: 'quasar', kindLabel: 'Quasar',
    region: 'deep', ra: 12.485, dec: 2.052, distanceLy: 2.443e9, color: '#bcd2ff', size: 1.05,
    vibe: 'Brightest quasar',
    facts: ['The first quasar ever identified — and the brightest in our sky.', 'A feeding black hole outshining its entire galaxy 100×, from 2.4 billion ly away.'],
    discovered: '1963', source: 'Hubble',
  },
  {
    id: 'ton618', name: 'TON 618', emoji: '🌑', kind: 'quasar', kindLabel: 'Hyperluminous quasar',
    region: 'deep', ra: 12.467, dec: 31.193, distanceLy: 10.37e9, color: '#cdb8ff', size: 1.1,
    vibe: 'The biggest monster',
    facts: ['Hosts one of the most massive black holes known — ~66 billion Suns.', 'Its light left when the universe was a quarter of its current age.'],
    source: 'SDSS',
  },
  {
    id: 'virgo-cluster', name: 'Virgo Cluster', emoji: '🌐', kind: 'cluster', kindLabel: 'Galaxy cluster',
    region: 'deep', ra: 12.44, dec: 12.72, distanceLy: 53.8e6, color: '#b8c6ff', size: 1.5,
    vibe: 'A thousand galaxies',
    facts: ['Up to ~2,000 galaxies bound together — the heart of our Local Supercluster.', 'M87 and its black hole sit at its center.'],
    source: 'NASA/ESA',
  },
  {
    id: 'bootes-void', name: 'Boötes Void', emoji: '⬛', kind: 'void', kindLabel: 'Cosmic void',
    region: 'deep', ra: 14.5, dec: 40, distanceLy: 700e6, color: '#2a3350', size: 1.4,
    vibe: 'The Great Nothing',
    facts: ['A near-empty bubble of space ~330 million light-years across.', '“If the Milky Way were here, we wouldn’t have known other galaxies existed until the 1960s.”'],
    source: 'Kirshner et al.',
  },

  // ── Galaxies ──────────────────────────────────────────────────────────────
  {
    id: 'andromeda', name: 'Andromeda Galaxy', emoji: '🌌', kind: 'galaxy', kindLabel: 'Spiral galaxy · M31',
    region: 'deep', ra: 0.712, dec: 41.269, distanceLy: 2.537e6, color: '#cdb8ff', size: 1.5,
    vibe: 'Our destiny',
    facts: ['The nearest large galaxy — a trillion stars.', 'On a collision course with the Milky Way in ~4.5 billion years.'],
    source: 'Hubble',
  },
  {
    id: 'whirlpool', name: 'Whirlpool Galaxy', emoji: '🌀', kind: 'galaxy', kindLabel: 'Spiral galaxy · M51',
    region: 'deep', ra: 13.498, dec: 47.195, distanceLy: 23e6, color: '#9fb6ff', size: 1.4,
    vibe: 'Grand spiral',
    facts: ['The classic "grand-design" spiral, seen face-on.', 'Locked in a slow dance with a smaller companion galaxy.'],
    source: 'Hubble',
  },
  {
    id: 'sombrero', name: 'Sombrero Galaxy', emoji: '🌌', kind: 'galaxy', kindLabel: 'Spiral galaxy · M104',
    region: 'deep', ra: 12.667, dec: -11.623, distanceLy: 29.3e6, color: '#e8d6a8', size: 1.4,
    vibe: 'Edge-on disk',
    facts: ['A brilliant bulge ringed by a dark dust lane — like a hat.', 'Hosts a billion-solar-mass central black hole.'],
    source: 'Hubble / JWST',
  },
  {
    id: 'stephans-quintet', name: "Stephan's Quintet", emoji: '🌠', kind: 'galaxy', kindLabel: 'Galaxy group',
    region: 'deep', ra: 22.600, dec: 33.966, distanceLy: 290e6, color: '#b8c6ff', size: 1.45,
    vibe: 'JWST debut',
    facts: ['Five galaxies — four locked in a gravitational tug-of-war.', 'Starred in JWST’s first image release in 2022.'],
    source: 'JWST 2022',
  },
]

export const COSMOS: CelestialBody[] = assemble(RAW)

export const BY_ID = new Map<string, CelestialBody>(COSMOS.map((b) => [b.id, b]))

export function getBody(id: string): CelestialBody | undefined {
  return BY_ID.get(id)
}

// ── Curated voyages (the onboarding presets) ────────────────────────────────
export const PRESETS: VoyagePreset[] = [
  {
    id: 'grand-tour', emoji: '🪐', title: 'Grand Tour of the Solar System',
    blurb: 'Sun to Neptune, in order.',
    stops: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'],
  },
  {
    id: 'voyager', emoji: '🛰️', title: "Voyager's Grand Tour",
    blurb: 'Retrace the path of Voyager 2.',
    stops: ['earth', 'jupiter', 'saturn', 'uranus', 'neptune'],
  },
  {
    id: 'earth-2', emoji: '🌎', title: 'The Hunt for Earth 2.0',
    blurb: 'Worlds in the habitable zone.',
    stops: ['earth', 'proxima-b', 'trappist-1e', 'toi-700d', 'kepler-452b'],
  },
  {
    id: 'jwst', emoji: '🔭', title: "JWST's Greatest Hits",
    blurb: 'The telescope’s showpiece targets.',
    stops: ['carina', 'eagle', 'ring', 'stephans-quintet'],
  },
  {
    id: 'messier', emoji: '✨', title: 'Deep-Sky Marathon',
    blurb: 'Nebulae, clusters and galaxies.',
    stops: ['orion', 'pleiades', 'crab', 'andromeda', 'sombrero'],
  },
  {
    id: 'monsters', emoji: '🕳️', title: 'Cosmic Monsters',
    blurb: 'Black holes & quasars.',
    stops: ['sgr-a', 'm87', '3c273', 'ton618'],
  },
  {
    id: 'edge', emoji: '🌌', title: 'To the Edge of the Sky',
    blurb: 'Ride out past the quasars.',
    stops: ['moon', 'sirius', 'andromeda', 'virgo-cluster', 'ton618'],
  },
]

/** The little starter voyage shown on first load (like Wanderpin's sample trip). */
export const SAMPLE_VOYAGE = ['earth', 'moon', 'mars', 'jupiter']
