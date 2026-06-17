import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Billboard, Stars, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { getBody } from '../data/cosmos'
import Planet from '../three/Planet'
import Effects from '../three/Effects'
import { glowTexture, starTexture } from '../lib/textures'

// ── the ladder (ascending by true size, diameter in metres) ─────────────────
type StepType = 'planet' | 'star' | 'image' | 'cloud' | 'prim'
interface Step {
  name: string
  size: number // metres across
  blurb: string
  type: StepType
  ref?: string // body id / image id / cloud kind / prim shape
  color?: string
}

const LADDER: Step[] = [
  { name: 'A Human', size: 1.7, blurb: 'Where it all begins — about 1.7 metres tall.', type: 'prim', ref: 'human', color: '#e7c9a3' },
  { name: 'The ISS', size: 109, blurb: 'The football-field-sized space station in low orbit.', type: 'prim', ref: 'iss', color: '#cfd6e6' },
  { name: 'Mount Everest', size: 8849, blurb: 'Earth’s tallest peak — already dwarfed by what’s coming.', type: 'prim', ref: 'mountain', color: '#c2cdd9' },
  { name: 'Ceres', size: 939400, blurb: 'The largest asteroid, a dwarf planet in the belt.', type: 'prim', ref: 'rock', color: '#9a9088' },
  { name: 'Pluto', size: 2376600, blurb: 'The famous dwarf at the edge of the planets.', type: 'planet', ref: 'pluto' },
  { name: 'The Moon', size: 3474800, blurb: 'Our companion — a quarter of Earth’s width.', type: 'planet', ref: 'moon' },
  { name: 'Mercury', size: 4879000, blurb: 'The smallest planet, scorched beside the Sun.', type: 'planet', ref: 'mercury' },
  { name: 'Mars', size: 6779000, blurb: 'The red planet — about half of Earth.', type: 'planet', ref: 'mars' },
  { name: 'Venus', size: 12104000, blurb: 'Earth’s near-twin in size.', type: 'planet', ref: 'venus' },
  { name: 'Earth', size: 12742000, blurb: 'Home. Look how small it is against what follows.', type: 'planet', ref: 'earth' },
  { name: 'Neptune', size: 49244000, blurb: 'An ice giant ~4× Earth across.', type: 'planet', ref: 'neptune' },
  { name: 'Uranus', size: 50724000, blurb: 'The tilted ice giant.', type: 'planet', ref: 'uranus' },
  { name: 'Saturn', size: 116460000, blurb: 'The ringed jewel — ~9× Earth.', type: 'planet', ref: 'saturn' },
  { name: 'Jupiter', size: 139820000, blurb: 'King of planets — all others fit inside it.', type: 'planet', ref: 'jupiter' },
  { name: 'The Sun', size: 1391400000, blurb: '109 Earths across. Now the planets are specks.', type: 'planet', ref: 'sun' },
  { name: 'Sirius A', size: 2380000000, blurb: 'The brightest night-sky star, bigger than the Sun.', type: 'star', color: '#cfe2ff' },
  { name: 'Arcturus', size: 36000000000, blurb: 'An orange giant — 25× the Sun’s width.', type: 'star', color: '#ffc27a' },
  { name: 'Betelgeuse', size: 1230000000000, blurb: 'A red supergiant — it would swallow Jupiter’s orbit.', type: 'star', color: '#ff6b5a' },
  { name: 'UY Scuti', size: 2380000000000, blurb: 'One of the largest known stars.', type: 'star', color: '#ff8a5c' },
  { name: 'The Solar System', size: 9000000000000, blurb: 'Out to Neptune’s orbit — the Sun is now a dot.', type: 'cloud', ref: 'solar' },
  { name: 'The Oort Cloud', size: 15000000000000000, blurb: 'A trillion-comet shell at the Sun’s frontier.', type: 'cloud', ref: 'oort' },
  { name: 'Crab Nebula', size: 100000000000000000, blurb: 'A supernova’s wreckage, ~11 light-years across.', type: 'image', ref: 'crab' },
  { name: 'Orion Nebula', size: 230000000000000000, blurb: 'A glowing stellar nursery, 24 light-years wide.', type: 'image', ref: 'orion' },
  { name: 'Carina Nebula', size: 460000000000000000, blurb: 'JWST’s Cosmic Cliffs — birthplace of giant stars.', type: 'image', ref: 'carina' },
  { name: 'The Milky Way', size: 950000000000000000000, blurb: '100+ billion stars. The Sun is one of them.', type: 'cloud', ref: 'galaxy' },
  { name: 'Andromeda Galaxy', size: 2000000000000000000000, blurb: 'Our giant neighbour, on a collision course with us.', type: 'image', ref: 'andromeda' },
  { name: 'The Local Group', size: 95000000000000000000000, blurb: 'The Milky Way, Andromeda and ~80 smaller galaxies.', type: 'cloud', ref: 'group' },
  { name: 'Virgo Cluster', size: 140000000000000000000000, blurb: 'Up to 2,000 galaxies bound by gravity.', type: 'image', ref: 'virgo-cluster' },
  { name: 'Laniakea', size: 4900000000000000000000000, blurb: 'Our supercluster — 100,000 galaxies flowing as one.', type: 'cloud', ref: 'web' },
  { name: 'Observable Universe', size: 880000000000000000000000000, blurb: 'Everything light has reached us from — 93 billion ly.', type: 'cloud', ref: 'universe' },
]
const N = LADDER.length

// ── procedural geometry for the cloud tiers ─────────────────────────────────
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}
function makeGeo(count: number, fill: (r: () => number, pos: number[], col: number[]) => void, seed = 7) {
  const r = rng(seed)
  const pos: number[] = []
  const col: number[] = []
  for (let i = 0; i < count; i++) fill(r, pos, col)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return g
}
function spiral(count: number, radius: number, seed = 11) {
  const core = new THREE.Color('#ffe6ad')
  const edge = new THREE.Color('#7fa6ff')
  return makeGeo(count, (r, pos, col) => {
    const t = Math.pow(r(), 1.7)
    const rad = t * radius
    const arm = Math.floor(r() * 4)
    const ang = (arm / 4) * Math.PI * 2 + (rad / radius) * 3.2 + (r() - 0.5) * 0.6
    pos.push(Math.cos(ang) * rad + (r() - 0.5) * radius * 0.1, (r() - 0.5) * radius * 0.05 * (1 - t), Math.sin(ang) * rad + (r() - 0.5) * radius * 0.1)
    const c = core.clone().lerp(edge, Math.min(t * 1.2, 1))
    col.push(c.r, c.g, c.b)
  }, seed)
}
function blob(count: number, radius: number, color: string, seed = 5) {
  const c = new THREE.Color(color)
  return makeGeo(count, (r, pos, col) => {
    const rad = Math.pow(r(), 0.6) * radius
    const th = r() * Math.PI * 2
    const ph = Math.acos(2 * r() - 1)
    pos.push(rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th), rad * Math.cos(ph))
    const s = 0.6 + r() * 0.4
    col.push(c.r * s, c.g * s, c.b * s)
  }, seed)
}
function web(count: number, radius: number, seed = 21) {
  const r = rng(seed)
  const nodes: THREE.Vector3[] = []
  for (let i = 0; i < 26; i++) nodes.push(new THREE.Vector3((r() - 0.5) * 2 * radius, (r() - 0.5) * 2 * radius, (r() - 0.5) * 2 * radius))
  const cool = new THREE.Color('#6f86d6')
  const warm = new THREE.Color('#cdb8ff')
  return makeGeo(count, (r2, pos, col) => {
    const a = nodes[Math.floor(r2() * nodes.length)]
    const b = nodes[Math.floor(r2() * nodes.length)]
    const t = r2()
    const j = radius * 0.05
    pos.push(a.x + (b.x - a.x) * t + (r2() - 0.5) * j, a.y + (b.y - a.y) * t + (r2() - 0.5) * j, a.z + (b.z - a.z) * t + (r2() - 0.5) * j)
    const c = cool.clone().lerp(warm, r2())
    col.push(c.r, c.g, c.b)
  }, seed)
}
const GEO: Record<string, THREE.BufferGeometry> = {
  solar: spiral(0, 1), // placeholder, solar handled specially
  oort: blob(2600, 3, '#9fb6ff', 4),
  galaxy: spiral(9000, 3, 13),
  group: blob(2200, 3, '#bcd0ff', 18),
  web: web(6500, 3, 21),
  universe: web(7200, 3, 41),
}

// ── object renderers (each sized so its overall radius ≈ `radius`) ───────────
function StarObj({ radius, color, opacity }: { radius: number; color: string; opacity: number }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
      </mesh>
      <sprite scale={[radius * 4, radius * 4, 1]}>
        <spriteMaterial map={glowTexture(color)} transparent opacity={opacity * 0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

function ImageObj({ id, radius, opacity, spin }: { id: string; radius: number; opacity: number; spin: number }) {
  const tex = useTexture(`/textures/deepsky/${id}.jpg`)
  tex.colorSpace = THREE.SRGBColorSpace
  const aspect = useMemo(() => {
    const img = tex.image as { width?: number; height?: number } | undefined
    return img && img.width && img.height ? img.width / img.height : 1
  }, [tex])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: tex }, uOp: { value: opacity } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader:
          'uniform sampler2D uMap; uniform float uOp; varying vec2 vUv; void main(){ vec3 c=texture2D(uMap,vUv).rgb; float d=distance(vUv,vec2(0.5)); float r=smoothstep(0.55,0.12,d); gl_FragColor=vec4(c*r,1.0)*uOp; }',
      }),
    [tex],
  )
  mat.uniforms.uOp.value = opacity
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * spin
  })
  return (
    <Billboard>
      <group ref={ref}>
        <mesh material={mat} scale={[radius * 2 * aspect, radius * 2, 1]}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      </group>
    </Billboard>
  )
}

function CloudObj({ kind, radius, opacity }: { kind: string; radius: number; opacity: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.05
  })
  if (kind === 'solar') {
    // sun + faint orbit rings + tiny planet dots, scaled to `radius`
    const s = radius / 3
    return (
      <group ref={ref} scale={[s, s, s]} rotation={[Math.PI / 2.6, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshBasicMaterial color="#ffd479" toneMapped={false} transparent opacity={opacity} />
        </mesh>
        {[0.8, 1.3, 1.9, 2.7].map((r, i) => (
          <group key={i}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r - 0.01, r + 0.01, 96]} />
              <meshBasicMaterial color="#6f86c9" transparent opacity={opacity * 0.4} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh position={[Math.cos(i * 1.6) * r, 0, Math.sin(i * 1.6) * r]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial color="#9fc6ff" toneMapped={false} transparent opacity={opacity} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }
  const s = radius / 3
  return (
    <group ref={ref} scale={[s, s, s]} rotation={kind === 'galaxy' ? [0.5, 0, 0] : [0.3, 0, 0]}>
      <points geometry={GEO[kind]}>
        <pointsMaterial map={starTexture()} size={0.05} sizeAttenuation vertexColors transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

function PrimObj({ shape, radius, color, opacity }: { shape: string; radius: number; color: string; opacity: number }) {
  const mat = <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.7} metalness={0.1} emissive={color} emissiveIntensity={0.1} />
  if (shape === 'human')
    return (
      <mesh scale={[radius, radius, radius]}>
        <capsuleGeometry args={[0.4, 1.2, 6, 12]} />
        {mat}
      </mesh>
    )
  if (shape === 'mountain')
    return (
      <mesh scale={[radius, radius, radius]} position={[0, -radius * 0.3, 0]}>
        <coneGeometry args={[1.1, 1.6, 5]} />
        {mat}
      </mesh>
    )
  if (shape === 'iss')
    return (
      <group scale={[radius, radius, radius]}>
        <mesh>
          <boxGeometry args={[0.5, 0.3, 0.3]} />
          {mat}
        </mesh>
        <mesh position={[-1, 0, 0]}>
          <boxGeometry args={[0.9, 0.02, 0.7]} />
          <meshStandardMaterial color="#3b5bdb" transparent opacity={opacity} emissive="#2233aa" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[1, 0, 0]}>
          <boxGeometry args={[0.9, 0.02, 0.7]} />
          <meshStandardMaterial color="#3b5bdb" transparent opacity={opacity} emissive="#2233aa" emissiveIntensity={0.3} />
        </mesh>
      </group>
    )
  // rock / asteroid
  return (
    <mesh scale={[radius, radius * 0.85, radius * 0.92]}>
      <dodecahedronGeometry args={[1, 1]} />
      {mat}
    </mesh>
  )
}

function StepObject({ step, radius, opacity }: { step: Step; radius: number; opacity: number }) {
  // culling/visibility is decided by the Scene; just render the visual here.
  if (step.type === 'planet') {
    const body = getBody(step.ref!)
    if (!body) return null
    return <Planet body={body} core={radius} />
  }
  if (step.type === 'star') return <StarObj radius={radius} color={step.color!} opacity={opacity} />
  if (step.type === 'image') return <ImageObj id={step.ref!} radius={radius} opacity={opacity} spin={0.03} />
  if (step.type === 'cloud') return <CloudObj kind={step.ref!} radius={radius} opacity={opacity} />
  return <PrimObj shape={step.ref!} radius={radius} color={step.color!} opacity={opacity} />
}

// ── the to-scale, side-by-side scene ────────────────────────────────────────
const K = 1 // world radius of an object exactly at the featured scale
const GAP = 0.5

function Scene({ p }: { p: number }) {
  const lo = Math.max(0, Math.min(N - 1, Math.floor(p)))
  const hi = Math.min(lo + 1, N - 1)
  const f = p - lo
  const logFeat = Math.log10(LADDER[lo].size) + (Math.log10(LADDER[hi].size) - Math.log10(LADDER[lo].size)) * f
  const featSize = Math.pow(10, logFeat)

  const winStart = Math.max(0, lo - 4)
  const winEnd = Math.min(N - 1, hi + 4)
  const radiusOf = (i: number) => (K * LADDER[i].size) / featSize

  // cumulative side-by-side layout, anchored at object[lo] = 0
  const xs: Record<number, number> = { [lo]: 0 }
  for (let i = lo + 1; i <= winEnd; i++) xs[i] = xs[i - 1] + radiusOf(i - 1) + GAP + radiusOf(i)
  for (let i = lo - 1; i >= winStart; i--) xs[i] = xs[i + 1] - radiusOf(i + 1) - GAP - radiusOf(i)
  // keep the nearest object centred most of the time, transition quickly through the middle
  const cameraX = xs[lo] + (xs[hi] - xs[lo]) * smooth(f, 0.3, 0.7)

  const items: { i: number; x: number; r: number; op: number }[] = []
  for (let i = winStart; i <= winEnd; i++) {
    const r = radiusOf(i)
    const x = xs[i] - cameraX
    const t = LADDER[i].type
    let op: number
    let cull: boolean
    if (t === 'planet' || t === 'star') {
      // solid spheres: render up to just before they'd enclose the camera
      op = 1
      cull = r < 0.006 || r > 6.2
    } else if (t === 'prim') {
      op = smooth(r, 0.01, 0.05) * (1 - smooth(r, 18, 30))
      cull = r > 34 || op <= 0.02
    } else {
      // images & clouds can fill the screen (fly-through) before fading far out
      op = smooth(r, 0.01, 0.05) * (1 - smooth(r, 60, 95))
      cull = r > 110 || op <= 0.02
    }
    if (cull) continue
    if (Math.abs(x) - r > 80) continue
    items.push({ i, x, r, op })
  }

  return (
    <>
      <color attach="background" args={['#04050a']} />
      <ambientLight intensity={0.55} />
      <pointLight position={[8, 6, 10]} intensity={2.2} />
      <Stars radius={140} depth={60} count={3500} factor={3} saturation={0} fade speed={0.25} />
      <Suspense fallback={null}>
        {items.map(({ i, x, r, op }) => (
          <group key={LADDER[i].name} position={[x, 0, 0]}>
            <StepObject step={LADDER[i]} radius={r} opacity={op} />
          </group>
        ))}
      </Suspense>
      <Effects />
    </>
  )
}

function smooth(x: number, a: number, b: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// ── formatting ───────────────────────────────────────────────────────────────
function fmtMeters(m: number): { big: string; exp: string } {
  const exp = `10^${Math.round(Math.log10(m) * 10) / 10} m`
  const AU = m / 1.495978707e11
  const ly = m / 9.4607304725808e15
  const c = (n: number) =>
    Math.abs(n) >= 1000 ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : n.toLocaleString('en-US', { maximumFractionDigits: 1 })
  let big: string
  if (m < 1) big = `${c(m * 100)} cm`
  else if (m < 1000) big = `${c(m)} m`
  else if (AU < 0.01) big = `${c(m / 1000)} km`
  else if (AU < 9000) big = `${c(AU)} AU`
  else if (ly < 1e6) big = `${c(ly)} light-years`
  else if (ly < 1e9) big = `${c(ly / 1e6)} million ly`
  else big = `${c(ly / 1e9)} billion ly`
  return { big, exp }
}

// ── component ─────────────────────────────────────────────────────────────────
export default function ScaleMode() {
  const [p, setP] = useState(9) // start at Earth
  const target = useRef(9)
  const raf = useRef(0)

  const animate = () => {
    setP((cur) => {
      const next = cur + (target.current - cur) * 0.16
      if (Math.abs(target.current - next) < 0.0006) {
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

  const nearest = LADDER[Math.round(p)]
  const lo = Math.floor(p)
  const hi = Math.min(lo + 1, N - 1)
  const f = p - lo
  const logM = Math.log10(LADDER[lo].size) + (Math.log10(LADDER[hi].size) - Math.log10(LADDER[lo].size)) * f
  const fmt = fmtMeters(Math.pow(10, logM))

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink" onWheel={(e) => setTarget(target.current + e.deltaY * 0.0016)}>
      <Canvas camera={{ position: [0, 0, 7], fov: 50, near: 0.01, far: 4000 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <Scene p={p} />
      </Canvas>

      {/* readout */}
      <div className="pointer-events-none absolute left-1/2 top-[12%] -translate-x-1/2 px-4 text-center">
        <div className="font-mono text-xs tracking-widest text-stardust/70">{fmt.exp}</div>
        <div className="mt-1 font-display text-4xl font-bold text-white drop-shadow-lg sm:text-5xl">{fmt.big}</div>
        <div className="mt-3 font-display text-lg font-semibold text-grad">{nearest.name}</div>
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-300">{nearest.blurb}</p>
      </div>

      {/* zoom rail */}
      <div className="absolute bottom-6 left-1/2 w-[min(760px,92vw)] -translate-x-1/2">
        <div className="mb-2 flex items-center justify-between px-1 text-[10px] uppercase tracking-wider text-slate-500">
          <span>🧍 You</span>
          <span className="text-slate-400">scroll or drag — everything is shown to true scale</span>
          <span>Universe 🌌</span>
        </div>
        <input
          type="range"
          min={0}
          max={N - 1}
          step={0.001}
          value={p}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            target.current = v
            cancelAnimationFrame(raf.current)
            raf.current = 0
            setP(v)
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-stardust/30 via-nova/40 to-ember/40 accent-stardust"
        />
        <div className="mt-2 flex justify-between px-1">
          {LADDER.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setTarget(i)}
              title={s.name}
              className={`h-1.5 w-1.5 rounded-full transition ${Math.round(p) === i ? 'scale-150 bg-stardust' : 'bg-white/20 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
