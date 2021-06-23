import React, { useState, useEffect } from 'react';
import FormContainer from '../components/FormContainer';
import { Form, Button, Card } from 'react-bootstrap';
import { forgotPassword } from '../actions/userActions';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ForgotPasswordScreen = ({ history }) => {
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userPasswordReset = useSelector((state) => state.userPasswordReset);
  const { loading, success: linkSentSuccess, error } = userPasswordReset;

  if (userInfo) {
    history.push('/');
  }

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
  };

  useEffect(() => {
    if (linkSentSuccess) {
      setMessage(
        'We have sent you a link on your email address to reset your password'
      );
    }
  }, [linkSentSuccess]);

  return (
    <FormContainer>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        message && <Message variant='success'>{message}</Message>
      )}

      <Card>
        <Card.Header>Forgot your password</Card.Header>
        <Card.Body>
          <Form onSubmit={submitHandler}>
            <Form.Group>
              <Form.Label>
                Please enter the email address to reset your password
              </Form.Label>
              <Form.Control
                required
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              ></Form.Control>
            </Form.Group>
            <Button type='submit' className='btn-block'>
              Submit
            </Button>
          </Form>
        </Card.Body>
        <Card.Footer className='text-center'>
          <Link to='/login'>
            <span className='text-center'>Back To Login</span>
          </Link>
        </Card.Footer>
      </Card>
    </FormContainer>
  );
};

export default ForgotPasswordScreen;
