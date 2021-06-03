import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import Product from '../components/Product';
import { ListProducts } from '../actions/productActions';
import { logout } from '../actions/userActions';
import jsonwebtoken from 'jsonwebtoken';
import { correctCartItemDetails } from '../actions/cartActions';

const ProductScreen = ({ history }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const dispatch = useDispatch();

  const productList = useSelector((state) => state.productList);
  const { loading, error, products } = productList;

  const cart = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(correctCartItemDetails());
  }, [dispatch]);

  useEffect(() => {
    dispatch(ListProducts());
  }, [dispatch]);

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

  return (
    <>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : cart.error ? (
        <Message variant='danger'>Please Login Again!!</Message>
      ) : (
        <Row>
          {products.map((product) => (
            <Col sm={12} md={6} lg={4} xl={4} key={product._id}>
              <Product product={product} />
            </Col>
          ))}
        </Row>
      )}
    </>
  );
};

export default ProductScreen;
