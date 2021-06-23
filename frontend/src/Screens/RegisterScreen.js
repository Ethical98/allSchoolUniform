import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { Button, Form, Row, Col, InputGroup, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import {
  register,
  submitOTP,
  getOTP,
  configureCaptcha,
  resetOtp,
} from '../actions/userActions';
import Loader from '../components/Loader';
import { mergeCartWithDatabase } from '../actions/cartActions';
import OtpInput from 'react-otp-input';
import validator from 'validator';
import './css/RegisterScreen.css';

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
  const [verifiedNumber, setVerifiedNumber] = useState('');

  const userRegister = useSelector((state) => state.userRegister);
  const { loading, error, userInfo } = userRegister;

  const userOtpVerification = useSelector((state) => state.userOtpVerification);
  const {
    error: otpError,
    verified,
    sent,
    loading: otpLoading,
  } = userOtpVerification;
  const cart = useSelector((state) => state.cart);
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

  const submitHandler = (e) => {
    e.preventDefault();
    setOtpMessage('');
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else if (!mobileVerified) {
      setMessage('Mobile Number Not Verified');
    } else if (phone !== verifiedNumber) {
      setMessage('Mobile Number Not Verified');
    } else {
      if (phone.toString().length > 10) {
        console.log(verifiedNumber);
        const number = Number(phone.toString().split('91')[1]);
        console.log(phone);
        dispatch(register(name, email, number, password));
      } else {
        console.log(mobileVerified);
        console.log(verifiedNumber);
        console.log(phone);
        dispatch(register(name, email, phone, password));
        //dispatch(resetOtp());
      }
    }
  };

  const handleOtpChange = (otp) => {
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
    dispatch(resetOtp());
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
      setVerifiedNumber(phone);
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
    <FormContainer>
      <h1>SIGN UP</h1>
      {loading || otpLoading ? (
        <Loader />
      ) : (
        message && (
          <Message
            variant={
              message === 'Mobile Number Verified' ? 'success' : 'danger'
            }
          >
            {message}
          </Message>
        )
      )}
      {error && <Message variant='danger'>{error}</Message>}
      <Form onSubmit={submitHandler}>
        <Form.Group controlId='email'>
          <Form.Label>Email</Form.Label>
          <Form.Control
            required
            type='email'
            placeholder='Enter Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId='name'>
          <Form.Label>Name</Form.Label>

          <Form.Control
            required
            type='name'
            placeholder='Enter Name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          ></Form.Control>
        </Form.Group>
        <Form.Group controlId='phone'>
          <Form.Label>Mobile</Form.Label>
          <InputGroup>
            <Form.Control
              required
              type='phone'
              placeholder='Enter Mobile'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            ></Form.Control>

            <Button className='ml-1' id='sign-in-button' onClick={requestOTP}>
              GET OTP
            </Button>
          </InputGroup>
          <Modal
            show={show}
            onHide={() => setShow(false)}
            backdrop='static'
            keyboard={false}
          >
            <Modal.Header closeButton>
              <Modal.Title>Submit OTP</Modal.Title>
            </Modal.Header>
            {otpMessage && (
              <Message
                variant={otpMessage === 'OTP SENT' ? 'success' : 'danger'}
              >
                {otpMessage}
              </Message>
            )}
            {otpLoading ? (
              <Loader />
            ) : (
              <Modal.Body className='text-center'>
                <OtpInput
                  value={otp}
                  onChange={handleOtpChange}
                  numInputs={6}
                  inputStyle='inputStyle'
                />
              </Modal.Body>
            )}
            <Modal.Footer>
              <Button variant='warning' onClick={requestOTP}>
                Resend OTP
              </Button>
              <Button variant='success' onClick={onSubmitOTP}>
                Submit OTP
              </Button>
            </Modal.Footer>
          </Modal>
        </Form.Group>
        <Form.Group controlId='password'>
          <Form.Label>Password</Form.Label>
          <Form.Control
            required
            type='password'
            placeholder='Enter Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          ></Form.Control>
        </Form.Group>
        <Form.Group controlId='confirmPassword'>
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            required
            type='password'
            placeholder='Confirm Password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Button type='submit' className='btn-block'>
          REGISTER
        </Button>
      </Form>
      <Row className='py-3'>
        <Col>
          Have an Account?{' '}
          <Link to={redirect ? `/login?redirect=${redirect}` : '/login'}>
            Login
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
};

export default RegisterScreen;
