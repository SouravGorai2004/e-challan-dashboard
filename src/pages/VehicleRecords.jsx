import { useMemo, useState } from 'react';
import { Car } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, EmptyState, SearchInput } from '../components/common/ui';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../utils/format';

export default function VehicleRecords() {
  const { vehicles, challans } = useApp();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/\s/g, '');
    return vehicles.filter((v) => !term || `${v.registrationNumber}${v.ownerName}${v.vehicleType}`.toLowerCase().replace(/\s/g, '').includes(term));
  }, [vehicles, q]);

  const vehicleChallans = selected ? challans.filter((c) => c.vehicleNumber === selected.registrationNumber) : [];

  return (
    <>
      <PageHeader title="Vehicle Records" subtitle="Demo vehicle register. Not connected to any government database." />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', alignItems: 'start' }}>
        <Card flush>
          <div className="filters"><SearchInput value={q} onChange={setQ} placeholder="Search registration number, owner, type…" /></div>
          {rows.length === 0 ? <EmptyState icon={Car} title="No vehicles found" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Registration</th><th>Owner</th><th>Type</th><th>Registration</th><th>Insurance</th><th>PUC</th><th>Fitness</th></tr></thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v.registrationNumber} className={`clickable ${selected?.registrationNumber === v.registrationNumber ? 'selected' : ''}`} onClick={() => setSelected(v)}>
                      <td className="reg">{v.registrationNumber}</td>
                      <td>{v.ownerName}</td>
                      <td className="small">{v.vehicleType}</td>
                      <td><StatusBadge status={v.registrationStatus} /></td>
                      <td><StatusBadge status={v.insurance.status} /></td>
                      <td><StatusBadge status={v.puc.status} /></td>
                      <td><StatusBadge status={v.fitness.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {!selected ? (
          <Card><EmptyState icon={Car} title="Select a vehicle" message="Click a row to see full details and challan history." /></Card>
        ) : (
          <Card title="Vehicle Details" icon={Car}>
            <span className="reg-plate" style={{ marginBottom: 12 }}>{selected.registrationNumber}</span>
            <dl className="kv" style={{ margin: '12px 0' }}>
              <dt>Owner</dt><dd>{selected.ownerName}</dd>
              <dt>Type</dt><dd>{selected.vehicleType}</dd>
              <dt>Registered</dt><dd>{formatDate(selected.registrationDate)}</dd>
              <dt>Valid until</dt><dd>{formatDate(selected.registrationValidity)}</dd>
              <dt>Insurance</dt><dd><StatusBadge status={selected.insurance.status} /> {selected.insurance.expiry && <span className="small muted">· {formatDate(selected.insurance.expiry)}</span>}</dd>
              <dt>PUC</dt><dd><StatusBadge status={selected.puc.status} /> {selected.puc.expiry && <span className="small muted">· {formatDate(selected.puc.expiry)}</span>}</dd>
              <dt>Fitness</dt><dd><StatusBadge status={selected.fitness.status} /> {selected.fitness.expiry && <span className="small muted">· {formatDate(selected.fitness.expiry)}</span>}</dd>
            </dl>
            <h3 style={{ fontSize: 13.5, margin: '16px 0 6px' }}>Challan history ({vehicleChallans.length})</h3>
            {vehicleChallans.length === 0 ? <div className="small muted">No challans recorded.</div> : vehicleChallans.map((c) => (
              <div className="summary-line" key={c.id}>
                <span><span className="mono small">{c.id}</span> <span className="small muted">· {c.violations.map((v) => v.label).join(', ')}</span></span>
                <span>{formatCurrency(c.fineAmount)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
