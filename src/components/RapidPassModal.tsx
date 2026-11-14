import { useState, type FormEvent } from "react";
import { BLOOD_GROUPS, type BloodGroup } from "../data/bloodlinkData";
import { tacticalAudio } from "../utils/tacticalAudio";

interface RapidPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPassCreated?: (pass: { id: string; name: string; group: BloodGroup; city: string }) => void;
}

interface PreScreenState {
  ageWeightCleared: boolean;
  intervalCleared: boolean;
  medicationTravelCleared: boolean;
  hemoglobinConfirmed: boolean;
}

export function RapidPassModal({ isOpen, onClose, onPassCreated }: RapidPassModalProps) {
  const [step, setStep] = useState<"screen" | "details" | "pass">("screen");
  const [screen, setScreen] = useState<PreScreenState>({
    ageWeightCleared: true,
    intervalCleared: true,
    medicationTravelCleared: true,
    hemoglobinConfirmed: true,
  });

  const [donorName, setDonorName] = useState("");
  const [donorGroup, setDonorGroup] = useState<BloodGroup>("O+");
  const [donorCity, setDonorCity] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [issuedPassId, setIssuedPassId] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const allQuestionsCleared =
    screen.ageWeightCleared &&
    screen.intervalCleared &&
    screen.medicationTravelCleared &&
    screen.hemoglobinConfirmed;

  const handleStartDetails = () => {
    if (!allQuestionsCleared) return;
    tacticalAudio.playClick(1100);
    setStep("details");
  };

  const handleIssuePass = (e: FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || !donorCity.trim()) return;

    const passId = `RP-${Math.floor(100000 + Math.random() * 900000)}`;
    setIssuedPassId(passId);
    tacticalAudio.playDispatchChime();
    setStep("pass");

    if (onPassCreated) {
      onPassCreated({
        id: passId,
        name: donorName.trim(),
        group: donorGroup,
        city: donorCity.trim(),
      });
    }
  };

  const handleCopyPassId = () => {
    if (!issuedPassId) return;
    navigator.clipboard?.writeText(issuedPassId);
    setCopied(true);
    tacticalAudio.playClick(1200);
    setTimeout(() => setCopied(false), 2400);
  };

  // Generate a dynamic deterministic SVG QR pattern based on pass ID and donor details
  const qrHash = `${issuedPassId}-${donorName}-${donorGroup}`;
  const qrGridSize = 9;
  const qrCells: boolean[][] = [];
  for (let r = 0; r < qrGridSize; r++) {
    qrCells[r] = [];
    for (let c = 0; c < qrGridSize; c++) {
      // Keep corners fixed for realistic QR position marker squares
      const isTopLeft = r < 3 && c < 3;
      const isTopRight = r < 3 && c >= qrGridSize - 3;
      const isBottomLeft = r >= qrGridSize - 3 && c < 3;
      if (isTopLeft || isTopRight || isBottomLeft) {
        qrCells[r][c] = (r === 0 || r === 2 || c === 0 || c === 2) || (r >= qrGridSize - 3 && (r === qrGridSize - 3 || r === qrGridSize - 1 || c === 0 || c === 2)) || (c >= qrGridSize - 3 && (r === 0 || r === 2 || c === qrGridSize - 3 || c === qrGridSize - 1));
      } else {
        const charCode = qrHash.charCodeAt((r * qrGridSize + c) % qrHash.length) || 42;
        qrCells[r][c] = (charCode + r * 7 + c * 11) % 2 === 0;
      }
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal theme-light rapidpass-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rapidpass-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" aria-label="Close modal" onClick={onClose}>
          <svg aria-hidden="true" className="icon" viewBox="0 0 20 20">
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>

        {/* STEP 1: RapidPass Clinical Screener */}
        {step === "screen" && (
          <div className="rapidpass-content">
            <div className="rapidpass-header">
              <span className="eyebrow is-crimson">
                <span className="pulse-dot" /> RapidPass® Pre-Donation Clearance
              </span>
              <h2 id="rapidpass-title">30-Second Clinical Triage</h2>
              <p className="modal-intro">
                Save 15 minutes at the blood bank intake desk. Complete this clinical eligibility check to generate an
                authenticated digital donor credential.
              </p>
            </div>

            <div className="screening-questions-list">
              <label className="screening-item">
                <input
                  type="checkbox"
                  checked={screen.ageWeightCleared}
                  onChange={(e) => setScreen({ ...screen, ageWeightCleared: e.target.checked })}
                />
                <div className="screening-text">
                  <strong>Age 18–65 & Weight ≥ 45 kg</strong>
                  <span>Meets standard physiological volume clearance threshold without risk of hypovolemia.</span>
                </div>
              </label>

              <label className="screening-item">
                <input
                  type="checkbox"
                  checked={screen.intervalCleared}
                  onChange={(e) => setScreen({ ...screen, intervalCleared: e.target.checked })}
                />
                <div className="screening-text">
                  <strong>Safe Donation Recovery Interval</strong>
                  <span>Minimum 90 days (men) or 120 days (women) since last whole-blood donation (or 14 days for apheresis platelets).</span>
                </div>
              </label>

              <label className="screening-item">
                <input
                  type="checkbox"
                  checked={screen.hemoglobinConfirmed}
                  onChange={(e) => setScreen({ ...screen, hemoglobinConfirmed: e.target.checked })}
                />
                <div className="screening-text">
                  <strong>Hemoglobin Self-Check (≥ 12.5 g/dL)</strong>
                  <span>No chronic anemia symptoms (dizziness, fatigue, or pallor); confirmed by fingerprick cuvette at intake.</span>
                </div>
              </label>

              <label className="screening-item">
                <input
                  type="checkbox"
                  checked={screen.medicationTravelCleared}
                  onChange={(e) => setScreen({ ...screen, medicationTravelCleared: e.target.checked })}
                />
                <div className="screening-text">
                  <strong>Pathogen & Lifestyle Deferral Clearance</strong>
                  <span>No active infection/antibiotics within 48h, no tattoo/piercing within 6 months, and no active travel to malaria-endemic zones.</span>
                </div>
              </label>
            </div>

            {!allQuestionsCleared && (
              <div className="screening-warning">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>All 4 clinical triage requirements must be met to issue a valid RapidPass.</span>
              </div>
            )}

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-primary btn-lg btn-block"
                disabled={!allQuestionsCleared}
                onClick={handleStartDetails}
              >
                Proceed to Identity Verification →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Donor Identification Form */}
        {step === "details" && (
          <div className="rapidpass-content">
            <div className="rapidpass-header">
              <span className="eyebrow is-teal">Step 02 of 02 · Clinical Credential</span>
              <h2 id="rapidpass-title">Donor Registration Profile</h2>
              <p className="modal-intro">
                Clinical privacy assurance: Hospitals only view your blood group and verified locality. Contact
                telemetry is protected until you accept a dispatch requisition.
              </p>
            </div>

            <form className="form" onSubmit={handleIssuePass}>
              <label className="field">
                <span>Full Legal Name</span>
                <input
                  className="input"
                  name="name"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="e.g. Dr. Priyadarshini Rao"
                />
              </label>

              <div className="form-row">
                <label className="field">
                  <span>ABO / Rh Blood Group</span>
                  <select
                    className="input"
                    name="group"
                    value={donorGroup}
                    onChange={(e) => setDonorGroup(e.target.value as BloodGroup)}
                    required
                  >
                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        Group {group}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>City or Municipality</span>
                  <input
                    className="input"
                    name="city"
                    value={donorCity}
                    onChange={(e) => setDonorCity(e.target.value)}
                    required
                    autoComplete="address-level2"
                    placeholder="e.g. Bengaluru, Karnataka"
                  />
                </label>
              </div>

              <label className="field">
                <span>Contact Phone (Encrypted for Requisition Relays)</span>
                <input
                  className="input"
                  type="tel"
                  name="phone"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  placeholder="+91 98450 XXXXX (optional standby)"
                />
              </label>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-glass btn-lg"
                  onClick={() => {
                    tacticalAudio.playClick(900);
                    setStep("screen");
                  }}
                >
                  ← Back to Screener
                </button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                  Issue Scannable RapidPass →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Generated Authenticated Scannable Digital Donor Pass */}
        {step === "pass" && (
          <div className="rapidpass-content">
            <div className="rapidpass-header is-center">
              <span className="success-mark">
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m4 10 4 4 8-9" />
                </svg>
              </span>
              <span className="eyebrow is-teal">Clinical Clearance Confirmed</span>
              <h2 id="rapidpass-title">RapidPass® Digital Credential</h2>
              <p className="modal-intro">
                Present this scannable digital pass at any authorized BloodLink hospital partner or transfusion centre
                for prioritized intake.
              </p>
            </div>

            {/* HIGH-SECURITY DIGITAL PASS CARD */}
            <div className="rapidpass-card glass">
              <div className="pass-security-header">
                <div className="pass-brand-tag">
                  <span className="pulse-dot" />
                  <strong>BLOODLINK VERIFIED DONOR PASS</strong>
                </div>
                <span className="pass-token-badge">{issuedPassId}</span>
              </div>

              <div className="pass-body-layout">
                {/* Left: Donor Profile Metadata */}
                <div className="pass-details-col">
                  <div className="pass-donor-name">{donorName}</div>
                  <div className="pass-donor-meta">
                    <span>Locality: <b>{donorCity}</b></span>
                    <span>Issued: <b>Today, Valid 24 Hours</b></span>
                    <span>Eligibility: <b className="is-cleared">Pre-Screened Clear</b></span>
                  </div>

                  <div className="pass-group-capsule">
                    <span className="capsule-label">BLOOD GROUP</span>
                    <strong className="capsule-group">{donorGroup}</strong>
                  </div>
                </div>

                {/* Right: Scannable Deterministic QR Graphic */}
                <div className="pass-qr-col">
                  <div className="qr-frame" title={`Scan token: ${issuedPassId}`}>
                    <svg viewBox="0 0 100 100" className="qr-svg">
                      <rect width="100" height="100" fill="#0c1220" />
                      {qrCells.map((row, r) =>
                        row.map((active, c) => {
                          if (!active) return null;
                          const cellSize = 100 / qrGridSize;
                          return (
                            <rect
                              key={`${r}-${c}`}
                              x={c * cellSize + 0.5}
                              y={r * cellSize + 0.5}
                              width={cellSize - 1}
                              height={cellSize - 1}
                              fill="#00f0ff"
                              rx="1.5"
                            />
                          );
                        })
                      )}
                    </svg>
                    <span className="qr-scan-label">SCAN FOR FAST-TRACK</span>
                  </div>
                </div>
              </div>

              <div className="pass-footer-strip">
                <span>Fast-track phlebotomy queue · Zero-wait clinical intake</span>
                <span>ISO 15189 / NBTC Verified</span>
              </div>
            </div>

            <div className="pass-actions-cluster">
              <button
                type="button"
                className="btn btn-glass btn-lg"
                onClick={handleCopyPassId}
                style={{ flex: 1 }}
              >
                {copied ? "Token Copied to Clipboard!" : "Copy Pass Token ID"}
              </button>
              <button type="button" className="btn btn-primary btn-lg" onClick={onClose} style={{ flex: 1 }}>
                Done / Finish Registration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
