# Admin Returns Module — UI/UX Rework

**Date:** 2026-06-21
**Status:** Approved design — ready for implementation plan
**Scope:** Frontend only (asu `frontend/`). No backend, model, or API changes.

## Problem

The admin returns module (`/admin/returns`, `/admin/returns/:id`) is confusing and
unintuitive. One admin handles each return end-to-end (approve → pickup → receive →
QC → refund/exchange → complete), but the current UI works against them on every axis:

1. **Unclear next step.** `ReturnDetailScreen` renders a flat row of ~15 conditional
   action buttons. The admin has to scan all of them to find the one that applies to
   the return's current state.
2. **Scattered info.** Refund destination, QC results, shipping, customer info, and
   photos are split across four tabs (Overview / Timeline / QC / Shipping) plus
   multiple cards — lots of clicking and scrolling to build a mental picture.
3. **Too many clicks.** Common operations route through modals and trigger full
   refetches/reloads.
4. **Dated look.** Inconsistent Bootstrap tables/cards/badges.

## Goals

- Make the correct next action obvious for the return's current state.
- Put all context for a single return on one screen, no tab hunting.
- Reduce clicks for the common path (approve, QC, refund).
- Modernize and make visual treatment consistent.

## Non-goals

- No backend / API / state-machine changes. The backend already returns
  `nextStatuses` (from `getNextStatuses`) and all needed data on the detail payload.
- No change to the returns data model or the lifecycle itself.
- `ReturnCreateScreen` is out of scope except where shared components touch it.

## Lifecycle reference (unchanged, from `returnStateMachine.js`)

```
INITIATED → APPROVED → PICKUP_SCHEDULED → IN_TRANSIT → RECEIVED
          → QC_IN_PROGRESS → QC_COMPLETED
          → REFUND_INITIATED | EXCHANGE_SHIPPED | REPLACEMENT_SHIPPED
          → COMPLETED
Terminal: COMPLETED, REJECTED, CANCELLED
Side transitions: PICKUP_FAILED, CANCELLED (most states)
```

The redesign is a **presentation layer** over this machine: the backend says which
transitions are valid; the UI decides how to display each one (primary vs secondary,
label, color, hint).

---

## Design

### 1. Detail screen — "Next action" cockpit

Replaces the tabbed `ReturnDetailScreen`. Single scrollable page, top to bottom:

**a. Header**
- `#RET-<id>` · order link · `ReturnStatusBadge` · type badge.
- **Status stepper** — horizontal, condensed lifecycle (Initiated · Approved ·
  Picked up · Received · QC · Refund/Exchange · Done). Each step is `done` /
  `now` / `upcoming`. Terminal REJECTED/CANCELLED render the stepper greyed with a
  clear terminal chip. Stepper collapses gracefully on narrow widths.

**b. "Next action" bar (sticky under the header)**
- Shows **one primary action** for the current state, color-coded:
  green = money/forward-complete, blue = forward, red = reject.
- Secondary/rare actions go in a **"More ▾"** menu (Cancel, regenerate label,
  manual status nudges, Add note always available).
- **Inline hints** on the bar: refund amount on money actions, refund destination
  on "Record Refund", and blocking guidance ("⚠ Set a disposition on all items
  first") that also disables the primary button.
- Terminal states show a calm confirmation ("✓ Return complete — no further
  action") instead of a dead button row; "More ▾ · Add note" stays.

The bar is driven by a new **`nextActionMap`** (config, see Components). It maps each
possible `nextStatus` (and a few status-derived pseudo-actions like "Record Refund
Paid" and "Create Exchange Order") to `{ label, variant, primary|secondary, hint,
disabledWhen }`. The component reads `nextStatuses` from the detail payload and the
return's own fields, then renders primary action(s) + a More menu. This centralizes
all the scattered button logic currently inline in `renderActionButtons`.

**c. Body — two columns, one page (no tabs)**

Left (primary, wider):
- **Items & QC card.** When `QC_IN_PROGRESS`, inline-editable QC (disposition radios,
  accepted qty, notes) reusing `QCDispositionForm`'s logic/validation. Otherwise a
  read-only items/QC results table (product, size, qty, accepted, disposition badge,
  notes, per-item refund).
- **Customer reason card.** Reason, details, and evidence photos thumbnails.

Right (context, narrower):
- **Financials / Refund card.** Refund amount, method, and the **refund destination**
  block (UPI / bank / Razorpay) with copy buttons — reused from current
  `renderRefundDestination`. Credit note / exchange order references and "Generate
  Credit Note" action.
- **Shipping card.** Reverse pickup (AWB, courier, status, tracking, label) and the
  ShipRocket initiate / label actions; exchange order shipping shortcut.
- **Customer card.** Name, email, phone, pickup address.

Bottom (full width):
- **Timeline** as a collapsible section (collapsed by default).

**d. Modals** retained where they fit (Reject reason, Record Refund, Add Note) but
launched from the action bar / More menu. Behavior unchanged.

### 2. List screen — actionable triage table

Reworks `ReturnListScreen`:

- **Stat cards → clickable filter buckets.** Needs approval, Awaiting QC, Refund due,
  In transit, Exchanges. Clicking a bucket sets the corresponding status/type filter
  and highlights the active bucket. Total stays as a non-filtering summary.
- **Triage table** (keep MaterialTable): add an **Age** column (time since created;
  red/bold past a staleness threshold) and a **Next action** shortcut cell per row
  (e.g. "Approve →") that deep-links into the detail screen. Keep existing columns,
  search, type filter, and pagination.
- Bucket → filter mapping is a small shared config so labels/filters stay in sync
  with `nextActionMap` semantics.

### 3. Shared components (new, under `frontend/src/components/returns/`)

- `ReturnStatusStepper` — lifecycle stepper from status (+ terminal handling).
- `ReturnActionBar` — primary action + More menu; consumes `nextActionMap`.
- `nextActionMap.js` — config mapping next statuses / pseudo-actions to display.
- `ReturnTriageCards` — clickable bucket cards for the list.
- `CopyRow` — extracted from the detail screen (label + value + copy).
- Reuse existing `ReturnStatusBadge`, `ReturnTimeline`, `QCDispositionForm`.

Keeps each screen file focused; action logic lives in one config + one bar component
rather than smeared across a 900-line screen.

---

## Data flow

Unchanged. `getReturnDetails` already returns `{ returnRequest, nextStatuses, payment }`.
The cockpit reads `nextStatuses` to drive the action bar and `returnRequest` fields for
all cards. All existing action creators (`updateReturnStatus`, `updateQCDisposition`,
`processRefund`, `createExchangeOrder`, `generateCreditNote`, `addReturnNote`,
`generateReturnLabel`, `initiateReturnPickup`) are reused as-is, including their
success-reset/refetch effects.

## Error & loading handling

Unchanged pattern: per-action `loading`/`error`/`success` slices already exist; surface
errors inline near the action bar and keep the existing top-level `Message`/`Loader`.
Disabled-with-reason on the primary button replaces silent no-ops.

## Testing

- Manual lifecycle walk-through: drive a RETURN, an EXCHANGE, and a REPLACEMENT through
  every state; confirm the action bar shows the correct primary action and the stepper
  advances at each step.
- Edge states: REJECTED, CANCELLED, PICKUP_FAILED render correct terminal/side UI.
- QC gating: "Complete QC" disabled until all items have a disposition.
- Refund: amount and destination shown inline; modal records refund.
- List: each bucket filters correctly; Age highlights stale rows; Next-action deep-links.
- No backend contract changes, so existing backend tests remain valid.

## Risks / trade-offs

- Single-page detail can feel dense for high-item returns — mitigated by card grouping
  and the collapsible timeline.
- `nextActionMap` must stay aligned with `returnStateMachine.js`; document the coupling
  in the config file so a future state change updates both.
