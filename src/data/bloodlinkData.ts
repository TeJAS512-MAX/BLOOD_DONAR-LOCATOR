export type BloodGroup = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";

export interface DonorProfile {
  id: string;
  name: string;
  group: BloodGroup;
  location: string;
  city: string;
  distanceKm: number;
  availability: "Available Immediately" | "On-Call (< 45 min)" | "Scheduled Window";
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
  distanceKm: number;
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

export interface CompatibilityInfo {
  group: BloodGroup;
  donateRedCellsTo: BloodGroup[];
  receiveRedCellsFrom: BloodGroup[];
}

export const BLOOD_GROUPS: BloodGroup[] = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

export const COMPATIBILITY_MAP: Record<BloodGroup, CompatibilityInfo> = {
  "O-": {
    group: "O-",
    donateRedCellsTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-"],
  },
  "O+": {
    group: "O+",
    donateRedCellsTo: ["O+", "A+", "B+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+"],
  },
  "A-": {
    group: "A-",
    donateRedCellsTo: ["A-", "A+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "A-"],
  },
  "A+": {
    group: "A+",
    donateRedCellsTo: ["A+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+", "A-", "A+"],
  },
  "B-": {
    group: "B-",
    donateRedCellsTo: ["B-", "B+", "AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "B-"],
  },
  "B+": {
    group: "B+",
    donateRedCellsTo: ["B+", "AB+"],
    receiveRedCellsFrom: ["O-", "O+", "B-", "B+"],
  },
  "AB-": {
    group: "AB-",
    donateRedCellsTo: ["AB-", "AB+"],
    receiveRedCellsFrom: ["O-", "A-", "B-", "AB-"],
  },
  "AB+": {
    group: "AB+",
    donateRedCellsTo: ["AB+"],
    receiveRedCellsFrom: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
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
    availability: "Available Immediately",
    verifiedBy: "Bengaluru Regional Blood Centre",
    responseWindow: "18 min ETA",
  },
  {
    id: "BL-7290",
    name: "Meera Krishnan",
    group: "A+",
    location: "Koramangala 4th Block, Bengaluru",
    city: "Bengaluru",
    distanceKm: 3.1,
    availability: "Available Immediately",
    verifiedBy: "Southern Regional Trauma Blood Bank",
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
    verifiedBy: "Metropolitan Cardiac Institute Blood Bank",
    responseWindow: "32 min ETA",
  },
  {
    id: "BL-9102",
    name: "Rohan Deshmukh",
    group: "B+",
    location: "Bandra West, Mumbai",
    city: "Mumbai",
    distanceKm: 2.3,
    availability: "Available Immediately",
    verifiedBy: "Western Regional Blood Centre",
    responseWindow: "20 min ETA",
  },
  {
    id: "BL-5408",
    name: "Zoya Merchant",
    group: "A-",
    location: "Andheri West, Mumbai",
    city: "Mumbai",
    distanceKm: 2.9,
    availability: "Available Immediately",
    verifiedBy: "Western Metropolitan Hospital Blood Bank",
    responseWindow: "22 min ETA",
  },
  {
    id: "BL-3917",
    name: "Ananya Reddy",
    group: "B-",
    location: "Banjara Hills, Hyderabad",
    city: "Hyderabad",
    distanceKm: 1.9,
    availability: "Available Immediately",
    verifiedBy: "Deccan Central Hospital Blood Bank",
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
    verifiedBy: "National Capital Regional Blood Centre",
    responseWindow: "28 min ETA",
  },
  {
    id: "BL-8036",
    name: "Nandini Rao",
    group: "AB+",
    location: "Whitefield, Bengaluru",
    city: "Bengaluru",
    distanceKm: 5.2,
    availability: "Available Immediately",
    verifiedBy: "Southern Regional Trauma Blood Bank",
    responseWindow: "26 min ETA",
  },
  {
    id: "BL-9410",
    name: "Vikram Rathore",
    group: "O-",
    location: "Connaught Place, New Delhi",
    city: "Delhi",
    distanceKm: 2.1,
    availability: "Available Immediately",
    verifiedBy: "Northern Apex Trauma Blood Centre",
    responseWindow: "16 min ETA",
  },
  {
    id: "BL-6190",
    name: "Arjun Menon",
    group: "O+",
    location: "Adyar, Chennai",
    city: "Chennai",
    distanceKm: 2.7,
    availability: "Available Immediately",
    verifiedBy: "Coastal Regional Transfusion Centre",
    responseWindow: "21 min ETA",
  },
];

export const INITIAL_URGENT_REQUESTS: BloodRequest[] = [
  {
    id: "REQ-2049",
    group: "O-",
    units: "3 Units",
    hospital: "Southern Regional Trauma Centre — Level-1 ICU",
    department: "Emergency Trauma & Neuro Resuscitation",
    area: "Old Airport Road",
    city: "Bengaluru",
    need: "Acute haemorrhage resuscitation protocol",
    scenario: "Emergency Trauma",
    priority: "Critical",
    updatedLabel: "Verified 6m ago",
    componentNeeded: "Packed Red Cells (PRBC)",
    crossMatchNote: "Immediate spin cross-match active",
    attendingDesk: "Emergency Transfusion Desk",
  },
  {
    id: "REQ-2053",
    group: "A+",
    units: "2 Units",
    hospital: "Western Metropolitan Medical Centre",
    department: "Hemato-Oncology & Stem Cell Unit",
    area: "Andheri West",
    city: "Mumbai",
    need: "Post-chemotherapy severe thrombocytopenia support",
    scenario: "Critical Care",
    priority: "Urgent",
    updatedLabel: "Verified 14m ago",
    componentNeeded: "Single-Donor Platelets (SDP)",
    crossMatchNote: "Apheresis cell separator reserved",
    attendingDesk: "Oncology Blood Bank Officer",
  },
  {
    id: "REQ-2058",
    group: "B-",
    units: "4 Units",
    hospital: "Deccan Central Hospital — Cardiothoracic Wing",
    department: "Cardiothoracic & Vascular Surgery",
    area: "Jubilee Hills",
    city: "Hyderabad",
    need: "Cardiopulmonary surgical standby reserve",
    scenario: "Planned Surgery",
    priority: "Urgent",
    updatedLabel: "Verified 22m ago",
    componentNeeded: "Leukoreduced Red Cells",
    crossMatchNote: "Antibody screen negative · Rh-Kell matched",
    attendingDesk: "Surgical Blood Bank Desk",
  },
  {
    id: "REQ-2064",
    group: "AB+",
    units: "3 Units",
    hospital: "Northern Apex Trauma & Critical Care Centre",
    department: "Surgical Intensive Care Unit",
    area: "Ring Road",
    city: "Delhi",
    need: "Coagulopathy & fibrinogen replacement",
    scenario: "Critical Care",
    priority: "Priority",
    updatedLabel: "Verified 29m ago",
    componentNeeded: "Fresh Frozen Plasma (FFP)",
    crossMatchNote: "ABO-compatible plasma thawing in progress",
    attendingDesk: "Critical Care Transfusion Officer",
  },
  {
    id: "REQ-2071",
    group: "O+",
    units: "2 Units",
    hospital: "Metropolitan Institute of Cardiac Sciences",
    department: "Pediatric Cardiac ICU",
    area: "Bommasandra",
    city: "Bengaluru",
    need: "Neonatal cardiopulmonary bypass priming",
    scenario: "Planned Surgery",
    priority: "Urgent",
    updatedLabel: "Verified 11m ago",
    componentNeeded: "Irradiated Packed Red Cells",
    crossMatchNote: "Leukoreduced and gamma-irradiated units required",
    attendingDesk: "Paediatric Perfusion Desk",
  },
];

export const BLOOD_BANKS: NetworkPartner[] = [
  {
    id: "NET-01",
    name: "Bengaluru Regional Blood Centre",
    type: "Blood bank",
    city: "Bengaluru",
    area: "New Thippasandra",
    address: "HAL 3rd Stage, New Thippasandra, Bengaluru",
    hours: "24/7 Component & Apheresis Lab",
    distanceKm: 2.1,
    inventory: { "O-": 6, "O+": 28, "A-": 5, "A+": 22, "B-": 4, "B+": 25, "AB-": 3, "AB+": 14 },
    plateletsUnits: 18,
    plasmaUnits: 42,
  },
  {
    id: "NET-02",
    name: "Southern Regional Trauma Centre Blood Bank",
    type: "Hospital partner",
    city: "Bengaluru",
    area: "Old Airport Road",
    address: "Old Airport Road, Bengaluru",
    hours: "24/7 Level-1 Trauma Blood Desk",
    distanceKm: 3.4,
    inventory: { "O-": 4, "O+": 31, "A-": 6, "A+": 19, "B-": 3, "B+": 21, "AB-": 2, "AB+": 11 },
    plateletsUnits: 14,
    plasmaUnits: 36,
  },
  {
    id: "NET-03",
    name: "Western Regional Blood Centre — Parel",
    type: "Blood bank",
    city: "Mumbai",
    area: "Parel",
    address: "Parel Hospital Precinct, Mumbai",
    hours: "24/7 Oncology & Apheresis Suite",
    distanceKm: 4.0,
    inventory: { "O-": 8, "O+": 34, "A-": 7, "A+": 29, "B-": 5, "B+": 27, "AB-": 4, "AB+": 16 },
    plateletsUnits: 26,
    plasmaUnits: 54,
  },
  {
    id: "NET-04",
    name: "Deccan Central Hospital Blood Bank",
    type: "Hospital partner",
    city: "Hyderabad",
    area: "Jubilee Hills",
    address: "Jubilee Hills Medical Precinct, Hyderabad",
    hours: "24/7 Critical Care & Transplant Desk",
    distanceKm: 2.8,
    inventory: { "O-": 5, "O+": 26, "A-": 4, "A+": 24, "B-": 6, "B+": 22, "AB-": 3, "AB+": 12 },
    plateletsUnits: 19,
    plasmaUnits: 38,
  },
  {
    id: "NET-05",
    name: "National Capital Regional Blood Centre",
    type: "Blood bank",
    city: "Delhi",
    area: "Connaught Place",
    address: "Central Medical District, New Delhi",
    hours: "24/7 National Rare Phenotype Hub",
    distanceKm: 3.2,
    inventory: { "O-": 11, "O+": 39, "A-": 8, "A+": 31, "B-": 7, "B+": 33, "AB-": 5, "AB+": 19 },
    plateletsUnits: 22,
    plasmaUnits: 60,
  },
];

export const DONATION_GUIDES: DonationGuide[] = [
  {
    title: "Eligibility Criteria",
    summary: "General medical & age requirements",
    detail:
      "Voluntary donors must be between 18 and 65 years of age, weigh at least 45 kg, and maintain a minimum haemoglobin level of 12.5 g/dL. Prior to collection, a medical officer conducts a confidential screening to confirm that donation is safe for both the donor and the recipient.",
  },
  {
    title: "Pre-Donation Preparation",
    summary: "Nutrition, hydration & identification",
    detail:
      "Consume a balanced meal within three hours prior to your appointment, maintain adequate hydration, ensure sufficient rest, and bring a valid government-issued photo identification document. Do not donate while fasting.",
  },
  {
    title: "Collection Procedure",
    summary: "Registration, screening & sterile collection (~35 min)",
    detail:
      "The process comprises donor registration, a brief clinical assessment (blood pressure, pulse, and haemoglobin check), and whole-blood collection using a sterile, single-use kit lasting 8 to 10 minutes, followed by 15 minutes of supervised rest and refreshments.",
  },
  {
    title: "Recommended Donation Intervals",
    summary: "Minimum recovery periods between donations",
    detail:
      "Under National Blood Transfusion Council (NBTC) guidelines, whole-blood donations require a minimum interval of 90 days for men and 120 days for women. Apheresis platelet and plasma donations follow shorter clinical recovery schedules supervised by the blood centre.",
  },
];

export const MYTHS_AND_FACTS: MythFact[] = [
  {
    myth: "\"Donating blood causes lasting weakness or lowers immunity.\"",
    fact: "Plasma fluid volume is restored within 24 to 48 hours with normal hydration, and red blood cells are replenished by healthy bone marrow within the standard recovery interval.",
  },
  {
    myth: "\"Only rare blood groups such as O− or AB− are required by hospitals.\"",
    fact: "High-prevalence blood groups (O+, A+, and B+) account for the majority of daily hospital transfusions across trauma care, obstetrics, and scheduled surgical procedures.",
  },
  {
    myth: "\"Blood collection poses a risk of equipment-borne infection.\"",
    fact: "Authorized blood centres use sealed, sterile, single-use collection needles and bags that are opened in the donor's presence and discarded immediately after a single use.",
  },
];
