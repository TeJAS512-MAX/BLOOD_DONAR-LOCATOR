import { useEffect, useRef, useState } from "react";
import type { BloodGroup } from "../data/bloodlinkData";
import { tacticalAudio } from "../utils/tacticalAudio";

/* ==========================================================================
   TYPES & DATA MODELS
   ========================================================================== */

export type LabTab = "uav-dispatch" | "agglutination-lab";

export type TransitMode = "uav" | "ground";

export interface UAVMission {
  id: string;
  sourceHub: string;
  destinationHospital: string;
  component: string;
  group: BloodGroup;
  distanceKmGround: number;
  distanceKmUAV: number;
  durationSecUAV: number; // simulated flight duration in seconds
  durationSecGround: number;
}

export interface PhenotypeCase {
  id: string;
  name: string;
  badge: string;
  prevalence: string;
  antigenProfile: string;
  antibodyProfile: string;
  clinicalChallenge: string;
  donorCompatibilityRule: string;
  sampleDonors: {
    name: string;
    group: BloodGroup;
    phenotype: string;
    compatible: boolean;
    reason: string;
  }[];
}

/* Sample UAV Missions */
const SAMPLE_MISSIONS: UAVMission[] = [
  {
    id: "MSN-801",
    sourceHub: "Bengaluru Regional Blood Centre (HAL 3rd Stage)",
    destinationHospital: "Manipal Hospital Trauma ICU (Old Airport Rd)",
    component: "2x Packed Red Blood Cells (PRBC)",
    group: "O-",
    distanceKmGround: 11.4,
    distanceKmUAV: 6.2,
    durationSecUAV: 22,
    durationSecGround: 68,
  },
  {
    id: "MSN-802",
    sourceHub: "Western Regional Blood Centre (Parel)",
    destinationHospital: "KEM Hospital Emergency Resuscitation Room",
    component: "4x Single-Donor Apheresis Platelets (SDP)",
    group: "A-",
    distanceKmGround: 8.6,
    distanceKmUAV: 4.1,
    durationSecUAV: 18,
    durationSecGround: 54,
  },
  {
    id: "MSN-803",
    sourceHub: "National Capital Regional Blood Centre (Connaught Place)",
    destinationHospital: "AIIMS Apex Trauma Centre (Safdarjung)",
    component: "2x Fresh Frozen Cryoprecipitate (FFP)",
    group: "B+",
    distanceKmGround: 14.2,
    distanceKmUAV: 7.9,
    durationSecUAV: 26,
    durationSecGround: 82,
  },
];

/* Rare Phenotypes & Alloantibody Cases */
const PHENOTYPE_CASES: PhenotypeCase[] = [
  {
    id: "bombay",
    name: "Bombay Blood Phenotype (hh / Oh)",
    badge: "1 in 10,000 (India) · 1 in 1M (Global)",
    prevalence: "Extremely Rare",
    antigenProfile: "Lacks H, A, and B antigens on RBC surface",
    antibodyProfile: "Potent circulating Anti-H, Anti-A, and Anti-B antibodies",
    clinicalChallenge:
      "Patients type phenotypically as 'O-', but will suffer fatal acute intravascular hemolysis if transfused with standard O- blood because standard red cells possess H-antigen which their serum aggressively destroys.",
    donorCompatibilityRule: "Can ONLY receive blood from other verified Bombay Phenotype (hh) donors.",
    sampleDonors: [
      {
        name: "Standard Universal Donor BL-8841",
        group: "O-",
        phenotype: "Standard O- (H-Antigen Positive)",
        compatible: false,
        reason: "FATAL INCOMPATIBILITY: Patient's Anti-H antibodies rapidly lyse donor H-antigen red cells.",
      },
      {
        name: "Bombay Reference Donor BL-9904",
        group: "O-",
        phenotype: "Bombay Oh (hh homozygous null)",
        compatible: true,
        reason: "COMPATIBLE: Donor cells lack H-antigen; zero antibody agglutination detected.",
      },
      {
        name: "Regional Donor BL-4102",
        group: "A-",
        phenotype: "Standard A- (A & H Antigens)",
        compatible: false,
        reason: "FATAL INCOMPATIBILITY: Anti-A and Anti-H antibodies both attack donor RBCs.",
      },
    ],
  },
  {
    id: "rh-null",
    name: "Rh-Null ('Golden Blood')",
    badge: "~50 Individuals Known Globally",
    prevalence: "Ultra-Rare",
    antigenProfile: "Completely lacks all 61 Rh blood group antigens (RhAG null)",
    antibodyProfile: "Prone to developing Anti-Rh29 (pan-Rh) antibodies upon first exposure",
    clinicalChallenge:
      "RBC membranes exhibit stomatocytosis and shortened half-life. Once immunized by transfusion or pregnancy, patient attacks any red cell carrying any Rh antigen.",
    donorCompatibilityRule: "Universal red-cell donor for rare Rh patients, but can receive ONLY Rh-null blood.",
    sampleDonors: [
      {
        name: "Verified Donor BL-3320",
        group: "O-",
        phenotype: "Standard Rh(D) Negative (C, c, E, e positive)",
        compatible: false,
        reason: "INCOMPATIBLE: Patient serum contains Anti-Rh29 which agglutinates all standard Rh antigens.",
      },
      {
        name: "International Vault Specimen IV-012",
        group: "O-",
        phenotype: "Rh-Null (Zero Rh Antigens)",
        compatible: true,
        reason: "COMPATIBLE: Genuine Rh-null specimen; zero Rh surface antigens to trigger immune response.",
      },
    ],
  },
  {
    id: "thalassemia-extended",
    name: "Thalassemia Extended Phenotype (Kell & Duffy Mismatch)",
    badge: "Frequent Transfusion Protocol",
    prevalence: "Chronic Transfusion Dependent",
    antigenProfile: "Group O+ with acquired Anti-Kell (K1) and Anti-Fya antibodies",
    antibodyProfile: "Anti-K1 (IgG) and Anti-Fya (IgG) alloantibodies",
    clinicalChallenge:
      "Due to multiple lifetime transfusions, the patient has formed antibodies against minor red cell antigens. Transfusing standard cross-match O+ blood risks delayed hemolytic transfusion reaction.",
    donorCompatibilityRule: "Requires Extended Phenotyping: Group O+, Kell-Negative (K-), Duffy-a Negative (Fya-).",
    sampleDonors: [
      {
        name: "Regular Donor BL-7701",
        group: "O+",
        phenotype: "Standard O+ (K1+ Kell Positive)",
        compatible: false,
        reason: "INCOMPATIBLE: Patient's Anti-K1 alloantibodies cause delayed hemolytic destruction.",
      },
      {
        name: "Extended Match Donor BL-5590",
        group: "O+",
        phenotype: "Extended Phenotyped: O+ K- Fya-",
        compatible: true,
        reason: "COMPATIBLE: Antigen-negative unit matching patient antibody screen. Zero agglutination.",
      },
    ],
  },
];

/* ==========================================================================
   COMPONENT: AdvancedTransfusionLab
   ========================================================================== */

export function AdvancedTransfusionLab({
  onNotify,
}: {
  onNotify: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<LabTab>("uav-dispatch");

  /* --- UAV Dispatch States --- */
  const [selectedMission, setSelectedMission] = useState<UAVMission>(SAMPLE_MISSIONS[0]);
  const [transitMode, setTransitMode] = useState<TransitMode>("uav");
  const [isTransitActive, setIsTransitActive] = useState(false);
  const [transitProgress, setTransitProgress] = useState(0); // 0 to 1
  const [tempDrift, setTempDrift] = useState(3.8); // Celsius (+3.8 nominal)
  const [flightAltitude, setFlightAltitude] = useState(120); // Metres
  const [missionComplete, setMissionComplete] = useState(false);

  /* --- Agglutination Lab States --- */
  const [selectedCase, setSelectedCase] = useState<PhenotypeCase>(PHENOTYPE_CASES[0]);
  const [selectedDonorIdx, setSelectedDonorIdx] = useState(0);
  const [isSerumMixed, setIsSerumMixed] = useState(false);
  const [testResult, setTestResult] = useState<"pending" | "compatible" | "agglutinated">("pending");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* --------------------------------------------------------------------------
     UAV Transit Loop Simulation
     -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!isTransitActive) return undefined;

    const durationSec = transitMode === "uav" ? selectedMission.durationSecUAV : selectedMission.durationSecGround;
    const intervalMs = 100;
    const step = intervalMs / (durationSec * 1000);

    const timer = setInterval(() => {
      setTransitProgress((prev) => {
        const next = prev + step;
        if (next >= 1) {
          clearInterval(timer);
          setIsTransitActive(false);
          setMissionComplete(true);
          tacticalAudio.playDispatchChime();
          onNotify(
            `EMERGENCY ARRIVAL: ${selectedMission.component} delivered to ${selectedMission.destinationHospital} via ${
              transitMode === "uav" ? "Autonomous Medical UAV" : "Green Corridor Police Escort"
            }. Cold-chain verified at ${tempDrift.toFixed(1)}°C.`,
          );
          return 1;
        }

        // Simulate micro thermal drift (UAV maintains tighter cooling than ground vehicle)
        if (transitMode === "uav") {
          setTempDrift(3.8 + Math.sin(next * Math.PI * 4) * 0.15);
          setFlightAltitude(120 + Math.sin(next * Math.PI * 6) * 6);
        } else {
          setTempDrift(3.8 + next * 0.7); // Ground drift over time
        }

        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isTransitActive, onNotify, selectedMission, tempDrift, transitMode]);

  const handleLaunchMission = () => {
    setTransitProgress(0);
    setMissionComplete(false);
    setIsTransitActive(true);
    tacticalAudio.playClick(1400);
    if (transitMode === "uav") {
      tacticalAudio.playBlip(1200);
      onNotify(
        `AIRSPACE CLEARED: Autonomous Medical UAV Liftoff from ${selectedMission.sourceHub}. Altitude: 120m AGL. ETA: ${Math.round(
          selectedMission.durationSecUAV / 3,
        )} min.`,
      );
    } else {
      tacticalAudio.playBlip(800);
      onNotify(
        `GREEN CORRIDOR ACTIVE: Traffic police escort clearing corridor to ${selectedMission.destinationHospital}.`,
      );
    }
  };

  const handleAbortMission = () => {
    setIsTransitActive(false);
    setTransitProgress(0);
    tacticalAudio.playClick(600);
    onNotify("MISSION ABORTED: Courier transit recalled to regional distribution vault.");
  };

  /* --------------------------------------------------------------------------
     Microscopic Agglutination Canvas Animation
     -------------------------------------------------------------------------- */
  useEffect(() => {
    if (activeTab !== "agglutination-lab") return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animId = 0;
    const width = 360;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    // Create 60 microscopic erythrocytes
    const donor = selectedCase.sampleDonors[selectedDonorIdx];
    const isCompat = donor?.compatible ?? false;

    interface MicroRBC {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      rotation: number;
      clusterTargetX?: number;
      clusterTargetY?: number;
    }

    const cells: MicroRBC[] = Array.from({ length: 64 }, (_, i) => {
      const angle = (i / 64) * Math.PI * 2;
      const dist = 30 + Math.random() * 110;
      return {
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: 6.5 + Math.random() * 2.5,
        rotation: Math.random() * Math.PI,
        // Clusters in 3 tight clumps if agglutinating
        clusterTargetX: width / 2 + (Math.cos((i % 4) * (Math.PI / 2)) * 55),
        clusterTargetY: height / 2 + (Math.sin((i % 4) * (Math.PI / 2)) * 55),
      };
    });

    let elapsed = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      elapsed += 0.02;

      ctx.clearRect(0, 0, width, height);

      // Microscopic circular lens field
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width / 2 - 8, 0, Math.PI * 2);
      ctx.clip();

      // Optical liquid field background
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 2);
      grad.addColorStop(0, isSerumMixed ? (isCompat ? "rgba(10, 26, 44, 0.95)" : "rgba(38, 12, 18, 0.95)") : "rgba(8, 16, 30, 0.95)");
      grad.addColorStop(1, "rgba(4, 8, 16, 0.98)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Circular reticle grid lines (Microscope objective lines)
      ctx.strokeStyle = "rgba(0, 240, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
      ctx.arc(width / 2, height / 2, 120, 0, Math.PI * 2);
      ctx.moveTo(width / 2, 10);
      ctx.lineTo(width / 2, height - 10);
      ctx.moveTo(10, height / 2);
      ctx.lineTo(width - 10, height / 2);
      ctx.stroke();

      // Render RBCs
      for (let i = 0; i < cells.length; i += 1) {
        const c = cells[i];

        if (isSerumMixed) {
          if (!isCompat) {
            // Agglutination: cells gravitate strongly toward clump centers
            const tx = c.clusterTargetX ?? width / 2;
            const ty = c.clusterTargetY ?? height / 2;
            c.x += (tx - c.x) * 0.035;
            c.y += (ty - c.y) * 0.035;
            c.rotation += 0.01;
          } else {
            // Compatible: free laminar thermal Brownian motion
            c.x += c.vx + Math.sin(elapsed + i) * 0.25;
            c.y += c.vy + Math.cos(elapsed + i) * 0.25;
          }
        } else {
          // Pre-mix neutral gentle drift
          c.x += c.vx * 0.6;
          c.y += c.vy * 0.6;
        }

        // Boundary bounce
        const distFromCenter = Math.hypot(c.x - width / 2, c.y - height / 2);
        if (distFromCenter > width / 2 - 24) {
          c.vx *= -1;
          c.vy *= -1;
        }

        // Draw Erythrocyte Biconcave Disc
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);

        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 1.3, c.r * 0.9, 0, 0, Math.PI * 2);

        if (isSerumMixed && !isCompat) {
          // Agglutinated dark clotted red
          ctx.fillStyle = "rgba(225, 29, 72, 0.92)";
          ctx.strokeStyle = "rgba(255, 77, 109, 0.7)";
        } else {
          // Healthy oxygenated biconcave red
          ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
          ctx.strokeStyle = "rgba(254, 202, 202, 0.4)";
        }

        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();

        // Inner biconcave depression
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 0.55, c.r * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = isSerumMixed && !isCompat ? "rgba(136, 19, 55, 0.85)" : "rgba(185, 28, 28, 0.75)";
        ctx.fill();

        ctx.restore();
      }

      // If agglutinated, draw antibody cross-link filaments between nearby cells
      if (isSerumMixed && !isCompat) {
        ctx.strokeStyle = "rgba(255, 46, 86, 0.4)";
        ctx.lineWidth = 1;
        for (let i = 0; i < cells.length; i += 3) {
          for (let j = i + 1; j < Math.min(i + 5, cells.length); j += 1) {
            const d = Math.hypot(cells[i].x - cells[j].x, cells[i].y - cells[j].y);
            if (d < 36) {
              ctx.beginPath();
              ctx.moveTo(cells[i].x, cells[i].y);
              ctx.lineTo(cells[j].x, cells[j].y);
              ctx.stroke();
            }
          }
        }
      }

      ctx.restore();

      // Outer microscope brass/titanium barrel border
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width / 2 - 6, 0, Math.PI * 2);
      ctx.strokeStyle = isSerumMixed
        ? isCompat
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.85)"
        : "rgba(0, 240, 255, 0.4)";
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [activeTab, isSerumMixed, selectedCase, selectedDonorIdx]);

  const handleTestAgglutination = () => {
    setIsSerumMixed(true);
    tacticalAudio.playClick(1100);
    const donor = selectedCase.sampleDonors[selectedDonorIdx];
    if (donor?.compatible) {
      setTestResult("compatible");
      tacticalAudio.playDispatchChime();
      onNotify(`CROSS-MATCH PASSED: Zero agglutination observed for ${donor.name} (${donor.phenotype}). Safe for transfusion.`);
    } else {
      setTestResult("agglutinated");
      tacticalAudio.playSosAlert();
      onNotify(`FATAL AGGLUTINATION: ${donor?.reason}`);
    }
  };

  const handleResetTest = () => {
    setIsSerumMixed(false);
    setTestResult("pending");
    tacticalAudio.playClick(900);
  };

  /* --------------------------------------------------------------------------
     JSX RENDER
     -------------------------------------------------------------------------- */
  const selectedDonor = selectedCase.sampleDonors[selectedDonorIdx];

  return (
    <div className="adv-lab-shell glass">
      {/* Top Navigation Tabs */}
      <div className="adv-lab-tabs" role="tablist" aria-label="Clinical Innovations">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "uav-dispatch"}
          className={`adv-lab-tab ${activeTab === "uav-dispatch" ? "is-active" : ""}`}
          onClick={() => {
            tacticalAudio.playClick(1100);
            setActiveTab("uav-dispatch");
          }}
        >
          <span className="tab-glyph">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20" />
              <path d="m4.93 4.93 14.14 14.14" />
              <path d="m19.07 4.93-14.14 14.14" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </span>
          <span>Autonomous Medical UAV &amp; Green Corridor Dispatch</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "agglutination-lab"}
          className={`adv-lab-tab ${activeTab === "agglutination-lab" ? "is-active" : ""}`}
          onClick={() => {
            tacticalAudio.playClick(1200);
            setActiveTab("agglutination-lab");
          }}
        >
          <span className="tab-glyph">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="21.17" y1="8" x2="12" y2="8" />
              <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
              <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
            </svg>
          </span>
          <span>Rare Blood Phenotypes &amp; Agglutination Lab</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: AUTONOMOUS UAV & GREEN CORRIDOR AIR-GROUND DISPATCH
          ========================================================================= */}
      {activeTab === "uav-dispatch" && (
        <div className="lab-panel-grid">
          {/* Left Column: Mission Control & Telemetry HUD */}
          <div className="lab-controls-col">
            <div className="lab-card-header">
              <div>
                <span className="eyebrow is-teal">Traffic-Bypassing Life Transport</span>
                <h3>High-Velocity Emergency Blood Transit</h3>
              </div>
              <span className={`status-pill ${isTransitActive ? "is-live" : ""}`}>
                {isTransitActive ? "IN FLIGHT" : missionComplete ? "DELIVERED" : "PRE-FLIGHT READY"}
              </span>
            </div>

            {/* Mission Selector */}
            <div className="lab-field-group">
              <label htmlFor="mission-select" className="lab-label">Active Trauma Requisition Route</label>
              <select
                id="mission-select"
                className="input"
                value={selectedMission.id}
                onChange={(e) => {
                  const m = SAMPLE_MISSIONS.find((item) => item.id === e.target.value);
                  if (m) {
                    setSelectedMission(m);
                    setTransitProgress(0);
                    setMissionComplete(false);
                    tacticalAudio.playClick(1000);
                  }
                }}
              >
                {SAMPLE_MISSIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}: {m.destinationHospital.split(" (")[0]} — {m.component} ({m.group})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switcher: Drone vs Ground Ambulance */}
            <div className="mode-toggle-bar">
              <button
                type="button"
                className={`mode-btn ${transitMode === "uav" ? "is-active" : ""}`}
                onClick={() => {
                  setTransitMode("uav");
                  tacticalAudio.playClick(1200);
                }}
              >
                <div className="mode-btn-content">
                  <span className="mode-title">Autonomous Medical UAV</span>
                  <span className="mode-sub">6.2 km Vector · 7 min Direct Flight · Zero Traffic</span>
                </div>
                <span className="mode-badge is-highlight">75% Faster</span>
              </button>

              <button
                type="button"
                className={`mode-btn ${transitMode === "ground" ? "is-active" : ""}`}
                onClick={() => {
                  setTransitMode("ground");
                  tacticalAudio.playClick(1000);
                }}
              >
                <div className="mode-btn-content">
                  <span className="mode-title">Ground Green Corridor</span>
                  <span className="mode-sub">11.4 km Roadway · 28 min Traffic Escort</span>
                </div>
                <span className="mode-badge">Police Escort</span>
              </button>
            </div>

            {/* Real-Time Live Transit Telemetry Deck */}
            <div className="telemetry-deck">
              <div className="telem-row">
                <span className="telem-k">Cold-Chain Temperature</span>
                <span className={`telem-v ${tempDrift > 5.5 ? "is-warn" : "is-nominal"}`}>
                  +{tempDrift.toFixed(1)}°C (Nominal: +2°C to +6°C)
                </span>
              </div>
              <div className="telem-row">
                <span className="telem-k">Cruise Velocity</span>
                <span className="telem-v">{transitMode === "uav" ? "74 km/h (Airspeed)" : "32 km/h (City Traffic)"}</span>
              </div>
              <div className="telem-row">
                <span className="telem-k">Flight Altitude AGL</span>
                <span className="telem-v">{transitMode === "uav" ? `${Math.round(flightAltitude)} metres` : "Surface Level"}</span>
              </div>
              <div className="telem-row">
                <span className="telem-k">Payload Thermal Envelope</span>
                <span className="telem-v is-nominal">100% Active Peltier Preservation</span>
              </div>
            </div>

            {/* Progress & Launch Bar */}
            <div className="mission-progress-box">
              <div className="mission-progress-head">
                <span>Mission Waypoint Progress</span>
                <strong>{Math.round(transitProgress * 100)}%</strong>
              </div>
              <div className="mission-track">
                <div className="mission-fill" style={{ width: `${Math.round(transitProgress * 100)}%` }} />
              </div>
            </div>

            <div className="mission-actions">
              {!isTransitActive ? (
                <button type="button" className="btn btn-primary btn-lg" onClick={handleLaunchMission}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>{missionComplete ? "Re-Initiate Dispatch Run" : `Initiate ${transitMode === "uav" ? "Autonomous UAV Liftoff" : "Green Corridor Run"}`}</span>
                </button>
              ) : (
                <button type="button" className="btn btn-glass btn-lg" onClick={handleAbortMission}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  <span>Abort Mission &amp; Return to Hub</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Visual Flight Corridor Map HUD */}
          <div className="lab-visual-col">
            <div className="flight-hud-frame">
              <div className="flight-hud-topbar">
                <span className="hud-label">AIRSPACE VECTOR: {selectedMission.id}</span>
                <span className="hud-badge">GPS RTK DUAL LOCK</span>
              </div>

              {/* Graphic SVG Flight Vector Visualization */}
              <div className="flight-map-svg-wrap">
                <svg viewBox="0 0 460 260" className="flight-map-svg" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#ff2e56" stopOpacity="0.8" />
                    </linearGradient>
                    <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Topographic Background Contour Rings */}
                  <ellipse cx="230" cy="130" rx="200" ry="90" fill="none" stroke="rgba(0, 240, 255, 0.06)" strokeWidth="1" />
                  <ellipse cx="230" cy="130" rx="140" ry="60" fill="none" stroke="rgba(0, 240, 255, 0.08)" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Flight Corridor Buffer Zone */}
                  <path
                    d="M 60 170 Q 220 50 400 120"
                    fill="none"
                    stroke="rgba(0, 240, 255, 0.15)"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />

                  {/* Active Flight Vector Line */}
                  <path
                    d="M 60 170 Q 220 50 400 120"
                    fill="none"
                    stroke="url(#corridorGrad)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeDasharray={transitMode === "uav" ? "none" : "6 4"}
                  />

                  {/* Origin Hub (Blood Centre) */}
                  <circle cx="60" cy="170" r="14" fill="url(#hubGlow)" />
                  <circle cx="60" cy="170" r="6" fill="#00f0ff" />
                  <text x="60" y="200" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="var(--mono)">
                    CENTRE HUB
                  </text>

                  {/* Destination Hospital Helipad */}
                  <circle cx="400" cy="120" r="14" fill="rgba(255, 46, 86, 0.25)" />
                  <circle cx="400" cy="120" r="6" fill="#ff2e56" />
                  <text x="400" y="150" textAnchor="middle" fill="#ff4d6d" fontSize="10.5" fontFamily="var(--mono)">
                    TRAUMA ICU
                  </text>

                  {/* Moving Courier / UAV Entity */}
                  {(() => {
                    const t = transitProgress;
                    // Quadratic Bezier interpolation: P0=(60,170), P1=(220,50), P2=(400,120)
                    const curX = (1 - t) * (1 - t) * 60 + 2 * (1 - t) * t * 220 + t * t * 400;
                    const curY = (1 - t) * (1 - t) * 170 + 2 * (1 - t) * t * 50 + t * t * 120;

                    return (
                      <g transform={`translate(${curX}, ${curY})`}>
                        <circle r="12" fill={transitMode === "uav" ? "rgba(0, 240, 255, 0.3)" : "rgba(242, 162, 12, 0.3)"} />
                        <circle r="5" fill={transitMode === "uav" ? "#00f0ff" : "#f2a20c"} />
                        {transitMode === "uav" ? (
                          <text x="0" y="-14" textAnchor="middle" fill="#00f0ff" fontSize="9" fontWeight="700" fontFamily="var(--mono)">
                            UAV-01 ({Math.round(curX)}m)
                          </text>
                        ) : (
                          <text x="0" y="-14" textAnchor="middle" fill="#f2a20c" fontSize="9" fontWeight="700" fontFamily="var(--mono)">
                            ESCORT-01
                          </text>
                        )}
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Waypoint Coordinates & Manifest Footer */}
              <div className="flight-hud-footer">
                <div>
                  <span className="meta-k">Payload Specification</span>
                  <p className="meta-v">{selectedMission.component} · Group {selectedMission.group}</p>
                </div>
                <div>
                  <span className="meta-k">Origin Hub</span>
                  <p className="meta-v">{selectedMission.sourceHub.split(" (")[0]}</p>
                </div>
                <div>
                  <span className="meta-k">Emergency ETA</span>
                  <p className="meta-v is-highlight">
                    {transitMode === "uav" ? "6.5 min (Autonomous Air Corridor)" : "28 min (Ground Road Escort)"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RARE BLOOD PHENOTYPES & MICROSCOPIC AGGLUTINATION LAB
          ========================================================================= */}
      {activeTab === "agglutination-lab" && (
        <div className="lab-panel-grid">
          {/* Left Column: Phenotype Case File & Donors */}
          <div className="lab-controls-col">
            <div className="lab-card-header">
              <div>
                <span className="eyebrow is-crimson">Serological Immuno-Hematology</span>
                <h3>Beyond Standard ABO/Rh Transfusion</h3>
              </div>
              <span className="status-pill is-highlight">SEROLOGY LAB</span>
            </div>

            {/* Phenotype Case Selection */}
            <div className="lab-field-group">
              <label htmlFor="phenotype-select" className="lab-label">Rare Clinical Presentation Case</label>
              <select
                id="phenotype-select"
                className="input"
                value={selectedCase.id}
                onChange={(e) => {
                  const c = PHENOTYPE_CASES.find((item) => item.id === e.target.value);
                  if (c) {
                    setSelectedCase(c);
                    setSelectedDonorIdx(0);
                    setIsSerumMixed(false);
                    setTestResult("pending");
                    tacticalAudio.playClick(1100);
                  }
                }}
              >
                {PHENOTYPE_CASES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Clinical Dossier Breakdown */}
            <div className="pheno-dossier">
              <div className="dossier-row">
                <span className="telem-k">Patient Antigen Profile</span>
                <span className="telem-v">{selectedCase.antigenProfile}</span>
              </div>
              <div className="dossier-row">
                <span className="telem-k">Serum Antibodies Present</span>
                <span className="telem-v is-alert">{selectedCase.antibodyProfile}</span>
              </div>
              <p className="dossier-note">{selectedCase.clinicalChallenge}</p>
            </div>

            {/* Donor Candidate Selection */}
            <div className="lab-field-group">
              <span className="lab-label">Candidate Donor Unit for Cross-Match</span>
              <div className="donor-candidate-list">
                {selectedCase.sampleDonors.map((donor, idx) => (
                  <button
                    key={donor.name}
                    type="button"
                    className={`donor-candidate-btn ${selectedDonorIdx === idx ? "is-selected" : ""}`}
                    onClick={() => {
                      setSelectedDonorIdx(idx);
                      setIsSerumMixed(false);
                      setTestResult("pending");
                      tacticalAudio.playClick(1000);
                    }}
                  >
                    <div className="cand-info">
                      <strong>{donor.name}</strong>
                      <span>{donor.phenotype}</span>
                    </div>
                    <span className="cand-chip">Unit {idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cross-Match Action Button */}
            <div className="mission-actions">
              {!isSerumMixed ? (
                <button type="button" className="btn btn-primary btn-lg" onClick={handleTestAgglutination}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span>Mix Patient Serum &amp; Incubate Microscopic Slide</span>
                </button>
              ) : (
                <button type="button" className="btn btn-glass btn-lg" onClick={handleResetTest}>
                  <span>Wash Slide &amp; Test Another Donor Unit</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Live Microscopic Agglutination Viewport */}
          <div className="lab-visual-col">
            <div className="microscope-frame">
              <div className="microscope-header">
                <span className="hud-label">400x PHASE-CONTRAST MICROSCOPY</span>
                <span className={`hud-badge ${testResult === "compatible" ? "is-green" : testResult === "agglutinated" ? "is-red" : ""}`}>
                  {testResult === "compatible" ? "NEGATIVE AGGLUTINATION (SAFE)" : testResult === "agglutinated" ? "FATAL CLUMPING DETECTED" : "UNMIXED SUSPENSION"}
                </span>
              </div>

              {/* The Microscopic Eyepiece Canvas */}
              <div className="microscope-canvas-wrap">
                <canvas ref={canvasRef} className="microscope-canvas" />
                <div className="microscope-crosshair-hud">
                  <span>MAG: 400x</span>
                  <span>IMMUNOGLOBULIN M/G SCREEN</span>
                </div>
              </div>

              {/* Real-time Verdict Diagnosis */}
              <div className="microscope-verdict-card">
                {testResult === "pending" && (
                  <p className="verdict-pending">
                    Click <strong>&quot;Mix Patient Serum&quot;</strong> to simulate immunological antibody-antigen interaction on the slide.
                  </p>
                )}
                {testResult === "compatible" && (
                  <div className="verdict-box is-safe">
                    <div className="verdict-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>COMPATIBILITY CONFIRMED: ZERO AGGLUTINATION</span>
                    </div>
                    <p>{selectedDonor?.reason}</p>
                    <span className="clearance-badge">Cross-Match Verification Pass Issued</span>
                  </div>
                )}
                {testResult === "agglutinated" && (
                  <div className="verdict-box is-danger">
                    <div className="verdict-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff2e56" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>HIGH-RISK INTRAVASCULAR HEMOLYSIS DETECTED</span>
                    </div>
                    <p>{selectedDonor?.reason}</p>
                    <span className="clearance-badge is-alert">TRANSFUSION PROHIBITED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
