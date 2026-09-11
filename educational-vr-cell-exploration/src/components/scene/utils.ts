import * as THREE from 'three'

/** Generador pseudoaleatorio determinista (mulberry32) */
export function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Banda curva y ondulada (cisterna del retículo) centrada en el origen */
export function makeWavyBand(
  R: number,
  amp: number,
  freq: number,
  a0: number,
  a1: number,
  y0: number,
  y1: number,
  segs = 72,
  rows = 4,
) {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const a = a0 + (a1 - a0) * t
    const taper = Math.sin(Math.PI * t) ** 0.35 // extremos más finos
    for (let j = 0; j <= rows; j++) {
      const v = j / rows
      const r = R + amp * Math.sin(a * freq + v * 1.5)
      const y = THREE.MathUtils.lerp(y0, y1, v) * (0.55 + 0.45 * taper) + 0.25 * Math.sin(a * freq * 0.7)
      positions.push(Math.cos(a) * r, y, Math.sin(a) * r)
      uvs.push(t, v)
    }
  }
  const stride = rows + 1
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < rows; j++) {
      const a = i * stride + j
      const b = a + 1
      const c = a + stride
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

const UP = new THREE.Vector3(0, 1, 0)

/** Cuaternión que orienta el eje Y local hacia `dir` */
export function quatFromUp(dir: THREE.Vector3) {
  return new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize())
}

/** Puntos aleatorios dentro de una esfera */
export function randomInSphere(rng: () => number, radius: number) {
  const u = rng()
  const v = rng()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  const r = radius * Math.cbrt(rng())
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

export function degToRad(d: number) {
  return (d * Math.PI) / 180
}
