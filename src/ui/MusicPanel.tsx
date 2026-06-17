import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { audio } from '../lib/audio'
import { radio, STATIONS, SPOTIFY_CURATED, parseSpotify, spotifyEmbedSrc } from '../lib/music'
import { useVoyage } from '../store/useVoyage'
import { Music, Pause, Play, X } from './icons'

export default function MusicPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const audioOn = useVoyage((s) => s.audioOn)
  const setAudioOn = useVoyage((s) => s.setAudioOn)

  const [spotify, setSpotify] = useState<{ kind: string; id: string } | null>(null)
  const [paste, setPaste] = useState('')
  const [vol, setVol] = useState(0.5)
  const [, force] = useState(0)

  // re-render when the radio state changes
  useEffect(() => radio.subscribe(() => force((n) => n + 1)), [])

  const stopGenerative = () => {
    if (audio.on) {
      audio.toggle()
      setAudioOn(false)
    }
  }

  const playStation = (url: string) => {
    setSpotify(null)
    stopGenerative()
    radio.play(url) // toggles off if same station
  }

  const loadSpotify = (kind: string, id: string) => {
    radio.stop()
    stopGenerative()
    setSpotify({ kind, id })
  }

  const toggleGenerative = () => {
    if (audio.on) {
      audio.toggle()
      setAudioOn(false)
    } else {
      radio.stop()
      setSpotify(null)
      audio.start()
      setAudioOn(true)
    }
  }

  const onPaste = () => {
    const p = parseSpotify(paste)
    if (p) {
      loadSpotify(p.kind, p.id)
      setPaste('')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="glass relative z-10 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl shadow-2xl"
            initial={{ scale: 0.94, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-nova/15 text-nova">
                <Music width={17} height={17} />
              </div>
              <div className="flex-1">
                <div className="font-display text-[15px] font-semibold text-white">Soundtrack</div>
                <div className="text-[11px] text-slate-400">Score your voyage across the cosmos</div>
              </div>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close">
                <X width={16} height={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 scroll-thin">
              {/* radio */}
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ambient space radio</div>
              <div className="space-y-1.5">
                {STATIONS.map((s) => {
                  const active = radio.url === s.url
                  return (
                    <button
                      key={s.id}
                      onClick={() => playStation(s.url)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                        active ? 'border-stardust/50 bg-stardust/10' : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="text-xl">{s.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{s.name}</span>
                        <span className="block truncate text-[11px] text-slate-400">{s.desc}</span>
                      </span>
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${active ? 'bg-stardust text-slate-950' : 'bg-white/8 text-slate-300'}`}>
                        {active ? <Pause width={13} height={13} /> : <Play width={13} height={13} />}
                      </span>
                    </button>
                  )
                })}
              </div>

              {radio.playing && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Volume</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={vol}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setVol(v)
                      radio.setVolume(v)
                    }}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-stardust"
                  />
                  {radio.loading && <span className="text-[10px] text-slate-500">buffering…</span>}
                </div>
              )}

              {/* spotify */}
              <div className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">From Spotify</div>
              <div className="flex gap-1.5">
                <input
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onPaste()}
                  placeholder="Paste a Spotify playlist or track link…"
                  className="min-w-0 flex-1 rounded-lg bg-white/[0.06] px-3 py-2 text-[13px] text-white placeholder:text-slate-500 ring-1 ring-white/10 focus:outline-none focus:ring-stardust/40"
                />
                <button onClick={onPaste} className="shrink-0 rounded-lg bg-stardust/90 px-3 py-2 text-[13px] font-semibold text-slate-950 transition hover:bg-stardust">
                  Play
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SPOTIFY_CURATED.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadSpotify(c.kind, c.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition ${
                      spotify?.id === c.id ? 'border-stardust/50 bg-stardust/15 text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{c.emoji}</span>
                    {c.name}
                  </button>
                ))}
              </div>
              {spotify && (
                <div className="mt-3 overflow-hidden rounded-xl">
                  <iframe
                    title="Spotify"
                    src={spotifyEmbedSrc(spotify.kind, spotify.id)}
                    width="100%"
                    height={spotify.kind === 'track' ? 80 : 152}
                    frameBorder={0}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ border: 0, borderRadius: 12 }}
                  />
                  <p className="mt-1 text-[10px] text-slate-500">Tip: log in to Spotify for full tracks — otherwise you’ll hear 30-second previews.</p>
                </div>
              )}

              {/* generative */}
              <div className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Generative</div>
              <button
                onClick={toggleGenerative}
                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                  audioOn ? 'border-nova/50 bg-nova/10' : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <span className="text-xl">✨</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">Cosmic ambient</span>
                  <span className="block text-[11px] text-slate-400">A synth drone generated live in your browser, plus UI sounds</span>
                </span>
                <span className={`grid h-7 w-7 place-items-center rounded-full ${audioOn ? 'bg-nova text-slate-950' : 'bg-white/8 text-slate-300'}`}>
                  {audioOn ? <Pause width={13} height={13} /> : <Play width={13} height={13} />}
                </span>
              </button>

              <p className="mt-4 text-center text-[10px] text-slate-500">
                Radio by <span className="text-slate-400">SomaFM</span> — free & commercial-free · Spotify playback by Spotify
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
