import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';
import FormContainer from '../components/FormContainer';
import { useDispatch, useSelector } from 'react-redux';
import {
  submitOTP,
  loginByOTP,
  getOTP,
  resetOtp,
  cancelOtpRequest,
  configureCaptcha,
} from '../actions/userActions';
import Loader from '../components/Loader';
import Message from '../components/Message';

const LoginScreenOtp = ({ history }) => {
  const [OTP, setOTP] = useState('');
  const dispatch = useDispatch();

  const phoneInfo = useSelector((state) => state.userOtpVerification);
  const { phone, loading, verified, error, sent } = phoneInfo;
  const phoneNumber = phone;

  const userLogin = useSelector((state) => state.userLogin);
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
    dispatch(getOTP(phone));
  };
  const submitHandler = (e) => {
    e.preventDefault();

    dispatch(submitOTP(OTP));
  };

  return (
    <FormContainer>
      {userLoading || loading ? (
        <Loader />
      ) : userError ? (
        <Message variant='danger'>{userError}</Message>
      ) : error ? (
        <Message variant='danger'>{error.code}</Message>
      ) : (
        sent && <Message variant='success'>OTP SENT</Message>
      )}
      {!phone ? (
        <Loader />
      ) : (
        <>
          <Form onSubmit={submitHandler}>
            <Form.Group>
              <Form.Label>Phone</Form.Label>

              <Form.Control value={phone} readOnly plaintext></Form.Control>
              <Link to='/login'>
                <Form.Text style={{ color: 'white', textDecoration: 'none' }}>
                  Change?
                </Form.Text>
              </Link>
              <Form.Text className='pt-3'>
                We’ve sent a One Time Password (OTP) to the mobile number above.
                Please enter it to complete verification
              </Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label>Enter OTP</Form.Label>

              <Form.Control
                value={OTP}
                placeholder='OTP'
                onChange={(e) => setOTP(e.target.value)}
              ></Form.Control>
            </Form.Group>
            <Button type='submit' className='btn-block'>
              Sign In
            </Button>
          </Form>
          <Form.Text
            className='text-center pt-3'
            id='resend-otp'
            onClick={resendOtpHandler}
          >
            Resend OTP
          </Form.Text>
          <Form.Text className='text-center pt-3'>Or</Form.Text>
          <Link to='/login'>
            <Button
              className='btn-block'
              onClick={() => dispatch(cancelOtpRequest(phone))}
            >
              Sign-In with your password
            </Button>
          </Link>
        </>
      )}
    </FormContainer>
  );
};

export default LoginScreenOtp;
