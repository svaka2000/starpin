import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { glowTexture } from '../lib/textures'

function radialRing(inner: number, outer: number, segments = 160): THREE.RingGeometry {
  const g = new THREE.RingGeometry(inner, outer, segments)
  const pos = g.attributes.position
  const uv = g.attributes.uv
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5)
  }
  uv.needsUpdate = true
  return g
}

function diskMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv; varying vec3 vPos;
      void main() { vUv = uv; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv; varying vec3 vPos;
      void main() {
        float t = vUv.x;                                   // 0 inner -> 1 outer
        float ang = atan(vPos.z, vPos.x);
        float radial = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.55, 1.0, t));
        // swirling banding
        float bands = 0.6 + 0.4 * sin(ang * 3.0 + uTime * 2.2 - t * 22.0);
        // relativistic doppler beaming — one side brighter
        float doppler = 0.45 + 0.95 * pow(0.5 + 0.5 * cos(ang - 1.2), 2.0);
        float bright = radial * bands * doppler;
        vec3 hot = vec3(1.0, 0.95, 0.85);
        vec3 mid = vec3(1.0, 0.55, 0.15);
        vec3 cool = vec3(0.85, 0.18, 0.05);
        vec3 col = mix(hot, mix(mid, cool, smoothstep(0.2, 1.0, t)), smoothstep(0.0, 0.4, t));
        gl_FragColor = vec4(col * bright * 2.4, bright);
      }`,
  })
}

export default function BlackHole({ core, quasar }: { core: number; quasar?: boolean }) {
  const diskMat = useMemo(diskMaterial, [])
  const diskRef = useRef<THREE.Mesh>(null)
  const diskGeo = useMemo(() => radialRing(core * 1.5, core * 4.2), [core])
  const tilt = quasar ? 0.5 : 1.15

  useFrame((_, dt) => {
    diskMat.uniforms.uTime.value += dt
    if (diskRef.current) diskRef.current.rotation.z += dt * 0.25
  })

  return (
    <group>
      {/* event horizon */}
      <mesh>
        <sphereGeometry args={[core, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* accretion disk */}
      <group rotation={[tilt, 0, 0]}>
        <mesh ref={diskRef} geometry={diskGeo} material={diskMat} />
        {/* photon ring */}
        <mesh>
          <torusGeometry args={[core * 1.32, core * 0.05, 16, 96]} />
          <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
        </mesh>
      </group>

      {/* relativistic jets for quasars */}
      {quasar &&
        [1, -1].map((d) => (
          <mesh key={d} position={[0, d * core * 3.2, 0]} rotation={[d === 1 ? 0 : Math.PI, 0, 0]}>
            <coneGeometry args={[core * 0.9, core * 5, 24, 1, true]} />
            <meshBasicMaterial color="#8fb6ff" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        ))}

      {/* core glow */}
      <sprite scale={[core * (quasar ? 9 : 5), core * (quasar ? 9 : 5), 1]}>
        <spriteMaterial map={glowTexture(quasar ? '#bcd2ff' : '#ff9a3c')} transparent opacity={quasar ? 0.8 : 0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}
