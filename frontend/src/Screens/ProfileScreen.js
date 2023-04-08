import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import { Button, Form, Row, Col, ListGroup, Table, InputGroup } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { getUserDetails, updateUserProfile, logout } from '../actions/userActions';
import jsonwebtoken from 'jsonwebtoken';
import { listMyOrders } from '../actions/orderActions';
import './css/ProfileScreen.css';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const ProfileScreen = ({ history }) => {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [savedAddress, setSavedAddress] = useState([]);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);

    const dispatch = useDispatch();

    const userDetails = useSelector((state) => state.userDetails);
    const { loading, error, user } = userDetails;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
    const { success } = userUpdateProfile;

    const orderListMy = useSelector((state) => state.orderListMy);
    const { loading: loadingOrders, error: errorOrders, orders } = orderListMy;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [userInfo, history]);

    useEffect(() => {
        if (userInfo && userInfo.token) {
            jsonwebtoken.verify(userInfo.token, process.env.REACT_APP_JWT_SECRET, (err, decoded) => {
                if (err) {
                    dispatch(logout());
                    history.push('/login');
                } else {
                    if (!user.name) {
                        dispatch(getUserDetails('profile'));
                        dispatch(listMyOrders());
                    } else {
                        setName(user.name);
                        setPhone(user.phone);
                        setEmail(user.email);
                        setSavedAddress([...user.savedAddress]);
                    }
                }
            });
        }
    }, [dispatch, userInfo, history, user]);

    const submitHandler = (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
        } else {
            //Dispatch update
            if (phone.toString().length > 10) {
                const number = Number(phone.toString().split('91')[1]);
                dispatch(updateUserProfile({ id: user._id, name, email, number, password }));
            } else {
                dispatch(updateUserProfile({ id: user._id, name, email, phone, password }));
            }
        }
    };

    return (
        <PageLayout>
            <Meta title={'Profile - AllSchoolUniform'} description={'View Profile'} />
            <Row className="mb-3">
                <Col md={4}>
                    <h2>PROFILE</h2>
                    {message && <Message variant="danger">{message}</Message>}
                    {error && <Message variant="danger">{error}</Message>}
                    {success && <Message variant="success">Profile Updated</Message>}
                    {loading && <Loader />}
                    <Form onSubmit={submitHandler}>
                        <InputGroup className="mb-3">
                            <InputGroup.Text id="email" style={{ width: '2.5rem' }}>
                                <i className="fas fa-envelope" />
                            </InputGroup.Text>
                            <Form.Control
                                required
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            ></Form.Control>
                        </InputGroup>

                        <InputGroup controlId="name" className="mb-3">
                            <InputGroup.Text id="name">
                                <i className="fas fa-user" />
                            </InputGroup.Text>
                            <Form.Control
                                required
                                type="name"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            ></Form.Control>
                        </InputGroup>

                        <InputGroup controlId="phone" className="mb-3">
                            <InputGroup.Text style={{ width: '2.5rem' }}>
                                <i class="fas fa-phone-alt" />
                            </InputGroup.Text>
                            <Form.Control
                                required
                                type="phone"
                                placeholder="Phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            ></Form.Control>
                        </InputGroup>

                        <InputGroup controlId="password" className="mb-3">
                            <InputGroup.Text>
                                <i class="fas fa-lock" />
                            </InputGroup.Text>
                            <Form.Control
                                required
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            ></Form.Control>
                        </InputGroup>
                        <InputGroup controlId="confirmPassword" className="mb-3">
                            <InputGroup.Text>
                                <i class="fas fa-lock" />
                            </InputGroup.Text>
                            <Form.Control
                                required
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            ></Form.Control>
                        </InputGroup>

                        <Button className="btn btn-dark col-12" type="submit">
                            Update
                        </Button>
                    </Form>
                </Col>

                <Col md={8}>
                    <h2>ORDERS</h2>
                    {loadingOrders ? (
                        <Loader />
                    ) : errorOrders ? (
                        <Message variant="danger">{errorOrders}</Message>
                    ) : (
                        <Table striped bordered hover responsive className="table-sm my-orders-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>DATE</th>
                                    <th>TOTAL</th>
                                    <th>PAID</th>
                                    <th>STATUS</th>
                                    <th>PAYMENT METHOD</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id}>
                                        <td>{order.orderId}</td>
                                        <td>{order.createdAt.substring(0, 10)}</td>
                                        <td>₹ {order.totalPrice}</td>
                                        <td>
                                            {order.isPaid ? (
                                                order.paidAt.substring(0, 10)
                                            ) : (
                                                <i className="fas fa-times" style={{ color: ' red' }} />
                                            )}
                                        </td>
                                        <td>
                                            {order.tracking.isCanceled ? (
                                                <p style={{ color: 'red' }}>
                                                    <strong>
                                                        Canceled: {order.tracking.canceledAt?.substring(0, 10)}
                                                    </strong>
                                                </p>
                                            ) : order.tracking.isDelivered ? (
                                                <p style={{ color: 'darkGreen' }}>
                                                    <strong>
                                                        Delivered: {order.tracking.deliveredAt?.substring(0, 10)}
                                                    </strong>
                                                </p>
                                            ) : order.tracking.isOutForDelivery ? (
                                                <p style={{ color: 'yellow' }}>
                                                    <strong>
                                                        `Out For Delivery:{' '}
                                                        {order.tracking.outForDeliveryAt?.substring(0, 10)}`
                                                    </strong>
                                                </p>
                                            ) : order.tracking.isProcessing ? (
                                                <p style={{ color: 'purple' }}>
                                                    <strong>
                                                        Processed: {order.tracking.processedAt?.substring(0, 10)}
                                                    </strong>
                                                </p>
                                            ) : order.tracking.isConfirmed ? (
                                                <p style={{ color: 'blue' }}>
                                                    <strong>
                                                        Confirmed: {order.tracking.confirmedAt?.substring(0, 10)}
                                                    </strong>
                                                </p>
                                            ) : (
                                                'Recieved'
                                            )}
                                        </td>
                                        <td>{order.paymentMethod}</td>
                                        <td>
                                            <LinkContainer to={`/orderdetails/${order._id}`}>
                                                <Button size="sm" variant="light">
                                                    Details
                                                </Button>
                                            </LinkContainer>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Col>
            </Row>
            <Row className="mb-3 g-0">
                <Col>
                    {savedAddress.length !== 0 && (
                        <>
                            {message && <Message variant="danger">{message}</Message>}
                            {error && <Message variant="danger">{error}</Message>}
                            {success && <Message variant="success">Profile Updated</Message>}
                            {loading && <Loader />}
                            <h2>ADDRESSES</h2>
                            <ListGroup className="mt-2">
                                <Row>
                                    {savedAddress.map((x) => (
                                        <Col md={3}>
                                            <ListGroup.Item key={x._id}>
                                                {x.address}
                                                <br />
                                                {x.city}
                                                <br />
                                                {x.postalCode}
                                                <br />
                                                {x.country}
                                                <br />
                                                <i className="fas fa-edit" />
                                                Edit
                                                <div className="float-end" style={{ color: 'red' }}>
                                                    <i className="fas fa-trash" />
                                                    Delete
                                                </div>
                                            </ListGroup.Item>
                                        </Col>
                                    ))}
                                </Row>
                            </ListGroup>
                        </>
                    )}
                </Col>
            </Row>
        </PageLayout>
    );
};

export default ProfileScreen;
