import { useMemo, useState } from "react";
import {
  BLOOD_BANKS,
  BLOOD_GROUPS,
  COMPATIBILITY_MAP,
  DONOR_PROFILES,
  type BloodGroup,
} from "../data/bloodlinkData";
import { tacticalAudio } from "../utils/tacticalAudio";

interface HeroNetworkGrid3DProps {
  boostFlow?: boolean;
  onSelectDonorGroup?: (group: BloodGroup) => void;
  onSelectBankView?: () => void;
  onOpenRegister?: () => void;
  onOpenRadar?: () => void;
  onNotify?: (message: string) => void;
}

type HubTab = "emergency" | "donor" | "inventory";
type UrgencyLevel = "critical" | "urgent" | "planned";
type ComponentType = "PRBC" | "Platelets" | "Plasma" | "Whole";

export function HeroNetworkGrid3D({
  boostFlow = false,
  onSelectDonorGroup,
  onSelectBankView,
  onOpenRegister,
  onOpenRadar,
  onNotify,
}: HeroNetworkGrid3DProps) {
  const [activeTab, setActiveTab] = useState<HubTab>("emergency");
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>("O-");
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>("PRBC");
  const [urgency, setUrgency] = useState<UrgencyLevel>("critical");
  const [sosSent, setSosSent] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);

  // 30-Second Eligibility questions
  const [eligAgeWeight, setEligAgeWeight] = useState(true);
  const [eligInterval, setEligInterval] = useState(true);
  const [eligHealthy, setEligHealthy] = useState(true);

  // Total city inventory calculation for each blood group across all partner banks
  const cityInventory = useMemo(() => {
    const counts: Record<BloodGroup, number> = {
      "O-": 0,
      "O+": 0,
      "A-": 0,
      "A+": 0,
      "B-": 0,
      "B+": 0,
      "AB-": 0,
      "AB+": 0,
    };
    BLOOD_BANKS.forEach((bank) => {
      BLOOD_GROUPS.forEach((g) => {
        counts[g] += bank.inventory[g] ?? 0;
      });
    });
    return counts;
  }, []);

  // Safe compatible donor groups for the currently selected recipient
  const compatibleDonorGroups = useMemo(() => {
    return COMPATIBILITY_MAP[selectedGroup]?.receiveRedCellsFrom ?? [selectedGroup];
  }, [selectedGroup]);

  // Total available compatible units in city banks
  const totalCompatibleUnits = useMemo(() => {
    return compatibleDonorGroups.reduce((acc, g) => acc + (cityInventory[g] ?? 0), 0);
  }, [compatibleDonorGroups, cityInventory]);

  // Total registered donors on standby matching compatible groups
  const matchingDonorsCount = useMemo(() => {
    return DONOR_PROFILES.filter((d) => compatibleDonorGroups.includes(d.group)).length;
  }, [compatibleDonorGroups]);

  const handleGroupSelect = (group: BloodGroup) => {
    tacticalAudio.playBlip(950);
    setSelectedGroup(group);
    setSosSent(false);
    if (onSelectDonorGroup) {
      onSelectDonorGroup(group);
    }
  };

  const handleTriggerSOS = () => {
    tacticalAudio.playSosAlert();
    setSosSent(true);
    if (onSelectDonorGroup) {
      onSelectDonorGroup(selectedGroup);
    }
    const message = `EMERGENCY DISPATCH: Alert broadcast to ${matchingDonorsCount} compatible donors and nearest regional blood bank for Group ${selectedGroup} (${selectedComponent}).`;
    if (onNotify) {
      onNotify(message);
    }
  };

  const handleBookSlot = (time: string) => {
    tacticalAudio.playDispatchChime();
    setBookedSlot(time);
    const msg = `Priority donor slot confirmed for today at ${time} at Bengaluru Regional Blood Centre. SMS pass dispatched.`;
    if (onNotify) {
      onNotify(msg);
    }
  };

  const isEligible = eligAgeWeight && eligInterval && eligHealthy;
  const currentGroupStock = cityInventory[selectedGroup] ?? 0;
  const isEmergency = boostFlow || urgency === "critical";

  return (
    <div className={`hero-smart-hub-card ${isEmergency ? "is-emergency-boost" : ""}`}>
      {/* High-Tech Telemetry Top Bar */}
      <div className="hub-topbar">
        <div className="hub-topbar-title">
          <span className="pulse-dot" />
          <span>REAL-TIME CLINICAL COORDINATION HUB</span>
        </div>
        <span className="hub-status-pill">
          {isEmergency ? "CRITICAL TRIAGE" : "TELEMETRY ACTIVE"}
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="hub-tabs" role="tablist" aria-label="Coordination Modes">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "emergency"}
          className={`hub-tab-btn ${activeTab === "emergency" ? "is-active" : ""}`}
          onClick={() => {
            tacticalAudio.playClick(1100);
            setActiveTab("emergency");
          }}
        >
          <span className="tab-icon">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <span>Emergency Match</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "donor"}
          className={`hub-tab-btn ${activeTab === "donor" ? "is-active" : ""}`}
          onClick={() => {
            tacticalAudio.playClick(1200);
            setActiveTab("donor");
          }}
        >
          <span className="tab-icon">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C7 9 4 13 4 17a8 8 0 0 0 16 0c0-4-3-8-8-15Z" />
            </svg>
          </span>
          <span>Donor Impact</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "inventory"}
          className={`hub-tab-btn ${activeTab === "inventory" ? "is-active" : ""}`}
          onClick={() => {
            tacticalAudio.playClick(1300);
            setActiveTab("inventory");
          }}
        >
          <span className="tab-icon">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </span>
          <span>City Reserves</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY GOLDEN-HOUR MATCHMAKER */}
      {activeTab === "emergency" && (
        <div className="hub-tab-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Golden-Hour Transfusion Matchmaker</h3>
              <p className="panel-desc">
                Instant ABO/Rh cross-matching, verified cold-chain bank inventory lock, and rapid donor dispatch.
              </p>
            </div>
          </div>

          {/* Blood Group Selector */}
          <div className="hub-section">
            <span className="hub-label">1. Patient Blood Group Needed</span>
            <div className="group-picker-grid">
              {BLOOD_GROUPS.map((group) => {
                const isSel = selectedGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    className={`group-chip ${isSel ? "is-selected" : ""}`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <span className="group-name">{group}</span>
                    {group === "O-" && <span className="chip-badge">Universal</span>}
                    {group === "AB+" && <span className="chip-badge">Universal Rx</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Component & Urgency Selector */}
          <div className="hub-row">
            <div className="hub-col">
              <span className="hub-label">2. Component Required</span>
              <div className="sub-picker-row">
                {(["PRBC", "Platelets", "Plasma", "Whole"] as ComponentType[]).map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    className={`sub-pill ${selectedComponent === comp ? "is-active" : ""}`}
                    onClick={() => setSelectedComponent(comp)}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            <div className="hub-col">
              <span className="hub-label">3. Triage Urgency Level</span>
              <div className="sub-picker-row">
                <button
                  type="button"
                  className={`sub-pill is-critical ${urgency === "critical" ? "is-active" : ""}`}
                  onClick={() => setUrgency("critical")}
                >
                  Code Red (&lt; 20m)
                </button>
                <button
                  type="button"
                  className={`sub-pill is-warn ${urgency === "urgent" ? "is-active" : ""}`}
                  onClick={() => setUrgency("urgent")}
                >
                  Urgent (&lt; 2h)
                </button>
              </div>
            </div>
          </div>

          {/* AI Match Result Card */}
          <div className="match-result-card">
            <div className="match-card-header">
              <span className="pulse-dot is-red" />
              <strong>Verified Cross-Match Solution for Group {selectedGroup}</strong>
            </div>

            <div className="match-metrics-grid">
              <div className="metric-box">
                <span className="metric-val">{totalCompatibleUnits} Units</span>
                <span className="metric-lbl">In City Blood Banks</span>
                <small className="metric-sub">Across {compatibleDonorGroups.join(", ")}</small>
              </div>

              <div className="metric-box">
                <span className="metric-val">{matchingDonorsCount} Donors</span>
                <span className="metric-lbl">Standby in &lt; 5 km</span>
                <small className="metric-sub">Verified voluntary donors</small>
              </div>

              <div className="metric-box">
                <span className="metric-val">18–22 Min</span>
                <span className="metric-lbl">Green Corridor ETA</span>
                <small className="metric-sub">Priority transit routing</small>
              </div>
            </div>

            <div className="match-routing-detail">
              <span className="routing-bullet">Primary Vault:</span>
              <span>Bengaluru Regional Blood Centre · Cold-Chain Cross-Match Certified</span>
            </div>

            {sosSent ? (
              <div className="sos-dispatched-banner">
                <span className="pulse-dot is-green" />
                <div>
                  <strong>Emergency Signal Dispatched (Ref: BL-{Math.floor(1000 + Math.random() * 9000)})</strong>
                  <p>
                    {matchingDonorsCount} compatible voluntary donors alerted via priority SMS/IVR. Nearest cold-chain
                    vault alerted for preparation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="hub-action-row">
                <button
                  type="button"
                  className="btn btn-primary btn-block hub-btn-pulse"
                  onClick={handleTriggerSOS}
                >
                  Broadcast Emergency Signal
                </button>
                {onOpenRadar && (
                  <button type="button" className="btn btn-glass" onClick={onOpenRadar}>
                    Track on Radar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DONOR READINESS & IMPACT CALCULATOR */}
      {activeTab === "donor" && (
        <div className="hub-tab-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Voluntary Donor Readiness & Need Gauge</h3>
              <p className="panel-desc">
                Find out how critically your blood group is needed in the city today and check donation eligibility.
              </p>
            </div>
          </div>

          {/* Group Need Meter */}
          <div className="hub-section">
            <span className="hub-label">Select Your Blood Group</span>
            <div className="group-picker-grid">
              {BLOOD_GROUPS.map((group) => {
                const stock = cityInventory[group] ?? 0;
                const isLow = stock < 12;
                return (
                  <button
                    key={group}
                    type="button"
                    className={`group-chip ${selectedGroup === group ? "is-selected" : ""}`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <span className="group-name">{group}</span>
                    <span className={`chip-stock ${isLow ? "is-low" : ""}`}>{stock} units</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Supply Gauge Card */}
          <div className="donor-gauge-card">
            <div className="gauge-status-row">
              <span className="gauge-title">City Reserve for Group {selectedGroup}:</span>
              <span className={`gauge-badge ${currentGroupStock < 10 ? "is-critical" : "is-good"}`}>
                {currentGroupStock < 10
                  ? `CRITICAL DEFICIT (${currentGroupStock} units remaining)`
                  : `STABLE RESERVE (${currentGroupStock} units available)`}
              </span>
            </div>
            <p className="gauge-insight">
              {selectedGroup === "O-" &&
                "Group O- is the universal trauma donor. Emergency surgical rooms deplete O- units faster than any other group."}
              {selectedGroup === "O+" &&
                "Group O+ is the most frequently transfused red-cell group across all positive emergency patients."}
              {selectedGroup !== "O-" &&
                selectedGroup !== "O+" &&
                `Compatible with ${COMPATIBILITY_MAP[selectedGroup]?.donateRedCellsTo.join(", ")} recipient groups.`}
            </p>

            {/* Impact Equation */}
            <div className="impact-equation">
              <div className="impact-item">
                <span className="impact-num">1</span>
                <span className="impact-text">Donation (350ml)</span>
              </div>
              <span className="impact-op">=</span>
              <div className="impact-item">
                <span className="impact-num">3</span>
                <span className="impact-text">Clinical Components</span>
              </div>
              <span className="impact-op">→</span>
              <div className="impact-item is-highlight">
                <span className="impact-num">3</span>
                <span className="impact-text">Lives Saved</span>
              </div>
            </div>
          </div>

          {/* 30-Second Eligibility Checklist */}
          <div className="eligibility-box">
            <span className="hub-label">Rapid 30-Second Eligibility Check</span>
            <div className="elig-checks">
              <label className="elig-check-item">
                <input
                  type="checkbox"
                  checked={eligAgeWeight}
                  onChange={(e) => setEligAgeWeight(e.target.checked)}
                />
                <span>Age 18–65 and body weight above 50 kg</span>
              </label>

              <label className="elig-check-item">
                <input
                  type="checkbox"
                  checked={eligInterval}
                  onChange={(e) => setEligInterval(e.target.checked)}
                />
                <span>Last donation was over 3 months ago (or first time)</span>
              </label>

              <label className="elig-check-item">
                <input
                  type="checkbox"
                  checked={eligHealthy}
                  onChange={(e) => setEligHealthy(e.target.checked)}
                />
                <span>Feeling healthy, rested, and symptom-free today</span>
              </label>
            </div>

            {isEligible ? (
              <div className="elig-result is-eligible">
                <span>Verified: Clinically eligible for donation today.</span>
                {bookedSlot ? (
                  <div className="slot-confirmed-note">
                    Appointment confirmed for <strong>{bookedSlot}</strong> at Regional Blood Centre.
                  </div>
                ) : (
                  <div className="hub-action-row">
                    {onOpenRegister && (
                      <button type="button" className="btn btn-primary" onClick={onOpenRegister}>
                        Register Voluntary Credential
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-glass"
                      onClick={() => handleBookSlot("Today 4:30 PM")}
                    >
                      Book Priority Slot (4:30 PM)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="elig-result is-ineligible">
                <span>Notice: Please review medical eligibility criteria before presenting at a donor centre.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CITY INVENTORY & COMPATIBILITY MATRIX */}
      {activeTab === "inventory" && (
        <div className="hub-tab-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Regional Blood Bank Inventory Matrix</h3>
              <p className="panel-desc">
                Live cold-chain unit counts across authorized regional blood centres with ABO/Rh cross-compatibility.
              </p>
            </div>
          </div>

          <div className="inventory-grid-cards">
            {BLOOD_GROUPS.map((g) => {
              const count = cityInventory[g] ?? 0;
              const isCrit = count < 10;
              const isSelected = selectedGroup === g;
              return (
                <div
                  key={g}
                  className={`inventory-card ${isCrit ? "is-critical" : ""} ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleGroupSelect(g)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="inv-top">
                    <span className="inv-group">{g}</span>
                    <span className={`inv-status-tag ${isCrit ? "tag-red" : "tag-green"}`}>
                      {isCrit ? "Deficit" : "Optimal"}
                    </span>
                  </div>
                  <div className="inv-count-row">
                    <span className="inv-count">{count}</span>
                    <span className="inv-unit">Units Ready</span>
                  </div>
                  <div className="inv-compat">
                    <span>Donates: {COMPATIBILITY_MAP[g]?.donateRedCellsTo.join(", ")}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="inventory-summary-footer">
            <div className="summary-text">
              <strong>Emergency Transfusion Rule:</strong> Group <strong>O-</strong> is universally accepted by all 8 blood
              groups during trauma and acute massive blood loss prior to laboratory cross-matching.
            </div>
            {onSelectBankView && (
              <button type="button" className="btn btn-glass btn-sm" onClick={onSelectBankView}>
                View Blood Banks Directory →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
