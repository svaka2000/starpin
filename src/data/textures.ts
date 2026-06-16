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
  venus: { map: '/textures/venus.jpg', tilt: 177.4, atmosphere: '#e8cd8f' },
  earth: {
    map: '/textures/earth_day.jpg',
    bump: '/textures/earth_bump.jpg',
    clouds: '/textures/earth_clouds.jpg',
    night: '/textures/earth_night.png',
    spec: '/textures/earth_spec.jpg',
    tilt: 23.4,
    atmosphere: '#6ab4ff',
  },
  moon: { map: '/textures/moon.jpg', tilt: 6.7 },
  mars: { map: '/textures/mars.jpg', tilt: 25.2, atmosphere: '#e0875a' },
  jupiter: { map: '/textures/jupiter.jpg', tilt: 3.1, atmosphere: '#d9a679' },
  saturn: { map: '/textures/saturn.jpg', tilt: 26.7, ring: '/textures/saturn_ring.jpg' },
  uranus: { map: '/textures/uranus.jpg', tilt: 97.8, atmosphere: '#9fe7e3' },
  neptune: { map: '/textures/neptune.jpg', tilt: 28.3, atmosphere: '#4060ff' },
  pluto: { map: '/textures/pluto.jpg', tilt: 119.6 },
}
