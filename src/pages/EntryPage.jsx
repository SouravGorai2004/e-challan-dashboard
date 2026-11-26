import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CarFront, Landmark, Search } from 'lucide-react';

export default function EntryPage() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const checkChallan = (event) => {
    event.preventDefault();
    const value = vehicleNumber.trim();
    if (!value) { setError('Enter a vehicle registration number to continue.'); return; }
    navigate(`/lookup/${encodeURIComponent(value)}`);
  };

  return (
    <main className="entry-page">
      <header className="entry-header">
        <div className="entry-brand"><span className="entry-brand-icon"><Landmark size={21} /></span><span><b>Transport Department</b><small>E-Challan Management System</small></span></div>
        <span className="entry-header-note">Official services portal</span>
      </header>
      <section className="entry-content">
        <div className="entry-intro"><span className="entry-kicker">TRANSPORT SERVICES</span><h1>How can we help you today?</h1><p>Access challan services or continue to the department portal.</p></div>
        <div className="entry-options">
          <section className="entry-card">
            <div className="entry-icon"><CarFront size={22} /></div>
            <h2>Citizen / Vehicle Owner</h2>
            <p>Check your vehicle details and view any challans issued against it.</p>
            <form onSubmit={checkChallan} noValidate>
              <label className="label" htmlFor="vehicle-number">Vehicle registration number</label>
              <div className="entry-input-wrap"><Search size={17} /><input id="vehicle-number" className="input" value={vehicleNumber} onChange={(e) => { setVehicleNumber(e.target.value); setError(''); }} placeholder="e.g. DL 01 AB 1234" /></div>
              {error && <div className="entry-error" role="alert">{error}</div>}
              <button className="btn btn-primary btn-block entry-submit" type="submit">Check Challan <ArrowRight size={16} /></button>
            </form>
          </section>
          <section className="entry-card entry-card-staff">
            <div className="entry-icon"><Landmark size={22} /></div>
            <h2>Admin / Super Admin</h2>
            <p>Sign in to manage verifications, challans, citizen complaints, and reports.</p>
            <Link className="btn btn-block entry-login" to="/login">Admin Login <ArrowRight size={16} /></Link>
            <div className="entry-security">Authorized department personnel only</div>
          </section>
        </div>
      </section>
      <footer className="entry-footer">Government of India <span>•</span> Transport Department</footer>
    </main>
  );
}
