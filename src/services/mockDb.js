import { MOCK_LATENCY, DEFAULT_PENALTY_RULES } from '../data/config';
import {
  vehicles, detections, challans, complaints, verificationHistorySeed,
} from '../data/mockData';

// In-memory "database" used by mock services. Resets on page refresh.
export const db = {
  vehicles: structuredClone(vehicles),
  detections: structuredClone(detections),
  challans: structuredClone(challans),
  complaints: structuredClone(complaints),
  history: structuredClone(verificationHistorySeed),
  penaltyRules: structuredClone(DEFAULT_PENALTY_RULES),
};

export const delay = (value, ms = MOCK_LATENCY) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
