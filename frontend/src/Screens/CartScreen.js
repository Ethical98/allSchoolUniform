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
import {
  addToCart,
  removeFromCart,
  getCartFromDatabase,
} from '../actions/cartActions';
import { logout } from '../actions/userActions';
// import { LinkContainer } from 'react-router-bootstrap';

const CartScreen = ({ match, location, history }) => {
  const productId = match.params.id;

  // const [customQty, setCustomQty] = useState(false);
  // const [customId, setCustomId] = useState('');
  // const [changedQty, setChangedQty] = useState('');

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
    // eslint-disable-next-line
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
  // const handleCustomQty = (id, q) => {
  //   console.log('Hello');
  //   setCustomId(id);
  //   setChangedQty(q);
  //   setCustomQty(true);
  // };
  return (
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
                        <Image src={item.image} alt={item.name} fluid rounded />
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
                      <Col xs={2}>₹{item.price}</Col>
                      <Col xs={2}>
                        {/* {item.qty > 10 && !customQty ? (
                          <InputGroup size='sm'>
                            <Form.Control
                              value={item.qty}
                              onChange={(e) => setChangedQty(e.target.value)}
                            />
                            <InputGroup.Text
                              onClick={() =>
                                handleCustomQty(item.product, item.qty)
                              }
                            >
                              <i className='fas fa-edit' />
                            </InputGroup.Text>
                          </InputGroup>
                        ) : !(customId === item.product) ? ( */}
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
                          {/* <span
                              style={{ fontSize: '0.7rem' }}
                              onClick={() =>
                                handleCustomQty(item.product, item.qty)
                              }
                            >
                              Custom Qty?
                            </span> */}
                        </FloatingLabel>
                        {/* ) : (
                        <InputGroup size='sm'>
                          <Form.Control
                            value={changedQty || item.qty}
                            onChange={(e) => setChangedQty(e.target.value)}
                          />
                          <InputGroup.Text
                            onClick={() =>
                              changedQty &&
                              dispatch(
                                addToCart(
                                  item.product,
                                  item.index,
                                  Number(changedQty)
                                )
                              )
                            }
                          >
                            <i className='fas fa-check' />
                          </InputGroup.Text>
                          <p onClick={() => setCustomId('')}>Cancel?</p>
                        </InputGroup>
                        )} */}
                      </Col>
                      <Col xs={2}>
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
                  .reduce((acc, item) => acc + item.qty * item.price, 0)
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
  );
};

export default CartScreen;
