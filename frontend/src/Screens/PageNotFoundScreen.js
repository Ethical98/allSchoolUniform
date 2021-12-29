import React from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/Meta';
import { Container } from 'react-bootstrap';
import './css/PageNotFoundScreen.css';

const PageNotFoundScreen = () => {
  return (
    <Container className='not-found-container'>
      <Meta
        title={`404 - Allschooluniform`}
        description={'Page Not Foun!!'}
        keyword={
          'pagenotfound,404,cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,order,details'
        }
      />
      <h1 className='not-found-heading'>404</h1>
      <p className='not-found-content'>
        We're sorry but the page you requested could not found.
      </p>
      <Link to='/' className='btn btn-outline-dark my-3'>
        Go Back to Home
      </Link>
    </Container>
  );
};

export default PageNotFoundScreen;
