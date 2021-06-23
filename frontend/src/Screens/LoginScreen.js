import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Form, Row, Col } from 'react-bootstrap';
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

  const userLogin = useSelector((state) => state.userLogin);
  const { loading, userInfo, error } = userLogin;

  const cart = useSelector((state) => state.cart);
  const { cartSuccess } = cart;

  const userOtpVerification = useSelector((state) => state.userOtpVerification);
  const { loading: otpLoading, error: otpError, sent } = userOtpVerification;

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo && userInfo.token) {
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
    if (phoneNumber) {
      dispatch(getOTP(phoneNumber));
    } else {
      dispatch(getOtpWithEmail(email));
    }
  };
  useEffect(() => {
    if (continueClicked) {
      configureCaptcha('login-otp');
    }
  }, [continueClicked]);

  return (
    <FormContainer>
      <h1>Sign In</h1>
      {loading || otpLoading ? (
        <Loader />
      ) : sent ? (
        <Message variant='success'>OTP SENT</Message>
      ) : otpError ? (
        <Message variant='danger'>OTP NOT SENT</Message>
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
          <Form.Group controlId='emailOrPhone'>
            <Form.Label>Email or Phone Number</Form.Label>
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
          </Form.Group>
          <Button type='submit' className='btn-block'>
            Continue
          </Button>
          <Row className='py-3'>
            <Col className='text-center'>
              New Customer?{' '}
              <Link
                style={{ textDecoration: 'none' }}
                to={redirect ? `/register?redirect=${redirect}` : '/register'}
              >
                <Button className='btn-block'>Register</Button>
              </Link>
            </Col>
          </Row>
        </Form>
      ) : (
        <Form noValidate validated={validated} onSubmit={submitHandler}>
          <Form.Group controlId='emailOrPhone'>
            <Form.Label>Email or Phone Number</Form.Label>

            <Form.Control
              value={inputValue}
              required
              readOnly
              placeholder='Enter Email or Mobile'
            ></Form.Control>

            <Form.Control.Feedback type='invalid'>
              {message}
            </Form.Control.Feedback>
            <Form.Text
              as={Link}
              to='/login'
              style={{ color: 'white' }}
              onClick={() => setContinueClicked(false)}
            >
              Change?
            </Form.Text>
          </Form.Group>
          <Form.Group controlId='password'>
            <Form.Control
              value={password}
              required
              type='password'
              placeholder='Enter Password'
              onChange={(e) => setPassword(e.target.value)}
            ></Form.Control>
            <Form.Control.Feedback type='invalid'>
              {passwordMessage}
            </Form.Control.Feedback>
            <Form.Text
              as={Link}
              to='/forgotpassword'
              style={{ color: 'white' }}
            >
              Forgot Password?
            </Form.Text>
          </Form.Group>

          <Button type='submit' className='btn-block'>
            Sign-In
          </Button>
          <Row className='py-3'>
            <Col className='text-center'>
              Or {/* <Link style={{ textDecoration: 'none' }} to='/otp'> */}
              <Button
                className='btn-block'
                id='login-otp'
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
  );
};

export default LoginScreenByPhone;
