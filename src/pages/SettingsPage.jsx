import { useEffect, useState } from 'react';
import { Scale, User, Plug } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Toast';
import { PageHeader, Card, KV } from '../components/common/ui';
import { API_BASE_URL, USE_MOCK_API, VIDEO_SRC } from '../data/config';

export default function SettingsPage() {
  const { penaltyRules, savePenaltyRules, officer } = useApp();
  const toast = useToast();
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(penaltyRules.map((r) => ({ ...r }))); }, [penaltyRules]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(penaltyRules);
  const invalid = draft.some((r) => !(Number(r.fine) >= 0) || r.fine === '');

  const setFine = (code, value) => setDraft((d) => d.map((r) => (r.code === code ? { ...r, fine: value === '' ? '' : Number(value) } : r)));

  const save = async () => {
    setSaving(true);
    try { await savePenaltyRules(draft); toast('Penalty rules saved'); }
    catch (e) { toast(e.message || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Configuration for the verification workflow." />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', alignItems: 'start' }}>
        <Card title="Penalty Rules (Demo Values)" icon={Scale} flush
          action={<button className="btn btn-primary btn-sm" disabled={!dirty || invalid || saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</button>}>
          <div className="alert amber" style={{ margin: 16 }}>
            These are placeholder amounts for demonstration. They are not official penalties. Replace them with the applicable statutory schedule when it is integrated.
          </div>
          <table className="table">
            <thead><tr><th>Violation</th><th>Type</th><th className="right">Fine (₹)</th></tr></thead>
            <tbody>
              {draft.map((r) => (
                <tr key={r.code}>
                  <td>{r.label}</td>
                  <td className="small muted">{r.group === 'traffic' ? 'Traffic' : 'Document'}</td>
                  <td className="right">
                    <input className="input" type="number" min="0" step="50" style={{ width: 110, textAlign: 'right' }} value={r.fine}
                      onChange={(e) => setFine(r.code, e.target.value)} aria-label={`Fine for ${r.label}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Officer Profile" icon={User}>
            <div className="kv-2">
              <KV label="Name">{officer.name}</KV><KV label="Officer ID">{officer.id}</KV>
              <KV label="Designation">{officer.designation}</KV><KV label="Office">{officer.office}</KV>
            </div>
          </Card>
          <Card title="Integration" icon={Plug}>
            <div className="kv-2" style={{ gridTemplateColumns: '1fr' }}>
              <KV label="Data source">{USE_MOCK_API ? 'Mock service (in-memory demo data)' : 'REST API'}</KV>
              <KV label="API base URL"><span className="mono small">{API_BASE_URL}</span></KV>
              <KV label="CCTV video path"><span className="mono small">{VIDEO_SRC}</span></KV>
            </div>
            <div className="small muted" style={{ marginTop: 10 }}>Edit <span className="mono">src/data/config.js</span> to switch to the Spring Boot backend.</div>
          </Card>
        </div>
      </div>
    </>
  );
}
