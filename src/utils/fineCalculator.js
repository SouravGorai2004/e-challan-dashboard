// Pure business logic: no React, no I/O.

export function buildChallanLines(selectedCodes, rules) {
  return selectedCodes
    .map((code) => rules.find((r) => r.code === code))
    .filter(Boolean)
    .map((r) => ({ code: r.code, label: r.label, fine: r.fine }));
}

export function totalFine(lines) {
  return lines.reduce((sum, l) => sum + (Number(l.fine) || 0), 0);
}

// Suggest document-related violations from the vehicle record so the officer
// does not have to cross-check each certificate manually. Officer still decides.
export function suggestDocumentCodes(vehicle) {
  if (!vehicle) return [];
  const codes = [];
  if (vehicle.registrationStatus !== 'Valid') codes.push('INVALID_REGISTRATION');
  if (vehicle.insurance.status === 'Expired') codes.push('EXPIRED_INSURANCE');
  if (vehicle.puc.status === 'Expired') codes.push('EXPIRED_PUC');
  if (vehicle.fitness.status === 'Expired') codes.push('EXPIRED_FITNESS');
  if ([vehicle.insurance, vehicle.puc, vehicle.fitness].some((d) => d.status === 'Missing')) {
    codes.push('MISSING_DOCUMENTS');
  }
  return codes;
}

let seq = 4502;
export function nextChallanId() {
  seq += 1;
  return `CH-2026-${String(seq).padStart(6, '0')}`;
}
