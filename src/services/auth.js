import { db, persistDb } from './mockDb';

// Demo-only credential check. Roles are always re-read from the stored account
// record, never taken from the client session payload.
export async function authenticate(email, password) {
  const account = db.admins.find((user) => user.active && user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password);
  if (!account) throw new Error('Email or password is incorrect, or this account is inactive.');
  return { id: account.id, name: account.name, email: account.email };
}

export function currentAccount() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('echallan_session'));
    const account = db.admins.find((user) => user.id === saved?.id && user.active);
    return account ? { id: account.id, name: account.name, email: account.email, role: account.role, designation: account.designation } : null;
  } catch { return null; }
}

export function requireRole(...roles) {
  const account = currentAccount();
  if (!account || !roles.includes(account.role)) {
    throw new Error('You do not have permission to perform this action.');
  }
  return account;
}

export function signOut() { sessionStorage.removeItem('echallan_session'); }
export function uniqueId(prefix) {
  const random = globalThis.crypto?.randomUUID?.().replaceAll('-', '') || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${random}`;
}
export function addAudit(actor, action, target, metadata = {}) {
  db.audit.unshift({ id: uniqueId('AUD'), actor: actor || 'System', action, target, at: new Date().toISOString(), ...metadata });
  persistDb();
}
export function addNotification(message, audience = 'all') {
  db.notifications.unshift({ id: uniqueId('NTF'), message, audience, at: new Date().toISOString(), read: false });
  persistDb();
}
