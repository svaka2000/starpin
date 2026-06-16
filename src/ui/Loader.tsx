import { motion } from 'framer-motion'

export default function Loader() {
  return (
    <motion.div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      <div className="flex flex-col items-center">
        <div className="relative h-24 w-24">
          {/* orbit */}
          <motion.div
            className="absolute inset-0 rounded-full border border-stardust/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-stardust shadow-[0_0_12px_2px_rgba(138,180,255,0.8)]" />
          </motion.div>
          {/* inner orbit */}
          <motion.div
            className="absolute inset-4 rounded-full border border-nova/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-nova shadow-[0_0_10px_2px_rgba(167,139,250,0.8)]" />
          </motion.div>
          {/* sun */}
          <div className="absolute inset-0 grid place-items-center">
            <img src="/favicon.svg" alt="" className="h-9 w-9 animate-floaty" />
          </div>
        </div>
        <div className="mt-6 font-display text-lg font-semibold tracking-wide text-grad">Starpin</div>
        <div className="mt-1 text-xs tracking-widest text-slate-500">CHARTING THE COSMOS…</div>
      </div>
    </motion.div>
  )
}
