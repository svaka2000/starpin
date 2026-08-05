export interface TexCfg {
  map: string
  bump?: string
  clouds?: string
  night?: string
  spec?: string
  ring?: string
  /** axial tilt in degrees */
  tilt?: number
  /** atmosphere rim-glow colour */
  atmosphere?: string
  /** the Sun — rendered unlit/full-bright with a corona */
  sun?: boolean
}

/** Real equirectangular surface maps (NASA / three.js / Solar System Scope-style, CC-BY). */
export const TEXTURES: Record<string, TexCfg> = {
  sun: { map: '/textures/sun.jpg', sun: true },
  mercury: { map: '/textures/mercury.jpg', tilt: 0.03 },
  venus: { map: '/textures/venus.jpg', tilt: 177.4, atmosphere: '#e3d4b4' },
  earth: {
    map: '/textures/earth_day.jpg',
    bump: '/textures/earth_bump.jpg',
    clouds: '/textures/earth_clouds.jpg',
    night: '/textures/earth_night.png',
    spec: '/textures/earth_spec.jpg',
    tilt: 23.4,
    atmosphere: '#a8c8f0',
  },
  moon: { map: '/textures/moon.jpg', tilt: 6.7 },
  mars: { map: '/textures/mars.jpg', tilt: 25.2, atmosphere: '#d8a98c' },
  jupiter: { map: '/textures/jupiter.jpg', tilt: 3.1, atmosphere: '#d6bb9c' },
  saturn: { map: '/textures/saturn.jpg', tilt: 26.7, ring: '/textures/saturn_ring.jpg' },
  uranus: { map: '/textures/uranus.jpg', tilt: 97.8, atmosphere: '#bcd8d6' },
  neptune: { map: '/textures/neptune.jpg', tilt: 28.3, atmosphere: '#7d9ee0' },
  pluto: { map: '/textures/pluto.jpg', tilt: 119.6 },
}

/** Deep-sky objects that have a real telescope photo in /textures/deepsky/<id>.jpg */
export const DEEPSKY = new Set<string>([
  'orion', 'crab', 'ring', 'helix', 'carina', 'eagle',
  'andromeda', 'whirlpool', 'sombrero', 'stephans-quintet',
  'pleiades', 'm13', 'virgo-cluster',
])
