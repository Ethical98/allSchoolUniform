import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  listProductDetails,
  createProductReview,
} from '../actions/productActions';
import jsonwebtoken from 'jsonwebtoken';
import {
  Row,
  Col,
  Image,
  ListGroup,
  Card,
  Button,
  Form,
  FloatingLabel,
  OverlayTrigger,
  Tooltip,
  Toast,
  ToastContainer,
} from 'react-bootstrap';
import Rating from '../components/Rating';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { logout } from '../actions/userActions';
import { makeStyles } from '@material-ui/core/styles';
import { addToCart } from '../actions/cartActions';
import MaterialRating from '@material-ui/lab/Rating';
import Box from '@material-ui/core/Box';
import Meta from '../components/Meta';
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants';

const useStyles = makeStyles({
  root: {
    width: 200,
    display: 'flex',
    alignItems: 'center',
  },
});

const ProductDescriptionScreen = ({ history, match }) => {
  const labels = {
    0.5: 'Useless',
    1: 'Useless+',
    1.5: 'Poor',
    2: 'Poor+',
    2.5: 'Ok',
    3: 'Ok+',
    3.5: 'Good',
    4: 'Good+',
    4.5: 'Excellent',
    5: 'Excellent+',
  };

  const target = useRef(null);

  const [hover, setHover] = React.useState(-1);
  const classes = useStyles();
  const [qty, setQty] = useState(1);
  const [index, setIndex] = useState(0);
  const [productPrice, setProductPrice] = useState(0);
  const [countInStock, setCountInStock] = useState(0);
  const [productDisc, setProductDisc] = useState(0);

  const [show, setShow] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const dispatch = useDispatch();

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const productCreateReview = useSelector((state) => state.productCreateReview);
  const { error: errorProductReview, success: successProductReview } =
    productCreateReview;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    if (product && product.size) {
      setProductPrice(product.size[index].price);
      setCountInStock(product.size[index].countInStock);
      setProductDisc(product.size[index].discount);
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
    if (successProductReview) {
      alert('Review Submited!!');
      setRating(0);
      setComment('');
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET });
    }
    dispatch(listProductDetails(match.params.id));
  }, [dispatch, match, successProductReview]);

  const addToCartHandler = () => {
    dispatch(addToCart(product._id, index, qty));
    history.push(`/cart`);
  };

  const handleSizeChange = (val) => {
    setIndex(product.size.findIndex((x) => x.size === val));
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (rating === 0) {
      setShow(true);
    } else {
      dispatch(createProductReview(product._id, { rating, comment }));
    }
  };

  const renderTooltip = (props) => (
    <Tooltip id='button-tooltip' style={{ marginRight: '40%' }} {...props}>
      Please Fill the rating
    </Tooltip>
  );

  return (
    <>
      <Button
        variant='outline-dark'
        className='my-4'
        onClick={() => history.goBack()}
      >
        Go Back
      </Button>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <Meta
            title={`${product.name ? product.name : ''} - AllschoolUniform`}
            description={`${product.description}`}
            keyword={`${product.title}`}
          />
          <Row className='mb-5'>
            <Col md={4}>
              <Image src={product.image} alt={product.name} fluid />
            </Col>
            <Col md={4}>
              <Card
                style={{
                  fontSize: '0.86rem',
                  textAlign: 'justify',
                  textJustify: 'inter - word',
                }}
              >
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    <h6>{product.name}</h6>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Rating
                      value={product.rating ? product.rating : 5}
                      text={`${product.numReviews} reviews`}
                    />
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <div>
                      MRP: ₹
                      <span
                        style={{
                          textDecorationLine: 'line-through',
                          textDecorationStyle: 'solid',
                          color: 'red',
                        }}
                      >
                        {productPrice}
                      </span>
                      <span className='mx-1'>
                        {productPrice - productPrice * (productDisc / 100)}
                      </span>
                    </div>
                    <div>
                      Price: ₹
                      {productPrice - productPrice * (productDisc / 100)}
                    </div>
                    <div>
                      You Save: ₹{productPrice * (productDisc / 100)} (
                      {productDisc}%)
                    </div>
                  </ListGroup.Item>
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
                        <strong>
                          ₹ {productPrice - productPrice * (productDisc / 100)}
                        </strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Status:</Col>
                      <Col>
                        {countInStock > 0 ? 'In Stock' : 'Out of Stock'}
                      </Col>
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
          <Row>
            <Col md={6}>
              <h2>REVIEWS</h2>
              {product.reviews.length === 0 && (
                <Message variant='info'>No Reviews</Message>
              )}
              <ListGroup variant='flush'>
                {product.reviews.map((review) => (
                  // <ListGroup.Item key={review._id}>
                  //   <strong>{review.name}</strong>
                  //   <Rating value={review.rating} />
                  //   <p>{review.createdAt.substring(0, 10)}</p>
                  //   <p>{review.comment}</p>
                  // </ListGroup.Item>
                  <ToastContainer>
                    <Toast className='mb-3'>
                      <Toast.Header closeButton={false}>
                        <i className='fas fa-user' />
                        <strong className='me-auto mx-1'> {review.name}</strong>
                        <small>{review.createdAt.substring(0, 10)}</small>
                      </Toast.Header>
                      <Toast.Body>
                        <Rating value={review.rating} />
                        {review.comment}
                      </Toast.Body>
                    </Toast>
                  </ToastContainer>
                ))}
                <ListGroup.Item>
                  <h2>WRITE A CUSTOMER REVIEW</h2>
                  {errorProductReview && (
                    <Message variant='danger'>{errorProductReview}</Message>
                  )}
                  {userInfo ? (
                    <Form onSubmit={submitHandler}>
                      <Form.Group controlId='rating'>
                        <div className={classes.root}>
                          <OverlayTrigger
                            container={target.current}
                            show={show}
                            placement='right'
                            overlay={renderTooltip}
                          >
                            <MaterialRating
                              name='hover-feedback'
                              value={rating}
                              precision={0.5}
                              onChange={(event, newValue) => {
                                setRating(newValue);
                                setShow(false);
                              }}
                              onChangeActive={(event, newHover) => {
                                setHover(newHover);
                                setShow(false);
                              }}
                            />
                          </OverlayTrigger>
                          {rating !== null && (
                            <Box ml={2}>
                              {labels[hover !== -1 ? hover : rating]}
                            </Box>
                          )}
                        </div>
                      </Form.Group>
                      <Form.Group controlId='comment'>
                        <FloatingLabel
                          controlId='comment'
                          label='Comment'
                          className='mb-3'
                        >
                          <Form.Control
                            required
                            as='textarea'
                            style={{ height: '80px' }}
                            type='text'
                            placeholder='Comment'
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          ></Form.Control>
                        </FloatingLabel>
                      </Form.Group>
                      <Button type='submit' variant='dark'>
                        SUBMIT
                      </Button>
                    </Form>
                  ) : (
                    <Message>
                      Please <Link to='/login'>SIGN IN</Link> to write a review
                    </Message>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default ProductDescriptionScreen;
