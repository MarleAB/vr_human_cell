import { CELL_PARTS, CELL_RADIUS, NUCLEUS } from '../../data/cellParts'
import { useGameStore } from '../../store/gameStore'

const SIZE = 168
const SCALE = (SIZE / 2 - 8) / CELL_RADIUS

function toMap(x: number, z: number) {
  return { cx: SIZE / 2 + x * SCALE, cy: SIZE / 2 + z * SCALE }
}

export function Minimap() {
  const playerPos = useGameStore((s) => s.playerPos)
  const completed = useGameStore((s) => s.completed)
  const currentIndex = useGameStore((s) => s.currentIndex)
  const mode = useGameStore((s) => s.mode)
  const p = toMap(playerPos.x, playerPos.z)
  const nucleus = toMap(NUCLEUS.center[0], NUCLEUS.center[2])

  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-[#07203a]/80 p-2 shadow-xl backdrop-blur">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block">
        <defs>
          <radialGradient id="cellgrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7cc6ea" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#1d6fa5" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={CELL_RADIUS * SCALE} fill="url(#cellgrad)" stroke="#9fdcff" strokeWidth="2" />
        <circle cx={nucleus.cx} cy={nucleus.cy} r={NUCLEUS.radius * SCALE} fill="#8b2b5f" opacity="0.7" />
        {CELL_PARTS.map((part, i) => {
          const m = toMap(part.checkpoint[0], part.checkpoint[2])
          const done = completed.includes(part.id)
          const active = mode === 'tour' && i === currentIndex
          const locked = mode === 'tour' && !done && !active
          return (
            <g key={part.id}>
              {active && (
                <circle cx={m.cx} cy={m.cy} r="8" fill="none" stroke="#ffd54a" strokeWidth="2">
                  <animate attributeName="r" values="5;10;5" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={m.cx}
                cy={m.cy}
                r={active ? 4.5 : 3}
                fill={done ? '#4ade80' : active ? '#ffd54a' : locked ? '#94a3b8' : part.color}
                opacity={locked ? 0.45 : 1}
                stroke="#062033"
                strokeWidth="1"
              />
            </g>
          )
        })}
        <g transform={`translate(${p.cx} ${p.cy}) rotate(${(-playerPos.yaw * 180) / Math.PI})`}>
          <polygon points="0,-8 6,6 0,3 -6,6" fill="#ffffff" stroke="#0b2540" strokeWidth="1.2" />
        </g>
      </svg>
      <div className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wider text-cyan-200/70">Mapa de la célula</div>
    </div>
  )
}
