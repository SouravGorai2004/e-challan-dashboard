import { Video } from 'lucide-react';
import { Card, KV } from '../common/ui';
import { formatDateTime } from '../../utils/format';

export default function DetectionInfo({ detection }) {
  return (
    <Card title="Detected Violation Information" icon={Video}>
      <div className="kv-2" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <KV label="Detection ID"><span className="mono">{detection.id}</span></KV>
        <KV label="Date & Time">{formatDateTime(detection.violationDateTime)}</KV>
        <KV label="Camera ID"><span className="mono">{detection.cameraId}</span></KV>
        <KV label="Camera Location">{detection.cameraLocation}</KV>
        <KV label="Detected Reg. No."><span className="reg">{detection.detectedRegNo}</span></KV>
        <KV label="Detected Category">{detection.detectedCategory}</KV>
        <KV label="Detected Speed">{detection.detectedSpeed != null ? `${detection.detectedSpeed} km/h` : 'Not available'}</KV>
        <KV label="Detection Confidence">{Math.round(detection.confidence * 100)}% <span className="muted small">(system estimate)</span></KV>
      </div>
    </Card>
  );
}
