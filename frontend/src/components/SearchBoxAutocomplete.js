import React, { useRef, useEffect, useState } from 'react';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import { listSchoolNames, listSchools } from '../actions/schoolActions';
import { useDispatch, useSelector } from 'react-redux';
import { Col, Row, Nav } from 'react-bootstrap';
import './css/SearchBoxAutocomplete.css';

const SearchBoxAutocomplete = ({ history }) => {
  const dispatch = useDispatch();

  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');

  const schoolNameList = useSelector((state) => state.schoolNameList);
  const { schoolNames } = schoolNameList;

  useEffect(() => {
    if (!(schoolNames && schoolNames.length > 0)) {
      dispatch(listSchoolNames());
    } else {
      setSchools([
        ...schoolNames.map((x, index) => ({ id: index, name: x.name })),
      ]);
    }
  }, [dispatch, schoolNames]);

  useEffect(() => {
    if (selectedSchool) {
      history.push(`/products/schools/${selectedSchool}`);
    }
  }, [selectedSchool]);

  const handleOnSearch = (string, results) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.

    console.log(string, results);
  };

  const handleOnHover = (result) => {
    // the item hovered
    // console.log(result);
  };

  const handleOnSelect = (item) => {
    // the item selected
    console.log(item);
    setSelectedSchool(item.name);
  };

  const handleOnFocus = () => {
    console.log('Focused');
  };

  const formatResult = (item) => {
    return item;
    // return (<p dangerouslySetInnerHTML={{__html: '<strong>'+item+'</strong>'}}></p>); //To format result as html
  };

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
            placeholder='Search'
            items={schools && schools}
            onSearch={handleOnSearch}
            onHover={handleOnHover}
            onSelect={handleOnSelect}
            onFocus={handleOnFocus}
            autoFocus
            formatResult={formatResult}
          />
        </Col>
      </Row>
    </div>
  );
};

export default SearchBoxAutocomplete;
