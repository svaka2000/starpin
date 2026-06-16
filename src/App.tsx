import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CosmosScene from './three/CosmosScene'
import SkyChart from './ui/SkyChart'
import ScaleMode from './ui/ScaleMode'
import Toolbar from './ui/Toolbar'
import VoyagePanel from './ui/VoyagePanel'
import Inspector from './ui/Inspector'
import Onboarding from './ui/Onboarding'
import Loader from './ui/Loader'
import { buildShareUrl, parseShareUrl } from './lib/exporters'
import { audio } from './lib/audio'
import { useVoyage } from './store/useVoyage'

export default function App() {
  const view = useVoyage((s) => s.view)
  const setView = useVoyage((s) => s.setView)
  const seenOnboarding = useVoyage((s) => s.seenOnboarding)
  const dismissOnboarding = useVoyage((s) => s.dismissOnboarding)
  const setStops = useVoyage((s) => s.setStops)
  const setPropulsion = useVoyage((s) => s.setPropulsion)
  const playing = useVoyage((s) => s.playing)
  const setPlaying = useVoyage((s) => s.setPlaying)
  const focus = useVoyage((s) => s.focus)

  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [introReady, setIntroReady] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  // brief branded loader, then let the cinematic fly-in play before the modal appears
  useEffect(() => {
    const t1 = window.setTimeout(() => setLoading(false), 1300)
    const t2 = window.setTimeout(() => setIntroReady(true), 3600)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  // audio: resume if previously enabled, and play sfx on select / add
  useEffect(() => {
    if (useVoyage.getState().audioOn) audio.start()
    let prevSel = useVoyage.getState().selectedId
    let prevLen = useVoyage.getState().stops.length
    const unsub = useVoyage.subscribe((s) => {
      if (s.selectedId && s.selectedId !== prevSel) audio.whoosh()
      prevSel = s.selectedId
      if (s.stops.length > prevLen) audio.blip()
      prevLen = s.stops.length
    })
    return unsub
  }, [])

  const showToast = (m: string) => {
    setToast(m)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600) as unknown as number
  }

  // Load a shared voyage from the URL.
  useEffect(() => {
    const parsed = parseShareUrl()
    if (parsed) {
      setStops(parsed.stops)
      if (parsed.prop) setPropulsion(parsed.prop)
      dismissOnboarding()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // One-time controls hint.
  const hinted = useRef(false)
  useEffect(() => {
    if (hinted.current) return
    hinted.current = true
    const t = window.setTimeout(() => showToast('Drag to orbit · scroll to zoom · click any world to pin it'), 1400)
    return () => window.clearTimeout(t)
  }, [])

  // Guided "Play" tour — fly the camera from stop to stop.
  useEffect(() => {
    if (!playing) return
    const stops = useVoyage.getState().stops
    if (stops.length < 2) {
      setPlaying(false)
      return
    }
    if (useVoyage.getState().view === 'sky') setView('cosmos')
    let i = 0
    focus(stops[0])
    const id = window.setInterval(() => {
      i++
      if (i >= stops.length) {
        window.clearInterval(id)
        setPlaying(false)
        return
      }
      focus(stops[i])
    }, 3000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  const onboardingOpen = (!seenOnboarding && introReady) || menuOpen
  const closeOnboarding = () => {
    dismissOnboarding()
    setMenuOpen(false)
  }

  const onShare = async () => {
    const { stops, propulsion } = useVoyage.getState()
    try {
      await navigator.clipboard.writeText(buildShareUrl(stops, propulsion))
      showToast('Voyage link copied to clipboard ✦')
    } catch {
      showToast('Could not copy link')
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        {view === 'scale' ? <ScaleMode /> : view === 'sky' ? <SkyChart /> : <CosmosScene />}
      </div>

      <Toolbar onVoyages={() => setMenuOpen(true)} onShare={onShare} />
      {view !== 'scale' && <VoyagePanel />}
      {view !== 'scale' && <Inspector />}
      <Onboarding open={onboardingOpen} onClose={closeOnboarding} />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="glass pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-medium text-slate-100 shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{loading && <Loader />}</AnimatePresence>
    </div>
  )
}
