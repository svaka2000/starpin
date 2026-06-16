export type BodyClass =
  | 'star'
  | 'planet'
  | 'moon'
  | 'dwarf'
  | 'exostar'
  | 'exoplanet'
  | 'nebula'
  | 'galaxy'
  | 'cluster'
  | 'blackhole'
  | 'quasar'
  | 'void'
  | 'probe'
  | 'comet'

/** Which spatial band the body lives in — controls how it is placed in the 3D scene. */
export type Region = 'solar' | 'deep'

export interface CelestialBody {
  id: string
  name: string
  emoji: string
  kind: BodyClass
  kindLabel: string
  region: Region

  /** Right ascension in hours (0–24) for deep-sky objects. */
  ra?: number
  /** Declination in degrees (−90 to +90) for deep-sky objects. */
  dec?: number
  /** Mean distance from the Sun in AU, for solar-system bodies. */
  au?: number
  /** Assigned ecliptic longitude (deg) for laying solar bodies out on the map. */
  lonDeg?: number
  /** For moons: the body they orbit (placement is relative to it). */
  parentId?: string
  /** For moons: distance from their parent body, in km. */
  parentDistKm?: number

  /** Distance from Earth/Sol in light-years (the master distance). */
  distanceLy: number

  color: string
  /** Relative visual radius used when drawing the pin in 3D. */
  size: number
  vibe: string
  facts: string[]

  // Optional physical stats shown in the detail view
  diameterKm?: number
  gravityG?: number
  dayLengthHours?: number
  tempC?: number
  discovered?: string
  source?: string

  // Computed at load time
  realPos: [number, number, number]
  scenePos: [number, number, number]
}

export interface VoyagePreset {
  id: string
  emoji: string
  title: string
  blurb: string
  stops: string[]
}
