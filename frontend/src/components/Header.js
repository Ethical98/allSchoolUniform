import React, { useEffect, useState, useRef } from 'react';
import jsonwebtoken from 'jsonwebtoken';
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
} from 'react-bootstrap';
import url from './asu-top-logo.png';
import './css/Header.css';
import { logout } from '../actions/userActions';
import urlimage from '../seamlessschool-bg.png';

const Header = () => {
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

  const qty = cartItems && cartItems.reduce((acc, item) => acc + item.qty, 0);

  const logoutHandler = () => {
    dispatch(logout());
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
        <Container>
          <LinkContainer to='/'>
            <Navbar.Brand>
              <Image src={url} className='logo'></Image>
            </Navbar.Brand>
          </LinkContainer>

          <Navbar.Text
            className='me-auto header-text'
            style={{ color: 'white' }}
          >
            Call us on : (011) 49188800
          </Navbar.Text>

          <Nav>
            <LinkContainer to='/offers'>
              <Nav.Link>
                <Button variant='outline-light' size='sm'>
                  OFFERS
                </Button>
              </Nav.Link>
            </LinkContainer>
            <LinkContainer to='/track'>
              <Nav.Link>
                <i className='fas fa-truck' />{' '}
                <span className='header-text'>TRACK YOUR ORDER</span>
              </Nav.Link>
            </LinkContainer>
            <LinkContainer to='/cart'>
              <Nav.Link>
                <i className='fas fa-shopping-cart'></i>{' '}
                <span className='header-text'>CART</span>
                {qty > 0 && (
                  <Badge
                    pill
                    className='cart-qty primary btn-outline-dark'
                    bg='primary'
                  >
                    {qty}
                  </Badge>
                )}
              </Nav.Link>
            </LinkContainer>
            {userInfo ? (
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
            ) : (
              <LinkContainer to='/login'>
                <Nav.Link>
                  <i className='fas fa-user'></i>{' '}
                  <span className='header-text'>SIGN IN</span>
                </Nav.Link>
              </LinkContainer>
            )}
            {/* {userInfo && userInfo.isAdmin && (
              <NavDropdown title='Admin' id='adminmenu'>
                <LinkContainer to='/admin/dashboard'>
                  <NavDropdown.Item>Dashboard</NavDropdown.Item>
                </LinkContainer>
                <LinkContainer to='/admin/userlist'>
                  <NavDropdown.Item>Users</NavDropdown.Item>
                </LinkContainer>
                <LinkContainer to='/admin/productList'>
                  <NavDropdown.Item>Products</NavDropdown.Item>
                </LinkContainer>
                <LinkContainer to='/admin/orderList'>
                  <NavDropdown.Item>Orders</NavDropdown.Item>
                </LinkContainer>
              </NavDropdown>
            )} */}
          </Nav>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
