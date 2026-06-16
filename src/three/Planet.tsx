import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { TEXTURES } from '../data/textures'
import { glowTexture } from '../lib/textures'
import type { CelestialBody } from '../types'

const DEG = Math.PI / 180

/** Build a ring geometry whose UVs run radially (inner→outer along U) for ring textures. */
function radialRing(inner: number, outer: number, segments = 96): THREE.RingGeometry {
  const g = new THREE.RingGeometry(inner, outer, segments)
  const pos = g.attributes.position
  const uv = g.attributes.uv
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const r = v.length()
    uv.setXY(i, (r - inner) / (outer - inner), 0.5)
  }
  uv.needsUpdate = true
  return g
}

/** Soft atmospheric rim-glow (fresnel) shader. */
function atmosphereMaterial(color: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(color) }, power: { value: 3.2 }, scale: { value: 0.75 } },
    vertexShader: `
      varying vec3 vNormal; varying vec3 vView;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 glowColor; uniform float power; uniform float scale;
      varying vec3 vNormal; varying vec3 vView;
      void main() {
        float f = pow(scale - dot(vNormal, vView), power);
        gl_FragColor = vec4(glowColor, clamp(f, 0.0, 1.0));
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  })
}

function TexturedPlanet({ body, core }: { body: CelestialBody; core: number }) {
  const cfg = TEXTURES[body.id]
  const urls: string[] = []
  const idx: Record<string, number> = {}
  const add = (k: string, u?: string) => {
    if (u) {
      idx[k] = urls.length
      urls.push(u)
    }
  }
  add('map', cfg.map)
  add('bump', cfg.bump)
  add('clouds', cfg.clouds)
  add('night', cfg.night)
  add('spec', cfg.spec)
  add('ring', cfg.ring)

  const loaded = useTexture(urls)
  const tex = (k: string) => (idx[k] !== undefined ? (loaded as THREE.Texture[])[idx[k]] : undefined)

  useMemo(() => {
    const srgb = ['map', 'clouds', 'night']
    srgb.forEach((k) => {
      const t = tex(k)
      if (t) t.colorSpace = THREE.SRGBColorSpace
    })
    const ring = tex('ring')
    if (ring) ring.colorSpace = THREE.SRGBColorSpace
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const surfRef = useRef<THREE.Mesh>(null)
  const cloudRef = useRef<THREE.Mesh>(null)
  const atmoMat = useMemo(() => (cfg.atmosphere ? atmosphereMaterial(cfg.atmosphere) : null), [cfg.atmosphere])
  const ringGeo = useMemo(() => (cfg.ring ? radialRing(core * 1.35, core * 2.3) : null), [cfg.ring, core])
  const tilt = (cfg.tilt ?? 0) * DEG

  useFrame((_, dt) => {
    if (surfRef.current) surfRef.current.rotation.y += dt * (cfg.sun ? 0.04 : 0.06)
    if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.085
  })

  // The Sun: full-bright, with a corona.
  if (cfg.sun) {
    return (
      <group>
        <mesh ref={surfRef}>
          <sphereGeometry args={[core, 48, 48]} />
          <meshBasicMaterial map={tex('map')} toneMapped={false} />
        </mesh>
        <sprite scale={[core * 6, core * 6, 1]}>
          <spriteMaterial map={glowTexture('#ffdd88')} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <sprite scale={[core * 3.4, core * 3.4, 1]}>
          <spriteMaterial map={glowTexture('#fff3d0')} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    )
  }

  const isEarth = body.id === 'earth'

  return (
    <group rotation={[0, 0, tilt]}>
      <mesh ref={surfRef}>
        <sphereGeometry args={[core, 48, 48]} />
        <meshStandardMaterial
          map={tex('map')}
          bumpMap={tex('bump')}
          bumpScale={core * 0.04}
          metalnessMap={isEarth ? tex('spec') : undefined}
          metalness={isEarth ? 0.45 : 0.0}
          roughness={isEarth ? 0.78 : 0.95}
          emissiveMap={isEarth ? tex('night') : undefined}
          emissive={isEarth ? new THREE.Color('#ffe9b0') : new THREE.Color('#000000')}
          emissiveIntensity={isEarth ? 0.55 : 0}
        />
      </mesh>

      {tex('clouds') && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[core * 1.015, 48, 48]} />
          <meshStandardMaterial map={tex('clouds')} alphaMap={tex('clouds')} transparent opacity={0.9} depthWrite={false} />
        </mesh>
      )}

      {atmoMat && (
        <mesh material={atmoMat}>
          <sphereGeometry args={[core * 1.16, 48, 48]} />
        </mesh>
      )}

      {ringGeo && (
        <mesh geometry={ringGeo} rotation={[Math.PI / 2.05, 0, 0]}>
          <meshStandardMaterial
            map={tex('ring')}
            alphaMap={tex('ring')}
            transparent
            opacity={0.92}
            side={THREE.DoubleSide}
            roughness={0.85}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

function PlainPlanet({ body, core }: { body: CelestialBody; core: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.08
  })
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[core, 32, 32]} />
        <meshStandardMaterial color={body.color} roughness={0.9} metalness={0.05} />
      </mesh>
      <sprite scale={[core * 2.6, core * 2.6, 1]}>
        <spriteMaterial map={glowTexture(body.color)} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

export default function Planet({ body, core }: { body: CelestialBody; core: number }) {
  return TEXTURES[body.id] ? <TexturedPlanet body={body} core={core} /> : <PlainPlanet body={body} core={core} />
}
