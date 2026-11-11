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
  DONATION_GUIDES,
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

function App() {
  const finderRef = useRef<HTMLElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  // Navigation & Hero 3D controls
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroBoost, setHeroBoost] = useState(false);
  const [heroFreeExplore, setHeroFreeExplore] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Motion Film chapter synchronization
  const [requestedFilmChapter, setRequestedFilmChapter] = useState<number | null>(null);
  const [activeFilmChapter, setActiveFilmChapter] = useState(0);

  // Donor discovery & compatibility-aware matching
  const [bloodGroup, setBloodGroup] = useState<"all" | BloodGroup>("O-");
  const [includeCompatible, setIncludeCompatible] = useState(true);
  const [readyOnly, setReadyOnly] = useState(false);
  const [location, setLocation] = useState("");
  const [compatGroup, setCompatGroup] = useState<BloodGroup>("O-");
  const [activeDonor, setActiveDonor] = useState<DonorProfile | null>(null);

  // Urgent requests + Demo Request Composer
  const [requestList, setRequestList] = useState<BloodRequest[]>(INITIAL_URGENT_REQUESTS);
  const [requestFilter, setRequestFilter] = useState<"all" | "Urgent" | "Priority">("all");
  const [scenarioFilter, setScenarioFilter] = useState<
    "all" | "Emergency Trauma" | "Planned Surgery" | "Critical Care"
  >("all");
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);

  // Blood bank network & 3D spatial topology
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<"all" | "Blood bank" | "Hospital partner">("all");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(BLOOD_BANKS[0].id);

  // Donation awareness
  const [openGuide, setOpenGuide] = useState(0);
  const [awarenessTab, setAwarenessTab] = useState<"guide" | "myths" | "readiness">("guide");
  const [checkedReadiness, setCheckedReadiness] = useState<Record<string, boolean>>({});

  // 3D Impact Orbit & simulator
  const [selectedComponentId, setSelectedComponentId] = useState<BloodComponentStory["id"]>("red-cells");
  const [donationCount, setDonationCount] = useState(1);

  // Donor registration & challenge brief modals
  const [registerOpen, setRegisterOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [repoCopied, setRepoCopied] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [demoPass, setDemoPass] = useState<{ name: string; group: string; city: string; id: string } | null>(null);

  const modalOpen =
    registerOpen || briefOpen || createRequestOpen || activeRequest !== null || activeDonor !== null;

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

      const readinessMatches = !readyOnly || profile.availability === "Ready this week";
      return groupMatches && locationMatches && readinessMatches;
    }).sort((a, b) => {
      // Prioritize exact group match first when compatible matching is enabled
      if (bloodGroup !== "all") {
        if (a.group === bloodGroup && b.group !== bloodGroup) return -1;
        if (b.group === bloodGroup && a.group !== bloodGroup) return 1;
      }
      return 0;
    });
  }, [bloodGroup, includeCompatible, location, readyOnly]);

  const filteredRequests = useMemo(() => {
    return requestList.filter((req) => {
      const matchesPriority = requestFilter === "all" || req.priority === requestFilter;
      const matchesScenario = scenarioFilter === "all" || req.scenario === scenarioFilter;
      return matchesPriority && matchesScenario;
    });
  }, [requestList, requestFilter, scenarioFilter]);

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

  const activeCompatibility = COMPATIBILITY_MAP[compatGroup];

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setRegisterOpen(false);
        setBriefOpen(false);
        setCreateRequestOpen(false);
        setActiveRequest(null);
        setActiveDonor(null);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen]);

  const toggleReadiness = (id: string) => {
    setCheckedReadiness((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedReadinessCount = Object.values(checkedReadiness).filter(Boolean).length;

  const copyRepoUrl = () => {
    navigator.clipboard
      ?.writeText(GITHUB_REPO_URL)
      .then(() => {
        setRepoCopied(true);
        window.setTimeout(() => setRepoCopied(false), 2200);
      })
      .catch(() => {});
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

  const scrollToFinder = () => {
    finderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => locationRef.current?.focus({ preventScroll: true }), 450);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
  };

  const handleCreateDemoRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const group = (String(formData.get("reqGroup") || "O-") as BloodGroup);
    const hospital = String(formData.get("reqHospital") || "City General Hospital").trim();
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
      updatedLabel: "Demo posted just now",
      componentNeeded: scenario === "Critical Care" ? "Platelets / Plasma" : "Packed Red Cells",
    };

    setRequestList((prev) => [newReq, ...prev]);
    setRequestFilter("all");
    setScenarioFilter("all");
    setCreateRequestOpen(false);
  };

  const openRegistration = () => {
    setMenuOpen(false);
    setRegistrationComplete(false);
    setRegisterOpen(true);
  };

  const exploreRequest = (request: BloodRequest) => {
    setActiveRequest(null);
    setBloodGroup(request.group);
    setIncludeCompatible(true);
    setLocation(request.city);
    window.setTimeout(scrollToFinder, 120);
  };

  const applyCompatibilityToSearch = (group: BloodGroup) => {
    setBloodGroup(group);
    setIncludeCompatible(true);
    setLocation("");
  };

  const closeAllModals = () => {
    setRegisterOpen(false);
    setBriefOpen(false);
    setCreateRequestOpen(false);
    setActiveRequest(null);
    setActiveDonor(null);
  };

  return (
    <>
      <div className="scroll-progress-track" aria-hidden="true">
        <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
      </div>

      <main>
        {/* HERO: LIVE 3D WEBGL BLOODSTREAM MACRO-WORLD */}
        <section className={`hero ${heroFreeExplore ? "is-free-explore" : ""}`} id="top">
          <HeroBloodstream3D
            interactiveBoost={heroBoost}
            freeExplore={heroFreeExplore}
            onPulse={handleHeroPulse}
          />
          <div className="hero-shade" aria-hidden="true" />

          <header className="site-header page-width">
            <a className="brand" href="#top" aria-label="BloodLink home" onClick={() => setMenuOpen(false)}>
              <BrandMark />
              <span>
                Blood<span className="brand-accent">Link</span>
              </span>
            </a>
            <button
              className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span />
              <span />
            </button>
            <div className={`nav-shell ${menuOpen ? "is-open" : ""}`}>
              <nav className="main-nav" aria-label="Main navigation">
                <a href="#problem" onClick={() => setMenuOpen(false)}>Solutions & Film</a>
                <a href="#discover" onClick={() => setMenuOpen(false)}>Find Donor</a>
                <a href="#requests" onClick={() => setMenuOpen(false)}>Urgent Needs</a>
                <a href="#network" onClick={() => setMenuOpen(false)}>Blood Banks</a>
                <a href="#learn" onClick={() => setMenuOpen(false)}>Awareness</a>
              </nav>
              <button className="header-cta" type="button" onClick={openRegistration}>
                Become a donor <ArrowIcon diagonal />
              </button>
            </div>
          </header>

          <div className="hero-content-shell page-width">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow">
                <span className="live-dot" /> REAL-TIME 3D BLOODSTREAM PLATFORM · CONCEPT PROTOTYPE
              </p>
              <h1>
                Blood<span>Link</span>
              </h1>
              <p className="hero-tagline">Every drop connects a life.</p>
              <p className="hero-description">
                Connecting voluntary donors, hospitals, and authorised blood banks in one calm, compatibility-aware platform — built for rapid coordination during emergencies, surgeries, and critical care.
              </p>
              <div className="hero-actions">
                <button className="button button-light" type="button" onClick={scrollToFinder}>
                  Find a donor <ArrowIcon />
                </button>
                <button className="button button-outline-light" type="button" onClick={openRegistration}>
                  Become a donor <ArrowIcon diagonal />
                </button>
                <a className="button button-ghost-light" href="#problem">
                  Watch motion film <ArrowIcon />
                </a>
              </div>
            </div>
          </div>

          <div className="hero-bottom-bar page-width">
            <a className="hero-scroll" href="#problem">
              <span className="scroll-line" />
              <span>Scroll to explore solutions</span>
              <span className="scroll-index">01</span>
            </a>

            <div className="hero-3d-hud">
              <span>
                {heroFreeExplore
                  ? "FREE 3D ORBIT · DRAG TO ROTATE 360° · CLICK TO PULSE"
                  : `LIVE 3D WEBGL · DRAG OR CLICK TO PULSE${pulseCount > 0 ? ` (${pulseCount})` : ""}`}
              </span>
              <div className="hero-hud-actions">
                <button
                  type="button"
                  className={`hero-boost-btn ${heroBoost ? "is-active" : ""}`}
                  onClick={() => setHeroBoost((b) => !b)}
                >
                  {heroBoost ? "Flow: Fast" : "Boost Flow"}
                </button>
                <button
                  type="button"
                  className={`hero-boost-btn ${heroFreeExplore ? "is-active" : ""}`}
                  onClick={() => setHeroFreeExplore((e) => !e)}
                >
                  {heroFreeExplore ? "Exit 3D View" : "Full 3D View"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* KINETIC MOTION TICKER */}
        <div className="kinetic-ticker" aria-hidden="true">
          <div className="ticker-track">
            <span>EVERY DROP CONNECTS A LIFE</span>
            <i />
            <span>COMPATIBILITY-AWARE DONOR DISCOVERY</span>
            <i />
            <span>VERIFIED HOSPITAL REQUEST WORKFLOW</span>
            <i />
            <span>3D AUTHORISED BLOOD BANK TOPOLOGY</span>
            <i />
            <span>60FPS MOTION GRAPHICS STORYTELLING</span>
            <i />
            <span>EVERY DROP CONNECTS A LIFE</span>
            <i />
            <span>COMPATIBILITY-AWARE DONOR DISCOVERY</span>
            <i />
            <span>VERIFIED HOSPITAL REQUEST WORKFLOW</span>
            <i />
            <span>3D AUTHORISED BLOOD BANK TOPOLOGY</span>
            <i />
          </div>
        </div>

        {/* SECTION 01: PROBLEM STATEMENT, SOLUTION MATRIX & MOTION VIDEO REEL */}
        <section className="problem-section section-pad" id="problem">
          <div className="page-width">
            <div className="section-intro problem-header">
              <div>
                <p className="eyebrow section-eyebrow problem-eyebrow">
                  <span>01</span> PROBLEM STATEMENT & SOLUTION ARCHITECTURE
                </p>
                <h2>
                  Four real bottlenecks.<br />
                  <span>Engineered into clear solutions.</span>
                </h2>
              </div>
              <p className="section-description problem-lead">
                During medical emergencies, surgeries, and critical treatments, people struggle to identify suitable donors, locate verified blood banks, and coordinate requests quickly. For each bottleneck, we evaluated possible approaches and implemented the strongest digital workflow below.
              </p>
            </div>

            <div className="problem-grid">
              <div className="problem-pillars">
                <div className="pillar-list">
                  {PROBLEM_SOLUTIONS.map((item, idx) => {
                    const isSynced = activeFilmChapter === idx;
                    return (
                      <article
                        key={item.id}
                        className={`pillar-card ${isSynced ? "is-active" : ""}`}
                      >
                        <div className="pillar-top">
                          <span className="pillar-num">PROBLEM {item.index}</span>
                          <button
                            type="button"
                            className="pillar-film-btn"
                            onClick={() => setRequestedFilmChapter(item.filmChapter)}
                          >
                            Play Scene {item.index}
                          </button>
                        </div>
                        <h3>{item.problemTitle}</h3>
                        <p className="pillar-pain">{item.painPoint}</p>
                        <p className="pillar-evaluated">{item.optionsEvaluated}</p>
                        <div className="pillar-solution-row">
                          <span className="solution-badge">BEST SOLUTION</span>
                          <p>{item.chosenSolution}</p>
                        </div>
                        <a className="pillar-jump" href={item.targetSection}>
                          Try live solution <ArrowIcon />
                        </a>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="problem-film-column">
                <div className="film-sticky-wrap">
                  <MotionVideoReel
                    externalChapterRequest={requestedFilmChapter}
                    onChapterChange={setActiveFilmChapter}
                  />
                  <div className="film-mission-summary">
                    <span className="mono-tag">OUR MISSION</span>
                    <p>
                      BloodLink brings voluntary donors, hospitals, and authorised blood banks into one verified, privacy-preserving network — turning critical delays into immediate clarity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 02: SMART COMPATIBILITY-AWARE DONOR DISCOVERY */}
        <section className="finder-section section-pad" id="discover" ref={finderRef}>
          <div className="page-width">
            <div className="section-intro">
              <div>
                <p className="eyebrow section-eyebrow">
                  <span>02</span> SMART DONOR DISCOVERY
                </p>
                <h2>
                  Find direct &amp; medically<br />
                  <span>compatible donors.</span>
                </h2>
              </div>
              <p className="section-description">
                Unlike basic directories that only show exact matches, BloodLink automatically surfaces compatible red-cell blood groups so urgent needs are filled faster.
              </p>
            </div>

            <div className="finder-console">
              <div className="console-topline">
                <div>
                  <span className="console-pulse" />
                  <span>COMPATIBILITY-AWARE DONOR CONSOLE</span>
                </div>
                <span className="console-demo">CONCEPT PROTOTYPE · SAMPLE DATA</span>
              </div>

              <form className="search-form" onSubmit={handleSearch}>
                <label className="field-group" htmlFor="blood-group">
                  <span className="field-label">Required blood group</span>
                  <span className="select-wrap">
                    <select
                      id="blood-group"
                      value={bloodGroup}
                      onChange={(event) => setBloodGroup(event.target.value as "all" | BloodGroup)}
                    >
                      <option value="all">Any blood group</option>
                      {BLOOD_GROUPS.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                    <span className="select-caret" aria-hidden="true" />
                  </span>
                </label>

                <label className="field-group" htmlFor="donor-location">
                  <span className="field-label">City or neighbourhood</span>
                  <input
                    ref={locationRef}
                    id="donor-location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Try Bengaluru, Mumbai, Hyderabad, or leave blank"
                  />
                </label>

                <button className="button button-primary search-button" type="submit">
                  <SearchIcon /> <span>Update results</span>
                </button>
              </form>

              <div className="search-filter-bar">
                <label className="toggle-pill">
                  <input
                    type="checkbox"
                    checked={includeCompatible}
                    onChange={(e) => setIncludeCompatible(e.target.checked)}
                    disabled={bloodGroup === "all"}
                  />
                  <span>
                    Include compatible red-cell donors
                    {bloodGroup !== "all"
                      ? ` (${COMPATIBILITY_MAP[bloodGroup].receiveRedCellsFrom.join(", ")})`
                      : ""}
                  </span>
                </label>

                <label className="toggle-pill">
                  <input
                    type="checkbox"
                    checked={readyOnly}
                    onChange={(e) => setReadyOnly(e.target.checked)}
                  />
                  <span>Ready this week only</span>
                </label>
              </div>

              <div className="search-results" aria-live="polite">
                <div className="results-heading">
                  <div>
                    <p className="results-label">ILLUSTRATIVE DONOR MATCHES</p>
                    <h3>
                      {matches.length} {matches.length === 1 ? "matching donor profile" : "matching donor profiles"}
                    </h3>
                  </div>
                  <p className="results-disclaimer">Sample profiles only — no real personal data is stored.</p>
                </div>

                {matches.length > 0 ? (
                  <div className="donor-list">
                    {matches.map((profile) => {
                      const isDirect = bloodGroup === "all" || profile.group === bloodGroup;
                      return (
                        <button
                          type="button"
                          className="donor-row donor-row-interactive"
                          key={profile.id}
                          onClick={() => setActiveDonor(profile)}
                        >
                          <span className="donor-group">{profile.group}</span>
                          <div className="donor-location">
                            <strong>{profile.location}</strong>
                            <span>
                              {profile.id} · {profile.donationsLogged} illustrative donations · {profile.responseWindow}
                            </span>
                          </div>
                          <span className={`match-type-badge ${isDirect ? "is-direct" : "is-compatible"}`}>
                            {bloodGroup === "all"
                              ? "Sample profile"
                              : isDirect
                                ? "Exact match"
                                : `Compatible for ${bloodGroup}`}
                          </span>
                          <span className="donor-availability">
                            <span
                              className={`availability-dot ${profile.availability === "Ready this week" ? "is-ready" : ""}`}
                            />
                            {profile.availability}
                          </span>
                          <ArrowIcon diagonal />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-results-wrap">
                    <p className="empty-results">
                      No sample profiles match those filters. Try enabling compatible donors or clearing the city field.
                    </p>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setBloodGroup("all");
                        setLocation("");
                        setReadyOnly(false);
                      }}
                    >
                      Reset filters <ArrowIcon />
                    </button>
                  </div>
                )}
              </div>

              {/* Compatibility Matrix Explorer */}
              <div className="compat-drawer">
                <div className="compat-header">
                  <div>
                    <span className="compat-eyebrow">ABO / RH COMPATIBILITY REFERENCE</span>
                    <p>Click any blood group to inspect red-cell donation and receiving pathways</p>
                  </div>
                  <div className="compat-pills" role="group" aria-label="Blood group compatibility selector">
                    {BLOOD_GROUPS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`compat-pill ${compatGroup === g ? "is-active" : ""}`}
                        onClick={() => setCompatGroup(g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="compat-grid">
                  <div className="compat-box">
                    <span>CAN DONATE RED CELLS TO</span>
                    <div className="compat-badges">
                      {activeCompatibility.donateRedCellsTo.map((g) => (
                        <strong key={g}>{g}</strong>
                      ))}
                    </div>
                  </div>
                  <div className="compat-box">
                    <span>CAN RECEIVE RED CELLS FROM</span>
                    <div className="compat-badges">
                      {activeCompatibility.receiveRedCellsFrom.map((g) => (
                        <strong key={g}>{g}</strong>
                      ))}
                    </div>
                  </div>
                  <div className="compat-note-box">
                    <p>{activeCompatibility.note}</p>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => applyCompatibilityToSearch(compatGroup)}
                    >
                      Search compatible donors for {compatGroup} <ArrowIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="prototype-note">
              <span>i</span> BloodLink is a concept prototype. It does not connect to live donor registries or emergency medical dispatch.
            </p>
          </div>
        </section>

        {/* SECTION 03: HOSPITAL-VERIFIED URGENT BLOOD REQUESTS */}
        <section className="requests-section section-pad" id="requests">
          <div className="page-width requests-layout">
            <div className="requests-intro">
              <p className="eyebrow section-eyebrow">
                <span>03</span> VERIFIED REQUEST COORDINATION
              </p>
              <h2>
                When time matters,<br />
                <span>verification builds trust.</span>
              </h2>
              <p className="section-description">
                Eliminate unverified social forwards. Hospitals post structured requests showing blood group, component needed, clinical urgency, and one-click compatible donor matching.
              </p>
              <div className="requests-cta-group">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setCreateRequestOpen(true)}
                >
                  Raise a demo request <ArrowIcon diagonal />
                </button>
                <a className="text-link text-link-light" href="#network">
                  Inspect verified blood banks <ArrowIcon />
                </a>
              </div>
              <p className="request-demo-note">
                Demonstration records only. Raising a request previews the hospital intake workflow locally without contacting real medical facilities.
              </p>
            </div>

            <div className="request-feed">
              <div className="feed-heading">
                <div className="feed-filters" role="group" aria-label="Filter by priority">
                  {(["all", "Urgent", "Priority"] as const).map((filterVal) => (
                    <button
                      key={filterVal}
                      type="button"
                      className={`feed-filter-btn ${requestFilter === filterVal ? "is-active" : ""}`}
                      onClick={() => setRequestFilter(filterVal)}
                    >
                      {filterVal === "all" ? "All Priorities" : filterVal}
                    </button>
                  ))}
                </div>
                <div className="feed-filters" role="group" aria-label="Filter by clinical scenario">
                  {(["all", "Emergency Trauma", "Planned Surgery", "Critical Care"] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      className={`feed-filter-btn ${scenarioFilter === sc ? "is-active" : ""}`}
                      onClick={() => setScenarioFilter(sc)}
                    >
                      {sc === "all" ? "All Scenarios" : sc}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRequests.length > 0 ? (
                filteredRequests.map((request, index) => (
                  <button
                    className="request-row"
                    type="button"
                    key={request.id}
                    onClick={() => setActiveRequest(request)}
                  >
                    <span className="request-sequence">0{index + 1}</span>
                    <span className="request-group">{request.group}</span>
                    <span className="request-main">
                      <strong>{request.hospital}</strong>
                      <span>
                        {request.city} <i /> {request.units} <i /> {request.componentNeeded} <i /> {request.scenario}
                      </span>
                    </span>
                    <span className={`request-status ${request.priority === "Urgent" ? "is-urgent" : ""}`}>
                      <span className="verified-check">&#10003;</span> {request.priority} · Verified demo
                    </span>
                    <span className="request-arrow">
                      <ArrowIcon />
                    </span>
                  </button>
                ))
              ) : (
                <p className="empty-directory">No demo requests match those filters.</p>
              )}

              <button className="all-requests-link" type="button" onClick={scrollToFinder}>
                Jump to compatibility donor search <ArrowIcon />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 04: AUTHORISED BLOOD BANK NETWORK + 3D TOPOLOGY */}
        <section className="network-section section-pad" id="network">
          <div className="page-width">
            <div className="section-intro network-intro">
              <div>
                <p className="eyebrow section-eyebrow">
                  <span>04</span> AUTHORISED BLOOD BANK NETWORK
                </p>
                <h2>
                  Locate verified hubs<br />
                  <span>by real capability.</span>
                </h2>
              </div>
              <div className="network-intro-aside">
                <p className="section-description">
                  Inspect authorised blood banks and partner hospitals by component services (platelets, plasma, 24/7 cross-matching) on an interactive 3D spatial topology.
                </p>
                <p className="directory-note">
                  Illustrative directory entries — verify live hours and inventory directly with your local blood centre.
                </p>
              </div>
            </div>

            <div className="network-split">
              <div className="network-spatial-column">
                <NetworkTopology3D
                  partners={BLOOD_BANKS}
                  selectedPartnerId={selectedPartner.id}
                  onSelectPartner={handleSelectPartner}
                />
                <div className="selected-partner-card">
                  <div className="selected-partner-head">
                    <span className={selectedPartner.type === "Hospital partner" ? "is-hospital" : "is-bank"}>
                      {selectedPartner.type.toUpperCase()}
                    </span>
                    <strong>{selectedPartner.city}</strong>
                  </div>
                  <h3>{selectedPartner.name}</h3>
                  <p className="selected-partner-address">{selectedPartner.address}</p>
                  <p className="selected-partner-hours">{selectedPartner.hours}</p>
                  <div className="selected-partner-services">
                    {selectedPartner.services.map((srv) => (
                      <span key={srv}>{srv}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="network-directory-column">
                <div className="directory-toolbar">
                  <div className="directory-filter-tabs" role="group" aria-label="Filter partner types">
                    {(["all", "Blood bank", "Hospital partner"] as const).map((typeVal) => (
                      <button
                        key={typeVal}
                        type="button"
                        className={`dir-tab ${partnerTypeFilter === typeVal ? "is-active" : ""}`}
                        onClick={() => setPartnerTypeFilter(typeVal)}
                      >
                        {typeVal === "all" ? "All partners" : typeVal === "Blood bank" ? "Blood banks" : "Hospitals"}
                      </button>
                    ))}
                  </div>
                  <label className="directory-search" htmlFor="directory-search">
                    <SearchIcon />
                    <input
                      id="directory-search"
                      type="search"
                      value={directoryQuery}
                      onChange={(event) => setDirectoryQuery(event.target.value)}
                      placeholder="Search city, centre, or platelets..."
                    />
                  </label>
                </div>

                <div className="bank-list" aria-live="polite">
                  {filteredBanks.length > 0 ? (
                    filteredBanks.map((bank, index) => (
                      <button
                        type="button"
                        className={`bank-row bank-row-btn ${selectedPartner.id === bank.id ? "is-selected" : ""}`}
                        key={bank.id}
                        onClick={() => setSelectedPartnerId(bank.id)}
                      >
                        <span className="bank-index">0{index + 1}</span>
                        <div className="bank-name">
                          <h3>{bank.name}</h3>
                          <p>
                            {bank.type} <span>·</span> {bank.services[0]} &amp; {bank.services[1]}
                          </p>
                        </div>
                        <span className="bank-area">{bank.city}</span>
                        <span className="bank-arrow">
                          <ArrowIcon diagonal />
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="empty-directory">
                      No example partners match that search. Try searching a city (e.g., Bengaluru) or service (e.g., platelets).
                    </p>
                  )}
                </div>
                <div className="network-footnote">
                  <span>04</span> Illustrative partner network — click any row or 3D beacon to inspect services.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 05: DONATION AWARENESS, MYTHS & READINESS */}
        <section className="learn-section section-pad" id="learn">
          <div className="page-width learn-layout">
            <div className="learn-intro">
              <p className="eyebrow section-eyebrow">
                <span>05</span> DONATION AWARENESS
              </p>
              <h2>
                Clarity removes<br />
                <span>hesitation.</span>
              </h2>
              <p className="section-description">
                Explore eligibility guidelines, dispel common misconceptions, and walk through a quick non-medical readiness check before booking an appointment.
              </p>
              <div className="learn-tabs" role="tablist" aria-label="Awareness topics">
                <button
                  type="button"
                  role="tab"
                  aria-selected={awarenessTab === "guide"}
                  className={`learn-tab ${awarenessTab === "guide" ? "is-active" : ""}`}
                  onClick={() => setAwarenessTab("guide")}
                >
                  Donation Guide (04)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={awarenessTab === "myths"}
                  className={`learn-tab ${awarenessTab === "myths" ? "is-active" : ""}`}
                  onClick={() => setAwarenessTab("myths")}
                >
                  Myths vs. Facts (03)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={awarenessTab === "readiness"}
                  className={`learn-tab ${awarenessTab === "readiness" ? "is-active" : ""}`}
                  onClick={() => setAwarenessTab("readiness")}
                >
                  Readiness Check (04)
                </button>
              </div>
              <span className="learn-footnote">
                General educational guidance only. A qualified clinician at your blood bank performs official eligibility screening.
              </span>
            </div>

            {awarenessTab === "guide" ? (
              <div className="guide-list">
                {DONATION_GUIDES.map((guide, index) => (
                  <div className={`guide-item ${openGuide === index ? "is-open" : ""}`} key={guide.title}>
                    <button
                      className="guide-trigger"
                      type="button"
                      aria-expanded={openGuide === index}
                      aria-controls={`guide-detail-${index}`}
                      onClick={() => setOpenGuide(openGuide === index ? -1 : index)}
                    >
                      <span className="guide-number">0{index + 1}</span>
                      <span className="guide-title">{guide.title}</span>
                      <span className="guide-toggle" aria-hidden="true">
                        {openGuide === index ? "−" : "+"}
                      </span>
                    </button>
                    {openGuide === index && (
                      <p className="guide-detail" id={`guide-detail-${index}`}>
                        {guide.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : awarenessTab === "myths" ? (
              <div className="myths-list">
                {MYTHS_AND_FACTS.map((item, idx) => (
                  <article className="myth-card" key={item.myth}>
                    <div className="myth-badge">MYTH 0{idx + 1}</div>
                    <h3>{item.myth}</h3>
                    <p className="myth-fact">
                      <strong>Medical Fact:</strong> {item.fact}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="readiness-list">
                {READINESS_CHECKS.map((item) => {
                  const isChecked = Boolean(checkedReadiness[item.id]);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`readiness-card ${isChecked ? "is-checked" : ""}`}
                      onClick={() => toggleReadiness(item.id)}
                      aria-pressed={isChecked}
                    >
                      <span className="readiness-box" aria-hidden="true">
                        {isChecked ? "✓" : ""}
                      </span>
                      <div className="readiness-copy">
                        <h3>{item.question}</h3>
                        <p>{item.tip}</p>
                      </div>
                    </button>
                  );
                })}
                <div className="readiness-summary" aria-live="polite">
                  <strong>
                    {checkedReadinessCount} / {READINESS_CHECKS.length} preparation steps checked
                  </strong>
                  <span>
                    {checkedReadinessCount === READINESS_CHECKS.length
                      ? "You look prepared for an on-site check-in! Authorised blood centre staff will confirm full medical eligibility before donation."
                      : "Review these four preparation habits before visiting an authorised blood bank."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 06: OUR IMPACT — LIVE 3D COMPONENT SEPARATION */}
        <section className="impact-section section-pad" id="impact">
          <div className="impact-backglow" aria-hidden="true" />
          <div className="page-width impact-layout">
            <div className="impact-copy">
              <p className="eyebrow impact-eyebrow">
                <span>06</span> OUR IMPACT · 3D COMPONENT VISUALIZER
              </p>
              <h2>
                One voluntary gift.<br />
                <span>Three distinct therapies.</span>
              </h2>
              <p className="impact-description">
                Modern blood banking separates a single whole-blood unit into targeted components. Orbit the 3D visualization or choose a component below to see how one donation supports multiple patient pathways.
              </p>

              <div className="component-selector" role="tablist" aria-label="Blood components">
                {COMPONENT_STORIES.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedComponentId === comp.id}
                    className={`component-chip ${selectedComponentId === comp.id ? "is-active" : ""}`}
                    onClick={() => setSelectedComponentId(comp.id)}
                  >
                    <span className="chip-dot" style={{ background: comp.color }} />
                    {comp.title}
                  </button>
                ))}
              </div>

              <div className="component-story-card" aria-live="polite">
                <div className="component-story-top">
                  <span>{selectedComponent.subtitle}</span>
                  <span>{selectedComponent.shelfLife}</span>
                </div>
                <h3>{selectedComponent.title}</h3>
                <p>{selectedComponent.description}</p>
                <div className="component-usecase">
                  <strong>Clinical focus:</strong> {selectedComponent.useCase}
                </div>
              </div>

              <div className="impact-simulator">
                <div className="sim-header">
                  <label htmlFor="impact-slider">
                    COMMUNITY SIMULATOR: <strong>{donationCount}</strong>{" "}
                    {donationCount === 1 ? "voluntary donation" : "voluntary donations"}
                  </label>
                  <span>Up to ~{donationCount * 3} potential care pathways</span>
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

              <p className="impact-caveat">
                Depending on component preparation and clinical use, one voluntary donation may help support up to three patients.
              </p>
              <button className="text-link text-link-light impact-link" type="button" onClick={openRegistration}>
                Become part of the network <ArrowIcon />
              </button>
            </div>

            <div className="impact-3d-column">
              <ImpactOrbit3D
                selectedId={selectedComponentId}
                donationCount={donationCount}
                onSelectComponent={handleSelectComponent}
              />
            </div>
          </div>
        </section>

        {/* SECTION 07: TAKE ACTION */}
        <section className="join-section" id="join">
          <div className="page-width join-layout">
            <div>
              <p className="eyebrow join-eyebrow">
                <span className="live-dot" /> TAKE ACTION TODAY
              </p>
              <h2>
                Be the link<br />
                someone counts on.
              </h2>
            </div>
            <div className="join-action">
              <p>
                Preview how effortless voluntary donor onboarding can be — generate a digital BloodLink Concept Donor Pass in under 20 seconds.
              </p>
              <button className="button button-primary" type="button" onClick={openRegistration}>
                Start your donor profile <ArrowIcon diagonal />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-main">
          <a className="brand footer-brand" href="#top">
            <BrandMark />
            <span>
              Blood<span className="brand-accent">Link</span>
            </span>
          </a>
          <p>Every drop connects a life.</p>
          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#problem">Solutions & Film</a>
            <a href="#discover">Find Donor</a>
            <a href="#requests">Requests</a>
            <a href="#network">Blood Banks</a>
            <button type="button" className="footer-brief-btn" onClick={() => setBriefOpen(true)}>
              Challenge Brief
            </button>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub Repo
            </a>
          </nav>
        </div>
        <div className="page-width footer-bottom">
          <span>CONCEPT PROTOTYPE · NO REAL MEDICAL OR DONOR DATA STORED</span>
          <span>AI PROMPT BATTLE 2.0 · LIVE 3D &amp; MOTION PROTOTYPE</span>
          <a href="#top">
            Back to top <ArrowIcon diagonal />
          </a>
        </div>
      </footer>

      {/* MODALS */}
      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAllModals();
          }}
        >
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" type="button" aria-label="Close dialog" onClick={closeAllModals}>
              <CloseIcon />
            </button>

            {registerOpen ? (
              registrationComplete && demoPass ? (
                <div className="modal-success">
                  <span className="success-mark">&#10003;</span>
                  <p className="eyebrow section-eyebrow">CONCEPT DONOR PASS READY</p>
                  <h2 id="modal-title">Thank you for stepping up, {demoPass.name}.</h2>
                  <p>
                    This interactive pass demonstrates voluntary onboarding. Nothing has been saved, transmitted, or shared with an external service.
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
                  <button className="button button-primary" type="button" onClick={closeAllModals}>
                    Return to BloodLink <ArrowIcon />
                  </button>
                </div>
              ) : (
                <>
                  <p className="eyebrow section-eyebrow">
                    <span>VOLUNTARY PLEDGE</span> BECOME A DONOR
                  </p>
                  <h2 id="modal-title">Create your demo donor pass.</h2>
                  <p className="modal-intro">
                    Experience how voluntary donor registration works without sharing sensitive medical records.
                  </p>
                  <form className="registration-form" onSubmit={handleRegistration}>
                    <label htmlFor="donor-name">Display name (demo)</label>
                    <input
                      id="donor-name"
                      name="name"
                      type="text"
                      placeholder="e.g. Aarav Nair"
                      autoComplete="off"
                      required
                    />
                    <div className="registration-fields">
                      <label htmlFor="registration-group">
                        Blood group
                        <select id="registration-group" name="group" defaultValue="" required>
                          <option value="" disabled>
                            Select group
                          </option>
                          {BLOOD_GROUPS.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label htmlFor="registration-city">
                        City
                        <input
                          id="registration-city"
                          name="city"
                          type="text"
                          placeholder="e.g. Bengaluru"
                          autoComplete="off"
                          required
                        />
                      </label>
                    </div>
                    <p className="form-privacy-note">
                      Prototype preview only — no personal or health data leaves your browser.
                    </p>
                    <button className="button button-primary modal-submit" type="submit">
                      Generate concept donor pass <ArrowIcon />
                    </button>
                  </form>
                </>
              )
            ) : createRequestOpen ? (
              <>
                <p className="eyebrow section-eyebrow">
                  <span>HOSPITAL INTAKE SIMULATOR</span> DEMO WORKFLOW
                </p>
                <h2 id="modal-title">Raise a verified demo request.</h2>
                <p className="modal-intro">
                  Test how a hospital blood desk logs a structured request so compatible voluntary donors can be matched immediately.
                </p>
                <form className="registration-form" onSubmit={handleCreateDemoRequest}>
                  <label htmlFor="req-hospital">Hospital or medical centre</label>
                  <input
                    id="req-hospital"
                    name="reqHospital"
                    type="text"
                    placeholder="e.g. Apollo Clinical Centre"
                    required
                  />
                  <div className="registration-fields">
                    <label htmlFor="req-group">
                      Blood group needed
                      <select id="req-group" name="reqGroup" defaultValue="O-" required>
                        {BLOOD_GROUPS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label htmlFor="req-units">
                      Units required
                      <input id="req-units" name="reqUnits" type="text" defaultValue="2 units" required />
                    </label>
                  </div>
                  <div className="registration-fields">
                    <label htmlFor="req-city">
                      City
                      <input id="req-city" name="reqCity" type="text" placeholder="e.g. Bengaluru" required />
                    </label>
                    <label htmlFor="req-scenario">
                      Clinical scenario
                      <select id="req-scenario" name="reqScenario" defaultValue="Emergency Trauma">
                        <option value="Emergency Trauma">Emergency Trauma</option>
                        <option value="Planned Surgery">Planned Surgery</option>
                        <option value="Critical Care">Critical Care</option>
                      </select>
                    </label>
                  </div>
                  <p className="form-privacy-note">
                    Session demonstration only — adds an illustrative request locally to the board.
                  </p>
                  <button className="button button-primary modal-submit" type="submit">
                    Post demo request to board <ArrowIcon />
                  </button>
                </form>
              </>
            ) : activeRequest ? (
              <>
                <p className="eyebrow section-eyebrow">
                  <span>HOSPITAL-VERIFIED DEMO</span> {activeRequest.scenario.toUpperCase()}
                </p>
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
                <p className="form-privacy-note">
                  Illustrative demonstration record — not an active medical alert.
                </p>
                <button
                  className="button button-primary modal-submit"
                  type="button"
                  onClick={() => exploreRequest(activeRequest)}
                >
                  Auto-match compatible donors <ArrowIcon />
                </button>
              </>
            ) : activeDonor ? (
              <>
                <p className="eyebrow section-eyebrow">
                  <span>PRIVACY-SHIELDED PROFILE</span> DEMO DONOR {activeDonor.id}
                </p>
                <div className="request-modal-group">{activeDonor.group}</div>
                <h2 id="modal-title">{activeDonor.location}</h2>
                <p className="modal-intro">
                  Personal phone numbers stay protected — BloodLink demonstrates relay notifications coordinated exclusively through an authorised blood bank.
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
                <p className="form-privacy-note">
                  Illustrative sample profile — no live messaging or donor contact exists.
                </p>
                <button
                  className="button button-primary modal-submit"
                  type="button"
                  onClick={() => {
                    setActiveDonor(null);
                    openRegistration();
                  }}
                >
                  Create your own demo profile <ArrowIcon />
                </button>
              </>
            ) : briefOpen ? (
              <>
                <p className="eyebrow section-eyebrow">
                  <span>AI PROMPT BATTLE 2.0</span> PROBLEM &amp; SOLUTION ARCHITECTURE
                </p>
                <h2 id="modal-title">BloodLink — Every Drop Connects a Life</h2>
                <p className="modal-intro">
                  Designed and engineered with live Three.js WebGL scenes, a 60fps procedural motion film, and four targeted workflows solving the core blood-discovery bottlenecks.
                </p>
                <div className="request-detail-list">
                  <div>
                    <span>01 Donor matching</span>
                    <strong>ABO/Rh compatibility-aware search + shielded relay</strong>
                  </div>
                  <div>
                    <span>02 Bank discovery</span>
                    <strong>Interactive 3D spatial topology + service tags</strong>
                  </div>
                  <div>
                    <span>03 Request coordination</span>
                    <strong>Hospital-verified intake + 1-click auto-match</strong>
                  </div>
                  <div>
                    <span>04 Awareness &amp; impact</span>
                    <strong>Guide, myths, readiness check &amp; 3D component orbit</strong>
                  </div>
                </div>
                <div className="brief-actions">
                  <a
                    className="button button-primary"
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open GitHub Repo <ArrowIcon diagonal />
                  </a>
                  <button className="button button-secondary-dark" type="button" onClick={copyRepoUrl}>
                    {repoCopied ? "Copied URL!" : "Copy Repo URL"}
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </>
  );
}

export default App;
