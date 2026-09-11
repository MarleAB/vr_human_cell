import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { NUCLEUS } from '../../../data/cellParts'
import { degToRad, makeRng, randomInSphere } from '../utils'

// La apertura del núcleo (ángulos atan2(z,x) 85°..185°) equivale en SphereGeometry a phi -5°..95°
const PHI_START = degToRad(95)
const PHI_LENGTH = degToRad(260)

/** Núcleo con envoltura recortada (se puede entrar), poros, cromatina y nucleolo */
export function Nucleus() {
  const R = NUCLEUS.radius
  const chromatinRef = useRef<THREE.Group>(null!)
  const nucleolusRef = useRef<THREE.Mesh>(null!)

  const chromatin = useMemo(() => {
    const rng = makeRng(42)
    const tubes: THREE.TubeGeometry[] = []
    for (let t = 0; t < 4; t++) {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i < 12; i++) {
        const p = randomInSphere(rng, R - 1.4)
        p.y = THREE.MathUtils.clamp(p.y, -0.6, 3.1)
        // evitar el nucleolo
        if (p.distanceTo(new THREE.Vector3(1.2, 0.6, -0.8)) < 1.8) p.multiplyScalar(0.5).add(new THREE.Vector3(-1, 1, 1))
        pts.push(p)
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.6)
      tubes.push(new THREE.TubeGeometry(curve, 140, 0.13, 6, false))
    }
    return tubes
  }, [R])

  const pores = useMemo(() => {
    const rng = makeRng(7)
    const list: { position: THREE.Vector3; quaternion: THREE.Quaternion }[] = []
    const z = new THREE.Vector3(0, 0, 1)
    let guard = 0
    while (list.length < 44 && guard++ < 500) {
      const alpha = rng() * 360
      if (alpha > NUCLEUS.openingStart - 6 && alpha < NUCLEUS.openingEnd + 6) continue
      const theta = degToRad(20 + rng() * 125)
      const a = degToRad(alpha)
      const dir = new THREE.Vector3(Math.sin(theta) * Math.cos(a), Math.cos(theta), Math.sin(theta) * Math.sin(a))
      list.push({
        position: dir.clone().multiplyScalar(R),
        quaternion: new THREE.Quaternion().setFromUnitVectors(z, dir),
      })
    }
    // poro destacado (objetivo de la etiqueta "Poro nuclear")
    const a = degToRad(195)
    const theta = degToRad(80)
    const dir = new THREE.Vector3(Math.sin(theta) * Math.cos(a), Math.cos(theta), Math.sin(theta) * Math.sin(a))
    list.push({ position: dir.clone().multiplyScalar(R), quaternion: new THREE.Quaternion().setFromUnitVectors(z, dir) })
    return list
  }, [R])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (chromatinRef.current) chromatinRef.current.rotation.y = Math.sin(t * 0.15) * 0.08
    if (nucleolusRef.current) nucleolusRef.current.rotation.y = t * 0.1
  })

  return (
    <group position={NUCLEUS.center}>
      {/* Envoltura nuclear externa */}
      <mesh>
        <sphereGeometry args={[R, 72, 48, PHI_START, PHI_LENGTH]} />
        <meshStandardMaterial
          color="#8b2b5f"
          roughness={0.45}
          metalness={0.05}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
          emissive="#3a0a25"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Envoltura nuclear interna */}
      <mesh>
        <sphereGeometry args={[R - 0.25, 64, 40, PHI_START, PHI_LENGTH]} />
        <meshStandardMaterial
          color="#c8558f"
          roughness={0.6}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Bordes del corte */}
      {[degToRad(95), degToRad(355)].map((phi, i) => (
        <mesh key={i} rotation={[0, Math.PI + phi, -Math.PI / 2]}>
          <torusGeometry args={[R - 0.125, 0.14, 8, 64, Math.PI]} />
          <meshStandardMaterial color="#f2a7cf" emissive="#f2a7cf" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Poros nucleares */}
      <Instances limit={60} range={pores.length}>
        <torusGeometry args={[0.3, 0.1, 8, 20]} />
        <meshStandardMaterial color="#f5c6e0" emissive="#f5c6e0" emissiveIntensity={0.35} roughness={0.4} />
        {pores.map((p, i) => (
          <Instance key={i} position={p.position} quaternion={p.quaternion} />
        ))}
      </Instances>
      {/* Cromatina */}
      <group ref={chromatinRef}>
        {chromatin.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial color="#5a1238" emissive="#8a1e5a" emissiveIntensity={0.35} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* Nucleolo */}
      <mesh ref={nucleolusRef} position={[1.2, 0.6, -0.8]}>
        <icosahedronGeometry args={[1.3, 2]} />
        <meshStandardMaterial color="#3a0b2a" emissive="#6a1248" emissiveIntensity={0.45} roughness={0.75} flatShading />
      </mesh>
      {/* Luz interior */}
      <pointLight position={[0, 1.5, 0]} intensity={25} color="#ff9ad6" distance={14} decay={2} />
    </group>
  )
}
