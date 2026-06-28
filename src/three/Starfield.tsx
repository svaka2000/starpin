import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { spikeTexture } from '../lib/textures'

// blackbody-ish star colours, weighted toward white / blue-white like the real sky
const PALETTE: [string, number][] = [
  ['#ffffff', 38],
  ['#dbe6ff', 22],
  ['#bcd2ff', 12],
  ['#fff6e6', 12],
  ['#ffe7b8', 8],
  ['#ffd2a1', 5],
  ['#ffb487', 3],
]
const TOTAL = PALETTE.reduce((s, p) => s + p[1], 0)

function pickColor(r: number): THREE.Color {
  let t = r * TOTAL
  for (const [hex, w] of PALETTE) {
    if (t < w) return new THREE.Color(hex)
    t -= w
  }
  return new THREE.Color('#ffffff')
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Round, crisp star points with a tiny halo and gentle twinkle. */
function StarPoints({ count, seed }: { count: number; seed: number }) {
  const geo = useMemo(() => {
    const r = rng(seed)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // even direction on a sphere, slight depth variation
      const u = r() * 2 - 1
      const th = r() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const rad = 270 + r() * 90
      pos[i * 3] = Math.cos(th) * s * rad
      pos[i * 3 + 1] = u * rad
      pos[i * 3 + 2] = Math.sin(th) * s * rad
      // magnitude: heavily skewed so most are faint, a few are bright
      const b = Math.pow(r(), 5)
      const c = pickColor(r()).multiplyScalar(0.55 + b * 0.75)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
      size[i] = 0.9 + b * 4.2
      phase[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    return g
  }, [count, seed])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uDpr: { value: Math.min(window.devicePixelRatio || 1, 2) }, uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute float aSize; attribute float aPhase; attribute vec3 aColor;
          uniform float uDpr; varying vec3 vColor; varying float vPhase;
          void main() {
            vColor = aColor; vPhase = aPhase;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * uDpr;
          }`,
        fragmentShader: `
          uniform float uTime; varying vec3 vColor; varying float vPhase;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float core = smoothstep(0.5, 0.05, d);
            float halo = smoothstep(0.5, 0.0, d);
            float a = clamp(core + halo * 0.35, 0.0, 1.0);
            if (a < 0.01) discard;
            float tw = 0.82 + 0.18 * sin(uTime * 1.6 + vPhase * 6.2831);
            gl_FragColor = vec4(vColor * tw, a);
          }`,
      }),
    [],
  )

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
  })

  return <points geometry={geo} material={mat} />
}

function BrightStars() {
  const tex = useMemo(spikeTexture, [])
  const stars = useMemo(() => {
    const r = rng(99)
    const cols = ['#ffffff', '#dbe6ff', '#bcd2ff', '#fff2d8']
    return Array.from({ length: 16 }, () => {
      const u = r() * 2 - 1
      const th = r() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const rad = 280 + r() * 70
      return {
        pos: [Math.cos(th) * s * rad, u * rad, Math.sin(th) * s * rad] as [number, number, number],
        scale: 9 + r() * 12,
        color: cols[Math.floor(r() * cols.length)],
      }
    })
  }, [])
  return (
    <group>
      {stars.map((st, i) => (
        <sprite key={i} position={st.pos} scale={[st.scale, st.scale, 1]}>
          <spriteMaterial map={tex} color={st.color} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

/** Real ESO Milky Way panorama on a giant inverted sphere — dim, neutral galactic backdrop. */
function MilkyWay() {
  const tex = useTexture('/textures/milkyway.jpg')
  tex.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh rotation={[0.35, 1.2, -0.28]} scale={[-1, 1, 1]}>
      <sphereGeometry args={[420, 64, 64]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} color="#565d72" depthWrite={false} />
    </mesh>
  )
}

export default function Starfield() {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.003
  })
  return (
    <group ref={group}>
      <Suspense fallback={null}>
        <MilkyWay />
      </Suspense>
      <StarPoints count={9000} seed={7} />
      <BrightStars />
    </group>
  )
}
