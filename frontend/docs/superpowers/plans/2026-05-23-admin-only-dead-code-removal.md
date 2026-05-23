# Admin-Only Dead Code Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip the legacy React frontend down to admin-only by deleting all consumer-facing screens, their exclusive components/CSS, and orphaned Redux/utility files, then cleaning up App.js imports and routes.

**Architecture:** Single-pass surgical deletion — remove files first (screens, components, CSS, utils), then fix the two modified files (App.js and NewCustomerByAdminScreen.js). No new abstractions introduced. Cart Redux slice is kept because App.js and Product.js still reference it.

**Tech Stack:** React 17, React Router v5, Redux, Create React App (`npm run build` / `npm start`)

---

## File Map

### Files to DELETE
```
src/Screens/HomeScreen.js
src/Screens/ProductScreen.js
src/Screens/ProductDescriptionScreen.js
src/Screens/CartScreen.js
src/Screens/OrderDetailsScreen.js
src/Screens/OrderScreen.js
src/Screens/OrderTrackingScreen.js
src/Screens/PaymentScreen.js
src/Screens/PlaceOrderScreen.js
src/Screens/ProfileScreen.js
src/Screens/ShippingScreen.js
src/Screens/AboutUs.js
src/Screens/ContactUs.js
src/Screens/Policies.js
src/Screens/RegisterScreen.js
src/Screens/LoginScreenOtp.js
src/Screens/TestBillScreen.js
src/components/BreadCrumb.js
src/components/CarouselHomeScreen.js
src/components/CheckoutSteps.js
src/components/LocalPagination.js
src/components/css/BreadCrumb.css
src/components/css/CarouselHomeScreen.css
src/components/css/CheckoutSteps.css
src/Screens/css/HomeScreen.css
src/Screens/css/OrderTrackingScreen.css
src/Screens/css/ProfileScreen.css
src/reducers/uploadReducers.js
src/constants/uploadConstants.js
src/staticData/policies.js
src/utils/sitemapgenerator.js
```

### Files to MODIFY
```
src/App.js                              — remove 17 imports + 5 routes (4 commented-out + /test-bill)
src/Screens/NewCustomerByAdminScreen.js — remove dead CSS import on line 9
```

---

## Task 1: Delete orphaned screen files

**Files:**
- Delete: `src/Screens/HomeScreen.js`, `ProductScreen.js`, `ProductDescriptionScreen.js`, `CartScreen.js`, `OrderDetailsScreen.js`, `OrderScreen.js`, `OrderTrackingScreen.js`, `PaymentScreen.js`, `PlaceOrderScreen.js`, `ProfileScreen.js`, `ShippingScreen.js`, `AboutUs.js`, `ContactUs.js`, `Policies.js`, `RegisterScreen.js`, `LoginScreenOtp.js`, `TestBillScreen.js`

- [ ] **Step 1: Delete all 17 orphaned screen files**

```bash
cd /Users/devansh/Desktop/asu/frontend
rm src/Screens/HomeScreen.js \
   src/Screens/ProductScreen.js \
   src/Screens/ProductDescriptionScreen.js \
   src/Screens/CartScreen.js \
   src/Screens/OrderDetailsScreen.js \
   src/Screens/OrderScreen.js \
   src/Screens/OrderTrackingScreen.js \
   src/Screens/PaymentScreen.js \
   src/Screens/PlaceOrderScreen.js \
   src/Screens/ProfileScreen.js \
   src/Screens/ShippingScreen.js \
   src/Screens/AboutUs.js \
   src/Screens/ContactUs.js \
   src/Screens/Policies.js \
   src/Screens/RegisterScreen.js \
   src/Screens/LoginScreenOtp.js \
   src/Screens/TestBillScreen.js
```

- [ ] **Step 2: Verify files are gone**

```bash
ls src/Screens/ | grep -E "HomeScreen|ProductScreen|ProductDescription|CartScreen|OrderDetails|OrderScreen|OrderTracking|PaymentScreen|PlaceOrder|ProfileScreen|ShippingScreen|AboutUs|ContactUs|Policies|RegisterScreen|LoginScreenOtp|TestBill"
```

Expected: no output (all listed files deleted)

---

## Task 2: Delete orphaned component files

**Files:**
- Delete: `src/components/BreadCrumb.js`, `src/components/CarouselHomeScreen.js`, `src/components/CheckoutSteps.js`, `src/components/LocalPagination.js`

- [ ] **Step 1: Delete the 4 orphaned component files**

```bash
cd /Users/devansh/Desktop/asu/frontend
rm src/components/BreadCrumb.js \
   src/components/CarouselHomeScreen.js \
   src/components/CheckoutSteps.js \
   src/components/LocalPagination.js
```

- [ ] **Step 2: Verify files are gone**

```bash
ls src/components/ | grep -E "BreadCrumb|CarouselHomeScreen|CheckoutSteps|LocalPagination"
```

Expected: no output

---

## Task 3: Delete orphaned CSS files

**Files:**
- Delete: 3 component CSS + 3 screen CSS files

- [ ] **Step 1: Delete the 6 orphaned CSS files**

```bash
cd /Users/devansh/Desktop/asu/frontend
rm src/components/css/BreadCrumb.css \
   src/components/css/CarouselHomeScreen.css \
   src/components/css/CheckoutSteps.css \
   src/Screens/css/HomeScreen.css \
   src/Screens/css/OrderTrackingScreen.css \
   src/Screens/css/ProfileScreen.css
```

- [ ] **Step 2: Verify files are gone**

```bash
ls src/components/css/ src/Screens/css/ | grep -E "BreadCrumb|CarouselHomeScreen|CheckoutSteps|HomeScreen|OrderTracking|ProfileScreen"
```

Expected: no output

---

## Task 4: Delete orphaned Redux, utils, and static data files

**Files:**
- Delete: `src/reducers/uploadReducers.js`, `src/constants/uploadConstants.js`, `src/staticData/policies.js`, `src/utils/sitemapgenerator.js`

- [ ] **Step 1: Delete the 4 orphaned files**

```bash
cd /Users/devansh/Desktop/asu/frontend
rm src/reducers/uploadReducers.js \
   src/constants/uploadConstants.js \
   src/staticData/policies.js \
   src/utils/sitemapgenerator.js
```

- [ ] **Step 2: Verify files are gone**

```bash
ls src/reducers/ src/constants/ src/staticData/ src/utils/ | grep -E "upload|policies|sitemap"
```

Expected: no output

---

## Task 5: Clean App.js — remove orphaned imports and routes

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Replace App.js with the cleaned version**

The final `src/App.js` should be exactly:

```javascript
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import LoginScreen from './Screens/LoginScreen';
import UserListScreen from './Screens/UserListScreen';
import UserEditScreen from './Screens/UserEditScreen';
import ProductListScreen from './Screens/ProductListScreen';
import ProductEditScreen from './Screens/ProductEditScreen';
import ProductCreateScreen from './Screens/ProductCreateScreen';
import OrderListScreen from './Screens/OrderListScreen';
import OrderEditScreen from './Screens/OrderEditScreen';
import { getCartFromDatabase } from './actions/cartActions';
import { useDispatch, useSelector } from 'react-redux';
import SchoolListScreen from './Screens/SchoolListScreen';
import SchoolEditScreen from './Screens/SchoolEditScreen';
import SchoolCreateScreen from './Screens/SchoolCreateScreen';
import TypeListScreen from './Screens/TypeListScreen';
import TypeEditScreen from './Screens/TypeEditScreen';
import TypeCreateScreen from './Screens/TypeCreateScreen';
import ClassListScreen from './Screens/ClassListScreen';
import HomepageEditScreen from './Screens/HomepageEditScreen';
import NewCustomerByAdminScreen from './Screens/NewCustomerByAdminScreen';
import PageNotFoundScreen from './Screens/PageNotFoundScreen';
import AdminDashBoardScreen from './Screens/AdminDashBoardScreen';
import StockDashboardScreen from './Screens/StockDashboardScreen';
import StockOverviewScreen from './Screens/StockOverviewScreen';
import StockAdjustmentScreen from './Screens/StockAdjustmentScreen';
import StockProductDetailScreen from './Screens/StockProductDetailScreen';
import StockValuationScreen from './Screens/StockValuationScreen';
import StockMovementLogScreen from './Screens/StockMovementLogScreen';
import QuotationListScreen from './Screens/QuotationListScreen';
import QuotationCreateScreen from './Screens/QuotationCreateScreen';
import CashBillScreen from './Screens/CashBillScreen';
import CompanyListScreen from './Screens/CompanyListScreen';
import CompanyEditScreen from './Screens/CompanyEditScreen';
import QuotationViewScreen from './Screens/QuotationViewScreen';
import CreditNoteCreateScreen from './Screens/CreditNoteCreateScreen';
import TemplateListScreen from './Screens/TemplateListScreen';
import BillingReportScreen from './Screens/BillingReportScreen';
import BillingSettingsScreen from './Screens/BillingSettingsScreen';
import ShippingDashboardScreen from './Screens/ShippingDashboardScreen';
import ShippingNDRListScreen from './Screens/ShippingNDRListScreen';
import ReturnListScreen from './Screens/ReturnListScreen';
import ReturnCreateScreen from './Screens/ReturnCreateScreen';
import ReturnDetailScreen from './Screens/ReturnDetailScreen';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
    const dispatch = useDispatch();
    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    useEffect(() => {
        if (userInfo && userInfo.token) {
            dispatch(getCartFromDatabase());
        }
    }, [userInfo, dispatch]);

    return (
        <Router>
            <ErrorBoundary>
                <Switch>
                    <Route path="/" exact render={() => <Redirect to="/login" />} />

                    <Route path="/login" component={LoginScreen} />

                    <Route path="/admin/dashboard" component={AdminDashBoardScreen} />
                    <Route path="/admin/userlist" component={UserListScreen} />
                    <Route path="/admin/user/:id/edit" component={UserEditScreen} />
                    <Route path="/admin/productlist" component={ProductListScreen} exact />
                    <Route path="/admin/productlist/:pageNumber" component={ProductListScreen} exact />
                    <Route path="/admin/product/:id/edit" component={ProductEditScreen} />
                    <Route path="/admin/product/create" component={ProductCreateScreen} />
                    <Route path="/admin/orderlist" component={OrderListScreen} />
                    <Route path="/admin/order/:id/edit" component={OrderEditScreen} exact />
                    <Route path="/admin/order/:id/edit/page/:pageNumber" component={OrderEditScreen} exact />
                    <Route path="/admin/schoollist" component={SchoolListScreen} />
                    <Route path="/admin/school/create" component={SchoolCreateScreen} />
                    <Route path="/admin/school/:id/edit" component={SchoolEditScreen} />
                    <Route path="/admin/typelist" component={TypeListScreen} />
                    <Route path="/admin/type/:id/edit" component={TypeEditScreen} />
                    <Route path="/admin/type/create" component={TypeCreateScreen} />
                    <Route path="/admin/classlist" component={ClassListScreen} />
                    <Route path="/admin/homepage" component={HomepageEditScreen} />

                    <Route path="/admin/stock" component={StockDashboardScreen} exact />
                    <Route path="/admin/stock/overview" component={StockOverviewScreen} exact />
                    <Route path="/admin/stock/adjust" component={StockAdjustmentScreen} exact />
                    <Route path="/admin/stock/adjust/:productId" component={StockAdjustmentScreen} exact />
                    <Route path="/admin/stock/product/:id" component={StockProductDetailScreen} exact />
                    <Route path="/admin/stock/valuation" component={StockValuationScreen} exact />
                    <Route path="/admin/stock/movements" component={StockMovementLogScreen} exact />

                    <Route path="/admin/billing" component={QuotationListScreen} exact />
                    <Route path="/admin/billing/quotation/create" component={QuotationCreateScreen} exact />
                    <Route path="/admin/billing/quotation/:id/edit" component={QuotationCreateScreen} exact />
                    <Route path="/admin/billing/cash-bill" component={CashBillScreen} exact />
                    <Route path="/admin/billing/companies" component={CompanyListScreen} exact />
                    <Route path="/admin/billing/company/create" component={CompanyEditScreen} exact />
                    <Route path="/admin/billing/company/:id/edit" component={CompanyEditScreen} exact />
                    <Route path="/admin/billing/quotation/:id/view" component={QuotationViewScreen} exact />
                    <Route path="/admin/billing/credit-note/:invoiceId" component={CreditNoteCreateScreen} exact />
                    <Route path="/admin/billing/debit-note/:invoiceId" component={CreditNoteCreateScreen} exact />
                    <Route path="/admin/billing/templates" component={TemplateListScreen} exact />
                    <Route path="/admin/billing/reports" component={BillingReportScreen} exact />
                    <Route path="/admin/billing/settings" component={BillingSettingsScreen} exact />

                    <Route path="/admin/shipping" component={ShippingDashboardScreen} exact />
                    <Route path="/admin/shipping/ndr" component={ShippingNDRListScreen} exact />
                    <Route path="/admin/returns" component={ReturnListScreen} exact />
                    <Route path="/admin/returns/create/:orderId" component={ReturnCreateScreen} exact />
                    <Route path="/admin/returns/:id" component={ReturnDetailScreen} exact />

                    <Route path="/newcustomerbyadmin" component={NewCustomerByAdminScreen} exact />

                    <Route path="*" component={PageNotFoundScreen} />
                </Switch>
            </ErrorBoundary>
        </Router>
    );
};

export default App;
```

- [ ] **Step 2: Verify import count dropped**

```bash
grep "^import" src/App.js | wc -l
```

Expected: `43` (was 64 — removed 17 screen imports + the 4 consumer screens that had no route, minus recount)

Actually verify with:
```bash
grep "^import.*Screens" src/App.js | wc -l
```

Expected: `38` screen imports remaining (admin screens only)

---

## Task 6: Fix NewCustomerByAdminScreen.js — remove dead CSS import

**Files:**
- Modify: `src/Screens/NewCustomerByAdminScreen.js` line 9

The import `import './css/RegisterScreen.css';` references a file that no longer exists. The `inputStyle` class from that CSS is not used anywhere in `NewCustomerByAdminScreen.js`, so we simply remove the import.

- [ ] **Step 1: Remove line 9 from NewCustomerByAdminScreen.js**

Change this (line 9):
```javascript
import './css/RegisterScreen.css';
```

To: *(delete the line entirely — no replacement needed)*

The file header should go from:
```javascript
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { Button, Form, InputGroup } from 'react-bootstrap';
import Message from '../components/Message';
import { register, logout } from '../actions/userActions';
import Loader from '../components/Loader';
import validator from 'validator';
import './css/RegisterScreen.css';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';
```

To:
```javascript
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { Button, Form, InputGroup } from 'react-bootstrap';
import Message from '../components/Message';
import { register, logout } from '../actions/userActions';
import Loader from '../components/Loader';
import validator from 'validator';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';
```

- [ ] **Step 2: Verify the import is gone**

```bash
grep "RegisterScreen" src/Screens/NewCustomerByAdminScreen.js
```

Expected: no output

---

## Task 7: Verify build succeeds and commit

- [ ] **Step 1: Run the build to catch any missing module errors**

```bash
cd /Users/devansh/Desktop/asu/frontend
npm run build 2>&1 | tail -30
```

Expected: `Successfully compiled.` or `Compiled successfully.` with no `Cannot find module` or `Module not found` errors.

If you see `Module not found: Can't resolve './Screens/SomeName'`, it means that screen was missed in App.js cleanup — go back to Task 5 and remove that import.

- [ ] **Step 2: Spot-check the running app (optional but recommended)**

```bash
npm start
```

Navigate to:
- `http://localhost:3000/login` — should show the login screen
- `http://localhost:3000/admin/dashboard` — should redirect to login if not authenticated, or show dashboard
- `http://localhost:3000/test-bill` — should show 404 (PageNotFoundScreen)
- `http://localhost:3000/cart` — should show 404 (PageNotFoundScreen)

- [ ] **Step 3: Commit all deletions and modifications**

```bash
cd /Users/devansh/Desktop/asu/frontend
git add -A
git status
```

Review that only the expected files appear as deleted/modified, then:

```bash
git commit -m "chore: remove consumer-facing screens and dead code, admin-only

Deleted 17 orphaned screens (cart, checkout, profile, product browsing,
register, etc.), 4 exclusive components, 6 CSS files, and 4 orphaned
Redux/util/static-data files. Cleaned App.js imports and removed the
/test-bill temporary route. NewCustomerByAdminScreen dead CSS import removed.

Consumer storefront moved to separate Next.js repo."
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] All 17 screen files deleted — Task 1
- [x] 4 component files deleted — Task 2
- [x] 6 CSS files deleted — Task 3
- [x] uploadReducers, uploadConstants, policies.js, sitemapgenerator.js deleted — Task 4
- [x] App.js imports cleaned, commented routes removed, /test-bill route removed — Task 5
- [x] NewCustomerByAdminScreen.js dead CSS import removed — Task 6
- [x] Build verification — Task 7

**No placeholders:** All steps have exact commands or exact code.

**Type consistency:** No cross-task type references — this plan is purely file deletions and import removals.
