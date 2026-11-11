# BloodLink — Every Drop Connects a Life

**AI Prompt Battle 2.0 Prototype** · Repository: [`TeJAS512-MAX/BLOOD_DONAR-LOCATOR`](https://github.com/TeJAS512-MAX/BLOOD_DONAR-LOCATOR)

> **Concept Prototype Safety Note:** BloodLink is an interactive UI/UX, 3D WebGL, and motion-graphics prototype. All donor profiles, urgent requests, readiness checks, and hospital/blood-bank listings are illustrative demonstrations — no live donor matching, medical records, or emergency services are connected.

## Problem Statement

During medical emergencies, surgeries, and critical treatments, finding suitable blood donors can be difficult. People often struggle to identify available donors, locate verified blood banks, and coordinate donation requests quickly.

## What BloodLink Demonstrates

1. **Live 3D WebGL Bloodstream Macro-World** (`src/components/HeroBloodstream3D.tsx`): Real-time Three.js biconcave erythrocytes (Evans & Fung parametric geometry), 34 instanced flowing cells, curved arterial signal filaments, traveling beacon nodes, 360° drag-to-orbit, click-to-pulse shockwaves, **Boost Flow**, and **Full 3D View** exploration mode.
2. **Problem Statement & 60fps Motion Video Graphics Film** (`src/components/MotionVideoReel.tsx`): Interactive 4-chapter procedural canvas motion reel (`The Crisis`, `Fragmentation`, `BloodLink Signal`, `Every Drop Connects`) with a 3D depth plasma starfield, timeline scrubbing, `1x`/`1.5x` speed control, **Fullscreen** cinema mode, and optional Web Audio pulse soundscape.
3. **Find a Donor & Red-Cell Compatibility Explorer**: Filterable sample donor directory plus an interactive ABO/Rh donation & recipient compatibility explorer (`O-` through `AB+`).
4. **Urgent Blood Requests**: Priority-filterable demonstration request feed with hospital-verification workflow preview modal and one-click transfer into donor search.
5. **Blood Bank Network + 3D Spatial Topology** (`src/components/NetworkTopology3D.tsx`): Interactive Three.js 3D partner beacon map with animated supply corridors synchronized with a searchable hospital and blood-bank directory.
6. **Donation Awareness**: Three-tab guide featuring an accessible **Donation Guide** accordion, **Myths vs. Facts**, and an interactive 4-step **Readiness Check**.
7. **Our Impact — Live 3D Component Separation** (`src/components/ImpactOrbit3D.tsx`): Interactive Three.js 3D orbit separating whole blood into Red Blood Cells, Plasma, and Platelets with a community donation simulator (`1–50` donations).
8. **Become a Donor Flow & Challenge Brief**: Accessible registration modal generating an illustrative digital **BloodLink Concept Pass**, plus a footer **Challenge Brief** dialog.

## Local Development

```bash
npm install
npm run dev         # Start local Vite dev server (http://localhost:5173)
npm run typecheck   # Run TypeScript strict typecheck (tsc --noEmit)
npm run build       # Build production dist/ bundle
```

## Deploying to Vercel

1. Push the project to [`TeJAS512-MAX/BLOOD_DONAR-LOCATOR`](https://github.com/TeJAS512-MAX/BLOOD_DONAR-LOCATOR).
2. Import the repository at [vercel.com/new](https://vercel.com/new) — `vercel.json` pre-configures Vite (`npm run build`, output `dist/`, and SPA rewrites).
3. Or deploy directly from the workspace with `npx vercel --prod`.
