import React, { useState, useEffect } from 'react';
import jsonwebtoken from 'jsonwebtoken';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { Button, Form, ListGroup } from 'react-bootstrap';
import { savePaymentMethod } from '../actions/cartActions';
import { logout } from '../actions/userActions';
import CheckoutSteps from '../components/CheckoutSteps';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const PaymentScreen = ({ history }) => {
    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const cart = useSelector((state) => state.cart);
    const { shippingAddress, cartItems } = cart;

    const [paymentMethod, setPaymentMethod] = useState('');

    const dispatch = useDispatch();

    useEffect(() => {
        if (!shippingAddress) {
            history.push('/shipping');
        }
    }, [history, shippingAddress]);

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
        <PageLayout>
            <Meta
                title={`Payment  - Allschooluniform`}
                description={'Order Payment'}
                keyword={'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,order,details'}
            />
            <FormContainer>
                <CheckoutSteps step1 step2 step3 />
                <h1>PAYMENT METHOD</h1>
                <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-3">
                        <Form.Label as="legend">Select Method</Form.Label>

                        <ListGroup>
                            <ListGroup.Item>
                                <Form.Check
                                    required
                                    type="radio"
                                    label="Cash On Delivery"
                                    disabled
                                    id="COD"
                                    name="paymentMethod"
                                    value="COD"
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                ></Form.Check>
                                <p style={{ margin: 0, color: 'red' }}>
                                    Due to heavy rush Cash on Delivery(COD) is not available. <br />
                                    Please Cooperate.
                                    <br />
                                    <p style={{ color: 'green' }}>
                                        <b>
                                            Your money is safe with us and will be Refunded in 5-7 Days .If Order is not
                                            delivered.
                                        </b>
                                    </p>
                                </p>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Form.Check
                                    required
                                    type="radio"
                                    label="Net Banking/UPI/Wallet/Debit/Credit Card"
                                    id="Online"
                                    name="paymentMethod"
                                    value="Online"
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                ></Form.Check>
                            </ListGroup.Item>
                        </ListGroup>
                    </Form.Group>

                    <Button type="submit" className="col-12" variant="outline-dark">
                        Continue
                    </Button>
                </Form>
            </FormContainer>
        </PageLayout>
    );
};

export default PaymentScreen;
