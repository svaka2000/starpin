import { getBody } from '../data/cosmos'
import { dist3, LY_IN_KM, propulsionById, travelSeconds, type Propulsion } from './astro'

export interface Leg {
  fromId: string
  toId: string
  fromName: string
  toName: string
  distanceLy: number
  distanceKm: number
  seconds: number
}

export interface VoyageMath {
  prop: Propulsion
  legs: Leg[]
  totalLy: number
  totalKm: number
  totalSeconds: number
  count: number
}

export function computeLegs(stops: string[], propId: string): VoyageMath {
  const prop = propulsionById(propId)
  const bodies = stops.map(getBody).filter((b): b is NonNullable<typeof b> => Boolean(b))
  const legs: Leg[] = []
  let totalLy = 0
  let totalSeconds = 0
  for (let i = 1; i < bodies.length; i++) {
    const a = bodies[i - 1]
    const b = bodies[i]
    const distanceLy = dist3(a.realPos, b.realPos)
    const distanceKm = distanceLy * LY_IN_KM
    const seconds = travelSeconds(distanceKm, prop.speedKms)
    legs.push({ fromId: a.id, toId: b.id, fromName: a.name, toName: b.name, distanceLy, distanceKm, seconds })
    totalLy += distanceLy
    totalSeconds += seconds
  }
  return { prop, legs, totalLy, totalKm: totalLy * LY_IN_KM, totalSeconds, count: bodies.length }
}
