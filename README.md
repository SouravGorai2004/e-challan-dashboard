# E-Challan Management System

A React frontend demo for exploring an electronic traffic-challan workflow across Citizen, Admin, and Super Admin portals. It is intended for development and demonstration: records live in the browser, payment outcomes are simulated, fine values are illustrative, and role checks are client-side. It is not a production enforcement or payment service.

## Contents

- [Overview](#overview)
- [Features](#features)
- [Portals](#portals)
- [Technology](#technology)
- [Architecture and repository layout](#architecture-and-repository-layout)
- [Run locally](#run-locally)
- [Demo data and access](#demo-data-and-access)
- [Limitations and security](#limitations-and-security)
- [Backend integration](#backend-integration)
- [Development and contribution](#development-and-contribution)
- [Future work](#future-work)

## Overview

The application demonstrates public vehicle-number lookup and connected challan operations. The Citizen portal shows a vehicle's challan and payment history and supports simulated payment and disputes. Admin users can review detections, manage operational records, and resolve disputes. Super Admin users manage staff accounts and the illustrative rule/fine configuration.

The project goal is to provide a navigable frontend and realistic, interconnected demo dataset that can guide a future backend implementation. The UI shares one mock database so actions are reflected across portals in the same browser profile.

## Features

- Public lookup without requiring a Citizen account.
- Role-aware Admin and Super Admin sign-in and protected route groups.
- Vehicle, citizen, challan, detection, payment, dispute, notification, and audit data in one mock database.
- Search, filters, sorting, pagination, reports, and dashboards backed by the shared demo state.
- CCTV evidence review using a local sample video where a record references evidence.
- Simulated UPI, debit card, credit card, and net-banking outcomes; no financial credentials are collected.
- Printable/downloadable demo receipts for successful simulated transactions.
- Rule/fine configuration changes restricted in the UI and mock service to Super Admin; issued challans retain a rule/fine snapshot.
- Browser localStorage persistence with first-run seeding and an authorized Super Admin demo reset action.

## Screenshots

No screenshots are included in the repository yet. Add reviewed images under a project-owned screenshots directory and replace these labelled placeholders when available.

- `[Screenshot placeholder: public entry and lookup page]`
- `[Screenshot placeholder: Citizen challan history]`
- `[Screenshot placeholder: Admin operations]`
- `[Screenshot placeholder: Super Admin configuration]`

## Portals

| Role | Entry and responsibilities |
| --- | --- |
| Citizen | Starts at `/`, looks up a vehicle at `/lookup/:vehicleNumber` (the `/citizen/:vehicleNumber` alias is also supported), reviews associated records, simulated payments, receipts, disputes, profile/vehicles, notifications, and read-only rules/help. Citizen lookup is public; there is no Citizen account authentication flow. |
| Admin | Signs in at `/login`; the `admin` role lands at `/dashboard`. Operational routes cover detection review, challans, complaints/disputes, citizens/vehicles, payments, reports, settings, and history. |
| Super Admin | Signs in at `/login`; the `super-admin` role lands in `/super-admin/*`. Its distinct pages cover staff accounts, system records/monitoring, analytics, disputes/notifications, rule configuration, and audit history. |

See [role permissions](docs/ROLE_PERMISSIONS.md) for current UI boundaries and the backend enforcement requirement.

## Technology

| Area | Implementation |
| --- | --- |
| UI | React 18 with JSX and CSS |
| Build/dev server | Vite 5 |
| Routing | React Router 6 |
| Icons | lucide-react |
| Charts | Recharts |
| State | React Context (`AppContext`) plus service-backed mock data |
| Persistence | Browser `localStorage`; session identifier in `sessionStorage` |
| Server/API | No application backend is included; mock service is selected by default |

## Architecture and repository layout

The app starts in `src/main.jsx`, mounts providers and `src/App.jsx`, then renders route-specific pages. Pages use `AppContext` and the service adapter rather than calling `fetch` directly. `src/services/api.js` selects mock or REST adapter using `USE_MOCK_API` in `src/data/config.js`; it is currently `true`.

```text
.
├── public/
│   └── videos/cctv-evidence.mp4     # shared demo evidence clip
├── src/
│   ├── App.jsx                      # route table and protected route groups
│   ├── main.jsx                     # React/provider entry point
│   ├── components/
│   │   ├── auth/                    # protected route guard
│   │   ├── common/                  # dialogs, badges, toast and document UI
│   │   ├── layout/                  # Admin navigation/layout
│   │   └── verification/            # detection/evidence/challan widgets
│   ├── context/AppContext.jsx       # shared app state and workflows
│   ├── data/                        # configuration and seed records
│   ├── pages/                       # Citizen, Admin and Super Admin pages
│   ├── services/                    # auth, mock DB, API adapter, system admin
│   ├── styles/                      # global.css and verification.css
│   └── utils/                       # formatting and fine/challan helpers
├── docs/                            # architecture and backend handoff documents
├── index.html
├── package.json
└── vite.config.js
```

The detailed route, state, and workflow descriptions are in [Architecture](docs/ARCHITECTURE.md). Field-level mock data and a proposed relational design are in [Database design](docs/DATABASE_DESIGN.md).

## Run locally

### Prerequisites

- Node.js and npm installed (the repository does not declare an `engines` range).
- A modern browser with JavaScript and localStorage enabled.

### Install and start

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). To create a production bundle and serve it locally:

```sh
npm run build
npm run preview
```

### Available npm scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `vite` | Start the Vite development server |
| `build` | `vite build` | Build static production assets into `dist/` |
| `preview` | `vite preview` | Serve the built assets locally |

There is no test, lint, or type-check script defined in `package.json`.

## Demo data and access

On first launch, `src/services/mockDb.js` initializes a connected sample dataset and stores it under `echallan_mock_database_v2` in localStorage. It seeds only when the stored database is absent or invalid; a migration fills selected missing fields for existing stored versions. Refreshing the page retains actions in that browser profile. Clearing site storage returns to first-run seed behavior. Super Admin has a UI action to reset the demo data.

The seed includes 15 vehicles, 15 citizen records, 28 challans, 10 successful payment records plus a failed sample, four dispute records, three Admin accounts, and one Super Admin account. Data is fictional. Demonstration registration numbers verified in the seed include:

| Registration | Seed scenario |
| --- | --- |
| `WB 38 AK 4821` | Three unpaid challans |
| `WB 37 C 5530` | Two paid and one unpaid challan |
| `RJ 14 DZ 6620` | Vehicle with no challans |
| `WB 41 F 2276` | Pending challan / verification scenario |
| `MH 12 QX 6041` | Additional vehicle and challan history |

Seed staff account emails (passwords are intentionally not reproduced in repository documentation): `admin@echallan.demo`, `s.mukherjee@echallan.demo`, `a.dutta@echallan.demo`, and `superadmin@echallan.demo`. These are public demo identities only. Do not reuse their source-defined passwords or seed accounts in any deployed service.

## Limitations and security

- The project is a frontend-only demo. There is no deployed backend, database server, real identity provider, or real payment integration.
- Role and permission checks run in browser code. Users can alter browser state and bundled code; these checks are not a security boundary.
- Mock account records include demo-only credentials in the client seed. Do not deploy the seed or treat the demo login as secure authentication.
- localStorage is per browser profile and is editable, clearable, and not shared between users or devices.
- Payment outcomes and transaction/receipt identifiers are simulated. No card number, CVV, UPI PIN, or banking credential is collected or transmitted.
- Traffic rules and amounts are illustrative demo values, not legal advice or official fine rates.
- CCTV uses one shared sample video at `/videos/cctv-evidence.mp4`; it is not linked to a real camera or verified event. Complaint attachment values are demo references, not a managed upload service.
- No automated test or lint command is currently configured.

## Backend integration

The mock adapter lives in `src/services/api.js`, with request helpers in `src/services/httpClient.js`; `src/context/AppContext.jsx` coordinates UI state and workflows. The REST adapter is a frontend integration seam only: no server implementation is supplied. `API_BASE_URL` defaults to `http://localhost:8080/api/v1` and can be set through Vite's `VITE_API_BASE_URL`. See [proposed API contract](docs/API_DOCUMENTATION.md) and [backend handoff](docs/BACKEND_HANDOFF.md).

Any production backend must independently authenticate requests, enforce roles and object-level access, calculate fines from approved active configurations, snapshot configuration on issuance, and audit privileged changes. Browser-side checks cannot enforce the Super Admin-only law/fine boundary.

## Development and contribution

1. Install dependencies and run `npm run dev`.
2. Keep page-specific behavior in the existing page/context/service structure; do not add direct network calls from components when extending the adapter.
3. Preserve the existing routes and `public/videos/cctv-evidence.mp4` path unless a deliberate feature requires otherwise.
4. Run `npm run build` before submitting changes. Add an automated test/lint setup in a separate, scoped contribution if needed; none is configured today.
5. Describe behavior changes, validation performed, and any mock-versus-backend limitation in the change summary.

## Future work

- Implement and deploy an authenticated backend with durable relational storage and server-enforced authorization.
- Replace local mock operations with the proposed API while preserving the current service boundary and workflows.
- Introduce secure evidence upload/storage and per-event evidence metadata.
- Integrate a payment provider using hosted/tokenized payment flows, idempotency, reconciliation, and server-generated receipts.
- Add automated unit, integration, and browser workflow tests.
- Replace illustrative rules with an authorized, versioned legal schedule after jurisdictional review.
