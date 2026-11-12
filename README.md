# BloodLink — Every Drop Connects a Life

**AI Prompt Battle 2.0** · Repository: [`TeJAS512-MAX/BLOOD_DONAR-LOCATOR`](https://github.com/TeJAS512-MAX/BLOOD_DONAR-LOCATOR)

Emergency blood coordination for donors, hospitals and blood banks.

## The problem

During emergencies, surgeries and critical treatment, finding suitable blood is slow. Three delays stand between a patient and blood:

1. **Finding a matching donor.** Appeals ask for one exact group and miss donors who are medically compatible.
2. **Locating a blood bank with stock.** Families phone centre after centre to ask what is available.
3. **Coordinating requests in time.** Requests circulate unverified and nobody owns the response.

## How BloodLink solves it

| Problem | BloodLink feature |
| --- | --- |
| Finding a matching donor | **Compatibility search.** ABO/Rh red-cell rules return every safe group, nearest first. Includes a donor → patient compatibility checker. Phone numbers stay private. |
| Locating stock | **Blood bank directory.** Red-cell stock for all 8 groups, plus platelets and plasma. Low stock is flagged and the searched group is highlighted. |
| Coordinating requests | **Verified hospital requests + 2D hospital radar.** A radar sweep around the requesting hospital locks the nearest compatible donor. It can dispatch donors, reserve bank units or reroute a mobile van, and tracks ETA until arrival. |

## Two-minute demo

1. Press **Emergency** in the header. The radar locks onto the most critical request.
2. Press **Dispatch donor**. The donor moves to the hospital on the radar and the ETA counts down until arrival.
3. In **Urgent requests**, press **Post a request**. It appears at once and the radar starts scanning for compatible donors.
4. In **Find donors**, open the **compatibility checker**. It shows why O- can give to A+, but A+ cannot give to O-.
5. Check **Blood banks** for stock, then press **Become a donor** to create a donor pass.

## Tech

React 19 · TypeScript · Vite · Three.js (live background, hero network, blood-component model) · Canvas 2D (hospital radar).

## Run locally

```bash
npm install
npm run dev         # Vite dev server
npm run typecheck   # tsc --noEmit
npm run build       # production build in dist/
```

`vercel.json` pre-configures Vercel (`npm run build`, output `dist/`).

> Prototype: donors, requests and stock figures are sample data. No live hospital, donor or emergency systems are connected.
