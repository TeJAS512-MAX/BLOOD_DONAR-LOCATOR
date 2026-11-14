import { useState } from "react";
import { tacticalAudio } from "../utils/tacticalAudio";

type CrisisScenario = "baseline" | "dengue" | "trauma";

interface ScenarioData {
  id: CrisisScenario;
  title: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  affectedComponent: string;
  demandSurge: string;
  hoursUntilDepletion: number;
  reserveStatus: "Stable" | "Depleted in 18h" | "Critical Deficit (<6h)";
  recommendedAction: string;
  projections: { day: string; projectedDemand: number; currentSupply: number }[];
  targetDonors: string;
}

const SCENARIOS: Record<CrisisScenario, ScenarioData> = {
  baseline: {
    id: "baseline",
    title: "Standard Metropolitan Equilibrium",
    tagline: "Routine elective surgical and trauma caseload",
    badge: "System Balanced",
    badgeColor: "rgba(16, 185, 129, 0.2)",
    affectedComponent: "All Components",
    demandSurge: "+0% (Nominal)",
    hoursUntilDepletion: 168,
    reserveStatus: "Stable",
    recommendedAction: "Maintain standard 90-day regular voluntary donor scheduling.",
    projections: [
      { day: "Mon", projectedDemand: 45, currentSupply: 52 },
      { day: "Tue", projectedDemand: 48, currentSupply: 54 },
      { day: "Wed", projectedDemand: 42, currentSupply: 50 },
      { day: "Thu", projectedDemand: 46, currentSupply: 51 },
      { day: "Fri", projectedDemand: 50, currentSupply: 53 },
      { day: "Sat", projectedDemand: 38, currentSupply: 48 },
      { day: "Sun", projectedDemand: 35, currentSupply: 45 },
    ],
    targetDonors: "All regular voluntary donors (A, B, AB, O)",
  },
  dengue: {
    id: "dengue",
    title: "Seasonal Monsoon Dengue Surge",
    tagline: "Acute thrombocytopenia epidemic with platelet counts crashing below 20,000/µL",
    badge: "Platelet Emergency Alert",
    badgeColor: "rgba(239, 68, 68, 0.25)",
    affectedComponent: "Single-Donor Platelets (SDP & RDP)",
    demandSurge: "+340% Spike",
    hoursUntilDepletion: 18.5,
    reserveStatus: "Depleted in 18h",
    recommendedAction: "Activate priority apheresis donor callout; platelets degrade after 5 days.",
    projections: [
      { day: "Mon", projectedDemand: 85, currentSupply: 42 },
      { day: "Tue", projectedDemand: 110, currentSupply: 38 },
      { day: "Wed", projectedDemand: 145, currentSupply: 29 },
      { day: "Thu", projectedDemand: 160, currentSupply: 22 },
      { day: "Fri", projectedDemand: 175, currentSupply: 15 },
      { day: "Sat", projectedDemand: 150, currentSupply: 12 },
      { day: "Sun", projectedDemand: 130, currentSupply: 10 },
    ],
    targetDonors: "Repeat Apheresis Donors (Platelet count > 2.5 × 10⁵/µL)",
  },
  trauma: {
    id: "trauma",
    title: "Mass-Casualty Highway Incident",
    tagline: "Severe blunt trauma haemorrhagic shock across 3 regional trauma bays",
    badge: "Red-Cell Deficit Code Red",
    badgeColor: "rgba(244, 63, 94, 0.3)",
    affectedComponent: "Packed Red Blood Cells (O- / O+ / A-)",
    demandSurge: "+420% Emergency Requisition",
    hoursUntilDepletion: 5.4,
    reserveStatus: "Critical Deficit (<6h)",
    recommendedAction: "Execute massive transfusion protocol (MTP); mobilize regional universal O-negative reserves.",
    projections: [
      { day: "Hour 0", projectedDemand: 30, currentSupply: 40 },
      { day: "Hour 2", projectedDemand: 75, currentSupply: 28 },
      { day: "Hour 4", projectedDemand: 120, currentSupply: 14 },
      { day: "Hour 6", projectedDemand: 140, currentSupply: 4 },
      { day: "Hour 8", projectedDemand: 90, currentSupply: 2 },
      { day: "Hour 10", projectedDemand: 60, currentSupply: 1 },
      { day: "Hour 12", projectedDemand: 40, currentSupply: 1 },
    ],
    targetDonors: "Universal O-Negative & O-Positive Whole Blood Donors",
  },
};

interface CrisisSurgeForecasterProps {
  onMobilizeDonors?: (scenario: ScenarioData) => void;
}

export function CrisisSurgeForecaster({ onMobilizeDonors }: CrisisSurgeForecasterProps) {
  const [activeScenario, setActiveScenario] = useState<CrisisScenario>("dengue");
  const [alertDispatched, setAlertDispatched] = useState(false);

  const scenario = SCENARIOS[activeScenario];

  const handleScenarioSwitch = (key: CrisisScenario) => {
    setActiveScenario(key);
    setAlertDispatched(false);
    tacticalAudio.playClick(key === "trauma" ? 1300 : key === "dengue" ? 1100 : 900);
  };

  const handleMobilize = () => {
    tacticalAudio.playDispatchChime();
    setAlertDispatched(true);
    onMobilizeDonors?.(scenario);
  };

  return (
    <section className="section theme-light surge-section" id="crisis-forecast">
      <div className="container reveal">
        <div className="section-head">
          <div className="section-head-copy">
            <span className="eyebrow is-crimson">
              <span className="pulse-dot" /> Predictive Clinical Forecasting
            </span>
            <h2>
              Epidemic & Crisis <em>Demand Surge</em> Forecaster
            </h2>
            <p>
              Simulate dynamic demand shocks—from seasonal monsoon dengue platelet surges to mass-casualty trauma
              incidents—and proactively mobilize targeted voluntary donor cohorts before bio-vault reserves exhaust.
            </p>
          </div>

          {/* Scenario Tab Toggles */}
          <div className="scenario-toggles-bar" role="tablist" aria-label="Crisis scenarios">
            <button
              type="button"
              className={`scenario-toggle-btn ${activeScenario === "baseline" ? "is-active" : ""}`}
              onClick={() => handleScenarioSwitch("baseline")}
              role="tab"
              aria-selected={activeScenario === "baseline"}
            >
              Standard Baseline
            </button>
            <button
              type="button"
              className={`scenario-toggle-btn is-dengue ${activeScenario === "dengue" ? "is-active" : ""}`}
              onClick={() => handleScenarioSwitch("dengue")}
              role="tab"
              aria-selected={activeScenario === "dengue"}
            >
              Monsoon Dengue (Platelets)
            </button>
            <button
              type="button"
              className={`scenario-toggle-btn is-trauma ${activeScenario === "trauma" ? "is-active" : ""}`}
              onClick={() => handleScenarioSwitch("trauma")}
              role="tab"
              aria-selected={activeScenario === "trauma"}
            >
              Mass Casualty (PRBC)
            </button>
          </div>
        </div>

        {/* Bento Grid Forecasting Dashboard */}
        <div className="surge-dashboard bento-grid">
          {/* Main Visual: Projected Demand vs Current Reserve Supply */}
          <article className="bento-card glass bento-span-8 surge-chart-card">
            <div className="surge-chart-header">
              <div>
                <span className="bento-badge" style={{ background: scenario.badgeColor }}>
                  {scenario.badge}
                </span>
                <h3>{scenario.title}</h3>
                <p className="scenario-tagline-text">{scenario.tagline}</p>
              </div>

              <div className="chart-legend">
                <span className="legend-item demand">
                  <span className="legend-swatch demand-swatch" /> Projected Demand
                </span>
                <span className="legend-item supply">
                  <span className="legend-swatch supply-swatch" /> Current Bank Reserve
                </span>
              </div>
            </div>

            {/* SVG High-Precision Comparison Graph */}
            <div className="svg-forecast-container">
              <div className="forecast-bars-row">
                {scenario.projections.map((pt, i) => {
                  const maxVal = Math.max(...scenario.projections.map((p) => Math.max(p.projectedDemand, p.currentSupply)), 100);
                  const demandHeight = (pt.projectedDemand / maxVal) * 100;
                  const supplyHeight = (pt.currentSupply / maxVal) * 100;
                  const isDeficit = pt.projectedDemand > pt.currentSupply;

                  return (
                    <div key={i} className="forecast-col">
                      <div className="bars-track">
                        <div
                          className="bar-fill bar-demand"
                          style={{ height: `${demandHeight}%` }}
                          title={`Demand: ${pt.projectedDemand} units`}
                        >
                          <span className="bar-val-pop">{pt.projectedDemand}</span>
                        </div>
                        <div
                          className={`bar-fill bar-supply ${isDeficit ? "is-deficit" : ""}`}
                          style={{ height: `${supplyHeight}%` }}
                          title={`Reserve: ${pt.currentSupply} units`}
                        >
                          <span className="bar-val-pop">{pt.currentSupply}</span>
                        </div>
                      </div>
                      <span className="col-label">{pt.day}</span>
                      {isDeficit && <span className="col-deficit-indicator">DEFICIT</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="surge-action-bar">
              <div className="surge-action-copy">
                <strong>Protocol Recommendation:</strong>
                <span>{scenario.recommendedAction}</span>
              </div>

              <button
                type="button"
                className={`btn ${alertDispatched ? "btn-glass" : "btn-primary"} btn-sm`}
                onClick={handleMobilize}
              >
                {alertDispatched ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m4 10 4 4 8-9" />
                    </svg>
                    <span>Mobilization Dispatched</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span>Mobilize {scenario.affectedComponent} Donors</span>
                  </>
                )}
              </button>
            </div>
          </article>

          {/* Side Bento Card: Live Deficit Telemetry */}
          <article className="bento-card glass bento-span-4 surge-telemetry-card">
            <span className="bento-badge">REAL-TIME INVENTORY EXHAUSTION</span>
            <div className="depletion-clock-block">
              <span className="clock-label">ESTIMATED EXHAUSTION TIMELINE</span>
              <div className="clock-digits">
                <span className="big-num">{scenario.hoursUntilDepletion}</span>
                <span className="unit">HOURS</span>
              </div>
              <div className={`depletion-status-tag status-${scenario.id}`}>
                {scenario.reserveStatus}
              </div>
            </div>

            <div className="surge-spec-list">
              <div className="spec-row">
                <span>Vulnerable Fraction:</span>
                <strong>{scenario.affectedComponent}</strong>
              </div>
              <div className="spec-row">
                <span>Predicted Rate Spike:</span>
                <strong className="spike-accent">{scenario.demandSurge}</strong>
              </div>
              <div className="spec-row">
                <span>Targeted Donor Cohort:</span>
                <span className="donor-cohort-tag">{scenario.targetDonors}</span>
              </div>
            </div>

            <div className="automated-dispatch-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Algorithm triggers proximity-weighted SMS and push alerts to donors within a 12 km radius.</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
