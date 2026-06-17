import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PRESETS } from '../data/cosmos'
import { X } from './icons'

interface Slide {
  bg: string
  eyebrow: string
  title: string
  body: string
  accent: string
}

const SLIDES: Slide[] = [
  {
    bg: '/textures/deepsky/carina.jpg',
    eyebrow: 'STARPIN',
    title: 'Plan voyages across a living universe',
    body: 'Drop pins on real worlds, chart a route through the cosmos, and watch the light-years unfold.',
    accent: '#8ab4ff',
  },
  {
    bg: '/textures/deepsky/orion.jpg',
    eyebrow: 'REAL WORLDS',
    title: 'Pin real planets, stars & galaxies',
    body: '50+ destinations placed by true NASA coordinates — from the Moon to the Andromeda Galaxy, each with real data and telescope imagery.',
    accent: '#ff9ec4',
  },
  {
    bg: '/textures/deepsky/crab.jpg',
    eyebrow: 'INTERSTELLAR TRAVEL',
    title: 'Cross impossible distances',
    body: 'Choose your ride — Voyager, a fusion ship, even light speed — and see the real travel-time to anywhere in the universe.',
    accent: '#9be0c0',
  },
  {
    bg: '/textures/deepsky/andromeda.jpg',
    eyebrow: 'THE BIG PICTURE',
    title: 'Grasp the scale of everything',
    body: 'Zoom from your own height out to the edge of the observable universe — every world shown to true scale.',
    accent: '#cdb8ff',
  },
  {
    bg: '/textures/deepsky/sombrero.jpg',
    eyebrow: 'READY?',
    title: 'Where does your voyage begin?',
    body: 'Launch a guided journey, or just start exploring the cosmos.',
    accent: '#ffd479',
  },
]

const PLANETS = ['earth', 'mars', 'jupiter']
const PROPS = ['✈️', '🛰️', '☄️', '⚛️', '✨', '🌀']
const DURATION = 6200

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-55%' : '55%', opacity: 0 }),
}

export default function IntroCarousel({
  open,
  onFinish,
}: {
  open: boolean
  onFinish: (stops?: string[]) => void
}) {
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const last = SLIDES.length - 1

  const go = (n: number, d: number) => {
    setDir(d)
    setI(Math.max(0, Math.min(last, n)))
  }

  // auto-advance (stops on the final slide)
  useEffect(() => {
    if (!open || i === last) return
    const t = window.setTimeout(() => go(i + 1, 1), DURATION)
    return () => window.clearTimeout(t)
  }, [i, open, last])

  const slide = SLIDES[i]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] overflow-hidden bg-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* slides */}
          <AnimatePresence custom={dir} mode="popLayout">
            <motion.div
              key={i}
              className="absolute inset-0"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80 && i < last) go(i + 1, 1)
                else if (info.offset.x > 80 && i > 0) go(i - 1, -1)
              }}
            >
              {/* Ken Burns background */}
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.bg})` }}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1.22 }}
                transition={{ duration: DURATION / 1000 + 1, ease: 'linear' }}
              />
              {/* scrims */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/30" />
              <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_120%,rgba(5,6,12,0.9),transparent)]" />

              {/* content */}
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
                <motion.div
                  className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.35em]"
                  style={{ color: slide.accent }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {i === 0 && <img src="/favicon.svg" alt="" className="h-4 w-4" />}
                  {slide.eyebrow}
                </motion.div>

                <motion.h1
                  className="max-w-3xl font-display text-4xl font-bold leading-[1.05] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)] sm:text-6xl"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  className="mt-5 max-w-xl text-base leading-relaxed text-slate-200/90 sm:text-lg"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                >
                  {slide.body}
                </motion.p>

                {/* slide-specific flourishes */}
                {i === 1 && (
                  <motion.div
                    className="mt-8 flex items-center gap-5"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                  >
                    {PLANETS.map((p, k) => (
                      <motion.img
                        key={p}
                        src={`/renders/${p}.png`}
                        alt={p}
                        className="h-16 w-16 rounded-full sm:h-20 sm:w-20"
                        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4 + k, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ))}
                  </motion.div>
                )}
                {i === 2 && (
                  <motion.div
                    className="mt-8 flex flex-wrap items-center justify-center gap-2"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                  >
                    {PROPS.map((e, k) => (
                      <span key={k} className="glass-soft rounded-full px-3 py-1.5 text-xl">
                        {e}
                      </span>
                    ))}
                  </motion.div>
                )}
                {i === last && (
                  <motion.div
                    className="mt-8 flex w-full max-w-xl flex-col items-center gap-3"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex flex-wrap justify-center gap-2">
                      {PRESETS.slice(0, 5).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => onFinish(p.stops)}
                          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-sm text-slate-100 backdrop-blur-md transition hover:border-stardust/60 hover:bg-stardust/15"
                        >
                          <span>{p.emoji}</span>
                          <span>{p.title}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => onFinish()}
                      className="mt-2 rounded-full bg-stardust px-7 py-3 text-sm font-semibold text-slate-950 shadow-[0_8px_30px_-8px_rgba(138,180,255,0.8)] transition hover:brightness-110"
                    >
                      Just start exploring →
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* top progress bars */}
          <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 p-3">
            {SLIDES.map((_, k) => (
              <div key={k} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                <motion.div
                  className="h-full bg-white"
                  initial={false}
                  animate={{ width: k <= i ? '100%' : '0%' }}
                  transition={k === i && i !== last ? { duration: DURATION / 1000, ease: 'linear' } : { duration: 0.3 }}
                />
              </div>
            ))}
          </div>

          {/* skip */}
          <button
            onClick={() => onFinish()}
            className="absolute right-4 top-6 z-20 flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-md transition hover:bg-white/15"
          >
            Skip intro <X width={13} height={13} />
          </button>

          {/* prev / next + dots */}
          <div className="absolute inset-x-0 bottom-7 z-20 flex items-center justify-center gap-5">
            <button
              onClick={() => go(i - 1, -1)}
              disabled={i === 0}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-white backdrop-blur-md transition hover:bg-white/15 disabled:opacity-0"
              aria-label="Previous"
            >
              ‹
            </button>
            <div className="flex items-center gap-2">
              {SLIDES.map((_, k) => (
                <button
                  key={k}
                  onClick={() => go(k, k > i ? 1 : -1)}
                  className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-white' : 'w-2 bg-white/35 hover:bg-white/60'}`}
                  aria-label={`Slide ${k + 1}`}
                />
              ))}
            </div>
            {i < last ? (
              <button
                onClick={() => go(i + 1, 1)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-white backdrop-blur-md transition hover:bg-white/15"
                aria-label="Next"
              >
                ›
              </button>
            ) : (
              <div className="h-10 w-10" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
