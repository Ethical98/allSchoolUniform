import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Modal,
  Tabs,
  Tab,
  Image,
  Offcanvas,
  ToggleButton,
} from 'react-bootstrap';
import Rating from './Rating';
import { addToCart } from '../actions/cartActions';
import './css/Product.css';
import { getTypeImages } from '../actions/typeActions';
import Loader from './Loader';

const Product = ({ product }) => {
  const [index, setIndex] = useState(0);
  const [productPrice, setProductPrice] = useState(product.size[0].price);
  const [countInStock, setCountInStock] = useState(
    product.size[0].countInStock
  );

  const typeImages = useSelector((state) => state.typeImages);
  const { loading, error, images } = typeImages;
  const [showOffCanvas, setShowOffCanvas] = useState(false);

  const handleOffCanvasClose = () => setShowOffCanvas(false);
  const handleOffCanvasShow = () => setShowOffCanvas(true);

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
    // eslint-disable-next-line
  }, [index]);

  const addToCartHandler = (id, qty) => {
    dispatch(addToCart(id, index, qty));
  };

  return (
    <div>
      <Offcanvas show={showOffCanvas} onHide={handleOffCanvasClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Offcanvas</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          Some text as placeholder. In real life you can have the elements you
          have chosen. Like, text, images, lists, etc.
        </Offcanvas.Body>
      </Offcanvas>
      <Modal
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
      </Modal>

      <Card className='my-3  rounded text-center' bg='white'>
        <Link to={`/products/${product.name}`}>
          <Card.Img
            src={product.image}
            variant='top'
            style={{ height: '40vh' }}
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
            ₹{productPrice}
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
                    .map((x) => {
                      return (
                        <option key={x._id} value={x.size}>
                          {x.size}
                        </option>
                      );
                    })}
                </Form.Select>
              </Col>
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
