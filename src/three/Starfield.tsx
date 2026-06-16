import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { glowTexture } from '../lib/textures'

/** Faint coloured nebula clouds drifting in the deep background. */
function Nebulae() {
  const data = useMemo(
    () => [
      { pos: [-120, 40, -160] as const, color: '#3a2a6b', scale: 220, op: 0.22 },
      { pos: [160, -50, -120] as const, color: '#1f3a6b', scale: 200, op: 0.2 },
      { pos: [40, 90, 180] as const, color: '#5b2a55', scale: 180, op: 0.16 },
      { pos: [-90, -80, 120] as const, color: '#234d63', scale: 190, op: 0.16 },
    ],
    [],
  )
  return (
    <group>
      {data.map((n, i) => (
        <sprite key={i} position={n.pos as unknown as THREE.Vector3} scale={[n.scale, n.scale, 1]}>
          <spriteMaterial
            map={glowTexture(n.color)}
            transparent
            opacity={n.op}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  )
}

export default function Starfield() {
  const group = useRef<THREE.Group>(null)
  // Very slow drift so the void feels alive without being distracting.
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.005
  })
  return (
    <group ref={group}>
      <Stars radius={300} depth={120} count={6500} factor={5} saturation={0.4} fade speed={0.4} />
      <Stars radius={180} depth={60} count={2200} factor={3} saturation={0} fade speed={0.6} />
      <Nebulae />
    </group>
  )
}
