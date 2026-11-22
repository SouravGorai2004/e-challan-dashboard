import { Car, AlertTriangle } from 'lucide-react';
import { Card, KV } from '../common/ui';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/format';

function DocRow({ name, doc }) {
  return (
    <div className="doc-row">
      <div>
        <div className="doc-name">{name}</div>
        <div className="doc-exp">{doc.expiry ? `Expiry: ${formatDate(doc.expiry)}` : 'No expiry on record'}</div>
      </div>
      <StatusBadge status={doc.status} />
    </div>
  );
}

export default function VehiclePanel({ vehicle, regNo }) {
  if (!vehicle) {
    return (
      <Card title="Vehicle & Owner Information" icon={Car}>
        <div className="alert amber">
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            No record found for <span className="reg">{regNo}</span> in the demo vehicle data.
            The plate may have been misread — inspect the footage and confirm the number manually.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Vehicle & Owner Information" icon={Car} action={<span className="badge amber">Demo record</span>}>
      <div style={{ marginBottom: 14 }}>
        <div className="small muted" style={{ marginBottom: 4 }}>Registration Number</div>
        <span className="reg-plate">{vehicle.registrationNumber}</span>
      </div>
      <div className="kv-2" style={{ marginBottom: 12 }}>
        <KV label="Registered Owner">{vehicle.ownerName}</KV>
        <KV label="Vehicle Type">{vehicle.vehicleType}</KV>
        <KV label="Registration Date">{formatDate(vehicle.registrationDate)}</KV>
        <KV label="Valid Until">{formatDate(vehicle.registrationValidity)}</KV>
      </div>
      <div className="doc-row" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="doc-name">Registration Status</div>
        <StatusBadge status={vehicle.registrationStatus} />
      </div>
      <DocRow name="Insurance" doc={vehicle.insurance} />
      <DocRow name="Pollution Certificate (PUC)" doc={vehicle.puc} />
      <DocRow name="Fitness Certificate" doc={vehicle.fitness} />
      <div className="small muted" style={{ marginTop: 10 }}>
        Mock data. Not connected to any government vehicle register.
      </div>
    </Card>
  );
}
