import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Form, Row, Col, FloatingLabel } from 'react-bootstrap';
import FormContainer from '../components/FormContainer';
import validator from 'validator';
import {
  loginByPhone,
  login,
  getOTP,
  configureCaptcha,
  getOtpWithEmail,
} from '../actions/userActions';
import { mergeCartWithDatabase } from '../actions/cartActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const LoginScreenByPhone = ({ history, location }) => {
  const phoneInfo = useSelector((state) => state.userOtpVerification);
  const { phone } = phoneInfo;

  const dispatch = useDispatch();

  const [validated, setValidated] = useState(false);
  const [inputValue, setInputValue] = useState(phone ? phone : '');
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [continueClicked, setContinueClicked] = useState(false);
  const [invalidInputError, setInvalidInputError] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');

  const userLogin = useSelector((state) => state.userLogin);
  const { loading, userInfo, error } = userLogin;

  const cart = useSelector((state) => state.cart);
  const { cartSuccess } = cart;

  const userOtpVerification = useSelector((state) => state.userOtpVerification);
  const { loading: otpLoading, error: otpError, sent } = userOtpVerification;

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo && userInfo.token) {
      setMessage('');
      history.push(redirect);

      if (!cartSuccess) {
        dispatch(mergeCartWithDatabase());
      }
    }
  }, [userInfo, dispatch, redirect, history, cartSuccess]);

  const onSubmitHandlerFormOne = (e) => {
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.preventDefault();
      setMessage('This Field is Required!!');

      e.stopPropagation();
    } else {
      if (validator.isMobilePhone(inputValue)) {
        e.preventDefault();
        setEmail('');
        setPasswordMessage('');
        setPhoneNumber(inputValue);
        setContinueClicked(true);
      } else if (validator.isEmail(inputValue)) {
        e.preventDefault();
        setPhoneNumber('');
        setPasswordMessage('');
        setEmail(inputValue);
        setContinueClicked(true);
      } else {
        setPasswordMessage('');
        e.preventDefault();
        setInvalidInputError('Enter Valid Email/Number');
      }
    }

    setValidated(true);
  };

  const submitHandler = (e) => {
    const form = e.currentTarget;
    e.preventDefault();
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setPasswordMessage('This Field is Required!!');
    } else {
      e.preventDefault();
      setPasswordMessage('');
      if (phoneNumber && password) {
        dispatch(loginByPhone(inputValue, password));
      } else if (email && password) {
        dispatch(login(inputValue, password));
      }
    }
    setValidated(true);
  };

  useEffect(() => {
    if (sent) {
      history.push('/otp');
    }
  }, [history, sent]);
  const getOtpHandler = () => {
    configureCaptcha('login-otp');
    if (phoneNumber) {
      dispatch(getOTP(phoneNumber));
    } else {
      dispatch(getOtpWithEmail(email));
    }
  };
  // useEffect(() => {
  //   if (continueClicked) {
  //     setInvalidInputError('');
  //     configureCaptcha('login-otp');
  //   }
  // }, [continueClicked]);

  useEffect(() => {
    if (otpError === 'auth/invalid-phone-number') {
      setOtpErrorMessage('Enter Valid Email/Number');
    }
  }, [otpError]);

  return (
    <PageLayout>
      <Meta
        title={'Login - Allschooluniform'}
        description={'Buy School Uniforms Online'}
        keyword={'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login'}
      />
      <FormContainer>
        <h1>SIGN IN</h1>
        {loading || otpLoading ? (
          <Loader />
        ) : sent ? (
          <Message variant='success'>OTP SENT</Message>
        ) : otpError ? (
          <Message variant='danger'>{otpError}</Message>
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          invalidInputError && (
            <Message variant='danger'>{invalidInputError}</Message>
          )
        )}
        {!continueClicked ? (
          <Form
            noValidate
            validated={validated}
            onSubmit={onSubmitHandlerFormOne}
          >
            <Form.Group controlId='emailOrPhone' className='mb-3'>
              <FloatingLabel
                controlId='emailOrPhone'
                label='Email or Phone'
                className='mb-3'
              >
                <Form.Control
                  value={inputValue}
                  required
                  placeholder='Enter Email or Mobile'
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                ></Form.Control>
                <Form.Control.Feedback type='invalid'>
                  {message}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Form.Group>
            <Button
              variant='outline-dark'
              type='submit'
              className='col-12 mb-3'
            >
              Continue
            </Button>
            <Row className='py-3'>
              <Col className='text-center'>
                New Customer?{' '}
                <Link
                  style={{ textDecoration: 'none' }}
                  to={redirect ? `/register?redirect=${redirect}` : '/register'}
                >
                  <Button variant='info' className='col-12 mb-3'>
                    Register
                  </Button>
                </Link>
              </Col>
            </Row>
          </Form>
        ) : (
          <Form noValidate validated={validated} onSubmit={submitHandler}>
            <Form.Group controlId='emailOrPhone' className='mb-3'>
              <Form.Text>Email</Form.Text>
              <br />
              <span className='mb-3'>{inputValue}</span>

              <Form.Text
                className='float-end mb-3'
                style={{ textDecoration: 'none' }}
                as={Link}
                to='/login'
                onClick={() => setContinueClicked(false)}
              >
                Change?
              </Form.Text>
            </Form.Group>
            <Form.Group controlId='password'>
              <FloatingLabel
                label='Password'
                controlId='password'
                className='mb-3'
              >
                <Form.Control
                  value={password}
                  required
                  type='password'
                  placeholder='Password'
                  onChange={(e) => setPassword(e.target.value)}
                ></Form.Control>
                <Form.Control.Feedback type='invalid'>
                  {passwordMessage}
                </Form.Control.Feedback>
                <Form.Text
                  as={Link}
                  to='/forgotpassword'
                  style={{ textDecoration: 'none' }}
                >
                  Forgot Password?
                </Form.Text>
              </FloatingLabel>
            </Form.Group>

            <Button variant='secondary' type='submit' className='col-12 mb-3'>
              Sign-In
            </Button>
            <Row className='py-3'>
              <Col className='text-center'>
                Or {/* <Link style={{ textDecoration: 'none' }} to='/otp'> */}
                <div id='login-otp'></div>
                <Button
                  variant='dark'
                  className='col-12 mb-3'
                  onClick={getOtpHandler}
                >
                  Get an OTP on your phone
                </Button>
                {/* </Link> */}
              </Col>
            </Row>
          </Form>
        )}
      </FormContainer>
    </PageLayout>
  );
};

export default LoginScreenByPhone;
