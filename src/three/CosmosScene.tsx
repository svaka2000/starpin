import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Starfield from './Starfield'
import Bodies from './Bodies'
import VoyageRoute from './VoyageRoute'
import CameraRig from './CameraRig'
import Effects from './Effects'
import { useVoyage } from '../store/useVoyage'

export default function CosmosScene() {
  return (
    <Canvas
      camera={{ position: [0, 16, 40], fov: 55, near: 0.1, far: 6000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => useVoyage.getState().select(null)}
    >
      <color attach="background" args={['#05060c']} />
      <ambientLight intensity={0.13} />
      <hemisphereLight args={['#7f9cff', '#0a0c18', 0.18]} />
      <pointLight position={[0, 0, 0]} intensity={3.2} decay={0} color="#fff3d6" />
      <Starfield />
      <Suspense fallback={null}>
        <Bodies />
      </Suspense>
      <VoyageRoute />
      <CameraRig />
      <Effects />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.85}
        minDistance={2.4}
        maxDistance={130}
      />
    </Canvas>
  )
}
