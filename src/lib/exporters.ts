import { getBody } from '../data/cosmos'
import { describeDistance, describeDuration, olderThanUniverse } from './astro'
import { computeLegs } from './voyage'

export function download(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function buildJSON(stops: string[], propId: string): string {
  const math = computeLegs(stops, propId)
  const payload = {
    app: 'Starpin',
    generated: new Date().toISOString(),
    propulsion: { id: math.prop.id, label: math.prop.label, speedKms: math.prop.speedKms },
    stops: stops.map((id, i) => {
      const b = getBody(id)
      return {
        order: i + 1,
        id,
        name: b?.name,
        kind: b?.kindLabel,
        distanceFromEarthLy: b?.distanceLy,
        ra: b?.ra,
        dec: b?.dec,
      }
    }),
    legs: math.legs.map((l) => ({
      from: l.fromName,
      to: l.toName,
      distanceLy: Number(l.distanceLy.toPrecision(6)),
      travelSeconds: Number(l.seconds.toPrecision(6)),
    })),
    totals: {
      stops: math.count,
      distanceLy: Number(math.totalLy.toPrecision(6)),
      travelTime: describeDuration(math.totalSeconds),
    },
  }
  return JSON.stringify(payload, null, 2)
}

export function buildPlanText(stops: string[], propId: string): string {
  const math = computeLegs(stops, propId)
  const lines: string[] = []
  lines.push('STARPIN · MISSION PLAN')
  lines.push('Plan voyages across a living universe — built for Stardance')
  lines.push('='.repeat(52))
  lines.push(`Propulsion: ${math.prop.emoji} ${math.prop.label} (${math.prop.blurb})`)
  lines.push(`Stops: ${math.count}   ·   Total distance: ${describeDistance(math.totalLy)}`)
  lines.push(`Total travel time: ${describeDuration(math.totalSeconds)}${olderThanUniverse(math.totalSeconds) ? ' — older than the universe!' : ''}`)
  lines.push('')
  stops.forEach((id, i) => {
    const b = getBody(id)
    if (!b) return
    lines.push(`${i + 1}. ${b.emoji}  ${b.name}  —  ${b.kindLabel}`)
    lines.push(`     ${b.vibe} · ${b.region === 'solar' ? describeDistance(b.distanceLy) + ' from the Sun' : describeDistance(b.distanceLy) + ' from Earth'}`)
    const leg = math.legs[i]
    if (leg) {
      lines.push(`     ↓  ${describeDistance(leg.distanceLy)}  ·  ${describeDuration(leg.seconds)} at ${math.prop.label}`)
    }
  })
  lines.push('')
  lines.push('Distances & travel times are real. The map is scaled so everything fits.')
  return lines.join('\n')
}

export function buildShareUrl(stops: string[], propId: string): string {
  const base = `${location.origin}${location.pathname}`
  const params = new URLSearchParams()
  params.set('v', stops.join('~')) // '~' avoids clashing with hyphens inside ids (e.g. sgr-a)
  params.set('p', propId)
  return `${base}?${params.toString()}`
}

export function parseShareUrl(): { stops: string[]; prop: string | null } | null {
  const params = new URLSearchParams(location.search)
  const v = params.get('v')
  if (!v) return null
  // split on '~'; fall back to legacy '-' for old links
  const parts = v.includes('~') ? v.split('~') : v.split('-')
  const stops = parts.filter((id) => getBody(id))
  if (stops.length === 0) return null
  return { stops, prop: params.get('p') }
}
