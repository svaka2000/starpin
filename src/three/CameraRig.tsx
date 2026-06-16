import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getBody } from '../data/cosmos'
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
  const prevView = useRef(view)

  useEffect(() => {
    const viewChanged = prevView.current !== view
    prevView.current = view

    const body = selectedId ? getBody(selectedId) : undefined
    if (body && !viewChanged) {
      const tgt = new THREE.Vector3(...body.scenePos)
      const len = tgt.length()
      const dir = len > 0.01 ? tgt.clone().normalize() : new THREE.Vector3(0, 0.4, 1).normalize()
      const viewDist = THREE.MathUtils.clamp(2.6 + body.size * 2.4, 3, 8)
      const cam = tgt.clone().add(dir.multiplyScalar(viewDist)).add(new THREE.Vector3(0, viewDist * 0.4, 0))
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
      camera.position.lerp(desiredCam.current, 0.075)
      controls.target.lerp(desiredTgt.current, 0.075)
      controls.update()
      if (camera.position.distanceTo(desiredCam.current) < 0.35) {
        animating.current = false
        controls.enabled = true
      }
    } else {
      controls.update()
    }
  })

  return null
}
