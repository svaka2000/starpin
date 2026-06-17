import { useEffect, useMemo, useState } from 'react'
import { COSMOS } from '../data/cosmos'
import { useVoyage, type ViewMode } from '../store/useVoyage'
import { radio } from '../lib/music'
import { Compass, GlobeIcon, MapIcon, Music, Orbit, Panel, Pause, Play, Scale, Search, Share, Shuffle } from './icons'

const VIEWS: { id: ViewMode; label: string; Icon: typeof GlobeIcon }[] = [
  { id: 'cosmos', label: 'Cosmos', Icon: GlobeIcon },
  { id: 'orrery', label: 'Orrery', Icon: Orbit },
  { id: 'sky', label: 'Sky', Icon: MapIcon },
  { id: 'scale', label: 'Scale', Icon: Scale },
]

function TIcon({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-xl transition ${
        active ? 'bg-stardust/20 text-white ring-1 ring-stardust/40' : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export default function Toolbar({ onVoyages, onShare, onSound }: { onVoyages: () => void; onShare: () => void; onSound: () => void }) {
  const view = useVoyage((s) => s.view)
  const setView = useVoyage((s) => s.setView)
  const select = useVoyage((s) => s.select)
  const takeMeSomewhere = useVoyage((s) => s.takeMeSomewhere)
  const playing = useVoyage((s) => s.playing)
  const setPlaying = useVoyage((s) => s.setPlaying)
  const stops = useVoyage((s) => s.stops)
  const panelOpen = useVoyage((s) => s.panelOpen)
  const setPanelOpen = useVoyage((s) => s.setPanelOpen)
  const audioOn = useVoyage((s) => s.audioOn)
  const [, forceMusic] = useState(0)
  useEffect(() => radio.subscribe(() => forceMusic((n) => n + 1)), [])

  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    return COSMOS.filter((b) => b.name.toLowerCase().includes(t) || b.kindLabel.toLowerCase().includes(t)).slice(0, 7)
  }, [q])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-3 pt-3">
      <div className="glass pointer-events-auto flex max-w-[min(980px,96vw)] items-center gap-2 rounded-2xl px-2.5 py-2 shadow-2xl">
        {/* brand */}
        <div className="flex shrink-0 items-center gap-2 pl-1 pr-1">
          <img src="/favicon.svg" alt="Starpin" className="h-6 w-6" />
          <span className="hidden font-display text-[15px] font-semibold tracking-wide text-white sm:block">Starpin</span>
        </div>

        <div className="h-7 w-px bg-white/10" />

        {/* search */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-2.5 py-1.5 ring-1 ring-white/10 focus-within:ring-stardust/40">
            <Search width={16} height={16} className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Search the cosmos…"
              className="w-36 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none sm:w-48"
            />
          </div>
          {focused && results.length > 0 && (
            <div className="glass absolute left-0 top-12 max-h-80 w-72 overflow-auto rounded-xl p-1.5 shadow-2xl scroll-thin">
              {results.map((b) => (
                <button
                  key={b.id}
                  onMouseDown={() => {
                    select(b.id)
                    setQ('')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/10"
                >
                  <span className="text-lg">{b.emoji}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{b.name}</span>
                    <span className="block truncate text-xs text-slate-400">{b.kindLabel}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={takeMeSomewhere}
          className="hidden shrink-0 items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white md:flex"
        >
          <Shuffle width={15} height={15} />
          <span>Take me somewhere</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          {/* view segmented */}
          <div className="mr-1 flex items-center gap-0.5 rounded-xl bg-white/[0.05] p-0.5 ring-1 ring-white/10">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                title={v.label}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition ${
                  view === v.id ? 'bg-stardust/25 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <v.Icon width={15} height={15} />
                <span className="hidden lg:block">{v.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={takeMeSomewhere}
            title="Take me somewhere"
            aria-label="Take me somewhere"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
          >
            <Shuffle width={17} height={17} />
          </button>
          <TIcon label="Soundtrack" active={audioOn || radio.playing} onClick={onSound}>
            <Music width={17} height={17} />
          </TIcon>
          <TIcon label="Voyages" onClick={onVoyages}>
            <Compass width={18} height={18} />
          </TIcon>
          <TIcon label="Share voyage" onClick={onShare}>
            <Share width={17} height={17} />
          </TIcon>
          <TIcon
            label={playing ? 'Stop tour' : 'Play tour'}
            active={playing}
            onClick={() => setPlaying(!playing && stops.length > 1)}
          >
            {playing ? <Pause width={17} height={17} /> : <Play width={17} height={17} />}
          </TIcon>
          <TIcon label={panelOpen ? 'Hide voyage' : 'Show voyage'} active={panelOpen} onClick={() => setPanelOpen(!panelOpen)}>
            <Panel width={17} height={17} />
          </TIcon>
        </div>
      </div>
    </div>
  )
}
