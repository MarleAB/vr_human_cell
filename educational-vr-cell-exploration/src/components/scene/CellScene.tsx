import { Suspense } from 'react'
import { Nucleus } from './organelles/Nucleus'
import { RoughER, SmoothER } from './organelles/EndoplasmicReticulum'
import { Centrosome, Lysosome, Mitochondrion, Peroxisome } from './organelles/Organelles'
import { Golgi, SecretoryVesicles } from './organelles/Golgi'
import { Cytoplasm, Membrane } from './organelles/Environment'
import { Checkpoints } from './Checkpoints'
import { Player } from './Player'
import { VRHud, VRPanel } from './VRPanel'

export function CellScene() {
  return (
    <>
      <color attach="background" args={['#06182b']} />
      <fogExp2 attach="fog" args={['#0a2a45', 0.011]} />

      {/* Iluminación */}
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#cfeeff', '#123a5c', 0.9]} />
      <directionalLight position={[12, 26, 10]} intensity={1.7} color="#fff6e6" />
      <directionalLight position={[-14, 12, -10]} intensity={0.6} color="#9fd0ff" />
      <pointLight position={[0, 9, 12]} intensity={60} color="#bfe9ff" distance={40} decay={2} />

      <Player />

      <Suspense fallback={null}>
        <Membrane />
        <Cytoplasm />
        <Nucleus />
        <RoughER />
        <SmoothER />
        <Golgi />
        <SecretoryVesicles />
        <Centrosome />

        {/* Mitocondrias */}
        <Mitochondrion position={[16, 1.25, -1]} rotationY={0.35} />
        <Mitochondrion position={[-16, 1.25, -11]} rotationY={-0.6} scale={0.9} />
        <Mitochondrion position={[3, 1.15, 9]} rotationY={1.1} scale={0.8} />

        {/* Lisosomas */}
        <Lysosome position={[-9, 0.85, 13.5]} />
        <Lysosome position={[6, 0.7, -16]} radius={0.65} />
        <Lysosome position={[-18, 0.7, 2]} radius={0.6} />

        {/* Peroxisomas */}
        <Peroxisome position={[18.5, 0.95, -6.5]} />
        <Peroxisome position={[-5, 0.65, 14]} radius={0.6} />

        <Checkpoints />
        <VRPanel />
        <VRHud />
      </Suspense>
    </>
  )
}
