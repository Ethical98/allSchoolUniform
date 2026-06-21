# Return Emails — Refund Destination + Audit + Polish

**Date:** 2026-06-21
**Branch:** asu-next
**Status:** Approved (scope confirmed)
**Scope:** Enhance the existing customer return-status emails. Backend only (`asu/backend`).

## Context (what already exists)

The return-email system is **already built and complete**:
- `backend/modules/returns/utils/returnEmailHelper.js` maps every customer-facing status to a template and **intentionally excludes QC/internal states** (IN_TRANSIT, RECEIVED, QC_IN_PROGRESS, QC_COMPLETED).
- All 9 templates exist (`backend/templates/return*.html`, `exchangeShippedEmail.html`), well-built responsive HTML with `{{> header}}`/`{{> footer}}` partials and `{{#if}}` conditionals.
- `sendReturnEmail` fires on creation **and on every status update** (`returnController.js` create paths + the status-update handler).

So this is **enhancement**, not new templates.

## Problem

1. **Refund destination is invisible in emails.** `buildEmailData` never passes the customer's COD refund destination, and `returnRefundInitiatedEmail.html` hardcodes "credited to your original payment method" — wrong for COD, where the refund goes to the customer-provided UPI/bank.
2. **No correctness audit.** No verification that each status email renders cleanly (no leaked placeholders, conditionals resolve) with real data.
3. **Minor polish** opportunities surfaced by the audit.

## Engine constraint (important)

`processTemplate` (`backend/utils/emailService.js:327`) is **custom string-replace, not Handlebars**. `{{#if KEY}}` blocks only work for keys in a **hardcoded allowlist** (`emailService.js:356`: `trackingNumber, courierName, refundAmount, discount, discountPercent, last4`). Any new `{{#if}}` key MUST be added to that array or the block leaks/never renders.

## Changes

### 1. Build the refund-destination data (`returnEmailHelper.js`)

In `buildEmailData`, derive and add:
- `refundDestinationText` — a prebuilt human string:
  - `refundMethod === 'UPI'` → `UPI: <refundUpiId>`
  - `refundMethod === 'BANK_TRANSFER'` → `Bank A/C ••••<last4>, IFSC <ifscCode>` (account masked to last 4; IFSC shown in full; account holder name appended if present)
  - otherwise (prepaid / no destination) → `your original payment method`
- `refundDestinationText` is always non-empty (falls back to the prepaid string), so a `{{#if refundDestinationText}}` block always renders — but we still gate the *COD-specific* framing on it being a real destination by using a second key:
- `hasCustomerRefundDestination` — truthy string (`'1'`) only when COD UPI/bank is present, else omitted (so `{{#if hasCustomerRefundDestination}}` distinguishes COD from prepaid copy).

Masking helper (local, pure): `maskAccount(n) => '••••' + last4`.

### 2. Register the new conditional key (`emailService.js`)

Add `'hasCustomerRefundDestination'` (and `'refundDestinationText'` for safety) to the conditionals allowlist at `emailService.js:356` so the `{{#if}}` blocks process.

### 3. Update the two refund-stage templates

`returnRefundInitiatedEmail.html` and `returnCompletedEmail.html`:
- Add a "Refund To" row showing `{{refundDestinationText}}`.
- Replace the hardcoded "credited to your original payment method" line with conditional copy:
  - `{{#if hasCustomerRefundDestination}}` → "The refund will be sent to {{refundDestinationText}} within 5–7 business days."
  - else → "The refund will be credited to your original payment method within 5–7 business days."

Only these two templates change (per scope decision: refund-stage emails, full details).

### 4. Audit (correctness pass, not committed)

A throwaway render harness calls the real `processTemplate(template, data)` for all 9 templates with representative datasets:
- COD UPI, COD bank, prepaid, exchange, replacement, and a missing-fields case.
Assert each output: no residual `{{` tokens, no dangling `{{#if}}`/`{{/if}}`, partials injected, items table present, and (for refund templates) the destination line correct per case. Inspect output; fix any template that leaks. Harness is deleted after (not part of the deliverable).

## Data Flow

status change → `sendReturnEmail(return, status)` → `buildEmailData(return)` now includes `refundDestinationText` + `hasCustomerRefundDestination` → `processTemplate` (with the new keys in its conditional allowlist) → refund templates render destination → Gmail send.

## Edge Cases

- **Prepaid / no destination:** `refundDestinationText = 'your original payment method'`, `hasCustomerRefundDestination` omitted → original-payment copy.
- **COD bank, missing IFSC or short account:** mask handles short numbers (`••••` + whatever digits); IFSC shown if present. (Backend already validated these on create, so they're well-formed in practice.)
- **Non-refund emails (approved, pickup, etc.):** unchanged — they don't reference the destination.
- **Account number absent on a UPI return:** bank branch not taken; UPI branch uses `refundUpiId`.

## Testing

Backend uses `node --test`. Add a unit test `returnEmailHelper.test.js` (place under a path matched by the test glob `backend/modules/returns/**/*.test.js`) for the **pure** `buildEmailData` destination logic:
- COD UPI → `refundDestinationText` = `UPI: x@y`, `hasCustomerRefundDestination` set.
- COD bank → masked `••••1234`, IFSC present, flag set.
- prepaid → `your original payment method`, flag absent.
Plus the audit render pass (manual, not committed). No live email send in tests.

## Out of Scope

- QC-state emails (correctly excluded by design).
- New statuses or templates.
- The `sendEmail` order-path templating (`getCommonEmailData` etc.).
- Echoing the destination on Approved/Pickup emails (decided: refund-stage only).
- Email provider / partial redesign of the (already good) templates.
