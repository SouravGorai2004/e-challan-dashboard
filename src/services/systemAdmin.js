import { addAudit, addNotification, requireRole } from './auth';
import { db, persistDb, resetDemoData } from './mockDb';

export function setSystemSetting(key, value) {
  const actor = requireRole('super-admin');
  if (!['maintenanceMode', 'paymentSimulation'].includes(key)) throw new Error('This system setting cannot be changed here.');
  const previous = db.settings[key];
  db.settings[key] = value;
  addAudit(actor.name, `Changed system setting ${key}`, 'system', { previous, next: value, reason: 'Super Admin system settings change' });
  addNotification(`System setting ${key} was updated.`, 'super-admin');
  persistDb();
}

export function resetSystemDemoData() {
  requireRole('super-admin');
  resetDemoData();
}
