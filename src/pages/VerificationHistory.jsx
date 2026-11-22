import { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, EmptyState, SearchInput } from '../components/common/ui';
import StatusBadge from '../components/common/StatusBadge';
import { formatDateTime } from '../utils/format';

export default function VerificationHistory() {
  const { history } = useApp();
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return history.filter((h) =>
      (!action || h.action === action) &&
      (!term || `${h.detectionId} ${h.vehicleNumber} ${h.officer} ${h.reason} ${h.challanId || ''}`.toLowerCase().includes(term)));
  }, [history, q, action]);

  return (
    <>
      <PageHeader title="Verification History" subtitle="Audit trail of every verification decision with officer and timestamp." />
      <Card flush>
        <div className="filters">
          <SearchInput value={q} onChange={setQ} placeholder="Search detection, vehicle, officer, reason…" />
          <div className="field">
            <label className="label" htmlFor="h-action">Action</label>
            <select id="h-action" className="select" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">All actions</option><option>Approved</option><option>Rejected</option><option>Sent for Review</option>
            </select>
          </div>
        </div>
        {rows.length === 0 ? <EmptyState icon={History} title="No history entries match" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>When</th><th>Detection</th><th>Vehicle</th><th>Action</th><th>Officer</th><th>Reason / Challan</th></tr></thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.id}>
                    <td className="small">{formatDateTime(h.at)}</td>
                    <td className="mono small">{h.detectionId}</td>
                    <td className="reg">{h.vehicleNumber}</td>
                    <td><StatusBadge status={h.action} /></td>
                    <td>{h.officer}</td>
                    <td className="small">{h.reason || (h.challanId ? <span className="mono">{h.challanId}</span> : '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
