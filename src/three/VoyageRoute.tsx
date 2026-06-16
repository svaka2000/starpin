import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { getBody } from '../data/cosmos'
import { glowTexture } from '../lib/textures'
import { useVoyage } from '../store/useVoyage'

export default function VoyageRoute() {
  const stops = useVoyage((s) => s.stops)

  const { points, cum, total } = useMemo(() => {
    const pts = stops
      .map((id) => getBody(id))
      .filter(Boolean)
      .map((b) => new THREE.Vector3(...b!.scenePos))
    const cumArr: number[] = [0]
    let t = 0
    for (let i = 1; i < pts.length; i++) {
      t += pts[i].distanceTo(pts[i - 1])
      cumArr.push(t)
    }
    return { points: pts, cum: cumArr, total: t }
  }, [stops])

  const ship = useRef<THREE.Sprite>(null)

  useFrame((state) => {
    if (!ship.current || points.length < 2 || total === 0) return
    const period = Math.max(points.length * 2.4, 6)
    const f = (state.clock.elapsedTime % period) / period
    const target = f * total
    let i = 1
    while (i < cum.length && cum[i] < target) i++
    const segLen = cum[i] - cum[i - 1] || 1
    const localT = (target - cum[i - 1]) / segLen
    ship.current.position.lerpVectors(points[i - 1], points[i], localT)
  })

  if (points.length < 2) return null

  return (
    <group>
      <Line points={points} color="#5b6fb0" lineWidth={7} transparent opacity={0.22} />
      <Line points={points} color="#bcd2ff" lineWidth={2} dashed dashScale={6} gapSize={0.6} dashSize={1.4} />
      <sprite ref={ship} scale={[1.5, 1.5, 1]}>
        <spriteMaterial
          map={glowTexture('#ffe9c4')}
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  )
}
