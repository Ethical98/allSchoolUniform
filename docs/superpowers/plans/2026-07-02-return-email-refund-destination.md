# Return Email Refund Destination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the customer's actual refund destination (COD UPI/masked bank, or "original payment method" for prepaid) in the Refund Initiated and Completed return emails, register the needed template conditionals, and audit all 9 return emails render cleanly.

**Architecture:** Backend only (`asu/backend`, ESM Node). `buildEmailData` in `returnEmailHelper.js` gains a prebuilt `refundDestinationText` plus two boolean-ish flags (`hasCustomerRefundDestination`, `usesOriginalPayment`) that gate copy in the two refund templates. The custom string-replace engine (`emailService.js`, NOT Handlebars) needs the new conditional keys added to its allowlist. No `{{else}}` exists, so conditional copy is done with two sibling `{{#if}}` blocks.

**Tech Stack:** Node ESM, `node --test`, custom HTML-email templating (string replace + partials).

**Refs:** Spec `docs/superpowers/specs/2026-06-21-return-email-refund-destination-design.md`. Test glob (run from `/Users/devansh/Desktop/asu`): `npm test` → `node --test "backend/modules/returns/**/*.test.js"`.

**Key engine facts (verified):**
- `processTemplate` (`backend/utils/emailService.js:327`) replaces `{{key}}` for every key in `data`, then processes `{{#if KEY}}...{{/if}}` ONLY for keys in the allowlist at `emailService.js:356` (`['trackingNumber','courierName','refundAmount','discount','discountPercent','last4']`), then strips all remaining `{{/if}}`. A key NOT in that allowlist leaves its `{{#if}}` block unprocessed.
- Return statuses that email: mapped in `returnEmailHelper.js` `TEMPLATE_MAP`. QC/internal states intentionally excluded — do NOT add them.
- ReturnRequest fields: `refundMethod` ('UPI'|'BANK_TRANSFER'|...), `refundUpiId`, `refundBankDetails.{accountHolderName,accountNumber,ifscCode}`.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `backend/modules/returns/utils/refundDestination.js` | Modify | Add pure `formatRefundDestination(...)` → `{ text, hasCustomerDestination }`. Colocated with the existing refund validators. |
| `backend/modules/returns/utils/refundDestination.test.js` | Modify | Unit tests for `formatRefundDestination` (append to existing `node:test` file). |
| `backend/modules/returns/utils/returnEmailHelper.js` | Modify | `buildEmailData` calls `formatRefundDestination` and adds `refundDestinationText`, `hasCustomerRefundDestination`, `usesOriginalPayment`. |
| `backend/utils/emailService.js` | Modify | Add the two new conditional keys to the `processTemplate` allowlist. |
| `backend/templates/returnRefundInitiatedEmail.html` | Modify | Add "Refund To" row; replace hardcoded original-payment line with two conditional `<p>` blocks. |
| `backend/templates/returnCompletedEmail.html` | Modify | Same treatment. |

---

## Task 1: `formatRefundDestination` pure helper (+ tests)

**Files:**
- Modify: `backend/modules/returns/utils/refundDestination.js`
- Modify: `backend/modules/returns/utils/refundDestination.test.js`

- [ ] **Step 1: Add the failing tests**

Append to `backend/modules/returns/utils/refundDestination.test.js`:
```js
import { formatRefundDestination } from './refundDestination.js';

test('formatRefundDestination: COD UPI', () => {
  const r = formatRefundDestination({ refundMethod: 'UPI', refundUpiId: 'rahul@oksbi' });
  assert.equal(r.text, 'UPI: rahul@oksbi');
  assert.equal(r.hasCustomerDestination, true);
});
test('formatRefundDestination: COD bank masks account to last 4, keeps IFSC', () => {
  const r = formatRefundDestination({
    refundMethod: 'BANK_TRANSFER',
    refundBankDetails: { accountHolderName: 'Rahul K', accountNumber: '123456789012', ifscCode: 'HDFC0001234' },
  });
  assert.equal(r.text, 'Rahul K · Bank A/C ••••9012 · IFSC HDFC0001234');
  assert.equal(r.hasCustomerDestination, true);
});
test('formatRefundDestination: bank without holder name omits the name segment', () => {
  const r = formatRefundDestination({
    refundMethod: 'BANK_TRANSFER',
    refundBankDetails: { accountNumber: '99887766', ifscCode: 'SBIN0000456' },
  });
  assert.equal(r.text, 'Bank A/C ••••7766 · IFSC SBIN0000456');
  assert.equal(r.hasCustomerDestination, true);
});
test('formatRefundDestination: prepaid / no destination falls back to original payment', () => {
  const r = formatRefundDestination({ refundMethod: 'ORIGINAL_PAYMENT' });
  assert.equal(r.text, 'your original payment method');
  assert.equal(r.hasCustomerDestination, false);
  const empty = formatRefundDestination({});
  assert.equal(empty.text, 'your original payment method');
  assert.equal(empty.hasCustomerDestination, false);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /Users/devansh/Desktop/asu && npm test`
Expected: FAIL — `formatRefundDestination` is not exported.

- [ ] **Step 3: Implement the helper**

Append to `backend/modules/returns/utils/refundDestination.js`:
```js
// Human-readable refund destination for customer emails. Masks the bank
// account to the last 4 digits; shows IFSC in full. Falls back to
// "your original payment method" for prepaid / no customer destination.
export function formatRefundDestination({ refundMethod, refundUpiId, refundBankDetails } = {}) {
  if (refundMethod === 'UPI' && refundUpiId) {
    return { text: `UPI: ${refundUpiId}`, hasCustomerDestination: true };
  }
  if (refundMethod === 'BANK_TRANSFER' && refundBankDetails) {
    const acc = String(refundBankDetails.accountNumber || '');
    const masked = acc ? `••••${acc.slice(-4)}` : '';
    const parts = [];
    if (refundBankDetails.accountHolderName) parts.push(refundBankDetails.accountHolderName);
    if (masked) parts.push(`Bank A/C ${masked}`);
    if (refundBankDetails.ifscCode) parts.push(`IFSC ${refundBankDetails.ifscCode}`);
    return { text: parts.join(' · '), hasCustomerDestination: true };
  }
  return { text: 'your original payment method', hasCustomerDestination: false };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /Users/devansh/Desktop/asu && npm test`
Expected: PASS — all `formatRefundDestination` tests green; existing tests still pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/devansh/Desktop/asu
git add backend/modules/returns/utils/refundDestination.js backend/modules/returns/utils/refundDestination.test.js
git commit -m "feat(returns): formatRefundDestination helper for emails"
```

---

## Task 2: Expose destination fields in `buildEmailData`

**Files:**
- Modify: `backend/modules/returns/utils/returnEmailHelper.js`

- [ ] **Step 1: Import the helper**

At the top of `backend/modules/returns/utils/returnEmailHelper.js`, below the existing `emailService.js` import, add:
```js
import { formatRefundDestination } from './refundDestination.js';
```

- [ ] **Step 2: Add the fields to the returned object**

In `buildEmailData`, the function ends with a `return { ... }`. Just before that `return`, add:
```js
  const refundDestination = formatRefundDestination({
    refundMethod: returnRequest.refundMethod,
    refundUpiId: returnRequest.refundUpiId,
    refundBankDetails: returnRequest.refundBankDetails,
  });
```
Then inside the returned object literal, after the `frontendUrl: ...` line, add:
```js
    refundDestinationText: refundDestination.text,
    // '1' (truthy) only when the customer gave a COD destination; omitted
    // otherwise so {{#if hasCustomerRefundDestination}} is false for prepaid.
    hasCustomerRefundDestination: refundDestination.hasCustomerDestination ? '1' : '',
    usesOriginalPayment: refundDestination.hasCustomerDestination ? '' : '1',
```

- [ ] **Step 3: Verify syntax + tests**

Run: `cd /Users/devansh/Desktop/asu && node -c backend/modules/returns/utils/returnEmailHelper.js && npm test`
Expected: no syntax error; tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/devansh/Desktop/asu
git add backend/modules/returns/utils/returnEmailHelper.js
git commit -m "feat(returns): pass refund destination to email templates"
```

---

## Task 3: Register conditional keys in the email engine

**Files:**
- Modify: `backend/utils/emailService.js`

- [ ] **Step 1: Extend the conditionals allowlist**

In `backend/utils/emailService.js`, inside `processTemplate`, find:
```js
  const conditionals = ['trackingNumber', 'courierName', 'refundAmount', 'discount', 'discountPercent', 'last4'];
```
Replace it with:
```js
  const conditionals = ['trackingNumber', 'courierName', 'refundAmount', 'discount', 'discountPercent', 'last4', 'hasCustomerRefundDestination', 'usesOriginalPayment', 'creditNoteNumber'];
```
(`creditNoteNumber` is added too because the refund templates already use `{{#if creditNoteNumber}}` but it was missing from this allowlist — without it that block never conditionally renders. Adding it fixes a latent bug in the same edit.)

- [ ] **Step 2: Verify syntax**

Run: `cd /Users/devansh/Desktop/asu && node -c backend/utils/emailService.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/devansh/Desktop/asu
git add backend/utils/emailService.js
git commit -m "feat(email): register refund-destination conditionals in template engine"
```

---

## Task 4: Update `returnRefundInitiatedEmail.html`

**Files:**
- Modify: `backend/templates/returnRefundInitiatedEmail.html`

- [ ] **Step 1: Add a "Refund To" row after the Refund Breakdown block**

In `backend/templates/returnRefundInitiatedEmail.html`, find the end of the Refund Breakdown `<tr>` (the block containing `Total Refund`, which closes with `</table>\n                        </td>\n                    </tr>` around line 80). Immediately AFTER that closing `</tr>`, insert:
```html
                    <!-- Refund To -->
                    <tr>
                        <td style="padding: 0 20px 30px;" class="email-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 16px 20px; text-align: center;">
                                        <span style="color: #6b7280; font-size: 12px; display: block; margin-bottom: 4px;">Refund To</span>
                                        <strong style="color: #111827; font-size: 15px;">{{refundDestinationText}}</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
```

- [ ] **Step 2: Replace the hardcoded timeline copy with two conditional blocks**

Find this exact line (line ~105):
```html
                                        <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.6;">The refund will be credited to your original payment method within 5-7 business days. Bank processing times may vary.</p>
```
Replace it with:
```html
                                        {{#if hasCustomerRefundDestination}}<p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.6;">The refund will be sent to {{refundDestinationText}} within 5-7 business days. Processing times may vary.</p>{{/if}}
                                        {{#if usesOriginalPayment}}<p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.6;">The refund will be credited to your original payment method within 5-7 business days. Bank processing times may vary.</p>{{/if}}
```

- [ ] **Step 3: Verify no accidental syntax breakage (render smoke check)**

Run this one-off render (from `/Users/devansh/Desktop/asu`) to confirm the template processes without leaking tokens for a COD-UPI case:
```bash
node --input-type=module -e "
import { processTemplate } from './backend/utils/emailService.js';
const html = await processTemplate('returnRefundInitiatedEmail.html', {
  returnId:'R1', orderId:'O1', customerName:'A', itemsHtml:'<tr><td>x</td></tr>', itemCount:1,
  refundAmount:'100', totalRefund:'100', refundDestinationText:'UPI: a@b',
  hasCustomerRefundDestination:'1', usesOriginalPayment:'', frontendUrl:'https://x'
});
console.log('UPI line present:', html.includes('sent to UPI: a@b'));
console.log('original-payment line absent:', !html.includes('credited to your original payment method'));
console.log('no leaked ifs:', !html.includes('{{#if') && !html.includes('{{/if}}'));
"
```
Expected: three `true` lines.

- [ ] **Step 4: Commit**

```bash
cd /Users/devansh/Desktop/asu
git add backend/templates/returnRefundInitiatedEmail.html
git commit -m "feat(returns): show refund destination on Refund Initiated email"
```

---

## Task 5: Update `returnCompletedEmail.html`

**Files:**
- Modify: `backend/templates/returnCompletedEmail.html`

- [ ] **Step 1: Add a "Refund To" row after the Refund Amount block**

In `backend/templates/returnCompletedEmail.html`, find the `<!-- Refund Amount -->` `<tr>` that ends (around line 54) with:
```html
                            </table>
                        </td>
                    </tr>
```
(the one right before `<!-- Credit Note -->`). Immediately AFTER that closing `</tr>`, insert:
```html
                    <!-- Refund To -->
                    <tr>
                        <td style="padding: 0 20px 30px;" class="email-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 16px 20px; text-align: center;">
                                        <span style="color: #6b7280; font-size: 12px; display: block; margin-bottom: 4px;">Refund To</span>
                                        <strong style="color: #111827; font-size: 15px;">{{refundDestinationText}}</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
```

- [ ] **Step 2: Replace the hardcoded info-note copy with two conditional blocks**

Find this exact line (line ~78):
```html
                                        <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">The refund has been credited to your original payment method. Please allow 2-3 business days for it to reflect in your account, depending on your bank.</p>
```
Replace it with:
```html
                                        {{#if hasCustomerRefundDestination}}<p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">The refund has been sent to {{refundDestinationText}}. Please allow 2-3 business days for it to reflect, depending on your bank.</p>{{/if}}
                                        {{#if usesOriginalPayment}}<p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">The refund has been credited to your original payment method. Please allow 2-3 business days for it to reflect in your account, depending on your bank.</p>{{/if}}
```

- [ ] **Step 3: Render smoke check (prepaid case this time)**

Run (from `/Users/devansh/Desktop/asu`):
```bash
node --input-type=module -e "
import { processTemplate } from './backend/utils/emailService.js';
const html = await processTemplate('returnCompletedEmail.html', {
  returnId:'R1', orderId:'O1', customerName:'A', itemsHtml:'<tr><td>x</td></tr>', itemCount:1,
  totalRefund:'100', refundDestinationText:'your original payment method',
  hasCustomerRefundDestination:'', usesOriginalPayment:'1', frontendUrl:'https://x'
});
console.log('original-payment line present:', html.includes('credited to your original payment method'));
console.log('COD line absent:', !html.includes('has been sent to'));
console.log('no leaked ifs:', !html.includes('{{#if') && !html.includes('{{/if}}'));
"
```
Expected: three `true` lines.

- [ ] **Step 4: Commit**

```bash
cd /Users/devansh/Desktop/asu
git add backend/templates/returnCompletedEmail.html
git commit -m "feat(returns): show refund destination on Refund Completed email"
```

---

## Task 6: Audit — render all 9 return emails

**Files:** none (verification only; harness is throwaway, not committed)

- [ ] **Step 1: Render every mapped template with representative data**

Create `/tmp/audit_return_emails.mjs` (outside the repo so it's never committed):
```js
import { processTemplate } from '/Users/devansh/Desktop/asu/backend/utils/emailService.js';

const templates = [
  'returnInitiatedEmail.html', 'returnApprovedEmail.html', 'returnPickupScheduledEmail.html',
  'returnPickupFailedEmail.html', 'returnRefundInitiatedEmail.html', 'returnCompletedEmail.html',
  'exchangeShippedEmail.html', 'returnRejectedEmail.html', 'returnCancelledEmail.html',
];
const base = {
  returnId:'RET-1', orderId:'ORD-1', customerName:'Test User', type:'RETURN', reason:'CHANGED MIND',
  reasonDetails:'', refundAmount:'499', shippingRefundAmount:'0', totalRefund:'499',
  exchangeOrderNumber:'EX-1', creditNoteNumber:'', priceDifference:'0',
  itemsHtml:'<tr><td>Shirt</td><td>M</td><td>1</td><td>499</td><td>499</td></tr>', itemCount:1,
  createdDate:'01 Jul 2026', pickupDate:'03 Jul 2026', awbCode:'AWB123', courierName:'Delhivery',
  supportEmail:'help@x.com', supportPhone:'+91', frontendUrl:'https://x',
  refundDestinationText:'UPI: test@oksbi', hasCustomerRefundDestination:'1', usesOriginalPayment:'',
};
let failed = 0;
for (const t of templates) {
  const html = await processTemplate(t, base);
  const leakVar = /{{\s*[a-zA-Z]/.test(html);          // unresolved {{var}}
  const leakIf = html.includes('{{#if') || html.includes('{{/if}}');
  const ok = !leakVar && !leakIf && html.length > 200;
  if (!ok) failed++;
  console.log(`${ok ? 'OK ' : 'BAD'}  ${t}  ${leakVar ? '[leaked var]' : ''}${leakIf ? '[leaked if]' : ''}`);
}
console.log(failed === 0 ? 'AUDIT PASS' : `AUDIT FAIL (${failed})`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 2: Run the audit**

Run: `node /tmp/audit_return_emails.mjs`
Expected: every line `OK`, final `AUDIT PASS`.
If any template shows `[leaked var]`, that template references a `{{key}}` not in `buildEmailData` — note it; only fix if it's a real missing field for the customer (do NOT invent data). If `[leaked if]`, the block's key needs adding to the `emailService.js` allowlist (Task 3).

- [ ] **Step 3: Remove the harness**

Run: `rm /tmp/audit_return_emails.mjs`
(No commit — nothing repo-side changed in this task unless the audit surfaced a fix, which gets its own commit.)

---

## Self-Review Notes

- **Spec coverage:** destination data (Task 1,2), engine conditional registration (Task 3), refund templates updated (Task 4,5), audit (Task 6), masking to last 4 + full IFSC (Task 1 helper + test), refund-stage-only scope (only the two refund templates touched). QC states untouched.
- **Engine `{{else}}` gap handled:** two sibling `{{#if}}` blocks (`hasCustomerRefundDestination` / `usesOriginalPayment`) — mutually exclusive by construction in Task 2.
- **Latent bug fixed opportunistically:** `creditNoteNumber` added to the allowlist (the refund templates already used `{{#if creditNoteNumber}}` but it was never in the conditional list).
- **Type/name consistency:** `refundDestinationText`, `hasCustomerRefundDestination`, `usesOriginalPayment` identical across helper return, `buildEmailData`, allowlist, and both templates. Helper returns `{ text, hasCustomerDestination }`; the mapping to the `has*`/`uses*` string flags happens once in `buildEmailData` (Task 2).
- **No live email send** anywhere in the plan; audit uses `processTemplate` render only.
