import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CENTROSOME_POS, WALK_RADIUS } from '../../../data/cellParts'
import { makeRng, quatFromUp, randomInSphere } from '../utils'

/* ---------------------------------- Mitocondria ---------------------------------- */
/** Cápsula roja translúcida con crestas azules en su interior */
export function Mitochondrion({
  position,
  rotationY = 0,
  scale = 1,
}: {
  position: [number, number, number]
  rotationY?: number
  scale?: number
}) {
  const cristae = useMemo(() => {
    const rng = makeRng(Math.round(position[0] * 13 + position[2] * 7))
    return Array.from({ length: 8 }, (_, i) => ({
      x: -1.75 + i * 0.5,
      y: (i % 2 === 0 ? 0.2 : -0.2) + (rng() - 0.5) * 0.1,
      rot: (rng() - 0.5) * 0.3,
      h: 1.1 + rng() * 0.3,
    }))
  }, [position])

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Crestas (membrana interna plegada) */}
      {cristae.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, 0]} rotation={[0, 0, c.rot]}>
          <boxGeometry args={[0.09, c.h, 1.25]} />
          <meshStandardMaterial color="#2f63c9" emissive="#2f63c9" emissiveIntensity={0.55} roughness={0.4} />
        </mesh>
      ))}
      {/* Membrana interna */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.92, 3.1, 8, 24]} />
        <meshStandardMaterial color="#5a8ae6" transparent opacity={0.28} roughness={0.3} depthWrite={false} />
      </mesh>
      {/* Membrana externa */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[1.15, 3.2, 8, 32]} />
        <meshPhysicalMaterial
          color="#d9484e"
          transparent
          opacity={0.5}
          roughness={0.35}
          clearcoat={0.6}
          depthWrite={false}
          emissive="#5a1015"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

/* ---------------------------------- Lisosoma ---------------------------------- */
export function Lysosome({ position, radius = 0.8 }: { position: [number, number, number]; radius?: number }) {
  const enzymes = useMemo(() => {
    const rng = makeRng(Math.round(position[0] * 31 + position[2] * 17))
    return Array.from({ length: 10 }, () => randomInSphere(rng, radius * 0.7))
  }, [position, radius])
  const ref = useRef<THREE.Group>(null!)
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.3
  })
  return (
    <group position={position}>
      <group ref={ref}>
        {enzymes.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color="#5e1a80" emissive="#8a2ab8" emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>
      <mesh>
        <sphereGeometry args={[radius, 32, 24]} />
        <meshPhysicalMaterial
          color="#b95fd4"
          transparent
          opacity={0.55}
          roughness={0.25}
          clearcoat={0.8}
          depthWrite={false}
          emissive="#4a1a5e"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

/* ---------------------------------- Peroxisoma ---------------------------------- */
export function Peroxisome({ position, radius = 0.9 }: { position: [number, number, number]; radius?: number }) {
  const core = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    core.current.rotation.y = state.clock.elapsedTime * 0.5
    core.current.rotation.x = state.clock.elapsedTime * 0.2
  })
  return (
    <group position={position}>
      <mesh ref={core}>
        <octahedronGeometry args={[radius * 0.5, 0]} />
        <meshStandardMaterial color="#1f7a63" emissive="#2fd1a3" emissiveIntensity={0.5} flatShading />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius, 32, 24]} />
        <meshPhysicalMaterial
          color="#62cdb0"
          transparent
          opacity={0.5}
          roughness={0.2}
          clearcoat={0.8}
          depthWrite={false}
          emissive="#1a5a4a"
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  )
}

/* ------------------------------ Centriolos y microtúbulos ------------------------------ */
function Centriole({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.34, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 1.3, 8]} />
              <meshStandardMaterial color="#f0c04a" emissive="#f0c04a" emissiveIntensity={0.35} roughness={0.4} />
            </mesh>
            <mesh position={[0.44, 0, 0.1]}>
              <cylinderGeometry args={[0.05, 0.05, 1.3, 6]} />
              <meshStandardMaterial color="#e0a83a" emissive="#e0a83a" emissiveIntensity={0.3} roughness={0.4} />
            </mesh>
          </group>
        )
      })}
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 1.25, 12]} />
        <meshStandardMaterial color="#ffe08a" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function Centrosome() {
  const microtubules = useMemo(() => {
    const rng = makeRng(555)
    const origin = new THREE.Vector3(...CENTROSOME_POS)
    const list: { pos: THREE.Vector3; quat: THREE.Quaternion; len: number }[] = []
    const defs: { yaw: number; tilt: number }[] = []
    // microtúbulo de referencia (objetivo de la etiqueta)
    defs.push({ yaw: -31, tilt: 8 })
    for (let i = 0; i < 15; i++) {
      defs.push({ yaw: i * 24 + (rng() - 0.5) * 14, tilt: 2 + rng() * 22 })
    }
    for (const d of defs) {
      const yaw = (d.yaw * Math.PI) / 180
      const tilt = (d.tilt * Math.PI) / 180
      const dir = new THREE.Vector3(Math.cos(yaw) * Math.cos(tilt), Math.sin(tilt), Math.sin(yaw) * Math.cos(tilt))
      // longitud máxima para quedar dentro de la célula
      const ox = origin.x
      const oz = origin.z
      const b = 2 * (ox * dir.x + oz * dir.z)
      const c = ox * ox + oz * oz - (WALK_RADIUS - 1.5) ** 2
      const a = dir.x * dir.x + dir.z * dir.z
      const disc = Math.max(0, b * b - 4 * a * c)
      let maxLen = (-b + Math.sqrt(disc)) / (2 * a)
      // no atravesar el núcleo
      const towardNucleus = Math.abs(THREE.MathUtils.euclideanModulo(d.yaw - 227 + 180, 360) - 180) < 45
      if (towardNucleus) maxLen = Math.min(maxLen, 10)
      const len = Math.min(maxLen, 9 + rng() * 6)
      const pos = origin.clone().add(dir.clone().multiplyScalar(len / 2))
      list.push({ pos, quat: quatFromUp(dir), len })
    }
    return list
  }, [])

  return (
    <group>
      <group position={CENTROSOME_POS}>
        <Centriole position={[0, 0, 0]} rotation={[0, 0, 0]} />
        <Centriole position={[0.85, -0.62, 0]} rotation={[0, 0, Math.PI / 2]} />
        <mesh>
          <sphereGeometry args={[1.15, 24, 16]} />
          <meshStandardMaterial color="#ffe9a8" transparent opacity={0.14} depthWrite={false} />
        </mesh>
      </group>
      {microtubules.map((m, i) => (
        <mesh key={i} position={m.pos} quaternion={m.quat}>
          <cylinderGeometry args={[0.06, 0.06, m.len, 6, 1, true]} />
          <meshStandardMaterial
            color="#a8ded2"
            emissive="#4fb8a0"
            emissiveIntensity={0.35}
            side={THREE.DoubleSide}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}
