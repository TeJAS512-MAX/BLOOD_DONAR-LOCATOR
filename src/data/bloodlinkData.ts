export type BloodGroup = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";

export interface ProblemSolutionAnalysis {
  id: string;
  index: string;
  problemTitle: string;
  painPoint: string;
  optionsEvaluated: string;
  chosenSolution: string;
  targetSection: string;
  filmChapter: number;
}

export interface DonorProfile {
  id: string;
  group: BloodGroup;
  location: string;
  city: string;
  availability: "Ready this week" | "Confirming schedule" | "Weekend window";
  donationsLogged: number;
  responseWindow: string;
}

export interface BloodRequest {
  id: string;
  group: BloodGroup;
  units: string;
  hospital: string;
  area: string;
  city: string;
  need: string;
  scenario: "Emergency Trauma" | "Planned Surgery" | "Critical Care";
  priority: "Urgent" | "Priority";
  updatedLabel: string;
  componentNeeded: string;
}

export interface NetworkPartner {
  id: string;
  name: string;
  type: "Blood bank" | "Hospital partner";
  city: string;
  area: string;
  address: string;
  hours: string;
  services: string[];
  coords: [number, number];
}

export interface DonationGuide {
  title: string;
  summary: string;
  detail: string;
}

export interface MythFact {
  myth: string;
  fact: string;
}

export interface ReadinessItem {
  id: string;
  question: string;
  tip: string;
}

export interface CompatibilityInfo {
  group: BloodGroup;
  donateRedCellsTo: BloodGroup[];
  receiveRedCellsFrom: BloodGroup[];
  note: string;
}

export interface BloodComponentStory {
  id: "red-cells" | "plasma" | "platelets";
  title: string;
  subtitle: string;
  color: string;
  shelfLife: string;
  useCase: string;
  description: string;
}

export const GITHUB_REPO_URL = "https://github.com/TeJAS512-MAX/BLOOD_DONAR-LOCATOR";

export const BLOOD_GROUPS: BloodGroup[] = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

export const PROBLEM_SOLUTIONS: ProblemSolutionAnalysis[] = [
  {
    id: "donor-discovery",
    index: "01",
    problemTitle: "Finding Suitable Donors Quickly",
    painPoint:
      "During emergencies, exact blood group searches often miss medically compatible donors (like O- for A+ or AB+) while exposing private phone numbers in group chats.",
    optionsEvaluated:
      "Evaluated: (a) Manual social broadcasts, (b) Exact-type table only, (c) Compatibility-aware privacy-safe discovery.",
    chosenSolution:
      "Compatibility-Aware Donor Finder with one-toggle ABO/Rh matching & shielded outreach preview.",
    targetSection: "#discover",
    filmChapter: 0,
  },
  {
    id: "bank-location",
    index: "02",
    problemTitle: "Locating Verified Blood Banks",
    painPoint:
      "Families waste critical minutes visiting clinics that lack component labs or 24/7 cross-matching desks.",
    optionsEvaluated:
      "Evaluated: (a) Static address list, (b) Generic map pins, (c) 3D spatial topology filtered by component capabilities.",
    chosenSolution:
      "Interactive 3D Partner Topology synced with capability tags (Whole Blood, Platelets, 24/7 Desk).",
    targetSection: "#network",
    filmChapter: 1,
  },
  {
    id: "request-coordination",
    index: "03",
    problemTitle: "Coordinating Urgent Requests",
    painPoint:
      "Unverified forwards circulate outdated patient requests, causing confusion and donor fatigue.",
    optionsEvaluated:
      "Evaluated: (a) Open public feed, (b) Hospital-verified structured intake with auto-matching.",
    chosenSolution:
      "Verified Request Desk + 15-second Demo Request Composer + 1-click Auto-Match into Donor Search.",
    targetSection: "#requests",
    filmChapter: 2,
  },
  {
    id: "awareness-participation",
    index: "04",
    problemTitle: "Overcoming Donor Hesitation",
    painPoint:
      "Myths around recovery, pain, and rare-only demand prevent healthy first-time volunteers from stepping forward.",
    optionsEvaluated:
      "Evaluated: (a) Long FAQ text, (b) Interactive process guide, myth-buster, readiness check & 3D impact model.",
    chosenSolution:
      "3-Tab Awareness Hub + 3D Component Separation Simulator + Instant Digital Concept Donor Pass.",
    targetSection: "#learn",
    filmChapter: 3,
  },
];

export const COMPATIBILITY_MAP: Record<BloodGroup, CompatibilityInfo> = {
  "O-": {
    group: "O-",
    donateRedCellsTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-"],
    note: "Universal red-cell donor — critical in trauma emergencies before cross-matching finishes.",
  },
  "O+": {
    group: "O+",
    donateRedCellsTo: ["O+", "A+", "B+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+"],
    note: "High demand across emergency rooms, maternal care, and planned surgical schedules.",
  },
  "A-": {
    group: "A-",
    donateRedCellsTo: ["A-", "A+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "A-"],
    note: "Supports A and AB recipients; plasma and platelet components are also widely needed.",
  },
  "A+": {
    group: "A+",
    donateRedCellsTo: ["A+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+", "A-", "A+"],
    note: "Frequently requested for both whole-blood transfusions and apheresis platelets.",
  },
  "B-": {
    group: "B-",
    donateRedCellsTo: ["B-", "B+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "B-"],
    note: "Uncommon Rh-negative type where consistent voluntary donor readiness is vital.",
  },
  "B+": {
    group: "B+",
    donateRedCellsTo: ["B+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+", "B-", "B+"],
    note: "Essential across major surgical wings and ongoing clinical transfusion programs.",
  },
  "AB-": {
    group: "AB-",
    donateRedCellsTo: ["AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "A-", "B-", "AB-"],
    note: "Rare red-cell type and universal plasma donor across every blood group.",
  },
  "AB+": {
    group: "AB+",
    donateRedCellsTo: ["AB+"],
    receiveRedCellsFrom: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    note: "Universal red-cell recipient (can receive red cells from all 8 groups) and universal plasma donor.",
  },
};

export const DONOR_PROFILES: DonorProfile[] = [
  {
    id: "BL-104",
    group: "O-",
    location: "Indiranagar, Bengaluru",
    city: "Bengaluru",
    availability: "Ready this week",
    donationsLogged: 7,
    responseWindow: "~45 min demo check-in",
  },
  {
    id: "BL-148",
    group: "A+",
    location: "Koramangala, Bengaluru",
    city: "Bengaluru",
    availability: "Ready this week",
    donationsLogged: 4,
    responseWindow: "~1 hr demo check-in",
  },
  {
    id: "BL-219",
    group: "O+",
    location: "Jayanagar, Bengaluru",
    city: "Bengaluru",
    availability: "Confirming schedule",
    donationsLogged: 9,
    responseWindow: "Evening window",
  },
  {
    id: "BL-265",
    group: "B+",
    location: "Bandra West, Mumbai",
    city: "Mumbai",
    availability: "Ready this week",
    donationsLogged: 5,
    responseWindow: "~1 hr demo check-in",
  },
  {
    id: "BL-312",
    group: "A-",
    location: "Andheri East, Mumbai",
    city: "Mumbai",
    availability: "Weekend window",
    donationsLogged: 3,
    responseWindow: "Morning slot",
  },
  {
    id: "BL-388",
    group: "B-",
    location: "Banjara Hills, Hyderabad",
    city: "Hyderabad",
    availability: "Ready this week",
    donationsLogged: 11,
    responseWindow: "~90 min demo check-in",
  },
  {
    id: "BL-427",
    group: "AB-",
    location: "Hauz Khas, New Delhi",
    city: "Delhi",
    availability: "Confirming schedule",
    donationsLogged: 6,
    responseWindow: "Afternoon window",
  },
  {
    id: "BL-491",
    group: "AB+",
    location: "Whitefield, Bengaluru",
    city: "Bengaluru",
    availability: "Ready this week",
    donationsLogged: 2,
    responseWindow: "Same-day demo",
  },
];

export const INITIAL_URGENT_REQUESTS: BloodRequest[] = [
  {
    id: "REQ-501",
    group: "O-",
    units: "3 units",
    hospital: "St. Martha's Trauma & Emergency Centre",
    area: "Indiranagar",
    city: "Bengaluru",
    need: "Acute trauma stabilization",
    scenario: "Emergency Trauma",
    priority: "Urgent",
    updatedLabel: "Demo posted 12m ago",
    componentNeeded: "Packed Red Cells",
  },
  {
    id: "REQ-508",
    group: "A+",
    units: "2 units",
    hospital: "Sahyadri Cardiac & Surgical Institute",
    area: "Bandra",
    city: "Mumbai",
    need: "Scheduled bypass surgery",
    scenario: "Planned Surgery",
    priority: "Priority",
    updatedLabel: "Demo posted 38m ago",
    componentNeeded: "Whole Blood / Red Cells",
  },
  {
    id: "REQ-514",
    group: "B-",
    units: "2 units",
    hospital: "Deccan Oncology & Critical Care",
    area: "Banjara Hills",
    city: "Hyderabad",
    need: "Platelet & coagulation support",
    scenario: "Critical Care",
    priority: "Urgent",
    updatedLabel: "Demo posted 24m ago",
    componentNeeded: "Single-Donor Platelets",
  },
  {
    id: "REQ-522",
    group: "AB+",
    units: "1 unit",
    hospital: "Northgate Multispecialty Hospital",
    area: "Hauz Khas",
    city: "Delhi",
    need: "Fresh plasma reserve",
    scenario: "Critical Care",
    priority: "Priority",
    updatedLabel: "Demo posted 55m ago",
    componentNeeded: "Fresh Frozen Plasma",
  },
];

export const BLOOD_BANKS: NetworkPartner[] = [
  {
    id: "NET-01",
    name: "Lions Voluntary Blood & Component Centre",
    type: "Blood bank",
    city: "Bengaluru",
    area: "Indiranagar",
    address: "100 Feet Road, Indiranagar, Bengaluru",
    hours: "07:00 – 21:00 Daily (Illustrative)",
    services: ["Whole blood", "Platelet apheresis", "Component separation"],
    coords: [-0.82, 0.36],
  },
  {
    id: "NET-02",
    name: "St. Martha's Trauma & Emergency Centre",
    type: "Hospital partner",
    city: "Bengaluru",
    area: "Central",
    address: "Nrupathunga Road, Bengaluru",
    hours: "24/7 Emergency Blood Desk (Illustrative)",
    services: ["24/7 cross-matching", "Trauma reserve", "Verified requests"],
    coords: [-0.36, -0.44],
  },
  {
    id: "NET-03",
    name: "Sahyadri Medical Blood Bank",
    type: "Blood bank",
    city: "Mumbai",
    area: "Bandra West",
    address: "Linking Road Annex, Bandra West, Mumbai",
    hours: "08:00 – 20:00 (Illustrative)",
    services: ["Whole blood", "Plasma storage", "First-time donor lounge"],
    coords: [0.64, 0.54],
  },
  {
    id: "NET-04",
    name: "Deccan Oncology & Critical Care",
    type: "Hospital partner",
    city: "Hyderabad",
    area: "Banjara Hills",
    address: "Road No. 12, Banjara Hills, Hyderabad",
    hours: "24/7 Clinical Coordination (Illustrative)",
    services: ["Single-donor platelets", "Pediatric reserve", "Verified requests"],
    coords: [-0.08, 0.78],
  },
  {
    id: "NET-05",
    name: "Northgate Regional Blood Hub",
    type: "Blood bank",
    city: "Delhi",
    area: "Hauz Khas",
    address: "Aurobindo Marg, Hauz Khas, New Delhi",
    hours: "07:30 – 20:30 (Illustrative)",
    services: ["Rare group registry", "Component lab", "Mobile camps"],
    coords: [0.46, -0.64],
  },
];

export const DONATION_GUIDES: DonationGuide[] = [
  {
    title: "Who can donate?",
    summary: "General eligibility overview",
    detail:
      "Voluntary donors generally meet local age, minimum weight, haemoglobin, and wellness standards. Before every donation, a qualified medical team performs a confidential screening to confirm donating is completely safe for both you and the recipient.",
  },
  {
    title: "How should I prepare?",
    summary: "Hydration, nutrition & rest",
    detail:
      "Eat a wholesome iron-rich meal within 3 hours prior, drink extra water, get a full night's sleep, and carry valid government photo ID. Avoid donating on an empty stomach or after strenuous exercise.",
  },
  {
    title: "What happens at the blood bank?",
    summary: "Check-in to refreshments (~35 min total)",
    detail:
      "You complete registration, a quick health check (blood pressure, pulse, haemoglobin), and the sterile single-use collection itself takes roughly 8–10 minutes. Afterwards you rest for 10–15 minutes with light refreshments.",
  },
  {
    title: "How often can I donate?",
    summary: "Safe recovery intervals",
    detail:
      "Recovery intervals differ by local regulations and donation type (whole blood vs. platelets or plasma). Your authorised blood bank schedules your next eligible window so iron and cell counts replenish naturally.",
  },
];

export const MYTHS_AND_FACTS: MythFact[] = [
  {
    myth: "\"Donating blood permanently weakens your immune system or energy.\"",
    fact: "Fluid plasma volume restores within 24–48 hours with hydration, and healthy bone marrow steadily replaces red cells within standard safe intervals.",
  },
  {
    myth: "\"Only rare blood types like O- or AB- are needed.\"",
    fact: "Common blood groups (O+, A+, B+) experience the highest daily hospital demand across surgeries, maternity care, and trauma wards.",
  },
  {
    myth: "\"Donating carries infection risk from equipment.\"",
    fact: "Authorised blood banks use strictly sterile, single-use sealed collection kits that are safely disposed of immediately after each donor.",
  },
];

export const READINESS_CHECKS: ReadinessItem[] = [
  {
    id: "meal-water",
    question: "Have you eaten a balanced meal and had extra water today?",
    tip: "Hydration and steady nutrition keep blood pressure stable before and after donation.",
  },
  {
    id: "feeling-well",
    question: "Are you feeling well, rested, and free of fever or infection?",
    tip: "Waiting until you are fully healthy protects both your recovery and recipients.",
  },
  {
    id: "interval",
    question: "Have you completed the required wait interval since any prior donation?",
    tip: "Authorised blood centres verify exact whole-blood and platelet intervals on-site.",
  },
  {
    id: "photo-id",
    question: "Do you have valid photo identification ready for registration?",
    tip: "Standard identity verification ensures safe donor tracking and follow-up.",
  },
];

export const COMPONENT_STORIES: BloodComponentStory[] = [
  {
    id: "red-cells",
    title: "Red Blood Cells",
    subtitle: "OXYGEN TRANSPORT",
    color: "#ff4d6d",
    shelfLife: "Up to 42 days (refrigerated)",
    useCase: "Emergency trauma, major surgeries & severe anaemia",
    description:
      "Concentrated erythrocytes restore oxygen delivery rapidly during surgical blood loss, accidents, and chronic transfusion therapy.",
  },
  {
    id: "plasma",
    title: "Fresh Plasma",
    subtitle: "CLOTTING & VOLUME",
    color: "#fbbf24",
    shelfLife: "Up to 1 year (frozen)",
    useCase: "Coagulation support, burn care & shock recovery",
    description:
      "Golden liquid plasma supplies vital clotting factors and proteins needed in intensive care, burns, and liver therapies.",
  },
  {
    id: "platelets",
    title: "Platelets",
    subtitle: "BLEEDING SHIELD",
    color: "#34d399",
    shelfLife: "5–7 days (highest urgency)",
    useCase: "Cancer care, dengue recovery & organ transplants",
    description:
      "Platelets stabilize clots within seconds. Because they last only 5–7 days, steady voluntary donors are always needed.",
  },
];
