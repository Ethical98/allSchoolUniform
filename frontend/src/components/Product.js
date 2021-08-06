import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import Rating from './Rating';
import { addToCart } from '../actions/cartActions';

import './css/Product.css';

const Product = ({ product }) => {
  const [index, setIndex] = useState(0);
  const [productPrice, setProductPrice] = useState(product.size[0].price);
  const [countInStock, setCountInStock] = useState(
    product.size[0].countInStock
  );

  const dispatch = useDispatch();
  const id = product._id;

  const [qty, setQty] = useState(1);

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
            <Card.Text className='text-center'>Choose Your Size</Card.Text>

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
