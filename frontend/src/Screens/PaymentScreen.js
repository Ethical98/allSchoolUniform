import React, { useState, useEffect } from 'react';
import jsonwebtoken from 'jsonwebtoken';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { Button, Form, ListGroup } from 'react-bootstrap';
import { savePaymentMethod } from '../actions/cartActions';
import { logout } from '../actions/userActions';
import CheckoutSteps from '../components/CheckoutSteps';

const PaymentScreen = ({ history }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const cart = useSelector((state) => state.cart);
  const { shippingAddress, cartItems } = cart;

  const [paymentMethod, setPaymentMethod] = useState('COD');

  const dispatch = useDispatch();

  if (!shippingAddress) {
    history.push('/shipping');
  }

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    }
  }, [history, userInfo]);

  useEffect(() => {
    if (userInfo && userInfo.token) {
      jsonwebtoken.verify(
        userInfo.token,
        process.env.REACT_APP_JWT_SECRET,
        (err, decoded) => {
          if (err) {
            dispatch(logout());
            history.push('/login');
          }
        }
      );
    }
  }, [dispatch, userInfo, history]);

  useEffect(() => {
    if (cartItems.length === 0) {
      history.push('/products');
    }
  }, [history, cartItems]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    history.push('/placeorder');
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <h1>PAYMENT METHOD</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group>
          <Form.Label as='legend'>Select Method</Form.Label>

          <ListGroup>
            <ListGroup.Item>
              <Form.Check
                type='radio'
                label='Cash On Delivery'
                id='COD'
                name='paymentMethod'
                value='COD'
                checked
                onChange={(e) => setPaymentMethod(e.target.value)}
              ></Form.Check>
            </ListGroup.Item>
            <ListGroup.Item>
              <Form.Check
                type='radio'
                label='PayUMoney/Debit/Credit Card'
                id='PayU'
                name='paymentMethod'
                value='PayU'
                onChange={(e) => setPaymentMethod(e.target.value)}
              ></Form.Check>
            </ListGroup.Item>
          </ListGroup>
        </Form.Group>

        <Button type='submit' variant='primary'>
          Continue
        </Button>
      </Form>
    </FormContainer>
  );
};

export default PaymentScreen;
