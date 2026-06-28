import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { TEXTURES } from '../data/textures'
import { glowTexture } from '../lib/textures'
import type { CelestialBody } from '../types'

const DEG = Math.PI / 180

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

const WORLD_VERT = `
  varying vec2 vUv; varying vec3 vWN; varying vec3 vWP;
  void main() {
    vUv = uv;
    vWN = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWP = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`

/** Earth: real day/night terminator, ocean sun-glint, atmospheric limb. Sun is at the origin. */
function earthMaterial(day: THREE.Texture, night: THREE.Texture, spec: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { dayMap: { value: day }, nightMap: { value: night }, specMap: { value: spec } },
    vertexShader: WORLD_VERT,
    fragmentShader: `
      uniform sampler2D dayMap, nightMap, specMap;
      varying vec2 vUv; varying vec3 vWN; varying vec3 vWP;
      void main() {
        vec3 N = normalize(vWN);
        vec3 L = normalize(-vWP);
        vec3 V = normalize(cameraPosition - vWP);
        float ndl = dot(N, L);
        float day = smoothstep(-0.08, 0.22, ndl);
        vec3 dayC = pow(texture2D(dayMap, vUv).rgb, vec3(2.2));
        vec3 nightC = pow(texture2D(nightMap, vUv).rgb, vec3(2.2));
        float ocean = texture2D(specMap, vUv).r;
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 80.0) * ocean * clamp(ndl, 0.0, 1.0);
        vec3 lit = dayC * (0.04 + 1.1 * max(ndl, 0.0));
        vec3 col = mix(nightC * 8.0, lit, day);
        col += vec3(1.0, 0.86, 0.62) * spec * 2.2;
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        col += vec3(0.25, 0.5, 1.0) * fres * (0.15 + 0.85 * day);
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
}

/** Sun: granulation texture with limb darkening, rendered bright so it blooms. */
function sunMaterial(map: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map } },
    vertexShader: WORLD_VERT,
    fragmentShader: `
      uniform sampler2D map;
      varying vec2 vUv; varying vec3 vWN; varying vec3 vWP;
      void main() {
        vec3 N = normalize(vWN);
        vec3 V = normalize(cameraPosition - vWP);
        float mu = max(dot(N, V), 0.0);
        float limb = 0.42 + 0.58 * pow(mu, 0.5);
        vec3 base = pow(texture2D(map, vUv).rgb, vec3(2.2));
        gl_FragColor = vec4(base * limb * 3.0, 1.0);
      }`,
    toneMapped: false,
  })
}

/** Sun-aware atmospheric rim glow — brighter on the sunlit limb. */
function atmosphereMaterial(color: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(color) }, power: { value: 3.0 } },
    vertexShader: WORLD_VERT,
    fragmentShader: `
      uniform vec3 glowColor; uniform float power;
      varying vec3 vWN; varying vec3 vWP;
      void main() {
        vec3 N = normalize(vWN);
        vec3 V = normalize(cameraPosition - vWP);
        vec3 L = normalize(-vWP);
        float fres = pow(clamp(1.0 - abs(dot(N, V)), 0.0, 1.0), power);
        float day = smoothstep(-0.3, 0.35, dot(N, L));
        gl_FragColor = vec4(glowColor, fres * (0.16 + 0.84 * day));
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
    ;['map', 'clouds', 'night', 'ring'].forEach((k) => {
      const t = tex(k)
      if (t) t.colorSpace = THREE.SRGBColorSpace
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const isEarth = body.id === 'earth'
  const surfRef = useRef<THREE.Mesh>(null)
  const cloudRef = useRef<THREE.Mesh>(null)

  const sunMat = useMemo(() => (cfg.sun ? sunMaterial(tex('map')!) : null), [loaded]) // eslint-disable-line react-hooks/exhaustive-deps
  const earthMat = useMemo(() => (isEarth ? earthMaterial(tex('map')!, tex('night')!, tex('spec')!) : null), [loaded]) // eslint-disable-line react-hooks/exhaustive-deps
  const atmoMat = useMemo(() => (cfg.atmosphere ? atmosphereMaterial(cfg.atmosphere) : null), [cfg.atmosphere])
  const ringGeo = useMemo(() => (cfg.ring ? radialRing(core * 1.35, core * 2.3) : null), [cfg.ring, core])
  const tilt = (cfg.tilt ?? 0) * DEG

  useFrame((_, dt) => {
    if (surfRef.current) surfRef.current.rotation.y += dt * (cfg.sun ? 0.035 : 0.05)
    if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.072
  })

  if (cfg.sun) {
    return (
      <group>
        <mesh ref={surfRef} material={sunMat!}>
          <sphereGeometry args={[core, 64, 64]} />
        </mesh>
        <sprite scale={[core * 4, core * 4, 1]}>
          <spriteMaterial map={glowTexture('#ffc868')} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <sprite scale={[core * 2.3, core * 2.3, 1]}>
          <spriteMaterial map={glowTexture('#fff0c8')} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    )
  }

  return (
    <group rotation={[0, 0, tilt]}>
      {isEarth ? (
        <mesh ref={surfRef} material={earthMat!}>
          <sphereGeometry args={[core, 64, 64]} />
        </mesh>
      ) : (
        <mesh ref={surfRef}>
          <sphereGeometry args={[core, 48, 48]} />
          <meshStandardMaterial map={tex('map')} bumpMap={tex('bump')} bumpScale={core * 0.05} roughness={0.92} metalness={0.0} />
        </mesh>
      )}

      {tex('clouds') && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[core * 1.015, 48, 48]} />
          <meshStandardMaterial map={tex('clouds')} alphaMap={tex('clouds')} transparent opacity={0.9} depthWrite={false} roughness={1} />
        </mesh>
      )}

      {atmoMat && (
        <mesh material={atmoMat}>
          <sphereGeometry args={[core * 1.18, 48, 48]} />
        </mesh>
      )}

      {ringGeo && (
        <mesh geometry={ringGeo} rotation={[Math.PI / 2.05, 0, 0]}>
          <meshStandardMaterial map={tex('ring')} alphaMap={tex('ring')} transparent opacity={0.92} side={THREE.DoubleSide} roughness={0.85} depthWrite={false} />
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
  const tailQuat = useMemo(() => {
    if (body.kind !== 'comet') return null
    const dir = new THREE.Vector3(...body.scenePos).normalize()
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir).toArray() as [number, number, number, number]
  }, [body])
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[core, 32, 32]} />
        <meshStandardMaterial color={body.color} emissive={body.color} emissiveIntensity={body.kind === 'comet' ? 0.5 : 0.08} roughness={0.92} metalness={0.05} />
      </mesh>
      <sprite scale={[core * 2.4, core * 2.4, 1]}>
        <spriteMaterial map={glowTexture(body.color)} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {tailQuat && (
        <mesh quaternion={tailQuat} position={[0, 0, 0]}>
          <coneGeometry args={[core * 1.8, core * 14, 24, 1, true]} />
          <meshBasicMaterial color="#bfe6ff" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

export default function Planet({ body, core }: { body: CelestialBody; core: number }) {
  return TEXTURES[body.id] ? <TexturedPlanet body={body} core={core} /> : <PlainPlanet body={body} core={core} />
}
