import React, { useEffect, useState } from 'react';
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
} from 'react-bootstrap';
import url from './asu-top-logo.png';
import './css/Header.css';
import { logout } from '../actions/userActions';

const Header = ({ history }) => {
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
  }, [dispatch, userInfo, history]);

  const qty = cartItems && cartItems.reduce((acc, item) => acc + item.qty, 0);

  const logoutHandler = () => {
    dispatch(logout());
  };
  return (
    <header>
      <Navbar bg='dark' variant='dark' fixed='top'>
        <Container>
          <LinkContainer to='/'>
            <Navbar.Brand>
              <Image src={url} className='logo'></Image>
            </Navbar.Brand>
          </LinkContainer>

          <Navbar.Text className='d-lg-block'>
            Call us on : (011) 49188800
          </Navbar.Text>

          <Nav className='ml-auto'>
            <LinkContainer to='/offers'>
              <Nav.Link>
                <Button variant='primary'>OFFERS</Button>
              </Nav.Link>
            </LinkContainer>
            <LinkContainer to='/track'>
              <Nav.Link>
                <i className='fas fa-truck'></i> <span>TRACK YOUR ORDER</span>
              </Nav.Link>
            </LinkContainer>
            <LinkContainer to='/cart'>
              <Nav.Link>
                <i className='fas fa-shopping-cart'></i> <span>CART</span>
                {qty > 0 && <span className='lblCartCount'>{qty}</span>}
              </Nav.Link>
            </LinkContainer>
            {userInfo ? (
              <NavDropdown title={user.name} id='username'>
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
                  <i className='fas fa-user'></i> <span>SIGN IN</span>
                </Nav.Link>
              </LinkContainer>
            )}
          </Nav>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
