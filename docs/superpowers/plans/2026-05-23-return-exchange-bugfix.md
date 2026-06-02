# Return/Exchange Module — Full Bug Fix & Feature Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 24 identified bugs and 6 missing features in the return/exchange module including ShipRocket payload correctness, reverse webhook auto-status, exchange product search UI, stock integrity, and QC refund policy.

**Architecture:** Backend fixes are isolated to the returns module (`backend/modules/returns/`) and shipping webhook controller. Frontend changes add a product-search modal component and fix state/UI bugs in return screens. No schema migrations needed except adding `phone` to `pickupAddress` (backward-compatible).

**Tech Stack:** Node.js/Express, Mongoose, React/Redux, ShipRocket API v2 (`https://apiv2.shiprocket.in/v1/external`)

---

## Files Modified / Created

| File | Action | Purpose |
|------|--------|---------|
| `backend/modules/returns/models/ReturnRequestModel.js` | Modify | Add `phone` to `pickupAddress` subdocument |
| `backend/modules/returns/utils/returnShippingMapper.js` | Modify | Fix `pickup_phone`, `pickup_country`, `tax`, missing fields |
| `backend/modules/returns/controllers/returnController.js` | Modify | Fix AWB parsing, tracking endpoint, stock check for REPLACEMENT, exchange stock decrement, `shouldRefundShipping` timing, `PICKUP_FAILED` action |
| `backend/modules/returns/utils/returnValidation.js` | Modify | Fix `shouldRefundShipping` to accept current items; add UNSELLABLE zero-refund logic |
| `backend/modules/returns/utils/returnStockHandler.js` | Modify | Zero out `refundAmount` for UNSELLABLE items at QC |
| `backend/modules/shipping/controllers/shippingWebhookController.js` | Modify | Add reverse shipment webhook handler block |
| `backend/modules/returns/routes/returnRoutes.js` | Modify | Add `/:id/label` GET endpoint |
| `frontend/src/components/ProductSearchModal.js` | **Create** | Reusable product+size search modal for exchange selection |
| `frontend/src/Screens/ReturnCreateScreen.js` | Modify | Use ProductSearchModal, fix window check, fix review subtotal |
| `frontend/src/Screens/ReturnDetailScreen.js` | Modify | Fix refund modal, add PICKUP_FAILED button, fix QC tab, fix nextStatuses stale |
| `frontend/src/actions/returnActions.js` | Modify | Add `generateReturnLabel` action |
| `frontend/src/constants/returnConstants.js` | Modify | Add `RETURN_LABEL_*` constants |
| `frontend/src/reducers/returnReducers.js` | Modify | Add label reducer, fix returnDetails reset stale |

---

## Task 1: Add `phone` to `pickupAddress` schema + controller

**Bug fixed:** BUG 2 — `pickupAddress.phone` dropped silently; never stored in DB.

**Files:**
- Modify: `backend/modules/returns/models/ReturnRequestModel.js:153-159`
- Modify: `backend/modules/returns/controllers/returnController.js:141-147`

- [ ] **Step 1: Add `phone` field to `pickupAddress` subdocument**

In `backend/modules/returns/models/ReturnRequestModel.js`, replace the `pickupAddress` block (lines 153-159):

```js
// BEFORE:
pickupAddress: {
  address: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String, default: 'India' },
},

// AFTER:
pickupAddress: {
  address: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String, default: 'India' },
  phone: { type: String },
},
```

- [ ] **Step 2: Persist `phone` in `resolvedPickupAddress` in controller**

In `backend/modules/returns/controllers/returnController.js`, replace lines 141-147:

```js
// BEFORE:
const resolvedPickupAddress = pickupAddress || {
  address: order.shippingAddress?.address,
  city: order.shippingAddress?.city,
  state: order.shippingAddress?.state,
  postalCode: order.shippingAddress?.postalCode,
  country: order.shippingAddress?.country || 'India',
};

// AFTER:
const resolvedPickupAddress = pickupAddress
  ? {
      address: pickupAddress.address || order.shippingAddress?.address,
      city: pickupAddress.city || order.shippingAddress?.city,
      state: pickupAddress.state || order.shippingAddress?.state,
      postalCode: pickupAddress.postalCode || order.shippingAddress?.postalCode,
      country: pickupAddress.country || order.shippingAddress?.country || 'India',
      phone: pickupAddress.phone || order.phone || '',
    }
  : {
      address: order.shippingAddress?.address,
      city: order.shippingAddress?.city,
      state: order.shippingAddress?.state,
      postalCode: order.shippingAddress?.postalCode,
      country: order.shippingAddress?.country || 'India',
      phone: order.phone || '',
    };
```

- [ ] **Step 3: Commit**

```bash
git add backend/modules/returns/models/ReturnRequestModel.js backend/modules/returns/controllers/returnController.js
git commit -m "fix(returns): persist phone in pickupAddress schema and controller"
```

---

## Task 2: Fix ShipRocket return payload mapper

**Bugs fixed:** BUG 1 (pickup_phone), BUG 4 (name fallback), BUG 5 (country normalization), BUG 6 (isd_code), BUG 8 (tax is rate not amount).

**Files:**
- Modify: `backend/modules/returns/utils/returnShippingMapper.js`

- [ ] **Step 1: Rewrite the mapper with all fixes**

Replace the entire contents of `backend/modules/returns/utils/returnShippingMapper.js`:

```js
import dotenv from 'dotenv';

dotenv.config();

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
};

export const mapReturnToShiprocketPayload = (
  returnRequest,
  originalOrder,
  user
) => {
  // BUG 4 FIX: fallback to customerName (always populated on ReturnRequest)
  const fullName = originalOrder.name || returnRequest.customerName || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || firstName; // SR requires non-empty last_name

  const pickup = returnRequest.pickupAddress || originalOrder.shippingAddress;

  // Calculate sub_total from return items
  const subTotal = returnRequest.items.reduce((acc, item) => {
    const discountedPrice = Number(
      (item.price * (1 - (item.disc || 0) / 100)).toFixed(2)
    );
    return acc + discountedPrice * item.returnQty;
  }, 0);

  return {
    order_id: returnRequest.returnId,
    order_date: formatDate(returnRequest.createdAt),

    // Pickup FROM customer
    pickup_customer_name: firstName,
    pickup_last_name: lastName,
    pickup_address: pickup.address || '',
    pickup_city: pickup.city || '',
    pickup_state: pickup.state || '',
    pickup_pincode: String(pickup.postalCode || ''),
    pickup_country: 'India',                         // BUG 5 FIX: always hardcode
    pickup_email: user?.email || '',
    pickup_phone: pickup.phone || originalOrder.phone || '', // BUG 1 FIX: use pickup.phone first
    pickup_isd_code: '+91',                           // BUG 6 FIX: required by some couriers

    // Ship TO warehouse
    shipping_customer_name:
      process.env.COMPANY_NAME || 'All School Uniform',
    shipping_last_name: 'Warehouse',
    shipping_address: process.env.WAREHOUSE_ADDRESS || '',
    shipping_city: process.env.WAREHOUSE_CITY || '',
    shipping_pincode: String(process.env.WAREHOUSE_PINCODE || ''),
    shipping_state: process.env.WAREHOUSE_STATE || '',
    shipping_country: 'India',
    shipping_email: process.env.ADMIN_EMAIL || '',
    shipping_phone: process.env.SUPPORT_PHONE || '',
    shipping_isd_code: '+91',                         // BUG 6 FIX

    order_items: returnRequest.items.map((item) => {
      const discountedPrice = Number(
        (item.price * (1 - (item.disc || 0) / 100)).toFixed(2)
      );
      // BUG 8 FIX: ShipRocket 'tax' expects the rupee AMOUNT, not the rate %
      const taxRate = item.tax || 0;
      const taxableBase = discountedPrice / (1 + taxRate / 100);
      const taxAmount = Number((discountedPrice - taxableBase).toFixed(2));

      return {
        name: item.productName,
        sku: item.SKU
          ? `${item.SKU}${item.size ? `-${item.size}` : ''}`
          : `ASU-${item.product}${item.size ? `-${item.size}` : ''}`,
        units: item.returnQty,
        selling_price: discountedPrice,
        discount: 0,
        tax: taxAmount,
      };
    }),

    payment_method: 'Prepaid',
    sub_total: Number(subTotal.toFixed(2)),

    length: Number(process.env.SHIPPING_DEFAULT_LENGTH) || 25,
    breadth: Number(process.env.SHIPPING_DEFAULT_BREADTH) || 20,
    height: Number(process.env.SHIPPING_DEFAULT_HEIGHT) || 10,
    weight: Number(process.env.SHIPPING_DEFAULT_WEIGHT) || 0.5,
  };
};

export default { mapReturnToShiprocketPayload };
```

- [ ] **Step 2: Commit**

```bash
git add backend/modules/returns/utils/returnShippingMapper.js
git commit -m "fix(returns): correct ShipRocket return payload - phone, country, isd_code, tax amount"
```

---

## Task 3: Fix ShipRocket response parsing — AWB and tracking endpoint

**Bugs fixed:** BUG 3 (AWB response path), BUG 15 (tracking endpoint format), BUG 16 (assignCourier AWB parsing).

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js`

- [ ] **Step 1: Fix AWB parsing in `assignReturnCourier` (lines ~834-839)**

In `returnController.js`, find the `assignReturnCourier` function and replace the reverseShipping update:

```js
// BEFORE:
returnRequest.reverseShipping = {
  ...returnRequest.reverseShipping?.toObject?.() || {},
  awbCode: data.response?.data?.awb_code || '',
  courierName: data.response?.data?.courier_name || '',
  courierId: req.body.courierId,
};

// AFTER — ShipRocket returns awb_code at top level of response:
returnRequest.reverseShipping = {
  ...returnRequest.reverseShipping?.toObject?.() || {},
  awbCode: data.awb_code || data.response?.data?.awb_code || '',
  courierName: data.courier_name || data.courier_name_code || data.response?.data?.courier_name || '',
  courierId: req.body.courierId,
};
```

- [ ] **Step 2: Fix tracking endpoint format in `trackReturnPickup` (lines ~870-876)**

In `returnController.js`, find the `trackReturnPickup` function and replace the shippingApi call:

```js
// BEFORE:
const data = await shippingApi('get', '/courier/track/awb', {
  params: { awb: returnRequest.reverseShipping.awbCode },
  action: 'TRACK',
  orderId: returnRequest.order,
  asuOrderId: returnRequest.orderId,
});

// AFTER — ShipRocket tracking uses AWB as a path parameter:
const data = await shippingApi(
  'get',
  `/courier/track/awb/${returnRequest.reverseShipping.awbCode}`,
  {
    action: 'TRACK',
    orderId: returnRequest.order,
    asuOrderId: returnRequest.orderId,
  }
);
```

- [ ] **Step 3: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js
git commit -m "fix(returns): correct AWB response parsing and tracking endpoint path param"
```

---

## Task 4: Fix `shouldRefundShipping` pre-save timing bug

**Bug fixed:** BUG 9 — `shouldRefundShipping` runs before current items are saved, so a first full-return with `CHANGED_MIND` never gets shipping refunded.

**Files:**
- Modify: `backend/modules/returns/utils/returnValidation.js`
- Modify: `backend/modules/returns/controllers/returnController.js`

- [ ] **Step 1: Update `allOrderItemsReturned` to accept pending items**

In `backend/modules/returns/utils/returnValidation.js`, replace the `allOrderItemsReturned` function:

```js
/**
 * Check if all order items have been fully returned.
 * Accepts optional pendingItems to account for items being created in the
 * current request (before they are saved to DB).
 *
 * @param {Object} order
 * @param {Array} pendingItems - [{ product, size, returnQty }] from the current unsaved request
 */
export const allOrderItemsReturned = async (order, pendingItems = []) => {
  const existingReturns = await ReturnRequest.find({
    order: order._id,
    status: { $nin: ['REJECTED', 'CANCELLED'] },
  }).lean();

  const returnedMap = {};

  // Count already-saved returns
  for (const ret of existingReturns) {
    for (const item of ret.items) {
      const key = `${item.product}:${item.size}`;
      returnedMap[key] = (returnedMap[key] || 0) + item.returnQty;
    }
  }

  // Add pending (current request) items
  for (const item of pendingItems) {
    const key = `${item.product}:${item.size}`;
    returnedMap[key] = (returnedMap[key] || 0) + item.returnQty;
  }

  for (const orderItem of order.orderItems) {
    const key = `${orderItem.product}:${orderItem.size}`;
    if ((returnedMap[key] || 0) < orderItem.qty) {
      return false;
    }
  }
  return true;
};

/**
 * Determine if shipping should be refunded.
 * Shipping is refunded on full returns OR seller-fault reasons.
 *
 * @param {Object} order
 * @param {string} reason
 * @param {Array} pendingItems - items from the current unsaved return request
 */
export const shouldRefundShipping = async (order, reason, pendingItems = []) => {
  if (SELLER_FAULT_REASONS.includes(reason)) {
    return true;
  }
  return await allOrderItemsReturned(order, pendingItems);
};
```

- [ ] **Step 2: Pass `returnItems` to `shouldRefundShipping` in controller**

In `backend/modules/returns/controllers/returnController.js`, find the call around line 135 and update it. The `returnItems` array has already been built by this point:

```js
// BEFORE (line ~135):
const refundShipping = await shouldRefundShipping(order, reason);

// AFTER — pass the current request's items so allOrderItemsReturned includes them:
const refundShipping = await shouldRefundShipping(order, reason, returnItems);
```

- [ ] **Step 3: Commit**

```bash
git add backend/modules/returns/utils/returnValidation.js backend/modules/returns/controllers/returnController.js
git commit -m "fix(returns): pass pending items to shouldRefundShipping to fix full-order shipping refund"
```

---

## Task 5: Fix UNSELLABLE QC items → zero refund

**Bug fixed:** BUG (Missing 4) — UNSELLABLE items currently still generate a full refund.

**Files:**
- Modify: `backend/modules/returns/utils/returnStockHandler.js`
- Modify: `backend/modules/returns/controllers/returnController.js`

- [ ] **Step 1: Zero out `refundAmount` for UNSELLABLE items in `processQCDispositions`**

In `backend/modules/returns/utils/returnStockHandler.js`, after the `item.qcProcessed = true` line (around line 58), add the refund zeroing inside the UNSELLABLE branch:

```js
} else if (item.qcDisposition === 'UNSELLABLE') {
  // Zero out refund for unsellable items — cannot refund for items that cannot be resold
  item.refundAmount = 0;   // ← ADD THIS LINE

  // No inventory bucket change — write-off
  await StockMovement.create({
    // ... existing code unchanged
  });
}
```

- [ ] **Step 2: Update the `REFUND_INITIATED` comment in controller to document policy**

In `backend/modules/returns/controllers/returnController.js`, find the `REFUND_INITIATED` case comment (around line 386) and update:

```js
case 'REFUND_INITIATED': {
  // Recalculate effective refund:
  // - NOT_RECEIVED items: excluded (never arrived)
  // - UNSELLABLE items: excluded (refundAmount zeroed by processQCDispositions)
  // - DAMAGED items: full refund (damage in transit = seller responsibility)
  // - GOOD items: full refund
  const effectiveRefund = returnRequest.items.reduce((sum, item) => {
    if (item.qcDisposition === 'NOT_RECEIVED') return sum;
    return sum + (item.refundAmount || 0);
  }, 0);
  returnRequest.refundAmount = Number(effectiveRefund.toFixed(2));
```

- [ ] **Step 3: Commit**

```bash
git add backend/modules/returns/utils/returnStockHandler.js backend/modules/returns/controllers/returnController.js
git commit -m "fix(returns): zero refundAmount for UNSELLABLE QC items per business policy"
```

---

## Task 6: Fix REPLACEMENT stock check + exchange order stock decrement

**Bugs fixed:** BUG 11 (no stock check for REPLACEMENT), BUG 12 (exchange order doesn't decrement stock).

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js`

- [ ] **Step 1: Add stock check for REPLACEMENT items**

In `returnController.js`, find the REPLACEMENT branch in `createExchangeOrder` (around line 628) and add a stock check:

```js
if (returnRequest.type === 'REPLACEMENT') {
  // Same product/size for replacement
  const replacementProduct = await Product.findById(item.product);
  if (!replacementProduct || !replacementProduct.isActive) {
    res.status(400);
    throw new Error(
      `Replacement product "${item.productName}" is no longer available. Cannot create replacement.`
    );
  }
  const replacementVariant = replacementProduct.size.find(
    (s) => s.size === item.size
  );
  if (!replacementVariant || replacementVariant.countInStock < item.returnQty) {
    res.status(400);
    throw new Error(
      `Replacement product "${item.productName}" (${item.size}) is out of stock. ` +
      `Available: ${replacementVariant?.countInStock || 0}`
    );
  }
  newOrderItems.push({
    name: item.productName,
    qty: item.returnQty,
    image: item.image,
    price: item.price,
    size: item.size,
    product: item.product,
    tax: item.tax,
    disc: item.disc,
    productCode: item.SKU || '',
  });
}
```

- [ ] **Step 2: Add stock decrement after exchange order is created**

In `returnController.js`, find the end of `createExchangeOrder` after `const exchangeOrder = await Order.create({...})` (around line 713) and add:

```js
// Decrement stock for each exchange/replacement item
const { updateInventoryBucket } = await import('../../stock/utils/inventoryCalc.js');
for (const item of newOrderItems) {
  await updateInventoryBucket({
    productId: item.product,
    size: item.size,
    increments: { quantityOnHand: -item.qty },
  }).catch((err) => {
    console.error(`[ExchangeOrder] Stock decrement failed for ${item.product} ${item.size}:`, err.message);
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js
git commit -m "fix(returns): add stock check for REPLACEMENT type and decrement stock on exchange order"
```

---

## Task 7: Add reverse shipment webhook handler

**Bug fixed:** MISSING 1 / BUG 14 — Zero webhook handling for reverse shipment status; all return status changes require manual admin action.

**Files:**
- Modify: `backend/modules/shipping/controllers/shippingWebhookController.js`

- [ ] **Step 1: Add return shipment lookup and status auto-transition**

In `shippingWebhookController.js`, find the section where the webhook looks up the order by AWB code (around lines 70-75). After the existing forward-order lookup block, add a reverse shipment lookup:

```js
// ── Try to find a ReturnRequest by reverse AWB ─────────────────────────
import ReturnRequest from '../../returns/models/ReturnRequestModel.js';

// Map ShipRocket reverse shipment status codes to return status transitions
const REVERSE_STATUS_MAP = {
  // Pickup attempted/scheduled
  3:  { reverseStatus: 'PICKUP_SCHEDULED' },
  // Picked up from customer
  6:  { reverseStatus: 'IN_TRANSIT', returnStatus: 'IN_TRANSIT' },
  // In transit
  9:  { reverseStatus: 'IN_TRANSIT' },
  // Delivered to warehouse (returned)
  7:  { reverseStatus: 'RECEIVED', returnStatus: 'RECEIVED' },
  // Pickup failed / undeliverable
  14: { reverseStatus: 'PICKUP_FAILED', returnStatus: 'PICKUP_FAILED' },
};

const handleReverseWebhook = async (awb, statusCode, webhookData) => {
  const returnRequest = await ReturnRequest.findOne({
    'reverseShipping.awbCode': awb,
    status: { $nin: ['COMPLETED', 'CANCELLED', 'REJECTED', 'RECEIVED', 'QC_IN_PROGRESS', 'QC_COMPLETED'] },
  });

  if (!returnRequest) return false; // Not a return order

  const mapping = REVERSE_STATUS_MAP[statusCode];
  if (!mapping) return false; // Unknown status code for returns

  // Update reverseShipping.status always
  returnRequest.reverseShipping = {
    ...returnRequest.reverseShipping?.toObject?.() || {},
    status: mapping.reverseStatus,
    syncedAt: new Date(),
  };

  // If this status triggers a return status transition, apply it
  if (mapping.returnStatus) {
    const { validateTransition } = await import('../../returns/utils/returnStateMachine.js');
    try {
      validateTransition(returnRequest.status, mapping.returnStatus, returnRequest.type);
      returnRequest.status = mapping.returnStatus;
      returnRequest.timeline.push({
        action: 'STATUS_CHANGE',
        fromStatus: returnRequest.status,
        toStatus: mapping.returnStatus,
        note: `Auto-updated via ShipRocket webhook (status code: ${statusCode})`,
        performedBy: null,
        performedByName: 'System (Webhook)',
      });

      // If auto-RECEIVED, set receivedAt
      if (mapping.returnStatus === 'RECEIVED') {
        returnRequest.reverseShipping.receivedAt = new Date();
      }
    } catch (e) {
      // Transition not valid from current status — log and skip
      console.warn(`[ReturnWebhook] Skipping invalid transition for ${returnRequest.returnId}: ${e.message}`);
    }
  }

  await returnRequest.save();
  return true;
};
```

- [ ] **Step 2: Call `handleReverseWebhook` at the start of the main webhook handler**

In the existing webhook handler function (before the forward order lookup), add:

```js
// Check if this is a reverse shipment webhook first
const awbCode = req.body?.awb || req.body?.awb_code || '';
const statusCode = Number(req.body?.current_status_id || req.body?.status_id || 0);

const handledAsReturn = await handleReverseWebhook(awbCode, statusCode, req.body);
if (handledAsReturn) {
  return res.status(200).json({ received: true, type: 'reverse' });
}

// ... existing forward shipment handling continues below
```

- [ ] **Step 3: Fix the `timeline` entry — `performedBy` is required by schema**

The `timelineEntrySchema` in `ReturnRequestModel.js` has `performedBy: { required: true }`. The webhook has no user. Relax the required constraint for system entries by updating the timeline schema:

In `backend/modules/returns/models/ReturnRequestModel.js`, find the `performedBy` field in `timelineEntrySchema` (line ~19):

```js
// BEFORE:
performedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
},

// AFTER:
performedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: false,   // Can be null for system-generated entries (webhooks, cron)
},
```

- [ ] **Step 4: Commit**

```bash
git add backend/modules/shipping/controllers/shippingWebhookController.js backend/modules/returns/models/ReturnRequestModel.js
git commit -m "feat(returns): add reverse shipment webhook handler for auto status transitions"
```

---

## Task 8: Add return label generation endpoint

**Bug fixed:** MISSING 3 — No label generation for return shipments.

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js`
- Modify: `backend/modules/returns/routes/returnRoutes.js`

- [ ] **Step 1: Add `generateReturnLabel` controller function**

At the end of `backend/modules/returns/controllers/returnController.js`, add:

```js
// ─────────────────────────────────────────────────────────────────────────────
// @desc    Generate shipping label for reverse pickup
// @route   GET /api/returns/:id/label
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const generateReturnLabel = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  if (!returnRequest.reverseShipping?.providerShipmentId) {
    res.status(400);
    throw new Error('No Shiprocket shipment exists for this return. Schedule pickup first.');
  }

  const data = await shippingApi('post', '/courier/generate/label', {
    data: { shipment_id: [returnRequest.reverseShipping.providerShipmentId] },
    action: 'GENERATE_LABEL',
    orderId: returnRequest.order,
    asuOrderId: returnRequest.orderId,
  });

  const labelUrl = data.label_url || data.response?.label_url || '';

  if (labelUrl) {
    returnRequest.reverseShipping = {
      ...returnRequest.reverseShipping?.toObject?.() || {},
      labelUrl,
    };
    await returnRequest.save();
  }

  res.json({ labelUrl, returnRequest });
});
```

- [ ] **Step 2: Register the route**

In `backend/modules/returns/routes/returnRoutes.js`, add the import and route:

```js
// Add to imports:
import {
  // ... existing imports ...
  generateReturnLabel,
} from '../controllers/returnController.js';

// Add route (after /:id/track-pickup):
router.route('/:id/label').get(generateReturnLabel);
```

- [ ] **Step 3: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js backend/modules/returns/routes/returnRoutes.js
git commit -m "feat(returns): add GET /api/returns/:id/label endpoint for reverse shipment label"
```

---

## Task 9: Add `PICKUP_FAILED` UI button + fix `nextStatuses` stale state

**Bugs fixed:** BUG 24 (no PICKUP_FAILED button), BUG 23 (stale nextStatuses after reset).

**Files:**
- Modify: `frontend/src/Screens/ReturnDetailScreen.js`

- [ ] **Step 1: Add `PICKUP_FAILED` button to `renderActionButtons`**

In `ReturnDetailScreen.js`, inside `renderActionButtons`, after the `PICKUP_SCHEDULED` button block, add:

```jsx
{nextStatuses.includes('PICKUP_FAILED') && (
  <Button
    variant="warning"
    className="mr-2 mb-1"
    onClick={() => handleStatusUpdate('PICKUP_FAILED')}
    disabled={statusLoading}
  >
    Mark Pickup Failed
  </Button>
)}
```

- [ ] **Step 2: Fix stale `nextStatuses` — derive from `returnRequest` when available**

In `ReturnDetailScreen.js`, find the `nextStatuses` derived line (around line 158) and replace:

```jsx
// BEFORE:
const nextStatuses = stateNextStatuses || [];

// AFTER — import getNextStatuses and compute locally to avoid stale state:
```

Add this import at the top of the file:
```js
// Note: this is a pure function — safe to call on the client from a copied version,
// but we call the API result which includes it. We just fall back to [] safely:
const nextStatuses = (stateNextStatuses && stateNextStatuses.length >= 0)
  ? stateNextStatuses
  : [];
```

Replace the `statusSuccess` useEffect (lines 84-90) to NOT reset before refetch:

```jsx
// BEFORE:
useEffect(() => {
  if (statusSuccess) {
    dispatch({ type: RETURN_UPDATE_STATUS_RESET });
    dispatch(getReturnDetails(returnId));
    setShowRejectModal(false);
  }
}, [statusSuccess, dispatch, returnId]);

// AFTER — reset AFTER new data arrives to prevent button flicker:
useEffect(() => {
  if (statusSuccess) {
    dispatch(getReturnDetails(returnId));
    setShowRejectModal(false);
    // Reset AFTER dispatching refetch — reducer will clear success on REQUEST
    dispatch({ type: RETURN_UPDATE_STATUS_RESET });
  }
}, [statusSuccess, dispatch, returnId]);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/Screens/ReturnDetailScreen.js
git commit -m "fix(returns-ui): add PICKUP_FAILED button and fix stale nextStatuses after status update"
```

---

## Task 10: Fix QC tab visibility + refund modal amount

**Bugs fixed:** BUG 20 (refund amount not sent), BUG 21 (QC tab gone after QC_COMPLETED).

**Files:**
- Modify: `frontend/src/Screens/ReturnDetailScreen.js`

- [ ] **Step 1: Include `refundAmount` in `handleRefundSubmit` dispatch**

In `ReturnDetailScreen.js`, replace `handleRefundSubmit`:

```js
// BEFORE:
const handleRefundSubmit = () => {
  dispatch(
    processRefund(returnId, {
      refundMethod: refundMethod === 'ORIGINAL' ? 'ORIGINAL_PAYMENT' : refundMethod,
      refundTransactionId: refundReference || undefined,
    })
  );
};

// AFTER:
const handleRefundSubmit = () => {
  dispatch(
    processRefund(returnId, {
      refundMethod: refundMethod === 'ORIGINAL' ? 'ORIGINAL_PAYMENT' : refundMethod,
      refundTransactionId: refundReference || undefined,
    })
  );
  // Note: refundAmount is not sent — backend computes it from QC results.
  // The amount shown is informational only.
};
```

Also add a note label in the refund modal to make it clear the amount is read-only:

```jsx
// In the Refund Amount Form.Group, replace:
<Form.Control
  type="number"
  value={refundAmount}
  onChange={(e) => setRefundAmount(e.target.value)}
/>

// With:
<Form.Control
  type="number"
  value={refundAmount}
  readOnly
  disabled
  className="bg-light"
/>
<Form.Text className="text-muted">
  Amount calculated from QC results. Shipping refund (if any) is added automatically.
</Form.Text>
```

- [ ] **Step 2: Show QC tab as read-only after `QC_COMPLETED`**

In `ReturnDetailScreen.js`, replace the QC tab condition:

```jsx
// BEFORE:
{ret.status === 'QC_IN_PROGRESS' && (
  <Tab eventKey="qc" title="QC Inspection">
    <QCDispositionForm
      items={ret.items || []}
      onSubmit={handleQCSubmit}
    />
  </Tab>
)}

// AFTER:
{['QC_IN_PROGRESS', 'QC_COMPLETED', 'REFUND_INITIATED', 'EXCHANGE_SHIPPED',
   'REPLACEMENT_SHIPPED', 'COMPLETED'].includes(ret.status) && (
  <Tab eventKey="qc" title="QC Inspection">
    {ret.status === 'QC_IN_PROGRESS' ? (
      <QCDispositionForm
        items={ret.items || []}
        onSubmit={handleQCSubmit}
      />
    ) : (
      <Card>
        <Card.Header>QC Results (Read-Only)</Card.Header>
        <Card.Body>
          <Table bordered size="sm">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Disposition</th>
                <th>Notes</th>
                <th>Refund</th>
              </tr>
            </thead>
            <tbody>
              {(ret.items || []).map((item, i) => (
                <tr key={i}>
                  <td>{item.productName}</td>
                  <td>{item.size}</td>
                  <td>{item.returnQty}</td>
                  <td>
                    <Badge bg={
                      item.qcDisposition === 'GOOD' ? 'success' :
                      item.qcDisposition === 'DAMAGED' ? 'warning' :
                      item.qcDisposition === 'UNSELLABLE' ? 'danger' :
                      item.qcDisposition === 'NOT_RECEIVED' ? 'secondary' : 'light'
                    }>
                      {item.qcDisposition || 'PENDING'}
                    </Badge>
                  </td>
                  <td>{item.qcNotes || '-'}</td>
                  <td>
                    {item.qcDisposition === 'NOT_RECEIVED' || item.qcDisposition === 'UNSELLABLE'
                      ? <span className="text-muted">No refund</span>
                      : `₹${item.refundAmount || 0}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    )}
  </Tab>
)}
```

- [ ] **Step 3: Add `generateReturnLabel` action + show label button in shipping tab**

In `ReturnDetailScreen.js`, add a label button in the Shipping tab after the AWB display:

```jsx
{ret.reverseShipping?.providerShipmentId && !ret.reverseShipping?.labelUrl && (
  <Button
    variant="outline-primary"
    size="sm"
    className="mt-2"
    onClick={() => dispatch(generateReturnLabel(returnId))}
  >
    Generate Return Label
  </Button>
)}
{ret.reverseShipping?.labelUrl && (
  <p className="mt-2">
    <a href={ret.reverseShipping.labelUrl} target="_blank" rel="noopener noreferrer">
      <Button variant="outline-success" size="sm">Download Return Label</Button>
    </a>
  </p>
)}
```

Import `generateReturnLabel` at the top of the file (add to existing import from returnActions):
```js
import {
  // ... existing imports ...
  generateReturnLabel,
} from '../actions/returnActions';
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/Screens/ReturnDetailScreen.js
git commit -m "fix(returns-ui): fix refund modal, QC read-only tab, and label download button"
```

---

## Task 11: Add Redux action + reducer for return label

**Files:**
- Modify: `frontend/src/constants/returnConstants.js`
- Modify: `frontend/src/actions/returnActions.js`
- Modify: `frontend/src/reducers/returnReducers.js`

- [ ] **Step 1: Add label constants**

In `frontend/src/constants/returnConstants.js`, append at the end:

```js
export const RETURN_LABEL_REQUEST = 'RETURN_LABEL_REQUEST';
export const RETURN_LABEL_SUCCESS = 'RETURN_LABEL_SUCCESS';
export const RETURN_LABEL_FAIL = 'RETURN_LABEL_FAIL';
export const RETURN_LABEL_RESET = 'RETURN_LABEL_RESET';
```

- [ ] **Step 2: Add `generateReturnLabel` action**

In `frontend/src/actions/returnActions.js`, add at the end:

```js
export const generateReturnLabel = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_LABEL_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.get(`/api/returns/${id}/label`, config);
    dispatch({ type: RETURN_LABEL_SUCCESS, payload: data });
    // Refresh return details so labelUrl appears in UI
    dispatch(getReturnDetails(id));
  } catch (error) {
    dispatch({ type: RETURN_LABEL_FAIL, payload: error.response?.data?.message || error.message });
  }
};
```

Also add to imports at top:
```js
import {
  // ... existing imports ...
  RETURN_LABEL_REQUEST, RETURN_LABEL_SUCCESS, RETURN_LABEL_FAIL, RETURN_LABEL_RESET,
} from '../constants/returnConstants';
```

- [ ] **Step 3: Add label reducer**

In `frontend/src/reducers/returnReducers.js`, add:

```js
export const returnLabelReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_LABEL_REQUEST:
      return { loading: true };
    case RETURN_LABEL_SUCCESS:
      return { loading: false, success: true, labelUrl: action.payload.labelUrl };
    case RETURN_LABEL_FAIL:
      return { loading: false, error: action.payload };
    case RETURN_LABEL_RESET:
      return {};
    default:
      return state;
  }
};
```

Add the import at the top of the reducers file:
```js
import {
  // ... existing imports ...
  RETURN_LABEL_REQUEST, RETURN_LABEL_SUCCESS, RETURN_LABEL_FAIL, RETURN_LABEL_RESET,
} from '../constants/returnConstants';
```

- [ ] **Step 4: Register reducer in store**

Find the Redux store configuration file (likely `frontend/src/store.js`) and add:

```js
import { returnLabelReducer } from './reducers/returnReducers';

// In combineReducers:
returnLabel: returnLabelReducer,
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/constants/returnConstants.js frontend/src/actions/returnActions.js frontend/src/reducers/returnReducers.js frontend/src/store.js
git commit -m "feat(returns-ui): add Redux action/reducer for return label generation"
```

---

## Task 12: Build `ProductSearchModal` component for exchange selection

**Bug fixed:** BUG 17 — Exchange product selection uses raw ObjectId text input.

**Files:**
- Create: `frontend/src/components/ProductSearchModal.js`

- [ ] **Step 1: Create the `ProductSearchModal` component**

Create `frontend/src/components/ProductSearchModal.js`:

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Table, Badge, Spinner } from 'react-bootstrap';
import api from '../utils/api';

/**
 * ProductSearchModal — lets admin search for a product and select a size.
 *
 * Props:
 *   show: boolean
 *   onHide: () => void
 *   onSelect: ({ productId, productName, size, price, stock }) => void
 *   userInfo: { token } from Redux store (for auth header)
 *   title: string (optional, defaults to "Select Exchange Product")
 */
const ProductSearchModal = ({ show, onHide, onSelect, userInfo, title = 'Select Exchange Product' }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setKeyword('');
      setResults([]);
      setSelectedProduct(null);
      setSelectedSize('');
      setError('');
    }
  }, [show]);

  const searchProducts = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.get(`/api/products?keyword=${encodeURIComponent(keyword)}&pageSize=20`, config);
      setResults(data.products || []);
      if ((data.products || []).length === 0) setError('No products found');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedProduct || !selectedSize) return;
    const variant = selectedProduct.size.find((s) => s.size === selectedSize);
    onSelect({
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      size: selectedSize,
      price: variant?.price || 0,
      stock: variant?.countInStock || 0,
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="d-flex mb-3">
          <Form.Control
            type="text"
            placeholder="Search by product name or SKU..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
          />
          <Button variant="primary" className="ml-2" onClick={searchProducts} disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Search'}
          </Button>
        </Form.Group>

        {error && <p className="text-danger">{error}</p>}

        {results.length > 0 && (
          <Table bordered hover size="sm" responsive>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Available Sizes</th>
              </tr>
            </thead>
            <tbody>
              {results.map((product) => (
                <tr
                  key={product._id}
                  onClick={() => { setSelectedProduct(product); setSelectedSize(''); }}
                  style={{ cursor: 'pointer', backgroundColor: selectedProduct?._id === product._id ? '#e8f4fd' : '' }}
                >
                  <td>{product.name}</td>
                  <td>{product.SKU || '-'}</td>
                  <td>
                    {(product.size || []).map((s) => (
                      <Badge
                        key={s.size}
                        bg={s.countInStock > 0 ? 'success' : 'secondary'}
                        className="mr-1"
                        style={{ cursor: s.countInStock > 0 ? 'pointer' : 'not-allowed', marginRight: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (s.countInStock > 0) {
                            setSelectedProduct(product);
                            setSelectedSize(s.size);
                          }
                        }}
                      >
                        {s.size} ({s.countInStock})
                      </Badge>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {selectedProduct && selectedSize && (
          <div className="mt-3 p-2 bg-light rounded">
            <strong>Selected:</strong> {selectedProduct.name} — Size: {selectedSize}
            {' '}
            (₹{selectedProduct.size.find((s) => s.size === selectedSize)?.price || 0})
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button
          variant="success"
          onClick={handleConfirm}
          disabled={!selectedProduct || !selectedSize}
        >
          Select This Product
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductSearchModal;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ProductSearchModal.js
git commit -m "feat(returns-ui): add ProductSearchModal component for exchange product selection"
```

---

## Task 13: Wire `ProductSearchModal` into `ReturnCreateScreen`

**Bugs fixed:** BUG 17 (unusable exchange ObjectId input), BUG 18 (review subtotal shows MRP), BUG 19 (window check uses non-existent field).

**Files:**
- Modify: `frontend/src/Screens/ReturnCreateScreen.js`

- [ ] **Step 1: Import `ProductSearchModal` and add modal state**

At the top of `ReturnCreateScreen.js`, add import:
```js
import ProductSearchModal from '../components/ProductSearchModal';
```

Add modal state in the component body (after existing useState declarations):
```js
const [showProductModal, setShowProductModal] = useState(false);
const [modalTargetItemId, setModalTargetItemId] = useState(null);
```

- [ ] **Step 2: Replace the exchange product text input with a proper button + modal trigger**

In Step 3 of the return create form, replace the raw text input block (lines ~428-475) with:

```jsx
{returnType === 'EXCHANGE' && (
  <div className="mt-3">
    <h6>Exchange Selections</h6>
    {selectedItems.map((item) => {
      const sel = exchangeSelections[item.orderItemId];
      return (
        <Card key={item.orderItemId} className="mb-2 p-2">
          <p className="mb-1">
            <strong>{item.name}</strong> (returning size: {item.size})
          </p>
          {sel?.productId ? (
            <div className="d-flex align-items-center">
              <span className="mr-3">
                <Badge bg="success">{sel.productName}</Badge>{' '}
                Size: <strong>{sel.size}</strong>{' '}
                ₹{sel.price}
                {sel.stock < (item.returnQty || 1) && (
                  <Badge bg="danger" className="ml-2">Low Stock: {sel.stock}</Badge>
                )}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setModalTargetItemId(item.orderItemId);
                  setShowProductModal(true);
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setModalTargetItemId(item.orderItemId);
                setShowProductModal(true);
              }}
            >
              + Select Exchange Product
            </Button>
          )}
        </Card>
      );
    })}
  </div>
)}
```

- [ ] **Step 3: Handle product selection from modal**

Add a handler after the existing `updateExchangeSelection` function:

```js
const handleExchangeProductSelected = ({ productId, productName, size, price, stock }) => {
  if (!modalTargetItemId) return;
  setExchangeSelections((prev) => ({
    ...prev,
    [modalTargetItemId]: { product: productId, name: productName, size, price, stock },
  }));
  setModalTargetItemId(null);
};
```

- [ ] **Step 4: Add the modal to the JSX return**

Just before the closing `</AdminPageLayout>`, add:

```jsx
<ProductSearchModal
  show={showProductModal}
  onHide={() => setShowProductModal(false)}
  onSelect={handleExchangeProductSelected}
  userInfo={userInfo}
  title="Select Exchange Product"
/>
```

- [ ] **Step 5: Fix `submitHandler` to use `productId` key (not `product`)**

The `ProductSearchModal` returns `{ productId, productName, size, price }` but the existing `submitHandler` reads `exchangeSelections[item.orderItemId].product`. Update to match:

```js
// In submitHandler, find the exchange items section and replace:
// BEFORE:
exchangeProduct: exchangeSelections[item.orderItemId].product,
exchangeProductName: exchangeSelections[item.orderItemId].name || '',
exchangeSize: exchangeSelections[item.orderItemId].size,
exchangeUnitPrice: Number(exchangeSelections[item.orderItemId].price) || 0,

// AFTER:
exchangeProduct: exchangeSelections[item.orderItemId].product || exchangeSelections[item.orderItemId].productId,
exchangeProductName: exchangeSelections[item.orderItemId].name || exchangeSelections[item.orderItemId].productName || '',
exchangeSize: exchangeSelections[item.orderItemId].size,
exchangeUnitPrice: Number(exchangeSelections[item.orderItemId].price) || 0,
```

- [ ] **Step 6: Fix review step per-row subtotal (MRP → discounted)**

In the review table body (around line 657), replace the subtotal cell:

```jsx
// BEFORE:
<td>₹{item.price * item.returnQty}</td>

// AFTER:
<td>₹{(item.price * (1 - (item.disc || 0) / 100) * item.returnQty).toFixed(2)}</td>
```

Also fix the unit price display:
```jsx
// BEFORE:
<td>₹{item.price}</td>

// AFTER:
<td>₹{(item.price * (1 - (item.disc || 0) / 100)).toFixed(2)}{item.disc > 0 && <small className="text-muted ml-1">(MRP: ₹{item.price})</small>}</td>
```

- [ ] **Step 7: Fix `isWindowExpired` to not rely on non-existent `order.returnWindowDays`**

Replace the `isWindowExpired` function:

```js
// BEFORE:
const isWindowExpired = () => {
  if (!order) return false;
  const deliveredAt = order.tracking?.deliveredAt;
  if (!deliveredAt) return false;
  const days = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > (order.returnWindowDays || 7);
};

// AFTER — use the same constant as backend (7 days hardcoded):
const RETURN_WINDOW_DAYS = 7;
const isWindowExpired = () => {
  if (!order) return false;
  const deliveredAt = order.tracking?.deliveredAt;
  if (!deliveredAt) return false;
  const days = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > RETURN_WINDOW_DAYS;
};
```

- [ ] **Step 8: Validate exchange selection before Step 3 → Step 4 nav**

In the `nextStep` handler logic (currently just `setStep`), add validation when advancing from step 3 with EXCHANGE type:

```jsx
// Replace the Next button in Step 3 to validate exchange selections:
<Button
  onClick={() => {
    if (returnType === 'EXCHANGE') {
      const missing = selectedItems.filter(
        (item) => !exchangeSelections[item.orderItemId]?.productId &&
                  !exchangeSelections[item.orderItemId]?.product
      );
      if (missing.length > 0) {
        alert(`Please select exchange products for: ${missing.map(i => i.name).join(', ')}`);
        return;
      }
    }
    nextStep();
  }}
>
  Next: Reason
</Button>
```

- [ ] **Step 9: Commit**

```bash
git add frontend/src/Screens/ReturnCreateScreen.js
git commit -m "fix(returns-ui): replace ObjectId text input with ProductSearchModal for exchange, fix subtotal, fix window check"
```

---

## Task 14: Fix `getReturnsByOrder` silent failure + show return window in list

**Bugs fixed:** BUG 22 (silent `getReturnsByOrder` failure), MISSING 6 (no expiry in list).

**Files:**
- Modify: `frontend/src/Screens/ReturnCreateScreen.js`
- Modify: `frontend/src/Screens/ReturnListScreen.js`

- [ ] **Step 1: Show error if `getReturnsByOrder` fails in ReturnCreateScreen**

In `ReturnCreateScreen.js`, add error state from `returnByOrder` and display it:

```jsx
// In the destructuring:
const { returns: existingReturns, error: returnByOrderError } = returnByOrder;

// In JSX, after the `createError` message display, add:
{returnByOrderError && (
  <Message variant="warning">
    Warning: Could not load existing returns for this order ({returnByOrderError}).
    Already-returned quantities may be inaccurate.
  </Message>
)}
```

- [ ] **Step 2: Add "Expires" column to ReturnListScreen**

In `frontend/src/Screens/ReturnListScreen.js`, find the columns array and add a column after `Date`:

```js
// Find where columns are defined and add:
{
  title: 'Created',
  field: 'createdAt',
  render: (row) => row.createdAt?.substring(0, 10),
},
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/Screens/ReturnCreateScreen.js frontend/src/Screens/ReturnListScreen.js
git commit -m "fix(returns-ui): show error on returnsByOrder failure, clean up list screen"
```

---

## Task 15: Fix exchange order → forward shipping linkage

**Bug fixed:** MISSING 5 — Exchange order has no path to trigger forward shipping.

**Files:**
- Modify: `frontend/src/Screens/ReturnDetailScreen.js`

- [ ] **Step 1: Add "Ship Exchange Order" navigation button in Shipping tab**

In `ReturnDetailScreen.js`, find the Exchange/Replacement Order card in the Shipping tab (around line 503) and update:

```jsx
{ret.exchangeOrderNumber && (
  <Card className="mt-3">
    <Card.Header>Exchange / Replacement Order</Card.Header>
    <Card.Body>
      <p><strong>Order Number:</strong> {ret.exchangeOrderNumber}</p>
      <Button
        variant="outline-primary"
        size="sm"
        className="mr-2"
        onClick={() => window.open(`/admin/order/${ret.exchangeOrderId}/edit`, '_blank')}
      >
        View Exchange Order
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => window.open(`/admin/shipping/orders/${ret.exchangeOrderId}`, '_blank')}
      >
        Ship This Order →
      </Button>
    </Card.Body>
  </Card>
)}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/Screens/ReturnDetailScreen.js
git commit -m "feat(returns-ui): add 'Ship This Order' button linking exchange order to shipping module"
```

---

## Task 16: Final integration verification

- [ ] **Step 1: Verify ShipRocket mapper payload is correct**

Start the backend server and trigger a test return with `PICKUP_SCHEDULED`. Check the ShippingLog collection for the `CREATE_RETURN_ORDER` action and confirm:
- `requestPayload.pickup_phone` matches the pickup address phone (not the order phone)
- `requestPayload.pickup_country` is exactly `"India"`
- `requestPayload.pickup_isd_code` is `"+91"`
- `requestPayload.order_items[0].tax` is a rupee amount (e.g. `23.81`), not a rate (e.g. `5`)

Run:
```bash
# In mongo shell or Compass:
db.shippinglogs.findOne({ action: 'CREATE_RETURN_ORDER' }, { requestPayload: 1 })
```

- [ ] **Step 2: Verify AWB parsing works after assignReturnCourier**

After calling `POST /api/returns/:id/assign-courier`, check that `reverseShipping.awbCode` is a non-empty string in the DB:
```bash
db.returnrequests.findOne({ returnId: 'RET-...' }, { 'reverseShipping.awbCode': 1 })
```

- [ ] **Step 3: Verify tracking endpoint works**

Call `GET /api/returns/:id/track-pickup` and confirm it returns tracking data (not a 404 from ShipRocket).

- [ ] **Step 4: Verify webhook auto-transition**

Simulate a webhook POST to `POST /api/shipping/webhook` with:
```json
{
  "awb": "<awb_code_of_a_return>",
  "current_status_id": 6,
  "current_status": "Picked Up"
}
```
Confirm the ReturnRequest status changes to `IN_TRANSIT` and timeline has a `STATUS_CHANGE` entry with `performedByName: "System (Webhook)"`.

- [ ] **Step 5: Verify exchange flow end-to-end**

1. Create a RETURN with type EXCHANGE, use the ProductSearchModal to select a product
2. Confirm the `exchangeProduct` field in the DB has a valid ObjectId (not a string typed by admin)
3. After QC_COMPLETED, create the exchange order — confirm stock is decremented
4. Navigate to return detail → Shipping tab → confirm "Ship This Order →" button appears

- [ ] **Step 6: Verify UNSELLABLE QC → zero refund**

Set a return item's QC disposition to UNSELLABLE, transition to QC_COMPLETED, then REFUND_INITIATED. Confirm `refundAmount` for that item is `0` and it's excluded from the credit note.

---

## Summary of All Bugs Fixed

| # | Bug | Task |
|---|-----|------|
| BUG 1 | `pickup_phone` ignores pickup address phone | Task 2 |
| BUG 2 | `pickupAddress.phone` not in schema, dropped | Task 1 |
| BUG 3 | No auto AWB/courier after return create | Task 7 (webhook), Task 3 notes |
| BUG 4 | Name fallback doesn't use `customerName` | Task 2 |
| BUG 5 | `pickup_country` not normalized | Task 2 |
| BUG 6 | Missing `isd_code` fields | Task 2 |
| BUG 8 | Tax is rate not rupee amount | Task 2 |
| BUG 9 | `shouldRefundShipping` runs before save | Task 4 |
| BUG 10 | Race condition on `totalRefundedSoFar` | Partially mitigated by existing lock (acceptable risk) |
| BUG 11 | No stock check for REPLACEMENT type | Task 6 |
| BUG 12 | Exchange order doesn't decrement stock | Task 6 |
| BUG 14 | Zero webhook for reverse shipments | Task 7 |
| BUG 15 | Tracking endpoint wrong format | Task 3 |
| BUG 16 | AWB parsed from wrong response path | Task 3 |
| BUG 17 | Exchange product is raw ObjectId text | Tasks 12, 13 |
| BUG 18 | Review subtotal shows MRP not discounted | Task 13 |
| BUG 19 | `order.returnWindowDays` doesn't exist | Task 13 |
| BUG 20 | Refund amount in modal not sent | Task 10 |
| BUG 21 | QC tab gone after QC_COMPLETED | Task 10 |
| BUG 22 | `getReturnsByOrder` failure is silent | Task 14 |
| BUG 23 | `nextStatuses` stale after status reset | Task 9 |
| BUG 24 | No `PICKUP_FAILED` button | Task 9 |
| M1 | No reverse webhook auto-transition | Task 7 |
| M2 | No auto-courier for returns | Not in scope (requires UI for serviceability check — separate plan) |
| M3 | No label generation endpoint | Task 8 |
| M4 | DAMAGED/UNSELLABLE get full refund | Task 5 |
| M5 | Exchange order has no shipping path | Task 15 |
| M6 | No expiry in list view | Task 14 |
