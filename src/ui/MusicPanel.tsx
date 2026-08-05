import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { audio } from '../lib/audio'
import { radio, STATIONS, SPOTIFY_CURATED, parseSpotify, spotifyEmbedSrc, spotifyTitle } from '../lib/music'
import { spotify, player, login, logout, isConnected, spotifyConfigured } from '../lib/spotify'
import { useVoyage, type SavedTune } from '../store/useVoyage'
import { Music, Pause, Play, X } from './icons'

export default function MusicPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const audioOn = useVoyage((s) => s.audioOn)
  const setAudioOn = useVoyage((s) => s.setAudioOn)
  const tunes = useVoyage((s) => s.tunes)
  const lastTuneId = useVoyage((s) => s.lastTuneId)
  const saveTune = useVoyage((s) => s.saveTune)
  const removeTune = useVoyage((s) => s.removeTune)
  const setLastTune = useVoyage((s) => s.setLastTune)

  const [embed, setEmbed] = useState<{ kind: string; id: string } | null>(null)
  const [paste, setPaste] = useState('')
  const [vol, setVol] = useState(0.5)
  const [busy, setBusy] = useState<string | null>(null)
  const [, force] = useState(0)

  // re-render when radio or Spotify playback state changes
  useEffect(() => radio.subscribe(() => force((n) => n + 1)), [])
  useEffect(() => spotify.subscribe(() => force((n) => n + 1)), [])

  // Re-open on whatever was playing last, so a link is only ever pasted once.
  useEffect(() => {
    if (!open || embed) return
    const last = tunes.find((t) => t.id === lastTuneId)
    if (last) setEmbed({ kind: last.kind, id: last.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const connected = isConnected()

  const stopGenerative = () => {
    if (audio.on) {
      audio.toggle()
      setAudioOn(false)
    }
  }

  const playStation = (url: string) => {
    setEmbed(null)
    stopGenerative()
    radio.play(url) // toggles off if same station
  }

  const loadEmbed = (kind: string, id: string) => {
    radio.stop()
    stopGenerative()
    setEmbed({ kind, id })
  }

  /** Connected + Premium: play straight through the in-app player. Otherwise embed. */
  const playSpotify = async (kind: string, id: string) => {
    if (!connected || player.premiumRequired) {
      loadEmbed(kind, id)
      return
    }
    radio.stop()
    stopGenerative()
    setEmbed(null)
    setBusy(id)
    const ok = await player.play(`spotify:${kind}:${id}`)
    setBusy(null)
    if (!ok) loadEmbed(kind, id) // premium missing or device hiccup: fall back
  }

  const toggleGenerative = () => {
    if (audio.on) {
      audio.toggle()
      setAudioOn(false)
    } else {
      radio.stop()
      setEmbed(null)
      audio.start()
      setAudioOn(true)
    }
  }

  const onPaste = () => {
    const p = parseSpotify(paste)
    if (!p) return
    setPaste('')
    playSpotify(p.kind, p.id)
    // save immediately with a placeholder, then upgrade to the real title
    saveTune({ kind: p.kind, id: p.id, label: p.kind.charAt(0).toUpperCase() + p.kind.slice(1) })
    spotifyTitle(p.kind, p.id).then((label) => saveTune({ kind: p.kind, id: p.id, label }))
  }

  const playSaved = (t: SavedTune) => {
    setLastTune(t.id)
    playSpotify(t.kind, t.id)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="glass relative z-10 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl"
            initial={{ scale: 0.94, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-5 py-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-stardust/15 text-stardust">
                <Music width={17} height={17} />
              </div>
              <div className="flex-1">
                <div className="font-display text-[17px] font-semibold text-parchment">Soundtrack</div>
                <div className="text-[11px] text-faint">Score your voyage across the cosmos</div>
              </div>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-faint transition hover:bg-white/10 hover:text-parchment" aria-label="Close">
                <X width={16} height={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 scroll-thin">
              {/* radio */}
              <div className="eyebrow mb-2">Ambient space radio</div>
              <div className="space-y-1.5">
                {STATIONS.map((s) => {
                  const active = radio.url === s.url
                  return (
                    <button
                      key={s.id}
                      onClick={() => playStation(s.url)}
                      className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left ring-1 transition ${
                        active ? 'bg-stardust/10 ring-stardust/40' : 'bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="text-xl">{s.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-parchment">{s.name}</span>
                        <span className="block truncate text-[11px] text-faint">{s.desc}</span>
                      </span>
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${active ? 'bg-stardust text-[#241a0b]' : 'bg-white/[0.07] text-hush'}`}>
                        {active ? <Pause width={13} height={13} /> : <Play width={13} height={13} />}
                      </span>
                    </button>
                  )
                })}
              </div>

              {radio.playing && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] text-faint">Volume</span>
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
                  {radio.loading && <span className="text-[10px] text-faint">buffering…</span>}
                </div>
              )}

              {/* spotify */}
              <div className="mb-2 mt-5 flex items-center justify-between gap-2">
                <span className="eyebrow">From Spotify</span>
                {spotifyConfigured &&
                  (connected ? (
                    <button onClick={logout} className="text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-parchment">
                      Disconnect
                    </button>
                  ) : null)}
              </div>

              {/* connect button: the good path, when a client id is configured */}
              {spotifyConfigured && !connected && (
                <button
                  onClick={login}
                  className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-3 py-2.5 text-[13px] font-semibold text-[#08210f] transition hover:brightness-110"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 0a12 12 0 100 24 12 12 0 000-24zm5.5 17.3a.75.75 0 01-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 11-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.35.22.46.68.25 1.03zm1.47-3.27a.94.94 0 01-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 11-.54-1.8c4.37-1.32 9.79-.68 13.5 1.6.44.27.58.85.3 1.29zm.13-3.4C15.23 8.33 8.9 8.12 5.2 9.25a1.12 1.12 0 11-.65-2.15c4.25-1.29 11.24-1.04 15.68 1.59a1.12 1.12 0 11-1.14 1.94z" />
                  </svg>
                  Connect Spotify
                </button>
              )}

              {/* now playing through the in-app player */}
              {connected && player.track && (
                <div className="mb-2.5 flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5 ring-1 ring-white/[0.07]">
                  {player.track.art && <img src={player.track.art} alt="" className="h-10 w-10 rounded-md" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-parchment">{player.track.name}</div>
                    <div className="truncate text-[11px] text-faint">{player.track.artist}</div>
                  </div>
                  <button
                    onClick={() => player.toggle()}
                    className="grid h-8 w-8 place-items-center rounded-full bg-stardust text-[#241a0b]"
                    aria-label={player.paused ? 'Play' : 'Pause'}
                  >
                    {player.paused ? <Play width={14} height={14} /> : <Pause width={14} height={14} />}
                  </button>
                </div>
              )}

              {connected && player.premiumRequired && (
                <p className="mb-2.5 text-[11px] leading-snug text-ember/85">
                  Spotify only allows in-app playback for Premium accounts, so these will open in the preview player instead.
                </p>
              )}

              <div className="flex gap-1.5">
                <input
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onPaste()}
                  placeholder={connected ? 'Or paste any playlist or track link…' : 'Paste a Spotify playlist or track link…'}
                  className="min-w-0 flex-1 rounded-lg bg-white/[0.05] px-3 py-2 text-[13px] text-parchment ring-1 ring-white/[0.08] placeholder:text-faint focus:outline-none focus:ring-stardust/40"
                />
                <button onClick={onPaste} className="shrink-0 rounded-lg bg-stardust px-3 py-2 text-[13px] font-semibold text-[#241a0b] transition hover:brightness-110">
                  Play
                </button>
              </div>

              {tunes.length > 0 && (
                <div className="mt-2.5">
                  <div className="eyebrow mb-1.5">Your saved music</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tunes.map((t) => (
                      <span
                        key={t.id}
                        className={`group flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-[12px] ring-1 transition ${
                          embed?.id === t.id ? 'bg-stardust/15 text-parchment ring-stardust/40' : 'bg-white/[0.04] text-hush ring-white/[0.08]'
                        }`}
                      >
                        <button onClick={() => playSaved(t)} className="transition hover:text-parchment">
                          {t.label}
                        </button>
                        <button
                          onClick={() => removeTune(t.id)}
                          className="grid h-4 w-4 place-items-center rounded-full text-faint transition hover:bg-ember/20 hover:text-ember"
                          aria-label="Forget this"
                        >
                          <X width={9} height={9} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-1.5">
                {SPOTIFY_CURATED.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => playSpotify(c.kind, c.id)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] ring-1 transition ${
                      embed?.id === c.id ? 'bg-stardust/15 text-parchment ring-stardust/40' : 'bg-white/[0.04] text-hush ring-white/[0.08] hover:text-parchment'
                    }`}
                  >
                    <span>{c.emoji}</span>
                    {busy === c.id ? 'Starting…' : c.name}
                  </button>
                ))}
              </div>

              {embed && (
                <div className="mt-3 overflow-hidden rounded-xl">
                  <iframe
                    title="Spotify"
                    src={spotifyEmbedSrc(embed.kind, embed.id)}
                    width="100%"
                    height={embed.kind === 'track' ? 80 : 152}
                    frameBorder={0}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ border: 0, borderRadius: 12 }}
                  />
                  <p className="mt-1 text-[10px] text-faint">
                    {spotifyConfigured && !connected
                      ? 'Connect above to play full tracks right inside Starpin.'
                      : 'Log in to Spotify for full tracks, otherwise you’ll hear 30-second previews.'}
                  </p>
                </div>
              )}

              {/* generative */}
              <div className="eyebrow mb-2 mt-5">Generative</div>
              <button
                onClick={toggleGenerative}
                className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left ring-1 transition ${
                  audioOn ? 'bg-stardust/10 ring-stardust/40' : 'bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.05]'
                }`}
              >
                <span className="text-xl">✨</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-parchment">Cosmic ambient</span>
                  <span className="block text-[11px] text-faint">A synth drone generated live in your browser, plus UI sounds</span>
                </span>
                <span className={`grid h-7 w-7 place-items-center rounded-full ${audioOn ? 'bg-stardust text-[#241a0b]' : 'bg-white/[0.07] text-hush'}`}>
                  {audioOn ? <Pause width={13} height={13} /> : <Play width={13} height={13} />}
                </span>
              </button>

              <p className="mt-4 text-center text-[10px] text-faint">
                Radio by <span className="text-hush">SomaFM</span>, free and commercial-free · Playback by Spotify
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
