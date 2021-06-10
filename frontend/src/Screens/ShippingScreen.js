import React, { useEffect, useState } from 'react';
import jsonwebtoken from 'jsonwebtoken';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { Button, Form, ListGroup } from 'react-bootstrap';
import {
  saveShippingAddress,
  saveShippingAddressDatabase,
  getSavedAddress,
} from '../actions/cartActions';
import { logout } from '../actions/userActions';
import CheckoutSteps from '../components/CheckoutSteps';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ShippingScreen = ({ history }) => {
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart);
  const { shippingAddress, cartItems, savedAddress, loading, error } = cart;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const [newAddress, setNewAddress] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    }
  }, [history, userInfo]);

  useEffect(() => {
    if (userInfo && userInfo.token) {
      jsonwebtoken.verify(
        userInfo.token,
        process.env.REACT_APP_JWT_SECRET,
        (err, decoded) => {
          if (err) {
            dispatch(logout());
            history.push('/login');
          }
        }
      );
    }
  }, [dispatch, userInfo, history]);

  useEffect(() => {
    if (cartItems.length === 0) {
      history.push('/products');
    }
  }, [history, cartItems]);

  useEffect(() => {
    dispatch(getSavedAddress());
  }, [dispatch]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(saveShippingAddress({ address, city, postalCode, country }));
    history.push('/payment');
  };
  const shippingAddressSave = (e) => {
    e.preventDefault();
    dispatch(saveShippingAddress({ address, city, postalCode, country }));
    dispatch(
      saveShippingAddressDatabase({ address, city, postalCode, country })
    );
    history.push('/payment');
  };

  const handleNewAddress = () => {
    setNewAddress(true);
    console.log(newAddress);
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 />
      <h1>SHIPPING</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : newAddress ? (
        <Form onSubmit={shippingAddressSave}>
          <Form.Group>
            <Form.Label>Address</Form.Label>
            <Form.Control
              required
              type='text'
              placeholder='Enter Address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>City</Form.Label>
            <Form.Control
              required
              type='text'
              placeholder='Enter City'
              value={city}
              onChange={(e) => setCity(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Postal Code</Form.Label>
            <Form.Control
              required
              type='text'
              placeholder='Enter Postal Code'
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Country</Form.Label>
            <Form.Control
              required
              type='text'
              placeholder='Enter Country'
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Button type='submit' variant='primary'>
            Continue
          </Button>
        </Form>
      ) : savedAddress && savedAddress.length !== 0 ? (
        <>
          <Form onSubmit={submitHandler}>
            <Form.Group>
              <ListGroup>
                {savedAddress &&
                  savedAddress.map((x) => {
                    const label =
                      x.address +
                      ' ' +
                      x.city +
                      ' ' +
                      x.postalCode +
                      ' ' +
                      x.country;
                    return (
                      <ListGroup.Item key={x._id}>
                        <Form.Check
                          required
                          name='Shipping'
                          type='radio'
                          label={label}
                          id={x._id}
                          onChange={() => {
                            setAddress(x.address);
                            setCity(x.city);
                            setPostalCode(x.postalCode);
                            setCountry(x.country);
                          }}
                        ></Form.Check>
                      </ListGroup.Item>
                    );
                  })}
              </ListGroup>
            </Form.Group>
            <Button variant='primary' type='submit'>
              Continue
            </Button>
          </Form>
          <Button
            variant='warning'
            className='mt-3'
            size={'sm'}
            onClick={handleNewAddress}
          >
            Add New Address
          </Button>
        </>
      ) : (
        <Form onSubmit={shippingAddressSave}>
          <Form.Group>
            <Form.Label>Address</Form.Label>
            <Form.Control
              required
              type='text'
              placeholder='Enter Address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>City</Form.Label>
            <Form.Control
              required
              type='text'
              placeholder='Enter City'
              value={city}
              onChange={(e) => setCity(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Postal Code</Form.Label>
            <Form.Control
              required
              type='text'
              placeholder='Enter Postal Code'
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Country</Form.Label>
            <Form.Control
              required
              type='text'
              placeholder='Enter Country'
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Button type='submit' variant='primary'>
            Continue
          </Button>
        </Form>
      )}
    </FormContainer>
  );
};

export default ShippingScreen;
