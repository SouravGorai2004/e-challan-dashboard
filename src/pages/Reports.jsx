import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, TrendingUp, Table2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Toast';
import { PageHeader, Card, StatCard } from '../components/common/ui';
import { formatCurrency } from '../utils/format';
import { monthlyRevenue } from '../data/mockData';

function toCsv(rows) {
  const head = ['Challan ID', 'Vehicle', 'Owner', 'Violations', 'Fine', 'Officer', 'Generated', 'Payment', 'Status'];
  const body = rows.map((c) => [c.id, c.vehicleNumber, c.ownerName, c.violations.map((v) => v.label).join('; '), c.fineAmount, c.officer, c.generatedAt, c.paymentStatus, c.status]);
  return [head, ...body].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function Reports() {
  const { challans, history } = useApp();
  const toast = useToast();

  const stats = useMemo(() => {
    const valid = challans.filter((c) => c.status !== 'Cancelled');
    const paid = valid.filter((c) => c.paymentStatus === 'Paid');
    const approved = history.filter((h) => h.action === 'Approved').length;
    const decided = history.filter((h) => ['Approved', 'Rejected'].includes(h.action)).length;
    return {
      total: valid.reduce((s, c) => s + c.fineAmount, 0),
      collected: paid.reduce((s, c) => s + c.fineAmount, 0),
      rate: valid.length ? Math.round((paid.length / valid.length) * 100) : 0,
      approval: decided ? Math.round((approved / decided) * 100) : 0,
    };
  }, [challans, history]);

  const officers = useMemo(() => {
    const map = {};
    challans.forEach((c) => { map[c.officer] = map[c.officer] || { officer: c.officer, challans: 0, fines: 0 }; map[c.officer].challans += 1; map[c.officer].fines += c.fineAmount; });
    return Object.values(map).sort((a, b) => b.challans - a.challans);
  }, [challans]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(challans)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'challans-report.csv'; a.click();
    URL.revokeObjectURL(url);
    toast('Challan report exported');
  };

  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Fines, collections and officer activity (demo data)."
        actions={<button className="btn" onClick={exportCsv}><Download size={15} /> Export Challans (CSV)</button>} />

      <div className="grid grid-6" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 16 }}>
        <StatCard label="Total Fines Raised" value={formatCurrency(stats.total)} />
        <StatCard label="Fines Collected" value={formatCurrency(stats.collected)} tone="green" />
        <StatCard label="Payment Rate" value={`${stats.rate}%`} note="Paid / non-cancelled challans" />
        <StatCard label="Approval Rate" value={`${stats.approval}%`} note="Approved / decided cases" />
      </div>

      <div className="grid grid-2">
        <Card title="Monthly Fines vs Collection" icon={TrendingUp}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#e6e9ed" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5b6673' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${v / 1000}k`} tick={{ fontSize: 12, fill: '#5b6673' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatCurrency(v)} cursor={{ fill: '#f1f3f6' }} />
                <Legend />
                <Bar dataKey="fines" name="Fines raised" fill="#203f60" radius={[2, 2, 0, 0]} maxBarSize={24} />
                <Bar dataKey="collected" name="Collected" fill="#8aa7c4" radius={[2, 2, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Officer Activity" icon={Table2} flush>
          <table className="table">
            <thead><tr><th>Officer</th><th className="right">Challans</th><th className="right">Fines raised</th></tr></thead>
            <tbody>
              {officers.map((o) => (
                <tr key={o.officer}><td>{o.officer}</td><td className="right">{o.challans}</td><td className="right">{formatCurrency(o.fines)}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
