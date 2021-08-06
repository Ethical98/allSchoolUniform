import React, { useState, useEffect } from 'react';
import { Card, Form, ListGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { listClasses } from '../actions/classActions';

const Accordion = ({ history, location, match }) => {
  const dispatch = useDispatch();

  const classList = useSelector((state) => state.classList);
  const { masterClasses } = classList;

  const urlSearchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  const [pageNumber, setPageNumber] = useState(params.pageNumber || 1);

  useEffect(() => {
    dispatch(listClasses());
  }, [dispatch]);

  const [category, setCategory] = useState(
    params.category ? params.category : ''
  );

  const [season, setSeason] = useState(params.season ? params.season : '');
  const [standard, setStandard] = useState(
    params.class ? params.class.split(',') : []
  );

  useEffect(() => {
    if (category && season && standard.length > 0) {
      if (!pageNumber) {
        history.push(
          `/products?season=${season}&category=${category}&class=${standard}`
        );
      }
    } else if (category && season) {
      if (!pageNumber) {
        history.push(`/products?season=${season}&category=${category}`);
      }
    } else if (category && standard.length > 0) {
      if (!pageNumber) {
        history.push(`/products?category=${category}&class=${standard}`);
      }
    } else if (season && standard.length > 0) {
      if (!pageNumber) {
        history.push(`/products?season=${season}&class=${standard}`);
      }
    } else if (season) {
      if (!pageNumber) {
        history.push(`/products?season=${season}`);
      }
    } else if (category) {
      if (!pageNumber) {
        history.push(`/products?category=${category}`);
      }
    } else if (standard.length > 0) {
      if (!pageNumber) {
        history.push(`/products?class=${standard}`);
      }
    }
  }, [category, season, dispatch, standard, pageNumber]);

  const seasonChange = (x, checked) => {
    setPageNumber('');
    if (checked) {
      setSeason(x);
    } else {
      setSeason('');
    }
  };
  const categoryChange = (x, checked) => {
    setPageNumber('');
    if (checked) {
      setCategory(x);
    } else {
      setCategory('');
    }
  };
  const standardChange = (x, checked) => {
    setPageNumber('');
    if (checked) {
      setStandard([...standard, x]);
    } else {
      const index = standard.indexOf(x);
      const newClass = [...standard];
      newClass.splice(index, 1);
      setStandard(newClass);
      if (standard.length === 0) {
        setStandard('');
      }
    }
    console.log(standard);
  };

  return (
    <div className='.d-none .d-md-block'>
      <Card id='Acc' className='d-sm-none d-md-block'>
        <Card.Header className='text-center'>
          Buy Uniform in 3 Easy Steps
        </Card.Header>
        <div>
          <Form className='m-3'>
            <Form.Control as='select'>
              <option value=''>Select State</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </Form.Control>
          </Form>
          <Form className='m-3'>
            <Form.Control as='select'>
              <option value=''>Select City</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </Form.Control>
          </Form>
          <Form className='m-3'>
            <Form.Control as='select'>
              <option value=''>Select School</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </Form.Control>
          </Form>
        </div>
        <Card.Header
          data-bs-toggle='collapse'
          href='#ProductCategory'
          role='button'
          aria-expanded='true'
          aria-controls='ProductCategory'
        >
          Product Category
          <i className='fas fa-arrow-circle-down float-end'></i>
          <i className='fas fa-arrow-circle-right float-end'></i>
        </Card.Header>
        <div id='ProductCategory' className='collapse show'>
          <Form className='m-3'>
            <Form.Check
              checked={category === 'Boys'}
              name='Category'
              type='radio'
              value='Boys'
              label='Boys'
              onChange={(event) =>
                categoryChange(event.target.value, event.target.checked)
              }
            ></Form.Check>
            <Form.Check
              checked={category === 'Girls'}
              name='Category'
              type='radio'
              value='Girls'
              label='Girls'
              onChange={(event) =>
                categoryChange(event.target.value, event.target.checked)
              }
            ></Form.Check>
          </Form>
        </div>
        <Card.Header
          data-bs-toggle='collapse'
          href='#SeasonalClothing'
          role='button'
          aria-expanded='true'
          aria-controls='SeasonalClothing'
        >
          Seasonal Clothing
          <i className='fas fa-arrow-circle-down float-end'></i>
          <i className='fas fa-arrow-circle-right float-end'></i>
        </Card.Header>
        <div id='SeasonalClothing' className='collapse show'>
          <Form className='m-3'>
            <Form.Check
              checked={season === 'Winter'}
              name='Seasonal'
              type='radio'
              value='Winter'
              label='Winter'
              onChange={(event) =>
                seasonChange(event.target.value, event.target.checked)
              }
            />
            <Form.Check
              checked={season === 'Summer'}
              name='Seasonal'
              type='radio'
              value='Summer'
              label='Summer'
              onChange={(event) =>
                seasonChange(event.target.value, event.target.checked)
              }
            />
          </Form>
        </div>
        <Card.Header
          data-bs-toggle='collapse'
          href='#Class'
          role='button'
          aria-expanded='true'
          aria-controls='Class'
        >
          Class
          <i className='fas fa-arrow-circle-down float-end'></i>
          <i className='fas fa-arrow-circle-right float-end'></i>
        </Card.Header>
        <div id='Class' className='collapse show'>
          <ListGroup>
            <ListGroup.Item style={{ border: 0 }}>
              {masterClasses &&
                masterClasses.map((x) => {
                  return (
                    <Form.Check
                      checked={standard.includes(x.class)}
                      key={x._id}
                      value={x.class}
                      type='checkbox'
                      label={x.class}
                      onChange={(e) =>
                        standardChange(x.class, e.target.checked)
                      }
                    />
                  );
                })}
            </ListGroup.Item>
          </ListGroup>
        </div>
      </Card>
    </div>
  );
};

export default Accordion;
