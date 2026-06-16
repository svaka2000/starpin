import { AnimatePresence, motion } from 'framer-motion'
import { getBody } from '../data/cosmos'
import { compact, describeDistance, lightTravelLabel } from '../lib/astro'
import { useVoyage } from '../store/useVoyage'
import type { CelestialBody } from '../types'
import { Plus, Rocket, X } from './icons'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 ring-1 ring-white/8">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-[13px] font-semibold text-slate-100">{value}</div>
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

  return (
    <AnimatePresence>
      {body && (
        <motion.div
          key={body.id}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="glass fixed bottom-3 left-3 z-20 w-[340px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl shadow-2xl"
        >
          <div
            className="relative px-4 pb-4 pt-4"
            style={{
              background: `radial-gradient(120% 90% at 0% 0%, ${body.color}22 0%, transparent 60%)`,
            }}
          >
            <button
              onClick={() => select(null)}
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X width={15} height={15} />
            </button>

            <div className="flex items-start gap-3">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
                style={{ background: `${body.color}22`, boxShadow: `0 0 24px -6px ${body.color}` }}
              >
                {body.emoji}
              </div>
              <div className="min-w-0 pr-6">
                <h3 className="font-display text-lg font-bold leading-tight text-white">{body.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{body.kindLabel}</span>
                </div>
                <span className="mt-1 inline-block rounded-full bg-nova/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nova">
                  {body.vibe}
                </span>
              </div>
            </div>

            <ul className="mt-3 space-y-1.5">
              {body.facts.map((f, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-snug text-slate-300">
                  <span className="mt-0.5 text-stardust">›</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {stats(body).length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {stats(body).map((s) => (
                  <Stat key={s.label} {...s} />
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              {inVoyage ? (
                <button
                  onClick={() => removeStop(body.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-slate-200 ring-1 ring-white/12 transition hover:bg-rose-500/15 hover:text-rose-200"
                >
                  <X width={15} height={15} /> Remove from voyage
                </button>
              ) : (
                <button
                  onClick={() => addStop(body.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-stardust px-3 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:brightness-110"
                >
                  <Plus width={15} height={15} /> Add to voyage
                </button>
              )}
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] text-slate-400 ring-1 ring-white/10">
                <Rocket width={16} height={16} />
              </span>
            </div>

            {body.source && (
              <p className="mt-2.5 text-[10px] text-slate-600">Data: {body.source}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
