import { useEffect, useState } from 'react'
import { CELL_PARTS, MAX_SCORE, TOTAL_PARTS } from '../../data/cellParts'
import { useGameStore } from '../../store/gameStore'
import { checkVRSupport, xrStore } from '../../xrStore'
import { Minimap } from './Minimap'
import { TouchControls } from './TouchControls'

/** Interfaz de escritorio/móvil: progreso, objetivo, ayuda, minimapa y joystick táctil */
export function HUD() {
  const mode = useGameStore((s) => s.mode)
  const currentIndex = useGameStore((s) => s.currentIndex)
  const completed = useGameStore((s) => s.completed)
  const score = useGameStore((s) => s.score)
  const playerPos = useGameStore((s) => s.playerPos)
  const showParts = useGameStore((s) => s.showParts)
  const toggleParts = useGameStore((s) => s.toggleParts)
  const toast = useGameStore((s) => s.toast)
  const reset = useGameStore((s) => s.reset)
  const [showHelp, setShowHelp] = useState(true)
  const [vrOk, setVrOk] = useState(false)

  useEffect(() => {
    checkVRSupport().then(setVrOk)
    const t = setTimeout(() => setShowHelp(false), 14000)
    return () => clearTimeout(t)
  }, [])

  const part = mode === 'tour' ? CELL_PARTS[currentIndex] : undefined
  let distance = 0
  let arrowDeg = 0
  if (part) {
    const dx = part.checkpoint[0] - playerPos.x
    const dz = part.checkpoint[2] - playerPos.z
    distance = Math.hypot(dx, dz)
    const yaw = playerPos.yaw
    const fx = -Math.sin(yaw)
    const fz = -Math.cos(yaw)
    const rx = Math.cos(yaw)
    const rz = -Math.sin(yaw)
    const lx = dx * rx + dz * rz
    const lz = dx * fx + dz * fz
    arrowDeg = (Math.atan2(lx, lz) * 180) / Math.PI
  }

  const progress = completed.length / TOTAL_PARTS

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none text-cyan-50">
      {/* Arriba izquierda: progreso */}
      <div className="absolute left-3 top-3 w-64 rounded-2xl border border-cyan-300/20 bg-[#07203a]/80 p-3 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-200/80">Explorador Celular</div>
          <div className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-200">⭐ {score}</div>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-cyan-100/70">
          <span>
            {completed.length}/{TOTAL_PARTS} partes aprendidas
          </span>
          <span>máx. {MAX_SCORE} pts</span>
        </div>
        <div className="pointer-events-auto mt-2 flex gap-1.5">
          <button
            onClick={toggleParts}
            className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/20"
          >
            📋 Partes
          </button>
          <button
            onClick={() => setShowHelp((v) => !v)}
            className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/20"
          >
            ❔ Ayuda
          </button>
          <button onClick={reset} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-rose-500/40">
            ⏏
          </button>
        </div>
      </div>

      {/* Arriba centro: objetivo */}
      <div className="absolute left-1/2 top-3 -translate-x-1/2">
        {part ? (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-[#07203a]/85 px-4 py-2 shadow-xl backdrop-blur">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/20 text-xl text-amber-300 transition-transform duration-200"
              style={{ transform: `rotate(${arrowDeg}deg)` }}
            >
              ➤
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-200/80">
                Checkpoint {currentIndex + 1} de {TOTAL_PARTS}
              </div>
              <div className="text-sm font-extrabold text-white sm:text-base">
                {part.emoji} {part.name}
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-cyan-100">
                  {distance.toFixed(0)} m
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-cyan-300/30 bg-[#07203a]/85 px-4 py-2 text-sm font-semibold shadow-xl backdrop-blur">
            🧭 Exploración libre · haz clic en cualquier parte de la célula
          </div>
        )}
      </div>

      {/* Arriba derecha: RV */}
      <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2">
        <button
          onClick={() => xrStore.enterVR().catch(console.error)}
          disabled={!vrOk}
          title={vrOk ? 'Entrar en realidad virtual' : 'WebXR no disponible en este dispositivo'}
          className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-40"
        >
          🥽 Entrar en RV
        </button>
      </div>

      {/* Lista de partes */}
      {showParts && (
        <div className="pointer-events-auto absolute right-3 top-16 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-cyan-300/20 bg-[#07203a]/90 p-3 shadow-xl backdrop-blur">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-200/80">Partes de la célula</div>
          <ul className="space-y-1">
            {CELL_PARTS.map((p, i) => {
              const done = completed.includes(p.id)
              const active = mode === 'tour' && i === currentIndex
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                    active ? 'bg-amber-400/20 text-amber-100' : done ? 'text-emerald-200' : 'text-cyan-100/60'
                  }`}
                >
                  <span className="w-4 text-center">{done ? '✅' : active ? '👉' : '🔒'}</span>
                  <span className="font-semibold">
                    {i + 1}. {p.name}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Ayuda */}
      {showHelp && (
        <div className="absolute bottom-3 left-3 max-w-xs rounded-2xl border border-cyan-300/20 bg-[#07203a]/80 p-3 text-xs shadow-xl backdrop-blur">
          <div className="mb-1 font-bold text-white">Cómo jugar</div>
          <ul className="space-y-0.5 text-cyan-100/80">
            <li>
              🚶 <b>W A S D</b> / flechas: caminar · <b>Shift</b>: correr
            </li>
            <li>
              👀 Arrastra con el ratón (o <b>Q/E</b>) para mirar alrededor
            </li>
            <li>💡 Ve hacia el haz de luz dorado: es tu siguiente checkpoint</li>
            <li>🖱️ Haz clic en una parte ya aprendida para repasarla</li>
          </ul>
        </div>
      )}

      {/* Joystick táctil */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <TouchControls />
      </div>

      {/* Minimapa */}
      <div className="absolute bottom-3 right-3 hidden sm:block">
        <Minimap />
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-xl border border-amber-300/40 bg-[#07203a]/90 px-4 py-2 text-sm font-semibold text-amber-100 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
