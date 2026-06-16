import { useMemo, useState } from 'react'
import { COSMOS } from '../data/cosmos'
import { describeDistance } from '../lib/astro'
import { useVoyage } from '../store/useVoyage'

const W = 1200
const H = 600

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
  return Array.from({ length: 260 }, () => ({
    x: rng() * W,
    y: rng() * H,
    r: rng() * 1.1 + 0.2,
    o: rng() * 0.5 + 0.15,
  }))
}

export default function SkyChart() {
  const select = useVoyage((s) => s.select)
  const stops = useVoyage((s) => s.stops)
  const selectedId = useVoyage((s) => s.selectedId)
  const [hovered, setHovered] = useState<string | null>(null)

  const stars = useMemo(bgStars, [])
  const objects = useMemo(() => COSMOS.filter((b) => b.region === 'deep'), [])

  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[radial-gradient(120%_120%_at_50%_-10%,#0b1224_0%,#05060c_70%)]">
      <div className="absolute left-1/2 top-20 -translate-x-1/2 text-center">
        <h2 className="font-display text-sm font-semibold tracking-wide text-slate-200">The night sky from Earth</h2>
        <p className="text-[11px] text-slate-500">Right ascension × declination · solar-system worlds live in the Orrery view</p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-[min(1180px,94vw)] max-h-[78vh]"
        style={{ filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.5))' }}
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1430" />
            <stop offset="100%" stopColor="#070a18" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} rx="16" fill="url(#sky)" stroke="rgba(138,180,255,0.16)" />

        {/* background stars */}
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#cfe0ff" opacity={s.o} />
        ))}

        {/* grid */}
        {Array.from({ length: 12 }, (_, i) => i * 2).map((h) => (
          <g key={`v${h}`}>
            <line x1={raToX(h)} y1={0} x2={raToX(h)} y2={H} stroke="rgba(138,180,255,0.08)" />
            <text x={raToX(h) + 4} y={H - 8} fill="rgba(180,200,255,0.4)" fontSize="11">{h}h</text>
          </g>
        ))}
        {[-60, -30, 0, 30, 60].map((d) => (
          <g key={`h${d}`}>
            <line
              x1={0}
              y1={decToY(d)}
              x2={W}
              y2={decToY(d)}
              stroke={d === 0 ? 'rgba(138,180,255,0.22)' : 'rgba(138,180,255,0.08)'}
              strokeDasharray={d === 0 ? '' : '4 6'}
            />
            <text x={6} y={decToY(d) - 5} fill="rgba(180,200,255,0.4)" fontSize="11">{d > 0 ? `+${d}` : d}°</text>
          </g>
        ))}

        {/* objects */}
        {objects.map((b) => {
          const x = raToX(b.ra ?? 0)
          const y = decToY(b.dec ?? 0)
          const isStop = stops.includes(b.id)
          const isSel = selectedId === b.id
          const isHover = hovered === b.id
          const r = 3 + b.size * 3
          const showLabel = isStop || isSel || isHover
          return (
            <g
              key={b.id}
              transform={`translate(${x},${y})`}
              className="cursor-pointer"
              onClick={() => select(b.id)}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle r={r + 7} fill={b.color} opacity={isHover || isSel ? 0.28 : 0.14} />
              <circle r={r} fill={b.color} stroke={isSel ? '#ffffff' : isStop ? '#8ab4ff' : 'rgba(255,255,255,0.5)'} strokeWidth={isSel || isStop ? 1.6 : 0.6} />
              {showLabel && (
                <g>
                  <text x={r + 6} y={-2} fill="#fff" fontSize="13" fontWeight={600} style={{ paintOrder: 'stroke', stroke: '#05060c', strokeWidth: 3 }}>
                    {b.emoji} {b.name}
                  </text>
                  <text x={r + 6} y={13} fill="rgba(180,200,255,0.7)" fontSize="10.5" style={{ paintOrder: 'stroke', stroke: '#05060c', strokeWidth: 3 }}>
                    {describeDistance(b.distanceLy)}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
