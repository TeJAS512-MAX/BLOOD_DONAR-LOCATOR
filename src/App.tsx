import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { HeroNetworkGrid3D } from "./components/HeroNetworkGrid3D";
import { HospitalRadar2D } from "./components/HospitalRadar2D";
import { LiveBiomedicalBg3D } from "./components/LiveBiomedicalBg3D";
import { CommandPalette } from "./components/CommandPalette";
import { CompatibilityMatrixModal } from "./components/CompatibilityMatrixModal";
import { tacticalAudio } from "./utils/tacticalAudio";
import {
  BLOOD_BANKS,
  BLOOD_GROUPS,
  COMPATIBILITY_MAP,
  DONATION_GUIDES,
  DONOR_PROFILES,
  INITIAL_URGENT_REQUESTS,
  MYTHS_AND_FACTS,
  type BloodGroup,
  type BloodRequest,
  type DonorProfile,
} from "./data/bloodlinkData";

type ScenarioFilter = "all" | BloodRequest["scenario"];
type BankFilter = "all" | "Blood bank" | "Hospital partner";

interface DonorPass {
  id: string;
  name: string;
  group: BloodGroup;
  city: string;
}

const NAV_LINKS = [
  { href: "#find-blood", label: "Donor Registry" },
  { href: "#requests", label: "Requisitions" },
  { href: "#radar", label: "Dispatch Radar" },
  { href: "#banks", label: "Blood Banks" },
  { href: "#donate", label: "Guidelines" },
];

const PROBLEMS = [
  {
    index: "01",
    title: "Identifying Compatible Donors",
    problem: "Patient families often broadcast single-group appeals and overlook donors whose blood group is medically cross-compatible.",
    solution: "Automated ABO and Rh red-cell compatibility matching surfaces all safe donor groups, ordered by proximity and availability.",
    href: "#find-blood",
    cta: "Search Donor Registry",
  },
  {
    index: "02",
    title: "Verifying Blood Bank Inventory",
    problem: "Caregivers and hospital staff contact multiple centres individually to confirm component availability.",
    solution: "A centralized regional directory displays current Packed Red Cell, Platelet, and Plasma reserves across authorized centres.",
    href: "#banks",
    cta: "Inspect Regional Inventory",
  },
  {
    index: "03",
    title: "Coordinating Urgent Requisitions",
    problem: "Unverified requests circulate informally without centralized tracking or confirmed donor dispatch.",
    solution: "Hospital transfusion desks log verified requisitions and use the radial dispatch console to route nearby donors.",
    href: "#radar",
    cta: "Open Dispatch Console",
  },
];

const SCENARIO_FILTERS: { value: ScenarioFilter; label: string }[] = [
  { value: "all", label: "All Requisitions" },
  { value: "Emergency Trauma", label: "Emergency Trauma" },
  { value: "Critical Care", label: "Critical Care" },
  { value: "Planned Surgery", label: "Scheduled Surgery" },
];

const BANK_FILTERS: { value: BankFilter; label: string }[] = [
  { value: "all", label: "All Centres" },
  { value: "Blood bank", label: "Regional Blood Banks" },
  { value: "Hospital partner", label: "Hospital Blood Banks" },
];

const ELIGIBILITY = [
  { label: "Donor Age", value: "18–65 years" },
  { label: "Minimum Weight", value: "45 kg or above" },
  { label: "Minimum Haemoglobin", value: "12.5 g/dL or above" },
  { label: "Whole-Blood Interval", value: "90 days (men) · 120 days (women)" },
];

const QUICK_CITIES = [
  "All Cities",
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
] as const;

function getInitials(name: string) {
  const clean = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, "").trim();
  const parts = clean.split(" ");
  return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : clean.slice(0, 2).toUpperCase();
}

function shortHospital(name: string) {
  return name.split(" — ")[0];
}

function BrandMark() {
  return (
    <svg aria-hidden="true" className="brand-mark" viewBox="0 0 38 38">
      <path d="M19 5.5C15.6 10.6 8.8 17.5 8.8 23.2a10.2 10.2 0 0 0 20.4 0C29.2 17.5 22.4 10.6 19 5.5Z" />
      <circle cx="19" cy="21" r="3" />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 56">
      <path d="M24 2C17 13 4 26.5 4 37.5a20 20 0 0 0 40 0C44 26.5 31 13 24 2Z" />
    </svg>
  );
}

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg aria-hidden="true" className="icon icon-arrow" viewBox="0 0 20 20">
      <path d={direction === "right" ? "M3.5 10h12m-5-5 5 5-5 5" : "M16.5 10h-12m5-5-5 5 5 5"} />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 20 20">
      <circle cx="8.8" cy="8.8" r="5.6" />
      <path d="m13 13 4 4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 20 20">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 20 20">
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

function ChevronIcon({ open = false }: { open?: boolean }) {
  return (
    <svg aria-hidden="true" className={`icon chevron ${open ? "is-open" : ""}`} viewBox="0 0 20 20">
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

function App() {
  const radarRef = useRef<HTMLElement>(null);
  const requestsTrackRef = useRef<HTMLDivElement>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const requestSeq = useRef(2100);

  const [menuOpen, setMenuOpen] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [bgPulse, setBgPulse] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const [bloodGroup, setBloodGroup] = useState<"all" | BloodGroup>("O-");
  const [city, setCity] = useState("");
  const [availableNowOnly, setAvailableNowOnly] = useState(false);
  const [includeCompatible, setIncludeCompatible] = useState(true);
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [checkDonor, setCheckDonor] = useState<BloodGroup>("O-");
  const [checkPatient, setCheckPatient] = useState<BloodGroup>("A+");
  const [donorSort, setDonorSort] = useState<"distance" | "eta" | "donations">("distance");
  const [donorView, setDonorView] = useState<"grid" | "table">("grid");
  const [pingedDonorId, setPingedDonorId] = useState<string | null>(null);

  const [requests, setRequests] = useState<BloodRequest[]>(INITIAL_URGENT_REQUESTS);
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioFilter>("all");
  const [radarRequestId, setRadarRequestId] = useState(INITIAL_URGENT_REQUESTS[0].id);

  const [bankQuery, setBankQuery] = useState("");
  const [bankType, setBankType] = useState<BankFilter>("all");

  const [openGuide, setOpenGuide] = useState<number | null>(0);
  const [mythIndex, setMythIndex] = useState(0);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [donorPass, setDonorPass] = useState<DonorPass | null>(null);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
  const [activeDonor, setActiveDonor] = useState<DonorProfile | null>(null);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(tacticalAudio.enabled);
  const [liveClock, setLiveClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const modalOpen =
    registerOpen ||
    createRequestOpen ||
    activeRequest !== null ||
    activeDonor !== null ||
    isCmdOpen ||
    isMatrixOpen;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3800);
  }, []);

  const notify = useCallback(
    (message: string) => {
      setBgPulse((count) => count + 1);
      showToast(message);
    },
    [showToast],
  );

  const closeModals = useCallback(() => {
    setRegisterOpen(false);
    setCreateRequestOpen(false);
    setActiveRequest(null);
    setActiveDonor(null);
    setIsCmdOpen(false);
    setIsMatrixOpen(false);
  }, []);

  const openRegister = useCallback(() => {
    tacticalAudio.playClick(1000);
    setDonorPass(null);
    setRegisterOpen(true);
  }, []);

  const openRadarFor = useCallback(
    (requestId: string, message?: string) => {
      setRadarRequestId(requestId);
      setActiveRequest(null);
      setCreateRequestOpen(false);
      setBgPulse((count) => count + 1);
      if (message) showToast(message);
      // Wait for any modal to release the body scroll lock before scrolling.
      window.setTimeout(() => radarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    },
    [showToast],
  );

  const handlePingDonor = useCallback(
    (donor: DonorProfile) => {
      tacticalAudio.playBlip(1100);
      setPingedDonorId(donor.id);
      setBgPulse((c) => c + 1);
      showToast(
        `Priority Ping dispatched to ${donor.name} (${donor.group}) via ${donor.verifiedBy}. Standby acknowledged.`,
      );
      window.setTimeout(() => setPingedDonorId(null), 3200);
    },
    [showToast],
  );

  const handleTrackDonorOnRadar = useCallback(
    (donor: DonorProfile) => {
      tacticalAudio.playDispatchChime();
      const req =
        requests.find((r) => COMPATIBILITY_MAP[r.group].receiveRedCellsFrom.includes(donor.group)) ?? requests[0];
      openRadarFor(
        req.id,
        `Dispatch radar focused on ${donor.name} (${donor.group}) · Proximity ${donor.distanceKm} km.`,
      );
    },
    [openRadarFor, requests],
  );

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModals();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    modalCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [closeModals, modalOpen]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const matches = useMemo(() => {
    const query = city.trim().toLowerCase();
    const allowed: BloodGroup[] =
      bloodGroup === "all"
        ? BLOOD_GROUPS
        : includeCompatible
          ? COMPATIBILITY_MAP[bloodGroup].receiveRedCellsFrom
          : [bloodGroup];

    const list = DONOR_PROFILES.filter(
      (donor) =>
        allowed.includes(donor.group) &&
        (!query ||
          donor.city.toLowerCase().includes(query) ||
          donor.location.toLowerCase().includes(query) ||
          donor.name.toLowerCase().includes(query)) &&
        (!availableNowOnly || donor.availability === "Available Immediately"),
    );

    return list.sort((a, b) => {
      if (donorSort === "eta") {
        const etaA = Number.parseInt(a.responseWindow, 10) || 30;
        const etaB = Number.parseInt(b.responseWindow, 10) || 30;
        return etaA - etaB;
      }
      if (donorSort === "donations") {
        return (b.donationsCount ?? 0) - (a.donationsCount ?? 0);
      }
      if (bloodGroup !== "all") {
        const exactA = a.group === bloodGroup ? 0 : 1;
        const exactB = b.group === bloodGroup ? 0 : 1;
        if (exactA !== exactB) return exactA - exactB;
      }
      return a.distanceKm - b.distanceKm;
    });
  }, [availableNowOnly, bloodGroup, city, donorSort, includeCompatible]);

  const donorCountsByGroup = useMemo(() => {
    const counts: Record<string, number> = { all: DONOR_PROFILES.length };
    BLOOD_GROUPS.forEach((g) => {
      counts[g] = DONOR_PROFILES.filter((d) => d.group === g).length;
    });
    return counts;
  }, []);

  const filteredRequests = useMemo(
    () => requests.filter((request) => scenarioFilter === "all" || request.scenario === scenarioFilter),
    [requests, scenarioFilter],
  );

  const requestCities = useMemo(() => new Set(requests.map((request) => request.city)).size, [requests]);

  const filteredBanks = useMemo(() => {
    const query = bankQuery.trim().toLowerCase();
    return BLOOD_BANKS.filter(
      (bank) =>
        (bankType === "all" || bank.type === bankType) &&
        (!query || `${bank.name} ${bank.city} ${bank.area} ${bank.address}`.toLowerCase().includes(query)),
    );
  }, [bankQuery, bankType]);

  const checkCompatible = COMPATIBILITY_MAP[checkPatient].receiveRedCellsFrom.includes(checkDonor);
  const currentMyth = MYTHS_AND_FACTS[mythIndex];

  const toggleEmergency = () => {
    if (emergencyMode) {
      tacticalAudio.playClick(600);
      setEmergencyMode(false);
      showToast("Priority dispatch protocol deactivated.");
      return;
    }
    tacticalAudio.playSosAlert();
    setEmergencyMode(true);
    const critical = requests.find((request) => request.priority === "Critical") ?? requests[0];
    openRadarFor(
      critical.id,
      `Priority dispatch active — radar locked to ${critical.id} at ${shortHospital(critical.hospital)}.`,
    );
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBgPulse((count) => count + 1);
    showToast(
      `${matches.length} compatible ${matches.length === 1 ? "donor" : "donors"} matched${city.trim() ? ` in ${city.trim()}` : ""}.`,
    );
  };

  const handleHeroGroup = useCallback(
    (group: BloodGroup) => {
      setBloodGroup(group);
      setIncludeCompatible(true);
      setBgPulse((count) => count + 1);
      showToast(`Donor registry filtered for Group ${group} recipients.`);
    },
    [showToast],
  );

  const handleHeroBank = useCallback(() => {
    showToast("Blood bank node selected — inspect component inventory in the Blood Banks section.");
  }, [showToast]);

  const scrollRequests = (direction: 1 | -1) => {
    requestsTrackRef.current?.scrollBy({ left: direction * 380, behavior: "smooth" });
  };

  const sendDonorRequest = (donor: DonorProfile) => {
    setActiveDonor(null);
    notify(`Requisition relayed to ${donor.name} via ${donor.verifiedBy}. Contact details remain confidential until accepted.`);
  };

  const handleRegistration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const group = String(form.get("group") ?? "") as BloodGroup;
    const donorCity = String(form.get("city") ?? "").trim();
    if (!name || !donorCity || !BLOOD_GROUPS.includes(group)) return;
    setDonorPass({ id: `BL-${Math.floor(100000 + Math.random() * 900000)}`, name, group, city: donorCity });
    setBgPulse((count) => count + 1);
  };

  const handleCreateRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const group = String(form.get("group")) as BloodGroup;
    const hospital = String(form.get("hospital") ?? "").trim();
    const requestCity = String(form.get("city") ?? "").trim();
    const units = Math.max(1, Math.min(10, Number(form.get("units")) || 1));
    const scenario = String(form.get("scenario")) as BloodRequest["scenario"];
    if (!hospital || !requestCity) return;

    requestSeq.current += 1;
    const newRequest: BloodRequest = {
      id: `REQ-${requestSeq.current}`,
      group,
      units: `${units} ${units === 1 ? "Unit" : "Units"}`,
      hospital,
      department:
        scenario === "Emergency Trauma"
          ? "Emergency & Trauma"
          : scenario === "Critical Care"
            ? "Intensive Care Unit"
            : "Surgical Blood Desk",
      area: requestCity,
      city: requestCity,
      need:
        scenario === "Emergency Trauma"
          ? "Acute haemorrhage resuscitation protocol"
          : scenario === "Critical Care"
            ? "Critical care thrombocytopenia support"
            : "Cross-matched surgical standby reserve",
      scenario,
      priority: scenario === "Emergency Trauma" ? "Critical" : scenario === "Critical Care" ? "Urgent" : "Priority",
      updatedLabel: "Verified just now",
      componentNeeded: scenario === "Critical Care" ? "Single-Donor Platelets (SDP)" : "Packed Red Cells (PRBC)",
      crossMatchNote: "Cross-match sample received",
      attendingDesk: "Hospital Transfusion Desk",
    };

    setRequests((prev) => [newRequest, ...prev]);
    setScenarioFilter("all");
    openRadarFor(newRequest.id, `${newRequest.id} logged — dispatch radar scanning for ${group}-compatible donors.`);
  };

  const emergencyButton = (onClick: () => void) => (
    <button
      type="button"
      className={`emergency-btn ${emergencyMode ? "is-active" : ""}`}
      aria-pressed={emergencyMode}
      onClick={onClick}
    >
      <span className="pulse-dot" />
      {emergencyMode ? "Priority Dispatch Active" : "Priority Dispatch"}
    </button>
  );

  return (
    <>
      <LiveBiomedicalBg3D mode="auto" boostFlow={emergencyMode} activeBloodGroup={bloodGroup} pulseTriggerCount={bgPulse} />

      {/* Top Clinical Mission Control Telemetry Ribbon */}
      <div className="telemetry-ribbon">
        <div className="container ribbon-inner">
          <div className="ribbon-left">
            <span className="ribbon-tag is-pulse">
              <span className="pulse-dot is-green" /> SYS: NOMINAL
            </span>
            <span className="ribbon-metric">NODES: 7 HUBS</span>
            <span className="ribbon-metric">LATENCY: 14ms</span>
            <span className="ribbon-metric is-time">
              {liveClock.toLocaleTimeString()} IST
            </span>
          </div>

          <div className="ribbon-marquee" aria-hidden="true">
            <div className="ribbon-marquee-track">
              <span>BL-8841 Indiranagar (O-) priority courier en route to Manipal Trauma Desk</span>
              <span className="marquee-sep">/</span>
              <span>Narayana Health: 24 units A+ cold-chain verified</span>
              <span className="marquee-sep">/</span>
              <span>Apollo Trauma: 2 units uncrossmatched O- issued for emergency surgery</span>
              <span className="marquee-sep">/</span>
              <span>Southern Regional Blood Vault: +3.8°C nominal storage</span>
              <span className="marquee-sep">/</span>
              <span>Green Corridor Active: Indiranagar to Old Airport Rd (18 min ETA)</span>
            </div>
          </div>

          <div className="ribbon-right">
            <button
              type="button"
              className="ribbon-btn"
              onClick={() => {
                tacticalAudio.playClick(1000);
                setIsMatrixOpen(true);
              }}
              title="Open ABO/Rh Clinical Transfusion Cross-Match Matrix"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Cross-Match Matrix</span>
            </button>

            <button
              type="button"
              className="ribbon-btn"
              onClick={() => {
                const next = !isAudioOn;
                tacticalAudio.enabled = next;
                setIsAudioOn(next);
                if (next) tacticalAudio.playBlip(1000);
                showToast(next ? "Tactical audio synthesizer enabled." : "Tactical audio synthesizer muted.");
              }}
              title="Toggle Tactical Audio Telemetry"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {isAudioOn ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
              <span>{isAudioOn ? "Audio: On" : "Audio: Mute"}</span>
            </button>

            <button
              type="button"
              className="ribbon-btn is-kbd"
              onClick={() => {
                tacticalAudio.playClick(1200);
                setIsCmdOpen(true);
              }}
              title="Open Command Palette (Ctrl+K or ⌘K)"
            >
              <span>Command</span>
              <kbd className="cmd-chip">⌘K</kbd>
            </button>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#top" aria-label="BloodLink home" onClick={() => setMenuOpen(false)}>
            <BrandMark />
            <span>
              Blood<span className="brand-accent">Link</span>
            </span>
          </a>

          <nav id="primary-nav" className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <button
              type="button"
              className="nav-action-link"
              onClick={() => {
                setMenuOpen(false);
                tacticalAudio.playClick(1000);
                setIsMatrixOpen(true);
              }}
            >
              Cross-Match
            </button>
            <div className="mobile-actions">
              {emergencyButton(() => {
                setMenuOpen(false);
                toggleEmergency();
              })}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setMenuOpen(false);
                  openRegister();
                }}
              >
                Register as Donor
              </button>
            </div>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn-glass btn-cmd-trigger"
              onClick={() => {
                tacticalAudio.playClick(1200);
                setIsCmdOpen(true);
              }}
              title="Open Command Palette (Ctrl+K or ⌘K)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search</span>
              <kbd className="cmd-pill-kbd">⌘K</kbd>
            </button>
            {emergencyButton(toggleEmergency)}
            <button type="button" className="btn btn-primary" onClick={openRegister}>
              Register as Donor
            </button>
          </div>

          <button
            type="button"
            className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="hero-badge">
                <span className="pulse-dot" />
                Clinical Coordination · {requests.length} active requisitions across {requestCities} cities
              </span>
              <h1 className="hero-title">
                Every drop
                <br />
                <em>connects</em> a life.
              </h1>
              <p className="hero-sub">
                A unified clinical coordination platform for locating ABO/Rh-compatible voluntary donors, verifying
                regional blood bank inventory, and dispatching urgent hospital requisitions.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary btn-lg" href="#find-blood">
                  Locate Compatible Donors <ArrowIcon />
                </a>
                <button type="button" className="btn btn-glass btn-lg" onClick={openRegister}>
                  Register as a Donor
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <HeroNetworkGrid3D
                boostFlow={emergencyMode}
                onSelectDonorGroup={handleHeroGroup}
                onSelectBankView={handleHeroBank}
                onOpenRegister={openRegister}
                onOpenRadar={() => {
                  const firstReq = requests[0]?.id;
                  if (firstReq) openRadarFor(firstReq, "Focused on live emergency dispatch radar.");
                }}
                onNotify={notify}
              />
              <p className="hero-hint">Instant life-saving coordination: Match emergency blood, gauge donor impact, or verify bank reserves</p>
            </div>
          </div>
        </section>

        <section className="section theme-light problem-section" id="problem">
          <div className="container reveal">
            <div className="section-head is-center">
              <div className="section-head-copy">
                <span className="eyebrow">Clinical Challenge</span>
                <h2>
                  Three operational delays in <em>emergency</em> transfusion
                </h2>
                <p>
                  During trauma resuscitation, surgical procedures, and critical care, locating compatible blood
                  components is frequently delayed by fragmented communication.
                </p>
              </div>
            </div>
            <div className="problem-grid">
              {PROBLEMS.map((item) => (
                <article key={item.index} className="problem-card glass glass-lift">
                  <span className="problem-index">{item.index}</span>
                  <h3>{item.title}</h3>
                  <div className="problem-row">
                    <span>Conventional Practice</span>
                    <p>{item.problem}</p>
                  </div>
                  <div className="problem-row is-solution">
                    <span>BloodLink Protocol</span>
                    <p>{item.solution}</p>
                  </div>
                  <a className="problem-link" href={item.href}>
                    {item.cta} <ArrowIcon />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section theme-light finder-section" id="find-blood">
          <div className="container reveal">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow is-crimson">
                  <span className="pulse-dot" /> Verified Clinical Repository
                </span>
                <h2>
                  Locate <em>compatible</em> voluntary donors
                </h2>
                <p>
                  Search verified voluntary donors in real time, cross-matched by ABO/Rh compatibility, response readiness,
                  and transport latency across active trauma hubs.
                </p>
              </div>

              {/* Quick Summary Pill Bar */}
              <div className="registry-stats-pills" aria-label="Registry statistics">
                <span className="stat-pill">
                  <b>{DONOR_PROFILES.length}</b> Donors Registered
                </span>
                <span className="stat-pill is-highlight">
                  <b>{matches.length}</b> Matched
                </span>
                <span className="stat-pill">
                  <b>&lt; 20m</b> Trauma ETA
                </span>
              </div>
            </div>

            {/* MAIN COMMAND CONSOLE */}
            <div className="donor-console glass">
              {/* Row 1: Blood Group Quick-Pills with Counts */}
              <div className="group-pills-bar" role="group" aria-label="Filter by Blood Group">
                <span className="console-bar-label">RECIPIENT BLOOD GROUP:</span>
                <div className="group-pills-scroll">
                  <button
                    type="button"
                    className={`console-group-pill ${bloodGroup === "all" ? "is-active" : ""}`}
                    onClick={() => {
                      setBloodGroup("all");
                      setBgPulse((c) => c + 1);
                    }}
                  >
                    <span className="pill-name">All Groups</span>
                    <span className="pill-count">{donorCountsByGroup["all"]}</span>
                  </button>
                  {BLOOD_GROUPS.map((group) => {
                    const isSelected = bloodGroup === group;
                    return (
                      <button
                        key={group}
                        type="button"
                        className={`console-group-pill ${isSelected ? "is-active" : ""}`}
                        onClick={() => {
                          setBloodGroup(group);
                          setIncludeCompatible(true);
                          setBgPulse((c) => c + 1);
                        }}
                      >
                        <span className="pill-name">{group}</span>
                        <span className="pill-count">{donorCountsByGroup[group] ?? 0}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Omni Search + City Filter Chips */}
              <div className="console-search-row">
                <form className="console-search-form" onSubmit={handleSearch}>
                  <div className="console-search-input-wrap">
                    <SearchIcon />
                    <input
                      type="search"
                      className="console-search-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Search by donor name, locality, landmark, or city…"
                      aria-label="Search donor directory"
                    />
                    {city && (
                      <button
                        type="button"
                        className="console-clear-btn"
                        onClick={() => setCity("")}
                        aria-label="Clear search"
                      >
                        <CloseIcon />
                      </button>
                    )}
                  </div>
                </form>

                {/* City Chips */}
                <div className="city-chips-scroll" role="group" aria-label="Filter by city">
                  {QUICK_CITIES.map((c) => {
                    const active = (c === "All Cities" && !city) || city.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        className={`city-chip ${active ? "is-active" : ""}`}
                        onClick={() => {
                          setCity(c === "All Cities" ? "" : c);
                          setBgPulse((count) => count + 1);
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Tactical Filter Bar (Readiness, Compatible, Sort, View Mode) */}
              <div className="console-sub-bar">
                <div className="console-toggles">
                  <label className={`check ${bloodGroup === "all" ? "is-disabled" : ""}`}>
                    <input
                      type="checkbox"
                      checked={includeCompatible}
                      disabled={bloodGroup === "all"}
                      onChange={(e) => setIncludeCompatible(e.target.checked)}
                    />
                    <span>
                      Include all ABO/Rh-compatible groups
                      {bloodGroup !== "all" && ` (${COMPATIBILITY_MAP[bloodGroup].receiveRedCellsFrom.join(", ")})`}
                    </span>
                  </label>

                  <label className="check">
                    <input
                      type="checkbox"
                      checked={availableNowOnly}
                      onChange={(e) => setAvailableNowOnly(e.target.checked)}
                    />
                    <span>
                      <span className="status-dot is-live" /> Available Immediately (&lt; 30 min)
                    </span>
                  </label>
                </div>

                <div className="console-tools">
                  {/* Sort Dropdown */}
                  <div className="console-sort-wrap">
                    <label htmlFor="donor-sort-select">Sort:</label>
                    <select
                      id="donor-sort-select"
                      className="input input-sm console-select"
                      value={donorSort}
                      onChange={(e) => setDonorSort(e.target.value as "distance" | "eta" | "donations")}
                    >
                      <option value="distance">Proximity (Nearest)</option>
                      <option value="eta">Fastest Response ETA</option>
                      <option value="donations">Lifetime Donations</option>
                    </select>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="segmented segmented-sm" role="group" aria-label="Layout view">
                    <button
                      type="button"
                      aria-pressed={donorView === "grid"}
                      onClick={() => setDonorView("grid")}
                      title="Grid Card View"
                    >
                      Cards
                    </button>
                    <button
                      type="button"
                      aria-pressed={donorView === "table"}
                      onClick={() => setDonorView("table")}
                      title="Telemetry Table View"
                    >
                      Table
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTS RENDERING */}
            {matches.length > 0 ? (
              donorView === "grid" ? (
                <div className="donor-grid">
                  {matches.map((donor) => {
                    const exact = bloodGroup !== "all" && donor.group === bloodGroup;
                    const initials = getInitials(donor.name);
                    const isPinged = pingedDonorId === donor.id;
                    return (
                      <article key={donor.id} className="donor-card glass glass-lift">
                        {/* Top Bar with Avatar, Name, and Group */}
                        <div className="donor-card-top">
                          <div className="donor-avatar-wrap">
                            <span className="donor-avatar">{initials}</span>
                            <span
                              className={`donor-live-dot ${donor.availability === "Available Immediately" ? "is-live" : ""}`}
                            />
                          </div>

                          <div className="donor-card-identity">
                            <div className="donor-name-row">
                              <h3>{donor.name}</h3>
                              <span className="verified-shield" title="Verified Volunteer">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            </div>
                            <span className="donor-loc">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "inline", verticalAlign: "-1px", marginRight: "4px" }}>
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              {donor.location} · <b>{donor.distanceKm} km</b>
                            </span>
                          </div>

                          <div className="donor-card-badges">
                            <span className="group-badge is-glow">{donor.group}</span>
                          </div>
                        </div>

                        {/* Match & Badge Tags */}
                        <div className="donor-tags-row">
                          {bloodGroup !== "all" && (
                            <span className={`match-tag ${exact ? "is-exact" : "is-compat"}`}>
                              {exact ? "Exact Match" : "Cross-Compatible"}
                            </span>
                          )}
                          {donor.donorBadge && <span className="honor-badge">{donor.donorBadge}</span>}
                          <span className="eta-badge">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline", verticalAlign: "-1px", marginRight: "3px" }}>
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            {donor.responseWindow}
                          </span>
                        </div>

                        {/* Clinical Dossier Metric Grid */}
                        <div className="donor-metrics-grid">
                          <div className="metric-box">
                            <span className="metric-lbl">Donations</span>
                            <strong className="metric-val">{donor.donationsCount ?? 8}+</strong>
                          </div>
                          <div className="metric-box">
                            <span className="metric-lbl">Impact</span>
                            <strong className="metric-val">{donor.livesImpacted ?? 24} Lives</strong>
                          </div>
                          <div className="metric-box">
                            <span className="metric-lbl">Hemoglobin</span>
                            <strong className="metric-val">{donor.hemoglobin ?? "14.0 g/dL"}</strong>
                          </div>
                          <div className="metric-box">
                            <span className="metric-lbl">Blood Pressure</span>
                            <strong className="metric-val">{donor.bloodPressure ?? "120/80"}</strong>
                          </div>
                        </div>

                        {/* Supervision and Compatibility */}
                        <div className="donor-meta-footer">
                          <div className="meta-line">
                            <span className="meta-k">Supervising Centre:</span>
                            <span className="meta-v">{donor.verifiedBy}</span>
                          </div>
                          <div className="meta-line">
                            <span className="meta-k">Can donate to:</span>
                            <div className="recipient-chips">
                              {COMPATIBILITY_MAP[donor.group].donateRedCellsTo.map((rg) => (
                                <span key={rg} className={`recipient-chip ${rg === bloodGroup ? "is-target" : ""}`}>
                                  {rg}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="donor-card-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setActiveDonor(donor)}
                          >
                            Initiate Request
                          </button>
                          <button
                            type="button"
                            className="btn btn-glass btn-sm"
                            onClick={() => handlePingDonor(donor)}
                            disabled={isPinged}
                          >
                            {isPinged ? "Ping Sent" : "Direct Ping"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-glass btn-sm btn-icon-only"
                            onClick={() => handleTrackDonorOnRadar(donor)}
                            title="Locate on Radar"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="22" y1="12" x2="18" y2="12" />
                              <line x1="6" y1="12" x2="2" y2="12" />
                              <line x1="12" y1="6" x2="12" y2="2" />
                              <line x1="12" y1="22" x2="12" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* LIVE TELEMETRY TABLE VIEW */
                <div className="donor-table-wrap glass">
                  <table className="donor-table">
                    <thead>
                      <tr>
                        <th>Donor Identity</th>
                        <th>Blood Group</th>
                        <th>Match Status</th>
                        <th>Location &amp; Distance</th>
                        <th>Response Readiness</th>
                        <th>Supervision &amp; Impact</th>
                        <th className="th-actions">Direct Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((donor) => {
                        const exact = bloodGroup !== "all" && donor.group === bloodGroup;
                        const initials = getInitials(donor.name);
                        const isPinged = pingedDonorId === donor.id;
                        return (
                          <tr key={donor.id} className="donor-table-row">
                            <td>
                              <div className="td-donor-identity">
                                <span className="donor-avatar sm">{initials}</span>
                                <div>
                                  <strong>{donor.name}</strong>
                                  <small className="td-sub">
                                    {donor.id} · {donor.donorBadge ?? "Verified Volunteer"}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="group-badge is-glow">{donor.group}</span>
                            </td>
                            <td>
                              {bloodGroup !== "all" ? (
                                <span className={`match-tag ${exact ? "is-exact" : "is-compat"}`}>
                                  {exact ? "Exact Match" : "Compatible"}
                                </span>
                              ) : (
                                <span className="match-tag is-compat">ABO Safe</span>
                              )}
                            </td>
                            <td>
                              <div>
                                <span>{donor.location}</span>
                                <small className="td-dist">{donor.distanceKm} km radial</small>
                              </div>
                            </td>
                            <td>
                              <div className="td-readiness">
                                <span
                                  className={`status-dot ${donor.availability === "Available Immediately" ? "is-live" : ""}`}
                                />
                                <span>{donor.responseWindow}</span>
                              </div>
                            </td>
                            <td>
                              <div>
                                <span className="td-center">{donor.verifiedBy}</span>
                                <small className="td-impact">
                                  {donor.donationsCount ?? 8} donations ({donor.livesImpacted ?? 24} lives)
                                </small>
                              </div>
                            </td>
                            <td className="td-actions">
                              <div className="table-actions-stack">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  onClick={() => setActiveDonor(donor)}
                                >
                                  Request
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-glass btn-xs"
                                  onClick={() => handlePingDonor(donor)}
                                  disabled={isPinged}
                                >
                                  {isPinged ? "Pinged" : "Ping"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="empty-state-card glass">
                <div className="empty-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ margin: "0 auto", color: "var(--c-brand)" }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3>No compatible voluntary donors match your filters</h3>
                <p>
                  Try widening your location perimeter, selecting &quot;All Groups&quot;, or enabling cross-compatible matching.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setBloodGroup("all");
                    setCity("");
                    setAvailableNowOnly(false);
                    setIncludeCompatible(true);
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}

            <div className={`checker glass ${checkerOpen ? "is-open" : ""}`}>
              <button
                type="button"
                className="checker-toggle"
                aria-expanded={checkerOpen}
                aria-controls="checker-body"
                onClick={() => setCheckerOpen((open) => !open)}
              >
                <span>
                  <span className="panel-label">Transfusion Compatibility Reference</span>
                  <strong>Verify donor-to-recipient red-cell compatibility</strong>
                </span>
                <ChevronIcon open={checkerOpen} />
              </button>
              <div className={`pop-down ${checkerOpen ? "is-open" : ""}`} id="checker-body">
                <div className="pop-down-inner">
                  <div className="checker-body">
                    <div className="checker-grid">
                      <div>
                        <span className="panel-label">Donor Blood Group</span>
                        <div className="group-pills" role="group" aria-label="Donor blood group">
                          {BLOOD_GROUPS.map((group) => (
                            <button
                              key={group}
                              type="button"
                              className={`group-pill ${checkDonor === group ? "is-active" : ""}`}
                              aria-pressed={checkDonor === group}
                              onClick={() => setCheckDonor(group)}
                            >
                              {group}
                            </button>
                          ))}
                        </div>
                      </div>
                      <span className="checker-arrow" aria-hidden="true">
                        <ArrowIcon />
                      </span>
                      <div>
                        <span className="panel-label">Recipient Blood Group</span>
                        <div className="group-pills" role="group" aria-label="Patient blood group">
                          {BLOOD_GROUPS.map((group) => (
                            <button
                              key={group}
                              type="button"
                              className={`group-pill ${checkPatient === group ? "is-active" : ""}`}
                              aria-pressed={checkPatient === group}
                              onClick={() => setCheckPatient(group)}
                            >
                              {group}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`verdict ${checkCompatible ? "is-ok" : "is-bad"}`} aria-live="polite">
                      <div>
                        <span className="verdict-label">
                          {checkCompatible ? "Compatible Transfusion Match" : "Incompatible — Antigen Conflict"}
                        </span>
                        <strong>
                          Group {checkDonor} Donor → Group {checkPatient} Recipient
                        </strong>
                        <p>
                          {checkCompatible
                            ? `Group ${checkPatient} recipients may safely receive Packed Red Blood Cells from a Group ${checkDonor} donor.`
                            : `Group ${checkDonor} erythrocytes carry antigens incompatible with Group ${checkPatient} recipients. Compatible donor groups: ${COMPATIBILITY_MAP[checkPatient].receiveRedCellsFrom.join(", ")}.`}
                        </p>
                      </div>
                      {!checkCompatible && (
                        <button type="button" className="btn btn-glass btn-sm" onClick={() => setCheckDonor("O-")}>
                          Select Group O− (Universal Donor)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section requests-section" id="requests">
          <div className="container reveal">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">Active Requisitions</span>
                <h2>
                  Verified hospital <em>transfusion</em> requests
                </h2>
                <p>
                  Each requisition is logged by the hospital transfusion desk with required blood component, unit
                  volume, and clinical indication.
                </p>
              </div>
              <div className="section-head-actions">
                <button type="button" className="btn btn-primary" onClick={() => setCreateRequestOpen(true)}>
                  Submit Requisition
                </button>
                <div className="carousel-arrows">
                  <button type="button" className="icon-btn" aria-label="Previous requests" onClick={() => scrollRequests(-1)}>
                    <ArrowIcon direction="left" />
                  </button>
                  <button type="button" className="icon-btn" aria-label="Next requests" onClick={() => scrollRequests(1)}>
                    <ArrowIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className="filter-pills" role="group" aria-label="Filter requests">
              {SCENARIO_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`filter-pill ${scenarioFilter === filter.value ? "is-active" : ""}`}
                  aria-pressed={scenarioFilter === filter.value}
                  onClick={() => setScenarioFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="request-track" ref={requestsTrackRef}>
              {filteredRequests.map((request) => (
                <article
                  key={request.id}
                  className={`request-card glass glass-lift is-${request.priority.toLowerCase()}`}
                >
                  <div className="request-top">
                    <span className={`priority-tag is-${request.priority.toLowerCase()}`}>
                      <span className="pulse-dot" />
                      {request.priority}
                    </span>
                    <span className="request-id">
                      {request.id} · {request.updatedLabel}
                    </span>
                  </div>
                  <div className="request-blood">
                    <span className="drop-badge">
                      <DropIcon />
                      <strong>{request.group}</strong>
                    </span>
                    <div>
                      <strong className="request-units">{request.units}</strong>
                      <span className="request-component">{request.componentNeeded}</span>
                    </div>
                  </div>
                  <h3>{shortHospital(request.hospital)}</h3>
                  <p className="request-meta">
                    {request.department} · {request.city}
                  </p>
                  <p className="request-need">{request.need}</p>
                  <div className="card-actions">
                    <button type="button" className="btn btn-glass btn-sm" onClick={() => setActiveRequest(request)}>
                      Requisition Details
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        openRadarFor(
                          request.id,
                          `Dispatch radar scanning for ${request.group}-compatible donors near ${shortHospital(request.hospital)}.`,
                        )
                      }
                    >
                      Locate on Radar <ArrowIcon />
                    </button>
                  </div>
                </article>
              ))}
              {filteredRequests.length === 0 && <p className="empty-state">No active requisitions in this category.</p>}
            </div>
          </div>
        </section>

        <section className="section radar-section" id="radar" ref={radarRef}>
          <div className="container reveal">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow is-teal">Tactical Geospatial Dispatch Radar</span>
                <h2>
                  Geospatial ABO/Rh donor &amp; transit <em>coordination</em>
                </h2>
                <p>
                  Scan real-time compatible voluntary donors and blood bank vaults across a 2 km to 25 km regional perimeter.
                  Track live Green Corridor transit couriers, trigger AI Fast-Match auto-dispatch, or broadcast radial emergency alerts.
                </p>
              </div>
            </div>
            <HospitalRadar2D
              requests={requests}
              selectedRequestId={radarRequestId}
              onSelectRequest={setRadarRequestId}
              donors={DONOR_PROFILES}
              banks={BLOOD_BANKS}
              onNotify={notify}
            />
          </div>
        </section>

        <section className="section theme-light banks-section" id="banks">
          <div className="container reveal">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow is-teal">Blood Bank Inventory</span>
                <h2>
                  Component stock at <em>authorized</em> centres
                </h2>
                <p>
                  Current Packed Red Blood Cell (PRBC) units by blood group, alongside Single-Donor Platelets and Fresh
                  Frozen Plasma reserves. Groups with five or fewer units are flagged as low stock
                  {bloodGroup !== "all" ? `, and Group ${bloodGroup} is highlighted` : ""}.
                </p>
              </div>
              <div className="section-head-actions">
                <div className="filter-pills" role="group" aria-label="Filter blood banks">
                  {BANK_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      className={`filter-pill ${bankType === filter.value ? "is-active" : ""}`}
                      aria-pressed={bankType === filter.value}
                      onClick={() => setBankType(filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <input
                  className="input bank-search"
                  type="search"
                  value={bankQuery}
                  onChange={(event) => setBankQuery(event.target.value)}
                  placeholder="Filter by city or centre"
                  aria-label="Search blood banks"
                />
              </div>
            </div>

            {filteredBanks.length > 0 ? (
              <div className="bank-grid">
                {filteredBanks.map((bank) => (
                  <article key={bank.id} className="bank-card glass glass-lift">
                    <div className="card-top">
                      <span className={`type-tag ${bank.type === "Blood bank" ? "is-bank" : "is-hosp"}`}>{bank.type}</span>
                      <span className="bank-dist">
                        {bank.city} · {bank.distanceKm} km
                      </span>
                    </div>
                    <h3>{bank.name}</h3>
                    <p className="bank-meta">{bank.address}</p>
                    <p className="bank-hours">
                      <span className="status-dot is-live" />
                      {bank.hours}
                    </p>
                    <div className="stock-grid" aria-label={`Red-cell stock at ${bank.name}`}>
                      {BLOOD_GROUPS.map((group) => {
                        const units = bank.inventory[group];
                        return (
                          <span
                            key={group}
                            className={`stock-chip ${units <= 5 ? "is-low" : ""} ${group === bloodGroup ? "is-focus" : ""}`}
                            style={{ "--level": `${Math.min(100, Math.round((units / 40) * 100))}%` } as CSSProperties}
                          >
                            <b>{group}</b>
                            {units}
                          </span>
                        );
                      })}
                    </div>
                    <div className="bank-components">
                      <span>
                        Platelets <b>{bank.plateletsUnits}</b>
                      </span>
                      <span>
                        Plasma <b>{bank.plasmaUnits}</b>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">No authorized blood centres match the current filter.</p>
            )}
          </div>
        </section>

        <section className="section theme-light donate-section" id="donate">
          <div className="container reveal">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">Donor Guidelines</span>
                <h2>
                  Voluntary blood donation <em>standards</em>
                </h2>
                <p>
                  A single whole-blood donation can be separated into red cells, plasma, and platelets to support up to
                  three patients. Final eligibility is confirmed through a confidential medical screening at the blood
                  centre.
                </p>
              </div>
            </div>

            <div className="donate-grid">
              <div className="guide-list">
                {DONATION_GUIDES.map((guide, index) => {
                  const open = openGuide === index;
                  return (
                    <div key={guide.title} className={`guide-item glass ${open ? "is-open" : ""}`}>
                      <h3 className="guide-heading">
                        <button
                          type="button"
                          id={`guide-button-${index}`}
                          className="guide-trigger"
                          aria-expanded={open}
                          aria-controls={`guide-panel-${index}`}
                          onClick={() => setOpenGuide(open ? null : index)}
                        >
                          <span>
                            <small>{guide.summary}</small>
                            <strong>{guide.title}</strong>
                          </span>
                          <ChevronIcon open={open} />
                        </button>
                      </h3>
                      <div
                        id={`guide-panel-${index}`}
                        role="region"
                        aria-labelledby={`guide-button-${index}`}
                        className={`pop-down ${open ? "is-open" : ""}`}
                      >
                        <div className="pop-down-inner">
                          <p className="guide-body">{guide.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="donate-side">
                <div className="info-card glass">
                  <span className="panel-label">National Eligibility Standards (NBTC)</span>
                  <ul className="eligibility-list">
                    {ELIGIBILITY.map((item) => (
                      <li key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="fine-print">
                    Reference criteria per National Blood Transfusion Council (NBTC) donor guidelines.
                  </p>
                </div>

                <div className="info-card glass">
                  <div className="myth-head">
                    <span className="panel-label">Clinical Facts vs. Common Misconceptions</span>
                    <div className="myth-nav">
                      <button
                        type="button"
                        className="icon-btn is-sm"
                        aria-label="Previous myth"
                        onClick={() => setMythIndex((index) => (index - 1 + MYTHS_AND_FACTS.length) % MYTHS_AND_FACTS.length)}
                      >
                        <ArrowIcon direction="left" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn is-sm"
                        aria-label="Next myth"
                        onClick={() => setMythIndex((index) => (index + 1) % MYTHS_AND_FACTS.length)}
                      >
                        <ArrowIcon />
                      </button>
                    </div>
                  </div>
                  <div className="myth-slide" key={mythIndex} aria-live="polite">
                    <p className="myth-text">{currentMyth.myth}</p>
                    <p className="fact-text">
                      <strong>Clinical Fact:</strong> {currentMyth.fact}
                    </p>
                  </div>
                  <div className="slide-dots">
                    {MYTHS_AND_FACTS.map((item, index) => (
                      <button
                        key={item.myth}
                        type="button"
                        className={`slide-dot ${mythIndex === index ? "is-active" : ""}`}
                        aria-label={`Show myth ${index + 1}`}
                        aria-pressed={mythIndex === index}
                        onClick={() => setMythIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="cta-band glass">
              <div>
                <h3>Register with the Voluntary Donor Network</h3>
                <p>
                  Complete registration in under one minute. Participating hospitals view only your blood group and
                  locality until you accept a verified transfusion request.
                </p>
              </div>
              <button type="button" className="btn btn-light btn-lg" onClick={openRegister}>
                Register as a Donor <ArrowIcon />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <a className="brand" href="#top">
              <BrandMark />
              <span>
                Blood<span className="brand-accent">Link</span>
              </span>
            </a>
            <p className="footer-about">
              Clinical blood donor locator, regional inventory directory, and hospital requisition coordination
              platform.
            </p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 BloodLink Transfusion Coordination Platform</span>
          <span>
            Demonstration environment · all donor profiles, inventory figures, and hospital requisitions are
            illustrative sample records.
          </span>
        </div>
      </footer>

      {toast && (
        <div className="toast" role="status">
          <span className="pulse-dot is-teal" />
          <span>{toast}</span>
        </div>
      )}

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModals();
          }}
        >
          <section className="modal theme-light" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button ref={modalCloseRef} type="button" className="modal-close" aria-label="Close" onClick={closeModals}>
              <CloseIcon />
            </button>

            {registerOpen &&
              (donorPass ? (
                <>
                  <span className="success-mark">
                    <CheckIcon />
                  </span>
                  <span className="eyebrow is-teal">Registration Confirmed</span>
                  <h2 id="modal-title">{donorPass.name}</h2>
                  <p className="modal-intro">
                    Present this registration credential at an authorized blood centre during donor check-in.
                  </p>
                  <div className="donor-pass">
                    <div className="pass-top">
                      <span>Voluntary Donor Credential</span>
                      <span>{donorPass.id}</span>
                    </div>
                    <div className="pass-body">
                      <div>
                        <strong>{donorPass.name}</strong>
                        <span>{donorPass.city}</span>
                      </div>
                      <span className="group-badge is-lg">{donorPass.group}</span>
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary btn-lg btn-block" onClick={closeModals}>
                    Close
                  </button>
                </>
              ) : (
                <>
                  <span className="eyebrow">Voluntary Donor Registration</span>
                  <h2 id="modal-title">Register with the Donor Network</h2>
                  <p className="modal-intro">
                    Participating hospitals view only your blood group and locality. Personal contact information is
                    shared only when you accept a requisition.
                  </p>
                  <form className="form" onSubmit={handleRegistration}>
                    <label className="field">
                      <span>Full Name</span>
                      <input className="input" name="name" required autoComplete="name" placeholder="e.g. Aarav Nair" />
                    </label>
                    <div className="form-row">
                      <label className="field">
                        <span>Blood Group</span>
                        <select className="input" name="group" defaultValue="" required>
                          <option value="" disabled>
                            Select
                          </option>
                          {BLOOD_GROUPS.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>City or Locality</span>
                        <input
                          className="input"
                          name="city"
                          required
                          autoComplete="address-level2"
                          placeholder="e.g. Bengaluru"
                        />
                      </label>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg btn-block">
                      Issue Donor Credential <ArrowIcon />
                    </button>
                  </form>
                </>
              ))}

            {createRequestOpen && (
              <>
                <span className="eyebrow">Hospital Transfusion Desk</span>
                <h2 id="modal-title">Submit Urgent Requisition</h2>
                <p className="modal-intro">
                  Logged requisitions appear immediately in the active queue and initiate radial scanning for compatible
                  donors.
                </p>
                <form className="form" onSubmit={handleCreateRequest}>
                  <label className="field">
                    <span>Receiving Hospital</span>
                    <input
                      className="input"
                      name="hospital"
                      required
                      placeholder="e.g. Southern Regional Trauma Centre"
                    />
                  </label>
                  <div className="form-row">
                    <label className="field">
                      <span>Required Blood Group</span>
                      <select className="input" name="group" defaultValue="O-">
                        {BLOOD_GROUPS.map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Units Required</span>
                      <input className="input" name="units" type="number" min={1} max={10} defaultValue={2} required />
                    </label>
                  </div>
                  <div className="form-row">
                    <label className="field">
                      <span>City</span>
                      <input className="input" name="city" required defaultValue="Bengaluru" />
                    </label>
                    <label className="field">
                      <span>Clinical Category</span>
                      <select className="input" name="scenario" defaultValue="Emergency Trauma">
                        <option value="Emergency Trauma">Emergency Trauma</option>
                        <option value="Critical Care">Critical Care</option>
                        <option value="Planned Surgery">Scheduled Surgery</option>
                      </select>
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg btn-block">
                    Log Requisition <ArrowIcon />
                  </button>
                </form>
              </>
            )}

            {activeRequest && (
              <>
                <span className="eyebrow">
                  {activeRequest.id} · {activeRequest.scenario}
                </span>
                <div className="modal-group">{activeRequest.group}</div>
                <h2 id="modal-title">{shortHospital(activeRequest.hospital)}</h2>
                <p className="modal-intro">
                  {activeRequest.units} of {activeRequest.componentNeeded} · {activeRequest.city} ·{" "}
                  {activeRequest.updatedLabel}
                </p>
                <dl className="detail-list">
                  <div>
                    <dt>Department</dt>
                    <dd>{activeRequest.department}</dd>
                  </div>
                  <div>
                    <dt>Clinical Indication</dt>
                    <dd>{activeRequest.need}</dd>
                  </div>
                  <div>
                    <dt>Compatible Donor Groups</dt>
                    <dd>{COMPATIBILITY_MAP[activeRequest.group].receiveRedCellsFrom.join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Cross-Match Status</dt>
                    <dd>{activeRequest.crossMatchNote}</dd>
                  </div>
                  <div>
                    <dt>Authorizing Desk</dt>
                    <dd>{activeRequest.attendingDesk}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block"
                  onClick={() =>
                    openRadarFor(
                      activeRequest.id,
                      `Dispatch radar scanning for ${activeRequest.group}-compatible donors near ${shortHospital(activeRequest.hospital)}.`,
                    )
                  }
                >
                  Open on Dispatch Radar <ArrowIcon />
                </button>
              </>
            )}

            {activeDonor && (
              <>
                <span className="eyebrow is-teal">Registered Donor · {activeDonor.id}</span>
                <div className="modal-group">{activeDonor.group}</div>
                <h2 id="modal-title">{activeDonor.name}</h2>
                <p className="modal-intro">
                  {activeDonor.location} · {activeDonor.distanceKm} km away
                </p>
                <dl className="detail-list">
                  <div>
                    <dt>Availability Status</dt>
                    <dd>
                      {activeDonor.availability} · {activeDonor.responseWindow}
                    </dd>
                  </div>
                  <div>
                    <dt>Verification Centre</dt>
                    <dd>{activeDonor.verifiedBy}</dd>
                  </div>
                  <div>
                    <dt>Compatible Recipient Groups</dt>
                    <dd>{COMPATIBILITY_MAP[activeDonor.group].donateRedCellsTo.join(", ")}</dd>
                  </div>
                </dl>
                <p className="form-note">
                  Personal contact numbers remain confidential. Requisitions are relayed through {activeDonor.verifiedBy}.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block"
                  onClick={() => sendDonorRequest(activeDonor)}
                >
                  Transmit Requisition <ArrowIcon />
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {/* Universal Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onSelectGroup={(g) => {
          setBloodGroup(g);
          showToast(`Filtered registry by Group ${g}.`);
        }}
        onToggleEmergency={toggleEmergency}
        onOpenRegister={openRegister}
        onToggleAudio={() => {
          const next = !isAudioOn;
          tacticalAudio.enabled = next;
          setIsAudioOn(next);
          if (next) tacticalAudio.playBlip(1000);
          showToast(next ? "Tactical audio synthesizer active." : "Tactical audio synthesizer muted.");
        }}
        isAudioOn={isAudioOn}
        onNavigate={(hash) => {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {/* Clinical Transfusion Cross-Match Decision Matrix Modal */}
      <CompatibilityMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        onSelectGroup={(g) => {
          setBloodGroup(g);
          showToast(`Registry focused on Group ${g}.`);
          const el = document.querySelector("#find-blood");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </>
  );
}

export default App;
