import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { CURRENT_OFFICER } from '../data/config';
import { db, persistDb } from '../services/mockDb';
import { addAudit, addNotification, currentAccount, uniqueId, requireRole } from '../services/auth';

const AppContext = createContext(null);
const ensureOperational = () => { if (db.settings.maintenanceMode) throw new Error('The system is in maintenance mode. Try again later.'); };

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true); const [error, setError] = useState(null);
  const [detections, setDetections] = useState([]); const [challans, setChallans] = useState([]);
  const [complaints, setComplaints] = useState([]); const [history, setHistory] = useState([]);
  const [vehicles, setVehicles] = useState([]); const [penaltyRules, setPenaltyRules] = useState([]);
  const [citizens, setCitizens] = useState([]); const [payments, setPayments] = useState([]); const [disputes, setDisputes] = useState([]);
  const [notifications, setNotifications] = useState([]); const [audit, setAudit] = useState([]); const [admins, setAdmins] = useState([]);
  const [faqs, setFaqs] = useState([]);

  const refreshLocal = () => {
    setCitizens([...db.citizens]); setVehicles([...db.vehicles]); setChallans([...db.challans]); setPayments([...db.payments]);
    setDisputes([...db.disputes]); setNotifications([...db.notifications]); setAudit([...db.audit]); setAdmins([...db.admins]);
    setPenaltyRules([...db.penaltyRules]); setHistory([...db.history]); setDetections([...db.detections]); setComplaints([...db.complaints]); setFaqs([...(db.faqs || [])]);
  };
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [d,c,cp,h,v,p] = await Promise.all([api.getDetections(),api.getChallans(),api.getComplaints(),api.getHistory(),api.getVehicles(),api.getPenaltyRules()]);
      setDetections(d); setChallans(c); setComplaints(cp); setHistory(h); setVehicles(v); setPenaltyRules(p); refreshLocal();
    } catch (e) { setError(e.message || 'Failed to load data'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const refreshChallans = async () => setChallans(await api.getChallans());
  const generateChallan = async ({ detection, vehicle, codes }) => { ensureOperational(); const value = await api.createChallan({ detectionId:detection.id, vehicle, codes, officer:currentAccount()?.name }); addAudit(currentAccount()?.name,'Created challan',value.id); addNotification(`A new challan was issued for ${vehicle.registrationNumber}.`,vehicle.registrationNumber); await refreshChallans(); return value; };
  const recordVerification = async ({ detection, action, reason, challanId }) => { ensureOperational(); await api.recordVerification({ detection, action, reason, challanId, officer:currentAccount()?.name }); addAudit(currentAccount()?.name,`CCTV ${action.toLowerCase()}`,detection.id); addNotification(`CCTV case ${detection.id} was ${action.toLowerCase()}.`,detection.detectedRegNo); const [d,h]=await Promise.all([api.getDetections(),api.getHistory()]); setDetections(d);setHistory(h); }
  const updateComplaint = async (id, patch) => { ensureOperational(); await api.updateComplaint(id, patch); addAudit(currentAccount()?.name,'Updated citizen complaint',id); addNotification(`Complaint ${id} was updated.`,'admin'); setComplaints(await api.getComplaints()); };
  const updateChallanStatus = async (id, status, reason) => { ensureOperational(); await api.updateChallanStatus(id, status, reason); addAudit(currentAccount()?.name,`Updated challan status to ${status}`,id); await refreshChallans(); };
  const savePenaltyRules = async (rules, reason) => { requireRole('super-admin'); const updated = await api.updatePenaltyRules(rules, reason); setPenaltyRules(updated); refreshLocal(); };

  const recordPayment = async (challanId, method, outcome) => {
    ensureOperational();
    if (!db.settings.paymentSimulation) throw new Error('Simulated payments are currently disabled.');
    const challan = db.challans.find((item) => item.id === challanId);
    if (!challan) throw new Error('Challan was not found.');
    if (challan.paymentStatus === 'Paid' || db.payments.some((p) => p.challanId === challanId && p.status === 'Success')) throw new Error('This challan has already been paid.');
    if (challan.status === 'Disputed' || challan.status === 'Cancelled' || challan.status === 'Pending Approval') throw new Error('This challan is not currently eligible for payment.');
    const success = outcome === 'success';
    const transaction = { id:uniqueId('TXN'), challanId, vehicleNumber:challan.vehicleNumber, amount:challan.fineAmount, method, status:success?'Success':'Failure', at:new Date().toISOString(), receiptId:success?uniqueId('RCP'):null };
    db.payments.unshift(transaction);
    if (success) { challan.paymentStatus='Paid'; challan.status='Closed'; challan.paidAt=transaction.at; addNotification(`Payment received for ${challan.id}. Receipt ${transaction.receiptId} is ready.`,challan.vehicleNumber); }
    else addNotification(`Payment attempt for ${challan.id} failed. No amount was charged.`,challan.vehicleNumber);
    addAudit(currentAccount()?.name,`${success?'Payment successful':'Payment failed'} via ${method}`,challanId); persistDb(); refreshLocal(); return transaction;
  };
  const submitDispute = async ({ challanId, reason, details }) => {
    ensureOperational();
    const challan=db.challans.find((item)=>item.id===challanId);
    if (!challan || ['Paid','Cancelled','Disputed'].includes(challan.status) || challan.paymentStatus==='Paid') throw new Error('This challan cannot be disputed.');
    const dispute={id:uniqueId('DSP'),challanId,vehicleNumber:challan.vehicleNumber,reason,details,status:'Pending',resolution:'',submittedAt:new Date().toISOString()};
    db.disputes.unshift(dispute);challan.status='Disputed';challan.disputeId=dispute.id;addAudit('Citizen portal','Dispute submitted',dispute.id);addNotification(`New dispute ${dispute.id} needs review.`,'admin');persistDb();refreshLocal();return dispute;
  };
  const resolveDispute = async (id, upheld, note) => {
    requireRole('admin');
    ensureOperational();
    const dispute=db.disputes.find((item)=>item.id===id);if(!dispute||dispute.status!=='Pending')throw new Error('This dispute is no longer pending.');
    dispute.status='Resolved';dispute.resolution=note||(upheld?'Challan upheld after review.':'Dispute accepted; challan cancelled.');dispute.resolvedAt=new Date().toISOString();
    const challan=db.challans.find((item)=>item.id===dispute.challanId);if(challan)challan.status=upheld?'Issued':'Cancelled';
    addAudit(currentAccount()?.name,`Dispute ${upheld?'upheld':'accepted'}`,id);addNotification(`Dispute ${id} has been resolved: ${dispute.resolution}`,dispute.vehicleNumber);persistDb();refreshLocal();
  };
  const addAdmin = async ({name,email,password,designation}) => {
    requireRole('super-admin');
    if(db.admins.some((admin)=>admin.email.toLowerCase()===email.trim().toLowerCase()))throw new Error('That email is already assigned to an account.');
    const admin={id:uniqueId('ADM'),name:name.trim(),email:email.trim(),password,role:'admin',active:true,designation:designation||'Traffic Enforcement Officer'};
    db.admins.push(admin);addAudit(currentAccount()?.name,'Created admin account',admin.id);addNotification(`New admin account created for ${admin.email}.`,'super-admin');persistDb();refreshLocal();return admin;
  };
  const setAdminActive = async (id, active) => {
    requireRole('super-admin');
    const admin=db.admins.find((item)=>item.id===id&&item.role==='admin');if(!admin)throw new Error('Admin account was not found.');
    admin.active=active;addAudit(currentAccount()?.name,`${active?'Activated':'Deactivated'} admin account`,id);addNotification(`Admin account ${admin.email} was ${active?'activated':'deactivated'}.`,'super-admin');persistDb();refreshLocal();
  };
  const updateAdmin = async (id, patch) => {
    requireRole('super-admin');
    const admin=db.admins.find(item=>item.id===id&&item.role==='admin');if(!admin)throw new Error('Admin account was not found.');
    if(db.admins.some(item=>item.id!==id&&item.email.toLowerCase()===patch.email.trim().toLowerCase()))throw new Error('That email is already assigned to an account.');
    Object.assign(admin,{name:patch.name.trim(),email:patch.email.trim(),designation:patch.designation.trim()});
    addAudit(currentAccount()?.name,'Edited admin account',id);addNotification(`Admin account ${admin.email} was updated.`,'super-admin');persistDb();refreshLocal();
  };
  const updateCitizenProfile = async (id, patch) => {
    requireRole('admin','super-admin');
    const citizen=db.citizens.find(item=>item.id===id);if(!citizen)throw new Error('Citizen record was not found.');
    const oldName=citizen.name,oldPlates=db.vehicles.filter(v=>v.citizenId===id).map(v=>v.registrationNumber);
    Object.assign(citizen,{name:patch.name.trim(),email:patch.email.trim(),phone:patch.phone.trim()});
    db.vehicles.filter(v=>v.citizenId===id).forEach(v=>{v.ownerName=citizen.name;});
    db.challans.filter(c=>oldPlates.includes(c.vehicleNumber)).forEach(c=>{c.ownerName=citizen.name;});
    db.complaints.filter(c=>oldPlates.includes(c.vehicleNumber)||c.citizenName===oldName).forEach(c=>{c.citizenName=citizen.name;c.contact={email:citizen.email,phone:citizen.phone};});
    addAudit(currentAccount()?.name,'Updated citizen profile',id);persistDb();refreshLocal();
  };
  const updateVehicleRecord = async (registrationNumber, patch) => {
    requireRole('admin','super-admin');
    const vehicle=db.vehicles.find(item=>item.registrationNumber===registrationNumber);if(!vehicle)throw new Error('Vehicle record was not found.');
    const next=patch.registrationNumber.trim().toUpperCase();if(db.vehicles.some(item=>item!==vehicle&&item.registrationNumber.replace(/\s/g,'')===next.replace(/\s/g,'')))throw new Error('That registration number is already registered.');
    vehicle.registrationNumber=next;vehicle.vehicleType=patch.vehicleType.trim();vehicle.registrationStatus=patch.registrationStatus;
    const updated=next!==registrationNumber;
    if(updated){db.challans.filter(c=>c.vehicleNumber===registrationNumber).forEach(c=>{c.vehicleNumber=next});db.payments.filter(p=>p.vehicleNumber===registrationNumber).forEach(p=>{p.vehicleNumber=next});db.disputes.filter(d=>d.vehicleNumber===registrationNumber).forEach(d=>{d.vehicleNumber=next});db.detections.filter(d=>d.detectedRegNo===registrationNumber).forEach(d=>{d.detectedRegNo=next});db.history.filter(h=>h.vehicleNumber===registrationNumber).forEach(h=>{h.vehicleNumber=next});db.complaints.filter(c=>c.vehicleNumber===registrationNumber).forEach(c=>{c.vehicleNumber=next});db.notifications.filter(n=>n.audience===registrationNumber).forEach(n=>{n.audience=next});}
    addAudit(currentAccount()?.name,'Updated vehicle record',next);persistDb();refreshLocal();
  };
  const setChallanReview = async (id, decision, reason='') => {
    requireRole('admin');
    const challan=db.challans.find((item)=>item.id===id);if(!challan)throw new Error('Challan was not found.');
    challan.status=decision==='reject'?'Cancelled':decision==='review'?'Pending Approval':'Issued';challan.reviewNote=reason;challan.reviewedAt=new Date().toISOString();
    const detection=db.detections.find((item)=>item.id===challan.detectionId);if(detection)detection.status=decision==='reject'?'Rejected':decision==='review'?'Under Review':'Approved';
    addAudit(currentAccount()?.name,`Challan ${decision}`,id);addNotification(`Challan ${id} was ${decision==='reject'?'rejected':decision==='review'?'sent for review':'verified'}.`,challan.vehicleNumber);persistDb();refreshLocal();
  };

  const counts=useMemo(()=>({pendingVerifications:detections.filter((d)=>d.status==='Pending').length,pendingApprovals:challans.filter((c)=>c.status==='Pending Approval').length,pendingComplaints:complaints.filter((c)=>c.status==='Pending').length}),[detections,challans,complaints]);
  const value={officer:CURRENT_OFFICER,loading,error,reload:load,detections,challans,complaints,history,vehicles,penaltyRules,faqs,counts,citizens,payments,disputes,notifications,audit,admins,currentAccount:currentAccount(),refreshLocal,
    generateChallan,recordVerification,updateComplaint,updateChallanStatus,savePenaltyRules,recordPayment,submitDispute,resolveDispute,addAdmin,setAdminActive,updateAdmin,updateCitizenProfile,updateVehicleRecord,setChallanReview};
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export const useApp=()=>{const ctx=useContext(AppContext);if(!ctx)throw new Error('useApp must be used within AppProvider');return ctx;};
