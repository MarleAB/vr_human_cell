import { createXRStore } from '@react-three/xr'

export const xrStore = createXRStore({
  foveation: 0.6,
  frameRate: 'high',
})

export async function checkVRSupport(): Promise<boolean> {
  try {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr
    if (!xr) return false
    return await xr.isSessionSupported('immersive-vr')
  } catch {
    return false
  }
}
