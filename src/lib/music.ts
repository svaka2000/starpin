// Background-music sources: free ambient internet radio + Spotify embed helpers.

class Radio {
  private el: HTMLAudioElement | null = null
  url: string | null = null
  loading = false
  private subs = new Set<() => void>()

  private ensure() {
    if (this.el) return
    this.el = new Audio()
    this.el.preload = 'none'
    this.el.volume = 0.5
    this.el.addEventListener('playing', () => {
      this.loading = false
      this.emit()
    })
    this.el.addEventListener('waiting', () => {
      this.loading = true
      this.emit()
    })
    this.el.addEventListener('error', () => {
      this.loading = false
      this.url = null
      this.emit()
    })
  }

  play(url: string) {
    this.ensure()
    if (this.url === url) {
      this.stop()
      return
    }
    this.loading = true
    this.url = url
    this.el!.src = url
    this.el!.play().catch(() => {
      this.loading = false
      this.url = null
      this.emit()
    })
    this.emit()
  }

  stop() {
    if (this.el) {
      this.el.pause()
      this.el.removeAttribute('src')
      this.el.load()
    }
    this.url = null
    this.loading = false
    this.emit()
  }

  setVolume(v: number) {
    this.ensure()
    this.el!.volume = v
  }

  get playing() {
    return !!this.url
  }

  subscribe(fn: () => void) {
    this.subs.add(fn)
    return () => {
      this.subs.delete(fn)
    }
  }
  private emit() {
    this.subs.forEach((f) => f())
  }
}

export const radio = new Radio()

export interface Station {
  id: string
  name: string
  desc: string
  url: string
  emoji: string
}

// SomaFM — free, listener-supported, commercial-free ambient/space radio.
export const STATIONS: Station[] = [
  { id: 'drone', name: 'Drone Zone', desc: 'Deep, atmospheric space ambient', url: 'https://ice1.somafm.com/dronezone-128-mp3', emoji: '🌌' },
  { id: 'space', name: 'Space Station', desc: 'Spaced-out ambient & mid-tempo', url: 'https://ice1.somafm.com/spacestation-128-mp3', emoji: '🛸' },
  { id: 'deep', name: 'Deep Space One', desc: 'Deep ambient electronic & experimental', url: 'https://ice1.somafm.com/deepspaceone-128-mp3', emoji: '🪐' },
  { id: 'mission', name: 'Mission Control', desc: 'Real NASA mission audio over ambient', url: 'https://ice1.somafm.com/missioncontrol-128-mp3', emoji: '🛰️' },
]

export interface SpotifyPick {
  kind: string
  id: string
  name: string
  emoji: string
}

export const SPOTIFY_CURATED: SpotifyPick[] = [
  { kind: 'playlist', id: '37i9dQZF1DX3Ogo9pFvBkY', name: 'Ambient Relaxation', emoji: '🌌' },
  { kind: 'playlist', id: '37i9dQZF1DWZeKCadgRdKQ', name: 'Deep Focus', emoji: '🎧' },
  { kind: 'playlist', id: '37i9dQZF1DWZqd5JICZI0u', name: 'Peaceful Meditation', emoji: '🧘' },
]

/** Parse a pasted Spotify URL / URI into { kind, id }. */
export function parseSpotify(input: string): { kind: string; id: string } | null {
  const s = input.trim()
  let m = s.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|track|album|episode|show|artist)\/([A-Za-z0-9]+)/)
  if (m) return { kind: m[1], id: m[2] }
  m = s.match(/spotify:(playlist|track|album|episode|show|artist):([A-Za-z0-9]+)/)
  if (m) return { kind: m[1], id: m[2] }
  return null
}

export function spotifyEmbedSrc(kind: string, id: string): string {
  return `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`
}
