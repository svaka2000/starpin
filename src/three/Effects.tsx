import { Bloom, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing'

/** Cinematic post-processing — bloom on bright bodies, a soft vignette, SMAA. */
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.9} luminanceThreshold={0.2} luminanceSmoothing={0.65} mipmapBlur radius={0.72} />
      <Vignette offset={0.22} darkness={0.72} eskil={false} />
      <SMAA />
    </EffectComposer>
  )
}
