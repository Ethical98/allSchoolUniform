import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { Button, Form, Row, Col, InputGroup, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import { register, submitOTP, getOTP, configureCaptcha, resetOtp } from '../actions/userActions';
import Loader from '../components/Loader';
import { mergeCartWithDatabase } from '../actions/cartActions';
import OtpInput from 'react-otp-input';
import validator from 'validator';
import './css/RegisterScreen.css';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const RegisterScreen = ({ history, location }) => {
    const dispatch = useDispatch();

    const [show, setShow] = useState(false);
    const [otp, setOtp] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [mobileVerified, setMobileVerified] = useState(false);
    const [otpMessage, setOtpMessage] = useState(null);

    const userRegister = useSelector(state => state.userRegister);
    const { loading, error, userInfo } = userRegister;

    const userOtpVerification = useSelector(state => state.userOtpVerification);
    const { error: otpError, verified, sent, loading: otpLoading } = userOtpVerification;
    const cart = useSelector(state => state.cart);
    const { cartSuccess } = cart;

    const redirect = location.search ? location.search.split('=')[1] : '/';

    useEffect(() => {
        configureCaptcha('sign-in-button');
        //eslint-disable-next-line
    }, [configureCaptcha]);

    useEffect(() => {
        if (userInfo && userInfo.token) {
            history.push(redirect);
            dispatch(resetOtp());
            if (!cartSuccess) {
                dispatch(mergeCartWithDatabase());
            }
        }
    }, [history, userInfo, redirect, cartSuccess, dispatch, phone]);

    const submitHandler = e => {
        e.preventDefault();
        setOtpMessage('');
        setMessage('');

        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
        } else if (!mobileVerified) {
            setMessage('Mobile Number Not Verified');
        } else {
            if (phone.toString().length > 10) {
                const number = Number(phone.toString().split('91')[1]);

                dispatch(register(name, email, number, password));
            } else {
                dispatch(register(name, email, phone, password));
                //Dispatch(resetOtp());
            }
        }
    };

    const handleOtpChange = otp => {
        setOtp(otp);
    };

    useEffect(() => {
        if (sent) {
            setOtpMessage('OTP SENT');
            setShow(true);
        }
        if (otpError && otpError.code === 'auth/invalid-verification-code') {
            setOtpMessage('Incorrect OTP!! Please Enter Correct OTP');
        }
        if (otpError && otpError.code === 'auth/missing-verification-code') {
            setOtpMessage('Please Enter OTP');
        }
    }, [dispatch, sent, otpError]);

    const requestOTP = async () => {
        if (!phone) {
            setMessage('Please Enter Mobile');
        } else if (!validator.isMobilePhone(phone)) {
            setMessage('Please Enter Correct Mobile Number');
        } else {
            setMobileVerified(false);
            setMessage('');
            setOtpMessage('');

            dispatch(getOTP(phone));
        }
    };
    useEffect(() => {
        if (verified) {
            setMessage('Mobile Number Verified');
            setMobileVerified(true);
            dispatch(resetOtp());
        }
    }, [verified, phone, otpError, dispatch]);

    const onSubmitOTP = () => {
        setShow(false);
        setMessage('');
        setOtp('');

        dispatch(submitOTP(otp));
    };

    return (
        <PageLayout>
            <Meta title={'Sign Up - AllSchoolUniform'} description={'Sign Up New User'} />
            <FormContainer>
                <h1>SIGN UP</h1>
                {loading || otpLoading ? (
                    <Loader />
                ) : (
                    message && (
                        <Message variant={message === 'Mobile Number Verified' ? 'success' : 'danger'}>
                            {message}
                        </Message>
                    )
                )}
                {error && <Message variant="danger">{error}</Message>}
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
                            onChange={e => setEmail(e.target.value)}
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
                            onChange={e => setName(e.target.value)}
                        ></Form.Control>
                    </InputGroup>

                    <InputGroup controlId="phone" className="mb-3">
                        <InputGroup.Text id="phone" style={{ width: '2.5rem' }}>
                            <i class="fas fa-phone-alt" />
                        </InputGroup.Text>
                        <Form.Control
                            required
                            readOnly={mobileVerified}
                            type="phone"
                            placeholder="Phone"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                        ></Form.Control>

                        {!mobileVerified ? (
                            <Button variant="outline-dark" id="sign-in-button" onClick={requestOTP}>
                                GET OTP
                            </Button>
                        ) : (
                            <Button variant="outline-dark" onClick={() => setMobileVerified(false)}>
                                Change?
                            </Button>
                        )}
                    </InputGroup>

                    <Modal show={show} onHide={() => setShow(false)} backdrop="static" keyboard={false}>
                        <Modal.Header closeButton>
                            <Modal.Title>Submit OTP</Modal.Title>
                        </Modal.Header>
                        {otpMessage && (
                            <Message variant={otpMessage === 'OTP SENT' ? 'success' : 'danger'}>{otpMessage}</Message>
                        )}
                        {otpLoading ? (
                            <Loader />
                        ) : (
                            <Modal.Body className="text-center">
                                <OtpInput
                                    value={otp}
                                    onChange={handleOtpChange}
                                    numInputs={6}
                                    inputStyle="inputStyle"
                                />
                            </Modal.Body>
                        )}
                        <Modal.Footer>
                            <Button variant="warning" onClick={requestOTP}>
                                Resend OTP
                            </Button>
                            <Button variant="success" onClick={onSubmitOTP}>
                                Submit OTP
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <InputGroup controlId="password" className="mb-3">
                        <InputGroup.Text id="password">
                            <i class="fas fa-lock" />
                        </InputGroup.Text>
                        <Form.Control
                            required
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        ></Form.Control>
                    </InputGroup>
                    <InputGroup controlId="confirmPassword" className="mb-3">
                        <InputGroup.Text id="confirmPassword">
                            <i class="fas fa-lock" />
                        </InputGroup.Text>
                        <Form.Control
                            required
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        ></Form.Control>
                    </InputGroup>

                    <Button type="submit" variant="info" className="col-12">
                        REGISTER
                    </Button>
                </Form>
                <Row className="py-3">
                    <Col>
                        Have an Account?
                        <Link
                            className="btn btn-outline-info btn-sm"
                            to={redirect ? `/login?redirect=${redirect}` : '/login'}
                        >
                            Login
                        </Link>
                    </Col>
                </Row>
            </FormContainer>
        </PageLayout>
    );
};

export default RegisterScreen;
