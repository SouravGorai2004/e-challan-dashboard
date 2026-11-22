import { Inbox, Search } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

export function Card({ title, icon: Icon, action, children, flush = false, style }) {
  return (
    <section className="card" style={style}>
      {title && (
        <div className="card-head">
          <h2 className="card-title">{Icon && <Icon size={16} />}{title}</h2>
          {action}
        </div>
      )}
      <div className={`card-body ${flush ? 'flush' : ''}`}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, note, tone }) {
  return (
    <div className={`card stat ${tone || ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}

export function EmptyState({ title = 'No records found', message, icon: Icon = Inbox }) {
  return (
    <div className="empty">
      <Icon size={32} />
      <div className="empty-title">{title}</div>
      {message && <div className="small">{message}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading" role="status">
      <div className="spinner" /> {label}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="search">
      <Search size={15} />
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function KV({ label, children }) {
  return (
    <div className="kv-item">
      <div className="k">{label}</div>
      <div className="v">{children}</div>
    </div>
  );
}
