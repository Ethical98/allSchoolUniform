import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Image, ListGroup, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CheckoutSteps from '../components/CheckoutSteps';
import Message from '../components/Message';
import { createOrder, payOrderPayU, updateOrder } from '../actions/orderActions';
import { logout } from '../actions/userActions';
import jsonwebtoken from 'jsonwebtoken';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const PlaceOrderScreen = ({ history }) => {
    const dispatch = useDispatch();

    const [message, setMessage] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const orderPay = useSelector((state) => state.orderPay);
    const { success: successPay, error: errorPay, response: paymentResponse } = orderPay;

    const cart = useSelector((state) => state.cart);
    const { cartItems } = cart;

    const orderCreate = useSelector((state) => state.orderCreate);
    const { order, success, error } = orderCreate;

    const getDiscountedPrice = (price, disc) => {
        return price - price * (disc / 100);
    };

    if (userInfo && userInfo.token) {
        jsonwebtoken.verify(userInfo.token, process.env.REACT_APP_JWT_SECRET, (err, decoded) => {
            if (err) {
                dispatch(logout());
                history.push('/login');
            }
        });
    }

    if (!cart.paymentMethod) {
        history.push('/payment');
    }
    const addPayUMoneyScript = () => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://checkout-static.citruspay.com/bolt/run/bolt.min.js';
        script.id = 'bolt';
        script.async = true;
        document.body.appendChild(script);
    };
    useEffect(() => {
        if (cart.paymentMethod !== 'COD') {
            addPayUMoneyScript();
        }
    }, [dispatch, cart.paymentMethod]);

    useEffect(() => {
        if (cart.paymentMethod !== 'COD') {
            if (errorPay === 'Overlay closed by consumer') {
                setMessage('Payment Canceled Please try again!!');
            }
            if (successPay && order) {
                dispatch(updateOrder(order._id, paymentResponse));
                history.push(`/order/${order._id}`);
            }
        } else {
            if (success && order) {
                history.push(`/order/${order._id}`);
            }
        }
        // eslint-disable-next-line
    }, [dispatch, errorPay, history, success, successPay, order]);

    const addDecimals = (num) => {
        return (Math.round(num * 100) / 100).toFixed(2);
    };
    // Calculate Prices
    cart.itemsPrice = cart.cartItems
        .reduce((acc, item) => acc + getDiscountedPrice(item.price, item.disc) * item.qty, 0)
        .toFixed(2);

    cart.shippingPrice = cart.itemsPrice > 599 ? 0 : 100;
    cart.taxPrice = addDecimals(Number((0 * cart.itemsPrice).toFixed(2)));
    cart.totalPrice = (Number(cart.itemsPrice) + Number(cart.shippingPrice) + Number(cart.taxPrice)).toFixed(2);

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
                    totalPrice: cart.totalPrice
                })
            );
        } else {
            dispatch(payOrderPayU(cart.totalPrice, userInfo.name, userInfo.email, userInfo.phone));
        }
    };

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
                    totalPrice: cart.totalPrice
                })
            );
        }
        // eslint-disable-next-line
    }, [successPay, dispatch]);

    return (
        <PageLayout>
            <Meta
                title={`Place Order - Allschooluniform`}
                description={'Place New Order'}
                keyword={'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,order,details'}
            />
            <CheckoutSteps step1 step2 step3 step4 />
            {message && <Message variant="warning">{message}</Message>}
            <Row>
                <Col md={8}>
                    <Card>
                        <ListGroup variant="flush">
                            <ListGroup.Item>
                                <h2>SHIPPING</h2>
                                <p>
                                    <strong>Address: </strong>
                                    {cart.shippingAddress.address},{cart.shippingAddress.city},
                                    {cart.shippingAddress.postalCode},{cart.shippingAddress.state},
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
                                        <ListGroup variant="flush">
                                            {cartItems.map((item, index) => (
                                                <ListGroup.Item key={index}>
                                                    <Row>
                                                        <Col md={2} lg={1}>
                                                            <Image src={item.image} alt={item.name} fluid rounded />
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
                                                            {item.qty} x ₹{getDiscountedPrice(item.price, item.disc)} =
                                                            ₹
                                                            {(
                                                                item.qty * getDiscountedPrice(item.price, item.disc)
                                                            ).toFixed(2)}
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
                        <ListGroup variant="flush">
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
                                    {cart.itemsPrice < 599 && (
                                        <p style={{ margin: 0, color: 'red' }}>Free Shipping on Orders above ₹ 599</p>
                                    )}
                                    {cart.itemsPrice < 599 && (
                                        <p style={{ margin: 0, color: 'red' }}>
                                            Add Items worth ₹ {599 - cart.itemsPrice} for <strong>FREE Delivery</strong>
                                        </p>
                                    )}
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
                                    <Message variant="danger">{error}</Message>
                                </ListGroup.Item>
                            )}
                            <ListGroup.Item>
                                {/* {!scriptReady ? (
                  <Loader />
                ) : ( */}
                                <Button
                                    variant="success"
                                    type="button"
                                    className="col-12"
                                    disabled={cart.cartItems === 0}
                                    onClick={placeOrderHandler}
                                >
                                    Place Order
                                </Button>
                                <b>
                                    Due to heavy rush Orders will be delivered in 3-4 Days and trial is not
                                    available.Please Cooperate. Sorry for the inconvenience.:Team AllSchoolUniform
                                </b>
                                {/* )} */}
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </PageLayout>
    );
};

export default PlaceOrderScreen;
