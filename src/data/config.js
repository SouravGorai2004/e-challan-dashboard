// Central, easily-editable configuration.

// Path to the CCTV evidence video supplied by the department.
// Place the file in /public/videos/ and update this path if the name differs.
export const VIDEO_SRC = '/videos/cctv-evidence.mp4';

// Switch to false once a real backend is available (see services/api.js).
export const USE_MOCK_API = true;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Simulated network latency (ms) for mock services, so loading states are exercised.
export const MOCK_LATENCY = 350;

export const CURRENT_OFFICER = {
  id: 'OFF-1042',
  name: 'R. K. Sharma',
  designation: 'Motor Vehicle Inspector',
  office: 'Regional Transport Office, Zone 3',
};

// ------------------------------------------------------------------
// DEMO penalty schedule.
// These are placeholder values for demonstration only and are NOT the
// official penalty amounts. Replace by loading from the penalty-rules
// API once the applicable statutory schedule is integrated.
// ------------------------------------------------------------------
export const DEFAULT_PENALTY_RULES = [
  { code: 'OVER_SPEEDING', label: 'Over Speeding', group: 'traffic', fine: 1000 },
  { code: 'NO_HELMET', label: 'No Helmet', group: 'traffic', fine: 500 },
  { code: 'TRIPLE_RIDING', label: 'Triple Riding', group: 'traffic', fine: 500 },
  { code: 'NO_SEATBELT', label: 'No Seatbelt', group: 'traffic', fine: 500 },
  { code: 'MOBILE_PHONE', label: 'Using Mobile Phone While Driving', group: 'traffic', fine: 1000 },
  { code: 'WRONG_SIDE', label: 'Wrong-Side Driving', group: 'traffic', fine: 1000 },
  { code: 'SIGNAL_VIOLATION', label: 'Signal Violation', group: 'traffic', fine: 1000 },
  { code: 'OTHER', label: 'Other Applicable Violation', group: 'traffic', fine: 500 },
  { code: 'EXPIRED_INSURANCE', label: 'Expired Insurance', group: 'document', fine: 2000 },
  { code: 'EXPIRED_PUC', label: 'Expired PUC Certificate', group: 'document', fine: 1000 },
  { code: 'INVALID_REGISTRATION', label: 'Invalid Registration', group: 'document', fine: 2000 },
  { code: 'EXPIRED_FITNESS', label: 'Expired Fitness Certificate', group: 'document', fine: 1000 },
  { code: 'MISSING_DOCUMENTS', label: 'Missing Required Documents', group: 'document', fine: 500 },
];
