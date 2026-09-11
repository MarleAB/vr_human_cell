import { useEffect, useRef, useState } from 'react'
import { touchInput } from '../../store/gameStore'

/** Joystick virtual para pantallas táctiles */
export function TouchControls() {
  const [isTouch, setIsTouch] = useState(false)
  const zone = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const pointerId = useRef<number | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    setIsTouch(mq.matches || 'ontouchstart' in window)
  }, [])

  useEffect(() => {
    return () => {
      touchInput.x = 0
      touchInput.y = 0
    }
  }, [])

  if (!isTouch) return null

  const RADIUS = 44

  const update = (clientX: number, clientY: number) => {
    const el = zone.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let dx = clientX - (rect.left + rect.width / 2)
    let dy = clientY - (rect.top + rect.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS
      dy = (dy / len) * RADIUS
    }
    setKnob({ x: dx, y: dy })
    touchInput.x = dx / RADIUS
    touchInput.y = dy / RADIUS
  }

  const release = () => {
    pointerId.current = null
    setKnob({ x: 0, y: 0 })
    touchInput.x = 0
    touchInput.y = 0
  }

  return (
    <div
      ref={zone}
      className="pointer-events-auto relative h-32 w-32 touch-none select-none rounded-full border-2 border-cyan-200/40 bg-cyan-400/10 backdrop-blur"
      onPointerDown={(e) => {
        e.stopPropagation()
        pointerId.current = e.pointerId
        ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
        update(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => {
        if (pointerId.current !== e.pointerId) return
        update(e.clientX, e.clientY)
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-cyan-200/80 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-white/60">
        {knob.x === 0 && knob.y === 0 ? 'Mover' : ''}
      </div>
    </div>
  )
}
