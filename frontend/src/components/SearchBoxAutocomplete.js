import React from 'react';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import { Col, Row } from 'react-bootstrap';
import './css/SearchBoxAutocomplete.css';

const SearchBoxAutocomplete = ({
  history,
  placeholder = '',
  items = [],
  handleOnFocus,
  handleOnHover,
  handleOnSearch,
  handleOnSelect,
  formatResult,
  onClear,
}) => {
  return (
    <div className='App mb-1 me-5'>
      <Row className='App-header'>
        <Col className='search-box-autocomplete'>
          <ReactSearchAutocomplete
            styling={{
              height: '34px',
              borderRadius: '4px',
              backgroundColor: 'white',
              fontSize: '12px',
              zIndex: 2,

              placeholderColor: 'black',
              clearIconMargin: '3px 8px 0 0',
            }}
            placeholder={placeholder}
            items={items}
            onSearch={handleOnSearch}
            onHover={handleOnHover}
            onSelect={handleOnSelect}
            onFocus={handleOnFocus}
            autoFocus
            formatResult={formatResult}
            onClear={onClear}
          />
        </Col>
      </Row>
    </div>
  );
};

export default SearchBoxAutocomplete;
