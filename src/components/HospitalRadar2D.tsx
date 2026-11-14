import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  COMPATIBILITY_MAP,
  type BloodGroup,
  type BloodRequest,
  type DonorProfile,
  type NetworkPartner,
} from "../data/bloodlinkData";
import { tacticalAudio } from "../utils/tacticalAudio";

type ContactKind = "donor" | "bank";
type ContactFilter = "all" | "compatible" | "donors" | "banks";

interface RadarContact {
  id: string;
  kind: ContactKind;
  label: string;
  detail: string;
  group?: BloodGroup;
  distanceKm: number;
  bearingDeg: number;
  compatible: boolean;
  etaMin: number;
  phoneMasked: string;
}

interface DispatchInfo {
  startedAt: number;
  bearingDeg: number;
  sourceX?: number;
  sourceY?: number;
}

interface PulseWave {
  id: number;
  startedAt: number;
  durationMs: number;
  color: string;
  maxRadiusRatio: number;
}

interface HospitalRadar2DProps {
  requests: BloodRequest[];
  selectedRequestId: string;
  onSelectRequest: (id: string) => void;
  donors: DonorProfile[];
  banks: NetworkPartner[];
  onNotify: (message: string) => void;
}

const RANGE_OPTIONS = [2, 5, 10, 25] as const;
type RangeKm = (typeof RANGE_OPTIONS)[number];

const SWEEP_DEG_PER_SEC = 72; // One smooth rotation every 5s
const DISPATCH_SIM_MS = 24000; // Realistic demo transit duration (24s)

const KIND_LABEL: Record<ContactKind, string> = {
  donor: "Verified Voluntary Donor",
  bank: "Authorized Blood Bank Vault",
};

const COLOR = {
  donorCompat: "#ff2e56",
  donorCompatGlow: "rgba(255, 46, 86, 0.65)",
  donorDim: "#64748b",
  bank: "#00f0ff",
  bankGlow: "rgba(0, 240, 255, 0.55)",
  transitCourier: "#ffb703",
  ringMajor: "rgba(0, 240, 255, 0.42)",
  ringMinor: "rgba(0, 240, 255, 0.16)",
  gridAxis: "rgba(0, 240, 255, 0.28)",
  labelDim: "rgba(148, 163, 184, 0.8)",
  labelBright: "#ffffff",
  sweepBeam: "#00f5d4",
  sweepGlow: "rgba(0, 245, 212, 0.75)",
  centerCitadel: "#ff1a53",
};

function bearingFromId(id: string): number {
  let hash = 7;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (hash * 137) % 360;
}

function getDonorDistance(id: string, index: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const spread = [1.4, 2.3, 3.8, 4.9, 7.2, 9.4, 13.5, 18.2, 22.8];
  return spread[index % spread.length] ?? Number(((hash % 120) / 10 + 1.2).toFixed(1));
}

function getBankDistance(id: string, index: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 37 + id.charCodeAt(i)) >>> 0;
  const spread = [1.9, 3.5, 5.8, 8.4, 11.6, 16.5, 21.2];
  return spread[index % spread.length] ?? Number(((hash % 140) / 10 + 1.5).toFixed(1));
}

function shortName(name: string): string {
  return name.split(" — ")[0];
}

function parseEta(text: string, distanceKm: number): number {
  const minutes = Number.parseInt(text, 10);
  return Number.isFinite(minutes) ? minutes : Math.max(6, Math.round(distanceKm * 4.5));
}

function dispatchProgress(dispatch: DispatchInfo | undefined, nowMs: number): number {
  if (!dispatch) return 0;
  return Math.min(1, Math.max(0, (nowMs - dispatch.startedAt) / DISPATCH_SIM_MS));
}

export function HospitalRadar2D({
  requests,
  selectedRequestId,
  onSelectRequest,
  donors,
  banks,
  onNotify,
}: HospitalRadar2DProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitPointsRef = useRef<{ id: string; x: number; y: number }[]>([]);
  const arrivedRef = useRef<Set<string>>(new Set());
  const pulseWavesRef = useRef<PulseWave[]>([]);
  const waveCounter = useRef(0);
  const notifyRef = useRef(onNotify);
  notifyRef.current = onNotify;

  const [rangeKm, setRangeKm] = useState<RangeKm>(10);
  const [filterMode, setFilterMode] = useState<ContactFilter>("compatible");
  const [lockedId, setLockedId] = useState<string | null>(null);
  const [dispatched, setDispatched] = useState<Record<string, DispatchInfo>>({});
  const [reserved, setReserved] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => Date.now());
  const [simulatedSmsSent, setSimulatedSmsSent] = useState<string | null>(null);

  const request = requests.find((item) => item.id === selectedRequestId) ?? requests[0];
  const hospital = shortName(request.hospital);
  const safeGroups = COMPATIBILITY_MAP[request.group].receiveRedCellsFrom;

  // Add shockwave pulse animation to radar canvas
  const triggerRadarPulse = useCallback((color: string, durationMs = 2800, maxRatio = 1.05) => {
    waveCounter.current += 1;
    const newWave: PulseWave = {
      id: waveCounter.current,
      startedAt: Date.now(),
      durationMs,
      color,
      maxRadiusRatio: maxRatio,
    };
    pulseWavesRef.current = [...pulseWavesRef.current.slice(-4), newWave];
  }, []);

  const contacts = useMemo<RadarContact[]>(() => {
    const safe = COMPATIBILITY_MAP[request.group].receiveRedCellsFrom;
    const hospitalKey = request.hospital.split(" ")[0].toLowerCase();

    const donorContacts: RadarContact[] = donors.map((donor, idx) => {
      const dist = donor.distanceKm ?? getDonorDistance(donor.id, idx);
      const phoneEnd = (1000 + (idx * 317) % 9000).toString();
      return {
        id: donor.id,
        kind: "donor",
        label: donor.name || `Donor ${donor.id} (${donor.location})`,
        detail: `${donor.group} · ${donor.availability} · ${donor.city}`,
        group: donor.group,
        distanceKm: dist,
        bearingDeg: bearingFromId(donor.id),
        compatible: safe.includes(donor.group),
        etaMin: parseEta(donor.responseWindow, dist),
        phoneMasked: `+91 98••• •${phoneEnd}`,
      };
    });

    const bankContacts: RadarContact[] = banks
      .filter((bank) => !bank.name.toLowerCase().startsWith(hospitalKey))
      .map((bank, idx) => {
        const dist = bank.distanceKm ?? getBankDistance(bank.id, idx);
        const units = bank.inventory
          ? safe.reduce((sum, group) => sum + (bank.inventory[group] ?? 0), 0)
          : 14;
        const phoneEnd = (2000 + (idx * 421) % 8000).toString();
        return {
          id: bank.id,
          kind: "bank",
          label: shortName(bank.name),
          detail: `${units} compatible units · ${bank.area}`,
          distanceKm: dist,
          bearingDeg: bearingFromId(bank.id),
          compatible: units > 0,
          etaMin: Math.max(8, Math.round(dist * 4.2)),
          phoneMasked: `+91 80••• •${phoneEnd}`,
        };
      });

    return [...donorContacts, ...bankContacts];
  }, [banks, donors, request.group, request.hospital]);

  const visible = useMemo(() => {
    return contacts
      .filter((contact) => {
        if (contact.distanceKm > rangeKm) return false;
        if (filterMode === "compatible") return contact.compatible;
        if (filterMode === "donors") return contact.kind === "donor";
        if (filterMode === "banks") return contact.kind === "bank";
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [contacts, filterMode, rangeKm]);

  const locked = contacts.find((contact) => contact.id === lockedId) ?? null;
  const compatibleDonorsInRange = visible.filter((c) => c.kind === "donor" && c.compatible).length;
  const activeTransitsCount = Object.values(dispatched).filter(
    (info) => now - info.startedAt < DISPATCH_SIM_MS,
  ).length;

  // Auto-lock nearest compatible on request switch
  useEffect(() => {
    const nearest = contacts
      .filter((contact) => contact.kind === "donor" && contact.compatible && contact.distanceKm <= rangeKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    setLockedId(nearest?.id ?? contacts[0]?.id ?? null);
    setDispatched({});
    setReserved({});
    arrivedRef.current = new Set();
    triggerRadarPulse(COLOR.bank, 2500);
  }, [contacts, rangeKm, selectedRequestId, triggerRadarPulse]);

  const moving = Object.values(dispatched).some((info) => now - info.startedAt < DISPATCH_SIM_MS);

  useEffect(() => {
    if (!moving) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [moving]);

  // Handle contact arrival at hospital
  useEffect(() => {
    for (const [id, info] of Object.entries(dispatched)) {
      if (now - info.startedAt >= DISPATCH_SIM_MS && !arrivedRef.current.has(id)) {
        arrivedRef.current.add(id);
        const contact = contacts.find((item) => item.id === id);
        if (contact) {
          triggerRadarPulse("#10b981", 3200, 1.2);
          notifyRef.current(
            `PRIORITY ARRIVAL: ${contact.label} has arrived at ${hospital} Transfusion Desk. Cold-chain verified.`,
          );
        }
      }
    }
  }, [contacts, dispatched, hospital, now, triggerRadarPulse]);

  // Canvas drawing state reference
  const drawStateRef = useRef({
    contacts,
    rangeKm,
    filterMode,
    lockedId,
    dispatched,
    reserved,
  });
  drawStateRef.current = {
    contacts,
    rangeKm,
    filterMode,
    lockedId,
    dispatched,
    reserved,
  };

  // Main high-tech radar canvas rendering loop
  useEffect(() => {
    const scope = scopeRef.current;
    const canvas = canvasRef.current;
    if (!scope || !canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let size = 0;
    let dpr = 1;
    let onScreen = true;
    let frame = 0;

    const resize = () => {
      size = Math.max(260, Math.floor(scope.clientWidth));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(scope);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
    });
    visibilityObserver.observe(scope);

    const mono = (px: number, weight = 500) => `${weight} ${px}px "IBM Plex Mono", ui-monospace, monospace`;

    const draw = (timeMs: number) => {
      frame = window.requestAnimationFrame(draw);
      if (!onScreen || size === 0) return;

      const state = drawStateRef.current;
      const nowMs = Date.now();
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 34;
      const sweep = reduced ? 45 : ((timeMs / 1000) * SWEEP_DEG_PER_SEC) % 360;

      const polar = (deg: number, r: number): [number, number] => {
        const rad = (deg * Math.PI) / 180;
        return [cx + Math.sin(rad) * r, cy - Math.cos(rad) * r];
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // 1. High-Tech Cybernetic Radar Scope Face
      const face = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.05);
      face.addColorStop(0, "rgba(8, 20, 36, 0.95)");
      face.addColorStop(0.5, "rgba(6, 13, 24, 0.92)");
      face.addColorStop(0.85, "rgba(4, 8, 16, 0.96)");
      face.addColorStop(1, "rgba(2, 4, 10, 0.99)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = face;
      ctx.fill();

      // Subtle hexagonal grid vignette pattern inside scope
      ctx.save();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = cx - radius; x <= cx + radius; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, cy - radius);
        ctx.lineTo(x, cy + radius);
        ctx.stroke();
      }
      for (let y = cy - radius; y <= cy + radius; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(cx - radius, y);
        ctx.lineTo(cx + radius, y);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Active Pulse Shockwaves (SOS broadcast, auto-dispatch, arrivals)
      pulseWavesRef.current = pulseWavesRef.current.filter(
        (wave) => nowMs - wave.startedAt < wave.durationMs,
      );
      for (const wave of pulseWavesRef.current) {
        const elapsed = nowMs - wave.startedAt;
        const progress = Math.min(1, elapsed / wave.durationMs);
        const waveRadius = radius * progress * wave.maxRadiusRatio;
        ctx.save();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 2.5 * (1 - progress);
        ctx.globalAlpha = Math.max(0, (1 - progress) * 0.85);
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 16 * (1 - progress);
        ctx.beginPath();
        ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Concentric Range Rings with Cyber Distance Badges
      const rings = 4;
      for (let i = 1; i <= rings; i += 1) {
        const r = (radius * i) / rings;
        const isOuter = i === rings;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isOuter ? COLOR.ringMajor : COLOR.ringMinor;
        ctx.lineWidth = isOuter ? 1.6 : 1;
        if (!isOuter && i % 2 !== 0) {
          ctx.setLineDash([4, 6]);
        }
        ctx.stroke();
        ctx.restore();

        // Kilometer distance badge
        const kmVal = (state.rangeKm * i) / rings;
        const label = `${Number.isInteger(kmVal) ? kmVal : kmVal.toFixed(1)} km`;

        ctx.save();
        ctx.font = mono(10, 600);
        const textWidth = ctx.measureText(label).width;
        const badgeX = cx + 6;
        const badgeY = cy - r - 4;

        // Dark pill background for crisp readability
        ctx.fillStyle = "rgba(4, 9, 20, 0.75)";
        ctx.fillRect(badgeX - 3, badgeY - 11, textWidth + 6, 14);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(badgeX - 3, badgeY - 11, textWidth + 6, 14);

        ctx.fillStyle = isOuter ? COLOR.labelBright : COLOR.labelDim;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(label, badgeX, badgeY - 4);
        ctx.restore();
      }

      // 4. Precision Crosshair Axes and Diagonals
      ctx.save();
      ctx.strokeStyle = COLOR.gridAxis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Micro tick marks along crosshairs
      for (let offset = -radius; offset <= radius; offset += 20) {
        if (Math.abs(offset) > 10) {
          ctx.beginPath();
          ctx.moveTo(cx + offset, cy - 3);
          ctx.lineTo(cx + offset, cy + 3);
          ctx.moveTo(cx - 3, cy + offset);
          ctx.lineTo(cx + 3, cy + offset);
          ctx.stroke();
        }
      }

      // 45-degree tactical dashed diagonals
      ctx.setLineDash([2, 8]);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
      for (const deg of [45, 135]) {
        const [x1, y1] = polar(deg, radius);
        const [x2, y2] = polar(deg + 180, radius);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Azimuth Micro-Ticks and Cardinal Headings
      for (let deg = 0; deg < 360; deg += 5) {
        const isMajor = deg % 30 === 0;
        const isCardinal = deg % 90 === 0;
        const tickLen = isCardinal ? 12 : isMajor ? 8 : 4;
        const [x1, y1] = polar(deg, radius);
        const [x2, y2] = polar(deg, radius - tickLen);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isCardinal ? COLOR.ringMajor : isMajor ? "rgba(0, 240, 255, 0.35)" : "rgba(0, 240, 255, 0.15)";
        ctx.lineWidth = isCardinal ? 1.8 : 1;
        ctx.stroke();
        ctx.restore();

        if (isMajor) {
          const [lx, ly] = polar(deg, radius + 16);
          ctx.save();
          ctx.fillStyle = isCardinal ? COLOR.labelBright : COLOR.labelDim;
          ctx.font = mono(isCardinal ? 12 : 9.5, isCardinal ? 700 : 500);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const headingLabel = isCardinal ? ["N", "E", "S", "W"][deg / 90] : String(deg).padStart(3, "0");
          ctx.fillText(headingLabel, lx, ly);
          ctx.restore();
        }
      }

      // 6. Dual-Sweep Radar Beam with Phosphor Trail
      const trailDeg = 72;
      const sweepRad = (sweep * Math.PI) / 180;
      const endRad = sweepRad - Math.PI / 2;
      const startRad = endRad - (trailDeg * Math.PI) / 180;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startRad, endRad);
      ctx.closePath();

      if (typeof ctx.createConicGradient === "function") {
        const conic = ctx.createConicGradient(startRad, cx, cy);
        const frac = trailDeg / 360;
        conic.addColorStop(0, "rgba(0, 245, 212, 0)");
        conic.addColorStop(frac * 0.7, "rgba(0, 245, 212, 0.18)");
        conic.addColorStop(frac, "rgba(0, 245, 212, 0.42)");
        conic.addColorStop(Math.min(1, frac + 0.002), "rgba(0, 245, 212, 0)");
        conic.addColorStop(1, "rgba(0, 245, 212, 0)");
        ctx.fillStyle = conic;
      } else {
        ctx.fillStyle = "rgba(0, 245, 212, 0.25)";
      }
      ctx.fill();
      ctx.restore();

      // Primary Laser Sweep Line
      const [sx, sy] = polar(sweep, radius);
      ctx.save();
      ctx.strokeStyle = COLOR.sweepBeam;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = COLOR.sweepGlow;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.restore();

      // 7. Interactive Contacts & Green Corridor Priority Transit
      const hits: { id: string; x: number; y: number }[] = [];
      let lockedCoords: { x: number; y: number } | null = null;

      for (const contact of state.contacts) {
        if (contact.distanceKm > state.rangeKm) continue;
        if (state.filterMode === "compatible" && !contact.compatible) continue;
        if (state.filterMode === "donors" && contact.kind !== "donor") continue;
        if (state.filterMode === "banks" && contact.kind !== "bank") continue;

        const dispatch = state.dispatched[contact.id];
        const progress = dispatchProgress(dispatch, nowMs);
        const isDispatched = dispatch !== undefined;
        const hasArrived = progress >= 1;

        // Bearing and coordinates
        const bearing = contact.bearingDeg;
        const initialR = (contact.distanceKm / state.rangeKm) * radius;

        // When dispatched, courier moves toward central hospital
        const currentR = isDispatched ? initialR * (1 - progress) : initialR;
        const [x, y] = polar(bearing, currentR);
        const [ox, oy] = polar(bearing, initialR);

        const isLocked = contact.id === state.lockedId;
        const sinceSweep = (((sweep - bearing) % 360) + 360) % 360;
        const sweepGlow = reduced || isDispatched ? 1 : Math.max(0.35, 1 - sinceSweep / 300);

        const color =
          contact.kind === "bank"
            ? COLOR.bank
            : contact.compatible
              ? COLOR.donorCompat
              : COLOR.donorDim;

        // 7a. Draw "Green Corridor" Transit Line when Dispatched
        if (isDispatched && !hasArrived) {
          ctx.save();
          // Glowing curved transit laser track
          const midX = (ox + cx) / 2 + (oy - cy) * 0.12;
          const midY = (oy + cy) / 2 - (ox - cx) * 0.12;

          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.quadraticCurveTo(midX, midY, cx, cy);
          ctx.strokeStyle = "rgba(0, 245, 212, 0.35)";
          ctx.lineWidth = 3;
          ctx.stroke();

          // Animated flowing dash line
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.quadraticCurveTo(midX, midY, cx, cy);
          ctx.strokeStyle = "#00f5d4";
          ctx.lineWidth = 1.8;
          ctx.setLineDash([6, 8]);
          ctx.lineDashOffset = -timeMs * 0.04;
          ctx.stroke();

          // Vehicle Courier Marker
          ctx.fillStyle = COLOR.transitCourier;
          ctx.shadowColor = COLOR.transitCourier;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();

          // Courier badge
          ctx.font = mono(9.5, 700);
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 4;
          ctx.fillText("EN ROUTE", x + 10, y - 8);
          ctx.restore();
        }

        // 7b. Phosphor Sweep Ripple when Beam Hits Contact
        if (!reduced && sinceSweep < 20) {
          ctx.save();
          const rippleFrac = sinceSweep / 20;
          ctx.globalAlpha = (1 - rippleFrac) * 0.9;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(x, y, 6 + rippleFrac * 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // 7c. Contact Glyph (Donor or Blood Bank)
        ctx.save();
        ctx.globalAlpha = sweepGlow;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isLocked ? 20 : 10 * sweepGlow;

        if (contact.kind === "bank") {
          // Hexagon / diamond vault glyph
          const sizeHex = isLocked ? 8 : 6;
          ctx.beginPath();
          ctx.moveTo(x, y - sizeHex);
          ctx.lineTo(x + sizeHex, y);
          ctx.lineTo(x, y + sizeHex);
          ctx.lineTo(x - sizeHex, y);
          ctx.closePath();
          ctx.fill();
        } else {
          // Blood donor circular arterial beacon
          ctx.beginPath();
          ctx.arc(x, y, isLocked ? 7 : 5.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 7d. Crisp High-Tech Blood Group Pill Badge on Canvas
        ctx.save();
        ctx.globalAlpha = Math.max(0.65, sweepGlow);
        if (contact.kind === "donor" && contact.group) {
          const pillText = contact.group;
          ctx.font = mono(10, 700);
          const tw = ctx.measureText(pillText).width;
          const pw = tw + 8;
          const ph = 16;
          const px = x + 8;
          const py = y - ph / 2;

          ctx.fillStyle = contact.compatible ? "rgba(225, 29, 72, 0.92)" : "rgba(30, 41, 59, 0.85)";
          ctx.strokeStyle = contact.compatible ? "rgba(255, 110, 140, 0.8)" : "rgba(100, 116, 139, 0.6)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(px, py, pw, ph, 4);
          } else {
            ctx.rect(px, py, pw, ph);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pillText, px + pw / 2, py + ph / 2);
        } else if (contact.kind === "bank") {
          const bankText = "VAIN-BK";
          ctx.font = mono(9.5, 700);
          const tw = ctx.measureText(bankText).width;
          const pw = tw + 8;
          const ph = 15;
          const px = x + 8;
          const py = y - ph / 2;

          ctx.fillStyle = "rgba(0, 240, 255, 0.22)";
          ctx.strokeStyle = "rgba(0, 240, 255, 0.85)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(px, py, pw, ph, 3);
          } else {
            ctx.rect(px, py, pw, ph);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#00f0ff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(bankText, px + pw / 2, py + ph / 2);
        }
        ctx.restore();

        hits.push({ id: contact.id, x, y });
        if (isLocked) lockedCoords = { x, y };
      }
      hitPointsRef.current = hits;

      // 8. Central Hospital Citadel Beacon
      ctx.save();
      // Pulsing rescue shockwave around hospital
      const pulsePhase = (timeMs % 2000) / 2000;
      ctx.strokeStyle = "rgba(255, 26, 83, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + pulsePhase * 18, 0, Math.PI * 2);
      ctx.globalAlpha = 1 - pulsePhase;
      ctx.stroke();

      // Main citadel hub
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLOR.centerCitadel;
      ctx.shadowColor = COLOR.centerCitadel;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.fill();

      // White clinical medical cross
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 0;
      ctx.fillRect(cx - 2.2, cy - 7, 4.4, 14);
      ctx.fillRect(cx - 7, cy - 2.2, 14, 4.4);
      ctx.restore();

      // 9. Cyber Holographic Target Lock Reticle
      if (lockedCoords) {
        const { x, y } = lockedCoords;
        const box = 15;
        const arm = 6;

        ctx.save();
        // Laser targeting vector line from hospital to target
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Animated target lock brackets
        ctx.setLineDash([]);
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 12;

        for (const [dx, dy] of [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]) {
          ctx.beginPath();
          ctx.moveTo(x + dx * box, y + dy * (box - arm));
          ctx.lineTo(x + dx * box, y + dy * box);
          ctx.lineTo(x + dx * (box - arm), y + dy * box);
          ctx.stroke();
        }

        // Center reticle point
        ctx.fillStyle = "#00f0ff";
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [triggerRadarPulse]);

  // Click on radar canvas to lock contact
  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    let best: string | null = null;
    let bestDistance = 26;
    for (const point of hitPointsRef.current) {
      const distance = Math.hypot(point.x - px, point.y - py);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = point.id;
      }
    }
    if (best) {
      setLockedId(best);
      triggerRadarPulse(COLOR.bank, 1400, 0.6);
      tacticalAudio.playBlip(900);
    }
  };

  const remainingMinutes = (contact: RadarContact): number | null => {
    const dispatch = dispatched[contact.id];
    if (!dispatch) return null;
    const progress = dispatchProgress(dispatch, now);
    return progress >= 1 ? 0 : Math.max(1, Math.ceil(contact.etaMin * (1 - progress)));
  };

  const statusFor = (contact: RadarContact): string | null => {
    const remaining = remainingMinutes(contact);
    if (remaining !== null) return remaining === 0 ? "Arrived" : `Dispatched · ${remaining} min`;
    if (reserved[contact.id]) return "Reserved";
    return null;
  };

  const dispatchContact = (contact: RadarContact) => {
    tacticalAudio.playDispatchChime();
    const bearing = contact.bearingDeg;
    const startedAt = Date.now();
    setDispatched((prev) => ({ ...prev, [contact.id]: { startedAt, bearingDeg: bearing } }));
    setNow(startedAt);
    triggerRadarPulse(COLOR.transitCourier, 3200, 1.15);
    notifyRef.current(
      `PRIORITY TRANSIT ACTIVE: ${contact.label} dispatched to ${hospital}. Real-time beacon locked.`,
    );
  };

  const reserveFromBank = (contact: RadarContact) => {
    tacticalAudio.playBlip(720);
    setReserved((prev) => ({ ...prev, [contact.id]: true }));
    triggerRadarPulse(COLOR.bank, 2200, 0.9);
    notifyRef.current(
      `COLD-CHAIN LOCK: ${request.units} of ${request.group}-compatible units reserved at ${contact.label}.`,
    );
  };

  // AI Fast-Match Auto-Dispatch
  const handleAutoDispatchNearest = () => {
    const candidate = visible.find((c) => c.compatible && !dispatched[c.id]);
    if (!candidate) {
      notifyRef.current("No undispatched compatible donors or banks currently in selected perimeter.");
      return;
    }
    setLockedId(candidate.id);
    if (candidate.kind === "donor") {
      dispatchContact(candidate);
    } else {
      reserveFromBank(candidate);
    }
  };

  // Emergency SOS Radial Broadcast
  const handleBroadcastSOS = () => {
    tacticalAudio.playSosAlert();
    triggerRadarPulse("#ff1f4b", 4000, 1.3);
    const count = visible.filter((c) => c.compatible && c.kind === "donor").length;
    notifyRef.current(
      `EMERGENCY BROADCAST: Priority requisition broadcast to ${count} compatible Group ${request.group} donors within ${rangeKm} km radius.`,
    );
  };

  // Simulate Direct SMS Dispatch Relay
  const handleSimulateSms = (contact: RadarContact) => {
    tacticalAudio.playClick(950);
    setSimulatedSmsSent(contact.id);
    notifyRef.current(
      `SMS DISPATCH TRANSMITTED to ${contact.label} (${contact.phoneMasked}): "URGENT BloodLink Requisition: Group ${request.group} required at ${hospital}. Emergency token generated."`,
    );
    window.setTimeout(() => setSimulatedSmsSent(null), 4000);
  };

  const renderAction = (contact: RadarContact) => {
    const remaining = remainingMinutes(contact);
    if (contact.kind === "bank") {
      return reserved[contact.id] ? (
        <button type="button" className="btn btn-glass" disabled>
          Units Reserved at Vault
        </button>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => reserveFromBank(contact)}>
          Reserve {request.units.toLowerCase()} at Bank
        </button>
      );
    }
    if (contact.kind === "donor" && !contact.compatible) {
      return (
        <button type="button" className="btn btn-glass" disabled>
          Incompatible with Group {request.group}
        </button>
      );
    }
    if (remaining !== null) {
      return (
        <button type="button" className="btn btn-glass" disabled>
          {remaining === 0 ? `Arrived at ${hospital}` : `Transit Active · ${remaining}m remaining`}
        </button>
      );
    }
    return (
      <button type="button" className="btn btn-primary" onClick={() => dispatchContact(contact)}>
        Dispatch Donor (Priority Corridor)
      </button>
    );
  };

  const lockedRemaining = locked ? remainingMinutes(locked) : null;
  const lockedProgress = locked && dispatched[locked.id] ? dispatchProgress(dispatched[locked.id], now) : 0;

  return (
    <div className="radar-shell glass">
      {/* LEFT COLUMN: Modern Tactical Radar Scope with HUD */}
      <div className="radar-scope-col">
        <div className="radar-scope" ref={scopeRef}>
          <canvas
            ref={canvasRef}
            className="radar-canvas"
            role="img"
            aria-label={`Tactical Radar around ${hospital}: ${compatibleDonorsInRange} compatible donors within ${rangeKm} km perimeter.`}
            onPointerDown={handlePointerDown}
          />

          {/* Holographic HUD Overlays */}
          <div className="radar-hud is-tl">
            <span>EPICENTER COMMAND</span>
            <strong>{hospital}</strong>
            <small className="hud-sub">LAT 12.9716° N · LON 77.5946° E</small>
          </div>

          <div className="radar-hud is-tr">
            <span>SCAN PERIMETER</span>
            <strong>
              {rangeKm} km · {compatibleDonorsInRange} COMPATIBLE
            </strong>
            <small className="hud-sub">ABO/Rh MATCHED</small>
          </div>

          {activeTransitsCount > 0 && (
            <div className="radar-hud is-bl">
              <span className="pulse-alert">
                <span className="pulse-dot" /> GREEN CORRIDOR ACTIVE
              </span>
              <strong>{activeTransitsCount} COURIER EN ROUTE</strong>
            </div>
          )}

          <div className="radar-hud is-br">
            <span>AZIMUTH SWEEP</span>
            <strong>72°/s DUAL RADAR</strong>
          </div>
        </div>

        {/* Legend */}
        <div className="radar-legend" aria-hidden="true">
          <span className="legend-item">
            <span className="glyph is-donor" />
            Compatible Donor
          </span>
          <span className="legend-item">
            <span className="glyph is-donor is-dim" />
            Non-Compatible
          </span>
          <span className="legend-item">
            <span className="glyph is-bank" />
            Blood Bank Vault
          </span>
          <span className="legend-item">
            <span className="glyph is-courier" />
            Active Transit Courier
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Requisition Command & Tactical Dispatch Console */}
      <div className="radar-panel">
        {/* Requisition Spec */}
        <div className="radar-request">
          <div className="panel-header-row">
            <label className="panel-label" htmlFor="radar-request">
              Active Hospital Requisition
            </label>
            <span className={`priority-tag is-${request.priority.toLowerCase()}`}>
              <span className="pulse-dot" /> {request.priority} Emergency
            </span>
          </div>

          <select
            id="radar-request"
            className="input"
            value={request.id}
            onChange={(event) => onSelectRequest(event.target.value)}
          >
            {requests.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · Group {item.group} · {shortName(item.hospital)} ({item.priority})
              </option>
            ))}
          </select>

          <div className="radar-request-summary">
            <span className="group-badge is-lg">{request.group}</span>
            <div className="request-summary-meta">
              <strong>
                {request.units} · {request.componentNeeded}
              </strong>
              <span>{request.need}</span>
              <span className="attending-note">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "inline", verticalAlign: "-1px", marginRight: "4px" }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {request.attendingDesk}
              </span>
            </div>
          </div>

          <p className="radar-safe">
            ABO/Rh Safe Donor Groups: <b>{safeGroups.join("   ")}</b>
          </p>
        </div>

        {/* Tactical Controls & AI Auto-Triage Bar */}
        <div className="radar-controls-stack">
          <div className="radar-controls">
            <div className="segmented" role="group" aria-label="Radar perimeter range">
              {RANGE_OPTIONS.map((km) => (
                <button
                  key={km}
                  type="button"
                  aria-pressed={rangeKm === km}
                  onClick={() => {
                    tacticalAudio.playClick(1200);
                    setRangeKm(km);
                    triggerRadarPulse(COLOR.bank, 1800);
                  }}
                >
                  {km} km
                </button>
              ))}
            </div>

            <div className="filter-chips" role="group" aria-label="Filter radar contacts">
              {(
                [
                  { id: "compatible", label: "Compatible" },
                  { id: "all", label: "All" },
                  { id: "donors", label: "Donors" },
                  { id: "banks", label: "Banks" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`toggle-chip ${filterMode === f.id ? "is-active" : ""}`}
                  aria-pressed={filterMode === f.id}
                  onClick={() => {
                    tacticalAudio.playClick(1300);
                    setFilterMode(f.id);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Tactical Action Buttons */}
          <div className="tactical-actions-row">
            <button
              type="button"
              className="btn btn-action btn-auto-match"
              onClick={handleAutoDispatchNearest}
            >
              <span className="btn-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span> AI Fast-Match Auto-Dispatch
            </button>
            <button
              type="button"
              className="btn btn-action btn-broadcast-sos"
              onClick={handleBroadcastSOS}
            >
              <span className="btn-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span> Broadcast Radial SOS
            </button>
          </div>
        </div>

        {/* Selected Contact Telemetry Inspector (Lock Card) */}
        {locked ? (
          <div className="lock-card" aria-live="polite">
            <div className="lock-head">
              <span className="panel-label">TARGET TELEMETRY</span>
              <span className={`kind-tag is-${locked.kind}`}>
                {KIND_LABEL[locked.kind]}
                {locked.group ? ` · Group ${locked.group}` : ""}
              </span>
            </div>

            <h3>{locked.label}</h3>
            <p className="lock-detail">{locked.detail}</p>

            <dl className="lock-stats">
              <div>
                <dt>Radial Distance</dt>
                <dd>{locked.distanceKm} km</dd>
              </div>
              <div>
                <dt>Est. Arrival</dt>
                <dd>
                  {lockedRemaining === null
                    ? `${locked.etaMin} min`
                    : lockedRemaining === 0
                      ? "Arrived"
                      : `${lockedRemaining} min`}
                </dd>
              </div>
              <div>
                <dt>Compass Azimuth</dt>
                <dd>{`${String(Math.round(locked.bearingDeg)).padStart(3, "0")}°`}</dd>
              </div>
            </dl>

            {/* En Route Live Progress Bar */}
            {dispatched[locked.id] && (
              <div className="transit-progress-box">
                <div className="transit-progress-labels">
                  <span>Green Corridor Priority Transit</span>
                  <strong>{Math.round(lockedProgress * 100)}%</strong>
                </div>
                <div className="transit-bar">
                  <div className="transit-fill" style={{ width: `${Math.round(lockedProgress * 100)}%` }} />
                </div>
              </div>
            )}

            <div className="lock-actions-stack">
              {renderAction(locked)}
              <button
                type="button"
                className="btn btn-glass btn-sms-relay"
                onClick={() => handleSimulateSms(locked)}
                disabled={simulatedSmsSent === locked.id}
              >
                {simulatedSmsSent === locked.id ? "SMS Signal Transmitted" : `Direct SMS Relay (${locked.phoneMasked})`}
              </button>
            </div>
          </div>
        ) : (
          <p className="radar-empty">Click any blip on the radar scope or select a contact below to inspect telemetry.</p>
        )}

        {/* Scrollable Contacts Feed */}
        <div className="contact-block">
          <div className="contact-header">
            <span className="panel-label">Verified Contacts in {rangeKm} km Perimeter ({visible.length})</span>
          </div>

          {visible.length > 0 ? (
            <ul className="contact-list">
              {visible.map((contact) => {
                const status = statusFor(contact);
                const isLocked = contact.id === lockedId;
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      className={`contact-row ${isLocked ? "is-locked" : ""}`}
                      aria-pressed={isLocked}
                      onClick={() => {
                        setLockedId(contact.id);
                        triggerRadarPulse(COLOR.bank, 1400, 0.5);
                      }}
                    >
                      <span
                        className={`glyph is-${contact.kind} ${
                          contact.kind === "donor" && !contact.compatible ? "is-dim" : ""
                        }`}
                        aria-hidden="true"
                      />
                      <span className="contact-main">
                        <strong className="contact-title">{contact.label}</strong>
                        <small className="contact-sub">{contact.detail}</small>
                      </span>
                      <span className={`contact-dist ${status ? "is-status" : ""}`}>
                        {status ?? `${contact.distanceKm} km`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="radar-empty">No contacts detected in {rangeKm} km perimeter. Expand range to 25 km.</p>
          )}
        </div>
      </div>
    </div>
  );
}
