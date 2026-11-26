import { USE_MOCK_API } from '../data/config';
import { http } from './httpClient';
import { db, delay, persistDb } from './mockDb';
import { nextChallanId, buildChallanLines, totalFine } from '../utils/fineCalculator';
import { CURRENT_OFFICER } from '../data/config';
import { requireRole, uniqueId } from './auth';

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
  updatePenaltyRules: (rules, reason) => {
    const actor = requireRole('super-admin');
    if (!reason?.trim()) throw new Error('A reason is required for a configuration change.');
    if (!Array.isArray(rules) || !rules.length || new Set(rules.map((rule) => rule.code)).size !== rules.length || rules.some((rule) => !rule.code?.trim() || !rule.label?.trim() || !Number.isFinite(Number(rule.fine)) || Number(rule.fine) < 0)) {
      throw new Error('Rules need unique codes, names, and non-negative illustrative fines.');
    }
    const previous = structuredClone(db.penaltyRules);
    const version = (db.settings.penaltyRuleVersion || 1) + 1;
    db.penaltyRules = structuredClone(rules).map((rule) => ({ ...rule, version }));
    db.settings.penaltyRuleVersion = version;
    db.audit.unshift({ id: uniqueId('AUD'), actor: actor.name, action: 'Updated traffic rule and fine configuration', target: 'penaltyRules', at: new Date().toISOString(), previous, next: structuredClone(db.penaltyRules), reason: reason.trim() });
    db.notifications.unshift({ id: uniqueId('NTF'), message: `Traffic fine configuration v${version} updated. ${reason.trim()}`, audience: 'all', at: new Date().toISOString(), read: false });
    persistDb();
    return delay(db.penaltyRules, 150);
  },

  // ---- Challans ----
  getChallans: () => delay(db.challans),
  createChallan: ({ detectionId, vehicle, codes, officer }) => {
    const actor = requireRole('admin');
    const lines = buildChallanLines(codes, db.penaltyRules);
    if (!lines.length) throw new Error('Select at least one active violation rule.');
    const version = db.settings.penaltyRuleVersion || 1;
    const ruleSnapshot = lines.map((line) => ({ ...line, configurationVersion: version }));
    const challan = {
      id: nextChallanId(),
      detectionId,
      vehicleNumber: vehicle.registrationNumber,
      ownerName: vehicle.ownerName,
      violations: ruleSnapshot,
      fineAmount: totalFine(ruleSnapshot),
      ruleSnapshot,
      penaltyRuleVersion: version,
      officer: actor.name || officer || CURRENT_OFFICER.name,
      generatedAt: new Date().toISOString(),
      paymentStatus: 'Unpaid',
      status: 'Issued',
      demoValues: true,
    };
    db.challans.unshift(challan);
    persistDb();
    return delay(challan, 600);
  },
  updateChallanStatus: (id, status, reason) => {
    requireRole('admin');
    const c = db.challans.find((x) => x.id === id);
    if (c) { c.status = status; if (reason) c.statusReason = reason; persistDb(); }
    return delay(c);
  },

  // ---- Verification ----
  recordVerification: ({ detection, action, reason, challanId, officer }) => {
    const actor = requireRole('admin');
    const d = db.detections.find((x) => x.id === detection.id);
    const statusMap = { Approved: 'Approved', Rejected: 'Rejected', 'Sent for Review': 'Under Review' };
    if (d) d.status = statusMap[action];
    const entry = {
      id: `VH-${9002 + db.history.length}`,
      detectionId: detection.id,
      vehicleNumber: detection.detectedRegNo,
      action,
      officer: actor.name || officer || CURRENT_OFFICER.name,
      at: new Date().toISOString(),
      reason: reason || '',
      challanId: challanId || null,
    };
    db.history.unshift(entry);
    persistDb();
    return delay(entry, 300);
  },
  getHistory: () => delay(db.history),

  // ---- Complaints ----
  getComplaints: () => delay(db.complaints),
  updateComplaint: (id, patch) => {
    requireRole('admin');
    const c = db.complaints.find((x) => x.id === id);
    if (!c) return delay(null);
    if (patch.status) c.status = patch.status;
    if (patch.resolution !== undefined) c.resolution = patch.resolution;
    if (patch.remark) c.remarks.push({ officer: CURRENT_OFFICER.name, at: new Date().toISOString(), text: patch.remark });
    persistDb();
    return delay(c, 300);
  },
};

const rest = {
  getDetections: () => http.get('/detections'),
  getDetection: (id) => http.get(`/detections/${id}`),
  getVehicles: () => http.get('/vehicles'),
  getVehicle: (regNo) => http.get(`/vehicles/${encodeURIComponent(regNo)}`),
  getPenaltyRules: () => http.get('/penalty-rules'),
  updatePenaltyRules: (rules, reason) => { requireRole('super-admin'); return http.put('/penalty-rules', { rules, reason }); },
  getChallans: () => http.get('/challans'),
  createChallan: (payload) => { requireRole('admin'); return http.post('/challans', payload); },
  updateChallanStatus: (id, status, reason) => { requireRole('admin'); return http.patch(`/challans/${id}/status`, { status, reason }); },
  recordVerification: (payload) => { requireRole('admin'); return http.post(`/detections/${payload.detection.id}/verification`, payload); },
  getHistory: () => http.get('/verification-history'),
  getComplaints: () => http.get('/complaints'),
  updateComplaint: (id, patch) => { requireRole('admin'); return http.patch(`/complaints/${id}`, patch); },
};

export const api = USE_MOCK_API ? mock : rest;
