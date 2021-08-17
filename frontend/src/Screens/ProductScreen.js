import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import Product from '../components/Product';
import { listProducts } from '../actions/productActions';
import { logout } from '../actions/userActions';
import Paginate from '../components/Paginate';
import jsonwebtoken from 'jsonwebtoken';
import Meta from '../components/Meta';
import { Link } from 'react-router-dom';

const ProductScreen = ({ history, location, match }) => {
  const school = match.params.selectedschool;
  console.log(school);

  const urlSearchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const category = params.category ? params.category : '';
  const season = params.season ? params.season : '';
  const standard = params.class ? params.class.split(',').join('|') : '';
  const pageNumber = params.page ? params.page : 1;
  const keyword = params.search ? params.search : '';

  const productList = useSelector((state) => state.productList);
  const { loading, error, products, pages, page } = productList;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      listProducts(keyword, pageNumber, category, season, standard, school)
    );
  }, [dispatch, keyword, pageNumber, category, season, standard, school]);

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
      {keyword && (
        <Link to='/' className='btn btn-light'>
          Go Back
        </Link>
      )}
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <Meta title={'Products'} />
          <Row>
            {products.map((product, index) => (
              <Col sm={12} md={6} lg={4} xl={4} key={index}>
                <Product product={product} />
              </Col>
            ))}
          </Row>
          <Paginate
            pages={pages}
            page={page}
            keyword={keyword ? keyword : ''}
            category={category ? category : ''}
            season={season ? season : ''}
            standard={standard ? standard : ''}
          />
        </>
      )}
    </>
  );
};

export default ProductScreen;
