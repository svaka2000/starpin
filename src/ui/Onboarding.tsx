import { AnimatePresence, motion } from 'framer-motion'
import { PRESETS } from '../data/cosmos'
import { useVoyage } from '../store/useVoyage'
import { Rocket, Telescope, X } from './icons'

export default function Onboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setStops = useVoyage((s) => s.setStops)
  const setView = useVoyage((s) => s.setView)

  const choose = (ids: string[], view?: 'cosmos' | 'orrery') => {
    setStops(ids)
    if (view) setView(view)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="glass relative z-10 w-full max-w-lg overflow-hidden rounded-3xl p-7 shadow-2xl"
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X width={16} height={16} />
            </button>

            <div className="mb-1 flex items-center justify-center gap-2 text-stardust">
              <img src="/favicon.svg" alt="" className="h-5 w-5" />
              <span className="font-display text-sm font-semibold tracking-wide">Starpin</span>
            </div>
            <h2 className="text-center font-display text-2xl font-bold text-white">
              Where does your <span className="text-grad">voyage</span> begin?
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-slate-400">
              Drop pins across a living universe and watch your route fly between real worlds. Starting from Earth, of course.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => choose(['earth', 'moon', 'mars', 'jupiter'], 'orrery')}
                className="group rounded-2xl border border-stardust/40 bg-stardust/5 p-4 text-left transition hover:border-stardust/70 hover:bg-stardust/10"
              >
                <Rocket className="mb-2 text-stardust" width={22} height={22} />
                <div className="font-semibold text-white">Plan a voyage</div>
                <div className="mt-0.5 text-[13px] leading-snug text-slate-400">Dream up worlds you want to reach.</div>
              </button>
              <button
                onClick={() => choose(['earth', 'jupiter', 'saturn', 'uranus', 'neptune'], 'cosmos')}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <Telescope className="mb-2 text-nova" width={22} height={22} />
                <div className="font-semibold text-white">Follow a mission</div>
                <div className="mt-0.5 text-[13px] leading-snug text-slate-400">Retrace a real spacecraft’s path.</div>
              </button>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-center text-xs uppercase tracking-[0.2em] text-slate-500">or launch a journey</p>
              <div className="flex flex-wrap justify-center gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => choose(p.stops, p.stops.every((s) => ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].includes(s)) ? 'orrery' : 'cosmos')}
                    title={p.blurb}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[13px] text-slate-200 transition hover:border-stardust/50 hover:bg-stardust/10 hover:text-white"
                  >
                    <span>{p.emoji}</span>
                    <span>{p.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={onClose}
                className="text-sm font-medium text-slate-400 transition hover:text-stardust"
              >
                Just exploring →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
