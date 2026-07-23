// Static data for the booking forms — pricing tables (from the real ICM
// Facility Booking Form), province list, and Iman Academy programs.

export type PricedItem = {
  key: string;
  label: string;
  price: number;      // per-unit price in CAD
  note?: string;
};

export type FacilitySpace = {
  key: string;
  label: string;
  capacity?: number;
  base: number;       // base rental
  mandatory: number;  // mandatory add-on (cleaning fee / security deposit)
  mandatoryNote?: string;
  included: string;   // what the space includes
};

// "Requested Facility/Facilities" — user picks one or more.
export const FACILITY_SPACES: FacilitySpace[] = [
  {
    key: 'hall1',
    label: 'Hall 1',
    capacity: 140,
    base: 500,
    mandatory: 125,
    mandatoryNote: 'Cleaning fee',
    included: '140 chairs · 17 round tables · 8 serving tables (+ covers)',
  },
  {
    key: 'hall3',
    label: 'Hall 3',
    capacity: 300,
    base: 700,
    mandatory: 200,
    mandatoryNote: 'Cleaning fee',
    included: '200 chairs · 25 round tables · stage · middle partition · 8 serving tables (+ covers)',
  },
  {
    key: 'kitchen',
    label: 'Kitchen Area',
    base: 50,
    mandatory: 0,
    included: 'Use of the kitchen area',
  },
  {
    key: 'sound',
    label: 'Sound System & Podium',
    base: 150,
    mandatory: 200,
    mandatoryNote: 'Security deposit',
    included: '1 wired microphone',
  },
];

// "Event Requirements" — optional services, each with a quantity.
export const OPTIONAL_SERVICES: PricedItem[] = [
  { key: 'plasticCovers', label: 'Plastic table covers', price: 2.5 },
  { key: 'clothCovers', label: 'Cloth table covers (white)', price: 7.5 },
  { key: 'chairCoversNoSetup', label: 'Chair covers (no set-up)', price: 1.5 },
  { key: 'chairCoversSetup', label: 'Chair covers (incl. set-up)', price: 2.5 },
  { key: 'stageUnit', label: 'Additional stage unit (4′ × 4′)', price: 25 },
  { key: 'stageBackdrop', label: 'Stage backdrop', price: 200 },
  { key: 'partition', label: 'Additional set of partition (around hall)', price: 200 },
  { key: 'servingTables', label: 'Additional serving tables', price: 10 },
  { key: 'roundTables', label: 'Additional round tables (8 chairs incl.)', price: 10 },
  { key: 'chafingDish', label: 'Chafing dish (incl. 1 fuel can)', price: 25 },
  { key: 'fuelCan', label: 'Additional fuel can', price: 3 },
  { key: 'teaPercolator', label: 'Tea percolator', price: 25 },
];

// "Audio/Video (AV) Requirements" — optional equipment, each with a quantity.
export const AV_SERVICES: PricedItem[] = [
  { key: 'wiredMic', label: 'Additional wired microphone', price: 100 },
  { key: 'wirelessMic', label: 'Wireless microphone (+ $500 security deposit)', price: 200, note: '+ $500 deposit' },
  { key: 'wirelessMicExtra', label: 'Additional wireless microphone', price: 150 },
  { key: 'extraSpeaker', label: 'Extra speaker (on floor)', price: 100 },
  { key: 'tv', label: '75″ TV ×2 with HDMI (no camera/laptop provided)', price: 150 },
  { key: 'techSupport', label: 'Tech support (30 mins on site)', price: 75 },
];

// The full facility price list. Bundled defaults double as the offline
// fallback AND the seed values for the staff-editable "Pricing" tab in the
// Google Sheet (see services/bookingsPricing.ts + the Apps Script).
export type FacilityPricing = {
  spaces: FacilitySpace[];
  optional: PricedItem[];
  av: PricedItem[];
};

export const DEFAULT_FACILITY_PRICING: FacilityPricing = {
  spaces: FACILITY_SPACES,
  optional: OPTIONAL_SERVICES,
  av: AV_SERVICES,
};

export const PROVINCES = [
  'Ontario', 'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Nova Scotia', 'Prince Edward Island', 'Quebec',
  'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon',
];

// Iman Academy programs (from daruliman.org). Field intake for enrollment is
// not yet confirmed with the academy — treat this list as a reasonable default.
export const PROGRAMS = [
  'Adult Quran Tajweed',
  'Full-Time Hifz',
  'Part-Time Hifz',
  'Evening Madrasa',
  'Sunday School',
  'Summer Camp',
  'Seniors Tajweed & Tafseer',
];

// Key facility policies surfaced in-app so they aren't a surprise at booking.
export const FACILITY_POLICIES = [
  'Bookings run until 10:30 PM. After that, $50/hr applies.',
  'A $500 refundable security deposit is required (against damage/overtime).',
  'Cancelling within 2 weeks of the event incurs a $150 fee.',
  'Islamic dress code and conduct apply; brothers and sisters seated separately.',
  'Full payment is due at the time of booking.',
];

// External systems the app links out to (not rebuilt in-app).
export const SPORTS_SKEDDA_URL = 'https://mdisports.skedda.com/booking';
export const COUNSELLING_URL = 'https://www.happystrongfamily.com/';
export const DONATE_URL = 'https://app.irm.io/daruliman.org';

// Funeral coordinator — time-critical, handled by phone (not a form).
export const FUNERAL_PHONE = '+16472334766';
export const FUNERAL_PHONE_DISPLAY = '647-233-4766';
