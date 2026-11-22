import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Film, ShieldCheck, ShieldAlert, MessageSquareWarning, ShieldQuestion } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Toast';
import { PageHeader, Card, EmptyState, SearchInput, KV } from '../components/common/ui';
import StatusBadge from '../components/common/StatusBadge';
import { formatDateTime } from '../utils/format';

const norm = (s) => s.replace(/\s/g, '').toUpperCase();
const STATUSES = ['Pending', 'Under Review', 'Resolved', 'Rejected'];

export default function Complaints() {
  const { complaints, vehicles, updateComplaint } = useApp();
  const toast = useToast();

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [remark, setRemark] = useState('');
  const [resolution, setResolution] = useState('');
  const [verified, setVerified] = useState(null); // null | 'found' | 'missing'
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return complaints.filter((c) =>
      (!statusFilter || c.status === statusFilter) &&
      (!term || `${c.id} ${c.citizenName} ${c.vehicleNumber} ${c.category}`.toLowerCase().includes(term)));
  }, [complaints, q, statusFilter]);

  const active = complaints.find((c) => c.id === activeId) || null;

  useEffect(() => { setRemark(''); setResolution(active?.resolution || ''); setVerified(null); }, [activeId]); // eslint-disable-line

  const matchedVehicle = active ? vehicles.find((v) => norm(v.registrationNumber) === norm(active.vehicleNumber)) : null;

  const verifyVehicle = () => setVerified(matchedVehicle ? 'found' : 'missing');

  const run = async (patch, message) => {
    setBusy(true);
    try {
      await updateComplaint(active.id, patch);
      toast(message);
      if (patch.remark) setRemark('');
    } catch (e) {
      toast(e.message || 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const closing = (status) => {
    if (resolution.trim().length < 5) { toast('Enter resolution details first', 'error'); return; }
    run({ status, resolution: resolution.trim() }, `Complaint marked ${status}`);
  };

  return (
    <>
      <PageHeader title="Public Complaints" subtitle="Review citizen-submitted complaints. A complaint never creates a fine by itself." />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', alignItems: 'start' }}>
        <Card flush>
          <div className="filters">
            <SearchInput value={q} onChange={setQ} placeholder="Search ID, citizen, vehicle…" />
            <div className="field">
              <label className="label" htmlFor="c-status">Status</label>
              <select id="c-status" className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {rows.length === 0 ? <EmptyState icon={MessageSquareWarning} title="No complaints found" message="Adjust the search or filter." /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Complaint</th><th>Vehicle</th><th>Category</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className={`clickable ${activeId === c.id ? 'selected' : ''}`} onClick={() => setActiveId(c.id)}>
                      <td><div className="mono small">{c.id}</div><div className="small muted">{c.citizenName} · {formatDateTime(c.submittedAt)}</div></td>
                      <td className="reg">{c.vehicleNumber}</td>
                      <td>{c.category}</td>
                      <td><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {!active ? (
          <Card><EmptyState icon={MessageSquareWarning} title="Select a complaint" message="Choose a complaint from the list to read it in full and record your review." /></Card>
        ) : (
          <Card title={`Complaint ${active.id}`} icon={MessageSquareWarning} action={<StatusBadge status={active.status} />}>
            <div className="kv-2" style={{ marginBottom: 14 }}>
              <KV label="Citizen">{active.citizenName}</KV>
              <KV label="Submitted">{formatDateTime(active.submittedAt)}</KV>
              <KV label="Contact (masked)">{active.contact.phone}<div className="small muted">{active.contact.email}</div></KV>
              <KV label="Category">{active.category}</KV>
              <KV label="Reported Vehicle"><span className="reg">{active.vehicleNumber}</span></KV>
            </div>

            <div className="label">Description</div>
            <p style={{ margin: '0 0 14px', padding: 10, background: '#fafbfc', border: '1px solid var(--border)', borderRadius: 4 }}>{active.description}</p>

            <div className="label">Attached evidence ({active.attachments.length})</div>
            {active.attachments.length === 0 ? (
              <div className="small muted" style={{ marginBottom: 14 }}>No files were attached.</div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {active.attachments.map((a) => (
                  <div key={a.id} className="badge grey" style={{ padding: '8px 10px', fontSize: 12.5 }}>
                    {a.type === 'image' ? <ImageIcon size={14} /> : <Film size={14} />} {a.name}
                  </div>
                ))}
              </div>
            )}
            {active.attachments.length > 0 && <div className="small muted" style={{ margin: '-8px 0 14px' }}>Demo build lists attachment names only; a backend will serve the actual files.</div>}

            <div className="card" style={{ padding: 12, marginBottom: 14, boxShadow: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: 13 }}>Verify reported vehicle</b>
                <button className="btn btn-sm" onClick={verifyVehicle}>Check record</button>
              </div>
              {verified === 'found' && (
                <div className="alert navy" style={{ marginTop: 10 }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                  <div>Record found (demo data): {matchedVehicle.vehicleType}, owner {matchedVehicle.ownerName}. Registration {matchedVehicle.registrationStatus}.</div>
                </div>
              )}
              {verified === 'missing' && (
                <div className="alert red" style={{ marginTop: 10 }}>
                  <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                  <div>No record matches this registration number. The number may be incorrect.</div>
                </div>
              )}
              {verified === null && <div className="small muted" style={{ marginTop: 6 }}><ShieldQuestion size={13} style={{ verticalAlign: -2 }} /> Not yet checked.</div>}
            </div>

            <div className="label">Internal remarks</div>
            {active.remarks.length === 0 ? <div className="small muted" style={{ marginBottom: 8 }}>No remarks yet.</div> : (
              <div style={{ marginBottom: 8 }}>
                {active.remarks.map((r, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                    <div>{r.text}</div><div className="small muted">{r.officer} · {formatDateTime(r.at)}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input className="input" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Add an internal remark…" aria-label="Internal remark" />
              <button className="btn" disabled={!remark.trim() || busy} onClick={() => run({ remark: remark.trim() }, 'Remark added')}>Add</button>
            </div>

            <div className="field">
              <label className="label" htmlFor="resolution">Resolution details</label>
              <textarea id="resolution" className="textarea" value={resolution} onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe the outcome (required to mark Resolved or Rejected)" />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-warn" disabled={busy || active.status === 'Under Review'} onClick={() => run({ status: 'Under Review' }, 'Complaint marked Under Review')}>Mark Under Review</button>
              <button className="btn btn-success" disabled={busy || active.status === 'Resolved'} onClick={() => closing('Resolved')}>Mark Resolved</button>
              <button className="btn btn-danger" disabled={busy || active.status === 'Rejected'} onClick={() => closing('Rejected')}>Reject Complaint</button>
            </div>
            <div className="alert navy" style={{ marginTop: 14 }}>
              Complaints are a lead only. A fine can be issued only after the violation is verified on CCTV in Manual Verification and approved by an officer.
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
