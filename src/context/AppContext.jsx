import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { CURRENT_OFFICER } from '../data/config';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detections, setDetections] = useState([]);
  const [challans, setChallans] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [history, setHistory] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [penaltyRules, setPenaltyRules] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, c, cp, h, v, p] = await Promise.all([
        api.getDetections(), api.getChallans(), api.getComplaints(),
        api.getHistory(), api.getVehicles(), api.getPenaltyRules(),
      ]);
      setDetections(d); setChallans(c); setComplaints(cp);
      setHistory(h); setVehicles(v); setPenaltyRules(p);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ---- Actions (business workflow lives here / in services, not in UI) ----
  const refreshChallans = async () => setChallans(await api.getChallans());

  const generateChallan = async ({ detection, vehicle, codes }) => {
    const challan = await api.createChallan({ detectionId: detection.id, vehicle, codes });
    await refreshChallans();
    return challan;
  };

  const recordVerification = async ({ detection, action, reason, challanId }) => {
    await api.recordVerification({ detection, action, reason, challanId });
    const [d, h] = await Promise.all([api.getDetections(), api.getHistory()]);
    setDetections(d); setHistory(h);
  };

  const updateComplaint = async (id, patch) => {
    await api.updateComplaint(id, patch);
    setComplaints(await api.getComplaints());
  };

  const updateChallanStatus = async (id, status, reason) => {
    await api.updateChallanStatus(id, status, reason);
    await refreshChallans();
  };

  const savePenaltyRules = async (rules) => setPenaltyRules(await api.updatePenaltyRules(rules));

  const counts = useMemo(() => ({
    pendingVerifications: detections.filter((d) => d.status === 'Pending').length,
    pendingApprovals: challans.filter((c) => c.status === 'Pending Approval').length,
    pendingComplaints: complaints.filter((c) => c.status === 'Pending').length,
  }), [detections, challans, complaints]);

  const value = {
    officer: CURRENT_OFFICER, loading, error, reload: load,
    detections, challans, complaints, history, vehicles, penaltyRules, counts,
    generateChallan, recordVerification, updateComplaint, updateChallanStatus, savePenaltyRules,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
