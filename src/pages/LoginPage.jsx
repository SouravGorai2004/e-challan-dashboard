import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark } from 'lucide-react';
import { authenticate, currentAccount } from '../services/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      const account = await authenticate(email, password);
      sessionStorage.setItem('echallan_session', JSON.stringify({ id: account.id }));
      navigate(account.role === 'super-admin' ? '/super-admin/dashboard' : '/admin/dashboard', { replace: true });
    } catch (err) { setError(err.message || 'Unable to sign in.'); }
    finally { setBusy(false); }
  };

  const activeAccount = currentAccount();
  useEffect(() => { if (activeAccount) navigate(activeAccount.role === 'super-admin' ? '/super-admin/dashboard' : '/dashboard', { replace: true }); }, [activeAccount?.id, activeAccount?.role, navigate]);

  return <main className="entry-page login-page">
    <header className="entry-header"><Link className="entry-brand" to="/"><span className="entry-brand-icon"><Landmark size={21} /></span><span><b>Transport Department</b><small>E-Challan Management System</small></span></Link><Link to="/" className="entry-back"><ArrowLeft size={15} /> Back to services</Link></header>
    <section className="login-card"><span className="entry-kicker">STAFF ACCESS</span><h1>Admin Login</h1><p>Sign in with your department account.</p>
      <form onSubmit={submit}>
        <div className="field"><label className="label" htmlFor="email">Email address</label><input className="input" id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@department.gov.in" /></div>
        <div className="field"><label className="label" htmlFor="password">Password</label><input className="input" id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" /></div>
        {error && <div className="entry-error login-error" role="alert">{error}</div>}
        <button className="btn btn-primary btn-block entry-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} </button>
      </form>
      <div className="entry-login-note">Demo access: Admin <span className="mono">admin@echallan.demo</span> · Super Admin <span className="mono">superadmin@echallan.demo</span>. Shared demo password: <span className="mono">Admin@123</span> for staff; super admin password: <span className="mono">SuperAdmin@123</span>.</div>
    </section>
  </main>;
}
