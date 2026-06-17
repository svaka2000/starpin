import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { glowTexture } from '../lib/textures'
import type { CelestialBody } from '../types'

/**
 * Renders a deep-sky object (nebula / galaxy / cluster) as a soft-edged billboard
 * of its real telescope photo. Additive blending makes the dark background vanish
 * over the starfield; a radial falloff feathers the image border into space.
 */
export default function DeepSky({ body, core }: { body: CelestialBody; core: number }) {
  const tex = useTexture(`/textures/deepsky/${body.id}.jpg`)
  tex.colorSpace = THREE.SRGBColorSpace

  const aspect = useMemo(() => {
    const img = tex.image as { width?: number; height?: number } | undefined
    return img && img.width && img.height ? img.width / img.height : 1
  }, [tex])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: tex }, uBright: { value: 1.05 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform sampler2D uMap; uniform float uBright; varying vec2 vUv;
          void main() {
            vec3 c = texture2D(uMap, vUv).rgb;
            float d = distance(vUv, vec2(0.5));
            float radial = smoothstep(0.55, 0.12, d);
            gl_FragColor = vec4(c * radial * uBright, 1.0);
          }`,
      }),
    [tex],
  )

  const spin = useRef<THREE.Group>(null)
  const isGalaxyish = body.kind === 'galaxy' || body.kind === 'cluster'
  const base = THREE.MathUtils.clamp(body.size * 6, 4, 9)

  useFrame((s, dt) => {
    if (!spin.current) return
    if (isGalaxyish) spin.current.rotation.z += dt * 0.03
    else spin.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 0.6 + core) * 0.03)
  })

  return (
    <Billboard>
      {/* soft colour halo for bloom + presence at distance */}
      <sprite scale={[base * 1.1, base * 1.1, 1]}>
        <spriteMaterial map={glowTexture(body.color)} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <group ref={spin}>
        <mesh material={mat} scale={[base * aspect, base, 1]}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      </group>
    </Billboard>
  )
}
