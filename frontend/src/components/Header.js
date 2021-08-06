import React, { useEffect, useState, useRef } from 'react';
import jsonwebtoken from 'jsonwebtoken';
import { Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Container,
  Navbar,
  Nav,
  Button,
  Image,
  NavDropdown,
  Badge,
  Modal,
  Form,
  Row,
  FloatingLabel,
  Col,
} from 'react-bootstrap';
import url from './asu-top-logo.png';
import './css/Header.css';
import { logout } from '../actions/userActions';
import urlimage from '../seamlessschool-bg.png';
import SearchBox from './SearchBox';

const Header = ({ location }) => {
  const [show, setShow] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [validated, setValidated] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => {
    setOrderId('');
    setShow(true);
    setValidated(false);
  };
  // const headerRef = useRef();
  // const resizeHeaderOnScroll = () => {
  //   const curr = headerRef.current;
  //   console.log(headerRef.current.classList);

  //   const distanceY = window.pageYOffset || document.documentElement.scrollTop,
  //     shrinkOn = 200;

  //   if (distanceY > shrinkOn) {
  //     curr.classList.add('bg-primary');
  //     console.log('hello');
  //   } else {
  //     curr.classList.remove('bg-light');
  //     // headerEl.classList.remove('smaller');
  //   }
  // };

  // window.addEventListener('scroll', resizeHeaderOnScroll);
  const [user, setUser] = useState({});
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    if (userInfo && userInfo.token) {
      jsonwebtoken.verify(
        userInfo.token,
        process.env.REACT_APP_JWT_SECRET,
        (err, decoded) => {
          if (err) {
            dispatch(logout());
          } else {
            setUser(decoded);
          }
        }
      );
    }
  }, [dispatch, userInfo]);

  const qty =
    cartItems && cartItems.reduce((acc, item) => acc + Number(item.qty), 0);

  const logoutHandler = () => {
    dispatch(logout());
  };

  const trackOrderHandler = (e) => {
    const form = e.currentTarget;
    e.preventDefault();

    if (form.checkValidity() === false) {
      e.preventDefault();
      setMessage('Please Enter Order Id');

      e.stopPropagation();
    }

    setValidated(true);
  };

  return (
    <header className='header'>
      <Navbar
        variant='dark'
        fixed='top'
        style={{
          background: `#2c4a77 url(${urlimage})`,
          borderBottom: '2px solid #ff6a00',
          color: '#93c0e0',
        }}
      >
        <Modal
          show={show}
          onHide={handleClose}
          backdrop='static'
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>Track Your Order</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form noValidate validated={validated} onSubmit={trackOrderHandler}>
              <FloatingLabel label='Order Id' className='mb-3'>
                <Form.Control
                  required
                  className='mb-3'
                  placeholder='Order Id'
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                ></Form.Control>
                <Form.Control.Feedback type='invalid'>
                  {message}
                </Form.Control.Feedback>
              </FloatingLabel>
              <LinkContainer to={`/track/${orderId}`}>
                <Button
                  disabled={orderId.length < 16}
                  className='float-end'
                  type='submit'
                  variant='outline-dark'
                  onClick={handleClose}
                >
                  Track
                </Button>
              </LinkContainer>
            </Form>
          </Modal.Body>
        </Modal>
        <Container>
          <LinkContainer to='/'>
            <Navbar.Brand>
              <Row>
                <Image src={url} className='logo'></Image>
              </Row>
              <Row>
                <span
                  className='text-center'
                  style={{ color: 'white', fontSize: '0.7rem' }}
                >
                  <i className='fas fa-phone-square-alt mx-1' />
                  (011) 49188800
                </span>
              </Row>
            </Navbar.Brand>
          </LinkContainer>

          <Nav className='d-none d-sm-block'>
            <Route render={({ history }) => <SearchBox history={history} />} />
          </Nav>
          <Row>
            <Nav>
              <LinkContainer to='/offers'>
                <Nav.Link>
                  <Button variant='outline-light' size='sm'>
                    OFFERS
                  </Button>
                </Nav.Link>
              </LinkContainer>

              <Nav.Link onClick={handleShow}>
                <i className='fas fa-truck' />{' '}
                <span className='header-text'>TRACK YOUR ORDER</span>
              </Nav.Link>

              <LinkContainer to='/cart'>
                <Nav.Link>
                  <i className='fas fa-shopping-cart'></i>{' '}
                  <span className='header-text cart'>CART</span>
                  {qty > 0 && (
                    <Badge pill className='cart-qty'>
                      {qty}
                    </Badge>
                  )}
                </Nav.Link>
              </LinkContainer>
              {userInfo ? (
                <>
                  <NavDropdown title={user.name} id='username'>
                    {userInfo && userInfo.isAdmin && (
                      <LinkContainer to='/admin/dashboard'>
                        <NavDropdown.Item>Dashboard</NavDropdown.Item>
                      </LinkContainer>
                    )}
                    <LinkContainer to='/profile'>
                      <NavDropdown.Item>Profile</NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Item onClick={logoutHandler}>
                      Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <LinkContainer to='/login'>
                  <Nav.Link>
                    <i className='fas fa-user'></i>{' '}
                    <span className='header-text'>SIGN IN</span>
                  </Nav.Link>
                </LinkContainer>
              )}
            </Nav>
          </Row>
        </Container>
      </Navbar>

      {!(window.location.pathname === '/') && (
        <Nav
          className='d-block d-sm-none'
          style={{
            background: `#2c4a77 url(${urlimage})`,
            borderBottom: '2px solid #ff6a00',

            color: '#93c0e0',
            marginTop: '17%',
            height: '60px',
            padding: '2%',
          }}
        >
          <Route render={({ history }) => <SearchBox history={history} />} />
        </Nav>
      )}
    </header>
  );
};

export default Header;
