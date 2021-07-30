import React from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import './css/CheckoutSteps.css';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  return (
    <div className='wrapper'>
      <Nav
        className='justify-content-center mb-4 checkout-steps'
        style={{ fontSize: '0.8rem' }}
      >
        <Nav.Item>
          {step1 ? (
            <LinkContainer to='/login'>
              <Nav.Link className='active-link'>Sign In </Nav.Link>
            </LinkContainer>
          ) : (
            <Nav.Link className='disabled-link' disabled>
              Sign In
            </Nav.Link>
          )}
        </Nav.Item>

        <Nav.Item>
          {step2 ? (
            <LinkContainer to='/shipping'>
              <Nav.Link className='active-link'>Shipping</Nav.Link>
            </LinkContainer>
          ) : (
            <Nav.Link className='disabled-link'>Shipping</Nav.Link>
          )}
        </Nav.Item>
        <Nav.Item>
          {step3 ? (
            <LinkContainer to='/payment'>
              <Nav.Link className='active-link'>Payment</Nav.Link>
            </LinkContainer>
          ) : (
            <Nav.Link className='disabled-link' disabled>
              Payment
            </Nav.Link>
          )}
        </Nav.Item>
        <Nav.Item>
          {step4 ? (
            <LinkContainer to='/placeorder'>
              <Nav.Link className='active-link'>Place Order</Nav.Link>
            </LinkContainer>
          ) : (
            <Nav.Link className='disabled-link' disabled>
              Place Order
            </Nav.Link>
          )}
        </Nav.Item>
        <div class='clear'></div>
      </Nav>
    </div>
  );
};

export default CheckoutSteps;
