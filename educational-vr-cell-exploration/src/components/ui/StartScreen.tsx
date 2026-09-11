import { useEffect, useState } from 'react'
import { CELL_PARTS, TOTAL_PARTS } from '../../data/cellParts'
import { useGameStore } from '../../store/gameStore'
import { checkVRSupport, xrStore } from '../../xrStore'

export function StartScreen() {
  const startGame = useGameStore((s) => s.startGame)
  const [vrSupported, setVrSupported] = useState<boolean | null>(null)
  const [vrError, setVrError] = useState<string | null>(null)

  useEffect(() => {
    checkVRSupport().then(setVrSupported)
  }, [])

  const enterVR = async () => {
    setVrError(null)
    try {
      await xrStore.enterVR()
    } catch (e) {
      setVrError('No se pudo iniciar la sesión de RV. Comprueba que tu visor esté conectado y usa un navegador compatible con WebXR.')
      console.error(e)
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-[#041424]/80 via-[#041424]/60 to-[#041424]/85 p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-cyan-300/20 bg-[#07203a]/85 p-6 text-cyan-50 shadow-2xl shadow-cyan-900/40 backdrop-blur-md sm:p-10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
          <span>🥽</span> Realidad virtual educativa · Biología
        </div>
        <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          Explorador Celular <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">VR</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-cyan-100/85 sm:text-base">
          Entra dentro de una célula humana gigante y recorre sus {TOTAL_PARTS} partes: membrana, citoplasma, núcleo,
          mitocondrias, retículo endoplasmático, aparato de Golgi… En cada <b>checkpoint</b> aprenderás qué hace ese
          orgánulo y responderás una pregunta para desbloquear el siguiente.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => startGame('tour')}
            className="group rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-left text-slate-900 shadow-lg shadow-amber-900/30 transition hover:scale-[1.02] hover:shadow-amber-500/30"
          >
            <div className="text-lg font-extrabold">🎯 Recorrido guiado</div>
            <div className="mt-1 text-sm font-medium text-slate-900/80">
              {TOTAL_PARTS} checkpoints en orden, con preguntas y puntuación. Ideal para aprender.
            </div>
          </button>
          <button
            onClick={() => startGame('free')}
            className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4 text-left transition hover:bg-cyan-400/20"
          >
            <div className="text-lg font-extrabold text-white">🧭 Exploración libre</div>
            <div className="mt-1 text-sm text-cyan-100/80">
              Camina por la célula, haz clic en cualquier parte para leer sobre ella y ponte a prueba cuando quieras.
            </div>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-bold text-white">¿Tienes un visor de realidad virtual?</div>
            <div className="text-xs text-cyan-100/70">
              {vrSupported === null && 'Comprobando compatibilidad WebXR…'}
              {vrSupported === true && 'Tu navegador es compatible con WebXR. Usa el joystick izquierdo para moverte y apunta con el mando para responder.'}
              {vrSupported === false &&
                'Este dispositivo no soporta WebXR inmersivo: puedes jugar igualmente con teclado y ratón o en pantalla táctil.'}
            </div>
            {vrError && <div className="mt-1 text-xs text-rose-300">{vrError}</div>}
          </div>
          <button
            onClick={enterVR}
            disabled={vrSupported === false}
            className="shrink-0 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            🥽 Entrar en RV
          </button>
        </div>

        <div className="mt-4 grid gap-2 text-xs text-cyan-100/80 sm:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="font-bold text-white">⌨️ Teclado</div>
            <kbd className="font-mono">W A S D</kbd> o flechas para caminar · <kbd className="font-mono">Shift</kbd> correr ·{' '}
            <kbd className="font-mono">Q/E</kbd> girar
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="font-bold text-white">🖱️ Ratón / táctil</div>
            Arrastra para mirar alrededor · haz clic en un orgánulo para leer sobre él · joystick en pantalla en móviles
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="font-bold text-white">🏆 Puntuación</div>
            100 pts si aciertas a la primera, 60 a la segunda y 30 después. ¡Consigue las 3 estrellas!
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {CELL_PARTS.map((p) => (
            <span
              key={p.id}
              className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
              style={{ borderColor: p.color + '66', color: p.color, backgroundColor: p.color + '14' }}
            >
              {p.emoji} {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
