import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Image, ListGroup, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { getOrderDetails } from '../actions/orderActions';
import { logout } from '../actions/userActions';
import jsonwebtoken from 'jsonwebtoken';
import Invoice from '../components/Invoice/Invoice';
import { usePDF } from '@react-pdf/renderer';

const OrderDetails = ({ match, history }) => {
  const orderId = match.params.id;

  const dispatch = useDispatch();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const orderDetails = useSelector((state) => state.orderDetails);
  const { order, loading, error } = orderDetails;

  const [instance, updateInstance] = usePDF({
    document: order ? (
      <Invoice
        name={order.user ? order.user.name : ''}
        email={order.user ? order.user.email : ''}
        order={order && order}
      />
    ) : (
      <div>Bill</div>
    ),
  });

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    }
  }, [userInfo, history]);

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
    if (!order || order._id !== orderId) {
      dispatch(getOrderDetails(orderId));
    } else {
      updateInstance({
        document: (
          <Invoice
            name={order.user.name}
            email={order.user.email}
            order={order && order}
          />
        ),
      });
    }
  }, [dispatch, orderId, order, updateInstance]);

  useEffect(() => {
    if (!userInfo) {
      dispatch(logout());
      history.push('/login');
    }
  }, [userInfo, dispatch, history]);

  if (!loading && order.orderItems) {
    // Calculate Prices
    order.itemsPrice = order.orderItems
      .reduce((acc, item) => acc + item.price * item.qty, 0)
      .toFixed(2);
  }

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error}</Message>
  ) : (
    <>
      <h1>ORDER #{order.orderId}</h1>

      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>SHIPPING</h2>
              <p>
                <strong>Name:</strong> {order.user.name}
              </p>
              <p>
                <strong>Email: </strong>
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>{' '}
              <p>
                <strong>Address:</strong>
                {order.shippingAddress.address},{order.shippingAddress.city},
                {order.shippingAddress.postalCode},{''}
                {order.shippingAddress.country}
              </p>
              {order.tracking.isDelivered ? (
                <Message variant='success'>
                  Delivered on {order.tracking.deliveredAt.substring(0, 10)}
                </Message>
              ) : order.tracking.isOutForDelivery ? (
                <Message variant='info'>
                  Out For Delivery on{' '}
                  {order.tracking.outForDeliveryAt.substring(0, 10)}
                </Message>
              ) : order.tracking.isProcessing ? (
                <Message variant='warning'>
                  Processing on {order.tracking.processedAt.substring(0, 10)}
                </Message>
              ) : order.tracking.isConfirmed ? (
                <Message variant='secondary'>
                  Confirmed on {order.tracking.confirmedAt.substring(0, 10)}
                </Message>
              ) : (
                <Message>Order Recieved</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>PAYMENT METHOD</h2>
              <p>
                <strong> Method: </strong>
                {order.paymentMethod}
              </p>

              {order.isPaid ? (
                <Message variant='success'>Paid on {order.paidAt}</Message>
              ) : (
                <Message variant='warning'>Not Paid</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2 className='mt-2'>ORDER ITEMS</h2>
              {order.modified && (
                <Message variant='info'>Order Has Been Modified!!</Message>
              )}
              {order.orderItems.length === 0 ? (
                <Message>Order Is Empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {!order.modified
                    ? order.orderItems.map((item, index) => (
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
                              <Link to={`/products/${item.product}`}>
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
                      ))
                    : order.modifiedItems.map((item, index) => (
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
                              <Link to={`/products/${item.product}`}>
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
        {/* <PDFViewer width='100%' height='600' className='app'>
          <Invoice
            name={order.user.name}
            email={order.user.email}
            order={order && order}
            isAdmin={false}
          />
        </PDFViewer> */}
        {order.tracking.isDelivered && (
          <a href={instance.url} download={`${order.orderId}.pdf`}>
            Download Invoice
          </a>
        )}
      </Row>
    </>
  );
};

export default OrderDetails;
