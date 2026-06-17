import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'
import { COSMOS } from '../data/cosmos'
import { auToSceneRadius } from '../lib/astro'
import { glowTexture } from '../lib/textures'
import { useVoyage } from '../store/useVoyage'
import type { CelestialBody } from '../types'
import Planet from './Planet'
import BlackHole from './BlackHole'
import DeepSky from './DeepSky'
import { DEEPSKY } from '../data/textures'

function coreRadius(b: CelestialBody): number {
  if (b.id === 'sun') return 1.15
  return THREE.MathUtils.clamp(b.size * 0.5, 0.14, 0.95)
}

/** Faint orbital rings for the solar-system bodies (the orrery feel). */
function Orbits() {
  const radii = useMemo(() => {
    const set = new Set<number>()
    COSMOS.filter((b) => b.region === 'solar' && b.id !== 'sun' && b.kind !== 'moon').forEach((b) =>
      set.add(Number(auToSceneRadius(b.au ?? 0).toFixed(3))),
    )
    return [...set]
  }, [])
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {radii.map((r) => (
        <mesh key={r}>
          <ringGeometry args={[r - 0.012, r + 0.012, 128]} />
          <meshBasicMaterial color="#6f86c9" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Pin({ body, hovered, onHover }: { body: CelestialBody; hovered: boolean; onHover: (id: string | null) => void }) {
  const select = useVoyage((s) => s.select)
  const stops = useVoyage((s) => s.stops)
  const selectedId = useVoyage((s) => s.selectedId)

  const core = coreRadius(body)
  const stopIndex = stops.indexOf(body.id)
  const isStop = stopIndex >= 0
  const isSelected = selectedId === body.id
  const showLabel = hovered || isSelected || isStop

  const coreRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (coreRef.current) coreRef.current.rotation.y += 0.004
    if (haloRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2 + core) * 0.06
      haloRef.current.scale.setScalar(s)
    }
  })

  return (
    <group position={body.scenePos}>
      {body.region === 'solar' ? (
        <Planet body={body} core={core} />
      ) : body.kind === 'blackhole' || body.kind === 'quasar' ? (
        <BlackHole core={core} quasar={body.kind === 'quasar'} />
      ) : DEEPSKY.has(body.id) ? (
        <DeepSky body={body} core={core} />
      ) : (
        <>
          {/* soft glow */}
          <sprite scale={[core * 4.2 + 0.6, core * 4.2 + 0.6, 1]}>
            <spriteMaterial
              map={glowTexture(body.color)}
              transparent
              opacity={0.85}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
          {/* core body */}
          <mesh ref={coreRef}>
            <sphereGeometry args={[core, 28, 28]} />
            <meshStandardMaterial
              color={body.color}
              emissive={body.color}
              emissiveIntensity={0.9}
              roughness={0.55}
              metalness={0.1}
            />
          </mesh>
        </>
      )}

      {/* selection halo only for point-like markers (stars/exoplanets), not bodies with rich visuals */}
      {(isSelected || isStop) &&
        body.region !== 'solar' &&
        body.kind !== 'blackhole' &&
        body.kind !== 'quasar' &&
        !DEEPSKY.has(body.id) && (
        <Billboard>
          <mesh ref={haloRef}>
            <ringGeometry args={[core * 1.7, core * 1.95, 48]} />
            <meshBasicMaterial
              color={isSelected ? '#cfe0ff' : '#8ab4ff'}
              transparent
              opacity={isSelected ? 0.95 : 0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </Billboard>
      )}

      {/* easy-to-click hit area */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          select(body.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(body.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[Math.max(core * 2.4, 1.35), 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {showLabel && (
        <Html position={[0, core + 0.55, 0]} center zIndexRange={[40, 0]} pointerEvents="none">
          <div
            style={{ pointerEvents: 'none' }}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium leading-none shadow-lg transition ${
              isSelected
                ? 'bg-white/95 text-slate-900'
                : isStop
                ? 'bg-stardust/90 text-slate-950'
                : 'bg-slate-900/85 text-slate-100 ring-1 ring-white/10'
            }`}
          >
            {isStop && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-950/80 text-[10px] font-bold text-stardust">
                {stopIndex + 1}
              </span>
            )}
            <span className="text-[13px]">{body.emoji}</span>
            <span>{body.name}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

function Belt({ rIn, rOut, count, color, size }: { rIn: number; rOut: number; count: number; color: string; size: number }) {
  const geo = useMemo(() => {
    const pos: number[] = []
    let seed = Math.round(rIn * 1000)
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2
      const r = rIn + rng() * (rOut - rIn)
      pos.push(Math.cos(a) * r, (rng() - 0.5) * 0.12, Math.sin(a) * r)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [rIn, rOut, count])
  const ref = useRef<THREE.Points>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.01
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={0.6} depthWrite={false} />
    </points>
  )
}

export default function Bodies() {
  const [hovered, setHovered] = useState<string | null>(null)
  return (
    <group>
      <Orbits />
      <Belt rIn={auToSceneRadius(2.1)} rOut={auToSceneRadius(3.3)} count={1600} color="#9a8f7d" size={0.03} />
      <Belt rIn={auToSceneRadius(30)} rOut={auToSceneRadius(50)} count={2200} color="#7f8aa8" size={0.03} />
      {COSMOS.map((b) => (
        <Pin key={b.id} body={b} hovered={hovered === b.id} onHover={setHovered} />
      ))}
    </group>
  )
}
