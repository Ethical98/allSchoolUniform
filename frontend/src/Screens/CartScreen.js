import React, { useEffect } from 'react';
import jsonwebtoken from 'jsonwebtoken';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Row,
  Col,
  ListGroup,
  Image,
  Form,
  Button,
  Card,
} from 'react-bootstrap';
import Message from '../components/Message';
import {
  addToCart,
  removeFromCart,
  getCartFromDatabase,
} from '../actions/cartActions';
import { logout } from '../actions/userActions';

const CartScreen = ({ match, location, history }) => {
  const productId = match.params.id;

  const qty = location.search
    ? Number(location.search.split('q=')[1].split('?')[0])
    : 1;
  const index = location.search ? Number(location.search.split('i=')[1]) : 1;

  const dispatch = useDispatch();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    if (userInfo && userInfo.token) {
      dispatch(getCartFromDatabase());
    }
  }, [dispatch, userInfo]);

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

  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  useEffect(() => {
    if (productId) {
      console.log(productId, index, qty);
      dispatch(addToCart(productId, index, qty));
    }
  }, [dispatch, productId, qty, index]);

  const checkOutHandler = () => {
    if (userInfo && userInfo.token) {
      history.push('/shipping');
    } else {
      history.push('/login?redirect=shipping');
    }
  };

  const removeFromCartHandler = (id) => {
    dispatch(removeFromCart(id));
  };

  return (
    <Row>
      <Col md={8}>
        <h1>SHOPPING CART</h1>
        {cartItems && cartItems.length === 0 ? (
          <Message>
            Your Cart is Empty <Link to='/products'> Go Back</Link>
          </Message>
        ) : (
          <ListGroup variant='flush'>
            {cartItems &&
              cartItems.map((item) => (
                <ListGroup.Item key={item._id}>
                  <Row>
                    <Col md={2}>
                      <Image src={item.image} alt={item.name} fluid rounded />
                    </Col>
                    <Col md={2}>
                      <Link to={`/products/${item.product}`}>{item.name}</Link>
                    </Col>
                    <Col md={2}>Size: {item.size}</Col>
                    <Col md={2}>₹{item.price}</Col>
                    <Col md={2}>
                      <Form.Control
                        as='select'
                        value={item.qty}
                        onChange={(e) =>
                          dispatch(
                            addToCart(
                              item.product,
                              item.index,
                              Number(e.target.value)
                            )
                          )
                        }
                      >
                        {[...Array(item.countInStock).keys()].map((x) => (
                          <option key={x + 1} value={x + 1}>
                            {x + 1}
                          </option>
                        ))}
                      </Form.Control>
                    </Col>
                    <Col md={2}>
                      <Button
                        type='button'
                        variant='light'
                        onClick={() => removeFromCartHandler(item._id)}
                      >
                        <i className='fas fa-trash'></i>
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
          </ListGroup>
        )}
      </Col>
      <Col md={4}>
        <Card>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>
                Subtotal (
                {cartItems &&
                  cartItems.reduce((acc, item) => acc + item.qty, 0)}
                ) Items
              </h2>
              ₹
              {cartItems &&
                cartItems
                  .reduce((acc, item) => acc + item.qty * item.price, 0)
                  .toFixed(2)}
            </ListGroup.Item>
            <ListGroup.Item>
              <Button
                type='button'
                className='btn-block'
                disabled={cartItems.length === 0}
                onClick={checkOutHandler}
              >
                Proceed To Checkout
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
    </Row>
  );
};

export default CartScreen;
