# Backend handoff

## Current frontend and what is simulated

This repository is a Vite/React frontend demo with no backend implementation. `src/services/mockDb.js` seeds a connected object into localStorage key `echallan_mock_database_v2` on first use and persists changes. `src/services/api.js` selects the mock adapter by default; a REST adapter is present as an integration seam. The app has public vehicle lookup, staff login/role-aware pages, challan and detection workflows, dispute handling, simulated payments/receipts, notifications, reports, audit display, and Super Admin rule/account management.

The following are currently browser simulations: identity and session state, all database writes, role enforcement, payment outcome and transaction/receipt IDs, fine schedule, CCTV evidence association, analytics, and audit trail. No actual payment processor, camera feed, evidence upload/storage, authoritative legal source, durable shared DB, or server authorization exists. Seed account passwords are plaintext demo data; never deploy or carry them into a backend. Passwords are intentionally omitted here.

## Existing service/API boundary

| File | Existing responsibility | Backend integration note |
| --- | --- | --- |
| `src/services/api.js` | Exports mock and REST implementations for detections, vehicles, rules, challans, verification history, and complaints | Preserve its component-facing contract where practical; extend it for payments, disputes, profiles, notifications, accounts, reports and audit as backend endpoints are added. |
| `src/services/httpClient.js` | JSON `fetch` wrapper, base URL, optional bearer token read from localStorage | Add robust error parsing, timeout/abort behavior, correlation IDs, and the selected session strategy. Current token lookup has no matching real issuer. |
| `src/data/config.js` | `USE_MOCK_API`, `API_BASE_URL`, demo rules, current officer, CCTV path | Move environment-specific values to documented Vite env/config and remove demo defaults for deployment. |
| `src/context/AppContext.jsx` | Loads data and coordinates workflow actions/UI state | Replace mock persistence through service methods without moving trust decisions into the browser. Handle loading, errors, optimistic updates and refetch/reconciliation. |
| `src/services/auth.js` | Mock account authentication, current account, role checks, local session and audit/notification helpers | Replace with server session lifecycle and identity from a trusted endpoint. |
| `src/services/mockDb.js` | Seed, migrate, persist, and reset browser data | Retain only as an explicit demo adapter; never treat localStorage as production storage. |
| `src/services/systemAdmin.js` | Super Admin mock account/system operations | Call server-authorized operations and refresh returned records. |
| `src/utils/fineCalculator.js` | Calculates challan lines from rule records and creates demo challan identifiers | Backend must repeat calculation from its own active approved rule set and generate authoritative identifiers. |

`API_DOCUMENTATION.md` lists current adapter paths separately from proposed endpoint contracts. The frontend's existing path names are not a guarantee of an existing server.

## Suggested backend architecture

Use a versioned JSON API with separate modules for identity/access, vehicles/citizens, detections/evidence, challans/rules, disputes/grievances, payments/receipts, notifications, reports, and audit. Keep business workflows in application services and centralize authorization/policy checks. Controllers validate/serialize input and must not accept client-calculated fines, roles, payment success, or record ownership as authoritative.

Suggested components:

- API service with authentication middleware, role/resource policy layer, request validation, rate limits, and consistent error mapping.
- Relational database (for example, PostgreSQL) for authoritative records, foreign keys, uniqueness, transactions, and indexed search/report queries.
- Private object storage for evidence assets, with metadata in the database and short-lived access URLs.
- Optional queue/worker for notifications, scheduled reports, retention, and payment reconciliation.
- Payment-provider adapter isolated from challan business logic; use hosted checkout/tokenization rather than collecting raw payment secrets.

The specific framework, hosting provider, database product, and payment provider are intentionally left open; none is present in this repository.

## Suggested database design

Use normalized users/roles, citizens, vehicles, versioned rules/categories, detections, evidence assets, challans and immutable challan lines, payments, receipts, disputes, complaints, notifications, system configuration and append-only audit events. See [Database design](DATABASE_DESIGN.md) for proposed fields, types, relationships, status vocabulary, and the ER diagram.

Store money as fixed precision decimal or integer minor units consistently. Use server-generated IDs, UTC timestamps, foreign keys, unique normalized registration numbers, and explicit status transitions. Preserve original rule/legal/fine snapshots on challans and immutable payment/receipt snapshots.

## Authentication and sessions

Replace the mock `authenticate()` flow with server-side credential verification against strong password hashes (or an approved identity provider if selected). Return only the minimum identity fields and server-derived role/permissions. Deactivate/revoke sessions when accounts are disabled or role changes. Prefer secure, HttpOnly, SameSite cookies with CSRF protection for a same-site web app; if a bearer-token architecture is selected, document secure storage, rotation, expiry, revocation, and XSS implications rather than copying the demo localStorage token pattern.

Citizen lookup can remain public, but use rate limiting, enumeration controls, minimum disclosure, and an ownership verification step before exposing sensitive details or allowing payment/dispute actions. The current demo has no Citizen account authentication.

## Secure role authorization

Use deny-by-default server policy and validate both action and record scope on every request. Keep Super Admin-only operations separate from Admin permissions. Only Super Admin can modify global laws, legal provisions, categories and fine configuration; Admin and Citizen reads are read-only. Admin issuance must calculate from the active approved server configuration. Store the snapshot/version on the challan. Never trust frontend role state, localStorage, hidden buttons, request-supplied actor IDs, or submitted fine totals.

Record previous value, new value, reason, authenticated actor, timestamp, and configuration version for every privileged rule change. Audit account activation/deactivation and any role change as well. Protect audit read and export paths.

## Payments, transactions, and receipts

The current payment interface is simulation-only. For a future real implementation, select a compliant provider and redirect to its hosted/tokenized payment UX. Do not collect or store raw card number/CVV, UPI PIN, or banking password. Verify provider callbacks/signatures server-side; use idempotency keys; reconcile asynchronous states; handle retries/refunds; and make settlement atomic with the challan's paid status, receipt, notification, and audit event. Failed payment must leave the challan unpaid. Prevent a second successful settlement for an already-paid challan unless the product explicitly supports partial payments.

Receipts should be generated from the settled transaction on the server, carry stable transaction and challan references, and remain immutable. The current printable/downloadable receipt is browser-generated demo output.

## Evidence and CCTV

The current public asset `public/videos/cctv-evidence.mp4` is one shared sample clip. For real evidence, store files in private object storage, maintain evidence metadata/checksum/capture time/source/retention, validate media type and size, authorize every access, and issue short-lived access links. Preserve evidence provenance and review history. Do not assume the sample clip belongs to a specific seed challan or connect it to a real camera without a deliberate integration.

## Notifications, validation, and errors

Persist recipient-scoped notification records and read state server-side. Dispatch email/SMS only through configured providers and consent/policy; none exists in this repo. Validate all input server-side: normalized registration numbers, allowed status transitions, active rule codes, bounded pagination, decimal fine/payment values, attachment policy, and required reasons. Return a consistent error envelope with field-level validation details; do not expose internal stack traces, secrets, or other users' records.

## Consistency and audit

Wrap payment settlement, challan issuance, dispute decision, and privileged configuration updates in transactions. Use optimistic versioning or locks to avoid stale edits. Use idempotency for operations vulnerable to retries. Derived totals, dashboards, and reports must be calculated from authoritative data; cache only with clear invalidation/reconciliation rules. Audit significant actions as append-only events, including actor, target, timestamp, outcome, reason, and old/new values where appropriate.

## Configuration and environment variables

The frontend currently reads `VITE_API_BASE_URL` with default `http://localhost:8080/api/v1`; `USE_MOCK_API` is a source constant, not an environment variable. There is no `.env.example` or backend environment configuration in this repository. For a backend, keep secrets in deployment secret management and document names/semantics without committing values. Likely environment-specific settings include database URL, session/signing secrets, allowed frontend origins, object storage settings, notification provider credentials, payment provider keys/webhook secrets, and log/retention controls. Use separate development/demo/production configuration and fail closed when required security settings are missing.

Never place backend secrets in `VITE_*` values: Vite embeds those values in client assets. Frontend base URL is public configuration only.

## Phased backend roadmap

1. **Contract and identity:** agree on API shapes, normalize data model, implement secure authentication, sessions, role and object-level authorization.
2. **Read workflows:** implement vehicle lookup, citizen/vehicle/challan/rule reads, filtering/pagination, and replace mock reads while retaining page/context contracts.
3. **Operational workflows:** implement detection verification, challan issue/status transitions, rule snapshots, dispute/grievance workflows, audit and notification persistence.
4. **Payment simulation service:** move demo simulation to backend with idempotent outcomes and server receipts; verify cross-portal consistency before selecting any real payment integration.
5. **System administration:** implement account management, exclusive versioned rule configuration, settings, performance/analytics, and audit controls.
6. **Evidence and production hardening:** add private evidence storage, retention, monitoring, backups, security review, automated tests, and operational runbooks.

At each phase, keep `USE_MOCK_API` as a local demo option only if intentional; add a controlled API implementation switch and environment-safe configuration without exposing secrets.

## Integration acceptance criteria

- Existing entry, lookup, Admin, Super Admin, and CCTV routes still render and keep their established workflows.
- All portal views read the same authoritative records; updates remain consistent after reload and across users/devices.
- Unauthorized direct requests fail server-side, especially Admin/Citizen writes to rules/fines and Citizen access to another person's private records.
- Challan issuance uses active approved rules on the server and stores an immutable line snapshot/configuration version.
- Duplicate/retried payment requests cannot create duplicate settlement; failed attempts leave challans unpaid; receipts map to successful transactions only.
- Dispute and evidence review decisions persist actor, time, reason/outcome, audit, and notifications.
- Validation, empty/loading/error states, pagination and filters behave consistently with current UI workflows.
- No demo password, token, payment credential, or backend secret is shipped in production frontend bundles.
- Backend build, migrations, API tests, authorization tests, and end-to-end tests are documented and pass in CI before production use.
