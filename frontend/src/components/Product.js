import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, Form, Button } from 'react-bootstrap';
import Rating from './Rating';
import { addToCart } from '../actions/cartActions';

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
    console.log(index);
    setProductPrice(product.size[index].price);
    setCountInStock(product.size[index].countInStock);
    // eslint-disable-next-line
  }, [index]);

  const addToCartHandler = (id, qty) => {
    dispatch(addToCart(id, index, qty));
  };

  return (
    <div>
      <Card
        className='my-3 p-1 rounded text-center'
        style={{ height: '80vh' }}
        bg='white'
      >
        <Link to={`/products/${product._id}`}>
          <Card.Img
            src={product.image}
            variant='top'
            style={{ height: '40vh' }}
          />
        </Link>
        <Card.Body style={{ padding: '0.2rem' }}>
          <Link to={`/products/${product._id}`}>
            <Card.Title as='div'>
              <strong style={{ fontSize: '0.9rem' }}>{product.name}</strong>
            </Card.Title>
          </Link>

          <Card.Text className='text-center' as='h6'>
            ₹{productPrice}
          </Card.Text>

          <Card
            className='sizeCard px-1'
            bg='white'
            style={{ minHeight: '16vh' }}
          >
            <Card.Text className='text-center'>Choose Your Size</Card.Text>

            <Form inline>
              <Form.Control
                as='select'
                size='sm'
                className='mx-1'
                style={{ border: '1px solid lightGrey', width: '5vw' }}
                onChange={(e) => {
                  handleChange(e.target.value);
                }}
              >
                <option>Size</option>
                {product.size.map((x) => {
                  return (
                    <option key={x._id} value={x.size}>
                      {x.size}
                    </option>
                  );
                })}
              </Form.Control>

              <Form.Control
                as='select'
                size='sm'
                className='mx-1'
                style={{ border: '1px solid lightGrey', width: '5vw' }}
                onChange={(e) => setQty(Number(e.target.value))}
              >
                <option>QTY</option>
                {[...Array(countInStock).keys()].map((x) => (
                  <option key={x + 1} value={x + 1}>
                    {x + 1}
                  </option>
                ))}
              </Form.Control>

              <Button size='sm' className='mx-1'>
                Size Guide
              </Button>
            </Form>
          </Card>

          <Card.Text as='div'>
            <Rating
              value={product.rating}
              text={`${product.numReviews} reviews`}
            />
          </Card.Text>
          <Button
            size='sm'
            className='text-center mt-3'
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
