# Return Module — Deep Review & Scalable Redesign

> Design spec. Date: 2026-06-02. Spans three repos: `asu/backend` (primary), `asu/frontend` (admin), `school-uniforms-frontend` (client). Implementation plan is produced separately via the writing-plans workflow.

## Context

The return system spans three codebases:
- **Client (customer):** `/Users/devansh/Desktop/school-uniforms-frontend` (Next.js)
- **Backend (API):** `/Users/devansh/Desktop/asu/backend` (Express + Mongoose) — primary repo
- **Admin:** `/Users/devansh/Desktop/asu/frontend` (CRA + Redux)

A three-pass line-by-line audit found **24 issues** (5 critical). They are not independent bugs — they cluster around **5 architectural root causes**. The decision was to **refactor the root causes** (not just patch symptoms) so the module is scalable and dynamic. Four product decisions are locked:
- **M3:** Returns resolve against `modifiedItems` when `order.modified === true`, else `orderItems`.
- **M2:** Split refund timestamps into `refundInitiatedAt` + `refundProcessedAt`.
- **C2:** Evidence is **required** for `DEFECTIVE` / `DAMAGED_IN_TRANSIT` / `QUALITY_ISSUE`.
- **Scope:** Centralize refund math, make state transitions data-driven, derive `hasReturns`, drive client eligibility from the backend.

---

## Root-cause map (the 24 findings → 5 causes)

| Root cause | Findings it explains | Why it keeps producing bugs |
|---|---|---|
| **RC1 — Refund math duplicated in 3 places** (admin create `returnController.js:76-78`, customer create `:1076-1077`, REFUND_INITIATED recompute `:438-442`); credit note re-derives separately (`returnCreditNoteHelper.js`); client estimates a 4th time (`returnStore.ts:32-40`) | H5, H6, L1, L2, C3, C4 | Each copy can disagree (UNSELLABLE handling, shipping, modified items). No single authority. |
| **RC2 — Return *state* + side-effects are ad-hoc** — `hasReturns` is a derived fact stored as a write-once flag (never reset); all transition side-effects live in one 230-line `switch` (`returnController.js:332-539`) with asymmetric guards | H3, H4, H2, M5, A1 | Adding/auditing a transition means editing a giant switch; guards get forgotten (EXCHANGE→REFUND has none). |
| **RC3 — Silent schema drops** — Mongoose `strict` (default) + code writes undeclared fields | H1 (evidenceImages), H8 (pickupInitiatedAt) | Data written by controllers vanishes with no error; features look wired but lose data. |
| **RC4 — Notifications are an incomplete lookup with no fallback** (`returnEmailHelper.js:11-45`, 8 of 14 statuses) | H7, H9 | New statuses silently send nothing; no audit that a customer was informed. |
| **RC5 — Client re-derives backend rules** — eligibility/window/evidence logic duplicated in `useReturnEligibility.ts`, wizard, store | C1, C2, eligibility drift | Client and server disagree (wizard vs order page); rules must be changed in two languages. |

---

## Design — target architecture

The redesign introduces small, single-purpose, independently testable units. Backend changes are the foundation; client/admin consume them.

### 1. Refund pricing module (fixes RC1)
**New:** `backend/modules/returns/pricing/returnPricing.js` — the **single source of truth** for all refund math.

```
computeItemRefund(orderItem, returnQty)            → number   // price×(1-disc/100)×qty, rounded
computeReturnRefund(returnRequest)                  → { itemsRefund, shippingRefund, total }
                                                    // honors qcDisposition: NOT_RECEIVED & UNSELLABLE → 0
resolveOrderItems(order)                            → OrderItem[]  // M3: modifiedItems if order.modified
shouldRefundShipping(order, reason, items)          → boolean   // moved/kept here (was returnValidation.js)
```

- All three create/recompute sites call `computeItemRefund` / `computeReturnRefund` instead of inlining the formula.
- `groupReturnItemsToNested` (credit note, `returnCreditNoteHelper.js:11`) consumes the **same** disposition rule (skip NOT_RECEIVED **and** UNSELLABLE) → fixes **H6** so the GST credit note equals the refund.
- The client's `returnStore.ts` estimate stays display-only but mirrors `computeItemRefund` exactly (one TS port, documented as such), and ConfirmStep copy is computed, not hardcoded → fixes **L1, C3, C4**.
- Reused: existing `calculateTotals` / `generateDocumentNumber` from billing (`quotationUtils.js`).

### 2. Data-driven state machine + declarative side-effects (fixes RC2)
**Extend** `returnStateMachine.js` and **extract** side-effects out of the controller `switch`.

- Keep `TRANSITIONS` / `TYPE_TRANSITIONS` as the transition table (already good).
- **Add guards to the table** so illegal transitions are data, not buried `if`s. Critically, EXCHANGE/REPLACEMENT → `REFUND_INITIATED` gains a guard: rejected if `exchangeOrderId` set and exchange order not cancelled → fixes **H4** (and admin UI hides the button → **A1**).
- **New:** `backend/modules/returns/state/sideEffects/` — one file per effect (`onPickupScheduled.js`, `onQcCompleted.js`, `onRefundInitiated.js`, `onCancelled.js`, …). `updateReturnStatus` becomes a thin dispatcher: validate → run guard → run side-effect hook → persist → notify. Each hook is unit-testable in isolation.
- **`onCancelled`** reverses stock if any item `qcProcessed` → fixes **M5**.
- **`hasReturns` becomes derived:** a helper `recomputeOrderReturnFlag(orderId)` sets `order.hasReturns = await ReturnRequest.exists({ order, status: {$nin:['REJECTED','CANCELLED']} })`, called after every create/cancel/reject → fixes **H3** (and unblocks **H2/C1**).

### 3. Customer cancel + eligibility endpoint (fixes RC5, H2)
- **New route:** `PATCH /api/returns/my/:id/cancel` → `cancelMyReturnRequest` (ownership check, `validateTransition(status,'CANCELLED',type)`, runs `onCancelled` + `recomputeOrderReturnFlag`). Fixes **H2**.
- **New route:** `GET /api/returns/my/order/:orderId/eligibility` → returns `{ isEligible, returnableUntil, reason, daysRemaining }` computed by the **backend** `returnValidation.js`. The client `useReturnEligibility` becomes a thin consumer of this (or falls back to local calc offline). Wizard and order page now use the **same** source → fixes **C1** and eligibility drift.
- Client adds `cancelReturnRequest(id)` server action + endpoint; tracking page shows a "Cancel return" button when cancellable.

### 4. Schema hardening (fixes RC3)
- Add declared fields to `ReturnRequestModel.js`: `evidenceImages: [String]` (fixes **H1**), `reverseShipping.pickupInitiatedAt: Date` (fixes **H8**), and the **M2** split `refundInitiatedAt: Date` / keep `refundProcessedAt: Date`.
- Add a model-level guard test asserting no controller writes undeclared paths (lightweight: enable `strict: 'throw'` in a test env so silent drops fail loudly in CI).

### 5. Notification completeness (fixes RC4)
- `TEMPLATE_MAP` gains `CANCELLED` and `PICKUP_FAILED` (minimum); `sendReturnEmail` logs a structured warning + records a timeline entry when a status has no template (so "customer not notified" is auditable, not silent). Guard `(refundAmount || 0)` → **H9**.
- **M2 wiring:** `onRefundInitiated` sets `refundInitiatedAt`; `processRefund` sets `refundProcessedAt`; COMPLETED no longer overwrites it. Client shows both with correct labels.

### 6. Evidence enforcement (C2)
- Client `ReasonStep.tsx`: when `reason ∈ EVIDENCE_REQUIRED_REASONS`, disable **Next** until ≥1 photo; change copy to "required." Backend `createMyReturnRequest` validates the same rule server-side (defense in depth) and now persists `evidenceImages` (H1). Admin `ReturnDetailScreen` displays them for QC.

---

## What stays the same (verified good — do not touch)
- Status/type/reason/disposition/refund-method enums are in sync across all three layers.
- Route guarding: `returnRoutes.js:32` `router.use(protect, isAdmin)` — admin routes are safe (**M4 resolved**).
- Admin `ReturnDetailScreen` per-action loading/error slices + refetch-after-success; QC read-only outside `QC_IN_PROGRESS`.
- ConfirmStep double-submit guard + payload shape; reverse-shipping mapper env fallbacks; QC concurrency guard (`findOneAndUpdate` on `qcProcessed`).

---

## Components & data flow (target)

```
Customer wizard ──POST /my──▶ createMyReturnRequest
                               │ resolveOrderItems(order)         (M3)
                               │ computeReturnRefund()            (RC1)
                               │ validate evidence required       (C2)
                               │ persist evidenceImages           (H1)
                               └ recomputeOrderReturnFlag()       (H3)

Admin action ──PATCH /:id/status──▶ updateReturnStatus (dispatcher)
                               │ validateTransition + guard       (H4)
                               │ sideEffects/on<Status>()         (RC2)
                               │   onQcCompleted → stock + refund recompute (computeReturnRefund)
                               │   onRefundInitiated → refundInitiatedAt + credit note (RC1 → H6)
                               │   onCancelled → reverse stock + recomputeOrderReturnFlag (M5,H3)
                               │ persist → sendReturnEmail (fallback-safe)   (RC4)

Customer cancel ──PATCH /my/:id/cancel──▶ cancelMyReturnRequest   (H2)
Eligibility ──GET /my/order/:id/eligibility──▶ backend rule       (C1, RC5)
```

---

## Testing & verification

**Backend unit tests (new, per unit):**
- `returnPricing`: item refund rounding; UNSELLABLE & NOT_RECEIVED → 0; modified-order resolution (M3); shipping-refund rule.
- State guards: EXCHANGE→REFUND blocked when exchange order live (H4); all legal transitions pass.
- `onCancelled`: stock reversed when `qcProcessed`; `hasReturns` recomputed (H3, M5).
- Credit note total == `computeReturnRefund().total` for a return with one UNSELLABLE item (H6).
- Schema `strict:'throw'` test: writing `evidenceImages`/`pickupInitiatedAt` succeeds (declared); a bogus path throws.

**End-to-end (manual):**
- Deliver an order → wizard requires a photo for DEFECTIVE (C2) → submit → photo persists and shows on tracking + admin (H1).
- Initiate a return → cancel it via the new customer route → order becomes returnable again (H2, H3, C1: wizard agrees with order page).
- EXCHANGE: create exchange order, attempt Initiate Refund → blocked (H4); admin button hidden (A1).
- Run an UNSELLABLE item through QC → refund excludes it AND credit note matches (H5, H6).
- Cancel a return whose pickup failed → customer receives an email (H7).

**Regression:** `npm test` (backend), `npm run build` + typecheck (client), smoke the admin return detail screen.

---

## Findings index (traceability)

The detailed line-by-line findings remain the source of truth for each fix:

**Critical (HIGH):** H1 evidence dropped · H3 `hasReturns` never resets · H4 exchange double-pay · H5 UNSELLABLE refund fragile · H6 credit-note over-credit
**Medium:** H2 no customer cancel · H7 missing emails · M2 refund-timestamp semantics · M3 modified-order items · M5 stock not reversed on cancel · C1 wizard eligibility disagree · C2 evidence not enforced · A1 UI exposes double-pay
**Low:** H8 `pickupInitiatedAt` dropped · H9 email `₹NaN` · C3 qty cap ignores prior returns · C4 hardcoded refund copy · A2 QC badge colors · A3 refund method default · L1 shipping not in estimate · L2 `discount` vs `disc` · L4 active-return mis-pick · L5 `deliveredAt` not coerced
**Resolved/verified-good:** M4 admin route guarding · L6 QC mutability · admin state handling · ConfirmStep · shipping mapper · QC concurrency guard
