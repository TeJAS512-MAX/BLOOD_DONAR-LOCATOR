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
  MYTHS_AND_FACTS,
  PROBLEM_PILLARS,
  READINESS_CHECKS,
  URGENT_REQUESTS,
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

  // Donor discovery & compatibility explorer
  const [bloodGroup, setBloodGroup] = useState<"all" | BloodGroup>("all");
  const [location, setLocation] = useState("Brooklyn");
  const [searchComplete, setSearchComplete] = useState(true);
  const [compatGroup, setCompatGroup] = useState<BloodGroup>("O-");
  const [activeDonor, setActiveDonor] = useState<DonorProfile | null>(null);

  // Urgent requests
  const [requestFilter, setRequestFilter] = useState<"all" | "Urgent request" | "Priority request">("all");
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);

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

  const modalOpen = registerOpen || briefOpen || activeRequest !== null || activeDonor !== null;

  const matches = useMemo(() => {
    const query = location.trim().toLowerCase();
    return DONOR_PROFILES.filter((profile) => {
      const groupMatches = bloodGroup === "all" || profile.group === bloodGroup;
      const locationMatches =
        !query ||
        profile.location.toLowerCase().includes(query) ||
        profile.city.toLowerCase().includes(query);
      return groupMatches && locationMatches;
    });
  }, [bloodGroup, location]);

  const filteredRequests = useMemo(() => {
    if (requestFilter === "all") return URGENT_REQUESTS;
    return URGENT_REQUESTS.filter((req) => req.priority === requestFilter);
  }, [requestFilter]);

  const filteredBanks = useMemo(() => {
    const query = directoryQuery.trim().toLowerCase();
    return BLOOD_BANKS.filter((bank) => {
      const matchesType = partnerTypeFilter === "all" || bank.type === partnerTypeFilter;
      const matchesQuery =
        !query || `${bank.name} ${bank.type} ${bank.area} ${bank.address}`.toLowerCase().includes(query);
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
    navigator.clipboard?.writeText(GITHUB_REPO_URL).then(() => {
      setRepoCopied(true);
      window.setTimeout(() => setRepoCopied(false), 2200);
    }).catch(() => {});
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
    setSearchComplete(true);
  };

  const handleRegistration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "Volunteer").trim();
    const group = String(formData.get("group") || "O+");
    const city = String(formData.get("city") || "Local Area").trim();
    const randomNum = Math.floor(500 + Math.random() * 480);
    setDemoPass({ name, group, city, id: `BL-DEMO-${randomNum}` });
    setRegistrationComplete(true);
  };

  const openRegistration = () => {
    setMenuOpen(false);
    setRegistrationComplete(false);
    setRegisterOpen(true);
  };

  const exploreRequest = (request: BloodRequest) => {
    setActiveRequest(null);
    setBloodGroup(request.group);
    setLocation(request.area);
    setSearchComplete(true);
    window.setTimeout(scrollToFinder, 120);
  };

  const applyCompatibilityToSearch = (group: BloodGroup) => {
    setBloodGroup(group);
    setLocation("");
    setSearchComplete(true);
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
                <a href="#problem" onClick={() => setMenuOpen(false)}>Problem & Film</a>
                <a href="#discover" onClick={() => setMenuOpen(false)}>Find a donor</a>
                <a href="#requests" onClick={() => setMenuOpen(false)}>Urgent needs</a>
                <a href="#network" onClick={() => setMenuOpen(false)}>Our network</a>
                <a href="#learn" onClick={() => setMenuOpen(false)}>Donation guide</a>
              </nav>
              <button className="header-cta" type="button" onClick={openRegistration}>
                Become a donor <ArrowIcon diagonal />
              </button>
            </div>
          </header>

          <div className="hero-content-shell page-width">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow">
                <span className="live-dot" /> REAL-TIME 3D BLOODSTREAM NETWORK · CONCEPT PROTOTYPE
              </p>
              <h1>
                Blood<span>Link</span>
              </h1>
              <p className="hero-tagline">Every drop connects a life.</p>
              <p className="hero-description">
                Bringing voluntary blood donors, hospitals and authorised blood banks closer together — so help is easier to find when emergencies, surgeries and critical care cannot wait.
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
              <a className="hero-scroll" href="#problem">
                <span className="scroll-line" />
                <span>Scroll to explore</span>
                <span className="scroll-index">01</span>
              </a>
            </div>
          </div>

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
                {heroFreeExplore ? "Exit 3D Mode" : "Full 3D View"}
              </button>
            </div>
          </div>
        </section>

        {/* KINETIC MOTION TICKER */}
        <div className="kinetic-ticker" aria-hidden="true">
          <div className="ticker-track">
            <span>EVERY DROP CONNECTS A LIFE</span>
            <i />
            <span>LIVE 3D BLOODSTREAM WEBGL</span>
            <i />
            <span>60FPS MOTION GRAPHICS REEL</span>
            <i />
            <span>DONORS · HOSPITALS · AUTHORISED BLOOD BANKS</span>
            <i />
            <span>AI PROMPT BATTLE 2.0 CONCEPT PROTOTYPE</span>
            <i />
            <span>EVERY DROP CONNECTS A LIFE</span>
            <i />
            <span>LIVE 3D BLOODSTREAM WEBGL</span>
            <i />
            <span>60FPS MOTION GRAPHICS REEL</span>
            <i />
            <span>DONORS · HOSPITALS · AUTHORISED BLOOD BANKS</span>
            <i />
          </div>
        </div>

        {/* SECTION 01: PROBLEM STATEMENT & MOTION VIDEO GRAPHICS */}
        <section className="problem-section section-pad" id="problem">
          <div className="page-width">
            <div className="section-intro problem-header">
              <div>
                <p className="eyebrow section-eyebrow problem-eyebrow">
                  <span>01</span> THE PROBLEM STATEMENT & SOLUTION FILM
                </p>
                <h2>
                  Why BloodLink matters.<br />
                  <span>Turning crisis into connection.</span>
                </h2>
              </div>
              <p className="section-description problem-lead">
                During medical emergencies, surgeries, and critical treatments, finding suitable blood donors can be difficult. People often struggle to identify available donors, locate verified blood banks, and coordinate donation requests quickly.
              </p>
            </div>

            <div className="problem-grid">
              <div className="problem-pillars">
                <div className="problem-mission-box">
                  <span className="mono-tag">OUR MISSION</span>
                  <p>
                    BloodLink envisions one calm, transparent digital bridge uniting voluntary donors, hospitals, and authorised blood banks — turning fragmented searches into guided, life-saving action.
                  </p>
                </div>

                <div className="pillar-list">
                  {PROBLEM_PILLARS.map((pillar, idx) => {
                    const isSynced = activeFilmChapter === idx;
                    return (
                      <button
                        key={pillar.index}
                        type="button"
                        className={`pillar-card ${isSynced ? "is-active" : ""}`}
                        onClick={() => setRequestedFilmChapter(idx)}
                      >
                        <div className="pillar-top">
                          <span className="pillar-num">{pillar.index}</span>
                          <span className="pillar-metric">{pillar.metric}</span>
                        </div>
                        <h3>{pillar.title}</h3>
                        <p>{pillar.description}</p>
                        <span className="pillar-jump">Preview in motion film →</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="problem-film-column">
                <MotionVideoReel
                  externalChapterRequest={requestedFilmChapter}
                  onChapterChange={setActiveFilmChapter}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 02: FIND A DONOR & COMPATIBILITY MATRIX */}
        <section className="finder-section section-pad" id="discover" ref={finderRef}>
          <div className="page-width">
            <div className="section-intro">
              <div>
                <p className="eyebrow section-eyebrow">
                  <span>02</span> FIND A DONOR
                </p>
                <h2>
                  Start with a blood group.<br />
                  <span>Find your next step.</span>
                </h2>
              </div>
              <p className="section-description">
                Explore how local donor discovery could work. Filter illustrative donor profiles by blood group and area, or inspect red-cell compatibility across all eight groups.
              </p>
            </div>

            <div className="finder-console">
              <div className="console-topline">
                <div>
                  <span className="console-pulse" />
                  <span>DONOR DISCOVERY CONSOLE</span>
                </div>
                <span className="console-demo">PROTOTYPE PREVIEW · SAMPLE DATA</span>
              </div>
              <form className="search-form" onSubmit={handleSearch}>
                <label className="field-group" htmlFor="blood-group">
                  <span className="field-label">Blood group</span>
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
                  <span className="field-label">Near a city or neighbourhood</span>
                  <input
                    ref={locationRef}
                    id="donor-location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Try Brooklyn, Queens, Manhattan, or leave blank"
                  />
                </label>
                <button className="button button-red search-button" type="submit">
                  <SearchIcon /> <span>Explore matches</span>
                </button>
              </form>

              {searchComplete && (
                <div className="search-results" aria-live="polite">
                  <div className="results-heading">
                    <div>
                      <p className="results-label">ILLUSTRATIVE MATCHES</p>
                      <h3>
                        {matches.length} {matches.length === 1 ? "potential connection" : "potential connections"}
                      </h3>
                    </div>
                    <p className="results-disclaimer">Sample profiles only. No live donor availability.</p>
                  </div>
                  {matches.length > 0 ? (
                    <div className="donor-list">
                      {matches.slice(0, 5).map((profile) => (
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
                              Example profile {profile.id} · {profile.donationsLogged} demo donations
                            </span>
                          </div>
                          <span className="donor-availability">
                            <span className="availability-dot" />
                            {profile.availability}
                          </span>
                          <ArrowIcon diagonal />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-results-wrap">
                      <p className="empty-results">
                        No sample profiles match those details. Try clearing the area field or selecting another blood group.
                      </p>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => {
                          setBloodGroup("all");
                          setLocation("");
                        }}
                      >
                        Show all sample profiles <ArrowIcon />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Compatibility Matrix Bar */}
              <div className="compat-drawer">
                <div className="compat-header">
                  <div>
                    <span className="compat-eyebrow">COMPATIBILITY EXPLORER</span>
                    <p>Select a group to understand red-cell donation & receiving pathways</p>
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
                      Filter {compatGroup} sample donors <ArrowIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="prototype-note">
              <span>i</span> BloodLink is a concept prototype. It does not connect to real donors, hospitals or emergency services.
            </p>
          </div>
        </section>

        {/* SECTION 03: URGENT BLOOD REQUESTS */}
        <section className="requests-section section-pad" id="requests">
          <div className="page-width requests-layout">
            <div className="requests-intro">
              <p className="eyebrow section-eyebrow">
                <span>03</span> URGENT REQUESTS
              </p>
              <h2>
                When time matters,<br />
                <span>clarity matters.</span>
              </h2>
              <p className="section-description">
                A clear, hospital-verified request format gives willing donors an immediate understanding of the blood group, component needed, and next safe step.
              </p>
              <a className="text-link text-link-light" href="#network">
                Explore the partner network <ArrowIcon />
              </a>
              <p className="request-demo-note">
                Demonstration records only. The verification label previews a hospital review workflow; no real medical requests are shown.
              </p>
            </div>
            <div className="request-feed">
              <div className="feed-heading">
                <span>REQUESTS NEAR THE NETWORK</span>
                <div className="feed-filters" role="group" aria-label="Filter demo requests">
                  {(["all", "Urgent request", "Priority request"] as const).map((filterVal) => (
                    <button
                      key={filterVal}
                      type="button"
                      className={`feed-filter-btn ${requestFilter === filterVal ? "is-active" : ""}`}
                      onClick={() => setRequestFilter(filterVal)}
                    >
                      {filterVal === "all" ? "All" : filterVal === "Urgent request" ? "Urgent" : "Priority"}
                    </button>
                  ))}
                </div>
              </div>
              {filteredRequests.map((request, index) => (
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
                      {request.city} <i /> {request.units} <i /> {request.need}
                    </span>
                  </span>
                  <span className="request-status">
                    <span className="verified-check">&#10003;</span> Verified demo
                  </span>
                  <span className="request-arrow">
                    <ArrowIcon />
                  </span>
                </button>
              ))}
              <button className="all-requests-link" type="button" onClick={scrollToFinder}>
                Explore a matching donor <ArrowIcon />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 04: BLOOD BANK NETWORK & LIVE 3D SPATIAL TOPOLOGY */}
        <section className="network-section section-pad" id="network">
          <div className="page-width">
            <div className="section-intro network-intro">
              <div>
                <p className="eyebrow section-eyebrow">
                  <span>04</span> THE BLOODLINK NETWORK
                </p>
                <h2>
                  Care is closer<br />
                  <span>when we connect.</span>
                </h2>
              </div>
              <div className="network-intro-aside">
                <p className="section-description">
                  Explore authorised blood banks and hospital partner hubs through both a searchable directory and a live 3D spatial topology.
                </p>
                <p className="directory-note">
                  Illustrative prototype listings only. Please contact local health authorities or providers directly for real services.
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
                    <span>{selectedPartner.type.toUpperCase()}</span>
                    <strong>{selectedPartner.area}</strong>
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
                      placeholder="Search by name or area"
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
                            {bank.type} <span>/</span> {bank.address}
                          </p>
                        </div>
                        <span className="bank-area">{bank.area}</span>
                        <span className="bank-arrow">
                          <ArrowIcon diagonal />
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="empty-directory">
                      No example partners match that search. Try a different name or borough.
                    </p>
                  )}
                </div>
                <div className="network-footnote">
                  <span>05</span> Example network listings — not a live or verified service directory.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 05: DONATION AWARENESS & MYTHS VS FACTS */}
        <section className="learn-section section-pad" id="learn">
          <div className="page-width learn-layout">
            <div className="learn-intro">
              <p className="eyebrow section-eyebrow">
                <span>05</span> DONATION, DEMYSTIFIED
              </p>
              <h2>
                Know before<br />
                <span>you give.</span>
              </h2>
              <p className="section-description">
                Clear guidance helps first-time and returning donors feel informed, confident, and supported at every stage.
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
                General educational overview only. Always follow the clinical guidance of your local donation team.
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
                        {openGuide === index ? "-" : "+"}
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
                      <strong>Fact:</strong> {item.fact}
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
                      ? "Great preparation! A qualified donation clinician will still confirm full medical eligibility on-site."
                      : "Check off items above as an educational reminder before visiting an authorised donation centre."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 06: OUR IMPACT — INTERACTIVE 3D COMPONENT SEPARATION */}
        <section className="impact-section section-pad" id="impact">
          <div className="impact-backglow" aria-hidden="true" />
          <div className="page-width impact-layout">
            <div className="impact-copy">
              <p className="eyebrow impact-eyebrow">
                <span>06</span> ONE DONATION, MANY POSSIBILITIES
              </p>
              <h2>
                One gift.<br />
                <span>Many new beginnings.</span>
              </h2>
              <p className="impact-description">
                A whole-blood donation can be separated in a component laboratory into distinct therapies. Select a component or orbit the 3D model to see how voluntary donors support different patient journeys.
              </p>

              {/* Interactive Component Selector */}
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
                  <strong>Typical clinical focus:</strong> {selectedComponent.useCase}
                </div>
              </div>

              {/* Community Impact Simulator */}
              <div className="impact-simulator">
                <div className="sim-header">
                  <label htmlFor="impact-slider">
                    VOLUNTARY DONATIONS SIMULATOR: <strong>{donationCount}</strong>{" "}
                    {donationCount === 1 ? "donation" : "donations"}
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

              <p className="impact-caveat">
                Depending on how blood components are prepared and used, one donation may help up to three people.
              </p>
              <button className="text-link text-link-light impact-link" type="button" onClick={openRegistration}>
                Be part of the next connection <ArrowIcon />
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
                <span className="live-dot" /> EVERY CONNECTION STARTS WITH SOMEONE
              </p>
              <h2>
                Be the reason<br />
                the chain continues.
              </h2>
            </div>
            <div className="join-action">
              <p>
                Show up for your community. Preview how starting a voluntary BloodLink donor profile feels in this interactive prototype.
              </p>
              <button className="button button-dark" type="button" onClick={openRegistration}>
                Start your donor profile <ArrowIcon diagonal />
              </button>
            </div>
            <div className="join-line" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
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
            <a href="#problem">Problem & Film</a>
            <a href="#discover">Find a donor</a>
            <a href="#network">Network</a>
            <a href="#learn">Donation guide</a>
            <button type="button" className="footer-brief-btn" onClick={() => setBriefOpen(true)}>
              Challenge Brief
            </button>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub Repository
            </a>
          </nav>
        </div>
        <div className="page-width footer-bottom">
          <span>CONCEPT PROTOTYPE / NOT A REAL MEDICAL SERVICE</span>
          <span>AI PROMPT BATTLE 2.0 · LIVE 3D & MOTION PROTOTYPE</span>
          <a href="#top">
            Back to top <ArrowIcon diagonal />
          </a>
        </div>
      </footer>

      {/* MODALS: REGISTRATION / URGENT REQUEST / DONOR CONNECTION */}
      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setRegisterOpen(false);
              setBriefOpen(false);
              setActiveRequest(null);
              setActiveDonor(null);
            }
          }}
        >
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button
              className="modal-close"
              type="button"
              aria-label="Close dialog"
              onClick={() => {
                setRegisterOpen(false);
                setBriefOpen(false);
                setActiveRequest(null);
                setActiveDonor(null);
              }}
            >
              <CloseIcon />
            </button>

            {registerOpen ? (
              registrationComplete && demoPass ? (
                <div className="modal-success">
                  <span className="success-mark">&#10003;</span>
                  <p className="eyebrow section-eyebrow">FIRST CONNECTION MADE</p>
                  <h2 id="modal-title">Welcome to the chain, {demoPass.name}.</h2>
                  <p>
                    Here is your illustrative BloodLink concept pass. Nothing has been saved, transmitted, or registered with a real medical service.
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
                  <button className="button button-red" type="button" onClick={() => setRegisterOpen(false)}>
                    Back to BloodLink <ArrowIcon />
                  </button>
                </div>
              ) : (
                <>
                  <p className="eyebrow section-eyebrow">
                    <span>01</span> BECOME A DONOR
                  </p>
                  <h2 id="modal-title">Start with a little about you.</h2>
                  <p className="modal-intro">A simple concept flow for creating a voluntary donor profile.</p>
                  <form className="registration-form" onSubmit={handleRegistration}>
                    <label htmlFor="donor-name">Your display name</label>
                    <input
                      id="donor-name"
                      name="name"
                      type="text"
                      placeholder="e.g. Jordan Rivera (demo)"
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
                        City or area
                        <input
                          id="registration-city"
                          name="city"
                          type="text"
                          placeholder="e.g. Brooklyn"
                          autoComplete="off"
                          required
                        />
                      </label>
                    </div>
                    <p className="form-privacy-note">
                      Prototype only. Do not enter sensitive personal or real health information.
                    </p>
                    <button className="button button-red modal-submit" type="submit">
                      Generate demo donor pass <ArrowIcon />
                    </button>
                  </form>
                </>
              )
            ) : activeRequest ? (
              <>
                <p className="eyebrow section-eyebrow">
                  <span>REQUEST PREVIEW</span> HOSPITAL-VERIFIED DEMO
                </p>
                <div className="request-modal-group">{activeRequest.group}</div>
                <h2 id="modal-title">{activeRequest.hospital}</h2>
                <p className="modal-intro">
                  An example {activeRequest.priority.toLowerCase()} for {activeRequest.units} in {activeRequest.city} ({activeRequest.updatedLabel}).
                </p>
                <div className="request-detail-list">
                  <div>
                    <span>Clinical context</span>
                    <strong>{activeRequest.need}</strong>
                  </div>
                  <div>
                    <span>Component requested</span>
                    <strong>{activeRequest.componentNeeded}</strong>
                  </div>
                  <div>
                    <span>Verification status</span>
                    <strong>Partner hospital — demo workflow</strong>
                  </div>
                  <div>
                    <span>Next step</span>
                    <strong>Confirm eligibility with an authorised blood centre</strong>
                  </div>
                </div>
                <p className="form-privacy-note">
                  This is an illustrative record, not a real or active medical request.
                </p>
                <button
                  className="button button-red modal-submit"
                  type="button"
                  onClick={() => exploreRequest(activeRequest)}
                >
                  Explore matching demo profiles <ArrowIcon />
                </button>
              </>
            ) : activeDonor ? (
              <>
                <p className="eyebrow section-eyebrow">
                  <span>DONOR PREVIEW</span> ILLUSTRATIVE PROFILE
                </p>
                <div className="request-modal-group">{activeDonor.group}</div>
                <h2 id="modal-title">{activeDonor.id} · {activeDonor.city}</h2>
                <p className="modal-intro">
                  Demonstrates privacy-first voluntary outreach — real contact details remain shielded until coordinated through an authorised blood centre.
                </p>
                <div className="request-detail-list">
                  <div>
                    <span>Neighbourhood</span>
                    <strong>{activeDonor.location}</strong>
                  </div>
                  <div>
                    <span>Availability label</span>
                    <strong>{activeDonor.availability}</strong>
                  </div>
                  <div>
                    <span>Response window</span>
                    <strong>{activeDonor.responseWindow}</strong>
                  </div>
                  <div>
                    <span>Demo milestones</span>
                    <strong>{activeDonor.donationsLogged} illustrative donations</strong>
                  </div>
                </div>
                <p className="form-privacy-note">
                  Fictional sample profile only. No live messaging or donor contact exists in this prototype.
                </p>
                <button
                  className="button button-red modal-submit"
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
                  <span>AI PROMPT BATTLE 2.0</span> CHALLENGE & ARCHITECTURE
                </p>
                <h2 id="modal-title">BloodLink — Every Drop Connects a Life</h2>
                <p className="modal-intro">
                  Built to transform a critical real-world social issue into an interactive 3D & motion-graphics digital product prototype.
                </p>
                <div className="request-detail-list">
                  <div>
                    <span>Problem statement</span>
                    <strong>Rapid donor discovery & bank clarity in emergencies</strong>
                  </div>
                  <div>
                    <span>3D WebGL engine</span>
                    <strong>Three.js parametric erythrocytes, topology & orbit</strong>
                  </div>
                  <div>
                    <span>Motion graphics</span>
                    <strong>60fps 4-chapter procedural canvas film + fullscreen</strong>
                  </div>
                  <div>
                    <span>Repository</span>
                    <strong>TeJAS512-MAX/BLOOD_DONAR-LOCATOR</strong>
                  </div>
                </div>
                <div className="brief-actions">
                  <a
                    className="button button-red"
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open GitHub Repo <ArrowIcon diagonal />
                  </a>
                  <button className="button button-dark" type="button" onClick={copyRepoUrl}>
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
