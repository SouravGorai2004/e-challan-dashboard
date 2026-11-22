import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ManualVerification from './pages/ManualVerification';
import ChallanList from './pages/ChallanList';
import Complaints from './pages/Complaints';
import VehicleRecords from './pages/VehicleRecords';
import VerificationHistory from './pages/VerificationHistory';
import Reports from './pages/Reports';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="verification" element={<ManualVerification />} />
        <Route path="verification/:detectionId" element={<ManualVerification />} />
        <Route path="approvals" element={<ChallanList mode="approvals" />} />
        <Route path="challans" element={<ChallanList mode="all" />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="vehicles" element={<VehicleRecords />} />
        <Route path="history" element={<VerificationHistory />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
