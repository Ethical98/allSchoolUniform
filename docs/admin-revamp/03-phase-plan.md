# Admin Revamp — Phase-Wise Plan

> Companion to `01-feature-requirements.md` (what to build) and `02-backend-redesign.md`
> (how the backend gets there). This sequences both into phases that each ship something usable,
> keep the current admin running until its replacement is proven, and never block UI work on a
> backend rewrite (or vice versa) longer than one phase.

> **Repo strategy:** the rebuild ships from a **new repo** (monorepo: new api + new admin +
> shared schema package) against the **same MongoDB**; the legacy service keeps serving the old
> admin + storefront until each domain's write-ownership cuts over. Coexistence rules:
> `04-phase0-decisions.md` D0.

**Sequencing principles**

1. **Parallel service, not big-bang** — the new admin + api run alongside the legacy ones; domain
   write-ownership cuts over one module at a time; the old screen stays reachable until its
   replacement has run in production for a while.
2. **Rails before rooms** — each domain's backend rail (FSM, events, contracts) lands one phase
   before (or with) the UI that consumes it, so no screen is built twice.
3. **Highest-traffic ops first** — orders/shipping/picking are used daily; content/CMS screens are
   touched rarely and go last.
4. **Every phase has an exit gate** — measurable "done" so phases don't smear into each other.

---

## Phase 0 — Decisions & Groundwork (short, mostly non-code)

**Decisions that everything downstream depends on:**
- **RBAC scope**: single-admin stays OR roles/permissions land in Phase 1 backend. (Recommendation:
  build the `requirePermission` middleware now, ship with one super-role, add real roles later —
  cheap now, painful to retrofit.)
- **Frontend stack** for the new admin (current app is CRA + React Router v5 + Redux + class-era
  patterns). Recommendation: separate new app (Vite + React Router or Next.js), server-state via
  React Query, a component system with a real data-table, command palette, and form primitives.
  Decide: monorepo placement, auth sharing with old app (same JWT), deploy URL strategy.
- **Design language**: tokens (color/spacing/type), status-badge taxonomy (one color language for
  order/shipment/return/payment/document states — spec §18.7), dark/light, density.
- **API versioning agreement** (`/api/v2` for changed contracts).

**Code (immediate, independent of everything):**
- Fix unauthenticated routes (`DELETE /api/classes/:id`, `GET /api/orders/report`).
- Central error middleware + `AppError` + standard error envelope (new code adopts it as it lands).

**Exit gate:** decisions recorded; security fixes deployed; design tokens + status taxonomy approved.

---

## Phase 1 — Platform Foundation (new shell + shared contracts)

**Backend (all in the new repo from here on):**
- Scaffold the monorepo (`apps/api`, `apps/admin`, `packages/schemas`, `packages/shared`);
  `packages/schemas` mirrors the live collections (D0 rule 3).
- Shared list contract + query-builder helper (`page/limit/sort/q/filters` → `{items,page,pages,total}`).
- Request validation (zod/joi) pattern established; RBAC middleware skeleton.
- SettingsService (shipping fee/threshold, return window, package defaults, NDR/stuck thresholds)
  + admin endpoints; constants removed from code.
- Widen universal search to orders/returns/documents (powers command palette).

**Frontend (new app):**
- App shell: auth (login/logout/session), navigation, layout, theming, error boundaries.
- Core kit built once, used by every later phase: data table (server pagination, faceted filters,
  column visibility, selection + bulk-action toolbar, CSV export, URL-addressable state),
  form primitives (inline validation, dirty-state guard), status badges, entity-link components,
  toasts/skeletons/empty states, confirm-with-reason dialog, **⌘K command palette** (nav + search).
- First real screen to prove the kit: **Users** (simple CRUD) + **Settings** (new SettingsService).

**Exit gate:** new shell deployed behind auth; Users + Settings usable end-to-end; table kit demoed
with server pagination/filters/export on real data.

---

## Phase 2 — Order Rails + Orders & Dashboard UI (the core phase)

**Backend:**
- Core FSM engine; **order FSM** replaces the five per-status endpoints with
  `PATCH /:id/status {action}` returning `nextStatuses`; `statusHistory[]`. New service takes
  **write ownership of orders** and dual-writes the legacy fields (`tracking{}` booleans,
  `orderStatus` string) until the legacy admin/storefront readers retire (D0 rule 2).
- Outbox + BullMQ workers; order side effects (emails, stock deduction/restore, alert creation)
  move to event handlers. `effectiveItems` accessor kills `modifiedItems` branching.
- Dashboard/read queries consolidated into query services.

**Frontend:**
- **Order list**: search/filters/saved-columns/export; summary strip; **picking & ready-to-ship
  worklists** (decide: persist pick state server-side — small endpoint if yes).
- **Order detail**: unified **order timeline** (status history + payments + comments + item
  revisions), generic action bar driven by `nextStatuses`, item modification flow, invoicing
  (bill type → generate number → download server-rendered PDF; `DocumentPdfService` lands here for
  order invoices — D6), call notes, links to returns/shipping.
- **Dashboard**: KPI hierarchy + trends + recent orders + low-stock + quick actions.

**Exit gate:** orders fully manageable in the new UI; old order screens deprecated; status changes
observably flow through FSM + events (emails/stock verified via outbox, not inline).

---

## Phase 3 — Shipping, NDR & Ops Console

**Backend:**
- `ShippingProvider` port + Shiprocket adapter (existing logic relocated, `ShippingLog` kept).
- Webhooks → verify, dedupe, persist, enqueue; processing in workers through shipment FSM.
- Repeatable jobs replace `scripts/`: reconciliation, mark-delivered sweep, delayed-order
  detection/notification. Job-run persistence + trigger/monitor endpoints.

**Frontend:**
- **Shipping dashboard** (summary, active/NDR/stuck lists), **per-order shipping panel**
  (serviceability → ship → pickup/label/manifest/invoice → tracking timeline, cancel guard).
- **NDR worklist** (reattempt with address correction / RTO, action history, escalation flags).
- **Job & integration console**: job runs + trigger/retry; `ShippingLog` viewer; webhook health.

**Exit gate:** a shipment can go create→AWB→pickup→delivered entirely in new UI; one manual script
retired per job that replaced it; NDR queue worked from the new screen for a full week.

---

## Phase 4 — Returns, QC & Refunds

**Backend:**
- Port return state machine onto the core FSM engine (transition graph unchanged).
- One `RefundService` (strategy per destination; absorbs `/api/pay/refund`; idempotency keys).
- Reverse-shipping via the same ShippingProvider port.

**Frontend:**
- **Returns triage** (dashboard buckets → filtered list, age/stale flags, next-action hints).
- **Return workspace**: stepper, server-driven action bar, QC disposition flow (gates intact),
  refund modal (system-calculated amount, override as explicit audited action), exchange-order
  creation + deep link to shipping, credit note, reverse pickup + label, notes + timeline.
- **Return creation wizard** (items → type → reason → address → review; window override).

**Exit gate:** full RETURN, EXCHANGE, and REPLACEMENT lifecycles each completed end-to-end in the
new UI, refunds posted exactly once (ledger verified).

---

## Phase 5 — Stock & Inventory

**Backend:**
- Enforce single-writer InventoryService (audit all `$inc` call sites into it).
- Expose unused capabilities: sales velocity, global alert queue, bulk adjust, server CSV export.

**Frontend:**
- Stock dashboard, overview (all backend filters incl. school/type), product stock detail,
  adjustment form, **bulk adjustment (CSV import + preview)**, movement log with entity links,
  valuation + export, **reorder suggestions** (velocity → days-of-cover), alert queue with
  acknowledge workflow.

**Exit gate:** all stock mutations traceable in the movement ledger from the new UI; bulk adjust
used on a real replenishment.

---

## Phase 6 — Billing Suite

**Backend:**
- NumberingService merge (order invoice counter + FY series behind one implementation).
- Surface quotation revisioning; extend `DocumentPdfService` (from Phase 2) to the 6 billing
  document types — populates `pdfUrl`/`pdfGeneratedAt`, enables email attachments (D6).

**Frontend:**
- Document hub (type/status filters, state-gated actions), document editor (sender/buyer picker +
  inline company create, inventory picker, custom items, live GST totals), document view
  (lifecycle: sent/accepted/convert/clone/revisions; payment recording + ledger), cash-bill POS
  flow, credit/debit notes, companies master, templates, billing report (GST summary, overdue),
  billing settings (folds into Settings module).

**Exit gate:** a quotation→proforma→tax-invoice→payment→credit-note chain fully executed in new UI;
numbering verified continuous with legacy series.

---

## Phase 7 — Catalog & Content

**Backend:**
- Fix school-update dropped fields. Unify the three image pipelines into one upload/media service
  (backs a **media library**). Review moderation endpoints. Catalog CSV import/export.

**Frontend:**
- Products (list with all filters, editor with variant matrix, merchandising: featured + drag-sort
  display order using the existing display-orders feed, duplicate/clone).
- Types + structured **size-guide table editor** (custom columns, visibility toggles).
- Schools (featured support), classes, homepage CMS (announcements/carousel/statistics/header),
  media library, review moderation, **customer requests inbox** (backend exists, first-ever UI).

**Exit gate:** old admin fully retired — every route in the legacy app has a new-UI equivalent or a
documented kill decision.

---

## Phase 8 — Governance & Cross-Cutting Polish

**Backend:**
- Real roles/permissions on the Phase-0 middleware; session management.
- Unified `Activity` collection written by event handlers; aggregate **alert inbox** endpoint;
  saved-views store; email send-log + resend/preview endpoints.

**Frontend:**
- Role management UI; global activity feed + per-entity Activity tabs; alert inbox; saved views on
  all tables; notification/email center; customer 360 composition page; abandoned-carts list.

**Exit gate:** second admin user onboarded with a restricted role; activity feed answers "who
changed this order" without DB access.

---

## Phase 9 — Roadmap (explicitly deferred, decide per item)

Draft/admin-created orders · promotions & coupon engine · split shipment / partial fulfillment ·
multi-warehouse · real-time push (SSE) for ops tiles · abandoned-cart recovery emails ·
customer-facing return portal parity work · 2FA.

---

## Risk & rollback notes

- The legacy service keeps serving each domain until its cutover completes — rollback = point users
  back at the old screen.
- Highest-risk migrations: order status unification (Phase 2) and refund consolidation (Phase 4) —
  both get shadow-mode verification (new path computes, old path executes, results compared) for a
  window before flipping.
- Data migrations (status backfill from tracking booleans, statusHistory seeding) are scripted,
  idempotent, and rehearsed on a prod snapshot.
