import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EXOCYTOSIS_POINT, GOLGI_POS, GOLGI_YAW, VESICLE_START } from '../../../data/cellParts'
import { makeRng } from '../utils'

const CISTERNAE = [
  { x: -1.0, r: 1.45, color: '#d95a72' },
  { x: -0.6, r: 1.75, color: '#dc6a7e' },
  { x: -0.2, r: 1.95, color: '#e07a8a' },
  { x: 0.2, r: 1.95, color: '#e48a94' },
  { x: 0.6, r: 1.75, color: '#e89a9c' },
  { x: 1.0, r: 1.45, color: '#eca8a6' },
]

/** Aparato de Golgi: pila de cisternas con vesículas brotando */
export function Golgi() {
  const buds = useMemo(() => {
    const rng = makeRng(31)
    const list: { p: [number, number, number]; r: number }[] = []
    for (let i = 0; i < 9; i++) {
      list.push({
        p: [-1.6 - rng() * 0.9, (rng() - 0.5) * 3.0, (rng() - 0.5) * 2.6],
        r: 0.2 + rng() * 0.14,
      })
    }
    for (let i = 0; i < 5; i++) {
      list.push({
        p: [1.5 + rng() * 0.8, (rng() - 0.5) * 2.4, (rng() - 0.5) * 2.0],
        r: 0.16 + rng() * 0.1,
      })
    }
    return list
  }, [])

  return (
    <group position={GOLGI_POS} rotation={[0, GOLGI_YAW, 0]}>
      {CISTERNAE.map((c, i) => (
        <mesh key={i} position={[c.x, 0, 0]} scale={[0.14, c.r, c.r]} rotation={[0, 0, (i - 2.5) * 0.05]}>
          <sphereGeometry args={[1, 28, 18]} />
          <meshStandardMaterial color={c.color} roughness={0.5} emissive="#5a1a28" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {buds.map((b, i) => (
        <mesh key={i} position={b.p}>
          <sphereGeometry args={[b.r, 12, 10]} />
          <meshStandardMaterial color="#f2a5b0" roughness={0.4} emissive="#7a2a3a" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

/* ----------------------- Vesículas secretoras + exocitosis ----------------------- */
const start = new THREE.Vector3(...VESICLE_START)
const end = new THREE.Vector3(...EXOCYTOSIS_POINT)
const outward = new THREE.Vector3(end.x, 0, end.z).normalize()

const N_VESICLES = 5
const N_PARTICLES = 14
const SPEED = 0.05 // fracción del trayecto por segundo

export function SecretoryVesicles() {
  const vesicleRefs = useRef<THREE.Group[]>([])
  const particleRefs = useRef<THREE.Mesh[]>([])
  const burst = useRef({ time: -10 })
  const lastT = useRef<number[]>(Array.from({ length: N_VESICLES }, (_, i) => i / N_VESICLES))

  const particleDirs = useMemo(() => {
    const rng = makeRng(77)
    return Array.from({ length: N_PARTICLES }, () => {
      const d = outward
        .clone()
        .add(new THREE.Vector3((rng() - 0.5) * 1.2, (rng() - 0.3) * 1.0, (rng() - 0.5) * 1.2))
        .normalize()
      return { d, s: 1.2 + rng() * 1.6 }
    })
  }, [])

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime
    for (let i = 0; i < N_VESICLES; i++) {
      const g = vesicleRefs.current[i]
      if (!g) continue
      let t = lastT.current[i] + dt * SPEED
      if (t >= 1) {
        t -= 1
        burst.current.time = now
      }
      lastT.current[i] = t
      g.position.lerpVectors(start, end, t)
      g.position.y += Math.sin(now * 1.5 + i) * 0.15
      // fusión con la membrana: se aplana y desaparece
      const fuse = t > 0.93 ? 1 - (t - 0.93) / 0.07 : 1
      g.scale.setScalar(Math.max(0.01, fuse))
      if (t > 0.9 && t < 0.93) burst.current.time = now
    }
    // partículas liberadas al exterior
    const age = now - burst.current.time
    for (let i = 0; i < N_PARTICLES; i++) {
      const m = particleRefs.current[i]
      if (!m) continue
      const { d, s } = particleDirs[i]
      const visible = age >= 0 && age < 2.2
      m.visible = visible
      if (visible) {
        m.position.copy(end).add(d.clone().multiplyScalar(age * s))
        const k = Math.max(0, 1 - age / 2.2)
        m.scale.setScalar(0.12 * k + 0.02)
      }
    }
  })

  return (
    <group>
      {Array.from({ length: N_VESICLES }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) vesicleRefs.current[i] = el
          }}
        >
          <mesh>
            <sphereGeometry args={[0.42, 24, 18]} />
            <meshPhysicalMaterial
              color="#f4a6b4"
              transparent
              opacity={0.6}
              roughness={0.25}
              clearcoat={0.7}
              depthWrite={false}
              emissive="#7a2a3a"
              emissiveIntensity={0.25}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.24, 16, 12]} />
            <meshStandardMaterial color="#d9748a" emissive="#d9748a" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
      {/* Zona de fusión en la membrana */}
      <mesh position={EXOCYTOSIS_POINT} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward)}>
        <torusGeometry args={[0.6, 0.08, 8, 32]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.8} />
      </mesh>
      {Array.from({ length: N_PARTICLES }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) particleRefs.current[i] = el
          }}
          visible={false}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#ffe08a" emissive="#ffd166" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  )
}
