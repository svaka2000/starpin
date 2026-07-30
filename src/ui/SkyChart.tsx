import { useMemo, useState } from 'react'
import { COSMOS } from '../data/cosmos'
import { describeDistance } from '../lib/astro'
import { useVoyage } from '../store/useVoyage'

const W = 1200
const H = 600
const MONO = "'JetBrains Mono', ui-monospace, monospace"

function raToX(ra: number) {
  return (ra / 24) * W
}
function decToY(dec: number) {
  return ((90 - dec) / 180) * H
}

// Deterministic background stars (no Math.random so they don't jump on re-render).
function bgStars() {
  let seed = 1337
  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  return Array.from({ length: 300 }, () => ({
    x: rng() * W,
    y: rng() * H,
    r: rng() * 1.05 + 0.2,
    o: rng() * 0.45 + 0.12,
  }))
}

export default function SkyChart() {
  const select = useVoyage((s) => s.select)
  const stops = useVoyage((s) => s.stops)
  const selectedId = useVoyage((s) => s.selectedId)
  const panelOpen = useVoyage((s) => s.panelOpen)
  const [hovered, setHovered] = useState<string | null>(null)

  const stars = useMemo(bgStars, [])
  const objects = useMemo(() => COSMOS.filter((b) => b.region === 'deep'), [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(130%_120%_at_50%_-10%,#0e0d15_0%,#06070c_72%)]">
      <div
        className="flex h-full flex-col items-center justify-center transition-[padding] duration-300"
        style={{ paddingTop: 84, paddingBottom: 28, paddingLeft: 16, paddingRight: panelOpen ? 384 : 16 }}
      >
        <header className="mb-5 text-center">
          <div className="eyebrow">Sky Map</div>
          <h2 className="mt-1 font-display text-[26px] font-semibold leading-none text-parchment">The night sky from Earth</h2>
          <p className="mt-1.5 text-[12px] text-faint">
            Real right ascension × declination · solar-system worlds live in the Orrery view
          </p>
        </header>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full max-h-[74vh]"
          style={{ maxWidth: 1180, filter: 'drop-shadow(0 26px 70px rgba(0,0,0,0.55))' }}
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14121b" />
              <stop offset="100%" stopColor="#0a0910" />
            </linearGradient>
            <radialGradient id="skyvig" cx="50%" cy="42%" r="70%">
              <stop offset="60%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.32)" />
            </radialGradient>
          </defs>

          <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="14" fill="url(#sky)" stroke="rgba(243,241,234,0.09)" />

          {/* background stars — warm white */}
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f3f1ea" opacity={s.o} />
          ))}

          {/* RA grid (vertical) */}
          {Array.from({ length: 12 }, (_, i) => i * 2).map((h) => (
            <g key={`v${h}`}>
              <line x1={raToX(h)} y1={16} x2={raToX(h)} y2={H - 16} stroke="rgba(243,241,234,0.05)" />
              <text
                x={raToX(h) + 5}
                y={H - 12}
                fill="#8b857b"
                fontSize="11"
                fontFamily={MONO}
                letterSpacing="0.06em"
              >
                {h}h
              </text>
            </g>
          ))}

          {/* Dec grid (horizontal) — celestial equator gets a faint amber reference line */}
          {[-60, -30, 0, 30, 60].map((d) => (
            <g key={`h${d}`}>
              <line
                x1={16}
                y1={decToY(d)}
                x2={W - 16}
                y2={decToY(d)}
                stroke={d === 0 ? 'rgba(241,184,94,0.24)' : 'rgba(243,241,234,0.05)'}
                strokeDasharray={d === 0 ? '2 9' : ''}
              />
              <text x={10} y={decToY(d) - 6} fill="#8b857b" fontSize="11" fontFamily={MONO} letterSpacing="0.06em">
                {d > 0 ? `+${d}` : d}°
              </text>
            </g>
          ))}

          {/* equator caption */}
          <text
            x={W - 20}
            y={decToY(0) - 8}
            textAnchor="end"
            fill="rgba(241,184,94,0.5)"
            fontSize="9.5"
            fontFamily={MONO}
            letterSpacing="0.14em"
          >
            CELESTIAL EQUATOR
          </text>

          {/* objects */}
          {objects.map((b) => {
            const x = raToX(b.ra ?? 0)
            const y = decToY(b.dec ?? 0)
            const isStop = stops.includes(b.id)
            const isSel = selectedId === b.id
            const isHover = hovered === b.id
            const r = 3 + b.size * 3
            const showLabel = isStop || isSel || isHover
            const stroke = isSel ? '#f1b85e' : isStop ? 'rgba(241,184,94,0.7)' : 'rgba(243,241,234,0.45)'
            return (
              <g
                key={b.id}
                transform={`translate(${x},${y})`}
                className="cursor-pointer"
                onClick={() => select(b.id)}
                onMouseEnter={() => setHovered(b.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {(isSel || isStop) && <circle r={r + 5.5} fill="none" stroke="#f1b85e" strokeWidth={0.75} opacity={isSel ? 0.6 : 0.32} />}
                <circle r={r + 7} fill={b.color} opacity={isHover || isSel ? 0.26 : 0.12} />
                <circle r={r} fill={b.color} stroke={stroke} strokeWidth={isSel || isStop ? 1.5 : 0.6} />
                {showLabel && (
                  <g>
                    <text
                      x={r + 7}
                      y={-2}
                      fill="#f3f1ea"
                      fontSize="13"
                      fontWeight={600}
                      style={{ paintOrder: 'stroke', stroke: '#0a0910', strokeWidth: 3.5 }}
                    >
                      {b.emoji} {b.name}
                    </text>
                    <text
                      x={r + 7}
                      y={13}
                      fill="#a9a49b"
                      fontSize="10.5"
                      fontFamily={MONO}
                      style={{ paintOrder: 'stroke', stroke: '#0a0910', strokeWidth: 3.5 }}
                    >
                      {describeDistance(b.distanceLy)}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="14" fill="url(#skyvig)" pointerEvents="none" />
        </svg>

        {/* legend */}
        <div className="mt-4 flex items-center gap-5 text-[11px] text-faint">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full ring-1 ring-stardust/70" style={{ background: 'transparent' }} />
            In your voyage
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-stardust" />
            Selected
          </span>
          <span className="hidden sm:inline">Click any world to pin it</span>
        </div>
      </div>
    </div>
  )
}
