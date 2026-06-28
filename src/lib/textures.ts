import * as THREE from 'three'

const cache = new Map<string, THREE.Texture>()

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h
  const n = parseInt(v, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Soft radial-gradient sprite texture — used for body glows and faint nebulae. */
export function glowTexture(color = '#ffffff'): THREE.Texture {
  if (cache.has(color)) return cache.get(color)!
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const [r, g, b] = hexToRgb(color)
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
  grad.addColorStop(0.18, `rgba(${r},${g},${b},0.85)`)
  grad.addColorStop(0.45, `rgba(${r},${g},${b},0.32)`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  cache.set(color, tex)
  return tex
}

/** Diffraction-spike star sprite (soft core + 4-point cross), for bright stars. */
export function spikeTexture(): THREE.Texture {
  const key = '__spike'
  if (cache.has(key)) return cache.get(key)!
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.12, 'rgba(255,255,255,0.6)')
  g.addColorStop(0.45, 'rgba(255,255,255,0)')
  x.fillStyle = g
  x.fillRect(0, 0, s, s)
  x.globalCompositeOperation = 'lighter'
  const vg = x.createLinearGradient(0, 0, 0, s)
  vg.addColorStop(0, 'rgba(255,255,255,0)')
  vg.addColorStop(0.5, 'rgba(255,255,255,0.85)')
  vg.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = vg
  x.fillRect(s / 2 - 1, 0, 2, s)
  const hg = x.createLinearGradient(0, 0, s, 0)
  hg.addColorStop(0, 'rgba(255,255,255,0)')
  hg.addColorStop(0.5, 'rgba(255,255,255,0.85)')
  hg.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = hg
  x.fillRect(0, s / 2 - 1, s, 2)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  cache.set(key, t)
  return t
}

/** Small round star texture for the background field. */
export function starTexture(): THREE.Texture {
  const key = '__star'
  if (cache.has(key)) return cache.get(key)!
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  cache.set(key, tex)
  return tex
}
