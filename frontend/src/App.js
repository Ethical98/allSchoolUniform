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
