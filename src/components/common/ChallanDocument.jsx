import { formatCurrency, formatDateTime } from '../../utils/format';

// Printable challan summary used after generation and in challan details.
export default function ChallanDocument({ challan, detection }) {
  return (
    <div className="challan-doc">
      <div className="challan-doc-head">
        <div className="small muted">Transport Department · E-Challan</div>
        <h4>Notice of Traffic Violation</h4>
        <div className="challan-ref" style={{ marginTop: 6 }}>{challan.id}</div>
      </div>

      <div className="kv-2" style={{ marginBottom: 14 }}>
        <div className="kv-item"><div className="k">Vehicle Number</div><div className="v reg">{challan.vehicleNumber}</div></div>
        <div className="kv-item"><div className="k">Owner</div><div className="v">{challan.ownerName}</div></div>
        <div className="kv-item"><div className="k">Generated On</div><div className="v">{formatDateTime(challan.generatedAt)}</div></div>
        <div className="kv-item"><div className="k">Verifying Officer</div><div className="v">{challan.officer}</div></div>
        {detection && <div className="kv-item"><div className="k">Detection ID</div><div className="v mono">{detection.id}</div></div>}
        {detection && <div className="kv-item"><div className="k">Location</div><div className="v">{detection.cameraLocation}</div></div>}
      </div>

      <table className="challan-table">
        <thead><tr><th>#</th><th>Violation</th><th style={{ textAlign: 'right' }}>Penalty</th></tr></thead>
        <tbody>
          {challan.violations.map((v, i) => (
            <tr key={v.code}><td>{i + 1}</td><td>{v.label}</td><td style={{ textAlign: 'right' }}>{formatCurrency(v.fine)}</td></tr>
          ))}
          <tr>
            <td colSpan={2} style={{ fontWeight: 600 }}>Total Payable</td>
            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(challan.fineAmount)}</td>
          </tr>
        </tbody>
      </table>

      <div className="watermark-note">
        Demonstration document. Penalty amounts are placeholder values and are not official.
      </div>
    </div>
  );
}
