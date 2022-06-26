import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, FloatingLabel, Form, Row } from 'react-bootstrap';
import FormContainer from '../components/FormContainer';
import { useDispatch, useSelector } from 'react-redux';
import { submitOTP, loginByOTP, getOTP, resetOtp, cancelOtpRequest, configureCaptcha } from '../actions/userActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const LoginScreenOtp = ({ history }) => {
    const [OTP, setOTP] = useState('');
    const dispatch = useDispatch();

    const phoneInfo = useSelector(state => state.userOtpVerification);
    const { phone, loading, verified, error, sent } = phoneInfo;
    const phoneNumber = phone;

    const userLogin = useSelector(state => state.userLogin);
    const { userInfo, error: userError, loading: userLoading } = userLogin;

    useEffect(() => {
        if (!phoneNumber) {
            history.push('/login');
        } else {
            if (verified) {
                dispatch(loginByOTP(phone));
                if (userInfo) {
                    dispatch(resetOtp(phone));
                    history.push('/products');
                }
            }
        }
    }, [userInfo, history, verified, dispatch, phone, phoneNumber]);

    useEffect(() => {
        if (phone) {
            configureCaptcha('resend-otp');
        }

        // eslint-disable-next-line
    }, [configureCaptcha, phone]);

    const resendOtpHandler = () => {
        // ConfigureCaptcha('resend-otp');
        dispatch(getOTP(phone));
    };
    const submitHandler = e => {
        e.preventDefault();

        dispatch(submitOTP(OTP));
    };

    return (
        <PageLayout>
            <FormContainer>
                {userLoading || loading ? (
                    <Loader />
                ) : userError ? (
                    <Message variant="danger">{userError}</Message>
                ) : error ? (
                    <Message variant="danger">{error.code}</Message>
                ) : (
                    sent && <Message variant="success">OTP SENT</Message>
                )}
                {!phone ? (
                    <Loader />
                ) : (
                    <>
                        <Meta
                            title={'Login By OTP - Allschooluniform'}
                            description={'Login By OTP'}
                            keyword={'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,OTP'}
                        />
                        <Form onSubmit={submitHandler}>
                            <Form.Group className="mb-3">
                                <FloatingLabel controlId="phone" label="Phone" className="mb-3">
                                    <Form.Control value={phone} placeholder="Phone" readOnly></Form.Control>
                                    <Form.Text
                                        style={{ textDecoration: 'none' }}
                                        as={Link}
                                        to="/login"
                                        onClick={() => dispatch(cancelOtpRequest(phone))}
                                    >
                                        Change?
                                    </Form.Text>
                                </FloatingLabel>

                                <Form.Text>
                                    We’ve sent a One Time Password (OTP) to the mobile number above. Please enter it to
                                    complete verification
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <FloatingLabel label="Enter OTP" controlId="otp" className="mb-3">
                                    <Form.Control
                                        value={OTP}
                                        placeholder="Enter OTP"
                                        onChange={e => setOTP(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>
                            </Form.Group>
                            <Button variant="info" type="submit" className="col-12 mb-3">
                                Sign In
                            </Button>
                        </Form>
                        <div id="resend-otp"></div>
                        <Row>
                            <Form.Text
                                as={Link}
                                to="/otp"
                                style={{ textDecoration: 'none' }}
                                className="text-center"
                                onClick={resendOtpHandler}
                            >
                                Resend OTP
                            </Form.Text>
                        </Row>
                        <Row>
                            <span as={Link} className="text-center">
                                or
                            </span>
                        </Row>
                        <Link to="/login">
                            <Button
                                variant="info"
                                className="col-12 mb-3"
                                onClick={() => dispatch(cancelOtpRequest(phone))}
                            >
                                Sign-In with your password
                            </Button>
                        </Link>
                    </>
                )}
            </FormContainer>
        </PageLayout>
    );
};

export default LoginScreenOtp;
