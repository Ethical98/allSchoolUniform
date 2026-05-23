# Design: Strip Frontend to Admin-Only

**Date:** 2026-05-23  
**Status:** Approved

## Context

A new Next.js repo has been created for the consumer-facing storefront. This legacy React app (`/asu/frontend`) will be admin-only going forward. All consumer-facing screens (cart, checkout, product browsing, profile, order tracking, register, etc.) are dead code — they have routes commented out or never defined. This cleanup removes them plus all exclusively-used components, CSS, utilities, and orphaned Redux slices, leaving only the admin panel UI and its supporting infrastructure.

## What Gets Deleted (~35 files)

### Screens (17 files in `src/Screens/`)
- `HomeScreen.js` — no route defined
- `ProductScreen.js` — no route defined
- `ProductDescriptionScreen.js` — no route defined
- `CartScreen.js` — no route defined
- `OrderDetailsScreen.js` — no route defined
- `OrderScreen.js` — no route defined
- `OrderTrackingScreen.js` — no route defined
- `PaymentScreen.js` — no route defined
- `PlaceOrderScreen.js` — no route defined
- `ProfileScreen.js` — no route defined
- `ShippingScreen.js` — no route defined
- `AboutUs.js` — imported in App.js but no route
- `ContactUs.js` — imported in App.js but no route
- `Policies.js` — imported in App.js but no route
- `RegisterScreen.js` — route commented out; not used by any active screen
- `LoginScreenOtp.js` — route commented out; no other references
- `TestBillScreen.js` — temporary screen, confirmed for removal

### Components (4 files in `src/components/`)
- `BreadCrumb.js` — only used by orphaned screens
- `CarouselHomeScreen.js` — not imported anywhere
- `CheckoutSteps.js` — only used by PaymentScreen, PlaceOrderScreen, ShippingScreen (all deleted)
- `LocalPagination.js` — not imported anywhere

### CSS files (6 files)
- `src/components/css/BreadCrumb.css`
- `src/components/css/CarouselHomeScreen.css`
- `src/components/css/CheckoutSteps.css`
- `src/Screens/css/HomeScreen.css`
- `src/Screens/css/OrderTrackingScreen.css`
- `src/Screens/css/ProfileScreen.css`

### Redux / Utils / Static Data (4 files)
- `src/reducers/uploadReducers.js` — empty file, no imports anywhere
- `src/constants/uploadConstants.js` — never imported anywhere
- `src/staticData/policies.js` — only imported by Policies.js (deleted)
- `src/utils/sitemapgenerator.js` — not imported anywhere

## What Gets Modified

### `src/App.js`
- Remove 17 import statements (all orphaned screens listed above)
- Remove the 4 commented-out route blocks (register, otp, forgotpassword, resetpassword)
- Remove the active `/test-bill` route and its import

### `src/Screens/NewCustomerByAdminScreen.js`
- Currently imports `./css/RegisterScreen.css` (line 9)
- Since `RegisterScreen.css` is deleted with `RegisterScreen.js`, this import must be fixed
- Action: Read `RegisterScreen.css`, identify any styles actually applied in `NewCustomerByAdminScreen`, move them to a new `NewCustomerByAdminScreen.css`, update the import

## What Is Kept (explicitly confirmed)

| File | Reason |
|------|--------|
| `cartActions.js / cartReducers.js / cartConstants.js` | `App.js` calls `getCartFromDatabase`; `Product.js` calls `addToCart` (used in CashBillScreen, QuotationCreateScreen, stock screens) |
| `homeActions.js / homeReducer.js / homeConstants.js` | `HomepageEditScreen.js` (routed) actively uses them |
| `utils/firebase.js` | `userActions.js` imports it for auth |
| `components/Header.js`, `Footer.js`, `PageLayout.js` | Used by `AdminPageLayout.js` and other active components |
| `components/Product.js`, `Rating.js` | Used by admin billing/stock screens |
| All `Invoice/`, `billing/`, `shipping/` sub-components | Used by active admin screens |
| `ErrorScreen.js` | Used by `ErrorBoundary.js` (not deleted) |

## What Is NOT Touched

- All Redux actions/reducers/constants for: billing, class, company, dashboard, order, product, return, school, shipping, stock, type, user
- All 50+ components not in the delete list
- `utils/Crypto.js`, `utils/api.js`, `utils/firebase.js`, `utils/stockDisplay.js`, `utils/taxCalculator.js`, `utils/useMedia.js`, `utils/useWindowDimensions.js`

## Verification

1. Run `npm start` — app should start with no import errors
2. Navigate to `/login` — should render correctly
3. Navigate to `/admin/dashboard` — should render correctly
4. Navigate to `/admin/billing` — should render correctly
5. Navigate to `/admin/stock` — should render correctly
6. Confirm no 404 errors in browser console for loaded assets
7. Run `npm run build` — should produce a clean build with no warnings about missing modules
