import { Suspense, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, useTexture } from '@react-three/drei'
import * as THREE from 'three'

/** Real ESO Milky Way panorama on a giant inverted sphere — the galactic backdrop. */
function MilkyWay() {
  const tex = useTexture('/textures/milkyway.jpg')
  tex.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh rotation={[0.4, 1.2, -0.3]} scale={[-1, 1, 1]}>
      <sphereGeometry args={[420, 64, 64]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} color="#7d88b0" toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

export default function Starfield() {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.004
  })
  return (
    <group ref={group}>
      <Suspense fallback={null}>
        <MilkyWay />
      </Suspense>
      <Stars radius={300} depth={120} count={5000} factor={4.5} saturation={0.5} fade speed={0.4} />
      <Stars radius={160} depth={60} count={1800} factor={3} saturation={0} fade speed={0.7} />
    </group>
  )
}
