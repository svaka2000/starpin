import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { COSMOS, SAMPLE_VOYAGE } from '../data/cosmos'

export type ViewMode = 'cosmos' | 'orrery' | 'sky'

interface VoyageState {
  stops: string[]
  selectedId: string | null
  focusNonce: number
  view: ViewMode
  propulsion: string
  panelOpen: boolean
  playing: boolean
  seenOnboarding: boolean

  addStop: (id: string) => void
  removeStop: (id: string) => void
  toggleStop: (id: string) => void
  moveStop: (from: number, to: number) => void
  setStops: (ids: string[]) => void
  clear: () => void
  hasStop: (id: string) => boolean

  select: (id: string | null) => void
  focus: (id: string) => void
  takeMeSomewhere: () => void

  setView: (v: ViewMode) => void
  setPropulsion: (id: string) => void
  setPanelOpen: (open: boolean) => void
  setPlaying: (p: boolean) => void
  dismissOnboarding: () => void
}

export const useVoyage = create<VoyageState>()(
  persist(
    (set, get) => ({
      stops: SAMPLE_VOYAGE,
      selectedId: null,
      focusNonce: 0,
      view: 'cosmos',
      propulsion: 'daedalus',
      panelOpen: true,
      playing: false,
      seenOnboarding: false,

      addStop: (id) =>
        set((s) =>
          s.stops.includes(id)
            ? { selectedId: id, focusNonce: s.focusNonce + 1 }
            : { stops: [...s.stops, id], selectedId: id, focusNonce: s.focusNonce + 1 },
        ),
      removeStop: (id) =>
        set((s) => ({
          stops: s.stops.filter((x) => x !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),
      toggleStop: (id) =>
        get().stops.includes(id) ? get().removeStop(id) : get().addStop(id),
      moveStop: (from, to) =>
        set((s) => {
          const next = [...s.stops]
          if (from < 0 || from >= next.length || to < 0 || to >= next.length) return {}
          const [moved] = next.splice(from, 1)
          next.splice(to, 0, moved)
          return { stops: next }
        }),
      setStops: (ids) => set({ stops: ids, selectedId: ids[0] ?? null, playing: false }),
      clear: () => set({ stops: [], selectedId: null, playing: false }),
      hasStop: (id) => get().stops.includes(id),

      select: (id) => set((s) => ({ selectedId: id, focusNonce: s.focusNonce + 1 })),
      focus: (id) => set((s) => ({ selectedId: id, focusNonce: s.focusNonce + 1 })),
      takeMeSomewhere: () => {
        const pool = COSMOS.filter((b) => b.id !== 'sun')
        const pick = pool[Math.floor(Math.random() * pool.length)]
        set((s) => ({ selectedId: pick.id, focusNonce: s.focusNonce + 1 }))
      },

      setView: (v) => set({ view: v }),
      setPropulsion: (id) => set({ propulsion: id }),
      setPanelOpen: (open) => set({ panelOpen: open }),
      setPlaying: (p) => set({ playing: p }),
      dismissOnboarding: () => set({ seenOnboarding: true }),
    }),
    {
      name: 'starpin-voyage',
      partialize: (s) => ({
        stops: s.stops,
        propulsion: s.propulsion,
        view: s.view,
        seenOnboarding: s.seenOnboarding,
      }),
    },
  ),
)
