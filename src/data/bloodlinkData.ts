export type BloodGroup = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";

export interface DonorProfile {
  id: string;
  group: BloodGroup;
  location: string;
  city: string;
  availability: string;
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
  priority: "Urgent request" | "Priority request";
  updatedLabel: string;
  componentNeeded: string;
}

export interface NetworkPartner {
  id: string;
  name: string;
  type: "Blood bank" | "Hospital partner";
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

export const PROBLEM_PILLARS = [
  {
    index: "01",
    title: "Fragmented Discovery",
    metric: "Critical minutes lost",
    description:
      "During surgeries and medical emergencies, families often rely on chaotic phone chains and unverified messages to locate compatible donors nearby.",
  },
  {
    index: "02",
    title: "Unclear Bank Access",
    metric: "Verified centres hidden",
    description:
      "People struggle to identify which authorised blood banks and hospital partner centres operate near their neighbourhood or carry required components.",
  },
  {
    index: "03",
    title: "Coordinated Connection",
    metric: "The BloodLink bridge",
    description:
      "BloodLink brings voluntary donors, verified hospital requests, and authorised blood banks into one calm, transparent digital prototype experience.",
  },
];

export const COMPATIBILITY_MAP: Record<BloodGroup, CompatibilityInfo> = {
  "O-": {
    group: "O-",
    donateRedCellsTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-"],
    note: "Universal red-cell donor — vital in emergency trauma before cross-matching completes.",
  },
  "O+": {
    group: "O+",
    donateRedCellsTo: ["O+", "A+", "B+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+"],
    note: "One of the most frequently needed groups across emergency rooms and planned surgeries.",
  },
  "A-": {
    group: "A-",
    donateRedCellsTo: ["A-", "A+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "A-"],
    note: "Red cells support A and AB recipients; platelets are also widely helpful.",
  },
  "A+": {
    group: "A+",
    donateRedCellsTo: ["A+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+", "A-", "A+"],
    note: "High community demand for both whole blood and apheresis platelet donations.",
  },
  "B-": {
    group: "B-",
    donateRedCellsTo: ["B-", "B+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "B-"],
    note: "Relatively rare Rh-negative group where consistent voluntary donors make a major difference.",
  },
  "B+": {
    group: "B+",
    donateRedCellsTo: ["B+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+", "B-", "B+"],
    note: "Essential for ongoing surgical schedules and regional transfusion support.",
  },
  "AB-": {
    group: "AB-",
    donateRedCellsTo: ["AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "A-", "B-", "AB-"],
    note: "Rare red-cell type and universal plasma donor across blood groups.",
  },
  "AB+": {
    group: "AB+",
    donateRedCellsTo: ["AB+"],
    receiveRedCellsFrom: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    note: "Universal red-cell recipient and universal plasma donor.",
  },
};

export const DONOR_PROFILES: DonorProfile[] = [
  {
    id: "BL-084",
    group: "O-",
    location: "Brooklyn Heights, Brooklyn",
    city: "Brooklyn",
    availability: "Available this week",
    donationsLogged: 6,
    responseWindow: "~2 hrs demo response",
  },
  {
    id: "BL-126",
    group: "A+",
    location: "Downtown Brooklyn, Brooklyn",
    city: "Brooklyn",
    availability: "Availability to confirm",
    donationsLogged: 3,
    responseWindow: "Evening check-in",
  },
  {
    id: "BL-205",
    group: "O+",
    location: "Park Slope, Brooklyn",
    city: "Brooklyn",
    availability: "Available this week",
    donationsLogged: 9,
    responseWindow: "~1 hr demo response",
  },
  {
    id: "BL-249",
    group: "A-",
    location: "Williamsburg, Brooklyn",
    city: "Brooklyn",
    availability: "Available this week",
    donationsLogged: 4,
    responseWindow: "Same-day demo",
  },
  {
    id: "BL-317",
    group: "B+",
    location: "Long Island City, Queens",
    city: "Queens",
    availability: "Available next week",
    donationsLogged: 5,
    responseWindow: "Weekend availability",
  },
  {
    id: "BL-362",
    group: "O+",
    location: "Astoria, Queens",
    city: "Queens",
    availability: "Available this week",
    donationsLogged: 8,
    responseWindow: "~2 hrs demo response",
  },
  {
    id: "BL-408",
    group: "AB-",
    location: "Upper West Side, Manhattan",
    city: "Manhattan",
    availability: "Availability to confirm",
    donationsLogged: 7,
    responseWindow: "Afternoon window",
  },
  {
    id: "BL-451",
    group: "AB+",
    location: "Midtown East, Manhattan",
    city: "Manhattan",
    availability: "Available this week",
    donationsLogged: 2,
    responseWindow: "Morning slot",
  },
  {
    id: "BL-519",
    group: "B-",
    location: "Hoboken Central, New Jersey",
    city: "Hoboken",
    availability: "Available this week",
    donationsLogged: 11,
    responseWindow: "~90 min demo response",
  },
];

export const URGENT_REQUESTS: BloodRequest[] = [
  {
    id: "REQ-402",
    group: "O-",
    units: "3 units",
    hospital: "Northline Community Hospital",
    area: "Queens",
    city: "Queens, New York",
    need: "Emergency trauma support",
    priority: "Urgent request",
    updatedLabel: "Demo posted 14m ago",
    componentNeeded: "Packed Red Cells",
  },
  {
    id: "REQ-409",
    group: "A-",
    units: "2 units",
    hospital: "Riverside Surgical Centre",
    area: "Brooklyn",
    city: "Brooklyn, New York",
    need: "Planned cardiac surgery",
    priority: "Priority request",
    updatedLabel: "Demo posted 42m ago",
    componentNeeded: "Whole Blood / Red Cells",
  },
  {
    id: "REQ-415",
    group: "AB+",
    units: "1 unit",
    hospital: "St. Clement Medical Centre",
    area: "Manhattan",
    city: "Manhattan, New York",
    need: "Scheduled oncology care",
    priority: "Priority request",
    updatedLabel: "Demo posted 1h ago",
    componentNeeded: "Plasma / Platelets",
  },
  {
    id: "REQ-421",
    group: "B-",
    units: "2 units",
    hospital: "Harborview Clinical Institute",
    area: "Brooklyn",
    city: "Brooklyn, New York",
    need: "Maternal care reserve",
    priority: "Urgent request",
    updatedLabel: "Demo posted 28m ago",
    componentNeeded: "Packed Red Cells",
  },
];

export const BLOOD_BANKS: NetworkPartner[] = [
  {
    id: "NET-01",
    name: "Harborline Blood Centre",
    type: "Blood bank",
    area: "Brooklyn",
    address: "148 Montague St, Brooklyn Heights, NY",
    hours: "07:30 - 20:00 (Illustrative)",
    services: ["Whole blood", "Platelet apheresis", "Component lab"],
    coords: [-0.85, 0.32],
  },
  {
    id: "NET-02",
    name: "Northline Community Hospital",
    type: "Hospital partner",
    area: "Queens",
    address: "29-10 Crescent Ave, Long Island City, NY",
    hours: "24/7 Emergency Blood Desk (Illustrative)",
    services: ["Trauma transfusion", "Cross-matching", "Surgical reserve"],
    coords: [0.68, 0.56],
  },
  {
    id: "NET-03",
    name: "St. Clement Medical Centre",
    type: "Hospital partner",
    area: "Manhattan",
    address: "420 E 74th St, Upper East Side, NY",
    hours: "06:00 - 22:00 (Illustrative)",
    services: ["Oncology support", "Plasma bank", "Verified intake"],
    coords: [-0.14, 0.78],
  },
  {
    id: "NET-04",
    name: "Riverside Donor Services",
    type: "Blood bank",
    area: "Brooklyn",
    address: "88 Schermerhorn St, Downtown Brooklyn, NY",
    hours: "08:00 - 19:00 (Illustrative)",
    services: ["First-time donors", "Rapid screening", "Community drives"],
    coords: [-0.42, -0.35],
  },
  {
    id: "NET-05",
    name: "Harborview Clinical Institute",
    type: "Hospital partner",
    area: "Brooklyn",
    address: "215 Atlantic Ave, Cobble Hill, NY",
    hours: "24/7 Clinical Coordination (Illustrative)",
    services: ["Maternal reserve", "Pediatric care", "Priority verification"],
    coords: [-0.62, -0.68],
  },
];

export const DONATION_GUIDES: DonationGuide[] = [
  {
    title: "Who can donate?",
    summary: "General eligibility basics",
    detail:
      "Eligibility depends on local health authority rules, age, weight, haemoglobin levels, and recent travel or medical history. A qualified donation team reviews your health questionnaire before every appointment to ensure donating is safe for both you and recipients.",
  },
  {
    title: "How should I prepare?",
    summary: "Hydration, nutrition & rest",
    detail:
      "Eat a balanced meal beforehand, drink extra water in the hours leading up to your visit, get good sleep, and bring an accepted photo ID. Avoid donating on an empty stomach, and ask your local blood centre if any specific guidelines apply.",
  },
  {
    title: "What happens at an appointment?",
    summary: "From check-in to refreshments",
    detail:
      "A trained clinician walks through a confidential health check and mini-physical (temperature, pulse, blood pressure, haemoglobin). The donation itself typically takes around 8–10 minutes for whole blood, followed by 10–15 minutes of rest and refreshments. You may pause or ask questions anytime.",
  },
  {
    title: "When can I donate again?",
    summary: "Recovery & safe intervals",
    detail:
      "Recovery intervals vary by country and donation type (whole blood, platelets, or plasma). Your authorised blood centre will calculate your exact next eligible date and remind you when your body has fully replenished.",
  },
];

export const MYTHS_AND_FACTS: MythFact[] = [
  {
    myth: "\"Donating blood permanently weakens your body.\"",
    fact: "Healthy donors replenish fluid volume within 24–48 hours and replace red blood cells over the following weeks under standard safe intervals.",
  },
  {
    myth: "\"If I have a common blood type like O+ or A+, my donation isn't needed.\"",
    fact: "Common blood types are also the most frequently needed in hospital emergencies and surgeries — demand is constant across every group.",
  },
  {
    myth: "\"Only whole-blood donations make an impact.\"",
    fact: "Donations can be separated into red cells, plasma, and platelets — or collected via apheresis — supporting trauma, burns, and cancer care.",
  },
];

export const READINESS_CHECKS: ReadinessItem[] = [
  {
    id: "meal-water",
    question: "Have you eaten a balanced meal and had plenty of water today?",
    tip: "Hydration and steady nutrition help keep you comfortable before and after donating.",
  },
  {
    id: "feeling-well",
    question: "Are you feeling well, rested, and free of fever or acute symptoms?",
    tip: "Feeling healthy protects both your recovery and recipients.",
  },
  {
    id: "interval",
    question: "Have you waited the recommended interval since any prior donation?",
    tip: "Standard intervals vary by donation type and local health guidelines.",
  },
  {
    id: "photo-id",
    question: "Do you have an accepted photo ID ready for check-in?",
    tip: "Authorised blood banks verify identity before completing health screening.",
  },
];

export const COMPONENT_STORIES: BloodComponentStory[] = [
  {
    id: "red-cells",
    title: "Red Blood Cells",
    subtitle: "OXYGEN TRANSPORT",
    color: "#fa6877",
    shelfLife: "Up to 42 days (refrigerated)",
    useCase: "Trauma, major surgery & severe anaemia",
    description:
      "Concentrated erythrocytes restore oxygen-carrying capacity quickly during acute blood loss, planned operations, and chronic transfusion therapies.",
  },
  {
    id: "plasma",
    title: "Fresh Plasma",
    subtitle: "CLOTTING & VOLUME",
    color: "#f2b880",
    shelfLife: "Up to 1 year (frozen)",
    useCase: "Coagulation support, liver care & shock",
    description:
      "Golden liquid plasma carries vital clotting proteins and antibodies used in burn care, neonatal emergencies, and complex coagulopathies.",
  },
  {
    id: "platelets",
    title: "Platelets",
    subtitle: "HEMOSTASIS SHIELD",
    color: "#ff8c9a",
    shelfLife: "5–7 days (constantly needed)",
    useCase: "Cancer care, transplants & active bleeding",
    description:
      "Tiny cell fragments form the first line of clot stabilization. Because platelets have a short shelf life, steady voluntary donors are essential.",
  },
];
