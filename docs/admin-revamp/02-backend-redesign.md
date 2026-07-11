# Backend Redesign — Target Architecture & Design Patterns

> Companion to `01-feature-requirements.md`. The current backend works but grew feature-by-feature:
> fat controllers, duplicated logic, inline side effects, hardcoded constants, per-status endpoints,
> and script-only operations. This document defines the target architecture — DRY, pattern-driven,
> and aligned with how modern commerce backends (Medusa, Vendure, enterprise OMS) are structured —
> plus a safe migration path. It is a design doc, not an implementation plan.

---

## 1. Diagnosis — where the "brute force" actually is

Concrete duplication / structural debt found in the codebase:

| # | Problem | Evidence |
|---|---------|----------|
| 1 | **Dual/triple order-status truth** | free-string `orderStatus`, `tracking{}` booleans+timestamps, and `shipping.statusCode` all encode state |
| 2 | **Per-transition endpoints, logic inline in controllers** | `/confirm`, `/processing`, `/outfordelivery`, `/deliver`, `/cancel` each re-implement guard + side effects (stock deduction, emails, Shiprocket cancel) |
| 3 | **Two invoice-numbering systems** | order-level `InvoiceNumber` counter vs billing FY counters (`QuotationCounter`) |
| 4 | **Three image-upload pipelines** | `/api/uploads` (sharp resize) vs products/schools/types `.../images` endpoints, each with its own storage/list logic |
| 5 | **Hardcoded business constants** | free-shipping ₹599/₹100, return window 7d, package defaults, admin-created-customer password |
| 6 | **Side effects welded to request handlers** | emails, stock movements, alert creation, Shiprocket calls execute synchronously inside controllers; a slow email delays the HTTP response, a failure loses the side effect |
| 7 | **`orderItems` vs `modifiedItems` branching everywhere** | every consumer (shipping mapper, dashboards, invoices, returns) re-implements "use modifiedItems if modified" |
| 8 | **Ops as scripts** | reconcileShipping, markDeliveredFromShiprocket, delayed-order export/emails run manually from `scripts/` with no scheduling, history, or UI |
| 9 | **Inconsistent module structure** | billing/shipping/returns/stock live in `modules/` (good); orders/products/users/schools still in flat `controllers/` + `routes/` |
| 10 | **Auth gaps & single role** | `deleteClass`, `GET /api/orders/report` unprotected; only `isAdmin` boolean — no RBAC |
| 11 | **No edge validation / error contract** | controllers hand-validate; error shapes vary per endpoint |
| 12 | **Refund logic split** | returns-module refund flow vs direct `/api/pay/refund`, with different guards |

Positive precedents already in the codebase to generalize (don't rebuild):
`returnStateMachine.js` + `nextStatuses` contract, `shipmentStatus.js` monotonic engine,
`inventoryCalc.updateInventoryBucket` atomic bucket math, `returnPricing.js` single-source refund
math, `quotationUtils.generateDocumentNumber` atomic FY counters, `ShippingLog` API audit.

---

## 2. Target architecture (pattern map)

### 2.1 Layering — Controller → Service → Repository (per module)

```
modules/<domain>/
  routes/         thin: routing + authz + validation schema binding
  controllers/    thin: parse request → call service → shape response (no business logic)
  services/       ALL domain logic; framework-agnostic; unit-testable
  repositories/   only layer touching Mongoose; query encapsulation
  models/         schemas + enums (no logic beyond invariants)
  events/         domain event definitions + handlers
  state/          transition map (if the aggregate has a lifecycle)
```

- All domains are built in this shape in the **new repo** (`apps/api` — see `04-phase0-decisions.md`
  D0). Legacy `modules/` code (billing/shipping/returns/stock already ~follow this layout) is
  **ported**, not rewritten — the state machines, pricing math, and inventory calc move over as-is
  behind the new layering.
- Controllers never import models; services never read `req/res`. This alone removes most duplication
  because logic becomes callable from webhooks, jobs, and scripts — not just HTTP.

### 2.2 One generic Finite-State-Machine engine (State pattern)

Build a single declarative FSM utility; each lifecycle is just data:

```js
// core/stateMachine.js — one implementation, many charts
orderFSM   = defineMachine({ states: [RECEIVED, CONFIRMED, PROCESSING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED], transitions: {...}, guards, effects })
shipmentFSM, returnFSM (port existing), documentFSM (billing statuses), ndrFSM
```

- **Kill the `orderStatus` string and tracking booleans**: one enum `status` + `statusHistory[]`
  (from → to, actor, timestamp, reason). Keep booleans as virtuals during migration.
- One endpoint per aggregate: `PATCH /:id/status {action}` replaces the five per-status routes;
  the FSM validates the transition and returns `nextStatuses` (the returns module's contract,
  applied everywhere — the admin UI then renders actions generically).
- Monotonicity, guard rules (e.g. "cancel blocked after out-for-delivery"), and side effects are
  declared in the chart, not scattered in controllers.

### 2.3 Domain events + Outbox + job queue (Observer / Outbox / Queue patterns)

- Services emit **domain events** (`order.confirmed`, `order.cancelled`, `shipment.delivered`,
  `return.qc_completed`, `stock.threshold_breached`, …).
- **Outbox pattern**: the event row is written in the same Mongo transaction as the state change,
  then a dispatcher publishes to **BullMQ** (Redis already in the stack). No lost side effects,
  no "saved to DB but email never sent".
- Handlers (async workers): emails, stock deduction/restock, alert creation, Shiprocket calls,
  activity-log writes, (later) abandoned-cart recovery. Each handler idempotent + retried with
  backoff + dead-letter queue.
- **Webhooks** (Shiprocket, Razorpay): verify signature → dedupe by event id → persist raw event →
  enqueue → ack 200 immediately. Processing happens in workers through the same FSM/services.

### 2.4 Compensation for multi-step flows (Saga pattern, lightweight)

Order cancel = Shiprocket cancel + stock restore + (maybe) refund; exchange = create order + reserve
stock + reverse pickup. Model these as orchestrated steps with compensating actions and per-step
status, instead of one try/catch doing everything inline. (An `operations` collection tracking
step state is enough — no framework needed.)

### 2.5 Ports & Adapters for integrations (Hexagonal / Adapter pattern)

- `ShippingProvider` interface (createOrder, assignAwb, schedulePickup, label, track, cancel,
  reverse pickup) with a `ShiprocketAdapter` as today's implementation. `PaymentProvider` likewise
  (Razorpay). Enables mocking in tests and future carrier/gateway swaps.
- Keep the existing `ShippingLog`-style audit at the adapter boundary — generalize to all providers.

### 2.6 Strategy pattern for variant logic

- **Refund destination** (prepaid→gateway, COD→UPI/bank/store-credit) — formalize the existing
  `refundDestination` helper as strategies behind one `RefundService` (also swallows the stray
  `/api/pay/refund` path so there is exactly one refund entry point, guarded + ledgered).
- **Pricing/discount** resolution (today per-item %; tomorrow coupons/campaigns) — one
  `PricingService` so order editor, billing documents, and returns all price identically.
- **Document numbering**: one `NumberingService` (atomic, per-series) issuing order invoices AND
  billing FY series — collapses the two counter systems into one implementation with two series configs.

### 2.7 Single-writer inventory ledger (already ~exists — enforce it)

- `InventoryService` is the **only** writer to stock buckets; every mutation appends a
  `StockMovement` (append-only ledger) and recomputes availability atomically.
- All callers (order confirm/cancel, cash bill, quotation reserve/release, QC restock, RTO restock,
  manual adjust, bulk adjust) go through it — no direct `$inc` anywhere else.

### 2.8 Canonical line-items (kill the `modifiedItems` branching)

- `order.effectiveItems` resolved in exactly one place (model virtual or OrderService accessor);
  every consumer (shipping mapper, dashboard aggregation, invoice, returns eligibility) uses it.
  Original items retained as immutable history (`itemRevisions[]`) instead of a parallel array.

### 2.9 Settings service (replace hardcoded constants)

- DB-backed, cached `SettingsService`: shipping fee & free threshold, return window days, package
  defaults, NDR escalation threshold, stuck-shipment hours, default sender company, invoice series.
  Exposed via an admin Settings module (billing config becomes one namespace of it).

### 2.10 Edge validation, authz, and error contract

- **Validation**: zod/joi schemas per route (DTOs); reject at the edge; services receive typed data.
- **RBAC**: `permissions` on user/role (`orders:write`, `refunds:approve`, `stock:adjust`, …),
  `requirePermission()` middleware; `isAdmin` becomes the legacy super-role. Fix the unprotected
  routes immediately (independent of the revamp).
- **Errors**: `AppError` hierarchy (DomainError / ValidationError / IntegrationError / NotFound),
  one error-handling middleware, one JSON error envelope `{code, message, details, traceId}`.

### 2.11 Read side (CQRS-lite) for dashboards & activity

- Dashboards/reports read from dedicated **query services** using aggregation pipelines (no business
  logic in read paths, no N+1 loops). Candidates: admin dashboard, shipping/returns/stock dashboards,
  billing report, alert inbox, activity feed.
- **Unified activity log**: one `Activity` collection written by event handlers (entity, action,
  actor, before/after summary) — feeds the per-entity Activity tab and the global feed required in
  `01-feature-requirements.md` §18.4.

### 2.12 Server-side document rendering (one PDF service)

- `DocumentPdfService` (pdfmake — see `04-phase0-decisions.md` D6) renders **all** document types
  (order invoice + the 6 billing types) from declarative document definitions fed by the same
  services that compute totals — so PDF, print view, and stored numbers can never disagree.
- Replaces both client-side systems (`@react-pdf/renderer` invoices, print-CSS billing docs);
  populates `pdfUrl`/`pdfGeneratedAt`; enables invoice/credit-note email attachments.

### 2.13 Job & automation console

- BullMQ **repeatable jobs** replace `scripts/`: shipping reconciliation, mark-delivered sweep,
  delayed-order detection + notification, alert digests, (later) abandoned-cart recovery.
- Job runs persisted (name, params, status, log, duration) + admin endpoints: list/trigger/retry —
  powers the "job console" screen and makes today's manual scripts one-click and audited.

---

## 3. Cross-cutting conventions

- **API versioning**: breaking contract changes ship under `/api/v2/...`; v1 kept during UI migration.
- **Consistent list contract**: every list endpoint accepts `page, limit, sort, q, filters…` and
  returns `{items, page, pages, total}` — one shared query-builder helper (DRY for 15+ lists).
- **Idempotency**: mutation endpoints that money/stock depend on accept an `Idempotency-Key`
  (refunds, payments, adjustments); webhook events deduped by provider event id.
- **Transactions**: multi-document writes (status + outbox + ledger) use Mongo sessions.
- **Testing**: services get unit tests (FSM charts are pure data — table-test every transition);
  adapters mocked via the provider interfaces; one integration suite per module.
- **Observability**: request `traceId` propagated into events/jobs/provider logs.

---

## 4. Migration strategy (parallel service on a shared database — no big-bang cutover)

The rebuild lives in a **new repo** (new api + new admin) pointed at the **same MongoDB**; the
legacy service keeps running until the last domain cuts over. Full coexistence rules live in
`04-phase0-decisions.md` D0 — the load-bearing ones:

- **Single-writer per domain**: exactly one service owns writes to a domain's collections at any
  time; cutover flips ownership, the admin routes, and any webhooks/jobs for that domain together.
- **Write-compatibility**: until the legacy admin/storefront stop reading a domain, the new
  service also maintains legacy fields (order FSM writes canonical `status`/`statusHistory` AND
  `tracking{}` booleans + `orderStatus`); legacy fields are dropped only when their last reader is
  retired.
- **One schema source of truth**: `packages/schemas` mirrors live collections; additive-first
  evolution.

Sequence:

1. **Safety first (in the LEGACY repo, immediate)**: fix unauthenticated routes
   (`deleteClass`, `GET /api/orders/report`) — this cannot wait for the new service. Legacy repo is
   otherwise frozen to bugfixes.
2. **Foundations (new repo)**: workspace scaffold, `packages/schemas` mirroring live collections,
   core FSM utility, outbox + BullMQ workers, SettingsService, NumberingService, shared list-query
   helper, AppError + validation + RBAC middleware.
3. **Domain-by-domain ownership transfer**, porting the good legacy engines rather than rewriting
   them: Orders (FSM + effectiveItems + events, dual-writing legacy fields) → Shipping (provider
   adapter + queued webhooks; webhook URL repoints at cutover) → Returns (state machine ported onto
   the core FSM) → Stock (single-writer inventory ledger) → Billing (numbering merge) → Users/RBAC
   → Catalog/Content. Each cutover: shadow-verify → flip nginx/admin routing → monitor → retire the
   legacy module.
4. **New capabilities only in the new service** (activity feed, alert inbox, job console, saved
   views, review moderation, media library, draft orders, promotions) — never added to legacy.
5. Legacy `scripts/` retired one-by-one as repeatable jobs land in the owner service; the legacy
   repo is archived when the storefront-facing endpoints are the only thing left in it (their
   migration is a separate, later decision).

Sequencing detail belongs to the phase plan (`03-phase-plan.md`), which interleaves backend rails
with the UI phases that consume them.
