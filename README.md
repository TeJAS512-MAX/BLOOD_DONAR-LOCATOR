# BloodLink — Every Drop Connects a Life

**AI Prompt Battle 2.0** · Repository: [`TeJAS512-MAX/BLOOD_DONAR-LOCATOR`](https://github.com/TeJAS512-MAX/BLOOD_DONAR-LOCATOR)

Clinical blood donor locator, regional blood bank inventory directory, and hospital requisition coordination platform.

## Clinical Challenge

During trauma resuscitation, surgical procedures, and critical care, locating compatible blood components is frequently delayed by three operational bottlenecks:

1. **Identifying Compatible Donors:** Patient families broadcast single-group appeals and overlook donors whose blood group is medically cross-compatible.
2. **Verifying Blood Bank Inventory:** Caregivers and hospital staff contact multiple centres individually to confirm component availability.
3. **Coordinating Urgent Requisitions:** Unverified requests circulate informally without centralized tracking or confirmed donor dispatch.

## Platform Capabilities

| Clinical Challenge | BloodLink Solution |
| --- | --- |
| Identifying compatible donors | **ABO/Rh Compatibility Registry:** Automated red-cell matching returns all safe donor groups ordered by exact match and proximity, alongside an interactive donor-to-recipient compatibility reference. Personal contact details remain confidential. |
| Verifying blood bank stock | **Regional Inventory Directory:** Displays Packed Red Blood Cell (PRBC) stock across all 8 ABO/Rh groups plus Single-Donor Platelets and Fresh Frozen Plasma reserves, flagging low-stock groups (`≤ 5` units). |
| Coordinating urgent requests | **Verified Requisitions & 2D Dispatch Radar:** Hospital transfusion desks log verified requisitions and use the radial dispatch console (`2 km / 5 km / 10 km`) to lock onto and dispatch compatible donors or reserve blood bank units. |

## Evaluation Walkthrough

1. Select **Priority Dispatch** in the header to lock the radar onto the highest-priority trauma requisition.
2. Select **Dispatch donor to hospital** in the radar panel to route the nearest compatible donor and monitor estimated arrival.
3. In **Active Requisitions**, select **Submit Requisition** to log a new hospital request and immediately scan for compatible donors.
4. In **Donor Registry**, expand the **Transfusion Compatibility Reference** to verify ABO/Rh red-cell compatibility between any donor and recipient group.
5. Inspect **Blood Bank Inventory** and select **Register as Donor** to generate a voluntary donor credential.

## Technology Stack

React 19 · TypeScript · Vite · Three.js (vascular background & regional routing network) · HTML5 Canvas 2D (hospital dispatch radar).

## Run locally

```bash
npm install
npm run dev         # Vite dev server
npm run typecheck   # tsc --noEmit
npm run build       # production build in dist/
```

`vercel.json` pre-configures Vercel (`npm run build`, output `dist/`).

> Prototype: donors, requests and stock figures are sample data. No live hospital, donor or emergency systems are connected.
