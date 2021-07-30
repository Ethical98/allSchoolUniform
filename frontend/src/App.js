import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
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

const App = () => {
  return (
    <Router>
      <Header />

      <main style={{ marginTop: '15vh' }}>
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
          <Route path='/products' component={BreadCrumb} />
          <Row>
            <Col md={3}>
              <Route path='/products' component={Accordion} exact />
            </Col>
            <Col md={9}>
              <Route path='/products' component={ProductScreen} exact />
            </Col>
          </Row>

          <Route path='/products/:id' component={ProductDescriptionScreen} />
          <Route path='/cart/:id?' component={CartScreen} />

          <Route path='/admin/userlist' component={UserListScreen} />
          <Route path='/admin/user/:id/edit' component={UserEditScreen} />
          <Route path='/admin/productlist' component={ProductListScreen} />
          <Route path='/admin/product/:id/edit' component={ProductEditScreen} />
          <Route path='/admin/product/create' component={ProductCreateScreen} />
          <Route path='/admin/orderlist' component={OrderListScreen} />
          <Route path='/admin/order/:id/edit' component={OrderEditScreen} />
          {/* <Route component={PageNotFoundScreen} exact /> */}
        </Container>
      </main>

      <Footer />
    </Router>
  );
};

export default App;
