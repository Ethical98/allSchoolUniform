import React, { useState, useEffect } from 'react';
import FormContainer from '../components/FormContainer';
import { Form, Button, Card, InputGroup } from 'react-bootstrap';
import { forgotPassword } from '../actions/userActions';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

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
    <PageLayout>
      <Meta
        title={'Forgot Password - AllSchoolUniform'}
        description={'Reset Password'}
        keyword={'forgot,rest,password,rest password,forgot password'}
      />
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
                  Please enter the email address to reset your password.
                </Form.Label>
                <InputGroup className='mb-3'>
                  <InputGroup.Text id='email'>
                    <i className='fas fa-envelope' />
                  </InputGroup.Text>
                  <Form.Control
                    required
                    type='email'
                    placeholder='Email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  ></Form.Control>
                </InputGroup>
              </Form.Group>
              <Button variant='info' type='submit' className='col-12'>
                Submit
              </Button>
            </Form>
          </Card.Body>
          <Card.Footer className='text-center'>
            <Link to='/login'>
              <span className=' btn btn-outline-dark text-center'>
                Back To Login
              </span>
            </Link>
          </Card.Footer>
        </Card>
      </FormContainer>
    </PageLayout>
  );
};

export default ForgotPasswordScreen;
