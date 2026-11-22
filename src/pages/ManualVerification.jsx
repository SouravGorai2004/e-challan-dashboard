import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, SendHorizontal, Printer, Inbox, ListFilter, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Toast';
import { PageHeader, Card, EmptyState } from '../components/common/ui';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ChallanDocument from '../components/common/ChallanDocument';
import VideoPlayer from '../components/verification/VideoPlayer';
import DetectionInfo from '../components/verification/DetectionInfo';
import VehiclePanel from '../components/verification/VehiclePanel';
import ViolationSelector from '../components/verification/ViolationSelector';
import ChallanSummary from '../components/verification/ChallanSummary';
import { VIDEO_SRC } from '../data/config';
import { buildChallanLines, totalFine, suggestDocumentCodes } from '../utils/fineCalculator';
import { formatCurrency, formatTime } from '../utils/format';

const norm = (s) => s.replace(/\s/g, '').toUpperCase();

export default function ManualVerification() {
  const { detections, vehicles, penaltyRules, history, generateChallan, recordVerification } = useApp();
  const { detectionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [queueFilter, setQueueFilter] = useState('Pending');
  const [selected, setSelected] = useState([]);
  const [dialog, setDialog] = useState(null); // 'confirm' | 'reject' | 'review' | 'success'
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(null);

  const queue = useMemo(
    () => detections.filter((d) => (queueFilter === 'Pending' ? d.status === 'Pending' : true)),
    [detections, queueFilter]
  );

  const detection = useMemo(() => {
    if (detectionId) return detections.find((d) => d.id === detectionId) || null;
    return detections.find((d) => d.status === 'Pending') || null;
  }, [detections, detectionId]);

  const vehicle = useMemo(
    () => (detection ? vehicles.find((v) => norm(v.registrationNumber) === norm(detection.detectedRegNo)) || null : null),
    [detection, vehicles]
  );

  const docHints = useMemo(() => suggestDocumentCodes(vehicle), [vehicle]);

  // Pre-select the system-suggested violation(s) whenever the case changes.
  useEffect(() => {
    setSelected(detection ? [...detection.suggestedCodes] : []);
  }, [detection?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const lines = useMemo(() => buildChallanLines(selected, penaltyRules), [selected, penaltyRules]);
  const total = totalFine(lines);
  const processed = detection && detection.status !== 'Pending';
  const lastAction = detection ? history.find((h) => h.detectionId === detection.id) : null;

  const toggle = (code) => setSelected((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));

  const goNext = (afterId) => {
    const next = detections.find((d) => d.status === 'Pending' && d.id !== afterId);
    navigate(next ? `/verification/${next.id}` : '/verification');
  };

  const doGenerate = async () => {
    setBusy(true);
    try {
      const challan = await generateChallan({ detection, vehicle, codes: selected });
      await recordVerification({ detection, action: 'Approved', challanId: challan.id });
      setIssued({ challan, detection });
      setDialog('success');
      toast(`Challan ${challan.id} generated`);
    } catch (e) {
      toast(e.message || 'Could not generate challan', 'error');
    } finally {
      setBusy(false);
    }
  };

  const doAction = async (action, reason) => {
    setBusy(true);
    try {
      await recordVerification({ detection, action, reason });
      toast(action === 'Rejected' ? 'Violation rejected' : 'Case sent for further review');
      setDialog(null);
      goNext(detection.id);
    } catch (e) {
      toast(e.message || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const closeSuccess = () => {
    const id = issued?.detection.id;
    setDialog(null); setIssued(null);
    goNext(id);
  };

  return (
    <>
      <PageHeader
        title="Manual Verification"
        subtitle="Inspect CCTV evidence, confirm the vehicle and violations, then approve, reject or escalate."
      />

      <div className="vf-layout">
        {/* ---------- Queue ---------- */}
        <aside className="card vf-queue" aria-label="Verification queue">
          <div className="card-head">
            <h2 className="card-title"><ListFilter size={16} /> Queue ({queue.length})</h2>
            <select className="select" style={{ width: 'auto', padding: '3px 6px', fontSize: 12 }} value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value)} aria-label="Queue filter">
              <option>Pending</option><option>All</option>
            </select>
          </div>
          <div className="card-body">
            {queue.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Queue is clear" message="No pending detections." />
            ) : queue.map((d) => (
              <button key={d.id} className={`queue-item ${detection?.id === d.id ? 'active' : ''} ${d.status !== 'Pending' ? 'done' : ''}`}
                onClick={() => navigate(`/verification/${d.id}`)}>
                <div className="queue-row">
                  <span className="queue-reg">{d.detectedRegNo}</span>
                  {d.status !== 'Pending' && <StatusBadge status={d.status} />}
                </div>
                <div className="queue-meta">{d.detectedCategory}</div>
                <div className="queue-meta">{d.cameraId} · {formatTime(d.violationDateTime)}</div>
              </button>
            ))}
          </div>
        </aside>

        {detection ? (
          <>
            {/* ---------- Evidence ---------- */}
            <div className="vf-main">
              <VideoPlayer src={VIDEO_SRC} />
              <div className="alert navy no-print">
                <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  Shortcuts: <b>Space</b> play/pause · <b>← →</b> step one frame · <b>+ / −</b> zoom · <b>F</b> fullscreen ·
                  Hold <b>Ctrl</b> and scroll to zoom, drag to pan when zoomed. The same supplied footage is shown for every demo case.
                </div>
              </div>
              <DetectionInfo detection={detection} />
            </div>

            {/* ---------- Verification panel ---------- */}
            <div className="vf-side">
              {processed && (
                <div className={`alert ${detection.status === 'Approved' ? 'navy' : 'amber'}`}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    This case is already <b>{detection.status}</b>
                    {lastAction && <> by {lastAction.officer}{lastAction.reason ? ` — “${lastAction.reason}”` : ''}</>}. Actions are locked.
                  </div>
                </div>
              )}
              <VehiclePanel vehicle={vehicle} regNo={detection.detectedRegNo} />
              <ViolationSelector rules={penaltyRules} selected={selected} hints={docHints} onToggle={toggle} disabled={processed} />
              <ChallanSummary lines={lines} total={total} vehicle={vehicle} disabled={processed} onGenerate={() => setDialog('confirm')} />
              <Card title="Verification Decision">
                <div className="action-stack">
                  <button className="btn btn-success" disabled={processed || lines.length === 0 || !vehicle} onClick={() => setDialog('confirm')}>
                    <CheckCircle2 size={16} /> Approve Violation
                  </button>
                  <button className="btn btn-danger" disabled={processed} onClick={() => setDialog('reject')}>
                    <XCircle size={16} /> Reject Violation
                  </button>
                  <button className="btn btn-warn" disabled={processed} onClick={() => setDialog('review')}>
                    <SendHorizontal size={16} /> Send for Further Review
                  </button>
                </div>
                <div className="small muted" style={{ marginTop: 10 }}>
                  Approving issues the challan for the selected violations. Rejecting or escalating requires a recorded reason.
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div style={{ gridColumn: '2 / -1' }}>
            <div className="card">
              <EmptyState icon={Inbox} title="No case selected" message="All pending detections have been processed. Switch the queue filter to All to revisit past cases." />
            </div>
          </div>
        )}
      </div>

      {/* ---------- Dialogs ---------- */}
      {dialog === 'confirm' && detection && (
        <Modal
          title="Confirm Challan Generation"
          onClose={() => !busy && setDialog(null)}
          footer={
            <>
              <button className="btn" onClick={() => setDialog(null)} disabled={busy}>Go Back</button>
              <button className="btn btn-primary" onClick={doGenerate} disabled={busy}>{busy ? 'Generating…' : 'Confirm & Generate Challan'}</button>
            </>
          }
        >
          <div className="alert amber" style={{ marginBottom: 14 }}>
            Please review carefully. Once generated, the challan is recorded against the owner and this case is marked Approved.
          </div>
          <div className="kv-2" style={{ marginBottom: 14 }}>
            <div className="kv-item"><div className="k">Vehicle</div><div className="v reg">{vehicle?.registrationNumber}</div></div>
            <div className="kv-item"><div className="k">Owner</div><div className="v">{vehicle?.ownerName}</div></div>
            <div className="kv-item"><div className="k">Detection</div><div className="v mono">{detection.id}</div></div>
            <div className="kv-item"><div className="k">Camera</div><div className="v">{detection.cameraId} · {detection.cameraLocation}</div></div>
          </div>
          {lines.map((l) => (
            <div className="summary-line" key={l.code}><span>{l.label}</span><span>{formatCurrency(l.fine)}</span></div>
          ))}
          <div className="summary-total"><span>Total Fine</span><span>{formatCurrency(total)}</span></div>
          <div className="small muted" style={{ marginTop: 8 }}>Amounts are demo values pending integration of the official penalty rules.</div>
        </Modal>
      )}

      {dialog === 'reject' && (
        <ConfirmDialog title="Reject Violation" tone="danger" confirmLabel="Reject Violation" requireReason busy={busy}
          reasonLabel="Reason for rejection"
          message={`Reject detection ${detection.id} for ${detection.detectedRegNo}? No challan will be issued.`}
          onCancel={() => setDialog(null)} onConfirm={(r) => doAction('Rejected', r)} />
      )}

      {dialog === 'review' && (
        <ConfirmDialog title="Send for Further Review" tone="primary" confirmLabel="Send for Review" requireReason busy={busy}
          reasonLabel="Reason for escalation"
          message={`Send detection ${detection.id} to a senior officer for further review?`}
          onCancel={() => setDialog(null)} onConfirm={(r) => doAction('Sent for Review', r)} />
      )}

      {dialog === 'success' && issued && (
        <Modal title="Challan Generated Successfully" wide onClose={closeSuccess}
          footer={
            <>
              <button className="btn" onClick={() => window.print()}><Printer size={15} /> Print Challan</button>
              <button className="btn btn-primary" onClick={closeSuccess}>Done — Next Case</button>
            </>
          }>
          <div className="alert navy" style={{ marginBottom: 14 }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            Reference number <b className="mono">{issued.challan.id}</b> has been recorded.
          </div>
          <ChallanDocument challan={issued.challan} detection={issued.detection} />
        </Modal>
      )}
    </>
  );
}
