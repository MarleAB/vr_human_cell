import { create } from 'zustand'
import { CELL_PARTS, getPart } from '../data/cellParts'

export type Phase = 'start' | 'playing' | 'finished'
export type Mode = 'tour' | 'free'
export type PanelStage = 'info' | 'question' | 'feedback'

export interface PanelState {
  partId: string
  stage: PanelStage
  selected: number | null
  correct: boolean
  review: boolean
  earned: number
}

export interface PanelAnchor {
  position: [number, number, number]
  yaw: number
}

interface GameState {
  phase: Phase
  mode: Mode
  currentIndex: number
  completed: string[]
  score: number
  attempts: Record<string, number>
  panel: PanelState | null
  panelAnchor: PanelAnchor
  inVR: boolean
  playerPos: { x: number; z: number; yaw: number }
  showParts: boolean
  toast: string | null

  startGame: (mode: Mode) => void
  openPanel: (partId: string, review?: boolean, anchor?: PanelAnchor) => void
  toQuestion: () => void
  answer: (index: number) => void
  retry: () => void
  closePanel: () => void
  setInVR: (v: boolean) => void
  setPlayerPos: (p: { x: number; z: number; yaw: number }) => void
  toggleParts: () => void
  continueFree: () => void
  showToast: (msg: string) => void
  reset: () => void
}

const initial = {
  phase: 'start' as Phase,
  mode: 'tour' as Mode,
  currentIndex: 0,
  completed: [] as string[],
  score: 0,
  attempts: {} as Record<string, number>,
  panel: null as PanelState | null,
  panelAnchor: { position: [0, 1.4, 15] as [number, number, number], yaw: 0 },
  inVR: false,
  playerPos: { x: 0, z: 17, yaw: 0 },
  showParts: false,
  toast: null as string | null,
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useGameStore = create<GameState>((set, get) => ({
  ...initial,

  startGame: (mode) =>
    set({
      ...initial,
      inVR: get().inVR,
      phase: 'playing',
      mode,
    }),

  openPanel: (partId, review = false, anchor) => {
    if (get().panel) return
    set({
      panel: { partId, stage: 'info', selected: null, correct: false, review, earned: 0 },
      panelAnchor: anchor ?? get().panelAnchor,
    })
  },

  toQuestion: () => {
    const panel = get().panel
    if (!panel) return
    set({ panel: { ...panel, stage: 'question', selected: null } })
  },

  answer: (index) => {
    const state = get()
    const panel = state.panel
    if (!panel || panel.stage !== 'question') return
    const part = getPart(panel.partId)
    const tries = (state.attempts[panel.partId] ?? 0) + 1
    const correct = index === part.question.correct
    const alreadyDone = state.completed.includes(panel.partId)
    let earned = 0
    if (correct && !alreadyDone) {
      earned = tries === 1 ? 100 : tries === 2 ? 60 : 30
    }
    set({
      attempts: { ...state.attempts, [panel.partId]: tries },
      score: state.score + earned,
      completed: correct && !alreadyDone ? [...state.completed, panel.partId] : state.completed,
      panel: { ...panel, stage: 'feedback', selected: index, correct, earned },
    })
  },

  retry: () => {
    const panel = get().panel
    if (!panel) return
    set({ panel: { ...panel, stage: 'question', selected: null, correct: false } })
  },

  closePanel: () => {
    const state = get()
    const panel = state.panel
    if (!panel) return
    let { currentIndex, phase } = state
    if (state.mode === 'tour' && !panel.review && panel.correct) {
      const idx = CELL_PARTS.findIndex((p) => p.id === panel.partId)
      if (idx === currentIndex) {
        currentIndex = idx + 1
        if (currentIndex >= CELL_PARTS.length) {
          phase = 'finished'
        }
      }
    }
    set({ panel: null, currentIndex, phase })
  },

  setInVR: (v) => set({ inVR: v }),
  setPlayerPos: (p) => set({ playerPos: p }),
  toggleParts: () => set((s) => ({ showParts: !s.showParts })),

  continueFree: () => set({ phase: 'playing', mode: 'free', panel: null }),

  showToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: msg })
    toastTimer = setTimeout(() => set({ toast: null }), 2600)
  },

  reset: () => set({ ...initial, inVR: get().inVR }),
}))

/** Entrada táctil compartida (joystick virtual) — mutable para evitar re-renders */
export const touchInput = { x: 0, y: 0 }
/** Distancia arrastrada en el último gesto de ratón (para distinguir clic de arrastre) */
export const dragState = { distance: 0 }

export const xrPanelStageLabel: Record<PanelStage, string> = {
  info: 'Información',
  question: 'Pregunta',
  feedback: 'Resultado',
}
