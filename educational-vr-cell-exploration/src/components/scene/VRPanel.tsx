import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { CELL_PARTS, MAX_SCORE, TOTAL_PARTS, getPart } from '../../data/cellParts'
import { useGameStore } from '../../store/gameStore'

const LETTERS = ['A', 'B', 'C', 'D']

/** Botón 3D interactivo (funciona con ratón y con los mandos de RV) */
function PanelButton({
  position,
  width = 0.6,
  height = 0.11,
  label,
  color = '#2563eb',
  textColor = '#ffffff',
  align = 'center',
  fontSize = 0.04,
  onClick,
}: {
  position: [number, number, number]
  width?: number
  height?: number
  label: string
  color?: string
  textColor?: string
  align?: 'center' | 'left'
  fontSize?: number
  onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        scale={hover ? 1.03 : 1}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={hover ? '#ffffff' : color} transparent opacity={hover ? 0.95 : 0.9} />
      </mesh>
      <Text
        position={[align === 'left' ? -width / 2 + 0.04 : 0, 0, 0.005]}
        fontSize={fontSize}
        color={hover ? '#0b1f33' : textColor}
        anchorX={align === 'left' ? 'left' : 'center'}
        anchorY="middle"
        maxWidth={width - 0.08}
        textAlign={align}
      >
        {label}
      </Text>
    </group>
  )
}

export function VRPanel() {
  const panel = useGameStore((s) => s.panel)
  const anchor = useGameStore((s) => s.panelAnchor)
  const inVR = useGameStore((s) => s.inVR)
  const { toQuestion, answer, retry, closePanel } = useGameStore.getState()

  if (!inVR || !panel) return null
  const part = getPart(panel.partId)
  const index = CELL_PARTS.findIndex((p) => p.id === part.id)
  const q = part.question

  return (
    <group position={anchor.position} rotation={[0, anchor.yaw, 0]}>
      {/* Fondo */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.56, 1.12]} />
        <meshBasicMaterial color={part.color} transparent opacity={0.9} />
      </mesh>
      <mesh>
        <planeGeometry args={[1.5, 1.06]} />
        <meshBasicMaterial color="#0b1f33" transparent opacity={0.94} />
      </mesh>
      {/* Cabecera */}
      <mesh position={[0, 0.47, 0.002]}>
        <planeGeometry args={[1.5, 0.12]} />
        <meshBasicMaterial color={part.color} />
      </mesh>
      <Text position={[-0.71, 0.47, 0.005]} fontSize={0.06} color="#0b1f33" anchorX="left" anchorY="middle" maxWidth={1.2}>
        {`${index + 1}/${TOTAL_PARTS}  ${part.name}`}
      </Text>

      {panel.stage === 'info' && (
        <>
          <Text position={[-0.7, 0.37, 0.005]} fontSize={0.037} color="#e6f4ff" anchorX="left" anchorY="top" maxWidth={1.4} lineHeight={1.3}>
            {part.description}
          </Text>
          <Text position={[-0.7, 0.07, 0.005]} fontSize={0.037} color="#ffe08a" anchorX="left" anchorY="top" maxWidth={1.4} lineHeight={1.3}>
            {`Función: ${part.func}`}
          </Text>
          <Text position={[-0.7, -0.17, 0.005]} fontSize={0.033} color="#9fe3d3" anchorX="left" anchorY="top" maxWidth={1.4} lineHeight={1.3}>
            {`Dato curioso: ${part.fact}`}
          </Text>
          {panel.review ? (
            <PanelButton position={[0, -0.44, 0.005]} label="Cerrar" color="#475569" onClick={closePanel} />
          ) : (
            <PanelButton position={[0, -0.44, 0.005]} width={0.8} label="¡Entendido! Ir a la pregunta" onClick={toQuestion} />
          )}
        </>
      )}

      {panel.stage === 'question' && (
        <>
          <Text position={[-0.7, 0.37, 0.005]} fontSize={0.045} color="#ffffff" anchorX="left" anchorY="top" maxWidth={1.4} lineHeight={1.25}>
            {q.text}
          </Text>
          {q.options.map((opt, i) => (
            <PanelButton
              key={i}
              position={[0, 0.13 - i * 0.135, 0.005]}
              width={1.4}
              height={0.115}
              label={`${LETTERS[i]}.  ${opt}`}
              color="#1e3a5f"
              align="left"
              fontSize={0.036}
              onClick={() => answer(i)}
            />
          ))}
        </>
      )}

      {panel.stage === 'feedback' && (
        <>
          <Text position={[0, 0.3, 0.005]} fontSize={0.075} color={panel.correct ? '#4ade80' : '#f87171'} anchorX="center" anchorY="middle">
            {panel.correct ? (panel.earned > 0 ? `¡Correcto!  +${panel.earned} puntos` : '¡Correcto!') : 'Respuesta incorrecta'}
          </Text>
          <Text position={[-0.7, 0.16, 0.005]} fontSize={0.038} color="#e6f4ff" anchorX="left" anchorY="top" maxWidth={1.4} lineHeight={1.3}>
            {panel.correct
              ? q.explanation
              : 'Pista: vuelve a leer la información sobre este orgánulo y piensa en su función principal.'}
          </Text>
          {panel.correct ? (
            <PanelButton
              position={[0, -0.4, 0.005]}
              width={0.8}
              label={index + 1 >= TOTAL_PARTS ? 'Terminar recorrido' : 'Continuar al siguiente checkpoint'}
              color="#16a34a"
              onClick={closePanel}
            />
          ) : (
            <>
              <PanelButton
                position={[-0.36, -0.4, 0.005]}
                width={0.64}
                label="Intentar de nuevo"
                color="#d97706"
                onClick={retry}
              />
              <PanelButton
                position={[0.36, -0.4, 0.005]}
                width={0.64}
                label="Volver a leer"
                color="#475569"
                onClick={() => useGameStore.setState({ panel: { ...panel, stage: 'info' } })}
              />
            </>
          )}
        </>
      )}
    </group>
  )
}

/** HUD flotante frente al jugador en VR */
export function VRHud() {
  const group = useRef<THREE.Group>(null!)
  const inVR = useGameStore((s) => s.inVR)
  const phase = useGameStore((s) => s.phase)
  const mode = useGameStore((s) => s.mode)
  const currentIndex = useGameStore((s) => s.currentIndex)
  const score = useGameStore((s) => s.score)
  const panel = useGameStore((s) => s.panel)
  const target = useRef(new THREE.Vector3())
  const dir = useRef(new THREE.Vector3())

  useFrame((state) => {
    if (!group.current) return
    const cam = state.gl.xr.isPresenting ? state.gl.xr.getCamera() : state.camera
    cam.getWorldDirection(dir.current)
    dir.current.y = 0
    dir.current.normalize()
    cam.getWorldPosition(target.current)
    target.current.addScaledVector(dir.current, 1.4)
    target.current.y -= 0.55
    group.current.position.lerp(target.current, 0.08)
    group.current.rotation.y = Math.atan2(-dir.current.x, -dir.current.z)
  })

  if (!inVR || panel) return null

  if (phase === 'finished') {
    const ratio = score / MAX_SCORE
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.65 ? 2 : 1
    return (
      <group ref={group}>
        <mesh>
          <planeGeometry args={[1.2, 0.5]} />
          <meshBasicMaterial color="#0b1f33" transparent opacity={0.9} />
        </mesh>
        <Text position={[0, 0.16, 0.004]} fontSize={0.07} color="#ffd54a" anchorX="center" anchorY="middle">
          {`¡Recorrido completado! ${stars} de 3 estrellas`}
        </Text>
        <Text position={[0, 0.05, 0.004]} fontSize={0.045} color="#e6f4ff" anchorX="center" anchorY="middle">
          {`Puntuación: ${score} / ${MAX_SCORE}`}
        </Text>
        <PanelButton
          position={[0, -0.13, 0.004]}
          width={0.8}
          label="Seguir explorando libremente"
          color="#0891b2"
          onClick={() => useGameStore.getState().continueFree()}
        />
      </group>
    )
  }

  if (phase !== 'playing') return null
  const part = CELL_PARTS[currentIndex]
  const text =
    mode === 'tour' && part
      ? `Checkpoint ${currentIndex + 1}/${TOTAL_PARTS}: ve hacia la luz dorada · ${part.name}`
      : 'Exploración libre: apunta a un orgánulo y pulsa el gatillo'

  return (
    <group ref={group}>
      <mesh>
        <planeGeometry args={[1.1, 0.16]} />
        <meshBasicMaterial color="#0b1f33" transparent opacity={0.75} />
      </mesh>
      <Text position={[0, 0.03, 0.004]} fontSize={0.038} color="#ffe08a" anchorX="center" anchorY="middle" maxWidth={1.04}>
        {text}
      </Text>
      <Text position={[0, -0.045, 0.004]} fontSize={0.03} color="#e6f4ff" anchorX="center" anchorY="middle">
        {`Puntos: ${score}`}
      </Text>
    </group>
  )
}
