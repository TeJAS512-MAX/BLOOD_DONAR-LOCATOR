import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { HeroNetworkGrid3D } from "./components/HeroNetworkGrid3D";
import { HospitalRadar3D } from "./components/HospitalRadar3D";
import { ImpactOrbit3D } from "./components/ImpactOrbit3D";
import { LiveBiomedicalBg3D, type BgMotionMode } from "./components/LiveBiomedicalBg3D";
import { MotionVideoReel } from "./components/MotionVideoReel";
import { NetworkTopology3D } from "./components/NetworkTopology3D";
import {
  BLOOD_BANKS,
  BLOOD_GROUPS,
  COMPATIBILITY_MAP,
  COMPONENT_STORIES,
  DONATION_GUIDES,
  DONOR_PROFILES,
  INITIAL_URGENT_REQUESTS,
  MYTHS_AND_FACTS,
  READINESS_CHECKS,
  type BloodComponentStory,
  type BloodGroup,
  type BloodRequest,
  type DonorProfile,
} from "./data/bloodlinkData";

function BrandMark() {
  return (
    <svg aria-hidden="true" className="brand-mark" viewBox="0 0 38 38" fill="none">
      <path d="M19 3.5C15.2 9.2 7.3 16.8 7.3 23.1a11.7 11.7 0 0 0 23.4 0C30.7 16.8 22.8 9.2 19 3.5Z" />
      <path d="M12.6 23.3a6.4 6.4 0 0 0 6.4 6.4" />
      <circle cx="19" cy="19.2" r="2.2" />
    </svg>
  );
}

function DropBadgeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="drop-icon">
      <path d="M12 2.5C9.2 6.8 5 11.4 5 15.3a7 7 0 0 0 14 0C19 11.4 14.8 6.8 12 2.5Z" />
    </svg>
  );
}

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return diagonal ? (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M5 15 15 5M6 5h9v9" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 10h12m-5-5 5 5-5 5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 22 22" fill="none">
      <circle cx="9.8" cy="9.8" r="6.3" />
      <path d="m14.5 14.5 4.2 4.2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

function PrepHabitIcon({ kind }: { kind: "water" | "nutrition" | "id" | "rest" }) {
  if (kind === "water") {
    return (
      <svg aria-hidden="true" className="prep-svg-icon" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2.5C7.5 6.2 4.5 9.8 4.5 13a5.5 5.5 0 0 0 11 0c0-3.2-3-6.8-5.5-10.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (kind === "nutrition") {
    return (
      <svg aria-hidden="true" className="prep-svg-icon" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 4.5c3.5 0 6 2.5 6 6 0 3.8-2.8 6.5-6 6.5s-6-2.7-6-6.5c0-3.5 2.5-6 6-6Zm0 0c0-1.2.8-2.2 2.2-2.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "id") {
    return (
      <svg aria-hidden="true" className="prep-svg-icon" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="4.5" width="15" height="11" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="7" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 8.5h4M11 11.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="prep-svg-icon" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 6.5v3.8l2.5 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StepIllustration({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) {
    return (
      <svg aria-hidden="true" className="step-svg" viewBox="0 0 96 96" fill="none">
        <rect x="16" y="20" width="64" height="56" rx="14" fill="#FFF1F2" stroke="#FDA4AF" strokeWidth="2" />
        <circle cx="44" cy="46" r="14" stroke="#E11D48" strokeWidth="2.5" />
        <path d="M54 56l12 12" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
        <path d="M44 39v14M37 46h14" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (step === 2) {
    return (
      <svg aria-hidden="true" className="step-svg" viewBox="0 0 96 96" fill="none">
        <rect x="16" y="20" width="64" height="56" rx="14" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="2" />
        <path
          d="M48 30l16 7v12c0 10-7 18-16 21-9-3-16-11-16-21V37l16-7Z"
          fill="#D1FAE5"
          stroke="#10B981"
          strokeWidth="2.4"
        />
        <path d="M41 49l5 5 10-10" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="step-svg" viewBox="0 0 96 96" fill="none">
      <rect x="16" y="20" width="64" height="56" rx="14" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="2" />
      <path
        d="M48 31c-4.5 6.8-11 13.5-11 20a11 11 0 0 0 22 0c0-6.5-6.5-13.2-11-20Z"
        fill="#DBEAFE"
        stroke="#2563EB"
        strokeWidth="2.4"
      />
      <circle cx="67" cy="36" r="5" fill="#E11D48" />
      <circle cx="29" cy="58" r="4" fill="#10B981" />
    </svg>
  );
}

interface CountUpMetricProps {
  end: number;
  suffix?: string;
  prefix?: string;
  trigger: boolean;
}

function CountUpMetric({ end, suffix = "", prefix = "", trigger }: CountUpMetricProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let frameId = 0;
    const duration = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };
    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [end, trigger]);

  return (
    <span>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

function App() {
  const finderSectionRef = useRef<HTMLElement>(null);
  const networkSectionRef = useRef<HTMLElement>(null);
  const requestsCarouselRef = useRef<HTMLDivElement>(null);
  const impactStatsRef = useRef<HTMLDivElement>(null);

  // Navigation, Toast & Hero 3D Network Grid
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroBoost, setHeroBoost] = useState(false);
  const [bgMotionMode, setBgMotionMode] = useState<BgMotionMode>("auto");
  const [bgPulseCount, setBgPulseCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [impactVisible, setImpactVisible] = useState(false);

  // Floating Find a Donor Bridge State
  const [bloodGroup, setBloodGroup] = useState<"all" | BloodGroup>("O-");
  const [location, setLocation] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<"any" | "emergency" | "same-day" | "scheduled">("any");
  const [includeCompatible, setIncludeCompatible] = useState(true);
  const [showDonorDrawer, setShowDonorDrawer] = useState(true);
  const [expandedDonorId, setExpandedDonorId] = useState<string | null>("BL-8841");
  const [activeDonor, setActiveDonor] = useState<DonorProfile | null>(null);

  // Urgent Requests Carousel + Skeleton Loader
  const [requestList, setRequestList] = useState<BloodRequest[]>(INITIAL_URGENT_REQUESTS);
  const [scenarioFilter, setScenarioFilter] = useState<"all" | BloodRequest["scenario"]>("all");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>("REQ-2049");
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);

  // Interactive Step Cards & Clinical Guide Pop-Down Accordion State
  const [expandedStep, setExpandedStep] = useState<1 | 2 | 3 | null>(1);
  const [openGuideIndex, setOpenGuideIndex] = useState<number | null>(0);
  const [telemetryDockOpen, setTelemetryDockOpen] = useState(false);
  const [crossMatchDonor, setCrossMatchDonor] = useState<BloodGroup>("O-");
  const [crossMatchRecipient, setCrossMatchRecipient] = useState<BloodGroup>("A+");

  // Blood Bank & Hospital Network + Skeleton Loader
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<"all" | "Blood bank" | "Hospital partner">("all");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(BLOOD_BANKS[0].id);
  const [mapLoading, setMapLoading] = useState(false);

  // Donation Awareness Bento Box + 3D Motion Film
  const [checkedReadiness, setCheckedReadiness] = useState<Record<string, boolean>>({});
  const [mythIndex, setMythIndex] = useState(0);
  const [requestedFilmChapter, setRequestedFilmChapter] = useState<number | null>(null);

  // Interactive 3D Component Separation Lab State
  const [activeComponentId, setActiveComponentId] = useState<BloodComponentStory["id"]>("red-cells");
  const [simulatedUnits, setSimulatedUnits] = useState<number>(12);

  // Auth / Registration / Brief
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [donorPass, setDonorPass] = useState<{ name: string; group: string; city: string; id: string } | null>(null);
  const [signedInUser, setSignedInUser] = useState<string | null>(null);

  const modalOpen =
    registerOpen ||
    loginOpen ||
    createRequestOpen ||
    activeRequest !== null ||
    activeDonor !== null;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3600);
  }, []);

  const matches = useMemo(() => {
    const query = location.trim().toLowerCase();
    const compatibleDonors =
      bloodGroup === "all" ? BLOOD_GROUPS : COMPATIBILITY_MAP[bloodGroup].receiveRedCellsFrom;

    return DONOR_PROFILES.filter((profile) => {
      const groupMatches =
        bloodGroup === "all"
          ? true
          : includeCompatible
            ? compatibleDonors.includes(profile.group)
            : profile.group === bloodGroup;

      const locationMatches =
        !query ||
        profile.location.toLowerCase().includes(query) ||
        profile.city.toLowerCase().includes(query);

      const urgencyMatches =
        urgencyLevel === "emergency" ? profile.availability === "Available Now" : true;

      return groupMatches && locationMatches && urgencyMatches;
    }).sort((a, b) => {
      if (bloodGroup !== "all") {
        if (a.group === bloodGroup && b.group !== bloodGroup) return -1;
        if (b.group === bloodGroup && a.group !== bloodGroup) return 1;
      }
      return a.distanceKm - b.distanceKm;
    });
  }, [bloodGroup, includeCompatible, location, urgencyLevel]);

  const filteredBanks = useMemo(() => {
    const query = directoryQuery.trim().toLowerCase();
    return BLOOD_BANKS.filter((bank) => {
      const matchesType = partnerTypeFilter === "all" || bank.type === partnerTypeFilter;
      const matchesQuery =
        !query ||
        `${bank.name} ${bank.type} ${bank.city} ${bank.area} ${bank.address} ${bank.services.join(" ")}`
          .toLowerCase()
          .includes(query);
      return matchesType && matchesQuery;
    });
  }, [directoryQuery, partnerTypeFilter]);

  const selectedPartner = useMemo(
    () => BLOOD_BANKS.find((b) => b.id === selectedPartnerId) ?? BLOOD_BANKS[0],
    [selectedPartnerId],
  );

  const activeComponentStory = useMemo(
    () => COMPONENT_STORIES.find((c) => c.id === activeComponentId) ?? COMPONENT_STORIES[0],
    [activeComponentId],
  );

  const filteredRequests = useMemo(
    () =>
      scenarioFilter === "all"
        ? requestList
        : requestList.filter((req) => req.scenario === scenarioFilter),
    [requestList, scenarioFilter],
  );

  const crossMatchCompatible = useMemo(
    () => COMPATIBILITY_MAP[crossMatchRecipient].receiveRedCellsFrom.includes(crossMatchDonor),
    [crossMatchDonor, crossMatchRecipient],
  );

  useEffect(() => {
    const elements = document.querySelectorAll(".fade-in-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1 },
    );
    elements.forEach((el) => observer.observe(el));

    const statsEl = impactStatsRef.current;
    const statsObs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setImpactVisible(true);
          statsObs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    if (statsEl) statsObs.observe(statsEl);

    return () => {
      observer.disconnect();
      statsObs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAllModals();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen]);

  const closeAllModals = () => {
    setRegisterOpen(false);
    setLoginOpen(false);
    setCreateRequestOpen(false);
    setActiveRequest(null);
    setActiveDonor(null);
  };

  const handleHeroNodeSelectGroup = useCallback(
    (group: BloodGroup) => {
      setBloodGroup(group);
      setIncludeCompatible(true);
      setShowDonorDrawer(true);
      setBgPulseCount((c) => c + 1);
      showToast(`3D telemetry locked to ${group} — showing ${COMPATIBILITY_MAP[group].receiveRedCellsFrom.join(", ")} compatible donors.`);
    },
    [showToast],
  );

  const handleHeroSelectBank = useCallback(() => {
    setBgPulseCount((c) => c + 1);
    showToast("Routing through NABH Regional Blood Centre — live component inventory synced below.");
  }, [showToast]);

  const handleSelectPartner = useCallback((id: string) => {
    setSelectedPartnerId(id);
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowDonorDrawer(true);
    finderSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGeolocateDemo = () => {
    setLocation("Bengaluru");
    showToast("GPS coordinates locked to Bengaluru Metro — sorted by nearest verified donor.");
  };

  const simulateRequestsRefresh = () => {
    setRequestsLoading(true);
    window.setTimeout(() => {
      setRequestsLoading(false);
      showToast("Live hospital trauma & surgical requisition feed synchronized.");
    }, 520);
  };

  const simulateDirectorySync = (nextType: "all" | "Blood bank" | "Hospital partner") => {
    setPartnerTypeFilter(nextType);
    setMapLoading(true);
    window.setTimeout(() => setMapLoading(false), 360);
  };

  const scrollCarousel = (dir: -1 | 1) => {
    requestsCarouselRef.current?.scrollBy({ left: dir * 344, behavior: "smooth" });
  };

  const handleRegistration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "Volunteer").trim();
    const group = String(formData.get("group") || "O+");
    const city = String(formData.get("city") || "Bengaluru").trim();
    const randomNum = Math.floor(1000 + Math.random() * 8900);
    setDonorPass({ name, group, city, id: `BL-VER-${randomNum}` });
    setRegistrationComplete(true);
    showToast(`Verified Donor ID ${`BL-VER-${randomNum}`} issued for ${name}.`);
  };

  const handleDemoLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "dr.aarav@bloodlink.org").trim();
    setSignedInUser(email.split("@")[0]);
    setLoginOpen(false);
    showToast(`Authenticated as ${email.split("@")[0]}.`);
  };

  const handleCreateDemoRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const group = String(formData.get("reqGroup") || "O-") as BloodGroup;
    const hospital = String(formData.get("reqHospital") || "Manipal Trauma Centre").trim();
    const city = String(formData.get("reqCity") || "Bengaluru").trim();
    const units = String(formData.get("reqUnits") || "2 Units").trim();
    const scenario = String(formData.get("reqScenario") || "Emergency Trauma") as BloodRequest["scenario"];
    const priority = scenario === "Emergency Trauma" ? "Critical" : "Urgent";

    const newReq: BloodRequest = {
      id: `REQ-${Math.floor(2100 + Math.random() * 800)}`,
      group,
      units,
      hospital,
      department: scenario === "Emergency Trauma" ? "Level-1 Trauma Resuscitation" : "Surgical ICU Blood Desk",
      area: city,
      city,
      need: `${scenario} transfusion protocol`,
      scenario,
      priority,
      updatedLabel: "Verified just now",
      componentNeeded: scenario === "Critical Care" ? "Single-Donor Platelets (SDP)" : "Packed Red Cells (PRBC)",
      crossMatchNote: "Immediate spin cross-match active",
      attendingDesk: "Duty Transfusion Officer · Ext 401",
    };

    setRequestList((prev) => [newReq, ...prev]);
    setCreateRequestOpen(false);
    showToast(`Hospital requisition ${newReq.id} dispatched for ${group} at ${hospital}.`);
  };

  const acceptRequestDemo = (req: BloodRequest) => {
    setActiveRequest(null);
    setBloodGroup(req.group);
    setIncludeCompatible(true);
    setLocation(req.city);
    setShowDonorDrawer(true);
    showToast(`Matched ${COMPATIBILITY_MAP[req.group].receiveRedCellsFrom.join(", ")} donors for ${req.hospital}.`);
    finderSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleReadiness = (id: string) => {
    setCheckedReadiness((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checkedReadiness).filter(Boolean).length;
  const currentMyth = MYTHS_AND_FACTS[mythIndex];

  const handleNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("newsletterEmail") as HTMLInputElement;
    if (input) input.value = "";
    showToast("Subscribed to regional blood drive & rare phenotype dispatch alerts.");
  };

  return (
    <>
      {/* Z-0: FULL-VIEWPORT LIVE 3D BIOMEDICAL VIDEO & SUBSURFACE BLOODSTREAM BACKGROUND */}
      <LiveBiomedicalBg3D
        mode={bgMotionMode}
        boostFlow={heroBoost}
        activeBloodGroup={bloodGroup}
        pulseTriggerCount={bgPulseCount}
      />

      {/* Z-50: STICKY GLASSMORPHISM NAVBAR */}
      <header className="sticky-navbar">
        <div className="max-container navbar-inner">
          <a className="brand" href="#top" aria-label="BloodLink home" onClick={() => setMenuOpen(false)}>
            <BrandMark />
            <span>
              Blood<span className="brand-accent">Link</span>
            </span>
          </a>

          <nav className={`desktop-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
            <a href="#find-blood" onClick={() => setMenuOpen(false)}>Find Blood</a>
            <a href="#requests" onClick={() => setMenuOpen(false)}>Urgent Requests</a>
            <a href="#hospital-radar" onClick={() => setMenuOpen(false)}>3D Hospital Radar</a>
            <a href="#network" onClick={() => setMenuOpen(false)}>3D Blood Banks</a>
            <a href="#impact" onClick={() => setMenuOpen(false)}>3D Lab &amp; Impact</a>
            <a href="#awareness" onClick={() => setMenuOpen(false)}>Awareness</a>

            <div className="nav-mobile-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setMenuOpen(false);
                  setLoginOpen(true);
                }}
              >
                {signedInUser ? `Dr. ${signedInUser}` : "Clinical Sign In"}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setMenuOpen(false);
                  setRegistrationComplete(false);
                  setRegisterOpen(true);
                }}
              >
                Become a Donor
              </button>
            </div>
          </nav>

          <div className="navbar-actions">
            <button
              type="button"
              className={`sos-nav-btn ${heroBoost ? "is-active" : ""}`}
              onClick={() => {
                setHeroBoost(true);
                setBgMotionMode("arterial");
                setBgPulseCount((c) => c + 1);
                showToast("SOS Golden-Hour Protocol engaged — 120 BPM arterial surge & Doppler radar active.");
              }}
            >
              <span className="pulse-dot" /> SOS Golden-Hour
            </button>
            <button type="button" className="btn-ghost" onClick={() => setLoginOpen(true)}>
              {signedInUser ? `Dr. ${signedInUser}` : "Clinical Sign In"}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setRegistrationComplete(false);
                setRegisterOpen(true);
              }}
            >
              Become a Donor
            </button>
          </div>

          <button
            type="button"
            className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <main>
        {/* B. HERO SECTION: 60% CONTENT / 40% INTERACTIVE 3D NETWORK & ECG GRID */}
        <section className="hero-section" id="top">
          <div className="hero-radial-glow" aria-hidden="true" />
          <div className="max-container hero-grid">
            <div className="hero-left">
              <span className="hero-badge">
                <span className="pulse-dot" /> REAL-TIME 3D VASCULAR &amp; COLD-CHAIN DISPATCH NETWORK
              </span>
              <h1>
                Every Drop<br />
                <span><em>Connects</em> a Life.</span>
              </h1>
              <p className="hero-sub">
                Rapid ABO/Rh compatible donor discovery, live NABH blood bank component inventory, and 3D emergency hospital dispatch. Click any node in the live 3D stage to inspect blood routing in real time.
              </p>
              <div className="hero-cta-row">
                <a className="btn-primary btn-lg" href="#find-blood">
                  Find a Donor <ArrowIcon />
                </a>
                <a className="btn-outline-light btn-lg" href="#hospital-radar">
                  Open 3D Hospital Radar
                </a>
              </div>
              <div className="hero-3d-controls">
                <span>3D Background Motion:</span>
                {(
                  [
                    { id: "auto", label: "Auto Scroll Flight" },
                    { id: "arterial", label: "Arterial Stream" },
                    { id: "helix", label: "ABO Double-Helix" },
                    { id: "vortex", label: "Cryo Vortex" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`mini-chip ${bgMotionMode === item.id ? "is-active" : ""}`}
                    onClick={() => {
                      setBgMotionMode(item.id);
                      setBgPulseCount((c) => c + 1);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`mini-chip ${heroBoost ? "is-active" : ""}`}
                  onClick={() => {
                    setHeroBoost((b) => !b);
                    setBgPulseCount((c) => c + 1);
                  }}
                >
                  {heroBoost ? "Cardiac Rate: 120 BPM" : "Cardiac Rate: 74 BPM"}
                </button>
              </div>
            </div>

            <div className="hero-right">
              <HeroNetworkGrid3D
                boostFlow={heroBoost}
                onSelectDonorGroup={handleHeroNodeSelectGroup}
                onSelectBankView={handleHeroSelectBank}
              />
            </div>
          </div>
        </section>

        {/* C. FLOATING "FIND A DONOR" BRIDGE CARD (z-40, margin-top: -60px) */}
        <section className="floating-finder-wrap" id="find-blood" ref={finderSectionRef}>
          <div className="max-container">
            <div className="floating-search-card">
              <form className="floating-search-row" onSubmit={handleSearchSubmit}>
                <label className="search-field">
                  <span>Blood Group</span>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as "all" | BloodGroup)}
                  >
                    <option value="all">All Blood Groups</option>
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>

                <label className="search-field search-field-location">
                  <span>Location / City</span>
                  <div className="location-input-wrap">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City or area (e.g. Bengaluru, Mumbai)"
                    />
                    <button
                      type="button"
                      className="geolocate-btn"
                      onClick={handleGeolocateDemo}
                      title="Use sample city location"
                    >
                      Locate
                    </button>
                  </div>
                </label>

                <label className="search-field">
                  <span>Urgency Level</span>
                  <select
                    value={urgencyLevel}
                    onChange={(e) =>
                      setUrgencyLevel(e.target.value as "any" | "emergency" | "same-day" | "scheduled")
                    }
                  >
                    <option value="any">Any Urgency</option>
                    <option value="emergency">Emergency (&lt; 2 hrs)</option>
                    <option value="same-day">Same Day Surgery</option>
                    <option value="scheduled">Scheduled Care</option>
                  </select>
                </label>

                <button type="submit" className="btn-primary floating-search-btn">
                  <SearchIcon /> Search Donors
                </button>
              </form>

              <div className="floating-subbar">
                <label className="compat-checkbox">
                  <input
                    type="checkbox"
                    checked={includeCompatible}
                    onChange={(e) => setIncludeCompatible(e.target.checked)}
                    disabled={bloodGroup === "all"}
                  />
                  <span>
                    Smart Compatibility Matching
                    {bloodGroup !== "all"
                      ? ` — includes ${COMPATIBILITY_MAP[bloodGroup].receiveRedCellsFrom.join(", ")}`
                      : ""}
                  </span>
                </label>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setShowDonorDrawer((s) => !s)}
                >
                  {showDonorDrawer ? "Hide" : "Show"} {matches.length} verified donors
                </button>
              </div>

              {showDonorDrawer && (
                <div className="donor-drawer" aria-live="polite">
                  {matches.length > 0 ? (
                    <div className="donor-drawer-grid">
                      {matches.slice(0, 6).map((profile) => {
                        const isDirect = bloodGroup === "all" || profile.group === bloodGroup;
                        const isExpanded = expandedDonorId === profile.id;
                        return (
                          <article
                            key={profile.id}
                            className={`donor-mini-card glass-frost-card ${isExpanded ? "is-expanded" : ""}`}
                          >
                            <div className="donor-mini-top">
                              <span className="donor-pill-group">{profile.group}</span>
                              <span className={`match-tag ${isDirect ? "is-direct" : "is-compat"}`}>
                                {bloodGroup === "all"
                                  ? `Hb ${profile.hemoglobin}`
                                  : isDirect
                                    ? "Exact Match"
                                    : `Compatible (${bloodGroup})`}
                              </span>
                            </div>
                            <strong>{profile.name} <span className="donor-id-inline">{profile.id}</span></strong>
                            <small>{profile.location} · {profile.distanceKm} km</small>
                            <div className="donor-mini-meta">
                              <span className="donor-eta-badge">{profile.availability} · {profile.responseWindow}</span>
                              <span>Last: {profile.lastDonated}</span>
                            </div>

                            <div className="card-pop-actions">
                              <button
                                type="button"
                                className="pop-toggle-btn"
                                aria-expanded={isExpanded}
                                onClick={() =>
                                  setExpandedDonorId((cur) => (cur === profile.id ? null : profile.id))
                                }
                              >
                                <span>{isExpanded ? "Hide Clinical Vitals" : "Pop-Down Clinical Vitals"}</span>
                                <span className={`chevron-indicator ${isExpanded ? "is-open" : ""}`}>▾</span>
                              </button>
                              <button
                                type="button"
                                className="pop-modal-btn"
                                onClick={() => setActiveDonor(profile)}
                              >
                                Pop-Up Profile ↗
                              </button>
                            </div>

                            <div className={`pop-down-drawer ${isExpanded ? "is-open" : ""}`}>
                              <div className="pop-down-inner">
                                <div className="pop-kv">
                                  <span>Hemoglobin &amp; Units</span>
                                  <strong>{profile.hemoglobin} · {profile.donationsLogged} units</strong>
                                </div>
                                <div className="pop-kv">
                                  <span>Screened By</span>
                                  <strong>{profile.verifiedBy}</strong>
                                </div>
                                <div className="pop-kv">
                                  <span>PRBC Recipients</span>
                                  <strong>{COMPATIBILITY_MAP[profile.group].donateRedCellsTo.join(", ")}</strong>
                                </div>
                                <button
                                  type="button"
                                  className="btn-primary pop-dispatch-btn"
                                  onClick={() => {
                                    setBgPulseCount((c) => c + 1);
                                    showToast(`Encrypted dispatch ping sent to ${profile.name} (${profile.id}).`);
                                  }}
                                >
                                  Send Instant Dispatch Ping <ArrowIcon />
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="empty-hint">
                      No verified donors match that city filter. Clear the location field or enable Smart Compatibility Matching.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* D. URGENT BLOOD REQUESTS (HORIZONTAL CAROUSEL + SKELETON LOADER) */}
        <section className="requests-carousel-section section-pad" id="requests">
          <div className="max-container fade-in-up">
            <div className="carousel-header">
              <div>
                <span className="eyebrow">HOSPITAL EMERGENCY DESK</span>
                <h2>Urgent Blood Requests</h2>
              </div>
              <div className="carousel-actions">
                <div className="scenario-slide-pills" role="tablist" aria-label="Filter requisitions by clinical scenario">
                  {(["all", "Emergency Trauma", "Critical Care", "Planned Surgery"] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      role="tab"
                      aria-selected={scenarioFilter === sc}
                      className={`filter-pill ${scenarioFilter === sc ? "is-active" : ""}`}
                      onClick={() => setScenarioFilter(sc)}
                    >
                      {sc === "all" ? "All Requisitions" : sc}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn-secondary-outline" onClick={simulateRequestsRefresh}>
                  Sync Feed
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setCreateRequestOpen(true)}
                >
                  + Post Hospital Requisition
                </button>
                <div className="carousel-nav-arrows">
                  <button type="button" onClick={() => scrollCarousel(-1)} aria-label="Scroll requests left">
                    ←
                  </button>
                  <button type="button" onClick={() => scrollCarousel(1)} aria-label="Scroll requests right">
                    →
                  </button>
                </div>
              </div>
            </div>

            {requestsLoading ? (
              <div className="requests-carousel-track">
                {[1, 2, 3, 4].map((skeleton) => (
                  <div className="request-card skeleton-card" key={skeleton} aria-hidden="true">
                    <div className="skeleton-line short" />
                    <div className="skeleton-line tall" />
                    <div className="skeleton-line medium" />
                    <div className="skeleton-btn" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="requests-carousel-track" ref={requestsCarouselRef}>
                {filteredRequests.map((req) => {
                  const isReqExpanded = expandedRequestId === req.id;
                  return (
                    <article
                      className={`request-card glass-frost-card ${isReqExpanded ? "is-expanded" : ""}`}
                      key={req.id}
                    >
                      <div className="request-card-top">
                        <span className="request-scenario-chip">{req.scenario}</span>
                        <span className="live-indicator">
                          <span className="pulse-dot" /> {req.priority}
                        </span>
                      </div>

                      <div className="request-card-blood">
                        <span className="blood-drop-badge">
                          <DropBadgeIcon />
                          <strong>{req.group}</strong>
                        </span>
                        <div>
                          <span className="request-units">{req.units} · {req.componentNeeded}</span>
                          <span className="request-time">{req.id} · {req.updatedLabel}</span>
                        </div>
                      </div>

                      <h3>{req.hospital}</h3>
                      <p className="request-city">{req.department} · {req.city}</p>
                      <p className="request-clinical-note">{req.need}</p>

                      <div className="card-pop-actions">
                        <button
                          type="button"
                          className="pop-toggle-btn"
                          aria-expanded={isReqExpanded}
                          onClick={() =>
                            setExpandedRequestId((cur) => (cur === req.id ? null : req.id))
                          }
                        >
                          <span>{isReqExpanded ? "Hide Lab Protocol" : "Pop-Down Lab Protocol"}</span>
                          <span className={`chevron-indicator ${isReqExpanded ? "is-open" : ""}`}>▾</span>
                        </button>
                        <button
                          type="button"
                          className="pop-modal-btn"
                          onClick={() => setActiveRequest(req)}
                        >
                          Pop-Up Desk ↗
                        </button>
                      </div>

                      <div className={`pop-down-drawer ${isReqExpanded ? "is-open" : ""}`}>
                        <div className="pop-down-inner">
                          <div className="pop-kv">
                            <span>Cross-Match Status</span>
                            <strong>{req.crossMatchNote}</strong>
                          </div>
                          <div className="pop-kv">
                            <span>Attending Officer</span>
                            <strong>{req.attendingDesk}</strong>
                          </div>
                          <div className="pop-kv">
                            <span>Compatible Groups</span>
                            <strong>{COMPATIBILITY_MAP[req.group].receiveRedCellsFrom.join(", ")}</strong>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-primary request-accept-btn"
                        onClick={() => acceptRequestDemo(req)}
                      >
                        Match &amp; Slide to Donors <ArrowIcon />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* D2. 3D HOSPITAL DOPPLER RADAR & GREEN-CORRIDOR DISPATCH COMMAND */}
        <section className="radar-command-section section-pad" id="hospital-radar">
          <div className="max-container fade-in-up">
            <div className="centered-header centered-light">
              <span className="eyebrow eyebrow-teal">360° GEODESIC DOPPLER TELEMETRY</span>
              <h2>Hospital Emergency <em>Radar</em> &amp; Green Corridor</h2>
              <p>
                Real-time 3D perimeter sweep tracking verified compatible donors, regional NABH blood banks, and in-transit cryo-ambulances around major trauma centers.
              </p>
            </div>

            <HospitalRadar3D
              donors={DONOR_PROFILES}
              partners={BLOOD_BANKS}
              activeBloodGroup={bloodGroup}
              onSelectBloodGroup={(grp) => {
                setBloodGroup(grp);
                setBgPulseCount((c) => c + 1);
              }}
              onDispatchLocked={(msg) => {
                setBgPulseCount((c) => c + 1);
                showToast(msg);
              }}
            />
          </div>
        </section>

        {/* E. HOW IT WORKS & INTERACTIVE ABO/RH COMPATIBILITY MATRIX */}
        <section className="how-section section-pad" id="how-it-works">
          <div className="max-container fade-in-up">
            <div className="centered-header centered-light">
              <span className="eyebrow eyebrow-rose">CLINICAL DISPATCH PROTOCOL</span>
              <h2>From Requisition to <em>Cross-Match</em> in Minutes</h2>
              <p>
                BloodLink replaces unverified social forwards with automated ABO/Rh compatibility matching, live NABH blood bank stock telemetry, and privacy-shielded donor dispatch.
              </p>
            </div>

            <div className="steps-wrapper">
              <svg className="step-connectors" viewBox="0 0 1000 120" fill="none" aria-hidden="true">
                <path
                  d="M200 58 C 280 18, 360 18, 440 58"
                  stroke="#FDA4AF"
                  strokeWidth="2.5"
                  strokeDasharray="6 8"
                />
                <path
                  d="M560 58 C 640 18, 720 18, 800 58"
                  stroke="#93C5FD"
                  strokeWidth="2.5"
                  strokeDasharray="6 8"
                />
              </svg>

              <div className="steps-grid">
                <article
                  className={`step-card glass-frost-card ${expandedStep === 1 ? "is-expanded" : ""}`}
                  onClick={() => setExpandedStep((s) => (s === 1 ? null : 1))}
                >
                  <StepIllustration step={1} />
                  <span className="step-index">STEP 01</span>
                  <h3>Search Compatible Donors</h3>
                  <p>
                    Enter the required blood group and city to discover direct and ABO/Rh compatible voluntary donors without exposing private contact numbers.
                  </p>
                  <button
                    type="button"
                    className="step-pop-trigger"
                    aria-expanded={expandedStep === 1}
                  >
                    <span>{expandedStep === 1 ? "Hide Technical Spec" : "Pop-Down Technical Spec"}</span>
                    <span className={`chevron-indicator ${expandedStep === 1 ? "is-open" : ""}`}>▾</span>
                  </button>
                  <div className={`pop-down-drawer ${expandedStep === 1 ? "is-open" : ""}`}>
                    <div className="pop-down-inner">
                      <div className="pop-kv">
                        <span>Compatibility Engine</span>
                        <strong>Auto-includes O− &amp; Rh-compatible erythrocytes</strong>
                      </div>
                      <div className="pop-kv">
                        <span>Privacy Layer</span>
                        <strong>Zero phone number exposure · Relay tokens</strong>
                      </div>
                    </div>
                  </div>
                </article>

                <article
                  className={`step-card glass-frost-card ${expandedStep === 2 ? "is-expanded" : ""}`}
                  onClick={() => setExpandedStep((s) => (s === 2 ? null : 2))}
                >
                  <StepIllustration step={2} />
                  <span className="step-index">STEP 02</span>
                  <h3>Verify Hospital &amp; Bank</h3>
                  <p>
                    Inspect verified hospital requests and locate authorised blood banks with exact component capability (red cells, plasma, or platelets) in 3D.
                  </p>
                  <button
                    type="button"
                    className="step-pop-trigger"
                    aria-expanded={expandedStep === 2}
                  >
                    <span>{expandedStep === 2 ? "Hide Technical Spec" : "Pop-Down Technical Spec"}</span>
                    <span className={`chevron-indicator ${expandedStep === 2 ? "is-open" : ""}`}>▾</span>
                  </button>
                  <div className={`pop-down-drawer ${expandedStep === 2 ? "is-open" : ""}`}>
                    <div className="pop-down-inner">
                      <div className="pop-kv">
                        <span>Accreditation Check</span>
                        <strong>NABH &amp; NACO license IDs verified live</strong>
                      </div>
                      <div className="pop-kv">
                        <span>Cold-Chain Telemetry</span>
                        <strong>PRBC (2–6°C), FFP (-30°C), SDP (22°C agitation)</strong>
                      </div>
                    </div>
                  </div>
                </article>

                <article
                  className={`step-card glass-frost-card ${expandedStep === 3 ? "is-expanded" : ""}`}
                  onClick={() => setExpandedStep((s) => (s === 3 ? null : 3))}
                >
                  <StepIllustration step={3} />
                  <span className="step-index">STEP 03</span>
                  <h3>Donate &amp; Multiply Impact</h3>
                  <p>
                    Confirm on-site readiness with clinicians and donate safely — one voluntary unit separates into components that can support up to three lives.
                  </p>
                  <button
                    type="button"
                    className="step-pop-trigger"
                    aria-expanded={expandedStep === 3}
                  >
                    <span>{expandedStep === 3 ? "Hide Technical Spec" : "Pop-Down Technical Spec"}</span>
                    <span className={`chevron-indicator ${expandedStep === 3 ? "is-open" : ""}`}>▾</span>
                  </button>
                  <div className={`pop-down-drawer ${expandedStep === 3 ? "is-open" : ""}`}>
                    <div className="pop-down-inner">
                      <div className="pop-kv">
                        <span>Component Yield</span>
                        <strong>220 mL PRBC + 180 mL FFP + 50 mL Platelets</strong>
                      </div>
                      <div className="pop-kv">
                        <span>Recovery Window</span>
                        <strong>Plasma 24–48 hrs · Red cells 90-day cycle</strong>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Interactive ABO/Rh Compatibility Matrix Strip */}
            <div className="compat-matrix-panel">
              <div className="compat-matrix-head">
                <div>
                  <span className="eyebrow">INTERACTIVE ABO / RH MATRIX</span>
                  <h3>Click any Blood Group to Inspect Clinical Compatibility</h3>
                </div>
                <div className="compat-group-pills" role="tablist" aria-label="Blood Group Compatibility Selector">
                  {BLOOD_GROUPS.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      role="tab"
                      aria-selected={bloodGroup === grp}
                      className={`compat-group-btn ${bloodGroup === grp ? "is-active" : ""}`}
                      onClick={() => {
                        setBloodGroup(grp);
                        setIncludeCompatible(true);
                      }}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>

              {bloodGroup !== "all" && (
                <div className="compat-matrix-grid">
                  <div className="compat-stat-card">
                    <span>SELECTED PHENOTYPE</span>
                    <strong>{bloodGroup} ({COMPATIBILITY_MAP[bloodGroup].populationShare} pop.)</strong>
                    <small>{COMPATIBILITY_MAP[bloodGroup].note}</small>
                  </div>
                  <div className="compat-stat-card">
                    <span>CAN RECEIVE PACKED RED CELLS FROM</span>
                    <strong>{COMPATIBILITY_MAP[bloodGroup].receiveRedCellsFrom.join(" · ")}</strong>
                    <small>Safe donor phenotypes for {bloodGroup} PRBC transfusion</small>
                  </div>
                  <div className="compat-stat-card">
                    <span>CAN DONATE RED CELLS TO</span>
                    <strong>{COMPATIBILITY_MAP[bloodGroup].donateRedCellsTo.join(" · ")}</strong>
                    <small>Compatible recipient groups for {bloodGroup} erythrocytes</small>
                  </div>
                  <div className="compat-stat-card">
                    <span>PLASMA (FFP) COMPATIBILITY</span>
                    <strong>{COMPATIBILITY_MAP[bloodGroup].plasmaDonateTo.join(" · ")}</strong>
                    <small>Safe recipient groups for {bloodGroup} Fresh Frozen Plasma</small>
                  </div>
                </div>
              )}

              {/* Interactive Donor -> Recipient Serology Cross-Match Simulator */}
              <div className="crossmatch-sim-bar">
                <div className="crossmatch-selectors">
                  <div className="cm-col">
                    <span>DONOR UNIT PHENOTYPE</span>
                    <div className="cm-pills">
                      {BLOOD_GROUPS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`cm-pill ${crossMatchDonor === g ? "is-active" : ""}`}
                          onClick={() => setCrossMatchDonor(g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cm-arrow-badge" aria-hidden="true">→</div>

                  <div className="cm-col">
                    <span>PATIENT RECIPIENT PHENOTYPE</span>
                    <div className="cm-pills">
                      {BLOOD_GROUPS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`cm-pill ${crossMatchRecipient === g ? "is-active" : ""}`}
                          onClick={() => setCrossMatchRecipient(g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`crossmatch-verdict ${crossMatchCompatible ? "is-safe" : "is-danger"}`}>
                  <div className="verdict-copy">
                    <span className="verdict-tag">
                      {crossMatchCompatible
                        ? "SEROLOGY VERDICT: SAFE PRBC TRANSFUSION (0% AGGLUTINATION)"
                        : "SEROLOGY ALERT: HEMOLYTIC INCOMPATIBILITY DETECTED"}
                    </span>
                    <strong>
                      {crossMatchDonor} Donor Red Cells → {crossMatchRecipient} Patient Recipient:{" "}
                      {crossMatchCompatible ? "Clinically Compatible" : "Do Not Transfuse"}
                    </strong>
                    <small>
                      {crossMatchCompatible
                        ? `${crossMatchRecipient} plasma carries no antibodies against ${crossMatchDonor} erythrocyte antigens.`
                        : `Recipient ${crossMatchRecipient} antibodies will agglutinate ${crossMatchDonor} red cells. Safe alternatives for ${crossMatchRecipient}: ${COMPATIBILITY_MAP[crossMatchRecipient].receiveRedCellsFrom.join(", ")}.`}
                    </small>
                  </div>
                  {!crossMatchCompatible && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setCrossMatchDonor("O-")}
                    >
                      Auto-Switch to O− Universal
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* F. BLOOD BANK & HOSPITAL NETWORK (MIDNIGHT BLUE 50/50 SPLIT + 3D GRID MAP) */}
        <section className="network-dark-section section-pad" id="network" ref={networkSectionRef}>
          <div className="max-container fade-in-up">
            <div className="network-header">
              <div>
                <span className="eyebrow eyebrow-blue">LIVE COMPONENT INVENTORY &amp; 3D TOPOLOGY</span>
                <h2>NABH Blood Banks &amp; Trauma Centres</h2>
              </div>
              <div className="network-controls">
                <div className="filter-pills">
                  {(["all", "Blood bank", "Hospital partner"] as const).map((typeVal) => (
                    <button
                      key={typeVal}
                      type="button"
                      className={`filter-pill ${partnerTypeFilter === typeVal ? "is-active" : ""}`}
                      onClick={() => simulateDirectorySync(typeVal)}
                    >
                      {typeVal === "all" ? "All Centres" : typeVal === "Blood bank" ? "Blood Banks (Blue)" : "Hospitals (Red)"}
                    </button>
                  ))}
                </div>
                <input
                  type="search"
                  className="network-search-input"
                  value={directoryQuery}
                  onChange={(e) => setDirectoryQuery(e.target.value)}
                  placeholder="Filter by city, hospital, or platelets..."
                  aria-label="Filter blood bank and hospital directory"
                />
              </div>
            </div>

            <div className="network-split-50">
              <div className="network-list-col">
                <div className="network-scroll-list">
                  {mapLoading ? (
                    [1, 2, 3].map((s) => (
                      <div key={s} className="network-list-item skeleton-dark" aria-hidden="true">
                        <div className="skeleton-line short" />
                        <div className="skeleton-line medium" />
                      </div>
                    ))
                  ) : filteredBanks.length > 0 ? (
                    filteredBanks.map((bank) => {
                      const isBank = bank.type === "Blood bank";
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          className={`network-list-item ${selectedPartner.id === bank.id ? "is-active" : ""}`}
                          onClick={() => setSelectedPartnerId(bank.id)}
                        >
                          <div className="network-item-top">
                            <span className={`marker-badge ${isBank ? "is-blue" : "is-red"}`}>
                              {bank.type} · {bank.licenseId}
                            </span>
                            <span className="network-city">{bank.city} · {bank.distanceKm} km</span>
                          </div>
                          <h3>{bank.name}</h3>
                          <p>{bank.address} · {bank.hours} · {bank.emergencyPhone}</p>

                          {/* Live 8-Group Unit Inventory Strip */}
                          <div className="bank-inventory-strip">
                            {BLOOD_GROUPS.map((grp) => {
                              const units = bank.inventory[grp];
                              return (
                                <span
                                  key={grp}
                                  className={`inv-chip ${units <= 5 ? "is-low" : ""}`}
                                  title={`${grp}: ${units} PRBC units in stock`}
                                >
                                  <b>{grp}</b> {units}u
                                </span>
                              );
                            })}
                          </div>

                          <div className="network-services">
                            <span className="service-highlight">Platelets (SDP): {bank.plateletsUnits}u</span>
                            <span className="service-highlight">Plasma (FFP): {bank.plasmaUnits}u</span>
                            {bank.services.map((srv) => (
                              <span key={srv}>{srv}</span>
                            ))}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="empty-dark">No verified blood centres match that search query.</p>
                  )}
                </div>
              </div>

              <div className="network-map-col">
                <div className="network-map-frame">
                  <NetworkTopology3D
                    partners={BLOOD_BANKS}
                    selectedPartnerId={selectedPartner.id}
                    onSelectPartner={handleSelectPartner}
                  />
                  <div className="map-selected-overlay">
                    <span className={selectedPartner.type === "Blood bank" ? "dot-blue" : "dot-red"} />
                    <div className="map-selected-copy">
                      <strong>{selectedPartner.name} ({selectedPartner.licenseId})</strong>
                      <small>
                        {selectedPartner.address} · {selectedPartner.emergencyPhone} · SDP {selectedPartner.plateletsUnits}u · FFP {selectedPartner.plasmaUnits}u
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* H. OUR IMPACT & LIVE 3D COMPONENT FRACTIONATION LAB */}
        <section className="impact-metrics-section section-pad" id="impact">
          <div className="max-container impact-container fade-in-up">
            <div className="centered-header centered-light">
              <span className="eyebrow eyebrow-rose">3D COMPONENT FRACTIONATION LAB</span>
              <h2>One 450 mL Donation, Three Targeted Therapies</h2>
              <p>
                Whole blood is centrifuged into Packed Red Blood Cells, Fresh Frozen Plasma, and Platelet Concentrate—allowing a single voluntary donation to treat up to three patients.
              </p>
            </div>

            <div className="metrics-4-grid" ref={impactStatsRef}>
              <div className="metric-block">
                <strong>
                  <CountUpMetric end={3} prefix="Up to " trigger={impactVisible} />
                </strong>
                <span>PATIENTS SUPPORTED PER 450 ML UNIT</span>
              </div>
              <div className="metric-block">
                <strong>
                  <CountUpMetric end={18} suffix=" min" trigger={impactVisible} />
                </strong>
                <span>MEDIAN TRAUMA MATCH &amp; DISPATCH</span>
              </div>
              <div className="metric-block">
                <strong>
                  <CountUpMetric end={100} suffix="%" trigger={impactVisible} />
                </strong>
                <span>NAT &amp; SEROLOGY SCREENED UNITS</span>
              </div>
              <div className="metric-block">
                <strong>
                  <CountUpMetric end={24} suffix="/7" trigger={impactVisible} />
                </strong>
                <span>APHERESIS &amp; COLD-CHAIN TELEMETRY</span>
              </div>
            </div>

            {/* Interactive 3D Centrifuge & Component Separation Split */}
            <div className="impact-3d-split">
              <div className="impact-3d-info">
                <span className="eyebrow eyebrow-rose">INTERACTIVE 3D CENTRIFUGE SIMULATOR</span>
                <h3>Inspect Separated Blood Components in 3D</h3>

                <div className="component-tabs" role="tablist" aria-label="Blood Components">
                  {COMPONENT_STORIES.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      role="tab"
                      aria-selected={activeComponentId === comp.id}
                      className={`comp-tab ${activeComponentId === comp.id ? "is-active" : ""}`}
                      onClick={() => setActiveComponentId(comp.id)}
                    >
                      <span className="comp-dot" style={{ background: comp.color }} />
                      {comp.title.split(" (")[0]}
                    </button>
                  ))}
                </div>

                <div
                  className="comp-detail-box"
                  style={{ borderLeftColor: activeComponentStory.color }}
                >
                  <div className="comp-meta">
                    <span>{activeComponentStory.subtitle}</span>
                    <span>{activeComponentStory.shelfLife}</span>
                  </div>
                  <h4>{activeComponentStory.title}</h4>
                  <p>{activeComponentStory.description}</p>
                  <small>
                    Storage: {activeComponentStory.storageTemp} · Clinical indication: {activeComponentStory.useCase}
                  </small>
                </div>

                <div className="sim-box">
                  <div className="sim-top">
                    <strong>Simulate Community Drive: {simulatedUnits} Whole-Blood Units</strong>
                    <span>Up to {simulatedUnits * 3} Patient Transfusions</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={simulatedUnits}
                    onChange={(e) => setSimulatedUnits(Number(e.target.value))}
                    className="impact-range"
                    aria-label="Simulated whole-blood donation units"
                  />
                  <div className="sim-yield-row">
                    <span>PRBC: {(simulatedUnits * 0.22).toFixed(1)} L</span>
                    <span>Plasma (FFP): {(simulatedUnits * 0.18).toFixed(1)} L</span>
                    <span>Platelets: {(simulatedUnits * 0.05).toFixed(2)} L</span>
                  </div>
                </div>
              </div>

              <div className="impact-3d-stage-col">
                <ImpactOrbit3D
                  activeComponent={activeComponentId}
                  unitCount={simulatedUnits}
                  onSelectComponent={setActiveComponentId}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SIGNATURE 3D MOTION FILM SHOWCASE (ELABORATED ECG + NETWORK GRID) */}
        <section className="cinema-band section-pad" id="cinema-3d">
          <div className="max-container fade-in-up">
            <div className="cinema-header-row">
              <div>
                <span className="eyebrow eyebrow-rose">LIVE 3D TELEMETRY SIMULATION</span>
                <h2>Golden-Hour Emergency Transfusion Pipeline</h2>
              </div>
              <p className="cinema-header-copy">
                Interactive 4-chapter 3D WebGL simulation tracing a Level-1 hemorrhage alert through regional registry scanning, ABO/Rh cross-match lock, and component fractionation.
              </p>
            </div>
            <MotionVideoReel externalChapterRequest={requestedFilmChapter} />
          </div>
        </section>

        {/* G. DONATION AWARENESS (4-COLUMN × 2-ROW BENTO BOX UI) */}
        <section className="awareness-section section-pad" id="awareness">
          <div className="max-container fade-in-up">
            <div className="centered-header centered-light">
              <span className="eyebrow eyebrow-rose">CLINICAL DONOR READINESS</span>
              <h2>Pre-Donation Screening &amp; Medical Facts</h2>
              <p>
                Verify your pre-donation readiness checklist, review evidence-based transfusion medicine facts, and check safe recovery intervals before visiting a blood centre.
              </p>
            </div>

            <div className="bento-grid">
              <div className="bento-card bento-eligibility">
                <div className="bento-head">
                  <span className="bento-tag">INTERACTIVE CHECKLIST</span>
                  <span className="bento-counter">{checkedCount} / {READINESS_CHECKS.length} Ready</span>
                </div>
                <h3>Am I Ready to Donate?</h3>
                <p className="bento-sub">
                  Review these four preparation indicators before visiting an authorised donation centre.
                </p>

                <div className="quiz-list">
                  {READINESS_CHECKS.map((item) => {
                    const checked = Boolean(checkedReadiness[item.id]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`quiz-item ${checked ? "is-checked" : ""}`}
                        onClick={() => toggleReadiness(item.id)}
                        aria-pressed={checked}
                      >
                        <span className="quiz-check">{checked ? "✓" : ""}</span>
                        <div>
                          <strong>{item.question}</strong>
                          <small>{item.tip}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="quiz-footer-note">
                  {checkedCount === READINESS_CHECKS.length
                    ? "Prepared for check-in! On-site clinicians confirm official medical eligibility."
                    : "Educational overview only — local blood bank clinicians always perform final screening."}
                </div>
              </div>

              <div className="bento-card bento-myths">
                <div className="bento-head">
                  <span className="bento-tag">MYTH VS. MEDICAL FACT</span>
                  <div className="slider-controls">
                    <button
                      type="button"
                      onClick={() => setMythIndex((i) => (i - 1 + MYTHS_AND_FACTS.length) % MYTHS_AND_FACTS.length)}
                      aria-label="Previous myth"
                    >
                      ←
                    </button>
                    <span>0{mythIndex + 1} / 0{MYTHS_AND_FACTS.length}</span>
                    <button
                      type="button"
                      onClick={() => setMythIndex((i) => (i + 1) % MYTHS_AND_FACTS.length)}
                      aria-label="Next myth"
                    >
                      →
                    </button>
                  </div>
                </div>
                <h3>{currentMyth.myth}</h3>
                <p className="myth-answer">
                  <strong>Fact:</strong> {currentMyth.fact}
                </p>
                <div className="myth-slide-dots" role="tablist" aria-label="Myth slide indicator">
                  {MYTHS_AND_FACTS.map((m, idx) => (
                    <button
                      key={m.myth}
                      type="button"
                      role="tab"
                      aria-selected={mythIndex === idx}
                      aria-label={`Slide ${idx + 1}`}
                      className={`slide-dot ${mythIndex === idx ? "is-active" : ""}`}
                      onClick={() => setMythIndex(idx)}
                    />
                  ))}
                </div>
              </div>

              <div className="bento-card bento-prep">
                <span className="bento-tag">QUICK PREP TIPS</span>
                <h3>4 Habits Before You Visit</h3>
                <ul className="prep-list">
                  <li><PrepHabitIcon kind="water" /> Drink 500 mL water 2 hrs prior</li>
                  <li><PrepHabitIcon kind="nutrition" /> Eat an iron-rich balanced meal</li>
                  <li><PrepHabitIcon kind="id" /> Carry valid government photo ID</li>
                  <li><PrepHabitIcon kind="rest" /> Rest 15 mins with refreshments</li>
                </ul>
              </div>

              <div className="bento-card bento-intervals-card">
                <span className="bento-tag video-tag">SAFE RECOVERY INTERVALS</span>
                <h3>Clinical Donation Windows</h3>
                <ul className="interval-list">
                  <li>
                    <span>Whole Blood (450 mL)</span>
                    <strong>Every 90 Days</strong>
                  </li>
                  <li>
                    <span>Single-Donor Platelets</span>
                    <strong>Every 14 Days</strong>
                  </li>
                  <li>
                    <span>Plasmapheresis</span>
                    <strong>Every 28 Days</strong>
                  </li>
                  <li>
                    <span>Min. Hemoglobin</span>
                    <strong>&ge; 12.5 g/dL</strong>
                  </li>
                </ul>
              </div>
            </div>

            {/* Interactive Pop-Down Clinical FAQ Accordion */}
            <div className="clinical-faq-grid">
              {DONATION_GUIDES.map((guide, idx) => {
                const isOpen = openGuideIndex === idx;
                return (
                  <div
                    key={guide.title}
                    className={`faq-frost-card glass-frost-card ${isOpen ? "is-open" : ""}`}
                  >
                    <button
                      type="button"
                      className="faq-frost-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenGuideIndex((cur) => (cur === idx ? null : idx))}
                    >
                      <div>
                        <span className="faq-summary-tag">{guide.summary}</span>
                        <h4>{guide.title}</h4>
                      </div>
                      <span className={`chevron-indicator ${isOpen ? "is-open" : ""}`}>▾</span>
                    </button>
                    <div className={`pop-down-drawer ${isOpen ? "is-open" : ""}`}>
                      <div className="pop-down-inner">
                        <p className="faq-detail-copy">{guide.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* I. PRE-FOOTER CALL TO ACTION */}
        <section className="prefooter-section section-pad">
          <div className="max-container fade-in-up">
            <div className="prefooter-card">
              <span className="prefooter-tag">EVERY DROP CONNECTS A LIFE</span>
              <h2>Ready to Become a Voluntary Donor?</h2>
              <p>
                Join the verified regional blood donor registry and receive instant alerts when hospitals in your city require your ABO/Rh phenotype.
              </p>
              <button
                type="button"
                className="btn-light btn-lg"
                onClick={() => {
                  setRegistrationComplete(false);
                  setRegisterOpen(true);
                }}
              >
                Register as a Donor Today <ArrowIcon diagonal />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* J. 4-COLUMN FOOTER */}
      <footer className="site-footer">
        <div className="max-container footer-4-grid">
          <div className="footer-col">
            <a className="brand" href="#top">
              <BrandMark />
              <span>
                Blood<span className="brand-accent">Link</span>
              </span>
            </a>
            <p className="footer-about">
              Real-time 3D WebGL donor discovery, NABH blood bank component telemetry, and rapid hospital trauma requisition platform.
            </p>
          </div>

          <div className="footer-col">
            <h4>Navigation</h4>
            <a href="#find-blood">Find a Donor</a>
            <a href="#requests">Urgent Requests</a>
            <a href="#network">3D Blood Bank Network</a>
            <a href="#impact">3D Component Lab</a>
          </div>

          <div className="footer-col">
            <h4>Clinical Protocols</h4>
            <a href="#how-it-works">ABO/Rh Compatibility Matrix</a>
            <a href="#awareness">Donor Readiness Checklist</a>
            <a href="#cinema-3d" onClick={() => setRequestedFilmChapter(0)}>
              3D Golden-Hour Simulation
            </a>
            <button
              type="button"
              className="footer-text-btn"
              onClick={() => {
                setRegistrationComplete(false);
                setRegisterOpen(true);
              }}
            >
              Issue Verified Donor Pass
            </button>
          </div>

          <div className="footer-col">
            <h4>Emergency Drive Alerts</h4>
            <p className="footer-sub-copy">Receive alerts for rare Rh-negative shortages and regional apheresis drives.</p>
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <input
                name="newsletterEmail"
                type="email"
                placeholder="clinician@hospital.org"
                required
                aria-label="Email for regional blood drive alerts"
              />
              <button type="submit" className="btn-primary">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="max-container footer-bottom-row">
          <span>© 2026 BloodLink Emergency Transfusion Network · Built with Three.js WebGL &amp; React 19.</span>
          <div className="footer-socials">
            <a href="#top" aria-label="Back to top">
              <ArrowIcon diagonal />
            </a>
          </div>
        </div>
      </footer>

      {/* Z-50 TOAST ALERT */}
      {toastMessage && (
        <div className="toast-banner" role="status" aria-live="polite">
          <span className="pulse-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Z-40 FLOATING POP-UP / POP-DOWN 3D TELEMETRY CONTROL DOCK */}
      <aside className={`floating-3d-dock ${telemetryDockOpen ? "is-open" : ""}`} aria-label="Live 3D background controls">
        <button
          type="button"
          className="dock-toggle-pill"
          aria-expanded={telemetryDockOpen}
          onClick={() => setTelemetryDockOpen((o) => !o)}
        >
          <span className="pulse-dot" />
          <span>3D Live Stream: {bgMotionMode.toUpperCase()}</span>
          <span className={`chevron-indicator ${telemetryDockOpen ? "is-open" : ""}`}>▴</span>
        </button>

        <div className={`dock-pop-up-card ${telemetryDockOpen ? "is-open" : ""}`}>
          <div className="dock-head">
            <span>LIVE 3D BACKGROUND ENGINE</span>
            <strong>{heroBoost ? "120 BPM Surge" : "74 BPM Normal"}</strong>
          </div>
          <div className="dock-mode-grid">
            {(
              [
                { id: "auto", label: "Auto Scroll" },
                { id: "arterial", label: "Arterial" },
                { id: "helix", label: "ABO Helix" },
                { id: "vortex", label: "Cryo Vortex" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                className={`dock-chip ${bgMotionMode === m.id ? "is-active" : ""}`}
                onClick={() => {
                  setBgMotionMode(m.id);
                  setBgPulseCount((c) => c + 1);
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="dock-bottom-actions">
            <button
              type="button"
              className="dock-action-btn"
              onClick={() => {
                setHeroBoost((b) => !b);
                setBgPulseCount((c) => c + 1);
              }}
            >
              {heroBoost ? "Set 74 BPM" : "Boost 120 BPM"}
            </button>
            <button
              type="button"
              className="dock-action-btn is-ruby"
              onClick={() => setBgPulseCount((c) => c + 1)}
            >
              Systolic Wave
            </button>
          </div>
        </div>
      </aside>

      {/* Z-50 MODALS */}
      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAllModals();
          }}
        >
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button type="button" className="modal-close" aria-label="Close modal" onClick={closeAllModals}>
              <CloseIcon />
            </button>

            {loginOpen ? (
              <>
                <p className="eyebrow">CLINICAL &amp; VOLUNTEER PORTAL</p>
                <h2 id="modal-title">Sign in to BloodLink</h2>
                <p className="modal-intro">Access your verified donor pass, hospital requisition desk, and regional dispatch alerts.</p>
                <form className="registration-form" onSubmit={handleDemoLogin}>
                  <label htmlFor="login-email">Registered Email or Hospital ID</label>
                  <input id="login-email" name="email" type="email" defaultValue="aarav.nair@bloodlink.org" required />
                  <button type="submit" className="btn-primary modal-submit">
                    Sign In <ArrowIcon />
                  </button>
                </form>
              </>
            ) : registerOpen ? (
              registrationComplete && donorPass ? (
                <div className="modal-success">
                  <span className="success-mark">&#10003;</span>
                  <p className="eyebrow">VERIFIED DONOR CREDENTIAL ISSUED</p>
                  <h2 id="modal-title">Welcome to the registry, {donorPass.name}.</h2>
                  <p className="modal-intro">
                    Your digital donor credential is active for fast check-in at partner NABH blood banks.
                  </p>
                  <div className="demo-donor-pass">
                    <div className="pass-top">
                      <span>BLOODLINK VERIFIED DONOR PASS</span>
                      <span>{donorPass.id}</span>
                    </div>
                    <div className="pass-body">
                      <div>
                        <strong>{donorPass.name}</strong>
                        <span>{donorPass.city} · Eligible Whole Blood &amp; Apheresis</span>
                      </div>
                      <span className="pass-group">{donorPass.group}</span>
                    </div>
                  </div>
                  <button type="button" className="btn-primary" onClick={closeAllModals}>
                    Back to BloodLink <ArrowIcon />
                  </button>
                </div>
              ) : (
                <>
                  <p className="eyebrow">VOLUNTARY PLEDGE · BECOME A DONOR</p>
                  <h2 id="modal-title">Register as a Verified Donor</h2>
                  <p className="modal-intro">Enroll in the privacy-shielded regional donor registry for emergency ABO/Rh matching.</p>
                  <form className="registration-form" onSubmit={handleRegistration}>
                    <label htmlFor="donor-name">Full Name</label>
                    <input id="donor-name" name="name" type="text" placeholder="e.g. Dr. Aarav Nair" required />
                    <div className="registration-fields">
                      <label htmlFor="registration-group">
                        Blood group
                        <select id="registration-group" name="group" defaultValue="" required>
                          <option value="" disabled>Select group</option>
                          {BLOOD_GROUPS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </label>
                      <label htmlFor="registration-city">
                        City
                        <input id="registration-city" name="city" type="text" placeholder="e.g. Bengaluru" required />
                      </label>
                    </div>
                    <p className="form-privacy-note">Contact numbers remain encrypted and are never exposed in public directories.</p>
                    <button type="submit" className="btn-primary modal-submit">
                      Issue Verified Donor Pass <ArrowIcon />
                    </button>
                  </form>
                </>
              )
            ) : createRequestOpen ? (
              <>
                <p className="eyebrow">HOSPITAL TRANSFUSION DESK</p>
                <h2 id="modal-title">Post Urgent Blood Requisition</h2>
                <p className="modal-intro">Broadcast a verified clinical requisition to compatible donors and regional blood banks.</p>
                <form className="registration-form" onSubmit={handleCreateDemoRequest}>
                  <label htmlFor="req-hospital">Hospital / Centre Name</label>
                  <input id="req-hospital" name="reqHospital" type="text" placeholder="e.g. Manipal Hospital Trauma ICU" required />
                  <div className="registration-fields">
                    <label htmlFor="req-group">
                      Blood Group
                      <select id="req-group" name="reqGroup" defaultValue="O-" required>
                        {BLOOD_GROUPS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </label>
                    <label htmlFor="req-units">
                      Units Needed
                      <input id="req-units" name="reqUnits" type="text" defaultValue="2 Units" required />
                    </label>
                  </div>
                  <div className="registration-fields">
                    <label htmlFor="req-city">
                      City
                      <input id="req-city" name="reqCity" type="text" placeholder="e.g. Bengaluru" required />
                    </label>
                    <label htmlFor="req-scenario">
                      Scenario
                      <select id="req-scenario" name="reqScenario" defaultValue="Emergency Trauma">
                        <option value="Emergency Trauma">Emergency Trauma</option>
                        <option value="Planned Surgery">Planned Surgery</option>
                        <option value="Critical Care">Critical Care</option>
                      </select>
                    </label>
                  </div>
                  <button type="submit" className="btn-primary modal-submit">
                    Broadcast Hospital Requisition <ArrowIcon />
                  </button>
                </form>
              </>
            ) : activeRequest ? (
              <>
                <p className="eyebrow">REQUISITION {activeRequest.id} · {activeRequest.scenario.toUpperCase()}</p>
                <div className="request-modal-group">{activeRequest.group}</div>
                <h2 id="modal-title">{activeRequest.hospital}</h2>
                <p className="modal-intro">
                  {activeRequest.units} of {activeRequest.componentNeeded} requested in {activeRequest.city} ({activeRequest.updatedLabel}).
                </p>
                <div className="request-detail-list">
                  <div>
                    <span>Department</span>
                    <strong>{activeRequest.department}</strong>
                  </div>
                  <div>
                    <span>Clinical indication</span>
                    <strong>{activeRequest.need}</strong>
                  </div>
                  <div>
                    <span>Compatible donor groups</span>
                    <strong>{COMPATIBILITY_MAP[activeRequest.group].receiveRedCellsFrom.join(", ")}</strong>
                  </div>
                  <div>
                    <span>Cross-match &amp; Desk</span>
                    <strong>{activeRequest.crossMatchNote} · {activeRequest.attendingDesk}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary modal-submit"
                  onClick={() => acceptRequestDemo(activeRequest)}
                >
                  Accept &amp; Match Compatible Donors <ArrowIcon />
                </button>
              </>
            ) : activeDonor ? (
              <>
                <p className="eyebrow">VERIFIED VOLUNTARY DONOR · {activeDonor.id}</p>
                <div className="request-modal-group">{activeDonor.group}</div>
                <h2 id="modal-title">{activeDonor.name}</h2>
                <p className="modal-intro">
                  {activeDonor.location} ({activeDonor.distanceKm} km away) · Pre-screened by {activeDonor.verifiedBy}.
                </p>
                <div className="request-detail-list">
                  <div>
                    <span>Availability &amp; ETA</span>
                    <strong>{activeDonor.availability} · {activeDonor.responseWindow}</strong>
                  </div>
                  <div>
                    <span>Hemoglobin &amp; Last Donation</span>
                    <strong>Hb {activeDonor.hemoglobin} · {activeDonor.lastDonated} ({activeDonor.donationsLogged} lifetime units)</strong>
                  </div>
                  <div>
                    <span>Can donate red cells to</span>
                    <strong>{COMPATIBILITY_MAP[activeDonor.group].donateRedCellsTo.join(", ")}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary modal-submit"
                  onClick={() => {
                    const donorName = activeDonor.name;
                    const donorId = activeDonor.id;
                    setActiveDonor(null);
                    showToast(`Encrypted dispatch ping sent to ${donorName} (${donorId}).`);
                  }}
                >
                  Send Encrypted Dispatch Alert <ArrowIcon />
                </button>
              </>
            ) : null}
          </section>
        </div>
      )}
    </>
  );
}

export default App;
