export type BloodGroup = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";

export interface DonorProfile {
  id: string;
  name: string;
  group: BloodGroup;
  location: string;
  city: string;
  distanceKm: number;
  availability: "Available Now" | "On-Call (< 45 min)" | "Scheduled Window";
  donationsLogged: number;
  lastDonated: string;
  hemoglobin: string;
  verifiedBy: string;
  responseWindow: string;
}

export interface BloodRequest {
  id: string;
  group: BloodGroup;
  units: string;
  hospital: string;
  department: string;
  area: string;
  city: string;
  need: string;
  scenario: "Emergency Trauma" | "Planned Surgery" | "Critical Care";
  priority: "Critical" | "Urgent" | "Priority";
  updatedLabel: string;
  componentNeeded: string;
  crossMatchNote: string;
  attendingDesk: string;
}

export interface NetworkPartner {
  id: string;
  name: string;
  type: "Blood bank" | "Hospital partner";
  city: string;
  area: string;
  address: string;
  hours: string;
  licenseId: string;
  emergencyPhone: string;
  distanceKm: number;
  services: string[];
  coords: [number, number];
  inventory: Record<BloodGroup, number>;
  plateletsUnits: number;
  plasmaUnits: number;
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
  plasmaDonateTo: BloodGroup[];
  populationShare: string;
  note: string;
}

export interface BloodComponentStory {
  id: "red-cells" | "plasma" | "platelets";
  title: string;
  subtitle: string;
  color: string;
  storageTemp: string;
  volumePerUnitMl: number;
  hematocritShare: string;
  shelfLife: string;
  useCase: string;
  description: string;
}

export const BLOOD_GROUPS: BloodGroup[] = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

export const COMPATIBILITY_MAP: Record<BloodGroup, CompatibilityInfo> = {
  "O-": {
    group: "O-",
    donateRedCellsTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-"],
    plasmaDonateTo: ["O-", "O+"],
    populationShare: "6.6%",
    note: "Universal red-cell donor — deployed immediately in Level-1 trauma before cross-matching completes.",
  },
  "O+": {
    group: "O+",
    donateRedCellsTo: ["O+", "A+", "B+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+"],
    plasmaDonateTo: ["O-", "O+"],
    populationShare: "37.4%",
    note: "Highest daily clinical volume across obstetric hemorrhage, trauma resuscitation, and surgery.",
  },
  "A-": {
    group: "A-",
    donateRedCellsTo: ["A-", "A+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "A-"],
    plasmaDonateTo: ["O-", "O+", "A-", "A+"],
    populationShare: "6.3%",
    note: "Critical Rh-negative reserve supporting both A and AB surgical and oncology recipients.",
  },
  "A+": {
    group: "A+",
    donateRedCellsTo: ["A+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+", "A-", "A+"],
    plasmaDonateTo: ["O-", "O+", "A-", "A+"],
    populationShare: "22.8%",
    note: "High demand for both leukoreduced red blood cells and single-donor apheresis platelets.",
  },
  "B-": {
    group: "B-",
    donateRedCellsTo: ["B-", "B+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "B-"],
    plasmaDonateTo: ["O-", "O+", "B-", "B+"],
    populationShare: "1.5%",
    note: "Scarce Rh-negative phenotype requiring proactive regional registry coordination.",
  },
  "B+": {
    group: "B+",
    donateRedCellsTo: ["B+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+", "B-", "B+"],
    plasmaDonateTo: ["O-", "O+", "B-", "B+"],
    populationShare: "18.5%",
    note: "Core inventory across cardiothoracic, orthopedic, and thalassemia transfusion centers.",
  },
  "AB-": {
    group: "AB-",
    donateRedCellsTo: ["AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "A-", "B-", "AB-"],
    plasmaDonateTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    populationShare: "0.6%",
    note: "Rarest phenotype and universal Fresh Frozen Plasma (FFP) donor for all blood groups.",
  },
  "AB+": {
    group: "AB+",
    donateRedCellsTo: ["AB+"],
    receiveRedCellsFrom: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    plasmaDonateTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    populationShare: "6.3%",
    note: "Universal red-cell recipient and universal plasma donor for burn and shock resuscitation.",
  },
};

export const DONOR_PROFILES: DonorProfile[] = [
  {
    id: "BL-8841",
    name: "Dr. Aarav Nair",
    group: "O-",
    location: "Indiranagar, Bengaluru",
    city: "Bengaluru",
    distanceKm: 1.8,
    availability: "Available Now",
    donationsLogged: 11,
    lastDonated: "118 days ago",
    hemoglobin: "15.1 g/dL",
    verifiedBy: "Rotary TTK Blood Centre",
    responseWindow: "18 min ETA",
  },
  {
    id: "BL-7290",
    name: "Meera Krishnan",
    group: "A+",
    location: "Koramangala 4th Block, Bengaluru",
    city: "Bengaluru",
    distanceKm: 3.1,
    availability: "Available Now",
    donationsLogged: 6,
    lastDonated: "96 days ago",
    hemoglobin: "13.8 g/dL",
    verifiedBy: "Manipal Transfusion Desk",
    responseWindow: "24 min ETA",
  },
  {
    id: "BL-6514",
    name: "Siddharth Iyer",
    group: "O+",
    location: "Jayanagar 3rd Block, Bengaluru",
    city: "Bengaluru",
    distanceKm: 4.4,
    availability: "On-Call (< 45 min)",
    donationsLogged: 9,
    lastDonated: "132 days ago",
    hemoglobin: "14.9 g/dL",
    verifiedBy: "Narayana Health Blood Bank",
    responseWindow: "32 min ETA",
  },
  {
    id: "BL-9102",
    name: "Rohan Deshmukh",
    group: "B+",
    location: "Bandra West, Mumbai",
    city: "Mumbai",
    distanceKm: 2.3,
    availability: "Available Now",
    donationsLogged: 8,
    lastDonated: "105 days ago",
    hemoglobin: "14.5 g/dL",
    verifiedBy: "Tata Memorial Blood Bank",
    responseWindow: "20 min ETA",
  },
  {
    id: "BL-5408",
    name: "Zoya Merchant",
    group: "A-",
    location: "Andheri West, Mumbai",
    city: "Mumbai",
    distanceKm: 2.9,
    availability: "Available Now",
    donationsLogged: 5,
    lastDonated: "140 days ago",
    hemoglobin: "13.6 g/dL",
    verifiedBy: "Kokilaben Transfusion Lab",
    responseWindow: "22 min ETA",
  },
  {
    id: "BL-3917",
    name: "Ananya Reddy",
    group: "B-",
    location: "Banjara Hills, Hyderabad",
    city: "Hyderabad",
    distanceKm: 1.9,
    availability: "Available Now",
    donationsLogged: 12,
    lastDonated: "109 days ago",
    hemoglobin: "14.1 g/dL",
    verifiedBy: "Apollo Central Blood Bank",
    responseWindow: "19 min ETA",
  },
  {
    id: "BL-4723",
    name: "Kabir Malhotra",
    group: "AB-",
    location: "Hauz Khas, New Delhi",
    city: "Delhi",
    distanceKm: 3.5,
    availability: "On-Call (< 45 min)",
    donationsLogged: 7,
    lastDonated: "121 days ago",
    hemoglobin: "15.3 g/dL",
    verifiedBy: "IRCS National Blood Centre",
    responseWindow: "28 min ETA",
  },
  {
    id: "BL-8036",
    name: "Nandini Rao",
    group: "AB+",
    location: "Whitefield, Bengaluru",
    city: "Bengaluru",
    distanceKm: 5.2,
    availability: "Available Now",
    donationsLogged: 4,
    lastDonated: "94 days ago",
    hemoglobin: "13.9 g/dL",
    verifiedBy: "Manipal Transfusion Desk",
    responseWindow: "26 min ETA",
  },
  {
    id: "BL-9410",
    name: "Capt. Vikram Rathore",
    group: "O-",
    location: "Connaught Place, New Delhi",
    city: "Delhi",
    distanceKm: 2.1,
    availability: "Available Now",
    donationsLogged: 15,
    lastDonated: "102 days ago",
    hemoglobin: "15.6 g/dL",
    verifiedBy: "AIIMS Trauma Blood Centre",
    responseWindow: "16 min ETA",
  },
  {
    id: "BL-6190",
    name: "Arjun Menon",
    group: "O+",
    location: "Adyar, Chennai",
    city: "Chennai",
    distanceKm: 2.7,
    availability: "Available Now",
    donationsLogged: 10,
    lastDonated: "112 days ago",
    hemoglobin: "14.8 g/dL",
    verifiedBy: "Apollo Greams Transfusion Hub",
    responseWindow: "21 min ETA",
  },
];

export const INITIAL_URGENT_REQUESTS: BloodRequest[] = [
  {
    id: "REQ-2049",
    group: "O-",
    units: "3 Units",
    hospital: "Manipal Hospital — Level-1 Trauma ICU",
    department: "Emergency Trauma & Neuro Resuscitation",
    area: "Old Airport Road",
    city: "Bengaluru",
    need: "Acute hemorrhage protocol (Hb < 6.8 g/dL)",
    scenario: "Emergency Trauma",
    priority: "Critical",
    updatedLabel: "Verified 6m ago",
    componentNeeded: "Packed Red Cells (PRBC)",
    crossMatchNote: "Immediate spin cross-match active",
    attendingDesk: "Dr. S. Kulkarni · Ext 4402",
  },
  {
    id: "REQ-2053",
    group: "A+",
    units: "2 Units",
    hospital: "Kokilaben Dhirubhai Ambani Hospital",
    department: "Hemato-Oncology & Stem Cell Unit",
    area: "Andheri West",
    city: "Mumbai",
    need: "Platelet count < 18,000/µL post-chemo",
    scenario: "Critical Care",
    priority: "Urgent",
    updatedLabel: "Verified 14m ago",
    componentNeeded: "Single-Donor Platelets (SDP)",
    crossMatchNote: "Apheresis cell separator reserved",
    attendingDesk: "Transfusion Officer · Ext 2190",
  },
  {
    id: "REQ-2058",
    group: "B-",
    units: "4 Units",
    hospital: "Apollo Health City — Cardiothoracic Wing",
    department: "Cardiothoracic & Vascular Surgery",
    area: "Jubilee Hills",
    city: "Hyderabad",
    need: "Aortic arch reconstruction bypass reserve",
    scenario: "Planned Surgery",
    priority: "Urgent",
    updatedLabel: "Verified 22m ago",
    componentNeeded: "Leukoreduced Red Cells",
    crossMatchNote: "Antibody screen negative · Rh-Kell matched",
    attendingDesk: "OT Blood Bank Desk · Ext 3088",
  },
  {
    id: "REQ-2064",
    group: "AB+",
    units: "3 Units",
    hospital: "AIIMS JPN Apex Trauma Centre",
    department: "Surgical Intensive Care Unit",
    area: "Ring Road",
    city: "Delhi",
    need: "Coagulopathy & fibrinogen replacement",
    scenario: "Critical Care",
    priority: "Priority",
    updatedLabel: "Verified 29m ago",
    componentNeeded: "Fresh Frozen Plasma (FFP)",
    crossMatchNote: "37°C plasma thawing bath ready",
    attendingDesk: "Duty CMO · Ext 1109",
  },
  {
    id: "REQ-2071",
    group: "O+",
    units: "2 Units",
    hospital: "Narayana Institute of Cardiac Sciences",
    department: "Pediatric Cardiac ICU",
    area: "Bommasandra",
    city: "Bengaluru",
    need: "Neonatal cardiopulmonary bypass priming",
    scenario: "Planned Surgery",
    priority: "Urgent",
    updatedLabel: "Verified 11m ago",
    componentNeeded: "Irradiated Packed Red Cells",
    crossMatchNote: "CMV-negative (< 5 days old)",
    attendingDesk: "Pediatric Perfusion · Ext 5510",
  },
];

export const BLOOD_BANKS: NetworkPartner[] = [
  {
    id: "NET-01",
    name: "Rotary TTK Blood Centre — BMST",
    type: "Blood bank",
    city: "Bengaluru",
    area: "New Thippasandra",
    address: "HAL 3rd Stage, New Thippasandra, Bengaluru",
    hours: "24/7 Component & Apheresis Lab",
    licenseId: "NABH · KAR/BB/018",
    emergencyPhone: "+91 80 2528 7903",
    distanceKm: 2.1,
    services: ["Platelet apheresis", "NAT-tested PRBC", "Cryoprecipitate"],
    coords: [-0.82, 0.36],
    inventory: { "O-": 6, "O+": 28, "A-": 5, "A+": 22, "B-": 4, "B+": 25, "AB-": 3, "AB+": 14 },
    plateletsUnits: 18,
    plasmaUnits: 42,
  },
  {
    id: "NET-02",
    name: "Manipal Hospital Transfusion Medicine",
    type: "Hospital partner",
    city: "Bengaluru",
    area: "Old Airport Road",
    address: "98 HAL Old Airport Road, Bengaluru",
    hours: "24/7 Level-1 Trauma Blood Desk",
    licenseId: "NABH · KAR/HT/004",
    emergencyPhone: "+91 80 2502 4444",
    distanceKm: 3.4,
    services: ["24/7 cross-matching", "Uncrossed O- trauma release", "Leukoreduction"],
    coords: [-0.36, -0.44],
    inventory: { "O-": 4, "O+": 31, "A-": 6, "A+": 19, "B-": 3, "B+": 21, "AB-": 2, "AB+": 11 },
    plateletsUnits: 14,
    plasmaUnits: 36,
  },
  {
    id: "NET-03",
    name: "Tata Memorial & Parel Regional Blood Centre",
    type: "Blood bank",
    city: "Mumbai",
    area: "Parel",
    address: "Dr. E Borges Road, Parel, Mumbai",
    hours: "24/7 Oncology & Apheresis Suite",
    licenseId: "NABH · MAH/BB/112",
    emergencyPhone: "+91 22 2417 7000",
    distanceKm: 4.0,
    services: ["Single-donor platelets", "Gamma irradiation", "HLA-matched registry"],
    coords: [0.64, 0.54],
    inventory: { "O-": 8, "O+": 34, "A-": 7, "A+": 29, "B-": 5, "B+": 27, "AB-": 4, "AB+": 16 },
    plateletsUnits: 26,
    plasmaUnits: 54,
  },
  {
    id: "NET-04",
    name: "Apollo Health City Central Blood Bank",
    type: "Hospital partner",
    city: "Hyderabad",
    area: "Jubilee Hills",
    address: "Road No. 72, Film Nagar, Jubilee Hills, Hyderabad",
    hours: "24/7 Critical Care & Transplant Desk",
    licenseId: "NABH · TEL/HT/049",
    emergencyPhone: "+91 40 2360 7777",
    distanceKm: 2.8,
    services: ["Single-donor platelets", "Pediatric aliquots", "Cryo-storage"],
    coords: [-0.08, 0.78],
    inventory: { "O-": 5, "O+": 26, "A-": 4, "A+": 24, "B-": 6, "B+": 22, "AB-": 3, "AB+": 12 },
    plateletsUnits: 19,
    plasmaUnits: 38,
  },
  {
    id: "NET-05",
    name: "IRCS National Headquarters Blood Centre",
    type: "Blood bank",
    city: "Delhi",
    area: "Connaught Place",
    address: "1 Red Cross Road, Sansad Marg, New Delhi",
    hours: "24/7 National Rare Phenotype Hub",
    licenseId: "NACO · DL/BB/001",
    emergencyPhone: "+91 11 2371 1551",
    distanceKm: 3.2,
    services: ["Rare Rh-negative bank", "NAT nucleic testing", "3D cold-chain dispatch"],
    coords: [0.46, -0.64],
    inventory: { "O-": 11, "O+": 39, "A-": 8, "A+": 31, "B-": 7, "B+": 33, "AB-": 5, "AB+": 19 },
    plateletsUnits: 22,
    plasmaUnits: 60,
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
    title: "Packed Red Blood Cells (PRBC)",
    subtitle: "OXYGEN TRANSPORT · 45% HEMATOCRIT",
    color: "#ff4d6d",
    storageTemp: "2°C to 6°C (SAG-M additive)",
    volumePerUnitMl: 220,
    hematocritShare: "45%",
    shelfLife: "42 days at 2–6°C",
    useCase: "Emergency trauma, major surgeries & severe anaemia",
    description:
      "Centrifuged biconcave erythrocytes suspended in SAG-M solution rapidly restore tissue oxygenation during acute hemorrhage, surgery, and thalassemia care.",
  },
  {
    id: "plasma",
    title: "Fresh Frozen Plasma (FFP)",
    subtitle: "COAGULATION FACTORS · 54% VOLUME",
    color: "#fbbf24",
    storageTemp: "-30°C or below (rapid blast-frozen)",
    volumePerUnitMl: 180,
    hematocritShare: "54%",
    shelfLife: "12 months at -30°C",
    useCase: "Coagulation support, burn care & shock recovery",
    description:
      "Protein-rich golden plasma retains labile clotting factors V and VIII, fibrinogen, and albumin for massive transfusion protocols and burn shock.",
  },
  {
    id: "platelets",
    title: "Platelet Concentrate (RDP / SDP)",
    subtitle: "PRIMARY HEMOSTASIS · < 1% BUFFY COAT",
    color: "#34d399",
    storageTemp: "20°C to 24°C (continuous agitation)",
    volumePerUnitMl: 50,
    hematocritShare: "1%",
    shelfLife: "5 days (continuous agitation)",
    useCase: "Cancer care, dengue recovery & organ transplants",
    description:
      "Metabolically active thrombocytes aggregate at vascular injury sites within seconds. Their 5-day shelf life requires continuous live donor coordination.",
  },
];
