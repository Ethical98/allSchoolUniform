import React, { useEffect } from 'react';
import { Card, Row, Col, Image } from 'react-bootstrap';
import { trackOrder } from '../actions/orderActions';
import { useSelector, useDispatch } from 'react-redux';
import Loader from '../components/Loader';
import Message from '../components/Message';
import './css/OrderTrackingScreen.css';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const OrderTrackingScreen = ({ match }) => {
  const orderId = match.params.id;

  const dispatch = useDispatch();

  const orderDetails = useSelector((state) => state.orderDetails);
  const { order, loading, error } = orderDetails;

  useEffect(() => {
    if (!order || order.orderId !== orderId) {
      dispatch(trackOrder(orderId));
    }
  }, [dispatch, orderId, order]);

  return (
    <PageLayout>
      <Meta
        title={`Order Tracking #${order.orderId} - Allschooluniform`}
        description={'Order Tracking Details'}
        keyword={
          'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,order,details,tracking'
        }
      />
      <Row className='justify-content-md-center'>
        <Col md={6}>
          {loading ? (
            <Loader />
          ) : error ? (
            <Message variant='danger'>{error}</Message>
          ) : (
            <Card className='tracking-card'>
              <div className='title'>Purchase Reciept</div>
              <div className='info'>
                <Row>
                  <Col>
                    <span id='heading'>Date</span>
                    <br />{' '}
                    <span id='details'>
                      {order.createdAt.substring(0, 10)}
                    </span>{' '}
                  </Col>
                  <Col className='text-end'>
                    <span id='heading'>Order No.</span>
                    <br />
                    <span id='details'>{order.orderId}</span>
                  </Col>
                </Row>
              </div>
              <div className='pricing'>
                {order.modified
                  ? order.modifiedItems.map((item, index) => (
                      <Row key={index}>
                        <Col xs={8}>
                          {' '}
                          <span id='name'>{item.name}</span>{' '}
                        </Col>
                        <Col>
                          {' '}
                          <span id='price' className='float-end'>
                            ₹{item.price}
                          </span>{' '}
                        </Col>
                      </Row>
                    ))
                  : order.orderItems.map((item, index) => (
                      <Row key={index}>
                        <Col xs={8}>
                          {' '}
                          <span id='name'>{item.name}</span>{' '}
                        </Col>
                        <Col>
                          {' '}
                          <span id='price' className='float-end'>
                            ₹{item.price}
                          </span>{' '}
                        </Col>
                      </Row>
                    ))}

                <Row>
                  <Col xs={8}>
                    {' '}
                    <span id='name'>Shipping</span>{' '}
                  </Col>
                  <Col>
                    {' '}
                    <span id='price' className='float-end'>
                      ₹{order.shippingPrice}
                    </span>{' '}
                  </Col>
                </Row>
              </div>
              <div className='total'>
                <Row>
                  <Col>
                    <big className='float-end'>₹{order.totalPrice}</big>
                  </Col>
                </Row>
              </div>
              <div className='tracking'>
                <div className='title'>Tracking Order</div>
              </div>
              <div className='progress-track'>
                <ul id='progressbar'>
                  {order.tracking.isConfirmed ? (
                    <li className='step0 active ' id='step1'>
                      Confirmed
                    </li>
                  ) : (
                    <li className='step0 ' id='step1'>
                      Confirmed
                    </li>
                  )}
                  {order.tracking.isProcessing ? (
                    <li className='step0 active text-center' id='step2'>
                      Processing
                    </li>
                  ) : (
                    <li className='step0 text-center' id='step2'>
                      Processing
                    </li>
                  )}
                  {order.tracking.isOutForDelivery ? (
                    <li className='step0 active text-end' id='step3'>
                      On the way
                    </li>
                  ) : (
                    <li className='step0  text-end' id='step3'>
                      On the way
                    </li>
                  )}
                  {order.tracking.isDelivered ? (
                    <li className='step0 active text-end' id='step4'>
                      Delivered
                    </li>
                  ) : (
                    <li className='step0 text-end' id='step4'>
                      Delivered
                    </li>
                  )}
                </ul>
              </div>
              <div className='footer'>
                <Row>
                  <Col xs={2} className='img-col'>
                    <Image fluid src='https://i.imgur.com/YBWc55P.png' />
                  </Col>
                  <Col xs={10}>
                    <Row>Want any help? Please contact us at 011-45091585</Row>

                    <strong> TEAM ALLSCHOOLUNIFORM</strong>
                  </Col>
                </Row>
                <Row></Row>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </PageLayout>
  );
};

export default OrderTrackingScreen;
