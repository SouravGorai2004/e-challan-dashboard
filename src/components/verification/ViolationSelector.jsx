import { ListChecks } from 'lucide-react';
import { Card } from '../common/ui';
import { formatCurrency } from '../../utils/format';

function Group({ title, rules, selected, hints, onToggle, disabled }) {
  return (
    <div>
      <div className="viol-group-title">{title}</div>
      {rules.map((r) => {
        const on = selected.includes(r.code);
        return (
          <label key={r.code} className={`viol-item ${on ? 'on' : ''}`}>
            <input type="checkbox" checked={on} disabled={disabled} onChange={() => onToggle(r.code)} />
            <span className="viol-label">
              {r.label}
              {hints.includes(r.code) && <span className="viol-hint">Record indicates</span>}
            </span>
            <span className="viol-fine">{formatCurrency(r.fine)}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function ViolationSelector({ rules, selected, hints, onToggle, disabled }) {
  const traffic = rules.filter((r) => r.group === 'traffic');
  const docs = rules.filter((r) => r.group === 'document');
  return (
    <Card title="Select Applicable Violations" icon={ListChecks} action={<span className="badge amber">Demo fines</span>}>
      <Group title="Traffic Violations" rules={traffic} selected={selected} hints={hints} onToggle={onToggle} disabled={disabled} />
      <Group title="Document Non-Compliance" rules={docs} selected={selected} hints={hints} onToggle={onToggle} disabled={disabled} />
    </Card>
  );
}
