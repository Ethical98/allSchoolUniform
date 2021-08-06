import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import './css/SearchBox.css';

const SearchBox = ({ history }) => {
  const [keyword, setKeyword] = useState('');

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      history.push(`/products?search=${keyword}`);
    } else {
      history.push('/products');
    }
  };

  return (
    <Form onSubmit={submitHandler} className='search-box'>
      <InputGroup>
        <Form.Control
          type='text'
          name='q'
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='Search Products'
        ></Form.Control>
        <Button type='submit' variant='outline-success' className='p-2'>
          <i className='fas fa-search'></i>
        </Button>
      </InputGroup>
    </Form>
  );
};

export default SearchBox;
