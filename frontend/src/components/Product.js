import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Tabs,
  Tab,
  Image,
} from 'react-bootstrap';
import Rating from './Rating';
import { addToCart } from '../actions/cartActions';
import './css/Product.css';
import { getTypeImages } from '../actions/typeActions';
import Loader from './Loader';
import DialogBox from './DialogBox';

const Product = ({ product }) => {
  const [index, setIndex] = useState(0);
  const [productPrice, setProductPrice] = useState(product.size[0].price);
  const [countInStock, setCountInStock] = useState(
    product.size[0].countInStock
  );
  const [productDisc, setProductDisc] = useState(product.size[0].discount);

  const typeImages = useSelector((state) => state.typeImages);
  const { loading, images } = typeImages;

  const dispatch = useDispatch();
  const id = product._id;

  const [qty, setQty] = useState(1);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = (type) => {
    dispatch(getTypeImages(type));
    setShow(true);
  };

  const handleChange = (val) => {
    setIndex(product.size.findIndex((x) => x.size === val));
  };

  useEffect(() => {
    setProductPrice(product.size[index].price);
    setCountInStock(product.size[index].countInStock);
    setProductDisc(product.size[index].discount);
    // eslint-disable-next-line
  }, [index]);

  const addToCartHandler = (id, qty) => {
    dispatch(addToCart(id, index, qty));
  };
  const CloseButton = () => (
    <Button variant='secondary' onClick={handleClose}>
      Close
    </Button>
  );

  return (
    <div>
      <DialogBox
        show={show}
        handleClose={handleClose}
        title={'Size Guide'}
        footer={<CloseButton />}
      >
        {loading ? (
          <Loader />
        ) : (
          <Tabs
            defaultActiveKey='image'
            id='uncontrolled-tab-example'
            className='mb-3'
          >
            <Tab eventKey='image' title='Image'>
              <Image src={images.image} style={{ width: '20vw' }} alt='image' />
            </Tab>
            <Tab eventKey='sizeGuide' title='Size Guide'>
              <Image
                src={images.sizeGuide}
                style={{ width: '20vw' }}
                alt='Size Guide'
              />
            </Tab>
            <Tab
              eventKey='sizeChart'
              title='Size Chart'
              style={{ width: '20vw' }}
              alt='Size Chart'
            >
              <Image src={images.sizeChart} />
            </Tab>
          </Tabs>
        )}
      </DialogBox>
      {/* <Modal
        show={show}
        onHide={handleClose}
        backdrop='static'
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Size Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <Loader />
          ) : (
            <Tabs
              defaultActiveKey='image'
              id='uncontrolled-tab-example'
              className='mb-3'
            >
              <Tab eventKey='image' title='Image'>
                <Image
                  src={images.image}
                  style={{ width: '20vw' }}
                  alt='image'
                />
              </Tab>
              <Tab eventKey='sizeGuide' title='Size Guide'>
                <Image
                  src={images.sizeGuide}
                  style={{ width: '20vw' }}
                  alt='Size Guide'
                />
              </Tab>
              <Tab
                eventKey='sizeChart'
                title='Size Chart'
                style={{ width: '20vw' }}
                alt='Size Chart'
              >
                <Image src={images.sizeChart} />
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal> */}

      <Card className='my-3  rounded text-center' bg='white'>
        <Link to={`/products/${product.name}`}>
          <Card.Img
            src={product.image}
            variant='top'
            style={{ height: '200px', width: '160px', objectFit: 'contain' }}
          />
        </Link>
        <Card.Body style={{ padding: '0.2rem' }}>
          <Link
            to={`/products/${product.name}`}
            style={{ textDecoration: 'none' }}
          >
            <Card.Title as='h6'>
              <strong>{product.name}</strong>
            </Card.Title>
          </Link>

          <Card.Text className='text-center' as='h6'>
            ₹{' '}
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
          </Card.Text>

          <Card className='sizeCard' bg='white' style={{ padding: '2%' }}>
            <Card.Text className='text-center size-text'>
              Choose Your Size
            </Card.Text>

            <Row className='g-1'>
              <Col xs>
                <Form.Select
                  size='sm'
                  onChange={(e) => {
                    handleChange(e.target.value);
                  }}
                >
                  {product.size
                    .sort((a, b) => {
                      return a.size - b.size;
                    })
                    .map((x) => (
                      <option key={x._id} value={x.size}>
                        {x.size}
                      </option>
                    ))}
                </Form.Select>
              </Col>
              {countInStock > 0 && (
                <Col xs>
                  <Form.Select
                    size='sm'
                    onChange={(e) => setQty(Number(e.target.value))}
                  >
                    {[...Array(countInStock).keys()].map((x) => (
                      <option key={x + 1} value={x + 1}>
                        {x + 1}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              )}
              <Col xs>
                <Button
                  onClick={() => handleShow(product.type)}
                  variant='outline-info'
                  className='sgButton col-12'
                  size='sm'
                >
                  Size Guide
                </Button>
              </Col>
            </Row>
          </Card>

          <div className='mb-3'>
            <Rating
              value={product.rating}
              text={`${product.numReviews} reviews`}
            />
          </div>

          <Button
            variant='dark'
            size='sm'
            disabled={countInStock === 0}
            className='mb-3'
            onClick={() => addToCartHandler(id, qty)}
          >
            Add To Cart
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Product;
