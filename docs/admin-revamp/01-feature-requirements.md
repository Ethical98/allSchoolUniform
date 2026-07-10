# Admin Panel Revamp — Complete Feature & Requirements Inventory

> Phase 0 document: functional requirements only. Deliberately contains **no reference to the
> current UI implementation** (layouts, components, libraries). It captures *what the admin
> panel must do*, sourced from the current frontend behavior and the full backend capability
> surface, so the new UI can be designed from scratch against these requirements.

---

## 1. Scope & Context

- Business: school-uniform e-commerce ("All School Uniform") with a customer storefront and an admin panel sharing one Node/Express + MongoDB backend.
- Integrations the admin UI must operate: **Shiprocket** (forward + reverse shipping), **Razorpay** (payments/refunds), **Gmail API** (transactional emails), Redis (webhook/payment state, token cache).
- Currency/tax context: INR, Indian GST (CGST/SGST vs IGST, tax-inclusive MRP pricing, Indian financial-year document numbering).

---

## 2. Cross-Cutting Requirements (apply to every module)

### 2.1 Authentication & Access
- Admin login (email/password; backend also supports phone + OTP auth).
- Session validation, logout, forgot/reset password, change password.
- **Single role today**: `isAdmin` boolean gates every admin endpoint. No warehouse/finance/QC role separation exists server-side. (Any RBAC in the new UI is cosmetic unless backend adds roles — decide early whether RBAC is in revamp scope.)
- Unauthenticated → login; authenticated non-admin → rejected.

### 2.2 Standard list-page capabilities (needed across all modules)
- Server-side pagination, keyword search, per-module filters, sort.
- Row-level actions (view / edit / delete with confirmation).
- Deep links: every entity reachable by URL (used heavily for cross-module navigation and open-in-new-tab workflows).
- CSV export (today only Orders and Stock Valuation have it; make it a standard capability).
- Bulk actions (today: none anywhere — a known gap to decide on per module).

### 2.3 Media / image handling
- Upload images (png/jpg/jpeg) with progress; server auto-resizes (640×640) and slugifies filenames.
- Pick from previously uploaded images (paginated gallery, scoped per domain: products / schools / size-guides).
- Image URL can always be entered manually as an alternative to upload.
- Note: no true backend "media library" browse API exists (partially removed) — needed if a media manager is desired.

### 2.4 Documents & printing
- Current state: client-side PDF for order invoices + browser print-layout for billing documents (all 6 types); **no server-side PDF generation exists** despite `pdfUrl` fields on documents.
- **Revamp requirement:** one server-side PDF service renders the canonical copy of all 7 document types (order invoice + 6 billing types) — downloadable from the UI, attachable to emails, stored via `pdfUrl`. No PDF generation in the frontend. (Decision D6 in `04-phase0-decisions.md`.)
- Amount-in-words, round-off, GST breakup on all financial documents.

### 2.5 Audit & traceability
- Timestamped, user-attributed audit trails exist for: stock movements, return timelines, shipping API logs (`ShippingLog` with request/response payloads — currently no screen), quotation revision history, order call comments.

### 2.6 Known integrity/security issues to resolve during revamp
- `DELETE /api/classes/:id` and `GET /api/orders/report` are **unauthenticated** (missing `protect, isAdmin`).
- School update silently drops fields (email, website, description, city, state, country are collected but never persisted).
- Order status is dual-sourced: free-form `orderStatus` string vs canonical `tracking{}` booleans — reconcile.
- Two independent invoice-numbering systems: order-level counter vs billing-module FY-based counters (`QT/PI/INV/CB/CN/DN-<FY>-NNNNN`).
- Password for admin-created customers is hardcoded (`Asucustomer@123`).
- Free-shipping threshold (₹599, else ₹100) is hardcoded in the order editor.

---

## 3. Dashboard & Analytics

**Purpose:** Landing overview of business health with drill-downs.

- Period selector: today / 7 days / 30 days / 90 days / YTD / custom date range; refresh on demand.
- KPI cards with prior-period % change: total orders, revenue (excl. canceled), average order value, new users, pending orders, unpaid orders, low-stock items, active carts (updated in last 7 days — abandoned-cart signal).
- Trends: daily revenue (line), new user registrations, order-status distribution, top products by revenue (discount-aware, respects modified orders).
- Recent orders list (id, customer, total, status, paid, date) → order detail.
- Low-stock alerts list (product, size, current vs threshold) → stock module.
- Quick actions: adjust stock, create quotation, all orders, stock overview, billing reports.
- All KPI cards deep-link to their filtered module list.

---

## 4. Orders

**Purpose:** Full order lifecycle management — the hub entity every other module links to.

### 4.1 Order list
- Paginated list of all orders; keyword search; filter by status (Received / Confirmed / Processed / Out For Delivery / Delivered / Canceled).
- Columns/data: order id (`ASU`+date+sequence), customer name & phone, date, total, paid state (+paid time), city, payment method, derived status.
- CSV export (order id, status, name, phone, date, total, paid, location, payment method, concatenated items).
- Aggregate summary: total orders, revenue, pending-to-ship, units to ship, delivered, canceled, modified count.
- **Warehouse picking worklist**: orders in Received grouped product→size with aggregated quantities, per-size and per-product pick checkoff with progress tracking, per-order breakdown, modified-order flagging. (Currently UI-state only — decide whether pick state should persist server-side.)
- **Ready-to-ship worklist**: same grouping for Confirmed/Processing/Out-for-Delivery orders with per-size status badges.

### 4.2 Order detail / edit
- View customer info (name, email, phone read-only; link to edit user), payment method, paid/delivered indicators.
- Edit shipping address (address, city, state, postal code, country).
- **Item modification** (only while no invoice number exists):
  - Change line item size and quantity (bounded by stock).
  - Remove line items.
  - Add products via search (filter by school via typeahead; pick size + quantity, stock-bounded; multi-add).
  - Order stores both original `orderItems` and `modifiedItems` + `modified` flag; totals recomputed (items, per-item discount, shipping rule, grand total).
- **Status transitions** (monotonic; each is an explicit action): Confirm (deducts stock + creates SALE stock movements + low-stock alerts) → Processing → Out for Delivery → Delivered; Cancel (terminal branch; cancels Shiprocket shipment + restores stock; blocked once delivered/out-for-delivery).
- **Invoicing**: choose bill type (CGST/IGST) before invoice; generate invoice number (locks item modification); download invoice PDF.
- Payment: Razorpay integration (create/verify/webhook status/refund); mark paid; payment failure handling.
- **Call/CRM notes**: threaded comments typed Call / Note / Follow-up, author-attributed, delete own only.
- Create Return/Exchange (only when delivered and not canceled) → returns module.
- Shipping panel embedded (see §10).
- Return-related order fields: has-returns flag, total refunded so far, exchange-order linkage (is-exchange, original order, linked return request).

### 4.3 Backend capabilities without current UI
- Pending/unshipped-items report for modified orders (`/api/orders/report` — currently public!).
- Direct Razorpay refund endpoint (separate from returns-module refunds).

---

## 5. Users / Customers

- Paginated user list with search; columns: name, email, phone, admin flag.
- Edit user: name, email, phone, admin toggle, saved addresses CRUD (address, city, state, postal code, country; labels Home/Work/Other with default flag exist in the model).
- Delete user (admins protected from edit/delete).
- Admin-creates-customer flow: name, email, phone (validated, 91-prefix stripped), default password (currently hardcoded — replace with invite/OTP flow).
- Under-exposed model fields to surface: `authMethod` (password/otp), `isProfileComplete` (auto-registered users), **`savedRefundDestination`** (UPI id / bank details used by return refunds).
- No role management beyond the admin toggle (see §2.1).

---

## 6. Products (Catalog)

- Paginated list; keyword search; filters: school (typeahead), category, season, class. (Season currently auto-defaults by calendar month — make explicit.)
- Create / edit / delete product.
- Fields: name (sanitized), SKU (unique), type (drives size variants), brand, season (Summer/Winter/All Season), category (Boys/Girls/Unisex), description, SEO keywords, main image, active flag, out-of-stock flag.
- **Merchandising**: featured flag + featured order (separate endpoint); global display order (higher first, auto-assign); backend supports fetching all display orders for a drag-sort experience (no UI today); new-arrivals and featured feeds power the storefront.
- **Associations**: many classes, many schools (multi-select with select-all).
- **Per-size variants** (seeded from the product's Type): size, price, MRP-inclusive tax %, discount %, alert threshold, opening qty, max order qty, per-size active and out-of-stock flags — plus read-only inventory buckets (on hand, committed, damaged, safety stock, cost price, available, last restocked) managed by the Stock module.
- Image workflow: upload with progress or pick from product image gallery.
- Product picker (search by name/SKU, choose in-stock size) reused by returns/exchange and billing flows.
- Reviews exist on the model (create endpoint is customer-facing); admin moderation is a candidate requirement.
- Bulk stock check endpoint exists (cart-oriented).

---

## 7. Product Types & Size Guides

- List all types (incl. inactive); create / edit / delete; active toggle.
- Fields: type name (unique), type image, legacy size-guide image, legacy size-chart image (3 independent image slots with upload/gallery).
- **Variant templates**: per-type size list (size + active) that products inherit.
- **Structured size-guide table** (rich editor requirement):
  - Metadata: title, measurement unit (cm/inches/both), fit type (Regular/Slim/Relaxed/Loose), instructions text, instruction image.
  - Base measurement columns: size, chest, waist, length, shoulder, hip, inseam, age, height — with per-column visibility toggles.
  - Custom named measurement columns (add/remove), stored per-row as label/value pairs.
  - Row CRUD for size measurements.
- Category feed for storefront homepage.

---

## 8. Schools & Classes

### Schools
- Paginated list; create / edit / delete; active toggle.
- Fields: name (normalized), contact phone, email, website, description, address, city, state, country, logo (upload/gallery), order count.
- Featured flag + featured order (backend supports; storefront featured feed).
- Name typeahead lookup (min 3 chars) used across modules.
- Fix: persist all edited fields (see §2.6).

### Classes
- Master list of classes/standards; inline create / rename / delete; active toggle.
- Consumed by product tagging and storefront filtering.

---

## 9. Stock / Inventory

**Inventory model:** per size-variant buckets — On Hand, Committed, Damaged, Safety Stock; **Available = On Hand − Committed − Damaged − Safety Stock**; atomic bucket updates recompute available/out-of-stock; threshold breaches auto-create alerts.

### 9.1 Stock dashboard
- KPIs: total on hand, total SKUs/variants, in-stock / low-stock / out-of-stock counts, stock-health %, active alerts.
- Valuation snapshot: total items, retail value, cost value, potential profit.
- Season filter (All/Summer/Winter); KPI click-through to filtered overview.
- Low-stock list with quick-adjust links; recent movements feed.

### 9.2 Stock overview
- Paginated per-product listing with per-size rows: on hand, committed, damaged, safety, available, threshold, cost price.
- Search (name/SKU); filters: size, stock status (in/low/out), season (backend also supports school & type filters — expose them).
- Status computed from available vs alert threshold.

### 9.3 Product stock detail
- Per-variant detail: stock, threshold, price, cost price, last restocked, out-of-stock, status.
- Active alerts with acknowledge action (alert lifecycle: ACTIVE / ACKNOWLEDGED / RESOLVED).
- Movement history for the product.

### 9.4 Stock adjustment
- Product typeahead search (debounced) + size-variant selection with current levels shown.
- Adjustment types & effects: PURCHASE / RETURN / OPENING_STOCK (increase on hand, capture cost price), CORRECTION (±), DAMAGE (on hand → damaged), SAFETY_STOCK (± buffer).
- Fields: quantity change, reason, notes, cost price (purchase-type only).
- **Bulk adjustment endpoint exists with no UI** — requirement candidate (e.g. CSV import).

### 9.5 Movement log (audit)
- Global paginated log; filters: product search, movement type, date range.
- Movement types (full set): PURCHASE, SALE, SALE_CANCEL, RETURN, DAMAGE, CORRECTION, TRANSFER, OPENING_STOCK, SAFETY_STOCK, QUOTATION_RESERVE, QUOTATION_RELEASE.
- Each entry: timestamp, product/SKU/size, type, change, before/after, bucket changed, performed-by, reason, and links to originating order / quotation / return.

### 9.6 Valuation & analytics
- Valuation report filtered by school/type (filter options from backend): per-variant qty, sell price, cost price, sell value, cost value, profit; totals; CSV export.
- **Sales-velocity report endpoint exists (`?days=`) with no UI** — requirement candidate.
- Global stock-alerts list endpoint exists (only per-product alerts surfaced today).
- Backend CSV export endpoint (`/api/stock/export`) exists alongside the client-side export.

---

## 10. Shipping (Shiprocket) & NDR

### 10.1 Shipping dashboard
- Summary: total shipped, in transit, delivered, active NDR, RTO count, stuck shipments (no tracking update ≥48h).
- Lists: active shipments, NDR alerts, stuck shipments — each with order, customer, AWB, courier, status, EDD, last sync; deep-link to order.

### 10.2 Per-order shipping operations (full lifecycle)
- **Pre-ship**: serviceability/rate check (pickup & delivery pincode, weight, COD auto-detected from payment method) returning courier options (name, rate, ETD, rating).
- Package details: weight (default 0.5 kg), dimensions L×B×H (defaults 25×20×10 cm).
- Pickup locations: list (cached), select (default location), add new (name, phone, address, city, state, pincode).
- **Ship**: create shipment + assign courier in one step, or create then assign courier/AWB separately (fallback path).
- **Post-AWB**: schedule pickup, generate + download + print label, generate/download manifest, generate/download shipping invoice, refresh tracking, cancel shipment (only before pickup scheduled).
- Tracking history timeline (timestamp, status, location, remarks).
- Shipment record fields: provider ids (order/shipment), AWB, courier name/id/charges, EDD, pickup token & date, label/manifest/invoice URLs, status + status code, RTO flags & timestamps, sync time, per-action error log.
- **Status engine** (canonical, monotonic — never regresses), keyed to Shiprocket codes: Shipped, Pickup Scheduled, Out for Delivery, NDR, Delivered, RTO Initiated, RTO Delivered, Weight Discrepancy. Side effects: customer emails per transition; RTO delivery auto-restocks inventory.

### 10.3 NDR management
- Paginated NDR list; filter by courier; fields: order, customer, phone, AWB, courier, last NDR reason, NDR count (escalation flag at ≥3), last NDR time, order value.
- Actions per NDR: **Reattempt delivery** (corrected address, phone, preferred date, remarks — action history retained) or **Initiate RTO** (with reason).
- NDR action history (action, time, reason) on the shipment.

### 10.4 Backend capabilities without current UI
- `ShippingLog` audit trail (every Shiprocket API call with payloads, source admin/webhook/cron) — no screen.
- Weight-discrepancy alerting; stuck-shipment/delay detection, delayed-order export and delay-notification emails currently run as scripts only — candidates for admin-triggered actions.
- Webhook ingestion (secret-verified) drives status; reconciliation scripts heal stuck statuses.

---

## 11. Returns / Exchanges / QC / Refunds

**Types:** RETURN, EXCHANGE, REPLACEMENT. **Auto id:** `RET-YYYYMMDD-NNNNN`.

### 11.1 Returns list & triage
- Dashboard stats: total, pending approval, awaiting QC, refund due, exchanges — as clickable triage buckets that set filters.
- Paginated list; search by id/name; filters: status (14), type, date range (backend-supported).
- Row data: return id, order id, customer, type, status, reason, refund amount, age (stale flag ≥3 days), next-action hint.

### 11.2 Return creation (against an order)
- Guided flow: order → items → type → reason → pickup address → review.
- Item selection with per-item available qty = ordered − already returned (excluding rejected/cancelled returns).
- Exchange flow: pick replacement product/size via product search (captures product, name, size, unit price; low-stock warning).
- Reasons (enum): DEFECTIVE, WRONG_ITEM, WRONG_SIZE, QUALITY_ISSUE, NOT_AS_DESCRIBED, DAMAGED_IN_TRANSIT, CHANGED_MIND, OTHER + free-text details.
- 7-day return window from delivery, with explicit admin override flag.
- Pickup address pre-filled from order; estimated refund preview (discount-aware).
- Evidence images supported on the model.

### 11.3 Return workspace (detail)
- **State machine (backend-authoritative; UI must render server-supplied `nextStatuses`):**
  INITIATED → APPROVED → PICKUP_SCHEDULED / PICKUP_FAILED → IN_TRANSIT → RECEIVED → QC_IN_PROGRESS → QC_COMPLETED → { REFUND_INITIATED | EXCHANGE_SHIPPED | REPLACEMENT_SHIPPED } → COMPLETED; REJECTED (requires note) and CANCELLED are terminal.
  Type rules at QC completion: RETURN → refund only; EXCHANGE → exchange or refund; REPLACEMENT → replacement only. Cash refund blocked while a live exchange order exists.
- **QC workflow**: per-item disposition (GOOD / DAMAGED / UNSELLABLE / NOT_RECEIVED), accepted qty (0..returned), notes; completion gated on every item having a disposition; dispositions drive restock and refund math (NOT_RECEIVED/UNSELLABLE → zero refund).
- **Refunds**: system-calculated amount (single pricing engine, discount- and QC-aware; full-refund override available). Record refund: method (ORIGINAL_PAYMENT / BANK_TRANSFER / UPI / STORE_CREDIT), transaction id. Destination logic: prepaid → original Razorpay payment (payment ids surfaced with copy-to-clipboard); COD → customer UPI or bank details (ties to user's saved refund destination). Idempotency ledger flag prevents double-posting.
- **Exchange/replacement**: create exchange order (links back to orders + shipping for fulfillment); price-difference computation and collection tracking.
- **Credit note** generation linked to the return.
- **Reverse shipping**: initiate reverse pickup (Shiprocket), assign courier, generate/download reverse label, track pickup, external tracking link.
- Notes (free-form, attributed) and full timeline audit (action, from→to status, actor, note, time).
- Customer-side endpoints also exist (create, eligibility check, cancel, track) — admin UI should reflect customer-initiated returns identically.

---

## 12. Billing (B2B Documents) — parallel to e-commerce orders

**Document types:** QUOTATION, PROFORMA_INVOICE, TAX_INVOICE, CASH_BILL, CREDIT_NOTE, DEBIT_NOTE.
**Statuses:** DRAFT, SENT, ACCEPTED, REJECTED, CONVERTED, EXPIRED, CANCELLED. **Payment statuses:** UNPAID, PARTIAL, PAID, OVERDUE.
**Numbering:** atomic per-type, per-Indian-FY counters (`QT/PI/INV/CB/CN/DN-<FY>-NNNNN`).
**Tax model:** tax-inclusive MRP with reverse GST extraction; CGST+SGST (intra-state) vs IGST (inter-state); standard slabs 0/5/12/18/28 + custom; round-off to rupee; amount-in-words.

### 12.1 Document hub
- Paginated list of all documents; filters: type, status; search by number/buyer.
- Actions gated by state: view; edit (DRAFT only); mark sent (DRAFT); delete (DRAFT/CANCELLED, confirmed).

### 12.2 Document create/edit (quotation, proforma, tax invoice)
- Type (locked after create), bill type (CGST/IGST), valid-until date, notes/terms.
- Sender & buyer selection: debounced company search + inline company create.
- Line items from inventory (product picker expands size variants): qty, unit price, discount %, tax rate (config slabs + custom), stock indicator; custom free-form items (name, HSN, size, qty, price, disc, tax).
- Live totals (taxable, tax split, grand total); zero-qty exclusion warning.
- Documents reserve stock (QUOTATION_RESERVE / QUOTATION_RELEASE movements).

### 12.3 Document lifecycle
- Status transitions: DRAFT → SENT → ACCEPTED; **convert** QUOTATION → PROFORMA_INVOICE → TAX_INVOICE (lineage retained: parent, converted-to, cloned-from, linked invoice, version); **clone** to new draft; **revision** endpoint with revision history (no UI today).
- **Payments**: record payments against TAX_INVOICE/CASH_BILL (amount bounded by outstanding; methods BANK_TRANSFER/CASH/UPI/CARD/CHEQUE; reference + remarks); payment ledger; partial → PAID progression; overdue tracking.
- **Credit/debit notes** against an invoice: pre-filled items with max-qty caps, per-item include + qty, required reason, live totals honoring bill type.
- Print view for all 6 types: sender identity (logo, GSTIN, PAN, bank/UPI), bill-from/bill-to or walk-in customer, item table (HSN/SKU config-aware), totals with shipping/additional charges/round-off, amount-in-words, payment history, payment & delivery terms, footer/T&C, signatures.

### 12.4 Cash bill (POS)
- Walk-in customer (optional name/phone), sender company, GST type, payment mode (CASH/UPI/CARD/BANK_TRANSFER) with conditional payment reference, inventory + custom items, notes; immediately generated (deducts stock).

### 12.5 Companies (party master)
- Paginated list; filter SENDER/BUYER; search; create/edit/soft-delete; default flag.
- Fields: name, type, GSTIN/PAN (validated, uppercased), address block (line1/2, city, state, pincode validated, country), phone, email; SENDER-only banking (bank, account, IFSC, branch; UPI on model); logo; optional school link.
- Multiple sender identities supported per business.

### 12.6 Templates, settings, reports
- Document templates: CRUD; types COVER / TERMS / HEADER / FOOTER; default flag; content body.
- Billing config: show HSN / show SKU / show payment info toggles; tax enabled; default tax rate; default HSN; standard tax-rate list.
- Billing report: date range + type + buyer filters; summary (invoiced, collected, outstanding, credit notes, counts, overdue); GST tax summary (taxable, CGST, SGST, IGST); overdue invoice list; full document register — all linked.

---

## 13. Homepage / Content Management (storefront CMS)

- **Announcements**: CRUD; image, display order, active toggle.
- **Carousel banners**: CRUD; image, display order, active toggle.
- **Statistics (vanity counters)**: total parents, total products, total schools (+ happy parents on model); active toggle.
- **Header background**: image, active toggle.
- Related storefront feeds administered elsewhere: featured products/schools (+ordering), new arrivals, type categories.

---

## 14. Customer Requests / Lead Inbox (backend-only today — no admin UI exists)

- Public "school not found" / "product not found" request capture with contact details.
- Admin requirements: list, view, status workflow (pending / reviewed / resolved / rejected), admin notes, resolved-by/at, email-sent tracking, delete.

---

## 15. Search

- Universal search endpoint (products + schools + types) with suggestions — candidate for a global admin command palette / omnisearch.

---

## 16. Email & Notifications (admin-relevant surface)

- Transactional templates exist for: order confirmation/shipped/out-for-delivery/delivered/cancelled, delay notification, orders resumed, exchange shipped, full return lifecycle (initiated → completed / refund initiated / rejected / cancelled / pickup states).
- Internal ops alerts: NDR, RTO, weight dispute, stuck shipment.
- No UI today for: resend/preview emails, delay-notification triggering (script-only), template preview. Candidates for revamp scope.

---

## 17. Backend capabilities with NO current admin UI (revamp opportunities)

| Capability | Backend surface |
|---|---|
| Customer request/lead inbox with status workflow | `/api/requests` (full CRUD + status) |
| Sales-velocity analytics | `/api/stock/velocity?days=` |
| Global stock-alert queue | `/api/stock/alerts?status=` |
| Bulk stock adjustment | `/api/stock/bulk-adjust` |
| Server CSV stock export | `/api/stock/export` |
| Product display-order drag-sort feed | `/api/products/admin/display-orders` |
| Featured schools management | `/api/schools/featured` |
| Quotation revisions/versioning | `/api/billing/quotations/:id/revision` |
| Direct Razorpay refund | `/api/pay/refund` |
| Modified-order pending-items report | `/api/orders/report` (also needs auth fix) |
| Shiprocket API audit log | `ShippingLog` model |
| Delay detection, delay emails, reconciliation | scripts only — candidates for admin-triggered jobs |
| Review moderation | reviews on product model |
| User refund-destination management | `user.savedRefundDestination` |

---

## 18. Industry-Standard Capabilities to Add (research-backed)

Benchmarked against modern commerce back offices (Shopify admin, Medusa admin, enterprise
OMS/RMS feature sets) and current admin-product conventions. Each item is tagged:
**[READY]** = current backend already supports it (UI-only work) · **[BACKEND]** = needs new
backend capability (feed into the backend redesign, `02-backend-redesign.md`).

### 18.1 List/table experience (every module)
- Faceted filters + column visibility controls + per-column sort. **[READY]** (params largely exist)
- **Saved views** — bookmark filter/sort/column combinations per user (e.g. "COD pending", "Stale NDRs"). **[BACKEND]** (tiny: per-user view store)
- **Bulk actions** with selection toolbar: bulk status transition, bulk export, bulk stock adjust (endpoint exists), bulk feature/unfeature, bulk delete. **[BACKEND]** for most mutations (only stock bulk-adjust exists)
- Inline editing for simple fields (display order, active flags, thresholds). **[READY]**
- Export CSV/XLSX from every list, honoring active filters. **[READY]** for orders/stock; **[BACKEND]** to generalize
- URL-addressable state: every filter/search/page combination shareable as a link. **[READY]**

### 18.2 Global navigation & productivity
- **Command palette (⌘K)** — fuzzy jump to any entity/action; backend universal-search endpoint (`/api/search` products+schools+types) already exists; extend to orders/returns/documents. **[READY]** partial, **[BACKEND]** to widen index
- Global omnisearch with suggestions (endpoint exists). **[READY]**
- Keyboard shortcuts for high-frequency ops flows (picking, QC, status transitions).
- Breadcrumbs + cross-entity deep links everywhere (order ↔ shipment ↔ return ↔ credit note ↔ stock movement — the data links already exist).
- Recently-viewed entities and pinned/favorite pages.

### 18.3 Dashboard & analytics standards
- Role-relevant KPI hierarchy: 3–5 primary metrics first, progressive disclosure for the rest (grouping + drilldown from summary to detail).
- Comparison periods on all KPIs (partially exists), sparklines, empty/extreme-value states.
- Real-time or near-real-time refresh of ops-critical tiles (new orders, NDR, low stock). **[BACKEND]** (polling now; consider SSE/websocket later)
- Saved/custom date ranges; per-user default landing view.
- **Actionable alert inbox** — one queue aggregating: low-stock alerts (exists), NDR (exists), stuck shipments (exists), overdue invoices (exists), pending returns (exists), payment failures. Pure aggregation of existing signals. **[READY]** (thin aggregate endpoint recommended)

### 18.4 Governance, trust & safety (currently the biggest gap vs industry standard)
- **RBAC** — roles beyond the single `isAdmin` boolean (e.g. Owner / Ops / Warehouse / Finance / Content, or permission sets). Industry baseline for multi-person back offices. **[BACKEND]** (prerequisite; decide in phase 0)
- **Unified audit log / activity feed** — who did what, when, to which entity, across all modules. Backend already writes per-domain trails (stock movements, return timelines, shipping logs, quotation revisions, call comments) — unify into one queryable activity stream + per-entity "Activity" tab. **[BACKEND]** (aggregation layer)
- Session management (active sessions, revoke), password policy, optional 2FA for admins. **[BACKEND]**
- Confirmation + reason capture for destructive/financial overrides (refund override, return-window override — reasons partially captured today; make universal).

### 18.5 Commerce domain features (aligned with existing backend)
- **Order timeline** — single chronological view per order merging: status transitions, payments, shipping events, item modifications, comments, returns, emails sent. Data exists across sub-objects; needs composition. **[READY]** (composition) / **[BACKEND]** (email-sent log)
- **Draft orders / admin-created orders** (order-on-behalf: pick customer, items, take payment link or COD) — natural extension of existing admin flows. **[BACKEND]**
- **Partial fulfillment / split shipment** support — industry-standard OMS capability; current model is one shipment per order. **[BACKEND]** (flag as roadmap decision)
- **Discounts & promotions engine** — coupon codes, cart-level rules, campaign price lists, scheduled sales. Today only per-item discount % exists. **[BACKEND]** (roadmap)
- **Customer 360** — profile + order history + returns history + refund destinations + saved addresses + lifetime value + notes. Mostly composition of existing data. **[READY]** partial
- **Abandoned-cart view** — active-carts KPI exists; add list view + (later) recovery email trigger. **[READY]** list / **[BACKEND]** recovery
- **Review moderation** — reviews exist on the product model with no admin surface. **[BACKEND]** (list/approve/reply endpoints)
- **Media library** — central browse/search/reuse of uploaded images (today: per-domain galleries, no unified backend). **[BACKEND]**
- Product **duplicate/clone** and CSV **import/export** of catalog + stock. **[BACKEND]** (import)
- Low-stock **reorder suggestions** using the existing sales-velocity endpoint (days-of-cover = available ÷ velocity). **[READY]** (velocity endpoint unused today)
- **Returns self-service parity** — customer-initiated returns already supported by backend; admin UI must treat customer-created and admin-created returns identically (triage inbox). **[READY]**
- **Notification/email center** — per-order/per-return view of transactional emails sent, resend + preview actions; trigger delay-notification campaigns from UI instead of scripts. **[BACKEND]** (send log + trigger endpoints; templates exist)

### 18.6 Ops & integration visibility
- **Integration health panel** — Shiprocket API log viewer (`ShippingLog` exists, no UI), webhook delivery/last-sync status, Razorpay webhook state, token health. **[READY]** log viewer / **[BACKEND]** health endpoints
- **Job/automation console** — run + monitor the script-only jobs (reconcile shipping, mark-delivered sweep, delayed-order export, delay emails) as admin-triggered background jobs with run history. **[BACKEND]** (job runner — see backend redesign)
- Failed-action retry queues surfaced in UI (AWB assign failures, webhook failures) — error data partially captured (`shipping.errors[]`). **[READY]** partial

### 18.7 Platform/UX baseline (non-negotiables for the new UI)
- Responsive down to tablet; critical ops flows (picking, QC, NDR) usable on mobile.
- Dark/light theme; accessibility (WCAG AA: contrast, keyboard nav, focus states, screen-reader labels on all tables/forms).
- Optimistic UI with undo where safe; skeleton loading; robust empty/error states; unsaved-changes guards.
- Toast + non-blocking background task progress (exports, bulk ops).
- Consistent status-badge taxonomy across modules (one color language for order/shipping/return/payment/document states).
- Form standards: inline validation, dirty-state tracking, autosave for long editors (size-guide tables, documents).

---

## 19. Business rules & constants to preserve (or intentionally change)

- Free shipping ≥ ₹599, else ₹100 (currently hardcoded — consider making a setting).
- Return window: 7 days from delivery, admin override allowed.
- NDR escalation flag at count ≥ 3; stuck shipment at 48h without tracking update.
- Cancel shipment allowed only before pickup is scheduled.
- Item modification locked once an invoice number is assigned; bill type must be set before invoicing.
- Order confirm = the stock-deduction moment; cancel/RTO = restock moments.
- QC completion requires a disposition on every item; refund amount is system-calculated (override = deliberate action).
- Refund method constraints by payment type (prepaid → gateway; COD → UPI/bank/store credit).
- Available stock formula: on hand − committed − damaged − safety stock (floor 0).
- Default package: 0.5 kg, 25×20×10 cm.
- Season defaulting by calendar month in product list (make explicit in new UI).
- Documents editable only in DRAFT; delete only DRAFT/CANCELLED.
