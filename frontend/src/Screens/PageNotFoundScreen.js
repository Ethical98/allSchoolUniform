import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/Meta';
import { Container, Form } from 'react-bootstrap';
import { Typeahead, AsyncTypeahead } from 'react-bootstrap-typeahead';
import './css/PageNotFoundScreen.css';

const PageNotFoundScreen = ({ history }) => {
  const [singleSelections, setSingleSelections] = useState([]);
  const handleChange = (value) => {
    console.log(value);
    setSingleSelections(value);
    history.push('/admin/dashboard');
    console.log(singleSelections);
  };
  // const handleSearch = () => {
  //   console.log(singleSelections);
  // };

  const options = ['one', 'two', 'three'];
  return (
    <Container className='not-found-container'>
      <Meta
        title={`404 - Allschooluniform`}
        description={'Page Not Found!!'}
        keyword={
          'pagenotfound,404,cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,order,details'
        }
      />
      <h1 className='not-found-heading'>404</h1>
      <p className='not-found-content'>
        We're sorry but the page you requested could not found.
      </p>
      <Form.Group>
        <Typeahead
          id='basic-typeahead-single'
          labelKey='name'
          onChange={(value) => handleChange(value)}
          options={options}
          placeholder='Choose a state...'
          selected={singleSelections}
          // onSearch={handleSearch}
          // renderMenuItemChildren={(option, props) => (
          //   <Link to={'/admin/dashboard'}>
          //     <span>{option}</span>
          //   </Link>
          // )}
        />
      </Form.Group>
      {/* <Link to='/' className='btn btn-outline-dark my-3'>
        Go Back to Home
      </Link> */}
    </Container>
  );
};

export default PageNotFoundScreen;
