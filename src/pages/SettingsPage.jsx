import { useState } from 'react';
import { Scale, User, Plug } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, KV } from '../components/common/ui';
import { API_BASE_URL, USE_MOCK_API, VIDEO_SRC } from '../data/config';

export default function SettingsPage() {
  const { penaltyRules, officer } = useApp();
  const [ruleQuery, setRuleQuery] = useState('');
  const visibleRules = penaltyRules.filter((rule) => `${rule.code} ${rule.label} ${rule.group} ${rule.ruleReference || ''}`.toLowerCase().includes(ruleQuery.toLowerCase()));
  return <>
    <PageHeader title="Settings" subtitle="Configuration reference for the verification workflow." />
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', alignItems: 'start' }}>
      <Card title="Traffic rules and illustrative fines (read only)" icon={Scale} flush>
        <div className="alert amber" style={{ margin: 16 }}>Only Super Admin can configure this demo schedule. Rule references and amounts are illustrative, not official legal provisions. Challans keep a snapshot of the configuration used when they were issued.</div>
        <div className="field" style={{margin:'0 16px 12px'}}><label className="label" htmlFor="rule-search">Search configured rules</label><input id="rule-search" className="input" value={ruleQuery} onChange={(event)=>setRuleQuery(event.target.value)} placeholder="Search violation, category or reference"/></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Violation</th><th>Type</th><th>Rule reference</th><th className="right">Fine (₹)</th></tr></thead>
          <tbody>{visibleRules.map((rule) => <tr key={rule.code}><td>{rule.label}</td><td className="small muted">{rule.group === 'traffic' ? 'Traffic' : 'Document'}</td><td className="small muted">{rule.ruleReference || 'Illustrative demo rule'}</td><td className="right">₹{Number(rule.fine).toLocaleString('en-IN')}</td></tr>)}</tbody>
        </table></div>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Officer Profile" icon={User}><div className="kv-2"><KV label="Name">{officer.name}</KV><KV label="Officer ID">{officer.id}</KV><KV label="Designation">{officer.designation}</KV><KV label="Office">{officer.office}</KV></div></Card>
        <Card title="Integration" icon={Plug}><div className="kv-2" style={{ gridTemplateColumns: '1fr' }}><KV label="Data source">{USE_MOCK_API ? 'Persistent browser mock service' : 'REST API'}</KV><KV label="API base URL"><span className="mono small">{API_BASE_URL}</span></KV><KV label="CCTV video path"><span className="mono small">{VIDEO_SRC}</span></KV></div><div className="small muted" style={{ marginTop: 10 }}>Edit <span className="mono">src/data/config.js</span> to switch to the Spring Boot backend.</div></Card>
      </div>
    </div>
  </>;
}
