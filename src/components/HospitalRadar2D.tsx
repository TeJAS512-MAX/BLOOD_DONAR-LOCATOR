import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  COMPATIBILITY_MAP,
  type BloodGroup,
  type BloodRequest,
  type DonorProfile,
  type NetworkPartner,
} from "../data/bloodlinkData";

type ContactKind = "donor" | "bank";

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
}

interface DispatchInfo {
  startedAt: number;
  bearingDeg: number;
}

interface HospitalRadar2DProps {
  requests: BloodRequest[];
  selectedRequestId: string;
  onSelectRequest: (id: string) => void;
  donors: DonorProfile[];
  banks: NetworkPartner[];
  onNotify: (message: string) => void;
}

const RANGE_OPTIONS = [2, 5, 10] as const;
type RangeKm = (typeof RANGE_OPTIONS)[number];

const SWEEP_DEG_PER_SEC = 72; // one rotation every 5 s
const DISPATCH_SIM_MS = 30000; // compressed travel time so the demo can be watched end to end

const KIND_LABEL: Record<ContactKind, string> = {
  donor: "Registered Donor",
  bank: "Authorized Blood Bank",
};

const COLOR = {
  donor: "#ff3a52",
  donorDim: "#64748b",
  bank: "#2ee6c9",
  ring: "rgba(46, 230, 201, 0.18)",
  ringOuter: "rgba(46, 230, 201, 0.48)",
  label: "rgba(211, 201, 195, 0.72)",
  labelStrong: "rgba(247, 241, 236, 0.95)",
  sweep: "rgba(120, 240, 222, 0.95)",
};

function bearingFromId(id: string): number {
  let hash = 7;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (hash * 137) % 360;
}

function shortName(name: string): string {
  return name.split(" — ")[0];
}

function parseEta(text: string, distanceKm: number): number {
  const minutes = Number.parseInt(text, 10);
  return Number.isFinite(minutes) ? minutes : Math.max(5, Math.round(distanceKm * 5));
}

function contactBearing(contact: RadarContact, dispatch: DispatchInfo | undefined): number {
  if (dispatch) return dispatch.bearingDeg;
  return contact.bearingDeg;
}

function dispatchProgress(dispatch: DispatchInfo | undefined, nowMs: number): number {
  if (!dispatch) return 0;
  return Math.min(1, Math.max(0, (nowMs - dispatch.startedAt) / DISPATCH_SIM_MS));
}

function drawGlyph(ctx: CanvasRenderingContext2D, kind: ContactKind, x: number, y: number) {
  ctx.beginPath();
  if (kind === "bank") {
    ctx.rect(x - 5, y - 5, 10, 10);
  } else {
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
  }
  ctx.fill();
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
  const notifyRef = useRef(onNotify);
  notifyRef.current = onNotify;

  const [rangeKm, setRangeKm] = useState<RangeKm>(5);
  const [compatibleOnly, setCompatibleOnly] = useState(true);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const [dispatched, setDispatched] = useState<Record<string, DispatchInfo>>({});
  const [reserved, setReserved] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => Date.now());

  const request = requests.find((item) => item.id === selectedRequestId) ?? requests[0];
  const hospital = shortName(request.hospital);
  const safeGroups = COMPATIBILITY_MAP[request.group].receiveRedCellsFrom;

  const contacts = useMemo<RadarContact[]>(() => {
    const safe = COMPATIBILITY_MAP[request.group].receiveRedCellsFrom;
    const hospitalKey = request.hospital.split(" ")[0].toLowerCase();

    const donorContacts: RadarContact[] = donors.map((donor) => ({
      id: donor.id,
      kind: "donor",
      label: donor.name,
      detail: `${donor.group} · ${donor.availability}`,
      group: donor.group,
      distanceKm: donor.distanceKm,
      bearingDeg: bearingFromId(donor.id),
      compatible: safe.includes(donor.group),
      etaMin: parseEta(donor.responseWindow, donor.distanceKm),
    }));

    const bankContacts: RadarContact[] = banks
      .filter((bank) => !bank.name.toLowerCase().startsWith(hospitalKey))
      .map((bank) => {
        const units = safe.reduce((sum, group) => sum + bank.inventory[group], 0);
        return {
          id: bank.id,
          kind: "bank",
          label: shortName(bank.name),
          detail: `${units} compatible units · ${bank.area}`,
          distanceKm: bank.distanceKm,
          bearingDeg: bearingFromId(bank.id),
          compatible: units > 0,
          etaMin: Math.max(8, Math.round(bank.distanceKm * 4)),
        };
      });

    return [...donorContacts, ...bankContacts];
  }, [banks, donors, request.group, request.hospital]);

  const visible = useMemo(
    () =>
      contacts
        .filter((contact) => contact.distanceKm <= rangeKm && (!compatibleOnly || contact.compatible))
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [compatibleOnly, contacts, rangeKm],
  );

  const locked = contacts.find((contact) => contact.id === lockedId) ?? null;
  const compatibleDonorsInRange = visible.filter((contact) => contact.kind === "donor" && contact.compatible).length;

  // New request: lock the nearest compatible donor and clear the previous dispatch board.
  useEffect(() => {
    const nearest = contacts
      .filter((contact) => contact.kind === "donor" && contact.compatible && contact.distanceKm <= rangeKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    setLockedId(nearest?.id ?? null);
    setDispatched({});
    setReserved({});
    arrivedRef.current = new Set();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequestId]);

  const moving = Object.values(dispatched).some((info) => now - info.startedAt < DISPATCH_SIM_MS);

  useEffect(() => {
    if (!moving) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [moving]);

  useEffect(() => {
    for (const [id, info] of Object.entries(dispatched)) {
      if (now - info.startedAt >= DISPATCH_SIM_MS && !arrivedRef.current.has(id)) {
        arrivedRef.current.add(id);
        const contact = contacts.find((item) => item.id === id);
        if (contact) notifyRef.current(`${contact.label} has arrived at ${hospital}.`);
      }
    }
  }, [contacts, dispatched, hospital, now]);

  const drawStateRef = useRef({ contacts, rangeKm, compatibleOnly, lockedId, dispatched });
  drawStateRef.current = { contacts, rangeKm, compatibleOnly, lockedId, dispatched };

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
      size = Math.max(240, Math.floor(scope.clientWidth));
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
      const radius = size / 2 - 30;
      const sweep = reduced ? 40 : ((timeMs / 1000) * SWEEP_DEG_PER_SEC) % 360;
      const polar = (deg: number, r: number): [number, number] => {
        const rad = (deg * Math.PI) / 180;
        return [cx + Math.sin(rad) * r, cy - Math.cos(rad) * r];
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // Scope face
      const face = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      face.addColorStop(0, "rgba(8, 58, 52, 0.6)");
      face.addColorStop(0.65, "rgba(10, 22, 22, 0.86)");
      face.addColorStop(1, "rgba(10, 9, 9, 0.96)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = face;
      ctx.fill();

      // Range rings with distance labels
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i += 1) {
        const r = (radius * i) / 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i === 4 ? COLOR.ringOuter : COLOR.ring;
        ctx.stroke();
        const km = (state.rangeKm * i) / 4;
        ctx.fillStyle = COLOR.label;
        ctx.font = mono(11);
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${Number.isInteger(km) ? km : km.toFixed(1)} km`, cx + 5, cy - r - 3);
      }

      // Crosshair and diagonals
      ctx.strokeStyle = COLOR.ring;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();
      ctx.setLineDash([2, 6]);
      for (const deg of [45, 135]) {
        const [x1, y1] = polar(deg, radius);
        const [x2, y2] = polar(deg + 180, radius);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Bearing ticks and compass labels
      for (let deg = 0; deg < 360; deg += 5) {
        const major = deg % 30 === 0;
        const [x1, y1] = polar(deg, radius);
        const [x2, y2] = polar(deg, radius - (major ? 10 : 5));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = major ? COLOR.ringOuter : COLOR.ring;
        ctx.stroke();
        if (major) {
          const cardinal = deg % 90 === 0;
          const [lx, ly] = polar(deg, radius + 15);
          ctx.fillStyle = cardinal ? COLOR.labelStrong : COLOR.label;
          ctx.font = mono(cardinal ? 12 : 10, cardinal ? 700 : 500);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const text = cardinal ? ["N", "E", "S", "W"][deg / 90] : String(deg).padStart(3, "0");
          ctx.fillText(text, lx, ly);
        }
      }

      // Sweep trail
      const trailDeg = 75;
      const end = ((sweep - 90) * Math.PI) / 180;
      const start = end - (trailDeg * Math.PI) / 180;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      if (typeof ctx.createConicGradient === "function") {
        const gradient = ctx.createConicGradient(start, cx, cy);
        const fraction = trailDeg / 360;
        gradient.addColorStop(0, "rgba(0, 245, 212, 0)");
        gradient.addColorStop(fraction, "rgba(0, 245, 212, 0.34)");
        gradient.addColorStop(Math.min(1, fraction + 0.001), "rgba(0, 245, 212, 0)");
        gradient.addColorStop(1, "rgba(0, 245, 212, 0)");
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = "rgba(0, 245, 212, 0.12)";
      }
      ctx.fill();
      ctx.restore();

      // Sweep line
      const [sx, sy] = polar(sweep, radius);
      ctx.save();
      ctx.strokeStyle = COLOR.sweep;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLOR.bank;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.restore();

      // Contacts
      const hits: { id: string; x: number; y: number }[] = [];
      let lockedPoint: { x: number; y: number } | null = null;

      for (const contact of state.contacts) {
        if (contact.distanceKm > state.rangeKm) continue;
        if (state.compatibleOnly && !contact.compatible) continue;

        const dispatch = state.dispatched[contact.id];
        const bearing = contactBearing(contact, dispatch);
        const progress = dispatchProgress(dispatch, nowMs);
        const startR = (contact.distanceKm / state.rangeKm) * radius;
        const [x, y] = polar(bearing, startR * (1 - progress));
        const sinceSweep = (((sweep - bearing) % 360) + 360) % 360;
        // Phosphor persistence: contacts glow when the sweep passes, then fade.
        const glow = reduced || dispatch ? 1 : Math.max(0.3, 1 - sinceSweep / 320);
        const color =
          contact.kind === "bank"
            ? COLOR.bank
            : contact.compatible
              ? COLOR.donor
              : COLOR.donorDim;

        if (dispatch) {
          const [ox, oy] = polar(bearing, startR);
          ctx.save();
          ctx.setLineDash([4, 5]);
          ctx.strokeStyle = "rgba(255, 183, 3, 0.75)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.restore();
        }

        if (!reduced && sinceSweep < 24) {
          ctx.save();
          ctx.globalAlpha = (1 - sinceSweep / 24) * 0.8;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(x, y, 6 + sinceSweep * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = glow;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 * glow;
        drawGlyph(ctx, contact.kind, x, y);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = Math.max(0.55, glow);
        ctx.fillStyle = COLOR.labelStrong;
        ctx.font = mono(11, 600);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(contact.kind === "donor" ? contact.group ?? "" : "BANK", x + 9, y - 9);
        ctx.restore();

        hits.push({ id: contact.id, x, y });
        if (contact.id === state.lockedId) lockedPoint = { x, y };
      }
      hitPointsRef.current = hits;

      // Requesting hospital at the centre
      ctx.save();
      ctx.fillStyle = COLOR.donor;
      ctx.shadowColor = COLOR.donor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - 1.75, cy - 6, 3.5, 12);
      ctx.fillRect(cx - 6, cy - 1.75, 12, 3.5);
      ctx.restore();

      // Target lock reticle
      if (lockedPoint) {
        const { x, y } = lockedPoint;
        const box = 13;
        const arm = 5;
        ctx.save();
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.6;
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
        ctx.restore();
      }
    };

    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    let best: string | null = null;
    let bestDistance = 22;
    for (const point of hitPointsRef.current) {
      const distance = Math.hypot(point.x - px, point.y - py);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = point.id;
      }
    }
    if (best) setLockedId(best);
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
    const bearing = contactBearing(contact, undefined);
    const startedAt = Date.now();
    setDispatched((prev) => ({ ...prev, [contact.id]: { startedAt, bearingDeg: bearing } }));
    setNow(startedAt);
    notifyRef.current(`${contact.label} dispatched to ${hospital} · estimated arrival ${contact.etaMin} min.`);
  };

  const reserveFromBank = (contact: RadarContact) => {
    setReserved((prev) => ({ ...prev, [contact.id]: true }));
    notifyRef.current(`${request.units} of ${request.group}-compatible blood reserved at ${contact.label}.`);
  };

  const renderAction = (contact: RadarContact) => {
    const remaining = remainingMinutes(contact);
    if (contact.kind === "bank") {
      return reserved[contact.id] ? (
        <button type="button" className="btn btn-glass" disabled>
          Units reserved
        </button>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => reserveFromBank(contact)}>
          Reserve {request.units.toLowerCase()}
        </button>
      );
    }
    if (contact.kind === "donor" && !contact.compatible) {
      return (
        <button type="button" className="btn btn-glass" disabled>
          Incompatible with {request.group}
        </button>
      );
    }
    if (remaining !== null) {
      return (
        <button type="button" className="btn btn-glass" disabled>
          {remaining === 0 ? `Arrived at ${hospital}` : `Dispatched · ${remaining} min remaining`}
        </button>
      );
    }
    return (
      <button type="button" className="btn btn-primary" onClick={() => dispatchContact(contact)}>
        Dispatch donor to hospital
      </button>
    );
  };

  const lockedRemaining = locked ? remainingMinutes(locked) : null;

  return (
    <div className="radar-shell glass">
      <div className="radar-scope-col">
        <div className="radar-scope" ref={scopeRef}>
          <canvas
            ref={canvasRef}
            className="radar-canvas"
            role="img"
            aria-label={`Radar around ${hospital}: ${compatibleDonorsInRange} compatible donors within ${rangeKm} km. Use the contact list to select a contact.`}
            onPointerDown={handlePointerDown}
          />
          <div className="radar-hud is-tl">
            <span>Requisition origin</span>
            <strong>{hospital}</strong>
          </div>
          <div className="radar-hud is-tr">
            <span>Within {rangeKm} km</span>
            <strong>
              {compatibleDonorsInRange} compatible {compatibleDonorsInRange === 1 ? "donor" : "donors"}
            </strong>
          </div>
        </div>
        <div className="radar-legend" aria-hidden="true">
          <span className="legend-item">
            <span className="glyph is-donor" />
            Compatible donor
          </span>
          {!compatibleOnly && (
            <span className="legend-item">
              <span className="glyph is-donor is-dim" />
              Incompatible donor
            </span>
          )}
          <span className="legend-item">
            <span className="glyph is-bank" />
            Authorized blood bank
          </span>
        </div>
      </div>

      <div className="radar-panel">
        <div className="radar-request">
          <label className="panel-label" htmlFor="radar-request">
            Selected requisition
          </label>
          <select
            id="radar-request"
            className="input"
            value={request.id}
            onChange={(event) => onSelectRequest(event.target.value)}
          >
            {requests.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.group} · {shortName(item.hospital)}
              </option>
            ))}
          </select>
          <div className="radar-request-summary">
            <span className="group-badge is-lg">{request.group}</span>
            <div>
              <strong>
                {request.units} · {request.componentNeeded}
              </strong>
              <span>{request.need}</span>
            </div>
          </div>
          <p className="radar-safe">
            Compatible donor groups: <b>{safeGroups.join("  ")}</b>
          </p>
        </div>

        <div className="radar-controls">
          <div className="segmented" role="group" aria-label="Radar range">
            {RANGE_OPTIONS.map((km) => (
              <button key={km} type="button" aria-pressed={rangeKm === km} onClick={() => setRangeKm(km)}>
                {km} km
              </button>
            ))}
          </div>
          <button
            type="button"
            className="toggle-chip"
            aria-pressed={compatibleOnly}
            onClick={() => setCompatibleOnly((value) => !value)}
          >
            Compatible only
          </button>
        </div>

        {locked ? (
          <div className="lock-card" aria-live="polite">
            <div className="lock-head">
              <span className="panel-label">Selected contact</span>
              <span className={`kind-tag is-${locked.kind}`}>
                {KIND_LABEL[locked.kind]}
                {locked.group ? ` · ${locked.group}` : ""}
              </span>
            </div>
            <h3>{locked.label}</h3>
            <p>{locked.detail}</p>
            <dl className="lock-stats">
              <div>
                <dt>Distance</dt>
                <dd>{locked.distanceKm} km</dd>
              </div>
              <div>
                <dt>Est. arrival</dt>
                <dd>{lockedRemaining === null ? `${locked.etaMin} min` : lockedRemaining === 0 ? "Arrived" : `${lockedRemaining} min`}</dd>
              </div>
              <div>
                <dt>Bearing</dt>
                <dd>{`${String(Math.round(dispatched[locked.id]?.bearingDeg ?? locked.bearingDeg)).padStart(3, "0")}°`}</dd>
              </div>
            </dl>
            {renderAction(locked)}
          </div>
        ) : (
          <p className="radar-empty">Select a contact on the radar or from the list below.</p>
        )}

        <div className="contact-block">
          <span className="panel-label">Contacts within radius ({visible.length})</span>
          {visible.length > 0 ? (
            <ul className="contact-list">
              {visible.map((contact) => {
                const status = statusFor(contact);
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      className={`contact-row ${contact.id === lockedId ? "is-locked" : ""}`}
                      aria-pressed={contact.id === lockedId}
                      onClick={() => setLockedId(contact.id)}
                    >
                      <span
                        className={`glyph is-${contact.kind} ${contact.kind === "donor" && !contact.compatible ? "is-dim" : ""}`}
                        aria-hidden="true"
                      />
                      <span className="contact-main">
                        <strong>{contact.label}</strong>
                        <small>{contact.detail}</small>
                      </span>
                      <span className={`contact-dist ${status ? "is-status" : ""}`}>{status ?? `${contact.distanceKm} km`}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="radar-empty">Nothing in range. Widen the range to 10 km.</p>
          )}
        </div>
      </div>
    </div>
  );
}
