import { CELL_PARTS, TOTAL_PARTS, getPart } from '../../data/cellParts'
import { useGameStore } from '../../store/gameStore'

const LETTERS = ['A', 'B', 'C', 'D']

export function InfoQuizModal() {
  const panel = useGameStore((s) => s.panel)
  const attempts = useGameStore((s) => s.attempts)
  const toQuestion = useGameStore((s) => s.toQuestion)
  const answer = useGameStore((s) => s.answer)
  const retry = useGameStore((s) => s.retry)
  const closePanel = useGameStore((s) => s.closePanel)
  const mode = useGameStore((s) => s.mode)

  if (!panel) return null
  const part = getPart(panel.partId)
  const index = CELL_PARTS.findIndex((p) => p.id === part.id)
  const q = part.question
  const tries = attempts[part.id] ?? 0

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-[#020c18]/55 p-3 backdrop-blur-[2px] sm:items-center">
      <div
        className="w-full max-w-xl overflow-hidden rounded-3xl border bg-[#07203a]/95 text-cyan-50 shadow-2xl"
        style={{ borderColor: part.color + '80' }}
      >
        {/* Cabecera */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(90deg, ${part.color}cc, ${part.color}55)` }}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/25 text-2xl shadow-inner">
            {part.emoji}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900/70">
              {panel.review ? 'Repaso' : `Checkpoint ${index + 1} de ${TOTAL_PARTS}`} · {mode === 'tour' ? 'Recorrido guiado' : 'Exploración libre'}
            </div>
            <h2 className="truncate text-xl font-black text-slate-900 sm:text-2xl">{part.name}</h2>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {panel.stage === 'info' && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-cyan-50/95 sm:text-base">{part.description}</p>
              <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3">
                <div className="text-[11px] font-bold uppercase tracking-widest text-amber-200">Función</div>
                <p className="mt-0.5 text-sm text-amber-50">{part.func}</p>
              </div>
              <div className="rounded-2xl border border-teal-300/30 bg-teal-400/10 p-3">
                <div className="text-[11px] font-bold uppercase tracking-widest text-teal-200">💡 Dato curioso</div>
                <p className="mt-0.5 text-sm text-teal-50">{part.fact}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                {panel.review ? (
                  <>
                    <button onClick={closePanel} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">
                      Cerrar
                    </button>
                    {mode === 'free' && (
                      <button
                        onClick={toQuestion}
                        className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-bold text-slate-900 hover:brightness-110"
                      >
                        Ponme a prueba 🧠
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={toQuestion}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg hover:brightness-110"
                  >
                    ¡Entendido! Ir a la pregunta →
                  </button>
                )}
              </div>
            </div>
          )}

          {panel.stage === 'question' && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-200/70">
                Pregunta {tries > 0 ? `· intento ${tries + 1}` : ''}
              </div>
              <p className="text-base font-bold text-white sm:text-lg">{q.text}</p>
              <div className="grid gap-2">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-black text-cyan-200 group-hover:bg-cyan-300 group-hover:text-slate-900">
                      {LETTERS[i]}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {panel.stage === 'feedback' && (
            <div className="space-y-3">
              <div
                className={`rounded-2xl border p-4 ${
                  panel.correct ? 'border-emerald-300/40 bg-emerald-400/15' : 'border-rose-300/40 bg-rose-400/15'
                }`}
              >
                <div className="text-2xl font-black">
                  {panel.correct ? '🎉 ¡Correcto!' : '❌ Respuesta incorrecta'}
                  {panel.correct && panel.earned > 0 && (
                    <span className="ml-2 rounded-full bg-amber-400/30 px-2 py-0.5 text-base text-amber-100">+{panel.earned} pts</span>
                  )}
                </div>
                <p className="mt-1 text-sm">
                  {panel.correct
                    ? q.explanation
                    : 'Pista: vuelve a leer la información sobre este orgánulo y fíjate en su función principal.'}
                </p>
                {panel.selected !== null && !panel.correct && (
                  <p className="mt-1 text-xs text-rose-100/80">
                    Elegiste: «{q.options[panel.selected]}»
                  </p>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {panel.correct ? (
                  <button
                    onClick={closePanel}
                    className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg hover:brightness-110"
                  >
                    {mode === 'tour' && !panel.review && index + 1 >= TOTAL_PARTS
                      ? 'Terminar recorrido 🏁'
                      : mode === 'tour' && !panel.review
                        ? 'Continuar al siguiente checkpoint →'
                        : 'Seguir explorando →'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => useGameStore.setState({ panel: { ...panel, stage: 'info' } })}
                      className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
                    >
                      📖 Volver a leer
                    </button>
                    <button
                      onClick={retry}
                      className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg hover:brightness-110"
                    >
                      Intentar de nuevo
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
