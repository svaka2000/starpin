import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getBody } from '../data/cosmos'
import { PROPULSION, describeDistance, describeDuration, dist3, olderThanUniverse } from '../lib/astro'
import { computeLegs, type Leg } from '../lib/voyage'
import { buildJSON, buildPlanText, buildShareUrl, download } from '../lib/exporters'
import { useVoyage } from '../store/useVoyage'
import type { CelestialBody } from '../types'
import { ChevronDown, ChevronUp, Download, Rocket, Share, Trash, Wand, X } from './icons'

function whereLabel(b: CelestialBody): string {
  if (b.id === 'sun') return 'Center of the Solar System'
  if (b.parentId) return `${describeDistance(b.distanceLy)} from ${getBody(b.parentId)?.name ?? 'its planet'}`
  if (b.region === 'solar') return `${describeDistance(b.distanceLy)} from the Sun`
  return `${describeDistance(b.distanceLy)} from Earth`
}

function StopCard({
  body,
  index,
  isLast,
}: {
  body: CelestialBody
  index: number
  isLast: boolean
}) {
  const moveStop = useVoyage((s) => s.moveStop)
  const removeStop = useVoyage((s) => s.removeStop)
  const select = useVoyage((s) => s.select)
  const selectedId = useVoyage((s) => s.selectedId)
  const selected = selectedId === body.id

  return (
    <div
      onClick={() => select(body.id)}
      className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition ${
        selected ? 'border-stardust/50 bg-stardust/10' : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
      }`}
    >
      <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stardust/20 text-xs font-bold text-stardust">
        {index + 1}
      </div>
      <span className="mt-0.5 text-xl leading-none">{body.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-white">{body.name}</span>
          <span className="shrink-0 rounded-full bg-nova/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-nova">
            {body.vibe}
          </span>
        </div>
        <div className="truncate text-xs text-slate-400">{body.kindLabel}</div>
        <div className="mt-0.5 truncate text-[11px] text-slate-500">{whereLabel(body)}</div>
      </div>
      <div className="flex flex-col gap-0.5 opacity-60 transition group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            moveStop(index, index - 1)
          }}
          disabled={index === 0}
          className="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
          aria-label="Move up"
        >
          <ChevronUp width={13} height={13} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            moveStop(index, index + 1)
          }}
          disabled={isLast}
          className="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
          aria-label="Move down"
        >
          <ChevronDown width={13} height={13} />
        </button>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeStop(body.id)
        }}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-500 opacity-0 transition hover:bg-rose-500/20 hover:text-rose-300 group-hover:opacity-100"
        aria-label="Remove stop"
      >
        <Trash width={14} height={14} />
      </button>
    </div>
  )
}

function Segment({ leg, propEmoji, propLabel }: { leg: Leg; propEmoji: string; propLabel: string }) {
  const extreme = olderThanUniverse(leg.seconds)
  return (
    <div className="flex items-center gap-2 py-1 pl-7 pr-2 text-[11px]">
      <div className="h-4 w-px bg-gradient-to-b from-stardust/50 to-nova/40" />
      <span className="text-sm">{propEmoji}</span>
      <span className="font-medium text-slate-300">{describeDistance(leg.distanceLy)}</span>
      <span className="text-slate-600">·</span>
      <span className={extreme ? 'font-medium text-ember' : 'font-medium text-stardust'}>
        {describeDuration(leg.seconds)}
      </span>
      <span className="truncate text-slate-500">at {propLabel}</span>
    </div>
  )
}

export default function VoyagePanel() {
  const stops = useVoyage((s) => s.stops)
  const propulsion = useVoyage((s) => s.propulsion)
  const setPropulsion = useVoyage((s) => s.setPropulsion)
  const clear = useVoyage((s) => s.clear)
  const setStops = useVoyage((s) => s.setStops)
  const panelOpen = useVoyage((s) => s.panelOpen)

  const math = useMemo(() => computeLegs(stops, propulsion), [stops, propulsion])
  const bodies = useMemo(() => stops.map(getBody).filter((b): b is CelestialBody => Boolean(b)), [stops])

  const optimize = () => {
    if (bodies.length < 3) return
    const remaining = [...bodies]
    const route = [remaining.shift()!]
    while (remaining.length) {
      const last = route[route.length - 1]
      let bestIdx = 0
      let bestD = Infinity
      remaining.forEach((b, i) => {
        const d = dist3(last.realPos, b.realPos)
        if (d < bestD) {
          bestD = d
          bestIdx = i
        }
      })
      route.push(remaining.splice(bestIdx, 1)[0])
    }
    setStops(route.map((b) => b.id))
  }

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(stops, propulsion))
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {panelOpen && (
        <motion.aside
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="glass fixed right-3 top-[68px] bottom-3 z-20 flex w-[358px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl shadow-2xl"
        >
          {/* header */}
          <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-3.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-stardust/15 text-stardust">
              <Rocket width={18} height={18} />
            </div>
            <div className="flex-1">
              <div className="font-display text-[15px] font-semibold text-white">My Voyage</div>
              <div className="text-[11px] text-slate-400">
                {math.count === 0 ? 'No stops yet' : `${math.count} ${math.count === 1 ? 'stop' : 'stops'} · ${describeDistance(math.totalLy)}`}
              </div>
            </div>
          </div>

          {/* propulsion */}
          <div className="border-b border-white/8 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Propulsion</span>
              <span className="text-[11px] text-slate-500">{math.prop.blurb}</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-thin">
              {PROPULSION.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPropulsion(p.id)}
                  title={p.blurb}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition ${
                    propulsion === p.id
                      ? 'border-stardust/50 bg-stardust/15 text-white'
                      : 'border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* stops */}
          <div className="flex-1 overflow-y-auto px-3 py-3 scroll-thin">
            {bodies.length === 0 ? (
              <div className="mt-8 px-4 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white/5 text-2xl">🛰️</div>
                <p className="text-sm font-medium text-slate-300">Your voyage is empty</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Click any world in the cosmos to add it — or launch one of the curated journeys.
                </p>
              </div>
            ) : (
              <div>
                <AnimatePresence initial={false}>
                  {bodies.map((b, i) => (
                    <motion.div
                      key={b.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <StopCard body={b} index={i} isLast={i === bodies.length - 1} />
                      {i < math.legs.length && (
                        <Segment leg={math.legs[i]} propEmoji={math.prop.emoji} propLabel={math.prop.label} />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* footer */}
          {bodies.length > 0 && (
            <div className="border-t border-white/8 px-4 py-3">
              <div className="mb-3 rounded-xl bg-gradient-to-br from-stardust/10 to-nova/10 p-3 ring-1 ring-white/8">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-400">Total distance</span>
                  <span className="font-semibold text-white">{describeDistance(math.totalLy)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[13px]">
                  <span className="text-slate-400">Travel time</span>
                  <span className={`font-semibold ${olderThanUniverse(math.totalSeconds) ? 'text-ember' : 'text-stardust'}`}>
                    {describeDuration(math.totalSeconds)}
                  </span>
                </div>
                {olderThanUniverse(math.totalSeconds) && (
                  <p className="mt-1.5 text-[11px] leading-snug text-ember/80">
                    ✦ That’s longer than the universe has existed. Better pick a faster ship.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => download('starpin-voyage.json', buildJSON(stops, propulsion), 'application/json')}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-2 text-[12px] font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  <Download width={13} height={13} /> JSON
                </button>
                <button
                  onClick={() => download('starpin-mission-plan.txt', buildPlanText(stops, propulsion))}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-2 text-[12px] font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  <Download width={13} height={13} /> Plan
                </button>
                <button
                  onClick={copyShare}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-2 text-[12px] font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  <Share width={13} height={13} /> Share
                </button>
              </div>

              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <button
                  onClick={optimize}
                  disabled={bodies.length < 3}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-stardust/15 px-2 py-2 text-[12px] font-semibold text-stardust ring-1 ring-stardust/30 transition hover:bg-stardust/25 disabled:opacity-40"
                >
                  <Wand width={13} height={13} /> Optimize
                </button>
                <button
                  onClick={clear}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-2 text-[12px] font-medium text-slate-400 ring-1 ring-white/10 transition hover:bg-rose-500/15 hover:text-rose-300"
                >
                  <X width={13} height={13} /> Clear all
                </button>
              </div>

              <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-slate-500">
                Made with <span className="text-ember">✦</span> for Stardance
              </p>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
