import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';
import FormContainer from '../components/FormContainer';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, loginByOTP, getOtp } from '../actions/userActions';
import Loader from '../components/Loader';
import Message from '../components/Message';

const LoginScreenOtp = ({ history }) => {
  const [OTP, setOTP] = useState('');
  const dispatch = useDispatch();

  const phoneInfo = useSelector((state) => state.userOtpVerification);
  const { phone, verified, error, loading, id, message } = phoneInfo;

  const requestId = id;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const userError = userLogin.error;
  const userLoading = userLogin.loading;

  useEffect(() => {
    if (verified) {
      dispatch(loginByOTP(phone));
      if (userInfo) {
        history.push('/products');
      }
    }
  }, [userInfo, history, verified, dispatch, phone]);

  const resendOtpHandler = () => {
    dispatch(getOtp(phone));
  };
  const submitHandler = (e) => {
    e.preventDefault();

    dispatch(verifyOtp(requestId, OTP, phone));
  };

  return (
    <FormContainer>
      {userLoading && <Loader />}
      {userError && <Message variant='danger'>{userError}</Message>}
      {error && <Message variant='danger'>{error}</Message>}
      {message && <Message variant='danger'>{message}</Message>}

      {!phone ? (
        <Loader />
      ) : (
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
          <Form.Text className='text-center pt-3' onClick={resendOtpHandler}>
            Resend OTP
          </Form.Text>
          <Form.Text className='text-center pt-3'>Or</Form.Text>
          <Link to='/login'>
            <Button className='btn-block'>Sign-In with your password</Button>
          </Link>
        </Form>
      )}
    </FormContainer>
  );
};

export default LoginScreenOtp;
