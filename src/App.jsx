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
import EntryPage from './pages/EntryPage';
import LoginPage from './pages/LoginPage';
import CitizenLookup from './pages/CitizenLookup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminConsole from './pages/AdminConsole';
import SuperAdminConsole from './pages/SuperAdminConsole';

export default function App() {
  return (
    <Routes>
      <Route index element={<EntryPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="lookup/:vehicleNumber" element={<CitizenLookup />} />
      <Route path="citizen/:vehicleNumber" element={<CitizenLookup />} />
      <Route element={<ProtectedRoute roles={['admin']} />}>
      <Route element={<Layout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin/dashboard" element={<Dashboard />} />
        <Route path="admin/operations" element={<AdminConsole />} />
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
      </Route>
      <Route element={<ProtectedRoute roles={['super-admin']} />}>
        <Route path="super-admin/*" element={<SuperAdminConsole />} />
      </Route>
    </Routes>
  );
}
