import React, { useEffect, useState } from 'react';
import jsonwebtoken from 'jsonwebtoken';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import { Container, Navbar, Nav, Button, Image, NavDropdown, Badge, Form, Row, FloatingLabel } from 'react-bootstrap';

import './css/Header.css';
import { logout } from '../actions/userActions';
import urlimage from '../seamlessschool-bg.png';
import SearchBox from './SearchBox';
import OffCanvas from './OffCanvas';
import DialogBox from './DialogBox';
import { useLocation } from 'react-router-dom';
import useWindowDimensions from '../utils/useWindowDimensions';
import HeaderSmall from './HeaderSmall';

const Header = () => {
    const location = useLocation();

    const { width } = useWindowDimensions();
    const [show, setShow] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [message, setMessage] = useState('');
    const [validated, setValidated] = useState(false);

    const [showOffCanvas, setShowOffCanvas] = useState(false);

    const handleOffCanvasClose = () => setShowOffCanvas(false);
    const handleOffCanvasShow = () => setShowOffCanvas(true);

    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShowOffCanvas(false);
        setOrderId('');
        setShow(true);
        setValidated(false);
    };

    const [user, setUser] = useState({});
    const dispatch = useDispatch();
    const cart = useSelector((state) => state.cart);
    const { cartItems } = cart;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    useEffect(() => {
        if (userInfo && userInfo.token) {
            jsonwebtoken.verify(userInfo.token, process.env.REACT_APP_JWT_SECRET, (err, decoded) => {
                if (err) {
                    dispatch(logout());
                } else {
                    setUser(decoded);
                }
            });
        }
    }, [dispatch, userInfo]);

    const qty = cartItems && cartItems.reduce((acc, item) => acc + Number(item.qty), 0);

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

    const TrackButton = () => (
        <LinkContainer to={`/track/${orderId}`}>
            <Button
                disabled={orderId.length < 16}
                className="float-end"
                type="submit"
                variant="outline-dark"
                onClick={handleClose}
            >
                Track
            </Button>
        </LinkContainer>
    );

    return (
        <>
            {width < 575.98 ? (
                <HeaderSmall />
            ) : (
                <>
                    <OffCanvas
                        showOffCanvas={showOffCanvas}
                        handleOffCanvasClose={handleOffCanvasClose}
                        userInfo={userInfo}
                        handleShow={handleShow}
                    >
                        <ul>
                            {userInfo && userInfo.isAdmin && (
                                <li>
                                    <a href="/admin/dashboard">DashBoard </a>
                                </li>
                            )}
                            {userInfo && userInfo.isAdmin && (
                                <li>
                                    <a href="/newCustomerByAdmin">Add New Customer</a>
                                </li>
                            )}
                            <li>
                                <a href="/">Home </a>
                            </li>
                            <li>
                                <a href="/offers">Offers </a>
                            </li>
                            <li>
                                <a href="/#">
                                    <span onClick={handleShow}>Track Your Order</span>
                                </a>
                            </li>
                            <li>
                                <a href="/profile">Account</a>
                            </li>
                            {userInfo && (
                                <li>
                                    <a href="/#">
                                        <span
                                            onClick={() => {
                                                handleOffCanvasClose();
                                                dispatch(logout());
                                            }}
                                        >
                                            Log Out <i className="fas fa-sign-out-alt"></i>
                                        </span>
                                    </a>
                                </li>
                            )}
                        </ul>
                        <hr className="divider"></hr>
                    </OffCanvas>
                    <Navbar
                        variant="dark"
                        sticky="top"
                        style={{
                            background: `#2c4a77 url(${urlimage})`
                        }}
                    >
                        <DialogBox
                            show={show}
                            handleClose={handleClose}
                            handleShow={handleShow}
                            title="Track Your Order"
                            footer={<TrackButton />}
                        >
                            <Form noValidate validated={validated} onSubmit={trackOrderHandler}>
                                <FloatingLabel label="Order Id" className="mb-3">
                                    <Form.Control
                                        required
                                        className="mb-3"
                                        placeholder="Order Id"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                    ></Form.Control>
                                    <Form.Control.Feedback type="invalid">{message}</Form.Control.Feedback>
                                </FloatingLabel>
                            </Form>
                        </DialogBox>
                        <Button
                            variant="outline-light"
                            className="d-flex d-sm-none mx-1 px-2"
                            onClick={handleOffCanvasShow}
                        >
                            <i className="fas fa-bars"></i>
                        </Button>
                        <Container>
                            <LinkContainer to="/">
                                <Navbar.Brand>
                                    <Row>
                                        <Image src="/uploads/asu-top-logo.png" className="logo"></Image>
                                    </Row>
                                    <Row>
                                        <span
                                            className="text-center pt-1"
                                            style={{ color: 'white', fontSize: '0.7rem' }}
                                        >
                                            <i class="fa-solid fa-square-phone mx-1"></i>
                                            (011) 49188800
                                        </span>
                                    </Row>
                                </Navbar.Brand>
                            </LinkContainer>

                            {!(location.pathname === '/') && (
                                <Nav className="d-none d-sm-block">
                                    <SearchBox />
                                </Nav>
                            )}
                            <Row>
                                <Nav>
                                    <LinkContainer to="/offers">
                                        <Nav.Link>
                                            <Button className="d-none d-sm-block" variant="outline-light" size="sm">
                                                OFFERS
                                            </Button>
                                        </Nav.Link>
                                    </LinkContainer>
                                    {userInfo && userInfo.isAdmin && (
                                        <LinkContainer to="/newCustomerByAdmin">
                                            <Nav.Link>
                                                <i className="fas fa-plus" />
                                                <span className="mx-1">New Customer</span>
                                            </Nav.Link>
                                        </LinkContainer>
                                    )}

                                    <Nav.Link onClick={handleShow} className="d-none d-sm-block">
                                        <i className="fas fa-truck" />{' '}
                                        <span className="header-text">TRACK YOUR ORDER</span>
                                    </Nav.Link>

                                    <LinkContainer to="/cart">
                                        <Nav.Link>
                                            <div className="cart-link">
                                                <i className="fas fa-shopping-cart"></i>{' '}
                                                <span className="header-text cart">CART</span>
                                                {qty > 0 && (
                                                    <Badge pill className="cart-qty">
                                                        {qty}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Nav.Link>
                                    </LinkContainer>
                                    {userInfo ? (
                                        <>
                                            <NavDropdown title={user.name} id="username" className="d-none d-sm-block">
                                                {userInfo && userInfo.isAdmin && (
                                                    <LinkContainer to="/admin/dashboard">
                                                        <NavDropdown.Item>Dashboard</NavDropdown.Item>
                                                    </LinkContainer>
                                                )}
                                                <LinkContainer to="/profile">
                                                    <NavDropdown.Item>Profile</NavDropdown.Item>
                                                </LinkContainer>
                                                <NavDropdown.Item onClick={logoutHandler}>
                                                    Logout <i className="fas fa-sign-out-alt"></i>
                                                </NavDropdown.Item>
                                            </NavDropdown>
                                            <LinkContainer to="/profile">
                                                <Nav.Link className="d-sm-none">{userInfo.name}</Nav.Link>
                                            </LinkContainer>
                                        </>
                                    ) : (
                                        <LinkContainer to="/login">
                                            <Nav.Link>
                                                <i className="fas fa-user"></i> <span>SIGN IN</span>
                                            </Nav.Link>
                                        </LinkContainer>
                                    )}
                                </Nav>
                            </Row>
                        </Container>
                    </Navbar>

                    {/* {location.pathname.includes('products') && (
        <div
          className='d-sm-none search-smallscreen'
          style={{
            background: `#2c4a77 url(${urlimage})`,

          }}
        >
          <Nav>
            <Route render={({ history }) => <SearchBox history={history} />} />
          </Nav>
        </div>
      )} */}
                </>
            )}
        </>
    );
};

export default Header;
