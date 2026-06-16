import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { Suspense } from 'react'
import { glowTexture, starTexture } from '../lib/textures'
import Effects from '../three/Effects'

const K = 6 // visual zoom per tier
const R = 3 // focused-tier radius that fills the view

interface Tier {
  name: string
  size: number // metres across
  blurb: string
  kind: string
}

const TIERS: Tier[] = [
  { name: 'Earth', size: 1.27e7, blurb: 'Your home world — the only one we know that holds life.', kind: 'earth' },
  { name: 'Earth & the Moon', size: 7.7e8, blurb: 'A quarter-million miles of empty space between us.', kind: 'earthmoon' },
  { name: 'The Inner Solar System', size: 4.5e11, blurb: 'Mercury, Venus, Earth and Mars circling the Sun.', kind: 'inner' },
  { name: 'The Solar System', size: 9e12, blurb: 'Out past Neptune — all eight planets at once.', kind: 'solar' },
  { name: 'The Oort Cloud', size: 1.6e16, blurb: 'A vast shell of a trillion comets at the Sun’s frontier.', kind: 'oort' },
  { name: 'The Solar Neighborhood', size: 4e16, blurb: 'Our nearest stars — Alpha Centauri and a handful of suns.', kind: 'neighbors' },
  { name: 'A Stellar Nursery', size: 5e18, blurb: 'Glowing clouds of gas collapsing into brand-new stars.', kind: 'nursery' },
  { name: 'The Milky Way', size: 9.5e20, blurb: '100+ billion stars in a spiral. We’re a speck on one arm.', kind: 'galaxy' },
  { name: 'The Local Group', size: 9.5e22, blurb: 'The Milky Way, Andromeda and ~80 smaller galaxies.', kind: 'localgroup' },
  { name: 'The Virgo Supercluster', size: 1.1e24, blurb: 'Thousands of galaxies bound together by gravity.', kind: 'cluster' },
  { name: 'Laniakea', size: 5e24, blurb: 'Our supercluster home — 100,000 galaxies flowing as one.', kind: 'laniakea' },
  { name: 'The Cosmic Web', size: 8e25, blurb: 'Galaxies strung along filaments around enormous empty voids.', kind: 'web' },
  { name: 'The Observable Universe', size: 8.8e26, blurb: 'Everything light has had time to reach us — 93 billion ly across.', kind: 'universe' },
]

const N = TIERS.length

// ── geometry generators ──────────────────────────────────────────────────────
function rand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function makeGeo(count: number, fill: (i: number, rng: () => number, pos: number[], col: number[]) => void, seed = 7): THREE.BufferGeometry {
  const rng = rand(seed)
  const pos: number[] = []
  const col: number[] = []
  for (let i = 0; i < count; i++) fill(i, rng, pos, col)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return g
}

function spiral(count: number, radius: number, arms = 4, spin = 3.2, seed = 11) {
  const core = new THREE.Color('#ffe6ad')
  const edge = new THREE.Color('#7fa6ff')
  return makeGeo(count, (_, rng, pos, col) => {
    const t = Math.pow(rng(), 1.7)
    const r = t * radius
    const arm = Math.floor(rng() * arms)
    const ang = (arm / arms) * Math.PI * 2 + (r / radius) * spin + (rng() - 0.5) * 0.6
    const jitter = (1 - t) * 0.15 + 0.04
    pos.push(Math.cos(ang) * r + (rng() - 0.5) * radius * jitter, (rng() - 0.5) * radius * 0.05 * (1 - t * 0.8), Math.sin(ang) * r + (rng() - 0.5) * radius * jitter)
    const c = core.clone().lerp(edge, Math.min(t * 1.2, 1))
    col.push(c.r, c.g, c.b)
  }, seed)
}

function blob(count: number, radius: number, color: string, seed = 5) {
  const c = new THREE.Color(color)
  return makeGeo(count, (_, rng, pos, col) => {
    const r = Math.pow(rng(), 0.6) * radius
    const th = rng() * Math.PI * 2
    const ph = Math.acos(2 * rng() - 1)
    pos.push(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph))
    const shade = 0.6 + rng() * 0.4
    col.push(c.r * shade, c.g * shade, c.b * shade)
  }, seed)
}

function web(count: number, radius: number, seed = 21) {
  // scatter points along random filaments between random nodes → cosmic web
  const rng = rand(seed)
  const nodes: THREE.Vector3[] = []
  for (let i = 0; i < 26; i++) nodes.push(new THREE.Vector3((rng() - 0.5) * 2 * radius, (rng() - 0.5) * 2 * radius, (rng() - 0.5) * 2 * radius))
  const cool = new THREE.Color('#6f86d6')
  const warm = new THREE.Color('#cdb8ff')
  return makeGeo(count, (_, r2, pos, col) => {
    const a = nodes[Math.floor(r2() * nodes.length)]
    let b = nodes[Math.floor(r2() * nodes.length)]
    if (a === b) b = nodes[(nodes.indexOf(a) + 1) % nodes.length]
    const t = r2()
    const j = radius * 0.05
    pos.push(a.x + (b.x - a.x) * t + (r2() - 0.5) * j, a.y + (b.y - a.y) * t + (r2() - 0.5) * j, a.z + (b.z - a.z) * t + (r2() - 0.5) * j)
    const c = cool.clone().lerp(warm, r2())
    col.push(c.r, c.g, c.b)
  }, seed)
}

// ── reusable bits ─────────────────────────────────────────────────────────────
function Cloud({ geo, size, opacity, spin = 0 }: { geo: THREE.BufferGeometry; size: number; opacity: number; spin?: number }) {
  const ref = useRef<THREE.Points>(null)
  useFrame((_, dt) => {
    if (ref.current && spin) ref.current.rotation.y += dt * spin
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial map={starTexture()} size={size} sizeAttenuation transparent opacity={opacity} vertexColors depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function Glow({ r, color, opacity, intensity = 1 }: { r: number; color: string; opacity: number; intensity?: number }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[r, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
      </mesh>
      <sprite scale={[r * 7 * intensity, r * 7 * intensity, 1]}>
        <spriteMaterial map={glowTexture(color)} transparent opacity={opacity * 0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

function fade(d: number) {
  const a = 1 - Math.min(Math.abs(d) / 1.18, 1)
  return a * a * (3 - 2 * a)
}

// ── tiers ─────────────────────────────────────────────────────────────────────
function EarthGlobe({ opacity, withMoon }: { opacity: number; withMoon?: boolean }) {
  const [day, clouds, moon] = useTexture(['/textures/earth_day.jpg', '/textures/earth_clouds.jpg', '/textures/moon.jpg'])
  useMemo(() => {
    day.colorSpace = THREE.SRGBColorSpace
    moon.colorSpace = THREE.SRGBColorSpace
  }, [day, moon])
  const earth = useRef<THREE.Mesh>(null)
  const cloud = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (earth.current) earth.current.rotation.y += dt * 0.08
    if (cloud.current) cloud.current.rotation.y += dt * 0.11
  })
  const er = withMoon ? 1.0 : R
  return (
    <group rotation={[0, 0, 0.41]}>
      <group position={withMoon ? [-R * 0.55, 0, 0] : [0, 0, 0]}>
        <mesh ref={earth}>
          <sphereGeometry args={[er, 48, 48]} />
          <meshStandardMaterial map={day} transparent opacity={opacity} roughness={0.85} metalness={0.2} />
        </mesh>
        <mesh ref={cloud}>
          <sphereGeometry args={[er * 1.015, 48, 48]} />
          <meshStandardMaterial map={clouds} alphaMap={clouds} transparent opacity={opacity * 0.85} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[er * 1.16, 32, 32]} />
          <meshBasicMaterial color="#5b9bff" transparent opacity={opacity * 0.12} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      {withMoon && (
        <mesh position={[R * 0.7, 0, 0]}>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial map={moon} transparent opacity={opacity} roughness={1} />
        </mesh>
      )}
    </group>
  )
}

function DotPlanets({ opacity, n, max }: { opacity: number; n: number; max: number }) {
  const cols = ['#b9b2a6', '#e8cda0', '#4f9cff', '#e0744a', '#d9a679', '#e6cf9c', '#9fe7e3', '#5b78ff']
  return (
    <group rotation={[Math.PI / 2.4, 0, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const rr = ((i + 1) / n) * max
        return (
          <group key={i}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[rr - 0.008, rr + 0.008, 96]} />
              <meshBasicMaterial color="#6f86c9" transparent opacity={opacity * 0.4} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh position={[Math.cos(i * 1.7) * rr, 0, Math.sin(i * 1.7) * rr]}>
              <sphereGeometry args={[Math.max(max * 0.03, 0.05), 20, 20]} />
              <meshStandardMaterial color={cols[i % cols.length]} emissive={cols[i % cols.length]} emissiveIntensity={0.5} transparent opacity={opacity} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function HereMarker({ opacity, pos }: { opacity: number; pos: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 3) * 0.25)
  })
  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshBasicMaterial color="#ffe9a8" transparent opacity={opacity} toneMapped={false} />
    </mesh>
  )
}

// built once, shared across tiers
const galaxyGeo = spiral(9000, R, 4, 3.0, 13)
const galaxy2Geo = spiral(4000, R * 0.42, 2, 2.4, 31)
const oortGeo = blob(2500, R, '#9fb6ff', 4)
const starsGeo = blob(2200, R, '#dfe8ff', 9)
const nurseryGeo = blob(2600, R, '#ff8ac0', 14)
const clusterGeo = blob(2400, R, '#bcd0ff', 18)
const webGeo = web(6500, R, 21)
const uniGeo = web(7000, R, 41)

function TierContent({ tier, opacity }: { tier: Tier; opacity: number }) {
  switch (tier.kind) {
    case 'earth':
      return <EarthGlobe opacity={opacity} />
    case 'earthmoon':
      return <EarthGlobe opacity={opacity} withMoon />
    case 'inner':
      return (
        <group>
          <Glow r={0.32} color="#ffd479" opacity={opacity} intensity={1.2} />
          <DotPlanets opacity={opacity} n={4} max={R * 0.85} />
        </group>
      )
    case 'solar':
      return (
        <group>
          <Glow r={0.12} color="#ffd479" opacity={opacity} />
          <DotPlanets opacity={opacity} n={8} max={R} />
        </group>
      )
    case 'oort':
      return (
        <group>
          <Glow r={0.06} color="#ffe9c4" opacity={opacity} />
          <Cloud geo={oortGeo} size={0.03} opacity={opacity * 0.7} spin={0.02} />
        </group>
      )
    case 'neighbors':
      return (
        <group>
          <Glow r={0.1} color="#ffe9c4" opacity={opacity} />
          <Glow r={0.09} color="#ff7e6b" opacity={opacity} />
          <Cloud geo={starsGeo} size={0.05} opacity={opacity * 0.6} />
          <HereMarker opacity={opacity} pos={[0, 0, 0]} />
        </group>
      )
    case 'nursery':
      return (
        <group>
          <Cloud geo={nurseryGeo} size={0.07} opacity={opacity * 0.7} spin={0.03} />
          <Cloud geo={starsGeo} size={0.04} opacity={opacity * 0.5} />
        </group>
      )
    case 'galaxy':
      return (
        <group rotation={[0.5, 0, 0]}>
          <Glow r={0.18} color="#ffe6ad" opacity={opacity} intensity={1.4} />
          <Cloud geo={galaxyGeo} size={0.035} opacity={opacity} spin={0.04} />
          <HereMarker opacity={opacity} pos={[R * 0.55, 0, 0]} />
        </group>
      )
    case 'localgroup':
      return (
        <group rotation={[0.4, 0, 0]}>
          <group position={[-R * 0.4, 0, 0]} rotation={[0, 0, 0.3]}>
            <Cloud geo={galaxyGeo} size={0.03} opacity={opacity} spin={0.05} />
          </group>
          <group position={[R * 0.5, R * 0.1, -R * 0.2]} rotation={[0.3, 0.6, 0]} scale={1.2}>
            <Cloud geo={galaxy2Geo} size={0.03} opacity={opacity} spin={0.04} />
          </group>
          <Cloud geo={clusterGeo} size={0.025} opacity={opacity * 0.4} />
        </group>
      )
    case 'cluster':
    case 'laniakea':
      return (
        <group rotation={[0.4, 0, 0]}>
          <Cloud geo={tier.kind === 'laniakea' ? webGeo : clusterGeo} size={0.04} opacity={opacity} spin={0.02} />
        </group>
      )
    case 'web':
      return <Cloud geo={webGeo} size={0.035} opacity={opacity} spin={0.015} />
    case 'universe':
      return (
        <group>
          <Cloud geo={uniGeo} size={0.03} opacity={opacity * 0.9} spin={0.01} />
          <mesh>
            <sphereGeometry args={[R * 1.15, 48, 48]} />
            <meshBasicMaterial color="#ff8a5c" transparent opacity={opacity * 0.06} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

function Tier({ tier, i, p }: { tier: Tier; i: number; p: number }) {
  const d = p - i
  const opacity = fade(d)
  if (opacity <= 0.01) return null
  const scale = Math.pow(K, -d)
  return (
    <group scale={scale}>
      <TierContent tier={tier} opacity={opacity} />
    </group>
  )
}

function Scene({ p }: { p: number }) {
  return (
    <>
      <color attach="background" args={['#05060c']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 4, 8]} intensity={2} />
      <Stars radius={120} depth={60} count={3000} factor={3} saturation={0} fade speed={0.3} />
      <Suspense fallback={null}>
        {TIERS.map((t, i) => (
          <Tier key={t.kind} tier={t} i={i} p={p} />
        ))}
      </Suspense>
      <Effects />
    </>
  )
}

// ── readout formatting ────────────────────────────────────────────────────────
function fmtMeters(m: number): { big: string; exp: string } {
  const exp = `10^${Math.round(Math.log10(m) * 10) / 10} m`
  const AU = m / 1.495978707e11
  const ly = m / 9.4607304725808e15
  let big: string
  const c = (n: number) =>
    Math.abs(n) >= 1000 ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : n.toLocaleString('en-US', { maximumFractionDigits: 1 })
  if (m < 1e3) big = `${c(m)} m`
  else if (AU < 0.01) big = `${c(m / 1000)} km`
  else if (AU < 9000) big = `${c(AU)} AU`
  else if (ly < 1e6) big = `${c(ly)} light-years`
  else if (ly < 1e9) big = `${c(ly / 1e6)} million ly`
  else big = `${c(ly / 1e9)} billion ly`
  return { big, exp }
}

// ── component ─────────────────────────────────────────────────────────────────
export default function ScaleMode() {
  const [p, setP] = useState(0)
  const target = useRef(0)
  const raf = useRef(0)

  const animate = () => {
    setP((cur) => {
      const next = cur + (target.current - cur) * 0.18
      if (Math.abs(target.current - next) < 0.0008) {
        cancelAnimationFrame(raf.current)
        raf.current = 0
        return target.current
      }
      raf.current = requestAnimationFrame(animate)
      return next
    })
  }
  const setTarget = (v: number) => {
    target.current = Math.max(0, Math.min(N - 1, v))
    if (!raf.current) raf.current = requestAnimationFrame(animate)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const nearest = TIERS[Math.round(p)]
  const lo = Math.floor(p)
  const hi = Math.min(lo + 1, N - 1)
  const f = p - lo
  const logM = Math.log10(TIERS[lo].size) + (Math.log10(TIERS[hi].size) - Math.log10(TIERS[lo].size)) * f
  const meters = Math.pow(10, logM)
  const fmt = fmtMeters(meters)

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-ink"
      onWheel={(e) => setTarget(target.current + e.deltaY * 0.0016)}
    >
      <Canvas camera={{ position: [0, 2.2, 9], fov: 45, near: 0.01, far: 2000 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <Scene p={p} />
      </Canvas>

      {/* readout */}
      <div className="pointer-events-none absolute left-1/2 top-[16%] -translate-x-1/2 text-center">
        <div className="font-mono text-xs tracking-widest text-stardust/70">{fmt.exp}</div>
        <div className="mt-1 font-display text-4xl font-bold text-white drop-shadow-lg sm:text-5xl">{fmt.big}</div>
        <div className="mt-3 font-display text-lg font-semibold text-grad">{nearest.name}</div>
        <p className="mx-auto mt-1 max-w-md px-4 text-sm leading-relaxed text-slate-300">{nearest.blurb}</p>
      </div>

      {/* zoom rail */}
      <div className="absolute bottom-6 left-1/2 w-[min(720px,92vw)] -translate-x-1/2">
        <div className="mb-2 flex items-center justify-between px-1 text-[10px] uppercase tracking-wider text-slate-500">
          <span>🌍 Earth</span>
          <span className="text-slate-400">scroll or drag to travel the scales</span>
          <span>Universe 🌌</span>
        </div>
        <input
          type="range"
          min={0}
          max={N - 1}
          step={0.001}
          value={p}
          onChange={(e) => {
            target.current = parseFloat(e.target.value)
            cancelAnimationFrame(raf.current)
            raf.current = 0
            setP(parseFloat(e.target.value))
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-stardust/30 via-nova/40 to-ember/40 accent-stardust"
        />
        <div className="mt-2 flex justify-between px-1">
          {TIERS.map((t, i) => (
            <button
              key={t.kind}
              onClick={() => setTarget(i)}
              title={t.name}
              className={`h-1.5 w-1.5 rounded-full transition ${Math.round(p) === i ? 'scale-150 bg-stardust' : 'bg-white/25 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
