import { useState, useEffect } from "react";
import { tacticalAudio } from "../utils/tacticalAudio";

interface JourneyStage {
  id: number;
  shortName: string;
  title: string;
  duration: string;
  facility: string;
  temperature: string;
  status: "Completed" | "In-Progress" | "Pending";
  description: string;
  clinicalSpec: {
    label: string;
    value: string;
  }[];
  qualityCheck: string;
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 1,
    shortName: "Phlebotomy",
    title: "Collection & Sterile Diversion",
    duration: "10 – 12 mins",
    facility: "Authorized Donor Phlebotomy Bay",
    temperature: "+20°C to +24°C Ambient",
    status: "Completed",
    description:
      "450 mL whole blood collected via sterile 16-gauge venipuncture into a quad-pack bag with CPDA-1 anticoagulant. The initial 30 mL is routed into an integrated diversion pouch to prevent epidermal skin flora contamination.",
    clinicalSpec: [
      { label: "Target Volume", value: "450 mL ± 10%" },
      { label: "Anticoagulant", value: "CPDA-1 (Citrate Phosphate)" },
      { label: "Pre-Donation Hb", value: "≥ 12.5 g/dL verified" },
      { label: "Diversion Pouch", value: "Isolated for serology vials" },
    ],
    qualityCheck: "ISBT 128 dual-barcode applied to primary and satellite satellite packs.",
  },
  {
    id: 2,
    shortName: "Fractionation",
    title: "Centrifugal Component Separation",
    duration: "45 mins",
    facility: "Component Processing Laboratory",
    temperature: "+22°C (Controlled Centrifuge)",
    status: "Completed",
    description:
      "The whole blood unit undergoes differential high-speed centrifugation (4,000 RPM at 4°C for red cells; soft spin for platelet-rich plasma). The closed system separates one single donation into three therapeutic components.",
    clinicalSpec: [
      { label: "PRBC Yield", value: "~250 mL (Hematocrit ~60%)" },
      { label: "Platelet Yield", value: "~50 mL (≥ 5.5 × 10¹⁰ units)" },
      { label: "FFP Yield", value: "~180 mL (Coagulation factors)" },
      { label: "Leukoreduction", value: "< 1 × 10⁶ residual WBC" },
    ],
    qualityCheck: "Optical automated press sensor confirms sterile interface tube sealing.",
  },
  {
    id: 3,
    shortName: "NAT Testing",
    title: "Nucleic Acid & Pathogen Screening",
    duration: "3 – 4 hours",
    facility: "Automated Molecular Diagnostics Lab",
    temperature: "-20°C Test Control",
    status: "In-Progress",
    description:
      "Individual-Donor Nucleic Acid Testing (ID-NAT) via multiplex automated PCR detects viral RNA/DNA for HIV-1/2, Hepatitis B (HBV), and Hepatitis C (HCV), reducing immunological window periods to under 5 days.",
    clinicalSpec: [
      { label: "HIV-1/2 NAT", value: "Non-Reactive (Target: 0 copies)" },
      { label: "HCV RNA NAT", value: "Non-Reactive (Sensitivity: 5 IU/mL)" },
      { label: "HBV DNA NAT", value: "Non-Reactive (Sensitivity: 3 IU/mL)" },
      { label: "Syphilis & Malaria", value: "Serologically Negative" },
    ],
    qualityCheck: "Automated digital release locked until 5-panel negative clearance is signed.",
  },
  {
    id: 4,
    shortName: "Bio-Vault Storage",
    title: "Quarantined Cold-Chain Cryo-Vault",
    duration: "24/7 Monitored",
    facility: "Regional Blood Center Cryo-Bank",
    temperature: "+2°C to +6°C (PRBC) | -25°C (FFP)",
    status: "Pending",
    description:
      "Components are sequestered in temperature-controlled bio-vaults with dual continuous Peltier sensor backups. Platelets rest on an orbital flatbed agitator to preserve activation viability; PRBCs maintain 42-day SAGM preservation.",
    clinicalSpec: [
      { label: "PRBC Expiry", value: "42 Days at +2°C to +6°C" },
      { label: "FFP Expiry", value: "1 Year at ≤ -25°C" },
      { label: "Platelets Expiry", value: "5 Days at +20°C–24°C" },
      { label: "Telemetry Log", value: "Sub-minute audit logging" },
    ],
    qualityCheck: "Continuous NIST-calibrated sensors with automated acoustic excursion alarm.",
  },
  {
    id: 5,
    shortName: "Bedside Delivery",
    title: "Cross-Match & Transfusion Delivery",
    duration: "15 – 30 mins",
    facility: "Hospital Trauma ICU / Surgical Theatre",
    temperature: "+37°C Blood Warmer (Optional)",
    status: "Pending",
    description:
      "Following bedside electronic barcode verification against the recipient's wristband and medical chart, the cross-matched PRBC unit is infused through a 170-micron microaggregate filter with vital sign surveillance at 0, 15, and 60 minutes.",
    clinicalSpec: [
      { label: "Major Cross-Match", value: "Saline & AHG Compatible" },
      { label: "Dual Identification", value: "2 Registered Nurse Verification" },
      { label: "Infusion Line", value: "Standard 170µm blood filter" },
      { label: "Transfusion Target", value: "1 unit PRBC raises Hb by ~1 g/dL" },
    ],
    qualityCheck: "Zero-tolerance bedside mismatch protocol with immediate hemovigilance telemetry.",
  },
];

const MOCK_DONATION_PACKS = [
  { id: "BL-WB-8921-A", donorGroup: "A+", location: "Metro Trauma Center", timeAgo: "1h 40m ago" },
  { id: "BL-WB-4412-O", donorGroup: "O-", location: "Central Red Cross Vault", timeAgo: "22m ago" },
  { id: "BL-WB-7730-B", donorGroup: "B+", location: "Apollo Transfusion Bay", timeAgo: "3h 15m ago" },
];

export function BloodJourneyTracker() {
  const [selectedPack, setSelectedPack] = useState(MOCK_DONATION_PACKS[1]);
  const [activeStageId, setActiveStageId] = useState(3);
  const [autoSimulate, setAutoSimulate] = useState(false);

  const currentStage = JOURNEY_STAGES.find((s) => s.id === activeStageId) || JOURNEY_STAGES[0];

  useEffect(() => {
    if (!autoSimulate) return;
    const interval = setInterval(() => {
      setActiveStageId((prev) => (prev >= 5 ? 1 : prev + 1));
      tacticalAudio.playBlip(700 + activeStageId * 100);
    }, 4500);
    return () => clearInterval(interval);
  }, [autoSimulate, activeStageId]);

  const handleStageSelect = (id: number) => {
    setAutoSimulate(false);
    setActiveStageId(id);
    tacticalAudio.playClick(900 + id * 80);
  };

  return (
    <section className="section theme-light journey-section" id="journey">
      <div className="container reveal">
        {/* Section Head */}
        <div className="section-head">
          <div className="section-head-copy">
            <span className="eyebrow is-crimson">
              <span className="pulse-dot" /> Vein-to-Vein Transfusion Pipeline
            </span>
            <h2>
              The <em>journey</em> of a single donation
            </h2>
            <p>
              Track whole blood from donor phlebotomy through high-G component separation, multiplex nucleic acid
              screening (NAT), and continuous cold-chain cryo-storage to patient bedside delivery.
            </p>
          </div>

          <div className="journey-ctrl-cluster">
            {/* Specimen Pack Selector */}
            <div className="journey-specimen-select">
              <span className="specimen-label">ACTIVE SPECIMEN:</span>
              <div className="specimen-badges">
                {MOCK_DONATION_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    className={`specimen-pill ${pack.id === selectedPack.id ? "is-active" : ""}`}
                    onClick={() => {
                      setSelectedPack(pack);
                      tacticalAudio.playClick(1050);
                    }}
                  >
                    <span className="pack-group">{pack.donorGroup}</span>
                    <span className="pack-code">{pack.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`btn btn-glass btn-sm ${autoSimulate ? "is-pulse-active" : ""}`}
              onClick={() => {
                setAutoSimulate((v) => !v);
                tacticalAudio.playClick(1150);
              }}
              title="Automate stage step-through"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {autoSimulate ? (
                  <>
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </>
                ) : (
                  <polygon points="5 3 19 12 5 21 5 3" />
                )}
              </svg>
              <span>{autoSimulate ? "Pause Sim" : "Auto-Simulate Pipeline"}</span>
            </button>
          </div>
        </div>

        {/* 5-Stage Stepper Track */}
        <div className="journey-stepper-track glass">
          <div className="stepper-progress-line" style={{ width: `${((activeStageId - 1) / 4) * 100}%` }} />
          <div className="stepper-nodes-row">
            {JOURNEY_STAGES.map((stage) => {
              const isPassed = stage.id < activeStageId;
              const isActive = stage.id === activeStageId;
              return (
                <button
                  key={stage.id}
                  type="button"
                  className={`stepper-node ${isActive ? "is-active" : ""} ${isPassed ? "is-passed" : ""}`}
                  onClick={() => handleStageSelect(stage.id)}
                  aria-pressed={isActive}
                >
                  <div className="node-indicator">
                    {isPassed ? (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="m4 10 4 4 8-9" />
                      </svg>
                    ) : (
                      <span>0{stage.id}</span>
                    )}
                  </div>
                  <div className="node-text">
                    <span className="node-short">{stage.shortName}</span>
                    <span className="node-status-label">
                      {isPassed ? "Cleared" : isActive ? "Active Stage" : "Queued"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Detailed Stage Console */}
        <div className="journey-stage-display bento-grid">
          {/* Main Stage Detail Card */}
          <article className="bento-card glass bento-span-8 journey-main-card">
            <div className="stage-card-header">
              <div className="stage-title-wrap">
                <span className="stage-number-pill">STAGE 0{currentStage.id} OF 05</span>
                <h3>{currentStage.title}</h3>
                <span className="stage-facility-tag">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18M3 7v14M21 7v14M9 21V9m6 12V9M9 3h6v4H9z" />
                  </svg>
                  {currentStage.facility}
                </span>
              </div>
              <div className="stage-telemetry-badge">
                <span className="telemetry-temp-val">{currentStage.temperature}</span>
                <span className="telemetry-duration-val">Duration: {currentStage.duration}</span>
              </div>
            </div>

            <p className="stage-description-body">{currentStage.description}</p>

            {/* Clinical Specifications Grid */}
            <div className="stage-specs-grid">
              {currentStage.clinicalSpec.map((spec) => (
                <div key={spec.label} className="stage-spec-item">
                  <span className="spec-label">{spec.label}</span>
                  <strong className="spec-value">{spec.value}</strong>
                </div>
              ))}
            </div>

            {/* Quality Assurance Verification Banner */}
            <div className="stage-qa-banner">
              <div className="qa-icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="qa-text">
                <span className="qa-label">CLINICAL QUALITY ASSURANCE STANDARD:</span>
                <span className="qa-detail">{currentStage.qualityCheck}</span>
              </div>
            </div>

            <div className="stage-nav-row">
              <button
                type="button"
                className="btn btn-glass btn-sm"
                disabled={activeStageId === 1}
                onClick={() => handleStageSelect(activeStageId - 1)}
              >
                Previous Stage
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={activeStageId === 5}
                onClick={() => handleStageSelect(activeStageId + 1)}
              >
                Next Pipeline Step
              </button>
            </div>
          </article>

          {/* Side Bento Card 1: 1 Donation = 3 Lives Saved Component Split */}
          <article className="bento-card glass bento-span-4 journey-fraction-card">
            <span className="bento-badge">THERAPEUTIC FRACTIONATION</span>
            <h4>1 Donation $\rightarrow$ 3 Lives Saved</h4>
            <p className="fraction-sub">A single 450 mL whole blood draw is centrifugally processed into three distinct life-saving therapies:</p>

            <div className="fraction-components-list">
              <div className="fraction-item">
                <div className="fraction-icon-tag prbc-tag">PRBC</div>
                <div className="fraction-info">
                  <strong>Packed Red Blood Cells (250 mL)</strong>
                  <span>Trauma hemorrhage, surgical anemia & sickle cell support</span>
                  <div className="fraction-meta">
                    <span>Temp: +2°C to +6°C</span>
                    <span>Shelf Life: 42 Days</span>
                  </div>
                </div>
              </div>

              <div className="fraction-item">
                <div className="fraction-icon-tag platelets-tag">SDP</div>
                <div className="fraction-info">
                  <strong>Platelet Concentrate (50 mL)</strong>
                  <span>Leukemia, chemotherapy & dengue thrombocytopenia</span>
                  <div className="fraction-meta">
                    <span>Temp: +22°C (Agitated)</span>
                    <span className="is-critical-shelf">Shelf Life: 5 Days</span>
                  </div>
                </div>
              </div>

              <div className="fraction-item">
                <div className="fraction-info-last">
                  <div className="fraction-icon-tag ffp-tag">FFP</div>
                  <div className="fraction-info">
                    <strong>Fresh Frozen Plasma (150 mL)</strong>
                    <span>Severe burns, hemophilia & coagulation factor deficiency</span>
                    <div className="fraction-meta">
                      <span>Temp: ≤ -25°C</span>
                      <span>Shelf Life: 12 Months</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
