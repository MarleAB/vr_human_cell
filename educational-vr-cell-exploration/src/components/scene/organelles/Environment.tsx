import { useMemo } from 'react'
import { Billboard, Instance, Instances, Sparkles, Text } from '@react-three/drei'
import * as THREE from 'three'
import { CELL_RADIUS, NUCLEUS } from '../../../data/cellParts'
import { degToRad, makeRng, quatFromUp } from '../utils'

/* ---------------------------------- Membrana ---------------------------------- */
/** Esfera translúcida + modelo ampliado de la bicapa lipídica con proteínas de membrana */
export function Membrane() {
  const bilayer = useMemo(() => {
    const heads: { p: THREE.Vector3; q: THREE.Quaternion }[] = []
    const tails: { p: THREE.Vector3; q: THREE.Quaternion }[] = []
    const proteins: { p: THREE.Vector3; q: THREE.Quaternion }[] = []
    const rOuter = CELL_RADIUS - 0.35
    const rInner = CELL_RADIUS - 1.15
    const cols = 15
    const rows = 7
    for (let i = 0; i < cols; i++) {
      const yaw = degToRad(-7.5 + (15 * i) / (cols - 1))
      for (let j = 0; j < rows; j++) {
        const y = 0.45 + j * 0.42
        const skipProtein = (i === 4 || i === 10) && j >= 2 && j <= 4
        if (skipProtein) continue
        const dirFlat = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))
        // punto en la esfera a altura y
        const outer = dirFlat.clone().multiplyScalar(Math.sqrt(rOuter * rOuter - y * y))
        outer.y = y
        const inner = dirFlat.clone().multiplyScalar(Math.sqrt(rInner * rInner - y * y))
        inner.y = y
        const normal = outer.clone().normalize() // hacia afuera
        heads.push({ p: outer, q: quatFromUp(normal) })
        heads.push({ p: inner, q: quatFromUp(normal) })
        // colas: desde cada cabeza hacia el centro de la bicapa
        const mid = outer.clone().add(inner).multiplyScalar(0.5)
        const tOuter = outer.clone().lerp(mid, 0.5)
        const tInner = inner.clone().lerp(mid, 0.5)
        const side = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize()
        for (const s of [-0.07, 0.07]) {
          tails.push({ p: tOuter.clone().addScaledVector(side, s), q: quatFromUp(normal) })
          tails.push({ p: tInner.clone().addScaledVector(side, s), q: quatFromUp(normal) })
        }
      }
    }
    for (const i of [4, 10]) {
      const yaw = degToRad(-7.5 + (15 * i) / (cols - 1))
      const y = 0.45 + 3 * 0.42
      const dirFlat = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))
      const p = dirFlat.clone().multiplyScalar((rOuter + rInner) / 2)
      p.y = y
      proteins.push({ p, q: quatFromUp(p.clone().normalize()) })
    }
    return { heads, tails, proteins }
  }, [])

  return (
    <group>
      {/* Bicapa: esfera exterior e interior */}
      <mesh>
        <sphereGeometry args={[CELL_RADIUS, 72, 48]} />
        <meshPhysicalMaterial
          color="#4fb3e8"
          transparent
          opacity={0.2}
          roughness={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          clearcoat={0.5}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[CELL_RADIUS - 0.7, 64, 40]} />
        <meshStandardMaterial
          color="#8fd3f5"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Modelo ampliado de la bicapa lipídica junto al checkpoint */}
      <Instances limit={260} range={bilayer.heads.length}>
        <sphereGeometry args={[0.17, 12, 10]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb347" emissiveIntensity={0.35} roughness={0.4} />
        {bilayer.heads.map((h, i) => (
          <Instance key={i} position={h.p} quaternion={h.q} />
        ))}
      </Instances>
      <Instances limit={520} range={bilayer.tails.length}>
        <cylinderGeometry args={[0.035, 0.035, 0.36, 6]} />
        <meshStandardMaterial color="#fff6d6" roughness={0.6} />
        {bilayer.tails.map((t, i) => (
          <Instance key={i} position={t.p} quaternion={t.q} />
        ))}
      </Instances>
      {bilayer.proteins.map((pr, i) => (
        <mesh key={i} position={pr.p} quaternion={pr.q} scale={[0.55, 1.15, 0.55]}>
          <capsuleGeometry args={[0.5, 0.6, 6, 16]} />
          <meshStandardMaterial color="#7b6cf6" emissive="#4a3ad6" emissiveIntensity={0.4} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------------------------- Citoplasma ---------------------------------- */
export function Cytoplasm() {
  const freeRibosomes = useMemo(() => {
    const rng = makeRng(1234)
    const list: THREE.Vector3[] = []
    let guard = 0
    while (list.length < 140 && guard++ < 2000) {
      const a = rng() * Math.PI * 2
      const r = Math.sqrt(rng()) * 22
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      if (Math.hypot(x - NUCLEUS.center[0], z - NUCLEUS.center[2]) < 9.5) continue
      list.push(new THREE.Vector3(x, 0.2 + rng() * 3.4, z))
    }
    return list
  }, [])

  return (
    <group>
      {/* Suelo: superficie de corte del citoplasma */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <circleGeometry args={[CELL_RADIUS, 96]} />
        <meshStandardMaterial
          color="#6fbfe9"
          transparent
          opacity={0.55}
          roughness={0.2}
          metalness={0.1}
          depthWrite={false}
          emissive="#0d4a75"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Anillos de referencia */}
      {[8, 16, 24].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[r - 0.04, r + 0.04, 96]} />
          <meshBasicMaterial color="#d8f3ff" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      {/* Ribosomas libres */}
      <Instances limit={160} range={freeRibosomes.length}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#7a1f3d" roughness={0.6} emissive="#3a0a1c" emissiveIntensity={0.4} />
        {freeRibosomes.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>
      {/* Partículas del citosol */}
      <Sparkles
        count={500}
        scale={[44, 14, 44]}
        position={[0, 7, 0]}
        size={2.5}
        speed={0.25}
        opacity={0.55}
        color="#e6f8ff"
        raycast={() => null}
      />
      {/* Líquido extracelular */}
      <Sparkles
        count={300}
        scale={[110, 60, 110]}
        position={[0, 10, 0]}
        size={4}
        speed={0.1}
        opacity={0.3}
        color="#9ad8ff"
        raycast={() => null}
      />
      {/* Título flotante */}
      <Billboard position={[0, 15, -3]}>
        <Text
          raycast={() => null}
          fontSize={2.4}
          color="#eaf7ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.08}
          outlineColor="#0a2a45"
          fillOpacity={0.9}
        >
          CÉLULA HUMANA
        </Text>
      </Billboard>
    </group>
  )
}
