import { Bloom, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'

/**
 * Cinematic, photographic post-processing.
 * Order matters: bloom (HDR) -> AgX tone-map (HDR->LDR) -> vignette + grain (cosmetic) -> SMAA.
 * The Canvas renders with NoToneMapping so AgX here is the single, filmic tone-map.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.7} luminanceThreshold={0.6} luminanceSmoothing={0.45} mipmapBlur radius={0.62} levels={7} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.18} darkness={0.62} eskil={false} />
      <Noise opacity={0.025} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
      <SMAA />
    </EffectComposer>
  )
}
