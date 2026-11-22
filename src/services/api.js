import { USE_MOCK_API } from '../data/config';
import { http } from './httpClient';
import { db, delay } from './mockDb';
import { nextChallanId, buildChallanLines, totalFine } from '../utils/fineCalculator';
import { CURRENT_OFFICER } from '../data/config';

// Each function below has a mock implementation and the REST endpoint the
// Spring Boot backend is expected to expose. Components never call fetch directly.

const mock = {
  // ---- Detections ----
  getDetections: () => delay(db.detections),
  getDetection: (id) => delay(db.detections.find((d) => d.id === id) || null),

  // ---- Vehicles ----
  getVehicles: () => delay(db.vehicles),
  getVehicle: (regNo) =>
    delay(db.vehicles.find((v) => v.registrationNumber.replace(/\s/g, '') === regNo.replace(/\s/g, '')) || null),

  // ---- Penalty rules ----
  getPenaltyRules: () => delay(db.penaltyRules, 150),
  updatePenaltyRules: (rules) => {
    db.penaltyRules = structuredClone(rules);
    return delay(db.penaltyRules, 150);
  },

  // ---- Challans ----
  getChallans: () => delay(db.challans),
  createChallan: ({ detectionId, vehicle, codes }) => {
    const lines = buildChallanLines(codes, db.penaltyRules);
    const challan = {
      id: nextChallanId(),
      detectionId,
      vehicleNumber: vehicle.registrationNumber,
      ownerName: vehicle.ownerName,
      violations: lines,
      fineAmount: totalFine(lines),
      officer: CURRENT_OFFICER.name,
      generatedAt: new Date().toISOString(),
      paymentStatus: 'Unpaid',
      status: 'Issued',
      demoValues: true,
    };
    db.challans.unshift(challan);
    return delay(challan, 600);
  },
  updateChallanStatus: (id, status, reason) => {
    const c = db.challans.find((x) => x.id === id);
    if (c) { c.status = status; if (reason) c.statusReason = reason; }
    return delay(c);
  },

  // ---- Verification ----
  recordVerification: ({ detection, action, reason, challanId }) => {
    const d = db.detections.find((x) => x.id === detection.id);
    const statusMap = { Approved: 'Approved', Rejected: 'Rejected', 'Sent for Review': 'Under Review' };
    if (d) d.status = statusMap[action];
    const entry = {
      id: `VH-${9002 + db.history.length}`,
      detectionId: detection.id,
      vehicleNumber: detection.detectedRegNo,
      action,
      officer: CURRENT_OFFICER.name,
      at: new Date().toISOString(),
      reason: reason || '',
      challanId: challanId || null,
    };
    db.history.unshift(entry);
    return delay(entry, 300);
  },
  getHistory: () => delay(db.history),

  // ---- Complaints ----
  getComplaints: () => delay(db.complaints),
  updateComplaint: (id, patch) => {
    const c = db.complaints.find((x) => x.id === id);
    if (!c) return delay(null);
    if (patch.status) c.status = patch.status;
    if (patch.resolution !== undefined) c.resolution = patch.resolution;
    if (patch.remark) c.remarks.push({ officer: CURRENT_OFFICER.name, at: new Date().toISOString(), text: patch.remark });
    return delay(c, 300);
  },
};

const rest = {
  getDetections: () => http.get('/detections'),
  getDetection: (id) => http.get(`/detections/${id}`),
  getVehicles: () => http.get('/vehicles'),
  getVehicle: (regNo) => http.get(`/vehicles/${encodeURIComponent(regNo)}`),
  getPenaltyRules: () => http.get('/penalty-rules'),
  updatePenaltyRules: (rules) => http.put('/penalty-rules', rules),
  getChallans: () => http.get('/challans'),
  createChallan: (payload) => http.post('/challans', payload),
  updateChallanStatus: (id, status, reason) => http.patch(`/challans/${id}/status`, { status, reason }),
  recordVerification: (payload) => http.post(`/detections/${payload.detection.id}/verification`, payload),
  getHistory: () => http.get('/verification-history'),
  getComplaints: () => http.get('/complaints'),
  updateComplaint: (id, patch) => http.patch(`/complaints/${id}`, patch),
};

export const api = USE_MOCK_API ? mock : rest;
