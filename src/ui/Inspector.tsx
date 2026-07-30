import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getBody } from '../data/cosmos'
import { compact, describeDistance, lightTravelLabel } from '../lib/astro'
import { DEEPSKY, TEXTURES } from '../data/textures'
import { useVoyage } from '../store/useVoyage'
import type { CelestialBody } from '../types'
import { Plus, X } from './icons'

function HeroThumb({ body }: { body: CelestialBody }) {
  const [failed, setFailed] = useState(false)
  const src = TEXTURES[body.id]
    ? `/renders/${body.id}.png`
    : DEEPSKY.has(body.id)
    ? `/textures/deepsky/${body.id}.jpg`
    : null
  return (
    <div
      className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl text-2xl ring-1 ring-white/10"
      style={{ background: `${body.color}1f`, boxShadow: `0 0 30px -10px ${body.color}` }}
    >
      {src && !failed ? (
        <img src={src} alt={body.name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        body.emoji
      )}
    </div>
  )
}

function stats(b: CelestialBody): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = []
  if (b.parentId) {
    out.push({ label: `From ${getBody(b.parentId)?.name ?? 'planet'}`, value: describeDistance(b.distanceLy) })
  } else if (b.region === 'solar' && b.id !== 'sun') {
    out.push({ label: 'From Sun', value: describeDistance(b.distanceLy) })
  } else if (b.id !== 'sun') {
    out.push({ label: 'From Earth', value: describeDistance(b.distanceLy) })
    out.push({ label: 'Light-travel', value: lightTravelLabel(b.distanceLy) })
  }
  if (b.diameterKm) out.push({ label: 'Diameter', value: `${compact(b.diameterKm)} km` })
  if (b.gravityG !== undefined) out.push({ label: 'Gravity', value: `${b.gravityG} g` })
  if (b.dayLengthHours !== undefined) out.push({ label: 'Day', value: `${compact(b.dayLengthHours)} hr` })
  if (b.tempC !== undefined) out.push({ label: 'Avg temp', value: `${compact(b.tempC)}°C` })
  if (b.discovered) out.push({ label: 'Discovered', value: b.discovered })
  return out
}

export default function Inspector() {
  const selectedId = useVoyage((s) => s.selectedId)
  const stops = useVoyage((s) => s.stops)
  const addStop = useVoyage((s) => s.addStop)
  const removeStop = useVoyage((s) => s.removeStop)
  const select = useVoyage((s) => s.select)

  const body = selectedId ? getBody(selectedId) : undefined
  const inVoyage = body ? stops.includes(body.id) : false
  const rows = body ? stats(body) : []

  return (
    <AnimatePresence>
      {body && (
        <motion.div
          key={body.id}
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="glass fixed bottom-3 left-3 z-20 w-[352px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl"
        >
          <div
            className="relative px-5 pb-5 pt-5"
            style={{ background: `radial-gradient(130% 100% at 0% 0%, ${body.color}1c 0%, transparent 62%)` }}
          >
            <button
              onClick={() => select(null)}
              className="absolute right-3.5 top-3.5 grid h-7 w-7 place-items-center rounded-full text-faint transition hover:bg-white/10 hover:text-parchment"
              aria-label="Close"
            >
              <X width={15} height={15} />
            </button>

            <div className="flex items-start gap-3.5">
              <HeroThumb body={body} />
              <div className="min-w-0 pr-6 pt-0.5">
                <h3 className="font-display text-[22px] font-semibold leading-[1.1] text-parchment balance">{body.name}</h3>
                <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-faint">{body.kindLabel}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-stardust" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-stardust/90">{body.vibe}</span>
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {body.facts.map((f, i) => (
                <li key={i} className="relative pl-3.5 text-[13px] leading-relaxed text-hush">
                  <span className="absolute left-0 top-[7px] h-[11px] w-[2px] rounded-full bg-stardust/70" />
                  {f}
                </li>
              ))}
            </ul>

            {rows.length > 0 && (
              <dl className="mt-4 border-y border-white/[0.07]">
                {rows.map((s, i) => (
                  <div
                    key={s.label}
                    className={`flex items-baseline justify-between py-[7px] ${i > 0 ? 'border-t border-white/[0.05]' : ''}`}
                  >
                    <dt className="text-[11px] uppercase tracking-[0.13em] text-faint">{s.label}</dt>
                    <dd className="font-mono tnum text-[13px] font-medium text-parchment">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-4">
              {inVoyage ? (
                <button
                  onClick={() => removeStop(body.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] px-3 py-2.5 text-sm font-medium text-hush ring-1 ring-white/10 transition hover:text-ember hover:ring-ember/30"
                >
                  <X width={15} height={15} /> Remove from voyage
                </button>
              ) : (
                <button
                  onClick={() => addStop(body.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-stardust px-3 py-2.5 text-sm font-semibold text-[#241a0b] transition hover:brightness-[1.06]"
                >
                  <Plus width={15} height={15} /> Add to voyage
                </button>
              )}
            </div>

            {body.source && <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-faint">Data · {body.source}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
