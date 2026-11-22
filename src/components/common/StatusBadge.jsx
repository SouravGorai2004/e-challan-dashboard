// Single place that maps status text to a colour tone.
const TONES = {
  // green: verified / success
  Valid: 'green', Approved: 'green', Resolved: 'green', Paid: 'green', Closed: 'green', Issued: 'navy',
  // red: rejected / violations
  Expired: 'red', Rejected: 'red', Cancelled: 'red', Missing: 'red', Unpaid: 'red',
  // amber: pending actions
  Pending: 'amber', 'Pending Approval': 'amber', 'Pending Verification': 'amber',
  'Under Review': 'amber', 'Sent for Review': 'amber',
};

export default function StatusBadge({ status, tone }) {
  return <span className={`badge ${tone || TONES[status] || 'grey'}`}>{status}</span>;
}
