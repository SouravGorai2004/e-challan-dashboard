# API documentation

## Status and scope

**The application has no running backend API.** The default service uses browser mock data (`USE_MOCK_API = true`). The first section below lists the REST paths already named in the frontend adapter; they are expected integration paths, not verified live endpoints. The remaining `/api/v1` contracts are proposals derived from UI workflows and should be reviewed with the backend team before implementation.

The REST base URL is configured by `VITE_API_BASE_URL` and defaults to `http://localhost:8080/api/v1`. `src/services/httpClient.js` uses JSON `fetch` requests and can read a token from localStorage, but this project does not provide a real token issuer or server session.

## Frontend adapter paths (not live APIs)

These methods and paths are present in `src/services/api.js`. Their mock implementations work in-browser; their REST implementations require an external backend with compatible behavior.

| Method | Path | Mock purpose / expected role |
| --- | --- | --- |
| GET | `/detections` | List detections; UI access is Admin |
| GET | `/detections/{id}` | Read a detection; Admin |
| GET | `/vehicles` | List vehicles; operational portal |
| GET | `/vehicles/{regNo}` | Read vehicle by registration; public Citizen lookup workflow |
| GET | `/penalty-rules` | Read rules; all portals |
| PUT | `/penalty-rules` | Update rule set; Super Admin only in mock/adapter guard |
| GET | `/challans` | List challans; portal-specific presentation |
| POST | `/challans` | Issue from detection/vehicle/rule codes; Admin only |
| PATCH | `/challans/{id}/status` | Change status; Admin only |
| POST | `/detections/{id}/verification` | Record verification; Admin only |
| GET | `/verification-history` | Read verification history; Admin |
| GET | `/complaints` | List complaints; Admin operations |
| PATCH | `/complaints/{id}` | Update complaint; Admin only |

The frontend's mock `createChallan` accepts `{ detectionId, vehicle, codes, officer }`; the server should resolve trusted vehicle/rule data itself rather than trust client-supplied owner, officer, or amounts. Rule update mock payload is `{ rules, reason }`. These details describe the current adapter seam, not a stable public API specification.

## Proposed API conventions

All endpoints in the following sections are **proposed**, not implemented. Suggested base prefix: `/api/v1`. Require HTTPS, authenticated sessions for protected routes, server-side role authorization, JSON validation, pagination, and safe error messages. Use RFC 3339 UTC timestamps. Suggested error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be accepted.",
    "fields": { "registrationNumber": "Invalid format." }
  }
}
```

Typical HTTP errors: `400` malformed request, `401` unauthenticated, `403` forbidden, `404` missing record, `409` conflict/invalid state or duplicate action, `422` validation failure, `429` rate-limited, and `500` unexpected server failure. Do not expose stack traces, credentials, tokens, or sensitive evidence URLs.

## Authentication and authorization (proposed)

| Method and URL | Role | Purpose and example |
| --- | --- | --- |
| POST `/auth/sessions` | Public | Authenticate staff/citizen account. Request `{ "email": "operator@example.test", "password": "<entered securely>" }`; response `{ "user": { "id": "…", "name": "…", "role": "admin" }, "expiresAt": "…" }`. Password is never echoed. |
| GET `/auth/me` | Authenticated | Return current server-authorized identity and permissions: `{ "id": "…", "role": "admin", "active": true }`. |
| DELETE `/auth/sessions/current` | Authenticated | Revoke current session; response `204`. |

Reject invalid credentials with `401`, inactive accounts with a generic `401`/`403` policy, and disallowed roles/actions with `403`. The client must not choose or elevate its role in a request.

## Public vehicle lookup (proposed)

| Method and URL | Role | Purpose and example |
| --- | --- | --- |
| GET `/public/vehicles/{registrationNumber}/challans` | Public, rate-limited | Return a privacy-minimized vehicle summary and associated challans. Example response: `{ "vehicle": { "registrationNumber": "WB 38 AK 4821", "vehicleType": "…" }, "challans": [{ "id": "CH-…", "status": "Issued", "paymentStatus": "Unpaid", "fineAmount": 500, "violations": [] }], "totals": { "outstanding": 500, "paid": 0 } }`. |
| GET `/public/challans/{challanId}` | Public lookup token or verified vehicle context | Read permitted challan detail, rule snapshot and evidence metadata. Avoid exposing personal contact data based on a guessable ID alone. |

Normalize and validate registration numbers; rate-limit enumeration. Return an empty `challans` array for a known vehicle with no cases, and use `404` or privacy-preserving not-found semantics for unknown registration.

## Citizen profile and vehicles (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| GET `/citizens/me` | Citizen | Read own profile: `{ "id": "…", "name": "…", "email": "…", "phone": "…" }`. |
| PATCH `/citizens/me` | Citizen | Update permitted contact fields only; reject role/status/identity changes. |
| GET `/citizens/me/vehicles` | Citizen | List owned vehicles and registration status. |
| GET `/citizens/me/payments` | Citizen | Read own transaction history. |
| GET `/citizens/me/disputes` | Citizen | Read own dispute/grievance cases. |

Return `403` for another citizen's resource and validate vehicle ownership before attaching a vehicle.

## Challan management (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| GET `/challans?status=Issued&vehicleNumber=…&page=1&pageSize=20&sort=generatedAt:desc` | Admin, Super Admin; Citizen only own/public view policy | Filter/paginate. Example `{ "items": [{ "id": "CH-…", "vehicleId": "…", "status": "Issued", "paymentStatus": "Unpaid", "fineAmount": 1000, "ruleConfigurationVersion": 2 }], "page": 1, "pageSize": 20, "total": 1 }`. |
| GET `/challans/{id}` | Authorized record owner/staff | Read full challan and immutable lines. |
| POST `/challans` | Admin | Issue based on reviewed detection and active rules. Request `{ "detectionId": "…", "ruleCodes": ["NO_HELMET"] }`; server resolves vehicle/rule values and snapshots version. Response `201` with `id`, `status`, `fineAmount`, and rule lines. |
| PATCH `/challans/{id}/status` | Admin, state-policy restricted | Request `{ "status": "Cancelled", "reason": "…" }`; response updated record and audit ID. |

Reject inactive rule codes, client-supplied fine overrides, invalid detection states, duplicate issuance, unauthorized record access, and unsupported state transitions (`409`/`403`). Keep payment state consistent with the ledger.

## Traffic rules and fine configuration (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| GET `/traffic-rules` | Public/Citizen/Admin/Super Admin | Read active approved rule list and version. Example `{ "version": 3, "rules": [{ "code": "NO_HELMET", "label": "No Helmet", "fineAmount": 500, "legalReference": "…", "active": true }] }`. |
| GET `/traffic-rules/{code}/versions` | Super Admin; optionally read-only public version history | Inspect versions and audit references. |
| POST `/admin/traffic-rules` | Super Admin | Create rule/category with reason; response `201`. |
| PUT `/admin/traffic-rules/{code}` | Super Admin | Create a new approved version with reason; do not mutate historical challan snapshots. Example request `{ "label": "…", "fineAmount": 750, "legalReference": "…", "active": true, "reason": "Approved schedule update" }`. |
| PATCH `/admin/traffic-rules/{code}/activation` | Super Admin | Activate/deactivate with reason. |

Admin and Citizen writes must return `403` even when called directly. Validate unique code, non-negative decimal amount, legal reference and effective dates. Every accepted change must create an audit entry with actor, timestamp, reason, old/new values, and version. The backend must calculate issued fines using the active approved configuration.

## Evidence and CCTV (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| GET `/detections` and GET `/detections/{id}` | Admin | List/read review cases with evidence metadata. |
| POST `/detections/{id}/verification` | Admin | Record `Approved`, `Rejected`, or `Sent for Review`, with reason; example request `{ "action": "Sent for Review", "reason": "Plate is not legible" }`. |
| POST `/detections/{id}/evidence` | Admin/service identity | Attach evidence using a controlled upload flow; response metadata `{ "id": "…", "contentType": "video/mp4", "capturedAt": "…" }`. |
| GET `/evidence/{id}/access` | Authorized reviewer/owner policy | Issue short-lived authorized access, not a public storage URL. |

The current app only references one static sample video and has no upload endpoint. Enforce size/type checks, malware scanning as appropriate, integrity hashes, access logs, and retention policy on the server.

## Payments and receipts (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| POST `/challans/{id}/payment-intents` | Citizen or public verified vehicle context | Create an idempotent payment attempt. Request `{ "method": "UPI", "idempotencyKey": "client-generated-random-value" }`; response `{ "paymentId": "…", "status": "Pending", "amount": 500, "simulation": true }`. A real provider flow must not accept/store raw card or UPI credentials in this app. |
| POST `/payments/{id}/confirm` | Payment provider callback/service or demo-only authorized simulator | Confirm outcome after signature verification. Response `{ "paymentId": "…", "status": "Success", "receiptId": "…" }`. |
| GET `/citizens/me/payments` or `/payments/{id}` | Citizen owner, Admin, Super Admin | Read authorized transaction status. |
| GET `/receipts/{receiptId}` | Payment owner and authorized staff | Return receipt data/PDF; example `{ "receiptId": "…", "challanId": "…", "amount": 500, "paidAt": "…", "transactionId": "…" }`. |

Reject duplicate settlement, wrong amount, already-paid/ineligible challan, invalid provider signature, or reused idempotency key with a conflicting payload. Failed attempts must not mark the challan paid. Payment settlement, receipt issuance, challan status, notification, and audit changes should be transactional.

## Disputes and grievances (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| POST `/challans/{id}/disputes` | Citizen/verified vehicle claimant | Submit `{ "reason": "Evidence is unclear", "details": "Please review the clip." }`; response `201` with pending case ID. |
| GET `/disputes?status=Pending` | Admin, Super Admin; Citizen sees own only | List/paginate authorized cases. |
| GET `/disputes/{id}` | Case owner, Admin, Super Admin | Read case, evidence references and decision history. |
| PATCH `/disputes/{id}/resolution` | Admin | Request `{ "decision": "Uphold", "resolution": "Evidence reviewed." }`; response updated case and challan status. |
| POST `/grievances` / GET `/grievances` / PATCH `/grievances/{id}` | Citizen submits; Admin handles; Super Admin monitors | Create/read/update separate service complaints, with attachment metadata and status. |

Validate eligibility and duplicate open disputes; preserve resolution actor/time/reason. Return `409` if a dispute is already resolved or no longer eligible.

## Notifications (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| GET `/notifications` | Authenticated recipient | List recipient-visible notices, optionally paginated. |
| PATCH `/notifications/{id}/read` | Recipient | Mark own notification read; response `204`. |

Do not allow a caller to choose another recipient or audience. Validate ownership and use `404`/`403` for non-owned IDs.

## Admin operations (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| GET `/admin/citizens` | Admin, Super Admin | Search/paginate permitted citizen data. |
| GET `/admin/vehicles` and GET `/admin/vehicles/{id}` | Admin, Super Admin | Search and inspect vehicle records. |
| GET `/admin/payments` | Admin, Super Admin | Monitor transactions with status/date filters. |
| GET `/admin/activity` | Admin (own/scope) and Super Admin (system) | Read activity according to visibility policy. |
| GET `/admin/reports/operations` | Admin, Super Admin | Aggregated operational metrics for a date range. |

Examples of query filters: `status`, `from`, `to`, `vehicleNumber`, `page`, `pageSize`, and documented sort fields. Enforce bounded page sizes and scope exports to caller authorization.

## Super Admin system management (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| GET `/system/admins` | Super Admin | List staff accounts, active state, role and performance aggregates. |
| POST `/system/admins` | Super Admin | Create an Admin. Request `{ "name": "…", "email": "…", "designation": "…" }`; response `201` with invitation state, never a plaintext password. |
| PATCH `/system/admins/{id}` | Super Admin | Edit allowed profile/role fields; validate least privilege. |
| PATCH `/system/admins/{id}/activation` | Super Admin | Activate/deactivate with reason and audit. Prevent unsafe self-lockout/last-admin cases by policy. |
| GET `/system/configuration` | Super Admin read/write; other roles read-only projection | Read settings. |
| PATCH `/system/configuration` | Super Admin | Update allowlisted settings with reason; audit old/new values. |
| POST `/system/demo-reset` | Super Admin, demo environment only | Optional explicitly guarded demo reset; should not exist in production. |

Reject attempts to grant Super Admin role unless an approved governance workflow permits it. Destructive operations require explicit confirmation at the service/UI level and audit records.

## Reports, analytics, and audit logs (proposed)

| Method and URL | Role | Purpose / example |
| --- | --- | --- |
| GET `/reports/system?from=…&to=…` | Super Admin | System-wide totals and time series calculated from source records. |
| GET `/reports/admin-performance?from=…&to=…` | Super Admin | Aggregated Admin operational metrics. |
| GET `/audit-logs?targetType=traffic_rule&page=1` | Super Admin; limited own events may be Admin | Search audit events. Example `{ "items": [{ "id": "…", "actorId": "…", "action": "traffic_rule.updated", "previous": {}, "next": {}, "reason": "…", "at": "…" }] }`. |

Aggregate from authoritative database records; reports must not use independent hardcoded statistics. Audit logs should be append-only, access-controlled, and avoid secrets or sensitive payment data.

## Validation and error cases

- `400` malformed JSON/query, `401` invalid/missing session, `403` role/scope denied, `404` missing or concealed resource, `409` duplicate payment/issuance or invalid state transition, `422` invalid fields/business rule, `429` abuse/rate limit.
- Registration numbers are normalized server-side; fine values are non-negative decimals; rule codes are unique; timestamps are UTC; reasons are required for privileged configuration changes and sensitive status decisions.
- Never accept a client-supplied role, approved fine amount, payment success assertion, or arbitrary evidence storage URL as authoritative.
- Responses should omit passwords, hashes, session tokens, raw provider secrets, card data, CVV, and UPI PIN.
