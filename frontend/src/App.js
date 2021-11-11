import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap';
import Header from './components/Header';
import Footer from './components/Footer';
import Accordion from './components/Accordion';
import ProductScreen from './Screens/ProductScreen';
import BreadCrumb from './components/BreadCrumb';
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
import AdminHeader from './components/AdminHeader';
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
import Filter from './components/Filter';
import SearchBox from './components/SearchBox';

import InvoiceScreen from './Screens/InvoiceScreen';

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
      <Route
        render={({ history, location }) => (
          <Header history={history} location={location} />
        )}
      />

      <Route path='/products'>
        <div
          className='  d-flex d-sm-none align-items-center search-sm'
          style={{
            marginTop: '60px',
            background: `#2c4a77 url("uploads/seamlessschool-bg.png")`,
            padding: '2%',
            marginBottom: '-12vh',
          }}
        >
          <SearchBox />
        </div>
      </Route>

      {/* <div className='d-flex d-sm-none' style={{ marginTop: '70px' }}>
       
      </div> */}
      <main>
        <Route path='/admin' component={AdminHeader} />
        <Route path='/' component={HomeScreen} exact />

        <Container>
          <Route path='/orderdetails/:id' component={OrderDetailsScreen} />
          <Route path='/forgotpassword' component={ForgotPasswordScreen} />
          <Route path='/resetpassword' component={ResetPasswordScreen} />
          <Route path='/order/:id' component={OrderScreen} />
          <Route path='/shipping' component={ShippingScreen} />
          <Route path='/payment' component={PaymentScreen} />
          <Route path='/placeorder' component={PlaceOrderScreen} />
          <Route path='/otp' component={LoginScreenOTP} />
          <Route path='/login' component={LoginScreen} />
          <Route path='/register' component={RegisterScreen} />
          <Route path='/profile' component={ProfileScreen} exact />
          <Route path='/products' component={BreadCrumb} exact />
          <Route
            path='/products/schools/:selectedschool'
            component={BreadCrumb}
            exact
          />

          <Route path='/products/:id' component={BreadCrumb} exact />
          <Route path='/track/:id' component={OrderTrackingScreen} />

          <Route path='/products' component={ProductScreen} exact />
          <Route
            path='/products/schools/:selectedschool'
            component={ProductScreen}
            exact
          />

          <Route
            path='/products/:id'
            component={ProductDescriptionScreen}
            exact
          />
          <Route path='/cart/:id?' component={CartScreen} />
          <Route path='/admin/userlist' component={UserListScreen} />
          <Route path='/admin/user/:id/edit' component={UserEditScreen} />
          <Route
            path='/admin/productlist'
            component={ProductListScreen}
            exact
          />
          <Route
            path='/admin/productlist/:pageNumber'
            component={ProductListScreen}
            exact
          />
          <Route path='/admin/product/:id/edit' component={ProductEditScreen} />
          <Route path='/admin/product/create' component={ProductCreateScreen} />
          <Route path='/admin/orderlist' component={OrderListScreen} />
          <Route
            path='/admin/order/:id/edit'
            component={OrderEditScreen}
            exact
          />
          <Route
            path='/admin/order/:id/edit/page/:pageNumber'
            component={OrderEditScreen}
            exact
          />
          <Route path='/admin/schoollist' component={SchoolListScreen} />
          <Route path='/admin/school/create' component={SchoolCreateScreen} />
          <Route path='/admin/school/:id/edit' component={SchoolEditScreen} />
          <Route path='/admin/typelist' component={TypeListScreen} />
          <Route path='/admin/type/:id/edit' component={TypeEditScreen} />
          <Route path='/admin/type/create' component={TypeCreateScreen} />
          <Route path='/admin/classlist' component={ClassListScreen} />
          <Route path='/admin/homepage' component={HomepageEditScreen} />
          {/* {<Route pah='bill' component={InvoiceScreen} />} */}
          {/* <Route component={PageNotFoundScreen} exact /> */}
        </Container>
      </main>

      <Footer />
    </Router>
  );
};

export default App;
