import { useState } from 'react';
import Modal from './Modal';

// Reusable confirmation. If `requireReason` is set, a reason must be entered.
export default function ConfirmDialog({
  title, message, confirmLabel = 'Confirm', tone = 'primary',
  requireReason = false, reasonLabel = 'Reason', busy = false, onConfirm, onCancel,
}) {
  const [reason, setReason] = useState('');
  const invalid = requireReason && reason.trim().length < 5;

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={`btn btn-${tone}`} disabled={invalid || busy} onClick={() => onConfirm(reason.trim())}>
            {busy ? 'Processing…' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: '0 0 12px' }}>{message}</p>
      {requireReason && (
        <div className="field">
          <label className="label" htmlFor="confirm-reason">{reasonLabel} (required)</label>
          <textarea id="confirm-reason" className="textarea" value={reason} autoFocus
            onChange={(e) => setReason(e.target.value)} placeholder="Enter at least 5 characters" />
        </div>
      )}
    </Modal>
  );
}
