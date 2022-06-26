import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Image, ListGroup, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { getOrderDetails } from '../actions/orderActions';
import { ORDER_CREATE_RESET, ORDER_PAY_RESET } from '../constants/orderConstants';
import { logout } from '../actions/userActions';
import jsonwebtoken from 'jsonwebtoken';
import { clearCartFromDatabase, getCartFromDatabase } from '../actions/cartActions';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const OrderScreen = ({ match, history }) => {
    const orderId = match.params.id;

    const dispatch = useDispatch();

    const userLogin = useSelector(state => state.userLogin);
    const { userInfo } = userLogin;

    const orderPay = useSelector(state => state.orderPay);
    const { success: successPay } = orderPay;

    const orderDetails = useSelector(state => state.orderDetails);
    const { order, loading, error } = orderDetails;

    const getDiscountedPrice = (price, disc) => {
        return price - price * (disc / 100);
    };

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);

    useEffect(() => {
        if (userInfo && userInfo.token) {
            jsonwebtoken.verify(userInfo.token, process.env.REACT_APP_JWT_SECRET, (err, decoded) => {
                if (err) {
                    dispatch(logout());
                    history.push('/login');
                }
            });
        }
    }, [dispatch, userInfo, history]);

    useEffect(() => {
        if (!order || order._id !== orderId || successPay) {
            dispatch({ type: ORDER_PAY_RESET });
            dispatch({ type: ORDER_CREATE_RESET });
            dispatch(getOrderDetails(orderId));
            dispatch(clearCartFromDatabase());
            dispatch(getCartFromDatabase());
        }
    }, [dispatch, orderId, order, successPay]);

    useEffect(() => {
        if (!userInfo) {
            dispatch(logout());
            history.push('/login');
        }
    }, [userInfo, dispatch, history]);

    if (!loading && order.orderItems) {
        // Calculate Prices
        order.itemsPrice = order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0).toFixed(2);
    }

    return loading ? (
        <Loader />
    ) : error ? (
        <Message variant="danger">{error}</Message>
    ) : (
        <PageLayout>
            <Meta
                title={`Order Confirmed} - Allschooluniform`}
                description={'Order Confirmed'}
                keyword={'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,order,details'}
            />
            <h1>ORDER CONFIRMATION</h1>

            <Row>
                <Col md={8}>
                    <Card>
                        <ListGroup variant="flush">
                            <h1>
                                Hi, <strong>{order.user.name}</strong>
                            </h1>

                            <h5>Your Order Has been Placed! Thank You for Shopping with Us.</h5>
                            <h6> An Email Confirmation has been sent to You.</h6>

                            <h2 className="mt-2">Details</h2>

                            <ListGroup.Item>
                                <p>
                                    <strong>Order</strong> #{order.orderId}
                                </p>
                                <p>
                                    <strong>Payment Method: </strong>
                                    {order.paymentMethod}
                                </p>
                                <p>
                                    <strong>Ship to </strong>
                                    {order.shippingAddress.address},{order.shippingAddress.city},
                                    {order.shippingAddress.postalCode},{''}
                                    {order.shippingAddress.country}
                                </p>
                                <p>Order will be Delivered in 24-48 Hours</p>
                                {/* {order.isPaid ? (
                    <Message variant='success'>Paid on {order.paidAt}</Message>
                  ) : (
                    <Message variant='danger'>Not Paid</Message>
                  )} */}

                                {/* <p>
                    <strong>Name: </strong>
                    {order.user.name}
                  </p> */}
                                {/* <p>
                    <strong>Email: </strong>
                    <a href={`mailto:${order.user.email}`}>
                      {order.user.email}
                    </a>
                  </p> */}
                                {/* <p>
                    <strong>Mobile: </strong>
                    {order.user.phone}
                  </p> */}

                                {/* {order.isDelivered ? (
                    <Message variant='success'>
                      Delivered on {order.DeliveredAt}
                    </Message>
                  ) : (
                    <Message variant='danger'>Not Delivered</Message>
                  )} */}
                            </ListGroup.Item>
                            <h2 className="mt-2">Order Items</h2>
                            <ListGroup.Item>
                                {order.orderItems.length === 0 ? (
                                    <Message>Order Is Empty</Message>
                                ) : (
                                    <ListGroup variant="flush">
                                        {order.orderItems.map((item, index) => (
                                            <ListGroup.Item key={index}>
                                                <Row>
                                                    <Col md={2} lg={1}>
                                                        <Image src={item.image} alt={item.name} fluid rounded />
                                                    </Col>
                                                    <Col>
                                                        <Link
                                                            to={`/products/${item.product}`}
                                                            style={{ textDecoration: 'none', color: 'black' }}
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
                                    <Col>₹ {order.itemsPrice}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Shipping</Col>
                                    <Col>₹ {order.shippingPrice}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Tax</Col>
                                    <Col>₹ {order.taxPrice}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Total</Col>
                                    <Col>₹ {order.totalPrice}</Col>
                                </Row>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </PageLayout>
    );
};

export default OrderScreen;
