// Spotify Connect: real in-app playback via Authorization Code + PKCE and the
// Web Playback SDK. PKCE needs no client secret, so this works on a static site
// with no backend. Two hard requirements from Spotify's side:
//   1. VITE_SPOTIFY_CLIENT_ID must be set (register an app + add this origin as a
//      redirect URI at developer.spotify.com/dashboard).
//   2. In-app playback requires a Spotify Premium account (the `streaming` scope).
// Without either, the UI falls back to the paste-a-link embed player.

const CLIENT_ID: string = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? ''
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

const K = {
  verifier: 'starpin.sp.verifier',
  token: 'starpin.sp.token',
  refresh: 'starpin.sp.refresh',
  expires: 'starpin.sp.expires',
}

export const spotifyConfigured = Boolean(CLIENT_ID)

function redirectUri(): string {
  return `${window.location.origin}/`
}

function randomString(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

function persist(t: TokenResponse) {
  localStorage.setItem(K.token, t.access_token)
  if (t.refresh_token) localStorage.setItem(K.refresh, t.refresh_token)
  localStorage.setItem(K.expires, String(Date.now() + t.expires_in * 1000 - 60_000))
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse | null> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  })
  if (!res.ok) return null
  return (await res.json()) as TokenResponse
}

/** Kick off the consent redirect. */
export async function login() {
  if (!CLIENT_ID) return
  const verifier = randomString(96)
  localStorage.setItem(K.verifier, verifier)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: await challengeFor(verifier),
  })
  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export function logout() {
  ;[K.token, K.refresh, K.expires].forEach((k) => localStorage.removeItem(k))
  player.teardown()
  spotify.emit()
}

/** Exchange ?code= for tokens on return from consent, then scrub the URL. */
async function consumeCallback(): Promise<boolean> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const verifier = localStorage.getItem(K.verifier)
  if (!code || !verifier) return false

  const t = await tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  })
  localStorage.removeItem(K.verifier)
  // strip the auth params but keep any shared-voyage params intact
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  window.history.replaceState({}, '', url.toString())
  if (!t) return false
  persist(t)
  return true
}

async function validToken(): Promise<string | null> {
  const tok = localStorage.getItem(K.token)
  const exp = Number(localStorage.getItem(K.expires) ?? 0)
  if (tok && Date.now() < exp) return tok

  const refresh = localStorage.getItem(K.refresh)
  if (!refresh) return null
  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: refresh })
  if (!t) {
    ;[K.token, K.refresh, K.expires].forEach((k) => localStorage.removeItem(k))
    return null
  }
  persist(t)
  return t.access_token
}

export function isConnected(): boolean {
  return Boolean(localStorage.getItem(K.token) || localStorage.getItem(K.refresh))
}

/* ---------------------------------------------------------------- SDK player */

interface SpotifyPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, cb: (payload: unknown) => void): void
  togglePlay(): Promise<void>
  nextTrack(): Promise<void>
  previousTrack(): Promise<void>
  setVolume(v: number): Promise<void>
}

declare global {
  interface Window {
    Spotify?: { Player: new (opts: Record<string, unknown>) => SpotifyPlayer }
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

let sdkLoading: Promise<void> | null = null
function loadSDK(): Promise<void> {
  if (window.Spotify) return Promise.resolve()
  if (sdkLoading) return sdkLoading
  sdkLoading = new Promise<void>((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve()
    const el = document.createElement('script')
    el.src = 'https://sdk.scdn.co/spotify-player.js'
    el.async = true
    el.onerror = () => reject(new Error('sdk'))
    document.body.appendChild(el)
  })
  return sdkLoading
}

class Player {
  private p: SpotifyPlayer | null = null
  deviceId: string | null = null
  track: { name: string; artist: string; art: string } | null = null
  paused = true
  /** Set when Spotify rejects playback because the account is not Premium. */
  premiumRequired = false

  async ensure(): Promise<boolean> {
    if (this.deviceId) return true
    const token = await validToken()
    if (!token) return false
    await loadSDK()
    if (!window.Spotify) return false

    this.p = new window.Spotify.Player({
      name: 'Starpin',
      getOAuthToken: (cb: (t: string) => void) => {
        validToken().then((t) => t && cb(t))
      },
      volume: 0.5,
    })

    this.p.addListener('ready', (payload) => {
      this.deviceId = (payload as { device_id: string }).device_id
      spotify.emit()
    })
    this.p.addListener('not_ready', () => {
      this.deviceId = null
      spotify.emit()
    })
    this.p.addListener('player_state_changed', (payload) => {
      const s = payload as {
        paused: boolean
        track_window: { current_track: { name: string; artists: { name: string }[]; album: { images: { url: string }[] } } }
      } | null
      if (!s) return
      const t = s.track_window.current_track
      this.paused = s.paused
      this.track = {
        name: t.name,
        artist: t.artists.map((a) => a.name).join(', '),
        art: t.album.images.at(-1)?.url ?? '',
      }
      spotify.emit()
    })
    // Premium is required for the SDK; surface that instead of failing silently.
    this.p.addListener('account_error', () => {
      this.premiumRequired = true
      spotify.emit()
    })

    const ok = await this.p.connect()
    if (!ok) return false
    // wait briefly for the ready event to land
    for (let i = 0; i < 40 && !this.deviceId; i++) await new Promise((r) => setTimeout(r, 100))
    return Boolean(this.deviceId)
  }

  async play(contextUri: string): Promise<boolean> {
    if (!(await this.ensure())) return false
    const token = await validToken()
    if (!token) return false
    const isTrack = contextUri.includes(':track:')
    const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(isTrack ? { uris: [contextUri] } : { context_uri: contextUri }),
    })
    if (res.status === 403) {
      this.premiumRequired = true
      spotify.emit()
      return false
    }
    return res.ok
  }

  async toggle() {
    if (this.p) await this.p.togglePlay()
  }
  async next() {
    if (this.p) await this.p.nextTrack()
  }
  async prev() {
    if (this.p) await this.p.previousTrack()
  }
  async setVolume(v: number) {
    if (this.p) await this.p.setVolume(v)
  }

  teardown() {
    this.p?.disconnect()
    this.p = null
    this.deviceId = null
    this.track = null
    this.paused = true
  }
}

export const player = new Player()

/* ------------------------------------------------------------- store/subject */

class SpotifyStore {
  private subs = new Set<() => void>()
  ready = false

  subscribe(fn: () => void) {
    this.subs.add(fn)
    return () => {
      this.subs.delete(fn)
    }
  }
  emit() {
    this.subs.forEach((f) => f())
  }

  /** Call once on app start: finishes the OAuth handshake if we just came back. */
  async init() {
    if (!CLIENT_ID) return
    if (await consumeCallback()) {
      // returning from consent — bring the device online right away
      player.ensure().then(() => this.emit())
    }
    this.ready = true
    this.emit()
  }
}

export const spotify = new SpotifyStore()
