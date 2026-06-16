// ── Constants ──────────────────────────────────────────────────────────────
export const LY_IN_KM = 9.4607304725808e12
export const AU_IN_KM = 1.495978707e8
export const AU_IN_LY = AU_IN_KM / LY_IN_KM // ≈ 1.5813e-5
export const SPEED_OF_LIGHT_KMS = 299792.458
export const AGE_OF_UNIVERSE_YEARS = 13.787e9
const SECONDS_PER_YEAR = 365.25 * 86400

// ── Coordinate conversions ───────────────────────────────────────────────────

/** RA (hours) + Dec (deg) → unit direction vector (three.js, y-up). */
export function raDecToUnit(raHours: number, decDeg: number): [number, number, number] {
  const ra = (raHours / 24) * Math.PI * 2
  const dec = (decDeg * Math.PI) / 180
  const cd = Math.cos(dec)
  return [cd * Math.cos(ra), Math.sin(dec), cd * Math.sin(ra)]
}

/** Ecliptic longitude (deg) → unit direction in the ecliptic plane (y≈0). */
export function eclipticUnit(lonDeg: number): [number, number, number] {
  const a = (lonDeg * Math.PI) / 180
  return [Math.cos(a), 0, Math.sin(a)]
}

// ── Scene-space radii (log-compressed so everything is visible at once) ──────

/** Solar-system body: AU → scene radius. Sun sits at origin. */
export function auToSceneRadius(au: number): number {
  if (au <= 0) return 0
  return 2.5 + 2.4 * (Math.log10(au) + 0.5)
}

/** Deep-sky object: distance in ly → scene radius. */
export function lyToSceneRadius(ly: number): number {
  return 10 + 5 * Math.log10(Math.max(ly, 0.1))
}

// ── Distances & travel time ──────────────────────────────────────────────────

export function dist3(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export interface Propulsion {
  id: string
  label: string
  emoji: string
  speedKms: number
  blurb: string
  real: boolean
}

/** Speeds are real except Warp, which is flagged. */
export const PROPULSION: Propulsion[] = [
  { id: 'jet', label: 'Airliner', emoji: '✈️', speedKms: 0.25, blurb: 'Cruising jet · 900 km/h', real: true },
  { id: 'voyager', label: 'Voyager 1', emoji: '🛰️', speedKms: 17, blurb: "Humanity's farthest probe · 61,000 km/h", real: true },
  { id: 'parker', label: 'Parker Probe', emoji: '☄️', speedKms: 192, blurb: 'Fastest craft ever flown · 692,000 km/h', real: true },
  { id: 'daedalus', label: 'Fusion ship', emoji: '⚛️', speedKms: 36000, blurb: 'Project Daedalus · 12% the speed of light', real: true },
  { id: 'tenth', label: '10% light', emoji: '💫', speedKms: SPEED_OF_LIGHT_KMS * 0.1, blurb: 'Breakthrough Starshot territory', real: true },
  { id: 'light', label: 'Light speed', emoji: '✨', speedKms: SPEED_OF_LIGHT_KMS, blurb: "The universe's hard speed limit", real: true },
  { id: 'warp', label: 'Warp 9', emoji: '🌀', speedKms: SPEED_OF_LIGHT_KMS * 1516, blurb: 'Fictional — just for the dream', real: false },
]

export function propulsionById(id: string): Propulsion {
  return PROPULSION.find((p) => p.id === id) ?? PROPULSION[1]
}

/** Travel time in seconds for a given distance (km) and speed (km/s). */
export function travelSeconds(distanceKm: number, speedKms: number): number {
  return distanceKm / speedKms
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function compact(n: number, digits = 2): string {
  if (!isFinite(n)) return '∞'
  if (Math.abs(n) < 1000) {
    return n.toLocaleString('en-US', { maximumFractionDigits: n < 10 ? 2 : n < 100 ? 1 : 0 })
  }
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: digits }).format(n)
}

/** Friendly distance label from a light-year value, auto-picking units. */
export function describeDistance(ly: number): string {
  if (ly <= 0) return '—'
  if (ly < 0.02) {
    const au = ly / AU_IN_LY
    if (au < 0.01) return `${compact(ly * LY_IN_KM)} km`
    return `${compact(au)} AU`
  }
  if (ly < 0.1) return `${compact(ly / AU_IN_LY)} AU`
  if (ly < 1e6) return `${compact(ly)} ly`
  if (ly < 1e9) return `${compact(ly / 1e6)} Mly`
  return `${compact(ly / 1e9)} Bly`
}

/** Human travel-time string. */
export function describeDuration(seconds: number): string {
  if (!isFinite(seconds)) return '∞'
  if (seconds < 1) return `${compact(seconds * 1000)} ms`
  if (seconds < 60) return `${compact(seconds)} sec`
  if (seconds < 3600) return `${compact(seconds / 60)} min`
  if (seconds < 86400) return `${compact(seconds / 3600)} hr`
  if (seconds < SECONDS_PER_YEAR) return `${compact(seconds / 86400)} days`
  const years = seconds / SECONDS_PER_YEAR
  if (years < 1e6) return `${compact(years)} years`
  if (years < 1e9) return `${compact(years / 1e6)} Myr`
  return `${compact(years / 1e9)} Gyr`
}

/** Is this duration longer than the age of the universe? */
export function olderThanUniverse(seconds: number): boolean {
  return seconds / SECONDS_PER_YEAR > AGE_OF_UNIVERSE_YEARS
}

/** Light-travel time across a distance (how old the light you see is). */
export function lightTravelLabel(ly: number): string {
  if (ly < 1 / 365.25) return `${compact(ly * 365.25 * 24)} light-hours`
  if (ly < 1) return `${compact(ly * 365.25)} light-days`
  return `${compact(ly)} light-years`
}
