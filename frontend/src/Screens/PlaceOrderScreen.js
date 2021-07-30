import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Image, ListGroup, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CheckoutSteps from '../components/CheckoutSteps';
import Message from '../components/Message';
import {
  createOrder,
  payOrderPayU,
  updateOrder,
} from '../actions/orderActions';
import { getCartFromDatabase } from '../actions/cartActions';
import { logout } from '../actions/userActions';
import jsonwebtoken from 'jsonwebtoken';

const PlaceOrderScreen = ({ history }) => {
  const dispatch = useDispatch();

  const [message, setMessage] = useState('');

  const [scriptReady, setScriptReady] = useState(false);

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const orderPay = useSelector((state) => state.orderPay);
  const {
    success: successPay,
    error: errorPay,
    response: paymentResponse,
  } = orderPay;

  const cart = useSelector((state) => state.cart);
  const { cartItems, cartId } = cart;

  const orderCreate = useSelector((state) => state.orderCreate);
  const { order, success, error } = orderCreate;

  useEffect(() => {
    if (cartItems.length !== 0) {
      dispatch(getCartFromDatabase());
    }
    // eslint-disable-next-line
  }, [dispatch, cartItems.length]);

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

  if (!cart.paymentMethod) {
    history.push('/payment');
  }

  useEffect(() => {
    if (cart.paymentMethod !== 'COD') {
      const addPayUMoneyScript = () => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src =
          'https://checkout-static.citruspay.com/bolt/run/bolt.min.js';
        //script.src="https://sboxcheckout-static.citruspay.com/bolt/run/bolt.min.js"
        script.id = 'bolt';
        script.async = true;
        script.onLoad = () => {
          setScriptReady(true);
        };
        document.body.appendChild(script);
      };

      if (!window.bolt) {
        addPayUMoneyScript();
      } else {
        setScriptReady(true);
      }
    }
  }, [dispatch, cart.paymentMethod]);

  useEffect(() => {
    if (cart.paymentMethod !== 'COD') {
      if (cartId) {
        if (errorPay === 'Overlay closed by consumer') {
          setMessage('Payment Canceled Please try again!!');
        }
        if (success) {
          dispatch(updateOrder(order._id, paymentResponse));
          history.push(`/order/${order._id}`);
        }
      }
    } else {
      if (success) {
        history.push(`/order/${order._id}`);
      }
    }
    // eslint-disable-next-line
  }, [dispatch, cartId, errorPay, history, success]);

  const addDecimals = (num) => {
    return (Math.round(num * 100) / 100).toFixed(2);
  };
  // Calculate Prices
  cart.itemsPrice = cart.cartItems
    .reduce((acc, item) => acc + item.price * item.qty, 0)
    .toFixed(2);

  cart.shippingPrice = cart.itemsPrice > 1000 ? 0 : 0;
  cart.taxPrice = addDecimals(Number((0 * cart.itemsPrice).toFixed(2)));
  cart.totalPrice = (
    Number(cart.itemsPrice) +
    Number(cart.shippingPrice) +
    Number(cart.taxPrice)
  ).toFixed(2);

  useEffect(() => {
    if (successPay) {
      dispatch(
        createOrder({
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: cart.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
        })
      );
    }
    // eslint-disable-next-line
  }, [successPay, dispatch]);

  const placeOrderHandler = () => {
    setMessage('');
    if (cart.paymentMethod === 'COD') {
      dispatch(
        createOrder({
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: cart.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
        })
      );
    } else {
      if (cartId) {
        dispatch(
          payOrderPayU(
            cart.totalPrice,
            userInfo.name,
            userInfo.email,
            userInfo.phone,
            cartId
          )
        );
      }
    }
  };

  return (
    <>
      <CheckoutSteps step1 step2 step3 step4 />
      {message && <Message variant='warning'>{message}</Message>}
      <Row>
        <Col md={8}>
          <Card rounded>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>SHIPPING</h2>
                <p>
                  <strong>Address: </strong>
                  {cart.shippingAddress.address},{cart.shippingAddress.city},
                  {cart.shippingAddress.postalCode},{''}
                  {cart.shippingAddress.country}
                </p>
              </ListGroup.Item>
              <ListGroup.Item>
                <h2>PAYMENT METHOD </h2>
                <strong>Method: {cart.paymentMethod}</strong>
              </ListGroup.Item>
              <ListGroup.Item>
                <h2>ORDER ITEMS</h2>
                {cart.cartItems.length === 0 ? (
                  <Message>Your Cart Is Empty</Message>
                ) : (
                  <Card rounded>
                    <ListGroup variant='flush'>
                      {cartItems.map((item, index) => (
                        <ListGroup.Item key={index}>
                          <Row>
                            <Col md={2} lg={1}>
                              <Image
                                src={item.image}
                                alt={item.name}
                                fluid
                                rounded
                              />
                            </Col>
                            <Col>
                              <Link
                                to={`/products/${item.name}`}
                                style={{ textDecoration: 'none' }}
                              >
                                {item.name}
                              </Link>
                            </Col>
                            <Col md={2}>Size: {item.size}</Col>
                            <Col md={4}>
                              {item.qty} x ₹{item.price} = ₹
                              {(item.qty * item.price).toFixed(2)}
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card>
                )}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>ORDER SUMMARY</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>₹ {cart.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>₹ {cart.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>₹ {cart.taxPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>₹ {cart.totalPrice}</Col>
                </Row>
              </ListGroup.Item>
              {error && (
                <ListGroup.Item>
                  <Message variant='danger'>{error}</Message>
                </ListGroup.Item>
              )}
              <ListGroup.Item>
                {/* {!scriptReady ? (
                  <Loader />
                ) : ( */}
                <Button
                  variant='success'
                  type='button'
                  className='col-12'
                  disabled={cart.cartItems === 0}
                  onClick={placeOrderHandler}
                >
                  Place Order
                </Button>
                {/* )} */}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PlaceOrderScreen;
