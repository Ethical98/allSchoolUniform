import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import ProductScreen from './Screens/ProductScreen';
import ProductDescriptionScreen from './Screens/ProductDescriptionScreen';
import CartScreen from './Screens/CartScreen';
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import LoginScreenOTP from './Screens/LoginScreenOtp';
import ProfileScreen from './Screens/ProfileScreen';
import ShippingScreen from './Screens/ShippingScreen';
import PaymentScreen from './Screens/PaymentScreen';
import PlaceOrderScreen from './Screens/PlaceOrderScreen';
import OrderScreen from './Screens/OrderScreen';
import ResetPasswordScreen from './Screens/ResetPasswordScreen';
import ForgotPasswordScreen from './Screens/ForgotPasswordScreen';
import HomeScreen from './Screens/HomeScreen';
import OrderDetailsScreen from './Screens/OrderDetailsScreen';
import UserListScreen from './Screens/UserListScreen';
import UserEditScreen from './Screens/UserEditScreen';
import ProductListScreen from './Screens/ProductListScreen';
import ProductEditScreen from './Screens/ProductEditScreen';
import ProductCreateScreen from './Screens/ProductCreateScreen';
import OrderListScreen from './Screens/OrderListScreen';
import OrderEditScreen from './Screens/OrderEditScreen';
import OrderTrackingScreen from './Screens/OrderTrackingScreen';
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
import AboutUs from './Screens/AboutUs';
import Policies from './Screens/Policies';
import ContactUs from './Screens/ContactUs';

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
            <Switch>
                {/* Redirect root to admin dashboard */}
                <Route path="/" exact render={() => <Redirect to="/login" />} />
                
                {/* Auth routes - needed for admin login */}
                <Route path="/login" component={LoginScreen} />
                {/* <Route path="/register" component={RegisterScreen} />
                <Route path="/otp" component={LoginScreenOTP} />
                <Route path="/forgotpassword" component={ForgotPasswordScreen} />
                <Route path="/resetpassword" component={ResetPasswordScreen} /> */}
                
                {/* Admin routes */}
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
                
                {/* Admin utility routes */}
                <Route path="/newcustomerbyadmin" component={NewCustomerByAdminScreen} exact />
                
                {/* 404 - catch all */}
                <Route path="*" component={PageNotFoundScreen} />
            </Switch>
        </Router>
    );
};

export default App;
