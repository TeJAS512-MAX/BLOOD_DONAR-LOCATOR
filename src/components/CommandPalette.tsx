import { useEffect, useMemo, useRef, useState } from "react";
import {
  BLOOD_BANKS,
  BLOOD_GROUPS,
  DONOR_PROFILES,
  type BloodGroup,
} from "../data/bloodlinkData";
import { tacticalAudio } from "../utils/tacticalAudio";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGroup: (group: BloodGroup) => void;
  onToggleEmergency: () => void;
  onOpenRegister: () => void;
  onToggleAudio: () => void;
  isAudioOn: boolean;
  onNavigate: (hash: string) => void;
}

interface CommandItem {
  id: string;
  category: "Actions" | "Blood Groups" | "Donors" | "Facilities" | "Navigation";
  title: string;
  subtitle?: string;
  badge?: string;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectGroup,
  onToggleEmergency,
  onOpenRegister,
  onToggleAudio,
  isAudioOn,
  onNavigate,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input whenever opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      tacticalAudio.playClick(1400);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // Global keydown for Escape and Arrows
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Build command dictionary
  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Actions
      {
        id: "act-emergency",
        category: "Actions",
        title: "Toggle Critical Trauma Mode",
        subtitle: "Activate high-alert arterial blood flow and priority dispatch routing",
        badge: "SYS-ALERT",
        action: () => {
          onToggleEmergency();
          onClose();
        },
      },
      {
        id: "act-register",
        category: "Actions",
        title: "Register Voluntary Donor Profile",
        subtitle: "Issue digital donor identity card and add to verified regional registry",
        badge: "FORM",
        action: () => {
          onOpenRegister();
          onClose();
        },
      },
      {
        id: "act-audio",
        category: "Actions",
        title: isAudioOn ? "Mute Tactical Audio Synthesizer" : "Enable Tactical Audio Synthesizer",
        subtitle: "Toggle Web Audio telemetry sound effects (radar blips, dispatch alerts)",
        badge: isAudioOn ? "AUDIO ON" : "AUDIO OFF",
        action: () => {
          onToggleAudio();
        },
      },

      // Navigation
      {
        id: "nav-find-blood",
        category: "Navigation",
        title: "Donor Registry Console",
        subtitle: "Jump to verified donor registry and compatibility search",
        badge: "#find-blood",
        action: () => {
          onNavigate("#find-blood");
          onClose();
        },
      },
      {
        id: "nav-radar",
        category: "Navigation",
        title: "Tactical Hospital Radar Scope",
        subtitle: "Jump to 2D geospatial dispatch radar and courier tracking",
        badge: "#radar",
        action: () => {
          onNavigate("#radar");
          onClose();
        },
      },
      {
        id: "nav-lab",
        category: "Navigation",
        title: "Autonomous UAV & Phenotype Lab",
        subtitle: "Explore medical drone dispatch and microscopic rare blood agglutination lab",
        badge: "#advanced-lab",
        action: () => {
          onNavigate("#advanced-lab");
          onClose();
        },
      },
      {
        id: "nav-requests",
        category: "Navigation",
        title: "Live Hospital Requisitions",
        subtitle: "Jump to emergency hospital blood orders across regional hubs",
        badge: "#requests",
        action: () => {
          onNavigate("#requests");
          onClose();
        },
      },
      {
        id: "nav-banks",
        category: "Navigation",
        title: "Regional Blood Bank Reserves",
        subtitle: "Inspect cold-chain inventory (PRBC, platelets, plasma)",
        badge: "#banks",
        action: () => {
          onNavigate("#banks");
          onClose();
        },
      },
      {
        id: "nav-guidelines",
        category: "Navigation",
        title: "Clinical Donation Guidelines & Criteria",
        subtitle: "Weight, hemoglobin thresholds, and interval clearance",
        badge: "#donate",
        action: () => {
          onNavigate("#donate");
          onClose();
        },
      },
    ];

    // Blood groups
    BLOOD_GROUPS.forEach((bg) => {
      list.push({
        id: `bg-${bg}`,
        category: "Blood Groups",
        title: `Filter by Group ${bg}`,
        subtitle:
          bg === "O-"
            ? "Universal Red Cell Donor (Emergent Trauma Safe)"
            : bg === "AB+"
              ? "Universal Red Cell Recipient (Can receive any ABO/Rh group)"
              : `Inspect safe donor and recipient pathways for Group ${bg}`,
        badge: bg,
        action: () => {
          onSelectGroup(bg);
          onNavigate("#find-blood");
          onClose();
        },
      });
    });

    // Donors
    DONOR_PROFILES.forEach((d) => {
      list.push({
        id: `donor-${d.id}`,
        category: "Donors",
        title: `${d.name} (${d.group})`,
        subtitle: `${d.location} · ${d.distanceKm} km · ${d.availability} · Supervised by ${d.verifiedBy}`,
        badge: d.id,
        action: () => {
          onSelectGroup(d.group);
          onNavigate("#find-blood");
          onClose();
        },
      });
    });

    // Facilities
    BLOOD_BANKS.forEach((b) => {
      list.push({
        id: `bank-${b.id}`,
        category: "Facilities",
        title: b.name,
        subtitle: `${b.area}, ${b.city} · ${b.type} · ${b.hours}`,
        badge: b.type,
        action: () => {
          onNavigate("#banks");
          onClose();
        },
      });
    });

    return list;
  }, [
    isAudioOn,
    onClose,
    onNavigate,
    onOpenRegister,
    onSelectGroup,
    onToggleAudio,
    onToggleEmergency,
  ]);

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 16);
    const q = query.toLowerCase().trim();
    return commands
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle?.toLowerCase().includes(q) ||
          c.badge?.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [commands, query]);

  // Ensure index stays in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      tacticalAudio.playClick(1400);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      tacticalAudio.playClick(1400);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        tacticalAudio.playClick(900);
        filtered[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command Palette"
    >
      <div className="cmd-palette-panel glass">
        {/* Search Input Bar */}
        <div className="cmd-input-wrap">
          <svg
            className="cmd-search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command, blood group (e.g. O-), donor, or hospital..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
          />
          <span className="cmd-kbd-hint">ESC to close</span>
        </div>

        {/* Results List */}
        <div className="cmd-results" ref={listRef} role="listbox">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`cmd-item ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    tacticalAudio.playClick(900);
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-item-main">
                    <div className="cmd-item-title-row">
                      <span className="cmd-item-cat">{item.category}</span>
                      <strong className="cmd-item-title">{item.title}</strong>
                    </div>
                    {item.subtitle && <p className="cmd-item-sub">{item.subtitle}</p>}
                  </div>
                  {item.badge && <span className="cmd-item-badge">{item.badge}</span>}
                </div>
              );
            })
          ) : (
            <div className="cmd-empty">
              <span>No donors, blood banks, or commands match &quot;{query}&quot;</span>
              <small>Try &quot;O-&quot;, &quot;Radar&quot;, &quot;Emergency&quot;, or &quot;Apollo&quot;</small>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cmd-footer">
          <div className="cmd-footer-keys">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>esc</kbd> Dismiss</span>
          </div>
          <span className="cmd-footer-telemetry">BloodLink Verified Clinical Network</span>
        </div>
      </div>
    </div>
  );
}
