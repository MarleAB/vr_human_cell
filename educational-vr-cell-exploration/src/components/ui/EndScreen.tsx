import { CELL_PARTS, MAX_SCORE, TOTAL_PARTS } from '../../data/cellParts'
import { useGameStore } from '../../store/gameStore'

export function EndScreen() {
  const score = useGameStore((s) => s.score)
  const attempts = useGameStore((s) => s.attempts)
  const completed = useGameStore((s) => s.completed)
  const continueFree = useGameStore((s) => s.continueFree)
  const reset = useGameStore((s) => s.reset)

  const ratio = score / MAX_SCORE
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.65 ? 2 : 1
  const message =
    stars === 3
      ? '¡Excelente! Dominas las partes de la célula como un verdadero biólogo.'
      : stars === 2
        ? '¡Muy bien! Conoces la mayoría de los orgánulos. Repasa los que fallaste.'
        : 'Has completado el recorrido. Vuelve a explorar para reforzar lo aprendido.'

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#041424]/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-emerald-300/30 bg-[#07203a]/90 p-6 text-cyan-50 shadow-2xl sm:p-10">
        <div className="text-center">
          <div className="text-5xl">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">¡Recorrido completado!</h2>
          <p className="mt-2 text-cyan-100/85">{message}</p>
          <div className="mt-4 inline-flex items-baseline gap-2 rounded-2xl bg-amber-400/15 px-6 py-3">
            <span className="text-4xl font-black text-amber-300">{score}</span>
            <span className="text-sm text-amber-100/80">/ {MAX_SCORE} puntos</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {CELL_PARTS.map((p, i) => {
            const t = attempts[p.id] ?? 0
            const done = completed.includes(p.id)
            return (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-1.5 text-xs">
                <span className="font-semibold">
                  {p.emoji} {i + 1}. {p.name}
                </span>
                <span className={t === 1 ? 'text-emerald-300' : t === 2 ? 'text-amber-300' : 'text-rose-300'}>
                  {done ? (t === 1 ? '1.er intento' : `${t} intentos`) : '—'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={continueFree}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-2.5 font-bold text-slate-900 shadow-lg hover:brightness-110"
          >
            🧭 Seguir explorando libremente
          </button>
          <button onClick={reset} className="rounded-xl bg-white/10 px-5 py-2.5 font-bold hover:bg-white/20">
            🔄 Jugar de nuevo
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-cyan-100/60">
          Has visitado las {TOTAL_PARTS} partes de la célula humana: ahora todas las etiquetas están visibles en el mundo 3D.
        </p>
      </div>
    </div>
  )
}
