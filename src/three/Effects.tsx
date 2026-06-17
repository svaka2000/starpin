import { Bloom, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing'

/** Cinematic post-processing — bloom on bright bodies, a soft vignette, SMAA. */
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.62} luminanceThreshold={0.3} luminanceSmoothing={0.6} mipmapBlur radius={0.7} />
      <Vignette offset={0.22} darkness={0.72} eskil={false} />
      <SMAA />
    </EffectComposer>
  )
}
