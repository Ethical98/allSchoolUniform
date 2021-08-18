import React, { useState } from 'react';
import { Button, Offcanvas } from 'react-bootstrap';
import { logout } from '../actions/userActions';
import { useDispatch } from 'react-redux';
import './css/OffCanvas.css';

const OffCanvas = ({
  handleOffCanvasClose,
  showOffCanvas,
  userInfo,
  handleShow,
}) => {
  const dispatch = useDispatch();
  return (
    <div>
      <Offcanvas
        className='d-block d-sm-none'
        show={showOffCanvas}
        onHide={handleOffCanvasClose}
        style={{ width: '250px', height: '100vh' }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            {userInfo ? (
              userInfo.name
            ) : (
              <a href='/login'>
                <i className='fas fa-user'></i> SIGN IN
              </a>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ul>
            {userInfo && userInfo.isAdmin && (
              <li>
                {' '}
                <a href='/admin/dashboard'>DashBoard </a>
              </li>
            )}
            <li>
              <a href='/'>Home </a>
            </li>
            <li>
              <a href='/offers'>Offers </a>
            </li>
            <li>
              <a href='#'>
                <span onClick={handleShow}>Track Your Order</span>
              </a>
            </li>
            <li>
              <a href='/profile'>Account</a>
            </li>
            {userInfo && (
              <li>
                <a href='#'>
                  <span
                    onClick={() => {
                      handleOffCanvasClose();
                      dispatch(logout());
                    }}
                  >
                    Log Out <i className='fas fa-sign-out-alt'></i>
                  </span>
                </a>
              </li>
            )}
          </ul>
          <hr className='divider'></hr>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default OffCanvas;
