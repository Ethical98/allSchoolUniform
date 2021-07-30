import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ListProductDetails } from '../actions/productActions';
import jsonwebtoken from 'jsonwebtoken';
import {
  Row,
  Col,
  Image,
  ListGroup,
  Card,
  Button,
  Form,
} from 'react-bootstrap';
import Rating from '../components/Rating';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { logout } from '../actions/userActions';

const ProductDescriptionScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1);
  const [index, setIndex] = useState(0);
  const [productPrice, setProductPrice] = useState(0);
  const [countInStock, setCountInStock] = useState(0);
  const dispatch = useDispatch();

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  useEffect(() => {
    if (product && product.size) {
      setProductPrice(product.size[index].price);
      setCountInStock(product.size[index].countInStock);
    }
  }, [product, index]);

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
    dispatch(ListProductDetails(match.params.id));
  }, [dispatch, match]);

  const addToCartHandler = () => {
    history.push(`/cart/${product._id}?q=${qty}?i=${index}`);
  };

  const handleSizeChange = (val) => {
    setIndex(product.size.findIndex((x) => x.size === val));
  };

  return (
    <>
      <Link className='btn btn-outline-dark my-3' to='/products'>
        Go Back
      </Link>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <Row>
          <Col md={4}>
            <Image src={product.image} alt={product.name} fluid />
          </Col>
          <Col md={4}>
            <Card>
              <ListGroup variant='flush'>
                <ListGroup.Item>
                  <h6>{product.name}</h6>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Rating
                    value={product.rating}
                    text={`${product.numReviews} reviews`}
                  />
                </ListGroup.Item>
                <ListGroup.Item>Price: ₹{productPrice}</ListGroup.Item>
                <ListGroup.Item>
                  Description: {product.description}
                </ListGroup.Item>
                <ListGroup.Item>
                  Delivery & Returns:
                  <br />
                  Delivery within 24 Hrs. in Delhi/NCR <br />
                  3-4 Days for delivery in other states
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <ListGroup variant='flush'>
                <ListGroup.Item>
                  <Row>
                    <Col>Price:</Col>
                    <Col>
                      <strong>₹{productPrice}</strong>
                    </Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Status:</Col>
                    <Col>{countInStock > 0 ? 'In Stock' : 'Out of Stock'}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>SIZE</Col>
                    <Col>
                      <Form.Select
                        onChange={(e) => handleSizeChange(e.target.value)}
                      >
                        <option>Size</option>
                        {product.size &&
                          product.size.map((x) => {
                            return (
                              <option key={x._id} value={x.size}>
                                {x.size}
                              </option>
                            );
                          })}
                      </Form.Select>
                    </Col>
                  </Row>
                </ListGroup.Item>
                {countInStock > 0 && (
                  <ListGroup.Item>
                    <Row>
                      <Col>QTY</Col>
                      <Col>
                        <Form.Select
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                        >
                          {[...Array(countInStock).keys()].map((x) => (
                            <option key={x + 1} value={x + 1}>
                              {x + 1}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                )}

                <ListGroup.Item>
                  <Button variant='outline-info' className='col-12'>
                    Size Guide
                  </Button>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Button
                    variant='dark'
                    onClick={addToCartHandler}
                    className='col-12'
                    type='button'
                    disabled={countInStock === 0}
                  >
                    Add To Cart
                  </Button>
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default ProductDescriptionScreen;
