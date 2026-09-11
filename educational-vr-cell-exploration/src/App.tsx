import { Canvas } from '@react-three/fiber'
import { PointerEvents, XR, noEvents } from '@react-three/xr'
import { CellScene } from './components/scene/CellScene'
import { EndScreen } from './components/ui/EndScreen'
import { HUD } from './components/ui/HUD'
import { InfoQuizModal } from './components/ui/InfoQuizModal'
import { StartScreen } from './components/ui/StartScreen'
import { useGameStore } from './store/gameStore'
import { xrStore } from './xrStore'

/** Punto de entrada: escena 3D/VR + capas de interfaz */
export default function App() {
  const phase = useGameStore((s) => s.phase)
  const panel = useGameStore((s) => s.panel)
  const inVR = useGameStore((s) => s.inVR)

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#06182b] font-sans">
      <Canvas
        events={noEvents}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        className="touch-none"
      >
        <PointerEvents />
        <XR store={xrStore}>
          <CellScene />
        </XR>
      </Canvas>

      {phase === 'start' && <StartScreen />}
      {phase === 'playing' && !inVR && <HUD />}
      {panel && !inVR && <InfoQuizModal />}
      {phase === 'finished' && !inVR && <EndScreen />}

      {inVR && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#041424] text-cyan-50">
          <div className="text-center">
            <div className="text-4xl">🥽</div>
            <div className="mt-2 text-lg font-bold">Sesión de realidad virtual activa</div>
            <div className="text-sm text-cyan-100/70">Ponte el visor para continuar explorando la célula.</div>
          </div>
        </div>
      )}
    </div>
  )
}
