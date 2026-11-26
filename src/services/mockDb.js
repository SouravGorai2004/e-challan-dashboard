import { MOCK_LATENCY, DEFAULT_PENALTY_RULES } from '../data/config';
import { vehicles as vehicleSeed, detections, challans as challanSeed, complaints, verificationHistorySeed } from '../data/mockData';

const names = ['Aarav Sharma','Isha Mukherjee','Kabir Das','Meera Joshi','Arjun Nair','Sana Khan','Rohan Patel','Ananya Bose','Dev Malhotra','Tara Iyer','Neel Chatterjee','Pooja Rao'];
const extras = [
  ['MH 12 QX 6041','SUV'],['KA 03 MN 8172','Electric Scooter'],['DL 8C AB 3921','Sedan'],['GJ 01 RV 5510','Bus'],['UP 32 LK 7834','Motorcycle'],['TN 09 CP 2418','Light Goods Vehicle'],['RJ 14 DZ 6620','Auto-Rickshaw'],
];
const seedVehicles = [...structuredClone(vehicleSeed), ...extras.map(([registrationNumber, vehicleType], i) => ({
  registrationNumber, ownerName: names[i + 1], vehicleType, registrationDate: `202${i % 5}-${String((i % 12) + 1).padStart(2,'0')}-12`, registrationValidity: '2035-01-01', registrationStatus: 'Valid',
  insurance: { status: 'Valid', expiry: '2027-09-01' }, puc: { status: 'Valid', expiry: '2027-06-01' }, fitness: { status: 'Valid', expiry: '2030-01-01' },
}))];
const citizens = [...new Set(seedVehicles.map(v => v.ownerName))].map((name, i) => ({ id: `CIT-${String(i + 1).padStart(4, '0')}`, name, email: `${name.toLowerCase().replace(/\s/g,'.')}@mail.demo`, phone: `9${String(812345670 + i).slice(1)}`, active: true }));
seedVehicles.forEach((v) => { v.citizenId = citizens.find(c => c.name === v.ownerName)?.id; });
// Required demo scenarios: 3 unpaid for first vehicle, 2 paid + 1 unpaid for second,
// one no-challan vehicle and one pending challan. All amounts are illustrative.
const extraChallans = [];
for (let i = 0; i < 19; i += 1) {
  const vehicle = seedVehicles[i % seedVehicles.length];
  const index = i + 1;
  let forced = i < 2 ? { v: 0, state: 'Issued', pay: 'Unpaid' }
    : i === 2 ? { v: 3, state: 'Issued', pay: 'Unpaid' }
    : i < 6 ? { v: 1, state: i === 5 ? 'Issued' : 'Closed', pay: i === 5 ? 'Unpaid' : 'Paid' }
      : { v: (i + 2) % seedVehicles.length, state: i === 7 ? 'Pending Approval' : [9,11,15,17].includes(i) ? 'Disputed' : i === 12 ? 'Cancelled' : 'Issued', pay: i % 4 === 0 ? 'Paid' : 'Unpaid' };
  if ([6,10,13].includes(i)) forced = { v: 8, state: i === 13 ? 'Issued' : 'Closed', pay: i === 13 ? 'Unpaid' : 'Paid' };
  if (i === 5 || (i >= 6 && forced.v === 1)) forced = { ...forced, v: 2 };
  const selectedVehicle = seedVehicles[forced.v];
  const fine = [500, 1000, 1500, 2000][i % 4];
  const isDisputed = forced.state === 'Disputed';
  extraChallans.push({ id: `CH-2026-${String(4502 + index).padStart(6, '0')}`, detectionId: i < detections.length ? detections[i].id : null,
    vehicleNumber: selectedVehicle.registrationNumber, ownerName: selectedVehicle.ownerName, violations: [{ code: ['NO_HELMET','OVER_SPEEDING','SIGNAL_VIOLATION','WRONG_SIDE'][i % 4], label: ['No Helmet','Over Speeding','Signal Violation','Wrong-Side Driving'][i % 4], fine }], fineAmount: fine,
    officer: ['R. K. Sharma','S. Mukherjee','A. Dutta'][i % 3], generatedAt: `2026-11-${String(15 + (i % 11)).padStart(2,'0')}T10:30:00`, paymentStatus: forced.pay, status: forced.state,
    evidence: i % 2 === 0 ? '/videos/cctv-evidence.mp4' : null, disputeId: isDisputed ? `DSP-${String(1001 + i).padStart(4,'0')}` : null });
}
const noChallanPlate = seedVehicles[14].registrationNumber;
const seedChallans = [...structuredClone(challanSeed), ...extraChallans.filter((c) => c.vehicleNumber !== noChallanPlate)];
// Fix the three-unpaid and two-paid/one-unpaid vehicle scenarios after merging legacy seeds.
const firstPlate = seedVehicles[0].registrationNumber;
const secondPlate = seedVehicles[1].registrationNumber;
seedChallans.filter((c) => c.vehicleNumber === firstPlate).slice(0, 3).forEach((c) => { c.status = 'Issued'; c.paymentStatus = 'Unpaid'; });
seedChallans.filter((c) => c.vehicleNumber === secondPlate).slice(0, 3).forEach((c, i) => { c.status = i < 2 ? 'Closed' : 'Issued'; c.paymentStatus = i < 2 ? 'Paid' : 'Unpaid'; });
while (seedChallans.filter((c) => c.paymentStatus === 'Paid').length < 10) {
  const next = seedChallans.find((c) => c.vehicleNumber !== firstPlate && c.vehicleNumber !== secondPlate && c.status !== 'Cancelled' && c.status !== 'Disputed' && c.paymentStatus !== 'Paid');
  if (!next) break;
  next.paymentStatus = 'Paid'; next.status = 'Closed';
}
seedChallans.forEach((c) => { if (!c.evidence && c.detectionId) c.evidence = '/videos/cctv-evidence.mp4'; });

const payments = seedChallans.filter((c) => c.paymentStatus === 'Paid').slice(0, 10).map((c, i) => ({
  id: `TXN-DEMO-${String(7120 + i)}`, challanId: c.id, vehicleNumber: c.vehicleNumber, amount: c.fineAmount, method: ['UPI','Debit Card','Credit Card','Net Banking'][i % 4], status: 'Success', at: c.generatedAt, receiptId: `RCP-${String(9010 + i)}`,
}));
const failedExample = seedChallans.find((c) => c.paymentStatus !== 'Paid' && c.status === 'Issued');
if (failedExample) payments.push({ id:'TXN-DEMO-FAILED-01', challanId:failedExample.id, vehicleNumber:failedExample.vehicleNumber, amount:failedExample.fineAmount, method:'UPI', status:'Failure', at:'2026-11-24T14:20:00', receiptId:null });
const disputes = seedChallans.filter((c) => c.status === 'Disputed').map((c, i) => ({ id: c.disputeId, challanId: c.id, vehicleNumber: c.vehicleNumber, citizenId: seedVehicles.find((v) => v.registrationNumber === c.vehicleNumber)?.citizenId, reason: ['Incorrect vehicle identification','Evidence is unclear','Vehicle was sold before issue','Violation details need review'][i % 4], details: 'Please review the available evidence and registration details.', status: i === 0 ? 'Resolved' : 'Pending', resolution: i === 0 ? 'Evidence reviewed; challan upheld.' : '', submittedAt: c.generatedAt }));
disputes.filter((dispute) => dispute.status === 'Resolved').forEach((dispute) => {
  const linkedChallan = seedChallans.find((challan) => challan.id === dispute.challanId);
  if (linkedChallan?.status === 'Disputed') linkedChallan.status = 'Issued';
});
const seed = {
  citizens, vehicles: seedVehicles, detections: structuredClone(detections), challans: seedChallans, complaints: structuredClone(complaints), history: structuredClone(verificationHistorySeed),
  penaltyRules: structuredClone(DEFAULT_PENALTY_RULES), payments, disputes,
  faqs: [
    { id:'FAQ-01', question:'How do I find challans for my vehicle?', answer:'Enter the registration number on the public lookup page. No citizen account is required.' },
    { id:'FAQ-02', question:'Are online payments real?', answer:'No. Payment outcomes are simulated and no financial credentials are collected.' },
    { id:'FAQ-03', question:'How can I dispute a challan?', answer:'Open an eligible challan, choose Raise dispute, and submit a reason with supporting details.' },
    { id:'FAQ-04', question:'Where can I view a receipt?', answer:'Successful demo payments appear in Payment history and include a printable/downloadable receipt.' },
  ],
  notifications: [
    { id:'NTF-1001', message:'Demo system is ready. Review vehicle challans and payment options from your portal.', audience:'all', at:'2026-11-26T09:00:00', read:false },
    { id:'NTF-1002', message:'Your challan history is available for review. Raise a dispute if any case details need correction.', audience:seedVehicles[0].registrationNumber, at:'2026-11-24T11:15:00', read:false },
    { id:'NTF-1003', message:'A simulated payment was recorded for this vehicle. Open Payment history to view the receipt.', audience:seedVehicles[1].registrationNumber, at:'2026-11-23T16:40:00', read:true },
    { id:'NTF-1004', message:'Three citizen disputes are awaiting operational review.', audience:'admin', at:'2026-11-26T08:45:00', read:false },
    { id:'NTF-1005', message:'System seed contains illustrative traffic rules and fine configuration version 1.', audience:'super-admin', at:'2026-11-26T08:30:00', read:false },
  ],
  audit: [
    ...seedChallans.map((challan, index) => ({ id:`AUD-SEED-CH-${String(index + 1).padStart(3,'0')}`, actor:challan.officer, action:challan.status === 'Cancelled' ? 'Challan cancelled' : 'Challan issued', target:challan.id, at:challan.generatedAt })),
    ...verificationHistorySeed.map((entry, index) => ({ id:`AUD-SEED-VH-${String(index + 1).padStart(3,'0')}`, actor:entry.officer, action:`CCTV ${entry.action.toLowerCase()}`, target:entry.detectionId, at:entry.at, reason:entry.reason })),
    { id:'AUD-1001', actor:'System', action:'Demo data initialized', target:'system', at:'2026-11-26T09:00:00' },
  ],
  admins: [
    { id:'ADM-1001', name:'R. K. Sharma', email:'admin@echallan.demo', password:'Admin@123', role:'admin', active:true, designation:'Motor Vehicle Inspector' },
    { id:'ADM-1002', name:'S. Mukherjee', email:'s.mukherjee@echallan.demo', password:'Admin@123', role:'admin', active:true, designation:'Traffic Enforcement Officer' },
    { id:'ADM-1003', name:'A. Dutta', email:'a.dutta@echallan.demo', password:'Admin@123', role:'admin', active:true, designation:'Regional Enforcement Officer' },
    { id:'SA-1001', name:'System Administrator', email:'superadmin@echallan.demo', password:'SuperAdmin@123', role:'super-admin', active:true, designation:'System Administrator' },
  ], settings: { systemName:'E-Challan Management System', maintenanceMode:false, paymentSimulation:true, penaltyRuleVersion:1, permissions:{ admin:['challan:manage','verification:review','dispute:resolve','records:manage','payments:monitor'], 'super-admin':['system:manage','accounts:manage','rules:manage','audit:read'] } },
};
seedChallans.forEach((challan) => {
  if (!challan.penaltyRuleVersion) challan.penaltyRuleVersion = 1;
  if (!challan.ruleSnapshot) challan.ruleSnapshot = (challan.violations || []).map((line) => {
    const rule = DEFAULT_PENALTY_RULES.find((item) => item.code === line.code);
    return { ...line, ruleReference: line.ruleReference || rule?.ruleReference || 'Illustrative demo rule', configurationVersion: challan.penaltyRuleVersion };
  });
});
const STORE_KEY = 'echallan_mock_database_v2';
const loadStored = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!value?.vehicles || !value?.challans || !value?.admins) return structuredClone(seed);
    value.faqs ||= structuredClone(seed.faqs);
    value.settings ||= {};
    value.settings.penaltyRuleVersion ||= 1;
    value.settings.permissions ||= structuredClone(seed.settings.permissions);
    value.challans.forEach((challan) => {
      challan.penaltyRuleVersion ||= 1;
      challan.ruleSnapshot ||= (challan.violations || []).map((line) => {
        const rule = value.penaltyRules?.find((item) => item.code === line.code) || DEFAULT_PENALTY_RULES.find((item) => item.code === line.code);
        return { ...line, ruleReference: line.ruleReference || rule?.ruleReference || 'Illustrative demo rule', configurationVersion: challan.penaltyRuleVersion };
      });
    });
    value.penaltyRules ||= structuredClone(seed.penaltyRules);
    if (!value.payments?.some((payment) => payment.status === 'Failure')) {
      const unpaid = value.challans.find((challan) => challan.status === 'Issued' && challan.paymentStatus !== 'Paid');
      if (unpaid) value.payments = [...(value.payments || []), { id:'TXN-DEMO-FAILED-01', challanId:unpaid.id, vehicleNumber:unpaid.vehicleNumber, amount:unpaid.fineAmount, method:'UPI', status:'Failure', at:'2026-11-24T14:20:00', receiptId:null }];
    }
    return value;
  }
  catch { return structuredClone(seed); }
};
export const db = loadStored();
export function persistDb() { try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch { /* private browsing can disable storage */ } }
export function resetDemoData() { Object.keys(db).forEach((key) => delete db[key]); Object.assign(db, structuredClone(seed)); persistDb(); }
export const delay = (value, ms = MOCK_LATENCY) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
