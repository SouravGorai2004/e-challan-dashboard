import { useMemo, useState } from 'react';
import { Eye, FileText, CheckCircle2, XCircle, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Toast';
import { PageHeader, Card, EmptyState, SearchInput } from '../components/common/ui';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ChallanDocument from '../components/common/ChallanDocument';
import { formatCurrency, formatDate, formatDateTime, isoDay } from '../utils/format';

const STATUSES = ['Issued', 'Pending Approval', 'Closed', 'Cancelled'];

// mode="approvals" → only challans awaiting approval; mode="all" → full management view.
export default function ChallanList({ mode }) {
  const { challans, detections, updateChallanStatus, penaltyRules } = useApp();
  const toast = useToast();
  const approvals = mode === 'approvals';

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState(null);
  const [action, setAction] = useState(null); // { challan, type: 'approve' | 'reject' }
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return challans.filter((c) => {
      if (approvals && c.status !== 'Pending Approval') return false;
      if (status && c.status !== status) return false;
      if (payment && c.paymentStatus !== payment) return false;
      if (category && !c.violations.some((v) => v.code === category)) return false;
      const day = isoDay(c.generatedAt);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (term && !`${c.id} ${c.vehicleNumber} ${c.ownerName} ${c.officer}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [challans, approvals, q, category, status, payment, from, to]);

  const clear = () => { setQ(''); setCategory(''); setStatus(''); setPayment(''); setFrom(''); setTo(''); };

  const runAction = async (reason) => {
    setBusy(true);
    try {
      const approve = action.type === 'approve';
      await updateChallanStatus(action.challan.id, approve ? 'Issued' : 'Cancelled', reason);
      toast(approve ? `Challan ${action.challan.id} approved and issued` : `Challan ${action.challan.id} cancelled`);
      setAction(null);
      setOpen(null);
    } catch (e) {
      toast(e.message || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={approvals ? 'Pending Approvals' : 'Challan Management'}
        subtitle={approvals ? 'Challans waiting for supervisory approval before being issued.' : 'Search, filter and review every challan on record.'}
      />

      <Card flush>
        <div className="filters">
          <SearchInput value={q} onChange={setQ} placeholder="Search challan ID, vehicle, owner, officer…" />
          <div className="field">
            <label className="label" htmlFor="f-cat">Violation</label>
            <select id="f-cat" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All violations</option>
              {penaltyRules.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </div>
          {!approvals && (
            <div className="field">
              <label className="label" htmlFor="f-status">Challan status</label>
              <select id="f-status" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="field">
            <label className="label" htmlFor="f-pay">Payment</label>
            <select id="f-pay" className="select" value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option value="">All</option><option>Paid</option><option>Unpaid</option>
            </select>
          </div>
          <div className="field"><label className="label" htmlFor="f-from">From</label><input id="f-from" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="f-to">To</label><input id="f-to" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button className="btn" onClick={clear}>Clear</button>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={FileText} title={approvals ? 'No challans awaiting approval' : 'No challans match the filters'}
            message={approvals ? 'Everything has been processed.' : 'Try clearing or widening the filters.'} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Challan ID</th><th>Vehicle</th><th>Owner</th><th>Violation(s)</th><th className="right">Fine</th><th>Officer</th><th>Generated</th><th>Payment</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="mono small">{c.id}</td>
                    <td className="reg">{c.vehicleNumber}</td>
                    <td>{c.ownerName}</td>
                    <td>{c.violations.map((v) => v.label).join(', ')}</td>
                    <td className="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(c.fineAmount)}</td>
                    <td className="small">{c.officer}</td>
                    <td className="small">{formatDate(c.generatedAt)}</td>
                    <td><StatusBadge status={c.paymentStatus} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><button className="btn btn-sm" onClick={() => setOpen(c)}><Eye size={14} /> View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="small muted" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          Showing {rows.length} of {approvals ? challans.filter((c) => c.status === 'Pending Approval').length : challans.length} challans
        </div>
      </Card>

      {open && (() => {
        const live = challans.find((c) => c.id === open.id) || open;
        const det = detections.find((d) => d.id === live.detectionId);
        return (
          <Modal title={`Challan ${live.id}`} wide onClose={() => setOpen(null)}
            footer={
              <>
                {live.status === 'Pending Approval' && (
                  <>
                    <button className="btn btn-danger" onClick={() => setAction({ challan: live, type: 'reject' })}><XCircle size={15} /> Reject</button>
                    <button className="btn btn-success" onClick={() => setAction({ challan: live, type: 'approve' })}><CheckCircle2 size={15} /> Approve & Issue</button>
                  </>
                )}
                <button className="btn" onClick={() => window.print()}><Printer size={15} /> Print</button>
                <button className="btn" onClick={() => setOpen(null)}>Close</button>
              </>
            }>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <StatusBadge status={live.status} /><StatusBadge status={live.paymentStatus} />
            </div>
            <ChallanDocument challan={live} detection={det} />
            <h4 style={{ margin: '16px 0 8px', fontSize: 13.5 }}>Verification Evidence</h4>
            {det ? (
              <div className="kv-2">
                <div className="kv-item"><div className="k">Detection ID</div><div className="v mono">{det.id}</div></div>
                <div className="kv-item"><div className="k">Violation Time</div><div className="v">{formatDateTime(det.violationDateTime)}</div></div>
                <div className="kv-item"><div className="k">Camera</div><div className="v">{det.cameraId} · {det.cameraLocation}</div></div>
                <div className="kv-item"><div className="k">Detected Category</div><div className="v">{det.detectedCategory}</div></div>
              </div>
            ) : (
              <div className="small muted">Detection record {live.detectionId} is archived and not available in the demo data.</div>
            )}
            {live.statusReason && <div className="alert amber" style={{ marginTop: 12 }}>Note: {live.statusReason}</div>}
          </Modal>
        );
      })()}

      {action && (
        <ConfirmDialog
          title={action.type === 'approve' ? 'Approve & Issue Challan' : 'Reject Challan'}
          tone={action.type === 'approve' ? 'success' : 'danger'}
          confirmLabel={action.type === 'approve' ? 'Approve & Issue' : 'Reject Challan'}
          requireReason={action.type === 'reject'}
          reasonLabel="Reason for rejection"
          busy={busy}
          message={action.type === 'approve'
            ? `Approve challan ${action.challan.id} for ${action.challan.vehicleNumber} and issue it to the owner?`
            : `Reject challan ${action.challan.id}? It will be marked Cancelled.`}
          onCancel={() => setAction(null)}
          onConfirm={runAction}
        />
      )}
    </>
  );
}
