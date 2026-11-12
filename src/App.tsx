import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { HeroNetworkGrid3D } from "./components/HeroNetworkGrid3D";
import { HospitalRadar2D } from "./components/HospitalRadar2D";
import { ImpactOrbit3D } from "./components/ImpactOrbit3D";
import { LiveBiomedicalBg3D } from "./components/LiveBiomedicalBg3D";
import {
  BLOOD_BANKS,
  BLOOD_GROUPS,
  COMPATIBILITY_MAP,
  COMPONENT_STORIES,
  DONATION_GUIDES,
  DONOR_PROFILES,
  INITIAL_URGENT_REQUESTS,
  MYTHS_AND_FACTS,
  type BloodComponentStory,
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
  { href: "#find-blood", label: "Find donors" },
  { href: "#requests", label: "Requests" },
  { href: "#radar", label: "Radar" },
  { href: "#banks", label: "Blood banks" },
  { href: "#donate", label: "Donate" },
];

const PROBLEMS = [
  {
    index: "01",
    title: "Finding a matching donor",
    problem: "Families post exact-group appeals and miss donors who are medically compatible.",
    solution: "Compatibility search returns every safe blood group, nearest donors first.",
    href: "#find-blood",
    cta: "Search donors",
  },
  {
    index: "02",
    title: "Locating a blood bank with stock",
    problem: "Relatives phone centre after centre to ask what is available.",
    solution: "One directory with red-cell, platelet and plasma stock at partner centres.",
    href: "#banks",
    cta: "Check stock",
  },
  {
    index: "03",
    title: "Coordinating requests in time",
    problem: "Requests circulate unverified and nobody owns the response.",
    solution: "Hospitals post verified requests; the radar finds and dispatches the nearest compatible donor.",
    href: "#radar",
    cta: "Open radar",
  },
];

const SCENARIO_FILTERS: { value: ScenarioFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Emergency Trauma", label: "Trauma" },
  { value: "Critical Care", label: "Critical care" },
  { value: "Planned Surgery", label: "Surgery" },
];

const BANK_FILTERS: { value: BankFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Blood bank", label: "Blood banks" },
  { value: "Hospital partner", label: "Hospitals" },
];

const ELIGIBILITY = [
  { label: "Age", value: "18–65 years" },
  { label: "Weight", value: "45 kg or more" },
  { label: "Haemoglobin", value: "12.5 g/dL or more" },
  { label: "Whole-blood gap", value: "90 days (men) · 120 days (women)" },
];

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
    <svg aria-hidden="true" className="icon" viewBox="0 0 20 20">
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
  const [expandedDonorId, setExpandedDonorId] = useState<string | null>(null);
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [checkDonor, setCheckDonor] = useState<BloodGroup>("O-");
  const [checkPatient, setCheckPatient] = useState<BloodGroup>("A+");

  const [requests, setRequests] = useState<BloodRequest[]>(INITIAL_URGENT_REQUESTS);
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioFilter>("all");
  const [radarRequestId, setRadarRequestId] = useState(INITIAL_URGENT_REQUESTS[0].id);

  const [bankQuery, setBankQuery] = useState("");
  const [bankType, setBankType] = useState<BankFilter>("all");

  const [activeComponentId, setActiveComponentId] = useState<BloodComponentStory["id"]>("red-cells");
  const [driveUnits, setDriveUnits] = useState(12);

  const [openGuide, setOpenGuide] = useState<number | null>(0);
  const [mythIndex, setMythIndex] = useState(0);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [donorPass, setDonorPass] = useState<DonorPass | null>(null);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
  const [activeDonor, setActiveDonor] = useState<DonorProfile | null>(null);

  const modalOpen = registerOpen || createRequestOpen || activeRequest !== null || activeDonor !== null;

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
  }, []);

  const openRegister = useCallback(() => {
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

    return DONOR_PROFILES.filter(
      (donor) =>
        allowed.includes(donor.group) &&
        (!query || donor.city.toLowerCase().includes(query) || donor.location.toLowerCase().includes(query)) &&
        (!availableNowOnly || donor.availability === "Available Now"),
    ).sort((a, b) => {
      if (bloodGroup !== "all") {
        const exactA = a.group === bloodGroup ? 0 : 1;
        const exactB = b.group === bloodGroup ? 0 : 1;
        if (exactA !== exactB) return exactA - exactB;
      }
      return a.distanceKm - b.distanceKm;
    });
  }, [availableNowOnly, bloodGroup, city, includeCompatible]);

  const filteredRequests = useMemo(
    () => requests.filter((request) => scenarioFilter === "all" || request.scenario === scenarioFilter),
    [requests, scenarioFilter],
  );

  const filteredBanks = useMemo(() => {
    const query = bankQuery.trim().toLowerCase();
    return BLOOD_BANKS.filter(
      (bank) =>
        (bankType === "all" || bank.type === bankType) &&
        (!query || `${bank.name} ${bank.city} ${bank.area} ${bank.address}`.toLowerCase().includes(query)),
    );
  }, [bankQuery, bankType]);

  const activeComponent = COMPONENT_STORIES.find((item) => item.id === activeComponentId) ?? COMPONENT_STORIES[0];
  const checkCompatible = COMPATIBILITY_MAP[checkPatient].receiveRedCellsFrom.includes(checkDonor);
  const currentMyth = MYTHS_AND_FACTS[mythIndex];

  const toggleEmergency = () => {
    if (emergencyMode) {
      setEmergencyMode(false);
      showToast("Emergency mode off.");
      return;
    }
    setEmergencyMode(true);
    const critical = requests.find((request) => request.priority === "Critical") ?? requests[0];
    openRadarFor(critical.id, `Emergency mode on — radar locked to ${critical.id} at ${shortHospital(critical.hospital)}.`);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBgPulse((count) => count + 1);
    showToast(
      `${matches.length} ${matches.length === 1 ? "donor" : "donors"} found${city.trim() ? ` near ${city.trim()}` : ""}.`,
    );
  };

  const handleHeroGroup = useCallback(
    (group: BloodGroup) => {
      setBloodGroup(group);
      setIncludeCompatible(true);
      setBgPulse((count) => count + 1);
      showToast(`Donor search set to ${group} patients.`);
    },
    [showToast],
  );

  const handleHeroBank = useCallback(() => {
    showToast("Blood bank selected — partner stock is listed under Blood banks.");
  }, [showToast]);

  const scrollRequests = (direction: 1 | -1) => {
    requestsTrackRef.current?.scrollBy({ left: direction * 380, behavior: "smooth" });
  };

  const sendDonorRequest = (donor: DonorProfile) => {
    setActiveDonor(null);
    notify(`Request sent to ${donor.name}. Their number stays private until they accept.`);
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
          ? "Active bleeding — immediate transfusion"
          : scenario === "Critical Care"
            ? "Low platelet count — transfusion needed"
            : "Blood reserved for scheduled surgery",
      scenario,
      priority: scenario === "Emergency Trauma" ? "Critical" : scenario === "Critical Care" ? "Urgent" : "Priority",
      updatedLabel: "Verified just now",
      componentNeeded: scenario === "Critical Care" ? "Single-Donor Platelets (SDP)" : "Packed Red Cells (PRBC)",
      crossMatchNote: "Cross-match sample received",
      attendingDesk: "Blood bank duty officer",
    };

    setRequests((prev) => [newRequest, ...prev]);
    setScenarioFilter("all");
    openRadarFor(newRequest.id, `${newRequest.id} posted — radar is scanning for ${group}-compatible donors.`);
  };

  const emergencyButton = (onClick: () => void) => (
    <button
      type="button"
      className={`emergency-btn ${emergencyMode ? "is-active" : ""}`}
      aria-pressed={emergencyMode}
      onClick={onClick}
    >
      <span className="pulse-dot" />
      {emergencyMode ? "Emergency on" : "Emergency"}
    </button>
  );

  return (
    <>
      <LiveBiomedicalBg3D mode="auto" boostFlow={emergencyMode} activeBloodGroup={bloodGroup} pulseTriggerCount={bgPulse} />

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
                Become a donor
              </button>
            </div>
          </nav>

          <div className="header-actions">
            {emergencyButton(toggleEmergency)}
            <button type="button" className="btn btn-primary" onClick={openRegister}>
              Become a donor
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
                Emergency blood coordination
              </span>
              <h1 className="hero-title">
                Every drop
                <br />
                <em>connects</em> a life.
              </h1>
              <p className="hero-sub">
                Find compatible donors, check blood bank stock and dispatch help to hospitals — in minutes, not hours.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary btn-lg" href="#find-blood">
                  Find a donor <ArrowIcon />
                </a>
                <button type="button" className="btn btn-glass btn-lg" onClick={openRegister}>
                  Become a donor
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <HeroNetworkGrid3D
                boostFlow={emergencyMode}
                onSelectDonorGroup={handleHeroGroup}
                onSelectBankView={handleHeroBank}
              />
              <p className="hero-hint">Drag to rotate · tap a node to trace its route</p>
            </div>
          </div>
        </section>

        <section className="section problem-section" id="problem">
          <div className="container reveal">
            <div className="section-head is-center">
              <div className="section-head-copy">
                <span className="eyebrow">The problem</span>
                <h2>
                  Three delays stand between <em>a patient</em> and blood
                </h2>
              </div>
            </div>
            <div className="problem-grid">
              {PROBLEMS.map((item) => (
                <article key={item.index} className="problem-card glass glass-lift">
                  <span className="problem-index">{item.index}</span>
                  <h3>{item.title}</h3>
                  <div className="problem-row">
                    <span>Today</span>
                    <p>{item.problem}</p>
                  </div>
                  <div className="problem-row is-solution">
                    <span>With BloodLink</span>
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

        <section className="section finder-section" id="find-blood">
          <div className="container reveal">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">Find donors</span>
                <h2>
                  Search <em>compatible</em> donors near you
                </h2>
                <p>Every medically safe blood group is included, nearest first. Phone numbers stay private.</p>
              </div>
            </div>

            <div className="search-panel glass">
              <form className="search-form" onSubmit={handleSearch}>
                <label className="field">
                  <span>Patient blood group</span>
                  <select
                    className="input"
                    value={bloodGroup}
                    onChange={(event) => setBloodGroup(event.target.value as "all" | BloodGroup)}
                  >
                    <option value="all">Any group</option>
                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>City or area</span>
                  <input
                    className="input"
                    type="search"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Bengaluru, Mumbai, Delhi…"
                  />
                </label>
                <label className="field">
                  <span>Availability</span>
                  <select
                    className="input"
                    value={availableNowOnly ? "now" : "any"}
                    onChange={(event) => setAvailableNowOnly(event.target.value === "now")}
                  >
                    <option value="any">Any time</option>
                    <option value="now">Available now</option>
                  </select>
                </label>
                <button type="submit" className="btn btn-primary btn-lg search-submit">
                  <SearchIcon /> Search
                </button>
              </form>
              <div className="search-sub">
                <label className={`check ${bloodGroup === "all" ? "is-disabled" : ""}`}>
                  <input
                    type="checkbox"
                    checked={includeCompatible}
                    disabled={bloodGroup === "all"}
                    onChange={(event) => setIncludeCompatible(event.target.checked)}
                  />
                  <span>
                    Include compatible groups
                    {bloodGroup !== "all" && ` (${COMPATIBILITY_MAP[bloodGroup].receiveRedCellsFrom.join(", ")})`}
                  </span>
                </label>
                <span className="result-count" aria-live="polite">
                  {matches.length} {matches.length === 1 ? "donor" : "donors"} found
                </span>
              </div>
            </div>

            {matches.length > 0 ? (
              <div className="donor-grid">
                {matches.slice(0, 6).map((donor) => {
                  const expanded = expandedDonorId === donor.id;
                  const exact = bloodGroup !== "all" && donor.group === bloodGroup;
                  return (
                    <article key={donor.id} className={`donor-card glass glass-lift ${expanded ? "is-open" : ""}`}>
                      <div className="card-top">
                        <span className="group-badge">{donor.group}</span>
                        {bloodGroup !== "all" && (
                          <span className={`match-tag ${exact ? "is-exact" : "is-compat"}`}>
                            {exact ? "Exact match" : "Compatible"}
                          </span>
                        )}
                      </div>
                      <h3>{donor.name}</h3>
                      <p className="donor-loc">
                        {donor.location} · {donor.distanceKm} km
                      </p>
                      <p className="donor-status">
                        <span className={`status-dot ${donor.availability === "Available Now" ? "is-live" : ""}`} />
                        {donor.availability} · {donor.responseWindow}
                      </p>
                      <div className={`pop-down ${expanded ? "is-open" : ""}`} id={`donor-${donor.id}`}>
                        <div className="pop-down-inner">
                          <div className="kv-list">
                            <div className="kv">
                              <span>Haemoglobin</span>
                              <strong>{donor.hemoglobin}</strong>
                            </div>
                            <div className="kv">
                              <span>Last donation</span>
                              <strong>{donor.lastDonated}</strong>
                            </div>
                            <div className="kv">
                              <span>Verified by</span>
                              <strong>{donor.verifiedBy}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="pop-toggle"
                          aria-expanded={expanded}
                          aria-controls={`donor-${donor.id}`}
                          onClick={() => setExpandedDonorId(expanded ? null : donor.id)}
                        >
                          {expanded ? "Less" : "Details"} <ChevronIcon open={expanded} />
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveDonor(donor)}>
                          Contact
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">No donors match. Clear the city or include compatible groups.</p>
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
                  <span className="panel-label">Compatibility checker</span>
                  <strong>Can this donor give to this patient?</strong>
                </span>
                <ChevronIcon open={checkerOpen} />
              </button>
              <div className={`pop-down ${checkerOpen ? "is-open" : ""}`} id="checker-body">
                <div className="pop-down-inner">
                  <div className="checker-body">
                    <div className="checker-grid">
                      <div>
                        <span className="panel-label">Donor</span>
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
                        <span className="panel-label">Patient</span>
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
                        <span className="verdict-label">{checkCompatible ? "Compatible" : "Not compatible"}</span>
                        <strong>
                          {checkDonor} donor → {checkPatient} patient
                        </strong>
                        <p>
                          {checkCompatible
                            ? `${checkPatient} patients can safely receive ${checkDonor} red cells.`
                            : `${checkDonor} red cells carry antigens a ${checkPatient} patient would react to. Safe donors: ${COMPATIBILITY_MAP[checkPatient].receiveRedCellsFrom.join(", ")}.`}
                        </p>
                      </div>
                      {!checkCompatible && (
                        <button type="button" className="btn btn-glass btn-sm" onClick={() => setCheckDonor("O-")}>
                          Try O- universal donor
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
                <span className="eyebrow">Urgent requests</span>
                <h2>
                  Hospitals that need blood <em>now</em>
                </h2>
                <p>Every request is verified by the hospital's blood desk before it appears.</p>
              </div>
              <div className="section-head-actions">
                <button type="button" className="btn btn-primary" onClick={() => setCreateRequestOpen(true)}>
                  Post a request
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
                <article key={request.id} className="request-card glass glass-lift">
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
                      Details
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        openRadarFor(
                          request.id,
                          `Radar scanning for ${request.group}-compatible donors near ${shortHospital(request.hospital)}.`,
                        )
                      }
                    >
                      Find donors <ArrowIcon />
                    </button>
                  </div>
                </article>
              ))}
              {filteredRequests.length === 0 && <p className="empty-state">No requests in this category.</p>}
            </div>
          </div>
        </section>

        <section className="section radar-section" id="radar" ref={radarRef}>
          <div className="container reveal">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow is-teal">Hospital radar</span>
                <h2>
                  Locate and <em>dispatch</em> the nearest donor
                </h2>
                <p>
                  The sweep scans around the requesting hospital. Select a contact to dispatch a donor, reserve units or
                  reroute a mobile unit.
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

        <section className="section banks-section" id="banks">
          <div className="container reveal">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow is-teal">Blood banks</span>
                <h2>
                  Stock at <em>partner</em> centres
                </h2>
                <p>
                  Red-cell units by group. Low stock is marked in red
                  {bloodGroup !== "all" ? `, and ${bloodGroup} is outlined` : ""}.
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
                  placeholder="Search city or centre"
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
              <p className="empty-state">No centres match that search.</p>
            )}
          </div>
        </section>

        <section className="section impact-section" id="impact">
          <div className="container reveal">
            <div className="section-head is-center">
              <div className="section-head-copy">
                <span className="eyebrow">Impact</span>
                <h2>
                  One donation, up to <em>three</em> patients
                </h2>
                <p>Whole blood is separated into red cells, plasma and platelets — each treats a different patient.</p>
              </div>
            </div>

            <div className="impact-shell glass">
              <div className="impact-info">
                <div className="tabs" role="group" aria-label="Blood components">
                  {COMPONENT_STORIES.map((component) => (
                    <button
                      key={component.id}
                      type="button"
                      className={`tab ${activeComponentId === component.id ? "is-active" : ""}`}
                      aria-pressed={activeComponentId === component.id}
                      onClick={() => setActiveComponentId(component.id)}
                    >
                      <span className="tab-dot" style={{ background: component.color }} />
                      {component.title.split(" (")[0]}
                    </button>
                  ))}
                </div>
                <div className="component-detail" style={{ borderLeftColor: activeComponent.color }}>
                  <span className="panel-label">{activeComponent.subtitle}</span>
                  <h3>{activeComponent.title}</h3>
                  <p>{activeComponent.description}</p>
                  <dl className="facts">
                    <div>
                      <dt>Storage</dt>
                      <dd>{activeComponent.storageTemp}</dd>
                    </div>
                    <div>
                      <dt>Shelf life</dt>
                      <dd>{activeComponent.shelfLife}</dd>
                    </div>
                    <div>
                      <dt>Used for</dt>
                      <dd>{activeComponent.useCase}</dd>
                    </div>
                  </dl>
                </div>
                <div className="drive-sim">
                  <label htmlFor="drive-units">
                    <span>
                      Blood drive: <b>{driveUnits}</b> donations
                    </span>
                    <span className="drive-result">
                      Up to <b>{driveUnits * 3}</b> patients helped*
                    </span>
                  </label>
                  <input
                    id="drive-units"
                    className="range"
                    type="range"
                    min={1}
                    max={50}
                    value={driveUnits}
                    onChange={(event) => setDriveUnits(Number(event.target.value))}
                  />
                </div>
                <p className="fine-print">*When separated into components. Actual use depends on each patient's needs.</p>
              </div>
              <div className="impact-stage">
                <ImpactOrbit3D
                  activeComponent={activeComponentId}
                  unitCount={driveUnits}
                  onSelectComponent={setActiveComponentId}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section donate-section" id="donate">
          <div className="container reveal">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">Donate</span>
                <h2>
                  Before you <em>donate</em>
                </h2>
                <p>What to expect, who can give and how often. Your blood bank confirms eligibility on the day.</p>
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
                  <span className="panel-label">Eligibility at a glance</span>
                  <ul className="eligibility-list">
                    {ELIGIBILITY.map((item) => (
                      <li key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="fine-print">Based on India's national (NBTC) donor guidelines.</p>
                </div>

                <div className="info-card glass">
                  <div className="myth-head">
                    <span className="panel-label">Myth vs fact</span>
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
                      <strong>Fact:</strong> {currentMyth.fact}
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
                <h3>Ready to give?</h3>
                <p>
                  Join the donor registry in under a minute. Hospitals see only your blood group and area until you accept
                  a request.
                </p>
              </div>
              <button type="button" className="btn btn-light btn-lg" onClick={openRegister}>
                Become a donor <ArrowIcon />
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
            <p className="footer-about">Connecting voluntary donors, hospitals and blood banks when every minute counts.</p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <a href="#impact">Impact</a>
          </nav>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 BloodLink</span>
          <span>Hackathon prototype · sample data, not connected to live hospital systems.</span>
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
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button ref={modalCloseRef} type="button" className="modal-close" aria-label="Close" onClick={closeModals}>
              <CloseIcon />
            </button>

            {registerOpen &&
              (donorPass ? (
                <>
                  <span className="success-mark">
                    <CheckIcon />
                  </span>
                  <span className="eyebrow is-teal">Registered</span>
                  <h2 id="modal-title">Welcome, {donorPass.name}.</h2>
                  <p className="modal-intro">Show this pass at a partner blood bank for faster check-in.</p>
                  <div className="donor-pass">
                    <div className="pass-top">
                      <span>BloodLink donor pass</span>
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
                    Done
                  </button>
                </>
              ) : (
                <>
                  <span className="eyebrow">Become a donor</span>
                  <h2 id="modal-title">Join the donor registry</h2>
                  <p className="modal-intro">
                    Hospitals see only your blood group and area. You choose which requests to accept.
                  </p>
                  <form className="form" onSubmit={handleRegistration}>
                    <label className="field">
                      <span>Full name</span>
                      <input className="input" name="name" required autoComplete="name" placeholder="e.g. Aarav Nair" />
                    </label>
                    <div className="form-row">
                      <label className="field">
                        <span>Blood group</span>
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
                        <span>City</span>
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
                      Create donor pass <ArrowIcon />
                    </button>
                  </form>
                </>
              ))}

            {createRequestOpen && (
              <>
                <span className="eyebrow">Hospital blood desk</span>
                <h2 id="modal-title">Post an urgent request</h2>
                <p className="modal-intro">It appears on the board and the radar starts scanning for compatible donors.</p>
                <form className="form" onSubmit={handleCreateRequest}>
                  <label className="field">
                    <span>Hospital</span>
                    <input
                      className="input"
                      name="hospital"
                      required
                      placeholder="e.g. St. John's Medical College Hospital"
                    />
                  </label>
                  <div className="form-row">
                    <label className="field">
                      <span>Blood group</span>
                      <select className="input" name="group" defaultValue="O-">
                        {BLOOD_GROUPS.map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Units</span>
                      <input className="input" name="units" type="number" min={1} max={10} defaultValue={2} required />
                    </label>
                  </div>
                  <div className="form-row">
                    <label className="field">
                      <span>City</span>
                      <input className="input" name="city" required defaultValue="Bengaluru" />
                    </label>
                    <label className="field">
                      <span>Situation</span>
                      <select className="input" name="scenario" defaultValue="Emergency Trauma">
                        <option value="Emergency Trauma">Emergency trauma</option>
                        <option value="Critical Care">Critical care</option>
                        <option value="Planned Surgery">Planned surgery</option>
                      </select>
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg btn-block">
                    Post request <ArrowIcon />
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
                    <dt>Clinical need</dt>
                    <dd>{activeRequest.need}</dd>
                  </div>
                  <div>
                    <dt>Safe donor groups</dt>
                    <dd>{COMPATIBILITY_MAP[activeRequest.group].receiveRedCellsFrom.join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Cross-match</dt>
                    <dd>{activeRequest.crossMatchNote}</dd>
                  </div>
                  <div>
                    <dt>Blood desk</dt>
                    <dd>{activeRequest.attendingDesk}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block"
                  onClick={() =>
                    openRadarFor(
                      activeRequest.id,
                      `Radar scanning for ${activeRequest.group}-compatible donors near ${shortHospital(activeRequest.hospital)}.`,
                    )
                  }
                >
                  Find donors on radar <ArrowIcon />
                </button>
              </>
            )}

            {activeDonor && (
              <>
                <span className="eyebrow is-teal">Verified donor · {activeDonor.id}</span>
                <div className="modal-group">{activeDonor.group}</div>
                <h2 id="modal-title">{activeDonor.name}</h2>
                <p className="modal-intro">
                  {activeDonor.location} · {activeDonor.distanceKm} km away
                </p>
                <dl className="detail-list">
                  <div>
                    <dt>Availability</dt>
                    <dd>
                      {activeDonor.availability} · {activeDonor.responseWindow}
                    </dd>
                  </div>
                  <div>
                    <dt>Haemoglobin</dt>
                    <dd>{activeDonor.hemoglobin}</dd>
                  </div>
                  <div>
                    <dt>Last donation</dt>
                    <dd>{activeDonor.lastDonated}</dd>
                  </div>
                  <div>
                    <dt>Can give red cells to</dt>
                    <dd>{COMPATIBILITY_MAP[activeDonor.group].donateRedCellsTo.join(", ")}</dd>
                  </div>
                </dl>
                <p className="form-note">Phone numbers stay private. Your request is relayed through {activeDonor.verifiedBy}.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block"
                  onClick={() => sendDonorRequest(activeDonor)}
                >
                  Send request <ArrowIcon />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default App;
