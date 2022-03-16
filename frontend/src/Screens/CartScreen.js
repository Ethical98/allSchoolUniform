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
  FloatingLabel,
} from 'react-bootstrap';
import Message from '../components/Message';
import { addToCart, removeFromCart } from '../actions/cartActions';
import { logout } from '../actions/userActions';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const CartScreen = ({ match, location, history }) => {
  // const [customQty, setCustomQty] = useState(false);
  // const [customId, setCustomId] = useState('');
  // const [changedQty, setChangedQty] = useState('');

  const dispatch = useDispatch();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  // if (userInfo && userInfo.token) {
  //   dispatch(getCartFromDatabase());
  // }

  // useEffect(() => {
  //   if (userInfo && userInfo.token) {
  //     if (added) {
  //       dispatch(getCartFromDatabase());
  //     }
  //   }
  // }, [userInfo, dispatch, added]);
  // useEffect(() => {
  //   window.addEventListener('beforeunload', () => {
  //     dispatch(getCartFromDatabase());
  //   });
  // }, []);

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

  const checkOutHandler = () => {
    if (userInfo && userInfo.token) {
      history.push('/shipping');
    } else {
      history.push('/login?redirect=shipping');
    }
  };

  const removeFromCartHandler = (id, name) => {
    dispatch(removeFromCart(id, name));
  };

  const getDiscountedPrice = (price, disc) => {
    return price - price * (disc / 100);
  };

  return (
    <PageLayout>
      <Meta
        title={'Cart - AllschoolUniform'}
        description={'Build Your Cart'}
        keyword={
          'cheap,sell,buy,allschooluniform,new,buyback,unform,online,cart'
        }
      />
      <Row>
        <Col md={8} className='mb-3'>
          <Button variant='outline-dark' onClick={() => history.goBack()}>
            <i className='fas fa-arrow-left me-2' />
            CONTINUE SHOPPING
          </Button>
          <h1>SHOPPING CART</h1>
          {cartItems && cartItems.length === 0 ? (
            <Message>
              Your Cart is Empty <Link to='/products'> Go Back</Link>
            </Message>
          ) : (
            <Card rounded='true'>
              <ListGroup variant='flush'>
                {cartItems &&
                  cartItems.map((item) => (
                    <ListGroup.Item key={item._id}>
                      <Row className='g-2'>
                        <Col xs={2}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col xs={2}>
                          <Link
                            to={`/products/${item.name}`}
                            style={{ textDecoration: 'none', color: 'black' }}
                          >
                            {item.name}
                          </Link>
                        </Col>
                        <Col xs={2}>Size: {item.size}</Col>
                        <Col xs={2}>
                          ₹{getDiscountedPrice(item.price, item.disc)}
                        </Col>
                        <Col xs={2}>
                          <FloatingLabel label='QTY'>
                            <Form.Select
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
                            </Form.Select>
                          </FloatingLabel>
                        </Col>
                        <Col xs={2}>
                          <Button
                            type='button'
                            variant='light'
                            onClick={() =>
                              removeFromCartHandler(item._id, item.name)
                            }
                          >
                            <i className='fas fa-trash'></i>
                          </Button>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
              </ListGroup>
            </Card>
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
                    .reduce(
                      (acc, item) =>
                        acc +
                        item.qty * getDiscountedPrice(item.price, item.disc),
                      0
                    )
                    .toFixed(2)}
              </ListGroup.Item>
              <ListGroup.Item>
                <Button
                  variant='outline-success'
                  className='col-12'
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
    </PageLayout>
  );
};

export default CartScreen;
