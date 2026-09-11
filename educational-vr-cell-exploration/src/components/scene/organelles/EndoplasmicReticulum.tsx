import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { NUCLEUS } from '../../../data/cellParts'
import { degToRad, makeRng, makeWavyBand } from '../utils'

const RER_A0 = degToRad(190)
const RER_A1 = degToRad(330)

const BANDS = [
  { R: 6.3, amp: 0.22, freq: 9, y0: 0.05, y1: 2.6 },
  { R: 6.95, amp: 0.26, freq: 8, y0: 0.05, y1: 3.0 },
  { R: 7.6, amp: 0.24, freq: 10, y0: 0.05, y1: 2.8 },
  { R: 8.25, amp: 0.2, freq: 7, y0: 0.05, y1: 2.4 },
]

/** Retículo rugoso: bandas onduladas concéntricas al núcleo cubiertas de ribosomas */
export function RoughER() {
  const geometries = useMemo(
    () => BANDS.map((b, i) => makeWavyBand(b.R, b.amp, b.freq, RER_A0 + i * 0.03, RER_A1 - i * 0.03, b.y0, b.y1)),
    [],
  )

  const ribosomes = useMemo(() => {
    const rng = makeRng(99)
    const list: THREE.Vector3[] = []
    for (let bi = 0; bi < BANDS.length; bi++) {
      const b = BANDS[bi]
      for (let i = 0; i < 90; i++) {
        const t = rng()
        const a = RER_A0 + (RER_A1 - RER_A0) * t
        const v = rng()
        const r = b.R + b.amp * Math.sin(a * b.freq + v * 1.5) + (rng() > 0.5 ? 0.13 : -0.13)
        const taper = Math.sin(Math.PI * t) ** 0.35
        const y = THREE.MathUtils.lerp(b.y0, b.y1, v) * (0.55 + 0.45 * taper) + 0.25 * Math.sin(a * b.freq * 0.7)
        list.push(new THREE.Vector3(Math.cos(a) * r, y + 0.1, Math.sin(a) * r))
      }
    }
    return list
  }, [])

  return (
    <group position={[NUCLEUS.center[0], 0, NUCLEUS.center[2]]}>
      {geometries.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial
            color={i % 2 === 0 ? '#e59a3c' : '#f0ad4e'}
            roughness={0.55}
            side={THREE.DoubleSide}
            emissive="#7a4a10"
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
      {/* Ribosomas adheridos */}
      <Instances limit={400} range={ribosomes.length}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial color="#6b1d3a" roughness={0.6} emissive="#3a0a1c" emissiveIntensity={0.4} />
        {ribosomes.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>
    </group>
  )
}

export function SmoothER() {
  const tubes = useMemo(() => {
    const rng = makeRng(2024)
    const geos: THREE.TubeGeometry[] = []
    for (let t = 0; t < 7; t++) {
      const pts: THREE.Vector3[] = []
      let x = 6.4 + rng() * 0.8
      let y = 0.8 + rng() * 1.6
      let z = -7.2 + (rng() - 0.5) * 2.2
      for (let i = 0; i < 7; i++) {
        pts.push(new THREE.Vector3(x, y, z))
        x += 0.9 + rng() * 0.6
        y = THREE.MathUtils.clamp(y + (rng() - 0.5) * 1.4, 0.5, 3.2)
        z += (rng() - 0.5) * 2.4 - 0.15
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5)
      geos.push(new THREE.TubeGeometry(curve, 60, 0.3, 8, false))
    }
    // conexiones transversales
    for (let t = 0; t < 4; t++) {
      const pts: THREE.Vector3[] = []
      const x0 = 8 + rng() * 4
      for (let i = 0; i < 4; i++) {
        pts.push(new THREE.Vector3(x0 + (rng() - 0.5) * 1.2, 0.8 + rng() * 2.2, -10.5 + i * 1.6))
      }
      geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.26, 8, false))
    }
    return geos
  }, [])

  return (
    <group>
      {tubes.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial color="#f1b545" roughness={0.5} emissive="#8a5a10" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  )
}
