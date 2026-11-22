import { Receipt, FileCheck2 } from 'lucide-react';
import { Card } from '../common/ui';
import { formatCurrency } from '../../utils/format';

export default function ChallanSummary({ lines, total, vehicle, disabled, onGenerate }) {
  return (
    <Card title="Challan Summary" icon={Receipt}>
      {lines.length === 0 ? (
        <div className="small muted" style={{ padding: '4px 0 8px' }}>
          No violations selected. Tick the applicable violations to build the challan.
        </div>
      ) : (
        <div>
          {lines.map((l) => (
            <div className="summary-line" key={l.code}>
              <span>{l.label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(l.fine)}</span>
            </div>
          ))}
          <div className="summary-total">
            <span>Total Fine</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
          </div>
        </div>
      )}
      <div className="small muted" style={{ margin: '8px 0 12px' }}>
        Fines use configurable demo values (Settings → Penalty Rules), not official penalties.
      </div>
      <button className="btn btn-primary btn-block" disabled={disabled || lines.length === 0 || !vehicle} onClick={onGenerate}>
        <FileCheck2 size={16} /> Review & Generate Challan
      </button>
      {!vehicle && <div className="small" style={{ color: 'var(--amber)', marginTop: 6 }}>A matching vehicle record is required to issue a challan.</div>}
    </Card>
  );
}
