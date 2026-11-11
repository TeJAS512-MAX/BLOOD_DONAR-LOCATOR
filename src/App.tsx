import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { HeroBloodstream3D } from "./components/HeroBloodstream3D";
import { ImpactOrbit3D } from "./components/ImpactOrbit3D";
import { MotionVideoReel } from "./components/MotionVideoReel";
import { NetworkTopology3D } from "./components/NetworkTopology3D";
import {
  BLOOD_BANKS,
  BLOOD_GROUPS,
  COMPATIBILITY_MAP,
  COMPONENT_STORIES,
  DONOR_PROFILES,
  GITHUB_REPO_URL,
  INITIAL_URGENT_REQUESTS,
  MYTHS_AND_FACTS,
  PROBLEM_SOLUTIONS,
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
        <path d="M48 30l16 7v12c0 10-7 18-16 21-9-3-16-11-16-21V37l16-7Z" fill="#D1FAE5" stroke="#10B981" strokeWidth="2.4" />
        <path d="M41 49l5 5 10-10" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="step-svg" viewBox="0 0 96 96" fill="none">
      <rect x="16" y="20" width="64" height="56" rx="14" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="2" />
      <path d="M48 31c-4.5 6.8-11 13.5-11 20a11 11 0 0 0 22 0c0-6.5-6.5-13.2-11-20Z" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2.4" />
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
  const requestsCarouselRef = useRef<HTMLDivElement>(null);
  const impactStatsRef = useRef<HTMLDivElement>(null);

  // Navigation, Toast & Hero 3D
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroBoost, setHeroBoost] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [impactVisible, setImpactVisible] = useState(false);

  // Floating Find a Donor Bridge State
  const [bloodGroup, setBloodGroup] = useState<"all" | BloodGroup>("O-");
  const [location, setLocation] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<"any" | "emergency" | "same-day" | "scheduled">("any");
  const [includeCompatible, setIncludeCompatible] = useState(true);
  const [showDonorDrawer, setShowDonorDrawer] = useState(true);
  const [activeDonor, setActiveDonor] = useState<DonorProfile | null>(null);

  // Urgent Requests Carousel + Skeleton Loader
  const [requestList, setRequestList] = useState<BloodRequest[]>(INITIAL_URGENT_REQUESTS);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);

  // Blood Bank & Hospital Network + Skeleton Loader
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<"all" | "Blood bank" | "Hospital partner">("all");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(BLOOD_BANKS[0].id);
  const [mapLoading, setMapLoading] = useState(false);

  // Donation Awareness Bento Box
  const [checkedReadiness, setCheckedReadiness] = useState<Record<string, boolean>>({});
  const [mythIndex, setMythIndex] = useState(0);
  const [filmModalOpen, setFilmModalOpen] = useState(false);
  const [requestedFilmChapter, setRequestedFilmChapter] = useState<number | null>(null);

  // 3D Impact Component Orbit
  const [selectedComponentId, setSelectedComponentId] = useState<BloodComponentStory["id"]>("red-cells");
  const [donationCount, setDonationCount] = useState(1);

  // Auth / Registration / Brief / Newsletter
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [demoPass, setDemoPass] = useState<{ name: string; group: string; city: string; id: string } | null>(null);
  const [demoUser, setDemoUser] = useState<string | null>(null);

  const modalOpen =
    registerOpen ||
    loginOpen ||
    briefOpen ||
    filmModalOpen ||
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
        urgencyLevel === "emergency" ? profile.availability === "Ready this week" : true;

      return groupMatches && locationMatches && urgencyMatches;
    }).sort((a, b) => {
      if (bloodGroup !== "all") {
        if (a.group === bloodGroup && b.group !== bloodGroup) return -1;
        if (b.group === bloodGroup && a.group !== bloodGroup) return 1;
      }
      return 0;
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

  const selectedComponent = useMemo(
    () => COMPONENT_STORIES.find((c) => c.id === selectedComponentId) ?? COMPONENT_STORIES[0],
    [selectedComponentId],
  );

  // Scroll fade-in-up observer + Impact CountUp trigger
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
      { threshold: 0.12 },
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
      { threshold: 0.25 },
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
    setBriefOpen(false);
    setFilmModalOpen(false);
    setCreateRequestOpen(false);
    setActiveRequest(null);
    setActiveDonor(null);
  };

  const handleHeroPulse = useCallback(() => {
    setPulseCount((c) => c + 1);
  }, []);

  const handleSelectComponent = useCallback((id: BloodComponentStory["id"]) => {
    setSelectedComponentId(id);
  }, []);

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
    showToast("Demo location set to Bengaluru — showing local & compatible donors.");
  };

  const simulateRequestsRefresh = () => {
    setRequestsLoading(true);
    window.setTimeout(() => {
      setRequestsLoading(false);
      showToast("Urgent demo request feed synced.");
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
    const randomNum = Math.floor(500 + Math.random() * 480);
    setDemoPass({ name, group, city, id: `BL-DEMO-${randomNum}` });
    setRegistrationComplete(true);
    showToast(`Concept donor pass ${`BL-DEMO-${randomNum}`} created!`);
  };

  const handleDemoLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "volunteer@bloodlink.demo").trim();
    setDemoUser(email.split("@")[0]);
    setLoginOpen(false);
    showToast(`Signed in to demo portal as ${email.split("@")[0]}.`);
  };

  const handleCreateDemoRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const group = String(formData.get("reqGroup") || "O-") as BloodGroup;
    const hospital = String(formData.get("reqHospital") || "City Trauma Centre").trim();
    const city = String(formData.get("reqCity") || "Bengaluru").trim();
    const units = String(formData.get("reqUnits") || "2 units").trim();
    const scenario = String(formData.get("reqScenario") || "Emergency Trauma") as BloodRequest["scenario"];
    const priority = scenario === "Emergency Trauma" ? "Urgent" : "Priority";

    const newReq: BloodRequest = {
      id: `REQ-${Math.floor(600 + Math.random() * 350)}`,
      group,
      units,
      hospital,
      area: city,
      city,
      need: `${scenario} support`,
      scenario,
      priority,
      updatedLabel: "Just now",
      componentNeeded: scenario === "Critical Care" ? "Platelets / Plasma" : "Packed Red Cells",
    };

    setRequestList((prev) => [newReq, ...prev]);
    setCreateRequestOpen(false);
    showToast(`Demo urgent request posted for ${group} at ${hospital}.`);
  };

  const acceptRequestDemo = (req: BloodRequest) => {
    setActiveRequest(null);
    setBloodGroup(req.group);
    setIncludeCompatible(true);
    setLocation(req.city);
    setShowDonorDrawer(true);
    showToast(`Matching compatible donors for ${req.group} in ${req.city}.`);
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
    showToast("Demo updates subscribed (prototype only — no email saved).");
  };

  return (
    <>
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
            <a href="#network" onClick={() => setMenuOpen(false)}>Blood Banks</a>
            <a href="#awareness" onClick={() => setMenuOpen(false)}>Awareness</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>About</a>

            <div className="nav-mobile-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setMenuOpen(false);
                  setLoginOpen(true);
                }}
              >
                {demoUser ? `Hi, ${demoUser}` : "Login"}
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
            <button type="button" className="btn-ghost" onClick={() => setLoginOpen(true)}>
              {demoUser ? `Hi, ${demoUser}` : "Login"}
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
        {/* B. HERO SECTION: 60% CONTENT / 40% LIVE 3D WEBGL STAGE */}
        <section className="hero-section" id="top">
          <div className="hero-radial-glow" aria-hidden="true" />
          <div className="max-container hero-grid">
            <div className="hero-left">
              <span className="hero-badge">
                <span className="pulse-dot" /> LIVE 3D BLOOD NETWORK · AI PROMPT BATTLE 2.0
              </span>
              <h1>
                Every Drop<br />
                <span>Connects a Life.</span>
              </h1>
              <p className="hero-sub">
                During medical emergencies, surgeries, and critical treatments, finding suitable donors and verified blood banks shouldn&apos;t stall. BloodLink bridges voluntary donors, hospitals, and authorised blood banks in seconds.
              </p>
              <div className="hero-cta-row">
                <a className="btn-primary btn-lg" href="#find-blood">
                  Find a Donor <ArrowIcon />
                </a>
                <button
                  type="button"
                  className="btn-outline-light btn-lg"
                  onClick={() => {
                    setRequestedFilmChapter(0);
                    setFilmModalOpen(true);
                  }}
                >
                  ▶ Watch Motion Film
                </button>
              </div>
              <div className="hero-3d-controls">
                <span>Drag 3D network to orbit · Click to pulse{pulseCount > 0 ? ` (${pulseCount})` : ""}</span>
                <button
                  type="button"
                  className={`mini-chip ${heroBoost ? "is-active" : ""}`}
                  onClick={() => setHeroBoost((b) => !b)}
                >
                  {heroBoost ? "Signal Flow: Fast" : "Boost 3D Flow"}
                </button>
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-3d-frame">
                <HeroBloodstream3D interactiveBoost={heroBoost} onPulse={handleHeroPulse} />
                <div className="hero-3d-legend">
                  <span><i className="dot-red" /> Donors</span>
                  <span><i className="dot-blue" /> Blood Banks</span>
                  <span><i className="dot-green" /> Hospitals</span>
                </div>
              </div>
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
                  {showDonorDrawer ? "Hide" : "Show"} {matches.length} demo matches
                </button>
              </div>

              {showDonorDrawer && (
                <div className="donor-drawer" aria-live="polite">
                  {matches.length > 0 ? (
                    <div className="donor-drawer-grid">
                      {matches.slice(0, 6).map((profile) => {
                        const isDirect = bloodGroup === "all" || profile.group === bloodGroup;
                        return (
                          <button
                            key={profile.id}
                            type="button"
                            className="donor-mini-card"
                            onClick={() => setActiveDonor(profile)}
                          >
                            <div className="donor-mini-top">
                              <span className="donor-pill-group">{profile.group}</span>
                              <span className={`match-tag ${isDirect ? "is-direct" : "is-compat"}`}>
                                {bloodGroup === "all"
                                  ? "Demo Profile"
                                  : isDirect
                                    ? "Exact Match"
                                    : `Compatible (${bloodGroup})`}
                              </span>
                            </div>
                            <strong>{profile.location}</strong>
                            <small>{profile.availability} · {profile.responseWindow}</small>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="empty-hint">
                      No sample profiles found for that filter. Clear the city field or enable Smart Compatibility Matching.
                    </p>
                  )}
                  <p className="prototype-disclaimer-line">
                    Concept prototype only — sample donor profiles are shown with privacy shielding; no live registry is connected.
                  </p>
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
                <span className="eyebrow">LIVE DEMO DISPATCH</span>
                <h2>Urgent Blood Requests</h2>
              </div>
              <div className="carousel-actions">
                <button type="button" className="btn-secondary-outline" onClick={simulateRequestsRefresh}>
                  Sync Feed
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setCreateRequestOpen(true)}
                >
                  + Raise Demo Request
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
                {requestList.map((req) => (
                  <article className="request-card" key={req.id}>
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
                        <span className="request-time">{req.updatedLabel} (Demo)</span>
                      </div>
                    </div>

                    <h3>{req.hospital}</h3>
                    <p className="request-city">{req.city} · {req.need}</p>

                    <button
                      type="button"
                      className="btn-primary request-accept-btn"
                      onClick={() => setActiveRequest(req)}
                    >
                      Accept Request (Demo)
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* E. HOW IT WORKS (3-COLUMN GRID + DOTTED SVG CONNECTORS + PROBLEM SOLUTIONS) */}
        <section className="how-section section-pad" id="how-it-works">
          <div className="max-container fade-in-up">
            <div className="centered-header">
              <span className="eyebrow">SOLVING THE CHALLENGE</span>
              <h2>Simple Steps to Save a Life</h2>
              <p>
                Every step directly addresses emergency delays — replacing fragmented social messages with verified hospital requests, compatible donor matching, and 3D blood bank discovery.
              </p>
            </div>

            <div className="steps-wrapper">
              {/* Desktop Dotted SVG Connectors */}
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
                <article className="step-card">
                  <StepIllustration step={1} />
                  <span className="step-index">STEP 01</span>
                  <h3>Search Compatible Donors</h3>
                  <p>
                    Enter the required blood group and city to discover both direct and ABO/Rh compatible voluntary donors without exposing private contact numbers.
                  </p>
                </article>

                <article className="step-card">
                  <StepIllustration step={2} />
                  <span className="step-index">STEP 02</span>
                  <h3>Verify Hospital &amp; Bank</h3>
                  <p>
                    Inspect verified hospital requests and locate authorised blood banks with the exact component capability (red cells, plasma, or platelets) in 3D.
                  </p>
                </article>

                <article className="step-card">
                  <StepIllustration step={3} />
                  <span className="step-index">STEP 03</span>
                  <h3>Donate &amp; Multiply Impact</h3>
                  <p>
                    Confirm on-site readiness with clinicians and donate safely — one voluntary unit separates into components that can support up to three lives.
                  </p>
                </article>
              </div>
            </div>

            {/* Problem-to-Solution Summary Strip */}
            <div className="solutions-strip">
              {PROBLEM_SOLUTIONS.map((sol) => (
                <a key={sol.id} href={sol.targetSection} className="solution-mini-item">
                  <span>{sol.index} · {sol.problemTitle}</span>
                  <strong>{sol.chosenSolution}</strong>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* F. BLOOD BANK & HOSPITAL NETWORK (MIDNIGHT BLUE 50/50 SPLIT + 3D MAP) */}
        <section className="network-dark-section section-pad" id="network">
          <div className="max-container fade-in-up">
            <div className="network-header">
              <div>
                <span className="eyebrow eyebrow-blue">VERIFIED DIRECTORY</span>
                <h2>Blood Bank &amp; Hospital Network</h2>
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
                              {bank.type}
                            </span>
                            <span className="network-city">{bank.city}</span>
                          </div>
                          <h3>{bank.name}</h3>
                          <p>{bank.address} · {bank.hours}</p>
                          <div className="network-services">
                            {bank.services.map((srv) => (
                              <span key={srv}>{srv}</span>
                            ))}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="empty-dark">No illustrative centres match that search.</p>
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
                    <div>
                      <strong>{selectedPartner.name}</strong>
                      <small>{selectedPartner.address} · {selectedPartner.services.join(" · ")}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* G. DONATION AWARENESS (4-COLUMN × 2-ROW BENTO BOX UI) */}
        <section className="awareness-section section-pad" id="awareness">
          <div className="max-container fade-in-up">
            <div className="centered-header">
              <span className="eyebrow">DONATION AWARENESS</span>
              <h2>Know Before You Donate</h2>
              <p>
                Interactive eligibility guidance, myth-busting medical facts, preparation habits, and our 60fps animated motion film in one clean Bento workspace.
              </p>
            </div>

            <div className="bento-grid">
              {/* Block 1: Large 2x2 Eligibility Self-Check Quiz */}
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

              {/* Block 2: Medium 2x1 Myth vs Fact Slider */}
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
              </div>

              {/* Block 3: Small 1x1 Quick Prep Tips */}
              <div className="bento-card bento-prep">
                <span className="bento-tag">QUICK PREP TIPS</span>
                <h3>4 Habits Before You Visit</h3>
                <ul className="prep-list">
                  <li><span>💧</span> Drink 500ml water 2 hrs prior</li>
                  <li><span>🥗</span> Eat an iron-rich balanced meal</li>
                  <li><span>🪪</span> Carry valid government photo ID</li>
                  <li><span>🛋️</span> Rest 15 mins after donating</li>
                </ul>
              </div>

              {/* Block 4: Small 1x1 Motion Film Video Card */}
              <button
                type="button"
                className="bento-card bento-video-card"
                onClick={() => {
                  setRequestedFilmChapter(0);
                  setFilmModalOpen(true);
                }}
              >
                <div className="video-thumb-overlay">
                  <span className="video-play-circle">▶</span>
                  <span className="bento-tag video-tag">60FPS MOTION FILM</span>
                </div>
                <div className="video-card-copy">
                  <h3>See the Solution Story</h3>
                  <small>4-chapter interactive motion graphic film (24s)</small>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* H. OUR IMPACT (4-COLUMN COUNTUP METRICS + 3D COMPONENT SEPARATION) */}
        <section
          className="impact-metrics-section section-pad"
          id="impact"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(11, 15, 25, 0.92), rgba(34, 10, 22, 0.92)), url('./images/bloodlink-world.jpg')",
          }}
        >
          <div className="impact-bg-overlay" aria-hidden="true" />
          <div className="max-container impact-container fade-in-up">
            <div className="centered-header centered-light">
              <span className="eyebrow eyebrow-rose">OUR IMPACT MODEL</span>
              <h2>One Voluntary Gift, Multiplied</h2>
              <p>
                Separated in component laboratories, a single blood unit branches into targeted clinical therapies. (Illustrative prototype metrics below.)
              </p>
            </div>

            <div className="metrics-4-grid" ref={impactStatsRef}>
              <div className="metric-block">
                <strong>
                  <CountUpMetric end={3} prefix="Up to " trigger={impactVisible} />
                </strong>
                <span>LIVES SUPPORTED PER UNIT</span>
              </div>
              <div className="metric-block">
                <strong>
                  <CountUpMetric end={8} trigger={impactVisible} />
                </strong>
                <span>ABO / RH GROUPS MATCHED</span>
              </div>
              <div className="metric-block">
                <strong>
                  <CountUpMetric end={24} suffix="/7" trigger={impactVisible} />
                </strong>
                <span>VERIFIED REQUEST WORKFLOW</span>
              </div>
              <div className="metric-block">
                <strong>
                  <CountUpMetric end={100} suffix="%" trigger={impactVisible} />
                </strong>
                <span>PRIVACY-SHIELDED DEMO RELAY</span>
              </div>
            </div>

            {/* Interactive 3D Blood Component Separation Orbit */}
            <div className="impact-3d-split">
              <div className="impact-3d-info">
                <span className="eyebrow eyebrow-rose">INTERACTIVE 3D SEPARATION</span>
                <h3>Explore Separated Components</h3>
                <div className="component-tabs">
                  {COMPONENT_STORIES.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      className={`comp-tab ${selectedComponentId === comp.id ? "is-active" : ""}`}
                      onClick={() => setSelectedComponentId(comp.id)}
                    >
                      <span className="comp-dot" style={{ background: comp.color }} />
                      {comp.title}
                    </button>
                  ))}
                </div>

                <div className="comp-detail-box">
                  <div className="comp-meta">
                    <span>{selectedComponent.subtitle}</span>
                    <span>{selectedComponent.shelfLife}</span>
                  </div>
                  <h4>{selectedComponent.title}</h4>
                  <p>{selectedComponent.description}</p>
                  <small>Clinical focus: {selectedComponent.useCase}</small>
                </div>

                <div className="sim-box">
                  <div className="sim-top">
                    <label htmlFor="impact-slider">
                      Donation Simulator: <strong>{donationCount}</strong>{" "}
                      {donationCount === 1 ? "unit" : "units"}
                    </label>
                    <span>Up to ~{donationCount * 3} care pathways</span>
                  </div>
                  <input
                    id="impact-slider"
                    type="range"
                    min={1}
                    max={50}
                    value={donationCount}
                    onChange={(e) => setDonationCount(Number(e.target.value))}
                    className="impact-range"
                  />
                </div>
              </div>

              <div className="impact-3d-stage-col">
                <ImpactOrbit3D
                  selectedId={selectedComponentId}
                  donationCount={donationCount}
                  onSelectComponent={handleSelectComponent}
                />
              </div>
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
                Preview how fast joining a community donor network can feel — create an illustrative BloodLink Concept Pass in under 20 seconds.
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
              An AI Prompt Battle 2.0 3D WebGL &amp; motion-graphics prototype connecting voluntary blood donors, hospitals, and authorised blood banks.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <a href="#find-blood">Find a Donor</a>
            <a href="#requests">Urgent Requests</a>
            <a href="#network">Blood Bank Network</a>
            <a href="#awareness">Donation Awareness</a>
          </div>

          <div className="footer-col">
            <h4>Resources &amp; Project</h4>
            <a href="#how-it-works">How It Works</a>
            <button type="button" className="footer-text-btn" onClick={() => setBriefOpen(true)}>
              Problem &amp; Architecture Brief
            </button>
            <button
              type="button"
              className="footer-text-btn"
              onClick={() => {
                setRequestedFilmChapter(0);
                setFilmModalOpen(true);
              }}
            >
              Watch 60fps Motion Film
            </button>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub: TeJAS512-MAX
            </a>
          </div>

          <div className="footer-col">
            <h4>Stay Updated (Demo)</h4>
            <p className="footer-sub-copy">Get notified about community blood drives in this concept UI.</p>
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <input
                name="newsletterEmail"
                type="email"
                placeholder="you@example.com"
                required
                aria-label="Email for demo updates"
              />
              <button type="submit" className="btn-primary">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="max-container footer-bottom-row">
          <span>© 2026 BloodLink Concept Prototype · Not a live medical or emergency service.</span>
          <div className="footer-socials">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.36 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.91-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.35 9.35 0 0 1 12 6.84c.85 0 1.7.12 2.5.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.49A10.22 10.22 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
              </svg>
            </a>
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
            className={`modal-panel ${filmModalOpen ? "modal-panel-wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button type="button" className="modal-close" aria-label="Close modal" onClick={closeAllModals}>
              <CloseIcon />
            </button>

            {filmModalOpen ? (
              <div className="film-modal-wrap">
                <p className="eyebrow">60FPS MOTION GRAPHICS FILM · BLOODLINK STORY</p>
                <h2 id="modal-title" style={{ marginBottom: "16px" }}>
                  How BloodLink Connects Lives
                </h2>
                <MotionVideoReel externalChapterRequest={requestedFilmChapter} />
              </div>
            ) : loginOpen ? (
              <>
                <p className="eyebrow">VOLUNTEER PORTAL · CONCEPT DEMO</p>
                <h2 id="modal-title">Sign in to BloodLink</h2>
                <p className="modal-intro">Demo sign-in preview — no real credentials or server authentication required.</p>
                <form className="registration-form" onSubmit={handleDemoLogin}>
                  <label htmlFor="login-email">Email address (demo)</label>
                  <input id="login-email" name="email" type="email" defaultValue="donor@bloodlink.demo" required />
                  <button type="submit" className="btn-primary modal-submit">
                    Enter Demo Portal <ArrowIcon />
                  </button>
                </form>
              </>
            ) : registerOpen ? (
              registrationComplete && demoPass ? (
                <div className="modal-success">
                  <span className="success-mark">&#10003;</span>
                  <p className="eyebrow">CONCEPT DONOR PASS READY</p>
                  <h2 id="modal-title">Welcome to the chain, {demoPass.name}.</h2>
                  <p className="modal-intro">
                    Illustrative digital pass generated locally — nothing has been transmitted or stored.
                  </p>
                  <div className="demo-donor-pass">
                    <div className="pass-top">
                      <span>BLOODLINK CONCEPT PASS</span>
                      <span>{demoPass.id}</span>
                    </div>
                    <div className="pass-body">
                      <div>
                        <strong>{demoPass.name}</strong>
                        <span>{demoPass.city}</span>
                      </div>
                      <span className="pass-group">{demoPass.group}</span>
                    </div>
                  </div>
                  <button type="button" className="btn-primary" onClick={closeAllModals}>
                    Back to BloodLink <ArrowIcon />
                  </button>
                </div>
              ) : (
                <>
                  <p className="eyebrow">VOLUNTARY PLEDGE · BECOME A DONOR</p>
                  <h2 id="modal-title">Register as a Demo Donor</h2>
                  <p className="modal-intro">Experience BloodLink&apos;s fast voluntary donor onboarding.</p>
                  <form className="registration-form" onSubmit={handleRegistration}>
                    <label htmlFor="donor-name">Display name</label>
                    <input id="donor-name" name="name" type="text" placeholder="e.g. Aarav Nair" required />
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
                    <p className="form-privacy-note">Prototype only — no personal or health data is saved.</p>
                    <button type="submit" className="btn-primary modal-submit">
                      Generate Concept Donor Pass <ArrowIcon />
                    </button>
                  </form>
                </>
              )
            ) : createRequestOpen ? (
              <>
                <p className="eyebrow">HOSPITAL INTAKE SIMULATOR</p>
                <h2 id="modal-title">Raise a Verified Demo Request</h2>
                <p className="modal-intro">Preview how a hospital blood desk logs a request onto the live board.</p>
                <form className="registration-form" onSubmit={handleCreateDemoRequest}>
                  <label htmlFor="req-hospital">Hospital / Centre Name</label>
                  <input id="req-hospital" name="reqHospital" type="text" placeholder="e.g. Apollo Clinical Centre" required />
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
                      <input id="req-units" name="reqUnits" type="text" defaultValue="2 units" required />
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
                    Post Demo Request <ArrowIcon />
                  </button>
                </form>
              </>
            ) : activeRequest ? (
              <>
                <p className="eyebrow">VERIFIED HOSPITAL REQUEST · {activeRequest.scenario.toUpperCase()}</p>
                <div className="request-modal-group">{activeRequest.group}</div>
                <h2 id="modal-title">{activeRequest.hospital}</h2>
                <p className="modal-intro">
                  {activeRequest.units} of {activeRequest.componentNeeded} requested in {activeRequest.city} ({activeRequest.updatedLabel}).
                </p>
                <div className="request-detail-list">
                  <div>
                    <span>Clinical purpose</span>
                    <strong>{activeRequest.need}</strong>
                  </div>
                  <div>
                    <span>Compatible donor groups</span>
                    <strong>{COMPATIBILITY_MAP[activeRequest.group].receiveRedCellsFrom.join(", ")}</strong>
                  </div>
                  <div>
                    <span>Verification status</span>
                    <strong>Hospital blood desk — demo verified</strong>
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
                <p className="eyebrow">PRIVACY-SHIELDED DEMO PROFILE · {activeDonor.id}</p>
                <div className="request-modal-group">{activeDonor.group}</div>
                <h2 id="modal-title">{activeDonor.location}</h2>
                <p className="modal-intro">
                  Donor contact details remain hidden until coordinated through an authorised blood centre.
                </p>
                <div className="request-detail-list">
                  <div>
                    <span>Availability</span>
                    <strong>{activeDonor.availability}</strong>
                  </div>
                  <div>
                    <span>Response window</span>
                    <strong>{activeDonor.responseWindow}</strong>
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
                    setActiveDonor(null);
                    setRegistrationComplete(false);
                    setRegisterOpen(true);
                  }}
                >
                  Create Your Own Demo Pass <ArrowIcon />
                </button>
              </>
            ) : briefOpen ? (
              <>
                <p className="eyebrow">AI PROMPT BATTLE 2.0 · ARCHITECTURE BRIEF</p>
                <h2 id="modal-title">BloodLink — Problem-Solving Blueprint</h2>
                <p className="modal-intro">
                  Combines Three.js interactive 3D scenes, a 60fps procedural motion film, compatibility-aware matching, and hospital-verified request intake.
                </p>
                <div className="request-detail-list">
                  <div>
                    <span>3D Stages</span>
                    <strong>Hero Biological Network · 3D Topology Map · 3D Component Orbit</strong>
                  </div>
                  <div>
                    <span>Motion Graphics</span>
                    <strong>24s 4-chapter procedural canvas film + fullscreen cinema modal</strong>
                  </div>
                  <div>
                    <span>Repository</span>
                    <strong>TeJAS512-MAX/BLOOD_DONAR-LOCATOR</strong>
                  </div>
                </div>
                <a
                  className="btn-primary modal-submit"
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open GitHub Repository <ArrowIcon diagonal />
                </a>
              </>
            ) : null}
          </section>
        </div>
      )}
    </>
  );
}

export default App;
