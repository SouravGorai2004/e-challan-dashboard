import { Link, useNavigate } from 'react-router-dom';
import { Activity, FileText, Clock, MessageSquareWarning, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, StatCard, EmptyState } from '../components/common/ui';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDateTime, formatTime } from '../utils/format';
import { dailyChallans, categoryDistribution } from '../data/mockData';

// Neutral, restrained palette (navy family + greys).
const PIE_COLORS = ['#203f60', '#3f6a96', '#6f93b8', '#a3bad0', '#7b8794', '#c9d0d8'];

export default function Dashboard() {
  const { challans, detections, complaints, history } = useApp();
  const navigate = useNavigate();

  const pendingQueue = detections.filter((d) => d.status === 'Pending');
  const approved = detections.filter((d) => d.status === 'Approved').length + history.filter((h) => h.action === 'Approved').length;
  const rejected = history.filter((h) => h.action === 'Rejected').length;
  const totalFine = challans.filter((c) => c.status !== 'Cancelled').reduce((s, c) => s + c.fineAmount, 0);
  const pendingComplaints = complaints.filter((c) => c.status === 'Pending').length;
  const complaintCounts = ['Pending', 'Under Review', 'Resolved', 'Rejected'].map((s) => ({ s, n: complaints.filter((c) => c.status === s).length }));

  // Today's bar reflects live generation in this session.
  const chartData = dailyChallans.map((d, i, arr) => (i === arr.length - 1 ? { ...d, count: d.count + challans.filter((c) => c.generatedAt.startsWith(new Date().toISOString().slice(0, 10)) && c.officer).length } : d));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Current operational status at a glance." />

      <div className="grid grid-6" style={{ marginBottom: 16 }}>
        <StatCard label="Total Challans Generated" value={challans.length} note="All time (demo)" />
        <StatCard label="Pending Manual Verifications" value={pendingQueue.length} tone="amber" note="Awaiting officer review" />
        <StatCard label="Verified Violations" value={approved} tone="green" />
        <StatCard label="Rejected Violations" value={rejected} tone="red" />
        <StatCard label="Pending Public Complaints" value={pendingComplaints} tone="amber" />
        <StatCard label="Total Fine Generated" value={formatCurrency(totalFine)} note="Excludes cancelled" />
      </div>

      <div className="grid grid-dash" style={{ marginBottom: 16 }}>
        <Card title="Pending Verification Queue" icon={Clock} flush
          action={<Link to="/verification" className="small">Open Manual Verification →</Link>}>
          {pendingQueue.length === 0 ? <EmptyState title="Queue is clear" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Detection</th><th>Vehicle</th><th>Category</th><th>Camera</th><th>Time</th></tr></thead>
                <tbody>
                  {pendingQueue.slice(0, 6).map((d) => (
                    <tr key={d.id} className="clickable" onClick={() => navigate(`/verification/${d.id}`)}>
                      <td className="mono small">{d.id}</td>
                      <td className="reg">{d.detectedRegNo}</td>
                      <td>{d.detectedCategory}</td>
                      <td className="small">{d.cameraId}</td>
                      <td className="small">{formatTime(d.violationDateTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Complaint Summary" icon={MessageSquareWarning} action={<Link to="/complaints" className="small">View all →</Link>}>
          {complaintCounts.map(({ s, n }) => (
            <div className="summary-line" key={s}><StatusBadge status={s} /><b>{n}</b></div>
          ))}
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Card title="Daily Challan Generation (last 7 days)" icon={BarChart3}>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#e6e9ed" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#5b6673' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#5b6673' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f3f6' }} />
                <Bar dataKey="count" name="Challans" fill="#203f60" radius={[2, 2, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Violation Category Distribution" icon={PieIcon}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 240 }}>
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={1}>
                    {categoryDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12.5, minWidth: 170 }}>
              {categoryDistribution.map((c, i) => (
                <li key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                  <span style={{ width: 10, height: 10, background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                  <span style={{ flex: 1 }}>{c.name}</span><b>{c.value}</b>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card title="Recent Verification Activity" icon={Activity} flush action={<Link to="/history" className="small">Full history →</Link>}>
          {history.length === 0 ? <EmptyState /> : (
            <table className="table">
              <thead><tr><th>Vehicle</th><th>Action</th><th>Officer</th><th>When</th></tr></thead>
              <tbody>
                {history.slice(0, 5).map((h) => (
                  <tr key={h.id}>
                    <td className="reg">{h.vehicleNumber}</td>
                    <td><StatusBadge status={h.action} /></td>
                    <td className="small">{h.officer}</td>
                    <td className="small">{formatDateTime(h.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Recently Generated Challans" icon={FileText} flush action={<Link to="/challans" className="small">All challans →</Link>}>
          {challans.length === 0 ? <EmptyState /> : (
            <table className="table">
              <thead><tr><th>Challan</th><th>Vehicle</th><th className="right">Fine</th><th>Status</th></tr></thead>
              <tbody>
                {challans.slice(0, 5).map((c) => (
                  <tr key={c.id}>
                    <td className="mono small">{c.id}</td>
                    <td className="reg">{c.vehicleNumber}</td>
                    <td className="right">{formatCurrency(c.fineAmount)}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
