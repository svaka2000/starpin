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

function StopRow({ body, index, isLast }: { body: CelestialBody; index: number; isLast: boolean }) {
  const moveStop = useVoyage((s) => s.moveStop)
  const removeStop = useVoyage((s) => s.removeStop)
  const select = useVoyage((s) => s.select)
  const selectedId = useVoyage((s) => s.selectedId)
  const selected = selectedId === body.id

  return (
    <div
      onClick={() => select(body.id)}
      className={`group grid cursor-pointer grid-cols-[26px_1fr] gap-2.5 rounded-lg py-2 pr-1.5 transition ${
        selected ? 'bg-stardust/[0.07]' : 'hover:bg-white/[0.035]'
      }`}
    >
      {/* spine node */}
      <div className="flex justify-center pt-0.5">
        <span
          className={`grid h-[22px] w-[22px] place-items-center rounded-full font-mono text-[11px] font-semibold tnum transition ${
            selected
              ? 'bg-stardust text-[#241a0b]'
              : 'bg-[#1b191f] text-hush ring-1 ring-white/12 group-hover:text-parchment'
          }`}
        >
          {index + 1}
        </span>
      </div>

      {/* content */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] leading-none">{body.emoji}</span>
            <span className="truncate font-medium text-parchment">{body.name}</span>
          </div>
          <div className="mt-0.5 truncate text-[10px] uppercase tracking-[0.13em] text-faint">{body.kindLabel}</div>
          <div className="mt-0.5 truncate font-mono text-[11px] tnum text-hush/80">{whereLabel(body)}</div>
        </div>
        <div className="flex flex-col gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              moveStop(index, index - 1)
            }}
            disabled={index === 0}
            className="grid h-5 w-5 place-items-center rounded text-faint transition hover:bg-white/10 hover:text-parchment disabled:opacity-20"
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
            className="grid h-5 w-5 place-items-center rounded text-faint transition hover:bg-white/10 hover:text-parchment disabled:opacity-20"
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
          className="grid h-5 w-5 shrink-0 place-items-center rounded text-faint opacity-0 transition hover:bg-ember/20 hover:text-ember group-hover:opacity-100"
          aria-label="Remove stop"
        >
          <Trash width={13} height={13} />
        </button>
      </div>
    </div>
  )
}

function Segment({ leg, propEmoji, propLabel }: { leg: Leg; propEmoji: string; propLabel: string }) {
  const extreme = olderThanUniverse(leg.seconds)
  return (
    <div className="grid grid-cols-[26px_1fr] gap-2.5">
      <div />
      <div className="flex items-center gap-1.5 py-0.5 text-[11px]">
        <span className="text-[13px] leading-none opacity-80">{propEmoji}</span>
        <span className="font-mono tnum text-hush">{describeDistance(leg.distanceLy)}</span>
        <span className="text-faint">·</span>
        <span className={`font-mono tnum font-medium ${extreme ? 'text-ember' : 'text-stardust'}`}>
          {describeDuration(leg.seconds)}
        </span>
        <span className="truncate text-faint">at {propLabel}</span>
      </div>
    </div>
  )
}

function GhostButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-2 text-[12px] font-medium text-hush ring-1 ring-white/[0.08] transition hover:bg-white/[0.07] hover:text-parchment disabled:opacity-40"
    >
      {children}
    </button>
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
  const extreme = olderThanUniverse(math.totalSeconds)

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
          className="glass fixed right-3 top-[68px] bottom-3 z-20 flex w-[366px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl"
        >
          {/* header */}
          <div className="border-b border-white/[0.07] px-5 pb-3.5 pt-4">
            <div className="eyebrow">Mission manifest</div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[21px] font-semibold leading-none text-parchment">My Voyage</h2>
              <span className="shrink-0 font-mono text-[11px] tnum text-faint">
                {math.count === 0 ? '0 stops' : `${math.count} ${math.count === 1 ? 'stop' : 'stops'} · ${describeDistance(math.totalLy)}`}
              </span>
            </div>
          </div>

          {/* propulsion */}
          <div className="border-b border-white/[0.07] px-5 py-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="eyebrow">Propulsion</span>
              <span className="truncate text-[11px] text-faint">{math.prop.blurb}</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-thin">
              {PROPULSION.map((p) => {
                const active = propulsion === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setPropulsion(p.id)}
                    title={p.blurb}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium ring-1 transition ${
                      active
                        ? 'bg-stardust/15 text-stardust ring-stardust/40'
                        : 'bg-white/[0.03] text-hush ring-white/[0.07] hover:text-parchment'
                    }`}
                  >
                    <span className="opacity-90">{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* stops timeline */}
          <div className="flex-1 overflow-y-auto px-4 py-3 scroll-thin">
            {bodies.length === 0 ? (
              <div className="mt-10 px-6 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full text-hush ring-1 ring-white/10">
                  <Rocket width={22} height={22} />
                </div>
                <p className="font-display text-[16px] font-medium text-parchment">Your voyage is empty</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-faint">
                  Click any world in the cosmos to pin it, or launch a curated journey from the compass.
                </p>
              </div>
            ) : (
              <div className="relative">
                {bodies.length > 1 && (
                  <span aria-hidden className="absolute left-[21px] top-4 bottom-4 w-px bg-white/10" />
                )}
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
                      <StopRow body={b} index={i} isLast={i === bodies.length - 1} />
                      {i < math.legs.length && (
                        <Segment leg={math.legs[i]} propEmoji={math.prop.emoji} propLabel={math.prop.label} />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* footer — departure board */}
          {bodies.length > 0 && (
            <div className="border-t border-white/[0.08] px-5 pb-4 pt-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="eyebrow">Total distance</div>
                  <div className="mt-1 font-mono text-[19px] font-medium tnum text-parchment">{describeDistance(math.totalLy)}</div>
                </div>
                <div className="text-right">
                  <div className="eyebrow">Travel time</div>
                  <div className={`mt-1 font-mono text-[19px] font-medium tnum ${extreme ? 'text-ember' : 'text-stardust'}`}>
                    {describeDuration(math.totalSeconds)}
                  </div>
                </div>
              </div>
              {extreme && (
                <p className="mt-2.5 text-[11px] leading-snug text-ember/85">
                  Longer than the universe has existed. Better pick a faster ship.
                </p>
              )}

              <div className="mt-4 grid grid-cols-3 gap-1.5">
                <GhostButton onClick={() => download('starpin-voyage.json', buildJSON(stops, propulsion), 'application/json')}>
                  <Download width={13} height={13} /> JSON
                </GhostButton>
                <GhostButton onClick={() => download('starpin-mission-plan.txt', buildPlanText(stops, propulsion))}>
                  <Download width={13} height={13} /> Plan
                </GhostButton>
                <GhostButton onClick={copyShare}>
                  <Share width={13} height={13} /> Share
                </GhostButton>
              </div>

              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <button
                  onClick={optimize}
                  disabled={bodies.length < 3}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-stardust/12 px-2 py-2 text-[12px] font-semibold text-stardust ring-1 ring-stardust/30 transition hover:bg-stardust/20 disabled:opacity-40"
                >
                  <Wand width={13} height={13} /> Optimize
                </button>
                <button
                  onClick={clear}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-2 text-[12px] font-medium text-hush ring-1 ring-white/[0.08] transition hover:text-ember hover:ring-ember/30"
                >
                  <X width={13} height={13} /> Clear all
                </button>
              </div>

              <p className="mt-4 text-center text-[10px] uppercase tracking-[0.22em] text-faint">Built for Stardance</p>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
