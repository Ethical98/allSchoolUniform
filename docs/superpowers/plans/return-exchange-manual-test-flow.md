# Return/Exchange Module — Admin Manual Test Flow

**Purpose:** End-to-end verification that all 24 bugs and 6 missing features are fixed and working correctly in the admin UI.

**Prerequisites:**
- Backend running locally with ShipRocket credentials in `.env`
- At least one delivered order in the DB (status = Delivered, `tracking.deliveredAt` set within last 7 days)
- At least one product with stock > 0 in the DB

---

## Flow 1 — RETURN (Full Refund, CHANGED_MIND)

This flow tests: shipping refund timing fix (BUG 9), QC tab visibility (BUG 21), UNSELLABLE zero-refund (M4), refund amount read-only (BUG 20), ShipRocket mapper payload (BUGs 1/2/5/6/8), AWB parsing (BUG 16), tracking endpoint (BUG 15), webhook auto-transition (M1), label generation (M3).

### Step 1 — Create the Return

1. Go to **Admin → Returns → Create Return**
2. Enter the Order ID of a recently delivered order
3. Confirm the order loads with its items listed
4. Confirm **no warning** about "Could not load existing returns" appears (BUG 22 fix)
5. Select **all** items with quantity matching the ordered quantity
6. Set return type = **RETURN**
7. Set reason = **CHANGED_MIND**
8. On the review step, confirm:
   - Unit price shows **discounted price** (not MRP) — e.g. if MRP ₹500 with 10% disc, shows ₹450.00 (BUG 18 fix)
   - Subtotal = discounted price × qty (BUG 18 fix)
   - If the item has a discount, MRP is shown in small text: `(MRP: ₹500)`
9. Submit. Confirm success and redirect to the return detail page.

**Expected DB state:**
```
returnRequest.refundShipping === true   (all items returned + CHANGED_MIND = full refund)
returnRequest.status === 'INITIATED'
```

To verify via Mongo:
```
db.returnrequests.findOne({ orderId: '<ORDER_ID>' }, { refundShipping: 1, status: 1 })
```

---

### Step 2 — Approve the Return

1. On the return detail page, confirm the **Approve** button is visible
2. Click **Approve**
3. Confirm status badge changes to `APPROVED`
4. Confirm action buttons update immediately without flicker (BUG 23 fix — nextStatuses not stale)

---

### Step 3 — Schedule Pickup (triggers ShipRocket)

1. Click **Schedule Pickup**
2. Confirm status changes to `PICKUP_SCHEDULED`
3. In the **Shipping tab**, confirm:
   - AWB code is populated (non-empty string) — (BUG 16 fix)
   - Courier name is populated
4. Check ShippingLog in Mongo for payload correctness (BUGs 1/2/4/5/6/8):
```
db.shippinglogs.findOne(
  { action: 'CREATE_RETURN_ORDER', 'asuOrderId': '<ORDER_ID>' },
  { requestPayload: 1 }
)
```
Confirm:
   - `pickup_phone` is a valid phone number (not empty)
   - `pickup_country` === `"India"` (not `"IN"` or undefined)
   - `pickup_isd_code` === `"+91"`
   - `order_items[0].tax` is a **rupee amount** like `23.81`, NOT a percentage like `5`

---

### Step 4 — Generate Return Label

1. In the **Shipping tab**, confirm a **"Generate Return Label"** button appears (M3 fix)
2. Click it. Confirm:
   - Button shows **"Generating…"** and is disabled during the API call
   - On success, button disappears and a **"Download Return Label"** link appears
   - If the API fails, an error message appears in red at the top
3. Click "Download Return Label" — confirm it opens in a new tab

---

### Step 5 — Simulate Webhook: Pickup Pickup

Using curl or Postman, POST to `http://localhost:5000/api/shipping/webhook`:
```json
{
  "awb": "<AWB_CODE_FROM_STEP_3>",
  "current_status_id": 3,
  "current_status": "Pickup Scheduled"
}
```
Confirm response: `{ "received": true, "type": "reverse" }` (M1 fix — handled as return, not forward)

Refresh the return detail page. Confirm:
- `reverseShipping.status` field in Shipping tab shows `PICKUP_SCHEDULED`
- Return status is still `PICKUP_SCHEDULED` (status code 3 only updates reverseShipping, not return status)

---

### Step 6 — Simulate Webhook: Picked Up (IN_TRANSIT)

POST to webhook:
```json
{
  "awb": "<AWB_CODE>",
  "current_status_id": 6,
  "current_status": "Picked Up"
}
```
Refresh the return detail. Confirm:
- Return status badge = `IN_TRANSIT`
- Timeline shows a `STATUS_CHANGE` entry with `performedByName: "System (Webhook)"`

---

### Step 7 — Simulate Webhook: Delivered to Warehouse (RECEIVED)

POST to webhook:
```json
{
  "awb": "<AWB_CODE>",
  "current_status_id": 7,
  "current_status": "Delivered"
}
```
Refresh the return detail. Confirm:
- Return status = `RECEIVED`
- `reverseShipping.receivedAt` is populated in the Shipping tab

---

### Step 8 — Idempotency Check

POST the same webhook again (status 7, same AWB). Confirm:
- Response is still `{ "received": true, "type": "reverse" }` (no crash)
- Return status stays `RECEIVED` (not double-processed)
- No duplicate timeline entry added

---

### Step 9 — Start QC

1. Click **Start QC** button on the return detail
2. Confirm status = `QC_IN_PROGRESS`
3. Confirm the **QC Inspection tab** appears

---

### Step 10 — Submit QC with Mixed Dispositions

1. Click the **QC Inspection** tab
2. Set dispositions:
   - Item 1 → **GOOD**
   - Item 2 (if multiple) → **UNSELLABLE**, add a note "Torn packaging"
3. Click **Submit QC**
4. Confirm status = `QC_COMPLETED`
5. Confirm the QC tab is still visible (BUG 21 fix — tab does NOT disappear)
6. Confirm QC tab is now **read-only** — no form, just a table with dispositions shown
7. Confirm UNSELLABLE row shows **"No refund"** in the Refund column (M4 fix)
8. Confirm GOOD row shows a rupee amount like `₹450.00`

---

### Step 11 — Process Refund

1. Click **Initiate Refund** button
2. Confirm the refund modal opens
3. Confirm the **Refund Amount field is read-only and disabled** — cannot be edited (BUG 20 fix)
4. Confirm the amount shown excludes the UNSELLABLE item (M4 fix):
   - If Item 1 (GOOD) was ₹450 and Item 2 (UNSELLABLE) was ₹300, total = ₹450 (not ₹750)
5. Select refund method = **Bank Transfer**, enter a transaction reference
6. Click **Process Refund**
7. Confirm status = `REFUND_INITIATED` → `COMPLETED`

---

## Flow 2 — EXCHANGE (Product Search Modal + Stock Decrement)

This flow tests: ProductSearchModal (BUG 17), exchange validation (BUG 17), stock decrement (BUG 12), "Ship This Order →" button (M5).

### Step 1 — Create an Exchange Return

1. Go to **Admin → Returns → Create Return**
2. Enter a delivered order ID
3. Select items to return, set type = **EXCHANGE**
4. Confirm no raw ObjectId text input is shown — instead a **"+ Select Exchange Product"** button appears per item (BUG 17 fix)
5. Click **"+ Select Exchange Product"** for the first item:
   - Modal opens titled "Select Exchange Product"
   - Type a product name and press Enter or click Search
   - Confirm results show Product, SKU, and size badges with stock counts
   - Confirm out-of-stock sizes show as grey/disabled (cannot be clicked)
   - Click an in-stock size badge — confirm it highlights as selected
   - Confirm the selected product preview shows at the bottom of the modal
   - Click **"Select This Product"**
6. Confirm the item card now shows the selected product name, size, and price
7. Try clicking **Next** without selecting all items — confirm an alert blocks progression (BUG 17 validation fix)
8. After selecting all items, click Next, then complete reason and submit

---

### Step 2 — Process to QC_COMPLETED

Follow Steps 2–10 from Flow 1 (approve → pickup → receive → QC). Set all items to **GOOD** disposition.

---

### Step 3 — Create Exchange Order

1. After QC_COMPLETED, click **Create Exchange Order**
2. Confirm success — status changes to `EXCHANGE_SHIPPED`
3. Confirm the stock of the selected exchange product was decremented (BUG 12 fix):
```
db.products.findOne(
  { _id: ObjectId('<EXCHANGE_PRODUCT_ID>') },
  { 'size.$': 1 }
)
```
   Confirm `quantityOnHand` decreased by the exchanged quantity.

---

### Step 4 — Ship the Exchange Order

1. In the **Shipping tab**, confirm an **Exchange / Replacement Order** card appears (M5 fix)
2. Confirm the card shows the exchange order number
3. Click **"Ship This Order →"** — confirm it opens the shipping module in a new tab at `/admin/shipping/orders/<exchangeOrderId>`
4. Click **"View Exchange Order"** — confirm it opens the order edit page

---

## Flow 3 — REPLACEMENT (Same Product, Stock Check)

This flow tests: REPLACEMENT stock check (BUG 11), REPLACEMENT stock decrement (BUG 12).

### Step 1 — Create a Replacement Return

1. Create a return with type = **REPLACEMENT**
2. Submit — no exchange product selection needed (same product/size is reused)

### Step 2 — Attempt with Zero Stock

Before creating the exchange/replacement order, manually set the product's `quantityOnHand` to 0:
```
db.products.updateOne(
  { _id: ObjectId('<PRODUCT_ID>'), 'size.size': '<SIZE>' },
  { $set: { 'size.$.quantityOnHand': 0 } }
)
```
Then click **Create Exchange Order**. Confirm:
- Error message: `"Replacement product ... is out of stock. Available: 0"` (BUG 11 fix)
- Status stays at `QC_COMPLETED` (not advanced)

Restore stock and retry — confirm the replacement order is created successfully.

---

## Flow 4 — PICKUP_FAILED Recovery

This flow tests: PICKUP_FAILED button (BUG 24), re-schedule after failure.

### Step 1 — Trigger PICKUP_FAILED

After a return is in `PICKUP_SCHEDULED`, simulate the webhook:
```json
{
  "awb": "<AWB_CODE>",
  "current_status_id": 14,
  "current_status": "Pickup Failed"
}
```
Refresh the detail page. Confirm status = `PICKUP_FAILED`.

### Step 2 — Manual PICKUP_FAILED Button

Alternatively, with a return in `PICKUP_SCHEDULED`, click **"Mark Pickup Failed"** button (BUG 24 fix — this button now exists). Confirm status = `PICKUP_FAILED`.

### Step 3 — Re-schedule

Click **Schedule Pickup** again. Confirm:
- Status returns to `PICKUP_SCHEDULED`
- New AWB may be generated or same one reused

---

## Flow 5 — Return Window Expiry (Edge Case)

This flow tests: isWindowExpired fix (BUG 19).

### Step 1 — Expired Window

Find or create an order where `tracking.deliveredAt` is more than 7 days ago.

Open Create Return for that order. Confirm:
- A warning or disabled state shows indicating the return window has expired
- The form does not allow submission past the expiry check

### Step 2 — Override Window (Admin)

If the admin has a checkbox/toggle to override the return window, enable it and confirm submission succeeds.

---

## Flow 6 — Return List Screen

This flow tests: Created date column fix (M6).

1. Go to **Admin → Returns → List**
2. Confirm the list shows a **"Created"** column with dates in `YYYY-MM-DD` format (not raw ISO timestamps)
3. Confirm date sorting/filtering works correctly

---

## Quick Smoke Test Checklist

After all flows, run through this checklist to confirm no regressions:

| Check | Expected |
|-------|----------|
| Returns list loads without errors | ✅ |
| Create Return: order lookup works | ✅ |
| Create Return: EXCHANGE shows modal, not text input | ✅ |
| Create Return: review subtotal uses discounted price | ✅ |
| Return detail: action buttons appear for each status | ✅ |
| Return detail: PICKUP_FAILED button exists | ✅ |
| Return detail: QC tab visible after QC_COMPLETED | ✅ |
| Return detail: Refund amount field is read-only | ✅ |
| Return detail: Label button shows/disables/loads | ✅ |
| Return detail: Exchange Order card has "Ship This Order →" | ✅ |
| Webhook: reverse AWB matched correctly | ✅ |
| Webhook: status code 6 → IN_TRANSIT on return | ✅ |
| Webhook: status code 7 → RECEIVED on return | ✅ |
| Webhook: idempotent (duplicate fires silently ignored) | ✅ |
| ShipRocket payload: pickup_phone populated | ✅ |
| ShipRocket payload: tax is rupee amount not rate | ✅ |
| Stock decremented after exchange order created | ✅ |
| UNSELLABLE item → ₹0 refund | ✅ |
