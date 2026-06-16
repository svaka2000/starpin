// Procedural cosmic ambience + UI sfx via the Web Audio API (zero assets).

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambient: GainNode | null = null
  private started = false
  on = false

  private ensure() {
    if (this.ctx) return
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctor()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(this.ctx.destination)
  }

  private buildAmbient() {
    if (!this.ctx || !this.master || this.ambient) return
    const ctx = this.ctx
    const bus = ctx.createGain()
    bus.gain.value = 0.5
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 520
    lp.Q.value = 0.7
    bus.connect(lp)
    lp.connect(this.master)

    // detuned drone oscillators
    const freqs = [55, 82.5, 110, 164.8]
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator()
      o.type = i % 2 ? 'sine' : 'triangle'
      o.frequency.value = f
      o.detune.value = (i - 1.5) * 4
      const g = ctx.createGain()
      g.gain.value = 0.22 / (i + 1)
      o.connect(g)
      g.connect(bus)
      o.start()
    })

    // slow filter LFO for movement
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.05
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 220
    lfo.connect(lfoGain)
    lfoGain.connect(lp.frequency)
    lfo.start()

    this.ambient = bus
  }

  toggle(): boolean {
    this.on = !this.on
    if (this.on) this.start()
    else this.fade(0)
    return this.on
  }

  start() {
    this.ensure()
    this.ctx?.resume()
    this.buildAmbient()
    this.on = true
    this.started = true
    this.fade(0.16)
  }

  private fade(to: number) {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(this.master.gain.value, t)
    this.master.gain.linearRampToValueAtTime(to, t + 1.2)
  }

  whoosh() {
    if (!this.on || !this.ctx || !this.master) return
    const ctx = this.ctx
    const dur = 0.9
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.2
    const now = ctx.currentTime
    bp.frequency.setValueAtTime(280, now)
    bp.frequency.exponentialRampToValueAtTime(1600, now + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.12)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
    src.connect(bp)
    bp.connect(g)
    g.connect(this.master)
    src.start()
    src.stop(now + dur)
  }

  blip() {
    if (!this.on || !this.ctx || !this.master) return
    const ctx = this.ctx
    const o = ctx.createOscillator()
    o.type = 'sine'
    const now = ctx.currentTime
    o.frequency.setValueAtTime(660, now)
    o.frequency.exponentialRampToValueAtTime(1180, now + 0.12)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.1, now + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    o.connect(g)
    g.connect(this.master)
    o.start()
    o.stop(now + 0.24)
  }

  get ready() {
    return this.started
  }
}

export const audio = new AudioEngine()
