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

const App = () => {
  return (
    <Router>
      <Header />
      <main style={{ marginTop: '18vh' }}>
        <Container>
          <Route path='/otp' component={LoginScreenOTP} />
          <Route path='/login' component={LoginScreen} />

          <Route path='/register' component={RegisterScreen} />

          <Route path='/products' component={BreadCrumb} />
          <Row>
            <Route path='/products' component={Accordion} exact />
            <Col>
              <Route path='/products' component={ProductScreen} exact />
            </Col>
          </Row>
          <Route path='/products/:id' component={ProductDescriptionScreen} />
          <Route path='/cart/:id?' component={CartScreen} />
        </Container>
      </main>
      <Footer />
    </Router>
  );
};

export default App;
