import { useState } from "react";
import { BLOOD_GROUPS, COMPATIBILITY_MAP, type BloodGroup } from "../data/bloodlinkData";
import { tacticalAudio } from "../utils/tacticalAudio";

interface CompatibilityMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGroup?: (group: BloodGroup) => void;
}

type ComponentType = "PRBC" | "Plasma";

interface GroupImmunology {
  antigensRBC: string;
  antibodiesSerum: string;
  rhFactor: "Positive (+)" | "Negative (-)";
  clinicalRule: string;
}

const IMMUNOLOGY: Record<BloodGroup, GroupImmunology> = {
  "O-": {
    antigensRBC: "None (Neither A nor B)",
    antibodiesSerum: "Anti-A and Anti-B",
    rhFactor: "Negative (-)",
    clinicalRule:
      "Universal PRBC donor. Can be transfused to any recipient in emergency uncrossmatched trauma.",
  },
  "O+": {
    antigensRBC: "Rh(D) antigen only",
    antibodiesSerum: "Anti-A and Anti-B",
    rhFactor: "Positive (+)",
    clinicalRule:
      "Can donate PRBC to all Rh-positive groups (O+, A+, B+, AB+). Most common blood group.",
  },
  "A-": {
    antigensRBC: "A antigen only",
    antibodiesSerum: "Anti-B",
    rhFactor: "Negative (-)",
    clinicalRule: "Safe for A-, A+, AB-, AB+ red cell recipients.",
  },
  "A+": {
    antigensRBC: "A and Rh(D) antigens",
    antibodiesSerum: "Anti-B",
    rhFactor: "Positive (+)",
    clinicalRule: "Safe for A+ and AB+ recipients.",
  },
  "B-": {
    antigensRBC: "B antigen only",
    antibodiesSerum: "Anti-A",
    rhFactor: "Negative (-)",
    clinicalRule: "Safe for B-, B+, AB-, AB+ red cell recipients.",
  },
  "B+": {
    antigensRBC: "B and Rh(D) antigens",
    antibodiesSerum: "Anti-A",
    rhFactor: "Positive (+)",
    clinicalRule: "Safe for B+ and AB+ recipients.",
  },
  "AB-": {
    antigensRBC: "A and B antigens",
    antibodiesSerum: "None",
    rhFactor: "Negative (-)",
    clinicalRule: "Universal plasma donor for Rh-negative recipients. Rare red cell donor.",
  },
  "AB+": {
    antigensRBC: "A, B, and Rh(D) antigens",
    antibodiesSerum: "None (No ABO antibodies)",
    rhFactor: "Positive (+)",
    clinicalRule:
      "Universal red cell recipient. Can receive red blood cells of any ABO/Rh group.",
  },
};

// Plasma compatibility map (inverse of RBC)
const PLASMA_DONATE_MAP: Record<BloodGroup, BloodGroup[]> = {
  "AB+": ["AB+"],
  "AB-": ["AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

export function CompatibilityMatrixModal({
  isOpen,
  onClose,
  onSelectGroup,
}: CompatibilityMatrixModalProps) {
  const [component, setComponent] = useState<ComponentType>("PRBC");
  const [inspectedGroup, setInspectedGroup] = useState<BloodGroup>("O-");

  if (!isOpen) return null;

  const info = IMMUNOLOGY[inspectedGroup];
  const isPrbc = component === "PRBC";

  return (
    <div
      className="matrix-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Clinical ABO/Rh Cross-Match Matrix"
    >
      <div className="matrix-modal-panel glass">
        {/* Header */}
        <div className="matrix-modal-header">
          <div>
            <div className="matrix-eyebrow">
              <span className="pulse-dot" /> CLINICAL DECISION SUPPORT
            </div>
            <h2>ABO/Rh Transfusion Cross-Match Matrix</h2>
            <p>
              Interactive red-cell antigen vs serum antibody compatibility tables and uncrossmatched emergency rules.
            </p>
          </div>
          <button
            type="button"
            className="matrix-close-btn"
            onClick={onClose}
            aria-label="Close matrix"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Component Selector */}
        <div className="matrix-component-tabs">
          <button
            type="button"
            className={`matrix-tab ${isPrbc ? "is-active" : ""}`}
            onClick={() => {
              setComponent("PRBC");
              tacticalAudio.playClick(1200);
            }}
          >
            Packed Red Blood Cells (PRBC)
          </button>
          <button
            type="button"
            className={`matrix-tab ${!isPrbc ? "is-active" : ""}`}
            onClick={() => {
              setComponent("Plasma");
              tacticalAudio.playClick(1200);
            }}
          >
            Fresh Frozen Plasma (FFP)
          </button>
        </div>

        {/* Interactive Matrix Grid */}
        <div className="matrix-grid-wrap">
          <div className="matrix-table-scroll">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="corner-th">Donor \ Recipient</th>
                  {BLOOD_GROUPS.map((recipient) => (
                    <th
                      key={recipient}
                      className={inspectedGroup === recipient ? "is-highlighted-col" : ""}
                    >
                      {recipient}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOOD_GROUPS.map((donor) => {
                  const isInspectedDonor = inspectedGroup === donor;
                  return (
                    <tr key={donor} className={isInspectedDonor ? "is-highlighted-row" : ""}>
                      <th
                        className="donor-th"
                        onClick={() => {
                          setInspectedGroup(donor);
                          tacticalAudio.playClick(1000);
                        }}
                      >
                        <span className="matrix-group-pill">{donor}</span>
                      </th>
                      {BLOOD_GROUPS.map((recipient) => {
                        const isCompatible = isPrbc
                          ? COMPATIBILITY_MAP[donor].donateRedCellsTo.includes(recipient)
                          : PLASMA_DONATE_MAP[recipient]?.includes(donor);

                        return (
                          <td
                            key={recipient}
                            className={`matrix-cell ${isCompatible ? "is-compat" : "is-incompat"}`}
                            onClick={() => {
                              setInspectedGroup(donor);
                              tacticalAudio.playClick(900);
                            }}
                            title={`Donor ${donor} to Recipient ${recipient}: ${isCompatible ? "Safe Transfusion" : "Incompatible - Hemolysis Risk"}`}
                          >
                            {isCompatible ? (
                              <span className="matrix-check">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{display:'inline-block', verticalAlign:'-1px'}}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            ) : (
                              <span className="matrix-dash">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Dossier for Selected Group */}
        <div className="matrix-group-dossier glass">
          <div className="dossier-head">
            <div className="dossier-title-row">
              <span className="group-badge is-glow">{inspectedGroup}</span>
              <div>
                <strong>Group {inspectedGroup} Immunological Profile</strong>
                <span>Rh Factor: {info.rhFactor}</span>
              </div>
            </div>
            {onSelectGroup && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onSelectGroup(inspectedGroup);
                  onClose();
                }}
              >
                Filter Registry by {inspectedGroup}
              </button>
            )}
          </div>

          <div className="dossier-details-grid">
            <div className="dossier-box">
              <span className="dossier-lbl">RBC Surface Antigens</span>
              <strong className="dossier-val">{info.antigensRBC}</strong>
            </div>
            <div className="dossier-box">
              <span className="dossier-lbl">Serum Circulating Antibodies</span>
              <strong className="dossier-val">{info.antibodiesSerum}</strong>
            </div>
            <div className="dossier-box full-width">
              <span className="dossier-lbl">Clinical Transfusion Guidance</span>
              <p className="dossier-rule">{info.clinicalRule}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
