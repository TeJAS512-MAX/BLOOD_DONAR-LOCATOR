# BloodLink — Every Drop Connects a Life

**AI Prompt Battle 2.0 Prototype** · Repository: [`TeJAS512-MAX/BLOOD_DONAR-LOCATOR`](https://github.com/TeJAS512-MAX/BLOOD_DONAR-LOCATOR)

> **Concept Prototype Safety Note:** BloodLink is an interactive UI/UX, Three.js 3D WebGL, and motion-graphics prototype. All donor profiles, urgent requests, readiness checks, and hospital/blood-bank listings are illustrative demonstrations — no live donor matching, medical records, or emergency services are connected.

## Problem Statement

During medical emergencies, surgeries, and critical treatments, finding suitable blood donors can be difficult. People often struggle to identify available donors, locate verified blood banks, and coordinate donation requests quickly.

## Implemented Architecture & Solutions

- **Sticky Glassmorphism Navbar (`z-50`)**: Responsive navigation bar with demo volunteer Login and Become a Donor CTA.
- **60/40 Hero with Live 3D Blood Connection Network (`src/components/HeroBloodstream3D.tsx`)**: Biological textured erythrocytes with Fresnel subsurface rim scatter, 3D donor/blood-bank/hospital nodes, glowing arterial arcs, round bokeh particles, 360° drag-to-orbit, and click-to-pulse waves.
- **Floating "Find a Donor" Bridge (`z-40`, `-60px` overlap)**: Single-row search across Blood Group, City/Geolocate demo, and Urgency Level, with **Smart Compatibility Matching** (exact + ABO/Rh compatible red-cell donors) and privacy-shielded profiles.
- **Urgent Blood Requests Carousel**: Horizontal scroll-snap cards (`scroll-snap-type: x mandatory`) with pulsing live dot, shimmer skeleton sync loader, 1-click **Accept & Match Compatible Donors**, and a **Raise a Demo Request** hospital intake simulator.
- **How It Works (3-Column Grid + SVG Connectors)**: Borderless step cards connected by dotted SVG arcs + 4-part Problem-to-Solution matrix strip.
- **Midnight Blue 50/50 Network Directory & 3D Topology (`src/components/NetworkTopology3D.tsx`)**: Custom-scrollable verified list synced with an interactive Three.js 3D map featuring Blue Blood Bank markers and Red Hospital markers.
- **Donation Awareness 4×2 Bento Box + 60fps Motion Film (`src/components/MotionVideoReel.tsx`)**: Interactive Readiness Self-Check widget, Myth vs. Fact slider, Quick Prep Tips, and a 4-chapter procedural `<canvas>` motion film modal with fullscreen cinema mode.
- **Our Impact (`IntersectionObserver` CountUp + `ImpactOrbit3D.tsx`)**: 4-column animated metrics + interactive 3D Red Cells, Plasma, and Platelets separation simulator (`1–50` units).
- **Pre-Footer CTA & 4-Column Footer**: Gradient CTA card, demo newsletter subscription with toast alerts, and GitHub/social links.

## Local Development & Vercel Deployment

```bash
npm install
npm run dev         # Start local Vite dev server (http://localhost:5173)
npm run typecheck   # Run TypeScript strict typecheck (tsc --noEmit)
npm run build       # Build production dist/ bundle
```

Import [`TeJAS512-MAX/BLOOD_DONAR-LOCATOR`](https://github.com/TeJAS512-MAX/BLOOD_DONAR-LOCATOR) at [vercel.com/new](https://vercel.com/new) — `vercel.json` pre-configures Vite (`npm run build`, output `dist/`).
