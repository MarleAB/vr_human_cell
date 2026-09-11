import { useEffect, useRef } from 'react'
import { useFrame, useThree, type RootState } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { XROrigin, useXR, useXRControllerLocomotion } from '@react-three/xr'
import * as THREE from 'three'
import {
  CELL_PARTS,
  COLLIDERS,
  EYE_HEIGHT,
  NUCLEUS,
  START_POSITION,
  START_YAW,
  TRIGGER_DISTANCE,
  WALK_RADIUS,
} from '../../data/cellParts'
import { dragState, touchInput, useGameStore, type PanelAnchor } from '../../store/gameStore'

const tmpHead = new THREE.Vector3()
const tmpDir = new THREE.Vector3()
const prevPos = new THREE.Vector3(...START_POSITION)

/** Calcula dónde colocar el panel 3D (frente a la cabeza del jugador) */
export function computePanelAnchor(state: RootState): PanelAnchor {
  const headCam = state.gl.xr.isPresenting ? state.gl.xr.getCamera() : state.camera
  headCam.getWorldPosition(tmpHead)
  headCam.getWorldDirection(tmpDir)
  const hx = tmpDir.x
  const hz = tmpDir.z
  const hl = Math.hypot(hx, hz) || 1
  return {
    position: [tmpHead.x + (hx / hl) * 1.7, tmpHead.y - 0.15, tmpHead.z + (hz / hl) * 1.7],
    yaw: Math.atan2(-hx / hl, -hz / hl),
  }
}

function angleInOpening(deg: number) {
  const a = ((deg % 360) + 360) % 360
  return a >= NUCLEUS.openingStart && a <= NUCLEUS.openingEnd
}

/** Mantiene al jugador dentro de la célula y fuera de los orgánulos sólidos */
function resolveCollisions(prev: THREE.Vector3, next: THREE.Vector3) {
  // límite de la célula
  const d = Math.hypot(next.x, next.z)
  if (d > WALK_RADIUS) {
    next.x = (next.x / d) * WALK_RADIUS
    next.z = (next.z / d) * WALK_RADIUS
  }
  // núcleo: pared con apertura
  const [cx, , cz] = NUCLEUS.center
  const R = NUCLEUS.floorRadius
  const dp = Math.hypot(prev.x - cx, prev.z - cz)
  const dxn = next.x - cx
  const dzn = next.z - cz
  const dn = Math.hypot(dxn, dzn) || 0.0001
  const wasInside = dp < R
  const isInside = dn < R
  if (wasInside !== isInside) {
    const ang = (Math.atan2(dzn, dxn) * 180) / Math.PI
    if (!angleInOpening(ang)) {
      const target = wasInside ? R - 0.08 : R + 0.08
      next.x = cx + (dxn / dn) * target
      next.z = cz + (dzn / dn) * target
    }
  }
  // orgánulos sólidos
  for (const c of COLLIDERS) {
    const dx = next.x - c.x
    const dz = next.z - c.z
    const dist = Math.hypot(dx, dz) || 0.0001
    if (dist < c.r) {
      next.x = c.x + (dx / dist) * c.r
      next.z = c.z + (dz / dist) * c.r
    }
  }
}

export function Player() {
  const rig = useRef<THREE.Group>(null!)
  const cam = useRef<THREE.PerspectiveCamera>(null!)
  const session = useXR((s) => s.session)
  const gl = useThree((s) => s.gl)

  const keys = useRef<Set<string>>(new Set())
  const look = useRef({ yaw: 0, pitch: 0 })
  const drag = useRef({ active: false, x: 0, y: 0, id: -1 })
  const timers = useRef({ trigger: 0, minimap: 0, orbit: 0 })

  // Locomoción VR con los mandos (joystick izquierdo mueve, derecho gira)
  useXRControllerLocomotion(rig, { speed: 3 }, { type: 'snap', degrees: 30 })

  // Al entrar en VR: colocar al jugador en el punto de inicio y arrancar el juego
  useEffect(() => {
    const store = useGameStore.getState()
    store.setInVR(!!session)
    if (session) {
      rig.current.position.set(...START_POSITION)
      rig.current.rotation.set(0, START_YAW, 0)
      prevPos.set(...START_POSITION)
      look.current.yaw = START_YAW
      look.current.pitch = 0
      if (store.phase === 'start') store.startGame('tour')
    }
  }, [session])

  // Al comenzar una partida: reposicionar
  const phase = useGameStore((s) => s.phase)
  useEffect(() => {
    if (phase === 'playing') {
      rig.current.position.set(...START_POSITION)
      prevPos.set(...START_POSITION)
      look.current.yaw = START_YAW
      look.current.pitch = 0
      rig.current.rotation.y = START_YAW
      cam.current.rotation.x = 0
    }
  }, [phase])

  // Entrada de teclado y ratón
  useEffect(() => {
    const el = gl.domElement
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
      keys.current.add(e.code)
    }
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code)
    const onBlur = () => keys.current.clear()
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (drag.current.active) return
      drag.current = { active: true, x: e.clientX, y: e.clientY, id: e.pointerId }
      dragState.distance = 0
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.current.active || e.pointerId !== drag.current.id) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      drag.current.x = e.clientX
      drag.current.y = e.clientY
      dragState.distance += Math.abs(dx) + Math.abs(dy)
      const sens = e.pointerType === 'touch' ? 0.005 : 0.0035
      look.current.yaw -= dx * sens
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - dy * sens, -1.35, 1.35)
    }
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId === drag.current.id) drag.current.active = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [gl])

  useFrame((state, dt) => {
    const store = useGameStore.getState()
    const delta = Math.min(dt, 0.05)
    const inSession = !!session

    // --- Pantalla de inicio: órbita cinematográfica alrededor de la célula ---
    if (!inSession && store.phase === 'start') {
      timers.current.orbit += delta * 0.12
      const t = timers.current.orbit
      const r = 42
      const px = Math.sin(t) * r
      const pz = Math.cos(t) * r
      const py = 16 + Math.sin(t * 0.7) * 3
      rig.current.position.set(px, py, pz)
      const dx = -px
      const dy = 1 - (py + EYE_HEIGHT)
      const dz = -pz
      rig.current.rotation.y = Math.atan2(-dx, -dz)
      cam.current.rotation.x = Math.atan2(dy, Math.hypot(dx, dz))
      return
    }

    // --- Movimiento de escritorio / táctil ---
    if (!inSession) {
      const k = keys.current
      const panelOpen = !!store.panel
      let f = 0
      let s = 0
      let turn = 0
      if (!panelOpen && store.phase === 'playing') {
        if (k.has('KeyW') || k.has('ArrowUp')) f += 1
        if (k.has('KeyS') || k.has('ArrowDown')) f -= 1
        if (k.has('KeyA')) s -= 1
        if (k.has('KeyD')) s += 1
        if (k.has('ArrowLeft') || k.has('KeyQ')) turn += 1
        if (k.has('ArrowRight') || k.has('KeyE')) turn -= 1
        f += -touchInput.y
        s += touchInput.x
      }
      look.current.yaw += turn * 1.6 * delta
      const speed = k.has('ShiftLeft') || k.has('ShiftRight') ? 7 : 4
      const len = Math.hypot(f, s)
      if (len > 0.01) {
        const nf = f / Math.max(1, len)
        const ns = s / Math.max(1, len)
        const yaw = look.current.yaw
        const fx = -Math.sin(yaw)
        const fz = -Math.cos(yaw)
        const rx = Math.cos(yaw)
        const rz = -Math.sin(yaw)
        prevPos.copy(rig.current.position)
        rig.current.position.x += (fx * nf + rx * ns) * speed * delta
        rig.current.position.z += (fz * nf + rz * ns) * speed * delta
        resolveCollisions(prevPos, rig.current.position)
      }
      rig.current.position.y = 0
      rig.current.rotation.y = look.current.yaw
      cam.current.rotation.x = look.current.pitch
    } else {
      // VR: la locomoción ya movió el rig; aplicar colisiones
      resolveCollisions(prevPos, rig.current.position)
      rig.current.position.y = 0
      prevPos.copy(rig.current.position)
    }

    // --- Posición de la cabeza ---
    const headCam = inSession ? state.gl.xr.getCamera() : state.camera
    headCam.getWorldPosition(tmpHead)
    headCam.getWorldDirection(tmpDir)

    // Minimapa (≈8 Hz)
    timers.current.minimap += delta
    if (timers.current.minimap > 0.12) {
      timers.current.minimap = 0
      const yaw = Math.atan2(-tmpDir.x, -tmpDir.z)
      store.setPlayerPos({ x: tmpHead.x, z: tmpHead.z, yaw })
    }

    // Checkpoints (≈5 Hz)
    timers.current.trigger += delta
    if (timers.current.trigger > 0.2) {
      timers.current.trigger = 0
      if (store.phase === 'playing' && store.mode === 'tour' && !store.panel) {
        const part = CELL_PARTS[store.currentIndex]
        if (part) {
          const dist = Math.hypot(tmpHead.x - part.checkpoint[0], tmpHead.z - part.checkpoint[2])
          if (dist < TRIGGER_DISTANCE) {
            store.openPanel(part.id, false, computePanelAnchor(state))
          }
        }
      }
    }
  })

  return (
    <group ref={rig} position={START_POSITION} rotation={[0, START_YAW, 0]}>
      <XROrigin />
      <PerspectiveCamera ref={cam} makeDefault position={[0, EYE_HEIGHT, 0]} fov={72} near={0.08} far={220} />
    </group>
  )
}
