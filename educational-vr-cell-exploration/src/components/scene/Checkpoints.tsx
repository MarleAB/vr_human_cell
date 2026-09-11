import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { CELL_PARTS, type CellPart } from '../../data/cellParts'
import { dragState, useGameStore } from '../../store/gameStore'
import { computePanelAnchor } from './Player'
import { quatFromUp } from './utils'

type Status = 'locked' | 'active' | 'done' | 'free'

function CheckpointMarker({ part, status, index }: { part: CellPart; status: Status; index: number }) {
  const ring = useRef<THREE.Mesh>(null!)
  const arrow = useRef<THREE.Group>(null!)
  const [x, , z] = part.checkpoint

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ring.current && status === 'active') {
      const s = 1 + Math.sin(t * 3) * 0.12
      ring.current.scale.set(s, s, 1)
    }
    if (arrow.current) {
      arrow.current.position.y = 2.4 + Math.sin(t * 2.2) * 0.25
      arrow.current.rotation.y = t * 1.2
    }
  })

  if (status === 'locked') return null

  const color = status === 'active' ? '#ffd54a' : status === 'done' ? '#4ade80' : '#7dd3fc'

  return (
    <group position={[x, 0, z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.75, 1.05, 48]} />
        <meshBasicMaterial color={color} transparent opacity={status === 'active' ? 0.9 : 0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={status === 'active' ? 0.25 : 0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {status === 'active' && (
        <>
          <mesh position={[0, 15, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.32, 0.5, 30, 20, 1, true]} />
            <meshBasicMaterial
              color="#ffd54a"
              transparent
              opacity={0.16}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <group ref={arrow}>
            <mesh rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.28, 0.6, 16]} />
              <meshStandardMaterial color="#ffd54a" emissive="#ffb300" emissiveIntensity={0.9} />
            </mesh>
          </group>
          <Billboard position={[0, 3.3, 0]}>
            <Text
              raycast={() => null}
              fontSize={0.45}
              color="#fff3c4"
              outlineWidth={0.03}
              outlineColor="#5a3a00"
              anchorX="center"
              anchorY="bottom"
            >
              {`Checkpoint ${index + 1}`}
            </Text>
          </Billboard>
          <pointLight position={[0, 1.5, 0]} intensity={8} color="#ffd54a" distance={8} decay={2} />
        </>
      )}
    </group>
  )
}

function ConnectorLine({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const { mid, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = b.clone().sub(a)
    return { mid: a.clone().add(b).multiplyScalar(0.5), quat: quatFromUp(dir), len: dir.length() }
  }, [from, to])
  return (
    <mesh position={mid} quaternion={quat} raycast={() => null}>
      <cylinderGeometry args={[0.02, 0.02, len, 6]} />
      <meshBasicMaterial color="#e8f6ff" transparent opacity={0.75} depthWrite={false} />
    </mesh>
  )
}

function PartLabel({ part, status, index }: { part: CellPart; status: Status; index: number }) {
  if (status === 'locked') return null
  const color = status === 'active' ? '#fff1b8' : '#ffffff'
  return (
    <group>
      <ConnectorLine from={part.target} to={part.labelPos} />
      <mesh position={part.target}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <Billboard position={part.labelPos}>
        <Text
          fontSize={0.58}
          color={color}
          outlineWidth={0.045}
          outlineColor="#0b2540"
          anchorX="center"
          anchorY="bottom"
          maxWidth={7}
          textAlign="center"
        >
          {status === 'free' ? part.name : `${index + 1}. ${part.name}`}
        </Text>
      </Billboard>
    </group>
  )
}

function ClickTarget({ part, status }: { part: CellPart; status: Status }) {
  const store = useGameStore
  const getState = useThree((s) => s.get)
  const onClick = () => {
    if (dragState.distance > 8) return
    const s = store.getState()
    if (s.panel || s.phase !== 'playing') return
    const anchor = computePanelAnchor(getState())
    if (status === 'free') {
      s.openPanel(part.id, s.completed.includes(part.id), anchor)
    } else if (status === 'done') {
      s.openPanel(part.id, true, anchor)
    } else if (status === 'active') {
      const p = s.playerPos
      const d = Math.hypot(p.x - part.checkpoint[0], p.z - part.checkpoint[2])
      if (d < 6) s.openPanel(part.id, false, anchor)
      else s.showToast('Acércate al checkpoint iluminado para estudiar esta parte')
    } else {
      s.showToast('Completa antes los checkpoints anteriores')
    }
  }
  return (
    <mesh
      position={part.target}
      onClick={onClick}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      <sphereGeometry args={[1.3, 12, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

export function Checkpoints() {
  const mode = useGameStore((s) => s.mode)
  const currentIndex = useGameStore((s) => s.currentIndex)
  const completed = useGameStore((s) => s.completed)
  const phase = useGameStore((s) => s.phase)

  return (
    <group>
      {CELL_PARTS.map((part, i) => {
        let status: Status
        if (phase === 'start') status = 'free'
        else if (mode === 'free' || phase === 'finished') status = 'free'
        else if (completed.includes(part.id)) status = 'done'
        else if (i === currentIndex) status = 'active'
        else status = 'locked'
        return (
          <group key={part.id}>
            <CheckpointMarker part={part} status={status} index={i} />
            <PartLabel part={part} status={status} index={i} />
            {phase === 'playing' && <ClickTarget part={part} status={status} />}
          </group>
        )
      })}
    </group>
  )
}
