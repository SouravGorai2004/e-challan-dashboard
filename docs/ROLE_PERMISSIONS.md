# Roles and permissions

## Security model today

The UI has three experiences: public Citizen lookup, Admin operations, and Super Admin system management. Login and route gating are implemented in browser code (`src/services/auth.js`, `src/components/auth/ProtectedRoute.jsx`). This is useful for the demo's navigation and workflow, but it is **not secure authentication or authorization**: the database, account state, and role checks are delivered to/controlled by the browser. Do not rely on them to protect real personal, legal, or financial data.

The backend must authenticate every protected request, load the actor's role from trusted server-side state, authorize each action and record scope, and ignore any role or permission value supplied by the client. UI hiding is only a usability measure.

## Role hierarchy and responsibilities

| Capability | Citizen | Admin | Super Admin |
| --- | --- | --- | --- |
| Vehicle lookup | Public lookup by registration number; no account required | View operational vehicle records | System-wide records |
| Challans | View associated challans/details, evidence references, status, and totals | Issue from reviewed detections using active rules; manage permitted status and review workflows | Monitor system-wide; no need to duplicate daily Admin responsibilities |
| Payments | Simulated payment methods, outcome, history, receipt | Monitor transaction records | System-wide payment/collection monitoring |
| Disputes/grievances | Submit and track a challan dispute; view grievance/notification history in the demo | Review and resolve cases | Monitor system-wide cases |
| CCTV/evidence | Inspect evidence made available for the challan | Review demo footage and verification cases; approve, reject, or request review | Monitor verification performance/records |
| Traffic laws, categories, legal provisions, fine schedule | Read/search only | Read-only; may apply existing active rules when issuing a challan | Exclusive management: create, edit, activate/deactivate, and version configuration |
| Staff accounts and permissions | None | Cannot manage Super Admin accounts or global permissions | Create/edit/activate/deactivate Admin accounts and manage configured permissions |
| Reports and audit | Own/public-facing history | Operational reports/activity within UI | System-wide analytics and audit review |
| System settings | None | Read-only operational settings where exposed | Manage system settings |

Portal pages and route shape are documented in [Architecture](ARCHITECTURE.md). Exact UI operations are mock demo capabilities, not proof of production security.

## Strict law and fine configuration boundary

1. Only Super Admin can modify global traffic laws, legal provisions, violation categories, and global fine configurations.
2. Citizen and Admin views are read-only. Editing controls should be hidden for these roles, but the service/server must reject their write attempts regardless of the UI.
3. When an Admin issues a challan, the trusted backend must calculate the fine from the currently active Super Admin-approved configuration. Reject client-supplied fine overrides.
4. Store an immutable snapshot of rule code/name, legal reference, fine amount, and configuration version on each issued challan line. A later schedule change must not silently alter historical or paid records.
5. Each Super Admin configuration change requires a reason and an audit record with previous value, new value, actor, timestamp, and resulting configuration version.
6. Enforce the same restrictions in API authorization and persistence services. Client localStorage, hidden buttons, frontend context, and role fields are user-controlled and cannot serve as a permission boundary.

## Current implementation details

- `ProtectedRoute` checks `currentAccount()` and allowed role for protected route groups.
- `currentAccount()` resolves the session account from the local mock `admins` collection and checks the stored account is active.
- `api.updatePenaltyRules()` requires `super-admin`, validates a reason and basic rule fields, increments configuration version, updates the shared mock database, and writes an audit/notification record.
- `api.createChallan()` requires `admin`, resolves selected codes against current active rules, calculates the line totals, and saves rule snapshots.
- Citizen lookup and mock payment/dispute operations are public workflows rather than authenticated Citizen account capabilities.

These checks are source-level demo guards only. The mock account collection includes plaintext demo passwords; those must not be reused or migrated. Password hashes, session revocation, server-side policy, CSRF/session protections, and API rate limiting are outside this frontend repository.

## Recommended server authorization matrix

| Resource/action | Citizen | Admin | Super Admin |
| --- | --- | --- | --- |
| Public vehicle lookup | Allow with enumeration protections and minimized data | Allow | Allow |
| Read private citizen profile/payment history | Own records only after identity verification | Scoped operational need | System policy/audit |
| Create challan | Deny | Allow for reviewed detection and active rule codes | Monitor; optional emergency operations should be separately audited |
| Review detection / evidence | Deny | Allow within assigned scope | Read/monitor system-wide |
| Submit dispute | Allow for eligible challan claimant | Deny as submitter; review assigned cases | Monitor; resolution override only if explicitly authorized and audited |
| Resolve dispute | Deny | Allow with reason and allowed transition | System-wide authority only if policy defines it |
| Write traffic rules/fines/categories | Deny | Deny | Allow with reason, approval/version, and audit |
| Manage Admin accounts | Deny | Deny | Allow; constrain role and prevent unsafe lockout |
| Read audit log | Deny | Own/scoped events as policy requires | Allow system-wide; logs remain append-only |

The backend should use deny-by-default policy checks and tests for both permitted and forbidden actions, including direct API calls.
