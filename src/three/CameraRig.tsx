import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getBody } from '../data/cosmos'
import { DEEPSKY } from '../data/textures'
import { useVoyage } from '../store/useVoyage'

const PRESETS: Record<string, { cam: THREE.Vector3; tgt: THREE.Vector3 }> = {
  cosmos: { cam: new THREE.Vector3(0, 16, 40), tgt: new THREE.Vector3(0, 0, 0) },
  orrery: { cam: new THREE.Vector3(0, 8, 15), tgt: new THREE.Vector3(0, 0, 0) },
}

export default function CameraRig() {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as unknown as
    | { target: THREE.Vector3; update: () => void; enabled: boolean }
    | null

  const selectedId = useVoyage((s) => s.selectedId)
  const focusNonce = useVoyage((s) => s.focusNonce)
  const view = useVoyage((s) => s.view)

  const desiredCam = useRef(PRESETS.cosmos.cam.clone())
  const desiredTgt = useRef(PRESETS.cosmos.tgt.clone())
  const animating = useRef(true)
  const intro = useRef(true)
  const prevView = useRef(view)

  useEffect(() => {
    const viewChanged = prevView.current !== view
    prevView.current = view

    const body = selectedId ? getBody(selectedId) : undefined
    if (body && !viewChanged) {
      const tgt = new THREE.Vector3(...body.scenePos)
      const len = tgt.length()
      const core = body.id === 'sun' ? 1.15 : THREE.MathUtils.clamp(body.size * 0.5, 0.14, 0.95)
      const isSolarPlanet = body.region === 'solar' && body.id !== 'sun'

      let viewDist: number
      let dir: THREE.Vector3
      if (DEEPSKY.has(body.id)) {
        viewDist = THREE.MathUtils.clamp(body.size * 6, 4, 9) * 1.75
        dir = len > 0.01 ? tgt.clone().normalize() : new THREE.Vector3(0, 0.4, 1).normalize()
      } else if (body.kind === 'blackhole' || body.kind === 'quasar') {
        viewDist = 7
        dir = len > 0.01 ? tgt.clone().normalize() : new THREE.Vector3(0, 0.4, 1).normalize()
      } else if (isSolarPlanet && len > 0.5) {
        // view the sunlit (gibbous) face — sun stays off-frame
        viewDist = THREE.MathUtils.clamp(core * 8, 2.2, 6)
        const sunward = tgt.clone().negate().normalize()
        let tangent = new THREE.Vector3(0, 1, 0).cross(sunward)
        if (tangent.lengthSq() < 0.001) tangent.set(1, 0, 0)
        tangent.normalize()
        const a = 0.92
        dir = sunward.multiplyScalar(Math.cos(a)).add(tangent.multiplyScalar(Math.sin(a))).normalize()
      } else {
        viewDist = THREE.MathUtils.clamp(2.6 + body.size * 2.4, 3, 8)
        dir = len > 0.01 ? tgt.clone().normalize() : new THREE.Vector3(0, 0.4, 1).normalize()
      }
      const cam = tgt.clone().add(dir.multiplyScalar(viewDist)).add(new THREE.Vector3(0, viewDist * 0.28, 0))
      desiredTgt.current.copy(tgt)
      desiredCam.current.copy(cam)
    } else {
      const preset = PRESETS[view === 'orrery' ? 'orrery' : 'cosmos']
      desiredCam.current.copy(preset.cam)
      desiredTgt.current.copy(preset.tgt)
    }
    animating.current = true
    if (controls) controls.enabled = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, focusNonce, view, controls])

  useFrame(() => {
    if (!controls) return
    if (animating.current) {
      const f = intro.current ? 0.03 : 0.075
      camera.position.lerp(desiredCam.current, f)
      controls.target.lerp(desiredTgt.current, f)
      controls.update()
      if (camera.position.distanceTo(desiredCam.current) < 0.4) {
        animating.current = false
        intro.current = false
        controls.enabled = true
      }
    } else {
      controls.update()
    }
  })

  return null
}
