import type { SVGProps } from 'react'

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export const Search = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
)
export const Shuffle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="m15 15 6 6" /><path d="M4 4l5 5" /></svg>
)
export const Orbit = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="2.5" /><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(35 12 12)" /></svg>
)
export const GlobeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></svg>
)
export const MapIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></svg>
)
export const Compass = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg>
)
export const Share = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" /></svg>
)
export const Play = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 4.5v15l13-7.5-13-7.5Z" /></svg>
)
export const Pause = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M7 4v16M17 4v16" /></svg>
)
export const Panel = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></svg>
)
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const Trash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
)
export const X = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const Rocket = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" /><path d="M14.5 4.5C9 7 7 12 7 12l5 5s5-2 7.5-7.5C20.5 6 18 3.5 14.5 4.5Z" /><circle cx="14.5" cy="9.5" r="1.6" /></svg>
)
export const ChevronUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m6 15 6-6 6 6" /></svg>
)
export const ChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
)
export const Download = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 19h14" /></svg>
)
export const Sparkle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" /></svg>
)
export const Heart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 20s-7-4.5-9.3-9C1 7.5 3 4.5 6 4.5c2 0 3 1.2 3.7 2.2.7-1 1.7-2.2 3.7-2.2 3 0 5 3 3.3 6.5C19 15.5 12 20 12 20Z" /></svg>
)
export const Wand = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 19 19 5" /><path d="M15 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" /></svg>
)
export const Telescope = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m3 13 6-2 1.5 3-6 2L3 13Z" /><path d="m9 11 8-4 2 4-8 4" /><path d="M13 16v5M11 21h4" /></svg>
)
export const Scale = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="12" r="5.5" /><circle cx="12" cy="12" r="1.6" /></svg>
)
export const Volume = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8 8 0 0 1 0 12" /></svg>
)
export const VolumeOff = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="m17 9 4 4m0-4-4 4" /></svg>
)
export const Music = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>
)
