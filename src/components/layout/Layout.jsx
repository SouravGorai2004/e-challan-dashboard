import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ScanEye, ClipboardCheck, FileText, MessageSquareWarning,
  Car, History, BarChart3, Settings, LogOut, Landmark, Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../common/Toast';
import { Loading } from '../common/ui';
import { currentAccount, signOut, addAudit } from '../../services/auth';

export default function Layout() {
  const { officer, counts, loading } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const account = currentAccount();

  const items = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/verification', label: 'Manual Verification', icon: ScanEye, badge: counts.pendingVerifications },
    { to: '/approvals', label: 'Pending Approvals', icon: ClipboardCheck, badge: counts.pendingApprovals },
    { to: '/challans', label: 'Challan Management', icon: FileText },
    { to: '/complaints', label: 'Public Complaints', icon: MessageSquareWarning, badge: counts.pendingComplaints },
    { to: '/vehicles', label: 'Vehicle Records', icon: Car },
    { to: '/history', label: 'Verification History', icon: History },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/admin/operations', label: 'Operations & disputes', icon: Activity },
  ];

  const displayName = account?.name || officer.name;
  const initials = displayName.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <div className="brand-logo"><Landmark size={20} /></div>
          <div>
            <div className="brand-title">Transport Department</div>
            <div className="brand-sub">E-Challan Management System</div>
          </div>
        </div>
        <nav className="nav">
          {items.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={17} />
              <span>{label}</span>
              {badge > 0 && <span className="nav-badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="officer">
          <div className="avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="officer-name">{displayName}</div>
            <div className="officer-role">{account?.designation || officer.designation}</div>
          </div>
          <button className="icon-btn-light" title="Log out" aria-label="Log out"
            onClick={() => { addAudit(displayName, 'Signed out', account?.id || 'session'); signOut(); toast('Signed out successfully.'); navigate('/'); }}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">{officer.office}</div>
          <div className="topbar-right">
            <span className="demo-tag">DEMO DATA</span>
            <span>Officer ID: {officer.id}</span>
          </div>
        </header>
        <main className="content">{loading ? <Loading label="Loading records…" /> : <Outlet />}</main>
      </div>
    </div>
  );
}
