import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearResetPasswordRequest,
  resetPassword,
} from '../actions/userActions';
import { Link } from 'react-router-dom';
import { Card, Button, Form, FloatingLabel, InputGroup } from 'react-bootstrap';
import FormContainer from '../components/FormContainer';
import Message from '../components/Message';
import Loader from '../components/Loader';

const ResetPasswordScreen = ({ history }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState();
  const [password, setPassword] = useState();
  const [confirmPassword, setConfirmPassword] = useState();

  const userPasswordReset = useSelector((state) => state.userPasswordReset);
  const { email } = userPasswordReset;

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const { loading, success: passwordUpdated, error } = userUpdateProfile;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  if (!email) {
    history.push('/login');
  }

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      dispatch(resetPassword(password, email));
    }
  };
  useEffect(() => {
    if (passwordUpdated) {
      if (userInfo) {
        history.push('/');
        dispatch(clearResetPasswordRequest());
      }
    }
  }, [passwordUpdated, history, userInfo, dispatch]);
  return (
    <FormContainer>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        message && <Message variant='danger'>{message}</Message>
      )}

      <Card>
        <Card.Header>
          Reset Password for <span className='text-warning'>{email}</span>
        </Card.Header>

        <Card.Body>
          <Form onSubmit={submitHandler}>
            <InputGroup className='mb-3'>
              <InputGroup.Text>
                <i className='fas fa-lock'></i>
              </InputGroup.Text>

              <FloatingLabel label='New Password' style={{ width: '90%' }}>
                <Form.Control
                  required
                  placeholder='New Password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
            </InputGroup>
            <InputGroup className='mb-3'>
              <InputGroup.Text>
                <i className='fas fa-lock'></i>
              </InputGroup.Text>

              <FloatingLabel label='Confirm Password' style={{ width: '90%' }}>
                <Form.Control
                  required
                  placeholder='Confirm Password'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
            </InputGroup>
            <Button type='submit' variant='success' className='col-12'>
              Reset Password
            </Button>
          </Form>
        </Card.Body>
        <Card.Footer className='text-center'>
          <Link to='/login'>
            <span className='btn btn-outline-dark'>Back To Login</span>
          </Link>
        </Card.Footer>
      </Card>
    </FormContainer>
  );
};

export default ResetPasswordScreen;
