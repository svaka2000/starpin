<div align="center">

# 🪐 Starpin

### Plan voyages across a living universe.

Drop pins on **real** planets, moons, stars, exoplanets, nebulae and galaxies — chain them into an
interstellar voyage, pick a propulsion system, and watch the real light‑years and travel‑times unfold
on a living 3D cosmos.

**Built for [Stardance](https://stardance.hackclub.com) — the NASA × Hack Club summer challenge.**

[**▶ Live demo**](https://starpin.vercel.app) · [What is Stardance?](https://stardance.hackclub.com)

![Starpin — the living cosmos](docs/cosmos.png)

</div>

---

## ✨ What it is

[Wanderpin](https://wanderpin-ecru.vercel.app) lets you plan trips on a living globe. **Starpin is the same idea,
scaled up to the whole universe.** Instead of cities you pin worlds; instead of trains and flights you pick
a spacecraft; instead of kilometres you cross light‑years.

Every destination uses **real astronomical data** — sky coordinates (RA/Dec), distances from Earth, and facts
sourced from NASA fact sheets, the NASA Exoplanet Archive, Hubble/JWST imaging, and SIMBAD/Gaia.

## 🚀 Features

- **A living 3D cosmos** — a hand‑built three.js universe: the Sun and planets on orbital rings, a deep
  starfield, drifting nebulae, and 45 real destinations placed in their true sky directions.
- **Three views**, mirroring a map app's Globe / 3D / 2D:
  - **Cosmos** — the whole sky, log‑scaled so the Moon and the Andromeda Galaxy are both reachable.
  - **Orrery** — a focused, slowly‑orbiting Solar System.
  - **Sky Map** — a flat right‑ascension × declination star chart.
- **Build a voyage** — click any world to inspect it (facts + NASA stats) and add it to your route.
- **Real travel‑times** — choose a propulsion system and every leg recomputes:
  ✈️ airliner → 🛰️ Voyager 1 → ☄️ Parker Solar Probe → ⚛️ fusion ship → ✨ light speed → 🌀 warp.
  A trip to Andromeda at Voyager speed takes longer than the universe has existed. Light speed barely helps.
- **Optimize, share, export** — nearest‑neighbour route optimization, shareable URLs, and JSON / mission‑plan
  exports.
- **Curated journeys** — the Grand Tour of the Solar System, Voyager's path, the hunt for Earth 2.0,
  JWST's greatest hits, a deep‑sky marathon, and a ride to the edge of the sky.

## 🔭 The science

Distances and travel‑times are **real**. The visual map is log‑compressed so a 1‑light‑second hop to the Moon
and a 290‑million‑light‑year jump to Stephan's Quintet can coexist on one screen — but the numbers in the
panel are computed from true 3D positions:

- Deep‑sky objects are placed by their real **right ascension / declination** and distance from Earth.
- Each leg's length is the straight‑line distance between two bodies in light‑years; travel time is
  `distance ÷ propulsion speed`, formatted from seconds up to gigayears.

> Distances within the Solar System use a fixed positional snapshot (planets actually move), so Earth→Mars is a
> representative ~1.7 AU rather than a specific date's value. Interstellar distances are exact.

**Data sources:** NASA Planetary Fact Sheets (nssdc.gsfc.nasa.gov), NASA Exoplanet Archive, NASA/Hubble/JWST
mission pages, ESA Gaia, and SIMBAD. Every body lists its source in the inspector.

## 🛠️ Tech

React 19 · TypeScript · Vite · **three.js** + React‑Three‑Fiber + drei · Tailwind CSS · Framer Motion ·
Zustand. No backend — it's all in the browser, voyages persist to `localStorage` and to shareable URLs.

## ▶ Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## 📁 Structure

```
src/
  data/cosmos.ts     # the curated, fact-checked catalogue of 45 destinations + preset journeys
  lib/astro.ts       # coordinate math, distance & travel-time engine, formatting
  lib/voyage.ts      # per-leg distance/time computation
  three/             # the 3D scene: Starfield, Bodies, VoyageRoute, CameraRig, CosmosScene
  ui/                # Toolbar, Onboarding, VoyagePanel, Inspector, SkyChart
  store/useVoyage.ts # Zustand state (stops, view, propulsion, playback)
```

## 📝 License

MIT © 2026 Samarth Vaka — open source, as Stardance requires. Fork it, remix it, fly somewhere new.

<div align="center">
Made with ✦ for Stardance.
</div>
